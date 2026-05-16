# M7 Review - Profile sheet, shell, sound, accessibility, deploy

## Scope

Reviewed the new commits after the current remote baseline (`cb32db1..0e0e1cfd`), focused on the M7 commits:

- `34c90b18` through `0e0e1cfd` for reduced motion, sound effects, ProfileSheet, responsive AppShell/sidebar/bottom tabs, avatar entry points, Docker/Cloud Run deployment, and the sign-out cleanup.

Checked against `specs.md` 3.1, 6.8, 6.9, 10.3, 10.4, 10.5, 16.3, 16.6, 16.8, 17.8, AC-7, AC-9, AC-10, AC-11, AC-19, and the M7 outcome in `PLAN.md`.

I did not run the app or test suite; this review is from code/git inspection, per `Codex.md` review instructions.

## Overall

M7 puts the right major pieces on the board: the profile sheet exists, the locale and sound toggles persist through `/api/me`, delete-account removes the user row and clears the session, the old standalone sign-out affordance is gone, the shell has mobile and desktop navigation components, reduced-motion CSS was expanded, and Docker/Cloud Run files were added.

The main risks are still launch-blocking for this milestone. The responsive helper classes are defeated by inline `display` styles, so mobile and desktop navigation can both render at the wrong breakpoints. Sound effects are mostly a placeholder: no audio assets are committed and the player is not wired to the required gameplay events. The Cloud Run script also appears malformed enough to fail before deployment.

## Findings

### 1. High - Mobile and desktop navigation both ignore their breakpoints

Relevant code:

- `app/globals.css:34-38` defines `.vr-mobile-only` and `.vr-desktop-only` as the breakpoint switch.
- `components/layout/BottomTabBar.tsx:35-50` applies `className="vr-mobile-only"` but also sets inline `display: "flex"`.
- `components/layout/DesktopSidebar.tsx:55-71` applies `className="vr-desktop-only"` but also sets inline `display: "flex"`.
- `components/layout/AppShell.tsx:60-82` tries to clear desktop bottom padding with CSS, but the inline `paddingBottom: 80` wins over the stylesheet rule.

Why this is a problem:

Inline `display: flex` has higher precedence than the CSS helper classes. At desktop widths, the mobile bottom tab bar remains visible even though `.vr-mobile-only` says `display: none`. At mobile widths, the fixed 240px desktop sidebar remains visible even though `.vr-desktop-only` says `display: none`, so it can cover the app content. This breaks the M7 desktop sidebar/mobile shell outcome and AC-9 responsive layout expectations.

Suggested direction:

Move the breakpoint-controlled `display` values out of inline styles and into CSS classes, or split the inline layout styles from a class-owned visibility rule that actually wins at the media query. Do the same for the main content bottom padding so desktop does not keep the mobile nav gutter. Verify at iPhone SE/iPhone 14, tablet, and 1280x800.

### 2. High - Sound effects are a no-op for the required gameplay events

Relevant code:

- `lib/sounds/player.ts:19-35` defines the five required cues and maps them to `/sounds/*.mp3`.
- `lib/sounds/player.ts:14-17` says missing files intentionally no-op and that the repo ships without audio binaries.
- `public/sounds/README.md:14-15` says real assets still need to be dropped in before shipping.
- `components/layout/ProfileSheet.tsx:81-86` is the only real `play(...)` call in app/components/lib outside the sound module.

Why this is a problem:

`specs.md` 6.9 and 16.8 require short UI feedback sounds for card flip, correct answer/quality tap, incorrect answer, session complete, and streak extended, defaulting ON with a settings toggle. The current commit adds a catalog and toggle plumbing, but no audio assets and no calls from ClassicSession, WordScramble, VerseMatch, FillTheGap, session-complete, or streak-extension surfaces. In normal practice use, users will not hear the required M7 sounds.

Suggested direction:

Commit the five short royalty-free assets, keep them under the 200ms cap, and wire `play("flip")`, `play("pluck")`, `play("thud")`, `play("chime")`, and `play("flame")` at the actual practice/result/streak events. Add one small smoke test or search-based assertion so future gameplay code cannot silently drop all sound hooks.

### 3. High - The Cloud Run deploy script likely passes invalid Cloud Build arguments

Relevant code:

