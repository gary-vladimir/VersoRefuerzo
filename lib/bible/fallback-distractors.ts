// Fallback distractor pool for Fill the Gap (specs.md §6.4.4 + §13).
//
// When the user's library has fewer than ~5 verses, there aren't enough
// real words from their own corpus to populate three plausible distractors
// per blank. We fall back to a curated bundle of common biblical-context
// content words per language. Stopwords are deliberately excluded — the
// distractors should be plausible content swaps, not obvious filler.

export const FALLBACK_DISTRACTORS_ES: readonly string[] = [
  "Señor", "Cristo", "Dios", "Espíritu", "Padre", "Hijo",
  "amor", "fe", "esperanza", "paz", "gracia", "misericordia",
  "verdad", "luz", "vida", "camino", "palabra", "promesa",
  "salvación", "perdón", "justicia", "santidad", "bondad", "fidelidad",
  "alabanza", "gloria", "honor", "poder", "fuerza", "consuelo",
  "alegría", "gozo", "corazón", "alma", "mente", "espíritu",
  "siervo", "discípulo", "iglesia", "pueblo", "nación", "tierra",
  "cielo", "montaña", "valle", "agua", "pan", "vino",
  "oveja", "pastor", "cordero", "león", "águila", "viento",
  "fuego", "roca", "estrella", "sol", "luna", "noche",
];

export const FALLBACK_DISTRACTORS_EN: readonly string[] = [
  "Lord", "Christ", "God", "Spirit", "Father", "Son",
  "love", "faith", "hope", "peace", "grace", "mercy",
  "truth", "light", "life", "way", "word", "promise",
  "salvation", "forgiveness", "righteousness", "holiness", "kindness", "faithfulness",
  "praise", "glory", "honor", "power", "strength", "comfort",
  "joy", "gladness", "heart", "soul", "mind", "spirit",
  "servant", "disciple", "church", "people", "nation", "earth",
  "heaven", "mountain", "valley", "water", "bread", "wine",
  "sheep", "shepherd", "lamb", "lion", "eagle", "wind",
  "fire", "rock", "star", "sun", "moon", "night",
];

export function fallbackPoolFor(locale: "es" | "en"): readonly string[] {
  return locale === "es" ? FALLBACK_DISTRACTORS_ES : FALLBACK_DISTRACTORS_EN;
}
