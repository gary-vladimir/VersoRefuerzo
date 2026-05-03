"use client";

import { CARD_COLORS, type CardColorId } from "@/lib/catalog";

export function ColorPicker({
  value,
  onChange,
}: {
  value: CardColorId;
  onChange: (id: CardColorId) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Color"
      style={{ display: "flex", gap: 8 }}
    >
      {CARD_COLORS.map((c) => {
        const sel = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={sel}
            aria-label={c.labelEs}
            onClick={() => onChange(c.id)}
            style={{
              flex: 1,
              aspectRatio: "1 / 1",
              borderRadius: 12,
              background: `var(--card-${c.id}-bg)`,
              cursor: "pointer",
              border: "none",
              boxShadow: sel
                ? `0 0 0 3px #fff, 0 0 0 5px var(--card-${c.id}-solid), 0 8px 18px var(--card-${c.id}-solid)50`
                : "0 1px 2px rgba(0,0,0,0.06)",
              transform: sel ? "scale(1.06)" : "scale(1)",
              transition: "all .25s cubic-bezier(.2,.8,.2,1)",
            }}
          />
        );
      })}
    </div>
  );
}
