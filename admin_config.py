from __future__ import annotations

import json

try:
    from .config import Settings
    from .models import SearchConfigResponse, UpdateSearchConfigRequest
except ImportError:  # pragma: no cover - runtime fallback when running as a flat module
    from config import Settings
    from models import SearchConfigResponse, UpdateSearchConfigRequest


def _default_payload(settings: Settings) -> dict:
    return {
        "trusted_domains": settings.trusted_search_domains,
        "serpapi_max_results": settings.serpapi_max_results,
        "serpapi_timeout_seconds": settings.serpapi_timeout_seconds,
    }


def load_search_config(settings: Settings) -> SearchConfigResponse:
    payload = _default_payload(settings)
    if settings.search_config_path.exists():
        try:
            payload.update(json.loads(settings.search_config_path.read_text(encoding="utf-8")))
        except json.JSONDecodeError:
            pass

    merged_domains = [
        domain.strip()
        for domain in [
            *(payload.get("trusted_domains", []) or []),
            *settings.trusted_search_domains,
        ]
        if str(domain or "").strip()
    ]
    payload["trusted_domains"] = list(dict.fromkeys(merged_domains))

    return SearchConfigResponse(
        trusted_domains=[domain.strip() for domain in payload.get("trusted_domains", []) if domain.strip()],
        serpapi_enabled=bool(settings.serpapi_api_key),
        serpapi_key_present=bool(settings.serpapi_api_key),
        serpapi_max_results=int(payload.get("serpapi_max_results", settings.serpapi_max_results)),
        serpapi_timeout_seconds=int(payload.get("serpapi_timeout_seconds", settings.serpapi_timeout_seconds)),
    )


def save_search_config(settings: Settings, update: UpdateSearchConfigRequest) -> SearchConfigResponse:
    current = load_search_config(settings)
    payload = current.model_dump()
    payload.pop("serpapi_enabled", None)
    payload.pop("serpapi_key_present", None)

    if update.trusted_domains:
        payload["trusted_domains"] = [domain.strip() for domain in update.trusted_domains if domain.strip()]
    if update.serpapi_max_results is not None:
        payload["serpapi_max_results"] = update.serpapi_max_results
    if update.serpapi_timeout_seconds is not None:
        payload["serpapi_timeout_seconds"] = update.serpapi_timeout_seconds

    settings.search_config_path.parent.mkdir(parents=True, exist_ok=True)
    settings.search_config_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return load_search_config(settings)


def resolve_trusted_domains(settings: Settings, request_domains: list[str] | None = None) -> list[str]:
    current = load_search_config(settings)
    if request_domains:
        requested = [domain.strip() for domain in request_domains if domain.strip()]
        if requested:
            allowed = [domain for domain in requested if domain in current.trusted_domains]
            merged = list(dict.fromkeys([*allowed, *current.trusted_domains]))
            return merged or current.trusted_domains
    return current.trusted_domains
