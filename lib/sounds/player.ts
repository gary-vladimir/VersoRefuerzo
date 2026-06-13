"use client";

// Sound effects (specs.md §6.9 + §16.8).
//
// Five named cues per spec: card flip, correct answer, incorrect answer,
// session complete, streak extended. Default ON; the toggle lives in the
// Profile sheet and is persisted on `users.soundEnabled`.
//
// These are SYNTHESIZED with the Web Audio API rather than shipped as audio
// files. Why:
//   - No binary assets to commit or host (the repo previously shipped with
//     empty `public/sounds/` and every cue silently no-opped).
//   - Royalty-free by construction — nothing to license.
//   - Each cue is a few short oscillator notes, guaranteed well under the
//     200ms spec cap.
//
// Browser-only: every Web Audio call is guarded on `typeof window` and on
// feature detection, so SSR and the vitest (node) environment import this
// module safely and `play()` simply no-ops there.

export const SOUND_CUES = [
  "flip",
  "pluck",   // correct answer
  "thud",    // incorrect answer
  "chime",   // session complete
  "flame",   // streak extended
] as const;

export type SoundCue = (typeof SOUND_CUES)[number];

let enabled = true;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

// Lazily create (and reuse) a single AudioContext + master gain. Created on
// first `play()`, which is virtually always inside a user-gesture handler.
function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const w = window as AudioWindow;
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.6;
    master.connect(ctx.destination);
    return ctx;
  } catch {
    return null;
  }
}

export function play(cue: SoundCue): void {
  if (!enabled) return;
  const ac = getContext();
  if (!ac || !master) return;
  // The context can start suspended (e.g. when first touched outside a user
  // gesture, like the session-complete chime that fires on mount). Resume
  // best-effort; if it stays suspended the cue is simply inaudible — never
  // an error.
  if (ac.state === "suspended") ac.resume().catch(() => {});
  try {
    RECIPES[cue](ac, master);
  } catch {
    /* a scheduling hiccup must never break the UI */
  }
}

// One short oscillator note with an exponential gain envelope and an optional
// low-pass filter sweep. exponentialRamp targets can't be 0, so we floor at a
// near-silent value.
function note(
  ac: AudioContext,
  out: AudioNode,
  opts: {
    type: OscillatorType;
    freqFrom: number;
    freqTo?: number;
    duration: number; // seconds
    peak?: number;
    attack?: number; // seconds
    delay?: number; // seconds from now
    filterFrom?: number; // low-pass start (Hz)
    filterTo?: number; // low-pass end (Hz)
  },
): void {
  const t0 = ac.currentTime + (opts.delay ?? 0);
  const dur = opts.duration;
  const peak = opts.peak ?? 0.8;
  const attack = opts.attack ?? 0.005;

  const osc = ac.createOscillator();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.freqFrom, t0);
  if (opts.freqTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqTo), t0 + dur);
  }

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  let tail: AudioNode = osc;
  if (opts.filterFrom !== undefined) {
    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(opts.filterFrom, t0);
    if (opts.filterTo !== undefined) {
      filter.frequency.linearRampToValueAtTime(opts.filterTo, t0 + dur);
    }
    osc.connect(filter);
    tail = filter;
  }
  tail.connect(gain);
  gain.connect(out);

  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const RECIPES: Record<SoundCue, (ac: AudioContext, out: GainNode) => void> = {
  // Card flip — a quick downward whoosh (~60ms).
  flip: (ac, out) =>
    note(ac, out, { type: "triangle", freqFrom: 1200, freqTo: 600, duration: 0.06, peak: 0.5, attack: 0.004 }),

  // Correct answer / quality tap — a gentle pluck (~140ms).
  pluck: (ac, out) =>
    note(ac, out, { type: "triangle", freqFrom: 660, duration: 0.14, peak: 0.7, attack: 0.004 }),

  // Incorrect answer — a soft low thud through a low-pass (~120ms).
  thud: (ac, out) =>
    note(ac, out, { type: "sine", freqFrom: 180, freqTo: 90, duration: 0.12, peak: 0.9, attack: 0.004, filterFrom: 300 }),

  // Session complete — a two-note rising chime (A5 then E6, ~190ms total).
  chime: (ac, out) => {
    note(ac, out, { type: "sine", freqFrom: 880, duration: 0.14, peak: 0.5, attack: 0.004 });
    note(ac, out, { type: "sine", freqFrom: 1318.5, duration: 0.14, peak: 0.45, attack: 0.004, delay: 0.05 });
  },

  // Streak extended — a warm crackle: sawtooth sweep through an opening
  // low-pass (~130ms).
  flame: (ac, out) =>
    note(ac, out, {
      type: "sawtooth",
      freqFrom: 300,
      freqTo: 900,
      duration: 0.13,
      peak: 0.4,
      attack: 0.006,
      filterFrom: 400,
      filterTo: 1600,
    }),
};

// Test seam: tear down the audio context so the next play() rebuilds it.
export function _resetForTests(): void {
  if (ctx) {
    try {
      ctx.close();
    } catch {
      /* ignore */
    }
  }
  ctx = null;
  master = null;
  enabled = true;
}
