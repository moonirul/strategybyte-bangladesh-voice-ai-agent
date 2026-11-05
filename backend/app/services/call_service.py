"""Call lifecycle orchestration and clinical data formatting service."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from app.core.errors import AppError
from app.core.logging import get_logger, mask_phone_display
from app.core.validation import (
    get_clinic_tz,
    parse_spoken_preference,
    sanitize_patient_name,
    validate_bd_phone,
)
from app.repositories.base import (
    AppointmentRecord,
    CallExtractionRecord,
    CallRecord,
    ClinicRepository,
    FollowUpRecord,
    ProfileRecord,
)
from app.schemas.api import (
    AppointmentOut,
    CallDetailOut,
    CallExtractionOut,
    CallSummaryOut,
    DailyCallCountOut,
    DashboardSummaryOut,
    DemoCallFinishIn,
    DoctorRef,
    FollowUpOut,
    LinkedAppointmentRef,
    LinkedFollowUpRef,
    OutcomeCountOut,
    PatientDetailOut,
    PatientOut,
    PatientRef,
    StaffRef,
    TranscriptTurnOut,
)

logger = get_logger("bytevoice.calls")


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _compute_duration_seconds(started_at: str, ended_at: str | None) -> int | None:
    if not ended_at:
        return None
    try:
        start_dt = datetime.fromisoformat(started_at.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(ended_at.replace("Z", "+00:00"))
        diff = int((end_dt - start_dt).total_seconds())
        return max(diff, 0)
    except Exception:
        return None


class CallLifecycleService:
    def __init__(self, repo: ClinicRepository) -> None:
        self.repo = repo

    def complete_call(
        self,
        *,
        clinic_id: str,
        call_id: str,
        payload: DemoCallFinishIn,
    ) -> CallRecord:
        """Execute steps 5–10 of the Call Lifecycle (Section 14):
        - Validate Bangla name, phone number, and spoken date/time preference
        - Match or create patient without duplicating verified numbers
        - Record an unconfirmed appointment request when requested
        - Create a follow-up request when required or when phone/date are ambiguous
        - Persist final call outcome & extraction idempotently
        """
        call = self.repo.get_call(clinic_id, call_id)
        if not call:
            raise AppError("Call not found.", 404, "not_found")

        clinic = self.repo.get_clinic(clinic_id)
        tz_name = clinic.timezone if clinic else "Asia/Dhaka"

        ex_in = payload.extraction
        cleaned_name = sanitize_patient_name(ex_in.patientName)

        # Validate phone (prefer phoneRaw so backend enforces validation independently)
        phone_candidate = ex_in.phoneRaw or ex_in.phoneE164
        phone_res = validate_bd_phone(phone_candidate)
        valid_e164 = phone_res.e164 if phone_res.ok else None

        # Parse spoken date/time preference conservatively
        pref_res = parse_spoken_preference(ex_in.preferredDateText, tz_name)
        parsed_date = (
            pref_res.preferred_date.isoformat()
            if pref_res and pref_res.preferred_date and not pref_res.ambiguity
            else None
        )
        parsed_time = (
            pref_res.preferred_time.strftime("%H:%M")
            if pref_res and pref_res.preferred_time and not pref_res.ambiguity
            else None
        )
        parsed_dt = (
            pref_res.preferred_datetime.isoformat()
            if pref_res and pref_res.preferred_datetime and not pref_res.ambiguity
            else None
        )

        followup_reasons: list[str] = []
        if ex_in.requiresHumanFollowup and ex_in.followupReason:
            followup_reasons.append(ex_in.followupReason)
        if phone_candidate and not phone_res.ok:
            followup_reasons.append(f"Phone validation failed ({phone_res.reason})")
        if pref_res and pref_res.ambiguity:
            followup_reasons.append(f"Date/time preference ambiguous ({pref_res.ambiguity})")

        requires_followup = bool(ex_in.requiresHumanFollowup or followup_reasons)

        # Create or safely match patient when name or verified phone is available
        patient_id: str | None = None
        if cleaned_name or valid_e164:
            patient = self.repo.upsert_patient(
                clinic_id=clinic_id,
                full_name=cleaned_name or "Unidentified Caller",
                phone_e164=valid_e164,
            )
            patient_id = patient.id

        # Match preferred doctor if any
        doctor_id: str | None = None
        if ex_in.preferredDoctor:
            for doc in self.repo.list_doctors(clinic_id):
                if ex_in.preferredDoctor.lower() in doc.full_name.lower():
                    doctor_id = doc.id
                    break

        now = _now_iso()
        # Demo/AI voice calls can only ever create an unconfirmed request ("requested"), never "confirmed"
        booking_status = "requested" if ex_in.bookingStatus == "requested" else "none"

        extraction_rec = CallExtractionRecord(
            id=call.extraction.id if call.extraction else str(uuid.uuid4()),
            call_id=call.id,
            intent=ex_in.intent,
            reason_for_visit=ex_in.reasonForVisit,
            preferred_date_text=ex_in.preferredDateText,
            preferred_date=parsed_date,
            preferred_time=parsed_time,
            preferred_datetime=parsed_dt,
            preferred_doctor=ex_in.preferredDoctor,
            patient_name_confirmed=ex_in.patientNameConfirmed and bool(cleaned_name),
            phone_confirmed=ex_in.phoneConfirmed and bool(valid_e164),
            booking_status=booking_status,
            requires_human_followup=requires_followup,
            confidence=None,
            created_at=now,
            updated_at=now,
        )

        appointment_rec: AppointmentRecord | None = None
        if booking_status == "requested" and patient_id:
            appointment_rec = AppointmentRecord(
                id=str(uuid.uuid4()),
                clinic_id=clinic_id,
                patient_id=patient_id,
                call_id=call.id,
                doctor_id=doctor_id,
                requested_preference=ex_in.preferredDateText,
                scheduled_start=None,  # Never confirmed until staff schedule it
                status="requested",
                booking_reference=None,
                created_at=now,
                updated_at=now,
            )

        followup_rec: FollowUpRecord | None = None
        if requires_followup:
            reason_text = "; ".join(dict.fromkeys(followup_reasons)) or "Requires staff review"
            followup_rec = FollowUpRecord(
                id=str(uuid.uuid4()),
                clinic_id=clinic_id,
                call_id=call.id,
                patient_id=patient_id,
                reason=reason_text,
                status="open",
                assigned_to=None,
                created_at=now,
                updated_at=now,
            )

        duration_sec = _compute_duration_seconds(payload.startedAt, payload.endedAt)
        final_status = "abandoned" if payload.outcome == "incomplete" else "completed"

        saved = self.repo.save_call_completion(
            clinic_id=clinic_id,
            call_id=call.id,
            patient_id=patient_id,
            ended_at=payload.endedAt,
            duration_seconds=duration_sec,
            status=final_status,
            outcome=payload.outcome,
            extraction=extraction_rec,
            appointment=appointment_rec,
            followup=followup_rec,
        )

        logger.info(
            f"Completed call {call.id} with outcome={payload.outcome} booking={booking_status}",
            extra={"clinic_id": clinic_id, "call_id": call.id, "event": "call.completed"},
        )
        return saved

    # ---- Formatting helpers for Portal API ----

    def to_call_summary(
        self, call: CallRecord, viewer_role: str = "staff"
    ) -> CallSummaryOut:
        patient = (
            self.repo.get_patient(call.clinic_id, call.patient_id)
            if call.patient_id
            else None
        )
        ex = call.extraction
        fu = self.repo.get_follow_up_by_call(call.clinic_id, call.id)
        return CallSummaryOut(
            id=call.id,
            startedAt=call.started_at,
            durationSeconds=call.duration_seconds,
            callMode=call.call_mode,  # type: ignore[arg-type]
            provider=call.provider,  # type: ignore[arg-type]
            status=call.status,  # type: ignore[arg-type]
            outcome=call.outcome,  # type: ignore[arg-type]
            patient=PatientRef(id=patient.id, fullName=patient.full_name)
            if patient
            else None,
            phoneDisplay=mask_phone_display(
                patient.phone_e164 if patient else None, can_view_full=False
            ),
            bookingStatus=(ex.booking_status if ex else "none"),  # type: ignore[arg-type]
            requiresFollowup=bool((ex and ex.requires_human_followup) or fu),
        )

    def to_call_detail(
        self, call: CallRecord, viewer_role: str = "staff"
    ) -> CallDetailOut:
        summary = self.to_call_summary(call, viewer_role)
        patient = (
            self.repo.get_patient(call.clinic_id, call.patient_id)
            if call.patient_id
            else None
        )
        ex = call.extraction
        can_view_full = viewer_role in ("admin", "staff")
        appt = self.repo.get_appointment_by_call(call.clinic_id, call.id)
        fu = self.repo.get_follow_up_by_call(call.clinic_id, call.id)
        sorted_turns = sorted(call.turns.values(), key=lambda t: t.sequence_number)

        return CallDetailOut(
            **summary.model_dump(),
            endedAt=call.ended_at,
            providerCallId=call.provider_call_id,
            recordingUrl=call.recording_url,
            patientPhone=(
                patient.phone_e164
                if (patient and can_view_full)
                else mask_phone_display(patient.phone_e164 if patient else None, False)
            ),
            extraction=(
                CallExtractionOut(
                    intent=ex.intent,
                    reasonForVisit=ex.reason_for_visit,
                    preferredDateText=ex.preferred_date_text,
                    preferredDate=ex.preferred_date,
                    preferredTime=ex.preferred_time,
                    preferredDoctor=ex.preferred_doctor,
                    patientNameConfirmed=ex.patient_name_confirmed,
                    phoneConfirmed=ex.phone_confirmed,
                    bookingStatus=ex.booking_status,  # type: ignore[arg-type]
                    requiresHumanFollowup=ex.requires_human_followup,
                    confidence=ex.confidence,
                )
                if ex
                else None
            ),
            transcript=[
                TranscriptTurnOut(
                    id=t.id,
                    sequenceNumber=t.sequence_number,
                    speaker=t.speaker,  # type: ignore[arg-type]
                    textBn=t.text_bn,
                    textEn=t.text_en,
                    timestampMs=t.timestamp_ms,
                )
                for t in sorted_turns
            ],
            appointment=(
                LinkedAppointmentRef(id=appt.id, status=appt.status)  # type: ignore[arg-type]
                if appt
                else None
            ),
            followUp=(
                LinkedFollowUpRef(id=fu.id, status=fu.status, reason=fu.reason)  # type: ignore[arg-type]
                if fu
                else None
            ),
        )

    def build_dashboard_summary(self, clinic_id: str) -> DashboardSummaryOut:
        clinic = self.repo.get_clinic(clinic_id)
        tz = get_clinic_tz(clinic.timezone if clinic else "Asia/Dhaka")
        today_str = datetime.now(tz).date().isoformat()

        calls = self.repo.list_calls(clinic_id)
        appts = self.repo.list_appointments(clinic_id)
        follow_ups = self.repo.list_follow_ups(clinic_id)

        by_day: dict[str, dict[str, int]] = {}
        for i in range(6, -1, -1):
            d_str = (datetime.now(tz).date() - timedelta(days=i)).isoformat()
            by_day[d_str] = {"demo": 0, "live": 0}

        outcomes_map: dict[str, int] = {}
        calls_today = 0
        completed_calls = 0

        for c in calls:
            day_key = c.started_at[:10]
            if day_key == today_str:
                calls_today += 1
            if c.status == "completed":
                completed_calls += 1
            if day_key in by_day:
                mode_key = "live" if c.call_mode == "live" else "demo"
                by_day[day_key][mode_key] += 1
            if c.outcome:
                outcomes_map[c.outcome] = outcomes_map.get(c.outcome, 0) + 1

        return DashboardSummaryOut(
            totalCalls=len(calls),
            callsToday=calls_today,
            completedCalls=completed_calls,
            appointmentRequests=sum(1 for a in appts if a.status == "requested"),
            confirmedAppointments=sum(1 for a in appts if a.status == "confirmed"),
            pendingFollowUps=sum(
                1 for f in follow_ups if f.status in ("open", "in_progress")
            ),
            callsByDay=[
                DailyCallCountOut(date=d, demo=v["demo"], live=v["live"])
                for d, v in by_day.items()
            ],
            outcomes=[
                OutcomeCountOut(outcome=k, count=v)  # type: ignore[arg-type]
                for k, v in outcomes_map.items()
            ],
        )

    def list_patients_out(self, clinic_id: str) -> list[PatientOut]:
        patients = self.repo.list_patients(clinic_id)
        calls = self.repo.list_calls(clinic_id)
        out: list[PatientOut] = []
        for p in patients:
            p_calls = [c for c in calls if c.patient_id == p.id]
            out.append(
                PatientOut(
                    id=p.id,
                    fullName=p.full_name,
                    phoneDisplay=mask_phone_display(p.phone_e164, can_view_full=False),
                    createdAt=p.created_at,
                    callCount=len(p_calls),
                    lastCallAt=p_calls[0].started_at if p_calls else None,
                )
            )
        return out

    def get_patient_detail_out(
        self, clinic_id: str, patient_id: str, viewer_role: str
    ) -> PatientDetailOut:
        p = self.repo.get_patient(clinic_id, patient_id)
        if not p:
            raise AppError("Patient not found.", 404, "not_found")
        calls = [c for c in self.repo.list_calls(clinic_id) if c.patient_id == p.id]
        appts = [
            a for a in self.repo.list_appointments(clinic_id) if a.patient_id == p.id
        ]
        doctors = {d.id: d for d in self.repo.list_doctors(clinic_id)}
        can_view_full = viewer_role in ("admin", "staff")

        return PatientDetailOut(
            id=p.id,
            fullName=p.full_name,
            phoneDisplay=mask_phone_display(p.phone_e164, can_view_full=False),
            phoneE164=p.phone_e164 if can_view_full else None,
            createdAt=p.created_at,
            callCount=len(calls),
            lastCallAt=calls[0].started_at if calls else None,
            calls=[self.to_call_summary(c, viewer_role) for c in calls],
            appointments=[
                self._to_appointment_out(a, p.full_name, doctors) for a in appts
            ],
        )

    def list_appointments_out(self, clinic_id: str) -> list[AppointmentOut]:
        appts = self.repo.list_appointments(clinic_id)
        patients = {p.id: p for p in self.repo.list_patients(clinic_id)}
        doctors = {d.id: d for d in self.repo.list_doctors(clinic_id)}
        out: list[AppointmentOut] = []
        for a in appts:
            p = patients.get(a.patient_id)
            p_name = p.full_name if p else "Patient"
            out.append(self._to_appointment_out(a, p_name, doctors))
        return out

    def _to_appointment_out(
        self, a: AppointmentRecord, patient_name: str, doctors: dict
    ) -> AppointmentOut:
        doc = doctors.get(a.doctor_id) if a.doctor_id else None
        return AppointmentOut(
            id=a.id,
            patient=PatientRef(id=a.patient_id, fullName=patient_name),
            callId=a.call_id,
            doctor=(
                DoctorRef(id=doc.id, fullName=doc.full_name, specialty=doc.specialty)
                if doc
                else None
            ),
            requestedPreference=a.requested_preference,
            scheduledStart=a.scheduled_start,
            status=a.status,  # type: ignore[arg-type]
            bookingReference=a.booking_reference,
            createdAt=a.created_at,
            updatedAt=a.updated_at,
        )

    def list_follow_ups_out(
        self, clinic_id: str, current_profile: ProfileRecord
    ) -> list[FollowUpOut]:
        items = self.repo.list_follow_ups(clinic_id)
        patients = {p.id: p for p in self.repo.list_patients(clinic_id)}
        out: list[FollowUpOut] = []
        for f in items:
            p = patients.get(f.patient_id) if f.patient_id else None
            assigned_ref: StaffRef | None = None
            if f.assigned_to:
                prof = self.repo.get_profile(f.assigned_to)
                assigned_ref = StaffRef(
                    id=f.assigned_to,
                    fullName=prof.full_name if prof else current_profile.full_name,
                )
            out.append(
                FollowUpOut(
                    id=f.id,
                    callId=f.call_id,
                    patient=PatientRef(id=p.id, fullName=p.full_name) if p else None,
                    reason=f.reason,
                    status=f.status,  # type: ignore[arg-type]
                    assignedTo=assigned_ref,
                    createdAt=f.created_at,
                    updatedAt=f.updated_at,
                )
            )
        return out
