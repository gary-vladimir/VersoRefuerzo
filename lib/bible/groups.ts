// Automatic book groups (no collections table involved).
//
// Every verse already belongs to a book and a testament through its
// canonical reference ("PRO.3.5" is Proverbs, Old Testament), so the app
// can offer "Proverbios", "Antiguo Testamento" or "Evangelios" as filters
// and practice pools without the user filing anything. Groups are computed
// on the fly from `canonicalRef`, so they never drift out of date and add
// nothing to the database.
//
// A group id is either a USFM book code ("PRO") or one of the three
// testament-level ids below.

import { BOOK_CODES, bookName } from "./reference";

const MATTHEW = BOOK_CODES.indexOf("MAT");
const OT_BOOKS = BOOK_CODES.slice(0, MATTHEW);
const NT_BOOKS = BOOK_CODES.slice(MATTHEW);
const GOSPEL_BOOKS = ["MAT", "MRK", "LUK", "JHN"];

export const BROAD_GROUPS = ["OT", "NT", "GOSPELS"] as const;

const BROAD_LABELS: Record<(typeof BROAD_GROUPS)[number], { es: string; en: string }> = {
  OT: { es: "Antiguo Testamento", en: "Old Testament" },
  NT: { es: "Nuevo Testamento", en: "New Testament" },
  GOSPELS: { es: "Evangelios", en: "Gospels" },
};

function isBroad(group: string): group is (typeof BROAD_GROUPS)[number] {
  return (BROAD_GROUPS as readonly string[]).includes(group);
}

export function isBookGroup(group: string): boolean {
  return isBroad(group) || BOOK_CODES.includes(group);
}

// The books a group covers.
export function booksInGroup(group: string): readonly string[] {
  if (group === "OT") return OT_BOOKS;
  if (group === "NT") return NT_BOOKS;
  if (group === "GOSPELS") return GOSPEL_BOOKS;
  return BOOK_CODES.includes(group) ? [group] : [];
}

// Book code of a canonical ref ("ROM.8.28-ROM.8.30" -> "ROM").
export function bookOf(canonicalRef: string): string {
  return canonicalRef.split(".")[0] ?? "";
}

export function inGroup(canonicalRef: string, group: string): boolean {
  return booksInGroup(group).includes(bookOf(canonicalRef));
}

export function testamentOf(book: string): "OT" | "NT" {
  return BOOK_CODES.indexOf(book) < MATTHEW ? "OT" : "NT";
}

export function groupLabel(group: string, locale: "es" | "en"): string {
  return isBroad(group) ? BROAD_LABELS[group][locale] : bookName(group, locale);
}

export type GroupCount = { group: string; count: number };

// The groups that actually contain verses, with counts: the three broad
// groups first, then each book in Bible order. Empty groups are left out so
// a small library shows a short list.
export function groupsPresent(canonicalRefs: readonly string[]): {
  broad: GroupCount[];
  books: GroupCount[];
} {
  const perBook = new Map<string, number>();
  for (const ref of canonicalRefs) {
    const b = bookOf(ref);
    perBook.set(b, (perBook.get(b) ?? 0) + 1);
  }
  const count = (books: readonly string[]) =>
    books.reduce((n, b) => n + (perBook.get(b) ?? 0), 0);
  return {
    broad: BROAD_GROUPS.map((g) => ({ group: g, count: count(booksInGroup(g)) })).filter(
      (g) => g.count > 0,
    ),
    books: BOOK_CODES.filter((b) => perBook.has(b)).map((b) => ({
      group: b,
      count: perBook.get(b)!,
    })),
  };
}
