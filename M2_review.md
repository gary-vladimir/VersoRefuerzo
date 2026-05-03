# M2 Review - VersoRefuerzo

Date: 2026-05-03
Reviewer: Codex
Scope reviewed: `about.md`, `specs.md`, `PLAN.md`, full git history, M0/M1 review carry-over items, current M2 schema/API/domain/UI code, tests, build output, Docker build, and local unauthenticated route behavior.

## Executive Summary

M2 made substantial progress. The branch now has the core verse/collection/cache schema, a Bible reference parser wrapper, API.Bible fetch/cache helper, `/api/bible/*`, `/api/collections`, `/api/verses`, smart defaults, catalogs, icons, a live new-verse form, inline collection creation, and a Home placeholder that lists saved verses. The M1 stale-cookie redirect loop is fixed, the onboarding CTA now points to the new verse route with `Juan 14:6` prefill, and the Docker context issue is fixed.

I would not close M2 yet. The main issue is that the Bible-text cache invariant is not strong enough for the product goal and AC-8: the implementation explicitly allows concurrent first fetches to double-call API.Bible, and the verse creation route accepts unavailable versions and silently creates verses even when text caching fails. Also, the database schema still has no committed migrations, which is more serious now that M2 depends on five tables.

## Commits Reviewed

Current branch: `main`, tracking `origin/main`, currently **ahead by 13 commits**. Working tree was clean before this review file.

M2 commits reviewed:

- `c18e95d` Add verses, collections and bible-text-cache tables
- `11fcfad` Add bible reference parser wrapper
- `9e24778` Add API.Bible server fetcher with shared cache
- `1ce0473` Add color/icon catalogs and smart-default helpers
- `0b06448` Add zod schemas for verse and collection bodies
- `d5c1fd6` Add /api/bible/versions and /api/bible/text
- `aee96ce` Add /api/collections GET and POST
- `c7185a7` Add /api/verses GET and POST with text-cache prime
- `10d5ce2` Add verse and UI icon SVG components
- `c2fcc8d` Add VerseCard preview component
- `4936c4d` Add new verse form with color, icon and collection pickers
- `ec07962` Add new verse route, wire onboarding CTA and list verses on home
- `2fbedf8` Add tests for smart-default helpers

Positive: commit slicing remains clear and easy to audit.

## Verification Performed

- `git status --short --branch`: clean `main...origin/main [ahead 13]`
- `corepack pnpm test`: passed, 19 tests across 3 files
- `corepack pnpm lint`: exited 0, but with unused-import warnings in `components/verse/VerseForm.tsx`
- `corepack pnpm build`: passed, with same lint warnings
- `corepack pnpm typecheck`: failed before build due stale/missing `.next/types/cache-life.d.ts`; passed after `next build` regenerated `.next`
- `docker build .`: passed; build context is now ~90 KB
- `drizzle-kit generate` to `/private/tmp/versorefuerzo-m2-migrations`: passed and generated SQL for 5 tables
- Local dev smoke on `127.0.0.1:3001`:
  - `GET /api/health`: 200
  - `GET /api/bible/versions` without auth: 401 JSON
  - `GET /api/collections` without auth: 401 JSON
  - `HEAD /verses/new` without auth: 307 to `/login`
  - `HEAD /login` with bogus `__session`: 200, confirming the M1 redirect loop is fixed

Not verified end-to-end: real Google sign-in, real Neon writes, real API.Bible fetches, and AC-8 server-log proof. Those require project credentials and a test database/API key.

## Findings

### P1 - Cache invariant can still double-call API.Bible under concurrent first fetches

Evidence:

- `lib/bible/apibible.ts:57-61` states that concurrent first fetches for the same `(ref, version)` may double-call API.Bible.
- The implementation checks cache first, then calls API.Bible, then inserts with `onConflictDoNothing()` at `lib/bible/apibible.ts:71-121`.
- The primary M2 risk/acceptance item is AC-8: two accounts adding the same verse-version pair should result in exactly one API.Bible network call.

Impact:

- Sequential adds should hit cache correctly, but simultaneous first adds can violate the "exactly one API.Bible call" invariant.
- This is exactly the kind of launch/concurrency case that can burn API quota and undercut the low-budget requirement.

Recommended fix:

- Serialize cache misses per `(canonicalRef, version)` before the external fetch.
- Options: a short Postgres advisory lock keyed by `(ref, version)`, a transactional lock row, or a cache table state machine with `pending/success/error`.
- After locking, re-check the cache before calling API.Bible.
- Add a unit/integration-style test around the cache helper with a mocked fetch to prove concurrent callers produce one fetch.

### P1 - `/api/verses` accepts unavailable versions and silently creates uncached verses

Evidence:

- `lib/validation/schemas.ts` allows any enum member `{NBLA, NVI, RVR1960}`.
- `app/api/verses/route.ts:65-76` inserts the verse before proving that the chosen version is configured/available.
- `app/api/verses/route.ts:84-91` catches any text-prime failure and still returns `201` with `textPrimed: false`.
- `lib/bible/apibible.ts:86-90` throws when API.Bible is not configured for that version, but by then the verse row already exists.

Impact:

- A malicious client, stale UI, or misconfigured deployment can create `RVR1960` verses even when `APIBIBLE_ID_RVR1960` is not configured.
- The UI ignores `textPrimed`, so the user sees a successful save while the core verse text is missing.
- Later Card View/practice screens may fail on a verse that looked successfully created.

Recommended fix:

- Validate `version` against `availableVersions()` inside `/api/verses` before inserting.
- If no runtime version is available, return a clear 400/503 and do not create the verse.
- If text priming is intentionally best-effort, persist an explicit text-cache status or surface a visible "text pending/failed" state. Do not silently treat missing text as a normal successful create.

