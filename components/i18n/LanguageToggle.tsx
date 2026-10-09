"use client";

// "ES | EN" switch shown on every screen.
//
// Inside a LocaleProvider (every signed-in page) it saves the language on
// the account and refreshes the page, so server-rendered text follows.
// Without one (signed-out screens) it saves the choice on this device; see
// lib/i18n/device-locale.ts.

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/strings";
import { useDeviceLocale, writeDeviceLocale } from "@/lib/i18n/device-locale";

const AccountLocaleContext = createContext<Locale | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  // Keep the device copy in step with the account, for the signed-out
  // screens shown after a sign-out or on an error.
  useEffect(() => writeDeviceLocale(locale), [locale]);
  return <AccountLocaleContext.Provider value={locale}>{children}</AccountLocaleContext.Provider>;
}

// The language to render client-side text in: the account's when signed
// in, otherwise this device's.
export function useLocale(): Locale {
  const account = useContext(AccountLocaleContext);
  const device = useDeviceLocale();
  return account ?? device;
}

const LABELS: Record<Locale, { group: string; es: string; en: string }> = {
  es: { group: "Idioma", es: "Español", en: "Inglés" },
  en: { group: "Language", es: "Spanish", en: "English" },
};

export function LanguageToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const account = useContext(AccountLocaleContext);
  const current = useLocale();
  // Shown right away while the account update and refresh are in flight.
  const [pending, setPending] = useState<Locale | null>(null);
  const value = pending ?? current;

  useEffect(() => {
    if (pending && pending === current) setPending(null);
  }, [pending, current]);

  async function choose(next: Locale) {
    if (next === value) return;
    if (!account) {
      writeDeviceLocale(next);
      return;
    }
    setPending(next);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      writeDeviceLocale(next);
      router.refresh();
    } catch {
      setPending(null);
    }
  }

  const dark = tone === "dark";
  const labels = LABELS[value];
  return (
    <div
      role="group"
      aria-label={labels.group}
      style={{
        display: "inline-flex",
        flexShrink: 0,
        padding: 3,
        borderRadius: 999,
        background: dark ? "rgba(255,255,255,0.14)" : "var(--c-card-soft)",
        boxShadow: dark
          ? "inset 0 0 0 1px rgba(255,255,255,0.18)"
          : "inset 0 0 0 1px var(--c-line)",
      }}
    >
      {(["es", "en"] as const).map((l) => {
        const sel = l === value;
        return (
          <button
            key={l}
            type="button"
            onClick={() => choose(l)}
            aria-pressed={sel}
            aria-label={labels[l]}
            lang={l}
            className="vr-press"
            style={{
              minWidth: 34,
              padding: "5px 9px",
              borderRadius: 999,
              border: "none",
              background: sel ? "#fff" : "transparent",
              color: sel
                ? "var(--c-indigo-700)"
                : dark
                  ? "rgba(255,255,255,0.78)"
                  : "var(--c-muted)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: 0.4,
              cursor: "pointer",
              boxShadow: sel ? "var(--shadow-xs)" : "none",
              transition: "background var(--dur-2) ease, color var(--dur-2) ease",
            }}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

// For screen headers: phones only, since on desktop the sidebar has the
// switch.
export function MobileLanguageToggle() {
  return (
    <span className="vr-mobile-only" style={{ alignItems: "center", flexShrink: 0 }}>
      <LanguageToggle />
    </span>
  );
}

// For full-screen centered pages without a header (onboarding, summary,
// empty states): pinned to the top-right corner. `mobileOnly` for pages
// inside the signed-in shell, where desktop has the sidebar switch.
export function CornerLanguageToggle({
  tone = "light",
  mobileOnly = false,
}: {
  tone?: "light" | "dark";
  mobileOnly?: boolean;
}) {
  return (
    <span
      className={mobileOnly ? "vr-mobile-only" : undefined}
      style={{
        display: "flex",
        position: "absolute",
        top: "calc(16px + env(safe-area-inset-top))",
        right: 16,
        zIndex: 3,
      }}
    >
      <LanguageToggle tone={tone} />
    </span>
  );
}
