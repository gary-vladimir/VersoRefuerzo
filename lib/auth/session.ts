// Server-side session helpers. The session is a Firebase session cookie
// (created from a verified ID token) stored as an httpOnly cookie. Every
// authed request hits `getServerUser()` which:
//   1. reads the cookie
//   2. verifies it cryptographically via the Admin SDK
//   3. looks up the user row in Postgres by Firebase UID
// Memoized via React's `cache()` so a single request never verifies twice.

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { adminAuth } from "./firebase-admin";
import { getDb } from "@/db/client";
import { users, type User } from "@/db/schema";

const COOKIE_NAME = "__session";
// 5 days. Firebase allows up to 14; keeping it shorter limits blast radius if a
// device is compromised. Re-issued on every successful sign-in.
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export async function createSessionCookie(idToken: string): Promise<string> {
  return adminAuth().createSessionCookie(idToken, {
    expiresIn: COOKIE_MAX_AGE_SECONDS * 1000,
  });
}

export async function setSessionCookie(value: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const getServerUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const cookie = store.get(COOKIE_NAME);
  if (!cookie) return null;

  let decoded;
  try {
    // checkRevoked=true catches sign-out / disable on the Firebase side.
    decoded = await adminAuth().verifySessionCookie(cookie.value, true);
  } catch {
    return null;
  }

  const db = getDb();
  const found = await db
    .select()
    .from(users)
    .where(eq(users.googleSub, decoded.uid))
    .limit(1);
  return found[0] ?? null;
});

export async function upsertUserFromIdToken(
  idToken: string,
  timezone: string | null,
): Promise<User> {
  const decoded = await adminAuth().verifyIdToken(idToken);
  const db = getDb();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.googleSub, decoded.uid))
    .limit(1);

  if (existing[0]) {
    const updated = await db
      .update(users)
      .set({
        email: decoded.email ?? existing[0].email,
        displayName: decoded.name ?? existing[0].displayName,
        photoUrl: decoded.picture ?? existing[0].photoUrl,
        ...(timezone ? { timezone } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing[0].id))
      .returning();
    return updated[0]!;
  }

  const inserted = await db
    .insert(users)
    .values({
      googleSub: decoded.uid,
      email: decoded.email ?? "",
      displayName:
        decoded.name ?? decoded.email?.split("@")[0] ?? "User",
      photoUrl: decoded.picture ?? null,
      timezone,
    })
    .returning();
  return inserted[0]!;
}
