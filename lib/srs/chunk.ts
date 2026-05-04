// Long-verse chunking (specs.md §15.7).
//
// Verses ≤ 25 words are one chunk; 25–50 words split into 2 chunks; > 50
// words into 3. Boundaries always land on natural punctuation (period >
// semicolon > colon > comma > " — " dash > " "), preferring earlier
// punctuation classes.
//
// The grow-out is cumulative, never partial-only:
//   stage 0: chunk 1 alone     (reps 0–2)
//   stage 1: chunks 1+2        (reps 3–5)
//   stage 2: chunks 1+2+3      (reps 6+)
// Stage 0 maps to a verse without splits to the same "show only chunk 1"
// path so the policy is consistent.
//
// Only Classic mode advances chunkStage today (M4). Word Scramble has its
// own per-segment iteration in §6.4.2 and Fill the Gap operates on the
// fully-shown text per §15.3.

const PUNCT_CLASSES: Array<RegExp> = [
  /\.\s+/g,
  /;\s+/g,
  /:\s+/g,
  /,\s+/g,
  /\s—\s/g,
  /\s/g,
];

export type ChunkPlan = {
  chunks: string[];          // size 1, 2, or 3
  visibleAtStage: (stage: number) => string;
};

export function planChunks(text: string): ChunkPlan {
  const cleaned = text.trim();
  const wordCount = cleaned.split(/\s+/).length;
  const target = wordCount > 50 ? 3 : wordCount > 25 ? 2 : 1;

  const chunks = target === 1 ? [cleaned] : splitIntoChunks(cleaned, target);

  return {
    chunks,
    visibleAtStage(stage: number) {
      const n = Math.min(Math.max(stage + 1, 1), chunks.length);
      return chunks.slice(0, n).join(" ").trim();
    },
  };
}

// Map repetition count to chunk stage per §15.7. Caller passes the *current*
// SrsState.repetitions; the return value is what stage to render and write
// back.
export function stageForReps(reps: number, totalChunks: number): number {
  if (totalChunks <= 1) return 0;
  if (reps <= 2) return 0;
  if (reps <= 5) return Math.min(1, totalChunks - 1);
  return Math.min(2, totalChunks - 1);
}

function splitIntoChunks(text: string, target: number): string[] {
  const wordIdx = wordIndex(text);
  // Aim for evenly-sized chunks by word count, then snap each split point
  // to the nearest preferred punctuation.
  const totalWords = wordIdx.length;
  const splits: number[] = [];
  for (let i = 1; i < target; i++) {
    const desired = Math.round((totalWords * i) / target);
    splits.push(snapToPunct(text, wordIdx, desired));
  }

  const out: string[] = [];
  let start = 0;
  for (const s of splits) {
    out.push(text.slice(start, s).trim());
    start = s;
  }
  out.push(text.slice(start).trim());
  return out.filter((c) => c.length > 0);
}

function wordIndex(text: string): number[] {
  const idxs: number[] = [];
  let inWord = false;
  for (let i = 0; i < text.length; i++) {
    const isSpace = /\s/.test(text[i]!);
    if (!isSpace && !inWord) {
      idxs.push(i);
      inWord = true;
    } else if (isSpace) {
      inWord = false;
    }
  }
  return idxs;
}

function snapToPunct(text: string, wordIdx: number[], desiredWordIndex: number): number {
  // Search outward in word-space from the desired word boundary, looking
  // for a character index that follows one of our preferred punctuation
  // classes. We try each class in order; if none match within the search
  // window we fall back to the desired word boundary's character index.
  const targetCharIdx =
    wordIdx[Math.min(desiredWordIndex, wordIdx.length - 1)] ?? text.length;
  const window = Math.max(8, Math.floor(text.length / 6));

  for (const re of PUNCT_CLASSES) {
    const matches: number[] = [];
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      matches.push(m.index + m[0].length);
      if (m.index === re.lastIndex) re.lastIndex++; // safety: zero-width
    }
    if (matches.length === 0) continue;
    let best = -1;
    let bestDist = Infinity;
    for (const idx of matches) {
      const dist = Math.abs(idx - targetCharIdx);
      if (dist < bestDist) {
        best = idx;
        bestDist = dist;
      }
    }
    if (best >= 0 && bestDist <= window) return best;
  }
  return targetCharIdx;
}
