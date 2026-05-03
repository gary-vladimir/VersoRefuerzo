import { describe, it, expect } from "vitest";
import {
  parseReference,
  formatDisplay,
  isValidUsfmRef,
  bookCodeFromCanonical,
} from "@/lib/bible/reference";

describe("parseReference", () => {
  it("parses Spanish single verse", () => {
    const r = parseReference("Juan 14:6", "es");
    expect(r?.canonical).toBe("JHN.14.6");
    expect(r?.bookCode).toBe("JHN");
    expect(r?.display.es).toBe("Juan 14:6");
    expect(r?.display.en).toBe("John 14:6");
  });

  it("parses English single verse", () => {
    const r = parseReference("John 14:6", "en");
    expect(r?.canonical).toBe("JHN.14.6");
  });

  it("parses ranges within a chapter", () => {
    const r = parseReference("Romanos 8:28-30", "es");
    expect(r?.canonical).toBe("ROM.8.28-ROM.8.30");
    expect(r?.display.es).toBe("Romanos 8:28-30");
    expect(r?.display.en).toBe("Romans 8:28-30");
  });

  it("parses ranges crossing chapters", () => {
    const r = parseReference("Romanos 8:28-9:2", "es");
    expect(r?.canonical).toBe("ROM.8.28-ROM.9.2");
    expect(r?.display.es).toBe("Romanos 8:28-9:2");
  });

  it("handles common abbreviations", () => {
    expect(parseReference("Jn 3:16", "es")?.canonical).toBe("JHN.3.16");
    expect(parseReference("Sal 23:1", "es")?.canonical).toBe("PSA.23.1");
    expect(parseReference("1 Co 13:4", "es")?.canonical).toBe("1CO.13.4");
  });

  it("rejects garbage", () => {
    expect(parseReference("not a verse", "es")).toBeNull();
    expect(parseReference("", "es")).toBeNull();
    expect(parseReference("   ", "es")).toBeNull();
    expect(parseReference("99:99:99", "es")).toBeNull();
  });

  it("rejects multi-passage input", () => {
    expect(parseReference("Juan 3:16, Romanos 8:28", "es")).toBeNull();
  });
});

describe("formatDisplay", () => {
  it("renders single-verse refs", () => {
    expect(formatDisplay("JHN.14.6", "es")).toBe("Juan 14:6");
    expect(formatDisplay("JHN.14.6", "en")).toBe("John 14:6");
  });
  it("renders same-chapter ranges compactly", () => {
    expect(formatDisplay("ROM.8.28-ROM.8.30", "es")).toBe("Romanos 8:28-30");
  });
  it("renders cross-chapter ranges", () => {
    expect(formatDisplay("ROM.8.28-ROM.9.2", "es")).toBe("Romanos 8:28-9:2");
  });
});

describe("isValidUsfmRef", () => {
  it("accepts well-formed canonical refs", () => {
    expect(isValidUsfmRef("JHN.14.6")).toBe(true);
    expect(isValidUsfmRef("ROM.8.28-ROM.8.30")).toBe(true);
  });
  it("rejects ill-formed refs", () => {
    expect(isValidUsfmRef("Jhn.14.6")).toBe(false);
    expect(isValidUsfmRef("XYZ.1.1")).toBe(false);
    expect(isValidUsfmRef("JHN.14")).toBe(false);
    expect(isValidUsfmRef("")).toBe(false);
  });
});

describe("bookCodeFromCanonical", () => {
  it("extracts the leading book code", () => {
    expect(bookCodeFromCanonical("JHN.14.6")).toBe("JHN");
    expect(bookCodeFromCanonical("ROM.8.28-ROM.8.30")).toBe("ROM");
  });
  it("returns null for unknown codes", () => {
    expect(bookCodeFromCanonical("XYZ.1.1")).toBeNull();
  });
});
