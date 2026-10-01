// /practice — practice hub (specs.md §6.4 / §15.1 / §16.1).
//
// Surface for picking a practice mode and the pool it draws from. The Home
// hero CTA still goes directly to Classic per §16.1, so the hub exists for
// variety and discoverability of the other modes. All five modes are live
// here: Classic and First-letter (RECALL), plus the §15.4 recognition
// mini-games Word Scramble, Verse Match, and Fill the Gap.
//
// This component only loads the data the §6.4 source selector needs; the
// selector itself and the mode tiles live in the client component `_hub`.

import { redirect } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { sweepDeletedVerses, sweepDeletedCollections } from "@/lib/softDelete";
import {
  collections as collectionsTable,
  verses as versesTable,
  verseCollections as vcTable,
} from "@/db/schema";
import { T } from "@/lib/i18n/strings";
import { formatDisplay } from "@/lib/bible/reference";
import {
  PracticeHub,
  type HubCollection,
  type HubTile,
  type HubVerse,
} from "./_hub";

export default async function PracticeHubPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];
  const db = getDb();

  // Same housekeeping sweep every read does, so a just-deleted collection
  // cannot be offered as a practice source.
  await sweepDeletedVerses(db, user.id);
  await sweepDeletedCollections(db, user.id);

  const [allVerses, allCollections, allLinks] = await Promise.all([
    db
      .select({
        id: versesTable.id,
        canonicalRef: versesTable.canonicalRef,
        color: versesTable.color,
      })
      .from(versesTable)
      .where(and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt)))
      .orderBy(asc(versesTable.createdAt)),
    db
      .select({
        id: collectionsTable.id,
        name: collectionsTable.name,
        colorKey: collectionsTable.colorKey,
      })
      .from(collectionsTable)
      .where(
        and(eq(collectionsTable.userId, user.id), isNull(collectionsTable.deletedAt)),
      )
      .orderBy(asc(collectionsTable.name)),
    db
      .select({ verseId: vcTable.verseId, collectionId: vcTable.collectionId })
      .from(vcTable)
      .innerJoin(collectionsTable, eq(vcTable.collectionId, collectionsTable.id))
      .where(
        and(eq(collectionsTable.userId, user.id), isNull(collectionsTable.deletedAt)),
      ),
  ]);

  // Only count links whose verse still exists and is not soft-deleted, so
  // the chip count matches what a session would actually serve.
  const liveVerseIds = new Set(allVerses.map((v) => v.id));
  const countByCollection = new Map<string, number>();
  for (const link of allLinks) {
    if (!liveVerseIds.has(link.verseId)) continue;
    countByCollection.set(
      link.collectionId,
      (countByCollection.get(link.collectionId) ?? 0) + 1,
    );
  }

  const collections: HubCollection[] = allCollections.map((c) => ({
    id: c.id,
    name: c.name,
    colorKey: c.colorKey,
    count: countByCollection.get(c.id) ?? 0,
  }));

  // Reference labels are localised server-side so the picker does not have
  // to ship the book-name tables to the browser.
  const verses: HubVerse[] = allVerses.map((v) => ({
    id: v.id,
    label: formatDisplay(v.canonicalRef, locale),
    color: v.color,
  }));

  const tiles: HubTile[] = [
    {
      title: t.classicTitle,
      description: t.classicHubDesc,
      href: "/practice/classic",
      mode: "classic",
      extraQuery: { scope: "all" },
      gradient: "var(--brand-primary)",
    },
    {
      title: t.firstLetterTitle,
      description: t.firstLetterDesc,
      href: "/practice/first-letter",
      mode: "firstLetter",
      extraQuery: { scope: "all" },
      gradient: "var(--brand-sky)",
    },
    {
      title: t.practiceModeWordScramble,
      description: t.scrambleDesc,
      href: "/practice/scramble",
      mode: "scramble",
      gradient: "var(--brand-sunrise)",
    },
    {
      title: t.practiceModeMatch,
      description: t.matchDesc,
      href: "/practice/match",
      mode: "match",
      gradient: "var(--brand-forest)",
    },
    {
      title: t.practiceModeGap,
      description: t.gapDesc,
      href: "/practice/gap",
      mode: "gap",
      gradient: "var(--brand-ember)",
    },
  ];

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
          padding: "32px 20px 18px",
          background: "#fff",
          borderBottom: "1px solid var(--c-line)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: "-0.6px",
            color: "var(--c-text)",
          }}
        >
          {t.practiceHubTitle}
        </h1>
        <p
          style={{
            margin: "4px 0 0",
            fontSize: 13,
            color: "var(--c-muted)",
          }}
        >
          {t.practiceHubSubline}
        </p>
      </header>

      <PracticeHub
        tiles={tiles}
        collections={collections}
        verses={verses}
        locale={locale}
        strings={{
          sourceLabel: t.sourceLabel,
          sourceAll: t.sourceAll,
          sourceCollection: t.sourceCollection,
          sourceCustom: t.sourceCustom,
          sourcePickCollection: t.sourcePickCollection,
          sourcePickVerses: t.sourcePickVerses,
          sourceNoCollections: t.sourceNoCollections,
          sourceNoVerses: t.sourceNoVerses,
          sourceClearSelection: t.sourceClearSelection,
          sourceSelectAll: t.sourceSelectAll,
          sourceNeedsPick: t.sourceNeedsPick,
          sourceNeedsCollection: t.sourceNeedsCollection,
          emptyLibrary: t.practiceEmptyLibrary,
          addVerse: t.addVerse,
        }}
      />
    </main>
  );
}
