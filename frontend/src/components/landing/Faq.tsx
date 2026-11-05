"use client";

import { useState } from "react";
import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import { useI18n, type MessageKey } from "@/i18n";
import { toBanglaDigits } from "@/i18n/numerals";

const COUNT = 8;
const ids = Array.from({ length: COUNT }, (_, i) => i + 1);

export default function Faq() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(1);
  const num = (n: number) => {
    const s = String(n).padStart(2, "0");
    return lang === "bn" ? toBanglaDigits(s) : s;
  };

  return (
    <section id="faq" className="theme-ivory scroll-mt-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-soft">
            {t("faq.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t("faq.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t("faq.desc")}</p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12">
          <ul className="border-t border-line lg:col-span-6">
            {ids.map((n) => {
              const isOpen = open === n;
              const q = t(`faq.q${n}` as MessageKey);
              const a = t(`faq.a${n}` as MessageKey);
              return (
                <li key={n} className="border-b border-line">
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${n}`}
                      id={`faq-btn-${n}`}
                      onClick={() => setOpen(n)}
                      className="flex w-full items-center gap-4 py-4 text-left"
                    >
                      <span
                        className={clsx(
                          "w-7 shrink-0 font-mono text-xs",
                          isOpen ? "text-primary-soft" : "text-ink-subtle",
                        )}
                      >
                        {num(n)}
                      </span>
                      <span
                        className={clsx(
                          "flex-1 text-sm font-medium sm:text-base",
                          isOpen ? "text-ink" : "text-ink-muted",
                        )}
                      >
                        {q}
                      </span>
                      {isOpen ? (
                        <Minus className="h-4 w-4 shrink-0 text-primary-soft" />
                      ) : (
                        <Plus className="h-4 w-4 shrink-0 text-ink-subtle" />
                      )}
                    </button>
                  </h3>
                  {/* Inline answer on small screens */}
                  <div
                    id={`faq-panel-${n}`}
                    role="region"
                    aria-labelledby={`faq-btn-${n}`}
                    hidden={!isOpen}
                    className="pb-5 pl-11 text-sm leading-relaxed text-ink-muted lg:hidden"
                  >
                    {a}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Answer panel on large screens */}
          <div className="hidden lg:col-span-6 lg:block" aria-live="polite">
            <div className="sticky top-24 rounded-[var(--radius-card)] border border-line bg-surface p-8 shadow-[var(--shadow-card)]">
              <p className="font-mono text-xs text-primary-soft">
                {num(open)} / {num(COUNT)}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">
                {t(`faq.q${open}` as MessageKey)}
              </h3>
              <p className="mt-4 text-base leading-relaxed text-ink-muted">
                {t(`faq.a${open}` as MessageKey)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
