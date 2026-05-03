// 18 verse icons (specs.md §7.4). Heavy-stroke single-color line icons.
// Re-implemented from DesignBundle/icons.jsx; each icon is the same size and
// stroke weight so swapping in the picker doesn't change card layout.

import type { VerseIconId } from "@/lib/catalog";

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
};

function Svg({
  size = 24,
  color = "currentColor",
  strokeWidth = 2,
  children,
  className,
}: Props & { children: React.ReactNode }) {
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
      className={className}
    >
      {children}
    </svg>
  );
}

const Bible = (p: Props) => (
  <Svg {...p}>
    <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v18H7.5A2.5 2.5 0 0 0 5 22.5V4.5z" />
    <path d="M5 4.5V20" />
    <path d="M12 7v8M9 11h6" />
  </Svg>
);
const Cross = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3v18M6 9h12" />
  </Svg>
);
const Dove = (p: Props) => (
  <Svg {...p}>
    <path d="M3 12c4-1 6-3 7-6 1 4 4 6 8 6-3 1-5 3-6 6-2-3-5-5-9-6z" />
    <circle cx="16" cy="9" r="0.6" fill="currentColor" />
  </Svg>
);
const Sheep = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="11" r="5" />
    <circle cx="8" cy="9" r="2" />
    <circle cx="16" cy="9" r="2" />
    <circle cx="6" cy="13" r="2" />
    <circle cx="18" cy="13" r="2" />
    <path d="M9 17v3M15 17v3M11 13h.01M13 13h.01" />
  </Svg>
);
const Lion = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="13" r="5" />
    <path d="M5 9c0-2 1-4 2-4M19 9c0-2-1-4-2-4M3 13c0-2 1-3 2-3M21 13c0-2-1-3-2-3M5 17c0-1 1-2 2-2M19 17c0-1-1-2-2-2" />
    <path d="M10 13h.01M14 13h.01M11 16c.5.5 1.5.5 2 0" />
  </Svg>
);
const FishLoaves = (p: Props) => (
  <Svg {...p}>
    <path d="M3 12c2-3 5-4 8-4 4 0 7 2 9 4-2 2-5 4-9 4-3 0-6-1-8-4z" />
    <path d="M19 10l3-2v8l-3-2" />
    <circle cx="9" cy="11" r="0.6" fill="currentColor" />
    <path d="M3 18c2 0 3-1 4-1 1 0 2 1 4 1" />
  </Svg>
);
const Crown = (p: Props) => (
  <Svg {...p}>
    <path d="M3 8l3 8h12l3-8-5 3-4-6-4 6-5-3z" />
    <path d="M5 18h14" />
  </Svg>
);
const FlameSmall = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3c2 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 1 2 2 1 3-1 0-1 0-2 0-4z" />
  </Svg>
);
const Heart = (p: Props) => (
  <Svg {...p}>
    <path d="M12 21s-7-4.5-9.5-9.5C0.5 7 4 3 7.5 3c2 0 3.5 1 4.5 2.5C13 4 14.5 3 16.5 3 20 3 23.5 7 21.5 11.5 19 16.5 12 21 12 21z" />
  </Svg>
);
const Mountain = (p: Props) => (
  <Svg {...p}>
    <path d="M3 19l5-9 4 6 3-5 6 8H3z" />
    <path d="M8 10l3-4M15 11l-1-2" />
  </Svg>
);
const Water = (p: Props) => (
  <Svg {...p}>
    <path d="M3 14c2-1 3-1 5 0s3 1 5 0 3-1 5 0 2 1 3 1" />
    <path d="M3 18c2-1 3-1 5 0s3 1 5 0 3-1 5 0 2 1 3 1" />
    <path d="M3 10c2-1 3-1 5 0s3 1 5 0 3-1 5 0 2 1 3 1" />
  </Svg>
);
const Sun = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
  </Svg>
);
const Door = (p: Props) => (
  <Svg {...p}>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
    <path d="M3 22h18" />
    <circle cx="14" cy="13" r="0.6" fill="currentColor" />
  </Svg>
);
const Shield = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
const HandPray = (p: Props) => (
  <Svg {...p}>
    <path d="M9 22V8a2 2 0 0 1 4 0v3M9 8c0-2-1-4-2-4s-2 2-2 4v8c0 3 2 6 4 6h6c2 0 4-3 4-6V8c0-2-1-4-2-4s-2 2-2 4v3" />
  </Svg>
);
const Anchor = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="6" r="2" />
    <path d="M12 8v14M8 11h8M5 19c1.5 1.5 3.5 2 7 2s5.5-.5 7-2" />
  </Svg>
);
const Seed = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3c4 4 4 10 0 14M12 3c-4 4-4 10 0 14M12 3v18" />
  </Svg>
);
const Book = (p: Props) => (
  <Svg {...p}>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2V5z" />
    <path d="M4 5v15" />
  </Svg>
);

export const VERSE_ICON_COMPONENTS: Record<VerseIconId, (p: Props) => React.JSX.Element> = {
  bible: Bible,
  cross: Cross,
  dove: Dove,
  sheep: Sheep,
  lion: Lion,
  fishLoaves: FishLoaves,
  crown: Crown,
  flameSmall: FlameSmall,
  heart: Heart,
  mountain: Mountain,
  water: Water,
  sun: Sun,
  door: Door,
  shield: Shield,
  handPray: HandPray,
  anchor: Anchor,
  seed: Seed,
  book: Book,
};

export function VerseIcon({
  id,
  ...rest
}: { id: VerseIconId } & Props) {
  const Comp = VERSE_ICON_COMPONENTS[id] ?? Bible;
  return <Comp {...rest} />;
}
