from __future__ import annotations

from functools import lru_cache
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

from .config import Settings


TRUSTED_DOMAIN_WEIGHTS = {
    "ien.edu.sa": 1.0,
    "beitalelm.com": 0.78,
    "mawdoo3.com": 0.68,
}


def _domain_queries(question: str, domains: list[str]) -> list[str]:
    if not domains:
        return [question]
    return [f'site:{domain} "{question}"' for domain in domains[:4]]


def _domain_weight(link: str) -> float:
    domain = urlparse(link).netloc.lower().replace("www.", "")
    for trusted_domain, weight in TRUSTED_DOMAIN_WEIGHTS.items():
        if domain.endswith(trusted_domain):
            return weight
    return 0.45


@lru_cache(maxsize=128)
def _cached_search(
    api_key: str,
    base_url: str,
    timeout_seconds: int,
    query: str,
    num_results: int,
) -> list[dict]:
    response = requests.get(
        base_url,
        params={
            "engine": "google",
            "q": query,
            "api_key": api_key,
            "num": num_results,
            "no_cache": "false",
            "output": "json",
        },
        timeout=timeout_seconds,
    )
    response.raise_for_status()
    payload = response.json()
    results = payload.get("organic_results", [])
    return [
        {
            "title": item.get("title", ""),
            "link": item.get("link", ""),
            "snippet": item.get("snippet", ""),
            "position": item.get("position", 0),
        }
        for item in results
    ]


def fetch_page_text(url: str, timeout_seconds: int) -> str:
    try:
        response = requests.get(
            url,
            timeout=timeout_seconds,
            headers={"User-Agent": "MullemBot/1.0 (+https://mullem.local)"},
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        text = " ".join(soup.get_text(" ", strip=True).split())
        return text[:2500]
    except Exception:
        return ""


class SerpApiClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def search(self, question: str, domains: list[str] | None = None) -> list[dict]:
        if not self.settings.serpapi_api_key:
            return []

        trusted_domains = domains or self.settings.trusted_search_domains
        queries = _domain_queries(question, trusted_domains)
        merged: list[dict] = []
        for query in queries:
            merged.extend(
                _cached_search(
                    self.settings.serpapi_api_key,
                    self.settings.serpapi_base_url,
                    self.settings.serpapi_timeout_seconds,
                    query,
                    self.settings.serpapi_max_results,
                )
            )

        seen_links: set[str] = set()
        deduped: list[dict] = []
        for item in merged:
            link = item.get("link", "")
            if not link or link in seen_links:
                continue
            parsed_domain = urlparse(link).netloc.lower().replace("www.", "")
            if trusted_domains and not any(parsed_domain.endswith(domain) for domain in trusted_domains):
                continue
            seen_links.add(link)
            deduped.append(
                {
                    **item,
                    "domain": parsed_domain,
                    "reliability": _domain_weight(link),
                }
            )

        limited = deduped[: self.settings.serpapi_max_results]
        for item in limited:
            item["page_text"] = fetch_page_text(item["link"], self.settings.serpapi_timeout_seconds)
        return limited

