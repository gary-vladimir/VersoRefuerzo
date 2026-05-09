import { describe, it, expect } from "vitest";
import { tolerantCompare, gradeFromSimilarity, normalizeTokens } from "@/lib/bible/compare";

describe("normalizeTokens", () => {
  it("lowercases, strips accents and punctuation", () => {
    expect(normalizeTokens("¡Fortaléce, Señor!")).toEqual(["fortalece", "senor"]);
  });
});

describe("gradeFromSimilarity", () => {
  it("buckets per spec §15.2", () => {
    expect(gradeFromSimilarity(1)).toBe(5);
    expect(gradeFromSimilarity(0.95)).toBe(4);
    expect(gradeFromSimilarity(0.9)).toBe(4);
    expect(gradeFromSimilarity(0.7)).toBe(3);
    expect(gradeFromSimilarity(0.5)).toBe(3);
    expect(gradeFromSimilarity(0.49)).toBe(1);
    expect(gradeFromSimilarity(0)).toBe(1);
  });
});

describe("tolerantCompare", () => {
  it("perfect match returns quality 5", () => {
    const r = tolerantCompare(
      "Todo lo puedo en Cristo que me fortalece",
      "Todo lo puedo en Cristo que me fortalece.",
    );
    expect(r.similarity).toBe(1);
    expect(r.quality).toBe(5);
  });

  it("a single missing accent is still a perfect match (AC-13)", () => {
    const r = tolerantCompare(
      "Todo lo puedo en Cristo que me fortalece",
      "Todo lo puedo en Cristo que me fortaléce",
    );
    expect(r.similarity).toBe(1);
    expect(r.quality).toBe(5);
  });

  it("punctuation and case differences are ignored", () => {
    const r = tolerantCompare(
      "yo soy el camino la verdad y la vida",
      "Yo soy el camino, la verdad y la vida.",
    );
    expect(r.similarity).toBe(1);
    expect(r.quality).toBe(5);
  });

  it("one missing word out of ten lands in the Bien bucket", () => {
    const r = tolerantCompare(
      "Todo puedo en Cristo que me fortalece y mi salvador",
      "Todo lo puedo en Cristo que me fortalece y mi salvador",
    );
    expect(r.quality).toBe(4);
    expect(r.similarity).toBeGreaterThan(0.9);
  });

  it("about half wrong lands in the Difícil bucket", () => {
    const r = tolerantCompare(
      "Todo lo puedo en algún sitio",
      "Todo lo puedo en Cristo que me fortalece",
    );
    expect(r.quality).toBe(3);
  });

  it("very different produces Otra vez", () => {
    const r = tolerantCompare("hola amigo", "Yo soy el camino la verdad y la vida");
    expect(r.quality).toBe(1);
  });

  it("empty input returns Otra vez, never crashes", () => {
    const r = tolerantCompare("", "Todo lo puedo en Cristo");
    expect(r.quality).toBe(1);
    expect(r.similarity).toBe(0);
  });

  it("matchedMask flags which canonical words the user produced", () => {
    const r = tolerantCompare(
      "Todo puedo en Cristo",
      "Todo lo puedo en Cristo",
    );
    // canonical: [todo, lo, puedo, en, cristo]
    // typed:     [todo,     puedo, en, cristo]  -> "lo" missing
    expect(r.matchedMask).toEqual([true, false, true, true, true]);
  });
});
