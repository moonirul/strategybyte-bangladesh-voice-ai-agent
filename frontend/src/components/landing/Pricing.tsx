"use client";

import clsx from "clsx";
import { Check, Info } from "lucide-react";
import { demoPlans, type DemoPlan } from "@/config/demo-pricing";
import { useI18n, type MessageKey } from "@/i18n";
import { formatTaka } from "@/i18n/numerals";

/**
 * Illustrative pricing only. Reads from config/demo-pricing.ts — never from the
 * backend — and has no checkout or payment behaviour (buttons just scroll to #contact).
 */
const rows = [
  { label: "price.col.talk", value: (id: DemoPlan["id"]) => `price.${id}.talk` },
  { label: "price.col.numbers", value: (id: DemoPlan["id"]) => `price.${id}.numbers` },
  { label: "price.col.locations", value: (id: DemoPlan["id"]) => `price.${id}.locations` },
  { label: "price.col.portal", value: () => "price.all.portal" },
  { label: "price.col.booking", value: () => "price.all.booking" },
  { label: "price.col.support", value: (id: DemoPlan["id"]) => `price.${id}.support` },
] as const;

export default function Pricing() {
  const { t, lang, taka } = useI18n();
  const otherLang = lang === "bn" ? "en" : "bn";

  return (
    <section id="pricing" className="scroll-mt-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-soft">
              {t("price.eyebrow")}
            </p>
            <span className="tone-amber inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset">
              {t("price.badge")} · {t("price.illustrative")}
            </span>
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("price.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t("price.desc")}</p>
        </div>

        <div
          role="note"
          className="mt-6 flex items-start gap-2.5 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-ink"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>{t("price.note")}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {demoPlans.map((plan) => {
            const featured = Boolean(plan.featured);
            const name = t(`price.${plan.id}.name` as MessageKey);
            return (
              <article
                key={plan.id}
                className={clsx(
                  "relative flex flex-col rounded-[var(--radius-card)] border p-6",
                  featured
                    ? "border-primary/60 bg-gradient-to-b from-surface-strong/60 to-surface text-ink shadow-[var(--shadow-glow)]"
                    : "theme-ivory border-line bg-surface text-ink shadow-[var(--shadow-card)]",
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-canvas">
                    {t("price.featured")}
                  </span>
                )}

                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="mt-1 min-h-10 text-xs leading-relaxed text-ink-muted">
                  {t(`price.${plan.id}.tag` as MessageKey)}
                </p>

                <div className="mt-5 min-h-[7.25rem]">
                  {plan.monthlyBdt === null ? (
                    <p className="text-3xl font-semibold tracking-tight">{t("price.letsTalk")}</p>
                  ) : (
                    <>
                      <p className="flex items-baseline gap-1">
                        <span className="text-4xl font-semibold tracking-tight">
                          {taka(plan.monthlyBdt)}
                        </span>
                        <span className="text-sm text-ink-muted">{t("price.perMonth")}</span>
                      </p>
                      <p className="mt-1 text-xs text-ink-subtle">
                        {t("price.otherLang", { value: formatTaka(plan.monthlyBdt, otherLang) })}
                      </p>
                    </>
                  )}
                  <span className="tone-amber mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset">
                    {t("price.badge")}
                  </span>
                </div>

                <ul className="mt-5 flex-1 space-y-3 border-t border-line pt-5 text-sm">
                  {rows.map((row) => (
                    <li key={row.label} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>
                        <span className="block text-[11px] text-ink-subtle">
                          {t(row.label)}
                        </span>
                        <span className="text-ink">{t(row.value(plan.id) as MessageKey)}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
                  className={clsx(
                    "mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition",
                    featured
                      ? "bg-primary text-canvas hover:bg-primary-hover"
                      : "border border-line-strong text-ink hover:border-primary hover:text-primary-soft",
                  )}
                >
                  {plan.monthlyBdt === null ? t("price.ctaEnterprise") : t("price.cta")}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
