"use client";

import clsx from "clsx";
import { useT, type MessageKey } from "@/i18n";
import type {
  AppointmentStatus,
  BookingStatus,
  CallMode,
  CallOutcome,
  CallStatus,
  FollowUpStatus,
} from "@/types/domain";

const tones = {
  teal: "tone-teal",
  blue: "tone-blue",
  amber: "tone-amber",
  rose: "tone-rose",
  slate: "tone-slate",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CallModeBadge({ mode }: { mode: CallMode }) {
  const t = useT();
  return mode === "demo" ? (
    <Badge tone="amber">{t("mode.demo")}</Badge>
  ) : (
    <Badge tone="teal">{t("mode.live")}</Badge>
  );
}

const statusMap: Record<CallStatus, { label: MessageKey; tone: BadgeTone }> = {
  initiated: { label: "callStatus.initiated", tone: "blue" },
  in_progress: { label: "callStatus.in_progress", tone: "blue" },
  completed: { label: "callStatus.completed", tone: "teal" },
  abandoned: { label: "callStatus.abandoned", tone: "amber" },
  failed: { label: "callStatus.failed", tone: "rose" },
};

export function CallStatusBadge({ status }: { status: CallStatus }) {
  const t = useT();
  const cfg = statusMap[status];
  return <Badge tone={cfg?.tone ?? "slate"}>{cfg ? t(cfg.label) : status}</Badge>;
}

const outcomeMap: Record<CallOutcome, { label: MessageKey; tone: BadgeTone }> = {
  appointment_requested: { label: "outcome.appointment_requested", tone: "blue" },
  faq_answered: { label: "outcome.faq_answered", tone: "teal" },
  followup_required: { label: "outcome.followup_required", tone: "amber" },
  incomplete: { label: "outcome.incomplete", tone: "slate" },
  no_action: { label: "outcome.no_action", tone: "slate" },
};

export function CallOutcomeBadge({ outcome }: { outcome: CallOutcome | null }) {
  const t = useT();
  if (!outcome) return <span className="text-xs text-ink-subtle">—</span>;
  const cfg = outcomeMap[outcome];
  return <Badge tone={cfg?.tone ?? "slate"}>{cfg ? t(cfg.label) : outcome}</Badge>;
}

const bookingMap: Record<BookingStatus, { label: MessageKey; tone: BadgeTone }> = {
  none: { label: "booking.none", tone: "slate" },
  requested: { label: "booking.requested", tone: "amber" },
  confirmed: { label: "booking.confirmed", tone: "teal" },
  declined: { label: "booking.declined", tone: "rose" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const t = useT();
  const cfg = bookingMap[status];
  return <Badge tone={cfg?.tone ?? "slate"}>{cfg ? t(cfg.label) : status}</Badge>;
}

const apptMap: Record<AppointmentStatus, { label: MessageKey; tone: BadgeTone }> = {
  requested: { label: "appt.requested", tone: "amber" },
  confirmed: { label: "appt.confirmed", tone: "teal" },
  completed: { label: "appt.completed", tone: "blue" },
  cancelled: { label: "appt.cancelled", tone: "rose" },
  no_show: { label: "appt.no_show", tone: "slate" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const t = useT();
  const cfg = apptMap[status];
  return <Badge tone={cfg?.tone ?? "slate"}>{cfg ? t(cfg.label) : status}</Badge>;
}

const followUpMap: Record<FollowUpStatus, { label: MessageKey; tone: BadgeTone }> = {
  open: { label: "followUp.open", tone: "amber" },
  in_progress: { label: "followUp.in_progress", tone: "blue" },
  resolved: { label: "followUp.resolved", tone: "teal" },
  cancelled: { label: "followUp.cancelled", tone: "slate" },
};

export function FollowUpStatusBadge({ status }: { status: FollowUpStatus }) {
  const t = useT();
  const cfg = followUpMap[status];
  return <Badge tone={cfg?.tone ?? "slate"}>{cfg ? t(cfg.label) : status}</Badge>;
}
