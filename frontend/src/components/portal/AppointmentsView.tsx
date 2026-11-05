"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Check, Search, X } from "lucide-react";
import { getPortalApi } from "@/lib/api/portal-api";
import { useT } from "@/i18n";
import { useFormat } from "@/lib/use-format";
import type { Appointment, AppointmentStatus } from "@/types/domain";
import { AppointmentStatusBadge } from "@/components/ui/Badge";
import {
  Card,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Skeleton,
} from "@/components/ui/Surface";

function defaultScheduleSlot(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(17, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export default function AppointmentsView() {
  const t = useT();
  const fmt = useFormat();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [scheduledSlot, setScheduledSlot] = useState("");
  const [mutationError, setMutationError] = useState<string | null>(null);

  const apptsQuery = useQuery({
    queryKey: ["portal", "appointments", { search, status }],
    queryFn: async () =>
      (await getPortalApi()).listAppointments({
        page: 1,
        pageSize: 25,
        search: search.trim() || undefined,
        status: status || undefined,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
      scheduledStart,
    }: {
      id: string;
      nextStatus: AppointmentStatus;
      scheduledStart?: string;
    }) =>
      (await getPortalApi()).updateAppointment(id, {
        status: nextStatus,
        ...(scheduledStart ? { scheduledStart } : {}),
      }),
    onSuccess: () => {
      setConfirmingId(null);
      setScheduledSlot("");
      setMutationError(null);
      void queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (err) => {
      setMutationError(
        err instanceof Error ? err.message : t("ap.updateFailed"),
      );
    },
  });

  function startConfirm(appt: Appointment) {
    setMutationError(null);
    setConfirmingId(appt.id);
    setScheduledSlot(defaultScheduleSlot());
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("ap.eyebrow")}
        title={t("ap.title")}
        description={t("ap.desc")}
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("ap.search")}
              aria-label={t("ap.searchAria")}
              className="w-full rounded-xl border border-line-strong bg-canvas py-2 pl-9 pr-3.5 text-xs text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
            />
          </div>

          <select
            aria-label={t("ap.filterAria")}
            value={status}
            onChange={(e) => setStatus(e.target.value as AppointmentStatus | "")}
            className="rounded-xl border border-line-strong bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
          >
            <option value="">{t("ap.allStatuses")}</option>
            <option value="requested">{t("booking.requested")}</option>
            <option value="confirmed">{t("appt.confirmed")}</option>
            <option value="completed">{t("appt.completed")}</option>
            <option value="cancelled">{t("appt.cancelled")}</option>
          </select>
        </div>
      </Card>

      {mutationError && (
        <ErrorBanner title={t("ap.validation")} message={mutationError} />
      )}

      {apptsQuery.isError ? (
        <ErrorBanner
          message={
            apptsQuery.error instanceof Error
              ? apptsQuery.error.message
              : t("ap.loadFailed")
          }
          onRetry={() => void apptsQuery.refetch()}
        />
      ) : apptsQuery.isLoading ? (
        <Card className="space-y-3 p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : !apptsQuery.data || apptsQuery.data.items.length === 0 ? (
        <Card>
          <EmptyState
            title={t("ap.noneTitle")}
            description={t("ap.noneDesc")}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {apptsQuery.data.items.map((appt) => (
            <Card key={appt.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/portal/patients/${appt.patient.id}`}
                      className="font-bangla text-base font-semibold text-ink hover:text-primary-soft hover:underline"
                    >
                      {appt.patient.fullName}
                    </Link>
                    <AppointmentStatusBadge status={appt.status} />
                    {appt.bookingReference && (
                      <span className="rounded-md bg-surface-raised px-2 py-0.5 font-mono text-[11px] text-primary-soft">
                        {t("ap.ref", { ref: appt.bookingReference })}
                      </span>
                    )}
                  </div>

                  <p className="font-bangla text-xs text-ink-muted">
                    {t("ap.callerPref")}{" "}
                    <strong className="text-ink">
                      {appt.requestedPreference ?? t("ap.notSpecified")}
                    </strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-subtle">
                    <span>
                      {t("ap.doctor", { doctor: appt.doctor?.fullName ?? t("ap.anyDoctor") })}
                    </span>
                    <span>·</span>
                    <span>
                      {t("ap.confirmedStart")}{" "}
                      <strong className="text-ink-muted">
                        {fmt.dateTime(appt.scheduledStart)}
                      </strong>
                    </span>
                    {appt.callId && (
                      <>
                        <span>·</span>
                        <Link
                          href={`/portal/calls/${appt.callId}`}
                          className="text-primary-soft hover:underline"
                        >
                          {t("ap.sourceCall")}
                        </Link>
                      </>
                    )}
                  </div>
                </div>

                {/* Staff Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {appt.status === "requested" && confirmingId !== appt.id && (
                    <button
                      type="button"
                      onClick={() => startConfirm(appt)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-canvas transition hover:bg-primary-hover"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" />
                      {t("ap.scheduleConfirm")}
                    </button>
                  )}

                  {appt.status === "confirmed" && (
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: appt.id,
                          nextStatus: "completed",
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary"
                    >
                      <Check className="h-3.5 w-3.5 text-primary" />
                      {t("ap.markCompleted")}
                    </button>
                  )}

                  {(appt.status === "requested" ||
                    appt.status === "confirmed") && (
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: appt.id,
                          nextStatus: "cancelled",
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs text-ink-muted transition hover:border-danger hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t("common.cancel")}
                    </button>
                  )}
                </div>
              </div>

              {confirmingId === appt.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!scheduledSlot) return;
                    updateMutation.mutate({
                      id: appt.id,
                      nextStatus: "confirmed",
                      scheduledStart: new Date(scheduledSlot).toISOString(),
                    });
                  }}
                  className="mt-4 flex flex-wrap items-end gap-3 border-t border-line pt-4 text-xs"
                >
                  <div>
                    <label className="block text-ink-muted">
                      {t("ap.slot")}
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={scheduledSlot}
                      onChange={(e) => setScheduledSlot(e.target.value)}
                      className="mt-1 rounded-xl border border-line-strong bg-canvas px-3 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="rounded-xl bg-primary px-4 py-2 font-semibold text-canvas transition hover:bg-primary-hover"
                  >
                    {t("ap.confirmBooking")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-xl border border-line px-3 py-2 text-ink-muted hover:text-ink"
                  >
                    {t("common.cancel")}
                  </button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
