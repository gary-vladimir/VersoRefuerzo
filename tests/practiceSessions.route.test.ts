// Route-level tests for POST /api/practice/sessions.
//
// This is the highest-consequence write path in the app: it grades the
// verse, decides recall vs recognition, re-derives mastery, and moves the
// streak. Auth and the database are mocked; every scheduling helper it calls
// (SM-2, chunking, cloze density, mastery, streak) runs for real, so these
// tests exercise the route's actual decisions rather than a paraphrase.

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextRequest } from "next/server";
import { FakeDb } from "./helpers/fakeDb";
import { INITIAL_SRS_STATE, type SrsState } from "@/db/schema";

const VERSE_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";
const TEXT = "Yo soy el camino y la verdad y la vida";

let currentUser: Record<string, unknown> | null = null;
let db: FakeDb;

vi.mock("@/lib/auth/session", () => ({
  getServerUser: () => Promise.resolve(currentUser),
}));

vi.mock("@/db/client", () => ({
  getDb: () => db,
}));

const { POST } = await import("@/app/api/practice/sessions/route");

function makeUser(over: Record<string, unknown> = {}) {
  return {
    id: USER_ID,
    timezone: "America/Mexico_City",
    currentStreak: 0,
    bestStreak: 0,
    lastStreakAt: null,
    ...over,
  };
}

function makeVerse(srsState: SrsState = INITIAL_SRS_STATE) {
  return {
    id: VERSE_ID,
    userId: USER_ID,
    canonicalRef: "JHN.14.6",
    version: "NBLA",
    srsState,
    mastery: 0,
    status: "new",
    deletedAt: null,
  };
}

// Queue the four/five results the route awaits, in order: verse lookup,
// cached text, recent sessions, the batch, then the optional streak write.
function primeDb(opts: {
  verse?: ReturnType<typeof makeVerse> | null;
  text?: string | null;
  recentSessions?: unknown[];
}) {
  const verse = opts.verse === undefined ? makeVerse() : opts.verse;
  const text = opts.text === undefined ? TEXT : opts.text;
  db = new FakeDb([
    verse ? [verse] : [],
    text === null ? [] : [{ text }],
    opts.recentSessions ?? [],
    [[], [{ ...verse, id: VERSE_ID }]],
    [],
  ]);
}

function post(body: unknown): Promise<Response> {
  return POST({ json: async () => body } as unknown as NextRequest);
}

function sessionRow(): Record<string, unknown> {
  const values = db.argsFor("values");
  return (values?.[0] ?? {}) as Record<string, unknown>;
}

function verseUpdate(): Record<string, unknown> {
  const set = db.argsFor("set");
  return (set?.[0] ?? {}) as Record<string, unknown>;
}

beforeEach(() => {
  currentUser = makeUser();
  primeDb({});
});

describe("POST /api/practice/sessions — guards", () => {
  it("401s without a session", async () => {
    currentUser = null;
    const res = await post({
      verseId: VERSE_ID,
      mode: "classic",
      outcome: "correct",
      durationMs: 1000,
    });
    expect(res.status).toBe(401);
  });

  it("400s on a body that fails validation", async () => {
    for (const body of [
      null,
      {},
      { verseId: "not-a-uuid", mode: "classic", outcome: "correct", durationMs: 0 },
      { verseId: VERSE_ID, mode: "telepathy", outcome: "correct", durationMs: 0 },
      { verseId: VERSE_ID, mode: "classic", outcome: "vibes", durationMs: 0 },
      { verseId: VERSE_ID, mode: "classic", outcome: "correct", durationMs: -1 },
      { verseId: VERSE_ID, mode: "classic", outcome: "correct", durationMs: 0, quality: 9 },
    ]) {
      primeDb({});
      const res = await post(body);
      expect(res.status).toBe(400);
    }
  });

  it("404s for a verse that is not the caller's", async () => {
    primeDb({ verse: null });
    const res = await post({
      verseId: VERSE_ID,
      mode: "classic",
      outcome: "correct",
      durationMs: 1000,
    });
    expect(res.status).toBe(404);
  });

  it("never writes anything when the verse is missing", async () => {
    primeDb({ verse: null });
    await post({
      verseId: VERSE_ID,
      mode: "classic",
      outcome: "correct",
      durationMs: 1000,
    });
    expect(db.calls.some((c) => c.method === "batch")).toBe(false);
    expect(db.calls.some((c) => c.method === "insert")).toBe(false);
  });
});

