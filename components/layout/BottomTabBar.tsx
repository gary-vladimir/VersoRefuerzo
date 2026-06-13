"use client";

// Mobile bottom tab bar (specs.md §16.3 — three tabs after the §16.3
// reduction). Visible at < 1024px via the responsive `vr-mobile-only`
// helper; the DesktopSidebar takes over above that.
//
// Active tab is decided from the current pathname so deep links into
// /library/collections/[id] still highlight Biblioteca.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavName } from "./NavIcons";

type Strings = { home: string; practice: string; library: string };

type Tab = {
  href: "/" | "/practice" | "/library";
  label: string;
  icon: NavName;
  match: (p: string) => boolean;
};

export function BottomTabBar({ strings: t }: { strings: Strings }) {
  const pathname = usePathname() ?? "/";
  const tabs: Tab[] = [
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
    <nav
      aria-label="primary"
      className="vr-mobile-only"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: "var(--z-tabbar)",
        background: "var(--glass-bg-strong)",
        borderTop: "1px solid var(--c-line)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        padding: "8px 12px calc(8px + env(safe-area-inset-bottom))",
        // display:flex is owned by .vr-mobile-only so the desktop media
        // query can hide this element — inline styles would beat it.
        justifyContent: "space-around",
      }}
    >
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className="vr-nav-link vr-press"
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "8px 18px",
              minHeight: 48,
              borderRadius: 14,
              textDecoration: "none",
              color: active ? "var(--c-indigo-700)" : "var(--c-soft)",
              background: active ? "var(--c-indigo-50)" : "transparent",
              minWidth: 64,
              transition: "color var(--dur-2) ease, background var(--dur-2) ease",
            }}
          >
            {active && (
              <span
                aria-hidden
                className="vr-fade-in"
                style={{
                  position: "absolute",
                  top: 4,
                  width: 18,
                  height: 3,
                  borderRadius: 3,
                  background: "var(--brand-primary)",
                }}
              />
            )}
            <NavIcon name={tab.icon} size={22} strokeWidth={active ? 2.4 : 2} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.3,
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
