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
import { ModeIcon, type ModeName } from "@/components/practice/ModeIcons";
import { Chevron } from "@/components/icons/UiIcons";

type Tile = {
  title: string;
  description: string;
  href: Route;
  mode: ModeName;
  gradient: string;
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
      mode: "classic",
      gradient: "var(--brand-primary)",
    },
    {
      title: t.firstLetterTitle,
      description: t.firstLetterDesc,
      href: "/practice/first-letter",
      mode: "firstLetter",
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
  return (
    <Link
      href={tile.href}
      className="vr-tile vr-press"
      style={{
        textDecoration: "none",
        color: "inherit",
        background: "#fff",
        borderRadius: "var(--r-2xl)",
        padding: 18,
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        aria-hidden
        style={{
          width: 50,
          height: 50,
          borderRadius: 15,
          background: tile.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
        }}
      >
        <ModeIcon name={tile.mode} size={26} color="#fff" strokeWidth={2.1} />
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
      <span aria-hidden style={{ color: "var(--c-soft)", flexShrink: 0, display: "inline-flex" }}>
        <Chevron size={18} />
      </span>
    </Link>
  );
}
