# M1 Review - VersoRefuerzo

Date: 2026-05-02
Reviewer: Codex
Scope reviewed: `about.md`, `specs.md`, `PLAN.md`, full git history, M0 carry-over fixes, current M1 auth/onboarding code, middleware, API routes, build/test output, Docker build, and local runtime redirect behavior.

## Executive Summary

M1 made real progress. The project now has Firebase client/admin initialization, session-cookie helpers, `/api/auth/session`, `/api/me`, middleware-based auth routing, a Google login page, an authenticated placeholder home, sign-out, and first-run onboarding. The M0 lockfile/public-folder blockers were fixed, and the current code passes `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `docker build .` after a clean frozen install.

I would still not close M1 yet. The most serious issue is a confirmed redirect loop for expired/invalid session cookies. Since session cookies are intentionally short-lived, users will hit this after normal expiry and be unable to reach the login page without manually clearing cookies. There are also M1 flow gaps around onboarding's primary CTA and a still-open M0 database migration gap.

## Commits Reviewed

Current branch: `main`, tracking `origin/main`; working tree clean before this review file.

Notable new commits since the M0 implementation/review:

- M0 fixes: `3da473f` through `67a0d81`
- M0 review committed: `68ada2d`
- M1 implementation: `b77e4a2` through `c82723b`

Positive: the commit history remains linear and readable. M1 commits are mostly one concern each and follow the plan's "small, well-titled chunks" policy.

## Verification Performed

- `git status --short --branch`: clean `main...origin/main`
- `corepack pnpm install --frozen-lockfile --force`: passed
- `corepack pnpm test`: passed, 1 sanity test
- `corepack pnpm lint`: passed, no warnings/errors
- `corepack pnpm typecheck`: passed after regenerating `.next` via successful build
- `corepack pnpm build`: passed with network access for `next/font`
- `docker build .`: passed
- Dev server on `127.0.0.1:3001`:
  - `GET /api/health`: 200
  - `HEAD /` without cookie: 307 to `/login`
  - `HEAD /login` with `__session=bogus`: 307 to `/`
  - `curl -L --max-redirs 4 /login` with `__session=bogus`: confirmed `/login` <-> `/` redirect loop

Notes:

- A first build without network failed because `next/font` could not fetch Google fonts. With network access, the build passed.
- An initial `typecheck` failed because stale `.next/types` still referenced the removed M0 `app/page.tsx`; after `next build` regenerated `.next`, `typecheck` passed.

## Findings

### P0 - Invalid or expired session cookies lock users in a redirect loop

Evidence:

- `middleware.ts:35-39` redirects any request to `/login` to `/` when a `__session` cookie exists.
- `app/(app)/layout.tsx:22-25` verifies the cookie server-side and redirects to `/login` when verification fails or no user row is found.
- Runtime smoke test with `__session=bogus` confirmed a `/login` -> `/` -> `/login` loop until curl hit `--max-redirs`.

Impact:

- Session cookies expire after 5 days (`lib/auth/session.ts`), so this will affect normal returning users, not only corrupted-cookie cases.
- A user with an expired cookie cannot sign back in because middleware keeps bouncing `/login` back to `/`.
- This undermines M1's core auth goal.

Recommended fix:

- Do not redirect `/login` to `/` based only on cookie presence.
- Prefer making `/login` a small server wrapper that calls `getServerUser()` and redirects only when the session is actually valid; otherwise render the client login component.
- Alternatively remove the login-to-home middleware redirect entirely. A valid signed-in user seeing login is less harmful than locking expired users out.
- Consider clearing invalid cookies when verification fails, if that can be done in a route/middleware path that has enough context to set the deletion cookie correctly.

### P1 - Onboarding primary CTA navigates to a route that does not exist yet

Evidence:

- `app/(app)/onboarding/_actions.tsx:38` sends the primary action to `/verses/new`.
- There is currently no `app/(app)/verses/new/page.tsx`; that route is planned for M2.
- The action marks `hasCompletedOnboarding: true` before navigating.

Impact:

- A first-run user who clicks the main CTA, which is the expected path, lands on a 404 during M1.
- The onboarding flag is already persisted, so refreshing takes them out of onboarding even though the intended first action failed.

Recommended fix:

- For M1, either add a small authenticated `/verses/new` placeholder that clearly says the real form lands in M2, or route the primary CTA to `/` until M2 implements the New Verse flow.
- Better: do not set `hasCompletedOnboarding` until the target path is known to be usable, or check the PATCH response before navigating.

### P1 - Database schema still has no committed migration

Evidence:

- `db/schema.ts` defines the `users` table used by M1 auth.
- `drizzle.config.ts` points migrations to `db/migrations`.
- `db/migrations/` is still absent.

Impact:

- The M1 auth code can compile, but a fresh Neon branch has no reviewed migration path for the required `users` table.
- Contributors/deployments must rely on ad hoc `db:push`, which makes DB state easy to drift.
- This was called out in M0 and remains unresolved.

Recommended fix:

- Run `pnpm db:generate` for the current schema and commit the generated migration files.
- Use migrations as the reviewed source of database changes from M1 onward.

### P2 - Docker build context is much larger than necessary

Evidence:

- `docker build .` transferred a 791 MB context.
- Local `du` shows `.pnpm-store` at 816 MB.
- `.dockerignore` ignores `node_modules`, `.next`, and `.git`, but not `.pnpm-store`.

Impact:

- Docker builds are slower and noisier than they need to be.
- This can waste Cloud Build time and make local iteration worse.

Recommended fix:

- Add `.pnpm-store` and `*.tsbuildinfo` to `.dockerignore`.
- Keep generated/cache directories out of Docker context even if they are git-ignored.

### P2 - Login page omits the explicit privacy guarantee required by the spec

Evidence:

- `app/(auth)/login/page.tsx:215-225` renders `Gratis para siempre · Sin anuncios`.
- `T.es.privacy` exists in `lib/i18n/strings.ts`, but the login page does not render it.
- `specs.md §3.2` requires surfacing the guarantee: "100% privado · Sin anuncios".

Impact:

- The login screen misses a small but explicit product/privacy requirement.
- This is easy to fix now and will matter for first impression and trust.

Recommended fix:

- Render the privacy copy on login, ideally near the Google button or footer.
- Keep "gratis / sin anuncios" too, but do not omit "100% privado".

### P2 - `next.config.ts` uses deprecated typed-routes location

Evidence:

- `next.config.ts:6-8` places `typedRoutes` under `experimental`.
- `next build` warns: "`experimental.typedRoutes` has been moved to `typedRoutes`."

Impact:

- Not a runtime bug today, but this is avoidable config drift on a new project.

Recommended fix:

- Move to:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typedRoutes: true,
};
```

