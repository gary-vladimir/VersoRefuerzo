// GET /api/practice/queue?source=all|collection|custom&collectionId=&verses=
//
// Returns the interleaved due-today queue for the current user (specs.md
// §15.6, AC-17), drawn from the §6.4 source pool. Query vocabulary is the
// one defined in lib/practice/source.ts, so the same link works against
// this route and against the mode pages.
//
// Response shape:
//   { queue: Array<{ id, canonicalRef, version, icon, color, hint,
//                    text, copyright, srsState, mastery, status,
//                    collectionIds, chunk: { stage, text, total } }> }

import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  verses as versesTable,
  verseCollections as vcTable,
  collections as collectionsTable,
  bibleTextCache,
} from "@/db/schema";
import { buildDueQueue, dailySeed } from "@/lib/srs/queue";
import { planChunks, stageForReps } from "@/lib/srs/chunk";
import { endOfTzDay, isSameTzDay, localDayNumber } from "@/lib/streak/streak";
import { parsePracticeSource } from "@/lib/practice/source";
import { sourceFilter } from "@/lib/practice/sourceFilter";
import { UNDO_WINDOW_MS } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();

  // Same housekeeping sweep as /api/verses (no background workers).
  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
  await db
    .delete(versesTable)
    .where(and(eq(versesTable.userId, user.id), lt(versesTable.deletedAt, cutoff)));

  const source = parsePracticeSource(
    Object.fromEntries(req.nextUrl.searchParams.entries()),
  );

  // Pull the user's verses, narrowed to the selected pool. We need the verse
  // fields, the cached text, and the per-verse collection id list — all in
  // as few queries as possible.
  const verses = await db
    .select()
    .from(versesTable)
    .where(
      and(
        eq(versesTable.userId, user.id),
        isNull(versesTable.deletedAt),
        sourceFilter(db, source),
      ),
    );

  if (verses.length === 0) {
    return NextResponse.json({ queue: [] });
  }

  const verseIds = verses.map((v) => v.id);
  const [links, cached] = await Promise.all([
    db
      .select({
        verseId: vcTable.verseId,
        collectionId: vcTable.collectionId,
      })
      .from(vcTable)
      .innerJoin(collectionsTable, eq(vcTable.collectionId, collectionsTable.id))
      .where(
        and(
          eq(collectionsTable.userId, user.id),
          isNull(collectionsTable.deletedAt),
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
      .where(
        inArray(
          bibleTextCache.canonicalRef,
          verses.map((v) => v.canonicalRef),
        ),
      ),
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

  // Skip verses whose text isn't cached yet (M4 review #5 / specs §6.1).
  // Practicing against blank text would let the user grade a verse they
  // can't actually see; better to surface the count separately and let
  // them retry/refresh once the cache primes. The cache only misses on
  // network failures during create — common operation is hot.
  const versesWithText = verses.filter((v) =>
    cacheByKey.has(`${v.canonicalRef}|${v.version}`),
  );
  const skippedNoText = verses.length - versesWithText.length;

  // §15.4 "touched today" suppression: a verse the user already practiced
  // today (any mode) drops off the queue for the rest of the day.
  const candidatesForQueue = versesWithText.filter(
    (v) => !isSameTzDay(v.lastPracticedAt, user.timezone),
  );

  const seed = dailySeed(user.id, localDayNumber(user.timezone));
  const ordered = buildDueQueue(
    candidatesForQueue.map((v) => ({
      id: v.id,
      srsState: v.srsState,
      collectionIds: linksByVerse.get(v.id) ?? [],
    })),
    seed,
    endOfTzDay(user.timezone),
  );

  const versesById = new Map(versesWithText.map((v) => [v.id, v]));

  const queue = ordered.map((q) => {
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
      mastery: v.mastery,
      status: v.status,
      collectionIds: linksByVerse.get(v.id) ?? [],
      chunk: {
        stage,
        text: plan.visibleAtStage(stage),
        total: plan.chunks.length,
      },
    };
  });

  return NextResponse.json({ queue, skippedNoText });
}
