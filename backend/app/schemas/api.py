"""Pydantic v2 request and response schemas for the FastAPI backend."""

from __future__ import annotations

from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.validation import sanitize_patient_name

CallMode = Literal["demo", "live"]
VoiceProviderId = Literal["demo", "vapi"]
CallStatus = Literal["initiated", "in_progress", "completed", "failed", "abandoned"]
CallOutcome = Literal[
    "appointment_requested",
    "faq_answered",
    "followup_required",
    "incomplete",
    "no_action",
]
BookingStatus = Literal["none", "requested", "confirmed", "declined"]
AppointmentStatus = Literal["requested", "confirmed", "cancelled", "completed", "no_show"]
FollowUpStatus = Literal["open", "in_progress", "resolved", "cancelled"]
Speaker = Literal["assistant", "caller"]
StaffRole = Literal["admin", "staff", "viewer"]

T = TypeVar("T")


class CamelModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")


class PatientRef(CamelModel):
    id: str
    fullName: str


class DoctorRef(CamelModel):
    id: str
    fullName: str
    specialty: str


class StaffRef(CamelModel):
    id: str
    fullName: str


class CallSummaryOut(CamelModel):
    id: str
    startedAt: str
    durationSeconds: int | None = None
    callMode: CallMode
    provider: VoiceProviderId
    status: CallStatus
    outcome: CallOutcome | None = None
    patient: PatientRef | None = None
    phoneDisplay: str | None = None
    bookingStatus: BookingStatus = "none"
    requiresFollowup: bool = False


class CallExtractionOut(CamelModel):
    intent: str | None = None
    reasonForVisit: str | None = None
    preferredDateText: str | None = None
    preferredDate: str | None = None
    preferredTime: str | None = None
    preferredDoctor: str | None = None
    patientNameConfirmed: bool = False
    phoneConfirmed: bool = False
    bookingStatus: BookingStatus = "none"
    requiresHumanFollowup: bool = False
    confidence: dict[str, float] | None = None


class TranscriptTurnOut(CamelModel):
    id: str
    sequenceNumber: int
    speaker: Speaker
    textBn: str
    textEn: str | None = None
    timestampMs: int | None = None


class LinkedAppointmentRef(CamelModel):
    id: str
    status: AppointmentStatus


class LinkedFollowUpRef(CamelModel):
    id: str
    status: FollowUpStatus
    reason: str


class CallDetailOut(CallSummaryOut):
    endedAt: str | None = None
    providerCallId: str | None = None
    recordingUrl: str | None = None
    patientPhone: str | None = None
    extraction: CallExtractionOut | None = None
    transcript: list[TranscriptTurnOut] = Field(default_factory=list)
    appointment: LinkedAppointmentRef | None = None
    followUp: LinkedFollowUpRef | None = None


class PatientOut(CamelModel):
    id: str
    fullName: str
    phoneDisplay: str | None = None
    createdAt: str
    callCount: int = 0
    lastCallAt: str | None = None


class AppointmentOut(CamelModel):
    id: str
    patient: PatientRef
    callId: str | None = None
    doctor: DoctorRef | None = None
    requestedPreference: str | None = None
    scheduledStart: str | None = None
    status: AppointmentStatus
    bookingReference: str | None = None
    createdAt: str
    updatedAt: str


class PatientDetailOut(PatientOut):
    phoneE164: str | None = None
    calls: list[CallSummaryOut] = Field(default_factory=list)
    appointments: list[AppointmentOut] = Field(default_factory=list)


class FollowUpOut(CamelModel):
    id: str
    callId: str
    patient: PatientRef | None = None
    reason: str
    status: FollowUpStatus
    assignedTo: StaffRef | None = None
    createdAt: str
    updatedAt: str


class DailyCallCountOut(CamelModel):
    date: str
    demo: int
    live: int


class OutcomeCountOut(CamelModel):
    outcome: CallOutcome
    count: int


class DashboardSummaryOut(CamelModel):
    totalCalls: int
    callsToday: int
    completedCalls: int
    appointmentRequests: int
    confirmedAppointments: int
    pendingFollowUps: int
    callsByDay: list[DailyCallCountOut]
    outcomes: list[OutcomeCountOut]


class PaginatedOut(CamelModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    pageSize: int


class ClinicRef(CamelModel):
    id: str
    name: str
    timezone: str


class MeOut(CamelModel):
    id: str
    fullName: str
    role: StaffRole
    clinic: ClinicRef


class HealthStatusOut(CamelModel):
    status: Literal["ok", "degraded"]
    database: Literal["ok", "unavailable"]
    version: str


# ---- Input payloads ----


class CreateCallIn(CamelModel):
    provider: VoiceProviderId = "demo"
    providerCallId: str | None = None
    callMode: CallMode = "demo"
    startedAt: str | None = None


class DemoCallCreateIn(CamelModel):
    providerCallId: str = Field(min_length=3, max_length=128)
    startedAt: str


class DemoCallCreateOut(CamelModel):
    callId: str
    callToken: str


class DemoTurnItemIn(CamelModel):
    sequenceNumber: int = Field(ge=0)
    speaker: Speaker
    text: str = Field(min_length=1, max_length=2000)
    timestampMs: int | None = Field(default=None, ge=0)


class DemoTurnsBatchIn(CamelModel):
    turns: list[DemoTurnItemIn] = Field(min_length=1, max_length=100)


class FinalExtractionIn(CamelModel):
    intent: Literal["appointment", "faq", "callback", "unknown"] = "unknown"
    reasonForVisit: str | None = None
    patientName: str | None = None
    patientNameConfirmed: bool = False
    phoneRaw: str | None = None
    phoneE164: str | None = None
    phoneConfirmed: bool = False
    preferredDateText: str | None = None
    preferredDoctor: str | None = None
    bookingStatus: Literal["none", "requested"] = "none"
    requiresHumanFollowup: bool = False
    followupReason: str | None = None

    @field_validator("patientName")
    @classmethod
    def _clean_name(cls, v: str | None) -> str | None:
        return sanitize_patient_name(v)


class DemoCallFinishIn(CamelModel):
    provider: VoiceProviderId
    callMode: CallMode
    providerCallId: str = Field(min_length=3, max_length=128)
    startedAt: str
    endedAt: str
    outcome: CallOutcome
    extraction: FinalExtractionIn


class AppointmentCreateIn(CamelModel):
    patientId: str
    callId: str | None = None
    doctorId: str | None = None
    requestedPreference: str | None = None
    scheduledStart: str | None = None
    status: AppointmentStatus = "requested"


class AppointmentPatchIn(CamelModel):
    status: AppointmentStatus | None = None
    scheduledStart: str | None = None
    doctorId: str | None = None


class FollowUpPatchIn(CamelModel):
    status: FollowUpStatus | None = None
    assignedToMe: bool | None = None
