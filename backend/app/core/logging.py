"""Structured logging with sensitive patient data redaction."""

import json
import logging
import re
from datetime import UTC, datetime
from typing import Any

PHONE_RE = re.compile(r"(\+?8801[3-9]\d{2})\d{4}(\d{2})|(\b01[3-9]\d)\d{4}(\d{2}\b)")


def redact_sensitive(text: str) -> str:
    """Mask Bangladeshi mobile numbers inside log strings."""

    def _mask(match: re.Match[str]) -> str:
        if match.group(1):
            return f"{match.group(1)}••••{match.group(2)}"
        return f"{match.group(3)}••••{match.group(4)}"

    return PHONE_RE.sub(_mask, text)


def mask_phone_display(e164: str | None, can_view_full: bool = False) -> str | None:
    if not e164:
        return None
    if can_view_full:
        if e164.startswith("+880") and len(e164) == 14:
            return f"+880 {e164[4:8]}-{e164[8:]}"
        return e164
    if e164.startswith("+880") and len(e164) == 14:
        return f"+880 {e164[4:6]}•• •••{e164[-3:]}"
    return "••••••••"


class StructuredJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": redact_sensitive(record.getMessage()),
        }
        for key in ("request_id", "clinic_id", "call_id", "event"):
            val = getattr(record, key, None)
            if val is not None:
                payload[key] = val
        return json.dumps(payload, ensure_ascii=False)


def get_logger(name: str = "bytevoice") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(StructuredJsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
