# VersoRefuerzo — v1 Implementation Plan

> Companion to `specs.md`. The spec governs **what** and **why**; this plan governs **how** and **in what order**. Read `specs.md` first.

## Context

`/Users/gary/Documents/VersoRefuerzo` currently contains `specs.md` (the binding 920-line product+engineering spec, sections 1–18), `about.md`, and `DesignBundle/` (12 prototype files: HTML/CSS/JSX). There is **zero application code, build tooling, or infrastructure** — confirmed blank slate.

The goal of this work is to ship v1 of VersoRefuerzo: a free, ad-free, bilingual (ES/EN) Bible-verse memorization web app with science-based spaced repetition (SM-2), four mini-games, and a 100% private per-user library. Hosting must stay within Google Cloud / Firebase / Neon free tiers.

The user has issued explicit constraints that govern every implementation choice:

- **Stick strictly to the spec.** No features beyond §1–§18.
- **Forbid unnecessary code.** No speculative abstractions, no premature generality.
- **Clean and simple.** Minimize folder sprawl, library count, and configuration surface.
- **Front-load risk.** Auth, verse-text caching, and SRS correctness are the three pieces that can derail v1.
- **Use a `.devcontainer` for this project** so every contributor (and Codespaces) bootstraps the same toolchain in one click.
- **Commit progress in small, well-titled chunks** as work is completed. Multiple commits per milestone. Easy-to-understand messages. **No co-author trailers.**

The intended outcome of executing this plan is a deployable Cloud Run container that satisfies all 22 acceptance criteria across `specs.md` §11 and §17.9.

## Locked stack (user-confirmed)

| Concern | Choice |
| --- | --- |
| Frontend + backend | Next.js (App Router) full-stack, single Cloud Run container |
| DB | Neon Postgres via Drizzle ORM |
| Auth | Firebase Authentication (Google), `firebase-admin` for server-side ID-token verify |
| Styling | CSS variables (port `tokens.jsx`) + CSS Modules; `animations.css` ported verbatim as a global stylesheet |
| Server state | TanStack Query |
| Validation | `zod` at API boundaries |
| Reference parser | `bible-passage-reference-parser`, client-side first |
| Time/timezone | `dayjs` + `dayjs/plugin/utc` + `dayjs/plugin/timezone` (only library justified beyond the locked list, per `specs.md` §13.3) |
| Tests | Vitest unit tests; manual UI verification against the 22 ACs |
| Deploy | Cloud Run, `Dockerfile` in repo |
| Dev environment | `.devcontainer/` (see §"Devcontainer" below) — single source of truth for the local toolchain |
| Package manager | `pnpm` (smaller node_modules, faster CI, lockfile committed) |

**Explicitly rejected:** `react-hook-form` (forms ≤ 6 fields are fine with controlled inputs), `framer-motion` (CSS animations are sufficient), `lodash`, Storybook, Playwright, Prisma, Tailwind, monorepo tooling.

## Devcontainer

Every contributor and CI/Codespaces session uses the same toolchain via `.devcontainer/`. Deliberately small.

```text
/.devcontainer/
  devcontainer.json
  Dockerfile           # only if base image features are insufficient
```

**`devcontainer.json` requirements:**

- Base image: `mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm` (Node 20 LTS, TypeScript pre-installed, Debian Bookworm).
- `features`:
  - `ghcr.io/devcontainers-contrib/features/pnpm:2` — pnpm CLI.
  - `ghcr.io/devcontainers/features/github-cli:1` — for PR / deploy ergonomics.
- `forwardPorts`: `[3000]` (Next.js dev server). Drizzle Studio (`4983`) optional, surfaced only when a script is run.
- `postCreateCommand`: `pnpm install`.
- `containerEnv`: pulled from `.env` via the user's local environment; the container does **not** bake secrets.
- `customizations.vscode.extensions` — keep minimal:
  - `dbaeumer.vscode-eslint`
  - `esbenp.prettier-vscode`
  - `bradlc.vscode-tailwindcss` — **excluded** (Tailwind is rejected).
  - `unifiedjs.vscode-mdx` — for markdown editing (specs/plan).
  - `mtxr.sqltools` + `mtxr.sqltools-driver-pg` — handy for Neon inspection.