## Positive Notes

- M0's highest-risk lockfile and Docker-public-folder blockers are fixed.
- `docker build .` now succeeds.
- The auth implementation keeps Firebase ID tokens out of long-lived client state and relies on an httpOnly Firebase session cookie, which is the right direction for this stack.
- `getServerUser()` verifies the session cookie with Firebase Admin before trusting the DB row.
- `/api/me` returns 401 JSON for unauthenticated API callers rather than redirecting them to HTML.
- The first-run onboarding gate is implemented in the authenticated layout, so new users are forced through onboarding once the redirect-loop issue is fixed.
- The i18n table was started, and M1 pages use it instead of scattering most labels inline.

## Suggested Next Commit Order

1. `Fix stale session redirect loop`
2. `Make onboarding primary path safe for M1`
3. `Add initial Drizzle migration`
4. `Tighten Docker ignore rules`
5. `Add privacy copy to login`
6. `Update typedRoutes config`

## M1 Readiness Call

Status: not ready to close M1.

M1 should be considered complete after invalid/expired cookies no longer trap users, onboarding's main CTA does not 404, the `users` table has a committed migration, and the smoke flow is manually verified with real Firebase + Neon credentials: Google sign-in -> onboarding -> skip or safe primary path -> Home -> sign out -> login accessible again.
