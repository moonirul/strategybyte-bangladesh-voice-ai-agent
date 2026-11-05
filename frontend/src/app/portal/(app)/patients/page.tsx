import type { Metadata } from "next";
import PatientsListView from "@/components/portal/PatientsListView";

export const metadata: Metadata = { title: "Patients" };

export default function PortalPatientsPage() {
  return <PatientsListView />;
}
