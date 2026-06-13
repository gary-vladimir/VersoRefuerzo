"use client";

// Four post-reveal quality buttons (specs.md §16.4).
// Always renders all four; the predicted-interval label under each label
// comes from `previewIntervals` so the user sees the spacing impact before
// tapping. Per §16.5, hint usage does NOT cap any of them.

import { useState } from "react";
import { previewIntervals, type Quality } from "@/lib/srs/sm2";
import { Check, Close, Sparkles, AlertCircle } from "@/components/icons/UiIcons";
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
  // Remember which button was tapped so the others dim while the grade is
  // saving, making the choice feel committed.
  const [tapped, setTapped] = useState<Quality | null>(null);

  const cells: Array<{
    label: string;
    sub: string;
    quality: Quality;
    edge: string;
    icon: React.ReactNode;
  }> = [
    { label: labels.again, sub: preview.again, quality: 1, edge: "var(--c-rose-500)", icon: <Close size={19} color="var(--c-rose-500)" /> },
    { label: labels.hard, sub: preview.hard, quality: 3, edge: "var(--c-orange-500)", icon: <AlertCircle size={19} color="var(--c-orange-500)" /> },
    { label: labels.good, sub: preview.good, quality: 4, edge: "var(--c-indigo-600)", icon: <Check size={19} color="var(--c-indigo-600)" /> },
    { label: labels.easy, sub: preview.easy, quality: 5, edge: "var(--c-emerald-500)", icon: <Sparkles size={19} color="var(--c-emerald-500)" /> },
  ];

  function handle(q: Quality) {
    setTapped(q);
    onGrade(q);
  }

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
        // While saving: keep the chosen button bright, fade the rest.
        const dimmed = disabled && tapped !== null && tapped !== c.quality;
        return (
          <button
            key={c.quality}
            type="button"
            disabled={disabled}
            onClick={() => handle(c.quality)}
            aria-label={`${c.label} (${c.sub})`}
            aria-pressed={suggested || undefined}
            className="vr-press"
            style={{
              background: suggested ? `${c.edge}15` : "#fff",
              borderRadius: "var(--r-lg)",
              padding: "12px 4px",
              minHeight: 64,
              boxShadow: suggested
                ? `0 0 0 2px ${c.edge}, var(--shadow-sm)`
                : "var(--shadow-sm)",
              textAlign: "center",
              border: "none",
              borderTop: `3px solid ${c.edge}`,
              cursor: disabled ? "wait" : "pointer",
              opacity: dimmed ? 0.35 : 1,
              transition: "transform var(--dur-1), box-shadow .15s, opacity .15s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}>{c.icon}</div>
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
