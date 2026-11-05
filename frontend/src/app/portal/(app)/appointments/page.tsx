import type { Metadata } from "next";
import AppointmentsView from "@/components/portal/AppointmentsView";

export const metadata: Metadata = { title: "Appointments" };

export default function PortalAppointmentsPage() {
  return <AppointmentsView />;
}
