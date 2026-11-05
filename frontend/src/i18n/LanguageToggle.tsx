"use client";

import clsx from "clsx";
import { useI18n } from "./I18nProvider";

/** Global BN | EN switch used in the landing navbar, login page and portal top bar. */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const options = [
    { id: "bn" as const, label: "বাংলা" },
    { id: "en" as const, label: "EN" },
  ];
  return (
    <div
      role="group"
      aria-label={t("lang.switch")}
      className={clsx(
        "inline-flex items-center rounded-full border border-line-strong bg-surface-raised/70 p-0.5 text-xs",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          lang={o.id}
          aria-pressed={lang === o.id}
          onClick={() => setLang(o.id)}
          className={clsx(
            "rounded-full px-3 py-1 font-medium transition",
            lang === o.id
              ? "bg-primary text-canvas shadow-sm"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
