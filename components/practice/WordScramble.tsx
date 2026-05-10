"use client";

// Word Scramble (specs.md §6.4.2 + §15.4 + §16.7).
//
// One verse per round. Tokens are shuffled into a chip pool; the user taps
// chips in order to fill a drop zone. Correct placements lock; wrong taps
// bounce back and consume an intento. Three intentos per round; running
// out ends the round with neutral copy ("Buen intento — vuelve cuando
// quieras." per §16.7). Recognition-class outcome → server applies a
// `applyRecognitionTouch` ease bump only.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isCardColor, isVerseIcon, type CardColorId, type VerseIconId } from "@/lib/catalog";
import { formatDisplay } from "@/lib/bible/reference";
import { tokenize, type Token } from "@/lib/bible/tokenize";
import { segmentTokens } from "@/lib/srs/scramble";
import { VerseIcon } from "@/components/icons/VerseIcons";
import { play } from "@/lib/sounds/player";
import type { Verse } from "@/db/schema";

const STARTING_INTENTOS = 3;

type Strings = {
  intentos: string;
  good: string;
  partial: string;
  failed: string;
  niceTry: string;
  playAgain: string;
  backHub: string;
  exit: string;
  intentosLeft: (n: number) => string;
  segmentLabel: (current: number, total: number) => string;
  saveFailed: string;
  retry: string;
};

type Props = {
  verse: Verse;
  text: string;
  copyright: string | null;
  locale: "es" | "en";
  strings: Strings;
};

type Chip = { tokenIndex: number; raw: string; correctOrder: number };

