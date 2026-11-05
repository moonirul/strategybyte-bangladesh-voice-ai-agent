import type { Metadata } from "next";
import LoginForm from "@/components/portal/LoginForm";

export const metadata: Metadata = {
  title: "Staff Sign In",
  robots: { index: false, follow: false },
};

export default function PortalLoginPage() {
  return (
    <main className="min-h-screen">
      <LoginForm />
    </main>
  );
}
