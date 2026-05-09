// /practice/classic — Classic flashcards session entry (specs.md §6.4.1).
//
// `?verse=<id>` runs the §17.4 single-card session for `Repasar ahora`.
// `?random=1` picks a random cached verse (the §17.2 empty-day CTA).

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadClassicQueue } from "@/lib/practice/loadClassicQueue";
import { ClassicSession } from "@/components/practice/ClassicSession";

type SearchParams = Promise<{ verse?: string; random?: string }>;

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
  const queue = await loadClassicQueue(user, {
    oneVerseId: sp.verse?.trim() || null,
    random: sp.random === "1" || sp.random === "true",
  });

  const aloudTip = locale === "es"
    ? "Recita el verso en voz alta — pronunciarlo mejora la memorización."
    : "Recite the verse aloud — speaking it improves recall.";

  return (
    <ClassicSession
      initialQueue={queue}
      locale={locale}
      sessionMode="classic"
      showAloudTip={!user.hasSeenAloudTip}
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
        typedMatchPercent: t.typedMatchPercent,
      }}
    />
  );
}
