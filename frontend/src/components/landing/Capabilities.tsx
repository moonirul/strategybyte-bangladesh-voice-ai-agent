"use client";

import {
  CalendarClock,
  FileCheck2,
  HelpCircle,
  Languages,
  LayoutList,
  PhoneForwarded,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useT, type MessageKey } from "@/i18n";

const capabilities = [
  { icon: Languages, id: "c1" },
  { icon: CalendarClock, id: "c2" },
  { icon: UserCheck, id: "c3" },
  { icon: HelpCircle, id: "c4" },
  { icon: PhoneForwarded, id: "c5" },
  { icon: FileCheck2, id: "c6" },
  { icon: LayoutList, id: "c7" },
] as const;

export default function Capabilities() {
  const t = useT();
  return (
    <section id="product" className="scroll-mt-4 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-soft">
            {t("caps.eyebrow")}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("caps.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t("caps.desc")}</p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, id }) => (
            <article
              key={id}
              className="flex flex-col justify-between rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-[var(--shadow-card)] transition hover:border-line-strong"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary-soft">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge tone="teal">{t("caps.status")}</Badge>
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink">
                  {t(`caps.${id}.title` as MessageKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {t(`caps.${id}.desc` as MessageKey)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
