"use client";

// Always-available hint pill (specs.md §16.4 + §16.5).
// Renders nothing when the verse has no hint.

type Props = {
  hint: string | null;
  shown: boolean;
  onToggle: () => void;
  label: string;
};

export function HintButton({ hint, shown, onToggle, label }: Props) {
  if (!hint) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={shown}
      style={{
        background: shown
          ? "rgba(255,255,255,0.32)"
          : "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.3)",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: "var(--r-full)",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        backdropFilter: "blur(8px)",
      }}
    >
      <span aria-hidden>💡</span> {label}
    </button>
  );
}
