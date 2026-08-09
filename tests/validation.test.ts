import { describe, it, expect } from "vitest";
import { isValidTimeZone, TimeZoneInput } from "@/lib/validation/schemas";

describe("isValidTimeZone", () => {
  it("accepts real IANA zones", () => {
    for (const tz of [
      "UTC",
      "America/Mexico_City",
      "Europe/Madrid",
      "Pacific/Auckland",
      "Pacific/Honolulu",
    ]) {
      expect(isValidTimeZone(tz)).toBe(true);
    }
  });

  it("rejects anything Intl cannot resolve", () => {
    for (const tz of ["", "Mars/Olympus_Mons", "GMT+5", "not a zone", "../../etc"]) {
      expect(isValidTimeZone(tz)).toBe(false);
    }
  });
});

describe("TimeZoneInput", () => {
  it("passes a valid zone through", () => {
    expect(TimeZoneInput.parse("America/Mexico_City")).toBe("America/Mexico_City");
  });

  it("trims surrounding whitespace", () => {
    expect(TimeZoneInput.parse("  Europe/Madrid  ")).toBe("Europe/Madrid");
  });

  it("fails closed on an unknown zone", () => {
    expect(TimeZoneInput.safeParse("Mars/Olympus_Mons").success).toBe(false);
    expect(TimeZoneInput.safeParse("").success).toBe(false);
  });

  it("fails on an absurdly long value", () => {
    expect(TimeZoneInput.safeParse("A/".repeat(100)).success).toBe(false);
  });
});