- `customizations.vscode.settings`:
  - `editor.formatOnSave: true`
  - `editor.defaultFormatter: esbenp.prettier-vscode`
  - `eslint.run: onSave`

**Acceptance for the devcontainer (M0 sub-criterion):** "Open in container" → wait for postCreate → run `pnpm dev` → `http://localhost:3000` serves the M0 health page. No host-side Node install required.

## Commit cadence policy

Per user directive — commit small, often, with clear messages.

**Rules:**

- One logical change per commit. If a commit message needs the word "and", split it.
- Subject line ≤ 65 chars, imperative voice (`Add`, `Wire`, `Port`, `Fix`, `Refactor`, `Remove`).
- No `Co-Authored-By` trailers, no `Generated with` trailers, no emojis unless the user adds them.
- Commit only files that belong to the change. Never `git add -A`. Prefer named paths.
- Each milestone produces **3–8 commits** (rough guide). Bigger numbers are fine; one giant per-milestone commit is not.
- Push at milestone boundaries (and any time work crosses end-of-day) so progress is durable.

**Suggested commit slices per milestone (illustrative — engineering may adjust):**

| Milestone | Suggested commits |
| --- | --- |
| **M0** | `Add devcontainer config` · `Add package.json with locked deps` · `Add tsconfig and next config` · `Port tokens to styles/tokens.css` · `Port animations.css verbatim` · `Wire Drizzle client to Neon` · `Add health route and Vitest config` · `Add Dockerfile for Cloud Run` |
| **M1** | `Add Firebase admin and client init` · `Add session cookie helpers` · `Add /api/auth/session POST and DELETE` · `Add login page` · `Add /api/me GET PATCH DELETE` · `Add onboarding page` · `Wire authed layout shell` |
| **M2** | `Add bible reference parser wrapper` · `Add API.Bible server fetcher` · `Add /api/bible/versions and /api/bible/text` · `Add zod schemas for verse and collection` · `Add /api/verses POST and /api/collections POST` · `Add new verse form and pickers` · `Add smart defaults for new verse form` |
| **M3** | `Add VerseRow and library list view` · `Add collections grid` · `Add card view with two-state flip` · `Add edit verse route` · `Add soft-delete and restore endpoints` · `Add undo toast component` · `Add empty states across library and home` |
| **M4** | `Add SM-2 update function with tests` · `Add mastery and status derivation` · `Add interleaved due-today queue` · `Add long-verse chunking` · `Add streak rollover with tz` · `Add /api/practice/queue and sessions` · `Add classic session UI` · `Add session summary screen` · `Add aloud-tip and skip-card affordances` |
| **M5** | `Add tokenizer for first-letter and cloze` · `Add tolerant compare for typed recall` · `Add first-letter session route` · `Add typed-recall variant inside classic` · `Tighten mastered guard with unaided-recall check` |
| **M6** | `Add progressive cloze blank density` · `Add fallback distractor pool` · `Add word scramble session` · `Add verse match session` · `Add fill-the-gap session` · `Differentiate recall vs recognition in /api/practice/sessions` |
| **M7** | `Add profile sheet with locale and sound toggles` · `Add desktop sidebar layout` · `Add sound effect player` · `Wire reduced-motion compliance` · `Add account deletion flow` · `Add Cloud Run deploy script` · `First production deploy` |

## Directory layout

Single Next.js app. No `src/`. Colocate; do not create per-feature `hooks/` / `types/` / `utils/` folders.

