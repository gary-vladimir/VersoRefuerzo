"use client";

// Session summary (specs.md row 14 / §6.7).
// Visual language borrows from the night-gradient salvaged from the dropped
// Streak Challenge screen. Plays the §6.9 chime on mount and the flame
// crackle when the streak chip is non-zero (i.e. the user just extended
// or kept their streak by completing the round).

import { useEffect } from "react";
import Link from "next/link";
import { play } from "@/lib/sounds/player";

type Strings = {
  title: string;
  reviewed: string;
  time: string;
  done: string;
  again: string;
  units: { verses: (n: number) => string; minSec: (m: number, s: number) => string };
};

type Props = {
  reviewed: number;
  elapsedMs: number;
  streak: number | null;
  strings: Strings;
};

export function SessionSummary({ reviewed, elapsedMs, streak, strings: t }: Props) {
  const totalSeconds = Math.max(0, Math.round(elapsedMs / 1000));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  // §6.9 cues: chime on mount, flame on streak presence. The flame plays
  // a beat after the chime so the two don't overlap.
  useEffect(() => {
    play("chime");
    if (streak && streak > 0) {
      const t = window.setTimeout(() => play("flame"), 220);
      return () => window.clearTimeout(t);
    }
  }, [streak]);

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
      }}
    >
      <section
        className="vr-card-rise"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          gap: 24,
        }}
      >
        <div
          aria-hidden
          className="vr-tada"
          style={{
            fontSize: 64,
            lineHeight: 1,
          }}
        >
          ✨
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 360 }}>
          <Stat label={t.reviewed} value={t.units.verses(reviewed)} />
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
            <span aria-hidden className="vr-flame">
              🔥
            </span>
            {streak}
          </div>
        )}
      </section>

      <footer style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 16 }}>
        <Link
          href="/"
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
          href="/practice/classic"
          style={{
            background: "transparent",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "underline",
            textAlign: "center",
            fontSize: 13,
            fontWeight: 600,
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
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22 }}>
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
