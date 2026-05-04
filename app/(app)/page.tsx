// Home — M2 placeholder.
// Lists the user's verses with a + button to add more so AC-2/AC-8 can be
// observed end-to-end. The full ScreenHome (hero, streak chip, due-today CTA)
// arrives in M3/M4.

import Link from "next/link";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { verses as versesTable } from "@/db/schema";
import { T } from "@/lib/i18n/strings";
import { formatDisplay } from "@/lib/bible/reference";
import { isCardColor, isVerseIcon } from "@/lib/catalog";
import { VerseCard } from "@/components/ui/VerseCard";
import SignOutButton from "./_signout-button";

export default async function Home() {
  const user = await getServerUser();
  if (!user) return null;
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];
  const firstName = user.displayName.split(" ")[0] ?? user.displayName;

  const db = getDb();
  const myVerses = await db
    .select()
    .from(versesTable)
    .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt)))
    .orderBy(asc(versesTable.createdAt));

  return (
    <main
      style={{
        padding: "var(--s-7)",
        maxWidth: 960,
        margin: "0 auto",
        minHeight: "100dvh",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--s-4)",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 32,
            margin: 0,
            color: "var(--c-text)",
            letterSpacing: "-0.6px",
          }}
        >
          {t.helloName(firstName)}
        </h1>
        <Link
          href="/verses/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 18px",
            borderRadius: "var(--r-full)",
            background: "var(--brand-primary)",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            boxShadow:
              "0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          + {t.addVerse}
        </Link>
      </header>

      <p style={{ marginTop: "var(--s-7)" }}>
        <Link
          href="/library"
          style={{
            color: "var(--c-indigo-700)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          → {t.library}
        </Link>
      </p>

      {myVerses.length === 0 ? (
        <section
          style={{
            marginTop: "var(--s-6)",
            padding: "var(--s-7)",
            borderRadius: "var(--r-2xl)",
            background: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 16,
              color: "var(--c-muted)",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {t.emptyHomeNoVerses}
          </p>
          <Link
            href="/verses/new?ref=Juan%2014%3A6"
            style={{
              display: "inline-block",
              marginTop: "var(--s-5)",
              padding: "12px 18px",
              borderRadius: "var(--r-full)",
              background: "var(--brand-primary)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            {t.addVerse}
          </Link>
        </section>
      ) : (
        <section
          style={{
            marginTop: "var(--s-8)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "var(--s-4)",
          }}
        >
          {myVerses.map((v) => {
            const color = isCardColor(v.color) ? v.color : "indigo";
            const icon = isVerseIcon(v.icon) ? v.icon : "bible";
            return (
              <Link
                key={v.id}
                href={`/verses/${v.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <VerseCard
                  refDisplay={formatDisplay(v.canonicalRef, locale)}
                  version={v.version}
                  color={color}
                  icon={icon}
                  size="sm"
                />
              </Link>
            );
          })}
        </section>
      )}

      <p
        style={{
          marginTop: "var(--s-8)",
          color: "var(--c-soft)",
          fontSize: 13,
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
        }}
      >
        {locale === "es"
          ? "Vista provisional de Inicio. La hero pantalla con racha y CTA llega en M4."
          : "Placeholder Home. The hero screen with streak and CTA lands in M4."}
      </p>

      <SignOutButton label={t.signOut} />
    </main>
  );
}
