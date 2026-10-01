"use client";

// Practice hub body (specs.md §6.4).
//
// Owns the source-pool selector that sits above the five mode tiles:
// Todos / a specific collection / Personalizar. The selection is not stored
// anywhere — it is encoded into each tile's href by practiceSourceQuery, so
// the mode pages stay plain server components and a copied link reproduces
// the same pool.
//
// Tiles are disabled (and explain why) while the chosen pool is incomplete:
// "Colección" with nothing picked, or "Personalizar" with an empty set.

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { COLLECTION_COLORS } from "@/lib/catalog";
import {
  ALL_VERSES,
  MAX_CUSTOM_VERSES,
  practiceSourceQuery,
  type PracticeSource,
} from "@/lib/practice/source";
import { ModeIcon, type ModeName } from "@/components/practice/ModeIcons";
import { Chevron } from "@/components/icons/UiIcons";
import { T } from "@/lib/i18n/strings";

export type HubCollection = { id: string; name: string; colorKey: string; count: number };
export type HubVerse = { id: string; label: string; color: string };

export type HubTile = {
  title: string;
  description: string;
  href: Route;
  mode: ModeName;
  gradient: string;
  // Added to the pool query for this tile only (Classic and First-letter
  // pass `scope=all` so they practice the whole pool, not just what is due).
  extraQuery?: Record<string, string>;
};

export type HubStrings = {
  sourceLabel: string;
  sourceAll: string;
  sourceCollection: string;
  sourceCustom: string;
  sourcePickCollection: string;
  sourcePickVerses: string;
  sourceNoCollections: string;
  sourceNoVerses: string;
  sourceClearSelection: string;
  sourceSelectAll: string;
  sourceNeedsPick: string;
  sourceNeedsCollection: string;
  emptyLibrary: string;
  addVerse: string;
};

type Kind = "all" | "collection" | "custom";

