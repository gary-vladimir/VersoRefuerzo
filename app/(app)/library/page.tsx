// /library — tabbed view of Colecciones + Todos los versos (specs.md §6.3).
//
// Server component fetches everything in parallel; client component below
// owns the tab state, search filter, and the VerseRow undo flow.

import Link from "next/link";
import { and, asc, eq, isNull, inArray, lt } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  collections as collectionsTable,
  verses as versesTable,
  verseCollections as vcTable,
  bibleTextCache,
} from "@/db/schema";
import { T } from "@/lib/i18n/strings";
import { UNDO_WINDOW_MS } from "@/lib/constants";
import { LibraryView } from "./_view";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];
  const db = getDb();

  // Same housekeeping sweep as /api/verses GET — keep the SSR view honest.
  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
  await db
    .delete(versesTable)
    .where(and(eq(versesTable.userId, user.id), lt(versesTable.deletedAt, cutoff)));

  const [allVerses, allCollections, allLinks] = await Promise.all([
    db
      .select()
      .from(versesTable)
      .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt)))
      .orderBy(asc(versesTable.createdAt)),
    db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.userId, user.id))
      .orderBy(asc(collectionsTable.name)),
    db
      .select({ verseId: vcTable.verseId, collectionId: vcTable.collectionId })
      .from(vcTable)
      .innerJoin(collectionsTable, eq(vcTable.collectionId, collectionsTable.id))
      .where(eq(collectionsTable.userId, user.id)),
  ]);

  // Index links and prime cached text in one pass.
  const versesByCollection = new Map<string, string[]>();
  for (const link of allLinks) {
    const arr = versesByCollection.get(link.collectionId) ?? [];
    arr.push(link.verseId);
    versesByCollection.set(link.collectionId, arr);
  }

  const refs = allVerses.map((v) => v.canonicalRef);
  const cached = refs.length
    ? await db
        .select({
          ref: bibleTextCache.canonicalRef,
          version: bibleTextCache.version,
          text: bibleTextCache.text,
        })
        .from(bibleTextCache)
        .where(inArray(bibleTextCache.canonicalRef, refs))
    : [];
  const textByKey = new Map<string, string>();
  for (const c of cached) textByKey.set(`${c.ref}|${c.version}`, c.text);

  const versesById = new Map(allVerses.map((v) => [v.id, v]));

  const collectionsWithSamples = allCollections.map((c) => {
    const ids = versesByCollection.get(c.id) ?? [];
    const sample = ids
      .map((id) => versesById.get(id))
      .filter((v): v is (typeof allVerses)[number] => !!v)
      .slice(0, 3);
    return { collection: c, sample, count: ids.length };
  });

  const verseRows = allVerses.map((v) => ({
    verse: v,
    textPreview: textByKey.get(`${v.canonicalRef}|${v.version}`) ?? null,
  }));

  const sp = await searchParams;
  const initialTab: "collections" | "all" = sp.tab === "all" ? "all" : "collections";
  const initialQuery = sp.q ?? "";

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--c-bg)",
        paddingBottom: 80,
      }}
    >
      <header
        style={{
          padding: "32px 20px 14px",
          background: "#fff",
          borderBottom: "1px solid var(--c-line)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.6px",
              color: "var(--c-text)",
            }}
          >
            {t.library}
          </h1>
          <Link
            href="/verses/new"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "var(--c-indigo-50)",
              color: "var(--c-indigo-700)",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            + {t.addVerse}
          </Link>
        </div>
      </header>

      <LibraryView
        locale={locale}
        initialTab={initialTab}
        initialQuery={initialQuery}
        collections={collectionsWithSamples}
        verses={verseRows}
        strings={{
          collections: t.libraryTabCollections,
          all: t.libraryTabAll,
          search: t.searchPlaceholder,
          edit: t.edit,
          delete: t.delete,
          deleted: t.verseDeleted,
          undo: t.undo,
          loading: t.loadingText,
          versesCount: t.versesCount,
          emptyCollectionsTitle: t.emptyCollectionsTitle,
          emptyCollectionsBody: t.emptyCollectionsBody,
          createFirst: t.createFirstCollection,
          emptyAll: t.emptyAllVerses,
          addVerse: t.addVerse,
        }}
      />
    </main>
  );
}
