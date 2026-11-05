import { common } from "./common";
import { landing } from "./landing";
import { voice } from "./voice";
import { portalCore } from "./portal-core";
import { calls } from "./calls";
import { portalMore } from "./portal-more";
import type { Lang } from "../types";

const parts = [common, landing, voice, portalCore, calls, portalMore] as const;

type KeysOf<U> = U extends unknown ? keyof U : never;
export type MessageKey = KeysOf<(typeof parts)[number]["en"]> & string;

function merge(lang: Lang): Record<MessageKey, string> {
  const out: Record<string, string> = {};
  for (const p of parts) Object.assign(out, p[lang]);
  return out as Record<MessageKey, string>;
}

export const dictionaries: Record<Lang, Record<MessageKey, string>> = {
  en: merge("en"),
  bn: merge("bn"),
};
