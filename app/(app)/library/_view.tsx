"use client";

// Library client view: tab switcher (Colecciones / Todos los versos), a
// search box that filters both tabs, status + collection filter chips and a
// sort control on the All-verses tab, and grid/list rendering. Kept thin —
// data is fetched server-side; this component owns interactive state only.
// Filtering and sorting are in-memory (no URL round-trip) so typing stays
// instant.

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import type { Collection, Verse } from "@/db/schema";
import { VerseRow } from "@/components/verse/VerseRow";
import { CollectionCard } from "@/components/verse/CollectionCard";
import { formatDisplay } from "@/lib/bible/reference";
import { COLLECTION_COLORS } from "@/lib/catalog";
import { Search, Close, Plus } from "@/components/icons/UiIcons";
import {
  CollectionSheet,
  type CollectionSheetStrings,
} from "@/components/verse/CollectionSheet";
import { T } from "@/lib/i18n/strings";

type Strings = {
  collections: string;
  all: string;
  search: string;
  edit: string;
  delete: string;
  deleted: string;
  undo: string;
  more: string;
  clearSearch: string;
  loading: string;
  emptyCollectionsTitle: string;
  emptyCollectionsBody: string;
  createFirst: string;
  emptyAll: string;
  addVerse: string;
  filterAll: string;
  filterNew: string;
  filterLearning: string;
  filterMastered: string;
  sortRecent: string;
  sortAlpha: string;
  sortLeastMastered: string;
  noResults: string;
  filterUngrouped: string;
  newCollection: string;
  collectionSheet: CollectionSheetStrings;
};

type CollectionEntry = { collection: Collection; sample: Verse[]; count: number };
type VerseEntry = {
  verse: Verse;
  textPreview: string | null;
  collectionIds: string[];
};

// Sentinel for "verses in no collection at all": a real filter target, not
// a collection id. Collection ids are UUIDs, so it cannot collide with one.
const UNGROUPED = "ungrouped";

