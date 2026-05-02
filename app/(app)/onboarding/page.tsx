// First-run onboarding (specs.md §17.7).
// Shown automatically by app/(app)/layout.tsx when hasCompletedOnboarding === false.
// One-time only — if the user navigates here after completing it, redirect to /.

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth/session";
import { T } from "@/lib/i18n/strings";
import OnboardingActions from "./_actions";

export default async function OnboardingPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");
  if (user.hasCompletedOnboarding) redirect("/");
  const t = T[user.locale === "en" ? "en" : "es"];

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s-7)",
        background: "var(--c-bg)",
        textAlign: "center",
      }}
    >
      <div
        className="vr-card-rise"
        style={{
          width: 88,
          height: 88,
          borderRadius: 24,
          background: "var(--brand-sunrise)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 18px 40px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
          marginBottom: "var(--s-6)",
          color: "#fff",
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: "-1px",
        }}
      >
        VR
      </div>

      <h1
        className="vr-fade-up"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: "-0.6px",
          margin: 0,
          color: "var(--c-text)",
          maxWidth: 360,
          lineHeight: 1.1,
        }}
      >
        {t.loginTagline}
      </h1>

      <ul
        className="vr-fade-up"
        style={{
          marginTop: "var(--s-6)",
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-3)",
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          color: "var(--c-text)",
          maxWidth: 360,
          textAlign: "left",
          animationDelay: "0.2s",
        }}
      >
        {[t.onboardingBullet1, t.onboardingBullet2, t.onboardingBullet3].map(
          (line, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--s-3)",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "var(--c-indigo-50)",
                  color: "var(--c-indigo-700)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 12,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <span>{line}</span>
            </li>
          ),
        )}
      </ul>

      <OnboardingActions
        primaryLabel={t.addFirstVerse}
        skipLabel={t.skip}
      />
    </main>
  );
}
