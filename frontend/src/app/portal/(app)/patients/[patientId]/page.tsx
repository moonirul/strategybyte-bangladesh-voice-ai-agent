import type { Metadata } from "next";
import { Suspense } from "react";
import PatientDetailView from "@/components/portal/PatientDetailView";
import { Skeleton } from "@/components/ui/Surface";

export const metadata: Metadata = { title: "Patient Detail" };

async function PatientDetailParamsResolver({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  return <PatientDetailView patientId={patientId} />;
}

export default function PortalPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PatientDetailParamsResolver params={params} />
    </Suspense>
  );
}
