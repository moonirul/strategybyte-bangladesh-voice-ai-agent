import type { Lang } from "./types";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Replace ASCII digits with Bangla digits (used for pre-formatted strings). */
export function toBanglaDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

/** Localised plain number. Indian/Bangladeshi lakh grouping in both languages. */
export function formatNumber(value: number, lang: Lang): string {
  try {
    return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-IN").format(value);
  } catch {
    return String(value);
  }
}

/** Bangladeshi Taka, e.g. ৳14,999 / ৳১৪,৯৯৯ / ৳1,25,000 / ৳১,২৫,০০০. */
export function formatTaka(value: number, lang: Lang): string {
  return `৳${formatNumber(value, lang)}`;
}
