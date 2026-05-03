// Smart defaults for the New Verse form (specs.md §17.1).
//
// Two pieces of pure logic, kept apart from UI so we can reuse them
// server-side (e.g. when seeding from onboarding) and unit-test them.

import { CARD_COLORS } from "@/lib/catalog";
import type { CardColorId } from "@/lib/catalog";

// Auto-rotate through the 8 colors: the Nth verse gets cardColors[N % 8].
export function defaultColorForIndex(verseCountSoFar: number): CardColorId {
  const i = ((verseCountSoFar % CARD_COLORS.length) + CARD_COLORS.length) % CARD_COLORS.length;
  return CARD_COLORS[i]!.id;
}

// Book → icon mapping per §17.1 seeds. Keys are USFM book codes (the bcv
// parser output, after osis→usfm). Anything not in the table falls back to
// `bible`.
const BOOK_ICON: Record<string, string> = {
  PSA: "sheep",
  PHP: "flameSmall",
  ROM: "cross",
  PRO: "mountain",
  JHN: "dove",
  MAT: "dove",
  MRK: "dove",
  LUK: "dove",
  REV: "crown",
  GEN: "seed",
  EXO: "mountain",
};

export function defaultIconForBook(usfmBookCode: string): string {
  return BOOK_ICON[usfmBookCode] ?? "bible";
}
