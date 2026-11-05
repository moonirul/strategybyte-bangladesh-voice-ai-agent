"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useVoiceModal } from "@/components/voice/VoiceCallModal";
import { LanguageToggle, useT } from "@/i18n";

const navItems = [
  { href: "#product", key: "nav.product" },
  { href: "#how-it-works", key: "nav.how" },
  { href: "#use-cases", key: "nav.useCases" },
  { href: "#pricing", key: "nav.pricing" },
  { href: "#faq", key: "nav.faq" },
] as const;

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openCallModal } = useVoiceModal();
  const t = useT();

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <nav
        aria-label={t("nav.primary")}
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 rounded-full border border-line-strong bg-surface/85 pl-4 pr-2 shadow-[var(--shadow-card)] backdrop-blur-md sm:pl-5"
      >
        <Logo />

        <ul className="hidden items-center gap-6 text-sm text-ink-muted lg:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="whitespace-nowrap transition hover:text-ink">
                {t(item.key)}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2.5 lg:flex">
          <LanguageToggle />
          <Link
            href="/portal"
            className="hidden whitespace-nowrap rounded-full border border-line-strong px-4 py-2 text-xs font-medium text-ink transition hover:border-primary hover:text-primary-soft xl:inline-flex"
          >
            {t("nav.portal")}
          </Link>
          <button
            type="button"
            onClick={() => openCallModal("demo")}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-canvas shadow-[var(--shadow-glow)] transition hover:bg-primary-hover"
          >
            <Phone className="h-3.5 w-3.5" />
            {t("nav.callCta")}
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileOpen ? t("nav.menuClose") : t("nav.menuOpen")}
            className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition hover:text-ink"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          id="mobile-nav-menu"
          className="mx-auto mt-2 max-w-6xl rounded-3xl border border-line-strong bg-surface px-5 py-5 shadow-[var(--shadow-card)] lg:hidden"
        >
          <ul className="space-y-1 text-sm">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-2 py-2 text-ink transition hover:text-primary-soft"
                >
                  {t(item.key)}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2.5 border-t border-line pt-4">
            <Link
              href="/portal"
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-line-strong px-4 py-2.5 text-center text-xs font-medium text-ink"
            >
              {t("nav.portal")}
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                openCallModal("demo");
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-canvas"
            >
              <Phone className="h-3.5 w-3.5" />
              {t("nav.callCta")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