type Status = "all" | "new" | "learning" | "mastered";
type Sort = "recent" | "alpha" | "mastery";

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
  const router = useRouter();
  const [tab, setTab] = useState<"collections" | "all">(initialTab);
  // "Nueva colección" opens the create sheet right here; the new collection
  // then opens on its own page, whose empty state offers "Agregar verso"
  // with the collection pre-selected.
  const [creating, setCreating] = useState(false);
  const closeCreate = useCallback(() => setCreating(false), []);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<Status>("all");
  const [sort, setSort] = useState<Sort>("recent");
  // null == no collection constraint. Tapping the active chip clears it.
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  const filteredVerses = useMemo(() => {
    let list = verses;
    if (q) {
      list = list.filter((v) => {
        const display = formatDisplay(v.verse.canonicalRef, locale).toLowerCase();
        return (
          display.includes(q) ||
          v.verse.canonicalRef.toLowerCase().includes(q) ||
          (v.textPreview ? v.textPreview.toLowerCase().includes(q) : false)
        );
      });
    }
    if (collectionFilter === UNGROUPED) {
      list = list.filter((v) => v.collectionIds.length === 0);
    } else if (collectionFilter) {
      list = list.filter((v) => v.collectionIds.includes(collectionFilter));
    }
    if (status !== "all") list = list.filter((v) => v.verse.status === status);
    const sorted = [...list];
    if (sort === "alpha") {
      sorted.sort((a, b) =>
        formatDisplay(a.verse.canonicalRef, locale).localeCompare(
          formatDisplay(b.verse.canonicalRef, locale),
        ),
      );
    } else if (sort === "mastery") {
      sorted.sort((a, b) => (a.verse.mastery ?? 0) - (b.verse.mastery ?? 0));
    } else {
      sorted.sort((a, b) => b.verse.createdAt.getTime() - a.verse.createdAt.getTime());
    }
    return sorted;
  }, [verses, q, status, sort, locale, collectionFilter]);

  const hasUngrouped = useMemo(
    () => verses.some((v) => v.collectionIds.length === 0),
    [verses],
  );

  const filteredCollections = useMemo(
    () => (q ? collections.filter((c) => c.collection.name.toLowerCase().includes(q)) : collections),
    [collections, q],
  );

  const filters: { id: Status; label: string }[] = [
    { id: "all", label: t.filterAll },
    { id: "new", label: t.filterNew },
    { id: "learning", label: t.filterLearning },
    { id: "mastered", label: t.filterMastered },
  ];

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
        {tab === "collections" && collections.length > 0 && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="vr-press"
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "8px 14px",
              minHeight: 38,
              borderRadius: 999,
              background: "var(--c-indigo-50)",
              color: "var(--c-indigo-700)",
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <Plus size={12} strokeWidth={3} /> {t.newCollection}
          </button>
        )}
      </div>

      {creating && (
        <CollectionSheet
          initial={{
            name: "",
            description: "",
            colorKey: COLLECTION_COLORS[collections.length % COLLECTION_COLORS.length]!.id,
          }}
          strings={t.collectionSheet}
          onClose={closeCreate}
          onSaved={(c) => router.push(`/library/collections/${c.id}`)}
        />
      )}

      {/* Search filters both tabs. */}
      <div style={{ padding: "12px 20px 0" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 12,
              color: "var(--c-soft)",
              display: "inline-flex",
              pointerEvents: "none",
            }}
          >
            <Search size={16} />
          </span>
          <input
            aria-label={t.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            style={{
              width: "100%",
              padding: "11px 40px",
              borderRadius: "var(--r-lg)",
              border: "none",
              boxShadow: "inset 0 0 0 1.5px var(--c-line)",
              background: "#fff",
              fontFamily: "var(--font-sans)",
              fontSize: 16,
              color: "var(--c-text)",
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t.clearSearch}
              className="vr-press"
              style={{
                position: "absolute",
                right: 8,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--c-card-soft)",
                border: "none",
                color: "var(--c-muted)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Close size={14} />
            </button>
          )}
        </div>
      </div>

      {tab === "all" && verses.length > 0 && (
        <div
          style={{
            padding: "10px 20px 0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", gap: 6, overflowX: "auto", flex: 1 }}>
            {filters.map((f) => {
              const sel = status === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatus(f.id)}
                  aria-pressed={sel}
                  className="vr-press"
                  style={{
                    flexShrink: 0,
                    padding: "7px 12px",
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    background: sel ? "var(--c-indigo-50)" : "#fff",
                    color: sel ? "var(--c-indigo-700)" : "var(--c-muted)",
                    boxShadow: sel ? "none" : "inset 0 0 0 1.5px var(--c-line)",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label={t.sortRecent}
            style={{
              flexShrink: 0,
              padding: "8px 10px",
              borderRadius: "var(--r-md)",
              border: "none",
              boxShadow: "inset 0 0 0 1.5px var(--c-line)",
              background: "#fff",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--c-text)",
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            <option value="recent">{t.sortRecent}</option>
            <option value="alpha">{t.sortAlpha}</option>
            <option value="mastery">{t.sortLeastMastered}</option>
          </select>
        </div>
      )}

      {/* Collection chips (specs.md §6.3). Single-select: tapping the active
          chip clears the filter. Hidden when there is nothing to narrow. */}
      {tab === "all" && verses.length > 0 && collections.length > 0 && (
        <div
          style={{
            padding: "8px 20px 0",
            display: "flex",
            gap: 6,
            overflowX: "auto",
          }}
        >
          {collections.map((entry) => {
            const c = entry.collection;
            const palette =
              COLLECTION_COLORS.find((p) => p.id === c.colorKey) ??
              COLLECTION_COLORS[0]!;
            const sel = collectionFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={sel}
                onClick={() => setCollectionFilter(sel ? null : c.id)}
                className="vr-press"
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  background: sel ? palette.bg : "#fff",
                  color: sel ? palette.fg : "var(--c-muted)",
                  boxShadow: sel ? "none" : "inset 0 0 0 1.5px var(--c-line)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: palette.dot,
                    flexShrink: 0,
                  }}
                />
                {c.name}
              </button>
            );
          })}
          {hasUngrouped && (
            <button
              type="button"
              aria-pressed={collectionFilter === UNGROUPED}
              onClick={() =>
                setCollectionFilter(
                  collectionFilter === UNGROUPED ? null : UNGROUPED,
                )
              }
              className="vr-press"
              style={{
                flexShrink: 0,
                padding: "7px 12px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                background:
                  collectionFilter === UNGROUPED ? "var(--c-indigo-50)" : "#fff",
                color:
                  collectionFilter === UNGROUPED
                    ? "var(--c-indigo-700)"
                    : "var(--c-muted)",
                boxShadow:
                  collectionFilter === UNGROUPED
                    ? "none"
                    : "inset 0 0 0 1.5px var(--c-line)",
              }}
            >
              {t.filterUngrouped}
            </button>
          )}
        </div>
      )}

      {tab === "collections" ? (
        collections.length === 0 ? (
          <EmptyCard
            title={t.emptyCollectionsTitle}
            body={t.emptyCollectionsBody}
            ctaLabel={t.createFirst}
            onCta={() => setCreating(true)}
          />
        ) : filteredCollections.length === 0 ? (
          <NoResults text={t.noResults} />
        ) : (
          <section
            className="vr-stagger vr-collection-grid"
            style={{ padding: 20, display: "grid", gap: 12 }}
          >
            {filteredCollections.map((entry) => (
              <CollectionCard
                key={entry.collection.id}
                collection={entry.collection}
                sample={entry.sample}
                countLabel={T[locale].versesCount(entry.count)}
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
            <NoResults text={t.noResults} />
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
                  more: t.more,
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

function NoResults({ text }: { text: string }) {
  return (
    <p
      style={{
        margin: "28px 20px",
        color: "var(--c-muted)",
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        textAlign: "center",
        fontSize: 14,
      }}
    >
      {text}
    </p>
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
      className="vr-press"
      style={{
        padding: "8px 16px",
        minHeight: 38,
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

// The call to action is a link (add a verse) or a button (create a
// collection in place).
function EmptyCard({
  title,
  body,
  ctaLabel,
  ctaHref,
  onCta,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref?: Route;
  onCta?: () => void;
}) {
  const ctaStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "11px 20px",
    borderRadius: 999,
    background: "var(--brand-primary)",
    color: "#fff",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    marginTop: body ? 0 : 16,
    boxShadow: "0 8px 20px rgb(var(--card-indigo-rgb) / 0.35)",
  };
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
      {onCta ? (
        <button type="button" onClick={onCta} className="vr-press" style={ctaStyle}>
          {ctaLabel}
        </button>
      ) : (
        <Link href={ctaHref ?? "/verses/new"} className="vr-press" style={ctaStyle}>
          {ctaLabel}
        </Link>
      )}
    </section>
  );
}
