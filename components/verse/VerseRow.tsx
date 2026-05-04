"use client";

// Slim horizontal verse card used by Library / Todos los versos and the
// collection detail view (specs.md §6.3, §17.5). Renders:
//   - left color stripe driven by the verse's chosen card color
//   - icon tile in that color
//   - reference (locale-aware), version label, and a one-line text preview
//   - mastery bar + percent on the right
//   - overflow menu with Editar + Eliminar
//
// The §17.5 spec also lists `Mover a colección…`; that flow is not in M3 —
// the same change is reachable today through Editar → Colecciones field, so
// shipping a separate move dialog is deferred until the data shows users
// actually want it.
//
// The optional text preview comes from the joined cache row when available;
// callers pass `null` if the cache hasn't been primed yet (the row still
// renders correctly without the preview).

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDisplay } from "@/lib/bible/reference";
import { isCardColor, isVerseIcon } from "@/lib/catalog";
import type { Verse } from "@/db/schema";
import { VerseIcon } from "@/components/icons/VerseIcons";
import { useToast } from "@/components/ui/Toast";

type Strings = {
  edit: string;
  delete: string;
  deleted: string;
  undo: string;
  loading: string;
};

type Props = {
  verse: Verse;
  textPreview: string | null;
  locale: "es" | "en";
  strings: Strings;
};

export function VerseRow({ verse, textPreview, locale, strings }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const color = isCardColor(verse.color) ? verse.color : "indigo";
  const icon = isVerseIcon(verse.icon) ? verse.icon : "bible";
  const refDisplay = formatDisplay(verse.canonicalRef, locale);
  const masteryPct = Math.round((verse.mastery ?? 0) * 100);

  async function handleDelete() {
    setMenuOpen(false);
    const res = await fetch(`/api/verses/${verse.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setHidden(true);
    toast.show({
      message: strings.deleted,
      actionLabel: strings.undo,
      onAction: async () => {
        const r = await fetch(`/api/verses/${verse.id}/restore`, { method: "POST" });
        if (r.ok) {
          setHidden(false);
        } else {
          // Fall back to a refresh so the server view of the world wins.
          router.refresh();
        }
      },
    });
  }

  if (hidden) return null;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--r-xl)",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "var(--shadow-xs)",
        position: "relative",
        overflow: "hidden",
      }}
      className="vr-card-rise"
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: `var(--card-${color}-bg)`,
        }}
      />

      <Link
        href={`/verses/${verse.id}`}
        aria-label={refDisplay}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
          color: "inherit",
          flex: 1,
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `var(--card-${color}-bg)`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 10px var(--card-${color}-solid)30`,
          }}
        >
          <VerseIcon id={icon} size={22} color="#fff" strokeWidth={2.3} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 14,
                color: "var(--c-text)",
                letterSpacing: "-0.2px",
              }}
            >
              {refDisplay}
            </span>
            <span
              style={{
                fontSize: 9,
                color: "var(--c-muted)",
                fontWeight: 700,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
              }}
            >
              {verse.version}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 12,
              color: "var(--c-muted)",
              marginTop: 1,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontStyle: textPreview ? "italic" : "normal",
            }}
          >
            {textPreview ?? strings.loading}
          </div>
        </div>

        <div
          aria-hidden
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            color: `var(--card-${color}-solid)`,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 22,
              height: 3,
              borderRadius: 2,
              background: "var(--c-card-soft)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${masteryPct}%`,
                background: `var(--card-${color}-solid)`,
                borderRadius: 2,
              }}
            />
          </span>
          {masteryPct}%
        </div>
      </Link>

      <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="more"
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--c-soft)",
            fontSize: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⋯
        </button>
        {menuOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 4,
              background: "#fff",
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow-md)",
              minWidth: 160,
              padding: 4,
              zIndex: 5,
            }}
          >
            <Link
              role="menuitem"
              href={`/verses/${verse.id}/edit`}
              onClick={() => setMenuOpen(false)}
              style={menuItemStyle("var(--c-text)")}
            >
              {strings.edit}
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={handleDelete}
              style={{ ...menuItemStyle("#B91C1C"), border: "none", background: "transparent", textAlign: "left", width: "100%", cursor: "pointer" }}
            >
              {strings.delete}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function menuItemStyle(color: string): React.CSSProperties {
  return {
    display: "block",
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "var(--font-sans)",
    fontWeight: 600,
    color,
    textDecoration: "none",
    borderRadius: 8,
  };
}
