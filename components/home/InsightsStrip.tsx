// Compact progress strip for Home — three at-a-glance counts derived from
// the verse list already loaded by the page (no extra query). Surfaces the
// new / learning / mastered breakdown the desktop spec (§6.7) wants, in a
// form that works on mobile too.

import { T, type Locale } from "@/lib/i18n/strings";
import type { Verse } from "@/db/schema";

export function InsightsStrip({
  verses,
  locale,
}: {
  verses: Verse[];
  locale: Locale;
}) {
  const t = T[locale];
  let neu = 0;
  let learning = 0;
  let mastered = 0;
  for (const v of verses) {
    if (v.status === "mastered") mastered += 1;
    else if (v.status === "new") neu += 1;
    else learning += 1;
  }

  const stats: { label: string; value: number; color: string }[] = [
    { label: t.statNew, value: neu, color: "var(--c-sky-500)" },
    { label: t.statLearning, value: learning, color: "var(--c-amber-500)" },
    { label: t.statMastered, value: mastered, color: "var(--c-emerald-500)" },
  ];

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            background: "#fff",
            borderRadius: "var(--r-xl)",
            padding: "12px 14px",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <div
            className="vr-count-pop"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 24,
              lineHeight: 1,
              color: s.color,
            }}
          >
            {s.value}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              fontWeight: 700,
              color: "var(--c-muted)",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
