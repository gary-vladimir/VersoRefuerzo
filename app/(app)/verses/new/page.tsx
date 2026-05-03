// New Verse — /verses/new (specs.md §6.1).
// Server component: hits the DB once for the user's collections + verse count
// (used by smart defaults), then renders the client form.
//
// `?ref=` query is honored for the onboarding/empty-state pre-fill (§17.7, §17.2).

import { and, count, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { collections as collectionsTable, verses as versesTable } from "@/db/schema";
import { availableVersions } from "@/lib/bible/apibible";
import { T } from "@/lib/i18n/strings";
import { VerseForm } from "@/components/verse/VerseForm";

type SearchParams = Promise<{ ref?: string }>;

export default async function NewVersePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];
  const db = getDb();

  const [userCollections, [{ value: verseCount }]] = await Promise.all([
    db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.userId, user.id))
      .orderBy(collectionsTable.name),
    db
      .select({ value: count() })
      .from(versesTable)
      .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt))),
  ]);

  const versions = availableVersions().map((v) => v.key);
  const initialVersion =
    user.lastVersion && versions.includes(user.lastVersion as (typeof versions)[number])
      ? user.lastVersion
      : versions[0];

  const sp = await searchParams;
  const initialReference = sp?.ref ?? "";

  return (
    <VerseForm
      locale={locale}
      initialReference={initialReference}
      initialVersion={initialVersion ?? undefined}
      versions={versions}
      initialCollections={userCollections}
      existingVerseCount={verseCount}
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
