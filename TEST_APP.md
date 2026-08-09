# Test the App — From Zero to Running in Dev Mode

This guide takes you from a fresh clone (only `.devcontainer/` set up,
nothing else) to a fully working local dev server, then walks through a
test of every feature.

Time budget: **about 30–40 minutes**, most of it waiting on free-tier
accounts to be created.

You need:

- VS Code with the **Dev Containers** extension installed.
- Docker Desktop running.
- A Google account (for Firebase + signing into the app).
- An email to register at Neon and API.Bible.

---

## 1. Open the project in the devcontainer

1. Open the repo folder in VS Code.
2. When prompted, click **Reopen in Container**. (Or: `Cmd+Shift+P` →
   *Dev Containers: Reopen in Container*.)
3. Wait for the first build to finish. `pnpm install` runs automatically
   inside the container.
4. Open the integrated terminal — **every command below runs inside the
   devcontainer**.

Sanity check:

```bash
node --version   # v20.x
pnpm --version   # 9.15.x
```

---

## 2. Create the three free accounts

You need three external services. All free tier. Order does not matter.

### 2.1 Firebase (Google sign-in)

1. Go to <https://console.firebase.google.com/> and click **Add project**.
   Name it whatever you want (e.g. `versorefuerzo-test`). Disable Google
   Analytics — not used.
2. **Enable Google sign-in:**
   *Build → Authentication → Get started → Sign-in method → Google →
   Enable*. Pick a support email. Save.
3. **Authorized domains:**
   *Authentication → Settings → Authorized domains*. Confirm `localhost`
   is listed (it is, by default).
4. **Register a Web app:**
   Gear icon → *Project settings → General → Your apps → Add app →
   Web (`</>`)*. Give it a nickname, skip Firebase Hosting. After
   creation you see a `firebaseConfig` block. **Copy these four values**
   somewhere temporary:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `appId`
5. **Generate an Admin SDK service account:**
   *Project settings → Service accounts → Generate new private key*. A
   JSON file downloads. Open it and grab:
   - `project_id`
   - `client_email`
   - `private_key` (the long `-----BEGIN PRIVATE KEY-----...` blob)

### 2.2 Neon (Postgres)

1. Go to <https://console.neon.tech/> and sign in. Create a new project,
   default region is fine.
2. After creation you see a **Connection string**. Pick the **Pooled
   connection** variant. It looks like:

   ```
   postgresql://USER:PASSWORD@HOST.aws.neon.tech/dbname?sslmode=require
   ```

   Copy it. Confirm it ends with `?sslmode=require`.

### 2.3 API.Bible

1. Go to <https://scripture.api.bible/> and request a free key. Approval
   is usually instant.
2. Once approved, log in to the dashboard. You get an **API key** —
   copy it.
3. Go to **My Bibles** and note the Bible IDs you have access to.
   Typical free-tier coverage:
   - **NBLA** (Nueva Biblia de las Américas) — usually granted.
   - **NVI** (Nueva Versión Internacional) — usually granted.
   - **RVR1960** (Reina-Valera 1960) — conditional; may be absent.
4. Each Bible ID looks like a 32-char hex string. Grab whichever ones
   you have. Missing versions will simply be hidden in the UI — not an
   error.

---

## 3. Configure `.env`

In the devcontainer terminal:

```bash
cp .env.example .env
```

Open `.env` and fill in each value with what you collected in step 2.

| Variable | Where it came from |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `FIREBASE_PROJECT_ID` | Service account JSON `project_id` |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON `client_email` |
| `FIREBASE_PRIVATE_KEY` | Service account JSON `private_key` (see note below) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web app config `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web app config `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web app config `projectId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web app config `appId` |
| `APIBIBLE_KEY` | API.Bible dashboard |
| `APIBIBLE_ID_NBLA` | API.Bible Bible ID for NBLA (leave blank if you don't have it) |
| `APIBIBLE_ID_NVI` | API.Bible Bible ID for NVI (leave blank if you don't have it) |
| `APIBIBLE_ID_RVR1960` | API.Bible Bible ID for RVR1960 (leave blank if you don't have it) |
| `SESSION_SECRET` | Run `openssl rand -base64 48` and paste the output |

**Critical formatting note for `FIREBASE_PRIVATE_KEY`:**

The JSON value has real newlines. In `.env`, the entire key must be on
**one line**, with every real newline replaced by the two characters
`\n`. Wrap the whole thing in double quotes so the shell doesn't strip
the backslashes:

```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
```

If you paste it correctly, `lib/auth/firebase-admin.ts` converts the
`\n` back to real newlines at runtime.

---

## 4. Create the database schema

```bash
pnpm db:push
```

This creates all six tables in your fresh Neon database. Should finish
in a few seconds with no errors.

Optional sanity check:

```bash
pnpm db:studio
```

Opens Drizzle Studio in your browser; you should see empty tables for
`users`, `verses`, `collections`, `verse_collections`,
`bible_text_cache`, `practice_sessions`. Close it when you're done.

---

## 5. Run the unit tests (optional but recommended)

```bash
pnpm test
```

All suites should pass. These cover the pure helpers (SM-2, mastery,
queue, chunking, cloze, compare, tokenize, reference, streak,
scramble). If any fail, stop and report the failure — the rest of the
test plan assumes a clean baseline.

---

## 6. Start the dev server

```bash
pnpm dev
```

Wait for `Ready in ... ms` then open <http://localhost:3000> in your
browser. The devcontainer forwards port 3000 automatically.

If you see "Compiling..." and then a redirect to `/login`, you're good.

---

## 7. Manual test plan

Run the steps below in order against the running dev server. Each section
takes 1–3 minutes. Stop and report any step that doesn't match the
expected behavior.

### 7.1 Sign in (auth + onboarding)

1. Open `http://localhost:3000/` in an **Incognito window**.
2. Expect: redirect to `/login` showing a dark night-gradient screen
   with a *Continuar con Google* button.
