// Daily practice queue (specs.md §15.6).
//
// Default ordering is interleaved across collections rather than blocked,
// because interleaved practice produces better long-term retention even
// though each item feels harder per-rep. Interleaving here means: pick the
// next collection round-robin, then within that collection pick the verse
// whose `dueAt` is most overdue. Verses with no collection are placed in a
// virtual "ungrouped" bucket and rotate alongside the named collections.
//
// Determinism: a stable `seed` (derived from the user id + day) drives the
// initial ordering of collections so a returning user sees the same set
// laid out the same way until tomorrow. The ordering is recomputed at the
// start of every queue fetch — once a card is graded the verse advances or
// stays per its SRS state, and the *next* fetch reflects that.

import type { SrsState } from "@/db/schema";
import { seededShuffle } from "@/lib/random";

export type QueueVerse = {
  id: string;
  dueAt: string;
  collectionIds: string[]; // empty array == ungrouped
};

// `cutoffMs` is the end of today in the *user's* timezone — see
// lib/streak/streak.ts::endOfTzDay. It is passed in rather than computed
// here so this module stays pure and there is exactly one definition of
// where a day ends.
export function selectDueToday(
  verses: Array<{ id: string; srsState: SrsState; collectionIds: string[] }>,
  cutoffMs: number,
): QueueVerse[] {
  const cutoff = cutoffMs;
  const due: QueueVerse[] = [];
  for (const v of verses) {
    const dueAtMs = new Date(v.srsState.dueAt).getTime();
    if (dueAtMs <= cutoff) {
      due.push({
        id: v.id,
        dueAt: v.srsState.dueAt,
        collectionIds: v.collectionIds,
      });
    }
  }
  return due;
}

export function interleave(
  due: QueueVerse[],
  seed: number,
): QueueVerse[] {
  if (due.length <= 1) return due.slice();

  // Bucket by collection. A verse in N collections appears in only ONE
  // bucket (its first collection by id-sort), otherwise the same verse would
  // be served twice in one queue. Ungrouped verses share a "" bucket.
  const buckets = new Map<string, QueueVerse[]>();
  for (const v of due) {
    const key = v.collectionIds.length > 0 ? [...v.collectionIds].sort()[0]! : "";
    const arr = buckets.get(key) ?? [];
    arr.push(v);
    buckets.set(key, arr);
  }

  // Within each bucket, most-overdue first.
  for (const arr of buckets.values()) {
    arr.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  }

  // Order the buckets themselves with a seeded shuffle so two users on
  // overlapping libraries don't see the same starting collection.
  const orderedKeys = seededShuffle([...buckets.keys()], seed);

  // Round-robin pull until every bucket is empty.
  const out: QueueVerse[] = [];
  let exhausted = false;
  while (!exhausted) {
    exhausted = true;
    for (const k of orderedKeys) {
      const arr = buckets.get(k)!;
      const next = arr.shift();
      if (next) {
        out.push(next);
        exhausted = false;
      }
    }
  }
  return out;
}

// Convenience: filter and interleave in one step.
export function buildDueQueue(
  verses: Array<{ id: string; srsState: SrsState; collectionIds: string[] }>,
  seed: number,
  cutoffMs: number,
): QueueVerse[] {
  return interleave(selectDueToday(verses, cutoffMs), seed);
}

// Stable per-user-per-day seed. The exact integer doesn't matter; only that
// it changes by day and is deterministic across reloads. `dayNumber` is the
// user's LOCAL day (lib/streak/streak.ts::localDayNumber) so the ordering
// rotates at their midnight, not UTC's.
export function dailySeed(userId: string, dayNumber: number): number {
  let h = 2166136261;
  const s = `${userId}|${dayNumber}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
