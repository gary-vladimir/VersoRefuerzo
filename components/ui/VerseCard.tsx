// Verse-card front face. Used by the New Verse form's live preview region
// (specs.md §6.1) and anywhere a compact verse card is shown. The Card View
// renders its own flippable faces, so this stays a simple front-only card.

import type { CardColorId, VerseIconId } from "@/lib/catalog";
import { VerseIcon } from "@/components/icons/VerseIcons";

type Props = {
  refDisplay: string;
  version: string;
  color: CardColorId;
  icon: VerseIconId;
  size?: "sm" | "md";
};

export function VerseCard({ refDisplay, version, color, icon, size = "md" }: Props) {
  const isMd = size === "md";
  const dim = isMd
    ? { w: 240, h: 280, padding: 18, iconBox: 64, refSize: 22, vSize: 11 }
    : { w: 168, h: 200, padding: 14, iconBox: 48, refSize: 16, vSize: 10 };
  return (
    <div
      style={{
        width: dim.w,
        height: dim.h,
        borderRadius: "var(--r-2xl)",
        background: `var(--card-${color}-bg)`,
        // Ambient shadow tinted by the card's own color so it glows on the
        // page instead of casting a flat grey drop shadow.
        boxShadow: `0 20px 44px rgb(var(--card-${color}-rgb) / 0.42), inset 0 1px 0 rgba(255,255,255,0.3)`,
        padding: dim.padding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top-light sheen — makes the gradient read as a glossy surface. Painted
          first so the positioned content below sits on top of it. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 80% at 20% 0%, rgba(255,255,255,0.28), transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          width: dim.iconBox,
          height: dim.iconBox,
          borderRadius: "calc(var(--r-2xl) - 8px)",
          background: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
        }}
      >
        <VerseIcon id={icon} size={isMd ? 32 : 26} color="#fff" strokeWidth={2.2} />
      </div>

      <div style={{ position: "relative" }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: dim.refSize,
            letterSpacing: "-0.4px",
            lineHeight: 1.1,
          }}
        >
          {refDisplay}
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: dim.vSize,
            fontWeight: 700,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          {version}
        </div>
      </div>
    </div>
  );
}
