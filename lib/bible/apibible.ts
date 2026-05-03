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
// once and persists. AC-8 ("exactly one API.Bible call") is enforced as a
// best effort because Neon's HTTP driver doesn't support interactive
// transactions (no advisory lock across queries). We use two layers of
// protection:
//
//   1. Process-local in-flight dedup: concurrent callers in the same Node
//      process for the same (ref, version) await one shared fetch promise.
//      This collapses every realistic burst on a single Cloud Run instance.
//
//   2. Cross-instance race: handled by ON CONFLICT DO NOTHING on insert.
//      Two instances racing the *same* miss may both call API.Bible once
//      each — rare in practice (instance fan-out for the same verse-version
//      pair within milliseconds). Cache still ends up populated correctly.
//
// Stronger cross-instance serialization (Postgres advisory lock or row-state
// machine) would require switching to the WebSocket-pool driver. Deferred
// until v2 if quota usage shows the cross-instance race actually matters.

const inFlight = new Map<string, Promise<FetchResult>>();

export async function getVerseText(
  canonicalRef: string,
  version: VersionKey,
): Promise<FetchResult> {
  if (!isValidUsfmRef(canonicalRef)) {
    throw new Error(`invalid canonical ref: ${canonicalRef}`);
  }
  const key = `${canonicalRef}|${version}`;
  const existing = inFlight.get(key);
  if (existing) return existing;
  const p = doGetVerseText(canonicalRef, version).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, p);
  return p;
}

async function doGetVerseText(
  canonicalRef: string,
  version: VersionKey,
): Promise<FetchResult> {
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

  await db
    .insert(bibleTextCache)
    .values({ canonicalRef, version, text, copyrightAttribution: copyright })
    .onConflictDoNothing();

  return { canonicalRef, version, text, copyrightAttribution: copyright, source: "api" };
}
