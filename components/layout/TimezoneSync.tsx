"use client";

// Keeps `users.timezone` matching the browser's actual zone.
//
// The zone is captured once at sign-in (lib/auth/session.ts). Sessions last
// five days and users travel, so without this a relocated user keeps being
// scheduled against their old midnight: the streak rolls over at the wrong
// hour and the due-today cutoff (lib/streak/streak.ts::endOfTzDay) is off by
// the offset difference.
//
// Renders nothing. Fires at most one PATCH per mount, and only when the two
// values actually differ, so the steady state costs nothing.

import { useEffect } from "react";

export function TimezoneSync({ current }: { current: string | null }) {
  useEffect(() => {
    let browserTz: string | undefined;
    try {
      browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }
    if (!browserTz || browserTz === current) return;

    // Fire-and-forget: a failure here is not worth interrupting the user
    // over, and the next mount will try again.
    void fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: browserTz }),
    }).catch(() => {});
  }, [current]);

  return null;
}
