import { toAsciiDigits } from "./bangla";

export type PhoneResult =
  | { ok: true; e164: string; original: string }
  | { ok: false; reason: "empty" | "invalid_characters" | "invalid_length" | "invalid_prefix"; original: string };

/**
 * Validate a Bangladeshi mobile number, then normalise to E.164 (+8801XXXXXXXXX).
 *
 * Accepted (after Bangla→ASCII digits and removing spaces, dashes, dots, parentheses):
 *   01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX, 008801XXXXXXXXX
 * Operator prefix must be 013–019.
 *
 * We never "repair" input: letters, extra/missing digits, or unknown prefixes
 * are rejected so the assistant asks again instead of guessing.
 */
export function parseBdMobile(raw: string): PhoneResult {
  const original = raw;
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty", original };

  const ascii = toAsciiDigits(trimmed).replace(/[\s\-.()]/g, "");
  if (!/^\+?\d+$/.test(ascii)) return { ok: false, reason: "invalid_characters", original };

  let national: string;
  if (ascii.startsWith("+880")) national = "0" + ascii.slice(4);
  else if (ascii.startsWith("00880")) national = "0" + ascii.slice(5);
  else if (ascii.startsWith("880")) national = "0" + ascii.slice(3);
  else if (ascii.startsWith("+")) return { ok: false, reason: "invalid_prefix", original };
  else national = ascii;

  if (national.length !== 11) return { ok: false, reason: "invalid_length", original };
  if (!/^01[3-9]\d{8}$/.test(national)) return { ok: false, reason: "invalid_prefix", original };

  return { ok: true, e164: "+88" + national, original };
}

/** "+8801712345678" → "+880 1712-345678" */
export function formatBdPhone(e164: string): string {
  const m = /^\+880(\d{4})(\d{6})$/.exec(e164);
  return m ? `+880 ${m[1]}-${m[2]}` : e164;
}
