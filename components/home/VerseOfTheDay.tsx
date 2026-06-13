// "Verso del día" — a single verse that rotates deterministically once per
// local day (see lib/streak/localDayNumber). A gentle daily nudge to revisit
// a verse; tapping opens its Card View. Server-renderable.

import Link from "next/link";
import { isCardColor, isVerseIcon } from "@/lib/catalog";
import { formatDisplay } from "@/lib/bible/reference";
import { VerseIcon } from "@/components/icons/VerseIcons";
import { T, type Locale } from "@/lib/i18n/strings";
import type { Verse } from "@/db/schema";

export function VerseOfTheDay({
  verse,
  textPreview,
  locale,
}: {
  verse: Verse;
  textPreview: string | null;
  locale: Locale;
}) {
  const t = T[locale];
  const color = isCardColor(verse.color) ? verse.color : "indigo";
  const icon = isVerseIcon(verse.icon) ? verse.icon : "bible";
  const refDisplay = formatDisplay(verse.canonicalRef, locale);

  return (
    <Link
      href={`/verses/${verse.id}`}
      className="vr-lift"
      style={{
        display: "block",
        textDecoration: "none",
        color: "#fff",
        background: `var(--card-${color}-bg)`,
        borderRadius: "var(--r-2xl)",
        padding: 16,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 14px 32px rgb(var(--card-${color}-rgb) / 0.4)`,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 85% 0%, rgba(255,255,255,0.25), transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: "rgba(255,255,255,0.2)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
          }}
        >
          <VerseIcon id={icon} size={17} color="#fff" strokeWidth={2.3} />
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: "uppercase",
            opacity: 0.9,
          }}
        >
          {t.verseOfTheDay}
        </span>
      </div>

      <div
        style={{
          position: "relative",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: "-0.3px",
        }}
      >
        {refDisplay}
      </div>

      {textPreview && (
        <p
          style={{
            position: "relative",
            margin: "6px 0 0",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 13,
            lineHeight: 1.45,
            opacity: 0.92,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {textPreview}
        </p>
      )}
    </Link>
  );
}
