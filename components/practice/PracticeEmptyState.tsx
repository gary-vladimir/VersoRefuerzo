// Shown by the mini-game routes when the selected pool has nothing to play.
// Server-renderable. With the whole library selected the fix is to add a
// verse; with a collection or hand-picked set the fix is to pick another
// pool, so the call to action changes with it.

import Link from "next/link";
import { CornerLanguageToggle } from "@/components/i18n/LanguageToggle";

type Props = {
  message: string;
  ctaLabel: string;
  ctaHref: "/verses/new" | "/practice";
};

export function PracticeEmptyState({ message, ctaLabel, ctaHref }: Props) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--c-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
      }}
    >
      <CornerLanguageToggle mobileOnly />
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
          {message}
        </p>
        <Link
          href={ctaHref}
          className="vr-press"
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
          {ctaLabel}
        </Link>
      </div>
    </main>
  );
}
