"""Bangla & English validation utilities for phone numbers, names, and dates/times.

Principles (Section 13 of Master Specification):
1. Phone numbers:
   - Accept Bangla digits (০-৯) and ASCII digits (0-9).
   - Support common Bangladeshi mobile formats (01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX, 008801XXXXXXXXX).
   - Validate before normalising to E.164 (+8801[3-9]XXXXXXXX).
   - Preserve original transcription where useful.
   - Never silently repair or guess uncertain digits.
2. Names:
   - Preserve Bangla Unicode accurately (NFC normalisation only, strip control chars).
   - Never aggressively transliterate or overwrite spelling.
3. Dates and times:
   - Support Bangla and English number representations.
   - Preserve the original spoken preference string.
   - Parse only when unambiguous in the clinic's timezone (default Asia/Dhaka).
   - Flag ambiguous relative dates or times (e.g., "কাল ৫টা" without সকাল/বিকাল) rather than guessing.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import UTC, date, datetime, time, timedelta, timezone, tzinfo
from typing import Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


def get_clinic_tz(timezone_name: str = "Asia/Dhaka") -> tzinfo:
    try:
        return ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError:
        if timezone_name == "Asia/Dhaka":
            return timezone(timedelta(hours=6), name="Asia/Dhaka")
        return UTC

BN_DIGITS = "০১২৩৪৫৬৭৮৯"
BN_TO_ASCII = str.maketrans(BN_DIGITS, "0123456789")

SEPARATOR_RE = re.compile(r"[\s\-.()]")
DIGITS_ONLY_RE = re.compile(r"^\+?\d+$")
BD_NATIONAL_RE = re.compile(r"^01[3-9]\d{8}$")
CONTROL_CHAR_RE = re.compile(r"[\x00-\x1f\x7f]")


def to_ascii_digits(value: str) -> str:
    """Convert Bangla numerals (০-৯) to ASCII numerals (0-9)."""
    return value.translate(BN_TO_ASCII)


@dataclass(frozen=True)
class PhoneValidationResult:
    ok: bool
    e164: str | None
    original: str
    reason: Literal[
        "valid",
        "empty",
        "invalid_characters",
        "invalid_length",
        "invalid_prefix",
    ]


def validate_bd_phone(raw: str | None) -> PhoneValidationResult:
    """Validate a Bangladeshi mobile number without guessing uncertain digits."""
    if raw is None:
        return PhoneValidationResult(False, None, "", "empty")
    original = raw
    trimmed = raw.strip()
    if not trimmed:
        return PhoneValidationResult(False, None, original, "empty")

    ascii_cleaned = SEPARATOR_RE.sub("", to_ascii_digits(trimmed))
    if not DIGITS_ONLY_RE.match(ascii_cleaned):
        return PhoneValidationResult(False, None, original, "invalid_characters")

    if ascii_cleaned.startswith("+880"):
        national = "0" + ascii_cleaned[4:]
    elif ascii_cleaned.startswith("00880"):
        national = "0" + ascii_cleaned[5:]
    elif ascii_cleaned.startswith("880"):
        national = "0" + ascii_cleaned[3:]
    elif ascii_cleaned.startswith("+"):
        return PhoneValidationResult(False, None, original, "invalid_prefix")
    else:
        national = ascii_cleaned

    if len(national) != 11:
        return PhoneValidationResult(False, None, original, "invalid_length")

    if not BD_NATIONAL_RE.match(national):
        return PhoneValidationResult(False, None, original, "invalid_prefix")

    return PhoneValidationResult(True, "+88" + national, original, "valid")


def sanitize_patient_name(raw: str | None) -> str | None:
    """Preserve Bangla and Latin Unicode accurately while normalising whitespace."""
    if raw is None:
        return None
    normalized = unicodedata.normalize("NFC", raw)
    cleaned = CONTROL_CHAR_RE.sub("", normalized).strip()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned or None


@dataclass(frozen=True)
class PreferenceParseResult:
    original: str
    preferred_date: date | None
    preferred_time: time | None
    preferred_datetime: datetime | None
    ambiguity: Literal[
        "missing_day",
        "missing_time",
        "ambiguous_time",
        "ambiguous_day",
    ] | None


DAY_PATTERNS: list[tuple[re.Pattern[str], int]] = [
    (re.compile(r"পরশু|day after tomorrow", re.I), 2),
    # Exclude সকাল (morning) and বিকাল (afternoon) when matching কাল
    (re.compile(r"আগামীকাল|আগামী কাল|tomorrow|(?<!স)(?<!বি)কাল", re.I), 1),
    (re.compile(r"আজকে|আজ|today|tonight", re.I), 0),
]

PART_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"সকাল|morning|\bam\b|a\.m\.", re.I), "morning"),
    (re.compile(r"দুপুর|noon", re.I), "noon"),
    (re.compile(r"বিকাল|বিকেল|afternoon", re.I), "afternoon"),
    (re.compile(r"সন্ধ্যা|evening", re.I), "evening"),
    (re.compile(r"রাত|night|\bpm\b|p\.m\.", re.I), "night"),
]

ISO_DATE_RE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
TIME_HM_RE = re.compile(r"(?<!\d)(\d{1,2})(?:[:.](\d{2}))?\s*(?:টা|টায়|টার|o'?clock|am|pm|a\.m\.|p\.m\.)?", re.I)


def parse_spoken_preference(
    raw: str | None,
    timezone_name: str = "Asia/Dhaka",
    reference_now: datetime | None = None,
) -> PreferenceParseResult | None:
    """Conservatively parse a spoken Bangla/English date & time preference.

    Never guesses when a 12-hour value lacks a part-of-day indicator or when
    the day reference is missing.
    """
    if raw is None or not raw.strip():
        return None

    original = raw.strip()
    tz = get_clinic_tz(timezone_name)
    now_local = (reference_now or datetime.now(tz)).astimezone(tz)
    ascii_text = to_ascii_digits(original)

    # 1. Resolve day
    parsed_date: date | None = None
    iso_match = ISO_DATE_RE.search(ascii_text)
    if iso_match:
        try:
            parsed_date = date(
                int(iso_match.group(1)),
                int(iso_match.group(2)),
                int(iso_match.group(3)),
            )
            ascii_for_time = ascii_text[: iso_match.start()] + ascii_text[iso_match.end() :]
        except ValueError:
            return PreferenceParseResult(original, None, None, None, "ambiguous_day")
    else:
        ascii_for_time = ascii_text
        for pattern, offset in DAY_PATTERNS:
            if pattern.search(ascii_text):
                parsed_date = (now_local + timedelta(days=offset)).date()
                break

    # 2. Resolve part of day and hour/minute
    part_of_day: str | None = None
    for pattern, part_name in PART_PATTERNS:
        if pattern.search(ascii_for_time):
            part_of_day = part_name
            break

    parsed_time: time | None = None
    ambiguity: Literal[
        "missing_day",
        "missing_time",
        "ambiguous_time",
        "ambiguous_day",
    ] | None = None

    hm_match = TIME_HM_RE.search(ascii_for_time)
    if hm_match:
        hour = int(hm_match.group(1))
        minute = int(hm_match.group(2)) if hm_match.group(2) else 0
        if hour > 23 or minute > 59 or hour == 0 and part_of_day is not None:
            ambiguity = "ambiguous_time"
        elif hour >= 13 or hour == 0:
            parsed_time = time(hour, minute)
        elif part_of_day is not None:
            hour_24 = _to_24_hour(hour, part_of_day)
            parsed_time = time(hour_24, minute)
        else:
            # e.g. "আগামীকাল ৫টা" without সকাল or বিকাল — do not guess!
            ambiguity = "ambiguous_time"
    else:
        ambiguity = "missing_time"

    if parsed_date is None:
        ambiguity = ambiguity or "missing_day"

    combined_dt: datetime | None = None
    if parsed_date is not None and parsed_time is not None and ambiguity is None:
        combined_dt = datetime.combine(parsed_date, parsed_time, tzinfo=tz)

    return PreferenceParseResult(
        original=original,
        preferred_date=parsed_date,
        preferred_time=parsed_time,
        preferred_datetime=combined_dt,
        ambiguity=ambiguity,
    )


def _to_24_hour(hour: int, part: str) -> int:
    if part == "morning":
        return 0 if hour == 12 else hour
    if part == "noon":
        return hour if hour >= 11 else hour + 12
    # afternoon, evening, night
    return 12 if hour == 12 else (hour + 12) % 24
