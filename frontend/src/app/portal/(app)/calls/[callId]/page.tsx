import type { Metadata } from "next";
import { Suspense } from "react";
import CallDetailView from "@/components/portal/CallDetailView";
import { Skeleton } from "@/components/ui/Surface";

export const metadata: Metadata = { title: "Call Detail" };

async function CallDetailParamsResolver({
  params,
}: {
  params: Promise<{ callId: string }>;
}) {
  const { callId } = await params;
  return <CallDetailView callId={callId} />;
}

export default function PortalCallDetailPage({
  params,
}: {
  params: Promise<{ callId: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <CallDetailParamsResolver params={params} />
    </Suspense>
  );
}
