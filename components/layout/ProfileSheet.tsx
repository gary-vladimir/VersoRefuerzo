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

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getClientAuth } from "@/lib/auth/firebase-client";
import { setSoundEnabled, play } from "@/lib/sounds/player";
import { T, type Locale } from "@/lib/i18n/strings";
import type { User } from "@/db/schema";

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

  useEffect(() => {
    setLocaleDraft(locale);
    setSoundDraft(user.soundEnabled);
  }, [locale, user.soundEnabled]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
    if (next === localeDraft) return;
    setLocaleDraft(next);
    const ok = await patchMe({ locale: next });
    if (!ok) setLocaleDraft(locale);
  }

  async function toggleSound() {
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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,14,26,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      className="vr-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="vr-card-rise"
        style={{
          background: "#fff",
          width: "100%",
          maxWidth: 480,
          borderRadius: "var(--r-3xl) var(--r-3xl) 0 0",
          padding: "20px 20px 28px",
          boxShadow: "var(--shadow-xl)",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <span
          aria-hidden
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
          <Avatar user={user} />
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

        {/* Language */}
        <Row label={t.language}>
          <Toggle
            options={[
              { value: "es", label: "ES" },
              { value: "en", label: "EN" },
            ]}
            value={localeDraft}
            onChange={(v) => toggleLocale(v as Locale)}
            disabled={busy}
          />
        </Row>

        {/* Sound */}
        <Row label={t.soundEffects}>
          <Switch checked={soundDraft} onChange={toggleSound} disabled={busy} />
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
            style={primaryActionStyle}
          >
            {t.signOut}
          </button>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
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
                  style={{ ...secondaryActionStyle, flex: 1 }}
                >
                  {t.deleteAccountCancel}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  style={{ ...destructiveActionStyle, flex: 1 }}
                >
                  {t.deleteAccountConfirmCta}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ user }: { user: User }) {
  if (user.photoUrl) {
    // Plain <img> — Next/Image needs domain config; not worth a remoteImage
    // setup for a 40-px avatar.
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={user.photoUrl}
        alt=""
        width={48}
        height={48}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "var(--brand-rose)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 18,
      }}
    >
      {initial}
    </span>
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
