import { toBanglaDigits } from "@/i18n/numerals";
import type { Lang } from "@/i18n/types";

const TZ = "Asia/Dhaka";

const locale = (lang: Lang) => (lang === "bn" ? "bn-BD" : "en-GB");

/** Intl already emits Bangla digits for bn-BD; this keeps ASCII fallbacks consistent. */
const localiseDigits = (s: string, lang: Lang) => (lang === "bn" ? toBanglaDigits(s) : s);

export function formatDuration(
  totalSec: number | null | undefined,
  lang: Lang = "en",
): string {
  if (totalSec === null || totalSec === undefined || totalSec < 0) return "—";
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const [mu, su] = lang === "bn" ? ["মি", "সে"] : ["m", "s"];
  let out: string;
  if (totalSec === 0) out = `0${su}`;
  else out = m ? `${m}${mu} ${s.toString().padStart(2, "0")}${su}` : `${s}${su}`;
  return localiseDigits(out, lang);
}

export function formatTimestampMs(ms: number | null | undefined, lang: Lang = "en"): string {
  if (ms === null || ms === undefined || ms < 0) return localiseDigits("0:00", lang);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return localiseDigits(`${m}:${s.toString().padStart(2, "0")}`, lang);
}

export function formatDateTime(iso: string | null | undefined, lang: Lang = "en"): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale(lang), {
      timeZone: TZ,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatShortDate(iso: string | null | undefined, lang: Lang = "en"): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale(lang), {
      timeZone: TZ,
      day: "2-digit",
      month: "short",
    }).format(new Date(iso.length === 10 ? `${iso}T12:00:00+06:00` : iso));
  } catch {
    return iso;
  }
}

export function formatDay(isoDate: string, lang: Lang = "en"): string {
  try {
    return new Intl.DateTimeFormat(locale(lang), { timeZone: TZ, weekday: "short" }).format(
      new Date(`${isoDate}T12:00:00+06:00`),
    );
  } catch {
    return isoDate;
  }
}
