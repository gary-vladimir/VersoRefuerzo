# M4 Review — SRS engine, Classic session, queue, streak

## Scope reviewed

Reviewed `about.md`, `specs.md`, `PLAN.md`, and `Codex.md`, then inspected the M4 commit range on `main` (`origin/main..HEAD`) using git history/blame only. I did not run the app or tests because `Codex.md` restricts review inspection to git-related commands.

## Overall verdict

M4 has a strong foundation: SM-2, mastery, queue, chunking, streak helpers, practice/session APIs, Home CTA, Classic session, summary, aloud tip, skip, and `Repasar ahora` are all represented in commits. However, M4 should not be considered complete yet. Several acceptance-critical flows either do not persist the intended practice result, can show/practice blank verse text, or still miss binding spec behavior from §15-17.

## Findings

### 1. Card View still cannot grade a revealed verse

`app/(app)/verses/[id]/_client.tsx:240-252` only renders the "¿Cómo te fue?" copy after reveal, and `app/(app)/verses/[id]/_client.tsx:263-309` renders hint plus `Repasar ahora`, but no four quality buttons and no `/api/practice/sessions` call from Card View. This leaves specs §16.4 and AC-4 unmet: a user can open a verse, reveal it, and never record quality / SRS / streak unless they separately choose `Repasar ahora`. `Repasar ahora` is useful, but it is not a substitute for the required post-reveal grading in Card View.

Suggested direction: either wire the same quality-button/session-post behavior into Card View after reveal, or explicitly make Card View's reveal hand off into a one-card Classic session before claiming AC-4.

### 2. Classic session advances locally even when persistence fails

`components/practice/ClassicSession.tsx:186-203` posts the grade, but it ignores `res.ok` and catches network errors while still incrementing `reviewedRef` and advancing to the next card/summary. In a 401, 500, offline blip, or validation failure, the UI can tell the user a verse was reviewed while SM-2 state and streak were not updated. This directly undermines M4's core outcome and AC-6.

Suggested direction: only increment the reviewed count and advance after a successful 2xx response. On failure, keep the user on the current card with a retry/error affordance.

### 3. "Practicar uno aleatorio" does not actually practice a random verse

When Home has verses but none due, `app/(app)/page.tsx:142-147` shows the `Practicar uno aleatorio` CTA but links to `/practice/classic`. The Classic route then uses the due-today queue unless a specific `?verse=` is present (`app/(app)/practice/classic/page.tsx:103-117`), so this path lands in an empty queue instead of a random one-card practice session. This misses the §17.2 empty-state behavior.

Suggested direction: select a random owned verse server-side and link to `/practice/classic?verse=<id>`, or add an explicit random source mode to the queue/classic route.

### 4. Long verses can become `mastered` before the full verse is practiced

`lib/srs/chunk.ts:52-56` only reaches the final chunk stage at reps 6+, but `lib/srs/mastery.ts:44-56` allows `mastered` once reps >= 4, mastery >= 0.7, and a recent unaided recall exists. The session route applies that status directly (`app/api/practice/sessions/route.ts:144-154`) without checking whether the qualifying recall was on the full verse. With high-quality early reviews, a long verse can be marked mastered around rep 4 while still practicing only chunks 1+2. This violates §15.7 and weakens AC-16.

Suggested direction: include full-verse qualification in the mastered guard for long verses, either by storing the practiced chunk stage on the session or by deriving "final stage reached" before allowing `mastered`.

### 5. Practice queues can serve blank verse text

Both the queue API and Classic route map a missing cache row to `fullText = ""` (`app/api/practice/queue/route.ts:132-155`, `app/(app)/practice/classic/page.tsx:120-140`). The Classic UI then displays an em dash for the revealed text (`components/practice/ClassicSession.tsx:493`) and still lets the user grade it. Specs §6.1 / §9.3 say a verse must not be opened in practice until its text is available.

Suggested direction: exclude uncached verses from practice queues until text is loaded, or block the card with a clear loading/retry state that populates the cache before allowing reveal/grade.

### 6. Streaks do not reset to 0 on a missed day until the next practice write

`lib/streak/streak.ts:39-73` only recalculates streak on a new practice session. Home and stats display the persisted `user.currentStreak` directly (`app/(app)/page.tsx:109-110`, `app/api/stats/home/route.ts:54-60`). If the user had a 10-day streak, misses yesterday, and opens Home today before practicing, the app still shows 10 even though §6.6 requires the counter to reset to 0 at the start of the next day.

Suggested direction: derive an "effective current streak" on read, or update stale streak rows during Home/stats/session reads before rendering.

### 7. Recognition-mode SRS behavior is likely backwards for future-due verses

`lib/srs/sm2.ts:83-90` pulls future-due verses back to `now` on a successful recognition touch, and tests lock that in at `tests/sm2.test.ts:75-80`. §15.4 says recognition modes should not advance the interval; it does not imply that out-of-schedule recognition play should make a future-due verse due immediately. This will matter in M6 because mini-games will reuse `/api/practice/sessions`.

Suggested direction: clarify the intended "touched today" semantics before M6. A recognition touch should probably avoid advancing the interval while also avoiding accidental schedule regression for verses that were already scheduled out.

### 8. Session recording is not atomic

`app/api/practice/sessions/route.ts:116-186` inserts a session, updates the verse, and then updates the user streak as separate writes. If the verse update or streak update fails after the session insert, the database can contain a practice row that did not actually update SRS or streak. That kind of partial state will be hard to reason about once mini-games and typed recall arrive.

Suggested direction: wrap the session insert, verse update, and user update in one DB transaction, or make the operation idempotent and recoverable.

## Positive notes

- The pure helper coverage is a good start: SM-2, mastery, queue interleaving, chunking, and timezone streak logic all have focused tests.
- M4 commits are small and readable, matching the commit cadence policy well.
- The Home CTA now goes directly to Classic for due verses, which correctly follows §16.1.
- `Repasar ahora` is wired as a one-card Classic session and is a useful power-user path.

## Suggested completion bar for M4

Before closing M4, I would fix findings 1-6 and add targeted tests for: Card View grading, blank-cache queue exclusion/blocking, random practice from the no-due Home state, full-verse mastered guard, and stale streak read behavior. Findings 7-8 can be handled now or explicitly scheduled before M6, but they should not be forgotten.
