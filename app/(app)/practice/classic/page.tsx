// /practice/classic — Classic flashcards session entry (specs.md §6.4.1).
//
// `?verse=<id>` runs the §17.4 single-card session for `Repasar ahora`.
// `?random=1` picks a random cached verse (the §17.2 empty-day CTA).
// `?source=` / `?collectionId=` / `?verses=` carry the §6.4 pool the hub
// selected (see lib/practice/source.ts).

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadClassicQueue } from "@/lib/practice/loadClassicQueue";
import {
  parsePracticeSource,
  practiceSourceSearch,
  type RawSearchParams,
} from "@/lib/practice/source";
import { ClassicSession } from "@/components/practice/ClassicSession";

type SearchParams = Promise<RawSearchParams & { verse?: string; random?: string }>;

export default async function ClassicPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  const sp = await searchParams;
  const oneVerseId = typeof sp.verse === "string" ? sp.verse.trim() || null : null;
  const random = sp.random === "1" || sp.random === "true";
  const source = parsePracticeSource(sp);
  const queue = await loadClassicQueue(user, { oneVerseId, random, source });

  // "Practice again" from the summary repeats this exact session shape.
  const againHref = oneVerseId
    ? `/practice/classic?verse=${encodeURIComponent(oneVerseId)}`
    : random
      ? "/practice/classic?random=1"
      : `/practice/classic${practiceSourceSearch(source)}`;

  const aloudTip = locale === "es"
    ? "Recita el verso en voz alta — pronunciarlo mejora la memorización."
    : "Recite the verse aloud — speaking it improves recall.";

  return (
    <ClassicSession
      initialQueue={queue}
      locale={locale}
      sessionMode="classic"
      showAloudTip={!user.hasSeenAloudTip}
      againHref={againHref}
      strings={{
        recall: locale === "es" ? "Recuerda este verso" : "Recall this verse",
        reciteAloud:
          locale === "es" ? "Cierra los ojos y recítalo en voz alta." : "Close your eyes and recite it aloud.",
        reveal: t.revealVerse,
        writeIt: t.writeIt,
        howWell: locale === "es" ? "¿Qué tan bien lo recordaste?" : "How well did you remember?",
        again: t.again,
        hard: t.hard,
        good: t.good,
        easy: t.easy,
        showHint: t.showHintShort,
        hint: t.hint,
        skip: t.skipCard,
        exit: locale === "es" ? "Salir" : "Exit",
        aloudTip,
        aloudTipOk: "OK",
        copyrightFallback: t.cardCopyrightFallback,
        emptyQueue:
          locale === "es"
            ? "No hay versos para hoy. Vuelve mañana o agrega uno nuevo."
            : "Nothing due today. Come back tomorrow or add a new verse.",
        emptyQueueCta: t.home,
        saveFailed: t.saveFailedRetry,
        typedPrompt: t.typedPrompt,
        typedPlaceholder: t.typedPlaceholder,
        typedSubmit: t.typedSubmit,
        typedCancel: t.typedCancel,
        typedYourEntry: t.typedYourEntry,
        typedCanonical: t.typedCanonical,
        typedAutoGraded: t.typedAutoGraded,
      }}
    />
  );
}
