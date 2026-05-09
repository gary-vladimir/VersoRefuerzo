// Scramble segmentation (specs.md §6.4.2).
//
// "Verses longer than 25 words must be split into ordered sub-segments
// shown one at a time, each its own scramble round." This module owns
// that split. We keep it adjacent to chunk.ts but in its own file because
// the policy is different — chunk grow-out is *cumulative* (§15.7), while
// scramble segments are *sequential* (each segment is its own round).
//
// Segmentation rule:
//   - target ≤ MAX_PER_SEGMENT word tokens per segment
//   - prefer to break at the nearest sentence-ending punctuation
//     (period, semicolon, colon) inside the target window
//   - fall back to comma if no harder break is in range
//   - last-ditch: hard break at the target word index

import type { Token } from "@/lib/bible/tokenize";

export const MAX_PER_SEGMENT = 25;

const HARD_BREAK = /[.;:]$/;
const SOFT_BREAK = /,$/;

export function segmentTokens(
  tokens: Token[],
  maxPerSegment: number = MAX_PER_SEGMENT,
): Token[][] {
  if (tokens.length <= maxPerSegment) return [tokens];
  const out: Token[][] = [];
  let start = 0;
  while (start < tokens.length) {
    const idealEnd = Math.min(tokens.length, start + maxPerSegment);
    if (idealEnd >= tokens.length) {
      out.push(tokens.slice(start));
      break;
    }
    const cut = pickBreakpoint(tokens, start, idealEnd);
    out.push(tokens.slice(start, cut));
    start = cut;
  }
  return out;
}

// Search backward from idealEnd for a token whose `suffix` ends in hard
// punctuation; if none, try soft punctuation. If neither lives within the
// window, hard-cut at idealEnd. We never extend past idealEnd because
// going over the segment cap defeats the purpose.
function pickBreakpoint(tokens: Token[], start: number, idealEnd: number): number {
  for (let i = idealEnd - 1; i > start; i--) {
    if (HARD_BREAK.test(tokens[i]!.suffix)) return i + 1;
  }
  for (let i = idealEnd - 1; i > start; i--) {
    if (SOFT_BREAK.test(tokens[i]!.suffix)) return i + 1;
  }
  return idealEnd;
}
