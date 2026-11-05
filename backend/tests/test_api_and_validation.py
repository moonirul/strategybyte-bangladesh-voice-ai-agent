"""Automated backend test suite for ByteVoice Bangladesh.

Covers:
1. Health check endpoint
2. Bangla phone digit validation & E.164 normalisation (normal, Bangla digits, malformed)
3. Bangla Unicode name preservation
4. Spoken date/time preference parsing & ambiguity detection (no silent guessing)
5. Full demo-call lifecycle persistence (initiate -> turns -> finish -> portal retrieval)
6. Idempotency for duplicate provider_call_id and duplicate transcript sequence numbers
7. Authentication enforcement (401 on missing/invalid JWT)
8. Clinic-level authorisation isolation (cross-clinic access denied)
9. Appointment confirmation guard (cannot confirm without scheduledStart)
"""

from __future__ import annotations

from datetime import datetime

import jwt
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.validation import (
    get_clinic_tz,
    parse_spoken_preference,
    sanitize_patient_name,
    validate_bd_phone,
)
from app.dependencies.auth import get_repository
from app.main import create_app
from app.repositories.memory_repo import (
    DEMO_CLINIC_ID,
    InMemoryClinicRepository,
)


@pytest.fixture()
def repo() -> InMemoryClinicRepository:
    return InMemoryClinicRepository(seed=True)


@pytest.fixture()
def client(repo: InMemoryClinicRepository) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_repository] = lambda: repo
    return TestClient(app)


