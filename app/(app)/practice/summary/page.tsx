// /practice/summary?reviewed=&elapsedMs= — celebratory end-of-session screen.
//
// Read by ClassicSession via router.replace once the queue is exhausted.
// We re-fetch the user's current streak for the chip — the source of truth
// is the row updated by /api/practice/sessions on the last grade.

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { SessionSummary } from "@/components/practice/SessionSummary";

type SearchParams = Promise<{
  reviewed?: string;
  correct?: string;
  elapsedMs?: string;
  again?: string;
}>;

// The "practice again" target rides in the query string, so only accept an
// in-app practice path: anything else (another origin, a protocol-relative
// URL) falls back to Classic.
function safeAgainHref(raw: string | undefined): string {
  if (raw && raw.startsWith("/practice/") && !raw.startsWith("//")) return raw;
  return "/practice/classic";
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];
  const sp = await searchParams;
  const reviewed = Math.max(0, parseInt(sp.reviewed ?? "0", 10) || 0);
  const correct = Math.max(0, parseInt(sp.correct ?? "0", 10) || 0);
  const elapsedMs = Math.max(0, parseInt(sp.elapsedMs ?? "0", 10) || 0);
  // Accuracy can never exceed the verses reviewed, whatever the URL says.
  const correctClamped = Math.min(correct, reviewed);

  return (
    <SessionSummary
      reviewed={reviewed}
      correct={correctClamped}
      againHref={safeAgainHref(sp.again)}
      elapsedMs={elapsedMs}
      streak={user.currentStreak}
      strings={{
        title: locale === "es" ? "¡Buen trabajo!" : "Great job!",
        reviewed: locale === "es" ? "Versos repasados" : "Verses reviewed",
        accuracy: locale === "es" ? "Aciertos" : "Accuracy",
        time: locale === "es" ? "Tiempo" : "Time",
        done: t.home,
        again: locale === "es" ? "Practicar otra vez" : "Practice again",
      }}
    />
  );
}
