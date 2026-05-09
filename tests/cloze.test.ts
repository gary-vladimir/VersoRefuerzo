import { describe, it, expect } from "vitest";
import {
  blankCountForReps,
  chooseBlanks,
  densityForReps,
  isRecallDensity,
} from "@/lib/srs/cloze";

describe("blankCountForReps", () => {
  it("starts at 1 for early reps", () => {
    expect(blankCountForReps(0, 10)).toBe(1);
    expect(blankCountForReps(2, 10)).toBe(1);
  });
  it("ramps to 2-3 in the mid range", () => {
    expect(blankCountForReps(3, 10)).toBeGreaterThanOrEqual(2);
    expect(blankCountForReps(5, 12)).toBeLessThanOrEqual(3);
  });
  it("crosses 50% density on long verses past rep 9", () => {
    const total = 12;
    const reps = 10;
    const blanks = blankCountForReps(reps, total);
    expect(blanks / total).toBeGreaterThanOrEqual(0.5);
  });
});

describe("isRecallDensity", () => {
  it("flips at the 50% threshold", () => {
    expect(isRecallDensity(0.49)).toBe(false);
    expect(isRecallDensity(0.5)).toBe(true);
    expect(isRecallDensity(0.8)).toBe(true);
  });
});

describe("chooseBlanks", () => {
  const TEXT = "Yo soy el camino, la verdad y la vida.";
  // tokens: yo soy el camino la verdad y la vida (9 words)

  it("picks one blank at low reps and prefers long non-stopwords", () => {
    const plan = chooseBlanks(TEXT, 0, "es");
    expect(plan.blankIndices).toHaveLength(1);
    const tok = plan.tokens[plan.blankIndices[0]!]!.word.toLowerCase();
    // "camino", "verdad", "vida" are longer than "yo", "soy", etc.
    expect(["camino", "verdad", "vida"]).toContain(tok);
    expect(plan.isRecall).toBe(false);
  });

  it("avoids stopwords (es)", () => {
    const plan = chooseBlanks(TEXT, 5, "es");
    for (const i of plan.blankIndices) {
      const w = plan.tokens[i]!.word.toLowerCase();
      // Articles/conjunctions should not be picked while content words remain
      expect(["el", "la", "y", "los", "las", "de"]).not.toContain(w);
    }
  });

  it("density grows monotonically with reps", () => {
    const long =
      "Padre nuestro que estás en los cielos santificado sea tu nombre " +
      "venga tu reino hágase tu voluntad como en el cielo así también en la tierra";
    const d0 = densityForReps(0, long.split(/\s+/).length);
    const d5 = densityForReps(5, long.split(/\s+/).length);
    const d8 = densityForReps(8, long.split(/\s+/).length);
    const d12 = densityForReps(12, long.split(/\s+/).length);
    expect(d0).toBeLessThan(d5);
    expect(d5).toBeLessThan(d8);
    expect(d8).toBeLessThanOrEqual(d12);
  });

  it("flips to recall classification once blanks dominate", () => {
    const long =
      "Padre nuestro que estás en los cielos santificado sea tu nombre venga tu reino";
    const plan = chooseBlanks(long, 12, "es");
    expect(plan.isRecall).toBe(true);
  });

  it("works on English with English stopwords", () => {
    const plan = chooseBlanks("I am the way the truth and the life", 0, "en");
    expect(plan.blankIndices).toHaveLength(1);
    const tok = plan.tokens[plan.blankIndices[0]!]!.word.toLowerCase();
    expect(["way", "truth", "life"]).toContain(tok);
  });
});
