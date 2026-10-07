"use client";

// "Cómo funciona" card on Home: the app's workflow in three steps, a link to
// the full guide (/guide), and a dismiss button. First-time visitors told us
// they did not know what the app was for or what "Agregar verso" did.
//
// Dismissal is remembered per browser in localStorage. The card renders only
// after mount: the server cannot know the stored choice, so rendering it
// during SSR would flash it for people who already dismissed it.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Close, Flame, Plus, Sparkles } from "@/components/icons/UiIcons";

const STORAGE_KEY = "vr-howto-dismissed";

type Strings = { title: string; steps: string[]; cta: string; dismiss: string };

const STEP_ICONS = [
  <Plus key="add" size={15} color="#fff" strokeWidth={2.8} />,
  <Sparkles key="own" size={15} color="#fff" />,
  <Flame key="practice" size={15} color="#fff" />,
];

export function HowItWorksCard({ strings: t }: { strings: Strings }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode: the card just returns next visit */
    }
  }

  if (!visible) return null;

  return (
    <section
      className="vr-fade-up"
      aria-label={t.title}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--r-2xl)",
        padding: "16px 16px 14px",
        background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 55%, #fdf4ff 100%)",
        boxShadow: "inset 0 0 0 1px rgb(var(--card-indigo-rgb) / 0.15)",
      }}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.dismiss}
        className="vr-press"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          border: "none",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.7)",
          color: "var(--c-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Close size={14} />
      </button>

      <h2
        style={{
          margin: "0 0 12px",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 16,
          color: "var(--c-text)",
        }}
      >
        {t.title}
      </h2>

      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}
      >
        {t.steps.map((step, i) => (
          <li key={step} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: 30,
                height: 30,
                borderRadius: 10,
                background: ["var(--brand-primary)", "var(--brand-sunrise)", "var(--brand-ember)"][i],
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {STEP_ICONS[i]}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", lineHeight: 1.35 }}>
              <span style={{ color: "var(--c-indigo-700)", fontWeight: 800 }}>{i + 1}.</span> {step}
            </span>
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <Link
          href="/guide"
          className="vr-press"
          style={{
            padding: "9px 16px",
            borderRadius: 999,
            background: "var(--brand-primary)",
            color: "#fff",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            boxShadow: "0 6px 16px rgb(var(--card-indigo-rgb) / 0.3)",
          }}
        >
          {t.cta}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="vr-press"
          style={{
            padding: "9px 16px",
            borderRadius: 999,
            border: "none",
            background: "rgba(255,255,255,0.8)",
            color: "var(--c-text)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          {t.dismiss}
        </button>
      </div>
    </section>
  );
}
