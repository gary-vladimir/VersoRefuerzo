import { describe, it, expect } from "vitest";
import { buildDueQueue, dailySeed, interleave, selectDueToday } from "@/lib/srs/queue";
import { endOfTzDay, localDayNumber } from "@/lib/streak/streak";
import { INITIAL_SRS_STATE } from "@/db/schema";

const NOW = new Date("2026-01-15T12:00:00Z");
const UTC_CUTOFF = endOfTzDay("UTC", NOW);

function v(id: string, dueOffsetDays: number, collections: string[] = []) {
  const dueAt = new Date(NOW.getTime() + dueOffsetDays * 86400000).toISOString();
  return { id, srsState: { ...INITIAL_SRS_STATE, dueAt }, collectionIds: collections };
}

function at(id: string, dueAtIso: string) {
  return { id, srsState: { ...INITIAL_SRS_STATE, dueAt: dueAtIso }, collectionIds: [] };
}

describe("selectDueToday", () => {
  it("includes overdue and same-day verses, excludes future", () => {
    const due = selectDueToday([v("a", -2), v("b", 0), v("c", 1)], UTC_CUTOFF);
    expect(due.map((d) => d.id).sort()).toEqual(["a", "b"]);
  });

  // Regression: the cutoff used to be end-of-day UTC for every user. In
  // Honolulu (UTC-10) that lands at 14:00 local, so a verse scheduled for
  // 20:00 tonight local (06:00 UTC tomorrow) was pushed to the next day.
  it("surfaces verses due later tonight for a user west of UTC", () => {
    const evening = at("tonight", "2026-01-16T06:00:00Z"); // 20:00 Jan 15 in Honolulu
    const asked = new Date("2026-01-15T20:00:00Z"); // 10:00 Jan 15 in Honolulu
    const cutoff = endOfTzDay("Pacific/Honolulu", asked);
    expect(selectDueToday([evening], cutoff).map((d) => d.id)).toEqual(["tonight"]);
    // The old UTC cutoff would have missed it.
    expect(selectDueToday([evening], endOfTzDay("UTC", asked))).toEqual([]);
  });

  // The mirror case: east of UTC, a UTC cutoff leaks tomorrow's verses in.
  it("does not leak tomorrow's verses for a user east of UTC", () => {
    const tomorrow = at("tomorrow", "2026-01-15T20:00:00Z"); // 09:00 Jan 16 in Auckland
    const asked = new Date("2026-01-15T02:00:00Z"); // 15:00 Jan 15 in Auckland
    const cutoff = endOfTzDay("Pacific/Auckland", asked);
    expect(selectDueToday([tomorrow], cutoff)).toEqual([]);
    // The old UTC cutoff would have surfaced it a day early.
    expect(selectDueToday([tomorrow], endOfTzDay("UTC", asked)).map((d) => d.id)).toEqual(
      ["tomorrow"],
    );
  });
});

describe("interleave", () => {
  it("does not group same-collection runs", () => {
    const verses = [
      { id: "r1", dueAt: NOW.toISOString(), collectionIds: ["rom"] },
      { id: "r2", dueAt: NOW.toISOString(), collectionIds: ["rom"] },
      { id: "r3", dueAt: NOW.toISOString(), collectionIds: ["rom"] },
      { id: "p1", dueAt: NOW.toISOString(), collectionIds: ["psa"] },
      { id: "p2", dueAt: NOW.toISOString(), collectionIds: ["psa"] },
    ];
    const seen = interleave(verses, dailySeed("u1", localDayNumber("UTC", NOW)));
    // No three rom-cards in a row.
    for (let i = 0; i + 2 < seen.length; i++) {
      const c0 = seen[i]!.collectionIds[0];
      const c1 = seen[i + 1]!.collectionIds[0];
      const c2 = seen[i + 2]!.collectionIds[0];
      expect([c0, c1, c2].every((c) => c === "rom")).toBe(false);
    }
    // All five surface exactly once.
    expect(seen.map((s) => s.id).sort()).toEqual(["p1", "p2", "r1", "r2", "r3"]);
  });

  it("is deterministic for the same seed", () => {
    const verses = [
      { id: "a", dueAt: NOW.toISOString(), collectionIds: ["x"] },
      { id: "b", dueAt: NOW.toISOString(), collectionIds: ["y"] },
      { id: "c", dueAt: NOW.toISOString(), collectionIds: ["z"] },
    ];
    const seed = 42;
    expect(interleave(verses, seed)).toEqual(interleave(verses, seed));
  });
});

describe("buildDueQueue", () => {
  it("filters then interleaves", () => {
    const seed = dailySeed("user-1", localDayNumber("UTC", NOW));
    const out = buildDueQueue(
      [
        v("a", 0, ["rom"]),
        v("b", -1, ["psa"]),
        v("c", 5, ["rom"]),
      ],
      seed,
      UTC_CUTOFF,
    );
    expect(out.map((x) => x.id).sort()).toEqual(["a", "b"]);
  });
});

describe("dailySeed", () => {
  it("changes by day", () => {
    const today = dailySeed("u", localDayNumber("UTC", NOW));
    const tomorrow = dailySeed(
      "u",
      localDayNumber("UTC", new Date(NOW.getTime() + 86400000)),
    );
    expect(today).not.toBe(tomorrow);
  });

  // The seed rotates on the user's midnight, not UTC's: two users looking
  // at the same instant from different zones can be on different days.
  it("is keyed to the user's local day, not UTC", () => {
    const instant = new Date("2026-01-15T12:00:00Z"); // Jan 15 UTC, Jan 16 in Auckland
    const utc = dailySeed("u", localDayNumber("UTC", instant));
    const auckland = dailySeed("u", localDayNumber("Pacific/Auckland", instant));
    expect(utc).not.toBe(auckland);
  });
});
