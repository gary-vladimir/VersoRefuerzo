# M0 Review - VersoRefuerzo

Date: 2026-05-01
Reviewer: Codex
Scope reviewed: `about.md`, `specs.md`, `PLAN.md`, full git history, current M0 scaffold, config, Dockerfile, Drizzle setup, design token/animation ports, and working tree status.

## Executive Summary

The current progress is a reasonable first M0 scaffold: the repository has a clean Next.js skeleton, the design bundle is committed, animations were copied exactly, initial CSS tokens are present, commits are small and readable, and the branch is clean against `origin/main`.

However, I would not mark M0 complete yet. The main acceptance promise for M0 is reproducibility: a fresh environment should install, run, and build the Cloud Run image. That currently fails because the repository does not include `pnpm-lock.yaml`, while both the plan and Dockerfile require frozen pnpm installs. The Docker build is blocked today. There are also a few foundation gaps that will be more expensive to fix after M1/M2 start landing on top of this scaffold.

## Commits Reviewed

The history is linear and easy to audit:

- Product/spec setup: `7987ff6` through `d404315`
- M0 implementation: `359df69` through `c7809df`
- Current branch: `main`, tracking `origin/main`
- Working tree before this review file: clean

Positive: commit subjects are short, scoped, and have no generated/co-author trailers. This follows the plan's commit cadence well.

## Verification Performed

- `git status --short --branch`: clean `main...origin/main`
- `diff -u DesignBundle/animations.css styles/animations.css`: no diff; animation port is verbatim
- `test -f pnpm-lock.yaml`: failed; lockfile is absent
- `corepack pnpm install --frozen-lockfile`: failed with `ERR_PNPM_NO_LOCKFILE`
- `docker build .`: failed at `RUN pnpm install --frozen-lockfile` for the same missing lockfile

I did not run `pnpm test`, `pnpm typecheck`, `pnpm lint`, or `pnpm build` successfully because dependencies are not installed and the frozen install path is blocked by the absent lockfile.

## Findings

### P0 - Missing `pnpm-lock.yaml` breaks M0 reproducibility and Docker builds

Evidence:

- `package.json:5` pins `packageManager` to `pnpm@9.15.0`.
- `Dockerfile:8-9` copies `pnpm-lock.yaml*` and runs `pnpm install --frozen-lockfile`.
- `pnpm-lock.yaml` is not committed.
- `docker build .` fails with: `ERR_PNPM_NO_LOCKFILE Cannot install with "frozen-lockfile" because pnpm-lock.yaml is absent`.

Impact:

- The Cloud Run image cannot currently build.
- The M0 "fresh checkout/devcontainer reproducibility" claim is not satisfied.
- Dependency versions are not actually locked despite the plan saying the lockfile is committed.
- Different contributors can resolve different dependency graphs from the caret ranges in `package.json`.

Recommended fix:

- Run `pnpm install` once with the pinned pnpm version.
- Commit `pnpm-lock.yaml`.
- After the lockfile exists, prefer `pnpm install --frozen-lockfile` in reproducible contexts.
- Consider changing `.devcontainer/devcontainer.json:15` from `pnpm install` to `pnpm install --frozen-lockfile` once the lockfile is committed.

### P1 - Dockerfile will likely hit a second blocker because `public/` does not exist

Evidence:

- `Dockerfile:25` runs `COPY --from=builder /app/public ./public`.
- The repository currently has no `public/` directory.

Impact:

- The build already fails earlier because of the missing lockfile. Once that is fixed, the runner stage is likely to fail when Docker tries to copy a missing `/app/public` path.
- This keeps the M0 Cloud Run container from being buildable.

Recommended fix:

- Add `public/.gitkeep` now, or adjust the Dockerfile so it does not require `public/` until static assets exist.
- Since later milestones need icons and sounds under `public/`, adding the directory now is the simplest path.

### P1 - Drizzle schema is not yet reproducible through committed migrations

