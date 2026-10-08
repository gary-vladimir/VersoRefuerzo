# Testing

- [Automated tests](#automated-tests)
- [Manual test plan](#manual-test-plan)
- [Known limitations](#known-limitations)

---

## Automated tests

```bash
pnpm test          # run once
pnpm test:watch    # re-run on save
```

The suite uses Vitest and runs without a database or network: route tests
use an in-memory fake (`tests/helpers/fakeDb.ts`).

| Area | Suites |
| --- | --- |
| Scheduler | `sm2`, `queue`, `chunk`, `cloze`, `mastery`, `streak` |
| Bible text | `reference` (parsing and Bible order), `groups` (book groups), `text` (cleanup), `tokenize`, `compare` (typed answers), `defaults` |
| Practice | `source` (source pools), `scramble`, `focus` (tab bar hidden in sessions) |
| API routes | `practiceSessions.route`, `statsHome.route`, `me.route` |
| Other | `validation` (Zod schemas), `sounds`, `sanity` |

**CI.** `.github/workflows/ci.yml` runs on every push and pull request:
migration check, lint, tests, production build and typecheck. Run the same
checks locally before pushing:

```bash
pnpm check:migrations && pnpm lint && pnpm test && pnpm typecheck && pnpm build
```

## Manual test plan

Run these against `pnpm dev` (see [DEVELOPMENT.md](DEVELOPMENT.md)) or the
live site. Each section takes one to three minutes. Use a test account, or
delete what you add afterwards.

### 1. Sign in

1. Open the app in a private window. You land on `/login`, a dark night
   gradient screen with **Continuar con Google**.
2. Sign in. The first time, an onboarding screen appears; after that you
   go straight to Home.
3. DevTools → Application → Cookies: a `__session` cookie exists and is
   HttpOnly.
4. On a phone, sign-in uses a full-page redirect instead of a popup and
   returns you to Home.

### 2. Home and the guide

1. Home greets you by first name and shows the **Cómo funciona** card with
   three steps.
2. **Ver la guía** opens `/guide`: an intro, three steps, the four grades,
   the five modes, library tips.
3. **Entendido** (or the X) hides the card, and it stays hidden after a
   reload. The guide is still reachable from the profile sheet.

### 3. Add a verse

1. Tap **Agregar verso** (sidebar on desktop, `+` button on phones).
2. The form opens with a short explanation and the label **Cita bíblica a
   memorizar**.
3. Type `Filipenses 4:13`. A green check appears, and within a second the
   **Así dice el verso** preview shows the text and its copyright line.
4. Change the version dropdown from **NBLA · Nueva Biblia de las Américas**
   to **NTV · Nueva Traducción Viviente**. The preview updates.
5. Type something that is not a single verse, such as `Juan` or `hola`: no green check,
   no preview, the save button stays disabled.
6. Pick a color and icon, add a hint, save. The verse appears on Home and in
   the Library.
7. Open the verse: the card shows the icon and citation. Flip it to see the
   text and copyright.

### 4. Library

1. *Biblioteca → Colecciones*: tap **Nueva colección**, create `Promesas`.
   It opens the collection form, not the New Verse form.
2. Edit a verse (verse menu → *Editar*) and add it to the collection. A
   verse can be in several collections.
3. Under **Por libro**, each book you have verses from appears on its own,
   with Antiguo or Nuevo Testamento, plus the Gospels group when it applies.
4. *Todos los versos*: verses are in Bible order (Génesis before Salmos
   before Juan; chapters and verses numerically).
5. The status chips (Todos, Nuevos, Aprendiendo, Dominados), the collection
   chips, the book dropdown and search all combine.
6. Delete a verse: a toast offers **Deshacer** for 5 seconds. Undo brings it
   back; without undo it stays gone after a reload.

### 5. Classic practice

1. With a few verses added, Home reads "N versos para hoy". Tap it.
2. The first time, a tip suggests reciting out loud.
3. Read the citation, recite, tap **Revelar verso**. The four grades show
   their next interval (Otra vez, Difícil, Bien, Fácil). Fácil always shows
   a longer interval than Bien.
4. Grade **Otra vez**: the card comes back later in the same session.
5. Finish the queue: a summary screen appears, and Home's streak reads 1
   (or one more than before).
6. Also try **Pista** (when the verse has a hint), **Saltar** (moves the
   card to the end) and **Escribirlo** (type the verse; it is auto-graded
   with a percentage and you can still change the grade).
7. On a phone, the bottom tab bar is hidden during the session and every
   button is visible without scrolling. The X at the top leaves the
   session.

### 6. Choosing what to practice

1. *Practicar* shows **Practicar desde**: Todos, Colección, Personalizar.
2. **Colección** lists your collections and the automatic book groups. Pick
   one and start Clásico: the URL contains
   `?source=collection&collectionId=...` or `?source=book&book=...`, and only
   those verses appear.
3. **Personalizar**: pick two verses and start a game. Only those two come
   up, even after "Otro verso".
4. Copy a session URL into a new tab: the same pool is used.
5. Edit the URL to a nonexistent collection ID: it falls back to all verses
   instead of failing.
6. From a collection's page, **Practicar esta colección** starts a scoped
   Classic session.

### 7. The other modes

- **Primera letra.** The verse shows only first letters with punctuation
  kept. Reveal and grade as in Classic.
- **Palabras revueltas.** Tap the words in order; three lives. Verses over
  25 words are split into rounds. Finishing marks the verse practiced
  today but does not move its schedule.
- **Empareja versos.** Match citations with hints or opening words. Each
  match is recorded. If text is used as a hint, a copyright line appears.
- **Completa el verso.** Choose the missing word among four. The number of
  blanks grows with practice; past half the words it counts as recall.

### 8. Profile sheet

1. Tap your avatar (or the user card in the desktop sidebar).
2. Switch **ES / EN**: the interface changes language without a reload.
3. Turn **sound** off and on.
4. **Cómo funciona** opens the guide.
5. **Cerrar sesión** returns to `/login`. Signing in again skips onboarding.

### 9. Responsive layout and accessibility

1. At 375px wide: bottom tab bar, `+` button, no sidebar. At 1280px: sidebar
   with **Agregar verso**, no tab bar, no `+` button. Nothing overlaps at
   any width.
2. Turn on *Reduce motion* (system setting, or DevTools → Rendering).
   Looping animations stop and card flips become a short fade.
3. With a dark-mode browser extension active, the site keeps its light
   design.

### 10. Errors

1. Visit a route that does not exist: a "No encontramos esta página" card
   with a link home.
2. Point `DATABASE_URL` at a bad host and load Home: an "Algo salió mal"
   card with **Reintentar**. Restore `.env` afterwards.
3. With network throttling, navigating between tabs shows a skeleton
   instead of freezing.

### 11. Account deletion

1. Profile sheet → **Borrar cuenta** → confirm. You land on `/login`.
2. Sign in again with the same account: the library is empty and Home shows
   the new-account state.
3. The shared text cache still has the verses you added (check
   `bible_text_cache` in `pnpm db:studio`).

## Known limitations

- The streak update is a separate write after the session and verse update.
  If it is lost, it corrects itself on the next session.
- Palabras revueltas and Empareja versos use tap to place, not drag and
  drop.
- Palabras revueltas splits long verses at punctuation, so rounds can be
  uneven (a 3-word round next to a 10-word one).
- Moving a verse between collections is done from *Editar*; there is no
  quick-move dialog and no bulk add.
- The error and not-found screens are always in Spanish, because they render
  outside a signed-in session.
- Only NBLA and NTV are available with the current API.Bible key. NVI and
  RVR1960 are supported by the code but need a key that serves them.
