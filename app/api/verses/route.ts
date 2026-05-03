// /api/verses  — list and create. M3 will add filter params (collectionId, q,
// status); for now GET simply returns all of the user's non-deleted verses.
//
// On POST we kick off the API.Bible fetch in the same request, but a fetch
// failure does NOT block the verse from being created — the row exists, the
// text just isn't cached yet. The Card View / practice modes that need the
// text will retry through /api/bible/text when the user opens them. This
// matches specs.md §6.1 step 4 ("the user is not blocked on this fetch on
// save"), preserving AC-2.

import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq, isNull, inArray } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { verses, verseCollections, collections } from "@/db/schema";
import { NewVerseInput } from "@/lib/validation/schemas";
import { getVerseText } from "@/lib/bible/apibible";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(verses)
    .where(and(eq(verses.userId, user.id), isNull(verses.deletedAt)))
    .orderBy(asc(verses.createdAt));
  return NextResponse.json({ verses: rows });
}

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = NewVerseInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const db = getDb();
  const collectionIds = parsed.data.collectionIds ?? [];

  // Ownership check for any provided collections — protects the §3.2 privacy
  // invariant so a malicious client can't link a verse into a collection it
  // doesn't own.
  if (collectionIds.length > 0) {
    const owned = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.userId, user.id), inArray(collections.id, collectionIds)));
    if (owned.length !== collectionIds.length) {
      return NextResponse.json({ error: "invalid_collection" }, { status: 400 });
    }
  }

  const inserted = await db
    .insert(verses)
    .values({
      userId: user.id,
      canonicalRef: parsed.data.canonicalRef,
      version: parsed.data.version,
      icon: parsed.data.icon,
      color: parsed.data.color,
      hint: parsed.data.hint?.trim() || null,
    })
    .returning();
  const verse = inserted[0]!;

  if (collectionIds.length > 0) {
    await db
      .insert(verseCollections)
      .values(collectionIds.map((cid) => ({ verseId: verse.id, collectionId: cid })));
  }

  // Best-effort cache prime; do not block on failure.
  let textPrimed = false;
  try {
    await getVerseText(parsed.data.canonicalRef, parsed.data.version);
    textPrimed = true;
  } catch (err) {
    console.warn("verse text prime failed (non-blocking)", err);
  }

  return NextResponse.json(
    { verse, collectionIds, textPrimed },
    { status: 201 },
  );
}
