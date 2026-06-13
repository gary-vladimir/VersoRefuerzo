// /api/collections/[id]/restore  — undo a collection soft-delete inside the
// 5-second window (specs.md §17.5). Mirrors the verse restore endpoint.
//
// We only restore if `deletedAt` is non-null AND younger than UNDO_WINDOW_MS.
// Past the window the housekeeping sweep at GET /api/collections hard-deletes
// the row, so a stale undo returns 404. Memberships were never removed during
// the window, so a restored collection keeps all its verse links.

import { NextResponse, type NextRequest } from "next/server";
import { and, eq, isNotNull, gt } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { collections } from "@/db/schema";
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
    .update(collections)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(collections.id, id),
        eq(collections.userId, user.id),
        isNotNull(collections.deletedAt),
        gt(collections.deletedAt, cutoff),
      ),
    )
    .returning();
  if (!restored[0]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ collection: restored[0] });
}