Evidence:

- `db/schema.ts` defines the initial `users` table.
- `drizzle.config.ts:10` points migrations to `./db/migrations`.
- No `db/migrations/` directory or generated migration files are committed.

Impact:

- The schema exists in TypeScript, but the database state is not reviewable or reproducible from committed migration artifacts.
- Contributors may use `db:push` against different Neon branches and drift from each other.
- This weakens the "Drizzle wired to Neon" part of the M0 outcome.

Recommended fix:

- After dependency installation is fixed, run `pnpm db:generate` for the current `users` table.
- Commit the generated migration and metadata.
- Keep `db:push` for local/dev convenience, but use committed migrations as the reviewed source of database changes.

### P1 - Devcontainer setup does not yet guarantee the same environment for every contributor

Evidence:

- `.devcontainer/devcontainer.json:15` runs plain `pnpm install`.
- There is no committed lockfile.
- The plan says the devcontainer should be the single source of truth and should bootstrap the same toolchain/dependency graph.
- The plan also mentions container environment being pulled from local `.env`, but the current devcontainer does not define an env-file or equivalent flow.

Impact:

- New contributors can open the container and generate an untracked lockfile locally, but that is not the same as a reviewed, shared dependency graph.
- DB-related commands inside the container may not see required env vars unless the contributor wires them manually.

Recommended fix:

- Commit `pnpm-lock.yaml`.
- Switch the post-create install to frozen mode.
- Document or implement the intended `.env` flow for devcontainer DB/API commands. If adding an automatic env-file hook, make sure it behaves clearly when `.env` is absent.

### P2 - The token port is useful, but not yet the full `tokens.jsx` production mapping

Evidence:

- `styles/tokens.css` contains the color, spacing, radius, font, and shadow CSS variables.
- The `T` string table from `DesignBundle/tokens.jsx` is not present as `lib/i18n/strings.ts`.
- Card color labels are currently duplicated in `app/page.tsx:4-13`.

Impact:

- Upcoming M1/M2 UI work may start hardcoding labels and strings in route/component files.
- That increases the chance of drifting away from the bilingual spec and the design bundle.

Recommended fix:

- Before or during M1, port the `T` table into `lib/i18n/strings.ts`.
- Keep user-facing labels for card colors, collection presets, and navigation in one typed source rather than duplicating them per component.

### P2 - Verification scripts are configured but not yet proven

Evidence:

- `package.json` defines `test`, `typecheck`, `lint`, and `build`.
- These commands could not be run because dependency installation is blocked by the missing lockfile.

Impact:

- There may be hidden TypeScript, Next.js, ESLint, or build issues that are currently masked.
- The `lint` script and `.eslintrc.json` should be validated against the selected Next.js and ESLint versions once dependencies install.

Recommended fix:

- After committing the lockfile, run and record:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm build`
  - `docker build .`

## Positive Notes

- The design bundle is committed locally, matching the spec's requirement that it be the canonical visual reference.
- `styles/animations.css` is a verbatim copy of `DesignBundle/animations.css`.
- The initial `users` schema includes important future fields from the plan: locale, sound toggle, onboarding flag, aloud-tip flag, streak fields, last version, and timezone.
- The M0 placeholder page is intentionally small and does demonstrate that CSS variables are wired.
- The `/api/health` route is simple and appropriate for a lightweight service health check.
- The git history is clean and follows the requested small-commit style.

## Suggested Next Commit Order

1. `Add pnpm lockfile`
2. `Add public directory placeholder`
3. `Add initial Drizzle migration`
4. `Harden devcontainer install reproducibility`
5. `Port i18n strings from design tokens`
6. `Verify M0 build and scripts`

## M0 Readiness Call

Status: not ready to close M0.

M0 should be considered complete after a fresh checkout can install with the committed lockfile, run the health page, pass the basic verification scripts, and build the Docker image successfully.
