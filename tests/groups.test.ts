import { describe, it, expect } from "vitest";
import {
  booksInGroup,
  groupLabel,
  groupsPresent,
  inGroup,
  isBookGroup,
  testamentOf,
} from "@/lib/bible/groups";

describe("book groups", () => {
  it("splits the canon into 39 + 27 books", () => {
    expect(booksInGroup("OT")).toHaveLength(39);
    expect(booksInGroup("NT")).toHaveLength(27);
    expect(booksInGroup("GOSPELS")).toEqual(["MAT", "MRK", "LUK", "JHN"]);
    expect(testamentOf("MAL")).toBe("OT");
    expect(testamentOf("MAT")).toBe("NT");
  });

  it("matches refs, including ranges, by their book", () => {
    expect(inGroup("PRO.3.5", "PRO")).toBe(true);
    expect(inGroup("PRO.3.5", "OT")).toBe(true);
    expect(inGroup("ROM.8.28-ROM.8.30", "NT")).toBe(true);
    expect(inGroup("ROM.8.28", "GOSPELS")).toBe(false);
    expect(inGroup("JHN.3.16", "GOSPELS")).toBe(true);
  });

  it("validates group ids", () => {
    expect(isBookGroup("PRO")).toBe(true);
    expect(isBookGroup("GOSPELS")).toBe(true);
    expect(isBookGroup("XYZ")).toBe(false);
    expect(isBookGroup("")).toBe(false);
  });

  it("labels groups per locale", () => {
    expect(groupLabel("PRO", "es")).toBe("Proverbios");
    expect(groupLabel("PRO", "en")).toBe("Proverbs");
    expect(groupLabel("OT", "es")).toBe("Antiguo Testamento");
  });

  it("lists only populated groups, books in Bible order", () => {
    const g = groupsPresent(["ROM.8.28", "PRO.3.5", "PRO.4.7", "JHN.3.16"]);
    expect(g.broad).toEqual([
      { group: "OT", count: 2 },
      { group: "NT", count: 2 },
      { group: "GOSPELS", count: 1 },
    ]);
    expect(g.books.map((b) => b.group)).toEqual(["PRO", "JHN", "ROM"]);
  });
});
