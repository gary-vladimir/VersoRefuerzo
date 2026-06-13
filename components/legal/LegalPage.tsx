// Shared shell for the static Privacy / Terms pages (spec §10.5). Server
// component, public (no auth gate) — see middleware PUBLIC_PATHS.

import Link from "next/link";

export function LegalPage({
  title,
  paragraphs,
  backHref,
  backLabel,
}: {
  title: string;
  paragraphs: string[];
  backHref: "/" | "/login";
  backLabel: string;
}) {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--c-bg)",
        padding: "calc(32px + env(safe-area-inset-top)) 0 60px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px" }}>
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
            marginBottom: 12,
          }}
        >
          ← {backLabel}
        </Link>
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
