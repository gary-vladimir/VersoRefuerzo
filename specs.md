# VersoRefuerzo — Product & Engineering Specification (v1)

**Status:** Approved for implementation
**Audience:** Software engineers, designers, QA
**Source of truth:** This document. The accompanying HTML/CSS/JS design bundle (`VersoRefuerzo.html` + supporting `*.jsx`, `tokens.jsx`, `animations.css`) is the canonical visual reference; this spec governs requirements, behavior, and scope.

---

## 1. Summary

VersoRefuerzo is a free, ad-free, bilingual (Spanish primary, English secondary) web application that helps Christian users **memorize Bible verses** through science-based spaced repetition and a small set of focused mini-games. Each user maintains a **100% private** library of verses, organized into user-defined collections, and practices them daily.

The product's design philosophy is **"útil > fancy"**: every animation, screen, and feature must directly serve memorization or library management. Anything decorative-only is rejected.

The unit of value is the **verse card**: a flashcard the user creates from a Bible reference, decorated with a chosen icon and color (visual recall cues), optionally tagged with a personal hint, and assigned to one or more collections.

> **Important — read sections 15, 16, and 17 before implementing.** After the original spec was drafted, an expert review of the UX and memory-science design produced a set of binding refinements. Those refinements **supersede or extend** parts of sections 5, 6, 7, 8, 10, and 11 below. The original sections are preserved for context and rationale; where a refinement applies, the refinement wins. Each refinement explicitly cites the section it modifies.

---

## 2. Goals and non-goals

### 2.1 Goals (v1)

1. Let a logged-in user **add** a Bible verse by reference (e.g. `Juan 14:6`) and have its full text auto-loaded from API.Bible.
2. Let the user **personalize** each verse with an icon, a color, an optional hint, and one or more collections.
3. Let the user **practice** verses through five modes — Classic flashcards (SM-2), Word Scramble, Verse Match, Fill the Gap, and a Daily Streak Challenge — all driven by the same underlying verse library.
4. Drive long-term retention with a **spaced-repetition scheduler (SM-2)** and surface daily review counts and a daily streak.
5. Deliver a **modern, minimal, animated, responsive** UI that works equally well on mobile and desktop.
6. Operate **within free-tier hosting** (Google Cloud / Firebase / Neon) — domain is the only paid asset.
7. Ship **bilingual ES/EN** with a runtime toggle.

### 2.2 Non-goals (v1)

The following are explicitly out of scope and must not be built:

- Social features of any kind: no friends, followers, public profiles, comments, likes, or activity feeds.
- Public or shared collections. Every user's library is private and visible only to them.
- Sharing verses to social media, exporting verse cards as images, or any outbound sharing flow.
- Ads, paid tiers, in-app purchases, donations, or any monetization.
- Aggregate analytics dashboards beyond the small surface defined in §6.6 (no activity charts, no calendar heatmaps, no leaderboards).
- Text-to-speech / audio recitation of verses. Only short UI feedback sounds are in scope.
- AI-generated content (auto-generated hints, AI tutoring, etc.).
- Multi-device real-time sync UI (the data is in the cloud and will sync passively, but no real-time collaboration features).
- Native mobile apps. The app is a responsive web app.
- Offline support / Progressive Web App installability (deferred to v2 — see §13).

---

## 3. User and auth

### 3.1 Identity

- **Sign-in method:** Google sign-in only, via Firebase Authentication. No email/password, no Apple, no anonymous mode in v1.
- A user account is created on first successful Google sign-in. The user's display name, profile photo, and email come from the Google profile.
- Sign-out is available from the profile area.
- Account deletion (right-to-erasure) must be available from settings; on deletion, all user-owned data is hard-deleted from the database. Verses in the shared verse-text cache (§9.3) are not user-owned and are retained.

### 3.2 Privacy

- Every user's library (verses, collections, hints, mastery state, streaks) is private and accessible only to that user. No user can see another user's data.
- The app must surface this guarantee in marketing copy on the login screen ("100% privado · Sin anuncios").

---

## 4. Core domain concepts

The product revolves around five entities. Engineers should treat these as the durable nouns of the system.

### 4.1 Verse

A user-owned flashcard for a specific Bible passage in a specific version.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | server-generated |
| `userId` | uuid | owner |
| `reference` | string | normalized canonical form, e.g. `JHN.14.6` |
| `referenceDisplay` | string | what to render, e.g. `Juan 14:6` (ES) or `John 14:6` (EN), derived from canonical ref + locale |
| `version` | enum | one of the versions available at runtime (see §9.2). Examples: `NBLA`, `NVI`, `RVR1960` |
| `icon` | string | one of the 18 catalog icons (§7.4) |
| `color` | string | one of the 8 catalog colors (§7.3) |
| `hint` | string \| null | optional, free text, max 120 chars |
| `collectionIds` | uuid[] | a verse may belong to **zero or more** collections |
| `srsState` | object | SM-2 state: `easeFactor`, `interval`, `repetitions`, `dueAt` |
| `mastery` | float 0..1 | derived from SM-2; see §6.5 |
| `status` | enum | derived: `new` / `learning` / `mastered` (§6.5) |
| `createdAt`, `updatedAt` | timestamp | |

The verse's text is **not** stored on the verse row. It is fetched from a shared cache keyed by `(reference, version)` so the same passage in the same version is fetched once across the entire system (§9.3).

### 4.2 Collection

A user-owned named bucket for verses (e.g. "Romanos", "Promesas", "Mañana").

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `userId` | uuid | owner |
| `name` | string | unique per user, max 40 chars |
| `description` | string \| null | optional, max 120 chars |
| `colorKey` | string | one of the 8 collection-tag colors (§7.5) |
| `createdAt`, `updatedAt` | timestamp | |

A verse–collection link is many-to-many. Deleting a collection un-links its verses but does **not** delete them.

### 4.3 Bible-text cache entry

A globally shared cache row keyed by `(reference, version)`, populated on first fetch from API.Bible. Used by all users. See §9.3.

### 4.4 Practice session

A short, transient record of one practice attempt at one verse in one mode. Used to drive the SRS scheduler and the streak. Persisted for the minimum required to power the scheduler; older session records may be pruned.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `userId`, `verseId`, `mode` | refs / enum | mode ∈ {`classic`, `scramble`, `match`, `gap`, `streak-challenge`} |
| `quality` | int 0..5 | SM-2 quality grade (only set for `classic`; other modes map to a quality — see §6) |
| `outcome` | enum | `correct` / `partial` / `incorrect` / `gave_up` |
| `durationMs`, `usedHint`, `startedAt` | | |

### 4.5 Daily streak

A per-user counter of consecutive days on which the user completed **at least one** practice session of any kind (see §6.6).

