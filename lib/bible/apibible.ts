// API.Bible integration. Server-only — never exposes the API key to clients.
//
// Two responsibilities:
//   1. enumerate the runtime-available versions: intersection of the spec
//      allowlist {NBLA, NVI, RVR1960} and what the deployed key actually
//      licenses (specs.md §9.2). Configured via env: APIBIBLE_ID_<VERSION>.
//   2. fetch verse text for a given (canonicalRef, version) pair, going through
//      bibleTextCache so the same passage is fetched **at most once** across
//      the entire system (specs.md §9.3 and AC-8).
//
// We never invalidate the cache — Bible texts in a fixed translation don't
// change. If a translation is retroactively corrected, an operator can purge
// rows manually.

import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { bibleTextCache } from "@/db/schema";
import { isValidUsfmRef } from "./reference";

export type VersionKey = "NBLA" | "NVI" | "RVR1960";
export const VERSION_KEYS: VersionKey[] = ["NBLA", "NVI", "RVR1960"];

const ENV_VAR: Record<VersionKey, string> = {
  NBLA: "APIBIBLE_ID_NBLA",
  NVI: "APIBIBLE_ID_NVI",
  RVR1960: "APIBIBLE_ID_RVR1960",
};

export type AvailableVersion = { key: VersionKey; bibleId: string };

// Versions for which the deployed key has a configured Bible ID. The UI
// reads this dynamically so adding RVR1960 later is config-only (specs §9.2).
export function availableVersions(): AvailableVersion[] {
  const out: AvailableVersion[] = [];
  for (const key of VERSION_KEYS) {
    const id = process.env[ENV_VAR[key]];
    if (id && id.trim()) out.push({ key, bibleId: id.trim() });
  }
  return out;
}

export function bibleIdFor(key: string): string | null {
  if (!(VERSION_KEYS as readonly string[]).includes(key)) return null;
  const id = process.env[ENV_VAR[key as VersionKey]];
  return id?.trim() || null;
}

export type FetchResult = {
  canonicalRef: string;
  version: VersionKey;
  text: string;
  copyrightAttribution: string | null;
  source: "cache" | "api";
};

// Get the verse text. Returns from cache if present; otherwise calls API.Bible
// once, persists the row, and returns. Concurrent first-fetches for the same
// (ref, version) may double-call API.Bible — the second insert hits the PK
// and we treat that as benign; the cache still ends up populated. A SELECT
// on conflict avoids returning a duplicate-key error to the caller.
export async function getVerseText(
  canonicalRef: string,
  version: VersionKey,
): Promise<FetchResult> {
  if (!isValidUsfmRef(canonicalRef)) {
    throw new Error(`invalid canonical ref: ${canonicalRef}`);
  }
  const db = getDb();

  const cached = await db
    .select()
    .from(bibleTextCache)
    .where(and(eq(bibleTextCache.canonicalRef, canonicalRef), eq(bibleTextCache.version, version)))
    .limit(1);
  if (cached[0]) {
    return {
      canonicalRef,
      version,
      text: cached[0].text,
      copyrightAttribution: cached[0].copyrightAttribution,
      source: "cache",
    };
  }

  const bibleId = bibleIdFor(version);
  const apiKey = process.env.APIBIBLE_KEY;
  if (!bibleId || !apiKey) {
    throw new Error(`API.Bible not configured for version ${version}`);
  }

  const url = `https://api.scripture.api.bible/v1/bibles/${encodeURIComponent(
    bibleId,
  )}/passages/${encodeURIComponent(canonicalRef)}` +
    "?content-type=text" +
    "&include-notes=false" +
    "&include-titles=false" +
    "&include-chapter-numbers=false" +
    "&include-verse-numbers=false" +
    "&include-verse-spans=false";

  console.info(`[apibible] fetching ${canonicalRef} ${version} (uncached)`);
  const res = await fetch(url, { headers: { "api-key": apiKey } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API.Bible ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    data?: { content?: string; copyright?: string };
  };
  const text = (json.data?.content ?? "").replace(/\s+/g, " ").trim();
  if (!text) {
    throw new Error(`API.Bible returned empty content for ${canonicalRef} ${version}`);
  }
  const copyright = json.data?.copyright?.trim() || null;

  // ON CONFLICT DO NOTHING — concurrent inserts are fine; first writer wins.
  await db
    .insert(bibleTextCache)
    .values({ canonicalRef, version, text, copyrightAttribution: copyright })
    .onConflictDoNothing();

  return { canonicalRef, version, text, copyrightAttribution: copyright, source: "api" };
}
