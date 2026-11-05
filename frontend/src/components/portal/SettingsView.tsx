"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Database, Mic, ShieldCheck } from "lucide-react";
import { demoClinic } from "@/config/demo-clinic";
import { getPortalApi } from "@/lib/api/portal-api";
import {
  env,
  isApiConfigured,
  isFixtureMode,
  isSupabaseConfigured,
  isVapiConfigured,
} from "@/lib/env";
import { useT } from "@/i18n";
import { Badge } from "@/components/ui/Badge";
import { Card, PageHeader } from "@/components/ui/Surface";

export default function SettingsView() {
  const t = useT();
  const healthQuery = useQuery({
    queryKey: ["portal", "health"],
    queryFn: async () => (await getPortalApi()).health(),
  });

  const meQuery = useQuery({
    queryKey: ["portal", "me"],
    queryFn: async () => (await getPortalApi()).me(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("st.eyebrow")}
        title={t("st.title")}
        description={t("st.desc")}
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Clinic Profile */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary-soft" />
              <h2 className="text-sm font-semibold text-ink">
                {t("st.clinic")}
              </h2>
            </div>
            <Badge tone="teal">{t("st.active")}</Badge>
          </div>
          <dl className="space-y-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-ink-subtle">{t("st.clinicName")}</dt>
              <dd className="font-medium text-ink">
                {meQuery.data?.clinic.name ?? demoClinic.name} (
                <span className="font-bangla">{demoClinic.nameBn}</span>)
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-subtle">{t("st.timezone")}</dt>
              <dd className="font-mono text-ink">
                {meQuery.data?.clinic.timezone ?? demoClinic.timezone}
              </dd>
            </div>
            <div>
              <dt className="text-ink-subtle">{t("st.hours")}</dt>
              <dd className="mt-1 rounded-xl border border-line bg-surface-raised p-2.5 font-bangla text-ink">
                {demoClinic.hoursBn}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Backend & Database Health */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary-soft" />
              <h2 className="text-sm font-semibold text-ink">
                {t("st.api")}
              </h2>
            </div>
            <Badge
              tone={
                healthQuery.data?.status === "ok"
                  ? "teal"
                  : healthQuery.isLoading
                    ? "blue"
                    : "amber"
              }
            >
              {healthQuery.data?.status === "ok"
                ? t("st.healthy")
                : healthQuery.isLoading
                  ? t("st.checking")
                  : t("st.unreachable")}
            </Badge>
          </div>
          <dl className="space-y-3 text-xs">
            <div className="flex justify-between">
              <dt className="text-ink-subtle">{t("st.source")}</dt>
              <dd className="font-mono text-ink">
                {isFixtureMode ? t("st.sourceFixtures") : t("st.sourceHttp")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-subtle">{t("st.baseUrl")}</dt>
              <dd className="font-mono text-ink">
                {isApiConfigured ? env.apiBaseUrl : t("st.notSet")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-subtle">{t("st.dbConn")}</dt>
              <dd className="font-mono text-ink">
                {healthQuery.data?.database ?? "—"}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Authentication & RLS */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary-soft" />
              <h2 className="text-sm font-semibold text-ink">
                {t("st.auth")}
              </h2>
            </div>
            <Badge tone={isSupabaseConfigured ? "teal" : "amber"}>
              {isSupabaseConfigured ? t("st.configured") : t("st.pending")}
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">
            {t("st.authBody1")} <code className="font-mono">clinic_id</code>{" "}
            {t("st.authBody2")} <code className="font-mono">profiles</code>{" "}
            {t("st.authBody3")}
          </p>
        </Card>

        {/* Voice Provider Integration */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary-soft" />
              <h2 className="text-sm font-semibold text-ink">
                {t("st.voice")}
              </h2>
            </div>
            <Badge tone={isVapiConfigured ? "teal" : "amber"}>
              {isVapiConfigured ? t("st.vapiPresent") : t("st.demoActive")}
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">
            {t("st.voiceBody1")}{" "}
            <code className="font-mono text-primary-soft">VoiceProvider</code>{" "}
            {t("st.voiceBody2")} <code className="font-mono">/api/webhooks/vapi</code>{" "}
            {t("st.voiceBody3")} <code className="font-mono">docs/voice-integration.md</code>).
          </p>
        </Card>
      </div>
    </div>
  );
}
