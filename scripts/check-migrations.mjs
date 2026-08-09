// Guards the drizzle migration folder against the failure mode that let
// snapshots 0001..0004 go missing: `drizzle-kit generate` writes both a .sql
// and a _snapshot.json, and committing only the .sql leaves the next
// generate diffing against a stale baseline. It then re-emits migrations
// that are already applied.
//
// Checks, in order:
//   1. every journal entry has a matching .sql file
//   2. every journal entry has a matching _snapshot.json
//   3. the snapshots form an unbroken prevId chain in journal order
//
// Run with: node scripts/check-migrations.mjs

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "db", "migrations");
const meta = join(dir, "meta");

const errors = [];

const journal = JSON.parse(readFileSync(join(meta, "_journal.json"), "utf8"));
const entries = [...journal.entries].sort((a, b) => a.idx - b.idx);

if (entries.length === 0) {
  console.error("migration journal is empty");
  process.exit(1);
}

const ROOT_ID = "00000000-0000-0000-0000-000000000000";
let expectedPrev = ROOT_ID;

for (const entry of entries) {
  const sql = join(dir, `${entry.tag}.sql`);
  if (!existsSync(sql)) {
    errors.push(`journal entry ${entry.idx} (${entry.tag}) has no ${entry.tag}.sql`);
  }

  const idx = String(entry.idx).padStart(4, "0");
  const snapshotPath = join(meta, `${idx}_snapshot.json`);
  if (!existsSync(snapshotPath)) {
    errors.push(
      `journal entry ${entry.idx} (${entry.tag}) has no meta/${idx}_snapshot.json — ` +
        `commit the snapshot drizzle-kit generate wrote alongside the .sql`,
    );
    // Chain is unverifiable past a hole.
    expectedPrev = null;
    continue;
  }

  const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
  if (expectedPrev !== null && snapshot.prevId !== expectedPrev) {
    errors.push(
      `meta/${idx}_snapshot.json has prevId ${snapshot.prevId}, expected ${expectedPrev}`,
    );
  }
  expectedPrev = snapshot.id;
}

// A snapshot with no journal entry means a generate was partly reverted.
const known = new Set(entries.map((e) => `${String(e.idx).padStart(4, "0")}_snapshot.json`));
for (const file of readdirSync(meta)) {
  if (file.startsWith("_") || !file.endsWith("_snapshot.json")) continue;
  if (!known.has(file)) errors.push(`meta/${file} has no matching journal entry`);
}

if (errors.length > 0) {
  console.error("Migration metadata is inconsistent:\n");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`Migration metadata OK (${entries.length} migrations, chain intact).`);