```text
/
  .devcontainer/
    devcontainer.json
    Dockerfile                              # only if base image features are insufficient
  app/
    (auth)/login/page.tsx
    (app)/layout.tsx                        # authed shell: mobile tabs / desktop sidebar
    (app)/page.tsx                          # Home
    (app)/onboarding/page.tsx               # §17.7 first-run only
    (app)/practice/page.tsx                 # Practice hub
    (app)/practice/classic/page.tsx
    (app)/practice/first-letter/page.tsx
    (app)/practice/scramble/page.tsx
    (app)/practice/match/page.tsx
    (app)/practice/gap/page.tsx
    (app)/practice/summary/page.tsx
    (app)/library/page.tsx                  # tabs: Colecciones | Todos
    (app)/library/collections/[id]/page.tsx
    (app)/verses/new/page.tsx
    (app)/verses/[id]/page.tsx              # Card View
    (app)/verses/[id]/edit/page.tsx         # reuses VerseForm
    api/auth/session/route.ts
    api/me/route.ts
    api/bible/versions/route.ts
    api/bible/text/route.ts
    api/verses/route.ts
    api/verses/[id]/route.ts
    api/verses/[id]/restore/route.ts
    api/collections/route.ts
    api/collections/[id]/route.ts
    api/practice/queue/route.ts
    api/practice/sessions/route.ts
    api/stats/home/route.ts
    layout.tsx                              # root html, fonts, providers
    globals.css                             # imports tokens.css + animations.css
  components/
    ui/                                     # ports of components.jsx atoms
      Button.tsx Tag.tsx VerseCard.tsx IconBubble.tsx Stat.tsx
      ProgressBar.tsx SectionTitle.tsx MobileTabBar.tsx FAB.tsx Toast.tsx
    icons/VerseIcons.tsx UiIcons.tsx index.ts
    verse/VerseRow.tsx VerseForm.tsx ColorPicker.tsx IconPicker.tsx CollectionPicker.tsx
    practice/ClassicSession.tsx FirstLetterSession.tsx WordScramble.tsx
              VerseMatch.tsx FillTheGap.tsx TypedRecall.tsx
              QualityButtons.tsx HintButton.tsx SkipLink.tsx SessionSummary.tsx
    layout/MobileShell.tsx DesktopSidebar.tsx ProfileSheet.tsx
    home/HomeHero.tsx StreakChip.tsx TodayCTA.tsx
  lib/
    auth/firebase-admin.ts firebase-client.ts session.ts
    bible/apibible.ts reference.ts tokenize.ts compare.ts fallback-distractors.ts
    srs/sm2.ts mastery.ts queue.ts chunk.ts cloze.ts
    streak/streak.ts
    i18n/strings.ts useT.ts
    validation/schemas.ts
    query/queryClient.ts keys.ts
    sounds/player.ts
  db/
    schema.ts client.ts migrations/
  styles/tokens.css animations.css
  public/sounds/{flip,pluck,thud,chime,flame}.mp3 favicon.ico icon-192.png icon-512.png
  tests/
    sm2.test.ts mastery.test.ts queue.test.ts chunk.test.ts cloze.test.ts
    compare.test.ts reference.test.ts streak.test.ts tokenize.test.ts
    manual-ac.md                            # checklist for the 22 acceptance criteria
  drizzle.config.ts next.config.ts package.json tsconfig.json vitest.config.ts
  Dockerfile .env.example
```

## Drizzle schema (`db/schema.ts`)

Six tables, exact mapping to `specs.md` §4 and §9.4. UUID v4 server-generated, timestamps default `now()`. All user-owned tables index `(userId, …)` for the dominant access path.

| Table | Columns (key fields) | Indexes / FKs |
| --- | --- | --- |
| `users` | id pk · googleSub uniq · email uniq · displayName · photoUrl · locale (`'es'`) · soundEnabled (true) · lastVersion · hasCompletedOnboarding (false) · hasSeenAloudTip (false) · currentStreak · bestStreak · lastStreakAt (date) · timezone (IANA) · createdAt · updatedAt | unique(googleSub), unique(email) |
| `collections` | id pk · userId fk → users(cascade) · name (≤40) · description (≤120) · colorKey · createdAt · updatedAt | unique(userId, lower(name)), index(userId) |
| `verses` | id pk · userId fk → users(cascade) · canonicalRef (e.g. `JHN.14.6`) · version · icon · color · hint · srsState jsonb (`easeFactor`, `interval`, `repetitions`, `dueAt`, `chunkStage`) · mastery real · status (`'new' \| 'learning' \| 'mastered'`) · deletedAt (soft-delete for §17.5 undo) · createdAt · updatedAt | index(userId, deletedAt), index(userId, ((srsState->>'dueAt'))), index(canonicalRef, version) |
| `verseCollections` | verseId fk → verses(cascade) · collectionId fk → collections(cascade) | pk(verseId, collectionId), index(collectionId) |
| `bibleTextCache` | canonicalRef · version · text · copyrightAttribution · fetchedAt | pk(canonicalRef, version) — never invalidated, never user-scoped, retained on account delete |
| `practiceSessions` | id pk · userId fk → users(cascade) · verseId fk → verses(cascade) · mode (`'classic' \| 'first_letter' \| 'typed' \| 'scramble' \| 'match' \| 'gap'`) · classification (`'recall' \| 'recognition'`) · quality (0..5, nullable) · outcome (`'correct' \| 'partial' \| 'incorrect' \| 'gave_up'`) · durationMs · usedHint · startedAt | index(userId, startedAt desc), index(userId, verseId, mode, startedAt desc) |

