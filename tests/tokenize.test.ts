import { describe, it, expect } from "vitest";
import { tokenize, firstLetterRender, wordsOnly } from "@/lib/bible/tokenize";

describe("tokenize", () => {
  it("splits a simple sentence into words", () => {
    const t = tokenize("Yo soy el camino");
    expect(t.map((x) => x.word)).toEqual(["Yo", "soy", "el", "camino"]);
    expect(t.every((x) => x.suffix === "" && x.prefix === "")).toBe(true);
  });

  it("attaches trailing punctuation to the preceding word", () => {
    const t = tokenize("camino, verdad y vida.");
    const map = t.map((x) => [x.word, x.suffix]);
    expect(map).toEqual([
      ["camino", ","],
      ["verdad", ""],
      ["y", ""],
      ["vida", "."],
    ]);
  });

  it("preserves accented characters", () => {
    const t = tokenize("fortalecía énfasis");
    expect(t.map((x) => x.word)).toEqual(["fortalecía", "énfasis"]);
  });

  it("treats internal apostrophes as part of one word", () => {
    const t = tokenize("don't worry");
    expect(t.map((x) => x.word)).toEqual(["don't", "worry"]);
  });

  it("captures opening punctuation as prefix", () => {
    const t = tokenize('"Hola" dijo.');
    expect(t[0]!.prefix).toBe('"');
    expect(t[0]!.word).toBe("Hola");
    expect(t[0]!.suffix).toBe('"');
    expect(t[1]!.suffix).toBe(".");
  });
});

describe("firstLetterRender", () => {
  it("keeps first letter of each word and original punctuation", () => {
    const out = firstLetterRender("Todo lo puedo en Cristo que me fortalece.", {
      thin: false,
    });
    expect(out).toBe("T l p e C q m f.");
  });

  it("preserves capitalization", () => {
    const out = firstLetterRender("Yo soy el camino, la verdad y la vida.", {
      thin: false,
    });
    expect(out).toBe("Y s e c, l v y l v.");
  });

  it("preserves newlines and multi-space gaps (§15.1)", () => {
    const out = firstLetterRender("Yo soy\nel camino.", { thin: false });
    expect(out).toBe("Y s\ne c.");
  });

  it("leaves quotes and other punctuation in place", () => {
    const out = firstLetterRender('"Hola" — dijo Pedro.', { thin: false });
    expect(out).toBe('"H" — d P.');
  });
});

describe("wordsOnly", () => {
  it("returns lowercase word list without punctuation", () => {
    expect(wordsOnly("Yo soy el Camino, la VERDAD y la vida.")).toEqual([
      "yo",
      "soy",
      "el",
      "camino",
      "la",
      "verdad",
      "y",
      "la",
      "vida",
    ]);
  });
});
