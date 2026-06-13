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
  practice: (
    <path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3z" />
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
