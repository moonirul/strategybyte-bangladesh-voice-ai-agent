"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { getPortalApi } from "@/lib/api/portal-api";
import { useT } from "@/i18n";
import { useFormat } from "@/lib/use-format";
import type { CallMode, CallOutcome, CallStatus } from "@/types/domain";
import {
  BookingStatusBadge,
  CallModeBadge,
  CallOutcomeBadge,
  CallStatusBadge,
} from "@/components/ui/Badge";
import {
  Card,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Skeleton,
} from "@/components/ui/Surface";

export default function CallsListView() {
  const t = useT();
  const fmt = useFormat();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CallStatus | "">("");
  const [outcome, setOutcome] = useState<CallOutcome | "">("");
  const [mode, setMode] = useState<CallMode | "">("");
  const [sort, setSort] = useState<
    "started_at" | "-started_at" | "duration" | "-duration"
  >("-started_at");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const callsQuery = useQuery({
    queryKey: [
      "portal",
      "calls",
      { page, pageSize, search, status, outcome, mode, sort },
    ],
    queryFn: async () =>
      (await getPortalApi()).listCalls({
        page,
        pageSize,
        search: search.trim() || undefined,
        status: status || undefined,
        outcome: outcome || undefined,
        mode: mode || undefined,
        sort,
      }),
  });

  function toggleSort(field: "started_at" | "duration") {
    setPage(1);
    setSort((cur) => (cur === `-${field}` ? field : `-${field}`));
  }

  const data = callsQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("calls.eyebrow")}
        title={t("calls.title")}
        description={t("calls.desc")}
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("calls.search")}
              aria-label={t("calls.searchAria")}
              className="w-full rounded-xl border border-line-strong bg-canvas py-2 pl-9 pr-3.5 text-xs text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
            />
          </div>

          <select
            aria-label={t("calls.filterMode")}
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as CallMode | "");
              setPage(1);
            }}
            className="rounded-xl border border-line-strong bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
          >
            <option value="">{t("calls.allModes")}</option>
            <option value="demo">{t("mode.demo")}</option>
            <option value="live">{t("mode.live")}</option>
          </select>

          <select
            aria-label={t("calls.filterStatus")}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as CallStatus | "");
              setPage(1);
            }}
            className="rounded-xl border border-line-strong bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
          >
            <option value="">{t("calls.allStatuses")}</option>
            <option value="completed">{t("callStatus.completed")}</option>
            <option value="in_progress">{t("callStatus.in_progress")}</option>
            <option value="abandoned">{t("callStatus.abandoned")}</option>
            <option value="failed">{t("callStatus.failed")}</option>
          </select>

          <select
            aria-label={t("calls.filterOutcome")}
            value={outcome}
            onChange={(e) => {
              setOutcome(e.target.value as CallOutcome | "");
              setPage(1);
            }}
            className="rounded-xl border border-line-strong bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
          >
            <option value="">{t("calls.allOutcomes")}</option>
            <option value="appointment_requested">{t("outcome.appointment_requested")}</option>
            <option value="faq_answered">{t("outcome.faq_answered")}</option>
            <option value="followup_required">{t("outcome.followup_required")}</option>
            <option value="incomplete">{t("outcome.incomplete")}</option>
          </select>
        </div>
      </Card>

      {callsQuery.isError ? (
        <ErrorBanner
          message={
            callsQuery.error instanceof Error
              ? callsQuery.error.message
              : t("calls.loadFailed")
          }
          onRetry={() => void callsQuery.refetch()}
        />
      ) : callsQuery.isLoading ? (
        <Card className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <EmptyState
            title={t("calls.noneTitle")}
            description={t("calls.noneDesc")}
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-surface-raised/60 text-xs text-ink-muted">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort("started_at")}
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        <span>{t("calls.col.dateTime")}</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-medium">{t("calls.col.patient")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("calls.col.phone")}</th>
                    <th className="px-5 py-3.5 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort("duration")}
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        <span>{t("calls.col.duration")}</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3.5 font-medium">{t("calls.col.mode")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("calls.col.status")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("calls.col.outcome")}</th>
                    <th className="px-5 py-3.5 font-medium">{t("calls.col.booking")}</th>
                    <th className="px-5 py-3.5 text-right font-medium">{t("calls.col.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((call) => (
                    <tr
                      key={call.id}
                      className="transition hover:bg-surface-hover/50"
                    >
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-ink-muted">
                        {fmt.dateTime(call.startedAt)}
                      </td>
                      <td className="px-5 py-3.5 font-bangla font-medium text-ink">
                        {call.patient ? (
                          <Link
                            href={`/portal/patients/${call.patient.id}`}
                            className="hover:text-primary-soft hover:underline"
                          >
                            {call.patient.fullName}
                          </Link>
                        ) : (
                          <span className="font-sans text-xs text-ink-subtle">
                            {t("calls.unidentified")}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-ink-muted">
                        {call.phoneDisplay ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-ink-muted">
                        {fmt.duration(call.durationSeconds)}
                      </td>
                      <td className="px-5 py-3.5">
                        <CallModeBadge mode={call.callMode} />
                      </td>
                      <td className="px-5 py-3.5">
                        <CallStatusBadge status={call.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <CallOutcomeBadge outcome={call.outcome} />
                      </td>
                      <td className="px-5 py-3.5">
                        <BookingStatusBadge status={call.bookingStatus} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <Link
                          href={`/portal/calls/${call.id}`}
                          className="rounded-lg border border-line-strong px-2.5 py-1 text-xs font-medium text-primary-soft transition hover:border-primary"
                        >
                          {t("calls.open")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card List (responsive alternative to dense table) */}
          <div className="space-y-3 md:hidden">
            {data.items.map((call) => (
              <Card key={call.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bangla text-sm font-semibold text-ink">
                      {call.patient?.fullName ?? t("common.unidentified")}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {fmt.dateTime(call.startedAt)} ·{" "}
                      {fmt.duration(call.durationSeconds)}
                    </p>
                  </div>
                  <CallModeBadge mode={call.callMode} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <CallStatusBadge status={call.status} />
                  <CallOutcomeBadge outcome={call.outcome} />
                  <BookingStatusBadge status={call.bookingStatus} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-xs">
                  <span className="font-mono text-ink-muted">
                    {call.phoneDisplay ?? t("calls.noPhone")}
                  </span>
                  <Link
                    href={`/portal/calls/${call.id}`}
                    className="font-semibold text-primary-soft"
                  >
                    {t("calls.inspect")}
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>
              {t("calls.page", { page: data.page, total: totalPages, count: data.total })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-ink disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t("common.previous")}
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-ink disabled:opacity-40"
              >
                {t("common.next")}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
