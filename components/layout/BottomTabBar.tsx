"use client";

// Mobile bottom tab bar (specs.md §16.3 — three tabs after the §16.3
// reduction). Visible at < 1024px via the responsive `vr-mobile-only`
// helper; the DesktopSidebar takes over above that.
//
// Active tab is decided from the current pathname so deep links into
// /library/collections/[id] still highlight Biblioteca.

import Link from "next/link";
import { usePathname } from "next/navigation";

type Strings = { home: string; practice: string; library: string };

type Tab = { href: "/" | "/practice" | "/library"; label: string; glyph: string; match: (p: string) => boolean };

export function BottomTabBar({ strings: t }: { strings: Strings }) {
  const pathname = usePathname() ?? "/";
  const tabs: Tab[] = [
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
  return (
    <nav
      aria-label="primary"
      className="vr-mobile-only"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid var(--c-line)",
        backdropFilter: "blur(8px)",
        padding: "8px 12px calc(8px + env(safe-area-inset-bottom))",
        display: "flex",
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
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "6px 18px",
              borderRadius: 12,
              textDecoration: "none",
              color: active ? "var(--c-indigo-700)" : "var(--c-soft)",
              background: active ? "var(--c-indigo-50)" : "transparent",
              minWidth: 64,
            }}
          >
            <span style={{ fontSize: 18 }} aria-hidden>
              {tab.glyph}
            </span>
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
