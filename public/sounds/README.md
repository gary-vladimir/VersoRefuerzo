# Sound effects

The app expects five short, royalty-free MP3 cues here. Spec §6.9 caps each at
**200 ms** and §16.8 says the toggle defaults to ON.

| File | Plays on | Tone |
| --- | --- | --- |
| `flip.mp3` | Card flip | subtle whoosh |
| `pluck.mp3` | Correct answer / quality button | gentle pluck |
| `thud.mp3` | Incorrect answer | soft thud |
| `chime.mp3` | Session complete | uplifting chime |
| `flame.mp3` | Streak extended | warm flame crackle |

Drop real assets here before shipping. Without them, `lib/sounds/player.ts`
silently no-ops every `play()` call — the app remains fully functional.
