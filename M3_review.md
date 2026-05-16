# M3 Review

## Scope reviewed

- Re-read the project goal from `about.md`, the binding behavior in `specs.md`, and the milestone breakdown in `PLAN.md`.
- Reviewed the post-M2 git history from `422bbb1` through `7a9e88f`. This includes M2 follow-up fixes plus the M3 library, card view, edit/delete, toast, and route work.
- Inspected the current working tree. `main` is aligned with `origin/main`; `Claude.md` and `Codex.md` are untracked local handoff notes and not part of the committed milestone.
- Ran verification:
  - `corepack pnpm test`: passed, 19 tests.
  - `corepack pnpm lint`: completed with one warning in `app/(app)/verses/[id]/page.tsx`.
  - `corepack pnpm typecheck`: failed.
  - `corepack pnpm build`: failed.

## Verdict

M3 is not ready to hand off as complete. The implementation has useful progress: migrations now exist, verse edit/delete/restore routes exist, Library and collection detail pages are started, Card View exists, and verse delete undo has a working soft-delete model. However, the production build is broken, and several M3/spec requirements are either missing or implemented in a way that can corrupt user learning state or permanently lose collection organization.

## Findings

### P0 - Production build and direct typecheck fail

`corepack pnpm build` fails at `app/(app)/library/_view.tsx:257` because `EmptyCard` accepts `ctaHref: string` and passes it into typed Next `Link`. With `typedRoutes` enabled, this must be a typed route value, not a generic string. A fresh `corepack pnpm typecheck` after build generation reports the same error.

This makes the milestone non-shippable until fixed. The lint warning in `app/(app)/verses/[id]/page.tsx:14` is smaller, but should be cleaned up at the same time.

### P1 - Collection delete is not undoable and destroys collection membership immediately

Spec section 17.5 requires delete undo for both verses and collections: undo should restore the collection and all verse links within the 5 second window. The current collection API hard-deletes immediately in `app/api/collections/[id]/route.ts:97-100`, relying on FK cascade to remove `verse_collections` rows. There is no collection `deletedAt`, no restore route, and no snapshot of the original verse links.

The UI also does not expose the required collection overflow menu. `components/verse/CollectionCard.tsx` is only a link to the collection detail page. This means users have no implemented collection edit/delete flow, and if the API is called directly, collection organization is permanently lost with no undo path.

Suggested direction: implement collection delete as a reversible operation, including restoration of the original membership rows, or explicitly remove collection delete from M3 until the undo contract can be honored.

### P1 - Editing a verse reference/version keeps the old learning state

`app/api/verses/[id]/route.ts:138-139` allows `canonicalRef` and `version` to change, and `components/verse/VerseForm.tsx` exposes those fields in edit mode. The patch does not reset `srsState`, `mastery`, or `status`.

That creates a serious correctness bug: a user can change a memorized verse such as `JHN.14.6` into a different passage and the new passage inherits the old mastery percent, SRS interval, due date, and status. This corrupts the future M4 queue and can make an unlearned verse appear mastered.

Suggested direction: either disallow reference/version edits after creation, or treat such edits as replacing the learning target and reset all SRS/mastery/status fields in the same operation.

### P1 - Card View does not satisfy the spec traceability claimed by M3

M3 cites `specs.md` sections 6.2, 16.4, 17.2, 17.5 and AC-4. Section 16.4 says the revealed Card View always shows the four quality buttons. Section 17.4 adds `Repasar ahora`. Section 17.3 defines `Saltar` as deferring the card to the end of the current session.

The current Card View only flips and shows verse text/hint. After reveal it renders the text "How did it go?" with no grading buttons. `Repasar ahora` is not rendered; the latest commit explicitly dropped the deferred prop. `Saltar` just calls `router.back()` in `app/(app)/verses/[id]/_client.tsx:293-296`, which does not match the session deferral behavior.

