# VersoRefuerzo

A free, ad-free, bilingual (ES/EN) web app for memorizing Bible verses with science-based spaced repetition. Built with Next.js (App Router), Firebase Authentication, Neon Postgres (Drizzle ORM), and deployed to Google Cloud Run.

The product spec is `specs.md`; the implementation plan is `PLAN.md`. Read those if you want context. To **run the app**, follow this README top to bottom.

---

## 1. What's implemented today

This README reflects the current state of the codebase. As of this commit:

- **M0 — Skeleton:** Next.js app, design tokens, animations, Drizzle wired to Neon, health route, Vitest, Dockerfile.
- **M1 — Auth + onboarding:** Google sign-in via Firebase, server-verified session cookie, `/api/me`, first-run onboarding, sign-out.
- **M2+** (verses, practice modes, etc.) — not yet implemented.

So after setup you'll be able to: sign in with Google, complete a first-run onboarding screen, see a placeholder Home, sign out. That's the full M1 surface.

---

## 2. Prerequisites

You only need **one** of:

- **VS Code + Docker Desktop** (recommended — the project ships a devcontainer that pins Node, pnpm, and toolchain versions).
- **GitHub Codespaces** (uses the same devcontainer in the cloud, zero local setup).
- **A native toolchain:** Node 20+, [pnpm 9.15+](https://pnpm.io/installation), git.

You will also need accounts on three free-tier services:

- **Firebase** — Google sign-in.
- **Neon** — Postgres database.
- **API.Bible** — verse text. *Not required for M1*; needed from M2 onward.

---

## 3. Get the code

```bash
git clone <repo-url> versorefuerzo
cd versorefuerzo
```

---

## 4. Open the dev environment

### Option A — Devcontainer (recommended)

The repo includes `.devcontainer/devcontainer.json` based on Microsoft's official Node 20 / Bookworm image, plus features for `pnpm` and `gh`. VS Code extensions for ESLint, Prettier, MDX, and a Postgres client are pre-installed.

1. Open the folder in VS Code.
2. When prompted, click **Reopen in Container** (or run *Dev Containers: Reopen in Container* from the command palette).
3. The first build takes a few minutes. `pnpm install` runs automatically as `postCreateCommand`.

GitHub Codespaces works identically — just click *Code → Codespaces → Create*.

### Option B — Native install

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
```

---

## 5. Set up external services

### 5.1 Firebase (auth)

1. Go to <https://console.firebase.google.com/> and create a project (or reuse one). Disable Google Analytics if asked — it's not used.
2. **Enable Google sign-in:** *Authentication → Sign-in method → Google → Enable*. Save.
3. **Authorize your dev origin:** *Authentication → Settings → Authorized domains*. Confirm `localhost` is listed (it is, by default). Add your production domain when you have one.
4. **Register a Web app:** *Project settings (gear icon) → General → Your apps → Add app → Web (`</>`)*. Give it a nickname; skip Firebase Hosting. Copy the config object — you'll need `apiKey`, `authDomain`, `projectId`, `appId`.
5. **Generate an Admin SDK service account:** *Project settings → Service accounts → Generate new private key*. A JSON file downloads. Open it and grab `project_id`, `client_email`, `private_key`.

### 5.2 Neon (Postgres)

1. Go to <https://console.neon.tech/> and create a project. The free tier is enough.
2. *Connection Details → Pooled connection → URL*. Copy it. It must end with `?sslmode=require`.
3. The default `main` branch is fine for development. You can create a separate `dev` branch later if you want isolated data.

### 5.3 API.Bible (M2+, can skip for now)

1. Request a free key at <https://scripture.api.bible/>.
2. After approval, find the Bible IDs you have access to (typically NBLA and NVI; RVR1960 is conditional — see `specs.md` §9.2). Note each version's `id` value.

---

## 6. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Source | Required for |
| --- | --- | --- |
| `DATABASE_URL` | Neon connection string | M0+ |
| `FIREBASE_PROJECT_ID` | Service account JSON `project_id` | M1+ |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON `client_email` | M1+ |
| `FIREBASE_PRIVATE_KEY` | Service account JSON `private_key`, **as a single line with `\n` escapes preserved** | M1+ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web app config `apiKey` | M1+ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web app config `authDomain` | M1+ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web app config `projectId` | M1+ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app config `appId` | M1+ |
| `APIBIBLE_KEY` | API.Bible dashboard | M2+ |
| `APIBIBLE_ID_NBLA` / `_NVI` / `_RVR1960` | API.Bible Bible IDs | M2+ |
| `SESSION_SECRET` | `openssl rand -base64 48` | reserved (not used in M1) |

**About `FIREBASE_PRIVATE_KEY`:** the value contains newlines. In a `.env` file, keep it on a single line and replace each real newline with the two characters `\n`. The loader in `lib/auth/firebase-admin.ts` converts them back. Wrap the value in double quotes if your editor mangles the backslashes.

`.env` is git-ignored. Never commit it.

---

## 7. Initialize the database

The schema lives in `db/schema.ts`. For M1 only the `users` table is needed. Push it to Neon:

```bash
pnpm db:push
```

This is idempotent. To inspect data later: `pnpm db:studio` (opens Drizzle Studio in your browser).

> A reviewed migration history (`db/migrations/`) will be added in a later commit. For now, `db:push` is the source of truth.

---

## 8. Run locally

```bash
pnpm dev
```

Open <http://localhost:3000>. You should be redirected to `/login`. Sign in with Google → first run sends you to `/onboarding` → click *Saltar* (or the primary CTA, which currently routes to Home until M2 ships) → you land on a placeholder Home with a sign-out button.

### Other scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server on port 3000 |
| `pnpm test` | Vitest unit tests |
| `pnpm lint` | ESLint (Next config) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm build` | Production build (standalone output) |
| `pnpm start` | Run the production build locally |
| `pnpm format` | Prettier write |
| `pnpm db:push` | Sync schema to Neon |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:generate` | Generate migration files from schema diff |

---

## 9. Smoke test the M1 flow

1. Open an Incognito window at <http://localhost:3000/> → expect redirect to `/login` (night-gradient screen).
2. Click *Continuar con Google* → choose an account → expect redirect to `/onboarding`.
3. DevTools → Application → Cookies should show an `HttpOnly` `__session` cookie.
4. Click *Saltar* → land on Home with `Hola, <name>`.
5. Click *Cerrar sesión* → cookie cleared, redirected to `/login`.
6. Sign in again → goes straight to Home (onboarding only fires once).

If something fails, see *Troubleshooting* below.

---

## 10. Production deploy (Cloud Run)

The app builds into a single container described by `Dockerfile` (Next.js standalone output, distroless-ish Alpine).

### 10.1 Build & test the image locally

```bash
docker build -t versorefuerzo .
docker run --rm -p 3000:3000 --env-file .env versorefuerzo
```

### 10.2 Deploy to Cloud Run

Prereqs: `gcloud` installed and authenticated (`gcloud auth login`), a GCP project, and the `Cloud Run`, `Artifact Registry`, and `Secret Manager` APIs enabled.

```bash
# 1. Set vars
PROJECT_ID=your-gcp-project
REGION=us-central1
SERVICE=versorefuerzo

# 2. Build & push to Artifact Registry
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE/$SERVICE

# 3. Store secrets (one-time per secret)
echo -n "$DATABASE_URL"          | gcloud secrets create DATABASE_URL          --data-file=-
echo -n "$FIREBASE_PRIVATE_KEY"  | gcloud secrets create FIREBASE_PRIVATE_KEY  --data-file=-
# ...repeat for each secret variable

# 4. Deploy
gcloud run deploy $SERVICE \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE/$SERVICE \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "FIREBASE_PROJECT_ID=...,NEXT_PUBLIC_FIREBASE_API_KEY=...,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...,NEXT_PUBLIC_FIREBASE_PROJECT_ID=...,NEXT_PUBLIC_FIREBASE_APP_ID=..." \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,FIREBASE_CLIENT_EMAIL=FIREBASE_CLIENT_EMAIL:latest,FIREBASE_PRIVATE_KEY=FIREBASE_PRIVATE_KEY:latest"
```

After deploy, copy the Cloud Run URL and add it to *Firebase → Authentication → Settings → Authorized domains*, otherwise Google sign-in will fail in production.

`NEXT_PUBLIC_*` variables must be supplied at **build time** (so they get inlined into the client bundle). Either pass them via `--build-arg` to a custom build step, or set them as plain env vars during `gcloud builds submit` using a `cloudbuild.yaml`. For dev convenience, this README sets them at deploy time — fine for first deploys, but build-time injection is preferred long-term.

---

## 11. Project layout

```
.devcontainer/        VS Code / Codespaces config
app/
  (auth)/login/       Login page (server wrapper + client UI)
  (app)/              Authenticated shell — every route here requires a session
    layout.tsx        Verifies session, enforces first-run onboarding
    page.tsx          Home placeholder
    onboarding/       First-run-only onboarding screen
  api/
    auth/session/     POST = sign in (mint cookie); DELETE = sign out
    me/               GET / PATCH / DELETE current user
    health/           Liveness probe
  layout.tsx          Root HTML, fonts
  globals.css         Imports tokens.css + animations.css
lib/
  auth/               Firebase admin/client + session cookie helpers
  i18n/strings.ts     ES/EN string table
db/
  schema.ts           Drizzle tables
  client.ts           Neon connection
styles/               Design tokens + animations (ported from DesignBundle)
middleware.ts         Edge auth gate + pathname forwarder
Dockerfile            Cloud Run container
```

`DesignBundle/` (committed) is the **canonical visual reference** — see `specs.md` §18.

---

## 12. Troubleshooting

**`Firebase admin env vars missing`** — your `.env` is missing or unloaded. Run from the repo root, ensure the file is named exactly `.env`, and restart `pnpm dev`.

**`Failed to parse private key`** — `FIREBASE_PRIVATE_KEY` lost its newlines. Re-paste the value from the JSON, keep `\n` escapes literal, wrap in double quotes.

**Sign-in popup closes immediately / `auth/unauthorized-domain`** — your origin isn't in *Firebase → Authentication → Settings → Authorized domains*. Add `localhost` (or your prod URL) and retry.

**Login redirects, then redirects again** — should not happen with current code (the redirect-loop bug was fixed). If you see it, clear the `__session` cookie in DevTools and try again; report the repro.

**`DATABASE_URL is not set`** — Drizzle commands need `.env` loaded. The dev server loads it automatically; for raw `node` invocations use `dotenv-cli` or `pnpm exec`.

**`pnpm install` is slow or fails offline** — confirm the devcontainer has internet and that pnpm's store cache (`.pnpm-store/`) is on a writable volume.

**Production build fails on `next/font`** — Next.js fetches Google fonts at build time; ensure your Cloud Build / CI environment has outbound HTTPS.

---

## 13. License & contributing

This is a non-commercial project. License TBD. Open issues / PRs on the repo.
