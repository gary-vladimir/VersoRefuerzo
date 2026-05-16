# VersoRefuerzo

A free, ad-free, bilingual (ES/EN) web app for memorizing Bible verses with
science-based spaced repetition. Built with Next.js (App Router), Firebase
Authentication, Neon Postgres (Drizzle ORM), and deployed to Google Cloud Run.

The product spec is `specs.md`; the implementation plan is `PLAN.md`. Read
those if you want context. To **run the app**, follow this README top to
bottom.

---

## 1. What's implemented

All eight milestones in `PLAN.md` (M0 through M7) are landed. The app covers
the full v1 feature surface:

- **Auth.** Google sign-in via Firebase, server-verified `__session` cookie,
  per-account locale / sound / streak persistence, first-run onboarding, hard
  account delete (`DELETE /api/me`).
- **Verses & collections.** Add a verse by reference (`Juan 14:6`), pick a
  Bible version (NBLA / NVI / RVR1960 — the picker hides versions your
  API.Bible key does not serve), color, icon, hint, and one or more
  collections. Edit, soft-delete with 5-second undo, restore.
- **Bible text cache.** Each `(canonicalRef, version)` is fetched from
  API.Bible at most once across all users; persisted to `bible_text_cache`
  and never invalidated. Account deletion leaves cache rows intact.
- **SRS engine.** SM-2 with four quality buttons (`Otra vez`, `Difícil`,
  `Bien`, `Fácil`), interleaved due-today queue, long-verse chunking, mastery
  status with a 30-day unaided full-verse recall guard, timezone-aware
  streaks.
- **Practice modes.**
  - **Classic** (recall + quality grade)
  - **First-letter** (Classic shell with first-letter rendering)
  - **Typed recall** (auto-graded with override) — accessible from Classic
  - **Word Scramble** (recognition; 25-word segmentation for long verses)
  - **Verse Match** (recognition; reference ↔ hint/preview)
  - **Fill the Gap** (recognition at low density, promoted to recall once
    blank density crosses 50%)
- **Home.** Hero CTA showing `X versos para hoy`, streak chip, recent
  verses; empty states for new accounts and zero-due days; mobile FAB +
  desktop sidebar for `Agregar verso`.
- **Profile sheet.** Locale toggle (ES↔EN, re-renders without page reload),
  sound toggle, sign out, delete account.
- **Sound effects.** Five named cues (`flip`, `pluck`, `thud`, `chime`,
  `flame`) wired to reveal, grade, round resolution, session complete, and
  streak extension. Default ON; toggle in the profile sheet. See
  `public/sounds/README.md` for the asset drop.
- **Accessibility.** Reduced-motion compliance (looping animations
  disabled; flip card cross-fades; transitional helpers play at reduced
  amplitude), responsive switch at 1024px between mobile bottom tab bar and
  desktop sidebar.
- **Deploy.** `Dockerfile` (Next.js standalone output), Cloud Build config,
  and a one-shot `scripts/deploy.sh` that builds, pushes, and deploys to
  Cloud Run with secrets from Secret Manager.

Known polish items still open (see the milestone review notes for context):

- The five MP3 cue files are not committed; `lib/sounds/player.ts` no-ops
  silently until you drop assets into `public/sounds/`.
- ProfileSheet closes on Escape but does not yet trap focus or restore it
  to the trigger.
- Login and ProfileSheet do not yet expose privacy / terms links
  (specs §10.5).
- The `practiceSessions` insert, verse update, and streak update in
  `POST /api/practice/sessions` are sequential writes, not a single
  transaction.

---

## 2. Prerequisites

You only need **one** of:

- **VS Code + Docker Desktop** (recommended — the project ships a
  devcontainer that pins Node, pnpm, and toolchain versions).
- **GitHub Codespaces** (uses the same devcontainer in the cloud, zero
  local setup).
