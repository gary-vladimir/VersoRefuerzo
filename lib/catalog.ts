// User-facing catalogs: 8 verse-card colors and 44 verse icons.
// Source: specs.md §7.3 / §7.4 (the icon set was later extended).
//
// Color rendering uses CSS variables already defined in styles/tokens.css
// (`--card-{id}-bg`, `-solid`, `-tint`). This file holds the canonical IDs
// only — visuals stay in CSS.

export const CARD_COLOR_IDS = [
  "indigo", "violet", "rose", "amber",
  "emerald", "sky", "crimson", "midnight",
] as const;
export type CardColorId = (typeof CARD_COLOR_IDS)[number];

export const CARD_COLORS: Array<{
  id: CardColorId;
  labelEs: string;
  labelEn: string;
}> = [
  { id: "indigo",   labelEs: "Indigo",      labelEn: "Indigo" },
  { id: "violet",   labelEs: "Violeta",     labelEn: "Violet" },
  { id: "rose",     labelEs: "Rosa",        labelEn: "Rose" },
  { id: "amber",    labelEs: "Ámbar",       labelEn: "Amber" },
  { id: "emerald",  labelEs: "Esmeralda",   labelEn: "Emerald" },
  { id: "sky",      labelEs: "Cielo",       labelEn: "Sky" },
  { id: "crimson",  labelEs: "Carmesí",     labelEn: "Crimson" },
  { id: "midnight", labelEs: "Medianoche",  labelEn: "Midnight" },
];

// Verse icons: the original 18 (specs §7.4), then 26 more drawn from Lucide.
// The svg components live in components/icons/VerseIcons.tsx.
export const VERSE_ICON_IDS = [
  "bible", "cross", "dove", "sheep", "lion", "fishLoaves",
  "crown", "flameSmall", "heart", "mountain", "water", "sun",
  "door", "shield", "handPray", "anchor", "seed", "book",
  "triangle", "church", "music", "messageCircle", "ear", "lightbulb",
  "brain", "graduationCap", "shieldCheck", "shieldAlert", "lock", "swords",
  "handHeart", "users", "house", "gift", "keyRound", "trophy",
  "scale", "gem", "leaf", "hourglass", "refresh", "heartCrack",
  "cloudRain", "megaphone",
] as const;
export type VerseIconId = (typeof VERSE_ICON_IDS)[number];

// 8 collection-tag color presets (specs §7.5 / §17.6 — unnamed in v1).
// Each preset is identified by an opaque key; UI renders via CSS vars
// keyed by the preset id.
export const COLLECTION_COLOR_IDS = [
  "rose", "sky", "amber", "emerald",
  "violet", "indigo", "crimson", "cyan",
] as const;
export type CollectionColorId = (typeof COLLECTION_COLOR_IDS)[number];

export const COLLECTION_COLORS: Array<{
  id: CollectionColorId;
  bg: string;
  fg: string;
  dot: string;
}> = [
  { id: "rose",    bg: "#FCE7F3", fg: "#BE185D", dot: "#EC4899" },
  { id: "sky",     bg: "#E0F2FE", fg: "#0369A1", dot: "#0EA5E9" },
  { id: "amber",   bg: "#FEF3C7", fg: "#B45309", dot: "#F59E0B" },
  { id: "emerald", bg: "#D1FAE5", fg: "#047857", dot: "#10B981" },
  { id: "violet",  bg: "#EDE9FE", fg: "#6D28D9", dot: "#8B5CF6" },
  { id: "indigo",  bg: "#E0E7FF", fg: "#3730A3", dot: "#6366F1" },
  { id: "crimson", bg: "#FEE2E2", fg: "#B91C1C", dot: "#EF4444" },
  { id: "cyan",    bg: "#CFFAFE", fg: "#0E7490", dot: "#06B6D4" },
];

export function isCardColor(s: string): s is CardColorId {
  return (CARD_COLOR_IDS as readonly string[]).includes(s);
}
export function isVerseIcon(s: string): s is VerseIconId {
  return (VERSE_ICON_IDS as readonly string[]).includes(s);
}
export function isCollectionColor(s: string): s is CollectionColorId {
  return (COLLECTION_COLOR_IDS as readonly string[]).includes(s);
}

// Bible versions the app supports (specs.md §9.2), in the order the New
// Verse picker lists them: the Spanish versions first, then English. A
// version only appears when its APIBIBLE_ID_<KEY> is configured.
export const VERSION_IDS = ["NBLA", "NTV", "NVI", "RVR1960", "NIV"] as const;
export type VersionId = (typeof VERSION_IDS)[number];

// Full names for the version dropdown, so "NTV" means something to a new
// user.
export const VERSION_NAMES: Record<VersionId, string> = {
  NBLA: "Nueva Biblia de las Américas",
  NTV: "Nueva Traducción Viviente",
  NVI: "Nueva Versión Internacional",
  RVR1960: "Reina-Valera 1960",
  NIV: "New International Version",
};

// Language each Bible version's text is written in. Text-level logic (cloze
// stopwords, distractor pools) must key off the version, never off the UI
// locale: a verse keeps the language of its version whatever the UI shows.
const VERSION_TEXT_LOCALE: Record<VersionId, "es" | "en"> = {
  NBLA: "es",
  NTV: "es",
  NVI: "es",
  RVR1960: "es",
  NIV: "en",
};

// The version each interface language starts with on the New Verse form.
const PREFERRED_VERSION: Record<"es" | "en", VersionId> = { es: "NBLA", en: "NIV" };

// Version pre-selected on the New Verse form. The last version the user
// saved with wins when it is in the interface's language, so a Spanish user
// who prefers NTV keeps NTV. Otherwise the language's preferred version
// (NBLA for Spanish, NIV for English), then any available version in that
// language, then whatever is available.
export function defaultVersionFor(
  locale: "es" | "en",
  available: readonly string[],
  lastVersion?: string | null,
): string | undefined {
  const inLocale = (v: string) => textLocaleForVersion(v) === locale;
  if (lastVersion && available.includes(lastVersion) && inLocale(lastVersion)) {
    return lastVersion;
  }
  if (available.includes(PREFERRED_VERSION[locale])) return PREFERRED_VERSION[locale];
  return available.find(inLocale) ?? available[0];
}

export function textLocaleForVersion(version: string): "es" | "en" {
  return VERSION_TEXT_LOCALE[version as VersionId] ?? "es";
}
