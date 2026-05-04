// /api/verses/[id]/restore  — undo a soft-delete inside the 5-second window
// (specs.md §17.5, AC-20).
//
// We only restore if `deletedAt` is non-null AND younger than UNDO_WINDOW_MS.
// Past the window the housekeeping sweep at GET /api/verses will hard-delete
// the row, so any stale undo from a slow client returns 404.

import { NextResponse, type NextRequest } from "next/server";
import { and, eq, isNotNull, gt } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { verses } from "@/db/schema";
import { UNDO_WINDOW_MS } from "@/lib/constants";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const db = getDb();
  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);

  const restored = await db
    .update(verses)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(verses.id, id),
        eq(verses.userId, user.id),
        isNotNull(verses.deletedAt),
        gt(verses.deletedAt, cutoff),
      ),
    )
    .returning();
  if (!restored[0]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ verse: restored[0] });
}
