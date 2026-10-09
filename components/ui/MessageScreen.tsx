"use client";

// Shared full-screen message card for the error / not-found boundaries.
//
// These render outside any signed-in shell (an error boundary has no
// database access and 404s hit signed-out visitors too), so the text follows
// the language remembered on this device, which the signed-in shell keeps in
// step with the account. The card has its own language switch.

import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { T } from "@/lib/i18n/strings";
import { LanguageToggle, useLocale } from "@/components/i18n/LanguageToggle";

const primaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "11px 20px",
  borderRadius: 999,
  border: "none",
  background: "var(--brand-primary)",
  color: "#fff",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgb(var(--card-indigo-rgb) / 0.35)",
};

const secondaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "11px 20px",
  borderRadius: 999,
  border: "none",
  boxShadow: "inset 0 0 0 1.5px var(--c-line)",
  background: "#fff",
  color: "var(--c-text)",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  cursor: "pointer",
};

export function MessageScreen({
  kind,
  detail,
  onRetry,
}: {
  kind: "error" | "notFound";
  // Only rendered in development — production users get the friendly copy
  // and nothing about the internals.
  detail?: string | null;
  onRetry?: () => void;
}) {
  const t = T[useLocale()];
  const title = kind === "error" ? t.errorTitle : t.notFoundTitle;
  const body = kind === "error" ? t.errorBody : t.notFoundBody;
  const homeLabel = t.errorHome;
  const action = onRetry ? { label: t.errorRetry, onClick: onRetry } : undefined;
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
      <div
        style={{
          position: "absolute",
          top: "calc(16px + env(safe-area-inset-top))",
          right: 16,
        }}
      >
        <LanguageToggle />
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--r-2xl)",
          padding: "28px 24px",
          textAlign: "center",
          boxShadow: "var(--shadow-sm)",
          maxWidth: 380,
          width: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <BrandLogo size={64} />
        </div>
        <h1
          style={{
            margin: "0 0 8px",
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: "-0.3px",
            color: "var(--c-text)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--c-muted)",
          }}
        >
          {body}
        </p>

        {detail && (
          <pre
            style={{
              margin: "0 0 20px",
              padding: 10,
              borderRadius: "var(--r-md)",
              background: "var(--c-bg)",
              color: "var(--c-muted)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              overflowX: "auto",
            }}
          >
            {detail}
          </pre>
        )}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="vr-press"
              style={primaryButton}
            >
              {action.label}
            </button>
          )}
          <Link
            href="/"
            className="vr-press"
            style={action ? secondaryButton : primaryButton}
          >
            {homeLabel}
          </Link>
        </div>
      </div>
    </main>
  );
}
