/** DEVELOPMENT ONLY — in-memory implementation of PortalApi over synthetic fixtures. */
import { ApiError } from "@/lib/api/http";
import type { PortalApi } from "@/lib/api/portal-api";
import type { CallSummary, CallDetail, Paginated } from "@/types/domain";
import {
  fixtureAppointments,
  fixtureCalls,
  fixtureFollowUps,
  fixturePatients,
  maskPhone,
} from "./data";

const latency = () => new Promise((r) => setTimeout(r, 300));

function paginate<T>(items: T[], page = 1, pageSize = 10): Paginated<T> {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

const includes = (q: string | undefined, ...fields: (string | null | undefined)[]) =>
  !q || fields.some((f) => f?.toLowerCase().includes(q.toLowerCase()));

const summary = (c: CallDetail): CallSummary => ({
  id: c.id,
  startedAt: c.startedAt,
  durationSeconds: c.durationSeconds,
  callMode: c.callMode,
  provider: c.provider,
  status: c.status,
  outcome: c.outcome,
  patient: c.patient,
  phoneDisplay: c.phoneDisplay,
  bookingStatus: c.bookingStatus,
  requiresFollowup: c.requiresFollowup,
});

export const fixturePortalApi: PortalApi = {
  async health() {
    await latency();
    return { status: "ok", database: "ok", version: "fixtures" };
  },
  async me() {
    await latency();
    return {
      id: "staff_fixture",
      fullName: "Fixture Reviewer",
      role: "admin",
      clinic: { id: "clinic_fixture", name: "Dhaka Dental Care", timezone: "Asia/Dhaka" },
    };
  },
  async dashboard() {
    await latency();
    const todayKey = new Date().toISOString().slice(0, 10);
    const byDay = new Map<string, { demo: number; live: number }>();
    for (let i = 6; i >= 0; i--) {
      byDay.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), { demo: 0, live: 0 });
    }
    for (const c of fixtureCalls) {
      const d = byDay.get(c.startedAt.slice(0, 10));
      if (d) d[c.callMode]++;
    }
    const outcomeCounts = new Map<string, number>();
    fixtureCalls.forEach((c) => c.outcome && outcomeCounts.set(c.outcome, (outcomeCounts.get(c.outcome) ?? 0) + 1));
    return {
      totalCalls: fixtureCalls.length,
      callsToday: fixtureCalls.filter((c) => c.startedAt.startsWith(todayKey)).length,
      completedCalls: fixtureCalls.filter((c) => c.status === "completed").length,
      appointmentRequests: fixtureAppointments.filter((a) => a.status === "requested").length,
      confirmedAppointments: fixtureAppointments.filter((a) => a.status === "confirmed").length,
      pendingFollowUps: fixtureFollowUps.filter((f) => f.status === "open" || f.status === "in_progress").length,
      callsByDay: [...byDay].map(([date, v]) => ({ date, ...v })),
      outcomes: [...outcomeCounts].map(([outcome, count]) => ({ outcome: outcome as CallSummary["outcome"] & string, count })),
    };
  },
  async listCalls(p) {
    await latency();
    let items = fixtureCalls
      .filter((c) => !p.status || c.status === p.status)
      .filter((c) => !p.outcome || c.outcome === p.outcome)
      .filter((c) => !p.mode || c.callMode === p.mode)
      .filter((c) => includes(p.search, c.patient?.fullName, c.patientPhone, c.extraction?.reasonForVisit));
    const sort = p.sort ?? "-started_at";
    const dir = sort.startsWith("-") ? -1 : 1;
    items = [...items].sort((a, b) =>
      sort.endsWith("duration")
        ? dir * ((a.durationSeconds ?? -1) - (b.durationSeconds ?? -1))
        : dir * a.startedAt.localeCompare(b.startedAt),
    );
    return paginate(items.map(summary), p.page, p.pageSize);
  },
  async getCall(id) {
    await latency();
    const c = fixtureCalls.find((x) => x.id === id);
    if (!c) throw new ApiError("Call not found.", 404, "not_found");
    return c;
  },
  async listPatients(p) {
    await latency();
    const items = fixturePatients
      .filter((x) => includes(p.search, x.fullName, x.phoneE164))
      .map((x) => {
        const calls = fixtureCalls.filter((c) => c.patient?.id === x.id);
        return {
          id: x.id,
          fullName: x.fullName,
          phoneDisplay: maskPhone(x.phoneE164),
          createdAt: x.createdAt,
          callCount: calls.length,
          lastCallAt: calls[0]?.startedAt ?? null,
        };
      });
    return paginate(items, p.page, p.pageSize);
  },
  async getPatient(id) {
    await latency();
    const x = fixturePatients.find((pp) => pp.id === id);
    if (!x) throw new ApiError("Patient not found.", 404, "not_found");
    const calls = fixtureCalls.filter((c) => c.patient?.id === id);
    return {
      id: x.id,
      fullName: x.fullName,
      phoneDisplay: maskPhone(x.phoneE164),
      phoneE164: x.phoneE164,
      createdAt: x.createdAt,
      callCount: calls.length,
      lastCallAt: calls[0]?.startedAt ?? null,
      calls: calls.map(summary),
      appointments: fixtureAppointments.filter((a) => a.patient.id === id),
    };
  },
  async listAppointments(p) {
    await latency();
    const items = fixtureAppointments
      .filter((a) => !p.status || a.status === p.status)
      .filter((a) => includes(p.search, a.patient.fullName, a.bookingReference));
    return paginate(items, p.page, p.pageSize);
  },
  async updateAppointment(id, patch) {
    await latency();
    const a = fixtureAppointments.find((x) => x.id === id);
    if (!a) throw new ApiError("Appointment not found.", 404, "not_found");
    if (patch.status === "confirmed" && !(patch.scheduledStart ?? a.scheduledStart)) {
      throw new ApiError("A confirmed appointment needs a scheduled time.", 422, "validation_error");
    }
    Object.assign(a, {
      ...(patch.status && { status: patch.status }),
      ...(patch.scheduledStart !== undefined && { scheduledStart: patch.scheduledStart }),
      updatedAt: new Date().toISOString(),
    });
    return { ...a };
  },
  async listFollowUps(p) {
    await latency();
    const items = fixtureFollowUps
      .filter((f) => !p.status || f.status === p.status)
      .filter((f) => includes(p.search, f.patient?.fullName, f.reason));
    return paginate(items, p.page, p.pageSize);
  },
  async updateFollowUp(id, patch) {
    await latency();
    const f = fixtureFollowUps.find((x) => x.id === id);
    if (!f) throw new ApiError("Follow-up not found.", 404, "not_found");
    Object.assign(f, {
      ...(patch.status && { status: patch.status }),
      ...(patch.assignedToMe && { assignedTo: { id: "staff_fixture", fullName: "Fixture Reviewer" } }),
      updatedAt: new Date().toISOString(),
    });
    return { ...f };
  },
};