3. Click **Continuar con Google** → pick your Google account → grant
   permission.
4. Expect: redirect to `/onboarding` (first-run only).
5. Click **Saltar** (or the primary CTA).
6. Expect: Home with `Hola, <your-first-name>`, an empty hero, and an
   avatar in the top right.
7. Open DevTools → Application → Cookies → confirm a `__session` cookie
   exists and is `HttpOnly`.

### 7.2 Add your first verse (M2 — cache fetch)

1. From Home, tap the floating `+` button (bottom right on mobile
   widths) or **Agregar verso** in the sidebar (desktop ≥ 1024px).
2. In the reference field, type `Juan 14:6`. You should see a green
   check confirming the reference parses.
3. Pick a Bible version from the dropdown (`NBLA` if available).
4. Pick a color and an icon. Leave the hint blank (or type something
   like `camino, verdad, vida`).
5. Click **Guardar**.
6. Expect: navigation back to Home (or Library) and the new verse
   appearing in the recent list.
7. Open the verse (tap it) → the Card View should show the front (icon
   + reference). Tap to flip → the verse text from API.Bible should be
   visible plus a copyright attribution line.

**Cache invariant check (AC-8):** add the same verse a second time from
a second Google account, or just open the same verse in another browser
session. The verse text should appear instantly with no extra outbound
fetch — Drizzle Studio will show only one row in `bible_text_cache` for
that `(ref, version)`.

### 7.3 Add a collection and assign the verse

1. *Library → Colecciones* tab → tap the `+` button.
2. Create a collection called `Romanos`, pick a color.
3. Edit your verse (open it → overflow menu → *Editar*).
4. In the **Colecciones** picker, add it to `Romanos` (and also create
   and add it to another collection like `Favoritos` if you want — a
   verse can belong to several).
5. Save. The verse row should now show colored tags for each
   collection. The collection grid should reflect the membership count.

### 7.4 Edit / delete / undo (M3)

1. Tap the overflow menu on a verse row → **Eliminar**.
2. Expect a toast at the bottom: `Verso eliminado` with an **Deshacer**
   button.
3. Click **Deshacer** within 5 seconds → the verse should reappear.
4. Delete again, wait 6 seconds without clicking undo → the row should
   stay gone on refresh (the sweep on the next read finalizes the
   delete).

### 7.5 Classic practice (M4 — SRS, queue, streak)

1. Add 2–3 more verses so the queue is non-trivial (e.g.
   `Romanos 8:28`, `Salmos 23:1`).
2. Back to Home. The hero should now read `N versos para hoy` where N
   matches your count.
3. Tap the hero CTA → Classic session opens.
4. On the first card, expect a small tooltip about reciting aloud
   (`recita en voz alta`) — this only shows the very first time.
5. Read the reference, try to recall it, tap **Mostrar verso**.
6. Four quality buttons appear: **Otra vez**, **Difícil**, **Bien**,
   **Fácil**. Tap **Bien**.
7. The next card should load. After the queue empties → a session
   summary screen appears with stats.
8. Return to Home → the streak chip should now read `1` (or your
   previous streak + 1 if you practiced earlier today).

While in a session, also try:

- **Saltar** → defers the card to the end of the current session.
- **Pista** (hint) — only available if you set a hint on the verse.
- **Repasar ahora** from Card View — drops you into a one-card Classic.

### 7.6 First-letter mode (M5)

1. *Practice → Primera letra* (or `/practice/first-letter`).
2. Same Classic shell, but the verse renders as initials with original
   punctuation intact (e.g. `Y. ej. d. l. v.`).
3. Reveal → grade with quality buttons as before.

