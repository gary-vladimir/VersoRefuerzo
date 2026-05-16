# M5 Review - First-letter mode + Typed recall + recall classification

## Scope

Reviewed the M5 commits through `f73fd072` against `specs.md` §15.1, §15.2, §15.5, AC-12, AC-13, AC-15, and the M5 outcome in `PLAN.md`.

I did not run the app or test suite; this review is from code/git inspection, per the review instructions.

## Overall

M5 has the main surface area in place: `/practice/first-letter` reuses the Classic shell, `Escribirlo` opens a typed-recall sub-flow inside Classic, tokenizer/compare helpers have unit coverage, `first_letter` and `typed` are classified as recall modes, and the mastered guard now checks recent unaided recall rows.

The biggest issue is the interaction between M5 recall modes and the M4 long-verse chunk/full-verse guard. Typed and first-letter sessions advance SM-2, but not the stored chunk stage used to decide whether a session was a full-verse pass.

## Findings

### 1. High - Typed and first-letter recall can never record full-verse passes for long verses

Relevant code:

- `components/practice/ClassicSession.tsx:231` posts `sessionMode` for normal sessions and `"typed"` for typed recall.
- `components/practice/ClassicSession.tsx:419` sends typed-recall grades as `mode: "typed"`.
- `app/api/practice/sessions/route.ts:97-108` computes `wasFullVerse` from `verse.srsState.chunkStage`, then only advances `chunkStage` when `data.mode === "classic"`.
- `lib/practice/loadClassicQueue.ts:145-159` renders the current chunk from `stageForReps(v.srsState.repetitions, ...)`, not from stored `chunkStage`.

Why this is a problem:

First-letter and typed recall both count as RECALL modes per §15.1/§15.2, and the UI renders their long-verse chunk from the current repetition count. Successful typed/first-letter passes increment `repetitions`, so the user can eventually be shown the full verse. But the API never updates `chunkStage` for those modes, and `wasFullVerse` is still derived from the stale stored `chunkStage`.

Result: a user who practices a long verse mainly through First-letter or Typed recall can be looking at and successfully recalling the full verse while every session row is still written with `wasFullVerse: false`. `findLastUnaidedRecall` then filters those rows out, so the §15.5/§15.7 mastered guard can stay blocked indefinitely unless the user also does Classic-mode passes.

Suggested direction:

Make the "what text did the user actually practice?" source of truth consistent across queue rendering and session recording. Either advance `chunkStage` for every Classic-shell recall mode (`classic`, `first_letter`, `typed`) or stop using stored `chunkStage` for `wasFullVerse` and record the rendered stage explicitly from the client/server queue model.

Add a test that walks a long verse through typed or first-letter successful recalls until the full-verse stage and verifies the final unaided pass can satisfy mastered.

### 2. Medium - Typed recall computes a quality, but the auto-grade is not visible or auditable as an override

Relevant code:

- `components/practice/TypedRecall.tsx:57-60` computes `result.quality`.
- `components/practice/TypedRecall.tsx:138-170` shows only match percentage plus the generic "Auto-graded" label, then renders normal quality buttons.
- `components/practice/QualityButtons.tsx:19-31` has no selected/suggested quality input, so no button is highlighted as the auto grade.
- `practice_sessions` stores only final `quality`; there is no auto quality or override flag.

Why this is a problem:

M5 promises "tolerant compare auto-grades quality with manual override", and §15.2 says the user sees the auto-graded result while manual override is allowed and logged. Today the computed quality affects only display color. The user sees "100% match" or "90% match", but not the actual `Fácil`/`Bien`/`Difícil`/`Otra vez` auto-grade, and whichever button they tap becomes the only stored value.

This makes AC-13 harder to verify from the UI: the accent-missing case can compute `quality: 5`, but the screen does not explicitly show that the auto grade was Bien-or-better. It also means manual overrides are not distinguishable later from accepted auto grades.

Suggested direction:

Show the auto-grade label and/or highlight the suggested quality button. If "override logged" is meant literally for analytics/audit, store the computed auto quality separately from the final user-selected quality, or record an override flag.

### 3. Medium - First-letter rendering collapses line breaks even though §15.1 says to preserve them

Relevant code:

- `lib/bible/tokenize.ts:27-31` explicitly drops whitespace between tokens.
- `lib/bible/tokenize.ts:91-97` rejoins first-letter tokens with a single space.
- `tests/tokenize.test.ts:41-55` covers punctuation/capitalization, but only with single-line strings.

Why this is a problem:

The §15.1 implementation note says first-letter transformation should preserve punctuation, line breaks, and capitalization. The current renderer preserves punctuation and capitalization, but collapses all original whitespace and newlines into single spaces. For poetic or multi-line passages, the First-letter mode loses cadence and visual structure, which matters for memorization.

Suggested direction:

Preserve separator runs in the tokenizer/renderer, or add a first-letter renderer that transforms only word bodies while leaving the original whitespace segments intact. Add a newline-preservation test.

### 4. Medium/Low - The `was_full_verse` migration backfills old sessions as full-verse passes

Relevant code:

- `db/migrations/0002_was_full_verse.sql:1` adds `was_full_verse boolean DEFAULT true NOT NULL`.
- `lib/srs/mastery.ts:77` rejects rows where `wasFullVerse` is false.

Why this matters:

For a clean pre-production database this is harmless. But if any M4 data exists, previous chunk-only Classic sessions are backfilled as `true`, so they can satisfy the new full-verse mastered guard even though the app did not record whether the user practiced the full verse.

Suggested direction:

If existing data matters, either document that M5 requires a fresh/reset practice history, run a conservative backfill/recompute, or temporarily prevent pre-M5 sessions from satisfying the full-verse guard for long verses.

### 5. Carryover - Session writes are still non-atomic, now affecting the new recall modes too

Relevant code:

- `app/api/practice/sessions/route.ts:119-130` inserts the session row.
- `app/api/practice/sessions/route.ts:152-161` updates the verse SRS/mastery/status.
- `app/api/practice/sessions/route.ts:181-189` updates the user streak.

Why this still matters:

This was already a risk in M4, but M5 increases the impact because typed/first-letter session rows are now part of the 30-day mastered guard. A failure between the session insert, verse update, and streak update can leave the database with a recorded recall pass but stale SRS/status, or updated verse state without the corresponding streak update.

Suggested direction:

Wrap the practice-session insert, verse update, and streak update in one transaction so the practice attempt is all-or-nothing.

## Positive Notes

- The first-letter route correctly uses the Classic shell instead of creating a divergent practice screen.
- The typed comparison handles case, accents, punctuation, whitespace, and the required quality thresholds in focused unit tests.
- The mastered guard now filters to recall modes, `usedHint = false`, and `quality >= 4`, which aligns with §15.5.
- The practice hub disables M6-only modes instead of linking users into unfinished routes.
