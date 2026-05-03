// Zod schemas for API boundaries (specs.md §6.1, §17.5).
//
// One source of truth for request validation across /api routes; importing
// the inferred types in route handlers keeps the body shape and TypeScript
// in lockstep without hand-rolled "Body" interfaces.

import { z } from "zod";
import { CARD_COLOR_IDS, VERSE_ICON_IDS, COLLECTION_COLOR_IDS } from "@/lib/catalog";
import { isValidUsfmRef } from "@/lib/bible/reference";

const VersionEnum = z.enum(["NBLA", "NVI", "RVR1960"]);
export type Version = z.infer<typeof VersionEnum>;

export const NewCollectionInput = z.object({
  name: z.string().trim().min(1).max(40),
  description: z.string().trim().max(120).optional().nullable(),
  colorKey: z.enum(COLLECTION_COLOR_IDS),
});
export type NewCollectionInput = z.infer<typeof NewCollectionInput>;

export const PatchCollectionInput = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  description: z.string().trim().max(120).optional().nullable(),
  colorKey: z.enum(COLLECTION_COLOR_IDS).optional(),
});
export type PatchCollectionInput = z.infer<typeof PatchCollectionInput>;

const CanonicalRef = z.string().refine(isValidUsfmRef, {
  message: "canonicalRef must be a USFM-dotted reference like JHN.14.6",
});

export const NewVerseInput = z.object({
  canonicalRef: CanonicalRef,
  version: VersionEnum,
  icon: z.enum(VERSE_ICON_IDS),
  color: z.enum(CARD_COLOR_IDS),
  hint: z.string().trim().max(120).optional().nullable(),
  collectionIds: z.array(z.string().uuid()).max(20).optional().default([]),
});
export type NewVerseInput = z.infer<typeof NewVerseInput>;

export const PatchVerseInput = z.object({
  icon: z.enum(VERSE_ICON_IDS).optional(),
  color: z.enum(CARD_COLOR_IDS).optional(),
  hint: z.string().trim().max(120).nullable().optional(),
  // Editing reference/version replaces text — engineering may choose to disallow
  // in M3; left optional so M3 can decide without a schema rev.
  canonicalRef: CanonicalRef.optional(),
  version: VersionEnum.optional(),
  collectionIds: z.array(z.string().uuid()).max(20).optional(),
});
export type PatchVerseInput = z.infer<typeof PatchVerseInput>;
