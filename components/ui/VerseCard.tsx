// Verse-card preview. Front-only for M2 (no flip yet — the back face and
// give-up state arrive in M3 with Card View). Used by the New Verse form's
// live preview region above the form (specs.md §6.1).

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
        boxShadow:
          "0 18px 36px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
        padding: dim.padding,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: dim.iconBox,
          height: dim.iconBox,
          borderRadius: "calc(var(--r-2xl) - 8px)",
          background: "rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(2px)",
        }}
      >
        <VerseIcon id={icon} size={isMd ? 32 : 26} color="#fff" strokeWidth={2.2} />
      </div>

      <div>
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
