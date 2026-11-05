import type { Metadata } from "next";
import DashboardView from "@/components/portal/DashboardView";

export const metadata: Metadata = { title: "Dashboard" };

export default function PortalDashboardPage() {
  return <DashboardView />;
}