**Pruning policy** for `practiceSessions`: keep last 90 days **plus** the most recent mastered-qualifying row per verse (so the §15.5 30-day check remains queryable indefinitely). Sweep nightly via a Cloud Run scheduled job, or — simpler — on-write housekeeping triggered from `/api/practice/sessions` POST.

**Soft-delete on `verses`** is committed by either (a) a 5-second-delayed server-side commit triggered after the DELETE call, or (b) a sweep run at GET-list time skipping `deletedAt < now() - 5s`. Recommended: (b), simpler, no in-memory timers across stateless Cloud Run instances.

## API routes

All authenticated routes verify the session cookie via `lib/auth/session.ts :: getServerUser()` first; ownership is enforced before any DB read/write. Validation via zod schemas in `lib/validation/schemas.ts`.

| Route | Method | Purpose | Spec |
| --- | --- | --- | --- |
| `/api/auth/session` | POST | Verify Firebase ID token, upsert user, set httpOnly cookie | §3.1 |
| `/api/auth/session` | DELETE | Clear cookie | §3.1 |
| `/api/me` | GET | Profile + flags | §3.1, §6.8, §15.8, §17.7 |
| `/api/me` | PATCH | Update locale, soundEnabled, hasCompletedOnboarding, hasSeenAloudTip, lastVersion, timezone | §6.8, §15.8, §16.3, §17.7 |
| `/api/me` | DELETE | Hard-delete user + cascade; cache rows retained | §3.1, AC-11 |
| `/api/bible/versions` | GET | Allowlist `{NBLA, NVI, RVR1960}` ∩ what API.Bible key serves at runtime | §9.2 |
| `/api/bible/text?ref=&version=` | GET | Cache lookup; on miss fetch API.Bible, persist, return | §9.3, AC-8 |
| `/api/verses` | GET | List user's verses (filters: `collectionId`, `q`, `status`) | §6.3 |
| `/api/verses` | POST | Create verse; kicks off cache fetch if uncached | §6.1, AC-2 |
| `/api/verses/[id]` | GET | Verse + joined cached text + collections | §6.2 |
| `/api/verses/[id]` | PATCH | Edit | §17.5 |
| `/api/verses/[id]` | DELETE | Soft-delete | §17.5 |
| `/api/verses/[id]/restore` | POST | Undo within 5s | §17.5, AC-20 |
| `/api/collections` | GET / POST | List / create | §6.1, §6.3 |
| `/api/collections/[id]` | PATCH / DELETE | Edit / delete (un-link verses, no cascade-to-verses) | §4.2, §17.5 |
| `/api/practice/queue?source=&mode=` | GET | Interleaved due-today queue | §15.6, AC-17 |
| `/api/practice/sessions` | POST | Record one attempt; server applies SM-2 (recall) or touch+ease bump (recognition); updates streak; returns updated verse + new dueAt + streak | §6.4, §6.6, §15.4, §15.5, AC-6, AC-12, AC-14 |
| `/api/stats/home` | GET | `{ totalVerses, mastered, learning, dueToday, currentStreak, bestStreak }` | §16.6 |

No other endpoints. No leaderboards, no analytics, no exports.

## DesignBundle → production reuse mapping

Files in `./DesignBundle/` are the **canonical visual contract** (per `specs.md` §18). Port the listed JSX/CSS to production; reject the rest.

