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

export type QueueVerse = {
  id: string;
  dueAt: string;
  collectionIds: string[]; // empty array == ungrouped
};

export function selectDueToday(
  verses: Array<{ id: string; srsState: SrsState; collectionIds: string[] }>,
  now: Date = new Date(),
): QueueVerse[] {
  const cutoff = endOfDay(now).getTime();
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
  const orderedKeys = shuffle([...buckets.keys()], seed);

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
  now: Date = new Date(),
): QueueVerse[] {
  return interleave(selectDueToday(verses, now), seed);
}

// Stable per-user-per-day seed. The exact integer doesn't matter; only that
// it changes by day and is deterministic across reloads.
export function dailySeed(userId: string, now: Date = new Date()): number {
  const day = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  let h = 2166136261;
  const s = `${userId}|${day}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 — a 4-line PRNG that's good enough for shuffling and
// deterministic given the seed.
function rng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  const r = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(23, 59, 59, 999);
  return out;
}
