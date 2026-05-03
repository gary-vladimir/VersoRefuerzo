import { describe, it, expect } from "vitest";
import { defaultColorForIndex, defaultIconForBook } from "@/lib/bible/defaults";
import { CARD_COLOR_IDS } from "@/lib/catalog";

describe("defaultColorForIndex", () => {
  it("rotates through the 8 card colors", () => {
    for (let i = 0; i < 16; i++) {
      expect(defaultColorForIndex(i)).toBe(CARD_COLOR_IDS[i % 8]);
    }
  });
  it("handles negative inputs safely", () => {
    expect(CARD_COLOR_IDS).toContain(defaultColorForIndex(-1));
    expect(CARD_COLOR_IDS).toContain(defaultColorForIndex(-9));
  });
});

describe("defaultIconForBook", () => {
  it("uses the spec-suggested seeds", () => {
    expect(defaultIconForBook("PSA")).toBe("sheep");
    expect(defaultIconForBook("ROM")).toBe("cross");
    expect(defaultIconForBook("PRO")).toBe("mountain");
    expect(defaultIconForBook("JHN")).toBe("dove");
    expect(defaultIconForBook("REV")).toBe("crown");
    expect(defaultIconForBook("GEN")).toBe("seed");
  });
  it("falls back to bible for unknown books", () => {
    expect(defaultIconForBook("ZZZ")).toBe("bible");
    expect(defaultIconForBook("HEB")).toBe("bible");
  });
});
