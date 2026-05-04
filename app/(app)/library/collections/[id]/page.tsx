// /library/collections/[id] — single-collection detail (specs.md §6.3, §17.2).
// Lists the collection's verses as a VerseRow list. 404 if the collection
// doesn't belong to the user.

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq, inArray, isNull, lt } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  collections as collectionsTable,
  verses as versesTable,
  verseCollections as vcTable,
  bibleTextCache,
} from "@/db/schema";
import { COLLECTION_COLORS } from "@/lib/catalog";
import { T } from "@/lib/i18n/strings";
import { UNDO_WINDOW_MS } from "@/lib/constants";
import { VerseRow } from "@/components/verse/VerseRow";

export default async function CollectionDetailPage({
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

  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
  await db
    .delete(versesTable)
    .where(and(eq(versesTable.userId, user.id), lt(versesTable.deletedAt, cutoff)));

  const found = await db
    .select()
    .from(collectionsTable)
    .where(and(eq(collectionsTable.id, id), eq(collectionsTable.userId, user.id)))
    .limit(1);
  const collection = found[0];
  if (!collection) notFound();

  const rows = await db
    .select({ verse: versesTable })
    .from(versesTable)
    .innerJoin(vcTable, eq(vcTable.verseId, versesTable.id))
    .where(
      and(
        eq(versesTable.userId, user.id),
        isNull(versesTable.deletedAt),
        eq(vcTable.collectionId, collection.id),
      ),
    )
    .orderBy(asc(versesTable.createdAt));

  const verses = rows.map((r) => r.verse);
  const refs = verses.map((v) => v.canonicalRef);
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

  const preset =
    COLLECTION_COLORS.find((p) => p.id === collection.colorKey) ?? COLLECTION_COLORS[0]!;

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
        <Link
          href="/library"
          style={{
            display: "inline-block",
            color: "var(--c-muted)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 12,
            textDecoration: "none",
            marginBottom: 8,
          }}
        >
          ← {t.library}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            aria-hidden
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: preset.dot,
              display: "inline-block",
            }}
          />
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 24,
              color: "var(--c-text)",
              letterSpacing: "-0.5px",
            }}
          >
            {collection.name}
          </h1>
        </div>
        {collection.description && (
          <p
            style={{
              margin: "6px 0 0",
              color: "var(--c-muted)",
              fontFamily: "var(--font-serif)",
              fontSize: 13,
            }}
          >
            {collection.description}
          </p>
        )}
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 11,
            color: "var(--c-soft)",
            fontWeight: 700,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
          }}
        >
          {t.versesCount(verses.length)}
        </p>
      </header>

      {verses.length === 0 ? (
        <section
          style={{
            margin: "24px 20px",
            padding: "24px 20px",
            borderRadius: "var(--r-2xl)",
            background: "#fff",
            boxShadow: "var(--shadow-sm)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 16px",
              color: "var(--c-muted)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            {t.emptyCollectionVerses}
          </p>
          <Link
            href="/verses/new"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: 999,
              background: "var(--brand-primary)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            + {t.addVerse}
          </Link>
        </section>
      ) : (
        <section
          className="vr-stagger"
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {verses.map((v) => (
            <VerseRow
              key={v.id}
              verse={v}
              textPreview={textByKey.get(`${v.canonicalRef}|${v.version}`) ?? null}
              locale={locale}
              strings={{
                edit: t.edit,
                delete: t.delete,
                deleted: t.verseDeleted,
                undo: t.undo,
                loading: t.loadingText,
              }}
            />
          ))}
        </section>
      )}
    </main>
  );
}