def _make_auth_header(user_id: str = "staff-demo-admin") -> dict[str, str]:
    settings = get_settings()
    secret = settings.supabase_jwt_secret or settings.demo_call_token_secret
    token = jwt.encode({"sub": user_id}, secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


# ---- 1. Health & Auth ----


def test_health_check_succeeds(client: TestClient) -> None:
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"


def test_unauthenticated_requests_are_rejected(client: TestClient) -> None:
    for path in (
        "/api/me",
        "/api/dashboard/summary",
        "/api/calls",
        "/api/patients",
        "/api/appointments",
        "/api/follow-ups",
    ):
        res = client.get(path)
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "unauthenticated"


# ---- 2. Bangla Validation Utilities ----


@pytest.mark.parametrize(
    "raw,expected_e164",
    [
        ("০১৭১২৩৪৫৬৭৮", "+8801712345678"),
        ("০১৮১২-৩৪৫৬৭৮", "+8801812345678"),
        ("01712345678", "+8801712345678"),
        ("+880 1912-345678", "+8801912345678"),
        ("8801512345678", "+8801512345678"),
        ("008801612345678", "+8801612345678"),
    ],
)
def test_bangla_and_english_valid_phone_numbers(
    raw: str, expected_e164: str
) -> None:
    res = validate_bd_phone(raw)
    assert res.ok is True
    assert res.e164 == expected_e164
    assert res.original == raw


@pytest.mark.parametrize(
    "raw,expected_reason",
    [
        ("", "empty"),
        ("   ", "empty"),
        ("০১৭১২৩৪", "invalid_length"),  # too short — must not guess digits
        ("01112345678", "invalid_prefix"),  # 011 is not a valid BD mobile operator
        ("+14155552671", "invalid_prefix"),
        ("০১৭১২৩৪৫abc", "invalid_characters"),
    ],
)
def test_invalid_phone_numbers_are_rejected_without_guessing(
    raw: str, expected_reason: str
) -> None:
    res = validate_bd_phone(raw)
    assert res.ok is False
    assert res.e164 is None
    assert res.reason == expected_reason


def test_bangla_unicode_name_preserved() -> None:
    name = "  ডা. ফারজানা   হক  "
    assert sanitize_patient_name(name) == "ডা. ফারজানা হক"
    assert sanitize_patient_name("রহিম উদ্দিন") == "রহিম উদ্দিন"


def test_spoken_date_time_parsing_and_ambiguity() -> None:
    ref = datetime(2026, 11, 4, 10, 0, tzinfo=get_clinic_tz("Asia/Dhaka"))

    # Unambiguous Bangla relative date + part-of-day + Bangla digits
    clear = parse_spoken_preference(
        "আগামীকাল বিকাল ৫টায়", "Asia/Dhaka", reference_now=ref
    )
    assert clear is not None
    assert clear.ambiguity is None
    assert clear.preferred_date is not None
    assert clear.preferred_date.isoformat() == "2026-11-05"
    assert clear.preferred_time is not None
    assert clear.preferred_time.strftime("%H:%M") == "17:00"

    # Ambiguous time ("কাল ৫টা" without সকাল or বিকাল) must NOT be silently guessed
    ambiguous = parse_spoken_preference(
        "কাল ৫টা", "Asia/Dhaka", reference_now=ref
    )
    assert ambiguous is not None
    assert ambiguous.ambiguity == "ambiguous_time"
    assert ambiguous.preferred_datetime is None

    # Missing day ("বিকাল ৫টা" without a day) must be flagged as missing_day
    no_day = parse_spoken_preference(
        "বিকাল ৫টা", "Asia/Dhaka", reference_now=ref
    )
    assert no_day is not None
    assert no_day.ambiguity == "missing_day"
    assert no_day.preferred_datetime is None


# ---- 3. Call Lifecycle, Idempotency & Persistence ----


def test_end_to_end_demo_call_lifecycle_and_idempotency(
    client: TestClient,
) -> None:
    # Step 1: Initiate demo call
    create_payload = {
        "providerCallId": "demo_e2e_test_001",
        "startedAt": "2026-11-04T14:00:00+06:00",
    }
    r1 = client.post("/api/demo-calls", json=create_payload)
    assert r1.status_code == 201
    call_id = r1.json()["callId"]
    call_token = r1.json()["callToken"]

    # Duplicate initiation with same providerCallId is idempotent
    r1_dup = client.post("/api/demo-calls", json=create_payload)
    assert r1_dup.status_code == 201
    assert r1_dup.json()["callId"] == call_id

    # Step 2: Append turns (including duplicate sequence_number to verify idempotency)
    headers = {"X-Demo-Call-Token": call_token}
    turns_payload = {
        "turns": [
            {
                "sequenceNumber": 0,
                "speaker": "assistant",
                "text": "আসসালামু আলাইকুম, কীভাবে সাহায্য করতে পারি?",
                "timestampMs": 0,
            },
            {
                "sequenceNumber": 1,
                "speaker": "caller",
                "text": "আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই",
                "timestampMs": 4200,
            },
        ]
    }
    r_turns = client.post(
        f"/api/demo-calls/{call_id}/turns", json=turns_payload, headers=headers
    )
    assert r_turns.status_code == 200
    assert r_turns.json()["accepted"] == 2

    # Replay same turns -> must not duplicate turns
    client.post(
        f"/api/demo-calls/{call_id}/turns", json=turns_payload, headers=headers
    )

    # Step 3: Finish call with Bangla name, Bangla phone digits, and ambiguous time ("কাল ৫টা")
    finish_payload = {
        "provider": "demo",
        "callMode": "demo",
        "providerCallId": "demo_e2e_test_001",
        "startedAt": "2026-11-04T14:00:00+06:00",
        "endedAt": "2026-11-04T14:00:52+06:00",
        "outcome": "appointment_requested",
        "extraction": {
            "intent": "appointment",
            "reasonForVisit": "দাঁত পরিষ্কার করাতে চাই",
            "patientName": "নুসরাত জাহান",
            "patientNameConfirmed": True,
            "phoneRaw": "০১৮১২৩৪৫৬৭৮",
            "phoneE164": None,
            "phoneConfirmed": True,
            "preferredDateText": "কাল ৫টা",
            "preferredDoctor": "Dr. Farzana Haque",
            "bookingStatus": "requested",
            "requiresHumanFollowup": False,
            "followupReason": None,
        },
    }
    r_fin = client.post(
        f"/api/demo-calls/{call_id}/finish", json=finish_payload, headers=headers
    )
    assert r_fin.status_code == 200

    # Step 4: Staff inspects the persisted call in the portal
    staff_headers = _make_auth_header("staff-demo-admin")
    r_detail = client.get(f"/api/calls/{call_id}", headers=staff_headers)
    assert r_detail.status_code == 200
    detail = r_detail.json()

    assert detail["callMode"] == "demo"
    assert detail["status"] == "completed"
    assert detail["durationSeconds"] == 52
    assert detail["patient"]["fullName"] == "নুসরাত জাহান"
    assert detail["patientPhone"] == "+8801812345678"
    assert len(detail["transcript"]) == 2
    assert detail["bookingStatus"] == "requested"  # Unconfirmed!
    assert detail["appointment"]["status"] == "requested"
    # Because "কাল ৫টা" is ambiguous, parsed date/time are null and follow-up is automatically created
    assert detail["extraction"]["preferredDateText"] == "কাল ৫টা"
    assert detail["extraction"]["preferredTime"] is None
    assert detail["requiresFollowup"] is True
    assert detail["followUp"]["status"] == "open"


# ---- 4. Cross-Clinic Isolation & Scheduling Safeguards ----


def test_cross_clinic_access_is_denied(
    client: TestClient, repo: InMemoryClinicRepository
) -> None:
    # Seeded call belongs to DEMO_CLINIC_ID
    demo_calls = repo.list_calls(DEMO_CLINIC_ID)
    assert len(demo_calls) >= 1
    target_call_id = demo_calls[0].id

    # Authenticate as a staff member belonging to OTHER_CLINIC_ID
    other_clinic_headers = _make_auth_header("staff-other-clinic")
    res_list = client.get("/api/calls", headers=other_clinic_headers)
    assert res_list.status_code == 200
    assert res_list.json()["total"] == 0

    res_detail = client.get(
        f"/api/calls/{target_call_id}", headers=other_clinic_headers
    )
    assert res_detail.status_code == 404


def test_appointment_confirmation_requires_scheduled_start(
    client: TestClient, repo: InMemoryClinicRepository
) -> None:
    staff_headers = _make_auth_header("staff-demo-admin")
    appts = repo.list_appointments(DEMO_CLINIC_ID)
    assert len(appts) >= 1
    appt_id = appts[0].id

    # Attempting to confirm without scheduledStart is rejected with 422
    bad_res = client.patch(
        f"/api/appointments/{appt_id}",
        json={"status": "confirmed"},
        headers=staff_headers,
    )
    assert bad_res.status_code == 422

    # Supplying scheduledStart succeeds and generates a booking reference
    ok_res = client.patch(
        f"/api/appointments/{appt_id}",
        json={
            "status": "confirmed",
            "scheduledStart": "2026-11-05T17:00:00+06:00",
        },
        headers=staff_headers,
    )
    assert ok_res.status_code == 200
    assert ok_res.json()["status"] == "confirmed"
    assert ok_res.json()["bookingReference"].startswith("DDC-")
