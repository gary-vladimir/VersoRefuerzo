"use client";

// Desktop sidebar (specs.md §10.3 + §16.3 desktop equivalent).
// 240-px persistent left rail, visible at >= 1024px (`vr-desktop-only`
// helper). Mirrors the mobile tab bar's three destinations and adds
// an `Agregar verso` button + a user card at the bottom that opens the
// same ProfileSheet the mobile avatar tap opens.

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@/db/schema";
import { NavIcon, type NavName } from "./NavIcons";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { BrandLogo } from "@/components/ui/BrandLogo";

type Strings = {
  home: string;
  practice: string;
  library: string;
  addVerse: string;
  appName: string;
  language: string;
};

type NavItem = {
  href: "/" | "/practice" | "/library";
  label: string;
  icon: NavName;
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
    { href: "/", label: t.home, icon: "home", match: (p) => p === "/" },
    {
      href: "/practice",
      label: t.practice,
      icon: "practice",
      match: (p) => p.startsWith("/practice"),
    },
    {
      href: "/library",
      label: t.library,
      icon: "library",
      match: (p) => p.startsWith("/library"),
    },
  ];

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
        zIndex: "var(--z-sidebar)",
      }}
    >
      <Link
        href="/"
        aria-label={t.appName}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: "-0.4px",
          color: "var(--c-text)",
          padding: "4px 8px",
          textDecoration: "none",
        }}
      >
        <BrandLogo size={34} priority />
        {t.appName}
      </Link>

      <Link
        href="/verses/new"
        className="vr-press vr-lift"
        style={{
          background: "var(--brand-primary)",
          color: "#fff",
          textDecoration: "none",
          padding: "11px 14px",
          borderRadius: "var(--r-full)",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 13,
          textAlign: "center",
          boxShadow: "0 8px 20px rgb(var(--card-indigo-rgb) / 0.35)",
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
              className="vr-nav-link"
              style={{
                position: "relative",
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
                transition: "background var(--dur-2) ease, color var(--dur-2) ease",
              }}
            >
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 3,
                    background: "var(--brand-primary)",
                  }}
                />
              )}
              <NavIcon
                name={item.icon}
                size={18}
                strokeWidth={active ? 2.4 : 2}
                color={active ? "var(--c-indigo-700)" : "var(--c-muted)"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 6px 12px 12px",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-muted)" }}>{t.language}</span>
        <LanguageToggle />
      </div>

      <button
        type="button"
        onClick={onProfileClick}
        aria-label={user.displayName}
        className="vr-press"
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
        <UserAvatar displayName={user.displayName} photoUrl={user.photoUrl} size={36} />
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
