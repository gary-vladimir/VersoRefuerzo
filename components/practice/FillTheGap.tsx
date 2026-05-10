"use client";

// Fill the Gap (specs.md §6.4.4 + §15.3 + §15.4 + §16.7).
//
// One verse per round. The cloze module decides which words become blanks
// based on the verse's repetition count (progressive density §15.3). Each
// blank is solved in left-to-right order via a 4-button multiple choice.
// "Mostrar primera letra" reveals the first character of the current
// blank's correct word and flips `usedHint` for the round.
//
// Distractors are drawn from a per-blank precomputed pool the server
// provides (other verses in the user's library, or the curated fallback
// when the library is too small). The component stays UI-only.
//
// Outcome mapping per §16.5 (which supersedes the older §6.4.4 cap):
//   correct → quality 5 / outcome 'correct' (regardless of hint use)
//   failed  → quality 1 / outcome 'incorrect'
// `usedHint` is recorded on the row so the §15.5 mastered guard can
// filter hinted sessions out of the unaided-recall window. Density >= 50%
// gets server-side reclassified into RECALL automatically.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isCardColor, isVerseIcon, type CardColorId, type VerseIconId } from "@/lib/catalog";
import { formatDisplay } from "@/lib/bible/reference";
import { VerseIcon } from "@/components/icons/VerseIcons";
import { play } from "@/lib/sounds/player";
import type { Verse } from "@/db/schema";
import type { BlankPlan } from "@/lib/srs/cloze";

const STARTING_INTENTOS = 3;

type Strings = {
  niceTry: string;
  playAgain: string;
  backHub: string;
  exit: string;
  showFirstLetter: string;
  good: string;
  failed: string;
  saveFailed: string;
  retry: string;
};

type Props = {
  verse: Verse;
  copyright: string | null;
  plan: BlankPlan;
  // For each blank index in plan.blankIndices, three pre-shuffled distractors
  // (already excluding the correct word). The component picks a final
  // 4-option order client-side.
  distractorsPerBlank: string[][];
  locale: "es" | "en";
  strings: Strings;
};

