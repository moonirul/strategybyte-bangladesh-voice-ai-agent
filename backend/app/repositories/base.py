"""Repository protocol and internal domain records."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass
class ClinicRecord:
    id: str
    name: str
    slug: str
    timezone: str
    opening_hours: str


@dataclass
class ProfileRecord:
    id: str
    clinic_id: str
    full_name: str
    role: str  # 'admin' | 'staff' | 'viewer'


@dataclass
class DoctorRecord:
    id: str
    clinic_id: str
    full_name: str
    specialty: str
    active: bool = True


@dataclass
class PatientRecord:
    id: str
    clinic_id: str
    full_name: str
    phone_e164: str | None
    created_at: str
    updated_at: str


@dataclass
class TranscriptTurnRecord:
    id: str
    call_id: str
    sequence_number: int
    speaker: str
    text_bn: str
    text_en: str | None
    timestamp_ms: int | None
    created_at: str


@dataclass
class CallExtractionRecord:
    id: str
    call_id: str
    intent: str | None
    reason_for_visit: str | None
    preferred_date_text: str | None
    preferred_date: str | None
    preferred_time: str | None
    preferred_datetime: str | None
    preferred_doctor: str | None
    patient_name_confirmed: bool
    phone_confirmed: bool
    booking_status: str
    requires_human_followup: bool
    confidence: dict[str, float] | None
    created_at: str
    updated_at: str


@dataclass
class CallRecord:
    id: str
    clinic_id: str
    patient_id: str | None
    provider: str
    provider_call_id: str | None
    call_mode: str
    started_at: str
    ended_at: str | None
    duration_seconds: int | None
    status: str
    outcome: str | None
    recording_url: str | None
    created_at: str
    turns: dict[int, TranscriptTurnRecord] = field(default_factory=dict)
    extraction: CallExtractionRecord | None = None


@dataclass
class AppointmentRecord:
    id: str
    clinic_id: str
    patient_id: str
    call_id: str | None
    doctor_id: str | None
    requested_preference: str | None
    scheduled_start: str | None
    status: str
    booking_reference: str | None
    created_at: str
    updated_at: str


@dataclass
class FollowUpRecord:
    id: str
    clinic_id: str
    call_id: str
    patient_id: str | None
    reason: str
    status: str
    assigned_to: str | None
    created_at: str
    updated_at: str


class ClinicRepository(Protocol):
    def check_health(self) -> bool: ...
    def get_clinic(self, clinic_id: str) -> ClinicRecord | None: ...
    def get_clinic_by_slug(self, slug: str) -> ClinicRecord | None: ...
    def get_profile(self, user_id: str) -> ProfileRecord | None: ...
    def upsert_profile(self, profile: ProfileRecord) -> ProfileRecord: ...
    def list_doctors(self, clinic_id: str) -> list[DoctorRecord]: ...

    def create_or_get_call(
        self,
        *,
        clinic_id: str,
        provider: str,
        provider_call_id: str | None,
        call_mode: str,
        started_at: str,
    ) -> CallRecord: ...

    def get_call(self, clinic_id: str, call_id: str) -> CallRecord | None: ...
    def list_calls(self, clinic_id: str) -> list[CallRecord]: ...

    def upsert_turns(
        self,
        clinic_id: str,
        call_id: str,
        turns: list[tuple[int, str, str, str | None, int | None]],
    ) -> int: ...

    def upsert_patient(
        self,
        clinic_id: str,
        full_name: str,
        phone_e164: str | None,
    ) -> PatientRecord: ...

    def get_patient(self, clinic_id: str, patient_id: str) -> PatientRecord | None: ...
    def list_patients(self, clinic_id: str) -> list[PatientRecord]: ...

    def save_call_completion(
        self,
        *,
        clinic_id: str,
        call_id: str,
        patient_id: str | None,
        ended_at: str,
        duration_seconds: int | None,
        status: str,
        outcome: str | None,
        extraction: CallExtractionRecord,
        appointment: AppointmentRecord | None,
        followup: FollowUpRecord | None,
    ) -> CallRecord: ...

    def list_appointments(self, clinic_id: str) -> list[AppointmentRecord]: ...
    def get_appointment_by_call(
        self, clinic_id: str, call_id: str
    ) -> AppointmentRecord | None: ...
    def create_appointment(
        self, appt: AppointmentRecord
    ) -> AppointmentRecord: ...
    def update_appointment(
        self,
        clinic_id: str,
        appointment_id: str,
        *,
        status: str | None,
        scheduled_start: str | None,
        doctor_id: str | None,
    ) -> AppointmentRecord | None: ...

    def list_follow_ups(self, clinic_id: str) -> list[FollowUpRecord]: ...
    def get_follow_up_by_call(
        self, clinic_id: str, call_id: str
    ) -> FollowUpRecord | None: ...
    def update_follow_up(
        self,
        clinic_id: str,
        follow_up_id: str,
        *,
        status: str | None,
        assigned_to: str | None,
    ) -> FollowUpRecord | None: ...
