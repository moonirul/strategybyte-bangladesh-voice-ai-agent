"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { TalkToBanglaCallerButton } from "@/components/voice/VoiceCallModal";
import { demoClinic } from "@/config/demo-clinic";
import { env } from "@/lib/env";
import { LanguageToggle, useI18n } from "@/i18n";

export default function FinalCtaFooter() {
  const { t, lang } = useI18n();
  const clinic = lang === "bn" ? demoClinic.nameBn : demoClinic.name;
  return (
    <>
      <section id="contact" className="scroll-mt-4 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-line-strong bg-surface p-8 text-center shadow-[var(--shadow-card)] sm:p-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-[520px] max-w-full -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
            />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-soft">
                {t("cta.eyebrow")}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
                {t("cta.desc", { clinic })}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                <TalkToBanglaCallerButton />
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface-raised px-5 py-3 text-sm font-medium text-ink transition hover:border-primary hover:text-primary-soft"
                >
                  <span>{t("cta.goPortal")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {env.contactEmail && (
                <p className="mt-6 text-xs text-ink-muted">
                  {t("cta.contact")}{" "}
                  <a
                    href={`mailto:${env.contactEmail}`}
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    {env.contactEmail}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 text-xs text-ink-muted sm:px-6 lg:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Logo />
            <span className="text-ink-subtle">·</span>
            <span>{t("footer.tagline")}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="#product" className="hover:text-ink">{t("nav.product")}</a>
            <a href="#how-it-works" className="hover:text-ink">{t("nav.how")}</a>
            <a href="#use-cases" className="hover:text-ink">{t("nav.useCases")}</a>
            <a href="#pricing" className="hover:text-ink">{t("nav.pricing")}</a>
            <a href="#faq" className="hover:text-ink">{t("nav.faq")}</a>
            <Link href="/portal" className="hover:text-ink">{t("nav.portal")}</Link>
            <LanguageToggle />
          </div>
        </div>
      </footer>
    </>
  );
}
