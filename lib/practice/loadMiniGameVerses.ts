// Server helper for the recognition mini-games (specs.md §6.4.2 – §6.4.4).
//
// All three games — Scramble, Match, Gap — pull from the same source pool:
// the user's owned, non-deleted, *cached* verses. This helper:
//
//   - sweeps soft-deletes whose undo window has elapsed
//   - returns up to `limit` randomly-sampled cached verses
//   - returns the user's full word pool (lowercased, deduped, no stopwords
//     dropped — the consumer decides) for FillTheGap distractors
//
// We pass copyrightAttribution through so the game UIs can render the
// API.Bible attribution in the corner per specs.md §9.3.

import "server-only";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  verses as versesTable,
  bibleTextCache,
  type Verse,
} from "@/db/schema";
import { UNDO_WINDOW_MS } from "@/lib/constants";
import { wordsOnly } from "@/lib/bible/tokenize";

export type MiniGameVerse = {
  verse: Verse;
  text: string;
  copyright: string | null;
};

export type MiniGamePool = {
  verses: MiniGameVerse[];
  // All distinct words across the user's cached verses, lowercased. The
  // consumer (FillTheGap) builds distractor candidates from this and falls
  // back to a curated list when it's too small.
  wordPool: string[];
};

export async function loadMiniGameVerses(
  userId: string,
  limit: number,
): Promise<MiniGamePool> {
  const db = getDb();

  // Same housekeeping sweep every read does.
  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
  await db
    .delete(versesTable)
    .where(and(eq(versesTable.userId, userId), lt(versesTable.deletedAt, cutoff)));

  const candidates = await db
    .select({ verse: versesTable })
    .from(versesTable)
    .innerJoin(
      bibleTextCache,
      and(
        eq(bibleTextCache.canonicalRef, versesTable.canonicalRef),
        eq(bibleTextCache.version, versesTable.version),
      ),
    )
    .where(and(eq(versesTable.userId, userId), isNull(versesTable.deletedAt)));

  if (candidates.length === 0) return { verses: [], wordPool: [] };

  const verses = candidates.map((c) => c.verse);
  const refs = verses.map((v) => v.canonicalRef);
  const cached = await db
    .select({
      ref: bibleTextCache.canonicalRef,
      version: bibleTextCache.version,
      text: bibleTextCache.text,
      copyright: bibleTextCache.copyrightAttribution,
    })
    .from(bibleTextCache)
    .where(inArray(bibleTextCache.canonicalRef, refs));
  const byKey = new Map<string, { text: string; copyright: string | null }>();
  for (const c of cached) byKey.set(`${c.ref}|${c.version}`, c);

  const sampled = sample(verses, limit).map((v) => {
    const c = byKey.get(`${v.canonicalRef}|${v.version}`)!;
    return { verse: v, text: c.text, copyright: c.copyright };
  });

  // Word pool — lowercased, deduped, drawn from every cached verse the
  // user has access to (not just the sampled ones).
  const pool = new Set<string>();
  for (const c of cached) {
    for (const w of wordsOnly(c.text)) pool.add(w);
  }

  return { verses: sampled, wordPool: [...pool] };
}

// Random sample without replacement using Fisher–Yates on a copy.
function sample<T>(arr: T[], n: number): T[] {
  if (n >= arr.length) return shuffle(arr);
  return shuffle(arr).slice(0, n);
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
