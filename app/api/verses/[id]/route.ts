// /api/verses/[id]  — GET / PATCH / DELETE for a single verse.
//
// GET joins the cached verse text and the verse's collection memberships so
// the Card View and Edit View can render in one round trip.
//
// DELETE is a soft-delete: we stamp `deletedAt = now()`. The verse disappears
// from list views immediately. /restore clears the stamp inside the 5-second
// undo window (specs.md §17.5). After the window the row is hard-deleted by
// the housekeeping sweep on the next GET to /api/verses.
//
// PATCH supports the field set declared in PatchVerseInput. If `canonicalRef`
// or `version` change, we prime the new (ref, version) pair so the Card View
// has text immediately.

import { NextResponse, type NextRequest } from "next/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  verses,
  verseCollections,
  collections as collectionsTable,
  bibleTextCache,
  INITIAL_SRS_STATE,
} from "@/db/schema";
import { PatchVerseInput } from "@/lib/validation/schemas";
import { availableVersions, getVerseText } from "@/lib/bible/apibible";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const db = getDb();

  const rows = await db
    .select()
    .from(verses)
    .where(and(eq(verses.id, id), eq(verses.userId, user.id), isNull(verses.deletedAt)))
    .limit(1);
  const verse = rows[0];
  if (!verse) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [cached, links] = await Promise.all([
    db
      .select()
      .from(bibleTextCache)
      .where(
        and(
          eq(bibleTextCache.canonicalRef, verse.canonicalRef),
          eq(bibleTextCache.version, verse.version),
        ),
      )
      .limit(1),
    db
      .select({
        id: collectionsTable.id,
        name: collectionsTable.name,
        colorKey: collectionsTable.colorKey,
        description: collectionsTable.description,
      })
      .from(verseCollections)
      .innerJoin(collectionsTable, eq(verseCollections.collectionId, collectionsTable.id))
      .where(eq(verseCollections.verseId, verse.id)),
  ]);

  return NextResponse.json({
    verse,
    text: cached[0]?.text ?? null,
    copyrightAttribution: cached[0]?.copyrightAttribution ?? null,
    collections: links,
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = PatchVerseInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const db = getDb();
  const existing = await db
    .select()
    .from(verses)
    .where(and(eq(verses.id, id), eq(verses.userId, user.id), isNull(verses.deletedAt)))
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const verse = existing[0];

  // Reject unavailable versions on edit, same as on create.
  if (parsed.data.version) {
    const configured = availableVersions().map((v) => v.key);
    if (!configured.includes(parsed.data.version)) {
      return NextResponse.json(
        { error: "version_unavailable", available: configured },
        { status: 400 },
      );
    }
  }

  // If collectionIds is provided, validate ownership and replace the link set.
  const collectionIds = parsed.data.collectionIds;
  if (collectionIds && collectionIds.length > 0) {
    const owned = await db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(eq(collectionsTable.userId, user.id));
    const ownedSet = new Set(owned.map((o) => o.id));
    if (!collectionIds.every((cid) => ownedSet.has(cid))) {
      return NextResponse.json({ error: "invalid_collection" }, { status: 400 });
    }
  }

  // Did the user change the verse's identity (the underlying passage)? If so
  // we must NOT carry the existing SM-2 state forward — that would let an
  // unlearned passage inherit the old verse's mastery, ease, and due date,
  // corrupting the M4 queue (M3 review P1).
  const refChanged =
    parsed.data.canonicalRef !== undefined && parsed.data.canonicalRef !== verse.canonicalRef;
  const verChanged =
    parsed.data.version !== undefined && parsed.data.version !== verse.version;
  const identityChanged = refChanged || verChanged;

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.icon !== undefined) updateValues.icon = parsed.data.icon;
  if (parsed.data.color !== undefined) updateValues.color = parsed.data.color;
  if (parsed.data.hint !== undefined) {
    updateValues.hint =
      typeof parsed.data.hint === "string" ? parsed.data.hint.trim() || null : null;
  }
  if (parsed.data.canonicalRef !== undefined) updateValues.canonicalRef = parsed.data.canonicalRef;
  if (parsed.data.version !== undefined) updateValues.version = parsed.data.version;
  if (identityChanged) {
    updateValues.srsState = INITIAL_SRS_STATE;
    updateValues.mastery = 0;
    updateValues.status = "new";
  }

  const updated = await db
    .update(verses)
    .set(updateValues)
    .where(eq(verses.id, verse.id))
    .returning();

  if (collectionIds !== undefined) {
    // Diff-based replace so a partial failure can't wipe every link the
    // verse used to belong to (M3 review P2). We add what's new before
    // removing what's gone — worst case a transient is the user keeps both
    // sets, which is far cheaper to recover from than losing all memberships.
    const existingLinks = await db
      .select({ collectionId: verseCollections.collectionId })
      .from(verseCollections)
      .where(eq(verseCollections.verseId, verse.id));
    const have = new Set(existingLinks.map((l) => l.collectionId));
    const want = new Set(collectionIds);
    const toAdd = [...want].filter((id) => !have.has(id));
    const toRemove = [...have].filter((id) => !want.has(id));
    if (toAdd.length > 0) {
      await db
        .insert(verseCollections)
        .values(toAdd.map((cid) => ({ verseId: verse.id, collectionId: cid })));
    }
    if (toRemove.length > 0) {
      await db
        .delete(verseCollections)
        .where(
          and(
            eq(verseCollections.verseId, verse.id),
            inArray(verseCollections.collectionId, toRemove),
          ),
        );
    }
  }

  // Best-effort prime when the (ref, version) pair changed.
  if (identityChanged) {
    const ref = (parsed.data.canonicalRef ?? verse.canonicalRef) as string;
    const ver = (parsed.data.version ?? verse.version) as "NBLA" | "NVI" | "RVR1960";
    try {
      await getVerseText(ref, ver);
    } catch (err) {
      console.warn("verse text prime on edit failed (non-blocking)", err);
    }
  }

  return NextResponse.json({ verse: updated[0] });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const db = getDb();

  const existing = await db
    .select({ id: verses.id })
    .from(verses)
    .where(and(eq(verses.id, id), eq(verses.userId, user.id), isNull(verses.deletedAt)))
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await db
    .update(verses)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(verses.id, id));

  return NextResponse.json({ ok: true });
}
