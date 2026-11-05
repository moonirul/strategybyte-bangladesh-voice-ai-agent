"use client";

import { useMemo } from "react";
import { useI18n } from "@/i18n";
import {
  formatDateTime,
  formatDay,
  formatDuration,
  formatShortDate,
  formatTimestampMs,
} from "@/lib/format";

/** Language-aware formatters bound to the active language. */
export function useFormat() {
  const { lang, n, taka } = useI18n();
  return useMemo(
    () => ({
      lang,
      n,
      taka,
      dateTime: (iso: string | null | undefined) => formatDateTime(iso, lang),
      shortDate: (iso: string | null | undefined) => formatShortDate(iso, lang),
      day: (isoDate: string) => formatDay(isoDate, lang),
      duration: (s: number | null | undefined) => formatDuration(s, lang),
      timestampMs: (ms: number | null | undefined) => formatTimestampMs(ms, lang),
    }),
    [lang, n, taka],
  );
}
