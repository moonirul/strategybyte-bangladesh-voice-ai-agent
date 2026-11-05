
"""Authentication, clinic-scoped authorisation, and demo-call token verification."""

from __future__ import annotations

import hashlib
import hmac
import logging
from functools import lru_cache

import jwt
from fastapi import Depends, Header

from app.core.config import Settings, get_settings
from app.core.errors import AppError
from app.repositories.base import ClinicRepository, ProfileRecord
from app.repositories.memory_repo import InMemoryClinicRepository
from app.repositories.supabase_repo import SupabaseClinicRepository


logger = logging.getLogger(__name__)


@lru_cache
def get_repository() -> ClinicRepository:
    settings = get_settings()

    if settings.use_supabase_storage:
        return SupabaseClinicRepository(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    return InMemoryClinicRepository(seed=True)


def issue_demo_call_token(
    call_id: str,
    settings: Settings | None = None,
) -> str:
    cfg = settings or get_settings()

    return hmac.new(
        cfg.demo_call_token_secret.encode("utf-8"),
        call_id.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_demo_call_token(
    call_id: str,
    x_demo_call_token: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> None:
    if not x_demo_call_token:
        raise AppError(
            "Missing X-Demo-Call-Token header.",
            401,
            "missing_demo_call_token",
        )

    expected = issue_demo_call_token(call_id, settings)

    if not hmac.compare_digest(expected, x_demo_call_token):
        raise AppError(
            "Invalid X-Demo-Call-Token header.",
            403,
            "invalid_demo_call_token",
        )


def get_current_profile(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    repo: ClinicRepository = Depends(get_repository),
) -> ProfileRecord:
    """Verify Bearer JWT and resolve the staff member's clinic profile."""

    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError(
            "Authentication required.",
            401,
            "unauthenticated",
        )

    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise AppError(
            "Authentication token is empty.",
            401,
            "unauthenticated",
        )

    user_id = _verify_jwt_and_extract_sub(token, settings, repo)

    # Temporary debugging: never log the JWT or any secret.
    logger.warning(
        "AUTH DEBUG user_id=%s repo=%s",
        user_id,
        type(repo).__name__,
    )

    profile = repo.get_profile(user_id)

    logger.warning(
        "AUTH DEBUG profile_found=%s",
        profile is not None,
    )

    if not profile:
        raise AppError(
            "Authenticated user is not linked to any clinic profile.",
            403,
            "profile_not_found",
        )

    return profile


def _verify_jwt_and_extract_sub(
    token: str,
    settings: Settings,
    repo: ClinicRepository,
) -> str:
    """Verify Supabase JWT and return its user ID (sub claim)."""

    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")

        # Legacy Supabase HS256 signing.
        if algorithm == "HS256":
            if not settings.supabase_jwt_secret:
                raise AppError(
                    "Supabase JWT secret is not configured for HS256.",
                    500,
                    "jwt_configuration_error",
                )

            signing_key = settings.supabase_jwt_secret

        # Asymmetric Supabase signing using JWKS.
        elif algorithm in ("ES256", "RS256"):
            jwks_url = (
                f"{settings.supabase_url.rstrip('/')}"
                "/auth/v1/.well-known/jwks.json"
            )

            jwks_client = jwt.PyJWKClient(jwks_url)

            signing_key = (
                jwks_client
                .get_signing_key_from_jwt(token)
                .key
            )

        else:
            raise AppError(
                "Unsupported JWT signing algorithm.",
                401,
                "invalid_token",
            )

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=[algorithm],
            options={"verify_aud": False},
            leeway=60,
        )

        user_id = payload.get("sub")

        if not user_id or not isinstance(user_id, str):
            raise AppError(
                "Token missing subject claim.",
                401,
                "invalid_token",
            )

        return user_id

    except AppError:
        raise

    except Exception as exc:
        logger.exception("JWT verification failed")

        raise AppError(
            "Invalid or expired authentication token.",
            401,
            "invalid_token",
        ) from exc
