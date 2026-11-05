"""Centralised backend configuration via pydantic-settings."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["development", "test", "production"] = "development"
    app_version: str = "0.1.0"

    cors_origins: str = "http://localhost:3000"
    demo_clinic_slug: str = "dhaka-dental-care"
    demo_clinic_id: str = "11111111-1111-4111-8111-111111111111"

    storage_backend: Literal["supabase", "memory"] = "memory"

    supabase_url: str = ""
    supabase_publishable_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    demo_call_token_secret: str = Field(
        default="bytevoice-dev-demo-call-secret-32chars"
    )
    vapi_webhook_secret: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def use_supabase_storage(self) -> bool:
        return (
            self.storage_backend == "supabase"
            and bool(self.supabase_url)
            and bool(self.supabase_service_role_key)
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
