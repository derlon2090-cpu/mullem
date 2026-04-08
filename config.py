from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"


def _split_csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    items = [item.strip() for item in value.split(",")]
    cleaned = [item for item in items if item]
    return cleaned or default


class Settings(BaseModel):
    app_name: str = "Mullem Educational AI Engine"
    serpapi_api_key: str | None = None
    serpapi_base_url: str = "https://serpapi.com/search.json"
    serpapi_timeout_seconds: int = 8
    serpapi_max_results: int = 5
    trusted_search_domains: list[str] = Field(
        default_factory=lambda: [
            "ien.edu.sa",
            "beitalelm.com",
            "mawdoo3.com",
            "wikipedia.org",
            "britannica.com",
            "khanacademy.org",
            "who.int",
            "cdc.gov",
            "mayo.edu",
        ]
    )
    analysis_budget_ms: int = 5000
    question_bank_sample_path: Path = DATA_DIR / "question_bank.sample.json"
    question_bank_runtime_path: Path = DATA_DIR / "question_bank.runtime.json"
    search_config_path: Path = DATA_DIR / "search_config.json"
    search_log_path: Path = DATA_DIR / "search_logs.jsonl"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        serpapi_api_key=os.getenv("SERPAPI_API_KEY") or None,
        serpapi_base_url=os.getenv("SERPAPI_BASE_URL", "https://serpapi.com/search.json"),
        serpapi_timeout_seconds=int(os.getenv("SERPAPI_TIMEOUT_SECONDS", "8")),
        serpapi_max_results=int(os.getenv("SERPAPI_MAX_RESULTS", "5")),
        trusted_search_domains=_split_csv(
            os.getenv("TRUSTED_SEARCH_DOMAINS"),
            [
                "ien.edu.sa",
                "beitalelm.com",
                "mawdoo3.com",
                "wikipedia.org",
                "britannica.com",
                "khanacademy.org",
                "who.int",
                "cdc.gov",
                "mayo.edu",
            ],
        ),
        analysis_budget_ms=int(os.getenv("ANALYSIS_BUDGET_MS", "5000")),
    )
