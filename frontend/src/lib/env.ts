/**
 * Browser-safe configuration. Only NEXT_PUBLIC_* values may appear here.
 * Never place private keys (Supabase service role, Vapi private key,
 * webhook secrets) in NEXT_PUBLIC_* variables — they are inlined into JS bundles.
 */

const isProd = process.env.NODE_ENV === "production";

const requestedSource = process.env.NEXT_PUBLIC_DATA_SOURCE === "fixtures" ? "fixtures" : "api";

export const env = {
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, ""),
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  /** Supabase publishable key (or legacy anon key). Safe for the browser; RLS applies. */
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  /**
   * "fixtures" = synthetic development data with auth bypassed.
   * Hard-disabled in production builds so fake data can never ship as clinic activity.
   */
  dataSource: (isProd ? "api" : requestedSource) as "api" | "fixtures",
  vapiPublicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? "",
  vapiAssistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? "",
  /** Optional public contact details; rendered only when supplied. */
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
} as const;

export const isFixtureMode = env.dataSource === "fixtures";
export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabasePublishableKey);
export const isApiConfigured = Boolean(env.apiBaseUrl);
export const isVapiConfigured = Boolean(env.vapiPublicKey && env.vapiAssistantId);
