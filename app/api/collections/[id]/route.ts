// /api/collections/[id]  — PATCH only.
//
// PATCH supports rename, recolor, and description edits. The case-insensitive
// uniqueness rule from POST applies to renames too.
//
// DELETE is intentionally NOT exposed in M3. Per specs.md §17.5 a collection
// delete must be undoable for 5 seconds and must restore every membership
// link on undo — that needs a soft-delete column on `collections` plus a
// /restore endpoint, which is a schema change that lands with the collection
// edit/delete UI in a later milestone. Hard-delete + FK cascade today would
// silently destroy the user's organization with no undo path. Better to not
// offer the API at all than to offer a destructive one.

import { NextResponse, type NextRequest } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
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
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
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