Some of this may intentionally belong to M4, since `PLAN.md` also says M4 wires Classic sessions, skip, and `Repasar ahora`. If so, the milestone acceptance criteria and comments should be updated so M3 is not falsely claiming AC-4/Card View behavior that is not implemented.

### P2 - Verse overflow menu is incomplete

The comment in `components/verse/VerseRow.tsx:3-10` says the row renders the spec menu with `Editar`, `Mover`, and `Eliminar`, but the actual menu only contains edit and delete. Spec section 17.5 requires `Mover a coleccion...` and long-press on mobile to open the same menu.

This is a functionality gap for Library/collection management. It also makes the code comments misleading, which will slow down the next implementer.

### P2 - Library "Todos los versos" is missing collection filters

`PLAN.md:231` says the Library port includes tabs plus filters. `app/api/verses/route.ts` added `collectionId`, `q`, and `status` support, but the M3 Library UI only exposes text search in `app/(app)/library/_view.tsx`. There are no collection chips/filters on the All verses tab, and no status filter UI.

If collection filtering is intentionally API-only for now, the plan should say that. Otherwise, this is an incomplete Library implementation.

### P2 - Verse PATCH is not atomic across verse fields and collection links

`app/api/verses/[id]/route.ts` updates the verse first, then deletes all collection links, then inserts the replacement links. If the insert fails after the delete, the verse edit partially succeeds and the user loses all collection memberships for that verse.

This matters because the edit form submits verse metadata and collection membership as one logical save. Use a transaction-capable path or another atomic replacement strategy before relying on this in production.

### P2 - Current text search can use the wrong translation text

The new `/api/verses` search path fetches cached text by `canonicalRef` only and stores it in a `Map` keyed only by ref (`app/api/verses/route.ts:81-97`). If a user has the same reference in multiple versions, the search can match or miss based on a different translation's text.

The Library server page handles this better by keying cache rows as `ref|version`. The API should use the same model.

### P2 - The API.Bible "exactly one call" invariant is still not actually met

The M3 history includes a useful process-local in-flight dedupe in `lib/bible/apibible.ts`, but the comments now explicitly admit that two Cloud Run instances racing on the same uncached `(ref, version)` can both call API.Bible. That is still weaker than AC-8 and the project goal of protecting free-tier quota.

This was already called out in M2. The current code is an improvement, but it should not be considered a full resolution unless the acceptance criterion is changed or a cross-instance lock/claim mechanism is added.

### P3 - Test coverage does not cover the new M3 behavior

The test suite still only covers utilities and sanity checks. There are no route-level or component-level tests for:

- verse delete and restore within/after the undo window
- collection delete undo behavior
- edit mode preserving or resetting SRS state correctly
- Library filtering/search
- Card View reveal/hint/delete flows

This gap is especially risky because the build failure and the collection undo issue were not caught by tests.

## Positive progress

- The initial Drizzle migration and `db:migrate` script address a major M0/M2 reproducibility gap.
- `/api/verses/[id]` and `/api/verses/[id]/restore` establish the right basic shape for undoable verse delete.
- The Library and collection detail pages are real data-backed screens, not placeholders.
- The shared toast provider is a reasonable foundation for undo UX.
- Version rejection on create/edit and process-local Bible fetch dedupe are good M2 follow-up improvements, even if the cache invariant still needs a stronger design.

## Recommended next steps

1. Fix the typed route build failure and remove the unused import warning.
2. Decide whether collection edit/delete is truly in M3. If yes, implement the full undo contract including membership restoration. If no, remove or defer the API route until the UX and data model are ready.
3. Fix verse edit semantics around reference/version changes before M4 SRS work builds on corrupted state.
4. Reconcile Card View requirements between `specs.md` and `PLAN.md`, then either implement the missing actions or document them as M4 scope.
5. Add focused tests around undo, edit behavior, and Library/Card View routes before continuing into the SRS milestone.
