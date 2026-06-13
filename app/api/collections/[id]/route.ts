// /api/collections/[id]  — PATCH and DELETE.
//
// PATCH supports rename, recolor, and description edits. The case-insensitive
// uniqueness rule from POST applies to renames too.
//
// DELETE is a SOFT delete (specs.md §17.5): it stamps `deletedAt` so the
// action is undoable for 5 seconds via /restore. Verse memberships are left
// intact during the window; the housekeeping sweep at collection-list reads
// commits the hard-delete past the window and the verseCollections FK cascade
// then drops the membership rows (so a hard-deleted collection un-links its
// verses without deleting them, per §4.2).

import { NextResponse, type NextRequest } from "next/server";
import { and, eq, ne, sql, isNull } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { collections } from "@/db/schema";
import { PatchCollectionInput } from "@/lib/validation/schemas";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PatchCollectionInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.id, id),
        eq(collections.userId, user.id),
        isNull(collections.deletedAt),
      ),
    )
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) {
    const trimmed = parsed.data.name.trim();
    const dupe = await db
      .select({ id: collections.id })
      .from(collections)
      .where(
        and(
          eq(collections.userId, user.id),
          ne(collections.id, id),
          sql`lower(${collections.name}) = lower(${trimmed})`,
        ),
      )
      .limit(1);
    if (dupe[0]) {
      return NextResponse.json({ error: "duplicate_name" }, { status: 409 });
    }
    updateValues.name = trimmed;
  }
  if (parsed.data.description !== undefined) {
    updateValues.description =
      typeof parsed.data.description === "string"
        ? parsed.data.description.trim() || null
        : null;
  }
  if (parsed.data.colorKey !== undefined) updateValues.colorKey = parsed.data.colorKey;

  const updated = await db
    .update(collections)
    .set(updateValues)
    .where(eq(collections.id, id))
    .returning();
  return NextResponse.json({ collection: updated[0] });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const db = getDb();
  // Soft-delete — stamp deletedAt. /restore can undo within the window.
  const deleted = await db
    .update(collections)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(collections.id, id),
        eq(collections.userId, user.id),
        isNull(collections.deletedAt),
      ),
    )
    .returning({ id: collections.id });
  if (!deleted[0]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

