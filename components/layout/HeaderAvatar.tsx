"use client";

// Tiny client trigger for the ProfileSheet. Rendered in the Home header
// (and anywhere else a server-rendered surface needs the avatar tap to
// open the sheet — the desktop sidebar has its own analog button).

import { useState } from "react";
import { useProfileSheet } from "./AppShell";
import type { User } from "@/db/schema";

export function HeaderAvatar({ user }: { user: User }) {
  const { open } = useProfileSheet();
  const [imgError, setImgError] = useState(false);
  const initial = user.displayName.trim().charAt(0).toUpperCase() || "?";
  const showImg = Boolean(user.photoUrl) && !imgError;
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
        background: showImg ? "transparent" : "var(--brand-rose)",
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: 15,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.photoUrl as string}
          alt=""
          width={40}
          height={40}
          onError={() => setImgError(true)}
          style={{ width: 40, height: 40, objectFit: "cover" }}
        />
      ) : (
        initial
      )}
    </button>
  );
}
