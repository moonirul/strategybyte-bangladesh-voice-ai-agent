import { toAsciiDigits } from "./bangla";

/**
 * Lightweight parser for a caller's spoken appointment preference.
 * Used by the simulated demo assistant to decide whether to ask a clarifying
 * question. The backend runs its own authoritative parser before persisting.
 *
 * Rules (deliberately conservative):
 *  - Day must be explicit: আজ/today, কাল|আগামীকাল/tomorrow, পরশু/day after tomorrow.
 *    Plain "কাল" is treated as tomorrow because in a booking context it is
 *    almost always future; this is documented as an assumption.
 *  - Time needs an hour. Part-of-day words (সকাল/দুপুর/বিকাল/সন্ধ্যা/রাত, am/pm)
 *    disambiguate 12-hour values. An hour 1–11 with no part of day is ambiguous.
 */

export interface PreferenceParse {
  original: string;
  dayOffset: number | null;
  time: string | null; // HH:MM 24h
  ambiguity: "missing_day" | "missing_time" | "ambiguous_time" | null;
}

const DAY_PATTERNS: [RegExp, number][] = [
  [/পরশু|day after tomorrow/i, 2],
  // "কাল" also appears inside সকাল (morning) / বিকাল (afternoon) — exclude those.
  [/আগামীকাল|আগামী কাল|tomorrow|(?<!স|বি)কাল/i, 1],
  [/আজ|today|tonight/i, 0],
];

type PartOfDay = "morning" | "noon" | "afternoon" | "evening" | "night";
const PART_PATTERNS: [RegExp, PartOfDay][] = [
  [/সকাল|morning|\bam\b|a\.m\./i, "morning"],
  [/দুপুর|noon/i, "noon"],
  [/বিকাল|বিকেল|afternoon/i, "afternoon"],
  [/সন্ধ্যা|evening/i, "evening"],
  [/রাত|night|\bpm\b|p\.m\./i, "night"],
];

export function parsePreference(text: string): PreferenceParse {
  const ascii = toAsciiDigits(text);
  const dayOffset = DAY_PATTERNS.find(([re]) => re.test(ascii))?.[1] ?? null;
  const part = PART_PATTERNS.find(([re]) => re.test(ascii))?.[1] ?? null;
  const hm = /(\d{1,2})(?:[:.](\d{2}))?\s*(?:টা|টায়|o'?clock)?/.exec(ascii);

  let time: string | null = null;
  let ambiguity: PreferenceParse["ambiguity"] = null;

  if (hm) {
    const h = Number(hm[1]);
    const m = hm[2] ? Number(hm[2]) : 0;
    if (h > 23 || m > 59) {
      ambiguity = "ambiguous_time";
    } else if (h >= 13 || h === 0) {
      time = fmt(h, m); // already 24-hour
    } else if (part) {
      time = fmt(to24h(h, part), m);
    } else {
      ambiguity = "ambiguous_time"; // e.g. "৫টা" — 5 AM or 5 PM?
    }
  } else {
    ambiguity = "missing_time";
  }

  if (dayOffset === null) ambiguity = "missing_day";
  return { original: text, dayOffset, time, ambiguity };
}

/** Convert a 1–12 hour to 24h using the spoken part of day. */
function to24h(h: number, part: PartOfDay): number {
  switch (part) {
    case "morning":
      return h === 12 ? 0 : h;
    case "noon":
      return h >= 11 ? h : h + 12; // দুপুর ১১/১২ stay; দুপুর ২ → 14
    default:
      return h === 12 ? 12 : h + 12; // afternoon / evening / night
  }
}

function fmt(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
