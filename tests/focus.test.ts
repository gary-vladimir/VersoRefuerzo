import { describe, it, expect } from "vitest";
import { isFocusRoute } from "@/lib/layout/focus";

describe("isFocusRoute", () => {
  it("is true inside a practice session", () => {
    for (const p of ["/practice/classic", "/practice/first-letter", "/practice/scramble", "/practice/match", "/practice/gap"]) {
      expect(isFocusRoute(p)).toBe(true);
    }
  });

  it("is false for the hub, the summary and other screens", () => {
    for (const p of ["/", "/practice", "/practice/summary", "/library", "/guide", "/practice/classical"]) {
      expect(isFocusRoute(p)).toBe(false);
    }
  });
});
