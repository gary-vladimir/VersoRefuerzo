"use client";

// Shared shell for the static Privacy / Terms pages (spec §10.5). Public (no
// auth gate, see middleware PUBLIC_PATHS). It receives both languages and
// renders the current one, so its language switch works signed out too.

import Link from "next/link";
import type { Locale } from "@/lib/i18n/strings";
import { LanguageToggle, useLocale } from "@/components/i18n/LanguageToggle";

export function LegalPage({
  content,
  backHref,
  backLabel,
}: {
  content: Record<Locale, { title: string; paragraphs: string[] }>;
  backHref: "/" | "/login";
  backLabel: Record<Locale, string>;
}) {
  const locale = useLocale();
  const { title, paragraphs } = content[locale];
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--c-bg)",
        padding: "calc(32px + env(safe-area-inset-top)) 0 60px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Link
            href={backHref}
            className="vr-press"
            style={{
              display: "inline-block",
              color: "var(--c-muted)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            ← {backLabel[locale]}
          </Link>
          <LanguageToggle />
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: "-0.6px",
            color: "var(--c-text)",
            margin: "8px 0 20px",
          }}
        >
          {title}
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                margin: 0,
                fontFamily: "var(--font-serif)",
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--c-text)",
              }}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