export function PracticeHub({
  tiles,
  collections,
  verses,
  locale,
  strings: s,
}: {
  locale: "es" | "en";
  tiles: HubTile[];
  collections: HubCollection[];
  verses: HubVerse[];
  strings: HubStrings;
}) {
  const [kind, setKind] = useState<Kind>("all");
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);

  const source: PracticeSource = useMemo(() => {
    if (kind === "collection" && collectionId) {
      return { kind: "collection", collectionId };
    }
    if (kind === "custom" && picked.length > 0) {
      return { kind: "custom", verseIds: picked };
    }
    return ALL_VERSES;
  }, [kind, collectionId, picked]);

  // The pool is "incomplete" when the user chose a mode that needs a
  // follow-up choice they have not made yet.
  const blockedReason =
    kind === "collection" && !collectionId
      ? s.sourceNeedsCollection
      : kind === "custom" && picked.length === 0
        ? s.sourceNeedsPick
        : null;

  const query = practiceSourceQuery(source);
  const atMax = picked.length >= MAX_CUSTOM_VERSES;

  // §17.2: with nothing in the library every mode would open empty, so
  // point at the one action that helps instead.
  if (verses.length === 0) {
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
        <p
          style={{
            margin: "0 0 16px",
            color: "var(--c-muted)",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 15,
          }}
        >
          {s.emptyLibrary}
        </p>
        <Link
          href="/verses/new"
          className="vr-press"
          style={{
            display: "inline-block",
            padding: "11px 20px",
            borderRadius: 999,
            background: "var(--brand-primary)",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            boxShadow: "0 8px 20px rgb(var(--card-indigo-rgb) / 0.35)",
          }}
        >
          {s.addVerse}
        </Link>
      </section>
    );
  }

  function toggleVerse(id: string) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_CUSTOM_VERSES) return prev;
      return [...prev, id];
    });
  }

  return (
    <>
      <section style={{ padding: "16px 20px 0" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--r-2xl)",
            boxShadow: "var(--shadow-sm)",
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              color: "var(--c-muted)",
              marginBottom: 8,
            }}
          >
            {s.sourceLabel}
          </div>

          <div role="tablist" aria-label={s.sourceLabel} style={{ display: "flex", gap: 8 }}>
            {(
              [
                ["all", s.sourceAll],
                ["collection", s.sourceCollection],
                ["custom", s.sourceCustom],
              ] as Array<[Kind, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={kind === id}
                onClick={() => setKind(id)}
                className="vr-press"
                style={{
                  flex: 1,
                  border: "1px solid",
                  borderColor: kind === id ? "transparent" : "var(--c-line)",
                  background: kind === id ? "var(--brand-primary)" : "#fff",
                  color: kind === id ? "#fff" : "var(--c-text)",
                  borderRadius: "var(--r-full)",
                  padding: "8px 10px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {kind === "collection" && (
            <div style={{ marginTop: 12 }}>
              {collections.length === 0 ? (
                <Empty text={s.sourceNoCollections} />
              ) : (
                <>
                  <FieldLabel text={s.sourcePickCollection} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {collections.map((c) => {
                      const palette =
                        COLLECTION_COLORS.find((p) => p.id === c.colorKey) ??
                        COLLECTION_COLORS[0]!;
                      const on = collectionId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setCollectionId(on ? null : c.id)}
                          className="vr-press"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            border: "1px solid",
                            borderColor: on ? palette.dot : "var(--c-line)",
                            background: on ? palette.bg : "#fff",
                            color: on ? palette.fg : "var(--c-text)",
                            borderRadius: "var(--r-full)",
                            padding: "7px 12px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
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
                          <span style={{ color: "var(--c-muted)", fontWeight: 500 }}>
                            {c.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {kind === "custom" && (
            <div style={{ marginTop: 12 }}>
              {verses.length === 0 ? (
                <Empty text={s.sourceNoVerses} />
              ) : (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <FieldLabel text={s.sourcePickVerses} noMargin />
                    <button
                      type="button"
                      onClick={() =>
                        setPicked(
                          picked.length > 0
                            ? []
                            : verses.slice(0, MAX_CUSTOM_VERSES).map((v) => v.id),
                        )
                      }
                      style={{
                        border: "none",
                        background: "none",
                        padding: 0,
                        color: "var(--c-indigo-700)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {picked.length > 0 ? s.sourceClearSelection : s.sourceSelectAll}
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      maxHeight: 190,
                      overflowY: "auto",
                    }}
                  >
                    {verses.map((v) => {
                      const on = picked.includes(v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          aria-pressed={on}
                          disabled={!on && atMax}
                          onClick={() => toggleVerse(v.id)}
                          className="vr-press"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            border: "1px solid",
                            borderColor: on ? "var(--c-indigo-700)" : "var(--c-line)",
                            background: on ? "var(--c-bg)" : "#fff",
                            color: "var(--c-text)",
                            borderRadius: "var(--r-full)",
                            padding: "7px 12px",
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: !on && atMax ? "not-allowed" : "pointer",
                            opacity: !on && atMax ? 0.45 : 1,
                          }}
                        >
                          <span
                            aria-hidden
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: `var(--card-${v.color}-solid)`,
                              flexShrink: 0,
                            }}
                          />
                          {v.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    aria-live="polite"
                    style={{ marginTop: 8, fontSize: 12, color: "var(--c-muted)" }}
                  >
                    {T[locale].sourceSelectedCount(picked.length)}
                    {atMax ? ` · ${T[locale].sourceMaxReached(MAX_CUSTOM_VERSES)}` : ""}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      <section
        className="vr-stagger"
        style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
      >
        {blockedReason && (
          <p
            role="status"
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--c-muted)",
              textAlign: "center",
            }}
          >
            {blockedReason}
          </p>
        )}
        {tiles.map((tile) => (
          <ModeTile
            key={tile.title}
            tile={tile}
            query={query}
            disabled={blockedReason !== null}
          />
        ))}
      </section>
    </>
  );
}

function FieldLabel({ text, noMargin }: { text: string; noMargin?: boolean }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "var(--c-muted)",
        marginBottom: noMargin ? 0 : 6,
      }}
    >
      {text}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p style={{ margin: 0, fontSize: 13, color: "var(--c-muted)" }}>{text}</p>;
}

function ModeTile({
  tile,
  query,
  disabled,
}: {
  tile: HubTile;
  query: Record<string, string>;
  disabled: boolean;
}) {
  const body = (
    <>
      <div
        aria-hidden
        style={{
          width: 50,
          height: 50,
          borderRadius: 15,
          background: tile.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
        }}
      >
        <ModeIcon name={tile.mode} size={26} color="#fff" strokeWidth={2.1} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 16,
            color: "var(--c-text)",
            letterSpacing: "-0.2px",
          }}
        >
          {tile.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 2 }}>
          {tile.description}
        </div>
      </div>
      <span
        aria-hidden
        style={{ color: "var(--c-soft)", flexShrink: 0, display: "inline-flex" }}
      >
        <Chevron size={18} />
      </span>
    </>
  );

  const shell: React.CSSProperties = {
    textDecoration: "none",
    color: "inherit",
    background: "#fff",
    borderRadius: "var(--r-2xl)",
    padding: 18,
    boxShadow: "var(--shadow-sm)",
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    textAlign: "left",
    border: "none",
    font: "inherit",
  };

  if (disabled) {
    return (
      <button type="button" disabled className="vr-tile" style={{ ...shell, opacity: 0.5 }}>
        {body}
      </button>
    );
  }

  return (
    <Link
      href={{ pathname: tile.href, query: { ...query, ...tile.extraQuery } }}
      className="vr-tile vr-press"
      style={shell}
    >
      {body}
    </Link>
  );
}
