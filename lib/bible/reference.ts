// Reference parsing wrapper around `bible-passage-reference-parser` v3.
//
// What this module owns:
//   - parse free-text references in ES or EN ("Juan 14:6", "John 14:6")
//   - emit a single canonical form used everywhere downstream (USFM dotted —
//     "JHN.14.6", or a range "ROM.8.28-ROM.8.30")
//   - localize a USFM canonical ref back to a display string per locale
//
// Why USFM and not OSIS:
//   `specs.md §4.1` shows the canonical form as `JHN.14.6` (USFM book code).
//   API.Bible also addresses passages by USFM. The bcv parser emits OSIS, so
//   we map OSIS → USFM in this file and never expose OSIS outside it.
//
// Garbage references are rejected here — `client-side first` per specs §9.2 —
// so a user typing nonsense doesn't burn API.Bible quota.

import { bcv_parser } from "bible-passage-reference-parser/esm/bcv_parser.js";
import * as bcvEs from "bible-passage-reference-parser/esm/lang/es.js";
import * as bcvEn from "bible-passage-reference-parser/esm/lang/en.js";

type Parser = InstanceType<typeof bcv_parser>;

const parsers: Record<"es" | "en", Parser | null> = { es: null, en: null };
function getParser(locale: "es" | "en"): Parser {
  if (parsers[locale]) return parsers[locale]!;
  const lang = locale === "es" ? bcvEs : bcvEn;
  parsers[locale] = new bcv_parser(lang);
  return parsers[locale]!;
}

// OSIS → USFM book code. OSIS uses mixed-case names; USFM uses 3-char codes
// that API.Bible accepts. Source: USFM 3.0 spec.
const OSIS_TO_USFM: Record<string, string> = {
  Gen: "GEN", Exod: "EXO", Lev: "LEV", Num: "NUM", Deut: "DEU",
  Josh: "JOS", Judg: "JDG", Ruth: "RUT",
  "1Sam": "1SA", "2Sam": "2SA", "1Kgs": "1KI", "2Kgs": "2KI",
  "1Chr": "1CH", "2Chr": "2CH", Ezra: "EZR", Neh: "NEH", Esth: "EST",
  Job: "JOB", Ps: "PSA", Prov: "PRO", Eccl: "ECC", Song: "SNG",
  Isa: "ISA", Jer: "JER", Lam: "LAM", Ezek: "EZK", Dan: "DAN",
  Hos: "HOS", Joel: "JOL", Amos: "AMO", Obad: "OBA", Jonah: "JON",
  Mic: "MIC", Nah: "NAM", Hab: "HAB", Zeph: "ZEP", Hag: "HAG",
  Zech: "ZEC", Mal: "MAL",
  Matt: "MAT", Mark: "MRK", Luke: "LUK", John: "JHN", Acts: "ACT",
  Rom: "ROM", "1Cor": "1CO", "2Cor": "2CO", Gal: "GAL", Eph: "EPH",
  Phil: "PHP", Col: "COL", "1Thess": "1TH", "2Thess": "2TH",
  "1Tim": "1TI", "2Tim": "2TI", Titus: "TIT", Phlm: "PHM",
  Heb: "HEB", Jas: "JAS", "1Pet": "1PE", "2Pet": "2PE",
  "1John": "1JN", "2John": "2JN", "3John": "3JN", Jude: "JUD", Rev: "REV",
};

const USFM_TO_OSIS: Record<string, string> = Object.fromEntries(
  Object.entries(OSIS_TO_USFM).map(([o, u]) => [u, o]),
);