| Bundle file | Production target | Action |
| --- | --- | --- |
| `tokens.jsx` | `styles/tokens.css` + `lib/i18n/strings.ts` | Port `VR.*` to CSS variables; port `T` table to a typed TS object. |
| `animations.css` | `styles/animations.css` | Verbatim copy; import from `app/globals.css`. |
| `icons.jsx` | `components/icons/{VerseIcons,UiIcons}.tsx` | Re-implement each `<svg>` as a typed React component with the same names. |
| `components.jsx` | `components/ui/*.tsx` | Port `Button`, `Tag`, `VerseCard`, `IconBubble`, `Stat`, `ProgressBar`, `SectionTitle`, `MobileTabBar`, `FAB`. **Drop** `SAMPLE_VERSES`, `SAMPLE_COLLECTIONS`. |
| `mobile-screens.jsx :: ScreenLogin` | `app/(auth)/login/page.tsx` | Port visuals; wire to Firebase. |
| `mobile-screens.jsx :: ScreenHome` + `desktop-screens.jsx :: ScreenDesktopHome` | `app/(app)/page.tsx` (responsive) | Port both layouts; drop `Precisión` (§16.6); CTA goes direct to Classic (§16.1). |
| `mobile-screens.jsx :: ScreenNewVerse` | `app/(app)/verses/new/page.tsx` + `components/verse/VerseForm.tsx` | Port; reuse for edit route. |
| `mobile-screens.jsx :: ScreenCardView` | `app/(app)/verses/[id]/page.tsx` | Port; collapse to 2 states (§16.4); add `Repasar ahora` (§17.4) and `Saltar` (§17.3). |
| `mobile-screens.jsx :: ScreenLibrary` + `VerseRow` | `app/(app)/library/page.tsx` + `components/verse/VerseRow.tsx` | Port; tabs + filters; overflow-menu UX (§17.5). |
| `desktop-screens.jsx :: DesktopFrame, DesktopSidebar` | `components/layout/DesktopSidebar.tsx` + `(app)/layout.tsx` | Port sidebar; user-card click opens `ProfileSheet`. |
| `games.jsx :: ScreenPracticeHub` | `app/(app)/practice/page.tsx` | Port; **replace Streak Challenge tile with First-letter** (§15.1, §16.2). |
| `games.jsx :: ScreenClassicSession` | `components/practice/ClassicSession.tsx` | Port; drop `(SM-2)` label (§16.9); add `Escribirlo` to enter Typed-recall (§15.2); always-visible `💡 Pista` (§16.4); 4 quality buttons after reveal. |
| `games.jsx :: ScreenWordScramble` | `components/practice/WordScramble.tsx` | Port; `intentos` copy; long-verse segments per §6.4.2. |
| `games.jsx :: ScreenVerseMatch` | `components/practice/VerseMatch.tsx` | Port; `intentos` copy; replace `vidas` chip framing. |
| `games.jsx :: ScreenFillTheGap` | `components/practice/FillTheGap.tsx` | Port; progressive cloze blank density (§15.3). |
| `games.jsx :: ScreenStreakChallenge` | **None** — removed (§16.2). The dark "night gradient" tokens it uses may be reused on Login. | **Do not port.** |
| `app.jsx`, `design-canvas.jsx`, `ios-frame.jsx`, `tweaks-panel.jsx`, `VersoRefuerzo.html` | **None** — reference only. | **Do not port.** |

`SessionSummary` (the `specs.md` §11 row 14 screen) has no prototype; build using the night-gradient visual language salvaged from the dropped Streak Challenge.

## Milestones (M0 → M7)

Each milestone is independently shippable and testable. Risk pieces (auth, verse fetching, SRS) sit at M1, M2, M4. **Each milestone closes with a series of focused commits per the cadence policy above, then a push.**

### M0 — Skeleton, devcontainer & visual foundation (½–1 day)

