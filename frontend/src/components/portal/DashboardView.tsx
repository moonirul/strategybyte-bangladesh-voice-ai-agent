"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
} from "lucide-react";
import { getPortalApi } from "@/lib/api/portal-api";
import { useT } from "@/i18n";
import { useFormat } from "@/lib/use-format";
import {
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

export default function DashboardView() {
  const t = useT();
  const fmt = useFormat();
  const summaryQuery = useQuery({
    queryKey: ["portal", "dashboard"],
    queryFn: async () => (await getPortalApi()).dashboard(),
  });

  const recentCallsQuery = useQuery({
    queryKey: ["portal", "calls", { page: 1, pageSize: 5, sort: "-started_at" }],
    queryFn: async () =>
      (await getPortalApi()).listCalls({ page: 1, pageSize: 5, sort: "-started_at" }),
  });

  if (summaryQuery.isError) {
    return (
      <div>
        <PageHeader
          eyebrow={t("dash.eyebrow")}
          title={t("dash.title")}
          description={t("dash.descShort")}
        />
        <ErrorBanner
          message={
            summaryQuery.error instanceof Error
              ? summaryQuery.error.message
              : t("dash.loadFailed")
          }
          onRetry={() => void summaryQuery.refetch()}
        />
      </div>
    );
  }

  const s = summaryQuery.data;

  const metrics = [
    {
      label: t("dash.m.total"),
      value: s?.totalCalls ?? 0,
      icon: PhoneCall,
      href: "/portal/calls",
      sub: t("dash.m.total.sub"),
    },
    {
      label: t("dash.m.today"),
      value: s?.callsToday ?? 0,
      icon: PhoneIncoming,
      href: "/portal/calls",
      sub: t("dash.m.today.sub"),
    },
    {
      label: t("dash.m.completed"),
      value: s?.completedCalls ?? 0,
      icon: CheckCircle2,
      href: "/portal/calls?status=completed",
      sub: t("dash.m.completed.sub"),
    },
    {
      label: t("dash.m.requests"),
      value: s?.appointmentRequests ?? 0,
      icon: CalendarClock,
      href: "/portal/appointments?status=requested",
      sub: t("dash.m.requests.sub"),
    },
    {
      label: t("dash.m.confirmed"),
      value: s?.confirmedAppointments ?? 0,
      icon: CalendarCheck,
      href: "/portal/appointments?status=confirmed",
      sub: t("dash.m.confirmed.sub"),
    },
    {
      label: t("dash.m.followups"),
      value: s?.pendingFollowUps ?? 0,
      icon: PhoneForwarded,
      href: "/portal/follow-ups?status=open",
      sub: t("dash.m.followups.sub"),
    },
  ];

  const maxDaily = Math.max(
    1,
    ...(s?.callsByDay.map((d) => d.demo + d.live) ?? [1]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("dash.eyebrow")}
        title={t("dash.title")}
        description={t("dash.desc")}
        actions={
          <Link
            href="/portal/calls"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3.5 py-2 text-xs font-medium text-ink transition hover:border-primary"
          >
            <span>{t("dash.viewAll")}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryQuery.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-3 h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-36" />
              </Card>
            ))
          : metrics.map(({ label, value, icon: Icon, href, sub }) => (
              <Link key={label} href={href} className="group block">
                <Card className="h-full p-5 transition group-hover:border-primary/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-muted">{label}</span>
                    <div className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface-raised text-primary-soft">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                    {fmt.n(value)}
                  </p>
                  <p className="mt-1 text-xs text-ink-subtle">{sub}</p>
                </Card>
              </Link>
            ))}
      </div>

      {/* Activity & Outcomes */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="p-6 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-ink">
                {t("dash.activity")}
              </h2>
              <p className="text-xs text-ink-muted">
                {t("dash.activityDesc")}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-ink-muted">
                <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
                {t("mode.demo")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-ink-muted">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                {t("mode.live")}
              </span>
            </div>
          </div>

          {summaryQuery.isLoading ? (
            <Skeleton className="mt-6 h-44 w-full" />
          ) : !s || s.callsByDay.length === 0 ? (
            <EmptyState title={t("dash.noActivity")} />
          ) : (
            <div className="mt-6 grid grid-cols-7 items-end gap-3 h-44 pt-4">
              {s.callsByDay.map((day) => {
                const total = day.demo + day.live;
                const demoPct = Math.round((day.demo / maxDaily) * 100);
                const livePct = Math.round((day.live / maxDaily) * 100);
                return (
                  <div
                    key={day.date}
                    className="flex h-full flex-col items-center justify-end gap-2"
                  >
                    <span className="font-mono text-[11px] text-ink-muted">
                      {fmt.n(total)}
                    </span>
                    <div className="flex w-full max-w-[36px] flex-1 flex-col justify-end overflow-hidden rounded-t-md bg-surface-raised">
                      {day.live > 0 && (
                        <div
                          style={{ height: `${Math.max(livePct, 8)}%` }}
                          className="w-full bg-primary"
                          title={`${t("dash.live")}: ${fmt.n(day.live)}`}
                        />
                      )}
                      {day.demo > 0 && (
                        <div
                          style={{ height: `${Math.max(demoPct, 8)}%` }}
                          className="w-full bg-accent"
                          title={`${t("dash.demo")}: ${fmt.n(day.demo)}`}
                        />
                      )}
                    </div>
                    <span className="text-[11px] text-ink-subtle">
                      {fmt.day(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 lg:col-span-5">
          <h2 className="text-base font-semibold text-ink">{t("dash.outcomes")}</h2>
          <p className="text-xs text-ink-muted">
            {t("dash.outcomesDesc")}
          </p>

          {summaryQuery.isLoading ? (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !s || s.outcomes.length === 0 ? (
            <EmptyState title={t("dash.noOutcomes")} />
          ) : (
            <ul className="mt-5 space-y-3.5">
              {s.outcomes.map((item) => (
                <li
                  key={item.outcome}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface-raised px-3.5 py-2.5"
                >
                  <CallOutcomeBadge outcome={item.outcome} />
                  <span className="font-mono text-sm font-semibold text-ink">
                    {fmt.n(item.count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent calls */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{t("dash.recent")}</h2>
            <p className="text-xs text-ink-muted">
              {t("dash.recentDesc")}
            </p>
          </div>
          <Link
            href="/portal/calls"
            className="text-xs font-medium text-primary-soft hover:underline"
          >
            {t("dash.fullLog")}
          </Link>
        </div>

        {recentCallsQuery.isLoading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !recentCallsQuery.data?.items.length ? (
          <EmptyState
            title={t("dash.noCalls")}
            description={t("dash.noCallsDesc")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-surface-raised/60 text-xs text-ink-muted">
                <tr>
                  <th className="px-6 py-3 font-medium">{t("dash.col.time")}</th>
                  <th className="px-6 py-3 font-medium">{t("dash.col.patient")}</th>
                  <th className="px-6 py-3 font-medium">{t("dash.col.mode")}</th>
                  <th className="px-6 py-3 font-medium">{t("dash.col.status")}</th>
                  <th className="px-6 py-3 font-medium">{t("dash.col.outcome")}</th>
                  <th className="px-6 py-3 font-medium">{t("dash.col.duration")}</th>
                  <th className="px-6 py-3 text-right font-medium">{t("dash.col.inspect")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentCallsQuery.data.items.map((call) => (
                  <tr
                    key={call.id}
                    className="transition hover:bg-surface-hover/50"
                  >
                    <td className="whitespace-nowrap px-6 py-3.5 text-xs text-ink-muted">
                      {fmt.dateTime(call.startedAt)}
                    </td>
                    <td className="px-6 py-3.5 font-bangla font-medium text-ink">
                      {call.patient?.fullName ?? (
                        <span className="font-sans text-xs text-ink-subtle">
                          {t("common.unidentified")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <CallModeBadge mode={call.callMode} />
                    </td>
                    <td className="px-6 py-3.5">
                      <CallStatusBadge status={call.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      <CallOutcomeBadge outcome={call.outcome} />
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-ink-muted">
                      {fmt.duration(call.durationSeconds)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/portal/calls/${call.id}`}
                        className="text-xs font-medium text-primary-soft hover:underline"
                      >
                        {t("dash.details")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
