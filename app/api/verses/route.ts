// /api/verses  — list and create.
//
// GET supports three filters (specs.md §6.3):
//   - collectionId: scope to a single user-owned collection
//   - q: fuzzy match against canonicalRef / display ref / cached text
//   - status: 'new' | 'learning' | 'mastered'
//
// GET also acts as the housekeeping sweep for soft-deleted rows (PLAN.md):
// any verse whose `deletedAt` is older than UNDO_WINDOW_MS is hard-deleted
// before the list is returned. No background workers, no in-memory timers —
// the next read commits the delete. Recently-deleted rows are kept on disk
// (just hidden) so /restore can resurrect them.
//
// POST creates a verse, awaits the API.Bible cache prime so the new verse
// has text immediately, and surfaces `textPrimed: false` if the prime fails.
// Versions outside availableVersions() are rejected (so a stale UI cannot
// create a verse whose text has no path to ever load).

import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq, isNull, inArray, lt } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  verses,
  verseCollections,
  collections,
  bibleTextCache,
} from "@/db/schema";
import { NewVerseInput } from "@/lib/validation/schemas";
import { getVerseText, availableVersions } from "@/lib/bible/apibible";
import { UNDO_WINDOW_MS } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const db = getDb();

  // Housekeeping sweep — commit soft-deletes whose undo window has elapsed.
  const cutoff = new Date(Date.now() - UNDO_WINDOW_MS);
  await db
    .delete(verses)
    .where(and(eq(verses.userId, user.id), lt(verses.deletedAt, cutoff)));

  const sp = req.nextUrl.searchParams;
  const collectionId = sp.get("collectionId");
  const q = sp.get("q")?.trim().toLowerCase() ?? "";
  const status = sp.get("status");

  const baseFilters = [eq(verses.userId, user.id), isNull(verses.deletedAt)];
  if (status === "new" || status === "learning" || status === "mastered") {
    baseFilters.push(eq(verses.status, status));
  }

  // Scope to a collection by joining verse_collections. Ownership of the
  // collection is enforced via the userId match on verses (the linkage row
  // can only point at a verse the user owns).
  let rows;
  if (collectionId) {
    rows = await db
      .select({ verse: verses })
      .from(verses)
      .innerJoin(verseCollections, eq(verseCollections.verseId, verses.id))
      .where(and(...baseFilters, eq(verseCollections.collectionId, collectionId)))
      .orderBy(asc(verses.createdAt));
    rows = rows.map((r) => r.verse);
  } else {
    rows = await db
      .select()
      .from(verses)
      .where(and(...baseFilters))
      .orderBy(asc(verses.createdAt));
  }

  // Free-text filter: applied in JS over the small per-user list. Matches
  // against canonicalRef and (where present) the cached text. Cheaper than
  // wiring up a join + lower() per row.
  if (q) {
    const cached = await db
      .select({ ref: bibleTextCache.canonicalRef, text: bibleTextCache.text })
      .from(bibleTextCache)
      .where(
        inArray(
          bibleTextCache.canonicalRef,
          rows.map((r) => r.canonicalRef),
        ),
      );
    const textByRef = new Map<string, string>();
    for (const c of cached) textByRef.set(c.ref, c.text.toLowerCase());
    rows = rows.filter((r) => {
      if (r.canonicalRef.toLowerCase().includes(q)) return true;
      const t = textByRef.get(r.canonicalRef);
      return t ? t.includes(q) : false;
    });
  }

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

  const configured = availableVersions().map((v) => v.key);
  if (!configured.includes(parsed.data.version)) {
    return NextResponse.json(
      { error: "version_unavailable", available: configured },
      { status: 400 },
    );
  }

  const db = getDb();
  const collectionIds = parsed.data.collectionIds ?? [];

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
