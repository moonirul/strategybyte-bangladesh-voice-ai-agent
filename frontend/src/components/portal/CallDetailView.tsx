"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileAudio,
  MessageSquareText,
  User,
} from "lucide-react";
import { getPortalApi } from "@/lib/api/portal-api";
import { useT } from "@/i18n";
import { useFormat } from "@/lib/use-format";
import {
  AppointmentStatusBadge,
  Badge,
  BookingStatusBadge,
  CallModeBadge,
  CallOutcomeBadge,
  CallStatusBadge,
  FollowUpStatusBadge,
} from "@/components/ui/Badge";
import {
  Card,
  EmptyState,
  ErrorBanner,
  Skeleton,
} from "@/components/ui/Surface";

export default function CallDetailView({ callId }: { callId: string }) {
  const t = useT();
  const fmt = useFormat();
  const callQuery = useQuery({
    queryKey: ["portal", "call", callId],
    queryFn: async () => (await getPortalApi()).getCall(callId),
  });

  if (callQuery.isError) {
    return (
      <div className="space-y-4">
        <Link
          href="/portal/calls"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("call.back")}
        </Link>
        <ErrorBanner
          title={t("call.loadFailed")}
          message={
            callQuery.error instanceof Error
              ? callQuery.error.message
              : t("call.notFound")
          }
          onRetry={() => void callQuery.refetch()}
        />
      </div>
    );
  }

  if (callQuery.isLoading || !callQuery.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const call = callQuery.data;
  const ex = call.extraction;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/portal/calls"
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("call.backList")}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {t("call.title")}
            </h1>
            <CallModeBadge mode={call.callMode} />
            <CallStatusBadge status={call.status} />
            <CallOutcomeBadge outcome={call.outcome} />
          </div>
          <p className="mt-1 font-mono text-xs text-ink-subtle">
            {t("call.meta", {
              id: call.id,
              provider: call.provider,
              started: fmt.dateTime(call.startedAt),
            })}
          </p>
        </div>

        <BookingStatusBadge status={call.bookingStatus} />
      </div>

      {/* Follow-up alert if required */}
      {call.requiresFollowup && (
        <div className="tone-amber flex items-start justify-between gap-4 rounded-2xl p-4 text-xs ring-1 ring-inset">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-ink">
                {t("call.followUpTitle")}
              </p>
              <p className="mt-0.5">
                {call.followUp?.reason ?? t("call.followUpDefault")}
              </p>
            </div>
          </div>
          {call.followUp && (
            <div className="flex items-center gap-2">
              <FollowUpStatusBadge status={call.followUp.status} />
              <Link
                href="/portal/follow-ups"
                className="underline underline-offset-4 hover:text-ink"
              >
                {t("call.manage")}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Metadata & Extracted Clinical Fields */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <User className="h-4 w-4 text-primary-soft" />
            <h2 className="text-sm font-semibold text-ink">
              {t("call.metaTitle")}
            </h2>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-ink-subtle">{t("call.patient")}</dt>
              <dd className="mt-1 font-bangla text-sm font-medium text-ink">
                {call.patient ? (
                  <Link
                    href={`/portal/patients/${call.patient.id}`}
                    className="text-primary-soft hover:underline"
                  >
                    {call.patient.fullName}
                  </Link>
                ) : (
                  t("common.unidentified")
                )}
              </dd>
            </div>

            <div>
              <dt className="text-ink-subtle">{t("call.phone")}</dt>
              <dd className="mt-1 font-mono text-ink">
                {call.patientPhone ?? call.phoneDisplay ?? "—"}
              </dd>
            </div>

            <div>
              <dt className="text-ink-subtle">{t("call.duration")}</dt>
              <dd className="mt-1 font-mono text-ink">
                {fmt.duration(call.durationSeconds)}
              </dd>
            </div>

            <div>
              <dt className="text-ink-subtle">{t("call.endedAt")}</dt>
              <dd className="mt-1 text-ink">{fmt.dateTime(call.endedAt)}</dd>
            </div>
          </dl>

          {call.appointment && (
            <div className="rounded-xl border border-line bg-surface-raised p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink">{t("call.linkedAppt")}</span>
                <AppointmentStatusBadge status={call.appointment.status} />
              </div>
              <p className="mt-1 text-ink-muted">
                {call.appointment.status === "requested"
                  ? t("call.apptRequested")
                  : t("call.apptScheduled")}
              </p>
              <Link
                href="/portal/appointments"
                className="mt-2 inline-block font-semibold text-primary-soft hover:underline"
              >
                {t("call.openAppts")}
              </Link>
            </div>
          )}

          {/* Recording Playback — only rendered when a real, authorised URL exists */}
          {call.recordingUrl ? (
            <div className="rounded-xl border border-line bg-surface-raised p-3.5 text-xs">
              <div className="flex items-center gap-2 font-medium text-ink">
                <FileAudio className="h-4 w-4 text-primary-soft" />
                <span>{t("call.recording")}</span>
              </div>
              <audio
                controls
                preload="none"
                src={call.recordingUrl}
                className="mt-2.5 w-full"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-line/60 bg-surface-raised/40 px-3.5 py-2.5 text-[11px] text-ink-subtle">
              {t("call.noRecording", {
                reason: call.callMode === "demo" ? t("call.noRecording.demo") : t("call.noRecording.other"),
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary-soft" />
              <h2 className="text-sm font-semibold text-ink">
                {t("call.extractTitle")}
              </h2>
            </div>
            {ex && (
              <div className="flex items-center gap-1.5">
                <Badge tone={ex.patientNameConfirmed ? "teal" : "slate"}>
                  {ex.patientNameConfirmed ? t("call.nameConfirmed") : t("call.nameUnconfirmed")}
                </Badge>
                <Badge tone={ex.phoneConfirmed ? "teal" : "slate"}>
                  {ex.phoneConfirmed ? t("call.phoneConfirmed") : t("call.phoneUnconfirmed")}
                </Badge>
              </div>
            )}
          </div>

          {!ex ? (
            <EmptyState
              title={t("call.noExtraction")}
              description={t("call.noExtractionDesc")}
            />
          ) : (
            <dl className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-surface-raised p-3.5">
                <dt className="text-ink-subtle">{t("call.intent")}</dt>
                <dd className="mt-1 text-sm font-medium capitalize text-ink">
                  {ex.intent ?? t("call.unknown")}
                </dd>
              </div>

              <div className="rounded-xl border border-line bg-surface-raised p-3.5">
                <dt className="text-ink-subtle">{t("call.reason")}</dt>
                <dd className="mt-1 font-bangla text-sm font-medium text-ink">
                  {ex.reasonForVisit ?? "—"}
                </dd>
              </div>

              <div className="rounded-xl border border-line bg-surface-raised p-3.5">
                <dt className="text-ink-subtle">{t("call.spoken")}</dt>
                <dd className="mt-1 font-bangla text-sm text-ink">
                  {ex.preferredDateText ?? "—"}
                </dd>
              </div>

              <div className="rounded-xl border border-line bg-surface-raised p-3.5">
                <dt className="text-ink-subtle">{t("call.parsed")}</dt>
                <dd className="mt-1 font-mono text-sm text-ink">
                  {ex.preferredDate || ex.preferredTime ? (
                    <>
                      {ex.preferredDate ? fmt.shortDate(ex.preferredDate) : t("call.dateTbd")}{" "}
                      · {ex.preferredTime ?? t("call.timeTbd")}
                    </>
                  ) : (
                    <span className="font-sans text-xs text-warning">
                      {t("call.ambiguous")}
                    </span>
                  )}
                </dd>
              </div>

              <div className="rounded-xl border border-line bg-surface-raised p-3.5">
                <dt className="text-ink-subtle">{t("call.doctorPref")}</dt>
                <dd className="mt-1 text-sm text-ink">
                  {ex.preferredDoctor ?? t("call.noDoctor")}
                </dd>
              </div>

              <div className="rounded-xl border border-line bg-surface-raised p-3.5">
                <dt className="text-ink-subtle">{t("call.bookingState")}</dt>
                <dd className="mt-1.5 flex items-center gap-2">
                  <BookingStatusBadge status={ex.bookingStatus} />
                </dd>
              </div>
            </dl>
          )}
        </Card>
      </div>

      {/* Full Sequenced Transcript */}
      <Card className="p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-primary-soft" />
            <h2 className="text-base font-semibold text-ink">
              {t("call.transcript", { count: call.transcript.length })}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            {t("call.sequenced")}
          </span>
        </div>

        {call.transcript.length === 0 ? (
          <EmptyState
            title={t("call.noTranscript")}
            description={t("call.noTranscriptDesc")}
          />
        ) : (
          <ol className="mt-5 space-y-4">
            {call.transcript.map((turn) => (
              <li
                key={turn.id || turn.sequenceNumber}
                className={clsx(
                  "flex flex-col gap-1",
                  turn.speaker === "caller" ? "items-end" : "items-start",
                )}
              >
                <div className="flex items-center gap-2 text-[11px] text-ink-subtle">
                  <span className="font-mono">#{fmt.n(turn.sequenceNumber + 1)}</span>
                  <span className="font-semibold uppercase tracking-wider text-ink-muted">
                    {turn.speaker === "assistant"
                      ? t("call.speaker.assistant")
                      : t("call.speaker.caller")}
                  </span>
                  <span className="font-mono">
                    {fmt.timestampMs(turn.timestampMs)}
                  </span>
                </div>
                <div
                  className={clsx(
                    "max-w-2xl rounded-2xl px-4 py-3 font-bangla text-sm leading-relaxed",
                    turn.speaker === "caller"
                      ? "bg-primary/15 text-ink ring-1 ring-primary/35"
                      : "bg-surface-raised text-ink ring-1 ring-line",
                  )}
                >
                  <p>{turn.textBn}</p>
                  {turn.textEn && (
                    <p className="mt-1 border-t border-line/60 pt-1 font-sans text-xs text-ink-muted">
                      {turn.textEn}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
