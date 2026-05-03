"use client";

import { useState } from "react";

export default function OnboardingActions({
  primaryLabel,
  skipLabel,
}: {
  primaryLabel: string;
  skipLabel: string;
}) {
  const [loading, setLoading] = useState<null | "primary" | "skip">(null);

  async function complete(target: string, which: "primary" | "skip") {
    setLoading(which);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hasCompletedOnboarding: true }),
    });
    // Hard nav so the (app) layout re-runs without the onboarding redirect.
    window.location.href = target;
  }

  return (
    <div
      style={{
        marginTop: "var(--s-8)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-3)",
        width: "100%",
        maxWidth: 320,
      }}
    >
      <button
        type="button"
        // §17.7: opens New Verse pre-filled with Juan 14:6.
        onClick={() => complete("/verses/new?ref=Juan%2014%3A6", "primary")}
        disabled={loading !== null}
        style={{
          background: "var(--brand-primary)",
          color: "#fff",
          border: "none",
          borderRadius: "var(--r-full)",
          padding: "16px 24px",
          height: 56,
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: 17,
          letterSpacing: "-0.1px",
          boxShadow:
            "0 8px 20px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
          cursor: loading ? "wait" : "pointer",
          opacity: loading === "skip" ? 0.5 : 1,
        }}
      >
        {loading === "primary" ? "…" : primaryLabel}
      </button>
      <button
        type="button"
        onClick={() => complete("/", "skip")}
        disabled={loading !== null}
        style={{
          background: "transparent",
          color: "var(--c-muted)",
          border: "none",
          padding: "12px 18px",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: 14,
          cursor: loading ? "wait" : "pointer",
          opacity: loading === "primary" ? 0.5 : 1,
        }}
      >
        {loading === "skip" ? "…" : skipLabel}
      </button>
    </div>
  );
}
