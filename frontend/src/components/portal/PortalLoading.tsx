"use client";

import { useT } from "@/i18n";

export default function PortalLoading() {
  const t = useT();
  return (
    <div className="grid min-h-screen place-items-center bg-canvas text-xs text-ink-muted">
      {t("shell.loading")}
    </div>
  );
}
