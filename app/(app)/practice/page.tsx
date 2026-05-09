// /practice — practice hub (specs.md §6.4 / §15.1 / §16.1).
//
// Surface for picking a practice mode. The Home hero CTA still goes
// directly to Classic per §16.1, so the hub exists for variety and
// discoverability of the other modes. All five modes are live here:
// Classic and First-letter (RECALL), plus the §15.4 recognition mini-
// games Word Scramble, Verse Match, and Fill the Gap.

import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";

type Tile = {
  title: string;
  description: string;
  href: Route | null;       // null === coming soon
  badge?: string;
  glyph: string;
};

export default async function PracticeHubPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  const tiles: Tile[] = [
    {
      title: t.classicTitle,
      description: t.classicHubDesc,
      href: "/practice/classic",
      glyph: "🃏",
    },
    {
      title: t.firstLetterTitle,
      description: t.firstLetterDesc,
      href: "/practice/first-letter",
      glyph: "🔤",
    },
    {
      title: t.practiceModeWordScramble,
      description: t.scrambleDesc,
      href: "/practice/scramble",
      glyph: "🧩",
    },
    {
      title: t.practiceModeMatch,
      description: t.matchDesc,
      href: "/practice/match",
      glyph: "🔗",
    },
    {
      title: t.practiceModeGap,
      description: t.gapDesc,
      href: "/practice/gap",
      glyph: "⬜",
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

      <section
        className="vr-stagger"
        style={{
          padding: 20,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
        }}
      >
        {tiles.map((tile) => (
          <ModeTile key={tile.title} tile={tile} />
        ))}
      </section>
    </main>
  );
}

function ModeTile({ tile }: { tile: Tile }) {
  const inner = (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--r-2xl)",
        padding: 18,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: tile.href ? 1 : 0.6,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "var(--c-card-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
        }}
      >
        {tile.glyph}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 16,
            color: "var(--c-text)",
            letterSpacing: "-0.2px",
          }}
        >
          {tile.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--c-muted)",
            marginTop: 2,
          }}
        >
          {tile.description}
        </div>
      </div>
      {tile.badge && (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "var(--c-card-soft)",
            color: "var(--c-soft)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          {tile.badge}
        </span>
      )}
    </div>
  );

  if (tile.href) {
    return (
      <Link
        href={tile.href}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {inner}
      </Link>
    );
  }
  return <div aria-disabled="true">{inner}</div>;
}
