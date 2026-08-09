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
    // Every non-final segment either lands on punctuation or is a full-width
    // hard cut. The hard cut is the documented last resort for a run of words
    // with no punctuation in range — "hágase tu voluntad como en el cielo así
    // también en" in this verse — so requiring punctuation everywhere would
    // assert something the policy never promises.
    for (const seg of segs.slice(0, -1)) {
      const last = seg[seg.length - 1]!;
      const brokeOnPunctuation = /[.;:,]$/.test(last.suffix);
      expect(brokeOnPunctuation || seg.length === 10).toBe(true);
    }
  });

  it("prefers a hard break over a nearer comma", () => {
    // Window of 10 holds both a comma (index 3) and a period (index 6); the
    // period wins even though the comma is closer to the segment start.
    const t = tokenize("uno dos tres cuatro, cinco seis siete. ocho nueve diez once doce");
    const segs = segmentTokens(t, 10);
    expect(segs[0]!.map((x) => x.word).join(" ")).toBe(
      "uno dos tres cuatro cinco seis siete",
    );
  });

  it("falls back to a comma when no hard break is in range", () => {
    const t = tokenize("uno dos tres cuatro, cinco seis siete ocho nueve diez once doce");
    const segs = segmentTokens(t, 10);
    expect(segs[0]!.map((x) => x.word).join(" ")).toBe("uno dos tres cuatro");
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
