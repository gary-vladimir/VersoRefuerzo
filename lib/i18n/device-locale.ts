// The interface language remembered on this device.
//
// Signed-in users keep their language on their account (users.locale), but
// signed-out screens (login, privacy, terms, error pages) have no account to
// read. Firebase Hosting strips every cookie except `__session`, so the
// choice cannot ride in a cookie either; it lives in localStorage and those
// screens render it on the client. AppShell copies the account's language
// here, so after signing out the login page keeps the same language, and
// the login page sends it along on sign-in so a choice made before signing
// in is kept.

import { useSyncExternalStore } from "react";
import type { Locale } from "./strings";

const KEY = "vr-locale";
const EVENT = "vr-locale-change";

export function readDeviceLocale(): Locale | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "es" || v === "en" ? v : null;
  } catch {
    return null;
  }
}

export function writeDeviceLocale(locale: Locale): void {
  try {
    if (localStorage.getItem(KEY) === locale) return;
    localStorage.setItem(KEY, locale);
  } catch {
    // Private mode or blocked storage: the choice just lasts this page.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// Spanish on the server and on first visits; the stored choice after
// hydration.
export function useDeviceLocale(): Locale {
  return useSyncExternalStore(
    subscribe,
    () => readDeviceLocale() ?? "es",
    () => "es",
  );
}
