/**
 * Domain types shared across the frontend.
 *
 * These mirror the FastAPI response models (camelCase over the wire) and the
 * Postgres schema in backend/migrations. Keep the three in sync: if you add a
 * status here, add it to the SQL CHECK constraint and the Pydantic Literal too.
 */

export type CallMode = "demo" | "live";
export type VoiceProviderId = "demo" | "vapi";

export type CallStatus = "initiated" | "in_progress" | "completed" | "failed" | "abandoned";

export type CallOutcome =
  | "appointment_requested"
  | "faq_answered"
  | "followup_required"
  | "incomplete"
  | "no_action";

/** A request is never "confirmed" until the clinic's scheduling workflow confirms it. */
export type BookingStatus = "none" | "requested" | "confirmed" | "declined";

export type AppointmentStatus = "requested" | "confirmed" | "cancelled" | "completed" | "no_show";
export type FollowUpStatus = "open" | "in_progress" | "resolved" | "cancelled";
export type Speaker = "assistant" | "caller";
export type StaffRole = "admin" | "staff" | "viewer";

export interface PatientRef {
  id: string;
  fullName: string;
}

export interface DoctorRef {
  id: string;
  fullName: string;
  specialty: string;
}

export interface StaffRef {
  id: string;
  fullName: string;
}

export interface CallSummary {
  id: string;
  startedAt: string;
  durationSeconds: number | null;
  callMode: CallMode;
  provider: VoiceProviderId;
  status: CallStatus;
  outcome: CallOutcome | null;
  patient: PatientRef | null;
  /** Masked unless the viewer's role permits full numbers. */
  phoneDisplay: string | null;
  bookingStatus: BookingStatus;
  requiresFollowup: boolean;
}

export interface CallExtraction {
  intent: string | null;
  reasonForVisit: string | null;
  /** Exactly what the caller said, preserved even when parsing succeeds. */
  preferredDateText: string | null;
  preferredDate: string | null; // YYYY-MM-DD, clinic timezone
  preferredTime: string | null; // HH:MM, clinic timezone
  preferredDoctor: string | null;
  patientNameConfirmed: boolean;
  phoneConfirmed: boolean;
  bookingStatus: BookingStatus;
  requiresHumanFollowup: boolean;
  confidence: Record<string, number> | null;
}

export interface TranscriptTurn {
  id: string;
  sequenceNumber: number;
  speaker: Speaker;
  textBn: string;
  textEn: string | null;
  timestampMs: number | null;
}

export interface CallDetail extends CallSummary {
  endedAt: string | null;
  providerCallId: string | null;
  recordingUrl: string | null;
  patientPhone: string | null;
  extraction: CallExtraction | null;
  transcript: TranscriptTurn[];
  appointment: { id: string; status: AppointmentStatus } | null;
  followUp: { id: string; status: FollowUpStatus; reason: string } | null;
}

export interface Patient {
  id: string;
  fullName: string;
  phoneDisplay: string | null;
  createdAt: string;
  callCount: number;
  lastCallAt: string | null;
}

export interface PatientDetail extends Patient {
  phoneE164: string | null;
  calls: CallSummary[];
  appointments: Appointment[];
}

export interface Appointment {
  id: string;
  patient: PatientRef;
  callId: string | null;
  doctor: DoctorRef | null;
  /** Caller's stated preference, e.g. "আগামীকাল বিকাল ৫টা". */
  requestedPreference: string | null;
  scheduledStart: string | null;
  status: AppointmentStatus;
  bookingReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  callId: string;
  patient: PatientRef | null;
  reason: string;
  status: FollowUpStatus;
  assignedTo: StaffRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyCallCount {
  date: string; // YYYY-MM-DD
  demo: number;
  live: number;
}

export interface DashboardSummary {
  totalCalls: number;
  callsToday: number;
  completedCalls: number;
  appointmentRequests: number;
  confirmedAppointments: number;
  pendingFollowUps: number;
  callsByDay: DailyCallCount[];
  outcomes: { outcome: CallOutcome; count: number }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Me {
  id: string;
  fullName: string;
  role: StaffRole;
  clinic: { id: string; name: string; timezone: string };
}

export interface HealthStatus {
  status: "ok" | "degraded";
  database: "ok" | "unavailable";
  version: string;
}

// ---- Query params ----

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CallListParams extends ListParams {
  status?: CallStatus;
  outcome?: CallOutcome;
  mode?: CallMode;
  sort?: "started_at" | "-started_at" | "duration" | "-duration";
}

export interface AppointmentListParams extends ListParams {
  status?: AppointmentStatus;
}

export interface FollowUpListParams extends ListParams {
  status?: FollowUpStatus;
}

export interface AppointmentUpdate {
  status?: AppointmentStatus;
  scheduledStart?: string | null;
  doctorId?: string | null;
}

export interface FollowUpUpdate {
  status?: FollowUpStatus;
  assignedToMe?: boolean;
}
