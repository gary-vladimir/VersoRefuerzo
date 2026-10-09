// Verse icons (specs.md §7.4, extended beyond the original 18). Heavy-stroke
// single-color line icons.
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

// Added icons, from Lucide (https://lucide.dev, lucide-static 1.54.0). They
// are drawn on the same 24-unit grid with 2-unit round strokes, so they sit
// in the same family as the hand-drawn set above. Used under the ISC
// license; see components/icons/LUCIDE_LICENSE.txt.

// Light bulb: wisdom, understanding, a lamp to the feet.
const Lightbulb = (p: Props) => (
  <Svg {...p}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </Svg>
);
// Brain: the mind, renewing of the mind.
const Brain = (p: Props) => (
  <Svg {...p}>
    <path d="M12 18V5" />
    <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
    <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
    <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
    <path d="M18 18a4 4 0 0 0 2-7.464" />
    <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
    <path d="M6 18a4 4 0 0 1-2-7.464" />
    <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
  </Svg>
);
// Graduation cap: teaching, discipleship, learning.
const GraduationCap = (p: Props) => (
  <Svg {...p}>
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M22 10v6" />
    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
  </Svg>
);
// Shield with a check: protection, salvation, security.
const ShieldCheck = (p: Props) => (
  <Svg {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);
// Hand holding a heart: love in action, generosity, service.
const HandHeart = (p: Props) => (
  <Svg {...p}>
    <path d="M11 14h2a2 2 0 0 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
    <path d="m14.45 13.39 5.05-4.694C20.196 8 21 6.85 21 5.75a2.75 2.75 0 0 0-4.797-1.837.276.276 0 0 1-.406 0A2.75 2.75 0 0 0 11 5.75c0 1.2.802 2.248 1.5 2.946L16 11.95" />
    <path d="m2 15 6 6" />
    <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a1 1 0 0 0-2.75-2.91" />
  </Svg>
);
// Key: the keys of the kingdom, access, freedom.
const KeyRound = (p: Props) => (
  <Svg {...p}>
    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
    <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
  </Svg>
);
// Gift: grace, the gift of God, eternal life.
const Gift = (p: Props) => (
  <Svg {...p}>
    <path d="M12 7v14" />
    <path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5" />
    <rect x="3" y="7" width="18" height="4" rx="1" />
  </Svg>
);
// Crossed swords: spiritual battle, the sword of the Spirit.
const Swords = (p: Props) => (
  <Svg {...p}>
    <path d="m13 19 6-6" />
    <path d="M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5" />
    <path d="m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586" />
    <path d="m16 16 4 4" />
    <path d="m19 21 2-2" />
    <path d="m5 14 4 4" />
    <path d="m5 21-2-2" />
    <path d="M7.5 16.5 4 20" />
  </Svg>
);
// Shield with an alert: watchfulness, warning, temptation.
const ShieldAlert = (p: Props) => (
  <Svg {...p}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </Svg>
);
// Lock: security, being kept safe in God.
const Lock = (p: Props) => (
  <Svg {...p}>
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);
// Trophy: the prize, finishing the race, victory.
const Trophy = (p: Props) => (
  <Svg {...p}>
    <path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" />
    <path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" />
    <path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" />
    <path d="M4 22h16" />
    <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
    <path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />
  </Svg>
);
// Scales: justice, righteousness, judgment.
const Scale = (p: Props) => (
  <Svg {...p}>
    <path d="M12 3v18" />
    <path d="m19 8 3 8a5 5 0 0 1-6 0zV7" />
    <path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" />
    <path d="m5 8 3 8a5 5 0 0 1-6 0zV7" />
    <path d="M7 21h10" />
  </Svg>
);
// Music notes: praise, worship, psalms and songs.
const Music = (p: Props) => (
  <Svg {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </Svg>
);
// Speech bubble: prayer, words, the Word spoken.
const MessageCircle = (p: Props) => (
  <Svg {...p}>
    <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
  </Svg>
);
// Ear: hearing and obeying, faith comes by hearing.
const Ear = (p: Props) => (
  <Svg {...p}>
    <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" />
    <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />
  </Svg>
);
// Church building: the church, gathering, fellowship.
const Church = (p: Props) => (
  <Svg {...p}>
    <path d="M10 9h4" />
    <path d="M12 7v5" />
    <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
    <path d="m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9" />
    <path d="M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14" />
  </Svg>
);
// People: community, the body of Christ, unity.
const Users = (p: Props) => (
  <Svg {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <path d="M16 3.128a4 4 0 0 1 0 7.744" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <circle cx="9" cy="7" r="4" />
  </Svg>
);
// Hourglass: time, patience, waiting on the Lord.
const Hourglass = (p: Props) => (
  <Svg {...p}>
    <path d="M5 22h14" />
    <path d="M5 2h14" />
    <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
    <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
  </Svg>
);
// Leaf: growth, fruit, a tree planted by the water.
const Leaf = (p: Props) => (
  <Svg {...p}>
    <path d="M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20" />
    <path d="M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13" />
  </Svg>
);
// Gem: treasure, wisdom more precious than jewels.
const Gem = (p: Props) => (
  <Svg {...p}>
    <path d="M10.5 3 8 9l4 13 4-13-2.5-6" />
    <path d="M17 3a2 2 0 0 1 1.6.8l3 4a2 2 0 0 1 .013 2.382l-7.99 10.986a2 2 0 0 1-3.247 0l-7.99-10.986A2 2 0 0 1 2.4 7.8l2.998-3.997A2 2 0 0 1 7 3z" />
    <path d="M2 9h20" />
  </Svg>
);
// Circular arrows: repentance, renewal, new life.
const Refresh = (p: Props) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </Svg>
);
// Broken heart: grief, comfort, a contrite heart.
const HeartCrack = (p: Props) => (
  <Svg {...p}>
    <path d="M12.409 5.824c-.702.792-1.15 1.496-1.415 2.166l2.153 2.156a.5.5 0 0 1 0 .707l-2.293 2.293a.5.5 0 0 0 0 .707L12 15" />
    <path d="M13.508 20.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5a5.5 5.5 0 0 1 9.591-3.677.6.6 0 0 0 .818.001A5.5 5.5 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5z" />
  </Svg>
);
// Rain cloud: trials and storms, also blessing poured out.
const CloudRain = (p: Props) => (
  <Svg {...p}>
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 14v6" />
    <path d="M8 14v6" />
    <path d="M12 16v6" />
  </Svg>
);
// House: home, family, the house built on the rock.
const House = (p: Props) => (
  <Svg {...p}>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Svg>
);
// Megaphone: proclaiming the gospel, evangelism.
const Megaphone = (p: Props) => (
  <Svg {...p}>
    <path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    <path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14" />
    <path d="M8 6v8" />
  </Svg>
);
// Triangle: the Trinity, Father, Son and Holy Spirit.
const Triangle = (p: Props) => (
  <Svg {...p}>
    <path d="M13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
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
  lightbulb: Lightbulb,
  brain: Brain,
  graduationCap: GraduationCap,
  shieldCheck: ShieldCheck,
  handHeart: HandHeart,
  keyRound: KeyRound,
  gift: Gift,
  swords: Swords,
  shieldAlert: ShieldAlert,
  lock: Lock,
  trophy: Trophy,
  scale: Scale,
  music: Music,
  messageCircle: MessageCircle,
  ear: Ear,
  church: Church,
  users: Users,
  hourglass: Hourglass,
  leaf: Leaf,
  gem: Gem,
  refresh: Refresh,
  heartCrack: HeartCrack,
  cloudRain: CloudRain,
  house: House,
  megaphone: Megaphone,
  triangle: Triangle,
};

export function VerseIcon({
  id,
  ...rest
}: { id: VerseIconId } & Props) {
  const Comp = VERSE_ICON_COMPONENTS[id] ?? Bible;
  return <Comp {...rest} />;
}
