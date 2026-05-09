// /practice/classic — Classic flashcards session entry (specs.md §6.4.1).
//
// Reads the same data the /api/practice/queue route does, in-process. The
// optional `?verse=<id>` short-circuits to a single-card session for the
// `Repasar ahora` (§17.4) flow off Card View.

import { redirect } from "next/navigation";
import { and, eq, inArray, isNull, lt } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  verses as versesTable,
  verseCollections as vcTable,
  collections as collectionsTable,
  bibleTextCache,
} from "@/db/schema";
// `bibleTextCache` is used both for the per-verse text join and the
// random-mode candidate filter.
import { buildDueQueue, dailySeed } from "@/lib/srs/queue";
import { planChunks, stageForReps } from "@/lib/srs/chunk";
import { UNDO_WINDOW_MS } from "@/lib/constants";
import { T } from "@/lib/i18n/strings";
import { ClassicSession, type QueueItem } from "@/components/practice/ClassicSession";

type SearchParams = Promise<{ verse?: string; random?: string }>;

export default async function ClassicPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];
  const db = getDb();

  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
  await db
    .delete(versesTable)
    .where(and(eq(versesTable.userId, user.id), lt(versesTable.deletedAt, cutoff)));

  const sp = await searchParams;
  let oneVerseId = sp.verse?.trim() || null;
  const isRandom = sp.random === "1" || sp.random === "true";

  // Random mode: pick one owned verse with cached text. Used by the §17.2
  // empty-day CTA "Practica un verso aleatorio" — without this, the CTA
  // would land on the empty due-today queue (M4 review #3).
  if (isRandom && !oneVerseId) {
    const candidates = await db
      .select({
        id: versesTable.id,
        canonicalRef: versesTable.canonicalRef,
        version: versesTable.version,
      })
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

  let verses;
  if (oneVerseId) {
    verses = await db
      .select()
      .from(versesTable)
      .where(
        and(
          eq(versesTable.userId, user.id),
          eq(versesTable.id, oneVerseId),
          isNull(versesTable.deletedAt),
        ),
      );
  } else {
    verses = await db
      .select()
      .from(versesTable)
      .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt)));
  }

  const verseIds = verses.map((v) => v.id);
  const refs = verses.map((v) => v.canonicalRef);

  const [links, cached] = await Promise.all([
    verseIds.length === 0
      ? Promise.resolve([])
      : db
          .select({ verseId: vcTable.verseId, collectionId: vcTable.collectionId })
          .from(vcTable)
          .innerJoin(collectionsTable, eq(vcTable.collectionId, collectionsTable.id))
          .where(
            and(
              eq(collectionsTable.userId, user.id),
              inArray(vcTable.verseId, verseIds),
            ),
          ),
    refs.length === 0
      ? Promise.resolve([])
      : db
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

  // Drop verses without cached text — practicing against a blank back face
  // would let the user grade something they can't read (M4 review #5).
  const versesWithText = verses.filter((v) =>
    cacheByKey.has(`${v.canonicalRef}|${v.version}`),
  );

  // Single-verse mode (Repasar ahora) bypasses the due-today filter.
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
  const queue: QueueItem[] = ordered.map((q) => {
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

  const aloudTip = locale === "es"
    ? "Recita el verso en voz alta — pronunciarlo mejora la memorización."
    : "Recite the verse aloud — speaking it improves recall.";

  return (
    <ClassicSession
      initialQueue={queue}
      locale={locale}
      showAloudTip={!user.hasSeenAloudTip}
      strings={{
        recall: locale === "es" ? "Recuerda este verso" : "Recall this verse",
        reciteAloud:
          locale === "es" ? "Cierra los ojos y recítalo en voz alta." : "Close your eyes and recite it aloud.",
        reveal: t.revealVerse,
        howWell: locale === "es" ? "¿Qué tan bien lo recordaste?" : "How well did you remember?",
        again: t.again,
        hard: t.hard,
        good: t.good,
        easy: t.easy,
        showHint: t.showHintShort,
        hint: t.hint,
        skip: t.skipCard,
        exit: locale === "es" ? "Salir" : "Exit",
        aloudTip,
        aloudTipOk: "OK",
        copyrightFallback: t.cardCopyrightFallback,
        emptyQueue:
          locale === "es"
            ? "No hay versos para hoy. Vuelve mañana o agrega uno nuevo."
            : "Nothing due today. Come back tomorrow or add a new verse.",
        emptyQueueCta: t.home,
        saveFailed: t.saveFailedRetry,
      }}
    />
  );
}
