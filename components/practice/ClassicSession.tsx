"use client";

// Classic session runtime (specs.md §6.4.1, §16.4).
//
// State machine:
//   queue: QueueItem[]   immutable in-memory copy of what /api/practice/queue returned
//   pos:   index into queue
//   phase: 'front' | 'revealed' | 'submitting' | 'done'
//   hintShown: boolean (orthogonal to grading per §16.5)
//
// Skip (§17.3) splices the current item to the end of the local queue
// without touching the server.
//
// Aloud tip (§15.8) shows on the very first card of the user's first ever
// Classic session, dismissed by tap or by completing the card. We persist
// `hasSeenAloudTip = true` via PATCH /api/me when dismissed so it never
// shows again.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isCardColor, isVerseIcon, type CardColorId, type VerseIconId } from "@/lib/catalog";
import { formatDisplay } from "@/lib/bible/reference";
import { VerseIcon } from "@/components/icons/VerseIcons";
import type { SrsState } from "@/db/schema";
import { QualityButtons } from "./QualityButtons";
import { HintButton } from "./HintButton";
import { SkipLink } from "./SkipLink";
import type { Quality } from "@/lib/srs/sm2";

export type QueueItem = {
  id: string;
  canonicalRef: string;
  version: string;
  icon: string;
  color: string;
  hint: string | null;
  text: string;
  copyright: string | null;
  srsState: SrsState;
  chunk: { stage: number; text: string; total: number };
};

type Strings = {
  recall: string;
  reciteAloud: string;
  reveal: string;
  howWell: string;
  again: string;
  hard: string;
  good: string;
  easy: string;
  showHint: string;
  hint: string;
  skip: string;
  exit: string;
  aloudTip: string;
  aloudTipOk: string;
  copyrightFallback: string;
  emptyQueue: string;
  emptyQueueCta: string;
  saveFailed: string;
};

type Props = {
  initialQueue: QueueItem[];
  locale: "es" | "en";
  showAloudTip: boolean;
  strings: Strings;
};

