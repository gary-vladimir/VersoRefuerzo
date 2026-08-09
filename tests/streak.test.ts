import { describe, it, expect } from "vitest";
import {
  applyPracticeForStreak,
  deriveEffectiveStreak,
  endOfTzDay,
  isSameTzDay,
  localHour,
  localDayNumber,
} from "@/lib/streak/streak";

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

describe("isSameTzDay", () => {
  const now = new Date("2026-01-15T15:00:00Z");

  it("is false when when is null", () => {
    expect(isSameTzDay(null, "America/Mexico_City", now)).toBe(false);
    expect(isSameTzDay(undefined, "America/Mexico_City", now)).toBe(false);
  });

  it("is true for a timestamp earlier today in the user's tz", () => {
    expect(isSameTzDay(new Date("2026-01-15T14:00:00Z"), "America/Mexico_City", now)).toBe(true);
  });

  it("is false for yesterday in the user's tz", () => {
    expect(isSameTzDay(new Date("2026-01-14T14:00:00Z"), "America/Mexico_City", now)).toBe(false);
  });

  it("treats a UTC tomorrow as today when the user is several hours behind", () => {
    // 02:00 UTC on Jan 16 is still 20:00 (= same day) in America/Mexico_City
    expect(
      isSameTzDay(new Date("2026-01-16T02:00:00Z"), "America/Mexico_City", now),
    ).toBe(true);
  });
});

describe("localHour", () => {
  it("returns the hour in the user's tz", () => {
    // 18:00 UTC is 12:00 in America/Mexico_City (UTC-6).
    expect(localHour("America/Mexico_City", new Date("2026-01-15T18:00:00Z"))).toBe(12);
  });

  it("falls back to UTC when tz is null", () => {
    expect(localHour(null, new Date("2026-01-15T18:00:00Z"))).toBe(18);
  });
});

describe("localDayNumber", () => {
  const tz = "America/Mexico_City";

  it("is stable across different times on the same local day", () => {
    const morning = localDayNumber(tz, new Date("2026-01-15T15:00:00Z")); // 09:00 local
    const lateNight = localDayNumber(tz, new Date("2026-01-16T05:00:00Z")); // 23:00 local, still Jan 15
    expect(morning).toBe(lateNight);
  });

  it("increments by exactly 1 on the next local day", () => {
    const a = localDayNumber(tz, new Date("2026-01-15T15:00:00Z"));
    const b = localDayNumber(tz, new Date("2026-01-16T15:00:00Z"));
    expect(b - a).toBe(1);
  });

  it("rotates a daily pick to a new index each day", () => {
    const count = 5;
    const d0 = localDayNumber(tz, new Date("2026-01-15T15:00:00Z")) % count;
    const d1 = localDayNumber(tz, new Date("2026-01-16T15:00:00Z")) % count;
    expect(d0).not.toBe(d1);
  });
});

describe("endOfTzDay", () => {
  it("returns the user's local midnight, not UTC's", () => {
    const asked = new Date("2026-01-15T20:00:00Z");
    // Honolulu is UTC-10 year round: local Jan 15 ends at 09:59:59.999Z Jan 16.
    expect(new Date(endOfTzDay("Pacific/Honolulu", asked)).toISOString()).toBe(
      "2026-01-16T09:59:59.999Z",
    );
    // Auckland is UTC+13 in January: local Jan 16 ends at 10:59:59.999Z Jan 16.
    expect(new Date(endOfTzDay("Pacific/Auckland", asked)).toISOString()).toBe(
      "2026-01-16T10:59:59.999Z",
    );
  });

  it("falls back to UTC when the timezone is missing or blank", () => {
    const asked = new Date("2026-01-15T20:00:00Z");
    const expected = "2026-01-15T23:59:59.999Z";
    expect(new Date(endOfTzDay(null, asked)).toISOString()).toBe(expected);
    expect(new Date(endOfTzDay("  ", asked)).toISOString()).toBe(expected);
  });

  it("always lands after the instant it was asked about", () => {
    for (const tz of ["UTC", "America/Mexico_City", "Asia/Tokyo", "Pacific/Auckland"]) {
      const asked = new Date("2026-06-30T23:30:00Z");
      expect(endOfTzDay(tz, asked)).toBeGreaterThan(asked.getTime());
    }
  });
});
