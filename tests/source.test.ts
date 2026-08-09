import { describe, it, expect } from "vitest";
import {
  ALL_VERSES,
  MAX_CUSTOM_VERSES,
  isSameSource,
  parsePracticeSource,
  practiceSourceQuery,
  practiceSourceSearch,
} from "@/lib/practice/source";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

describe("parsePracticeSource", () => {
  it("defaults to the whole library", () => {
    expect(parsePracticeSource({})).toEqual(ALL_VERSES);
    expect(parsePracticeSource({ source: "all" })).toEqual(ALL_VERSES);
  });

  it("reads a collection pool", () => {
    expect(parsePracticeSource({ source: "collection", collectionId: A })).toEqual({
      kind: "collection",
      collectionId: A,
    });
  });

  it("reads a custom verse list", () => {
    expect(parsePracticeSource({ source: "custom", verses: `${A},${B}` })).toEqual({
      kind: "custom",
      verseIds: [A, B],
    });
  });

  it("tolerates whitespace around the id list", () => {
    expect(parsePracticeSource({ source: "custom", verses: ` ${A} , ${B} ` })).toEqual({
      kind: "custom",
      verseIds: [A, B],
    });
  });

  // A stale bookmark or a hand-edited URL should still practice something
  // rather than erroring out.
  it("degrades to the full library on a malformed pool", () => {
    expect(parsePracticeSource({ source: "collection" })).toEqual(ALL_VERSES);
    expect(
      parsePracticeSource({ source: "collection", collectionId: "not-a-uuid" }),
    ).toEqual(ALL_VERSES);
    expect(parsePracticeSource({ source: "custom", verses: "" })).toEqual(ALL_VERSES);
    expect(parsePracticeSource({ source: "custom", verses: "a,b,c" })).toEqual(
      ALL_VERSES,
    );
    expect(parsePracticeSource({ source: "nonsense" })).toEqual(ALL_VERSES);
  });

  it("drops non-uuid entries but keeps the valid ones", () => {
    expect(
      parsePracticeSource({ source: "custom", verses: `${A},junk,${B}` }),
    ).toEqual({ kind: "custom", verseIds: [A, B] });
  });

  it("caps a hand-crafted custom list", () => {
    const many = Array.from({ length: MAX_CUSTOM_VERSES + 25 }, () => A).join(",");
    const parsed = parsePracticeSource({ source: "custom", verses: many });
    expect(parsed.kind).toBe("custom");
    if (parsed.kind !== "custom") throw new Error("unreachable");
    expect(parsed.verseIds).toHaveLength(MAX_CUSTOM_VERSES);
  });

  it("takes the first value when a param repeats", () => {
    expect(
      parsePracticeSource({ source: ["collection", "custom"], collectionId: [A, B] }),
    ).toEqual({ kind: "collection", collectionId: A });
  });
});

describe("practiceSourceQuery", () => {
  it("serialises nothing for the default pool", () => {
    expect(practiceSourceQuery(ALL_VERSES)).toEqual({});
    expect(practiceSourceSearch(ALL_VERSES)).toBe("");
  });

  it("round-trips a collection pool", () => {
    const src = { kind: "collection", collectionId: A } as const;
    expect(parsePracticeSource(practiceSourceQuery(src))).toEqual(src);
  });

  it("round-trips a custom pool", () => {
    const src = { kind: "custom", verseIds: [A, B, C] } as const;
    expect(parsePracticeSource(practiceSourceQuery(src))).toEqual(src);
  });

  it("produces a usable query suffix", () => {
    expect(practiceSourceSearch({ kind: "collection", collectionId: A })).toBe(
      `?source=collection&collectionId=${A}`,
    );
  });
});

describe("isSameSource", () => {
  it("compares kind, collection, and verse list", () => {
    expect(isSameSource(ALL_VERSES, ALL_VERSES)).toBe(true);
    expect(
      isSameSource(
        { kind: "collection", collectionId: A },
        { kind: "collection", collectionId: A },
      ),
    ).toBe(true);
    expect(
      isSameSource(
        { kind: "collection", collectionId: A },
        { kind: "collection", collectionId: B },
      ),
    ).toBe(false);
    expect(
      isSameSource({ kind: "custom", verseIds: [A, B] }, { kind: "custom", verseIds: [A, B] }),
    ).toBe(true);
    expect(
      isSameSource({ kind: "custom", verseIds: [A, B] }, { kind: "custom", verseIds: [B, A] }),
    ).toBe(false);
    expect(isSameSource(ALL_VERSES, { kind: "custom", verseIds: [A] })).toBe(false);
  });
});
