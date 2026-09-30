// /practice/scramble — Word Scramble (specs.md §6.4.2).
// Server picks one cached verse at random from the §6.4 source pool and
// hands it to the game.

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadMiniGameVerses } from "@/lib/practice/loadMiniGameVerses";
import { parsePracticeSource, type RawSearchParams } from "@/lib/practice/source";
import { WordScramble } from "@/components/practice/WordScramble";
import { PracticeEmptyState } from "@/components/practice/PracticeEmptyState";

export default async function ScramblePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

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

  return (
    <WordScramble
      // "Another verse" re-runs this page with router.refresh(). A fresh
      // key per render remounts the game so its round state resets instead
      // of carrying the finished round over onto the new verse.
      key={crypto.randomUUID()}
      verse={pick.verse}
      text={pick.text}
      copyright={pick.copyright}
      locale={locale}
      strings={{
        intentos: locale === "es" ? "Intentos" : "Tries",
        good: locale === "es" ? "¡Perfecto!" : "Perfect!",
        partial: locale === "es" ? "¡Bien hecho!" : "Well done!",
        failed: locale === "es" ? "Casi" : "Almost",
        niceTry:
          locale === "es"
            ? "Buen intento — vuelve cuando quieras."
            : "Nice try — come back anytime.",
        playAgain: locale === "es" ? "Otro verso" : "Another verse",
        backHub: t.practice,
        exit: locale === "es" ? "Salir" : "Exit",
        intentosLeft: (n) =>
          locale === "es" ? `Te quedan ${n} intentos` : `${n} tries left`,
        segmentLabel: (current, total) =>
          locale === "es"
            ? `Segmento ${current}/${total}`
            : `Segment ${current}/${total}`,
        saveFailed: t.saveFailedRetry,
        retry: locale === "es" ? "Reintentar" : "Retry",
      }}
    />
  );
}
