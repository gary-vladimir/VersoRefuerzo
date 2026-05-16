# M6 Review - Recognition mini-games

## Scope

Reviewed the new commits after the M5 review baseline (`f73fd072..eb0b4fd1`), with focus on the M6 recognition-game commits:

- `47e6e26b` through `eb0b4fd1` for progressive cloze, fallback distractors, Scramble, Match, Gap, and practice-hub enablement.
- The three preceding commits in the range are M5 review follow-ups and were sanity-checked only where they affect M6 session recording.

Checked against `specs.md` 6.4.2, 6.4.3, 6.4.4, 15.3, 15.4, 16.5, 16.7, AC-5, AC-14, and the M6 outcome in `PLAN.md`.

I did not run the app or test suite; this review is from code/git inspection, per `Codex.md` review instructions.

## Overall

M6 has the main surface area in place: the practice hub now links to Scramble, Match, and Gap; each route is auth-gated and playable; low-density Gap is recognition while dense Gap is promoted to recall server-side; and Scramble/Match do not advance SM-2 intervals.

The remaining risks are mostly around spec conformance and reliable outcome recording. Long-verse Scramble does not implement the required segmentation, Fill the Gap can produce undersized choice sets, hint use still changes scoring despite the later hint policy, and recognition practice still lacks the "touched today" indicator behavior described in 15.4.

## Findings

### 1. High - Scramble ignores the required 25-word segmentation

Relevant code:

- `components/practice/WordScramble.tsx:54-59` tokenizes the full verse text and shuffles every token into one chip pool.
- `components/practice/WordScramble.tsx:70-88` resolves the round only after all tokens in the full verse have been placed.

Why this is a problem:

`specs.md` 6.4.2 requires verses longer than 25 words to be split into ordered sub-segments, played one at a time. The current implementation gives the user one large shuffled pool and one shared 3-intento budget for the whole verse. Long passages become much harder than specified and can fail the "playable end-to-end" M6 outcome for realistic verse lengths.

Suggested direction:

Segment the token stream into ordered chunks of at most 25 word tokens, preserve punctuation with its word, and advance through segments before posting the final verse outcome. Add a focused test or component-level harness for a 26+ word verse so this does not regress.

### 2. High - Fill the Gap can render fewer than four answer choices

Relevant code:

- `app/(app)/practice/gap/page.tsx:60-78` uses only `pool.wordPool` when the word pool has at least five entries, then filters out correct answers, all blank answers, stopwords, numbers, and short words.
- `components/practice/FillTheGap.tsx:83-90` builds options from `correct + distractors.slice(0, 3)`.
- `components/practice/FillTheGap.tsx:318-327` renders whatever number of options were produced.

Why this is a problem:

The "library is big enough" check is based on word count, not on having three valid distractors for each blank. A one-verse library with five words can skip the fallback pool entirely, then filtering can leave fewer than three distractors. Higher-repetition rounds make this worse because `correctSet` excludes every blank answer in the round. The result can be one, two, or three visible choices instead of the intended four-button multiple-choice row, making the correct answer obvious and weakening AC-5 coverage for small libraries.

Suggested direction:

Build distractors per blank and always top up with `fallbackPoolFor(locale)` until there are three unique valid distractors, regardless of the initial word-pool size. If a blank still cannot get three choices, resample the verse/blank plan or show a controlled "not enough options" fallback instead of an undersized quiz.

### 3. Medium - Gap hint use still caps scoring and recognition success

Relevant code:

- `components/practice/FillTheGap.tsx:114-117` marks the round as `usedHint` when the first-letter affordance is shown.
- `components/practice/FillTheGap.tsx:131-139` maps any hinted win to `outcome: "partial"` and `quality: 3`.
- `app/api/practice/sessions/route.ts:118-122` treats low-density Gap as recognition and calls `applyRecognitionTouch(..., data.outcome === "correct")`.

Why this is a problem:

`specs.md` 16.5 says hints should be recorded but should not impose a quality-grade penalty, superseding the older cap language in 6.4.4. This implementation reintroduces that penalty for Gap. In low-density recognition Gap, a hinted-but-correct round is sent as `partial`, so it does not even receive the small recognition ease bump. In high-density recall Gap, the same hinted correct round is forced to quality 3 before SM-2 is applied.

