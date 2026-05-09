import { describe, it, expect } from "vitest";
import { tokenize } from "@/lib/bible/tokenize";
import { segmentTokens } from "@/lib/srs/scramble";

describe("segmentTokens", () => {
  it("returns one segment when the verse is short", () => {
    const t = tokenize("Yo soy el camino, la verdad y la vida.");
    const segs = segmentTokens(t);
    expect(segs).toHaveLength(1);
  });

  it("splits at the nearest hard punctuation when possible", () => {
    const text =
      "Padre nuestro que estás en los cielos, santificado sea tu nombre. " +
      "Venga tu reino, hágase tu voluntad como en el cielo así también en la tierra.";
    const t = tokenize(text);
    const segs = segmentTokens(t, 10);
    // Each segment should end with a hard-break token (period preferred).
    for (const seg of segs.slice(0, -1)) {
      const last = seg[seg.length - 1]!;
      expect(/[.;:,]$/.test(last.suffix)).toBe(true);
    }
  });

  it("never produces a segment longer than the cap", () => {
    const t = tokenize(Array.from({ length: 60 }, (_, i) => `palabra${i}`).join(" "));
    const segs = segmentTokens(t, 25);
    for (const seg of segs) {
      expect(seg.length).toBeLessThanOrEqual(25);
    }
    // And the concatenation must equal the original token sequence.
    expect(segs.flat().map((s) => s.word)).toEqual(t.map((s) => s.word));
  });
});
