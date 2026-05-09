// Tolerant compare for Typed-recall (specs.md §15.2).
//
// Normalization is intentionally aggressive — typing accents and matching
// punctuation exactly is not what we want to test, recall is. After
// normalization we run a token-level edit distance and bucket the
// similarity into the four SM-2 quality grades the spec mandates:
//
//   perfect (sim === 1)             -> 5  Fácil
//   sim >= 0.90                     -> 4  Bien
//   sim >= 0.50                     -> 3  Difícil
//   sim <  0.50                     -> 1  Otra vez
//
// We export the raw similarity too so the UI can show "92% match" alongside
// the auto-graded button.

import type { Quality } from "@/lib/srs/sm2";
import { wordsOnly } from "./tokenize";

export type CompareResult = {
  similarity: number;        // 0..1
  quality: Quality;
  typedTokens: string[];
  canonicalTokens: string[];
  // Per-position alignment hint: for each canonical token, did the user
  // produce a matching token at roughly the same position? Useful for the
  // UI to highlight the missed words once we render a side-by-side diff.
  matchedMask: boolean[];
};

export function tolerantCompare(typed: string, canonical: string): CompareResult {
  const a = normalizeTokens(typed);
  const b = normalizeTokens(canonical);

  if (a.length === 0 && b.length === 0) {
    return { similarity: 0, quality: 1, typedTokens: a, canonicalTokens: b, matchedMask: [] };
  }

  const dist = tokenEditDistance(a, b);
  const denom = Math.max(a.length, b.length, 1);
  const similarity = clamp01(1 - dist / denom);

  return {
    similarity,
    quality: gradeFromSimilarity(similarity),
    typedTokens: a,
    canonicalTokens: b,
    matchedMask: matchedMaskFromAlignment(a, b),
  };
}

export function gradeFromSimilarity(similarity: number): Quality {
  if (similarity >= 1) return 5;
  if (similarity >= 0.9) return 4;
  if (similarity >= 0.5) return 3;
  return 1;
}

// Normalize: NFD (split accents from base letters), strip combining marks,
// lowercase, then tokenize via the shared rule and drop any non-letter/
// number suffix that sneaks through.
// Combining Diacritical Marks block: U+0300..U+036F. After NFD splits
// "fortaléce" into "fortaléce", this strip drops the accent.
const COMBINING_MARKS = /[̀-ͯ]/g;

export function normalizeTokens(text: string): string[] {
  const normalized = text.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();
  return wordsOnly(normalized);
}

// Token-level Levenshtein edit distance. Operates on string arrays so it
// counts a missing or substituted *word* as one edit (not one letter).
function tokenEditDistance(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  // Two rolling rows — O(min(m,n)) memory.
  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1]!;
      } else {
        curr[j] = 1 + Math.min(prev[j]!, curr[j - 1]!, prev[j - 1]!);
      }
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
}

// Per-canonical-token "did the user produce this?" bitmap. We use a small
// position-window match instead of true LCS — cheap and good enough to
// power a side-by-side diff in the UI.
function matchedMaskFromAlignment(typed: string[], canonical: string[]): boolean[] {
  const window = 2;
  const used = new Array<boolean>(typed.length).fill(false);
  const out = new Array<boolean>(canonical.length).fill(false);
  for (let i = 0; i < canonical.length; i++) {
    for (let j = Math.max(0, i - window); j < Math.min(typed.length, i + window + 1); j++) {
      if (!used[j] && typed[j] === canonical[i]) {
        used[j] = true;
        out[i] = true;
        break;
      }
    }
  }
  return out;
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
