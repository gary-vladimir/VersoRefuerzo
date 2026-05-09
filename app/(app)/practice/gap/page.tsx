// /practice/gap — Fill the Gap (specs.md §6.4.4 + §15.3).
//
// Server picks one cached verse, computes the blank plan based on the
// verse's repetitions (progressive cloze), then for each blank builds a
// 3-distractor list drawn from the user's other verses (same language).
// If the user's library is too small we top up with the curated fallback
// pool from `lib/bible/fallback-distractors.ts`.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadMiniGameVerses } from "@/lib/practice/loadMiniGameVerses";
import { chooseBlanks } from "@/lib/srs/cloze";
import { fallbackPoolFor } from "@/lib/bible/fallback-distractors";
import { FillTheGap } from "@/components/practice/FillTheGap";

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

export default async function GapPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  // Sample one verse to play; loader also returns the user's full word
  // pool so we can build distractors without a second round-trip.
  const pool = await loadMiniGameVerses(user.id, 1);
  const pick = pool.verses[0];

  if (!pick) return <NotEnoughVerses locale={locale} t={t} />;

  const plan = chooseBlanks(pick.text, pick.verse.srsState.repetitions, locale);

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
  const stopwords = locale === "es" ? ES_STOP : EN_STOP;

  function isValid(w: string, correct: string): boolean {
    return (
      !correctSet.has(w) &&
      w !== correct &&
      w.length >= 2 &&
      !/^\d+$/.test(w) &&
      !stopwords.has(w)
    );
  }

  const userPool = pool.wordPool;
  const fallbackPool = fallbackPoolFor(locale).map((w) => w.toLowerCase());

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

function NotEnoughVerses({
  locale,
  t,
}: {
  locale: "es" | "en";
  t: (typeof T)["es"] | (typeof T)["en"];
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--c-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--r-2xl)",
          padding: "28px 24px",
          textAlign: "center",
          boxShadow: "var(--shadow-sm)",
          maxWidth: 360,
        }}
      >
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            color: "var(--c-muted)",
            fontSize: 15,
          }}
        >
          {locale === "es"
            ? "Agrega tu primer verso para practicar."
            : "Add your first verse to practice."}
        </p>
        <Link
          href="/verses/new"
          style={{
            display: "inline-block",
            background: "var(--brand-primary)",
            color: "#fff",
            textDecoration: "none",
            borderRadius: "var(--r-full)",
            padding: "10px 18px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {t.addVerse}
        </Link>
      </div>
    </main>
  );
}
