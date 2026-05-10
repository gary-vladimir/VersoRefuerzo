"use client";

// Client-side shell for the authed app (specs.md §10.3 + §16.3).
// One mount per session; owns:
//   - the ProfileSheet open/close state and exposes `useProfileSheet()`
//     so any descendant (Home avatar, sidebar user card) can open it
//   - the responsive layout: BottomTabBar at < 1024px, DesktopSidebar at
//     >= 1024px, both wrapping the route content
//   - the in-process sound-enabled flag, kept in sync with
//     `user.soundEnabled` so the player module honors the user's setting
//     across renders without prop drilling
//
// The (app) server layout is the auth + onboarding gate; this shell sits
// inside it.

import { createContext, useContext, useEffect, useState } from "react";
import { setSoundEnabled } from "@/lib/sounds/player";
import { T } from "@/lib/i18n/strings";
import type { User } from "@/db/schema";
import { ProfileSheet } from "./ProfileSheet";
import { BottomTabBar } from "./BottomTabBar";
import { DesktopSidebar } from "./DesktopSidebar";

type ProfileSheetApi = { open: () => void };
const ProfileSheetContext = createContext<ProfileSheetApi>({ open: () => {} });

export function useProfileSheet(): ProfileSheetApi {
  return useContext(ProfileSheetContext);
}

type Props = { user: User; children: React.ReactNode };

export function AppShell({ user, children }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const locale: "es" | "en" = user.locale === "en" ? "en" : "es";
  const t = T[locale];

  // Keep the player module's enabled flag in sync with user prefs.
  useEffect(() => {
    setSoundEnabled(user.soundEnabled);
  }, [user.soundEnabled]);

  return (
    <ProfileSheetContext.Provider value={{ open: () => setProfileOpen(true) }}>
      <DesktopSidebar
        user={user}
        onProfileClick={() => setProfileOpen(true)}
        strings={{
          home: t.home,
          practice: t.practice,
          library: t.library,
          addVerse: t.addVerse,
          appName: t.appName,
        }}
      />

      {/* min-height + the mobile tab-bar gutter + the desktop sidebar
          gutter all live in app/globals.css under .vr-app-main so the
          desktop media-query wins (M7 review #1). */}
      <div className="vr-app-main">{children}</div>

      <BottomTabBar
        strings={{ home: t.home, practice: t.practice, library: t.library }}
      />

      <ProfileSheet
        user={user}
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </ProfileSheetContext.Provider>
  );
}