- `scripts/deploy.sh:45-50` builds a `BUILD_ARGS` array where only the first element starts with `--substitutions=`.
- `scripts/deploy.sh:53-57` expands those array entries into `gcloud builds submit`, then passes a second `--substitutions=...` flag with the same Firebase values plus `_IMAGE` and `_REGION`.
- `scripts/cloudbuild.yaml:6-23` expects `_IMAGE`, `_FIREBASE_API_KEY`, `_FIREBASE_AUTH_DOMAIN`, `_FIREBASE_PROJECT_ID`, and `_FIREBASE_APP_ID` substitutions.

Why this is a problem:

The array expansion sends `_FIREBASE_AUTH_DOMAIN=...`, `_FIREBASE_PROJECT_ID=...`, and `_FIREBASE_APP_ID=...` as standalone positional arguments, not as part of the first flag. Then the command also supplies a second substitutions flag. `gcloud builds submit` is likely to reject this before the image build starts, so the M7 "Cloud Run prod deploy" path is not actually finalized.

Suggested direction:

Build one substitutions string containing `_IMAGE`, `_REGION`, and all Firebase web config values, then pass exactly one `--substitutions="$SUBSTITUTIONS"` flag to `gcloud builds submit`. A dry run with real env vars should be part of accepting this milestone.

### 4. Medium - ProfileSheet is not yet a complete keyboard-accessible modal

Relevant code:

- `components/layout/ProfileSheet.tsx:47-55` supports Escape close.
- `components/layout/ProfileSheet.tsx:121-149` renders a `role="dialog"`/`aria-modal="true"` overlay, but does not move focus into the dialog, trap focus, or restore focus to the trigger on close.
- `components/layout/HeaderAvatar.tsx:14-18` and `components/layout/DesktopSidebar.tsx:136-140` label the profile trigger with `user.displayName` instead of a localized action label.

Why this is a problem:

`specs.md` 10.4 requires keyboard-reachable UI and locale-aware labels for icon-only buttons, and AC-19 makes the avatar-triggered profile sheet a central M7 workflow. Keyboard users can open the sheet but focus may remain behind the modal, Tab can escape into the background page, and screen reader users hear a person's name rather than "Open profile/settings" in the active locale.

Suggested direction:

On open, focus the first useful control or the dialog title, trap Tab/Shift+Tab while open, restore focus to the avatar/sidebar trigger on close, add a visible close button, and use localized trigger labels such as `Abrir perfil` / `Open profile`.

### 5. Medium - Reduced-motion still misses staggered entrance animations

Relevant code:

- `styles/animations.css:90-98` applies `vr-fadeUp` and staggered delays directly to `.vr-stagger > *`.
- `styles/animations.css:129-170` handles looping animations, several named transitional helper classes, and the flip-card cross-fade, but does not override `.vr-stagger > *`.

Why this is a problem:

`specs.md` 17.8 allows transitional animations in reduced-motion mode only at reduced amplitude and specifically calls for looping animation cleanup. The new reduced-motion block catches the major looping classes and the card flip, which is good, but `vr-stagger` children still run the original 500ms fade-up with full translation and sequential delays. Pages using `.vr-stagger` can therefore still animate at the old intensity when the user has requested reduced motion.

Suggested direction:

Include `.vr-stagger > *` in the reduced-motion media block, either by disabling its animation or swapping to a lower-amplitude keyframe with shortened or removed delays. Keep the existing flip cross-fade behavior.

### 6. Medium/Low - Privacy and terms links are still missing from login/profile

Relevant code:

- `app/(auth)/login/_client.tsx:228-240` renders privacy/free text as plain copy.
- `components/layout/ProfileSheet.tsx:121-149` begins the profile dialog UI, and the changed profile surface does not add privacy or terms links.

Why this matters:

`specs.md` 10.5 requires a short privacy notice and terms to be linkable from login and profile. M7 makes ProfileSheet the account/settings hub, but it still does not expose those compliance links, and the login page only has static reassurance text.

Suggested direction:

Add compact localized links from both login and ProfileSheet to the privacy notice and terms pages or modal text before launch.

## Positive Notes

- `app/api/me/route.ts:49-57` deletes the user row and clears the session; with the existing user-owned foreign keys, this matches AC-11's hard-delete shape while leaving shared Bible cache rows intact.
- The locale toggle path is simple and appropriate: `ProfileSheet` PATCHes `/api/me` and calls `router.refresh()`, so the app can re-render in the new locale without a full browser reload.
- The sound toggle default aligns with the schema/player default, and the sheet keeps the client-side player flag in sync with persisted `users.soundEnabled`.
- Removing the obsolete `_signout-button` route-level affordance makes the ProfileSheet the single account action hub, which matches the M7 navigation direction.
