// Firebase Web SDK — client-only. Used by the login page to obtain an ID token
// from a Google sign-in popup. After we POST the ID token to /api/auth/session,
// we sign out of the client SDK and rely solely on the httpOnly server session.

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
  return { apiKey, authDomain, projectId, appId };
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
