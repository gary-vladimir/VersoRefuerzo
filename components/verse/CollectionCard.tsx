// Library "Colecciones" tile (specs.md §6.3 / DesignBundle ScreenLibrary).
// Server-renderable; takes a collection plus a small slice of its member
// verses to compose the layered "stack of cards" preview.

import Link from "next/link";
import { COLLECTION_COLORS } from "@/lib/catalog";
import { isCardColor, isVerseIcon } from "@/lib/catalog";
import { VerseIcon } from "@/components/icons/VerseIcons";
import type { Collection, Verse } from "@/db/schema";

type Props = {
  collection: Collection;
  sample: Verse[];
  countLabel: string;
};

export function CollectionCard({ collection, sample, countLabel }: Props) {
  const preset =
    COLLECTION_COLORS.find((p) => p.id === collection.colorKey) ?? COLLECTION_COLORS[0]!;
  const stack = sample.slice(0, 3);
  return (
    <Link
      href={`/library/collections/${collection.id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        background: "#fff",
        borderRadius: "var(--r-2xl)",
        padding: 14,
        boxShadow: "var(--shadow-sm)",
        position: "relative",
        overflow: "hidden",
        display: "block",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: preset.bg,
          opacity: 0.5,
        }}
      />

      <div style={{ display: "flex", height: 64, position: "relative", marginBottom: 12 }}>
        {stack.map((v, i) => {
          const color = isCardColor(v.color) ? v.color : "indigo";
          const icon = isVerseIcon(v.icon) ? v.icon : "bible";
          return (
            <div
              key={v.id}
              style={{
                width: 46,
                height: 60,
                borderRadius: 10,
                background: `var(--card-${color}-bg)`,
                position: "absolute",
                left: i * 20,
                top: i * 2,
                transform: `rotate(${(i - 1) * 4}deg)`,
                boxShadow: "0 6px 12px rgba(0,0,0,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #fff",
              }}
            >
              <VerseIcon id={icon} size={20} color="#fff" strokeWidth={2.2} />
            </div>
          );
        })}
        {stack.length === 0 && (
          <span
            style={{
              alignSelf: "center",
              fontSize: 12,
              color: "var(--c-soft)",
              fontStyle: "italic",
              fontFamily: "var(--font-serif)",
            }}
          >
            —
          </span>
        )}
      </div>

      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 16,
          color: "var(--c-text)",
          position: "relative",
          letterSpacing: "-0.2px",
        }}
      >
        {collection.name}
      </div>
      {collection.description && (
        <div
          style={{
            fontSize: 11,
            color: "var(--c-muted)",
            marginTop: 2,
            position: "relative",
          }}
        >
          {collection.description}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            background: preset.bg,
            color: preset.fg,
            padding: "3px 8px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: preset.dot,
              display: "inline-block",
            }}
          />
          {countLabel}
        </span>
      </div>
    </Link>
  );
}
