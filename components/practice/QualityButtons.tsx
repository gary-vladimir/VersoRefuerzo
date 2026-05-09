"use client";

// Four post-reveal quality buttons (specs.md §16.4).
// Always renders all four; the predicted-interval label under each label
// comes from `previewIntervals` so the user sees the spacing impact before
// tapping. Per §16.5, hint usage does NOT cap any of them.

import { previewIntervals, type Quality } from "@/lib/srs/sm2";
import type { SrsState } from "@/db/schema";

type Props = {
  srs: SrsState;
  locale: "es" | "en";
  disabled?: boolean;
  onGrade: (q: Quality) => void;
  labels: { again: string; hard: string; good: string; easy: string };
  // When set, the matching button is visually emphasized as the system's
  // suggestion (typed-recall auto-grade per §15.2). The user can still
  // tap any button to override.
  highlightQuality?: Quality;
};

export function QualityButtons({
  srs,
  locale,
  disabled,
  onGrade,
  labels,
  highlightQuality,
}: Props) {
  const preview = previewIntervals(srs, locale);
  const cells: Array<{
    label: string;
    sub: string;
    quality: Quality;
    edge: string;
    icon: string;
  }> = [
    { label: labels.again, sub: preview.again, quality: 1, edge: "var(--c-rose-500)", icon: "✗" },
    { label: labels.hard,  sub: preview.hard,  quality: 3, edge: "var(--c-orange-500)", icon: "🤔" },
    { label: labels.good,  sub: preview.good,  quality: 4, edge: "var(--c-indigo-600)", icon: "👍" },
    { label: labels.easy,  sub: preview.easy,  quality: 5, edge: "var(--c-emerald-500)", icon: "✨" },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 6,
      }}
    >
      {cells.map((c) => {
        const suggested = highlightQuality === c.quality;
        return (
        <button
          key={c.quality}
          type="button"
          disabled={disabled}
          onClick={() => onGrade(c.quality)}
          aria-label={`${c.label} (${c.sub})`}
          aria-pressed={suggested || undefined}
          style={{
            background: suggested ? `${c.edge}15` : "#fff",
            borderRadius: "var(--r-lg)",
            padding: "12px 4px",
            boxShadow: suggested
              ? `0 0 0 2px ${c.edge}, var(--shadow-sm)`
              : "var(--shadow-sm)",
            textAlign: "center",
            border: "none",
            borderTop: `3px solid ${c.edge}`,
            cursor: disabled ? "wait" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "transform .12s, box-shadow .15s",
          }}
        >
          <div style={{ fontSize: 18 }}>{c.icon}</div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              color: "var(--c-text)",
              marginTop: 4,
            }}
          >
            {c.label}
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--c-muted)",
              marginTop: 1,
              fontWeight: 600,
            }}
          >
            {c.sub}
          </div>
        </button>
        );
      })}
    </div>
  );
}
