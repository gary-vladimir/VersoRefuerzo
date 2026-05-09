"use client";

// Verse Match (specs.md §6.4.3 + §15.4 + §16.7).
//
// 4–6 reference cards on the left, 4–6 hints on the right (shuffled). User
// taps one in each column; correct pairs lock + dim, wrong pairs flash
// red and consume an intento. Each successful match POSTs a session for
// the matched verse with quality 4; each failed pair POSTs sessions for
// both involved verses with quality 2 (per §6.4.3 + §15.4 — the verses
// involved are graded, not all verses in the round).
//
// Recognition mode → server applies `applyRecognitionTouch` only.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isCardColor, isVerseIcon, type CardColorId, type VerseIconId } from "@/lib/catalog";
import { formatDisplay } from "@/lib/bible/reference";
import { wordsOnly } from "@/lib/bible/tokenize";
import { VerseIcon } from "@/components/icons/VerseIcons";
import type { Verse } from "@/db/schema";

const STARTING_INTENTOS = 3;

type Strings = {
  niceTry: string;
  playAgain: string;
  backHub: string;
  exit: string;
  matchedAll: string;
  ranOut: string;
  references: string;
  hints: string;
};

type Props = {
  verses: Array<{ verse: Verse; text: string; copyright: string | null }>;
  locale: "es" | "en";
  strings: Strings;
};

type Side = "left" | "right";

export function VerseMatch({ verses, locale, strings: t }: Props) {
  const router = useRouter();

  // Build the hint column: prefer the user's own hint, fall back to the
  // first 3 words of the cached text per spec §6.4.3.
  const items = useMemo(
    () =>
      verses.map(({ verse, text }) => {
        const fallback = wordsOnly(text).slice(0, 3).join(" ");
        return {
          id: verse.id,
          verse,
          hint: (verse.hint?.trim() || fallback || "—") + "…",
        };
      }),
    [verses],
  );

  // Right column starts in a fixed shuffle; we keep the order stable
  // across renders so the user isn't tracking a moving target.
  const rightOrderRef = useRef<string[] | null>(null);
  if (rightOrderRef.current === null) {
    rightOrderRef.current = shuffle(items.map((i) => i.id));
  }

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [intentos, setIntentos] = useState(STARTING_INTENTOS);
  const [wrongFlash, setWrongFlash] = useState<{ left: string; right: string } | null>(null);
  const [done, setDone] = useState<"win" | "lose" | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef<Set<string>>(new Set());

  function postPair(verseId: string, quality: 2 | 4) {
    const key = `${verseId}|${Date.now()}|${quality}`;
    if (submittedRef.current.has(key)) return;
    submittedRef.current.add(key);
    fetch("/api/practice/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        verseId,
        mode: "match",
        quality,
        outcome: quality === 4 ? "correct" : "incorrect",
        durationMs: Date.now() - startedAtRef.current,
        usedHint: false,
      }),
    }).catch(() => {});
  }

  function tryResolve(left: string, right: string) {
    if (left === right) {
      setMatched((m) => new Set([...m, left]));
      postPair(left, 4);
    } else {
      setWrongFlash({ left, right });
      window.setTimeout(() => setWrongFlash(null), 320);
      setIntentos((n) => n - 1);
      postPair(left, 2);
      if (left !== right) postPair(right, 2);
    }
    setSelectedLeft(null);
    setSelectedRight(null);
  }

  function pick(side: Side, id: string) {
    if (done || matched.has(id)) return;
    if (side === "left") {
      const next = selectedLeft === id ? null : id;
      setSelectedLeft(next);
      if (next && selectedRight) tryResolve(next, selectedRight);
    } else {
      const next = selectedRight === id ? null : id;
      setSelectedRight(next);
      if (next && selectedLeft) tryResolve(selectedLeft, next);
    }
  }

  useEffect(() => {
    if (done) return;
    if (matched.size === items.length && items.length > 0) setDone("win");
    else if (intentos <= 0) setDone("lose");
  }, [matched, intentos, items.length, done]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(180deg, var(--card-sky-tint) 0%, var(--c-bg) 50%)",
        paddingBottom: 32,
        fontFamily: "var(--font-sans)",
      }}
    >
      <header
        style={{
          padding: "32px 16px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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

      <section
        style={{
          padding: "0 16px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div style={columnHeaderStyle}>{t.references}</div>
        <div style={columnHeaderStyle}>{t.hints}</div>

        {items.map((it) => {
          const isMatched = matched.has(it.id);
          const isSelected = selectedLeft === it.id;
          const isWrong = wrongFlash?.left === it.id;
          const color: CardColorId = isCardColor(it.verse.color) ? it.verse.color : "indigo";
          const icon: VerseIconId = isVerseIcon(it.verse.icon) ? it.verse.icon : "bible";
          return (
            <button
              key={`L-${it.id}`}
              type="button"
              disabled={!!done || isMatched}
              onClick={() => pick("left", it.id)}
              style={{
                ...cellStyle,
                background: isMatched ? "var(--c-card-soft)" : "#fff",
                opacity: isMatched ? 0.45 : 1,
                boxShadow: isWrong
                  ? "0 0 0 2px var(--c-rose-500)"
                  : isSelected
                    ? "0 0 0 2px var(--c-indigo-600)"
                    : "var(--shadow-xs)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: `var(--card-${color}-bg)`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <VerseIcon id={icon} size={16} color="#fff" strokeWidth={2.4} />
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 13,
                  letterSpacing: "-0.2px",
                  textAlign: "left",
                  color: "var(--c-text)",
                }}
              >
                {formatDisplay(it.verse.canonicalRef, locale)}
              </span>
            </button>
          );
        })}

        {/* Right column rendered in its stable shuffle. */}
        {rightOrderRef.current!.map((rid) => {
          const it = items.find((i) => i.id === rid)!;
          const isMatched = matched.has(rid);
          const isSelected = selectedRight === rid;
          const isWrong = wrongFlash?.right === rid;
          return (
            <button
              key={`R-${rid}`}
              type="button"
              disabled={!!done || isMatched}
              onClick={() => pick("right", rid)}
              style={{
                ...cellStyle,
                background: isMatched ? "var(--c-card-soft)" : "#fff",
                opacity: isMatched ? 0.45 : 1,
                boxShadow: isWrong
                  ? "0 0 0 2px var(--c-rose-500)"
                  : isSelected
                    ? "0 0 0 2px var(--c-indigo-600)"
                    : "var(--shadow-xs)",
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontSize: 13,
                color: "var(--c-text)",
                lineHeight: 1.4,
                gridColumn: 2,
              }}
            >
              {it.hint}
            </button>
          );
        })}
      </section>

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
            {done === "win" ? t.matchedAll : t.ranOut}
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
    </main>
  );
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

const columnHeaderStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  color: "var(--c-muted)",
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const cellStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "var(--r-xl)",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  transition: "box-shadow .2s, opacity .25s",
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
