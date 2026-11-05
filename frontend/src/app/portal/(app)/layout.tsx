import type { Metadata } from "next";
import { Suspense } from "react";
import { QueryProvider } from "@/components/providers/QueryProvider";
import PortalShell from "@/components/portal/PortalShell";
import PortalLoading from "@/components/portal/PortalLoading";

export const metadata: Metadata = {
  title: "Staff Portal",
  robots: { index: false, follow: false },
};

export default function PortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <Suspense fallback={<PortalLoading />}>
        <PortalShell>{children}</PortalShell>
      </Suspense>
    </QueryProvider>
  );
}
