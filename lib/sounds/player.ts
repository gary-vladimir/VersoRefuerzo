"use client";

// Sound effects (specs.md §6.9 + §16.8).
//
// Five named cues per spec: card flip, correct answer, incorrect answer,
// session complete, streak extended. Default ON; the toggle lives in the
// Profile sheet and is persisted on `users.soundEnabled`.
//
// Implementation notes:
//   - Browser-only. We guard every API on `typeof window` so server
//     components / SSR don't crash importing this module.
//   - Audio elements are pooled per cue: one HTMLAudioElement per name,
//     reset to t=0 on each play. Avoids DOM-thrash for rapid taps.
//   - Missing files are not an error — `play()` is a no-op when the
//     element fails to load. The repo ships without audio binaries; drop
//     real .mp3 / .ogg files into `public/sounds/` to enable playback.
//   - Total per-cue length should be < 200ms per spec.

export const SOUND_CUES = [
  "flip",
  "pluck",   // correct answer
  "thud",    // incorrect answer
  "chime",   // session complete
  "flame",   // streak extended
] as const;

export type SoundCue = (typeof SOUND_CUES)[number];

const SRC_BY_CUE: Record<SoundCue, string> = {
  flip: "/sounds/flip.mp3",
  pluck: "/sounds/pluck.mp3",
  thud: "/sounds/thud.mp3",
  chime: "/sounds/chime.mp3",
  flame: "/sounds/flame.mp3",
};

let pool: Partial<Record<SoundCue, HTMLAudioElement>> = {};
let enabled = true;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function play(cue: SoundCue): void {
  if (!enabled || typeof window === "undefined") return;
  const existing = pool[cue];
  const el = existing ?? createAudio(cue);
  if (!el) return;
  // Reset and play. We swallow rejections — autoplay policies fire
  // promise rejections silently, and missing files just mean no sound.
  try {
    el.currentTime = 0;
    el.play().catch(() => {});
  } catch {
    /* element disposed; recreate on next play */
    pool[cue] = undefined;
  }
}

function createAudio(cue: SoundCue): HTMLAudioElement | null {
  if (typeof Audio === "undefined") return null;
  try {
    const el = new Audio(SRC_BY_CUE[cue]);
    el.preload = "auto";
    el.volume = 0.6;
    pool[cue] = el;
    return el;
  } catch {
    return null;
  }
}

// Test seam: drop the pool so a new toggle of the audio source list
// re-creates fresh elements on next play.
export function _resetForTests(): void {
  pool = {};
  enabled = true;
}
