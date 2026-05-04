"use client";

// Library client view: tab switcher (Colecciones / Todos los versos), search
// box that filters the All-verses tab, and grid/list rendering. Kept thin —
// data is fetched server-side; this component owns interactive state only.

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Collection, Verse } from "@/db/schema";
import { VerseRow } from "@/components/verse/VerseRow";
import { CollectionCard } from "@/components/verse/CollectionCard";
import { formatDisplay } from "@/lib/bible/reference";

type Strings = {
  collections: string;
  all: string;
  search: string;
  edit: string;
  delete: string;
  deleted: string;
  undo: string;
  loading: string;
  versesCount: (n: number) => string;
  emptyCollectionsTitle: string;
  emptyCollectionsBody: string;
  createFirst: string;
  emptyAll: string;
  addVerse: string;
};

type CollectionEntry = { collection: Collection; sample: Verse[]; count: number };
type VerseEntry = { verse: Verse; textPreview: string | null };

type Props = {
  locale: "es" | "en";
  initialTab: "collections" | "all";
  initialQuery: string;
  collections: CollectionEntry[];
  verses: VerseEntry[];
  strings: Strings;
};

export function LibraryView({
  locale,
  initialTab,
  initialQuery,
  collections,
  verses,
  strings: t,
}: Props) {
  const [tab, setTab] = useState<"collections" | "all">(initialTab);
  const [query, setQuery] = useState(initialQuery);

  const filteredVerses = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return verses;
    return verses.filter((v) => {
      const display = formatDisplay(v.verse.canonicalRef, locale).toLowerCase();
      if (display.includes(q)) return true;
      if (v.verse.canonicalRef.toLowerCase().includes(q)) return true;
      return v.textPreview ? v.textPreview.toLowerCase().includes(q) : false;
    });
  }, [verses, query, locale]);

  return (
    <>
      <div
        style={{
          padding: "12px 20px 0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <TabPill active={tab === "collections"} onClick={() => setTab("collections")}>
          {t.collections}
        </TabPill>
        <TabPill active={tab === "all"} onClick={() => setTab("all")}>
          {t.all}
        </TabPill>
      </div>

      {tab === "all" && (
        <div style={{ padding: "12px 20px 0" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--r-lg)",
              border: "none",
              boxShadow: "inset 0 0 0 1.5px var(--c-line)",
              background: "#fff",
              fontFamily: "var(--font-sans)",
              fontSize: 14,
              color: "var(--c-text)",
              outline: "none",
            }}
          />
        </div>
      )}

      {tab === "collections" ? (
        collections.length === 0 ? (
          <EmptyCard
            title={t.emptyCollectionsTitle}
            body={t.emptyCollectionsBody}
            ctaLabel={t.createFirst}
            ctaHref="/verses/new"
          />
        ) : (
          <section
            className="vr-stagger"
            style={{
              padding: 20,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {collections.map((entry) => (
              <CollectionCard
                key={entry.collection.id}
                collection={entry.collection}
                sample={entry.sample}
                countLabel={t.versesCount(entry.count)}
              />
            ))}
          </section>
        )
      ) : verses.length === 0 ? (
        <EmptyCard title={t.emptyAll} body="" ctaLabel={t.addVerse} ctaHref="/verses/new" />
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
          {filteredVerses.length === 0 ? (
            <p
              style={{
                margin: "20px 0",
                color: "var(--c-muted)",
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              —
            </p>
          ) : (
            filteredVerses.map((v) => (
              <VerseRow
                key={v.verse.id}
                verse={v.verse}
                textPreview={v.textPreview}
                locale={locale}
                strings={{
                  edit: t.edit,
                  delete: t.delete,
                  deleted: t.deleted,
                  undo: t.undo,
                  loading: t.loading,
                }}
              />
            ))
          )}
        </section>
      )}
    </>
  );
}

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        background: active ? "var(--c-text)" : "transparent",
        color: active ? "#fff" : "var(--c-muted)",
        border: "none",
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function EmptyCard({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
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
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 16,
          color: "var(--c-text)",
        }}
      >
        {title}
      </h2>
      {body && (
        <p
          style={{
            margin: "8px 0 16px",
            color: "var(--c-muted)",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {body}
        </p>
      )}
      <Link
        href={ctaHref}
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
          marginTop: body ? 0 : 16,
        }}
      >
        {ctaLabel}
      </Link>
    </section>
  );
}
