"use client";

// Round user avatar: the Google profile photo, or the first initial on the
// rose gradient when there is no photo or it fails to load (Google photo
// URLs can expire). Used by the Home header, the desktop sidebar card, and
// the profile sheet so all three fall back the same way.

import { useState } from "react";

export function UserAvatar({
  displayName,
  photoUrl,
  size,
}: {
  displayName: string;
  photoUrl: string | null;
  size: number;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  if (photoUrl && !imgError) {
    return (
      // Plain <img>: next/image would need remote-domain config for a
      // tiny avatar that is already served resized by Google.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          display: "block",
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--brand-rose)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: Math.round(size * 0.38),
        flexShrink: 0,
      }}
    >
      {initial}
    </span>
  );
}
