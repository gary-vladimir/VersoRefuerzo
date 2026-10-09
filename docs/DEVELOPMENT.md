# Development guide

How to run VersoRefuerzo on your own machine, from a fresh clone to a
working dev server. Plan on 30 to 40 minutes, most of it creating the free
accounts.

- [1. Prerequisites](#1-prerequisites)
- [2. Open the dev environment](#2-open-the-dev-environment)
- [3. Create the external services](#3-create-the-external-services)
- [4. Environment variables](#4-environment-variables)
- [5. Database](#5-database)
- [6. Run the app](#6-run-the-app)
- [7. Scripts](#7-scripts)
- [8. Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

One of:

- **VS Code with Docker Desktop** (recommended). The repo ships a
  devcontainer that pins Node 20, pnpm 9.15 and the editor extensions.
- **GitHub Codespaces**, which uses the same devcontainer in the cloud.
- **A native toolchain**: Node 20 or newer, pnpm 9.15 or newer, git.

And free accounts on:

- **Firebase**, for Google sign-in.
- **Neon**, for Postgres.
- **API.Bible**, for verse text.

## 2. Open the dev environment

### Devcontainer (recommended)

1. Open the folder in VS Code.
2. Click **Reopen in Container** when prompted (or run *Dev Containers:
   Reopen in Container* from the command palette).
3. Wait for the first build. `pnpm install` runs automatically.
4. Run every command below in the container's terminal.

```bash
node --version   # v20.x
pnpm --version   # 9.15.x
```

### Native install

```bash
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
```

## 3. Create the external services

### 3.1 Firebase (Google sign-in)

1. In <https://console.firebase.google.com/> create a project. Google
   Analytics is not used, so you can turn it off.
2. **Enable Google sign-in**: *Authentication → Sign-in method → Google →
   Enable*, choose a support email, save.
3. **Authorized domains**: *Authentication → Settings → Authorized
   domains*. `localhost` is there by default.
4. **Register a web app**: *Project settings → General → Your apps → Add
   app → Web*. Skip Firebase Hosting here. Copy `apiKey`, `authDomain`,
   `projectId` and `appId` from the config shown.
5. **Service account for the server**: *Project settings → Service
   accounts → Generate new private key*. From the downloaded JSON keep
   `project_id`, `client_email` and `private_key`.

### 3.2 Neon (Postgres)

1. In <https://console.neon.tech/> create a project (the free tier is
   enough).
2. Copy the **pooled** connection string from *Connection Details*. It must
   end with `?sslmode=require`.
3. The default branch is fine. A separate dev branch keeps test data away
   from production if you deploy later.

### 3.3 API.Bible

1. Request a free key at <https://scripture.api.bible/>.
2. Find the Bible IDs your key can use. The app knows four Spanish
   versions (NBLA, NTV, NVI, RVR1960) and one English version (NIV).
3. **Check the language of every ID.** The English NIV and the Spanish NVI
   are different Bibles with similar names. Put each ID in the matching
   variable, or verses will show in the wrong language.
4. A version with no ID is simply hidden in the New Verse dropdown. The
   production key currently serves NBLA, NTV and NIV.

## 4. Environment variables

```bash
cp .env.example .env
```

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string, ending with `?sslmode=require` |
| `FIREBASE_PROJECT_ID` | Service account JSON `project_id` |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON `client_email` |
| `FIREBASE_PRIVATE_KEY` | Service account JSON `private_key`, on one line with `\n` escapes (see below) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web app config `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web app config `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web app config `projectId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app config `appId` |
| `APIBIBLE_KEY` | API.Bible dashboard |
| `APIBIBLE_ID_NBLA`, `APIBIBLE_ID_NTV`, `APIBIBLE_ID_NVI`, `APIBIBLE_ID_RVR1960` | Spanish Bible IDs from API.Bible. Leave a value empty to hide that version. NBLA is the default in Spanish. |
| `APIBIBLE_ID_NIV` | English NIV Bible ID, the default when the interface is in English |
| `SESSION_SECRET` | `openssl rand -base64 48`. Reserved for future signed cookies; not read yet. |

**`FIREBASE_PRIVATE_KEY`** contains newlines. Keep it on a single line and
write each newline as the two characters `\n`; `lib/auth/firebase-admin.ts`
turns them back into real newlines. Wrap the value in double quotes if your
editor mangles the backslashes.

`.env` is git-ignored. Never commit it.

## 5. Database

The schema is in `db/schema.ts` and the reviewed migrations are in
`db/migrations/`.

```bash
pnpm db:migrate     # apply the committed migrations (use this for real databases)
pnpm db:push        # sync the schema directly, for throwaway dev branches only
pnpm db:studio      # browse the data in Drizzle Studio
```

**Changing the schema**: edit `db/schema.ts`, then run `pnpm db:generate`.
It writes two files, `db/migrations/NNNN_name.sql` and
`db/migrations/meta/NNNN_snapshot.json`. Commit both: the snapshot is what
the next migration is diffed against. `pnpm check:migrations` (also run in
CI) fails when a snapshot is missing or the chain is broken.

## 6. Run the app

```bash
pnpm dev
```

Open <http://localhost:3000>:

1. You are sent to `/login`. Sign in with Google.
2. The first sign-in shows a short onboarding, then Home.
3. Use **Agregar verso** (sidebar on desktop, `+` button on phones) to add
   your first verse, for example `Juan 3:16`. The text preview appears
   under the citation once it is valid.
4. Home now shows "1 verso para hoy". Tap it to start a Classic session.

To try the app from a phone on the same network, start the server with
`pnpm dev -H 0.0.0.0` and add your machine's address to Firebase's
authorized domains. Google sign-in on phones uses a redirect, which works
best over https, so the deployed site is usually easier for phone testing.

## 7. Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build (standalone output, used by the Docker image) |
| `pnpm start` | Run the production build |
| `pnpm test` | Vitest unit and route tests |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:push` | Sync schema without migrations (dev branches only) |
| `pnpm db:generate` | Create a migration from schema changes |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm check:migrations` | Verify migration files, journal and snapshots agree |

## 8. Troubleshooting

**`Firebase admin env vars missing`.** `.env` is missing or was not loaded.
Run from the repo root, check the file is named exactly `.env`, restart
`pnpm dev`.

**`Failed to parse private key`.** `FIREBASE_PRIVATE_KEY` lost its
newlines. Paste it again from the JSON with literal `\n` escapes, in double
quotes.

**`auth/configuration-not-found`.** Google sign-in is not enabled in the
Firebase project, or the `NEXT_PUBLIC_FIREBASE_*` values belong to a
different project than `FIREBASE_PROJECT_ID`.

**`auth/unauthorized-domain` or the sign-in popup closes at once.** Add your
origin under *Authentication → Settings → Authorized domains*.

**Sign-in loops back to the login page.** Clear the `__session` cookie and
try again. Check that the server's `FIREBASE_PROJECT_ID` matches the web
config project.

**`DATABASE_URL is not set`.** Drizzle commands need `.env`. The dev server
loads it automatically; for other commands use `pnpm exec`.

**A version is missing from the New Verse dropdown.** Its `APIBIBLE_ID_*`
is empty or the key does not serve it. Set the ID and restart.

**Verse text shows in English.** One of the `APIBIBLE_ID_*` values points
at an English Bible. Look up the ID's language in the API.Bible dashboard.

**No sound.** The cues are synthesized with the Web Audio API
(`lib/sounds/player.ts`), there are no files to install. Check the sound
toggle in the profile sheet and that the tab is not muted.

**Build fails on `next/font`.** Next.js downloads Google Fonts during the
build. Make sure the machine has outbound https, then retry: the download
occasionally fails on its own.
