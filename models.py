from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


IntentType = Literal[
    "general_chat",
    "ui_action",
    "academic_question",
    "explain_request",
    "quiz_request",
]

QuestionType = Literal[
    "multiple_choice",
    "true_false",
    "fill_blank",
    "matching",
    "direct_math",
    "definition",
    "compound",
    "general",
]


class SolveQuestionRequest(BaseModel):
    question: str = Field(min_length=1)
    grade: str | None = None
    subject: str | None = None
    term: str | None = None
    lesson: str | None = None
    trusted_domains: list[str] | None = None
    allow_web_verification: bool = True


class SourceTraceItem(BaseModel):
    source: str
    detail: str
    score: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AnswerCandidate(BaseModel):
    candidate: str
    book_support: float = 0.0
    web_support: float = 0.0
    source_reliability: float = 0.0
    question_type_fit: float = 0.0
    final_score: float = 0.0


class HiddenAnalysis(BaseModel):
    intent: IntentType
    question_type: str
    original_question: str
    normalized_question: str
    canonical_question: str
    concept_key: str
    confidence: float
    decision_basis: str
    analysis_budget_ms: int
    trusted_domains: list[str] = Field(default_factory=list)


class SolveQuestionResponse(BaseModel):
    answer: str
    explanation: str = ""
    display_text: str
    confidence: float
    matched_source: str
    source_trace: list[SourceTraceItem]
    answer_candidates: list[AnswerCandidate] = Field(default_factory=list)
    hidden_analysis: HiddenAnalysis


class SearchConfigResponse(BaseModel):
    trusted_domains: list[str]
    serpapi_enabled: bool
    serpapi_key_present: bool
    serpapi_max_results: int
    serpapi_timeout_seconds: int


class UpdateSearchConfigRequest(BaseModel):
    trusted_domains: list[str] = Field(default_factory=list)
    serpapi_max_results: int | None = Field(default=None, ge=1, le=10)
    serpapi_timeout_seconds: int | None = Field(default=None, ge=3, le=30)


class SearchLogEntry(BaseModel):
    question: str
    normalized_query: str
    canonical_question: str
    question_type: str
    subject: str
    trusted_domains: list[str]
    serpapi_results: list[dict[str, Any]]
    answer_candidates: list[dict[str, Any]]
    final_answer: str
    confidence: float
    source_trace: list[dict[str, Any]]
    decision_basis: str
    matched_source: str
    created_at: str

