// Firebase Admin SDK — server-only. Initialized lazily on first use so importing
// the module without env vars set (e.g. during a tooling pass) does not throw.
//
// Required env vars (see .env.example):
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let cachedApp: App | null = null;

function init(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      "Firebase admin env vars missing: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY",
    );
  }

  // Env files store the private key with literal \n; convert to real newlines.
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return cachedApp;
}

export function adminAuth(): Auth {
  return getAuth(init());
}
