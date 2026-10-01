// /practice/match — Verse Match (specs.md §6.4.3).
// Server samples up to 5 cached verses from the §6.4 source pool for one round.

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadMiniGameVerses } from "@/lib/practice/loadMiniGameVerses";
import { parsePracticeSource, type RawSearchParams } from "@/lib/practice/source";
import { VerseMatch } from "@/components/practice/VerseMatch";
import { PracticeEmptyState } from "@/components/practice/PracticeEmptyState";

const ROUND_SIZE = 5;

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  const source = parsePracticeSource(await searchParams);
  const pool = await loadMiniGameVerses(user.id, ROUND_SIZE, source);

  if (pool.verses.length < 2) {
    return source.kind === "all" ? (
      <PracticeEmptyState message={t.practiceNeedTwo} ctaLabel={t.addVerse} ctaHref="/verses/new" />
    ) : (
      <PracticeEmptyState message={t.practiceNeedTwo} ctaLabel={t.practicePickAnother} ctaHref="/practice" />
    );
  }

  return (
    <VerseMatch
      // Fresh key per render so "Another round" (router.refresh) remounts
      // the game instead of keeping the finished round's state.
      key={crypto.randomUUID()}
      verses={pool.verses}
      locale={locale}
      strings={{
        niceTry:
          locale === "es"
            ? "Buen intento — vuelve cuando quieras."
            : "Nice try — come back anytime.",
        playAgain: locale === "es" ? "Otra ronda" : "Another round",
        backHub: t.practice,
        exit: locale === "es" ? "Salir" : "Exit",
        matchedAll: locale === "es" ? "¡Todos correctos!" : "All matched!",
        ranOut: locale === "es" ? "Casi" : "Almost",
        references: locale === "es" ? "Referencias" : "References",
        hints: locale === "es" ? "Pistas" : "Hints",
        retry: locale === "es" ? "Reintentar" : "Retry",
      }}
    />
  );
}
