// Progressive cloze (specs.md §15.3, §6.4.4).
//
// Blank density grows monotonically with `repetitions`:
//
//   reps 0–2  → 1 blank (longest non-stopword)
//   reps 3–5  → 2–3 blanks
//   reps 6–8  → ~30–50% of words
//   reps 9+   → ~60–80% of words
//
// Once density crosses the 50% threshold the round is reclassified as a
// RECALL mode for SRS purposes (§15.4 + §15.3). The session route reads
// `isRecallDensity(density)` to decide between `applyRecallGrade` and
// `applyRecognitionTouch`.
//
// Blank picks are deterministic-ish: longest non-stopword tokens first so
// the verse keeps its scaffolding for as long as possible. We use the same
// tokenizer as first-letter / scramble so a single rule decides what a
// "word" is.

import { tokenize, type Token } from "@/lib/bible/tokenize";

export type BlankPlan = {
  tokens: Token[];          // every token in order; some are blanks
  blankIndices: number[];   // indices into tokens that are blanks (sorted asc)
  density: number;          // blanks / totalWords
  isRecall: boolean;
};

export function blankCountForReps(reps: number, totalWords: number): number {
  if (totalWords <= 0) return 0;
  if (reps <= 2) return 1;
  if (reps <= 5) return clamp(Math.round(totalWords * 0.25), 2, 3);
  if (reps <= 8) return Math.max(2, Math.round(totalWords * 0.4));
  return Math.max(3, Math.round(totalWords * 0.7));
}

export function densityForReps(reps: number, totalWords: number): number {
  if (totalWords <= 0) return 0;
  return blankCountForReps(reps, totalWords) / totalWords;
}

export function isRecallDensity(density: number): boolean {
  return density >= 0.5;
}

export function chooseBlanks(
  text: string,
  reps: number,
  locale: "es" | "en",
): BlankPlan {
  const tokens = tokenize(text);
  const total = tokens.length;
  if (total === 0) {
    return { tokens, blankIndices: [], density: 0, isRecall: false };
  }
  const want = Math.min(blankCountForReps(reps, total), total);
  const stopwords = locale === "es" ? STOPWORDS_ES : STOPWORDS_EN;

  // Two-pass selection: first non-stopwords sorted by word length desc,
  // then if we still need more, fall back to stopwords (low-density rounds
  // never actually need this branch).
  const nonStop = tokens
    .map((t, i) => ({ i, len: t.word.length }))
    .filter((c) => !stopwords.has(tokens[c.i]!.word.toLowerCase()))
    .sort((a, b) => b.len - a.len || a.i - b.i);

  const picked = new Set<number>();
  for (const c of nonStop) {
    if (picked.size >= want) break;
    picked.add(c.i);
  }
  if (picked.size < want) {
    for (let i = 0; i < tokens.length && picked.size < want; i++) {
      if (!picked.has(i)) picked.add(i);
    }
  }
  const blankIndices = [...picked].sort((a, b) => a - b);
  const density = blankIndices.length / total;
  return { tokens, blankIndices, density, isRecall: isRecallDensity(density) };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Curated stopword lists. Kept short on purpose: the goal is to skip the
// "scaffolding" particles that wouldn't test memorization — articles,
// conjunctions, common prepositions. Heavy filtering would leave nothing
// to blank on short verses.
const STOPWORDS_ES = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "y", "e", "o", "u", "ni", "pero", "mas", "sino",
  "de", "del", "al", "a", "en", "por", "para", "con", "sin", "sobre",
  "que", "qué", "como", "cómo", "si", "sí", "no",
  "es", "ser", "son", "fue", "era", "eran", "soy", "eres",
  "se", "su", "sus", "le", "les", "lo", "la", "las", "los",
  "mi", "mis", "tu", "tus", "nos", "os",
  "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "eso", "esto", "aquí", "ahí", "allí",
]);

const STOPWORDS_EN = new Set([
  "the", "a", "an",
  "and", "or", "but", "nor", "so",
  "of", "in", "on", "at", "to", "for", "with", "from", "by", "as", "into",
  "is", "am", "are", "was", "were", "be", "been", "being",
  "i", "you", "he", "she", "it", "we", "they",
  "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their",
  "this", "that", "these", "those",
  "no", "not",
]);
