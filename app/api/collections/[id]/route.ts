// /api/collections/[id]  — PATCH and DELETE.
//
// PATCH supports rename, recolor, and description edits. The case-insensitive
// uniqueness rule from POST applies to renames too.
//
// DELETE removes the collection and its verse-collection links (the FK is
// ON DELETE CASCADE) but leaves the verses themselves intact (specs.md §4.2).

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

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const db = getDb();

  const existing = await db
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.id, id), eq(collections.userId, user.id)))
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Membership rows go via the verse_collections FK ON DELETE CASCADE; the
  // verses themselves are untouched per specs.md §4.2.
  await db.delete(collections).where(eq(collections.id, id));
  return NextResponse.json({ ok: true });
}
