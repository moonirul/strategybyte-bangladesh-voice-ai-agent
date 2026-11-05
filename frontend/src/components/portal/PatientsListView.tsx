"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getPortalApi } from "@/lib/api/portal-api";
import { useT } from "@/i18n";
import { useFormat } from "@/lib/use-format";
import {
  Card,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Skeleton,
} from "@/components/ui/Surface";

export default function PatientsListView() {
  const t = useT();
  const fmt = useFormat();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const patientsQuery = useQuery({
    queryKey: ["portal", "patients", { page, pageSize, search }],
    queryFn: async () =>
      (await getPortalApi()).listPatients({
        page,
        pageSize,
        search: search.trim() || undefined,
      }),
  });

  const data = patientsQuery.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("pat.eyebrow")}
        title={t("pat.title")}
        description={t("pat.desc")}
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("pat.search")}
            aria-label={t("pat.searchAria")}
            className="w-full rounded-xl border border-line-strong bg-canvas py-2 pl-9 pr-3.5 text-xs text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
          />
        </div>
      </Card>

      {patientsQuery.isError ? (
        <ErrorBanner
          message={
            patientsQuery.error instanceof Error
              ? patientsQuery.error.message
              : t("pat.loadFailed")
          }
          onRetry={() => void patientsQuery.refetch()}
        />
      ) : patientsQuery.isLoading ? (
        <Card className="space-y-3 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </Card>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <EmptyState
            title={t("pat.noneTitle")}
            description={t("pat.noneDesc")}
          />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-surface-raised/60 text-xs text-ink-muted">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">{t("pat.col.name")}</th>
                    <th className="px-6 py-3.5 font-medium">{t("pat.col.phone")}</th>
                    <th className="px-6 py-3.5 font-medium">{t("pat.col.calls")}</th>
                    <th className="px-6 py-3.5 font-medium">{t("pat.col.last")}</th>
                    <th className="px-6 py-3.5 font-medium">{t("pat.col.first")}</th>
                    <th className="px-6 py-3.5 text-right font-medium">{t("pat.col.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.items.map((patient) => (
                    <tr
                      key={patient.id}
                      className="transition hover:bg-surface-hover/50"
                    >
                      <td className="px-6 py-3.5 font-bangla font-medium text-ink">
                        <Link
                          href={`/portal/patients/${patient.id}`}
                          className="hover:text-primary-soft hover:underline"
                        >
                          {patient.fullName}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-ink-muted">
                        {patient.phoneDisplay ?? t("pat.unverified")}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-ink">
                        {fmt.n(patient.callCount)}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-ink-muted">
                        {fmt.dateTime(patient.lastCallAt)}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-ink-muted">
                        {fmt.dateTime(patient.createdAt)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/portal/patients/${patient.id}`}
                          className="rounded-lg border border-line-strong px-2.5 py-1 text-xs font-medium text-primary-soft transition hover:border-primary"
                        >
                          {t("pat.profile")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>
              {t("pat.page", { page: data.page, total: totalPages, count: data.total })}
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