export function FillTheGap({
  verse,
  copyright,
  plan,
  distractorsPerBlank,
  locale,
  strings: t,
}: Props) {
  const router = useRouter();
  const color: CardColorId = isCardColor(verse.color) ? verse.color : "indigo";
  const icon: VerseIconId = isVerseIcon(verse.icon) ? verse.icon : "bible";
  const refDisplay = formatDisplay(verse.canonicalRef, locale);

  const startedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);

  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [active, setActive] = useState(0); // index into plan.blankIndices
  const [intentos, setIntentos] = useState(STARTING_INTENTOS);
  const [usedHint, setUsedHint] = useState(false);
  const [hintRevealed, setHintRevealed] = useState<Record<number, boolean>>({});
  const [wrongFlash, setWrongFlash] = useState(false);
  const [done, setDone] = useState<"win" | "lose" | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);

  // Prepare the option set for the active blank: correct word + 3
  // distractors, shuffled. We freeze each blank's option order so the
  // user can't re-roll by tapping wrong.
  const optionsCacheRef = useRef<Map<number, string[]>>(new Map());
  const activeOptions = useMemo(() => {
    const cached = optionsCacheRef.current.get(active);
    if (cached) return cached;
    const tokIdx = plan.blankIndices[active];
    if (tokIdx === undefined) return [];
    const correct = plan.tokens[tokIdx]!.word;
    const distractors = (distractorsPerBlank[active] ?? []).slice(0, 3);
    const options = shuffle([correct, ...distractors]);
    optionsCacheRef.current.set(active, options);
    return options;
  }, [active, plan, distractorsPerBlank]);

  function tap(option: string) {
    if (done) return;
    const tokIdx = plan.blankIndices[active]!;
    const correct = plan.tokens[tokIdx]!.word;
    if (eqLoose(option, correct)) {
      play("pluck");
      setSolved((s) => new Set([...s, active]));
      const next = active + 1;
      if (next >= plan.blankIndices.length) {
        setDone("win");
      } else {
        setActive(next);
      }
    } else {
      play("thud");
      setWrongFlash(true);
      window.setTimeout(() => setWrongFlash(false), 280);
      setIntentos((n) => n - 1);
    }
  }

  function showFirstLetter() {
    setHintRevealed((h) => ({ ...h, [active]: true }));
    setUsedHint(true);
  }

  useEffect(() => {
    if (done) return;
    if (intentos <= 0) setDone("lose");
  }, [intentos, done]);

  // POST once when the round resolves.
  // Quality is decoupled from `usedHint` per §16.5: a hinted-but-correct
  // round still grades as a win (quality 5). The `usedHint` flag goes on
  // the session row regardless, and the §15.5 mastered guard already
  // filters hinted rows out of the unaided-recall check downstream.
  async function postSession(): Promise<boolean> {
    const durationMs = Date.now() - startedAtRef.current;
    const outcome: "correct" | "incorrect" = done === "win" ? "correct" : "incorrect";
    const quality = done === "win" ? 5 : 1;
    try {
      const res = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          verseId: verse.id,
          mode: "gap",
          quality,
          outcome,
          durationMs,
          usedHint,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    if (!done || submittedRef.current) return;
    submittedRef.current = true;
    play(done === "win" ? "chime" : "thud");
    void postSession().then((ok) => setSubmitFailed(!ok));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function retry() {
    setSubmitFailed(false);
    void postSession().then((ok) => setSubmitFailed(!ok));
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(180deg, var(--card-violet-tint) 0%, var(--c-bg) 50%)",
        paddingBottom: 32,
        fontFamily: "var(--font-sans)",
      }}
    >
      <header
        style={{
          padding: "32px 16px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/practice")}
          aria-label={t.exit}
          style={iconButtonStyle}
        >
          ×
        </button>
        <div
          style={{
            background: `var(--card-${color}-bg)`,
            color: "#fff",
            borderRadius: "var(--r-xl)",
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            boxShadow: `0 8px 20px var(--card-${color}-solid)40`,
          }}
        >
          <VerseIcon id={icon} size={26} color="#fff" strokeWidth={2.2} />
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              {refDisplay}
            </div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.85,
                marginTop: 2,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {verse.version}
            </div>
          </div>
        </div>
        <span
          style={{
            background: "#fff",
            padding: "8px 12px",
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "var(--shadow-xs)",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 13,
            color: "var(--c-text)",
          }}
        >
          {Array.from({ length: STARTING_INTENTOS }, (_, i) => (
            <span key={i} style={{ opacity: i < intentos ? 1 : 0.25 }}>
              {i < intentos ? "❤" : "♡"}
            </span>
          ))}
        </span>
      </header>

      {/* Verse render — show every token, replacing blank tokens with
          ___ (or the first-letter cue when revealed). The active blank
          is visually emphasized. */}
      <section
        style={{
          margin: "0 16px",
          padding: 18,
          background: "#fff",
          borderRadius: "var(--r-2xl)",
          boxShadow: "var(--shadow-sm)",
          fontFamily: "var(--font-serif)",
          fontSize: 17,
          lineHeight: 1.6,
          color: "var(--c-text)",
        }}
      >
        {plan.tokens.map((tok, i) => {
          const blankIdxArr = plan.blankIndices.indexOf(i);
          if (blankIdxArr < 0) {
            // Render the original raw token and a trailing space for
            // anything except the very last token.
            return (
              <span key={i}>
                {tok.raw}
                {i < plan.tokens.length - 1 ? " " : ""}
              </span>
            );
          }
          const isActive = blankIdxArr === active && !done;
          const isSolved = solved.has(blankIdxArr);
          const isHinted = hintRevealed[blankIdxArr];
          const display = isSolved
            ? tok.raw
            : isHinted
              ? tok.word.charAt(0) + "_".repeat(Math.max(0, tok.word.length - 1)) +
                tok.suffix
              : "_".repeat(tok.word.length) + tok.suffix;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                padding: "0 6px",
                borderRadius: 4,
                background: isSolved
                  ? `var(--card-${color}-tint)`
                  : isActive
                    ? "rgba(99,102,241,0.12)"
                    : "rgba(0,0,0,0.04)",
                color: isSolved
                  ? `var(--card-${color}-solid)`
                  : isActive
                    ? "var(--c-indigo-700)"
                    : "var(--c-soft)",
                fontWeight: 700,
                margin: "0 1px",
                transform: wrongFlash && isActive ? "translateX(2px)" : "none",
                transition: "transform .12s, background .25s",
              }}
            >
              {tok.prefix}
              {display}
            </span>
          );
        })}
      </section>

      {!done && (
        <section
          style={{
            margin: "16px 16px 0",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {activeOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => tap(opt)}
              style={optionButtonStyle}
            >
              {opt}
            </button>
          ))}
          <button
            type="button"
            onClick={showFirstLetter}
            disabled={hintRevealed[active]}
            style={{
              ...hintButtonStyle,
              gridColumn: "1 / -1",
              opacity: hintRevealed[active] ? 0.5 : 1,
            }}
          >
            💡 {t.showFirstLetter}
          </button>
        </section>
      )}

      {done && (
        <section
          className="vr-card-rise"
          style={{
            margin: "20px 16px 0",
            padding: 18,
            borderRadius: "var(--r-2xl)",
            background: "#fff",
            boxShadow: "var(--shadow-md)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              color:
                done === "win" ? "var(--c-emerald-500)" : "var(--c-rose-500)",
            }}
          >
            {done === "win" ? t.good : t.failed}
          </p>
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 13,
              color: "var(--c-muted)",
              fontStyle: "italic",
              fontFamily: "var(--font-serif)",
            }}
          >
            {t.niceTry}
          </p>
          {submitFailed && (
            <p
              role="alert"
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                fontWeight: 700,
                color: "#B91C1C",
              }}
            >
              {t.saveFailed}{" "}
              <button
                type="button"
                onClick={retry}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--c-indigo-700)",
                  cursor: "pointer",
                  textDecoration: "underline",
                  font: "inherit",
                  padding: 0,
                }}
              >
                {t.retry}
              </button>
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => router.refresh()}
              style={primaryActionStyle}
            >
              {t.playAgain}
            </button>
            <Link href="/practice" style={secondaryActionStyle}>
              {t.backHub}
            </Link>
          </div>
        </section>
      )}

      {copyright && (
        <p
          style={{
            margin: "16px 16px 0",
            fontSize: 9,
            color: "var(--c-soft)",
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          {copyright}
        </p>
      )}
    </main>
  );
}

// Compare loosely so an option that differs only in case still counts.
function eqLoose(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const iconButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: "#fff",
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "var(--shadow-xs)",
  color: "var(--c-text)",
  fontSize: 18,
  fontWeight: 800,
  cursor: "pointer",
};

const optionButtonStyle: React.CSSProperties = {
  background: "#fff",
  border: "none",
  padding: "14px 12px",
  borderRadius: "var(--r-xl)",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 15,
  color: "var(--c-text)",
  boxShadow: "var(--shadow-sm)",
  cursor: "pointer",
};

const hintButtonStyle: React.CSSProperties = {
  background: "var(--c-card-soft)",
  color: "var(--c-text)",
  border: "none",
  padding: "10px 14px",
  borderRadius: "var(--r-full)",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  boxShadow: "var(--shadow-xs)",
};

const primaryActionStyle: React.CSSProperties = {
  background: "var(--brand-primary)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--r-full)",
  padding: "10px 18px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryActionStyle: React.CSSProperties = {
  background: "var(--c-card-soft)",
  color: "var(--c-text)",
  textDecoration: "none",
  borderRadius: "var(--r-full)",
  padding: "10px 18px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  display: "inline-block",
};
