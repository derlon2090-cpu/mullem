from __future__ import annotations

import json
from datetime import datetime, timezone

from .config import Settings
from .models import SearchLogEntry


def append_search_log(settings: Settings, entry: SearchLogEntry) -> None:
    settings.search_log_path.parent.mkdir(parents=True, exist_ok=True)
    with settings.search_log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry.model_dump(), ensure_ascii=False))
        handle.write("\n")


def list_search_logs(settings: Settings, limit: int = 20) -> list[SearchLogEntry]:
    if not settings.search_log_path.exists():
        return []

    rows: list[SearchLogEntry] = []
    for raw in reversed(settings.search_log_path.read_text(encoding="utf-8").splitlines()):
        if not raw.strip():
            continue
        try:
            rows.append(SearchLogEntry.model_validate_json(raw))
        except Exception:
            continue
        if len(rows) >= limit:
            break
    return rows


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
