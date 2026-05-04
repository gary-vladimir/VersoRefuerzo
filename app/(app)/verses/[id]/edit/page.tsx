// /verses/[id]/edit — reuses the New Verse form in PATCH mode (specs.md §17.5).
// Server component pre-loads the verse, the user's collections, and the
// verse's current collection memberships so the form opens fully populated.

import { notFound, redirect } from "next/navigation";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  collections as collectionsTable,
  verses as versesTable,
  verseCollections as vcTable,
} from "@/db/schema";
import { availableVersions } from "@/lib/bible/apibible";
import { isCardColor, isVerseIcon } from "@/lib/catalog";
import { formatDisplay } from "@/lib/bible/reference";
import { T } from "@/lib/i18n/strings";
import { VerseForm } from "@/components/verse/VerseForm";

export default async function EditVersePage({
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

  const [userCollections, links, [{ value: verseCount }]] = await Promise.all([
    db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.userId, user.id))
      .orderBy(asc(collectionsTable.name)),
    db
      .select({ collectionId: vcTable.collectionId })
      .from(vcTable)
      .where(eq(vcTable.verseId, verse.id)),
    db
      .select({ value: count() })
      .from(versesTable)
      .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt))),
  ]);

  const versions = availableVersions().map((v) => v.key);
  const initialColor = isCardColor(verse.color) ? verse.color : undefined;
  const initialIcon = isVerseIcon(verse.icon) ? verse.icon : undefined;

  return (
    <VerseForm
      mode="edit"
      verseId={verse.id}
      locale={locale}
      initialReference={formatDisplay(verse.canonicalRef, locale)}
      initialVersion={verse.version}
      initialColor={initialColor}
      initialIcon={initialIcon}
      initialHint={verse.hint ?? ""}
      initialCollectionIds={links.map((l) => l.collectionId)}
      versions={versions}
      initialCollections={userCollections}
      existingVerseCount={verseCount}
      headerTitle={t.editVerseTitle}
      submitLabel={t.saveChanges}
      strings={{
        newVerse: t.newVerse,
        reference: t.reference,
        version: t.version,
        icon: t.icon,
        color: t.color,
        hint: t.hint,
        hintPlaceholder: t.hintPlaceholder,
        collections: t.collections,
        save: t.save,
        cancel: t.cancel,
      }}
    />
  );
}
