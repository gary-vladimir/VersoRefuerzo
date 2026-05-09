import { describe, it, expect } from "vitest";
import { applyPracticeForStreak, deriveEffectiveStreak } from "@/lib/streak/streak";

describe("applyPracticeForStreak", () => {
  it("sets to 1 on first ever practice", () => {
    const next = applyPracticeForStreak({
      state: { currentStreak: 0, bestStreak: 0, lastStreakAt: null },
      tz: "America/Mexico_City",
      now: new Date("2026-01-15T18:00:00Z"),
    });
    expect(next.currentStreak).toBe(1);
    expect(next.bestStreak).toBe(1);
    expect(next.lastStreakAt).toBe("2026-01-15");
  });

  it("does not double-count multiple sessions on the same tz day", () => {
    const morning = applyPracticeForStreak({
      state: { currentStreak: 4, bestStreak: 4, lastStreakAt: "2026-01-15" },
      tz: "America/Mexico_City",
      now: new Date("2026-01-15T15:00:00Z"),
    });
    expect(morning.currentStreak).toBe(4);
  });

  it("extends to current+1 the next day", () => {
    const next = applyPracticeForStreak({
      state: { currentStreak: 7, bestStreak: 7, lastStreakAt: "2026-01-14" },
      tz: "America/Mexico_City",
      now: new Date("2026-01-15T15:00:00Z"),
    });
    expect(next.currentStreak).toBe(8);
    expect(next.bestStreak).toBe(8);
    expect(next.lastStreakAt).toBe("2026-01-15");
  });

  it("resets after a missed day but preserves bestStreak", () => {
    const next = applyPracticeForStreak({
      state: { currentStreak: 12, bestStreak: 30, lastStreakAt: "2026-01-10" },
      tz: "America/Mexico_City",
      now: new Date("2026-01-15T15:00:00Z"),
    });
    expect(next.currentStreak).toBe(1);
    expect(next.bestStreak).toBe(30);
  });

  it("respects timezone — tz day that is still 'yesterday' in UTC", () => {
    // 02:00 UTC on Jan 16 is still 20:00 (= same day) in America/Mexico_City
    // when last practice was that morning.
    const next = applyPracticeForStreak({
      state: { currentStreak: 2, bestStreak: 2, lastStreakAt: "2026-01-15" },
      tz: "America/Mexico_City",
      now: new Date("2026-01-16T02:00:00Z"),
    });
    expect(next.currentStreak).toBe(2);
    expect(next.lastStreakAt).toBe("2026-01-15");
  });

  it("falls back to UTC when tz is null", () => {
    const next = applyPracticeForStreak({
      state: { currentStreak: 0, bestStreak: 0, lastStreakAt: null },
      tz: null,
      now: new Date("2026-01-15T18:00:00Z"),
    });
    expect(next.lastStreakAt).toBe("2026-01-15");
  });
});

describe("deriveEffectiveStreak", () => {
  it("is 0 when nothing has been practiced", () => {
    expect(
      deriveEffectiveStreak({
        state: { currentStreak: 0, bestStreak: 0, lastStreakAt: null },
        tz: "America/Mexico_City",
        now: new Date("2026-01-15T15:00:00Z"),
      }),
    ).toBe(0);
  });

  it("returns the stored streak when practice was today", () => {
    expect(
      deriveEffectiveStreak({
        state: { currentStreak: 7, bestStreak: 7, lastStreakAt: "2026-01-15" },
        tz: "America/Mexico_City",
        now: new Date("2026-01-15T15:00:00Z"),
      }),
    ).toBe(7);
  });

  it("returns the stored streak when practice was yesterday (still alive)", () => {
    expect(
      deriveEffectiveStreak({
        state: { currentStreak: 7, bestStreak: 7, lastStreakAt: "2026-01-14" },
        tz: "America/Mexico_City",
        now: new Date("2026-01-15T15:00:00Z"),
      }),
    ).toBe(7);
  });

  it("returns 0 when a day has been missed", () => {
    expect(
      deriveEffectiveStreak({
        state: { currentStreak: 12, bestStreak: 30, lastStreakAt: "2026-01-13" },
        tz: "America/Mexico_City",
        now: new Date("2026-01-15T15:00:00Z"),
      }),
    ).toBe(0);
  });
});
