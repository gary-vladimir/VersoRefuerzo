"use client";

// Profile sheet (specs.md §16.3 + AC-19).
//
// Bottom sheet on mobile, centered modal on desktop. Single source of
// truth for the four profile actions:
//   - Language toggle (ES ↔ EN) — PATCH /api/me + router.refresh so every
//     server component re-renders in the new locale without a full reload
//     (AC-7 satisfied semantically; the URL stays put).
//   - Sound effects toggle — PATCH /api/me + setSoundEnabled flips the
//     in-process player flag immediately.
//   - Sign out — DELETE /api/auth/session + signOut from the Firebase
//     client (mirror of the existing sign-out button).
//   - Delete account — confirm step + DELETE /api/me. AC-11.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/auth/firebase-client";
import { setSoundEnabled, play } from "@/lib/sounds/player";
import { T, type Locale } from "@/lib/i18n/strings";
import { deriveEffectiveStreak } from "@/lib/streak/streak";
import { Flame } from "@/components/icons/UiIcons";
import type { User } from "@/db/schema";
import { UserAvatar } from "@/components/ui/UserAvatar";

type Props = {
  user: User;
  open: boolean;
  onClose: () => void;
};

export function ProfileSheet({ user, open, onClose }: Props) {
  const router = useRouter();
  const locale: Locale = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Local mirrors so the toggles feel instant; we reconcile to the server
  // value on success.
  const [localeDraft, setLocaleDraft] = useState<Locale>(locale);
  const [soundDraft, setSoundDraft] = useState<boolean>(user.soundEnabled);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setLocaleDraft(locale);
    setSoundDraft(user.soundEnabled);
  }, [locale, user.soundEnabled]);

  // Modal behavior (specs.md §10.4): trap focus inside the dialog, lock
  // background scroll while open, close on Escape, and restore focus to the
  // element that opened the sheet on close.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = (document.activeElement as HTMLElement) ?? null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    panel?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      // Focus can drop to <body> (e.g. a re-render). Pull it back inside
      // rather than letting Tab walk the page behind the modal.
      if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const currentStreak = deriveEffectiveStreak({
    state: {
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      lastStreakAt: (user.lastStreakAt ?? null) as string | null,
    },
    tz: user.timezone,
  });

  async function patchMe(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) router.refresh();
      return res.ok;
    } finally {
      setBusy(false);
    }
  }

  async function toggleLocale(next: Locale) {
    if (busy || next === localeDraft) return;
    setLocaleDraft(next);
    const ok = await patchMe({ locale: next });
    if (!ok) setLocaleDraft(locale);
  }

  async function toggleSound() {
    if (busy) return;
    const next = !soundDraft;
    setSoundDraft(next);
    setSoundEnabled(next);
    if (next) play("pluck");
    const ok = await patchMe({ soundEnabled: next });
    if (!ok) {
      setSoundDraft(!next);
      setSoundEnabled(!next);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut(getClientAuth());
    } catch {
      /* fall through — server clears its cookie regardless */
    }
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    const res = await fetch("/api/me", { method: "DELETE" });
    if (res.ok) {
      try {
        await signOut(getClientAuth());
      } catch {
        /* ignore */
      }
      router.push("/login");
      router.refresh();
    } else {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vr-profile-title"
      onClick={onClose}
      className="vr-fade-in vr-sheet-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--scrim)",
        zIndex: "var(--z-modal)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="vr-card-rise vr-sheet-panel"
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 480,
          borderRadius: "var(--r-3xl) var(--r-3xl) 0 0",
          padding: "20px 20px calc(28px + env(safe-area-inset-bottom))",
          boxShadow: "var(--shadow-xl)",
          maxHeight: "92dvh",
          overflowY: "auto",
          outline: "none",
        }}
      >
        {/* Drag handle — visual sheet affordance on mobile. */}
        <span
          aria-hidden
          className="vr-sheet-handle"
          style={{
            display: "block",
            width: 40,
            height: 4,
            background: "var(--c-line)",
            borderRadius: 2,
            margin: "0 auto 18px",
          }}
        />

        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <UserAvatar displayName={user.displayName} photoUrl={user.photoUrl} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              id="vr-profile-title"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 16,
                color: "var(--c-text)",
                letterSpacing: "-0.2px",
              }}
            >
              {user.displayName}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--c-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </div>
          </div>
        </header>

        {/* Streak (§16.3): the current run as Home shows it, plus the best. */}
        <Row label={t.streakRow}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--c-text)",
            }}
          >
            <Flame size={15} strokeWidth={1.6} color="#F97316" />
            {t.streakLabel(currentStreak)}
            <span style={{ color: "var(--c-muted)", fontWeight: 600 }}>
              · {t.bestStreak(user.bestStreak)}
            </span>
          </span>
        </Row>

        {/* Language */}
        <Row label={t.language}>
          <Toggle
            options={[
              { value: "es", label: "ES" },
              { value: "en", label: "EN" },
            ]}
            value={localeDraft}
            onChange={(v) => toggleLocale(v as Locale)}
          />
        </Row>

        {/* Sound */}
        <Row label={t.soundEffects}>
          {/* Not disabled while saving (the handlers ignore taps instead):
              disabling the focused control threw focus out of the dialog. */}
          <Switch checked={soundDraft} onChange={toggleSound} />
        </Row>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginTop: 20,
          }}
        >
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="vr-press"
            style={primaryActionStyle}
          >
            {t.signOut}
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="vr-press"
              style={destructiveActionStyle}
            >
              {t.deleteAccount}
            </button>
          ) : (
            <div
              style={{
                background: "var(--c-card-soft)",
                borderRadius: "var(--r-xl)",
                padding: 14,
                marginTop: 4,
              }}
            >
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: 13,
                  color: "var(--c-text)",
                  lineHeight: 1.4,
                }}
              >
                {t.deleteAccountConfirm}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={busy}
                  className="vr-press"
                  style={{ ...secondaryActionStyle, flex: 1 }}
                >
                  {t.deleteAccountCancel}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="vr-press"
                  style={{ ...destructiveActionStyle, flex: 1 }}
                >
                  {t.deleteAccountConfirmCta}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy / Terms (spec §10.5). Closing the sheet first so the
            modal doesn't trap navigation. */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 14,
            marginTop: 18,
          }}
        >
          <Link href="/privacy" onClick={onClose} style={legalLinkStyle}>
            {t.privacyLink}
          </Link>
          <span aria-hidden style={{ color: "var(--c-soft)" }}>
            ·
          </span>
          <Link href="/terms" onClick={onClose} style={legalLinkStyle}>
            {t.termsLink}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 0",
        borderTop: "1px solid var(--c-line)",
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--c-text)",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function Toggle({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="group"
      style={{
        display: "inline-flex",
        background: "var(--c-card-soft)",
        borderRadius: 999,
        padding: 3,
      }}
    >
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            disabled={disabled}
            aria-pressed={sel}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "none",
              background: sel ? "#fff" : "transparent",
              color: sel ? "var(--c-text)" : "var(--c-muted)",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12,
              cursor: disabled ? "wait" : "pointer",
              boxShadow: sel ? "var(--shadow-xs)" : "none",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 44,
        height: 26,
        borderRadius: 999,
        background: checked ? "var(--c-emerald-500)" : "var(--c-line)",
        border: "none",
        position: "relative",
        cursor: disabled ? "wait" : "pointer",
        transition: "background .2s",
        padding: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left .18s",
        }}
      />
    </button>
  );
}

const primaryActionStyle: React.CSSProperties = {
  background: "var(--c-card-soft)",
  color: "var(--c-text)",
  border: "none",
  borderRadius: "var(--r-full)",
  padding: "12px 18px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const secondaryActionStyle: React.CSSProperties = {
  background: "#fff",
  color: "var(--c-text)",
  border: "none",
  borderRadius: "var(--r-full)",
  padding: "12px 14px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "var(--shadow-xs)",
};

const legalLinkStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--c-muted)",
  textDecoration: "underline",
  fontWeight: 600,
};

const destructiveActionStyle: React.CSSProperties = {
  background: "transparent",
  color: "#B91C1C",
  border: "1px solid #FCA5A5",
  borderRadius: "var(--r-full)",
  padding: "11px 18px",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
