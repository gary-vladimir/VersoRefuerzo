"use client";

// Tiny client trigger for the ProfileSheet. Rendered in the Home header
// (and anywhere else a server-rendered surface needs the avatar tap to
// open the sheet — the desktop sidebar has its own analog button).

import { useProfileSheet } from "./AppShell";
import { UserAvatar } from "@/components/ui/UserAvatar";
import type { User } from "@/db/schema";

export function HeaderAvatar({ user }: { user: User }) {
  const { open } = useProfileSheet();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={user.displayName}
      className="vr-press"
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <UserAvatar displayName={user.displayName} photoUrl={user.photoUrl} size={40} />
    </button>
  );
}