- **A native toolchain:** Node 20+, [pnpm 9.15+](https://pnpm.io/installation), git.

You will also need accounts on three free-tier services:

- **Firebase** — Google sign-in.
- **Neon** — Postgres database.
- **API.Bible** — verse text.

---

## 3. Get the code

```bash
git clone <repo-url> versorefuerzo
cd versorefuerzo
```

---

## 4. Open the dev environment

### Option A — Devcontainer (recommended)

The repo includes `.devcontainer/devcontainer.json` based on Microsoft's
official Node 20 / Bookworm image, plus features for `pnpm` and `gh`. VS
Code extensions for ESLint, Prettier, MDX, and a Postgres client are
pre-installed.

1. Open the folder in VS Code.
2. When prompted, click **Reopen in Container** (or run *Dev Containers:
   Reopen in Container* from the command palette).
3. The first build takes a few minutes. `pnpm install` runs automatically
   as `postCreateCommand`.

GitHub Codespaces works identically — just click *Code → Codespaces →
Create*.

### Option B — Native install

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
```

---

## 5. Set up external services

### 5.1 Firebase (auth)

1. Go to <https://console.firebase.google.com/> and create a project (or
   reuse one). Disable Google Analytics if asked — it's not used.
2. **Enable Google sign-in:** *Authentication → Sign-in method → Google →
   Enable*. Save.
3. **Authorize your dev origin:** *Authentication → Settings → Authorized
   domains*. Confirm `localhost` is listed (it is, by default). Add your
   production domain when you have one.
4. **Register a Web app:** *Project settings (gear icon) → General → Your
   apps → Add app → Web (`</>`)*. Give it a nickname; skip Firebase
   Hosting. Copy the config object — you'll need `apiKey`, `authDomain`,
   `projectId`, `appId`.
5. **Generate an Admin SDK service account:** *Project settings → Service
   accounts → Generate new private key*. A JSON file downloads. Open it
   and grab `project_id`, `client_email`, `private_key`.

### 5.2 Neon (Postgres)

1. Go to <https://console.neon.tech/> and create a project. The free tier
   is enough.
2. *Connection Details → Pooled connection → URL*. Copy it. It must end
   with `?sslmode=require`.
3. The default `main` branch is fine for development. You can create a
   separate `dev` branch later if you want isolated data.

### 5.3 API.Bible

1. Request a free key at <https://scripture.api.bible/>.
2. After approval, find the Bible IDs you have access to (typically NBLA
   and NVI; RVR1960 is conditional — see `specs.md` §9.2). Note each
   version's `id` value. The `/api/bible/versions` route intersects the
   spec allowlist with the IDs you provide, so versions without an ID are
   simply hidden in the UI.

---

## 6. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Source |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string (ends with `?sslmode=require`) |
| `FIREBASE_PROJECT_ID` | Service account JSON `project_id` |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON `client_email` |
| `FIREBASE_PRIVATE_KEY` | Service account JSON `private_key`, **as a single line with `\n` escapes preserved** |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web app config `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web app config `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web app config `projectId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app config `appId` |
| `APIBIBLE_KEY` | API.Bible dashboard |
| `APIBIBLE_ID_NBLA` / `_NVI` / `_RVR1960` | API.Bible Bible IDs (leave blank to hide a version) |
| `SESSION_SECRET` | `openssl rand -base64 48` (reserved for future signed-cookie use; not read yet) |

**About `FIREBASE_PRIVATE_KEY`:** the value contains newlines. In a `.env`
file, keep it on a single line and replace each real newline with the two
characters `\n`. The loader in `lib/auth/firebase-admin.ts` converts them
back. Wrap the value in double quotes if your editor mangles the
backslashes.

`.env` is git-ignored. Never commit it.

---

## 7. Initialize the database

The schema lives in `db/schema.ts`; reviewed migrations under
`db/migrations/`.

For a **fresh** database, apply the committed migrations:

```bash
pnpm db:migrate
```

For a **scratch / dev** branch where you don't care about migration
history:

```bash
pnpm db:push
```

`db:push` is idempotent and faster, but skips the migration history.
Prefer it only on personal Neon dev branches; never on production.

To inspect data: `pnpm db:studio` (opens Drizzle Studio in your browser).

---

## 8. Run locally

```bash
pnpm dev
```

Open <http://localhost:3000>. You should be redirected to `/login`. Sign
in with Google → first run sends you to `/onboarding` → land on Home with
the `X versos para hoy` hero (zero until you add a verse) → tap the `+`
FAB or `Agregar verso` to add your first verse.

### Other scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server on port 3000 |
| `pnpm test` | Vitest unit tests (pure helpers) |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm lint` | ESLint (Next config) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm build` | Production build (standalone output) |
| `pnpm start` | Run the production build locally |
| `pnpm format` | Prettier write |
| `pnpm db:migrate` | Apply Drizzle migrations |
| `pnpm db:push` | Sync schema to Neon (dev branches only) |
| `pnpm db:generate` | Generate a new migration from schema diff |
| `pnpm db:studio` | Open Drizzle Studio |

---

## 9. Smoke test the v1 flow

1. Open an Incognito window at <http://localhost:3000/> → expect redirect
   to `/login` (night-gradient screen).
2. Click *Continuar con Google* → choose an account → expect onboarding on
   first sign-in only, then Home.
3. Add a verse: `Juan 14:6`, version `NBLA`, pick a color/icon, save.
4. From Home, tap the `1 verso para hoy` hero → Classic session opens →
   reveal → grade with `Bien` → session summary appears.
5. From Practice hub, run Word Scramble, Verse Match, and Fill the Gap on
   the same verse — recognition modes record outcomes without advancing
   the SM-2 interval.
6. Open the avatar → ProfileSheet → toggle language to EN; the UI
   re-renders in English without a full reload.
7. Toggle sound off, then back on; toggle reduces or restores audio
   feedback on subsequent interactions.
8. Open DevTools → Application → Cookies; confirm the `HttpOnly`
   `__session` cookie is present.
9. Delete account from ProfileSheet → land on `/login` → sign in again
   with the same Google account → library is empty (cache rows survive).

---

## 10. Production deploy (Cloud Run)

The app builds into a single container described by `Dockerfile` (Next.js
standalone output on Alpine). One-shot deploy lives in
`scripts/deploy.sh`, backed by `scripts/cloudbuild.yaml`.

### 10.1 One-time GCP setup

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>

# Enable required APIs
gcloud services enable run.googleapis.com \
                       artifactregistry.googleapis.com \
                       cloudbuild.googleapis.com \
                       secretmanager.googleapis.com

# Artifact Registry repo (Docker images live here)
gcloud artifacts repositories create versorefuerzo \
  --repository-format=docker --location=us-central1

# Secrets — names must match those referenced in scripts/deploy.sh
for s in DATABASE_URL FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY APIBIBLE_KEY; do
  printf '%s' "${!s}" | gcloud secrets create "$s" --data-file=-
done
```

### 10.2 Build and test the image locally (optional)

```bash
docker build -t versorefuerzo .
docker run --rm -p 3000:3000 --env-file .env versorefuerzo
```

### 10.3 Deploy

The deploy script reads `NEXT_PUBLIC_*` (build-time, baked into the
client bundle), `FIREBASE_PROJECT_ID`, `APIBIBLE_ID_*` from your shell
environment, and resolves the four server secrets from Secret Manager.

```bash
export PROJECT_ID=your-gcp-project
export REGION=us-central1                 # default
# Plus every NEXT_PUBLIC_* and FIREBASE_PROJECT_ID from your .env
./scripts/deploy.sh
```

After deploy, copy the printed Cloud Run URL into
*Firebase → Authentication → Settings → Authorized domains*, otherwise
Google sign-in will fail in production.

---

## 11. Project layout

```text
.devcontainer/        VS Code / Codespaces config
app/
  (auth)/login/       Login page (Google sign-in)
  (app)/              Authenticated shell — every route here requires a session
    layout.tsx        Verifies session, enforces first-run onboarding, mounts AppShell
    page.tsx          Home (hero CTA, streak chip, recent verses, mobile FAB)
    onboarding/       First-run-only onboarding screen
    practice/         page.tsx (hub) + classic/, first-letter/, scramble/, match/, gap/, summary/
    library/          page.tsx (Colecciones | Todos) + collections/[id]/
    verses/           new/, [id]/ (Card View), [id]/edit/
  api/
    auth/session/     POST mint cookie · DELETE clear cookie
    me/               GET / PATCH / DELETE current user
    bible/versions/   GET — runtime intersection of allowlist and API.Bible key
    bible/text/       GET — cache lookup, fetch + persist on miss
    verses/           GET / POST · [id] GET / PATCH / DELETE · [id]/restore POST
    collections/      GET / POST · [id] PATCH / DELETE
    practice/queue/   GET — interleaved due-today queue
    practice/sessions/POST — record attempt, apply SM-2 / recognition touch, update streak
    stats/home/       GET — aggregate counts for Home
    health/           Liveness probe
  layout.tsx          Root HTML, fonts, providers
  globals.css         Imports tokens.css + animations.css; responsive helpers
components/
  ui/                 VerseCard, Toast
  icons/              VerseIcons, UiIcons
  verse/              VerseRow, VerseForm, ColorPicker, IconPicker, CollectionPicker, CollectionCard
  practice/           ClassicSession, FirstLetterSession (in route), TypedRecall, WordScramble,
                      VerseMatch, FillTheGap, QualityButtons, HintButton, SkipLink, SessionSummary
  layout/             AppShell, BottomTabBar, DesktopSidebar, HeaderAvatar, ProfileSheet
  home/               StreakChip, TodayCTA
lib/
  auth/               Firebase admin/client, session cookie helpers, getServerUser
  bible/              reference parser wrapper, apibible fetcher (in-flight dedupe),
                      tokenize (first-letter / cloze), compare (tolerant typed recall),
                      fallback-distractors, smart-default catalog
  srs/                sm2, mastery, queue, chunk, cloze, scramble
  streak/             tz-aware streak engine (current / best / effective)
  practice/           loadClassicQueue, loadMiniGameVerses
  i18n/strings.ts     ES/EN string table with locale-aware helpers
  sounds/player.ts    Pooled HTMLAudioElement player, five named cues
  validation/         zod schemas for verse / collection bodies
  constants.ts        UNDO_WINDOW_MS, etc.
db/
  schema.ts           Drizzle tables (users, collections, verses, verse_collections,
                      bible_text_cache, practice_sessions)
  client.ts           Neon connection
  migrations/         0000_init, 0001_practice_sessions, 0002_was_full_verse,
                      0003_last_practiced_at
styles/               Design tokens + animations (ported from DesignBundle)
public/sounds/        Drop the five short MP3 cues here (see public/sounds/README.md)
middleware.ts         Edge auth gate + pathname forwarder
scripts/              deploy.sh, cloudbuild.yaml
tests/                Vitest unit suites for the pure helpers above
Dockerfile            Cloud Run container (standalone output)
```

`DesignBundle/` (committed) is the **canonical visual reference** — see
`specs.md` §18.

---

## 12. Troubleshooting

**`Firebase admin env vars missing`** — your `.env` is missing or
unloaded. Run from the repo root, ensure the file is named exactly
`.env`, and restart `pnpm dev`.

**`Failed to parse private key`** — `FIREBASE_PRIVATE_KEY` lost its
newlines. Re-paste the value from the JSON, keep `\n` escapes literal,
wrap in double quotes.

**Sign-in popup closes immediately / `auth/unauthorized-domain`** — your
origin isn't in *Firebase → Authentication → Settings → Authorized
domains*. Add `localhost` (or your prod URL) and retry.

**Login redirects, then redirects again** — clear the `__session` cookie
in DevTools and try again; report the repro if it persists.

**`DATABASE_URL is not set`** — Drizzle commands need `.env` loaded. The
dev server loads it automatically; for raw `node` invocations use
`dotenv-cli` or `pnpm exec`.

**A Bible version is missing from the New Verse dropdown** — your
`APIBIBLE_ID_*` for that version is empty or the upstream key does not
serve it. Fill the ID in `.env` and restart.

**No audio in practice sessions** — `public/sounds/*.mp3` is empty; the
player no-ops silently until assets are dropped in. See
`public/sounds/README.md`.

**`pnpm install` is slow or fails offline** — confirm the devcontainer
has internet and that pnpm's store cache (`.pnpm-store/`) is on a
writable volume.

**Production build fails on `next/font`** — Next.js fetches Google fonts
at build time; ensure your Cloud Build / CI environment has outbound
HTTPS.

---

## 13. License & contributing

This is a non-commercial project. License TBD. Open issues / PRs on the
repo.
