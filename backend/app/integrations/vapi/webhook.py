
"""Vapi webhook ingestion adapter.

Normalizes Vapi end-of-call reports into the existing call lifecycle.
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
    header_secret: str | None,
    settings: Settings,
) -> None:
    if not settings.vapi_webhook_secret:
        return

    if not header_secret or not hmac.compare_digest(
        header_secret,
        settings.vapi_webhook_secret,
    ):
        raise AppError(
            "Invalid Vapi webhook signature/secret.",
            401,
            "invalid_webhook_secret",
        )


def _normalize_vapi_report(
    raw: dict[str, Any],
) -> VapiWebhookPayload | None:
    """Normalize Vapi's native webhook payload."""

    message = raw.get("message")

    # Backward compatibility with the previous normalized payload.
    if not isinstance(message, dict):
        if raw.get("providerCallId"):
            return VapiWebhookPayload.model_validate(raw)
        return None

    if message.get("type") != "end-of-call-report":
        return None

    artifact = message.get("artifact") or {}
    call_info = message.get("call") or {}

    call_id = call_info.get("id") or message.get("callId")

    if not call_id:
        raise AppError(
            "Vapi report is missing call ID.",
            422,
            "missing_provider_call_id",
        )

    # Read structured output without depending on its UUID.
    extracted: dict[str, Any] = {}
    structured_outputs = artifact.get("structuredOutputs") or {}

    if isinstance(structured_outputs, dict):
        for output in structured_outputs.values():
            if not isinstance(output, dict):
                continue

            result = output.get("result")

            if isinstance(result, dict) and result:
                extracted = result
                break

    # Extract caller and assistant messages only.
    turns: list[VapiTurnItem] = []

    for item in artifact.get("messages") or []:
        if not isinstance(item, dict):
            continue

        role = item.get("role")

        if role not in (
            "bot",
            "assistant",
            "user",
            "caller",
            "customer",
        ):
            continue

        content = item.get("message") or item.get("content") or ""

        if not isinstance(content, str) or not content.strip():
            continue

        turns.append(
            VapiTurnItem(
                role=(
                    "user"
                    if role in ("user", "caller", "customer")
                    else "assistant"
                ),
                message=content,
                secondsFromStart=item.get("secondsFromStart"),
            )
        )

    return VapiWebhookPayload(
        providerCallId=str(call_id),
        startedAt=message.get("startedAt"),
        endedAt=message.get("endedAt"),
        turns=turns,
        extracted=extracted,
    )


def ingest_vapi_webhook(
    raw_payload: dict[str, Any],
    repo: ClinicRepository,
    settings: Settings,
) -> dict[str, str]:
    payload = _normalize_vapi_report(raw_payload)

    if payload is None:
        return {"status": "ignored"}

    slug = payload.clinicSlug or settings.demo_clinic_slug

    clinic = repo.get_clinic_by_slug(slug) or repo.get_clinic(
        settings.demo_clinic_id
    )

    if not clinic:
        raise AppError(
            "Target clinic not found for webhook.",
            404,
            "clinic_not_found",
        )

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
                "caller"
                if turn.role in ("user", "caller", "customer")
                else "assistant",
                turn.message,
                None,
                int(turn.secondsFromStart * 1000)
                if turn.secondsFromStart is not None
                else None,
            )
            for idx, turn in enumerate(payload.turns)
            if turn.message.strip()
        ]

        repo.upsert_turns(
            clinic.id,
            call.id,
            formatted_turns,
        )

    ext = payload.extracted

    # Determine the call outcome from the extracted information.
    if (
        ext.get("intent") == "appointment"
        and ext.get("bookingStatus") == "requested"
    ):
        outcome = "appointment_requested"
    elif ext.get("requiresHumanFollowup"):
        outcome = "followup_required"
    elif ext.get("intent") == "faq":
        outcome = "faq_answered"
    elif ext.get("intent") == "appointment":
        outcome = "incomplete"
    else:
        outcome = "no_action"

    finish_in = DemoCallFinishIn(
        provider="vapi",
        callMode="live",
        providerCallId=payload.providerCallId,
        startedAt=started,
        endedAt=ended,
        outcome=outcome,
        extraction=FinalExtractionIn(
            intent=ext.get("intent", "unknown"),
            reasonForVisit=ext.get("reasonForVisit"),
            patientName=ext.get("patientName"),
            patientNameConfirmed=bool(
                ext.get("patientNameConfirmed", False)
            ),
            phoneRaw=ext.get("phoneRaw"),
            phoneE164=ext.get("phoneE164"),
            phoneConfirmed=bool(
                ext.get("phoneConfirmed", False)
            ),
            preferredDateText=ext.get("preferredDateText"),
            preferredDoctor=ext.get("preferredDoctor"),
            bookingStatus=(
                "requested"
                if ext.get("bookingStatus") == "requested"
                else "none"
            ),
            requiresHumanFollowup=bool(
                ext.get("requiresHumanFollowup", False)
            ),
            followupReason=ext.get("followupReason") or None,
        ),
    )

    service = CallLifecycleService(repo)

    saved = service.complete_call(
        clinic_id=clinic.id,
        call_id=call.id,
        payload=finish_in,
    )

    return {
        "callId": saved.id,
        "status": saved.status,
    }
