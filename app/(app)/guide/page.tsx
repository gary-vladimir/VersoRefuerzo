// /guide — "Cómo funciona". Explains what the app is and the daily workflow:
// add a verse by its citation, personalize it, practice, and how the four
// grades schedule the next review. Linked from the Home card, the profile
// sheet, and the New Verse form. Copy lives in lib/i18n/guide.ts.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { GUIDE, type Grade } from "@/lib/i18n/guide";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ModeIcon, type ModeName } from "@/components/practice/ModeIcons";
import { NavIcon } from "@/components/layout/NavIcons";
import {
  AlertCircle,
  BookSmall,
  Bulb,
  Check,
  Close,
  Flame,
  Plus,
  Sparkles,
} from "@/components/icons/UiIcons";
import { MobileLanguageToggle } from "@/components/i18n/LanguageToggle";

// Same gradients the practice hub gives each mode, so a mode looks the same
// here and there.
const MODE_GRADIENT: Record<ModeName, string> = {
  classic: "var(--brand-primary)",
  firstLetter: "var(--brand-sky)",
  scramble: "var(--brand-sunrise)",
  match: "var(--brand-forest)",
  gap: "var(--brand-ember)",
};

// Mirrors the quality buttons' colors and glyphs.
const GRADES: { id: Grade; color: string; icon: React.ReactNode }[] = [
  { id: "again", color: "var(--c-rose-500)", icon: <Close size={16} color="var(--c-rose-500)" /> },
  { id: "hard", color: "var(--c-orange-500)", icon: <AlertCircle size={16} color="var(--c-orange-500)" /> },
  { id: "good", color: "var(--c-indigo-600)", icon: <Check size={16} color="var(--c-indigo-600)" /> },
  { id: "easy", color: "var(--c-emerald-500)", icon: <Sparkles size={16} color="var(--c-emerald-500)" /> },
];

const STEP_ICONS = [
  <Plus key="add" size={20} color="#fff" strokeWidth={2.6} />,
  <Sparkles key="own" size={20} color="#fff" />,
  <Flame key="practice" size={20} color="#fff" />,
];
const STEP_GRADIENTS = ["var(--brand-primary)", "var(--brand-sunrise)", "var(--brand-ember)"];

const LIBRARY_ICONS = [
  <NavIcon key="col" name="library" size={18} color="var(--c-indigo-700)" />,
  <BookSmall key="book" size={18} color="var(--c-indigo-700)" />,
  <Check key="sort" size={18} color="var(--c-indigo-700)" />,
];

