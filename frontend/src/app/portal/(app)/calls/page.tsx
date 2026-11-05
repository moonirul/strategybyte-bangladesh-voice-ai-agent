import type { Metadata } from "next";
import CallsListView from "@/components/portal/CallsListView";

export const metadata: Metadata = { title: "Calls" };

export default function PortalCallsPage() {
  return <CallsListView />;
}