export function ClassicSession({ initialQueue, locale, showAloudTip, strings: t }: Props) {
  const router = useRouter();

  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<"front" | "revealed" | "submitting" | "done">(
    initialQueue.length === 0 ? "done" : "front",
  );
  const [hintShown, setHintShown] = useState(false);
  const [aloudTipOpen, setAloudTipOpen] = useState(showAloudTip);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Per-session aggregates for the summary screen.
  const sessionStartRef = useRef<number>(Date.now());
  const reviewedRef = useRef<number>(0);
  const cardStartRef = useRef<number>(Date.now());

  const current = queue[pos] ?? null;

  useEffect(() => {
    cardStartRef.current = Date.now();
    setHintShown(false);
  }, [pos]);

  // Empty-state — nothing due.
  if (!current && phase === "done" && reviewedRef.current === 0) {
    return (
      <main
        style={{
          minHeight: "100dvh",
          background: "var(--c-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--r-2xl)",
            padding: "28px 24px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            maxWidth: 420,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 16,
              color: "var(--c-muted)",
              margin: "0 0 18px",
            }}
          >
            {t.emptyQueue}
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              background: "var(--brand-primary)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--r-full)",
              padding: "12px 22px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t.emptyQueueCta}
          </button>
        </div>
      </main>
    );
  }

  // Done state — push to summary so the user sees their session totals.
  if (phase === "done") {
    const elapsedMs = Date.now() - sessionStartRef.current;
    const params = new URLSearchParams({
      reviewed: String(reviewedRef.current),
      elapsedMs: String(elapsedMs),
    });
    router.replace(`/practice/summary?${params.toString()}`);
    return null;
  }

  if (!current) return null;

  const color: CardColorId = isCardColor(current.color) ? current.color : "indigo";
  const icon: VerseIconId = isVerseIcon(current.icon) ? current.icon : "bible";
  const refDisplay = formatDisplay(current.canonicalRef, locale);

  function dismissAloudTip() {
    if (!aloudTipOpen) return;
    setAloudTipOpen(false);
    fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hasSeenAloudTip: true }),
    }).catch(() => {});
  }

  function reveal() {
    dismissAloudTip();
    setPhase("revealed");
  }

  async function grade(q: Quality) {
    if (!current || phase === "submitting") return;
    setSubmitError(null);
    setPhase("submitting");
    const durationMs = Date.now() - cardStartRef.current;
    const outcome = q >= 4 ? "correct" : q === 3 ? "partial" : "incorrect";
    let ok = false;
    try {
      const res = await fetch("/api/practice/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          verseId: current.id,
          mode: "classic",
          quality: q,
          outcome,
          durationMs,
          usedHint: hintShown,
        }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok) {
      // Hold the user on this card with an error banner. Advancing on
      // failure would tell the user the verse was reviewed while SM-2
      // and streak silently desync (M4 review #2).
      setSubmitError(t.saveFailed);
      setPhase("revealed");
      return;
    }
    reviewedRef.current += 1;
    advance();
  }

  function advance() {
    if (pos + 1 >= queue.length) {
      setPhase("done");
    } else {
      setPos(pos + 1);
      setPhase("front");
    }
  }

  function skipCard() {
    if (queue.length <= 1) {
      setPhase("done");
      return;
    }
    // Pull current to the end without recording a session.
    const rest = [...queue.slice(0, pos), ...queue.slice(pos + 1), current!];
    setQueue(rest);
    // pos stays where it is; the next card slides in naturally.
    setPhase("front");
  }

  function exit() {
    if (reviewedRef.current === 0) {
      router.push("/");
      return;
    }
    setPhase("done");
  }

  return (
    <main
      style={{
        width: "100%",
        minHeight: "100dvh",
        background: "var(--c-bg)",
        fontFamily: "var(--font-sans)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ padding: "32px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button
            type="button"
            onClick={exit}
            aria-label={t.exit}
            style={{
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
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ×
          </button>
          <div
            style={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              background: "var(--c-card-soft)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${((pos + (phase === "revealed" || phase === "submitting" ? 0.5 : 0)) / Math.max(1, queue.length)) * 100}%`,
                background: "var(--brand-primary)",
                transition: "width .3s",
              }}
            />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)" }}>
            {pos + 1}/{queue.length}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--c-muted)",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          {locale === "es" ? "Repetición espaciada" : "Spaced repetition"}
        </div>
      </header>

      <section
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 24px",
          position: "relative",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            width: 280,
            height: 360,
            borderRadius: "var(--r-3xl)",
            background: "var(--c-indigo-100)",
            opacity: 0.5,
            transform: "translateY(-12px) scale(0.95)",
          }}
        />

        {phase === "front" || phase === "submitting" || phase === "revealed" ? (
          <div
            key={current.id + ":" + phase}
            className="vr-card-rise"
            style={{
              width: "100%",
              maxWidth: 320,
              minHeight: 360,
              borderRadius: "var(--r-3xl)",
              background:
                phase === "revealed" ? "#fff" : `var(--card-${color}-bg)`,
              boxShadow: "var(--shadow-xl)",
              padding: 24,
              color: phase === "revealed" ? "var(--c-text)" : "#fff",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {phase !== "revealed" ? (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--r-full)",
                      background: "rgba(255,255,255,0.22)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    {t.recall}
                  </span>
                  <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600 }}>
                    {current.version}
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 24,
                  }}
                >
                  <VerseIcon id={icon} size={70} color="#fff" strokeWidth={1.6} />
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 800,
                      fontSize: 36,
                      letterSpacing: "-1px",
                      textAlign: "center",
                      lineHeight: 1.1,
                    }}
                  >
                    {refDisplay}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      opacity: 0.85,
                      textAlign: "center",
                      fontStyle: "italic",
                      maxWidth: 220,
                      lineHeight: 1.4,
                      margin: 0,
                    }}
                  >
                    {t.reciteAloud}
                  </p>
                </div>

                {hintShown && current.hint && (
                  <div
                    className="vr-hint-appear"
                    style={{
                      marginBottom: 12,
                      padding: "8px 12px",
                      borderRadius: "var(--r-md)",
                      background: "rgba(255,255,255,0.22)",
                      fontSize: 12,
                      fontStyle: "italic",
                      lineHeight: 1.4,
                    }}
                  >
                    💡 {current.hint}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <HintButton
                    hint={current.hint}
                    shown={hintShown}
                    onToggle={() => setHintShown((s) => !s)}
                    label={t.showHint}
                  />
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: `var(--card-${color}-bg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <VerseIcon id={icon} size={20} color="#fff" strokeWidth={2.3} />
                  </div>
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
                        fontSize: 9,
                        color: "var(--c-muted)",
                        fontWeight: 700,
                        letterSpacing: 0.8,
                        textTransform: "uppercase",
                      }}
                    >
                      {current.version}
                    </div>
                  </div>
                </div>
                <p
                  style={{
                    flex: 1,
                    margin: 0,
                    fontFamily: "var(--font-serif)",
                    fontSize: 17,
                    lineHeight: 1.5,
                  }}
                >
                  {current.chunk.text || "—"}
                </p>
                {current.chunk.total > 1 && (
                  <p
                    style={{
                      fontSize: 10,
                      color: "var(--c-soft)",
                      margin: "10px 0 0",
                      fontWeight: 600,
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                    }}
                  >
                    {locale === "es" ? "Fragmento" : "Section"} {current.chunk.stage + 1}/
                    {current.chunk.total}
                  </p>
                )}
                {hintShown && current.hint && (
                  <div
                    className="vr-hint-appear"
                    style={{
                      marginTop: 10,
                      padding: "8px 12px",
                      borderRadius: "var(--r-md)",
                      background: `var(--card-${color}-tint)`,
                      fontSize: 12,
                      fontStyle: "italic",
                      lineHeight: 1.4,
                    }}
                  >
                    💡 {current.hint}
                  </div>
                )}
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: 9,
                    color: "var(--c-soft)",
                    fontStyle: "italic",
                  }}
                >
                  {current.copyright ?? t.copyrightFallback}
                </p>
              </>
            )}
          </div>
        ) : null}
      </section>

      <footer style={{ padding: "20px 16px 32px" }}>
        {phase === "front" ? (
          <>
            <button
              type="button"
              onClick={reveal}
              style={{
                width: "100%",
                height: 56,
                background: "var(--brand-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--r-full)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 17,
                cursor: "pointer",
                boxShadow:
                  "0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
                marginBottom: 12,
              }}
            >
              👁 {t.reveal}
            </button>
            <div style={{ textAlign: "center" }}>
              <SkipLink onSkip={skipCard} label={t.skip} />
            </div>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: 11,
                color: "var(--c-muted)",
                textAlign: "center",
                margin: "0 0 10px",
                fontWeight: 600,
              }}
            >
              {t.howWell}
            </p>
            {submitError && (
              <p
                role="alert"
                style={{
                  margin: "0 0 10px",
                  textAlign: "center",
                  color: "#B91C1C",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {submitError}
              </p>
            )}
            <QualityButtons
              srs={current.srsState}
              locale={locale}
              disabled={phase === "submitting"}
              onGrade={grade}
              labels={{
                again: t.again,
                hard: t.hard,
                good: t.good,
                easy: t.easy,
              }}
            />
          </>
        )}
      </footer>

      {aloudTipOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={dismissAloudTip}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,14,26,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="vr-card-rise"
            style={{
              background: "#fff",
              borderRadius: "var(--r-2xl)",
              padding: "22px 24px",
              maxWidth: 360,
              boxShadow: "var(--shadow-xl)",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: "0 0 16px",
                fontFamily: "var(--font-serif)",
                fontSize: 15,
                color: "var(--c-text)",
                lineHeight: 1.4,
              }}
            >
              {t.aloudTip}
            </p>
            <button
              type="button"
              onClick={dismissAloudTip}
              style={{
                background: "var(--brand-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--r-full)",
                padding: "10px 22px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {t.aloudTipOk}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
