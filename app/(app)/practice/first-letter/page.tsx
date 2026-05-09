// /practice/first-letter — first-letter cueing mode (specs.md §15.1).
//
// Same Classic shell, same SRS update, same queue. Only difference: the
// front face of each card renders the verse's first-letter form instead of
// only the reference, so the user practices producing the verse from a
// strong cue.

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadClassicQueue } from "@/lib/practice/loadClassicQueue";
import { ClassicSession } from "@/components/practice/ClassicSession";

export default async function FirstLetterPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  const queue = await loadClassicQueue(user);

  return (
    <ClassicSession
      initialQueue={queue}
      locale={locale}
      sessionMode="first_letter"
      // The aloud tip is only meaningful on the very first Classic session
      // per §15.8; first-letter sessions never re-trigger it.
      showAloudTip={false}
      strings={{
        recall: locale === "es" ? "Primera letra" : "First letter",
        // First-letter renders the cue directly on the card; this string
        // is unused but the type requires it.
        reciteAloud: "",
        reveal: t.revealVerse,
        // First-letter does not expose Escribirlo; the writeIt string is
        // unused but kept on the strings shape.
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
        aloudTip: "",
        aloudTipOk: "OK",
        copyrightFallback: t.cardCopyrightFallback,
        emptyQueue:
          locale === "es"
            ? "No hay versos para hoy. Vuelve mañana o agrega uno nuevo."
            : "Nothing due today. Come back tomorrow or add a new verse.",
        emptyQueueCta: t.home,
        saveFailed: t.saveFailedRetry,
        // Typed-recall strings — unused in this mode but the type requires
        // a complete strings object.
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
