// Soft-delete housekeeping (specs.md §17.5).
//
// Deleting a verse or collection only stamps `deletedAt`, so the Undo toast
// can restore it. There are no background workers: every read path that
// lists a user's rows first sweeps the ones whose restore window has passed,
// committing the hard-delete. Keeping the sweep and the window here means
// the ten call sites cannot drift apart.

import "server-only";
import { and, eq, lt } from "drizzle-orm";
import type { getDb } from "@/db/client";
import { collections, verses } from "@/db/schema";
import { SOFT_DELETE_RETENTION_MS } from "@/lib/constants";

type Db = ReturnType<typeof getDb>;

// Rows deleted before this instant can no longer be restored.
export function restoreCutoff(now: number = Date.now()): Date {
  return new Date(now - SOFT_DELETE_RETENTION_MS);
}

export async function sweepDeletedVerses(db: Db, userId: string): Promise<void> {
  await db
    .delete(verses)
    .where(and(eq(verses.userId, userId), lt(verses.deletedAt, restoreCutoff())));
}

// The verse_collections FK cascade drops the memberships, which un-links
// the collection's verses without deleting them (§4.2).
export async function sweepDeletedCollections(db: Db, userId: string): Promise<void> {
  await db
    .delete(collections)
    .where(and(eq(collections.userId, userId), lt(collections.deletedAt, restoreCutoff())));
}
