"""Supabase PostgreSQL repository implementation using the official supabase-py client.

Every query explicitly scopes by clinic_id in addition to database-level RLS policies.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from supabase import Client, create_client

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


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


class SupabaseClinicRepository:
    def __init__(self, url: str, service_role_key: str) -> None:
        self.client: Client = create_client(url, service_role_key)

    def check_health(self) -> bool:
        try:
            self.client.table("clinics").select("id").limit(1).execute()
            return True
        except Exception:
            return False

    def get_clinic(self, clinic_id: str) -> ClinicRecord | None:
        res = (
            self.client.table("clinics")
            .select("id,name,slug,timezone,opening_hours")
            .eq("id", clinic_id)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        return ClinicRecord(**rows[0]) if rows else None

    def get_clinic_by_slug(self, slug: str) -> ClinicRecord | None:
        res = (
            self.client.table("clinics")
            .select("id,name,slug,timezone,opening_hours")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        return ClinicRecord(**rows[0]) if rows else None

    def get_profile(self, user_id: str) -> ProfileRecord | None:
        res = (
            self.client.table("profiles")
            .select("id,clinic_id,full_name,role")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        return ProfileRecord(**rows[0]) if rows else None

    def upsert_profile(self, profile: ProfileRecord) -> ProfileRecord:
        self.client.table("profiles").upsert(
            {
                "id": profile.id,
                "clinic_id": profile.clinic_id,
                "full_name": profile.full_name,
                "role": profile.role,
            }
        ).execute()
        return profile

    def list_doctors(self, clinic_id: str) -> list[DoctorRecord]:
        res = (
            self.client.table("doctors")
            .select("id,clinic_id,full_name,specialty,active")
            .eq("clinic_id", clinic_id)
            .eq("active", True)
            .execute()
        )
        return [DoctorRecord(**r) for r in (res.data or [])]

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
            existing = (
                self.client.table("calls")
                .select("*")
                .eq("clinic_id", clinic_id)
                .eq("provider", provider)
                .eq("provider_call_id", provider_call_id)
                .limit(1)
                .execute()
            )
            if existing.data:
                return self._hydrate_call(existing.data[0])

        call_id = str(uuid.uuid4())
        payload = {
            "id": call_id,
            "clinic_id": clinic_id,
            "provider": provider,
            "provider_call_id": provider_call_id,
            "call_mode": call_mode,
            "started_at": started_at,
            "status": "in_progress",
        }
        res = self.client.table("calls").insert(payload).execute()
        return self._hydrate_call(res.data[0])

    def get_call(self, clinic_id: str, call_id: str) -> CallRecord | None:
        res = (
            self.client.table("calls")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("id", call_id)
            .limit(1)
            .execute()
        )
        if not res.data:
            return None
        return self._hydrate_call(res.data[0])

    def list_calls(self, clinic_id: str) -> list[CallRecord]:
        res = (
            self.client.table("calls")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("started_at", desc=True)
            .execute()
        )
        return [self._hydrate_call(r) for r in (res.data or [])]

    def _hydrate_call(self, row: dict) -> CallRecord:
        call_id = row["id"]
        turns_res = (
            self.client.table("transcript_turns")
            .select("*")
            .eq("call_id", call_id)
            .order("sequence_number")
            .execute()
        )
        turns = {
            t["sequence_number"]: TranscriptTurnRecord(
                id=t["id"],
                call_id=t["call_id"],
                sequence_number=t["sequence_number"],
                speaker=t["speaker"],
                text_bn=t["text_bn"],
                text_en=t.get("text_en"),
                timestamp_ms=t.get("timestamp_ms"),
                created_at=t["created_at"],
            )
            for t in (turns_res.data or [])
        }
        ex_res = (
            self.client.table("call_extractions")
            .select("*")
            .eq("call_id", call_id)
            .limit(1)
            .execute()
        )
        ex_row = ex_res.data[0] if ex_res.data else None
        extraction = (
            CallExtractionRecord(
                id=ex_row["id"],
                call_id=ex_row["call_id"],
                intent=ex_row.get("intent"),
                reason_for_visit=ex_row.get("reason_for_visit"),
                preferred_date_text=ex_row.get("preferred_date_text"),
                preferred_date=ex_row.get("preferred_date"),
                preferred_time=ex_row.get("preferred_time"),
                preferred_datetime=ex_row.get("preferred_datetime"),
                preferred_doctor=ex_row.get("preferred_doctor"),
                patient_name_confirmed=bool(ex_row.get("patient_name_confirmed")),
                phone_confirmed=bool(ex_row.get("phone_confirmed")),
                booking_status=ex_row.get("booking_status", "none"),
                requires_human_followup=bool(ex_row.get("requires_human_followup")),
                confidence=ex_row.get("confidence"),
                created_at=ex_row["created_at"],
                updated_at=ex_row["updated_at"],
            )
            if ex_row
            else None
        )
        return CallRecord(
            id=row["id"],
            clinic_id=row["clinic_id"],
            patient_id=row.get("patient_id"),
            provider=row["provider"],
            provider_call_id=row.get("provider_call_id"),
            call_mode=row["call_mode"],
            started_at=row["started_at"],
            ended_at=row.get("ended_at"),
            duration_seconds=row.get("duration_seconds"),
            status=row["status"],
            outcome=row.get("outcome"),
            recording_url=row.get("recording_url"),
            created_at=row["created_at"],
            turns=turns,
            extraction=extraction,
        )

    def upsert_turns(
        self,
        clinic_id: str,
        call_id: str,
        turns: list[tuple[int, str, str, str | None, int | None]],
    ) -> int:
        call = self.get_call(clinic_id, call_id)
        if not call:
            raise AppError("Call not found for clinic.", 404, "not_found")
        rows = [
            {
                "call_id": call_id,
                "sequence_number": seq,
                "speaker": speaker,
                "text_bn": text_bn,
                "text_en": text_en,
                "timestamp_ms": ts_ms,
            }
            for seq, speaker, text_bn, text_en, ts_ms in turns
        ]
        if rows:
            self.client.table("transcript_turns").upsert(
                rows, on_conflict="call_id,sequence_number"
            ).execute()
        return len(rows)

    def upsert_patient(
        self,
        clinic_id: str,
        full_name: str,
        phone_e164: str | None,
    ) -> PatientRecord:
        if phone_e164:
            existing = (
                self.client.table("patients")
                .select("*")
                .eq("clinic_id", clinic_id)
                .eq("phone_e164", phone_e164)
                .limit(1)
                .execute()
            )
            if existing.data:
                row = existing.data[0]
                if full_name and full_name != "Unidentified Caller":
                    res = (
                        self.client.table("patients")
                        .update({"full_name": full_name, "updated_at": _now_iso()})
                        .eq("id", row["id"])
                        .execute()
                    )
                    row = res.data[0]
                return PatientRecord(**row)

        res = (
            self.client.table("patients")
            .insert(
                {
                    "clinic_id": clinic_id,
                    "full_name": full_name,
                    "phone_e164": phone_e164,
                }
            )
            .execute()
        )
        return PatientRecord(**res.data[0])

    def get_patient(self, clinic_id: str, patient_id: str) -> PatientRecord | None:
        res = (
            self.client.table("patients")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("id", patient_id)
            .limit(1)
            .execute()
        )
        return PatientRecord(**res.data[0]) if res.data else None

    def list_patients(self, clinic_id: str) -> list[PatientRecord]:
        res = (
            self.client.table("patients")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .execute()
        )
        return [PatientRecord(**r) for r in (res.data or [])]

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
        self.client.table("calls").update(
            {
                "patient_id": patient_id,
                "ended_at": ended_at,
                "duration_seconds": duration_seconds,
                "status": status,
                "outcome": outcome,
            }
        ).eq("clinic_id", clinic_id).eq("id", call_id).execute()

        self.client.table("call_extractions").upsert(
            {
                "call_id": call_id,
                "intent": extraction.intent,
                "reason_for_visit": extraction.reason_for_visit,
                "preferred_date_text": extraction.preferred_date_text,
                "preferred_date": extraction.preferred_date,
                "preferred_time": extraction.preferred_time,
                "preferred_datetime": extraction.preferred_datetime,
                "preferred_doctor": extraction.preferred_doctor,
                "patient_name_confirmed": extraction.patient_name_confirmed,
                "phone_confirmed": extraction.phone_confirmed,
                "booking_status": extraction.booking_status,
                "requires_human_followup": extraction.requires_human_followup,
                "confidence": extraction.confidence,
                "updated_at": _now_iso(),
            },
            on_conflict="call_id",
        ).execute()

        if appointment:
            self.client.table("appointments").upsert(
                {
                    "clinic_id": clinic_id,
                    "patient_id": appointment.patient_id,
                    "call_id": call_id,
                    "doctor_id": appointment.doctor_id,
                    "requested_preference": appointment.requested_preference,
                    "scheduled_start": appointment.scheduled_start,
                    "status": appointment.status,
                    "booking_reference": appointment.booking_reference,
                },
                on_conflict="call_id",
            ).execute()

        if followup:
            self.client.table("follow_up_requests").upsert(
                {
                    "clinic_id": clinic_id,
                    "call_id": call_id,
                    "patient_id": followup.patient_id,
                    "reason": followup.reason,
                    "status": followup.status,
                },
                on_conflict="call_id",
            ).execute()

        call = self.get_call(clinic_id, call_id)
        if not call:
            raise AppError("Call not found after completion.", 404, "not_found")
        return call

    def list_appointments(self, clinic_id: str) -> list[AppointmentRecord]:
        res = (
            self.client.table("appointments")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .execute()
        )
        return [AppointmentRecord(**r) for r in (res.data or [])]

    def get_appointment_by_call(
        self, clinic_id: str, call_id: str
    ) -> AppointmentRecord | None:
        res = (
            self.client.table("appointments")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("call_id", call_id)
            .limit(1)
            .execute()
        )
        return AppointmentRecord(**res.data[0]) if res.data else None

    def create_appointment(self, appt: AppointmentRecord) -> AppointmentRecord:
        if appt.status == "confirmed" and not appt.scheduled_start:
            raise AppError(
                "Cannot mark an appointment as confirmed without a scheduled start time.",
                422,
                "validation_error",
            )
        res = (
            self.client.table("appointments")
            .insert(
                {
                    "id": appt.id,
                    "clinic_id": appt.clinic_id,
                    "patient_id": appt.patient_id,
                    "call_id": appt.call_id,
                    "doctor_id": appt.doctor_id,
                    "requested_preference": appt.requested_preference,
                    "scheduled_start": appt.scheduled_start,
                    "status": appt.status,
                    "booking_reference": appt.booking_reference,
                }
            )
            .execute()
        )
        return AppointmentRecord(**res.data[0])

    def update_appointment(
        self,
        clinic_id: str,
        appointment_id: str,
        *,
        status: str | None,
        scheduled_start: str | None,
        doctor_id: str | None,
    ) -> AppointmentRecord | None:
        existing_res = (
            self.client.table("appointments")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("id", appointment_id)
            .limit(1)
            .execute()
        )
        if not existing_res.data:
            return None
        appt = AppointmentRecord(**existing_res.data[0])
        next_status = status or appt.status
        next_start = scheduled_start if scheduled_start is not None else appt.scheduled_start
        if next_status == "confirmed" and not next_start:
            raise AppError(
                "A confirmed appointment requires a scheduled_start timestamp.",
                422,
                "validation_error",
            )
        patch: dict[str, str | None] = {
            "status": next_status,
            "scheduled_start": next_start,
            "updated_at": _now_iso(),
        }
        if doctor_id is not None:
            patch["doctor_id"] = doctor_id
        if next_status == "confirmed" and not appt.booking_reference:
            patch["booking_reference"] = f"DDC-{appt.id[:8].upper()}"

        updated = (
            self.client.table("appointments")
            .update(patch)
            .eq("clinic_id", clinic_id)
            .eq("id", appointment_id)
            .execute()
        )
        return AppointmentRecord(**updated.data[0])

    def list_follow_ups(self, clinic_id: str) -> list[FollowUpRecord]:
        res = (
            self.client.table("follow_up_requests")
            .select("*")
            .eq("clinic_id", clinic_id)
            .order("created_at", desc=True)
            .execute()
        )
        return [FollowUpRecord(**r) for r in (res.data or [])]

    def get_follow_up_by_call(
        self, clinic_id: str, call_id: str
    ) -> FollowUpRecord | None:
        res = (
            self.client.table("follow_up_requests")
            .select("*")
            .eq("clinic_id", clinic_id)
            .eq("call_id", call_id)
            .limit(1)
            .execute()
        )
        return FollowUpRecord(**res.data[0]) if res.data else None

    def update_follow_up(
        self,
        clinic_id: str,
        follow_up_id: str,
        *,
        status: str | None,
        assigned_to: str | None,
    ) -> FollowUpRecord | None:
        patch: dict[str, str | None] = {"updated_at": _now_iso()}
        if status is not None:
            patch["status"] = status
        if assigned_to is not None:
            patch["assigned_to"] = assigned_to
        res = (
            self.client.table("follow_up_requests")
            .update(patch)
            .eq("clinic_id", clinic_id)
            .eq("id", follow_up_id)
            .execute()
        )
        return FollowUpRecord(**res.data[0]) if res.data else None
