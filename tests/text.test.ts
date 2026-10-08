import { describe, it, expect } from "vitest";
import { cleanPassageText } from "@/lib/bible/text";

describe("cleanPassageText", () => {
  it("drops paragraph marks and collapses whitespace", () => {
    expect(cleanPassageText("¶Lámpara es a mis pies Tu palabra,\n  Y luz para mi camino. ")).toBe(
      "Lámpara es a mis pies Tu palabra, Y luz para mi camino.",
    );
    expect(cleanPassageText("uno ¶dos")).toBe("uno dos");
  });

  it("keeps quotation marks, which are part of the verse", () => {
    expect(cleanPassageText("»Vengan a Mí")).toBe("»Vengan a Mí");
  });
});
