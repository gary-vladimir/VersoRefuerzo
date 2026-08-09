// Turns a PracticeSource into a Drizzle where-clause fragment.
//
// Split out from lib/practice/source.ts so that module stays importable from
// client components (the hub picker needs the types and the serialiser, and
// must not pull Drizzle into the browser bundle).
//
// Returns `undefined` for the default pool, which `and(...)` drops, so every
// call site can spread it in unconditionally.

import "server-only";
import { eq, inArray, type SQL } from "drizzle-orm";
import { getDb } from "@/db/client";
import { verses as versesTable, verseCollections as vcTable } from "@/db/schema";
import type { PracticeSource } from "./source";

type Db = ReturnType<typeof getDb>;

export function sourceFilter(db: Db, source: PracticeSource): SQL | undefined {
  switch (source.kind) {
    case "collection":
      // A subquery rather than a join so this composes into any existing
      // where clause. Ownership needs no extra check: the surrounding
      // clause already pins verses.userId, and a verse can only be linked
      // to a collection its own owner created.
      return inArray(
        versesTable.id,
        db
          .select({ id: vcTable.verseId })
          .from(vcTable)
          .where(eq(vcTable.collectionId, source.collectionId)),
      );
    case "custom":
      return inArray(versesTable.id, source.verseIds);
    default:
      return undefined;
  }
}
