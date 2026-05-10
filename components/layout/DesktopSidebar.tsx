"use client";

// Desktop sidebar (specs.md §10.3 + §16.3 desktop equivalent).
// 240-px persistent left rail, visible at >= 1024px (`vr-desktop-only`
// helper). Mirrors the mobile tab bar's three destinations and adds
// an `Agregar verso` button + a user card at the bottom that opens the
// same ProfileSheet the mobile avatar tap opens.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/db/schema";

type Strings = {
  home: string;
  practice: string;
  library: string;
  addVerse: string;
  appName: string;
};

type NavItem = {
  href: "/" | "/practice" | "/library";
  label: string;
  glyph: string;
  match: (p: string) => boolean;
};

type Props = {
  user: User;
  onProfileClick: () => void;
  strings: Strings;
};

export function DesktopSidebar({ user, onProfileClick, strings: t }: Props) {
  const pathname = usePathname() ?? "/";
  const items: NavItem[] = [
    { href: "/", label: t.home, glyph: "🏠", match: (p) => p === "/" },
    {
      href: "/practice",
      label: t.practice,
      glyph: "✦",
      match: (p) => p.startsWith("/practice"),
    },
    {
      href: "/library",
      label: t.library,
      glyph: "📚",
      match: (p) => p.startsWith("/library"),
    },
  ];

  const initial = user.displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <aside
      aria-label="primary"
      className="vr-desktop-only"
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        width: 240,
        background: "#fff",
        borderRight: "1px solid var(--c-line)",
        padding: "24px 16px",
        // display:flex is owned by .vr-desktop-only so this element is
        // hidden on mobile; inline styles would override the media rule.
        flexDirection: "column",
        gap: 18,
        zIndex: 40,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: "-0.4px",
          color: "var(--c-text)",
          padding: "4px 8px",
        }}
      >
        {t.appName}
      </div>

      <Link
        href="/verses/new"
        style={{
          background: "var(--brand-primary)",
          color: "#fff",
          textDecoration: "none",
          padding: "10px 14px",
          borderRadius: "var(--r-full)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 13,
          textAlign: "center",
        }}
      >
        + {t.addVerse}
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: "var(--r-md)",
                textDecoration: "none",
                color: active ? "var(--c-indigo-700)" : "var(--c-text)",
                background: active ? "var(--c-indigo-50)" : "transparent",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <span aria-hidden style={{ fontSize: 16 }}>
                {item.glyph}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <button
        type="button"
        onClick={onProfileClick}
        aria-label={user.displayName}
        style={{
          background: "var(--c-card-soft)",
          border: "none",
          borderRadius: "var(--r-xl)",
          padding: 10,
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {user.photoUrl ? (
          // Plain <img> avoids next/image domain config for a 36-px avatar.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoUrl}
            alt=""
            width={36}
            height={36}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--brand-rose)",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {initial}
          </span>
        )}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 13,
              color: "var(--c-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.displayName}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 10,
              color: "var(--c-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </span>
        </span>
      </button>
    </aside>
  );
}
