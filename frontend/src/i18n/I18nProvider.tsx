"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { dictionaries, type MessageKey } from "./dictionaries";
import { formatNumber, formatTaka } from "./numerals";
import { DEFAULT_LANG, LANG_STORAGE_KEY, isLang, type Lang } from "./types";

type Vars = Record<string, string | number>;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  n: (value: number) => string;
  taka: (value: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const listeners = new Set<() => void>();

function readStoredLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // keep other tabs in sync
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function storeLang(lang: Lang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* storage can be blocked; the in-memory notify below still switches the UI */
  }
  listeners.forEach((l) => l());
}

/**
 * Language lives in localStorage (frontend-side storage). The server snapshot is the
 * default language (Bangla), so static rendering and hydration never mismatch.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readStoredLang, () => DEFAULT_LANG);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => storeLang(next), []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[lang];
    return {
      lang,
      setLang,
      t: (key, vars) => {
        let msg: string = dict[key] ?? dictionaries.en[key] ?? key;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            msg = msg.replaceAll(`{${k}}`, typeof v === "number" ? formatNumber(v, lang) : v);
          }
        }
        return msg;
      },
      n: (v) => formatNumber(v, lang),
      taka: (v) => formatTaka(v, lang),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>.");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
