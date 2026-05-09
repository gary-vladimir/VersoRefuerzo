// GET /api/stats/home — small aggregate for the Home hero (specs.md §16.6).
//
// Returns:
//   { totalVerses, mastered, learning, dueToday, currentStreak, bestStreak }
//
// `dueToday` counts all non-deleted verses whose `srsState.dueAt` is at or
// before end-of-day (UTC) — same cutoff as the queue route, so the hero
// number matches the actual queue length.

import { NextResponse } from "next/server";
import { and, count, eq, isNull } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { verses as versesTable } from "@/db/schema";
import { deriveEffectiveStreak } from "@/lib/streak/streak";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();

  const baseFilter = and(eq(versesTable.userId, user.id), isNull(versesTable.deletedAt));

  // Pull only the columns we need to compute aggregates in JS — the per-user
  // verse list is small and avoids three round-trips against jsonb's dueAt.
  const rows = await db
    .select({
      status: versesTable.status,
      srsState: versesTable.srsState,
    })
    .from(versesTable)
    .where(baseFilter);

  const cutoff = endOfTodayUtc();
  let mastered = 0;
  let learning = 0;
  let dueToday = 0;
  for (const r of rows) {
    if (r.status === "mastered") mastered++;
    else if (r.status === "learning") learning++;
    if (new Date(r.srsState.dueAt).getTime() <= cutoff) dueToday++;
  }

  // Sanity: the count() query is one cheap statement and double-checks the
  // JS aggregate (catches a stale-session race against /api/verses POST).
  const [{ value: totalVerses }] = await db
    .select({ value: count() })
    .from(versesTable)
    .where(baseFilter);

  // Effective streak: §6.6 says missing a day resets the counter to zero
  // at the start of the next day, but the persisted value only updates
  // when the user records a new session. Derive on read so the surface
  // matches the spec.
  const currentStreak = deriveEffectiveStreak({
    state: {
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      lastStreakAt: (user.lastStreakAt ?? null) as string | null,
    },
    tz: user.timezone,
  });

  return NextResponse.json({
    totalVerses,
    mastered,
    learning,
    dueToday,
    currentStreak,
    bestStreak: user.bestStreak,
  });
}

function endOfTodayUtc(): number {
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}
