import { describe, it, expect } from "vitest";
import { defaultVersionFor, textLocaleForVersion } from "@/lib/catalog";

const ALL = ["NBLA", "NTV", "NIV"];

describe("defaultVersionFor", () => {
  it("starts Spanish users on NBLA and English users on NIV", () => {
    expect(defaultVersionFor("es", ALL)).toBe("NBLA");
    expect(defaultVersionFor("en", ALL)).toBe("NIV");
  });

  it("keeps the last version when it matches the interface language", () => {
    expect(defaultVersionFor("es", ALL, "NTV")).toBe("NTV");
    expect(defaultVersionFor("en", ALL, "NIV")).toBe("NIV");
  });

  it("ignores a last version in the other language", () => {
    expect(defaultVersionFor("en", ALL, "NTV")).toBe("NIV");
    expect(defaultVersionFor("es", ALL, "NIV")).toBe("NBLA");
  });

  it("falls back when the preferred version is not configured", () => {
    expect(defaultVersionFor("es", ["NTV", "NIV"])).toBe("NTV");
    expect(defaultVersionFor("en", ["NBLA", "NTV"])).toBe("NBLA");
    expect(defaultVersionFor("en", [])).toBeUndefined();
  });
});

describe("textLocaleForVersion", () => {
  it("knows NIV is English and the rest are Spanish", () => {
    expect(textLocaleForVersion("NIV")).toBe("en");
    expect(textLocaleForVersion("NBLA")).toBe("es");
  });
});
