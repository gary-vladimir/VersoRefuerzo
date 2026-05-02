"use client";

// Underscore-prefixed file = excluded from Next.js routing.
// Small client component used by the M1 home placeholder.
// Will be folded into ProfileSheet in M7 (specs.md §16.3).

import { useState } from "react";

export default function SignOutButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      type="button"
      style={{
        marginTop: "var(--s-6)",
        background: "var(--c-card)",
        color: "var(--c-text)",
        border: "none",
        borderRadius: "var(--r-full)",
        padding: "12px 18px",
        height: 46,
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: 15,
        boxShadow: "inset 0 0 0 1.5px var(--c-line)",
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "…" : label}
    </button>
  );
}
