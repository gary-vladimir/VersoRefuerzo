// Shared queue-build for the Classic-shell routes (specs.md §6.4.1).
//
// /practice/classic and /practice/first-letter both render <ClassicSession>
// with the same data shape; only the front-face mode and copy differ. This
// helper is the one place that:
//   - sweeps soft-deletes whose undo window has elapsed
//   - resolves which verses to surface (full library / single verse / random)
//   - filters out uncached verses (M4 review #5)
//   - interleaves the due-today queue
//   - precomputes chunk plan + stage per §15.7
//
// Server-only — pulls Drizzle and the dailySeed PRNG.

import "server-only";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  verses as versesTable,
  verseCollections as vcTable,
  collections as collectionsTable,
  bibleTextCache,
  type User,
} from "@/db/schema";
import { buildDueQueue, dailySeed } from "@/lib/srs/queue";
import { planChunks, stageForReps } from "@/lib/srs/chunk";
import { UNDO_WINDOW_MS } from "@/lib/constants";
import type { QueueItem } from "@/components/practice/ClassicSession";

export type LoadOpts = {
  oneVerseId?: string | null;
  random?: boolean;
};

export async function loadClassicQueue(
  user: User,
  opts: LoadOpts = {},
): Promise<QueueItem[]> {
  const db = getDb();

  // 1. Sweep committed-deletable rows so the surface matches the spec.
  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
  await db
    .delete(versesTable)
    .where(and(eq(versesTable.userId, user.id), lt(versesTable.deletedAt, cutoff)));

  // 2. Resolve random mode by picking one cached candidate up front.
  let oneVerseId = opts.oneVerseId ?? null;
  if (opts.random && !oneVerseId) {
    const candidates = await db
      .select({ id: versesTable.id })
      .from(versesTable)
      .innerJoin(
        bibleTextCache,
        and(
          eq(bibleTextCache.canonicalRef, versesTable.canonicalRef),
          eq(bibleTextCache.version, versesTable.version),
        ),
      )
      .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt)));
    if (candidates.length > 0) {
      oneVerseId = candidates[Math.floor(Math.random() * candidates.length)]!.id;
    }
  }

  // 3. Fetch the candidate verses.
  const verses = oneVerseId
    ? await db
        .select()
        .from(versesTable)
        .where(
          and(
            eq(versesTable.userId, user.id),
            eq(versesTable.id, oneVerseId),
            isNull(versesTable.deletedAt),
          ),
        )
    : await db
        .select()
        .from(versesTable)
        .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt)));

  if (verses.length === 0) return [];

  const verseIds = verses.map((v) => v.id);
  const refs = verses.map((v) => v.canonicalRef);

  const [links, cached] = await Promise.all([
    db
      .select({ verseId: vcTable.verseId, collectionId: vcTable.collectionId })
      .from(vcTable)
      .innerJoin(collectionsTable, eq(vcTable.collectionId, collectionsTable.id))
      .where(
        and(
          eq(collectionsTable.userId, user.id),
          inArray(vcTable.verseId, verseIds),
        ),
      ),
    db
      .select({
        ref: bibleTextCache.canonicalRef,
        version: bibleTextCache.version,
        text: bibleTextCache.text,
        copyright: bibleTextCache.copyrightAttribution,
      })
      .from(bibleTextCache)
      .where(inArray(bibleTextCache.canonicalRef, refs)),
  ]);

  const linksByVerse = new Map<string, string[]>();
  for (const l of links) {
    const arr = linksByVerse.get(l.verseId) ?? [];
    arr.push(l.collectionId);
    linksByVerse.set(l.verseId, arr);
  }
  const cacheByKey = new Map<string, { text: string; copyright: string | null }>();
  for (const c of cached) {
    cacheByKey.set(`${c.ref}|${c.version}`, { text: c.text, copyright: c.copyright });
  }

  // 4. Filter uncached + interleave (or pass-through for one-verse mode).
  const versesWithText = verses.filter((v) =>
    cacheByKey.has(`${v.canonicalRef}|${v.version}`),
  );

  const ordered = oneVerseId
    ? versesWithText.map((v) => ({
        id: v.id,
        dueAt: v.srsState.dueAt,
        collectionIds: linksByVerse.get(v.id) ?? [],
      }))
    : buildDueQueue(
        versesWithText.map((v) => ({
          id: v.id,
          srsState: v.srsState,
          collectionIds: linksByVerse.get(v.id) ?? [],
        })),
        dailySeed(user.id),
      );

  const versesById = new Map(versesWithText.map((v) => [v.id, v]));

  return ordered.map((q) => {
    const v = versesById.get(q.id)!;
    const cache = cacheByKey.get(`${v.canonicalRef}|${v.version}`)!;
    const plan = planChunks(cache.text);
    const stage = stageForReps(v.srsState.repetitions, plan.chunks.length);
    return {
      id: v.id,
      canonicalRef: v.canonicalRef,
      version: v.version,
      icon: v.icon,
      color: v.color,
      hint: v.hint,
      text: cache.text,
      copyright: cache.copyright,
      srsState: v.srsState,
      chunk: {
        stage,
        text: plan.visibleAtStage(stage),
        total: plan.chunks.length,
      },
    };
  });
}
