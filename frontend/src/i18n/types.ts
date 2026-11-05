export type Lang = "bn" | "en";

export const LANGS: readonly Lang[] = ["bn", "en"] as const;
export const DEFAULT_LANG: Lang = "bn";
export const LANG_STORAGE_KEY = "bv-lang";

export function isLang(v: unknown): v is Lang {
  return v === "bn" || v === "en";
}

/** Both languages must define exactly the same keys — enforced at compile time. */
export function defineDict<K extends string>(d: {
  en: Record<K, string>;
  bn: Record<K, string>;
}) {
  return d;
}
