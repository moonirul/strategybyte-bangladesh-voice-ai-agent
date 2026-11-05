"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  CalendarCheck2,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  PhoneCall,
  PhoneForwarded,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { getPortalApi } from "@/lib/api/portal-api";
import { isFixtureMode, isSupabaseConfigured } from "@/lib/env";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LanguageToggle, useT, type MessageKey } from "@/i18n";

const navItems: { href: string; label: MessageKey; icon: typeof Settings }[] = [
  { href: "/portal", label: "nav.dashboard", icon: LayoutDashboard },
  { href: "/portal/calls", label: "nav.calls", icon: PhoneCall },
  { href: "/portal/patients", label: "nav.patients", icon: Users },
  { href: "/portal/appointments", label: "nav.appointments", icon: CalendarCheck2 },
  { href: "/portal/follow-ups", label: "nav.followUps", icon: PhoneForwarded },
  { href: "/portal/settings", label: "nav.settings", icon: Settings },
];

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(isFixtureMode);
  const [authenticated, setAuthenticated] = useState(isFixtureMode);

  useEffect(() => {
    if (isFixtureMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthChecked(true);
      setAuthenticated(true);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthChecked(true);
      setAuthenticated(false);
      router.replace("/portal/login");
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        setAuthenticated(false);
        setAuthChecked(true);
        router.replace("/portal/login");
      } else {
        setAuthenticated(true);
        setAuthChecked(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isFixtureMode) {
        setAuthenticated(false);
        router.replace("/portal/login");
      } else if (session) {
        setAuthenticated(true);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const meQuery = useQuery({
    queryKey: ["portal", "me"],
    enabled: authenticated,
    queryFn: async () => (await getPortalApi()).me(),
  });

  if (!authChecked || !authenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">{t("shell.verifying")}</p>
          <p className="text-xs text-ink-muted">
            {t("shell.verifyingDesc")}
          </p>
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace("/portal/login");
  }

  const profile = meQuery.data;

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Logo subtitle="brand.portal" />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t("shell.closeNav")}
            className="rounded-lg p-1 text-ink-muted hover:text-ink lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Clinic badge */}
        <div className="border-b border-line px-5 py-3.5 text-xs">
          <p className="text-[11px] uppercase tracking-wider text-ink-subtle">
            {t("shell.activeClinic")}
          </p>
          <p className="mt-0.5 font-semibold text-ink">
            {profile?.clinic.name ?? "Dhaka Dental Care"}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-ink-muted">
            {profile?.clinic.timezone ?? "Asia/Dhaka"}
          </p>
        </div>

        <nav aria-label={t("shell.navLabel")} className="flex-1 space-y-1 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition",
                isActive(href)
                  ? "bg-primary/15 font-semibold text-primary-soft ring-1 ring-primary/30"
                  : "text-ink-muted hover:bg-surface-hover hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{t(label)}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-line p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-ink">
              {profile?.fullName ?? t("shell.clinicStaff")}
            </span>
            <Badge tone="teal">{t(`role.${profile?.role ?? "staff"}` as MessageKey)}</Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link href="/" className="text-ink-muted hover:text-ink">
              {t("shell.publicSite")}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-ink-muted transition hover:text-danger"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t("shell.signOut")}</span>
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
        />
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/60 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={t("shell.openNav")}
              className="rounded-lg border border-line p-2 text-ink-muted hover:text-ink lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden text-xs font-medium text-ink-muted md:inline">
              {t("shell.topbar")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            {isFixtureMode ? (
              <span className="tone-amber hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset sm:inline-flex">
                <FlaskConical className="h-3.5 w-3.5" />
                <span>{t("shell.fixtures")}</span>
              </span>
            ) : (
              <Badge tone={isSupabaseConfigured ? "teal" : "amber"} className="hidden sm:inline-flex">
                {isSupabaseConfigured ? t("shell.live") : t("shell.apiMode")}
              </Badge>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
