"""FastAPI route handlers for health, portal, demo calls, and Vapi webhooks."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Header, Query

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.dependencies.auth import (
    get_current_profile,
    get_repository,
    issue_demo_call_token,
    verify_demo_call_token,
)
from app.integrations.vapi.webhook import (
    VapiWebhookPayload,
    ingest_vapi_webhook,
    verify_vapi_webhook_secret,
)
from app.repositories.base import AppointmentRecord, ClinicRepository, ProfileRecord
from app.schemas.api import (
    AppointmentCreateIn,
    AppointmentOut,
    AppointmentPatchIn,
    CallDetailOut,
    CallMode,
    CallOutcome,
    CallStatus,
    CallSummaryOut,
    ClinicRef,
    CreateCallIn,
    DashboardSummaryOut,
    DemoCallCreateIn,
    DemoCallCreateOut,
    DemoCallFinishIn,
    DemoTurnsBatchIn,
    FollowUpOut,
    FollowUpPatchIn,
    FollowUpStatus,
    HealthStatusOut,
    MeOut,
    PaginatedOut,
    PatientDetailOut,
    PatientOut,
)
from app.services.call_service import CallLifecycleService

router = APIRouter(prefix="/api")


def _paginate(items: list, page: int, page_size: int) -> PaginatedOut:
    start = (page - 1) * page_size
    end = start + page_size
    return PaginatedOut(
        items=items[start:end],
        total=len(items),
        page=page,
        pageSize=page_size,
    )


def _matches(query: str | None, *fields: str | None) -> bool:
    if not query or not query.strip():
        return True
    needle = query.strip().lower()
    return any(f and needle in f.lower() for f in fields)


@router.get("/health", response_model=HealthStatusOut, tags=["system"])
def get_health(
    settings: Settings = Depends(get_settings),
    repo: ClinicRepository = Depends(get_repository),
) -> HealthStatusOut:
    db_ok = repo.check_health()
    return HealthStatusOut(
        status="ok" if db_ok else "degraded",
        database="ok" if db_ok else "unavailable",
        version=settings.app_version,
    )


@router.get("/me", response_model=MeOut, tags=["auth"])
def get_me(
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> MeOut:
    clinic = repo.get_clinic(profile.clinic_id)
    if not clinic:
        raise AppError("Clinic record not found.", 404, "clinic_not_found")
    return MeOut(
        id=profile.id,
        fullName=profile.full_name,
        role=profile.role,  # type: ignore[arg-type]
        clinic=ClinicRef(id=clinic.id, name=clinic.name, timezone=clinic.timezone),
    )


@router.get("/dashboard/summary", response_model=DashboardSummaryOut, tags=["portal"])
def get_dashboard_summary(
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> DashboardSummaryOut:
    service = CallLifecycleService(repo)
    return service.build_dashboard_summary(profile.clinic_id)


@router.get("/calls", response_model=PaginatedOut[CallSummaryOut], tags=["calls"])
def list_calls(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None),
    status: CallStatus | None = Query(default=None),
    outcome: CallOutcome | None = Query(default=None),
    mode: CallMode | None = Query(default=None),
    sort: Literal["started_at", "-started_at", "duration", "-duration"] = Query(
        default="-started_at"
    ),
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> PaginatedOut[CallSummaryOut]:
    service = CallLifecycleService(repo)
    records = repo.list_calls(profile.clinic_id)
    patients = {p.id: p for p in repo.list_patients(profile.clinic_id)}

    filtered = []
    for c in records:
        if status and c.status != status:
            continue
        if outcome and c.outcome != outcome:
            continue
        if mode and c.call_mode != mode:
            continue
        pat = patients.get(c.patient_id) if c.patient_id else None
        reason = c.extraction.reason_for_visit if c.extraction else None
        if not _matches(
            search,
            pat.full_name if pat else None,
            pat.phone_e164 if pat else None,
            reason,
            c.id,
        ):
            continue
        filtered.append(c)

    reverse = sort.startswith("-")
    if sort.endswith("duration"):
        filtered.sort(
            key=lambda c: c.duration_seconds if c.duration_seconds is not None else -1,
            reverse=reverse,
        )
    else:
        filtered.sort(key=lambda c: c.started_at, reverse=reverse)

    summaries = [service.to_call_summary(c, profile.role) for c in filtered]
    return _paginate(summaries, page, page_size)


@router.get("/calls/{call_id}", response_model=CallDetailOut, tags=["calls"])
def get_call_detail(
    call_id: str,
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> CallDetailOut:
    call = repo.get_call(profile.clinic_id, call_id)
    if not call:
        raise AppError("Call not found.", 404, "not_found")
    service = CallLifecycleService(repo)
    return service.to_call_detail(call, profile.role)


@router.post("/calls", response_model=CallSummaryOut, status_code=201, tags=["calls"])
def create_call(
    body: CreateCallIn,
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> CallSummaryOut:
    started = body.startedAt or datetime.now(UTC).isoformat()
    call = repo.create_or_get_call(
        clinic_id=profile.clinic_id,
        provider=body.provider,
        provider_call_id=body.providerCallId,
        call_mode=body.callMode,
        started_at=started,
    )
    service = CallLifecycleService(repo)
    return service.to_call_summary(call, profile.role)


@router.get("/patients", response_model=PaginatedOut[PatientOut], tags=["patients"])
def list_patients(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None),
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> PaginatedOut[PatientOut]:
    service = CallLifecycleService(repo)
    items = service.list_patients_out(profile.clinic_id)
    if search:
        raw_patients = {p.id: p for p in repo.list_patients(profile.clinic_id)}
        items = [
            item
            for item in items
            if _matches(
                search,
                item.fullName,
                raw_patients.get(item.id).phone_e164
                if item.id in raw_patients
                else None,
            )
        ]
    return _paginate(items, page, page_size)


@router.get(
    "/patients/{patient_id}", response_model=PatientDetailOut, tags=["patients"]
)
def get_patient_detail(
    patient_id: str,
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> PatientDetailOut:
    service = CallLifecycleService(repo)
    return service.get_patient_detail_out(profile.clinic_id, patient_id, profile.role)


@router.get(
    "/appointments", response_model=PaginatedOut[AppointmentOut], tags=["appointments"]
)
def list_appointments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> PaginatedOut[AppointmentOut]:
    service = CallLifecycleService(repo)
    items = service.list_appointments_out(profile.clinic_id)
    if status:
        items = [a for a in items if a.status == status]
    if search:
        items = [
            a
            for a in items
            if _matches(search, a.patient.fullName, a.bookingReference, a.requestedPreference)
        ]
    return _paginate(items, page, page_size)


@router.post(
    "/appointments",
    response_model=AppointmentOut,
    status_code=201,
    tags=["appointments"],
)
def create_appointment(
    body: AppointmentCreateIn,
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> AppointmentOut:
    if profile.role == "viewer":
        raise AppError("Viewer role cannot create appointments.", 403, "forbidden")
    patient = repo.get_patient(profile.clinic_id, body.patientId)
    if not patient:
        raise AppError("Patient not found in clinic.", 404, "patient_not_found")
    now = datetime.now(UTC).isoformat()
    appt_id = str(uuid.uuid4())
    rec = AppointmentRecord(
        id=appt_id,
        clinic_id=profile.clinic_id,
        patient_id=patient.id,
        call_id=body.callId,
        doctor_id=body.doctorId,
        requested_preference=body.requestedPreference,
        scheduled_start=body.scheduledStart,
        status=body.status,
        booking_reference=f"DDC-{appt_id[:8].upper()}"
        if body.status == "confirmed"
        else None,
        created_at=now,
        updated_at=now,
    )
    saved = repo.create_appointment(rec)
    service = CallLifecycleService(repo)
    doctors = {d.id: d for d in repo.list_doctors(profile.clinic_id)}
    return service._to_appointment_out(saved, patient.full_name, doctors)


@router.patch(
    "/appointments/{appointment_id}",
    response_model=AppointmentOut,
    tags=["appointments"],
)
def patch_appointment(
    appointment_id: str,
    body: AppointmentPatchIn,
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> AppointmentOut:
    if profile.role == "viewer":
        raise AppError("Viewer role cannot modify appointments.", 403, "forbidden")
    updated = repo.update_appointment(
        profile.clinic_id,
        appointment_id,
        status=body.status,
        scheduled_start=body.scheduledStart,
        doctor_id=body.doctorId,
    )
    if not updated:
        raise AppError("Appointment not found.", 404, "not_found")
    patient = repo.get_patient(profile.clinic_id, updated.patient_id)
    doctors = {d.id: d for d in repo.list_doctors(profile.clinic_id)}
    service = CallLifecycleService(repo)
    return service._to_appointment_out(
        updated, patient.full_name if patient else "Patient", doctors
    )


@router.get(
    "/follow-ups", response_model=PaginatedOut[FollowUpOut], tags=["follow-ups"]
)
def list_follow_ups(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=25, ge=1, le=100),
    search: str | None = Query(default=None),
    status: FollowUpStatus | None = Query(default=None),
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> PaginatedOut[FollowUpOut]:
    service = CallLifecycleService(repo)
    items = service.list_follow_ups_out(profile.clinic_id, profile)
    if status:
        items = [f for f in items if f.status == status]
    if search:
        items = [
            f
            for f in items
            if _matches(search, f.patient.fullName if f.patient else None, f.reason)
        ]
    return _paginate(items, page, page_size)


@router.patch(
    "/follow-ups/{follow_up_id}", response_model=FollowUpOut, tags=["follow-ups"]
)
def patch_follow_up(
    follow_up_id: str,
    body: FollowUpPatchIn,
    profile: ProfileRecord = Depends(get_current_profile),
    repo: ClinicRepository = Depends(get_repository),
) -> FollowUpOut:
    if profile.role == "viewer":
        raise AppError("Viewer role cannot modify follow-ups.", 403, "forbidden")
    assigned_to = profile.id if body.assignedToMe else None
    updated = repo.update_follow_up(
        profile.clinic_id,
        follow_up_id,
        status=body.status,
        assigned_to=assigned_to,
    )
    if not updated:
        raise AppError("Follow-up request not found.", 404, "not_found")
    service = CallLifecycleService(repo)
    items = service.list_follow_ups_out(profile.clinic_id, profile)
    for item in items:
        if item.id == follow_up_id:
            return item
    raise AppError("Follow-up request not found.", 404, "not_found")


# ---- Public Demo Call Lifecycle Endpoints (scoped to demo clinic + per-call token) ----


@router.post(
    "/demo-calls",
    response_model=DemoCallCreateOut,
    status_code=201,
    tags=["demo-calls"],
)
def create_demo_call(
    body: DemoCallCreateIn,
    settings: Settings = Depends(get_settings),
    repo: ClinicRepository = Depends(get_repository),
) -> DemoCallCreateOut:
    clinic = repo.get_clinic_by_slug(settings.demo_clinic_slug) or repo.get_clinic(
        settings.demo_clinic_id
    )
    if not clinic:
        raise AppError("Demo clinic not configured.", 500, "demo_clinic_missing")
    call = repo.create_or_get_call(
        clinic_id=clinic.id,
        provider="demo",
        provider_call_id=body.providerCallId,
        call_mode="demo",
        started_at=body.startedAt,
    )
    return DemoCallCreateOut(
        callId=call.id,
        callToken=issue_demo_call_token(call.id, settings),
    )


@router.post(
    "/demo-calls/{call_id}/turns",
    dependencies=[Depends(verify_demo_call_token)],
    tags=["demo-calls"],
)
def append_demo_call_turns(
    call_id: str,
    body: DemoTurnsBatchIn,
    settings: Settings = Depends(get_settings),
    repo: ClinicRepository = Depends(get_repository),
) -> dict[str, int]:
    clinic = repo.get_clinic_by_slug(settings.demo_clinic_slug) or repo.get_clinic(
        settings.demo_clinic_id
    )
    if not clinic:
        raise AppError("Demo clinic not configured.", 500, "demo_clinic_missing")
    turns = [
        (t.sequenceNumber, t.speaker, t.text, None, t.timestampMs) for t in body.turns
    ]
    accepted = repo.upsert_turns(clinic.id, call_id, turns)
    return {"accepted": accepted}


@router.post(
    "/demo-calls/{call_id}/finish",
    dependencies=[Depends(verify_demo_call_token)],
    tags=["demo-calls"],
)
def finish_demo_call(
    call_id: str,
    body: DemoCallFinishIn,
    settings: Settings = Depends(get_settings),
    repo: ClinicRepository = Depends(get_repository),
) -> dict[str, str]:
    clinic = repo.get_clinic_by_slug(settings.demo_clinic_slug) or repo.get_clinic(
        settings.demo_clinic_id
    )
    if not clinic:
        raise AppError("Demo clinic not configured.", 500, "demo_clinic_missing")
    # Force demo mode on public demo endpoint
    body.callMode = "demo"
    body.provider = "demo"
    service = CallLifecycleService(repo)
    saved = service.complete_call(clinic_id=clinic.id, call_id=call_id, payload=body)
    return {"callId": saved.id, "outcome": saved.outcome or "no_action"}


# ---- Vapi Webhook Endpoint ----


@router.post("/webhooks/vapi", tags=["webhooks"])
def handle_vapi_webhook(
    payload: VapiWebhookPayload,
    x_vapi_secret: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    repo: ClinicRepository = Depends(get_repository),
) -> dict[str, str]:
    verify_vapi_webhook_secret(x_vapi_secret, settings)
    return ingest_vapi_webhook(payload, repo, settings)