export function WordScramble({ verse, text, copyright, locale, strings: t }: Props) {
  const router = useRouter();
  const color: CardColorId = isCardColor(verse.color) ? verse.color : "indigo";
  const icon: VerseIconId = isVerseIcon(verse.icon) ? verse.icon : "bible";
  const refDisplay = formatDisplay(verse.canonicalRef, locale);

  // Segments. Verses ≤ 25 word tokens collapse to a single segment per
  // §6.4.2; longer verses get split into ordered sub-segments at natural
  // punctuation. The user plays them in order with one shared intentos
  // budget for the whole verse.
  const allTokens = useMemo<Token[]>(() => tokenize(text), [text]);
  const segments = useMemo<Token[][]>(() => segmentTokens(allTokens), [allTokens]);

  // Per-segment shuffle, frozen for the lifetime of the component so the
  // pool doesn't reshuffle on React strict-mode double-mount in dev.
  const segmentChipsRef = useRef<Chip[][] | null>(null);
  if (segmentChipsRef.current === null) {
    segmentChipsRef.current = segments.map((segTokens) =>
      shuffle(
        segTokens.map((tok, i) => ({
          tokenIndex: i,
          raw: tok.raw,
          correctOrder: i,
        })),
      ),
    );
  }

  const startedAtRef = useRef<number>(Date.now());
  const submittedRef = useRef(false);

  const [segIdx, setSegIdx] = useState(0);
  const [pool, setPool] = useState<Chip[]>(segmentChipsRef.current![0] ?? []);
  const [placed, setPlaced] = useState<Chip[]>([]);
  const [intentos, setIntentos] = useState(STARTING_INTENTOS);
  const [bouncedIndex, setBouncedIndex] = useState<number | null>(null);
  const [done, setDone] = useState<"win" | "lose" | null>(null);
  const [submitFailed, setSubmitFailed] = useState(false);

  const expectedNext = placed.length;
  const segmentTotal = segments[segIdx]?.length ?? 0;

  function tap(chip: Chip) {
    if (done) return;
    if (chip.correctOrder === expectedNext) {
      play("pluck");
      const nextPlaced = [...placed, chip];
      const nextPool = pool.filter((c) => c !== chip);
      setPlaced(nextPlaced);
      setPool(nextPool);
      // Segment finished?
      if (nextPlaced.length === segmentTotal) {
        const nextSeg = segIdx + 1;
        if (nextSeg >= segments.length) {
          // All segments done → round resolution will fire via useEffect.
        } else {
          // Brief pause so the user sees the last placement before we
          // swap in the next segment.
          window.setTimeout(() => {
            setSegIdx(nextSeg);
            setPool(segmentChipsRef.current![nextSeg] ?? []);
            setPlaced([]);
          }, 350);
        }
      }
    } else {
      play("thud");
      setBouncedIndex(chip.correctOrder);
      window.setTimeout(() => setBouncedIndex(null), 280);
      setIntentos((n) => n - 1);
    }
  }

  // End-of-round resolution. Win when we've placed all tokens of the last
  // segment; lose when intentos runs out.
  useEffect(() => {
    if (done) return;
    const isLastSegment = segIdx === segments.length - 1;
    if (isLastSegment && placed.length === segmentTotal && segmentTotal > 0) {
      setDone("win");
    } else if (intentos <= 0) {
      setDone("lose");
    }
  }, [placed.length, intentos, segIdx, segments.length, segmentTotal, done]);

  async function postSession() {
    const durationMs = Date.now() - startedAtRef.current;
    const lostIntentos = STARTING_INTENTOS - intentos;
    let outcome: "correct" | "partial" | "incorrect";
    let quality: number;
    if (done === "win" && lostIntentos === 0) {
      outcome = "correct";
      quality = 5;
    } else if (done === "win") {
      outcome = "partial";
      quality = 3;
    } else {
      outcome = "incorrect";
      quality = 1;
    }
    try {
      const res = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          verseId: verse.id,
          mode: "scramble",
          quality,
          outcome,
          durationMs,
          usedHint: false,
        }),
      });
      setSubmitFailed(!res.ok);
    } catch {
      setSubmitFailed(true);
    }
  }

  // POST session once when the round ends. The submittedRef guard makes
  // strict-mode dev double-mount safe; failures clear the guard so the
  // retry button can re-invoke postSession. The chime/flame cues fire
  // on the resolution itself — even if the POST then fails, the round
  // happened locally and deserves the audio confirmation.
  useEffect(() => {
    if (!done || submittedRef.current) return;
    submittedRef.current = true;
    play(done === "win" ? "chime" : "thud");
    void postSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function retry() {
    setSubmitFailed(false);
    void postSession();
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background:
          "linear-gradient(180deg, var(--card-emerald-tint) 0%, var(--c-bg) 50%)",
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
                letterSpacing: "-0.2px",
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
          aria-label={t.intentosLeft(intentos)}
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
            fontSize: 14,
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

      {segments.length > 1 && (
        <p
          style={{
            margin: "0 16px 8px",
            fontSize: 10,
            color: "var(--c-muted)",
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            textAlign: "right",
          }}
        >
          {t.segmentLabel(segIdx + 1, segments.length)}
        </p>
      )}

      {/* Drop zone — placed chips. */}
      <section
        style={{
          margin: "0 16px",
          padding: 14,
          background: "#fff",
          borderRadius: "var(--r-2xl)",
          boxShadow: "var(--shadow-sm)",
          minHeight: 120,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignContent: "flex-start",
        }}
      >
        {placed.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--c-soft)",
              fontStyle: "italic",
              fontFamily: "var(--font-serif)",
              alignSelf: "center",
            }}
          >
            {locale === "es"
              ? "Toca las palabras en el orden correcto."
              : "Tap the words in the correct order."}
          </p>
        ) : (
          placed.map((c, i) => (
            <span key={i} className="vr-pop" style={placedChipStyle(color)}>
              {c.raw}
            </span>
          ))
        )}
      </section>

      {/* Pool — shuffled chips. */}
      <section
        style={{
          margin: "16px 16px 0",
          padding: 14,
          background: "var(--c-card-soft)",
          borderRadius: "var(--r-2xl)",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          minHeight: 80,
          alignContent: "flex-start",
        }}
      >
        {pool.map((c) => (
          <button
            key={c.correctOrder}
            type="button"
            disabled={!!done}
            onClick={() => tap(c)}
            style={{
              ...poolChipStyle,
              transform:
                bouncedIndex === c.correctOrder ? "translateY(-4px)" : "none",
              borderColor:
                bouncedIndex === c.correctOrder
                  ? "var(--c-rose-500)"
                  : "transparent",
            }}
          >
            {c.raw}
          </button>
        ))}
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
                done === "win"
                  ? "var(--c-emerald-500)"
                  : "var(--c-rose-500)",
            }}
          >
            {done === "win"
              ? intentos === STARTING_INTENTOS
                ? t.good
                : t.partial
              : t.failed}
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

function placedChipStyle(color: CardColorId): React.CSSProperties {
  return {
    background: `var(--card-${color}-tint)`,
    color: "var(--c-text)",
    padding: "8px 12px",
    borderRadius: 999,
    fontFamily: "var(--font-serif)",
    fontSize: 14,
    fontWeight: 600,
    boxShadow: "var(--shadow-xs)",
  };
}

const poolChipStyle: React.CSSProperties = {
  background: "#fff",
  border: "1.5px solid transparent",
  padding: "8px 12px",
  borderRadius: 999,
  fontFamily: "var(--font-serif)",
  fontSize: 14,
  fontWeight: 600,
  boxShadow: "var(--shadow-xs)",
  cursor: "pointer",
  transition: "transform .2s, border-color .2s",
  color: "var(--c-text)",
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