- **Outcome:** Empty Next.js app boots; `.devcontainer` lets a fresh contributor go from zero to running app in one click; design tokens + animations available globally; Drizzle wired to a Neon dev branch; one health route works; Vitest configured; lint/format wired; production `Dockerfile` builds locally.
- **Files:** `.devcontainer/devcontainer.json`, `app/layout.tsx`, `styles/tokens.css`, `styles/animations.css`, `db/schema.ts` (initial), `db/client.ts`, `drizzle.config.ts`, `vitest.config.ts`, `Dockerfile`, `.env.example`, `next.config.ts`, `package.json`, `tsconfig.json`.
- **Spec:** §7, §18.
- **Done when:** `pnpm dev` from inside the devcontainer renders the M0 health page at `localhost:3000` with the design tokens applied, AND a fresh checkout + "Reopen in Container" reproduces the same.

### M1 — Auth end-to-end (RISK)

- **Outcome:** User can sign in with Google, land on a placeholder Home, and sign out. User row upserted on first sign-in. Onboarding screen shown on first sign-in only (§17.7), skippable.
- **Files:** `app/(auth)/login/page.tsx`, `app/(app)/layout.tsx`, `app/(app)/onboarding/page.tsx`, `app/api/auth/session/route.ts`, `app/api/me/route.ts`, `lib/auth/{firebase-admin,firebase-client,session}.ts`, `db/schema.ts` (users table), `lib/i18n/strings.ts` (subset for login + onboarding).
- **Spec:** §3, §11.1, AC-22.

### M2 — New Verse + Bible-text cache (RISK)

- **Outcome:** From a stub Home, user opens New Verse form, types a reference, sees green check on validation, picks color/icon/hint/collections (with smart defaults per §17.1), and saves. Verse text fetched once and cached in `bibleTextCache`. Two test accounts adding the same verse → exactly **one** API.Bible call (verifiable via server logs, AC-8).
- **Files:** `app/(app)/verses/new/page.tsx`, `components/verse/{VerseForm,ColorPicker,IconPicker,CollectionPicker}.tsx`, `lib/bible/{reference,apibible}.ts`, `app/api/bible/{versions,text}/route.ts`, `app/api/verses/route.ts`, `app/api/collections/route.ts`, `lib/validation/schemas.ts`, plus `verses` / `collections` / `verseCollections` / `bibleTextCache` tables.
- **Spec:** §6.1, §9.2, §9.3, §17.1, §17.6, AC-2, AC-8.

### M3 — Library, Card View, edit/delete with undo

- **Outcome:** Library tabs (Colecciones grid + Todos los versos list), collection detail, Card View with 2-state flip and `💡 Pista` button, Edit, Delete-with-5-second-undo. All empty states render correctly.
- **Files:** `app/(app)/library/page.tsx`, `app/(app)/library/collections/[id]/page.tsx`, `app/(app)/verses/[id]/page.tsx`, `app/(app)/verses/[id]/edit/page.tsx`, `components/verse/VerseRow.tsx`, `components/ui/{VerseCard,Toast}.tsx`, `app/api/verses/[id]/route.ts`, `app/api/verses/[id]/restore/route.ts`, `app/api/collections/[id]/route.ts`.
- **Spec:** §6.2, §6.3, §16.4, §17.2, §17.5, AC-3, AC-4, AC-20, AC-21.

### M4 — SRS engine + Classic session + queue + streak (RISK)

- **Outcome:** Home hero "X versos para hoy" → tap → Classic session against the interleaved due-today queue → reveal → grade with 4 quality buttons → SRS state advances correctly → streak extends. Session summary screen at end. First-ever Classic session shows the "recita en voz alta" tooltip (§15.8). Skip-card and `Repasar ahora` work.
- **Files:** `lib/srs/{sm2,mastery,queue,chunk}.ts`, `lib/streak/streak.ts`, `app/api/practice/{queue,sessions}/route.ts`, `app/api/stats/home/route.ts`, `app/(app)/page.tsx`, `app/(app)/practice/classic/page.tsx`, `app/(app)/practice/summary/page.tsx`, `components/practice/{ClassicSession,QualityButtons,HintButton,SkipLink,SessionSummary}.tsx`, `components/home/{HomeHero,StreakChip,TodayCTA}.tsx`, `tests/{sm2,mastery,queue,chunk,streak}.test.ts`.
- **Spec:** §6.4.1, §6.5, §6.6, §15.6, §15.7, §15.8, §16.1, §16.4, §16.5, §17.3, §17.4, AC-1, AC-4, AC-6, AC-16, AC-17, AC-18.

