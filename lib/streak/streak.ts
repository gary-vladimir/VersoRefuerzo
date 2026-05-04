// Daily streak (specs.md §6.6).
//
// Streak rolls over at midnight in the user's timezone. Completing any
// practice session — Classic, First-letter, Typed, Scramble, Match, Gap —
// counts. A "day" is a calendar date in the user's tz; UTC dates are not
// used because a user in Asia would otherwise see their streak reset
// mid-evening.
//
// Logic:
//   - Same tz-day as `lastStreakAt`: no change.
//   - One tz-day after `lastStreakAt`: current += 1, best = max(best, current).
//   - Two or more tz-days after: streak resets to 1 (today).
//   - First ever session (lastStreakAt = null): current = 1, best = 1.
//
// The user's timezone is captured at sign-in (lib/auth/session.ts) and
// stored as an IANA string. If it's missing we fall back to UTC.

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export type StreakState = {
  currentStreak: number;
  bestStreak: number;
  // Stored as a Postgres `date` — no time component. We pass it in as the
  // Date Drizzle returns for date columns OR the ISO string we'd insert.
  lastStreakAt: string | null;
};

export type StreakInputs = {
  state: StreakState;
  tz: string | null;
  now?: Date;
};

export function applyPracticeForStreak({
  state,
  tz,
  now = new Date(),
}: StreakInputs): StreakState {
  const zone = tz?.trim() ? tz : "UTC";
  const today = dayjs(now).tz(zone).format("YYYY-MM-DD");

  if (!state.lastStreakAt) {
    return {
      currentStreak: 1,
      bestStreak: Math.max(state.bestStreak, 1),
      lastStreakAt: today,
    };
  }

  const last = dayjs.tz(state.lastStreakAt, zone).format("YYYY-MM-DD");
  if (last === today) return state;

  const yesterday = dayjs(now).tz(zone).subtract(1, "day").format("YYYY-MM-DD");
  if (last === yesterday) {
    const next = state.currentStreak + 1;
    return {
      currentStreak: next,
      bestStreak: Math.max(state.bestStreak, next),
      lastStreakAt: today,
    };
  }

  // Gap of 2+ days — start over.
  return {
    currentStreak: 1,
    bestStreak: Math.max(state.bestStreak, 1),
    lastStreakAt: today,
  };
}
