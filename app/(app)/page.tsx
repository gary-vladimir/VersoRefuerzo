// Home (specs.md §16.1, §16.6, §17.2).
//
// Compact header with greeting + streak chip, the "X versos para hoy" hero
// CTA that goes straight into Classic, then a recent-verses list using the
// same VerseRow component the Library uses. Empty states cover both
// "no verses at all" and "no verses due today" per §17.2.

import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray, isNull, lt } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  verses as versesTable,
  bibleTextCache,
} from "@/db/schema";
import { T } from "@/lib/i18n/strings";
import { UNDO_WINDOW_MS } from "@/lib/constants";
import { StreakChip } from "@/components/home/StreakChip";
import { TodayCTA } from "@/components/home/TodayCTA";
import { VerseRow } from "@/components/verse/VerseRow";
import SignOutButton from "./_signout-button";

export default async function Home() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];
  const firstName = user.displayName.split(" ")[0] ?? user.displayName;
  const db = getDb();

  // Sweep before reading so the visible counts match what the queue route
  // would return.
  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
  await db
    .delete(versesTable)
    .where(and(eq(versesTable.userId, user.id), lt(versesTable.deletedAt, cutoff)));

  const allVerses = await db
    .select()
    .from(versesTable)
    .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt)))
    .orderBy(asc(versesTable.createdAt));

  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);
  const dueVerses = allVerses.filter(
    (v) => new Date(v.srsState.dueAt).getTime() <= endOfToday.getTime(),
  );

  const recent = [...allVerses]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);

  const refs = recent.map((r) => r.canonicalRef);
  const cached = refs.length
    ? await db
        .select({
          ref: bibleTextCache.canonicalRef,
          version: bibleTextCache.version,
          text: bibleTextCache.text,
        })
        .from(bibleTextCache)
        .where(inArray(bibleTextCache.canonicalRef, refs))
    : [];
  const textByKey = new Map<string, string>();
  for (const c of cached) textByKey.set(`${c.ref}|${c.version}`, c.text);

  const isLibraryEmpty = allVerses.length === 0;
  const heroPrimary = t.versesForToday(dueVerses.length);
  const heroSecondary = t.keepStreakSubline;

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--c-bg)",
        paddingBottom: 80,
      }}
    >
      <header
        style={{
          padding: "32px 20px 14px",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600 }}>
            {t.helloName(firstName)}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
              color: "var(--c-text)",
              letterSpacing: "-0.5px",
              marginTop: 1,
            }}
          >
            {locale === "es" ? "Tus versos" : "Your verses"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StreakChip current={user.currentStreak} />
          <Link
            href="/verses/new"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--brand-rose)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 18,
              textDecoration: "none",
            }}
            aria-label={t.addVerse}
          >
            +
          </Link>
        </div>
      </header>

      {/* Hero / empty states (§17.2 + §16.1) */}
      <section style={{ padding: "14px 20px 0" }}>
        {isLibraryEmpty ? (
          <EmptyHero
            body={t.emptyHomeNoVerses}
            cta={t.addFirstVerse}
            href="/verses/new?ref=Juan%2014%3A6"
          />
        ) : dueVerses.length === 0 ? (
          <EmptyHero
            body={t.emptyHomeNoneDue}
            cta={t.practiceRandom}
            href="/practice/classic"
          />
        ) : (
          <TodayCTA
            dueToday={dueVerses.length}
            sample={dueVerses.map((v) => ({ id: v.id, color: v.color, icon: v.icon }))}
            primaryLine={heroPrimary}
            secondaryLine={heroSecondary}
          />
        )}
      </section>

      {/* Recent verses (§6.7 — "X verses today" hero plus recent list).
          The slim row list re-uses the Library's VerseRow so undo behavior
          is identical here. */}
      {!isLibraryEmpty && (
        <section style={{ padding: "20px 20px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "var(--c-muted)",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              {t.versesCount(allVerses.length)}
            </div>
            <Link
              href="/library"
              style={{
                fontSize: 11,
                color: "var(--c-muted)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {t.library} →
            </Link>
          </div>
          <div
            className="vr-stagger"
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {recent.map((v) => (
              <VerseRow
                key={v.id}
                verse={v}
                textPreview={textByKey.get(`${v.canonicalRef}|${v.version}`) ?? null}
                locale={locale}
                strings={{
                  edit: t.edit,
                  delete: t.delete,
                  deleted: t.verseDeleted,
                  undo: t.undo,
                  loading: t.loadingText,
                }}
              />
            ))}
          </div>
        </section>
      )}

      <div style={{ padding: "32px 20px 0" }}>
        <SignOutButton label={t.signOut} />
      </div>
    </main>
  );
}

function EmptyHero({
  body,
  cta,
  href,
}: {
  body: string;
  cta: string;
  href: Route;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--r-2xl)",
        padding: "20px 18px",
        boxShadow: "var(--shadow-sm)",
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: "0 0 14px",
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          color: "var(--c-muted)",
          fontSize: 14,
          lineHeight: 1.4,
        }}
      >
        {body}
      </p>
      <Link
        href={href}
        style={{
          display: "inline-block",
          padding: "10px 18px",
          borderRadius: 999,
          background: "var(--brand-primary)",
          color: "#fff",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

