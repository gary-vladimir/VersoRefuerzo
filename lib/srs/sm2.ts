// SM-2 update (specs.md §6.4.1, §6.5).
//
// We follow the canonical SM-2 algorithm with two project-specific
// adaptations:
//
//   1. Quality grades come from a 4-button UI (`Otra vez` / `Difícil` /
//      `Bien` / `Fácil`), mapped to grades 1 / 3 / 4 / 5. Grade 0 ("blackout")
//      is reserved for the typed-recall path in M5; grade 2 is reserved for
//      the post-give-up "Otra vez" path inside Card View. The function still
//      accepts 0..5 so future entry points can call it cleanly.
//
//   2. Failure (grade < 3) does NOT reset `repetitions` to 0. We keep the
//      reps counter as a measure of cumulative exposure (used by the chunk
//      grow-out and progressive cloze ramps in §15.3 / §15.7), and pull the
//      verse to a 0-day interval so it shows up again today. Only the
//      `interval` and `easeFactor` shrink on failure.
//
// Recognition modes (`scramble`, `match`, low-density `gap` per §15.4) MUST
// NOT call this function — they apply their own small ease bump via
// `applyRecognitionTouch` so they cannot silently advance the schedule.

import type { SrsState } from "@/db/schema";

export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

// Pure SM-2 update for a recall-class attempt. Returns the next state.
// Does NOT advance `chunkStage` — that lives in the chunk module so the
// chunking policy can evolve without re-rolling the SRS engine.
export function applyRecallGrade(
  prev: SrsState,
  quality: Quality,
  now: Date = new Date(),
): SrsState {
  const passed = quality >= 3;

  // Ease delta is the SM-2 textbook formula, clamped.
  const delta =
    0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const easeFactor = clamp(prev.easeFactor + delta, MIN_EASE, MAX_EASE);

  let interval: number;
  let repetitions: number;
  if (!passed) {
    // Show again today; we don't want failure to penalize cumulative reps
    // because the chunk + cloze ramps treat reps as "exposure", not "perfect
    // streak length".
    interval = 0;
    repetitions = prev.repetitions; // no penalty, no credit
  } else if (prev.repetitions === 0) {
    interval = 1;
    repetitions = prev.repetitions + 1;
  } else if (prev.repetitions === 1) {
    interval = 6;
    repetitions = prev.repetitions + 1;
  } else {
    interval = Math.round(prev.interval * easeFactor);
    repetitions = prev.repetitions + 1;
  }

  return {
    easeFactor,
    interval,
    repetitions,
    dueAt: addDays(now, interval).toISOString(),
    chunkStage: prev.chunkStage,
  };
}

// Recognition modes (§15.4): no interval advancement, small ease bump on
// success only. Re-stamp `dueAt` to "today" so the indicator on Home
// reflects that the user has touched the verse, but never push it out.
export function applyRecognitionTouch(
  prev: SrsState,
  succeeded: boolean,
  now: Date = new Date(),
): SrsState {
  const easeFactor = succeeded
    ? clamp(prev.easeFactor + 0.05, MIN_EASE, MAX_EASE)
    : prev.easeFactor;
  // Keep the verse due today: if it was already due, don't move it. If it
  // was scheduled out, pull it back to "now" so the user sees it again
  // tomorrow at the latest.
  const dueAt =
    new Date(prev.dueAt).getTime() <= now.getTime()
      ? prev.dueAt
      : now.toISOString();
  return { ...prev, easeFactor, dueAt };
}

// Predicted display intervals for the four quality buttons. Used by the
// QualityButtons UI so the user sees "<1m / ~6m / ~1d / ~4d" before tapping.
// Intentionally slightly fuzzy strings — they advertise the *next* spacing,
// not the exact integer days, since the actual interval depends on prior
// reps.
export type IntervalPreview = {
  again: string;
  hard: string;
  good: string;
  easy: string;
};

export function previewIntervals(
  prev: SrsState,
  locale: "es" | "en" = "es",
): IntervalPreview {
  const next = (q: Quality) => applyRecallGrade(prev, q).interval;
  return {
    again: locale === "es" ? "<1 min" : "<1 min",
    hard: formatDays(next(3), locale),
    good: formatDays(next(4), locale),
    easy: formatDays(next(5), locale),
  };
}

function formatDays(days: number, locale: "es" | "en"): string {
  if (days <= 0) return locale === "es" ? "hoy" : "today";
  if (days === 1) return locale === "es" ? "1 día" : "1 day";
  if (days < 30) return locale === "es" ? `${days} días` : `${days} days`;
  const months = Math.round(days / 30);
  return locale === "es" ? `${months} mes${months === 1 ? "" : "es"}` : `${months} mo`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}
