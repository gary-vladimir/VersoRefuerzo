// /practice/scramble — Word Scramble (specs.md §6.4.2).
// Server picks one cached verse at random and hands it to the game.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import { loadMiniGameVerses } from "@/lib/practice/loadMiniGameVerses";
import { WordScramble } from "@/components/practice/WordScramble";

export default async function ScramblePage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  const pool = await loadMiniGameVerses(user.id, 1);
  const pick = pool.verses[0];

  if (!pick) return <NotEnoughVerses locale={locale} t={t} />;

  return (
    <WordScramble
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
      }}
    />
  );
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
