// VersoRefuerzo — database schema (Drizzle, Postgres on Neon)
// See specs.md §4 and §9.4. Tables added incrementally per the milestones in PLAN.md.
// M0 ships only the `users` table; M2 adds verses, collections, verseCollections, bibleTextCache;
// M4 adds practiceSessions.

import { pgTable, uuid, text, boolean, integer, date, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