// Localized book names, indexed by USFM code. Used for display only.
const BOOK_NAMES: Record<"es" | "en", Record<string, string>> = {
  es: {
    GEN: "Génesis", EXO: "Éxodo", LEV: "Levítico", NUM: "Números", DEU: "Deuteronomio",
    JOS: "Josué", JDG: "Jueces", RUT: "Rut",
    "1SA": "1 Samuel", "2SA": "2 Samuel", "1KI": "1 Reyes", "2KI": "2 Reyes",
    "1CH": "1 Crónicas", "2CH": "2 Crónicas", EZR: "Esdras", NEH: "Nehemías", EST: "Ester",
    JOB: "Job", PSA: "Salmos", PRO: "Proverbios", ECC: "Eclesiastés", SNG: "Cantares",
    ISA: "Isaías", JER: "Jeremías", LAM: "Lamentaciones", EZK: "Ezequiel", DAN: "Daniel",
    HOS: "Oseas", JOL: "Joel", AMO: "Amós", OBA: "Abdías", JON: "Jonás",
    MIC: "Miqueas", NAM: "Nahúm", HAB: "Habacuc", ZEP: "Sofonías", HAG: "Hageo",
    ZEC: "Zacarías", MAL: "Malaquías",
    MAT: "Mateo", MRK: "Marcos", LUK: "Lucas", JHN: "Juan", ACT: "Hechos",
    ROM: "Romanos", "1CO": "1 Corintios", "2CO": "2 Corintios", GAL: "Gálatas",
    EPH: "Efesios", PHP: "Filipenses", COL: "Colosenses",
    "1TH": "1 Tesalonicenses", "2TH": "2 Tesalonicenses",
    "1TI": "1 Timoteo", "2TI": "2 Timoteo", TIT: "Tito", PHM: "Filemón",
    HEB: "Hebreos", JAS: "Santiago", "1PE": "1 Pedro", "2PE": "2 Pedro",
    "1JN": "1 Juan", "2JN": "2 Juan", "3JN": "3 Juan", JUD: "Judas", REV: "Apocalipsis",
  },
  en: {
    GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy",
    JOS: "Joshua", JDG: "Judges", RUT: "Ruth",
    "1SA": "1 Samuel", "2SA": "2 Samuel", "1KI": "1 Kings", "2KI": "2 Kings",
    "1CH": "1 Chronicles", "2CH": "2 Chronicles", EZR: "Ezra", NEH: "Nehemiah", EST: "Esther",
    JOB: "Job", PSA: "Psalms", PRO: "Proverbs", ECC: "Ecclesiastes", SNG: "Song of Songs",
    ISA: "Isaiah", JER: "Jeremiah", LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel",
    HOS: "Hosea", JOL: "Joel", AMO: "Amos", OBA: "Obadiah", JON: "Jonah",
    MIC: "Micah", NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah", HAG: "Haggai",
    ZEC: "Zechariah", MAL: "Malachi",
    MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts",
    ROM: "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians", GAL: "Galatians",
    EPH: "Ephesians", PHP: "Philippians", COL: "Colossians",
    "1TH": "1 Thessalonians", "2TH": "2 Thessalonians",
    "1TI": "1 Timothy", "2TI": "2 Timothy", TIT: "Titus", PHM: "Philemon",
    HEB: "Hebrews", JAS: "James", "1PE": "1 Peter", "2PE": "2 Peter",
    "1JN": "1 John", "2JN": "2 John", "3JN": "3 John", JUD: "Jude", REV: "Revelation",
  },
};

export type ParsedRef = {
  canonical: string;            // USFM dotted, e.g. "JHN.14.6" or "ROM.8.28-ROM.8.30"
  bookCode: string;             // first book USFM, e.g. "JHN"
  display: { es: string; en: string };
};

// Parse one user-typed reference. Returns null if the parser can't produce a
// single contiguous passage. Multiple-passage inputs (e.g. "Jn 3:16, Rm 8:28")
// are rejected — v1 is one passage per verse card.
export function parseReference(input: string, locale: "es" | "en" = "es"): ParsedRef | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  let osis: string;
  try {
    osis = getParser(locale).parse(cleaned).osis();
  } catch {
    return null;
  }
  if (!osis) return null;
  // bcv joins multi-passage inputs with commas — reject.
  if (osis.includes(",")) return null;

  const usfm = osisToUsfm(osis);
  if (!usfm) return null;
  const bookCode = usfm.split(".")[0]!;
  return {
    canonical: usfm,
    bookCode,
    display: {
      es: formatDisplay(usfm, "es"),
      en: formatDisplay(usfm, "en"),
    },
  };
}

// "John.14.6"          → "JHN.14.6"
// "John.14.6-John.14.7"→ "JHN.14.6-JHN.14.7"
function osisToUsfm(osis: string): string | null {
  const segments = osis.split("-");
  const out: string[] = [];
  for (const seg of segments) {
    const parts = seg.split(".");
    const book = parts[0];
    if (!book || !(book in OSIS_TO_USFM)) return null;
    out.push([OSIS_TO_USFM[book], ...parts.slice(1)].join("."));
  }
  return out.join("-");
}

// "JHN.14.6"            → "Juan 14:6"
// "ROM.8.28-ROM.8.30"   → "Romanos 8:28-30"
// "ROM.8.28-ROM.9.2"    → "Romanos 8:28-9:2"
export function formatDisplay(canonical: string, locale: "es" | "en"): string {
  const segs = canonical.split("-");
  const [a, b] = [segs[0], segs[1]];
  if (!a) return canonical;
  const [bookA, chA, vA] = a.split(".");
  if (!bookA || !chA || !vA) return canonical;
  const nameA = BOOK_NAMES[locale][bookA] ?? bookA;
  if (!b) return `${nameA} ${chA}:${vA}`;
  const [bookB, chB, vB] = b.split(".");
  if (bookA === bookB && chA === chB) return `${nameA} ${chA}:${vA}-${vB}`;
  if (bookA === bookB) return `${nameA} ${chA}:${vA}-${chB}:${vB}`;
  const nameB = BOOK_NAMES[locale][bookB!] ?? bookB;
  return `${nameA} ${chA}:${vA} – ${nameB} ${chB}:${vB}`;
}

export function bookCodeFromCanonical(canonical: string): string | null {
  const code = canonical.split(".")[0]?.split("-")[0];
  return code && code in USFM_TO_OSIS ? code : null;
}

export function isValidUsfmRef(canonical: string): boolean {
  const segs = canonical.split("-");
  for (const seg of segs) {
    const parts = seg.split(".");
    if (parts.length !== 3) return false;
    const [book, ch, v] = parts;
    if (!book || !(book in USFM_TO_OSIS)) return false;
    if (!/^\d+$/.test(ch!) || !/^\d+$/.test(v!)) return false;
  }
  return true;
}

export const __internal = { OSIS_TO_USFM, USFM_TO_OSIS, BOOK_NAMES };
