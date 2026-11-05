/**
 * Bangla text helpers. Frontend copies are for UX only — the FastAPI backend
 * re-validates everything and is the source of truth for persisted values.
 */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Convert Bangla digits (০-৯) to ASCII digits. Other characters are unchanged. */
export function toAsciiDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

/** Convert ASCII digits to Bangla digits for display. */
export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}
