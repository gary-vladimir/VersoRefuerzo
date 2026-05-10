"use client";

// Tiny client trigger for the ProfileSheet. Rendered in the Home header
// (and anywhere else a server-rendered surface needs the avatar tap to
// open the sheet — the desktop sidebar has its own analog button).

import { useProfileSheet } from "./AppShell";
import type { User } from "@/db/schema";

export function HeaderAvatar({ user }: { user: User }) {
  const { open } = useProfileSheet();
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <button
      type="button"
      onClick={open}
      aria-label={user.displayName}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: user.photoUrl ? "transparent" : "var(--brand-rose)",
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 14,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {user.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.photoUrl}
          alt=""
          width={36}
          height={36}
          style={{ width: 36, height: 36, objectFit: "cover" }}
        />
      ) : (
        initial
      )}
    </button>
  );
}
