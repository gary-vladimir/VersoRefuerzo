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
      // Small filled details (eyes, the door knob) use currentColor; tying
      // it to the color prop keeps them white on a colored card instead of
      // inheriting the page's dark text color.
      style={{ color }}
    >
      {children}
    </svg>
  );
}

// Drawing rules, so the set reads as one family at 16px and at 130px:
// 24-unit grid with ~2 units of padding, round caps and joins, every shape
// a stroke (no fills except tiny eye/knob dots), at most ~4 strokes so the
// small picker tiles stay legible.

// Closed Bible: bound cover with a cross, page block along the bottom.
const Bible = (p: Props) => (
  <Svg {...p}>
    <path d="M5 18.5v-13A2.5 2.5 0 0 1 7.5 3H19v13.5H7.5A2.5 2.5 0 0 0 5 19a2 2 0 0 0 2 2h12v-4.5" />
    <path d="M12 6v7M9.5 8.5h5" />
  </Svg>
);
// Latin cross drawn as an outline, so it holds weight at large sizes.
const Cross = (p: Props) => (
  <Svg {...p}>
    <path d="M10.5 2.5h3v5h5v3h-5v11h-3v-11h-5v-3h5z" />
  </Svg>
);
// Dove in flight with a raised wing (the Spirit descending).
const Dove = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 9 5.4 7.4c1.3-.7 2.9-.2 3.6 1l.7 1.2C10.4 6.4 12 4 14.6 2.5c.6 3 0 5.8-1.8 8.2l2.6.8 6.1-2.1-2.4 3 2.4 2.8-6-1c-1.6 2.2-4.1 3.4-6.9 3.1-2.6-.3-4.4-2.3-4.4-4.9 0-1.2-.6-2.4-1.7-3.4z" />
    <circle cx="6.3" cy="9.3" r=".7" fill="currentColor" stroke="none" />
  </Svg>
);
// Sheep in profile: woolly body, a head with ear and eye, two legs.
const Sheep = (p: Props) => (
  <Svg {...p}>
    <path d="M9 16h9.5a2.5 2.5 0 0 0 .8-4.9 2.7 2.7 0 0 0-3.6-3.3 2.9 2.9 0 0 0-5 .3A2.7 2.7 0 0 0 8.4 9.4" />
    <path d="M8.4 9.4C7.7 8.3 6.3 8 5.2 8.6 3.6 9.4 2.9 11.4 3.4 13c.4 1.3 1.7 2 3 1.8 1.4-.3 2.3-1.6 2.6-3" />
    <path d="M5.3 8.7 3.4 7.6" />
    <circle cx="5.6" cy="11.3" r=".7" fill="currentColor" stroke="none" />
    <path d="M10.5 16v3.5M16.5 16v3.5" />
  </Svg>
);
// Lion: scalloped mane around a calm face.
const Lion = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4.9Q14.64 2.45 15.7 5.89Q19.21 5.09 18.41 8.6Q21.85 9.66 19.4 12.3Q21.85 14.94 18.41 16Q19.21 19.51 15.7 18.71Q14.64 22.15 12 19.7Q9.36 22.15 8.3 18.71Q4.79 19.51 5.59 16Q2.15 14.94 4.6 12.3Q2.15 9.66 5.59 8.6Q4.79 5.09 8.3 5.89Q9.36 2.45 12 4.9z" />
    <path d="M10.8 14h2.4L12 15.3z" />
    <path d="M12 15.3v1M10.6 17c.8.5 2 .5 2.8 0" />
    <circle cx="10" cy="11.6" r=".7" fill="currentColor" stroke="none" />
    <circle cx="14" cy="11.6" r=".7" fill="currentColor" stroke="none" />
  </Svg>
);
// Loaves and fish: a fish over a scored loaf.
const FishLoaves = (p: Props) => (
  <Svg {...p}>
    <path d="M3.5 8c2.6-3 7.4-3.3 10.5 0-3.1 3.3-7.9 3-10.5 0z" />
    <path d="M14 8l3.5-2.5v5z" />
    <circle cx="6.8" cy="7.7" r=".7" fill="currentColor" stroke="none" />
    <path d="M6 20.5a2.5 2.5 0 0 1-2.5-2.5v-.5A3.5 3.5 0 0 1 7 14h10a3.5 3.5 0 0 1 3.5 3.5v.5a2.5 2.5 0 0 1-2.5 2.5z" />
    <path d="M9 15.5 8 17.5M13 15.5l-1 2M17 15.5l-1 2" />
  </Svg>
);
// Crown with three jewelled points over a band.
const Crown = (p: Props) => (
  <Svg {...p}>
    <path d="M4 8.5l3.5 4L12 6l4.5 6.5L20 8.5 18.5 17h-13z" />
    <path d="M5.5 20h13" />
    <circle cx="4" cy="7" r="1.2" />
    <circle cx="12" cy="4.3" r="1.2" />
    <circle cx="20" cy="7" r="1.2" />
  </Svg>
);
// Flame with an inner tongue (Pentecost, the Spirit's fire).
const FlameSmall = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5c1 3.5 6 5.5 6 11a6 6 0 0 1-12 0c0-2.7 1.3-4.4 2.7-5.5.3 1.8 1.1 2.8 2.2 3.2 0-3.2.3-6 1.1-8.7z" />
    <path d="M12 21a2.6 2.6 0 0 1-2.6-2.6c0-1.6 1.3-2.6 2.6-4.2 1.3 1.6 2.6 2.6 2.6 4.2A2.6 2.6 0 0 1 12 21z" />
  </Svg>
);
// Heart.
const Heart = (p: Props) => (
  <Svg {...p}>
    <path d="M12 20s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 5.8-8 11-8 11z" />
  </Svg>
);
// Two peaks, the taller one snow-capped (Sinai, the mount of the sermon).
const Mountain = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 20 9.5 7l4.5 8.2 2.3-3.7L21.5 20z" />
    <path d="M7.2 11.3 9 12.5l1.3-1.3 1.6 1.2" />
  </Svg>
);
// Living water: a drop above two waves.
const Water = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5c2.4 2.9 4 5 4 7a4 4 0 0 1-8 0c0-2 1.6-4.1 4-7z" />
    <path d="M3 17c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
    <path d="M3 20.5c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" />
  </Svg>
);
// Sunrise over the horizon (mercies new every morning).
const Sun = (p: Props) => (
  <Svg {...p}>
    <path d="M7 17a5 5 0 0 1 10 0" />
    <path d="M3 17h18M7 20.5h10" />
    <path d="M12 5.5v3M5.3 9.3l2 2M18.7 9.3l-2 2M2.5 13.5h2M19.5 13.5h2" />
  </Svg>
);
// Door standing open, light falling through (John 10:9).
const Door = (p: Props) => (
  <Svg {...p}>
    <path d="M5 21h14" />
    <path d="M6.5 21V4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1V21" />
    <path d="M6.5 3.8 13 6v14l-6.5 1" />
    <circle cx="11" cy="13" r=".7" fill="currentColor" stroke="none" />
  </Svg>
);
// Shield of faith with a cross.
const Shield = (p: Props) => (
  <Svg {...p}>
    <path d="M12 2.5 19.5 5.5v6c0 4.8-3.2 8.7-7.5 10-4.3-1.3-7.5-5.2-7.5-10v-6z" />
    <path d="M12 7.5v8M9 10.5h6" />
  </Svg>
);
// Hands joined in prayer, the common pictogram: a pointed arch of
// fingers with thumbs in front, resting on a cuff and sleeves.
const HandPray = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3.5C10.5 4.2 9.5 5.9 8.9 8l-1.4 4.5c-.4 1.3-.2 2.4.6 3.2L4.5 21" />
    <path d="M12 3.5c1.5.7 2.5 2.4 3.1 4.5l1.4 4.5c.4 1.3.2 2.4-.6 3.2l3.6 5.3" />
    <path d="M12 3.5v12M12 15.5 8.6 21M12 15.5l3.4 5.5" />
    <path d="M10.1 9.6c.2 1.6 1 2.8 1.9 3.3M13.9 9.6c-.2 1.6-1 2.8-1.9 3.3" />
  </Svg>
);
// Anchor of the soul (Hebrews 6:19).
const Anchor = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="4.8" r="2" />
    <path d="M12 6.8V21M8.5 10h7" />
    <path d="M4.5 13.5a7.5 7.5 0 0 0 15 0" />
    <path d="M3 15l1.5-1.5L6 15M18 15l1.5-1.5L21 15" />
  </Svg>
);
// Sprout rising from the soil (the mustard seed, growth).
const Seed = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20.5h16" />
    <path d="M12 20.5V11" />
    <path d="M12 14C12 10.8 9.6 8.5 6 8.5c0 3.2 2.4 5.5 6 5.5z" />
    <path d="M12 11.5c0-3.6 2.6-6.5 6.5-6.5 0 3.6-2.6 6.5-6.5 6.5z" />
  </Svg>
);
// Open book (study, the Word read aloud).
const Book = (p: Props) => (
  <Svg {...p}>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z" />
    <path d="M12 6.5V20" />
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
