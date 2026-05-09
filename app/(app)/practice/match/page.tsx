// /practice/match — Verse Match (specs.md §6.4.3).
// Server samples up to 5 cached verses for one round.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadMiniGameVerses } from "@/lib/practice/loadMiniGameVerses";
import { VerseMatch } from "@/components/practice/VerseMatch";

const ROUND_SIZE = 5;

export default async function MatchPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  const pool = await loadMiniGameVerses(user.id, ROUND_SIZE);

  if (pool.verses.length < 2) return <NeedMore locale={locale} t={t} />;

  return (
    <VerseMatch
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
        saveFailed: (n) =>
          locale === "es"
            ? `${n} ${n === 1 ? "intento no se guardó" : "intentos no se guardaron"}.`
            : `${n} ${n === 1 ? "attempt didn't save" : "attempts didn't save"}.`,
        retry: locale === "es" ? "Reintentar" : "Retry",
      }}
    />
  );
}

function NeedMore({
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
            ? "Necesitas al menos dos versos para emparejar."
            : "You need at least two verses to play Match."}
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