### 7.7 Typed recall (M5)

1. In a Classic session, tap **Escribirlo** before revealing.
2. Type the verse as best you can. The tolerant comparator ignores
   case, accents, punctuation, and whitespace differences.
3. Submit → expect a `100% match` / `90% match` / etc. label plus an
   *Auto-graded* hint. The quality buttons still let you override.

### 7.8 Word Scramble (M6 — recognition)

1. *Practice → Palabras revueltas*.
2. Word chips appear shuffled below the reference. Tap chips in order
   to reconstruct the verse. You have **3 intentos**.
3. For verses longer than 25 words, the round splits into ordered
   segments — verify by adding a long verse like `Salmos 1:1-3` and
   replaying.
4. Resolved correctly → the SRS interval **does not** advance (the
   verse stays due today), but `lastPracticedAt` updates so the
   due-today indicator clears for the rest of today.

### 7.9 Verse Match (M6 — recognition)

1. *Practice → Empareja versos*.
2. Cards show references on one side and previews/hints on the other.
   Tap pairs to match.
3. Verify that, if Bible text appears as a fallback hint, a small
   copyright attribution row appears at the bottom of the round.

### 7.10 Fill the Gap (M6 — progressive cloze)

1. *Practice → Completa el verso*.
2. Blanks appear in the verse text; four word choices below.
3. Early on, blank density is low (recognition). As the verse's
   repetition count grows, density crosses 50% and the round counts as
   recall — verified server-side from cached text + reps, not the
   client.
4. The hint affordance shows the first letter of the blank and does
   **not** penalize the quality grade.

### 7.11 Stats and streak rollover

1. Open Home → streak chip should reflect every practiced day.
2. Optional: in Neon Studio, edit `users.last_streak_at` to a date 2
   days ago and refresh Home. The chip should display `0` (the
   effective streak resets on missed days even before the next
   practice write).

### 7.12 Profile sheet (M7)

1. Tap your avatar in the top-right (or the user card in the desktop
   sidebar).
2. The Profile sheet opens.
3. Toggle the language between **ES** and **EN** — the entire UI
   re-renders in the new locale without a full page reload. URL stays
   the same.
4. Toggle **Sound effects** off and back on. No-ops silently if you
   haven't added MP3 files yet (expected — see note below).
5. Click **Cerrar sesión** → cookie is cleared, you land on `/login`.
6. Sign back in → goes straight to Home (no onboarding the second
   time).

### 7.13 Responsive layout (M7)

1. With DevTools open, set the viewport to iPhone SE (375px wide):
   - The bottom tab bar is visible.
   - The desktop sidebar is **not** visible.
   - The `+` FAB is visible.
2. Switch to a 1280×800 viewport:
   - The desktop sidebar appears on the left (240px gutter).
   - The bottom tab bar disappears.
   - The mobile FAB disappears (the sidebar already has *Agregar
     verso*).
3. There must be no overlap between sidebar/tab bar and the main
   content at any width.

### 7.14 Reduced motion (M7 / AC-10)

1. macOS: *System Settings → Accessibility → Display → Reduce motion* →
   ON. (Or DevTools → Rendering → Emulate CSS `prefers-reduced-motion:
   reduce`.)
2. Reload any page with the streak chip or session summary. Looping
   animations (flame, sparkles, shimmer) should be static.
3. Open a Card View. The flip should degrade to a 200ms cross-fade,
   not a 3D flip.

### 7.15 Account deletion (M7 / AC-11)

1. Profile sheet → **Borrar cuenta** → confirm.
2. You land on `/login`.
3. Sign back in with the same Google account.
4. Expect: empty Library, Home shows the new-account empty state.
5. In Neon Studio: `bible_text_cache` still contains the verse text you
   cached earlier (shared cache is preserved across account deletes).

---

## 8. Known gaps to be aware of

These are documented in `README.md` section 1 and the M6/M7 review
notes. If you hit one, it's expected, not a regression:

- The five sound MP3 files in `public/sounds/` are not committed yet;
  `lib/sounds/player.ts` no-ops silently. Toggling the switch still
  persists.
- The Profile sheet closes on Escape but does not yet trap focus
  inside the dialog.
- The login screen and Profile sheet do not yet expose privacy / terms
  links.
- The `POST /api/practice/sessions` route writes the session row,
  verse update, and streak update as three separate statements — not a
  single transaction.

---

## 9. When you're done

```bash
# In the dev server terminal
Ctrl+C
```

Optional cleanup:

- Drop your Neon project (free tier, but no reason to keep it).
- Delete the Firebase project (Settings → General → bottom of page).
- Revoke the API.Bible key from their dashboard.

Report bugs by milestone (e.g. "M3 Card View: hint button doesn't
appear") so the maintainer can route them quickly.
