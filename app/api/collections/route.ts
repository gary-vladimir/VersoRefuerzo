// /api/collections  — list and create the current user's collections.
//
// Names are case-insensitive unique per user; we surface a 409 on conflict
// so the UI can tell the user without losing their input.

import { NextResponse, type NextRequest } from "next/server";
import { and, eq, sql, asc } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { collections } from "@/db/schema";
import { NewCollectionInput } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, user.id))
    .orderBy(asc(collections.name));
  return NextResponse.json({ collections: rows });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = NewCollectionInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const db = getDb();
  const trimmedName = parsed.data.name.trim();

  const dupe = await db
    .select({ id: collections.id })
    .from(collections)
    .where(
      and(
        eq(collections.userId, user.id),
        sql`lower(${collections.name}) = lower(${trimmedName})`,
      ),
    )
    .limit(1);
  if (dupe[0]) {
    return NextResponse.json({ error: "duplicate_name" }, { status: 409 });
  }

  const inserted = await db
    .insert(collections)
    .values({
      userId: user.id,
      name: trimmedName,
      description: parsed.data.description?.trim() || null,
      colorKey: parsed.data.colorKey,
    })
    .returning();
  return NextResponse.json({ collection: inserted[0] }, { status: 201 });
}
