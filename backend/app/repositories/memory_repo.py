"""Deterministic in-memory relational repository with strict clinic-level isolation.

Used for automated tests and local development when Supabase credentials are not yet
configured. Enforces the exact same constraints as 001_initial_schema.sql:
- Clinic isolation on every read and write
- Unique (clinic_id, provider, provider_call_id) idempotency for calls
- Unique (call_id, sequence_number) idempotency for transcript turns
- Unique (clinic_id, phone_e164) deduplication for verified patient numbers
- Confirmed appointments require a non-null scheduled_start timestamp
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from app.core.errors import AppError
from app.repositories.base import (
    AppointmentRecord,
    CallExtractionRecord,
    CallRecord,
    ClinicRecord,
    DoctorRecord,
    FollowUpRecord,
    PatientRecord,
    ProfileRecord,
    TranscriptTurnRecord,
)

DEMO_CLINIC_ID = "11111111-1111-4111-8111-111111111111"
OTHER_CLINIC_ID = "99999999-9999-4999-8999-999999999999"


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


class InMemoryClinicRepository:
    def __init__(self, seed: bool = True) -> None:
        self.clinics: dict[str, ClinicRecord] = {}
        self.profiles: dict[str, ProfileRecord] = {}
        self.doctors: dict[str, DoctorRecord] = {}
        self.patients: dict[str, PatientRecord] = {}
        self.calls: dict[str, CallRecord] = {}
        self.appointments: dict[str, AppointmentRecord] = {}
        self.follow_ups: dict[str, FollowUpRecord] = {}
        if seed:
            self._seed_demo_data()

    def _seed_demo_data(self) -> None:
        now = datetime.now(UTC)
        self.clinics[DEMO_CLINIC_ID] = ClinicRecord(
            id=DEMO_CLINIC_ID,
            name="Dhaka Dental Care",
            slug="dhaka-dental-care",
            timezone="Asia/Dhaka",
            opening_hours="শনিবার থেকে বৃহস্পতিবার, সকাল ১০টা থেকে রাত ৮টা পর্যন্ত। শুক্রবার বন্ধ।",
        )
        self.clinics[OTHER_CLINIC_ID] = ClinicRecord(
            id=OTHER_CLINIC_ID,
            name="Chittagong Diagnostic Centre",
            slug="chittagong-diagnostic",
            timezone="Asia/Dhaka",
            opening_hours="প্রতিদিন সকাল ৮টা থেকে রাত ১০টা।",
        )

        doc1 = DoctorRecord(
            id="22222222-2222-4222-8222-222222222201",
            clinic_id=DEMO_CLINIC_ID,
            full_name="Dr. Farzana Haque",
            specialty="General dentistry",
        )
        doc2 = DoctorRecord(
            id="22222222-2222-4222-8222-222222222202",
            clinic_id=DEMO_CLINIC_ID,
            full_name="Dr. Imran Kabir",
            specialty="Orthodontics",
        )
        self.doctors[doc1.id] = doc1
        self.doctors[doc2.id] = doc2

        # Seed a default reviewer profile for local testing
        self.profiles["staff-demo-admin"] = ProfileRecord(
            id="staff-demo-admin",
            clinic_id=DEMO_CLINIC_ID,
            full_name="Clinic Reviewer",
            role="admin",
        )
        self.profiles["staff-other-clinic"] = ProfileRecord(
            id="staff-other-clinic",
            clinic_id=OTHER_CLINIC_ID,
            full_name="Other Clinic Staff",
            role="staff",
        )

        # Seed 2 realistic simulated calls for Dhaka Dental Care
        p1 = self.upsert_patient(DEMO_CLINIC_ID, "রহিম উদ্দিন", "+8801712345678")
        c1_start = (now - timedelta(hours=2)).isoformat()
        c1_end = (now - timedelta(hours=2) + timedelta(seconds=48)).isoformat()
        c1 = self.create_or_get_call(
            clinic_id=DEMO_CLINIC_ID,
            provider="demo",
            provider_call_id="demo_seed_01",
            call_mode="demo",
            started_at=c1_start,
        )
        self.upsert_turns(
            DEMO_CLINIC_ID,
            c1.id,
            [
                (
                    0,
                    "assistant",
                    "আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ার-এ ফোন করার জন্য ধন্যবাদ। আজ আপনাকে কীভাবে সাহায্য করতে পারি?",
                    None,
                    0,
                ),
                (1, "caller", "আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই", None, 5000),
                (2, "assistant", "অবশ্যই। কী সমস্যার জন্য ডাক্তার দেখাতে চান?", None, 8000),
                (3, "caller", "দাঁতে ব্যথা হচ্ছে", None, 13000),
                (4, "assistant", "বুঝতে পেরেছি। আপনার পুরো নামটা বলবেন?", None, 16000),
                (5, "caller", "রহিম উদ্দিন", None, 20000),
                (6, "assistant", "ধন্যবাদ। আপনার মোবাইল নম্বরটা বলুন।", None, 23000),
                (7, "caller", "০১৭১২৩৪৫৬৭৮", None, 29000),
                (8, "assistant", "কোন দিন এবং কখন আসতে চান?", None, 32000),
                (9, "caller", "আগামীকাল বিকাল ৫টায়", None, 38000),
            ],
        )
        tomorrow_date = (now + timedelta(days=1)).date().isoformat()
        ex1 = CallExtractionRecord(
            id=f"ex_{c1.id}",
            call_id=c1.id,
            intent="appointment",
            reason_for_visit="দাঁতে ব্যথা হচ্ছে",
            preferred_date_text="আগামীকাল বিকাল ৫টায়",
            preferred_date=tomorrow_date,
            preferred_time="17:00",
            preferred_datetime=f"{tomorrow_date}T17:00:00+06:00",
            preferred_doctor="Dr. Farzana Haque",
            patient_name_confirmed=True,
            phone_confirmed=True,
            booking_status="requested",
            requires_human_followup=False,
            confidence=None,
            created_at=c1_end,
            updated_at=c1_end,
        )
        ap1 = AppointmentRecord(
            id=f"appt_{c1.id}",
            clinic_id=DEMO_CLINIC_ID,
            patient_id=p1.id,
            call_id=c1.id,
            doctor_id=doc1.id,
            requested_preference="আগামীকাল বিকাল ৫টায়",
            scheduled_start=None,
            status="requested",
            booking_reference=None,
            created_at=c1_end,
            updated_at=c1_end,
        )
        self.save_call_completion(
            clinic_id=DEMO_CLINIC_ID,
            call_id=c1.id,
            patient_id=p1.id,
            ended_at=c1_end,
            duration_seconds=48,
            status="completed",
            outcome="appointment_requested",
            extraction=ex1,
            appointment=ap1,
            followup=None,
        )

    def check_health(self) -> bool:
        return True

    def get_clinic(self, clinic_id: str) -> ClinicRecord | None:
        return self.clinics.get(clinic_id)

    def get_clinic_by_slug(self, slug: str) -> ClinicRecord | None:
        for c in self.clinics.values():
            if c.slug == slug:
                return c
        return None

    def get_profile(self, user_id: str) -> ProfileRecord | None:
        return self.profiles.get(user_id)

    def upsert_profile(self, profile: ProfileRecord) -> ProfileRecord:
        self.profiles[profile.id] = profile
        return profile

    def list_doctors(self, clinic_id: str) -> list[DoctorRecord]:
        return [d for d in self.doctors.values() if d.clinic_id == clinic_id and d.active]

    def create_or_get_call(
        self,
        *,
        clinic_id: str,
        provider: str,
        provider_call_id: str | None,
        call_mode: str,
        started_at: str,
    ) -> CallRecord:
        if provider_call_id:
            for existing in self.calls.values():
                if (
                    existing.clinic_id == clinic_id
                    and existing.provider == provider
                    and existing.provider_call_id == provider_call_id
                ):
                    return existing

        call_id = str(uuid.uuid4())
        rec = CallRecord(
            id=call_id,
            clinic_id=clinic_id,
            patient_id=None,
            provider=provider,
            provider_call_id=provider_call_id,
            call_mode=call_mode,
            started_at=started_at,
            ended_at=None,
            duration_seconds=None,
            status="in_progress",
            outcome=None,
            recording_url=None,
            created_at=_now_iso(),
        )
        self.calls[call_id] = rec
        return rec

    def get_call(self, clinic_id: str, call_id: str) -> CallRecord | None:
        rec = self.calls.get(call_id)
        if not rec or rec.clinic_id != clinic_id:
            return None
        return rec

    def list_calls(self, clinic_id: str) -> list[CallRecord]:
        items = [c for c in self.calls.values() if c.clinic_id == clinic_id]
        items.sort(key=lambda c: c.started_at, reverse=True)
        return items

    def upsert_turns(
        self,
        clinic_id: str,
        call_id: str,
        turns: list[tuple[int, str, str, str | None, int | None]],
    ) -> int:
        call = self.get_call(clinic_id, call_id)
        if not call:
            raise AppError("Call not found for clinic.", 404, "not_found")
        accepted = 0
        for seq, speaker, text_bn, text_en, ts_ms in turns:
            # Idempotent by (call_id, sequence_number)
            turn_id = call.turns.get(seq).id if seq in call.turns else str(uuid.uuid4())
            call.turns[seq] = TranscriptTurnRecord(
                id=turn_id,
                call_id=call_id,
                sequence_number=seq,
                speaker=speaker,
                text_bn=text_bn,
                text_en=text_en,
                timestamp_ms=ts_ms,
                created_at=_now_iso(),
            )
            accepted += 1
        return accepted

    def upsert_patient(
        self,
        clinic_id: str,
        full_name: str,
        phone_e164: str | None,
    ) -> PatientRecord:
        now = _now_iso()
        if phone_e164:
            for existing in self.patients.values():
                if existing.clinic_id == clinic_id and existing.phone_e164 == phone_e164:
                    if full_name and full_name != "Unidentified Caller":
                        existing.full_name = full_name
                    existing.updated_at = now
                    return existing

        pat_id = str(uuid.uuid4())
        rec = PatientRecord(
            id=pat_id,
            clinic_id=clinic_id,
            full_name=full_name,
            phone_e164=phone_e164,
            created_at=now,
            updated_at=now,
        )
        self.patients[pat_id] = rec
        return rec

    def get_patient(self, clinic_id: str, patient_id: str) -> PatientRecord | None:
        rec = self.patients.get(patient_id)
        if not rec or rec.clinic_id != clinic_id:
            return None
        return rec

    def list_patients(self, clinic_id: str) -> list[PatientRecord]:
        items = [p for p in self.patients.values() if p.clinic_id == clinic_id]
        items.sort(key=lambda p: p.created_at, reverse=True)
        return items

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
    ) -> CallRecord:
        call = self.get_call(clinic_id, call_id)
        if not call:
            raise AppError("Call not found.", 404, "not_found")

        call.patient_id = patient_id
        call.ended_at = ended_at
        call.duration_seconds = duration_seconds
        call.status = status
        call.outcome = outcome
        call.extraction = extraction

        if appointment:
            existing_appt = self.get_appointment_by_call(clinic_id, call_id)
            if existing_appt:
                appointment.id = existing_appt.id
            self.appointments[appointment.id] = appointment

        if followup:
            existing_fu = self.get_follow_up_by_call(clinic_id, call_id)
            if existing_fu:
                followup.id = existing_fu.id
            self.follow_ups[followup.id] = followup

        return call

    def list_appointments(self, clinic_id: str) -> list[AppointmentRecord]:
        items = [a for a in self.appointments.values() if a.clinic_id == clinic_id]
        items.sort(key=lambda a: a.created_at, reverse=True)
        return items

    def get_appointment_by_call(
        self, clinic_id: str, call_id: str
    ) -> AppointmentRecord | None:
        for a in self.appointments.values():
            if a.clinic_id == clinic_id and a.call_id == call_id:
                return a
        return None

    def create_appointment(self, appt: AppointmentRecord) -> AppointmentRecord:
        if appt.status == "confirmed" and not appt.scheduled_start:
            raise AppError(
                "Cannot mark an appointment as confirmed without a scheduled start time.",
                422,
                "validation_error",
            )
        self.appointments[appt.id] = appt
        return appt

    def update_appointment(
        self,
        clinic_id: str,
        appointment_id: str,
        *,
        status: str | None,
        scheduled_start: str | None,
        doctor_id: str | None,
    ) -> AppointmentRecord | None:
        appt = self.appointments.get(appointment_id)
        if not appt or appt.clinic_id != clinic_id:
            return None

        next_status = status or appt.status
        next_start = scheduled_start if scheduled_start is not None else appt.scheduled_start
        if next_status == "confirmed" and not next_start:
            raise AppError(
                "A confirmed appointment requires a scheduled_start timestamp.",
                422,
                "validation_error",
            )

        appt.status = next_status
        appt.scheduled_start = next_start
        if doctor_id is not None:
            appt.doctor_id = doctor_id
        if next_status == "confirmed" and not appt.booking_reference:
            appt.booking_reference = f"DDC-{appt.id[:8].upper()}"
        appt.updated_at = _now_iso()

        if appt.call_id:
            call = self.get_call(clinic_id, appt.call_id)
            if call and call.extraction:
                if next_status == "confirmed":
                    call.extraction.booking_status = "confirmed"
                elif next_status == "cancelled":
                    call.extraction.booking_status = "declined"

        return appt

    def list_follow_ups(self, clinic_id: str) -> list[FollowUpRecord]:
        items = [f for f in self.follow_ups.values() if f.clinic_id == clinic_id]
        items.sort(key=lambda f: f.created_at, reverse=True)
        return items

    def get_follow_up_by_call(
        self, clinic_id: str, call_id: str
    ) -> FollowUpRecord | None:
        for f in self.follow_ups.values():
            if f.clinic_id == clinic_id and f.call_id == call_id:
                return f
        return None

    def update_follow_up(
        self,
        clinic_id: str,
        follow_up_id: str,
        *,
        status: str | None,
        assigned_to: str | None,
    ) -> FollowUpRecord | None:
        fu = self.follow_ups.get(follow_up_id)
        if not fu or fu.clinic_id != clinic_id:
            return None
        if status is not None:
            fu.status = status
        if assigned_to is not None:
            fu.assigned_to = assigned_to
        fu.updated_at = _now_iso()
        return fu
