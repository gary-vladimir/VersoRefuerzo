// Firebase Web SDK — client-only. Used by the login page to obtain an ID token
// from Google sign-in (a popup on desktop, a full-page redirect on phones).
// After we POST the ID token to /api/auth/session, we sign out of the client
// SDK and rely solely on the httpOnly server session.

"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

function readConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Firebase web env vars missing: set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID",
    );
  }
  return { apiKey, authDomain: authDomainFor(authDomain), projectId, appId };
}

// Where Firebase's sign-in helper pages (/__/auth/handler) are loaded from.
//
// Out of the box that is <project>.firebaseapp.com, a different site from
// the app. Phone browsers partition storage per site (Safari ITP, Chrome
// storage partitioning), so the helper could not see the sign-in state the
// app started and failed with "missing initial state". On a deployed HTTPS
// origin the app proxies /__/auth/* to firebaseapp.com (next.config.ts), so
// we point Firebase at the app's own host and the whole flow stays on one
// site. Local development keeps the configured domain, since the proxied
// handler URL is only registered for the deployed hosts.
function authDomainFor(configured: string): string {
  if (typeof window === "undefined") return configured;
  const { protocol, hostname, host } = window.location;
  if (protocol === "https:" && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return host;
  }
  return configured;
}

let cachedApp: FirebaseApp | null = null;

export function getClientApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length ? getApp() : initializeApp(readConfig());
  return cachedApp;
}

export function getClientAuth(): Auth {
  return getAuth(getClientApp());
}

export const googleProvider = new GoogleAuthProvider();