---

## 5. Information architecture

The app exposes these top-level destinations:

| Destination | Mobile entry | Desktop entry |
| --- | --- | --- |
| **Home** | Bottom tab `Inicio` | Sidebar `Inicio` |
| **Practice** (modes hub) | Bottom tab `Practicar` | Sidebar `Practicar` |
| **Library** (collections + all verses) | Bottom tab `Biblioteca` | Sidebar `Biblioteca` and `Colecciones` |
| **Profile / Settings** | Bottom tab `Perfil` | User card (bottom of sidebar) |
| **New verse** | Floating action button on Home / Library | "Agregar verso" button at top of sidebar |

Mobile uses a bottom tab bar with four tabs (`Inicio`, `Practicar`, `Biblioteca`, `Perfil`) and a floating action button for "Agregar verso". Desktop uses a 240-px persistent left sidebar with the same destinations plus an inline collection list.

---

## 6. Functional requirements

### 6.1 Add a verse (flow)

1. User taps **Agregar verso** (FAB on mobile, button on desktop).
2. A full-screen modal / dedicated route opens with a **live preview** of the verse card at the top, regenerated whenever the user edits a field.
3. The user enters or edits:
   - **Referencia** — free-text input, e.g. `Juan 14:6`. The app validates the reference using **`bible-passage-reference-parser`**. Valid references show a green check; invalid show an inline error and disable Save.
   - **Versión** — segmented control over the runtime-available Bible versions (§9.2). Default is the user's last-used version, falling back to NBLA.
   - **Color** — one of 8 swatches (§7.3). Selection is animated; the live preview reflects the change.
   - **Ícono** — one of 18 icons (§7.4). The icon picker is an 8-column grid.
   - **Pista (opcional)** — free text, max 120 chars. The form must visibly explain that the hint stays hidden until the user gives up during practice.
   - **Colecciones** — multi-select chips. The user may also create a new collection inline ("Nueva").
4. On **Guardar verso**, the client:
   - Persists the verse row.
   - Asynchronously triggers (or hits a server endpoint that triggers) a fetch of the verse text via API.Bible if not already cached. The user is **not** blocked on this fetch on save — but the verse text must be available before the verse can be opened in any practice mode (see §9.3 for caching policy).
5. On success, the modal closes and the verse appears in the user's library and on the Home recent list.

**Design references:** `mobile-screens.jsx :: ScreenNewVerse`, with the live-preview region atop a tinted gradient backdrop that re-tints when the color changes.

### 6.2 View / edit a verse (Card View)

The card view is a dedicated screen showing one verse as a 3D-flippable card.

States, in order:

1. **Front** — color-saturated face with prominent icon, reference, version label, and one CTA `Revelar verso` (👁). Coaching copy: *"Recita el verso en voz alta. Cuando estés listo…"*. The user is expected to recite from memory before flipping. A header back-arrow returns to the previous list.
2. **Back (revealed)** — white face with the verse text in serif typography (Lora). Two CTAs: `Me rindo` (outline) and `Lo recordé` (primary). Hidden hint is **not** shown.
3. **Back + hint** — appears only after the user taps `Me rindo`. The hint slides in beneath the verse text with the `vr-hint-appear` animation. The two CTAs are replaced by three SM-2 quality buttons: `Otra vez` / `Difícil` / `Bien`.

Tapping `Lo recordé` from state 2 records SM-2 quality `4` (good). The three buttons in state 3 record SM-2 quality `1`, `2`, and `3` respectively. (See §6.4.)

The screen also shows: collection tags, current streak (flame chip), and current mastery percent. Edit and favorite buttons appear in the top-right; favorite toggles membership of the built-in `Favoritos` collection.

**Design references:** `mobile-screens.jsx :: ScreenCardView`.

### 6.3 Library

**Library** has two tabs:

- **Colecciones** (default) — a 2-column grid of collection cards on mobile (4 across on desktop). Each card shows up to three sample verses as a layered "stack of cards" visual using each verse's color/icon, plus collection name, description, and verse count.
- **Todos los versos** — a flat list of every verse in the user's library, using the slim `VerseRow` component (color stripe, icon tile, reference + first-line preview, due / mastery indicators).

A search affordance must filter both tabs. Filters by collection (chips) must be available on the All-verses tab. Tapping a collection drills into a collection detail view (same `VerseRow` list, scoped). Long-press / overflow menu on a verse offers Edit / Delete / Duplicate-to-other-collection.

### 6.4 Practice modes

The Practice hub presents 5 cards. Each mode pulls from the same source pool, configurable at the top of the hub: **Todos**, **\<a specific collection\>**, or **Personalizar** (user multi-selects individual verses).

#### 6.4.1 Classic flashcards (SM-2) — primary mode

- Shows the verse front (reference + icon + color, no text).
- User recites mentally / aloud, then taps `Revelar verso`.
- After reveal, four quality buttons are shown with predicted next-review intervals: `Otra vez` (<1m) / `Difícil` (~6m) / `Bien` (~1d) / `Fácil` (~4d).
- Quality maps to SM-2 grades 1–5 (Again=1, Hard=3, Good=4, Easy=5). Grade 2 is reserved for the post-give-up "Otra vez" path inside Card View.
- The session ends when all due verses have been reviewed or the user exits. A summary screen shows verses reviewed and total session time.
- "Necesito una pista" button is available during the recite phase and reveals the hint, but doing so caps the maximum quality grade for that review at `Difícil`.

#### 6.4.2 Word Scramble

- Shows the verse reference and version. The verse text is split into word-tokens, shuffled, and shown as draggable / tappable chips below an empty drop zone.
- The user reconstructs the verse by tapping or dragging chips into the drop zone in order. Correct placements lock with a `pop` animation; incorrect placements bounce back.
- Punctuation is attached to its preceding word so it doesn't fragment the puzzle.
- Verses longer than 25 words must be split into ordered sub-segments shown one at a time, each its own scramble round. (Avoids unmanageable difficulty on long passages.)
- **Gamification:** timer, points (faster + fewer mistakes = more points), and a 3-life system per session. Running out of lives ends the session early.
- An outcome of "completed without lives lost" maps to SM-2 quality `5`; "completed with lives lost" maps to `3`; "failed / abandoned" maps to `1`.

#### 6.4.3 Verse Match

- Shows two columns: 4–6 references on the left, 4–6 hints on the right. Hints are drawn from the verse's `hint` field, falling back to a 3-word excerpt of the verse text if `hint` is null.
- The user taps one item in each column to attempt a match. Correct pairs animate to "matched" state and dim. Wrong pairs flash red and reset.
- **Gamification:** timer, points (combo bonus for streaks of consecutive correct matches), 3 lives.
- Each successful match in this mode counts as a quality `4` review for the corresponding verse; each failed pair counts as quality `2` (only the verses involved are graded, not all verses in the round).

