// Home hero CTA: "X versos para hoy" → /practice/classic (specs.md §16.1).
// Goes directly to the Classic session — the Practice hub is for variety,
// not the daily action.

import Link from "next/link";
import { isCardColor, isVerseIcon, type CardColorId, type VerseIconId } from "@/lib/catalog";
import { VerseIcon } from "@/components/icons/VerseIcons";

type StackVerse = { id: string; color: string; icon: string };

type Props = {
  dueToday: number;
  sample: StackVerse[];
  primaryLine: string;
  secondaryLine: string;
};

export function TodayCTA({ dueToday, sample, primaryLine, secondaryLine }: Props) {
  if (dueToday === 0) return null;
  return (
    <Link
      href="/practice/classic"
      className="vr-glow-pulse"
      style={{
        background: "var(--brand-primary)",
        color: "#fff",
        borderRadius: "var(--r-2xl)",
        padding: "18px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        position: "relative",
        overflow: "hidden",
        textDecoration: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -30,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: -40,
          right: 40,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div style={{ position: "relative", width: 56, height: 64, flexShrink: 0 }}>
        {sample.slice(0, 3).map((v, i) => {
          const color: CardColorId = isCardColor(v.color) ? v.color : "indigo";
          const icon: VerseIconId = isVerseIcon(v.icon) ? v.icon : "bible";
          return (
            <div
              key={v.id}
              style={{
                position: "absolute",
                width: 44,
                height: 56,
                borderRadius: 10,
                background: `var(--card-${color}-bg)`,
                border: "2px solid rgba(255,255,255,0.9)",
                left: i * 6,
                top: i * 4,
                transform: `rotate(${(i - 1) * 5}deg)`,
                boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <VerseIcon id={icon} size={20} color="#fff" strokeWidth={2.2} />
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: "-0.3px",
          }}
        >
          {primaryLine}
        </div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{secondaryLine}</div>
      </div>
      <div
        aria-hidden
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "#fff",
          color: "var(--c-indigo-700)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
          flexShrink: 0,
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        ▶
      </div>
    </Link>
  );
}
