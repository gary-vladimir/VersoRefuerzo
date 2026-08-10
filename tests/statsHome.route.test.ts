// Route-level tests for GET /api/stats/home.
//
// The Home hero count has to agree with what a practice session would
// actually serve, so this covers the two rules that decide it: the
// end-of-day cutoff in the user's timezone, and the §15.4 suppression of
// verses already practiced today.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { FakeDb } from "./helpers/fakeDb";
import { INITIAL_SRS_STATE } from "@/db/schema";

let currentUser: Record<string, unknown> | null = null;
let db: FakeDb;

vi.mock("@/lib/auth/session", () => ({
  getServerUser: () => Promise.resolve(currentUser),
}));

vi.mock("@/db/client", () => ({
  getDb: () => db,
}));

const { GET } = await import("@/app/api/stats/home/route");

type Row = {
  status: string;
  srsState: typeof INITIAL_SRS_STATE;
  lastPracticedAt: Date | null;
};

function row(
  status: string,
  dueAt: string,
  lastPracticedAt: Date | null = null,
): Row {
  return { status, srsState: { ...INITIAL_SRS_STATE, dueAt }, lastPracticedAt };
}

function makeUser(over: Record<string, unknown> = {}) {
  return {
    id: "u1",
    timezone: "Pacific/Honolulu",
    currentStreak: 0,
    bestStreak: 0,
    lastStreakAt: null,
    ...over,
  };
}

async function stats(rows: Row[]) {
  db = new FakeDb([rows, [{ value: rows.length }]]);
  const res = await GET();
  return (await res.json()) as {
    totalVerses: number;
    mastered: number;
    learning: number;
    dueToday: number;
    currentStreak: number;
    bestStreak: number;
  };
}

beforeEach(() => {
  currentUser = makeUser();
  vi.useRealTimers();
});

describe("GET /api/stats/home", () => {
  it("401s without a session", async () => {
    currentUser = null;
    db = new FakeDb([]);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("counts mastered and learning separately", async () => {
    const past = new Date(0).toISOString();
    const body = await stats([
      row("mastered", past),
      row("mastered", past),
      row("learning", past),
      row("new", past),
    ]);
    expect(body.totalVerses).toBe(4);
    expect(body.mastered).toBe(2);
    expect(body.learning).toBe(1);
  });

  it("counts an overdue verse as due", async () => {
    const body = await stats([row("learning", new Date(0).toISOString())]);
    expect(body.dueToday).toBe(1);
  });

  it("excludes a verse scheduled beyond today", async () => {
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
    const body = await stats([row("learning", nextWeek)]);
    expect(body.dueToday).toBe(0);
  });

  // Regression for the UTC cutoff: at 10:00 in Honolulu, a verse due at
  // 20:00 local is 06:00 UTC *tomorrow*. It must still count as due today.
  it("includes a verse due later tonight in the user's timezone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T20:00:00Z")); // 10:00 Jan 15 Honolulu
    const body = await stats([row("learning", "2026-01-16T06:00:00Z")]);
    expect(body.dueToday).toBe(1);
    vi.useRealTimers();
  });

  it("suppresses a verse already practiced today", async () => {
    const body = await stats([
      row("learning", new Date(0).toISOString(), new Date()),
    ]);
    expect(body.dueToday).toBe(0);
  });

  it("reports zero for a streak whose last practice is stale", async () => {
    currentUser = makeUser({
      currentStreak: 9,
      bestStreak: 12,
      lastStreakAt: "2020-01-01",
    });
    const body = await stats([]);
    expect(body.currentStreak).toBe(0);
    // The personal best is never derived away.
    expect(body.bestStreak).toBe(12);
  });
});
