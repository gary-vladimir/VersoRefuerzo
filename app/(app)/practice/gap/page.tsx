// /practice/gap — Fill the Gap (specs.md §6.4.4 + §15.3).
//
// Server picks one cached verse, computes the blank plan based on the
// verse's repetitions (progressive cloze), then for each blank builds a
// 3-distractor list drawn from the user's other verses (same language).
// If the user's library is too small we top up with the curated fallback
// pool from `lib/bible/fallback-distractors.ts`.

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadMiniGameVerses } from "@/lib/practice/loadMiniGameVerses";
import { newSeed } from "@/lib/random";
import { parsePracticeSource, type RawSearchParams } from "@/lib/practice/source";
import { chooseBlanks } from "@/lib/srs/cloze";
import { fallbackPoolFor } from "@/lib/bible/fallback-distractors";
import { FillTheGap } from "@/components/practice/FillTheGap";
import { PracticeEmptyState } from "@/components/practice/PracticeEmptyState";
import { textLocaleForVersion } from "@/lib/catalog";

// Mirrors the cloze stopword set, just inlined here so the page can drop
// stopwords from the *distractor* pool too. Picking "el" or "la" as a
// distractor for "vida" would let the user solve by elimination.
const ES_STOP = new Set([
  "el", "la", "los", "las", "un", "una", "y", "o", "de", "del", "al", "a",
  "en", "por", "para", "con", "sin", "que", "no", "es", "se", "su", "lo",
  "le", "les", "mi", "tu", "este", "esta", "eso", "esto",
]);
const EN_STOP = new Set([
  "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for",
  "with", "from", "by", "as", "is", "are", "was", "were", "be", "i", "you",
  "he", "she", "it", "we", "they", "my", "your", "his", "her", "its",
  "this", "that", "no", "not",
]);

export default async function GapPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  // Sample one verse to play; loader also returns the pool's word list so
  // we can build distractors without a second round-trip.
  const source = parsePracticeSource(await searchParams);
  const pool = await loadMiniGameVerses(user.id, 1, source);
  const pick = pool.verses[0];

  if (!pick) {
    return source.kind === "all" ? (
      <PracticeEmptyState message={t.practiceEmptyLibrary} ctaLabel={t.addVerse} ctaHref="/verses/new" />
    ) : (
      <PracticeEmptyState message={t.practiceEmptyPool} ctaLabel={t.practicePickAnother} ctaHref="/practice" />
    );
  }

  // Stopwords and the fallback distractor pool follow the language of the
  // verse text, not the UI: English distractors next to a Spanish verse
  // would give the answer away.
  const textLocale = textLocaleForVersion(pick.verse.version);
  const plan = chooseBlanks(pick.text, pick.verse.srsState.repetitions, textLocale);

  // Build the per-blank distractor lists. A distractor must:
  //   - not be the correct answer (case-insensitive)
  //   - not equal any other blank's correct answer in this round
  //   - have ≥ 2 letters, not be numeric-only, not be a stopword
  //
  // Source order: the user's own verse vocabulary first (so wrong answers
  // are plausible), then the curated fallback pool to top up. We always
  // top up — the M6 review #2 bug was using the user pool exclusively
  // when it had ≥ 5 entries, which left some blanks with < 3 distractors
  // after filtering. This ensures every blank gets a 4-button row.
  const correctSet = new Set(
    plan.blankIndices.map((i) => plan.tokens[i]!.word.toLowerCase()),
  );
  const stopwords = textLocale === "es" ? ES_STOP : EN_STOP;
  // Words already printed in this verse are easy to rule out ("hermana" is
  // visibly not the blank when it sits two words earlier), so they never
  // serve as distractors.
  const verseWords = new Set(plan.tokens.map((tok) => tok.word.toLowerCase()));

  function isValid(w: string, correct: string): boolean {
    return (
      !correctSet.has(w) &&
      !verseWords.has(w) &&
      w !== correct &&
      w.length >= 2 &&
      !/^\d+$/.test(w) &&
      !stopwords.has(w)
    );
  }

  const userPool = pool.wordPool;
  const fallbackPool = fallbackPoolFor(textLocale).map((w) => w.toLowerCase());

  const distractorsPerBlank: string[][] = plan.blankIndices.map((tokIdx) => {
    const correct = plan.tokens[tokIdx]!.word.toLowerCase();
    const fromUser = shuffle(userPool.filter((w) => isValid(w, correct)));
    const fromFallback = shuffle(fallbackPool.filter((w) => isValid(w, correct)));
    const out: string[] = [];
    const seen = new Set<string>();
    for (const w of [...fromUser, ...fromFallback]) {
      if (seen.has(w)) continue;
      seen.add(w);
      out.push(w);
      if (out.length >= 3) break;
    }
    return out;
  });

  return (
    <FillTheGap
      // Fresh key per render so "Another verse" (router.refresh) remounts
      // the game instead of keeping the finished round's state.
      key={crypto.randomUUID()}
      seed={newSeed()}
      verse={pick.verse}
      copyright={pick.copyright}
      plan={plan}
      distractorsPerBlank={distractorsPerBlank}
      locale={locale}
      strings={{
        niceTry:
          locale === "es"
            ? "Buen intento — vuelve cuando quieras."
            : "Nice try — come back anytime.",
        playAgain: locale === "es" ? "Otro verso" : "Another verse",
        backHub: t.practice,
        exit: locale === "es" ? "Salir" : "Exit",
        showFirstLetter:
          locale === "es" ? "Mostrar primera letra" : "Show first letter",
        good: locale === "es" ? "¡Perfecto!" : "Perfect!",
        failed: locale === "es" ? "Casi" : "Almost",
        saveFailed: t.saveFailedRetry,
        retry: locale === "es" ? "Reintentar" : "Retry",
      }}
    />
  );
}

// In-place Fisher–Yates so we don't suck in lodash for one shuffle.
function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
