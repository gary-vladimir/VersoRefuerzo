// Streaming fallback for every authed route.
//
// Each page under (app) does its own auth verification and database reads
// before rendering, so a cold Neon connection leaves the user staring at
// the previous screen. This gives Next something to paint immediately.
//
// Deliberately generic — a header block and a few rows, which reads as
// plausible for Home, Library, and the practice hub alike. `.vr-skeleton`
// already goes static under prefers-reduced-motion (specs.md §17.8).

export default function AppLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      style={{ minHeight: "100dvh", background: "var(--c-bg)", paddingBottom: 80 }}
    >
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        Cargando
      </span>

      <div
        style={{
          padding: "32px 20px 18px",
          background: "#fff",
          borderBottom: "1px solid var(--c-line)",
        }}
      >
        <div
          className="vr-skeleton"
          style={{ width: "55%", height: 26, borderRadius: 8 }}
        />
        <div
          className="vr-skeleton"
          style={{ width: "35%", height: 13, borderRadius: 6, marginTop: 10 }}
        />
      </div>

      <div
        style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="vr-skeleton"
            style={{ height: 74, borderRadius: "var(--r-2xl)" }}
          />
        ))}
      </div>
    </main>
  );
}
