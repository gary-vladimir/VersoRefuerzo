"use client";

// Skip-card affordance (specs.md §17.3): defers the current verse to the
// end of the local in-memory queue. No /api/practice/sessions row is
// recorded, so SRS state and streak are unaffected.

type Props = {
  onSkip: () => void;
  label: string;
};

export function SkipLink({ onSkip, label }: Props) {
  return (
    <button
      type="button"
      onClick={onSkip}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--c-soft)",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: 12,
        cursor: "pointer",
        textDecoration: "underline",
      }}
    >
      {label}
    </button>
  );
}
