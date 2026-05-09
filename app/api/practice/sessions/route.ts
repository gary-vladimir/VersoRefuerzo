// POST /api/practice/sessions
//
// Records one practice attempt and applies all downstream side effects:
//   - SM-2 update on the verse for RECALL modes (specs.md §6.4.1)
//   - small recognition touch for RECOGNITION modes (§15.4)
//   - chunkStage advance on a successful recall pass through Classic (§15.7)
//   - mastery + status re-derivation, including the §15.5 unaided guard
//   - daily streak update in the user's tz (§6.6, AC-6)
//
// Body shape (zod):
//   { verseId, mode, quality?, outcome, durationMs, usedHint }
//
// Response shape:
//   { verse, streak: { currentStreak, bestStreak, lastStreakAt } }

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { getServerUser } from "@/lib/auth/session";
import { getDb } from "@/db/client";
import {
  verses as versesTable,
  practiceSessions,
  bibleTextCache,
  users,
  PRACTICE_MODES,
  PRACTICE_OUTCOMES,
  type SrsState,
  type PracticeMode,
} from "@/db/schema";
import { applyRecallGrade, applyRecognitionTouch, type Quality } from "@/lib/srs/sm2";
import { deriveMastery, deriveStatus, findLastUnaidedRecall } from "@/lib/srs/mastery";
import { stageForReps, planChunks } from "@/lib/srs/chunk";
import { densityForReps, isRecallDensity } from "@/lib/srs/cloze";
import { wordsOnly } from "@/lib/bible/tokenize";
import { applyPracticeForStreak } from "@/lib/streak/streak";

export const runtime = "nodejs";

const Body = z.object({
  verseId: z.string().uuid(),
  mode: z.enum(PRACTICE_MODES),
  quality: z.number().int().min(0).max(5).nullish(),
  outcome: z.enum(PRACTICE_OUTCOMES),
  durationMs: z.number().int().min(0).max(60 * 60 * 1000),
  usedHint: z.boolean().default(false),
});

const RECALL_MODES: ReadonlySet<PracticeMode> = new Set([
  "classic",
  "first_letter",
  "typed",
]);

export async function POST(req: NextRequest) {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const db = getDb();

  const found = await db
    .select()
    .from(versesTable)
    .where(
      and(
        eq(versesTable.id, data.verseId),
        eq(versesTable.userId, user.id),
        isNull(versesTable.deletedAt),
      ),
    )
    .limit(1);
  const verse = found[0];
  if (!verse) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const now = new Date();

  // §15.4 + §15.3: classification is mostly fixed by mode, but Fill the Gap
  // *promotes* to RECALL once the cloze density crosses 50% (which only
  // happens once the user's hit ~6 reps on this verse). The promotion is
  // computed server-side from the verse's repetition count + cached text
  // length so the client can't cheat the schedule by lying about density.
  const cachedText = await loadCachedText(db, verse.canonicalRef, verse.version);
  const totalChunks = cachedText ? planChunks(cachedText).chunks.length : 1;
  let isRecall = RECALL_MODES.has(data.mode);
  if (data.mode === "gap" && cachedText) {
    const totalWords = wordsOnly(cachedText).length;
    const density = densityForReps(verse.srsState.repetitions, totalWords);
    if (isRecallDensity(density)) isRecall = true;
  }
  const classification: "recall" | "recognition" = isRecall ? "recall" : "recognition";

  // The chunk *stage* the user practiced is derived from the verse's
  // pre-grade rep count (specs.md §15.7 / chunk.stageForReps) so every
  // recall mode agrees with what the queue route rendered (M5 review #1).
  // Recognition modes (Scramble/Match/low-density Gap) always run on the
  // full text per §15.3 and §6.4.2.
  const practicedStage = isRecall
    ? stageForReps(verse.srsState.repetitions, totalChunks)
    : totalChunks - 1;
  const wasFullVerse = practicedStage >= totalChunks - 1;

  // 1. Compute next SRS state. We no longer write `chunkStage` — it's a
  // pure function of `repetitions` and the cached text length. The field
  // remains on `INITIAL_SRS_STATE` for legacy rows but is read nowhere.
  let nextSrs: SrsState;
  if (isRecall) {
    const q = (data.quality ?? 0) as Quality;
    nextSrs = applyRecallGrade(verse.srsState, q, now);
  } else {
    nextSrs = applyRecognitionTouch(verse.srsState, data.outcome === "correct");
  }

  // 3. Insert the session row.
  await db.insert(practiceSessions).values({
    userId: user.id,
    verseId: verse.id,
    mode: data.mode,
    classification,
    quality: data.quality ?? null,
    outcome: data.outcome,
    durationMs: data.durationMs,
    usedHint: data.usedHint,
    wasFullVerse,
    startedAt: now,
  });

  // 4. Re-derive mastery + status from updated SRS + the verse's session log.
  // The §15.5 guard wants a 30-day window of unaided RECALL passes.
  const windowStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSessions = await db
    .select()
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.userId, user.id),
        eq(practiceSessions.verseId, verse.id),
        gte(practiceSessions.startedAt, windowStart),
      ),
    )
    .orderBy(desc(practiceSessions.startedAt));

  const lastUnaided = findLastUnaidedRecall(recentSessions);
  const mastery = deriveMastery(nextSrs);
  const status = deriveStatus({ srs: nextSrs, lastUnaidedRecall: lastUnaided, now });

  // 5. Persist the verse.
  const updatedVerse = await db
    .update(versesTable)
    .set({
      srsState: nextSrs,
      mastery,
      status,
      updatedAt: now,
    })
    .where(eq(versesTable.id, verse.id))
    .returning();

  // 6. Streak update — every recorded session counts (§6.6).
  // user.lastStreakAt comes off Postgres `date` as a string in YYYY-MM-DD;
  // pass it through unchanged.
  const lastStreakAt = (user.lastStreakAt ?? null) as string | null;
  const nextStreak = applyPracticeForStreak({
    state: {
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak,
      lastStreakAt,
    },
    tz: user.timezone,
    now,
  });
  if (
    nextStreak.currentStreak !== user.currentStreak ||
    nextStreak.bestStreak !== user.bestStreak ||
    nextStreak.lastStreakAt !== lastStreakAt
  ) {
    await db
      .update(users)
      .set({
        currentStreak: nextStreak.currentStreak,
        bestStreak: nextStreak.bestStreak,
        lastStreakAt: nextStreak.lastStreakAt,
        updatedAt: now,
      })
      .where(eq(users.id, user.id));
  }

  return NextResponse.json({
    verse: updatedVerse[0],
    streak: nextStreak,
  });
}

async function loadCachedText(
  db: ReturnType<typeof getDb>,
  ref: string,
  version: string,
): Promise<string | null> {
  const rows = await db
    .select({ text: bibleTextCache.text })
    .from(bibleTextCache)
    .where(
      and(eq(bibleTextCache.canonicalRef, ref), eq(bibleTextCache.version, version)),
    )
    .limit(1);
  return rows[0]?.text ?? null;
}
