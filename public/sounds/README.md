# Sound effects

The five UI cues (spec §6.9 / §16.8) are **synthesized at runtime with the
Web Audio API** in `lib/sounds/player.ts` — there are no audio files to ship.

| Cue | Plays on | Synthesis |
| --- | --- | --- |
| `flip` | Card flip / reveal | triangle 1200→600 Hz, ~60 ms whoosh |
| `pluck` | Correct answer / quality tap | triangle 660 Hz, ~140 ms |
| `thud` | Incorrect answer | sine 180→90 Hz through a low-pass, ~120 ms |
| `chime` | Session complete | two rising sines (A5, E6), ~190 ms |
| `flame` | Streak extended | sawtooth 300→900 Hz, opening low-pass, ~130 ms |

Each cue is royalty-free by construction and well under the 200 ms spec cap.
The toggle in the Profile sheet (persisted on `users.soundEnabled`) gates
playback; with sound off, or on a browser without `AudioContext`, `play()`
no-ops silently. This directory is kept only so the Docker `COPY public`
step always succeeds.