#### 6.4.4 Fill the Gap (cloze deletion)

- Shows the verse text with 1–3 key words replaced by blanks. Key words are chosen by removing the longest non-stopword tokens, capped per verse length.
- User picks the missing word from a 4-button multiple-choice row. Distractors are pulled from other verses in the user's library (same language) when possible.
- A "Mostrar primera letra" affordance reveals only the first character of the missing word and caps quality at `3` for that verse.
- **Gamification:** timer, points, 3 lives, optional combo multiplier for consecutive correct gaps within one verse.
- A correct, no-hint gap maps to quality `5`; with first-letter hint to `3`; failed to `1`.

#### 6.4.5 Daily Streak Challenge

- A purpose-built single-verse-a-day mode, presented as a more cinematic, dark-mode screen with a flame motif (see `games.jsx :: ScreenStreakChallenge`).
- Surfaces today's "streak verse": the most-due verse the user has not practiced today, falling back to a random `learning` verse, falling back to a random `new` verse.
- Internally runs one round of Classic flashcards on that verse.
- This mode is a convenience shortcut — **completing it is not the only way to extend the streak**. See §6.6.

### 6.5 Mastery

`mastery` is a derived float in `[0, 1]` per verse computed from the SM-2 state:

- `mastery = clamp((repetitions / 6) × 0.6 + (min(interval, 60) / 60) × 0.4, 0, 1)` (engineering may tune the constants).

The verse `status` is derived:

- `new` — `repetitions == 0`.
- `learning` — `0 < repetitions < 4` **or** `mastery < 0.7`.
- `mastered` — `repetitions ≥ 4` **and** `mastery ≥ 0.7`.

These three states drive UI labels and decorations only; the SRS scheduler operates strictly on the SM-2 fields.

### 6.6 Streak

