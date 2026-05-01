// M0 placeholder. Proves design tokens are wired.
// Replaced in M1 by the real Home (`(app)/page.tsx`).

const cardSwatches = [
  { id: "indigo", label: "Indigo" },
  { id: "violet", label: "Violeta" },
  { id: "rose", label: "Rosa" },
  { id: "amber", label: "Ámbar" },
  { id: "emerald", label: "Esmeralda" },
  { id: "sky", label: "Cielo" },
  { id: "crimson", label: "Carmesí" },
  { id: "midnight", label: "Medianoche" },
] as const;

export default function Page() {
  return (
    <main style={{ padding: "var(--s-7)", maxWidth: 960, margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 800,
          letterSpacing: "-0.6px",
          color: "var(--c-text)",
          margin: 0,
        }}
      >
        VersoRefuerzo
      </h1>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          marginTop: "var(--s-3)",
          color: "var(--c-muted)",
          fontSize: 16,
        }}
      >
        Memoriza la Palabra. Una tarjeta a la vez.
      </p>

      <section style={{ marginTop: "var(--s-8)" }}>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--c-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            margin: 0,
          }}
        >
          M0 — Design tokens
        </h2>
        <div
          style={{
            marginTop: "var(--s-4)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "var(--s-3)",
          }}
        >
          {cardSwatches.map((s) => (
            <div
              key={s.id}
              style={{
                height: 120,
                borderRadius: "var(--r-2xl)",
                background: `var(--card-${s.id}-bg)`,
                boxShadow: "var(--shadow-md)",
                display: "flex",
                alignItems: "flex-end",
                padding: "var(--s-3)",
                color: "#fff",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      </section>

      <p
        style={{
          marginTop: "var(--s-8)",
          color: "var(--c-soft)",
          fontSize: 13,
        }}
      >
        Health check:{" "}
        <a
          href="/api/health"
          style={{
            color: "var(--c-indigo-600)",
            fontFamily: "var(--font-mono)",
          }}
        >
          /api/health
        </a>
      </p>
    </main>
  );
}
