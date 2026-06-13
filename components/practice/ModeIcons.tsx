// Glyphs for the five practice modes on the Practice hub. Same heavy-stroke
// line style as the rest of the icon sets; rendered white on each mode's
// gradient tile.

export type ModeName = "classic" | "firstLetter" | "scramble" | "match" | "gap";

const PATHS: Record<ModeName, React.ReactNode> = {
  // Flashcard stack.
  classic: (
    <>
      <rect x="5" y="6" width="14" height="12" rx="2.5" />
      <path d="M8.5 10.5h7M8.5 14h4" />
    </>
  ),
  // "A a" — first-letter cueing.
  firstLetter: (
    <>
      <path d="M3 18l4-11 4 11M4.4 14.2h5.2" />
      <circle cx="17" cy="14.5" r="3" />
      <path d="M20 11.6v5.9" />
    </>
  ),
  // Scattered tiles to reorder.
  scramble: (
    <>
      <rect x="3" y="8" width="6" height="6" rx="1.5" />
      <rect x="10" y="4.5" width="6" height="6" rx="1.5" />
      <rect x="14" y="13" width="6" height="6" rx="1.5" />
    </>
  ),
  // Two columns to connect.
  match: (
    <>
      <circle cx="6" cy="7" r="2" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="18" cy="17" r="2" />
      <path d="M8 7h8M8 17l8-10" />
    </>
  ),
  // A dashed blank between two words.
  gap: (
    <>
      <path d="M3.5 12h3M17.5 12h3" />
      <rect x="9" y="9.3" width="6" height="5.4" rx="1.5" strokeDasharray="2.4 2.4" />
    </>
  ),
};

export function ModeIcon({
  name,
  size = 26,
  color = "currentColor",
  strokeWidth = 2,
}: {
  name: ModeName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