### M5 — First-letter mode + Typed-recall + recall classification

- **Outcome:** First-letter mode runs as a Classic shell with a token transformer; Typed-recall available inside Classic via `Escribirlo` button; tolerant compare auto-grades quality with manual override; mastered status guard enforces unaided-recall-in-30-days (§15.5).
- **Files:** `app/(app)/practice/first-letter/page.tsx`, `components/practice/{FirstLetterSession,TypedRecall}.tsx`, `lib/bible/{tokenize,compare}.ts`, `lib/srs/mastery.ts` (extension), `tests/{compare,tokenize}.test.ts`.
- **Spec:** §15.1, §15.2, §15.5, AC-12, AC-13, AC-15.

### M6 — Recognition mini-games (Scramble, Match, Gap)

- **Outcome:** All three games playable end-to-end. Outcomes recorded with `classification = 'recognition'`; SRS does not advance interval; only ease bumps small on success. "Intentos" framing; neutral end-of-round copy. Progressive cloze blank density scales with `repetitions`.
- **Files:** `app/(app)/practice/{scramble,match,gap}/page.tsx`, `components/practice/{WordScramble,VerseMatch,FillTheGap}.tsx`, `lib/srs/cloze.ts`, `lib/bible/fallback-distractors.ts`, `tests/cloze.test.ts`.
- **Spec:** §6.4.2, §6.4.3, §6.4.4, §15.3, §15.4, §16.7, AC-5, AC-14.

### M7 — Profile sheet, i18n toggle, sounds, desktop polish, a11y, deploy

- **Outcome:** Avatar opens Profile sheet (language, sound, sign-out, delete-account). ES↔EN runtime toggle re-renders without page reload. Sound effects with toggle, defaulting ON. Desktop sidebar layout for all routes. Reduced-motion compliance verified. Account deletion implemented end-to-end. `Dockerfile` finalized. Cloud Run prod deploy from `main`.
- **Files:** `components/layout/{ProfileSheet,DesktopSidebar,MobileShell}.tsx`, `lib/i18n/{strings,useT}.ts`, `lib/sounds/player.ts`, `public/sounds/*`, all `(app)/*` routes wired into `MobileShell`/`DesktopSidebar`, `app/api/me/route.ts` (DELETE), `Dockerfile`, `.github/workflows/deploy.yml` (or a `gcloud run deploy` script).
- **Spec:** §3.1, §6.8, §6.9, §10.3, §10.4, §16.3, §16.6, §16.8, §17.8, AC-7, AC-9, AC-10, AC-11, AC-19.

## Testing strategy

**Unit tests (Vitest, pure functions, no DB):**

- `sm2.ts` — SM-2 update for grades 0–5; predicted-interval display strings.
- `mastery.ts` — derivation thresholds; mastered guard with/without recent unaided recall (AC-15).
- `queue.ts` — interleaving across collections, due-today filter (AC-17).
- `chunk.ts` — boundary picks for 25/50/80-word verses; cumulative growth (AC-16).
- `cloze.ts` — blank density ramps with `repetitions` (§15.3).
- `compare.ts` — accent / case / punct / whitespace tolerance; token Jaccard buckets (AC-13).
- `reference.ts` — wrapper round-trips `Juan 14:6` ↔ `JHN.14.6`; rejects garbage.
- `streak.ts` — tz-local day rollover; current/best updates.
- `tokenize.ts` — punctuation attached to preceding token; first-letter transform.

**Manual against the 22 ACs:** `tests/manual-ac.md` checklist (one row per AC), executed at each milestone boundary and again before the M7 deploy. UI/network/db ACs verified manually: AC-1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 18, 19, 20, 21, 22. Algorithmic ACs (12, 13, 14, 15, 16, 17) covered by unit tests **plus** one end-to-end manual pass.

**No e2e harness in v1** (Playwright is out of scope per "strictly forbid unnecessary code").

## Risks & mitigations (mapped to `specs.md` §13)

