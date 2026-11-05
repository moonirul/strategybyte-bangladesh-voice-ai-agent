"""Vapi webhook ingestion adapter (prepared for Phase 3/5 live voice integration).

Validates the webhook secret when configured, maps Vapi's end-of-call report into
our internal call lifecycle, and guarantees idempotency via provider_call_id.
"""

from __future__ import annotations

import hmac
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.core.config import Settings
from app.core.errors import AppError
from app.repositories.base import ClinicRepository
from app.schemas.api import DemoCallFinishIn, FinalExtractionIn
from app.services.call_service import CallLifecycleService


class VapiTurnItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    role: str = "assistant"
    message: str = ""
    secondsFromStart: float | None = None


class VapiWebhookPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")
    providerCallId: str = Field(min_length=2, max_length=128)
    clinicSlug: str | None = None
    startedAt: str | None = None
    endedAt: str | None = None
    outcome: str = "no_action"
    turns: list[VapiTurnItem] = Field(default_factory=list)
    extracted: dict[str, Any] = Field(default_factory=dict)


def verify_vapi_webhook_secret(
    header_secret: str | None, settings: Settings
) -> None:
    if not settings.vapi_webhook_secret:
        return
    if not header_secret or not hmac.compare_digest(
        header_secret, settings.vapi_webhook_secret
    ):
        raise AppError("Invalid Vapi webhook signature/secret.", 401, "invalid_webhook_secret")


def ingest_vapi_webhook(
    payload: VapiWebhookPayload,
    repo: ClinicRepository,
    settings: Settings,
) -> dict[str, str]:
    slug = payload.clinicSlug or settings.demo_clinic_slug
    clinic = repo.get_clinic_by_slug(slug) or repo.get_clinic(settings.demo_clinic_id)
    if not clinic:
        raise AppError("Target clinic not found for webhook.", 404, "clinic_not_found")

    now = datetime.now(UTC).isoformat()
    started = payload.startedAt or now
    ended = payload.endedAt or now

    call = repo.create_or_get_call(
        clinic_id=clinic.id,
        provider="vapi",
        provider_call_id=payload.providerCallId,
        call_mode="live",
        started_at=started,
    )

    if payload.turns:
        formatted_turns = [
            (
                idx,
                "caller" if t.role in ("user", "caller", "customer") else "assistant",
                t.message,
                None,
                int(t.secondsFromStart * 1000) if t.secondsFromStart is not None else None,
            )
            for idx, t in enumerate(payload.turns)
            if t.message.strip()
        ]
        repo.upsert_turns(clinic.id, call.id, formatted_turns)

    ext = payload.extracted
    finish_in = DemoCallFinishIn(
        provider="vapi",
        callMode="live",
        providerCallId=payload.providerCallId,
        startedAt=started,
        endedAt=ended,
        outcome=payload.outcome if payload.outcome in ("appointment_requested", "faq_answered", "followup_required", "incomplete", "no_action") else "no_action",  # type: ignore[arg-type]
        extraction=FinalExtractionIn(
            intent=ext.get("intent", "unknown"),
            reasonForVisit=ext.get("reasonForVisit"),
            patientName=ext.get("patientName"),
            patientNameConfirmed=bool(ext.get("patientNameConfirmed", False)),
            phoneRaw=ext.get("phoneRaw"),
            phoneE164=ext.get("phoneE164"),
            phoneConfirmed=bool(ext.get("phoneConfirmed", False)),
            preferredDateText=ext.get("preferredDateText"),
            preferredDoctor=ext.get("preferredDoctor"),
            bookingStatus="requested" if ext.get("bookingStatus") == "requested" else "none",
            requiresHumanFollowup=bool(ext.get("requiresHumanFollowup", False)),
            followupReason=ext.get("followupReason"),
        ),
    )

    service = CallLifecycleService(repo)
    saved = service.complete_call(
        clinic_id=clinic.id, call_id=call.id, payload=finish_in
    )
    return {"callId": saved.id, "status": saved.status}
