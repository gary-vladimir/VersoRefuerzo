// VersoRefuerzo — database schema (Drizzle, Postgres on Neon)
// See specs.md §4 and §9.4. Tables added incrementally per the milestones in PLAN.md.
// M0: users.  M2: verses, collections, verseCollections, bibleTextCache.
// M4: practiceSessions.

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  real,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    googleSub: text("google_sub").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    photoUrl: text("photo_url"),
    locale: text("locale").notNull().default("es"),
    soundEnabled: boolean("sound_enabled").notNull().default(true),
    lastVersion: text("last_version"),
    hasCompletedOnboarding: boolean("has_completed_onboarding").notNull().default(false),
    hasSeenAloudTip: boolean("has_seen_aloud_tip").notNull().default(false),
    currentStreak: integer("current_streak").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    lastStreakAt: date("last_streak_at"),
    timezone: text("timezone"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    googleSubIdx: uniqueIndex("users_google_sub_idx").on(t.googleSub),
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

// Per-user named bucket of verses. Many-to-many with verses via verseCollections.
// Deleting a collection un-links its verses but does NOT delete them (specs.md §4.2).
export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    colorKey: text("color_key").notNull(), // one of 8 collection-tag color keys (specs §7.5 / §17.6)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("collections_user_idx").on(t.userId),
    // Case-insensitive uniqueness per user — see specs.md §4.2.
    userNameUniq: uniqueIndex("collections_user_name_uniq").on(
      t.userId,
      sql`lower(${t.name})`,
    ),
  }),
);

// SM-2 state lives on the verse row as a small jsonb blob. Engineering may tune
// constants without a schema migration. M2 inserts the initial-new state below;
// the SRS engine in M4 owns transitions (specs.md §6.4.1, §6.5).
export type SrsState = {
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueAt: string; // ISO timestamp
  chunkStage: number;
};

export const INITIAL_SRS_STATE: SrsState = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  dueAt: new Date(0).toISOString(),
  chunkStage: 0,
};

export const verses = pgTable(
  "verses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    canonicalRef: text("canonical_ref").notNull(), // USFM dotted form, e.g. "JHN.14.6"
    version: text("version").notNull(),            // e.g. "NBLA"
    icon: text("icon").notNull(),                  // 1-of-18 catalog (specs §7.4)
    color: text("color").notNull(),                // 1-of-8  catalog (specs §7.3)
    hint: text("hint"),
    srsState: jsonb("srs_state").$type<SrsState>().notNull().default(INITIAL_SRS_STATE),
    mastery: real("mastery").notNull().default(0),
    status: text("status").$type<"new" | "learning" | "mastered">().notNull().default("new"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft-delete (§17.5)
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userDeletedIdx: index("verses_user_deleted_idx").on(t.userId, t.deletedAt),
    refVerIdx: index("verses_ref_ver_idx").on(t.canonicalRef, t.version),
  }),
);

export const verseCollections = pgTable(
  "verse_collections",
  {
    verseId: uuid("verse_id")
      .notNull()
      .references(() => verses.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.verseId, t.collectionId] }),
    collectionIdx: index("verse_collections_collection_idx").on(t.collectionId),
  }),
);

// Globally shared verse-text cache. Never invalidated, never user-scoped, retained
// on account delete (specs.md §9.3). One API.Bible call per (ref, version) for the
// entire system — core to the AC-8 invariant.
export const bibleTextCache = pgTable(
  "bible_text_cache",
  {
    canonicalRef: text("canonical_ref").notNull(),
    version: text("version").notNull(),
    text: text("text").notNull(),
    copyrightAttribution: text("copyright_attribution"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.canonicalRef, t.version] }),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Verse = typeof verses.$inferSelect;
export type NewVerse = typeof verses.$inferInsert;
export type BibleTextCacheRow = typeof bibleTextCache.$inferSelect;
