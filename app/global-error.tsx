"use client";

// Last-resort boundary for failures in the root layout itself, where
// app/error.tsx cannot help because the layout that would host it is the
// thing that broke. It replaces the document, so it has to render its own
// <html> and <body> — and it cannot rely on globals.css having loaded,
// hence the literal colors below rather than design tokens.

import { useEffect } from "react";
import { useDeviceLocale, writeDeviceLocale } from "@/lib/i18n/device-locale";

const COPY = {
  es: { title: "Algo salió mal", body: "No pudimos cargar la aplicación. Vuelve a intentarlo.", retry: "Reintentar" },
  en: { title: "Something went wrong", body: "We couldn't load the app. Please try again.", retry: "Try again" },
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("root layout error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  // The language remembered on this device (lib/i18n/device-locale.ts).
  const locale = useDeviceLocale();
  const c = COPY[locale];

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9fe",
          color: "#1c1b22",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
            {c.title}
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "#6b6880", margin: "0 0 20px" }}>
            {c.body}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "11px 20px",
              borderRadius: 999,
              border: "none",
              background: "#5b5bd6",
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {c.retry}
          </button>
          <div style={{ marginTop: 16, fontSize: 13 }}>
            {(["es", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => writeDeviceLocale(l)}
                aria-pressed={l === locale}
                style={{
                  margin: "0 4px",
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid #e4e2ee",
                  background: l === locale ? "#fff" : "transparent",
                  fontWeight: l === locale ? 800 : 500,
                  cursor: "pointer",
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </body>
    </html>
  );
}
