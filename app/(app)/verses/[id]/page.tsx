// /verses/[id] — Card View (specs.md §6.2 + §16.4 simplification).
//
// M3 scope: the visual flip plus hint reveal. Two states — `front` (colored
// face with reference/version/icon and the `Revelar verso` CTA) and
// `revealed` (white face with verse text and the optional inline hint).
// The four SM-2 quality buttons specified by §16.4, the `Repasar ahora`
// affordance from §17.4, and the in-session deferral semantics of `Saltar`
// from §17.3 all depend on the Classic session shell, which lands in M4 —
// they are intentionally NOT rendered here.
//
// The `💡 Pista` button is always visible and is orthogonal to grading per
// §16.5. If text isn't cached yet we lazy-fetch via /api/bible/text on first
// reveal.

import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  verses as versesTable,
  bibleTextCache,
  verseCollections as vcTable,
  collections as collectionsTable,
} from "@/db/schema";
import { T } from "@/lib/i18n/strings";
import { CardViewClient } from "./_client";

export default async function CardViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];
  const db = getDb();
  const { id } = await params;

  const found = await db
    .select()
    .from(versesTable)
    .where(
      and(
        eq(versesTable.id, id),
        eq(versesTable.userId, user.id),
        isNull(versesTable.deletedAt),
      ),
    )
    .limit(1);
  const verse = found[0];
  if (!verse) notFound();

  const [cached, links] = await Promise.all([
    db
      .select()
      .from(bibleTextCache)
      .where(
        and(
          eq(bibleTextCache.canonicalRef, verse.canonicalRef),
          eq(bibleTextCache.version, verse.version),
        ),
      )
      .limit(1),
    db
      .select({
        id: collectionsTable.id,
        name: collectionsTable.name,
        colorKey: collectionsTable.colorKey,
      })
      .from(vcTable)
      .innerJoin(collectionsTable, eq(vcTable.collectionId, collectionsTable.id))
      .where(eq(vcTable.verseId, verse.id)),
  ]);

  return (
    <CardViewClient
      verse={verse}
      initialText={cached[0]?.text ?? null}
      copyrightAttribution={cached[0]?.copyrightAttribution ?? null}
      collections={links}
      locale={locale}
      strings={{
        back: t.backToLibrary,
        edit: t.edit,
        delete: t.delete,
        deleted: t.verseDeleted,
        undo: t.undo,
        revealVerse: t.revealVerse,
        showHint: t.showHintShort,
        hint: t.hint,
        masteryPercent: t.masteryPercent,
        copyrightFallback: t.cardCopyrightFallback,
        recite:
          locale === "es"
            ? "Recita el verso en voz alta. Cuando estés listo…"
            : "Recite it aloud. When you're ready…",
        loading: t.loadingText,
      }}
    />
  );
}
