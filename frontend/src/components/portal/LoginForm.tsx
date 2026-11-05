"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageToggle, useT } from "@/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isFixtureMode, isSupabaseConfigured } from "@/lib/env";

type LoginFormValues = { email: string; password: string };

export default function LoginForm() {
  const router = useRouter();
  const t = useT();
  const [authError, setAuthError] = useState<string | null>(null);

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("login.errEmail")),
        password: z.string().min(8, t("login.errPassword")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setAuthError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthError(t("login.errNotConfigured"));
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email.trim(),
      password: values.password,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    router.replace("/portal");
    router.refresh();
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-line-strong bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-subtle focus:border-primary";

  const panelPoints = ["login.panelP1", "login.panelP2", "login.panelP3"] as const;

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Form side */}
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <LanguageToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-7 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-primary-soft">
                <Lock className="h-4 w-4" />
                <h1 className="text-lg font-semibold text-ink">{t("login.title")}</h1>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t("login.desc")}</p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-ink">
                    {t("login.email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t("login.emailPlaceholder")}
                    {...register("email")}
                    className={inputClass}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-ink">
                    {t("login.password")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register("password")}
                    className={inputClass}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                  )}
                </div>

                {authError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-ink"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-canvas shadow-[var(--shadow-glow)] transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{t("login.submit")}</span>
                </button>
              </form>
            </div>

            {!isSupabaseConfigured && (
              <div className="mt-4 rounded-2xl border border-line bg-surface-raised/80 p-4 text-xs text-ink-muted">
                <p className="font-semibold text-ink">{t("login.cfgTitle")}</p>
                <p className="mt-1 leading-relaxed">
                  {t("login.cfgBody1")}{" "}
                  <code className="font-mono text-primary-soft">backend/migrations/seed.sql</code>.
                </p>
                {isFixtureMode && (
                  <div className="mt-3 border-t border-line pt-3">
                    <p className="text-warning">
                      {t("login.fixturesNote")}{" "}
                      <code className="font-mono">NEXT_PUBLIC_DATA_SOURCE=fixtures</code>
                    </p>
                    <Link
                      href="/portal"
                      className="mt-2 inline-flex items-center gap-1.5 font-semibold text-primary-soft underline underline-offset-4"
                    >
                      <span>{t("login.fixturesLink")}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            <p className="mt-6 text-center text-xs">
              <Link href="/" className="text-ink-muted transition hover:text-ink">
                {t("login.backToSite")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden border-l border-line bg-surface lg:flex lg:items-center lg:justify-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_25%,transparent_75%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="relative max-w-md px-10">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            {t("login.panelTitle")}
          </h2>
          <ul className="mt-8 space-y-4 text-sm text-ink-muted">
            {panelPoints.map((k) => (
              <li key={k} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
