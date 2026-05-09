import { describe, it, expect } from "vitest";
import { deriveMastery, deriveStatus, findLastUnaidedRecall } from "@/lib/srs/mastery";
import { INITIAL_SRS_STATE } from "@/db/schema";
import type { PracticeSession } from "@/db/schema";

const NOW = new Date("2026-01-15T00:00:00Z");

describe("deriveMastery", () => {
  it("is 0 for a fresh verse", () => {
    expect(deriveMastery(INITIAL_SRS_STATE)).toBe(0);
  });
  it("approaches 1 for a well-spaced verse", () => {
    const m = deriveMastery({ ...INITIAL_SRS_STATE, repetitions: 8, interval: 60 });
    expect(m).toBe(1);
  });
});

describe("deriveStatus", () => {
  it("returns new for repetitions === 0", () => {
    expect(
      deriveStatus({
        srs: INITIAL_SRS_STATE,
        lastUnaidedRecall: null,
        now: NOW,
      }),
    ).toBe("new");
  });

  it("returns learning for low mastery", () => {
    expect(
      deriveStatus({
        srs: { ...INITIAL_SRS_STATE, repetitions: 1, interval: 1 },
        lastUnaidedRecall: null,
        now: NOW,
      }),
    ).toBe("learning");
  });

  it("requires the unaided recall guard to graduate", () => {
    const srs = { ...INITIAL_SRS_STATE, repetitions: 6, interval: 30 };
    expect(
      deriveStatus({ srs, lastUnaidedRecall: null, now: NOW }),
    ).toBe("learning");

    const recent = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000);
    expect(
      deriveStatus({
        srs,
        lastUnaidedRecall: { startedAt: recent, quality: 4, wasFullVerse: true },
        now: NOW,
      }),
    ).toBe("mastered");

    const stale = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000);
    expect(
      deriveStatus({
        srs,
        lastUnaidedRecall: { startedAt: stale, quality: 4, wasFullVerse: true },
        now: NOW,
      }),
    ).toBe("learning");
  });

  it("rejects quality < 4 from satisfying the guard", () => {
    const srs = { ...INITIAL_SRS_STATE, repetitions: 6, interval: 30 };
    const recent = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000);
    expect(
      deriveStatus({
        srs,
        lastUnaidedRecall: { startedAt: recent, quality: 3, wasFullVerse: true },
        now: NOW,
      }),
    ).toBe("learning");
  });

  it("rejects a chunk-only pass from satisfying the guard (§15.7)", () => {
    const srs = { ...INITIAL_SRS_STATE, repetitions: 6, interval: 30 };
    const recent = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000);
    expect(
      deriveStatus({
        srs,
        lastUnaidedRecall: { startedAt: recent, quality: 5, wasFullVerse: false },
        now: NOW,
      }),
    ).toBe("learning");
  });
});

describe("findLastUnaidedRecall", () => {
  function row(over: Partial<PracticeSession>): PracticeSession {
    return {
      id: "x",
      userId: "u",
      verseId: "v",
      mode: "classic",
      classification: "recall",
      quality: 4,
      outcome: "correct",
      durationMs: 0,
      usedHint: false,
      wasFullVerse: true,
      startedAt: NOW,
      ...over,
    } as PracticeSession;
  }

  it("returns null when no row qualifies", () => {
    expect(findLastUnaidedRecall([])).toBeNull();
    expect(
      findLastUnaidedRecall([row({ usedHint: true })]),
    ).toBeNull();
    expect(
      findLastUnaidedRecall([row({ mode: "scramble" })]),
    ).toBeNull();
    expect(
      findLastUnaidedRecall([row({ quality: 2 })]),
    ).toBeNull();
    expect(
      findLastUnaidedRecall([row({ wasFullVerse: false })]),
    ).toBeNull();
  });

  it("picks the most recent qualifying row", () => {
    const older = row({ startedAt: new Date(NOW.getTime() - 60_000) });
    const newer = row({ startedAt: NOW, quality: 5 });
    const result = findLastUnaidedRecall([older, newer]);
    expect(result?.startedAt).toEqual(NOW);
    expect(result?.quality).toBe(5);
  });
});
