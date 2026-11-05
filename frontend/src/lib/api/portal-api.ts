import { getAccessToken } from "@/lib/supabase/client";
import type {
  Appointment,
  AppointmentListParams,
  AppointmentUpdate,
  CallDetail,
  CallListParams,
  CallSummary,
  DashboardSummary,
  FollowUp,
  FollowUpListParams,
  FollowUpUpdate,
  HealthStatus,
  ListParams,
  Me,
  Paginated,
  Patient,
  PatientDetail,
} from "@/types/domain";
import { apiRequest } from "./http";

/** Everything the staff portal needs from the backend. */
export interface PortalApi {
  health(): Promise<HealthStatus>;
  me(): Promise<Me>;
  dashboard(): Promise<DashboardSummary>;
  listCalls(p: CallListParams): Promise<Paginated<CallSummary>>;
  getCall(id: string): Promise<CallDetail>;
  listPatients(p: ListParams): Promise<Paginated<Patient>>;
  getPatient(id: string): Promise<PatientDetail>;
  listAppointments(p: AppointmentListParams): Promise<Paginated<Appointment>>;
  updateAppointment(id: string, patch: AppointmentUpdate): Promise<Appointment>;
  listFollowUps(p: FollowUpListParams): Promise<Paginated<FollowUp>>;
  updateFollowUp(id: string, patch: FollowUpUpdate): Promise<FollowUp>;
}

const authed = async <T>(path: string, init: Parameters<typeof apiRequest>[1] = {}) =>
  apiRequest<T>(path, { ...init, token: await getAccessToken() });

const listQuery = (p: ListParams & Record<string, unknown>) => {
  const { pageSize, ...rest } = p;
  return { ...rest, page_size: pageSize } as Record<string, string | number | undefined>;
};

export const httpPortalApi: PortalApi = {
  health: () => apiRequest("/api/health", { timeoutMs: 5000 }),
  me: () => authed("/api/me"),
  dashboard: () => authed("/api/dashboard/summary"),
  listCalls: (p) => authed("/api/calls", { query: listQuery({ ...p }) }),
  getCall: (id) => authed(`/api/calls/${encodeURIComponent(id)}`),
  listPatients: (p) => authed("/api/patients", { query: listQuery({ ...p }) }),
  getPatient: (id) => authed(`/api/patients/${encodeURIComponent(id)}`),
  listAppointments: (p) => authed("/api/appointments", { query: listQuery({ ...p }) }),
  updateAppointment: (id, patch) =>
    authed(`/api/appointments/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),
  listFollowUps: (p) => authed("/api/follow-ups", { query: listQuery({ ...p }) }),
  updateFollowUp: (id, patch) =>
    authed(`/api/follow-ups/${encodeURIComponent(id)}`, { method: "PATCH", body: patch }),
};

/**
 * Resolve the active data source. Development fixtures are loaded via dynamic
 * import inside a NODE_ENV guard, so they are tree-shaken out of production bundles.
 */
export async function getPortalApi(): Promise<PortalApi> {
  if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DATA_SOURCE === "fixtures") {
    const { fixturePortalApi } = await import("@/dev/fixtures/portal-api");
    return fixturePortalApi;
  }
  return httpPortalApi;
}
