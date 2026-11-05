"use client";

import { BellRing, Building2, FlaskConical, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { demoClinic } from "@/config/demo-clinic";
import { useI18n, type MessageKey } from "@/i18n";

const useCases = [
  { icon: Stethoscope, id: "u1", tone: "teal" },
  { icon: FlaskConical, id: "u2", tone: "blue" },
  { icon: Building2, id: "u3", tone: "blue" },
  { icon: BellRing, id: "u4", tone: "amber" },
] as const;

export default function UseCases() {
  const { t, lang } = useI18n();
  const clinic = lang === "bn" ? demoClinic.nameBn : demoClinic.name;
  return (
    <section id="use-cases" className="theme-ivory scroll-mt-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-soft">
            {t("uc.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("uc.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t("uc.desc")}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {useCases.map(({ icon: Icon, id, tone }) => (
            <div
              key={id}
              className="rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-line-strong bg-surface-raised text-primary-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <Badge tone={tone}>{t(`uc.${id}.badge` as MessageKey, { clinic })}</Badge>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">
                {t(`uc.${id}.title` as MessageKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t(`uc.${id}.desc` as MessageKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
