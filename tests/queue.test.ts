import { describe, it, expect } from "vitest";
import { buildDueQueue, dailySeed, interleave, selectDueToday } from "@/lib/srs/queue";
import { INITIAL_SRS_STATE } from "@/db/schema";

const NOW = new Date("2026-01-15T12:00:00Z");

function v(id: string, dueOffsetDays: number, collections: string[] = []) {
  const dueAt = new Date(NOW.getTime() + dueOffsetDays * 86400000).toISOString();
  return { id, srsState: { ...INITIAL_SRS_STATE, dueAt }, collectionIds: collections };
}

describe("selectDueToday", () => {
  it("includes overdue and same-day verses, excludes future", () => {
    const due = selectDueToday([v("a", -2), v("b", 0), v("c", 1)], NOW);
    expect(due.map((d) => d.id).sort()).toEqual(["a", "b"]);
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
    const seen = interleave(verses, dailySeed("u1", NOW));
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
    const seed = dailySeed("user-1", NOW);
    const out = buildDueQueue(
      [
        v("a", 0, ["rom"]),
        v("b", -1, ["psa"]),
        v("c", 5, ["rom"]),
      ],
      seed,
      NOW,
    );
    expect(out.map((x) => x.id).sort()).toEqual(["a", "b"]);
  });
});

describe("dailySeed", () => {
  it("changes by day", () => {
    const today = dailySeed("u", NOW);
    const tomorrow = dailySeed(
      "u",
      new Date(NOW.getTime() + 86400000),
    );
    expect(today).not.toBe(tomorrow);
  });
});