Suggested direction:

Keep sending `usedHint: true`, but do not derive the quality/outcome from hint use alone. For auto-graded Gap, success should remain success; hint usage can still be excluded from mastery checks through the existing `usedHint` field.

### 4. Medium - Recognition practice still does not clear the due-today indicator

Relevant code:

- `app/api/practice/sessions/route.ts:118-122` routes Scramble, Match, and low-density Gap through `applyRecognitionTouch`.
- `lib/srs/sm2.ts:72-86` deliberately leaves `dueAt` unchanged and only updates `easeFactor`.
- `lib/srs/queue.ts:31-35` decides daily due status from `srsState.dueAt`; there is no separate last-practiced/touched field in the changed M6 files.

Why this is a problem:

This correctly preserves AC-14 by not advancing recognition intervals, but it misses the other half of `specs.md` 15.4: recognition should mark the verse as touched today and reset the due-today indicator. A user can successfully practice a due verse in Scramble/Match/low-density Gap and still see that verse as due today because the only queue signal remains `dueAt`.

Suggested direction:

Add a separate per-verse touch timestamp, such as `lastPracticedAt` or `lastRecognitionAt`, and have the due-today UI/queue suppress same-day recognition touches without changing the actual SM-2 `dueAt` interval.

### 5. Medium - Mini-game session writes can fail silently after the UI shows completion

Relevant code:

- `components/practice/WordScramble.tsx:110-126` posts the final round and swallows failures.
- `components/practice/VerseMatch.tsx:82-93` posts each pair result and swallows failures.
- `components/practice/FillTheGap.tsx:141-152` posts the final round and swallows failures.

Why this is a problem:

The M6 outcome says outcomes are recorded. Today the UI moves to the resolved state immediately and never checks `response.ok`. Network errors are ignored, and HTTP 400/500 responses are not caught at all by `fetch().catch(...)`. Users can see a successful round, navigate away, and lose the session, SRS touch, and streak credit without any visible retry path. Match is especially exposed because a round is split across multiple per-pair POSTs, so partial hidden history is possible.

Suggested direction:

Track a pending/submitted/error state for each game, check `response.ok`, and keep a retry path when recording fails. For Match, consider batching the whole round or making pair writes idempotent.

### 6. Medium/Low - Verse Match can show Bible-text hints without attribution

Relevant code:

- `components/practice/VerseMatch.tsx:51-56` falls back to the first three cached Bible words when a user hint is missing.
- `components/practice/VerseMatch.tsx:180-331` renders the board and result state without any copyright text.
- `app/(app)/practice/match/page.tsx:23-40` passes `pool.verses` through, but the component does not render the `copyright` values.

Why this matters:

Word Scramble and Fill the Gap render the cached Bible copyright when they display verse text. Match can also display Bible text through the three-word fallback hint, but it drops attribution. This is small visually, but it is inconsistent with the rest of the app and risky for API.Bible attribution compliance.

Suggested direction:

Render compact attribution for the Bible versions represented in the round, deduplicated if several cards share the same copyright string.

### 7. Carryover - Practice-session persistence is still non-atomic

Relevant code:

- `app/api/practice/sessions/route.ts:126-137` inserts the session row.
- `app/api/practice/sessions/route.ts:159-168` updates verse SRS/mastery/status.
- `app/api/practice/sessions/route.ts:183-197` updates the user streak.

Why this still matters:

This was already noted in prior reviews, but M6 expands the number of client entry points that depend on this route. A failure between these writes can leave a recorded game outcome without the matching verse state or streak update, or vice versa.

Suggested direction:

Wrap session insert, verse update, and streak update in a single transaction so each practice attempt is all-or-nothing.

## Positive Notes

- The server-side Gap recall promotion is computed from cached text and stored repetition count, so the client cannot spoof the density classification.
- The cloze helper has focused tests around monotonic density and the 50 percent recall boundary.
- Scramble and Match preserve the AC-14 behavior that recognition games do not advance SM-2 intervals.
- The M5 follow-up commits in the reviewed range address the prior chunk-stage, first-letter newline, and typed auto-grade visibility issues.
