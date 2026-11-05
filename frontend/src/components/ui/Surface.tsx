"use client";

import clsx from "clsx";
import { useT } from "@/i18n";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-soft">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx("animate-pulse rounded-lg bg-surface-hover/80", className)}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface-raised text-ink-muted">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="mt-3.5 text-sm font-medium text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorBanner({
  title,
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  const t = useT();
  return (
    <Card className="border-danger/40 bg-danger/10 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-ink">{title ?? t("common.loadFailed")}</p>
          <p className="mt-1 text-ink-muted">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("common.tryAgain")}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
