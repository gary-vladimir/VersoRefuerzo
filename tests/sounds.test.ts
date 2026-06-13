import { describe, it, expect } from "vitest";
import {
  SOUND_CUES,
  play,
  setSoundEnabled,
  isSoundEnabled,
  _resetForTests,
} from "@/lib/sounds/player";

// The player synthesizes cues with the Web Audio API in the browser. Under
// vitest (node, no AudioContext) every play() must no-op silently rather than
// throw, so importing the module anywhere stays safe.
describe("sounds player", () => {
  it("exposes the five named cues", () => {
    expect([...SOUND_CUES]).toEqual(["flip", "pluck", "thud", "chime", "flame"]);
  });

  it("no-ops without AudioContext and never throws", () => {
    _resetForTests();
    expect(() => SOUND_CUES.forEach((cue) => play(cue))).not.toThrow();
  });

  it("tracks the enabled flag", () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
    _resetForTests();
  });
});