describe("POST /api/practice/sessions — recall modes", () => {
  it("400s a recall attempt that carries no grade", async () => {
    const res = await post({
      verseId: VERSE_ID,
      mode: "classic",
      outcome: "correct",
      durationMs: 1000,
    });
    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.method === "batch")).toBe(false);
  });

  it("grades with SM-2 and advances the due date", async () => {
    const res = await post({
      verseId: VERSE_ID,
      mode: "classic",
      quality: 4,
      outcome: "correct",
      durationMs: 4200,
    });
    expect(res.status).toBe(200);

    expect(sessionRow().classification).toBe("recall");
    expect(sessionRow().quality).toBe(4);
    expect(sessionRow().mode).toBe("classic");

    const next = verseUpdate().srsState as SrsState;
    // First successful pass: SM-2 schedules one day out.
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
    expect(new Date(next.dueAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("treats first_letter and typed as recall too", async () => {
    for (const mode of ["first_letter", "typed"]) {
      primeDb({});
      await post({
        verseId: VERSE_ID,
        mode,
        quality: 5,
        outcome: "correct",
        durationMs: 1000,
      });
      expect(sessionRow().classification).toBe("recall");
    }
  });

  it("pulls a failed verse back to today without losing exposure", async () => {
    const matured: SrsState = {
      ...INITIAL_SRS_STATE,
      interval: 10,
      repetitions: 4,
      easeFactor: 2.5,
    };
    primeDb({ verse: makeVerse(matured) });
    await post({
      verseId: VERSE_ID,
      mode: "classic",
      quality: 1,
      outcome: "incorrect",
      durationMs: 1000,
    });
    const next = verseUpdate().srsState as SrsState;
    expect(next.interval).toBe(0);
    expect(next.repetitions).toBe(4);
    expect(next.easeFactor).toBeLessThan(2.5);
  });

  it("writes the session row and the verse update in one batch", async () => {
    await post({
      verseId: VERSE_ID,
      mode: "classic",
      quality: 4,
      outcome: "correct",
      durationMs: 1000,
    });
    const batch = db.argsFor("batch");
    expect(Array.isArray(batch?.[0])).toBe(true);
    expect((batch?.[0] as unknown[]).length).toBe(2);
  });
});

describe("POST /api/practice/sessions — recognition modes", () => {
  it("does not advance the schedule for scramble or match", async () => {
    for (const mode of ["scramble", "match"]) {
      const matured: SrsState = {
        ...INITIAL_SRS_STATE,
        interval: 10,
        repetitions: 4,
        dueAt: "2026-02-01T00:00:00.000Z",
      };
      primeDb({ verse: makeVerse(matured) });
      await post({ verseId: VERSE_ID, mode, outcome: "correct", durationMs: 1000 });

      expect(sessionRow().classification).toBe("recognition");
      const next = verseUpdate().srsState as SrsState;
      expect(next.interval).toBe(10);
      expect(next.repetitions).toBe(4);
      expect(next.dueAt).toBe("2026-02-01T00:00:00.000Z");
      // Success still earns the small ease bump from §15.4.
      expect(next.easeFactor).toBeGreaterThan(matured.easeFactor);
    }
  });

  it("still stamps lastPracticedAt so the verse clears today's queue", async () => {
    await post({
      verseId: VERSE_ID,
      mode: "scramble",
      outcome: "correct",
      durationMs: 1000,
    });
    expect(verseUpdate().lastPracticedAt).toBeInstanceOf(Date);
  });
});

describe("POST /api/practice/sessions — Fill the Gap promotion", () => {
  it("counts as recognition while blank density is low", async () => {
    primeDb({ verse: makeVerse({ ...INITIAL_SRS_STATE, repetitions: 0 }) });
    await post({
      verseId: VERSE_ID,
      mode: "gap",
      quality: 5,
      outcome: "correct",
      durationMs: 1000,
    });
    expect(sessionRow().classification).toBe("recognition");
  });

  it("promotes to recall once density crosses 50%", async () => {
    primeDb({ verse: makeVerse({ ...INITIAL_SRS_STATE, repetitions: 10 }) });
    await post({
      verseId: VERSE_ID,
      mode: "gap",
      quality: 5,
      outcome: "correct",
      durationMs: 1000,
    });
    expect(sessionRow().classification).toBe("recall");
  });

  // The promotion is computed from the cached text server-side; with no
  // cached row there is nothing to measure, so it stays recognition.
  it("stays recognition when the verse text is not cached", async () => {
    primeDb({
      verse: makeVerse({ ...INITIAL_SRS_STATE, repetitions: 10 }),
      text: null,
    });
    await post({
      verseId: VERSE_ID,
      mode: "gap",
      quality: 5,
      outcome: "correct",
      durationMs: 1000,
    });
    expect(sessionRow().classification).toBe("recognition");
  });
});

describe("POST /api/practice/sessions — streak", () => {
  it("starts the streak on a first-ever session", async () => {
    const res = await post({
      verseId: VERSE_ID,
      mode: "classic",
      quality: 4,
      outcome: "correct",
      durationMs: 1000,
    });
    const body = (await res.json()) as { streak: { currentStreak: number } };
    expect(body.streak.currentStreak).toBe(1);
  });

  it("does not write the user row twice on the same day", async () => {
    // Already practiced today in the user's tz: applyPracticeForStreak is a
    // no-op, so the route should skip the follow-up update entirely.
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
    }).format(new Date());
    currentUser = makeUser({ currentStreak: 3, bestStreak: 5, lastStreakAt: today });
    primeDb({});

    await post({
      verseId: VERSE_ID,
      mode: "classic",
      quality: 4,
      outcome: "correct",
      durationMs: 1000,
    });

    // The only `update` recorded should be the verse update inside the batch.
    const updates = db.calls.filter((c) => c.method === "update");
    expect(updates).toHaveLength(1);
  });

  it("extends the streak the following day", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stamp = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
    }).format(yesterday);
    currentUser = makeUser({ currentStreak: 3, bestStreak: 5, lastStreakAt: stamp });
    primeDb({});

    const res = await post({
      verseId: VERSE_ID,
      mode: "classic",
      quality: 4,
      outcome: "correct",
      durationMs: 1000,
    });
    const body = (await res.json()) as {
      streak: { currentStreak: number; bestStreak: number };
    };
    expect(body.streak.currentStreak).toBe(4);
    expect(body.streak.bestStreak).toBe(5);
  });
});