### P1 - New schema still has no committed migrations

Evidence:

- `db/schema.ts` now defines `users`, `collections`, `verses`, `verse_collections`, and `bible_text_cache`.
- `find db -maxdepth 3 -type f` shows only `db/schema.ts` and `db/client.ts`.
- A temp `drizzle-kit generate` succeeded, which means the SQL is mechanically available, but it is not committed.

Impact:

- A fresh Neon database cannot be reproduced from reviewed source without ad hoc `db:push`.
- Auth, verse creation, collection creation, and cache behavior all depend on tables that are not represented by committed migrations.
- This was already a carry-over risk in M0/M1; after M2 it blocks reliable handoff/deploy.

Recommended fix:

- Generate and commit the initial migration files under `db/migrations`.
- Add a short note in README/PLAN clarifying whether contributors should use `db:push` only for scratch branches or use migrations as the durable path.

### P1 - Verse creation still blocks on API.Bible despite saying it is non-blocking

Evidence:

- `app/api/verses/route.ts:4-9` says the API.Bible fetch does not block save.
- `app/api/verses/route.ts:84-88` awaits `getVerseText(...)` before responding.
- `getVerseText` performs a network fetch on cache miss.

Impact:

- On a cache miss, save latency is tied to API.Bible latency.
- A slow API.Bible response can make the form feel stuck, contrary to `specs.md §6.1` step 4.
- This also makes transient API.Bible slowness part of the critical user save path.

Recommended fix:

- Decide the product behavior explicitly:
  - If save should be non-blocking, return after DB insert and trigger cache population out-of-band or with a best-effort fire-and-log mechanism.
  - If M2 needs synchronous proof of cache population, then remove the "non-blocking" comment and surface failures instead of pretending the save is complete.

### P2 - `pnpm typecheck` is brittle when `.next/types` is stale

Evidence:

- First `corepack pnpm typecheck` failed with `TS6053: File '.next/types/cache-life.d.ts' not found`.
- After `corepack pnpm build` regenerated `.next`, the same command passed.
- `tsconfig.json:22` includes `.next/types/**/*.ts`.

Impact:

- The documented verification order can fail depending on local generated state.
- Contributors may see false negatives after route changes or cache cleanup.

Recommended fix:

- Add a typecheck script that runs Next type generation first, or document `pnpm build` before `pnpm typecheck`.
- Alternatively use the Next-recommended typegen flow for this version.
- Keep `.next` generated state out of the critical standalone `tsc` path where possible.

### P2 - Lint passes with warnings in the new verse form

Evidence:

- `components/verse/VerseForm.tsx:12-17` imports `CARD_COLOR_IDS`, `COLLECTION_COLORS`, and `isCardColor`, but they are unused.
- `pnpm lint` exits 0 but reports these warnings.

Impact:

- Not functionally risky, but M2 should keep the foundation clean before larger UI work starts.
- The project plan expects zero lint/type issues at milestone boundaries.

Recommended fix:

- Remove the unused imports.

### P2 - Collection color IDs drift from the CSS token names

Evidence:

- `lib/catalog.ts:40-43` uses a collection color id named `crimson`.
- `styles/tokens.css:127-129` defines the matching red preset as `--tag-red-*`, not `--tag-crimson-*`.

Impact:

- Current `CollectionPicker` uses inline colors, so this does not break M2.
- Later shared tag components may reasonably try `var(--tag-${colorKey}-bg)` and fail for `crimson`.

Recommended fix:

- Align the collection color key with the token name (`red`) or add `--tag-crimson-*` aliases.
- Keep card color IDs and collection color IDs separate; card colors have `crimson`, collection tags currently have `red`.

### P2 - Runtime version list is config-driven, not actually license-verified

Evidence:

- `lib/bible/apibible.ts:34-40` returns any version with a configured `APIBIBLE_ID_*`.
- The spec says the UI should reflect what the deployed API.Bible key actually licenses, intersected with `{NBLA, NVI, RVR1960}`.

Impact:

- A stale or wrong Bible ID can appear in the UI even if the key cannot fetch it.
- This combines badly with the silent `textPrimed: false` create behavior.

Recommended fix:

- At minimum, document that `APIBIBLE_ID_*` is trusted configuration and verify it at deploy time.
- Better: add a small server-side verification path that checks configured Bible IDs against API.Bible and hides failing versions.

## Positive Notes

- The reference parser wrapper is well scoped and has useful tests for Spanish, English, abbreviations, ranges, multi-passage rejection, and display formatting.
- Verse and collection APIs enforce authentication, and `/api/verses` checks collection ownership before linking.
- The verse text is not stored on the user-owned verse row; the shared cache table matches the product direction.
- Smart defaults for color rotation and book-to-icon mapping are extracted and tested.
- The New Verse form has the right broad UX pieces: live card preview, reference validation, version picker, color/icon selectors, hint, and inline collection creation.
- M1's stale-cookie redirect loop is fixed.
- M1's onboarding primary CTA problem is fixed: it now opens `/verses/new?ref=Juan%2014%3A6`.
- Docker build context is now small and the production image builds.

## Suggested Next Commit Order

1. `Add M2 Drizzle migration`
2. `Reject unavailable verse versions`
3. `Serialize bible text cache misses`
4. `Clarify verse save and text-prime behavior`
5. `Clean new verse lint warnings`
6. `Align collection color token keys`
7. `Stabilize typecheck script`

## M2 Readiness Call

Status: not ready to close M2.

M2 should be considered complete after the schema has committed migrations, `/api/verses` refuses unavailable versions, text-cache misses cannot double-call API.Bible under concurrency, the save/text-prime behavior is made honest and observable, and AC-8 is manually verified with two test accounts plus server logs.
