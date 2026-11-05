"""FastAPI application entrypoint with CORS, request tracing, and OpenAPI metadata."""

from __future__ import annotations

import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.portal import router as api_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="ByteVoice Bangladesh API",
        description=(
            "FastAPI backend for ByteVoice Bangladesh clinical voice receptionist "
            "and Dhaka Dental Care staff portal."
        ),
        version=settings.app_version,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-Id"],
    )

    @app.middleware("http")
    async def attach_request_id(request: Request, call_next) -> Response:
        req_id = request.headers.get("X-Request-Id") or f"req_{uuid.uuid4().hex[:12]}"
        request.state.request_id = req_id
        response: Response = await call_next(request)
        response.headers["X-Request-Id"] = req_id
        return response

    register_exception_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