export default async function GuidePage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const g = GUIDE[user.locale === "en" ? "en" : "es"];

  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)", paddingBottom: 96 }}>
      <header
        style={{
          padding: "32px 20px 18px",
          background: "#fff",
          borderBottom: "1px solid var(--c-line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 26,
                letterSpacing: "-0.6px",
                color: "var(--c-text)",
              }}
            >
              {g.title}
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--c-muted)" }}>{g.subtitle}</p>
          </div>
          <MobileLanguageToggle />
        </div>
      </header>

      <div
        className="vr-stagger"
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "20px 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        {/* Hero */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--r-2xl)",
            padding: "24px 22px",
            background: "var(--brand-night)",
            color: "#fff",
            display: "flex",
            gap: 18,
            alignItems: "center",
            boxShadow: "0 18px 40px rgb(var(--card-indigo-rgb) / 0.3)",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(120% 90% at 85% 0%, rgba(168,85,247,0.45), transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <BrandLogo
            size={72}
            variant="white"
            style={{ position: "relative", flexShrink: 0, filter: "drop-shadow(0 6px 16px rgba(168,85,247,0.6))" }}
          />
          <div style={{ position: "relative" }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 19,
                letterSpacing: "-0.3px",
                lineHeight: 1.2,
              }}
            >
              {g.heroTitle}
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, opacity: 0.88 }}>
              {g.heroBody}
            </p>
          </div>
        </section>

        {/* Three steps */}
        <Section title={g.stepsTitle}>
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {g.steps.map((step, i) => (
              <li key={step.title} style={{ ...cardStyle, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span
                  aria-hidden
                  style={{
                    position: "relative",
                    flexShrink: 0,
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: STEP_GRADIENTS[i],
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
                  }}
                >
                  {STEP_ICONS[i]}
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      left: -6,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#fff",
                      color: "var(--c-text)",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 style={cardTitleStyle}>{step.title}</h3>
                  <p style={cardBodyStyle}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Grades */}
        <Section title={g.gradesTitle} intro={g.gradesIntro}>
          <div className="vr-collection-grid" style={{ display: "grid", gap: 10 }}>
            {GRADES.map((grade) => (
              <div
                key={grade.id}
                style={{ ...cardStyle, borderTop: `3px solid ${grade.color}`, paddingTop: 14 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {grade.icon}
                  <span style={{ ...cardTitleStyle, margin: 0 }}>{g.grades[grade.id].label}</span>
                </div>
                <p style={cardBodyStyle}>{g.grades[grade.id].body}</p>
              </div>
            ))}
          </div>
          <Tip>{g.gradesTip}</Tip>
        </Section>

        {/* Practice modes */}
        <Section title={g.modesTitle} intro={g.modesIntro}>
          <div style={{ display: "grid", gap: 10 }}>
            {g.modes.map((m) => (
              <div key={m.mode} style={{ ...cardStyle, display: "flex", gap: 14, alignItems: "center" }}>
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: MODE_GRADIENT[m.mode as ModeName],
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  <ModeIcon name={m.mode as ModeName} size={24} color="#fff" strokeWidth={2.1} />
                </span>
                <div>
                  <h3 style={cardTitleStyle}>{m.title}</h3>
                  <p style={cardBodyStyle}>{m.body}</p>
                </div>
              </div>
            ))}
          </div>
          <Tip>{g.modesTip}</Tip>
        </Section>

        {/* Library */}
        <Section title={g.libraryTitle}>
          <div style={{ display: "grid", gap: 10 }}>
            {g.library.map((item, i) => (
              <div key={item.title} style={{ ...cardStyle, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: "var(--c-indigo-50)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {LIBRARY_ICONS[i]}
                </span>
                <div>
                  <h3 style={cardTitleStyle}>{item.title}</h3>
                  <p style={cardBodyStyle}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Tips */}
        <Section title={g.tipsTitle}>
          <ul
            style={{
              ...cardStyle,
              listStyle: "none",
              margin: 0,
              display: "grid",
              gap: 10,
              background: "var(--card-amber-tint)",
              boxShadow: "inset 0 0 0 1px rgb(var(--card-amber-rgb) / 0.25)",
            }}
          >
            {g.tips.map((tip) => (
              <li key={tip} style={{ display: "flex", gap: 10, alignItems: "flex-start", ...cardBodyStyle }}>
                <span aria-hidden style={{ flexShrink: 0, marginTop: 1, display: "inline-flex" }}>
                  <Bulb size={16} color="var(--card-amber-solid)" />
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </Section>

        {/* Call to action */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/verses/new" className="vr-press" style={primaryCta}>
            {g.ctaAdd}
          </Link>
          <Link href="/practice" className="vr-press" style={secondaryCta}>
            {g.ctaPractice}
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        style={{
          margin: "0 0 4px",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: "-0.3px",
          color: "var(--c-text)",
        }}
      >
        {title}
      </h2>
      {intro && (
        <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.5, color: "var(--c-muted)" }}>
          {intro}
        </p>
      )}
      <div style={{ marginTop: intro ? 0 : 12 }}>{children}</div>
    </section>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "10px 0 0",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        fontSize: 12.5,
        lineHeight: 1.5,
        color: "var(--c-indigo-700)",
        background: "var(--c-indigo-50)",
        borderRadius: "var(--r-lg)",
        padding: "10px 12px",
      }}
    >
      <span aria-hidden style={{ flexShrink: 0, display: "inline-flex", marginTop: 1 }}>
        <Bulb size={15} color="var(--c-indigo-700)" />
      </span>
      {children}
    </p>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "var(--r-xl)",
  padding: "14px 16px",
  boxShadow: "var(--shadow-xs)",
};

const cardTitleStyle: React.CSSProperties = {
  margin: "0 0 3px",
  fontFamily: "var(--font-display)",
  fontWeight: 800,
  fontSize: 15,
  color: "var(--c-text)",
};

const cardBodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  lineHeight: 1.55,
  color: "var(--c-muted)",
};

const primaryCta: React.CSSProperties = {
  padding: "13px 22px",
  borderRadius: 999,
  background: "var(--brand-primary)",
  color: "#fff",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  boxShadow: "0 8px 20px rgb(var(--card-indigo-rgb) / 0.35)",
};

const secondaryCta: React.CSSProperties = {
  padding: "13px 22px",
  borderRadius: 999,
  background: "#fff",
  color: "var(--c-text)",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  textDecoration: "none",
  boxShadow: "inset 0 0 0 1.5px var(--c-line)",
};
