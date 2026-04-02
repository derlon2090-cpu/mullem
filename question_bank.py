from __future__ import annotations

import json
import re
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from .config import Settings, get_settings


ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
STOPWORDS = {
    "ما",
    "ماذا",
    "كم",
    "هو",
    "هي",
    "في",
    "من",
    "على",
    "الى",
    "إلى",
    "عن",
    "the",
    "a",
    "an",
    "is",
    "are",
    "of",
    "to",
}


def normalize_text(text: str) -> str:
    normalized = str(text or "").translate(ARABIC_DIGITS)
    normalized = normalized.replace("×", "*").replace("x", "*").replace("X", "*")
    normalized = normalized.replace("÷", "/")
    normalized = re.sub(r"[؟?!.,،؛:\"'`()\[\]{}]", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip().lower()
    return normalized


def keyword_signature(text: str, limit: int = 8) -> list[str]:
    return [
        token
        for token in normalize_text(text).split()
        if len(token) > 1 and token not in STOPWORDS
    ][:limit]


def canonical_question(text: str, subject: str = "", question_type: str = "") -> str:
    normalized = normalize_text(text)
    for token in ("صواب", "خطأ", "صح", "true", "false", "____", "______"):
        normalized = normalized.replace(token, " ")
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return f"{subject or 'general'}::{question_type or 'general'}::{normalized}".strip(":")


def concept_key(text: str, subject: str = "", question_type: str = "") -> str:
    tokens = keyword_signature(text, limit=6)
    return f"{subject or 'general'}::{question_type or 'general'}::{'|'.join(tokens)}"


def similarity(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    return SequenceMatcher(None, normalize_text(left), normalize_text(right)).ratio()


def token_overlap(left: str, right: str) -> int:
    left_tokens = set(keyword_signature(left))
    right_tokens = set(keyword_signature(right))
    return len(left_tokens.intersection(right_tokens))


def _load_json_file(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []


def load_question_bank(settings: Settings | None = None) -> list[dict[str, Any]]:
    settings = settings or get_settings()
    return _load_json_file(settings.question_bank_sample_path) + _load_json_file(settings.question_bank_runtime_path)


def search_approved_question_bank(
    question: str,
    grade: str = "",
    subject: str = "",
    term: str = "",
    question_type: str = "",
    settings: Settings | None = None,
) -> dict[str, Any] | None:
    entries = load_question_bank(settings)
    if not entries:
        return None

    normalized_query = normalize_text(question)
    canonical_query = canonical_question(question, subject, question_type)
    concept_query = concept_key(question, subject, question_type)

    ranked: list[dict[str, Any]] = []
    for entry in entries:
        if not entry.get("approved", False):
            continue

        entry_subject = entry.get("subject", "")
        entry_grade = entry.get("grade", "")
        entry_term = entry.get("term", "")
        entry_question_type = entry.get("question_type", "")

        exact = 1.0 if normalize_text(entry.get("question", "")) == normalized_query else 0.0
        normalized_match = 1.0 if entry.get("normalized_question", "") == normalized_query else 0.0
        canonical_match = 1.0 if entry.get("canonical_question", "") == canonical_query else 0.0
        concept_match = 1.0 if entry.get("concept_key", "") == concept_query else 0.0
        fuzzy = similarity(question, entry.get("question", ""))
        overlap = min(1.0, token_overlap(question, entry.get("question", "")) / max(1, len(keyword_signature(question, 5))))

        likes = int(entry.get("likes", 0))
        dislikes = int(entry.get("dislikes", 0))
        approval_score = 1.0 if likes >= dislikes else 0.55
        grade_score = 1.0 if not grade or grade == entry_grade or entry_grade in {"", "unknown"} else 0.55
        subject_score = 1.0 if not subject or subject == entry_subject or entry_subject in {"", "عام"} else 0.4
        term_score = 1.0 if not term or term == entry_term or entry_term in {"", "unknown"} else 0.6
        type_score = 1.0 if not question_type or question_type == entry_question_type else 0.5

        score = (
            exact * 0.24
            + normalized_match * 0.18
            + canonical_match * 0.16
            + concept_match * 0.1
            + fuzzy * 0.12
            + overlap * 0.08
            + approval_score * 0.05
            + grade_score * 0.03
            + subject_score * 0.02
            + term_score * 0.01
            + type_score * 0.01
        )

        match_level = "exact"
        if not exact and normalized_match:
            match_level = "normalized"
        elif not normalized_match and canonical_match:
            match_level = "canonical"
        elif not canonical_match and concept_match:
            match_level = "concept"
        elif not concept_match:
            match_level = "fuzzy"

        ranked.append({**entry, "score": round(score, 4), "match_level": match_level})

    ranked.sort(key=lambda item: item["score"], reverse=True)
    if not ranked:
        return None

    best = ranked[0]
    if best["score"] < 0.74:
        return None
    return best


def save_learned_answer(
    *,
    question: str,
    question_type: str,
    subject: str,
    grade: str,
    term: str,
    answer: str,
    explanation: str,
    source: str,
    confidence: float,
    approved: bool,
    settings: Settings | None = None,
) -> dict[str, Any]:
    settings = settings or get_settings()
    runtime_entries = _load_json_file(settings.question_bank_runtime_path)

    normalized_question = normalize_text(question)
    canonical = canonical_question(question, subject, question_type)
    concept = concept_key(question, subject, question_type)

    existing = next(
        (
            entry
            for entry in runtime_entries
            if entry.get("normalized_question") == normalized_question
            or entry.get("canonical_question") == canonical
        ),
        None,
    )

    base_entry = {
        "question": question,
        "normalized_question": normalized_question,
        "canonical_question": canonical,
        "concept_key": concept,
        "question_type": question_type,
        "subject": subject or "عام",
        "grade": grade or "unknown",
        "term": term or "unknown",
        "answer": answer,
        "explanation": explanation,
        "source": source,
        "likes": 0,
        "dislikes": 0,
        "approved": approved,
        "confidence": round(confidence, 4),
        "usage_count": 1,
    }

    if existing:
        existing.update(base_entry)
        existing["usage_count"] = int(existing.get("usage_count", 0)) + 1
    else:
        runtime_entries.append(base_entry)

    settings.question_bank_runtime_path.parent.mkdir(parents=True, exist_ok=True)
    settings.question_bank_runtime_path.write_text(
        json.dumps(runtime_entries, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return base_entry

