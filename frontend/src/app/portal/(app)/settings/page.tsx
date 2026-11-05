import type { Metadata } from "next";
import SettingsView from "@/components/portal/SettingsView";

export const metadata: Metadata = { title: "Settings & Status" };

export default function PortalSettingsPage() {
  return <SettingsView />;
}
