"use client";

// Login screen — ported from DesignBundle/mobile-screens.jsx :: ScreenLogin.
// Decorative pieces that depend on the icon library port (floating verse-card
// silhouettes, feature pills with icons) are deferred until M3/M7. Core visual
// language (night gradient, twinkling stars, animated logo, Google button) is
// in place to satisfy AC-1 / AC-22.

import { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { getClientAuth, googleProvider } from "@/lib/auth/firebase-client";
import { T } from "@/lib/i18n/strings";

const STARS: Array<[number, number, number, number]> = [
  [40, 80, 2, 0],
  [80, 200, 3, 0.5],
  [300, 120, 2, 1],
  [160, 280, 3, 0.3],
  [340, 350, 2, 0.8],
  [60, 420, 2, 1.2],
  [280, 460, 3, 0.4],
  [200, 520, 2, 1.5],
  [100, 140, 2, 2],
  [320, 250, 2, 0.2],
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = T.es;

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const auth = getClientAuth();
      const credential = await signInWithPopup(auth, googleProvider);
      const idToken = await credential.user.getIdToken();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken, timezone }),
      });

      // We sign out of the client SDK regardless — the server-side session
      // cookie is the source of truth from here on.
      await signOut(auth);

      if (!res.ok) {
        throw new Error(`session POST returned ${res.status}`);
      }
      const data = (await res.json()) as {
        user: { hasCompletedOnboarding: boolean };
      };

      // Hard navigation so server components re-fetch with the new cookie.
      window.location.href = data.user.hasCompletedOnboarding
        ? "/"
        : "/onboarding";
    } catch (e) {
      console.error(e);
      setError(t.signInError);
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(ellipse at 30% 20%, #4C1D95 0%, #1E1B4B 50%, #0F0E1A 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--s-7)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {STARS.map(([x, y, s, d], i) => (
        <span
          key={i}
          className="vr-twinkle"
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: s,
            height: s,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: `0 0 ${s * 3}px #fff`,
            animationDelay: `${d}s`,
          }}
        />
      ))}

      <div
        className="vr-card-rise"
        style={{
          width: 110,
          height: 110,
          borderRadius: 32,
          background: "var(--brand-sunrise)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "0 24px 60px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.3)",
          marginBottom: 28,
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 44,
          letterSpacing: "-1.5px",
          position: "relative",
          zIndex: 2,
        }}
      >
        VR
      </div>

      <h1
        className="vr-fade-up"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 40,
          letterSpacing: "-1.2px",
          margin: 0,
          textAlign: "center",
          lineHeight: 1,
          animationDelay: "0.2s",
          position: "relative",
          zIndex: 2,
        }}
      >
        <span className="vr-shimmer-text">{t.appName}</span>
      </h1>

      <p
        className="vr-fade-up"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 16,
          marginTop: 18,
          color: "rgba(255,255,255,0.85)",
          textAlign: "center",
          lineHeight: 1.45,
          maxWidth: 280,
          fontStyle: "italic",
          animationDelay: "0.4s",
          position: "relative",
          zIndex: 2,
        }}
      >
        {t.loginTagline}
      </p>

      <button
        onClick={handleSignIn}
        disabled={loading}
        className="vr-fade-up"
        style={{
          marginTop: 48,
          background: "#fff",
          color: "#1F1F1F",
          border: "none",
          borderRadius: "var(--r-full)",
          padding: "16px 24px",
          height: 56,
          fontSize: 17,
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          letterSpacing: "-0.1px",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          cursor: loading ? "wait" : "pointer",
          width: "100%",
          maxWidth: 320,
          justifyContent: "center",
          boxShadow:
            "inset 0 0 0 1px var(--c-line), 0 2px 8px rgba(0,0,0,0.04)",
          opacity: loading ? 0.7 : 1,
          animationDelay: "0.6s",
          position: "relative",
          zIndex: 2,
        }}
        type="button"
      >
        <GoogleIcon />
        {loading ? t.signingIn : t.continueGoogle}
      </button>

      {error && (
        <p
          role="alert"
          style={{
            color: "#FCA5A5",
            marginTop: 16,
            fontSize: 14,
            position: "relative",
            zIndex: 2,
          }}
        >
          {error}
        </p>
      )}

      <p
        style={{
          marginTop: 16,
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {t.freeForever}
      </p>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
