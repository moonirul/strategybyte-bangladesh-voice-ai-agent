"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Search, UserPlus } from "lucide-react";
import { getPortalApi } from "@/lib/api/portal-api";
import { useT } from "@/i18n";
import { useFormat } from "@/lib/use-format";
import type { FollowUpStatus } from "@/types/domain";
import { FollowUpStatusBadge } from "@/components/ui/Badge";
import {
  Card,
  EmptyState,
  ErrorBanner,
  PageHeader,
  Skeleton,
} from "@/components/ui/Surface";

export default function FollowUpsView() {
  const t = useT();
  const fmt = useFormat();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<FollowUpStatus | "">("");

  const followUpsQuery = useQuery({
    queryKey: ["portal", "follow-ups", { search, status }],
    queryFn: async () =>
      (await getPortalApi()).listFollowUps({
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
      assignedToMe,
    }: {
      id: string;
      nextStatus?: FollowUpStatus;
      assignedToMe?: boolean;
    }) =>
      (await getPortalApi()).updateFollowUp(id, {
        status: nextStatus,
        assignedToMe,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("fu.eyebrow")}
        title={t("fu.title")}
        description={t("fu.desc")}
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("fu.search")}
              aria-label={t("fu.searchAria")}
              className="w-full rounded-xl border border-line-strong bg-canvas py-2 pl-9 pr-3.5 text-xs text-ink placeholder:text-ink-subtle focus:border-primary focus:outline-none"
            />
          </div>

          <select
            aria-label={t("fu.filterAria")}
            value={status}
            onChange={(e) => setStatus(e.target.value as FollowUpStatus | "")}
            className="rounded-xl border border-line-strong bg-canvas px-3 py-2 text-xs text-ink focus:border-primary focus:outline-none"
          >
            <option value="">{t("fu.allStatuses")}</option>
            <option value="open">{t("followUp.open")}</option>
            <option value="in_progress">{t("followUp.in_progress")}</option>
            <option value="resolved">{t("followUp.resolved")}</option>
            <option value="cancelled">{t("followUp.cancelled")}</option>
          </select>
        </div>
      </Card>

      {followUpsQuery.isError ? (
        <ErrorBanner
          message={
            followUpsQuery.error instanceof Error
              ? followUpsQuery.error.message
              : t("fu.loadFailed")
          }
          onRetry={() => void followUpsQuery.refetch()}
        />
      ) : followUpsQuery.isLoading ? (
        <Card className="space-y-3 p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : !followUpsQuery.data || followUpsQuery.data.items.length === 0 ? (
        <Card>
          <EmptyState
            title={t("fu.noneTitle")}
            description={t("fu.noneDesc")}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {followUpsQuery.data.items.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bangla text-base font-semibold text-ink">
                      {item.patient ? (
                        <Link
                          href={`/portal/patients/${item.patient.id}`}
                          className="hover:text-primary-soft hover:underline"
                        >
                          {item.patient.fullName}
                        </Link>
                      ) : (
                        t("fu.unidentified")
                      )}
                    </span>
                    <FollowUpStatusBadge status={item.status} />
                  </div>

                  <p className="font-bangla text-xs text-ink-muted">
                    {t("fu.reason")} <strong className="text-ink">{item.reason}</strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-subtle">
                    <span>{t("fu.created", { when: fmt.dateTime(item.createdAt) })}</span>
                    <span>·</span>
                    <span>
                      {t("fu.assigned")}{" "}
                      <strong className="text-ink-muted">
                        {item.assignedTo?.fullName ?? t("fu.unassigned")}
                      </strong>
                    </span>
                    <span>·</span>
                    <Link
                      href={`/portal/calls/${item.callId}`}
                      className="text-primary-soft hover:underline"
                    >
                      {t("fu.inspect", { id: item.callId })}
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!item.assignedTo && item.status !== "resolved" && (
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: item.id,
                          nextStatus:
                            item.status === "open" ? "in_progress" : item.status,
                          assignedToMe: true,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface-raised px-3 py-1.5 text-xs font-medium text-ink transition hover:border-primary"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-primary-soft" />
                      {t("fu.assign")}
                    </button>
                  )}

                  {item.status !== "resolved" && (
                    <button
                      type="button"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: item.id,
                          nextStatus: "resolved",
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-semibold text-canvas transition hover:bg-primary-hover"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("fu.resolve")}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
