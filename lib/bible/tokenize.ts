// Tokenization (specs.md §6.4.2 punctuation rule, §15.1 first-letter,
// and feeds the §15.3 cloze module in M6).
//
// One shared tokenizer so first-letter, cloze, and (eventually) Word
// Scramble all agree on what a "word" is. The rule from the spec:
// punctuation is attached to its preceding word so the puzzle never
// fragments. Whitespace is preserved separately from tokens.

export type Token = {
  word: string;        // letters only (no surrounding punctuation)
  prefix: string;      // any punctuation preceding the word (e.g. opening quote)
  suffix: string;      // any punctuation trailing the word (e.g. comma, period)
  raw: string;         // prefix + word + suffix (lossless)
};

// Match runs of word characters (Unicode letter/number, plus apostrophes
// inside a word so "don't" is one token). Anything else between matches
// is treated as separator+punctuation.
const WORD_RE = /[\p{L}\p{N}]+(?:[''][\p{L}\p{N}]+)*/gu;

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  let lastEnd = 0;
  for (const m of text.matchAll(WORD_RE)) {
    const word = m[0];
    const start = m.index ?? 0;
    // The slice between the previous word and this one is split into
    // (a) trailing punctuation that sticks to the previous word and
    // (b) leading punctuation that sticks to the new word. Whitespace
    // itself is dropped — the renderer re-adds a single space between
    // adjacent tokens.
    const between = text.slice(lastEnd, start);
    const prevToken = out[out.length - 1];
    let thisPrefix = "";
    if (between) {
      const firstSpace = between.search(/\s/);
      if (firstSpace >= 0 && prevToken) {
        const trailing = between.slice(0, firstSpace).replace(/\s+/g, "");
        if (trailing) {
          prevToken.suffix += trailing;
          prevToken.raw = prevToken.prefix + prevToken.word + prevToken.suffix;
        }
        thisPrefix = between.slice(firstSpace).replace(/\s+/g, "");
      } else if (prevToken && firstSpace < 0) {
        // No whitespace at all: glue everything to the previous suffix.
        prevToken.suffix += between;
        prevToken.raw = prevToken.prefix + prevToken.word + prevToken.suffix;
      } else {
        // No previous token (text begins with punct/whitespace).
        thisPrefix = between.replace(/\s+/g, "");
      }
    }
    out.push({
      word,
      prefix: thisPrefix,
      suffix: "",
      raw: thisPrefix + word,
    });
    lastEnd = start + word.length;
  }
  // Tail: any punctuation after the final word goes on its suffix.
  if (lastEnd < text.length && out.length > 0) {
    const tail = text.slice(lastEnd).replace(/\s+/g, "");
    if (tail) {
      const last = out[out.length - 1]!;
      last.suffix += tail;
      last.raw = last.prefix + last.word + last.suffix;
    }
  }
  return out;
}

// First-letter rendering (specs.md §15.1). For each token, keep the first
// character of the word and replace the rest with thin spaces; preserve
// punctuation and capitalization. Tokens are joined by a single space so
// the user sees the original cadence without revealing letters.
//
// Example: "Todo lo puedo en Cristo que me fortalece."
//      ->  "T  l  p  e  C  q  m  f."
//
// The hidden letters become non-breaking thin spaces (` `) so a
// monospaced render still aligns columnwise. Callers that need a plain
// "T l p" form can pass `{ thin: false }`.
export function firstLetterRender(
  text: string,
  opts: { thin?: boolean } = {},
): string {
  const thin = opts.thin ?? true;
  const filler = thin ? " " : "";
  const tokens = tokenize(text);
  return tokens
    .map((tok) => {
      const first = tok.word.charAt(0);
      const rest = tok.word.length > 1 ? filler.repeat(tok.word.length - 1) : "";
      return `${tok.prefix}${first}${rest}${tok.suffix}`;
    })
    .join(" ");
}

// Convenience: just the words (lowercased, no punctuation), useful for
// equality checks in compare.ts. Preserves order.
export function wordsOnly(text: string): string[] {
  return tokenize(text).map((t) => t.word.toLowerCase());
}
