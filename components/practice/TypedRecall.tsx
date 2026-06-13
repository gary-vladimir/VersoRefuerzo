"use client";

// Typed-recall sub-flow (specs.md §15.2). Used inside Classic mode when the
// user taps `Escribirlo` instead of `Revelar verso`. The user types the
// verse from memory; we compare tolerantly, auto-grade, and surface the
// four quality buttons with the auto-graded one highlighted so the user
// can override (every grade is logged).
//
// Compares against the *currently practiced* text — in chunked Classic that
// means the chunk shown for this rep (specs.md §15.7). The full reveal of
// the canonical text is shown after submit so the user can spot the words
// they missed.

import { useState } from "react";
import { tolerantCompare, type CompareResult } from "@/lib/bible/compare";
import { play } from "@/lib/sounds/player";
import { QualityButtons } from "./QualityButtons";
import type { Quality } from "@/lib/srs/sm2";
import type { SrsState } from "@/db/schema";

type Strings = {
  prompt: string;
  placeholder: string;
  submit: string;
  matchPercent: (n: number) => string;
  autoGraded: string;
  again: string;
  hard: string;
  good: string;
  easy: string;
  cancel: string;
  yourEntry: string;
  canonical: string;
};

type Props = {
  canonicalText: string;
  srs: SrsState;
  locale: "es" | "en";
  disabled?: boolean;
  onCancel: () => void;
  onGrade: (q: Quality) => void;
  strings: Strings;
};

export function TypedRecall({
  canonicalText,
  srs,
  locale,
  disabled,
  onCancel,
  onGrade,
  strings: t,
}: Props) {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);

  function submit() {
    if (!draft.trim()) return;
    const r = tolerantCompare(draft, canonicalText);
    setResult(r);
    play(r.quality >= 3 ? "pluck" : "thud");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        width: "100%",
      }}
    >
      {!result ? (
        <>
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--c-text)",
            }}
          >
            {t.prompt}
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t.placeholder}
            rows={6}
            autoFocus
            autoCapitalize="sentences"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "var(--r-lg)",
              border: "none",
              boxShadow: "inset 0 0 0 1.5px var(--c-line)",
              background: "#fff",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              // 16px keeps iOS Safari from auto-zooming the field on focus.
              fontSize: 16,
              lineHeight: 1.5,
              color: "var(--c-text)",
              resize: "none",
            }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onCancel}
              className="vr-press"
              style={secondaryButtonStyle}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim()}
              className="vr-press"
              style={{
                ...primaryButtonStyle,
                opacity: draft.trim() ? 1 : 0.6,
                cursor: draft.trim() ? "pointer" : "not-allowed",
              }}
            >
              {t.submit}
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            className="vr-fade-up"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span
              className="vr-count-pop"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 22,
                color:
                  result.quality >= 4
                    ? "var(--c-emerald-500)"
                    : result.quality === 3
                      ? "var(--c-orange-500)"
                      : "var(--c-rose-500)",
              }}
            >
              {t.matchPercent(Math.round(result.similarity * 100))}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--c-muted)",
                fontWeight: 600,
              }}
            >
              {t.autoGraded}
            </span>
          </div>

          <DiffPanel result={result} locale={locale} labels={{ yourEntry: t.yourEntry, canonical: t.canonical }} />

          <QualityButtons
            srs={srs}
            locale={locale}
            disabled={disabled}
            onGrade={onGrade}
            highlightQuality={result.quality}
            labels={{ again: t.again, hard: t.hard, good: t.good, easy: t.easy }}
          />
        </>
      )}
    </div>
  );
}

function DiffPanel({
  result,
  locale,
  labels,
}: {
  result: CompareResult;
  locale: "es" | "en";
  labels: { yourEntry: string; canonical: string };
}) {
  void locale;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div>
        <div style={smallLabelStyle}>{labels.yourEntry}</div>
        <div style={diffBoxStyle}>
          {result.typedTokens.length > 0
            ? result.typedTokens.join(" ")
            : "—"}
        </div>
      </div>
      <div>
        <div style={smallLabelStyle}>{labels.canonical}</div>
        <div style={diffBoxStyle}>
          {result.canonicalTokens.map((tok, i) => (
            <span
              key={`${tok}-${i}`}
              style={{
                display: "inline-block",
                padding: "1px 4px",
                margin: "1px 1px",
                borderRadius: 4,
                background: result.matchedMask[i]
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(244,63,94,0.18)",
                color: result.matchedMask[i] ? "var(--c-emerald-500)" : "var(--c-rose-500)",
                // Non-color cue (WCAG): missed words are underlined too.
                textDecoration: result.matchedMask[i] ? "none" : "underline wavy",
                textUnderlineOffset: 2,
                fontWeight: 600,
              }}
            >
              {tok}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  height: 44,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "var(--brand-primary)",
  color: "#fff",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  flex: 1,
  height: 44,
  border: "none",
  borderRadius: "var(--r-full)",
  background: "#fff",
  color: "var(--c-text)",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "var(--shadow-xs)",
};

const smallLabelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 800,
  color: "var(--c-muted)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 4,
};

const diffBoxStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "var(--r-md)",
  padding: "10px 12px",
  fontFamily: "var(--font-serif)",
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--c-text)",
  boxShadow: "var(--shadow-xs)",
};
