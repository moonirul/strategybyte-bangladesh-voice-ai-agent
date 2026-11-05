"use client";

import Link from "next/link";
import clsx from "clsx";
import { useT } from "@/i18n";

/** Waveform mark + wordmark. `subtitle` is a dictionary key; pass `null` to hide it. */
export function Logo({
  href = "/",
  subtitle = "brand.subtitle",
  className,
}: {
  href?: string;
  subtitle?: "brand.subtitle" | "brand.portal" | null;
  className?: string;
}) {
  const t = useT();
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center gap-2.5 font-semibold tracking-tight text-ink transition hover:opacity-90",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-lg border border-primary/40 bg-gradient-to-br from-primary/25 to-accent/15"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-soft" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 12h2M7 8v8M11 4v16M15 7v10M19 10v4M21 12h0" />
        </svg>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span>ByteVoice</span>
        {subtitle && (
          <span className="text-xs font-medium tracking-normal text-ink-muted">
            {t(subtitle)}
          </span>
        )}
      </span>
    </Link>
  );
}
