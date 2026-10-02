"use client";

// Login screen — ported from DesignBundle/mobile-screens.jsx :: ScreenLogin.
// Decorative pieces that depend on the icon library port (floating verse-card
// silhouettes, feature pills with icons) are deferred until M3/M7. Core visual
// language (night gradient, twinkling stars, animated logo, Google button) is
// in place to satisfy AC-1 / AC-22. Rendered by app/(auth)/login/page.tsx,
// which handles the signed-in-already redirect.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getClientAuth, googleProvider } from "@/lib/auth/firebase-client";
import { T } from "@/lib/i18n/strings";
import { BrandLogo } from "@/components/ui/BrandLogo";

// Star field as [left %, top %, size px, delay s]. Percentages so the stars
// spread over the whole screen; fixed pixels bunched them into the top-left
// phone-sized corner on desktop.
const STARS: Array<[number, number, number, number]> = [
  [10, 9, 2, 0],
  [21, 22, 3, 0.5],
  [78, 13, 2, 1],
  [42, 31, 3, 0.3],
  [88, 39, 2, 0.8],
  [15, 47, 2, 1.2],
  [72, 51, 3, 0.4],
  [52, 58, 2, 1.5],
  [26, 16, 2, 2],
  [84, 28, 2, 0.2],
  [6, 72, 2, 0.9],
  [93, 66, 3, 1.7],
  [34, 84, 2, 0.6],
  [64, 90, 2, 1.1],
];

// Set just before handing the page to Google, so the login screen can show
// "signing in" while it finishes the redirect instead of an idle button.
const REDIRECT_FLAG = "vr-signin-redirect";

// Phones get a full-page redirect: their browsers block a sign-in popup that
// does not open instantly on the tap, and a popup is awkward on a small
// screen anyway. Desktops keep the popup, which avoids a page reload.
function prefersRedirect(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

export default function LoginClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = T.es;

  // Create the Firebase auth instance as soon as the screen mounts. Done
  // lazily inside the click handler, its setup ran before the popup opened,
  // so mobile Safari no longer counted the popup as a response to the tap
  // and blocked it. This is also where a redirect sign-in comes back.
  useEffect(() => {
    let auth: Auth;
    try {
      auth = getClientAuth();
    } catch (e) {
      console.error(e);
      return;
    }
    let returning = false;
    try {
      returning = sessionStorage.getItem(REDIRECT_FLAG) === "1";
      sessionStorage.removeItem(REDIRECT_FLAG);
    } catch {
      /* storage unavailable: fall through, getRedirectResult still works */
    }
    if (returning) setLoading(true);
    getRedirectResult(auth)
      .then((credential) => {
        if (credential) return finishSignIn(auth, credential.user);
        if (returning) setLoading(false);
      })
      .catch((e) => fail(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trade the Firebase ID token for the server session cookie, then leave
  // the client SDK signed out: the httpOnly cookie is the source of truth.
  async function finishSignIn(auth: Auth, user: User) {
    const idToken = await user.getIdToken();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken, timezone }),
    });
    await signOut(auth);
    if (!res.ok) throw new Error(`session POST returned ${res.status}`);
    const data = (await res.json()) as { user: { hasCompletedOnboarding: boolean } };
    // Hard navigation so server components re-fetch with the new cookie.
    window.location.href = data.user.hasCompletedOnboarding ? "/" : "/onboarding";
  }

  function fail(e: unknown) {
    setLoading(false);
    // Closing the Google popup is a choice, not a failure.
    const code = (e as { code?: string } | null)?.code;
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return;
    }
    console.error(e);
    setError(t.signInError);
  }

  async function redirectToGoogle(auth: Auth) {
    try {
      sessionStorage.setItem(REDIRECT_FLAG, "1");
    } catch {
      /* only drives the loading state on return */
    }
    await signInWithRedirect(auth, googleProvider);
  }

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const auth = getClientAuth();
      if (prefersRedirect()) {
        await redirectToGoogle(auth);
        return;
      }
      try {
        const credential = await signInWithPopup(auth, googleProvider);
        await finishSignIn(auth, credential.user);
      } catch (e) {
        // A browser that still blocks the popup gets the redirect instead
        // of an error message.
        if ((e as { code?: string } | null)?.code === "auth/popup-blocked") {
          await redirectToGoogle(auth);
          return;
        }
        throw e;
      }
    } catch (e) {
      fail(e);
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
            left: `${x}%`,
            top: `${y}%`,
            width: s,
            height: s,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: `0 0 ${s * 3}px #fff`,
            animationDelay: `${d}s`,
          }}
        />
      ))}

      {/* The brand mark in white on the night sky, with a soft violet glow
          behind it (a drop-shadow follows the mark's own outline). */}
      <div
        className="vr-card-rise"
        style={{ marginBottom: 26, position: "relative", zIndex: 2 }}
      >
        <BrandLogo
          size={132}
          variant="white"
          priority
          style={{ filter: "drop-shadow(0 10px 28px rgba(168,85,247,0.75))" }}
        />
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
          fontSize: 12,
          color: "rgba(255,255,255,0.7)",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          maxWidth: 320,
          lineHeight: 1.4,
        }}
      >
        {t.privacy}
      </p>
      <p
        style={{
          marginTop: 4,
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        {t.freeForever}
      </p>
      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 18,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Link
          href="/privacy"
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            textDecoration: "underline",
          }}
        >
          {t.privacyLink}
        </Link>
        <Link
          href="/terms"
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            textDecoration: "underline",
          }}
        >
          {t.termsLink}
        </Link>
      </div>
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
