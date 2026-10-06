// Navigation glyphs shared by the mobile bottom tab bar and the desktop
// sidebar, so both surfaces stay visually identical. Same heavy-stroke line
// style as the verse/UI icon sets.

import type { ReactNode } from "react";

export type NavName = "home" | "practice" | "library";

const PATHS: Record<NavName, ReactNode> = {
  home: (
    <>
      <path d="M4 11l8-6.5L20 11" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    </>
  ),
  // Game controller: the practice tab is where the mini-games live.
  // Buttons are zero-length strokes, which round caps turn into dots.
  practice: (
    <>
      <path d="M7 7h10a5 5 0 0 1 4.9 6l-.9 4.2a2.3 2.3 0 0 1-3.9 1.1L14.8 16H9.2l-2.3 2.3A2.3 2.3 0 0 1 3 17.2L2.1 13A5 5 0 0 1 7 7z" />
      <path d="M7.5 10v4M5.5 12h4" />
      <path d="M15.5 10.6h.01M17.8 13h.01" />
    </>
  ),
  library: (
    <>
      <path d="M5 5a2 2 0 0 1 2-2h11v16H7a2 2 0 0 0-2 2V5z" />
      <path d="M5 5v14" />
    </>
  ),
};

export function NavIcon({
  name,
  size = 22,
  color = "currentColor",
  strokeWidth = 2,
}: {
  name: NavName;
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