1. **RVR1960 licensing** — `/api/bible/versions` returns the runtime intersection of `{NBLA, NVI, RVR1960}` and what the API.Bible key actually serves; UI never hardcodes the version list. If RVR1960 is absent at launch the picker hides it, no code change needed to re-enable. Document the gap in the launch README.
2. **API.Bible quota on launch** — never-evict shared `bibleTextCache` (§9.3); client-side parser rejects garbage before any server call. Optional: a one-time warm-up script that pre-populates the top ~100 most-common verses in NBLA/NVI before the first user signs in.
3. **Streak timezone** — capture IANA timezone on sign-in via `Intl.DateTimeFormat().resolvedOptions().timeZone`, store on `users.timezone`, compute streak in that tz with `dayjs` + `dayjs/plugin/timezone`. Document the date-line edge case (already in `specs.md` §13.3).
4. **PWA decision** — v1 ships **no service worker**. If at the end of M7 there is trivial budget left (< 1 day), add an asset-only SW for the static shell; **no offline data**.
5. **Scramble tokenization** — single shared `lib/bible/tokenize.ts` regex attaches trailing punctuation to its preceding token; same tokenizer feeds first-letter and cloze for consistency. Unit-tested.
6. **Fill-the-Gap distractor pool** — distractors come from same-language tokens across the user's other verses; if the user has < 5 verses, fall back to `lib/bible/fallback-distractors.ts` (~50 ES + ~50 EN common words bundled).

## Dependencies (locked + minimal additions)

`next`, `react`, `react-dom`, `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `firebase`, `firebase-admin`, `bible-passage-reference-parser`, `@tanstack/react-query`, `vitest`, `zod`, `dayjs` (+ `utc`, `timezone` plugins).

Dev: `typescript`, `@types/*`, `eslint`, `eslint-config-next`, `prettier`.

**Rejected:** `react-hook-form`, `framer-motion`, `lodash`, Storybook, Playwright, Prisma, Tailwind. Each rejection traces to "strictly forbid unnecessary code."

## Verification

End-to-end verification before declaring v1 shippable:

1. **Local dev (in devcontainer):** open the repo in the devcontainer; `pnpm install` runs automatically; `pnpm db:push && pnpm dev`. Sign in with a Google test account; complete the M0–M7 manual smoke flow (add verse, practice each mode, change language, sign out).
2. **Unit tests:** `pnpm test` — all green.
3. **Type-check + lint:** `pnpm tsc --noEmit && pnpm lint` — zero errors.
4. **Manual AC checklist:** walk `tests/manual-ac.md` against a fresh deploy on Cloud Run staging; verify each of the 22 acceptance criteria. Document any "deferred" or "won't-fix" with explicit user sign-off.
5. **Verse-cache invariant (AC-8):** add `Romanos 8:28 NBLA` from two distinct Google accounts; tail Cloud Run logs and confirm exactly one outbound `api.scripture.api.bible` call.
6. **Reduced-motion (AC-10):** toggle the OS-level reduce-motion setting; load each screen and verify looping animations are static.
7. **Account deletion (AC-11):** sign in, add verses + collections, run `DELETE /api/me`, sign back in with the same Google account → empty library; verify `bibleTextCache` rows still present in DB.
8. **Privacy invariant:** with two accounts, attempt cross-user reads via direct API calls (`/api/verses/[id]` for another user's verse) — must 404. Codify as a unit test using a fake authenticated request once auth helpers are stable.
9. **First deploy:** `gcloud run deploy` from the M7 image; smoke test the live URL on iPhone SE, iPhone 14, iPad, and a 1280×800 desktop viewport.

When all nine pass, v1 is shippable.

## Files to create (summary count)

- `.devcontainer/devcontainer.json` (+ optional `Dockerfile`)
- ~30 route files under `app/`
- ~24 component files under `components/`
- ~13 lib modules under `lib/`
- 2 db files (`schema.ts`, `client.ts`) + Drizzle migrations
- 2 style files (`tokens.css`, `animations.css`)
- 9 unit test files + 1 manual-AC checklist
- 5 sound assets in `public/sounds/`
- 7 root config files (`package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `drizzle.config.ts`, `Dockerfile`, `.env.example`)

Total: ~90 production source files. No more.
