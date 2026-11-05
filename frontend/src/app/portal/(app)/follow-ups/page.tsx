import type { Metadata } from "next";
import FollowUpsView from "@/components/portal/FollowUpsView";

export const metadata: Metadata = { title: "Follow-ups" };

export default function PortalFollowUpsPage() {
  return <FollowUpsView />;
}
