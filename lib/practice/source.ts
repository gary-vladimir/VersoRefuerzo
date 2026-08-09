// Practice source pool (specs.md §6.4).
//
// "Each mode pulls from the same source pool, configurable at the top of the
// hub: Todos, a specific collection, or Personalizar (user multi-selects
// individual verses)."
//
// The choice travels in the query string rather than in state or a cookie so
// that every mode page stays a plain server component, and so "Otro verso",
// a reload, or a shared link all keep the same pool. `all` serialises to no
// params at all, which keeps the common /practice/classic URL clean.

export type PracticeSource =
  | { kind: "all" }
  | { kind: "collection"; collectionId: string }
  | { kind: "custom"; verseIds: string[] };

export const ALL_VERSES: PracticeSource = { kind: "all" };

// Hand-picked lists ride in the URL, so cap the length: it bounds both the
// query string and the `in (...)` clause a crafted link can produce.
export const MAX_CUSTOM_VERSES = 50;

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RawSearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

// Anything malformed degrades to the full library rather than erroring —
// a stale bookmark pointing at a deleted collection should still practice.
export function parsePracticeSource(sp: RawSearchParams): PracticeSource {
  switch (one(sp.source)) {
    case "collection": {
      const collectionId = one(sp.collectionId);
      return UUID_RX.test(collectionId)
        ? { kind: "collection", collectionId }
        : ALL_VERSES;
    }
    case "custom": {
      const verseIds = one(sp.verses)
        .split(",")
        .map((s) => s.trim())
        .filter((s) => UUID_RX.test(s))
        .slice(0, MAX_CUSTOM_VERSES);
      return verseIds.length ? { kind: "custom", verseIds } : ALL_VERSES;
    }
    default:
      return ALL_VERSES;
  }
}

// Query object shaped for a next/link `href={{ pathname, query }}`.
export function practiceSourceQuery(
  src: PracticeSource,
): Record<string, string> {
  switch (src.kind) {
    case "collection":
      return { source: "collection", collectionId: src.collectionId };
    case "custom":
      return { source: "custom", verses: src.verseIds.join(",") };
    default:
      return {};
  }
}

// Same thing as a "?a=b" suffix, for the places that build a plain string
// URL (client-side router pushes, "play again" links).
export function practiceSourceSearch(src: PracticeSource): string {
  const q = new URLSearchParams(practiceSourceQuery(src)).toString();
  return q ? `?${q}` : "";
}

export function isSameSource(a: PracticeSource, b: PracticeSource): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "collection" && b.kind === "collection") {
    return a.collectionId === b.collectionId;
  }
  if (a.kind === "custom" && b.kind === "custom") {
    return (
      a.verseIds.length === b.verseIds.length &&
      a.verseIds.every((id, i) => id === b.verseIds[i])
    );
  }
  return true;
}
