"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import HeroSceneLoader from "@/components/three/HeroSceneLoader";
import { TalkToBanglaCallerButton } from "@/components/voice/VoiceCallModal";
import { Badge } from "@/components/ui/Badge";
import { demoClinic } from "@/config/demo-clinic";
import { useI18n } from "@/i18n";

/** Brand headline pair. English headline + Bangla signature line are kept verbatim. */
const HEADLINE_EN = "Every patient call deserves an answer.";
const TAGLINE_BN = "আপনার ক্লিনিকের প্রতিটি কলের উত্তর দিন—সহজ, স্বাভাবিক বাংলায়।";

const valueKeys = ["hero.vp1", "hero.vp2", "hero.vp3", "hero.vp4"] as const;

export default function Hero() {
  const { t, lang } = useI18n();
  const clinic = lang === "bn" ? demoClinic.nameBn : demoClinic.name;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 left-1/2 h-[440px] w-[820px] max-w-full -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-12 sm:px-6 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-7">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-line-strong bg-surface/90 px-3.5 py-1.5 text-xs text-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-primary-soft" />
            <span>{t("hero.badge", { clinic })}</span>
            <Badge tone="amber">{t("hero.demoMode")}</Badge>
          </div>

          {lang === "bn" ? (
            <h1
              lang="bn"
              className="mt-6 font-bangla text-4xl font-semibold text-ink sm:text-5xl lg:text-[3.1rem]"
            >
              {TAGLINE_BN}
            </h1>
          ) : (
            <>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
                {HEADLINE_EN}
              </h1>
              <p
                lang="bn"
                className="mt-4 font-bangla text-xl font-medium leading-relaxed text-primary-soft sm:text-2xl"
              >
                {TAGLINE_BN}
              </p>
            </>
          )}

          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted">
            {t("hero.desc")}
          </p>

          <ul className="mt-6 grid gap-2.5 text-sm text-ink-muted sm:grid-cols-2">
            {valueKeys.map((k) => (
              <li key={k} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <TalkToBanglaCallerButton />
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-5 py-3 text-sm font-medium text-ink transition hover:border-primary hover:text-primary-soft"
            >
              <span>{t("hero.openPortal")}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 max-w-xl text-xs leading-relaxed text-ink-subtle">{t("hero.note")}</p>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative h-[340px] w-full rounded-[var(--radius-card)] border border-line bg-surface/60 sm:h-[400px]">
            <HeroSceneLoader />
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-line bg-canvas/85 px-3 py-1 text-[11px] text-ink-muted backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>{t("hero.orbLabel")}</span>
            </div>
          </div>

          <div className="relative z-10 -mt-12 mx-3 rounded-2xl border border-line-strong bg-surface-raised/95 p-4 shadow-[var(--shadow-card)] backdrop-blur sm:mx-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-ink">{t("hero.sampleRecord", { clinic })}</span>
              <Badge tone="amber">{t("hero.sampleStatus")}</Badge>
            </div>
            <p lang="bn" className="mt-2 font-bangla text-xs leading-relaxed text-ink-muted">
              “আমি আগামীকাল বিকাল ৫টায় ডা. ফারজানা হকের কাছে দাঁতে ব্যথার জন্য অ্যাপয়েন্টমেন্ট নিতে
              চাই।”
            </p>
            {lang === "en" && (
              <p className="mt-1 text-[11px] leading-relaxed text-ink-subtle">
                {t("hero.sampleQuoteEn")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px] text-ink-subtle">
              <span>{t("hero.sampleIntent")}</span>
              <span className="font-mono text-ink-muted">
                {t("hero.samplePhone")}: +880 17•• •••678
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