- A per-user counter of consecutive **calendar days** (in the user's local timezone) on which the user completed **at least one practice session of any mode**, including Classic, Scramble, Match, Gap, or Daily Streak Challenge. (The Daily Streak Challenge is one entry point to the streak, not the only one — explicitly per product decision.)
- Missing a day resets the counter to `0` at the start of the next day. The user's all-time best streak is also stored.
- Surfaced as a flame chip on Home and inside Card View. **No daily-history calendar grid in v1** beyond the 7-dot "this week" strip on the Daily Streak Challenge screen.

### 6.7 Stats / progress UI scope

Only the following progress affordances are in scope for v1:

- Streak chip (current streak number) on Home, Card View, and Streak Challenge screen.
- Per-verse mastery percent and small mastery bar on `VerseRow`, on the front of `VerseCard`, and on Card View.
- "X versos para hoy" hero on Home.
- Per-session summary on completion of any practice session (verses reviewed, time spent, points earned for game modes).

The activity bar chart shown on the desktop home design (`ScreenDesktopHome`'s "últimas 4 semanas") is **out of scope for v1**. The 4-stat row at the top of the desktop home (`Versos totales`, `Memorizados`, `Aprendiendo`, `Precisión`) is **in scope** as it summarises the current library state and costs nothing to compute.

### 6.8 Internationalization

- Default locale: **Spanish (`es`)**.
- Supported alternates: **English (`en`)**.
- Toggle: in Profile / Settings. Persisted per user.
- All UI strings, button labels, and date formats must be locale-aware. The full string table for v1 is in `tokens.jsx :: T`.
- Verse references render in the locale's book-name form (`Juan 14:6` vs. `John 14:6`) but the underlying canonical reference is the same; the same cached verse text is used regardless of locale unless the version itself changes.

### 6.9 Sound effects

UI feedback sounds only. No verse recitation or TTS. The following events have a short sound:

- Card flip (subtle whoosh).
- Correct answer / quality button tap (gentle pluck).
- Incorrect answer (soft thud).
- Session complete (uplifting chime).
- Streak extended (warm flame crackle).

Sounds default to ON and can be toggled off in settings. All sounds must be < 200ms and royalty-free.

---

## 7. Visual design system

The full design tokens are defined in `versorefuerzo/project/tokens.jsx`. Engineers must port these tokens verbatim. The visual reference is `VersoRefuerzo.html` and its supporting files.

### 7.1 Typography

| Role | Family | Use |
| --- | --- | --- |
| Display | Plus Jakarta Sans 700/800 | Titles, references, button labels |
| Sans | Inter 400–700 | UI text, labels |
| Serif | Lora 400/500 italic | Verse body text only |
| Mono | JetBrains Mono | Hex codes / debug |

### 7.2 Brand gradients

Locked by token. Notable: `primary` (indigo → violet → purple), `sunrise` (amber → pink → purple), `forest`, `rose`, `sky`, `night`, `ember`. See `VR.brand`.

### 7.3 Verse-card colors (user-pickable, exactly 8)

`indigo`, `violet`, `rose`, `amber`, `emerald`, `sky`, `crimson`, `midnight`. Each defines `bg` (gradient), `solid` (single color for accents), `tint` (light backdrop), and `label`. See `VR.cardColors`.

### 7.4 Verse icons (exactly 18)

`bible`, `cross`, `dove`, `sheep`, `lion`, `fishLoaves`, `crown`, `flameSmall`, `heart`, `mountain`, `water`, `sun`, `door`, `shield`, `handPray`, `anchor`, `seed`, `book`. Heavy-stroke line style, single-color fill on white background by default; rendered white on color when placed on a colored card. See `icons.jsx`.

### 7.5 Collection-tag color system

8 named tag styles: `Romanos`, `Salmos`, `Evangelios`, `Promesas`, `Mañana`, `Memorizados`, `Favoritos`, `Proverbios`. Each defines `bg`, `fg`, `dot`. User-created collections are assigned one of these 8 keys (UI exposes the swatches at create time).

### 7.6 Spacing, radius, shadow

Locked scales. See `VR.s`, `VR.r`, `VR.shadow`. Border radius for cards is `2xl` (24px); for buttons is `full`; for input fields is `lg` (16px).

### 7.7 Animation library

Defined in `animations.css`. Each named animation has a stated purpose:

| Animation | Where it's used | Purpose |
| --- | --- | --- |
| `vr-card-rise` | Card preview, list items appearing | Entrance feedback |
| `vr-glow-pulse` | Today's-practice CTA, "Hoy" pill | Draw attention to the daily action |
| `vr-flame` | Streak chip flame icon | Reinforce streak metaphor |
| `vr-flip-card` | Card view front↔back | Active recall affordance |
| `vr-hint-appear` | Hint reveal after "Me rindo" | Make the give-up moment feel rewarding, not punitive |
| `vr-pop` | Word scramble correct placement, save check | Positive reinforcement |
| `vr-tada` | Session complete | Celebrate finishing a session |
| `vr-stagger` | List entrances | Sequential reveal of multiple items |
| `vr-twinkle`, `vr-sparkle`, `vr-float`, `vr-shimmer-text` | Login screen background, feature pills | Set tone on first-run only — must not appear on every screen |

**Rule:** any animation added by engineering that isn't on this list must be justifiable as feedback, focus direction, or transition. Decorative-only motion is rejected per the "útil > fancy" philosophy.

### 7.8 Light/dark mode

v1 is **light-mode only** for the main app. The login screen and Daily Streak Challenge screen use a dedicated dark "night" gradient as a stylistic choice — these are not a dark-mode toggle. Full system dark-mode is deferred.

---

## 8. Screens (canonical list for v1)

The design bundle defines the following screens. Engineering must implement each; visual fidelity should match the prototype within the responsive constraints of the chosen framework.

| # | Screen | Mobile | Desktop | Reference component |
| --- | --- | --- | --- | --- |
| 1 | Login | ✅ | shared layout | `ScreenLogin` |
| 2 | Home | ✅ | ✅ (sidebar layout) | `ScreenHome`, `ScreenDesktopHome` |
| 3 | New verse (modal/route) | ✅ | adapts | `ScreenNewVerse` |
| 4 | Card view (front / back / back+hint) | ✅ | adapts | `ScreenCardView` |
| 5 | Library (Colecciones tab) | ✅ | adapts | `ScreenLibrary` |
| 6 | Library (Todos los versos tab) | ✅ | adapts | derived from `VerseRow` |
| 7 | Collection detail | ✅ | adapts | derived (not in prototype, follow Library tokens) |
| 8 | Practice hub | ✅ | adapts | `ScreenPracticeHub` |
| 9 | Classic session | ✅ | adapts | `ScreenClassicSession` |
| 10 | Word Scramble | ✅ | adapts | `ScreenWordScramble` |
| 11 | Verse Match | ✅ | adapts | `ScreenVerseMatch` |
| 12 | Fill the Gap | ✅ | adapts | `ScreenFillTheGap` |
| 13 | Daily Streak Challenge | ✅ | adapts | `ScreenStreakChallenge` |
| 14 | Session summary | ✅ | adapts | not in prototype — follow visual language of Streak screen |
| 15 | Profile / Settings | ✅ | adapts | not in prototype — minimal screen with: avatar, name, email, language toggle, sound toggle, sign-out, delete account |

Desktop screens not explicitly drawn in the prototype must adopt the desktop home's frame: 240-px sidebar + main content area at `1280×800` reference.

---

## 9. External services and data

### 9.1 Hosting and infrastructure

| Concern | Choice | Rationale |
| --- | --- | --- |
| Frontend hosting | Firebase Hosting (or Cloud Run static) | Free tier, CDN, simple |
| Backend / API | Cloud Run | Free tier covers expected traffic |
| Auth | Firebase Authentication (Google provider) | Free tier, easy Google sign-in |
| Primary database | Neon Postgres | Generous free tier, serverless |
| Object storage | Not required in v1 | (no user uploads) |
| Domain | Single purchased domain (only paid asset) | |

The system must be operable entirely within free tiers under expected v1 traffic. If a service is approaching its free-tier ceiling, prefer a workaround (e.g. caching) over tier upgrade.

### 9.2 Bible versions and API.Bible integration

- Verse text is sourced from **API.Bible**.
- The available versions list at runtime is **driven by what the deployed API.Bible key actually licenses**, intersected with the v1 allowlist `{NBLA, NVI, RVR1960}`. The UI must read this list dynamically rather than hardcode it; if the deployed key only carries `{NBLA, NVI}`, then RVR1960 must be hidden from the version picker until access is granted.
- Reference parsing and validation uses **`bible-passage-reference-parser`** client-side before any request to API.Bible, so the user gets immediate feedback on invalid references and we don't burn API quota on garbage input.
- All API.Bible requests go through our backend (never directly from the client) so the API key is not exposed.

> **Note on RVR1960** — Reina-Valera 1960 is licensed by Sociedades Bíblicas Unidas and access through API.Bible may require a separate licensing agreement that is not always available on the free / public key tier. We *want* RVR1960 in v1 because it is the most widely-recognized Spanish translation among Christian users, but engineering should treat its availability as **conditional** until verified against the licensed key. If RVR1960 is unavailable at launch, the app must function fully with `{NBLA, NVI}` and document the gap on the marketing page. Re-enabling RVR1960 must be a configuration change only, not a code change. Track licensing status as an open question in the project tracker.

### 9.3 Verse-text caching

- Verse text is cached server-side in a shared table keyed by `(reference, version)`. The cache row is populated on first fetch from API.Bible and serves all subsequent reads — across all users — for free.
- This cache is **never invalidated**: Bible texts in a fixed translation do not change. (If a translation is retroactively corrected, engineering can manually purge specific rows; no scheduled invalidation.)
- The cache is the only place the verse text exists in our system. Verse rows reference it, never duplicate it.
- Implication: only the *first* user to add `Romanos 8:28 NBLA` triggers a paid API call; every subsequent user adding the same verse hits the cache for free. This is core to staying within free-tier budget.

### 9.4 Data model summary

Tables (logical names, exact schema is engineering's call):

- `users` — id, googleSub, displayName, email, photoUrl, locale, soundEnabled, createdAt, currentStreak, bestStreak, lastStreakAt.
- `collections` — id, userId, name, description, colorKey, createdAt, updatedAt.
- `verses` — id, userId, canonicalRef, version, icon, color, hint, srsState (jsonb), mastery, status, createdAt, updatedAt.
- `verse_collections` — verseId, collectionId (many-to-many).
- `bible_text_cache` — canonicalRef, version, text, copyrightAttribution, fetchedAt. Primary key `(canonicalRef, version)`.
- `practice_sessions` — id, userId, verseId, mode, quality, outcome, durationMs, usedHint, startedAt. Eligible for periodic pruning.

All user-owned tables must enforce row-level isolation by `userId` at the API layer. Direct DB exposure to clients is prohibited.

---

## 10. Non-functional requirements

### 10.1 Performance

- Initial page load on a mid-tier mobile device on 4G must be **interactive within 3 seconds**.
- Subsequent verse views must be **instant** (≤ 100ms perceived) thanks to the verse-text cache.
- Practice-session screens must not block on network for more than 200ms before showing skeleton state.

### 10.2 Cost

- The system must remain within free tiers at expected v1 scale (target: 1k MAU). The verse-text cache (§9.3) is the primary mechanism that makes this achievable.
- No feature may be added in v1 that requires per-user paid resources.

### 10.3 Responsive design

- Single codebase, two layouts:
  - Mobile (≤ 768px): bottom tab bar, FAB, single-column.
  - Desktop (≥ 1024px): persistent left sidebar, multi-column where helpful.
  - Tablet range adopts the closer layout based on viewport width.
- All screens must be tested at iPhone SE (375×667), iPhone 14 (390×844), iPad (768×1024), and 1280×800 desktop.

### 10.4 Accessibility

- All interactive elements must be keyboard-reachable and focus-visible.
- Color is never the only signal: every color-coded element (collection tag, mastery bar, due pill) must also have a text or icon affordance.
- Verse text on cards must meet WCAG AA contrast against its background. Since front cards use saturated gradients with white text, white-on-color contrast must be verified per color.
- Reduce-motion media query must disable all looping animations (`vr-flame`, `vr-twinkle`, `vr-glow-pulse`, etc.). Transitional animations (card-rise, hint-appear) may still play once.
- Screen-reader labels: all icon-only buttons must have aria-labels in the active locale.

### 10.5 Privacy and compliance

- No analytics that ship per-verse content off-device. Aggregated counts (e.g. number of verses per user) are acceptable for ops.
- A short privacy notice and terms must be linkable from login and profile.
- Account deletion (§3.1) must complete within 30 days of request and is enforced as a hard delete.

### 10.6 Browser support

- Latest two versions of Chrome, Safari, Firefox, Edge.
- iOS Safari 16+ and Android Chrome 110+.

---

## 11. Acceptance criteria for v1

The product is shippable when, end-to-end:

1. A new user can sign in with Google in under 10 seconds.
2. A new user can add their first verse (e.g. `Juan 14:6 NBLA`), see the text auto-load, assign an icon, color, hint, and a new collection, and save — without leaving the New Verse screen.
3. The verse appears on Home and inside the new collection in Library.
4. The user can open the verse from Home, see the front, flip to reveal, give up, see the hint, grade quality, and return to Home with the verse's next-due date updated.
5. The user can launch each of the 5 practice modes against a pool of at least 3 verses and complete a session in each.
6. Completing any practice session on a calendar day extends the streak; missing a day resets it.
7. Toggling language to English re-localizes the entire UI without a page reload, including the verse reference rendering.
8. The same verse-version pair, added by two different test accounts, results in **exactly one** API.Bible network call (verified via server logs).
9. All screens render correctly at the four reference viewports (§10.3).
10. The app remains usable with reduced-motion enabled.
11. Account deletion removes the user's verses, collections, and sessions but leaves shared cache rows intact.

---

## 12. Out of scope (v1) — quick reference

For unambiguous scope control, the following are **not** part of v1 and must not be implemented:

- Apple, email/password, anonymous sign-in.
- Social: profiles of others, sharing, public collections, comments.
- Activity bar chart, calendar heatmap, leaderboards, badges/achievements.
- TTS / verse audio recitation.
- Native iOS / Android apps.
- Offline mode and PWA installability (see §13).
- AI features.
- Paid plans, ads, donations.
- Multi-translation side-by-side view.
- Verse import / export (CSV, JSON).
- Notes per verse beyond the `hint` field.
- Reminders / notifications (push or email).

---

## 13. Open questions and known risks

| # | Item | Severity | Notes |
| --- | --- | --- | --- |
| 1 | RVR1960 licensing on API.Bible | Medium | See §9.2. Must be verified before launch. v1 must work without it. |
| 2 | API.Bible free-tier daily request quota | Medium | The verse-text cache mitigates, but a popular launch could hit limits before the cache warms. Consider a one-time warm-up of the most common 100 verses. |
| 3 | Streak handling across timezones | Low | Use the user's device timezone. Document that traveling across the date line could cause a one-day artifact; out of scope to fix in v1. |
| 4 | PWA / offline | Low | Deferred. Decision: v1 ships as a standard responsive web app; offline practice for cached verses is a strong v2 candidate because it complements the never-evict cache. Engineering may add a service worker for asset caching only (no offline data) if it adds < 1 day of work. |
| 5 | Punctuation in Word Scramble | Low | Tokenization rule TBD by engineering during build; the spec only requires that punctuation is attached to its preceding word. |
| 6 | Distractor word pool for Fill the Gap on small libraries | Low | If the user has < 5 verses, engineering may fall back to a curated pool of common Spanish/English words rather than block the game. |

---

## 14. References

- Design bundle: `versorefuerzo/project/VersoRefuerzo.html` (entry), with tokens (`tokens.jsx`), animations (`animations.css`), components (`components.jsx`), screens (`mobile-screens.jsx`, `desktop-screens.jsx`, `games.jsx`).
- Design intent and decisions: `versorefuerzo/chats/chat1.md`.
- Original product brief: `about.md`.
- External tools: `bible-passage-reference-parser`, API.Bible.

---

---

## 15. Memory-science enhancements (BINDING — additions to §6)

These additions strengthen the app's grounding in evidence-based memory techniques. They do not remove anything in §6; they add new modes/behaviors and adjust how the SRS scheduler weighs different practice types.

### 15.1 First-letter mode (NEW practice mode — addition to §6.4)

A new top-level practice mode joins Classic, Scramble, Match, Gap.

- **What the user sees:** the verse rendered with **only the first letter of each word** plus original punctuation. Example: *"T l p e C q m f."* for *"Todo lo puedo en Cristo que me fortalece."*
- **Interaction:** identical to Classic — user recites the full verse aloud or in their head, then taps `Revelar verso`. After reveal, the four SM-2 quality buttons appear.
- **Why it's here:** first-letter cueing is the single most-validated technique for verse memorization specifically; it is the bridge between "I see the whole verse" and free recall. Used by virtually every successful Bible memorization app.
- **Implementation note:** no new screen needed beyond a Classic-mode variant. Token transformation: keep the first character of each word, replace the rest with thin space or invisible spacer; preserve original punctuation, line breaks, and capitalization.
- **Classification:** counts as a **RECALL** mode (advances the SM-2 schedule normally — see §15.4).
- **Practice hub placement:** sits next to Classic, presented as a primary mode (not a mini-game).

### 15.2 Typed-recall (option inside Classic mode — addition to §6.4.1)

A second action available during a Classic session.

- **Interaction:** in addition to the existing `Revelar verso` button, the user sees a secondary `Escribirlo` ("Type it") button.
- Tapping `Escribirlo` swaps the front-of-card prompt for a multi-line text input. The user types the verse from memory and submits.
- **Tolerant comparison** between the typed input and the canonical text:
  - case-insensitive
  - accent-insensitive (`á` matches `a`)
  - punctuation-insensitive (commas, semicolons, em-dashes, etc. ignored)
  - whitespace-normalized (collapses runs of spaces, ignores leading/trailing)
  - Engineering may further allow common abbreviations (e.g., "Sr." for "Señor") but is not required to in v1
- **Auto-grade based on similarity:**
  - perfect match → SM-2 quality `5` (Fácil)
  - ≥ 90% token overlap → quality `4` (Bien)
  - ≥ 50% token overlap → quality `3` (Difícil)
  - < 50% → quality `1` (Otra vez)
- The user always sees the auto-graded result and the four manual quality buttons; manual override is allowed (and logged).
- **Why it's here:** production effect — generating the answer is far stronger evidence of memory than self-reporting "Lo recordé." This is the rigorous mode for serious memorizers.
- **Classification:** counts as a **RECALL** mode (§15.4) and advances SRS aggressively.

### 15.3 Progressive cloze for "Fill the Gap" (supersedes the fixed "1–3 blanks" rule in §6.4.4)

The screen and interaction in §6.4.4 are unchanged. Only the **content density evolves with the verse's `repetitions` count**:

| Reps on this verse | Blank density |
| --- | --- |
| 0–2 | 1 blank (longest non-stopword) |
| 3–5 | 2–3 blanks |
| 6–8 | ~30–50% of words blanked |
| 9+ | ~60–80% of words blanked |

Engineering may tune the ramp; the spec only requires that the blank density grows monotonically with `repetitions`. As blank density crosses the **50% threshold**, the round is reclassified as a RECALL mode for SRS purposes (see §15.4). Multi-blank rounds present each blank in left-to-right order.

### 15.4 Differential SRS weighting: recognition vs. recall (supersedes the SM-2 mappings in §6.4.2, §6.4.3, §6.4.4)

The single most important change in this section. Not all practice is equal evidence of memory.

**RECALL modes** (drive the schedule fully):

- Classic flashcards (§6.4.1)
- First-letter mode (§15.1)
- Typed-recall variant of Classic (§15.2)
- Fill the Gap when ≥ 50% of words are blanked (§15.3, late reps)

**RECOGNITION modes** (touch but do not advance):

- Word Scramble (§6.4.2)
- Verse Match (§6.4.3)
- Fill the Gap when < 50% of words are blanked (§15.3, early reps)

**Behavior:**

- **Recall modes** apply the full SM-2 update on each grade (ease factor and interval move per the algorithm).
- **Recognition modes** mark the verse as "touched today" (resets the due-today indicator) and apply at most a small ease bump (`+0.05` ease on Easy/Good outcomes, no change on Hard/Again). They **do not advance the interval to the next stage**.
- Practical consequence: a user who only ever plays Match and Scramble will keep seeing those verses in their daily queue. They will not be silently scheduled out to long intervals. Only producing the verse from memory (recall) advances the schedule.

This is the crucial guardrail that prevents the gamified modes from overstating what the user has memorized.

### 15.5 "Mastered" requires a successful unaided recall pass (supersedes §6.5)

Strengthens the mastered definition so that the label means something.

A verse's `status` is `mastered` when **all** of:

1. `repetitions ≥ 4`, **and**
2. derived `mastery ≥ 0.7`, **and**
3. **at least one** Classic, First-letter, or Typed-recall session in the **last 30 days** completed *without using the hint* and graded `Bien` or `Fácil`

Conditions (1) and (2) are unchanged from §6.5. Condition (3) is new. The check is a query against `practice_sessions` with `mode ∈ {classic, first_letter, typed} AND usedHint = false AND quality ≥ 4 AND startedAt ≥ now - 30 days`.

The SRS scheduler itself is unaffected; this rule is a label-only guard.

### 15.6 Interleaving is the default queue order (extension of §6.4)

The "Todos" daily practice queue **interleaves verses across collections by default**. Implementation requirement:

- Within the due-today set, verses are shuffled before being presented; **do not group by collection**.
- If the user picks a specific collection from the source filter, ordering inside that filter still shuffles within the collection.
- "Block by collection" is not in v1.

Rationale: interleaved practice is more effortful per item but produces stronger long-term retention than blocked practice — well established in cognitive psychology and applicable to verse memorization.

### 15.7 Long-verse chunking in Classic mode (NEW — addition to §6.4.1)

Verses longer than 25 words are chunked progressively in **Classic mode** (the spec already chunks Word Scramble per §6.4.2; this extends the technique to the primary learning mode).

- Chunks always break at natural punctuation (period, semicolon, colon, comma when no closer break exists).
- 2 chunks for 25–50-word verses; 3 chunks for > 50-word verses.
- Cumulative growth, never partial-only:
  - Reps 0–2: practice chunk 1 alone
  - Reps 3–5: practice chunks 1+2 together
  - Reps 6+: practice the full verse
- Chunking is **invisible to the user**: the front of the card looks the same; the back simply shows a shorter text in early reps and the full text once graduated.
- A verse cannot reach `mastered` (§15.5) until it has been graded `Bien` or `Fácil` on the **full** verse (the final chunk stage), unaided, in the last 30 days.
- Engineering owns the chunk-boundary algorithm; the spec only fixes the bullets above.

### 15.8 Production-effect nudge (zero-cost addition to §6.4.1)

On the user's **first ever Classic session**, show a one-time tooltip near the front of the card:

> *"Recita el verso en voz alta — pronunciarlo mejora la memorización."*  / *"Recite the verse aloud — speaking it improves recall."*

Dismissed by tapping `OK` or by completing the first card. Never shown again. No persistence beyond a `hasSeenAloudTip` boolean on the user record.

---

## 16. UX simplifications (BINDING — supersede specific earlier sections)

These refinements reduce screens and UI states to make the daily flow faster and more honest. Where a refinement supersedes earlier text, treat the refinement as the implementation contract.

### 16.1 Direct-to-Classic from Home (supersedes the navigation flow implied in §6.4)

- Home's "X versos para hoy" hero CTA navigates **directly into a Classic session** for today's queue. It does NOT route through the Practice hub.
- The Practice hub remains accessible via the `Practicar` bottom tab and exists for picking variant modes (First-letter, Scramble, Match, Gap).
- Default daily flow: Home → tap CTA → Classic session. **Two taps to start practicing.**
- The hub is for variety, not for the canonical daily action.

### 16.2 Daily Streak Challenge as a separate mode is REMOVED (supersedes §6.4.5 and §8 row 13)

- `ScreenStreakChallenge` is **not** part of v1. The dark-mode standalone screen with the big flame and "today's streak verse" is not implemented.
- The streak motivation lives entirely on Home (the streak chip per §6.6, unchanged) and inside the Profile sheet (§16.3, may include a 7-day strip).
- The streak is still extended by completing **any** practice session in **any** mode (per §6.6, unchanged).
- The screen list in §8 shrinks from 15 to 14. The remaining canonical screens are: Login, Home (mobile + desktop), New verse, Card view (now 2 states — see §16.4), Library Colecciones, Library Todos, Collection detail, Practice hub, Classic session, First-letter session (§15.1), Word Scramble, Verse Match, Fill the Gap, Session summary, Profile sheet (§16.3).
- Rationale: streak is a metaphor, not a destination. Forcing the user to navigate to a "streak screen" is friction without payoff.

### 16.3 Three bottom tabs + avatar-as-sheet (supersedes §5)

Mobile bottom navigation is reduced from 4 tabs to 3:

| New tab | Destination |
| --- | --- |
| `Inicio` | Home |
| `Practicar` | Practice hub |
| `Biblioteca` | Library |

The `Perfil` tab is removed. Profile and settings are accessed by **tapping the user avatar in the Home header**, which opens a bottom sheet containing:

- Avatar, display name, email
- Language toggle (ES / EN)
- Sound effects toggle (default ON — see §16.8)
- Optional 7-day streak strip + best-streak record
- `Cerrar sesión` (sign-out)
- `Eliminar cuenta` (delete account, with confirmation per §3.1)

**Desktop equivalent:** the existing user card at the bottom of the sidebar (already in `desktop-screens.jsx :: DesktopSidebar`) is the entry point — clicking it opens the same content as a popover or modal.

### 16.4 Unified post-reveal grading (supersedes §6.2 states 2 and 3)

The Card View states collapse from three to two:

- **`front`** — color-saturated face with reference, icon, version. Single primary CTA `Revelar verso` (and `Escribirlo` per §15.2 if the user is in a Classic session). A small `💡 Pista` button is also present at the front, available throughout, **independent of grading**.
- **`revealed`** — white face with verse text, optional hint inline if the user tapped `💡 Pista` at any point. **Always** shows the four SM-2 quality buttons immediately: `Otra vez`, `Difícil`, `Bien`, `Fácil` with predicted intervals (`<1m`, `~6m`, `~1d`, `~4d`). The pre-grading "Lo recordé / Me rindo" pair is removed.

The hint reveal is now **orthogonal to grading**: tapping `💡 Pista` (front or back) reveals the hint via the existing `vr-hint-appear` animation. Whether the hint was used is recorded but does not constrain grading (see §16.5).

### 16.5 No quality-grade penalty for using the hint (supersedes the cap rules in §6.4.1 and §6.4.4)

- Using the hint during practice **does not cap** the achievable quality grade.
- The session record stores `usedHint: true` for analytics and for the `mastered` check in §15.5 (which excludes hint-aided sessions from counting toward mastery).
- Rationale: the user grading themselves `Difícil` is already the honest signal. Forcing an additional cap discourages a feature that exists to help.

### 16.6 Drop "Precisión" from the desktop stats row (supersedes the 4-stat list in §6.7 and §desktop-screens.jsx)

The desktop home stats row shows **3** stats, not 4: `Versos totales`, `Memorizados`, `Aprendiendo`. The fourth ("Precisión") is removed because it requires a definition that adds explanation overhead without clear user value.

### 16.7 Mini-game lives become "intentos" (tone fix — supersedes §6.4.2, §6.4.3, §6.4.4 framing)

The mechanics are unchanged (3 attempts per game session, points, timer per §2 of your earlier decision). Only the framing changes:

- All user-facing copy says **`intentos`** (Spanish) / **`tries`** (English), not `vidas` / `lives`.
- When attempts run out the round ends with neutral copy: *"Buen intento — vuelve cuando quieras."* / *"Nice try — come back anytime."*
- No "Game Over", "You lost", or punitive framing anywhere.
- Heart iconography may stay as a visual indicator of remaining intentos.

### 16.8 Sound effects default to ON (confirmation of §6.9; supersedes the per-screen suppression nuance)

- Default state for sound effects is **ON**.
- Toggle is exposed in the Profile sheet (§16.3).
- Per §16.2, the Streak Challenge screen is removed — so the prior question of suppressing sounds on that screen is moot.
- Rationale (per user decision): sounds reinforce the gamified mini-games and the celebratory feel of completing a session; users in quiet contexts can toggle off.

### 16.9 Drop "SM-2" jargon from user-facing copy (polish — extension of §6.8)

- All UI strings that reference "SM-2" are replaced with the plain phrase **"Repetición espaciada"** (or "Spaced repetition" in EN).
- Specific replacement: in `ScreenClassicSession`, the small label *"Repetición espaciada (SM-2)"* becomes *"Repetición espaciada"*.
- Engineering-facing labels, code, comments, analytics events, and this spec may continue to use SM-2 freely.

---

## 17. Polish & first-run details (additions, not replacements)

These are additions to fill gaps the original spec left to engineering judgment. None remove existing requirements.

### 17.1 Smart defaults on the New Verse form (additions to §6.1)

The New Verse form's six fields acquire the following default behavior so a returning user can add a verse with minimal friction:

| Field | Default behavior |
| --- | --- |
| `Referencia` | Required. No default. |
| `Versión` | User's last-used version, falling back to the first version present in the runtime versions list (§9.2). |
| `Color` | Auto-rotated through `cardColors`: the *N*th verse the user creates gets `cardColors[N % 8]`. User may override. |
| `Ícono` | Auto-selected based on the book in the reference, via a default lookup table. Suggested seeds (engineering owns the full table): Salmos → `sheep`, Filipenses → `flame` (or `flameSmall`), Romanos → `cross`, Proverbios → `mountain`, Juan/Mateo/Marcos/Lucas → `dove`, Apocalipsis → `crown`, Génesis → `seed`, Éxodo → `mountain`, default fallback → `bible`. User may override. |
| `Pista` | Empty by default. Remains optional. |
| `Colecciones` | Empty by default. Optional polish: if the book name (e.g., "Romanos") matches an existing user collection, surface a small `Agregar a 'Romanos'?` suggestion chip pre-checked. |

**Net effect:** *type a reference → tap Save* is a complete, valid flow. Customization remains one tap away for users who want it.

### 17.2 Empty states (NEW — additions to §5 and §6)

Each list-type destination must define explicit empty-state copy and CTA. Locale-aware per §6.8.

| Destination | Condition | Copy + CTA |
| --- | --- | --- |
| Home | 0 verses total | Single warm card: *"Comienza con tu primer verso. Te sugerimos Juan 14:6."* — tap pre-fills the New Verse form with `Juan 14:6` + the user's default version. |
| Home | 0 verses due today, library not empty | *"Todo al día. Vuelve mañana — o practica un verso aleatorio."* with secondary button `Practicar uno aleatorio`. |
| Library / Colecciones | 0 collections | Card explaining what collections are; CTA `Crear primera colección`. |
| Library / Todos los versos | 0 verses | Identical to the Home-empty case. |
| Collection detail | 0 verses in collection | *"Aún no hay versos aquí. Agrega uno para empezar."* with inline FAB. |
| Practice hub | 0 verses | *"Agrega tu primer verso para practicar."* with CTA to New Verse form. |

### 17.3 Skip-card affordance (NEW — addition to §6.2 and §6.4.1)

- During Card View and during any Classic / First-letter / Typed session, a small text-link `Saltar` is available at the bottom of the screen, visually de-emphasized.
- Tapping defers the card to the **end of the current session** without recording a `practice_sessions` row for it.
- A skipped card's SM-2 state, due date, and queue position remain unchanged.
- No streak penalty: the streak still requires *at least one completed* session that day, so skipping cards alone doesn't extend the streak (skipping all cards leaves the user with zero completed sessions for the day).

### 17.4 "Repasar ahora" button on Card View (NEW — addition to §6.2)

- Card View shows a small `Repasar ahora` link (subtle, not a primary action).
- Tapping starts a one-card Classic-mode session for that specific verse.
- The result is recorded as a normal practice session; SM-2 update and streak contribution proceed exactly as in any Classic session.
- Useful for power users who want to drill a specific verse out-of-schedule.

### 17.5 Edit and Delete UX (clarification of §6.3)

- Each `VerseRow` and each collection card exposes an overflow menu (`⋯`) on the right.
- Verse menu: `Editar`, `Mover a colección…`, `Eliminar`.
- Collection menu: `Editar`, `Eliminar`.
- Long-press on mobile opens the same menu.
- **Delete is undoable** — the action shows a Snackbar / Toast at the bottom: *"Verso eliminado · Deshacer"* / *"Verse deleted · Undo"* with a 5-second window. Tapping `Deshacer` restores the verse and all its collection memberships (or the collection and all its verse links).
- After 5 seconds without undo, the delete is committed (hard-deleted, per §3.1).
- Deleting a collection un-links its verses but does not delete them, per §4.2 (unchanged).
- `Editar` opens the same New Verse form pre-populated with the entity's current values.

### 17.6 Collection-tag color presets are unnamed (clarification of §7.5)

Section 7.5 lists eight named keys (`Romanos`, `Salmos`, `Evangelios`, `Promesas`, `Mañana`, `Memorizados`, `Favoritos`, `Proverbios`) — these names are **prototype illustration only**, not required collections, and not visible to the user as defaults.

What v1 ships:

- Eight unnamed `{bg, fg, dot}` color presets, gathered from `tokens.jsx :: VR.collectionColors`.
- Users name their own collections. At create time, the user picks one of the 8 presets via swatches.
- **Optional smart suggestion:** if a collection's name matches a known book or theme (e.g., the user types "Salmos" or "Promesas"), the system may pre-select the matching preset color. The user always overrides.
- No collections are pre-created on first sign-in. The Library starts empty (see §17.2).

### 17.7 First-run onboarding (NEW — addition to §6 and §11)

Right after the user's first successful Google sign-in, show a single onboarding screen:

- App logo + welcome line: *"Memoriza la Palabra. Una tarjeta a la vez."* / *"Memorize the Word. One card at a time."*
- Three short bullets:
  1. *"Agrega versos por referencia"* / *"Add verses by reference"*
  2. *"Personaliza con color, ícono y pista"* / *"Personalize with color, icon, and hint"*
  3. *"Practica unos minutos al día"* / *"Practice a few minutes a day"*
- Primary CTA: *"Agregar mi primer verso"* / *"Add my first verse"* — opens New Verse form pre-filled with `Juan 14:6` + the system default version (NBLA, or whatever is first in the runtime list).
- Secondary text-link: `Saltar` / `Skip` — goes to Home empty state (§17.2).
- One-time only. Persisted via a `hasCompletedOnboarding` boolean on the user record. Never shown again after first sign-in.

### 17.8 Reduce-motion compliance reminder (clarification of §10.4)

To remove ambiguity for engineering:

- All **looping** animations from `animations.css` (`vr-flame`, `vr-twinkle`, `vr-glow-pulse`, `vr-sparkle`, `vr-float`, `vr-shimmer`) MUST be disabled when the OS-level `prefers-reduced-motion: reduce` media query is set. Replace with the static end-state.
- **Transitional** animations (`vr-card-rise`, `vr-fade-up`, `vr-pop`, `vr-hint-appear`, `vr-flip-card`, `vr-tada`) MAY still play but at reduced amplitude — at minimum, halve any translation distance and disable any `scale` overshoot.
- The `vr-flip-card` 3D rotation specifically: when reduced-motion is set, replace with a 200ms cross-fade between front and back faces.

### 17.9 Updated acceptance criteria (additions to §11)

Append the following to §11. None of the originals are removed. Continues numbering from §11's criterion 11.

- **AC-12.** The user can complete a First-letter mode session against ≥ 3 verses and the verse's SM-2 state advances per §15.4.
- **AC-13.** The user can complete a typed-recall round in Classic mode; tolerant comparison correctly auto-grades a verse with one accent missing (`fortalece` ↔ `fortaléce`) as `Bien` or better.
- **AC-14.** A user who only ever plays Word Scramble or Verse Match on a verse does not see that verse's SM-2 interval advance to the next stage (per §15.4).
- **AC-15.** A verse cannot reach `mastered` status (§15.5) without at least one unaided Classic / First-letter / Typed-recall session in the last 30 days graded `Bien` or higher.
- **AC-16.** A long verse (Proverbios 3:5–6) presented in Classic mode appears chunked in early reps and as a single full verse from rep 6 onward (§15.7).
- **AC-17.** The default daily queue interleaves verses across collections (§15.6) — verified by inspecting the order of `practice_sessions` for a session against a library spanning multiple collections.
- **AC-18.** Tapping `💡 Pista` during practice does not cap the maximum quality grade (§16.5), but the session row records `usedHint: true`.
- **AC-19.** The Profile bottom sheet (§16.3) opens from the avatar tap and exposes language, sound, sign-out, and delete-account.
- **AC-20.** Deleting a verse from Library shows an undo toast for 5 seconds; tapping undo restores the verse and its collection memberships (§17.5).
- **AC-21.** Empty states render correctly for: Home (0 verses), Home (0 due, library not empty), Library Colecciones (0 collections), Collection detail (0 verses) (§17.2).
- **AC-22.** First-run onboarding is shown on first sign-in only; subsequent sign-ins go straight to Home (§17.7).

---

*End of specification.*
