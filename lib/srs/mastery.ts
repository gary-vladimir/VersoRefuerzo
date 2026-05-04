// Mastery + status derivation (specs.md §6.5, §15.5).
//
// `mastery` is a UI-facing percent in [0, 1]. `status` is a label-only
// classification used to color rows and pills — NOT consumed by the SRS
// scheduler. The mastered guard in §15.5 rejects a verse from "mastered"
// unless there is a recent unaided recall pass on file, so a user who only
// plays Scramble/Match cannot accidentally graduate verses.

import type { SrsState, PracticeSession } from "@/db/schema";

type RecallMode = "classic" | "first_letter" | "typed";
const RECALL_MODES: ReadonlySet<RecallMode> = new Set(["classic", "first_letter", "typed"]);

const UNAIDED_RECALL_WINDOW_DAYS = 30;

export function deriveMastery(srs: SrsState): number {
  // Mix cumulative reps with current spacing so a verse trending toward
  // monthly intervals reflects that, while still rewarding raw exposure.
  // Constants are tunable per specs.md §6.5; the only hard rule is that
  // both factors are bounded and combined linearly.
  const repsTerm = Math.min(srs.repetitions / 6, 1) * 0.6;
  const intervalTerm = Math.min(srs.interval / 60, 1) * 0.4;
  return clamp(repsTerm + intervalTerm, 0, 1);
}

export type Status = "new" | "learning" | "mastered";

export type MasteryInputs = {
  srs: SrsState;
  // The most recent unaided RECALL session on the verse (Classic, First-
  // letter, or Typed) graded `Bien` or higher, or null if none exists.
  // Caller computes this once per verse from the practice_sessions table.
  lastUnaidedRecall: { startedAt: Date; quality: number } | null;
  now?: Date;
};

export function deriveStatus({
  srs,
  lastUnaidedRecall,
  now = new Date(),
}: MasteryInputs): Status {
  if (srs.repetitions === 0) return "new";

  const mastery = deriveMastery(srs);
  const meetsBaseline = srs.repetitions >= 4 && mastery >= 0.7;
  if (!meetsBaseline) return "learning";

  // §15.5 guard: must have an unaided recall pass within the window.
  if (!lastUnaidedRecall) return "learning";
  const windowStart = new Date(now);
  windowStart.setUTCDate(
    windowStart.getUTCDate() - UNAIDED_RECALL_WINDOW_DAYS,
  );
  if (lastUnaidedRecall.startedAt < windowStart) return "learning";
  if (lastUnaidedRecall.quality < 4) return "learning";
  return "mastered";
}

// Helper for the API route that pulls the qualifying session out of the
// per-verse session log. Returns the most recent matching row, or null.
export function findLastUnaidedRecall(
  sessions: PracticeSession[],
): MasteryInputs["lastUnaidedRecall"] {
  let best: MasteryInputs["lastUnaidedRecall"] = null;
  for (const s of sessions) {
    if (!RECALL_MODES.has(s.mode as RecallMode)) continue;
    if (s.usedHint) continue;
    if (s.quality === null || s.quality < 4) continue;
    if (!best || s.startedAt > best.startedAt) {
      best = { startedAt: s.startedAt, quality: s.quality };
    }
  }
  return best;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
