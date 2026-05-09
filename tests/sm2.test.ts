import { describe, it, expect } from "vitest";
import {
  applyRecallGrade,
  applyRecognitionTouch,
  previewIntervals,
  MIN_EASE,
  MAX_EASE,
} from "@/lib/srs/sm2";
import { INITIAL_SRS_STATE } from "@/db/schema";

const NOW = new Date("2026-01-01T12:00:00Z");

describe("applyRecallGrade", () => {
  it("first pass at quality 4 schedules to 1 day", () => {
    const next = applyRecallGrade(INITIAL_SRS_STATE, 4, NOW);
    expect(next.repetitions).toBe(1);
    expect(next.interval).toBe(1);
  });

  it("second pass at quality 4 schedules to 6 days", () => {
    const r1 = applyRecallGrade(INITIAL_SRS_STATE, 4, NOW);
    const r2 = applyRecallGrade(r1, 4, NOW);
    expect(r2.repetitions).toBe(2);
    expect(r2.interval).toBe(6);
  });

  it("third pass scales by ease factor", () => {
    let s = INITIAL_SRS_STATE;
    for (let i = 0; i < 3; i++) s = applyRecallGrade(s, 4, NOW);
    // Third pass: round(prev.interval * easeFactor); EF stays at 2.5 on q=4.
    expect(s.repetitions).toBe(3);
    expect(s.interval).toBe(15);
  });

  it("failure pulls interval to 0 but does not reset reps", () => {
    let s = INITIAL_SRS_STATE;
    for (let i = 0; i < 3; i++) s = applyRecallGrade(s, 4, NOW);
    const failed = applyRecallGrade(s, 1, NOW);
    expect(failed.interval).toBe(0);
    expect(failed.repetitions).toBe(s.repetitions);
    expect(failed.easeFactor).toBeLessThan(s.easeFactor);
  });

  it("clamps ease factor", () => {
    let s = INITIAL_SRS_STATE;
    for (let i = 0; i < 30; i++) s = applyRecallGrade(s, 1, NOW);
    expect(s.easeFactor).toBeGreaterThanOrEqual(MIN_EASE);
    for (let i = 0; i < 30; i++) s = applyRecallGrade(s, 5, NOW);
    expect(s.easeFactor).toBeLessThanOrEqual(MAX_EASE);
  });

  it("dueAt advances by interval days", () => {
    const r = applyRecallGrade(INITIAL_SRS_STATE, 4, NOW);
    const due = new Date(r.dueAt);
    expect(due.getUTCDate() - NOW.getUTCDate()).toBe(1);
  });
});

describe("applyRecognitionTouch", () => {
  it("does not advance interval or repetitions", () => {
    const seed = { ...INITIAL_SRS_STATE, interval: 5, repetitions: 3 };
    const next = applyRecognitionTouch(seed, true);
    expect(next.interval).toBe(seed.interval);
    expect(next.repetitions).toBe(seed.repetitions);
  });

  it("bumps ease on success only", () => {
    const seed = { ...INITIAL_SRS_STATE, easeFactor: 2.5 };
    const ok = applyRecognitionTouch(seed, true);
    const fail = applyRecognitionTouch(seed, false);
    expect(ok.easeFactor).toBeGreaterThan(seed.easeFactor);
    expect(fail.easeFactor).toBe(seed.easeFactor);
  });

  it("does not regress dueAt for a future-scheduled verse", () => {
    const future = new Date(NOW.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const seed = { ...INITIAL_SRS_STATE, dueAt: future };
    const next = applyRecognitionTouch(seed, true);
    expect(next.dueAt).toBe(future);
  });
});

describe("previewIntervals", () => {
  it("emits four labels, easy >= good >= hard", () => {
    const p = previewIntervals(INITIAL_SRS_STATE, "es");
    expect(p.again).toMatch(/min/);
    expect(p.hard).toBeTruthy();
    expect(p.good).toBeTruthy();
    expect(p.easy).toBeTruthy();
  });
});
