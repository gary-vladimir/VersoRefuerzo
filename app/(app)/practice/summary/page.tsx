// /practice/summary?reviewed=&elapsedMs= — celebratory end-of-session screen.
//
// Read by ClassicSession via router.replace once the queue is exhausted.
// We re-fetch the user's current streak for the chip — the source of truth
// is the row updated by /api/practice/sessions on the last grade.

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { SessionSummary } from "@/components/practice/SessionSummary";

type SearchParams = Promise<{ reviewed?: string; elapsedMs?: string }>;

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
  const elapsedMs = Math.max(0, parseInt(sp.elapsedMs ?? "0", 10) || 0);

  return (
    <SessionSummary
      reviewed={reviewed}
      elapsedMs={elapsedMs}
      streak={user.currentStreak}
      strings={{
        title: locale === "es" ? "¡Buen trabajo!" : "Great job!",
        reviewed: locale === "es" ? "Versos repasados" : "Verses reviewed",
        time: locale === "es" ? "Tiempo" : "Time",
        done: t.home,
        again: locale === "es" ? "Practicar otra vez" : "Practice again",
        units: {
          verses: t.versesCount,
          minSec: (m, s) => `${m}:${String(s).padStart(2, "0")}`,
        },
      }}
    />
  );
}
