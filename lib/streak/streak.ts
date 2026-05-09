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

// Display-time streak. The persisted `currentStreak` only changes when the
// user practices again, so a user who misses a day and reloads Home before
// practicing would otherwise see yesterday's stale streak (M4 review #6).
// This helper returns 0 when the last practice is older than yesterday in
// the user's tz; the persisted value is left unchanged so the next session
// can still reset it from the original gap.
export function deriveEffectiveStreak({
  state,
  tz,
  now = new Date(),
}: StreakInputs): number {
  if (!state.lastStreakAt) return 0;
  const zone = tz?.trim() ? tz : "UTC";
  const today = dayjs(now).tz(zone).format("YYYY-MM-DD");
  const yesterday = dayjs(now).tz(zone).subtract(1, "day").format("YYYY-MM-DD");
  const last = dayjs.tz(state.lastStreakAt, zone).format("YYYY-MM-DD");
  if (last === today || last === yesterday) return state.currentStreak;
  return 0;
}

// Same-tz-day check used by the queue / stats / Home routes to suppress
// verses that have already been practiced today (specs.md §15.4 second
// clause: recognition modes should reset the due-today indicator). We
// compare in the user's own timezone so a verse practiced after midnight
// UTC but still "yesterday" locally doesn't get incorrectly hidden.
export function isSameTzDay(
  when: Date | string | null | undefined,
  tz: string | null,
  now: Date = new Date(),
): boolean {
  if (!when) return false;
  const zone = tz?.trim() ? tz : "UTC";
  const today = dayjs(now).tz(zone).format("YYYY-MM-DD");
  const day = dayjs(when).tz(zone).format("YYYY-MM-DD");
  return day === today;
}
