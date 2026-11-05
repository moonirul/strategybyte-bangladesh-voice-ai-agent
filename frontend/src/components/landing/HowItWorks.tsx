"use client";

import { useI18n, type MessageKey } from "@/i18n";
import { toBanglaDigits } from "@/i18n/numerals";

const steps = [
  { n: 1, title: "how.s1.title", desc: "how.s1.desc", sample: "how.s1.sample" },
  { n: 2, title: "how.s2.title", desc: "how.s2.desc", sample: "how.s2.sample" },
  { n: 3, title: "how.s3.title", desc: "how.s3.desc", sample: "how.s3.sample" },
] as const satisfies readonly { n: number; title: MessageKey; desc: MessageKey; sample: MessageKey }[];

export default function HowItWorks() {
  const { t, lang } = useI18n();
  return (
    <section id="how-it-works" className="theme-ivory scroll-mt-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-soft">
            {t("how.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("how.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t("how.desc")}</p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => {
            const num = `0${s.n}`;
            return (
              <li
                key={s.n}
                className="flex flex-col justify-between rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <div>
                  <p
                    aria-hidden="true"
                    className="text-6xl font-semibold leading-none tracking-tight text-primary/25"
                  >
                    {lang === "bn" ? toBanglaDigits(num) : num}
                  </p>
                  <span className="mt-4 block font-mono text-xs font-semibold text-primary-soft">
                    {t("how.step", { n: s.n })}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{t(s.title)}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{t(s.desc)}</p>
                </div>
                <div className="mt-6 rounded-xl border border-line bg-surface-raised px-3.5 py-2.5 font-bangla text-xs text-ink-muted">
                  {t(s.sample)}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
