"use client";

// Session summary (specs.md row 14 / §6.7).
// Visual language borrows from the night-gradient salvaged from the dropped
// Streak Challenge screen. Plays the §6.9 chime on mount and the flame
// crackle when the streak chip is non-zero (i.e. the user just extended
// or kept their streak by completing the round).

import { useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import { play } from "@/lib/sounds/player";
import { Flame, Sparkles } from "@/components/icons/UiIcons";

type Strings = {
  title: string;
  reviewed: string;
  accuracy: string;
  time: string;
  done: string;
  again: string;
  units: { verses: (n: number) => string; minSec: (m: number, s: number) => string };
};

type Props = {
  reviewed: number;
  correct: number;
  againHref: string;
  elapsedMs: number;
  streak: number | null;
  strings: Strings;
};

export function SessionSummary({
  reviewed,
  correct,
  againHref,
  elapsedMs,
  streak,
  strings: t,
}: Props) {
  const totalSeconds = Math.max(0, Math.round(elapsedMs / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const accuracyPct = reviewed > 0 ? Math.round((correct / reviewed) * 100) : null;

  // §6.9 cues: chime on mount, flame on streak presence. The flame plays
  // a beat after the chime so the two don't overlap.
  useEffect(() => {
    play("chime");
    if (streak && streak > 0) {
      const id = window.setTimeout(() => play("flame"), 220);
      return () => window.clearTimeout(id);
    }
  }, [streak]);

  // Decorative sparkle field behind the card. aria-hidden; disabled under
  // reduced-motion via the global animation rules.
  const sparkles = [
    { top: "12%", left: "14%", size: 6, cls: "vr-sparkle", delay: "0s" },
    { top: "22%", left: "82%", size: 5, cls: "vr-twinkle", delay: ".4s" },
    { top: "60%", left: "8%", size: 4, cls: "vr-twinkle", delay: ".9s" },
    { top: "70%", left: "88%", size: 7, cls: "vr-sparkle", delay: ".2s" },
    { top: "40%", left: "92%", size: 4, cls: "vr-twinkle", delay: "1.1s" },
    { top: "84%", left: "30%", size: 5, cls: "vr-sparkle", delay: ".7s" },
  ];

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--brand-night)",
        color: "#fff",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {sparkles.map((sp, i) => (
          <span
            key={i}
            className={sp.cls}
            style={{
              position: "absolute",
              top: sp.top,
              left: sp.left,
              width: sp.size,
              height: sp.size,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.85)",
              animationDelay: sp.delay,
            }}
          />
        ))}
      </div>

      <section
        className="vr-card-rise"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 22,
          position: "relative",
        }}
      >
        <div aria-hidden className="vr-tada" style={{ lineHeight: 1 }}>
          <Sparkles size={60} color="#fff" strokeWidth={1.6} />
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-0.6px",
          }}
        >
          {t.title}
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: accuracyPct != null ? "1fr 1fr 1fr" : "1fr 1fr",
            gap: 12,
            width: "100%",
            maxWidth: 380,
          }}
        >
          <Stat label={t.reviewed} value={String(reviewed)} />
          {accuracyPct != null && <Stat label={t.accuracy} value={`${accuracyPct}%`} />}
          <Stat label={t.time} value={t.units.minSec(m, s)} />
        </div>

        {streak != null && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(251,191,36,0.18)",
              color: "var(--c-amber-400)",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <span aria-hidden className="vr-flame" style={{ display: "inline-flex" }}>
              <Flame size={16} strokeWidth={1.6} color="var(--c-amber-400)" />
            </span>
            {streak}
          </div>
        )}
      </section>

      <footer
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
          position: "relative",
        }}
      >
        <Link
          href="/"
          className="vr-press"
          style={{
            background: "#fff",
            color: "var(--c-text)",
            textDecoration: "none",
            borderRadius: "var(--r-full)",
            padding: "14px 22px",
            textAlign: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          {t.done}
        </Link>
        <Link
          href={againHref as Route}
          className="vr-press"
          style={{
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "underline",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
            padding: "8px",
          }}
        >
          {t.again}
        </Link>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.10)",
        borderRadius: "var(--r-xl)",
        padding: "16px 12px",
        textAlign: "center",
      }}
    >
      <div
        className="vr-count-pop"
        style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.65)",
          fontWeight: 600,
          marginTop: 4,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
