// /api/verses  — list and create. M3 will add filter params (collectionId, q,
// status); for now GET simply returns all of the user's non-deleted verses.
//
// On POST we await the API.Bible fetch so the verse text is cached by the
// time the response returns. Cache hit is ~10ms; a cache miss costs one
// API.Bible round-trip. If the fetch fails (network blip, 5xx) we leave the
// verse row in place and surface `textPrimed: false` — the Card View / practice
// modes will retry through /api/bible/text. We refuse versions that aren't
// configured at deploy time (so a stale UI can't create a verse whose text
// has no path to ever load).

import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq, isNull, inArray } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import { verses, verseCollections, collections } from "@/db/schema";
import { NewVerseInput } from "@/lib/validation/schemas";
import { getVerseText, availableVersions } from "@/lib/bible/apibible";

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

  // Reject versions that aren't configured at deploy time. The UI reads
  // /api/bible/versions and only offers what's available, so this only
  // triggers for stale clients or direct API callers — but it must, otherwise
  // we'd persist a verse whose text can never be fetched.
  const configured = availableVersions().map((v) => v.key);
  if (!configured.includes(parsed.data.version)) {
    return NextResponse.json(
      { error: "version_unavailable", available: configured },
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
