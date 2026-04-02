from __future__ import annotations

from fastapi import FastAPI

from app.admin_config import load_search_config, save_search_config
from app.config import get_settings
from app.engines import solve_question
from app.log_store import list_search_logs
from app.models import (
    SearchConfigResponse,
    SolveQuestionRequest,
    SolveQuestionResponse,
    UpdateSearchConfigRequest,
)


settings = get_settings()
app = FastAPI(title=settings.app_name)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/admin/search-config", response_model=SearchConfigResponse)
def get_search_config() -> SearchConfigResponse:
    return load_search_config(settings)


@app.put("/api/admin/search-config", response_model=SearchConfigResponse)
def update_search_config(payload: UpdateSearchConfigRequest) -> SearchConfigResponse:
    return save_search_config(settings, payload)


@app.get("/api/admin/search-logs")
def get_search_logs(limit: int = 20) -> dict[str, list[dict]]:
    items = [entry.model_dump() for entry in list_search_logs(settings, limit=limit)]
    return {"items": items}


@app.post("/api/solve-question", response_model=SolveQuestionResponse)
def solve_question_endpoint(payload: SolveQuestionRequest) -> SolveQuestionResponse:
    return solve_question(payload, settings)

