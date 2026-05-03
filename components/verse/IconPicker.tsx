"use client";

import { VERSE_ICON_IDS, type VerseIconId, type CardColorId } from "@/lib/catalog";
import { VerseIcon } from "@/components/icons/VerseIcons";

export function IconPicker({
  value,
  color,
  onChange,
}: {
  value: VerseIconId;
  color: CardColorId;
  onChange: (id: VerseIconId) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Ícono"
      style={{
        background: "#fff",
        borderRadius: "var(--r-lg)",
        padding: 10,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gap: 6,
      }}
    >
      {VERSE_ICON_IDS.map((id) => {
        const sel = id === value;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={sel}
            aria-label={id}
            onClick={() => onChange(id)}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 10,
              background: sel ? `var(--card-${color}-bg)` : "var(--c-bg)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: sel ? `0 4px 10px var(--card-${color}-solid)50` : "none",
              transform: sel ? "scale(1.08)" : "scale(1)",
              transition: "all .2s cubic-bezier(.2,.8,.2,1)",
              cursor: "pointer",
              color: sel ? "#fff" : "var(--c-muted)",
            }}
          >
            <VerseIcon id={id} size={18} strokeWidth={2.3} />
          </button>
        );
      })}
    </div>
  );
}
