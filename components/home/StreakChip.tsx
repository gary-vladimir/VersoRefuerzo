// Small flame chip rendering the user's current streak (specs.md §6.6).
// Server-renderable; visual only.

import { Flame } from "@/components/icons/UiIcons";

type Props = {
  current: number;
  ariaLabel?: string;
};

export function StreakChip({ current, ariaLabel }: Props) {
  const inactive = current === 0;
  return (
    <span
      role="img"
      aria-label={ariaLabel ?? String(current)}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        background: inactive
          ? "var(--c-card-soft)"
          : "linear-gradient(135deg, #FEF3C7, #FDE68A)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        boxShadow: inactive ? "none" : "0 2px 8px rgba(251,191,36,0.25)",
      }}
    >
      <span
        aria-hidden
        className={inactive ? undefined : "vr-flame"}
        style={{ display: "inline-flex" }}
      >
        <Flame size={15} strokeWidth={1.6} color={inactive ? "var(--c-soft)" : "#F97316"} />
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 13,
          color: inactive ? "var(--c-soft)" : "#92400E",
        }}
      >
        {current}
      </span>
    </span>
  );
}
