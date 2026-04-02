from __future__ import annotations

import re
from statistics import mean
from typing import Any

try:
    from .admin_config import resolve_trusted_domains
    from .config import Settings
    from .curriculum import retrieve_curriculum_evidence
    from .log_store import append_search_log, utc_now_iso
    from .models import (
        AnswerCandidate,
        HiddenAnalysis,
        SearchLogEntry,
        SolveQuestionRequest,
        SolveQuestionResponse,
        SourceTraceItem,
    )
    from .question_bank import (
        canonical_question,
        concept_key,
        keyword_signature,
        normalize_text,
        save_learned_answer,
        search_approved_question_bank,
    )
    from .serpapi_service import SerpApiClient
except ImportError:  # pragma: no cover - runtime fallback when running as a flat module
    from admin_config import resolve_trusted_domains
    from config import Settings
    from curriculum import retrieve_curriculum_evidence
    from log_store import append_search_log, utc_now_iso
    from models import (
        AnswerCandidate,
        HiddenAnalysis,
        SearchLogEntry,
        SolveQuestionRequest,
        SolveQuestionResponse,
        SourceTraceItem,
    )
    from question_bank import (
        canonical_question,
        concept_key,
        keyword_signature,
        normalize_text,
        save_learned_answer,
        search_approved_question_bank,
    )
    from serpapi_service import SerpApiClient


GENERAL_CHAT_PATTERNS = {
    "هلا",
    "كيف الحال",
    "شكرا",
    "شكرًا",
    "تسلم",
    "من انت",
    "من أنت",
    "مرحبا",
    "السلام عليكم",
    "كيفك",
    "وش اسمك",
}
UI_ACTION_PATTERNS = {"نعم", "لا", "أكمل", "اكمل", "ابدأ", "اختيار المادة", "استمر", "كمل"}
EXPLAIN_PATTERNS = ("اشرح", "لخص", "وضح", "بسط", "فسر")
QUIZ_PATTERNS = ("اختبرني", "اعطني اسئلة", "أعطني أسئلة", "اعطني اختبار", "أعطني اختبار")


def has_choices(text: str) -> bool:
    parts = [item.strip() for item in str(text or "").split("-") if item.strip()]
    return len(parts) >= 3


def is_direct_math_expression(text: str) -> bool:
    candidate = re.sub(r"\s+", "", text or "").replace("×", "*").replace("x", "*").replace("X", "*")
    return bool(re.fullmatch(r"[0-9٠-٩]+([*/+\-])[0-9٠-٩]+=?[؟?]?", candidate))


def split_question_blocks(text: str) -> list[str]:
    lines = [line.strip() for line in str(text or "").splitlines() if line.strip()]
    if not lines:
        return []

    blocks: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        starts_new_block = bool(
            re.search(
                r"(match|طابق|اختر|أي مما يلي|true\s*/?\s*false|صواب|خطأ|complete|أكمل|اكمل|علل|فسر)",
                line,
                re.I,
            )
        )
        if starts_new_block and current:
            blocks.append(current)
            current = [line]
        else:
            current.append(line)
    if current:
        blocks.append(current)

    joined = ["\n".join(block) for block in blocks if any(part.strip() for part in block)]
    return joined if len(joined) > 1 else [str(text or "").strip()]


def detect_intent(text: str) -> str:
    stripped = str(text or "").strip()
    lowered = normalize_text(stripped)

    if not stripped:
        return "general_chat"
    if lowered in {normalize_text(item) for item in GENERAL_CHAT_PATTERNS}:
        return "general_chat"
    if lowered in {normalize_text(item) for item in UI_ACTION_PATTERNS}:
        return "ui_action"
    if any(pattern in lowered for pattern in map(normalize_text, EXPLAIN_PATTERNS)):
        return "explain_request"
    if any(pattern in lowered for pattern in map(normalize_text, QUIZ_PATTERNS)):
        return "quiz_request"
    if is_direct_math_expression(stripped) or has_choices(stripped):
        return "academic_question"
    if re.search(r"(صواب|خطأ|true|false|اختر|أي مما يلي|match|complete|اكمل|أكمل|احسب|أوجد|علل|فسر|عرف|____)", stripped, re.I):
        return "academic_question"
    if len(split_question_blocks(stripped)) > 1:
        return "academic_question"
    return "academic_question"


def detect_question_type(text: str) -> str:
    stripped = str(text or "").strip()
    lowered = normalize_text(stripped)

    blocks = split_question_blocks(stripped)
    if len(blocks) > 1:
        return "compound"
    if is_direct_math_expression(stripped):
        return "direct_math"
    if re.search(r"(صواب|خطأ|صح|true|false)", lowered, re.I):
        return "true_false"
    if re.search(r"(match|طابق)", lowered, re.I):
        return "matching"
    if has_choices(stripped) or re.search(r"(اختر|أي مما يلي)", lowered, re.I):
        return "multiple_choice"
    if "____" in stripped or "______" in stripped:
        return "fill_blank"
    if re.search(r"(علل|فسر|عرف|ما المقصود)", lowered, re.I):
        return "definition"
    return "general"


def infer_subject(text: str, fallback: str = "") -> str:
    lowered = normalize_text(text)
    if re.search(r"(went|goes|grammar|past tense|present simple|verb|rewrite)", lowered):
        return "اللغة الإنجليزية"
    if re.search(r"(محيط|مساحة|دائرة|معادلة|جمع|طرح|\*|ضرب|قسمة)", lowered):
        return "الرياضيات"
    if re.search(r"(أروماتية|benzene|aromatic|resonance|رنين|الكيمياء)", lowered):
        return "الكيمياء"
    if re.search(r"(خلوي|الميتوكوندريا|الرحم|البلاستولية|الأحياء|respiration|mitochondria)", lowered):
        return "الأحياء"
    if re.search(r"(force|speed|acceleration|نيوتن|سرعة|تسارع|فيزياء)", lowered):
        return "الفيزياء"
    return fallback or "عام"


def normalize_true_false(value: str) -> str:
    lowered = normalize_text(value)
    if any(token in lowered for token in ("خطأ", "false", "wrong", "incorrect")):
        return "خطأ"
    if any(token in lowered for token in ("صواب", "صح", "true", "correct", "right")):
        return "صواب"
    return value.strip()


def extract_options(text: str) -> list[str]:
    options = [item.strip() for item in str(text or "").split("-") if item.strip()]
    if len(options) >= 3:
        return options[-4:]

    lines = [line.strip() for line in str(text or "").splitlines() if line.strip()]
    option_lines = [line for line in lines if re.fullmatch(r"[A-Za-z\u0600-\u06FF0-9][^?؟]{0,120}", line)]
    return option_lines[-4:] if len(option_lines) >= 3 else []


def solve_direct_math(text: str) -> tuple[str, str]:
    expression = re.sub(r"\s+", "", text or "")
    expression = expression.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
    expression = expression.replace("×", "*").replace("x", "*").replace("X", "*").replace("؟", "").replace("?", "").replace("=", "")
    result = eval(expression, {"__builtins__": {}}, {})  # noqa: S307
    return str(result), "تم حساب العملية الرياضية المباشرة."


def conjugate_present_simple(verb: str) -> str:
    raw = str(verb or "").strip().lower()
    if not raw:
        return ""
    if raw == "be":
        return "is"
    if raw == "have":
        return "has"
    if raw == "do":
        return "does"
    if raw == "go":
        return "goes"
    if raw.endswith(("s", "sh", "ch", "x", "z", "o")):
        return f"{raw}es"
    if len(raw) > 1 and raw.endswith("y") and raw[-2] not in "aeiou":
        return f"{raw[:-1]}ies"
    return f"{raw}s"


def solve_rule_based_question(question: str, question_type: str) -> tuple[str, str, str] | None:
    lowered = normalize_text(question)

    if question_type == "fill_blank":
        singular_match = re.search(
            r"\b(she|he|it)\b.*\(\s*([a-z]+)\s*\).*(every day|always|usually|often)",
            question,
            re.I,
        )
        if singular_match:
            answer = conjugate_present_simple(singular_match.group(2))
            if answer:
                return answer, "", "rule_based_fill_blank"

    if question_type == "multiple_choice":
        if "past tense of go" in lowered or "past form of go" in lowered or "go in the past" in lowered:
            options = extract_options(question)
            for option in options:
                if normalize_text(option) == "went":
                    return option.strip(), "", "rule_based_multiple_choice"
            return "went", "", "rule_based_multiple_choice"

        math_match = re.search(r"([0-9٠-٩]+)\s*([*/+\-×xX])\s*([0-9٠-٩]+)", question)
        if math_match:
            math_answer, _ = solve_direct_math(math_match.group(0))
            options = extract_options(question)
            for option in options:
                if normalize_text(option) == normalize_text(math_answer):
                    return option.strip(), "", "rule_based_multiple_choice"

    if question_type == "true_false":
        if re.search(r"(محيط الدائرة).*(ط).*(نق2|نق\^2|نق²)", lowered):
            return "خطأ", "لأن ط × نق² قانون مساحة الدائرة وليس المحيط.", "rule_based_true_false"

    return None


def apply_final_guard(question_type: str, subject: str, answer: str, explanation: str) -> tuple[str, str, float, str] | None:
    clean_answer = str(answer or "").strip()
    clean_explanation = str(explanation or "").strip()

    if question_type == "multiple_choice":
        if not clean_answer:
            return None
        compact = clean_answer.splitlines()[0].strip()
        if len(compact) > 80:
            compact = compact[:80].strip()
        return compact, "", 0.0, "guard_pass_multiple_choice"

    if question_type == "true_false":
        normalized = normalize_true_false(clean_answer)
        if normalized not in {"صواب", "خطأ"}:
            return None
        if not clean_explanation:
            return None
        if subject == "الرياضيات" and re.search(r"(present simple|goes|grammar)", clean_explanation, re.I):
            return None
        if subject == "اللغة الإنجليزية" and re.search(r"(محيط الدائرة|نصف القطر|2\s*[×x*]\s*ط)", clean_explanation):
            return None
        return normalized, clean_explanation, 0.0, "guard_pass_true_false"

    if question_type in {"fill_blank", "direct_math"}:
        if not clean_answer:
            return None
        return clean_answer.splitlines()[0].strip(), "", 0.0, "guard_pass_short_answer"

    if question_type == "matching":
        return (clean_answer, clean_explanation, 0.0, "guard_pass_matching") if clean_answer else None

    if not clean_answer:
        return None
    if subject == "الرياضيات" and re.search(r"(present simple|goes|grammar)", clean_explanation, re.I):
        return None
    if subject == "اللغة الإنجليزية" and re.search(r"(محيط الدائرة|نصف القطر|2\s*[×x*]\s*ط)", clean_explanation):
        return None
    return clean_answer, clean_explanation, 0.0, "guard_pass_general"


def detect_question_type(text: str) -> str:
    stripped = str(text or "").strip()
    lowered = normalize_text(stripped)
    blocks = split_question_blocks(stripped)

    if len(blocks) > 1:
        return "compound"
    if is_direct_math_expression(stripped):
        return "direct_math"
    if re.search(r"(صواب|خطأ|صح|true|false)", lowered, re.I):
        return "true_false"
    if re.search(r"(match|طابق)", lowered, re.I):
        return "matching"
    if has_choices(stripped) or re.search(r"(اختر|أي مما يلي)", lowered, re.I):
        return "multiple_choice"
    if "____" in stripped or "______" in stripped:
        return "fill_blank"
    if re.search(r"(علل|فسر|عرف|ماهو|ماهي|ما هو|ما هي|ما المقصود|بحث|بحث شامل|what is|define)", lowered, re.I):
        return "definition"
    return "general"


def infer_subject(text: str, fallback: str = "") -> str:
    lowered = normalize_text(text)
    if re.search(r"(went|goes|grammar|past tense|present simple|verb|rewrite)", lowered, re.I):
        return "اللغة الإنجليزية"
    if re.search(r"(حضارة|الرومان|الرومانية|روما|اليونان|اليونانية|أثينا|اثينا|إسبرطة|اسبرطة|تاريخ|جغرافيا|إمبراطورية|منهجية الرومان)", lowered):
        return "الاجتماعيات"
    if re.search(r"(كورونا|كورنا|كوفيد|فيروس|مرض|وباء|جائحة|عدوى|لقاح|أعراض|اعراض|صحة)", lowered):
        return "العلوم"
    if re.search(r"(محيط|مساحة|دائرة|معادلة|جمع|طرح|\*|ضرب|قسمة)", lowered):
        return "الرياضيات"
    if re.search(r"(أروماتية|benzene|aromatic|resonance|رنين|الكيمياء)", lowered, re.I):
        return "الكيمياء"
    if re.search(r"(خلوي|الميتوكوندريا|الرحم|البلاستولية|الأحياء|respiration|mitochondria)", lowered, re.I):
        return "الأحياء"
    if re.search(r"(force|speed|acceleration|نيوتن|سرعة|تسارع|فيزياء)", lowered, re.I):
        return "الفيزياء"
    return fallback or "عام"


_base_apply_final_guard = apply_final_guard


def apply_final_guard(question_type: str, subject: str, answer: str, explanation: str) -> tuple[str, str, float, str] | None:
    guarded = _base_apply_final_guard(question_type, subject, answer, explanation)
    if not guarded:
        return None

    clean_answer, clean_explanation, extra_score, basis = guarded
    merged_text = f"{clean_answer} {clean_explanation}"
    if subject == "الاجتماعيات" and re.search(r"(محيط الدائرة|نصف القطر|2\s*[×x*]\s*ط|present simple|goes|grammar)", merged_text, re.I):
        return None
    if subject in {"العلوم", "الأحياء"} and re.search(r"(محيط الدائرة|نصف القطر|2\s*[×x*]\s*ط)", merged_text):
        return None
    return clean_answer, clean_explanation, extra_score, basis


def _legacy_render_response(question_type: str, answer: str, explanation: str) -> str:
    if question_type == "multiple_choice":
        return f"✅ الإجابة: {answer}"
    if question_type == "true_false":
        return f"✅ الإجابة: {answer}\n📘 السبب: {explanation}"
    if question_type == "fill_blank":
        return f"✅ الإجابة: {answer}"
    if question_type == "direct_math":
        return f"✅ الإجابة: {answer}"
    if question_type == "matching":
        return f"✅ الإجابة:\n{answer}"
    return f"✅ الإجابة: {answer}\n📘 الشرح: {explanation}"


def _legacy_render_response_compact(question_type: str, answer: str, explanation: str) -> str:
    if question_type == "multiple_choice":
        return f"âœ… ط§ظ„ط¥ط¬ط§ط¨ط©: {answer}"
    if question_type == "true_false":
        return f"âœ… ط§ظ„ط¥ط¬ط§ط¨ط©: {answer}\nًں“ک ط§ظ„ط³ط¨ط¨: {explanation}"
    if question_type == "fill_blank":
        return f"âœ… ط§ظ„ط¥ط¬ط§ط¨ط©: {answer}"
    if question_type == "direct_math":
        return f"âœ… ط§ظ„ط¥ط¬ط§ط¨ط©: {answer}"
    if question_type == "matching":
        return f"âœ… ط§ظ„ط¥ط¬ط§ط¨ط©:\n{answer}"
    if not explanation:
        return f"âœ… ط§ظ„ط¥ط¬ط§ط¨ط©: {answer}"
    return f"âœ… ط§ظ„ط¥ط¬ط§ط¨ط©: {answer}\nًں“ک ط§ظ„ط´ط±ط­: {explanation}"


def extract_search_prompt(question: str, question_type: str) -> str:
    stripped = re.sub(r"https?://\S+", " ", str(question or ""))
    stripped = re.sub(
        r"(تقدر تبحث لي عبر الويب|ابحث عبر الويب|حل من الويب|بحث شامل|سوي بحث شامل|ابحث لي|من فضلك)",
        " ",
        stripped,
        flags=re.I,
    )
    stripped = re.sub(r"\s+", " ", stripped).strip()
    if question_type == "multiple_choice" and has_choices(stripped):
        stem = re.split(r"\s+-\s+", stripped, maxsplit=1)[0].strip()
        return stem or stripped
    if question_type == "fill_blank":
        return stripped.replace("______", " ").replace("____", " ").strip() or stripped
    return stripped


def _legacy_clean_web_text(text: str, max_chars: int = 220) -> str:
    compact = " ".join(str(text or "").split()).strip(" -:\n")
    if not compact:
        return ""
    sentence = re.split(r"(?<=[.!؟?])\s+", compact, maxsplit=1)[0].strip() or compact
    if len(sentence) <= max_chars:
        return sentence
    shortened = sentence[:max_chars].rsplit(" ", 1)[0].strip()
    return shortened or sentence[:max_chars].strip()


def _legacy_best_web_answer_text(item: dict[str, Any]) -> str:
    return clean_web_text(item.get("page_text") or item.get("snippet") or item.get("title") or "")


def _legacy_build_web_answer_fallback(
    question: str,
    question_type: str,
    web_results: list[dict[str, Any]],
) -> tuple[str, str, float, str] | None:
    if not web_results:
        return None

    if question_type == "multiple_choice":
        options = extract_options(question)
        ranked: list[tuple[int, float, str]] = []
        for option in options:
            tokens = _tokens_for_candidate(option, question_type)
            hits = 0
            reliabilities: list[float] = []
            for result in web_results:
                haystack = normalize_text(
                    f"{result.get('title', '')} {result.get('snippet', '')} {result.get('page_text', '')}"
                )
                if any(token and normalize_text(token) in haystack for token in tokens):
                    hits += 1
                    reliabilities.append(float(result.get("reliability", 0.45)))
            if hits:
                ranked.append((hits, mean(reliabilities) if reliabilities else 0.0, option.strip()))

        ranked.sort(key=lambda item: (item[0], item[1]), reverse=True)
        if ranked:
            best = ranked[0]
            confidence = min(0.78, 0.56 + (best[0] * 0.08) + (best[1] * 0.1))
            return best[2], "", confidence, "web_multiple_choice_fallback"

    if question_type in {"true_false", "matching", "fill_blank", "direct_math"}:
        return None

    best_result = web_results[0]
    answer = best_web_answer_text(best_result)
    if not answer:
        return None

    domain = best_result.get("domain") or "trusted_web"
    explanation = f"تم ترجيح الجواب من الويب الموثوق عبر {domain}."
    confidence = min(0.76, max(0.52, float(best_result.get("reliability", 0.45)) + 0.12))
    return answer, explanation, confidence, "web_snippet_fallback"


def clean_web_text(text: str, max_chars: int = 220) -> str:
    compact = " ".join(str(text or "").split()).strip(" -:\n")
    if not compact:
        return ""
    sentence = re.split("(?<=[.!\\u061f?])\\s+", compact, maxsplit=1)[0].strip() or compact
    if len(sentence) <= max_chars:
        return sentence
    shortened = sentence[:max_chars].rsplit(" ", 1)[0].strip()
    return shortened or sentence[:max_chars].strip()


def best_web_answer_text(item: dict[str, Any]) -> str:
    return clean_web_text(item.get("page_text") or item.get("snippet") or item.get("title") or "")


def build_web_answer_fallback(
    question: str,
    question_type: str,
    web_results: list[dict[str, Any]],
) -> tuple[str, str, float, str] | None:
    if not web_results:
        return None

    if question_type == "multiple_choice":
        options = extract_options(question)
        ranked: list[tuple[int, float, str]] = []
        for option in options:
            tokens = _tokens_for_candidate(option, question_type)
            hits = 0
            reliabilities: list[float] = []
            for result in web_results:
                haystack = normalize_text(
                    f"{result.get('title', '')} {result.get('snippet', '')} {result.get('page_text', '')}"
                )
                if any(token and normalize_text(token) in haystack for token in tokens):
                    hits += 1
                    reliabilities.append(float(result.get("reliability", 0.45)))
            if hits:
                ranked.append((hits, mean(reliabilities) if reliabilities else 0.0, option.strip()))

        ranked.sort(key=lambda item: (item[0], item[1]), reverse=True)
        if ranked:
            best = ranked[0]
            confidence = min(0.78, 0.56 + (best[0] * 0.08) + (best[1] * 0.1))
            return best[2], "", confidence, "web_multiple_choice_fallback"

    if question_type in {"true_false", "matching", "fill_blank", "direct_math"}:
        return None

    best_result = web_results[0]
    answer = best_web_answer_text(best_result)
    if not answer:
        return None

    domain = best_result.get("domain") or "trusted_web"
    explanation = f"\u062a\u0645 \u062a\u0631\u062c\u064a\u062d \u0627\u0644\u062c\u0648\u0627\u0628 \u0645\u0646 \u0627\u0644\u0648\u064a\u0628 \u0627\u0644\u0645\u0648\u062b\u0648\u0642 \u0639\u0628\u0631 {domain}."
    confidence = min(0.76, max(0.52, float(best_result.get("reliability", 0.45)) + 0.12))
    return answer, explanation, confidence, "web_snippet_fallback"


def render_response(question_type: str, answer: str, explanation: str) -> str:
    answer_label = "\u2705 \u0627\u0644\u0625\u062c\u0627\u0628\u0629"
    reason_label = "\U0001f4a1 \u0627\u0644\u0633\u0628\u0628"
    explain_label = "\U0001f4a1 \u0627\u0644\u0634\u0631\u062d"
    if question_type == "multiple_choice":
        return f"{answer_label}: {answer}"
    if question_type == "true_false":
        return f"{answer_label}: {answer}\n{reason_label}: {explanation}"
    if question_type == "fill_blank":
        return f"{answer_label}: {answer}"
    if question_type == "direct_math":
        return f"{answer_label}: {answer}"
    if question_type == "matching":
        return f"{answer_label}:\n{answer}"
    if not explanation:
        return f"{answer_label}: {answer}"
    return f"{answer_label}: {answer}\n{explain_label}: {explanation}"


def build_hidden_analysis(
    request: SolveQuestionRequest,
    intent: str,
    question_type: str,
    subject: str,
    confidence: float,
    decision_basis: str,
    settings: Settings,
    trusted_domains: list[str],
) -> HiddenAnalysis:
    return HiddenAnalysis(
        intent=intent,  # type: ignore[arg-type]
        question_type=question_type,
        original_question=request.question,
        normalized_question=normalize_text(request.question),
        canonical_question=canonical_question(request.question, subject, question_type),
        concept_key=concept_key(request.question, subject, question_type),
        confidence=round(confidence, 4),
        decision_basis=decision_basis,
        analysis_budget_ms=settings.analysis_budget_ms,
        trusted_domains=trusted_domains,
    )


def _tokens_for_candidate(candidate: str, question_type: str) -> list[str]:
    if question_type == "true_false":
        normalized = normalize_true_false(candidate)
        if normalized == "صواب":
            return ["صواب", "صح", "true", "correct", "right"]
        if normalized == "خطأ":
            return ["خطأ", "false", "wrong", "incorrect"]
    return keyword_signature(candidate, limit=6) or [normalize_text(candidate)]


def extract_candidates(
    question: str,
    question_type: str,
    curriculum_answer: str = "",
    bank_answer: str = "",
) -> list[str]:
    if question_type == "true_false":
        return ["صواب", "خطأ"]
    if question_type == "multiple_choice":
        options = extract_options(question)
        return options if options else ([bank_answer] if bank_answer else ([curriculum_answer] if curriculum_answer else []))
    if question_type == "fill_blank":
        return [bank_answer or curriculum_answer] if (bank_answer or curriculum_answer) else []
    if question_type == "matching":
        return [bank_answer or curriculum_answer] if (bank_answer or curriculum_answer) else []
    return [bank_answer or curriculum_answer] if (bank_answer or curriculum_answer) else []


def score_candidate(
    candidate: str,
    *,
    question_type: str,
    curriculum_answer: str,
    curriculum_explanation: str,
    web_results: list[dict[str, Any]],
) -> AnswerCandidate:
    normalized_candidate = normalize_true_false(candidate) if question_type == "true_false" else normalize_text(candidate)
    normalized_curriculum_answer = normalize_true_false(curriculum_answer) if question_type == "true_false" else normalize_text(curriculum_answer)

    if not candidate:
        return AnswerCandidate(candidate="")

    book_support = 0.0
    if normalized_curriculum_answer and normalized_candidate == normalized_curriculum_answer:
        book_support = 1.0
    elif normalized_candidate and normalized_candidate in normalize_text(curriculum_explanation):
        book_support = 0.65

    tokens = _tokens_for_candidate(candidate, question_type)
    web_hits = 0
    reliability_hits: list[float] = []
    for result in web_results:
        haystack = normalize_text(
            f"{result.get('title', '')} {result.get('snippet', '')} {result.get('page_text', '')}"
        )
        if any(token and normalize_text(token) in haystack for token in tokens):
            web_hits += 1
            reliability_hits.append(float(result.get("reliability", 0.45)))

    web_support = min(1.0, web_hits / max(1, len(web_results))) if web_results else 0.0
    source_reliability = mean(reliability_hits) if reliability_hits else (mean([float(item.get("reliability", 0.45)) for item in web_results]) if web_results else 0.0)
    question_type_fit = 1.0
    if question_type == "true_false" and normalized_candidate not in {"صواب", "خطأ"}:
        question_type_fit = 0.0

    final_score = (
        (book_support * 0.50)
        + (web_support * 0.25)
        + (source_reliability * 0.15)
        + (question_type_fit * 0.10)
    )

    return AnswerCandidate(
        candidate=normalize_true_false(candidate) if question_type == "true_false" else candidate,
        book_support=round(book_support, 4),
        web_support=round(web_support, 4),
        source_reliability=round(source_reliability, 4),
        question_type_fit=round(question_type_fit, 4),
        final_score=round(final_score, 4),
    )


def choose_final_answer(
    question_type: str,
    curriculum: dict[str, Any] | None,
    web_results: list[dict[str, Any]],
    candidates: list[str],
) -> tuple[str, str, float, str, list[AnswerCandidate]]:
    curriculum_answer = (curriculum or {}).get("answer", "")
    curriculum_explanation = (curriculum or {}).get("explanation", "")
    ranked = [
        score_candidate(
            candidate,
            question_type=question_type,
            curriculum_answer=curriculum_answer,
            curriculum_explanation=curriculum_explanation,
            web_results=web_results,
        )
        for candidate in candidates
        if candidate
    ]
    ranked.sort(key=lambda item: item.final_score, reverse=True)

    if curriculum_answer and ranked:
        best = ranked[0]
        normalized_curriculum = normalize_true_false(curriculum_answer) if question_type == "true_false" else normalize_text(curriculum_answer)
        normalized_best = normalize_true_false(best.candidate) if question_type == "true_false" else normalize_text(best.candidate)
        curriculum_clear = float((curriculum or {}).get("score", 0.0)) >= 0.85
        if curriculum_clear and normalized_curriculum and normalized_curriculum != normalized_best:
            confidence = min(0.98, float((curriculum or {}).get("score", 0.78)) + 0.08)
            return curriculum_answer, curriculum_explanation, confidence, "curriculum_over_web_disagreement", ranked

    if ranked:
        best = ranked[0]
        reason = curriculum_explanation if curriculum_answer else "تم ترجيح الإجابة من خلال مقارنة المنهج بنتائج الويب الموثوقة."
        basis = "curriculum_first_with_web_verification" if curriculum_answer else "web_verified_fallback"
        confidence = max(best.final_score, float((curriculum or {}).get("score", 0.0)))
        return best.candidate, reason, confidence, basis, ranked

    if curriculum_answer:
        return curriculum_answer, curriculum_explanation, float((curriculum or {}).get("score", 0.72)), "curriculum_only", []

    return "", "", 0.0, "insufficient_evidence", []


def _solve_matching_fallback(question: str) -> str:
    lines = [line.strip() for line in question.splitlines() if line.strip()]
    prompts = [line for line in lines if "____" in line or "______" in line]
    options = [line.lstrip("- ").strip() for line in lines if line.startswith("-")]
    pairs = [f"{prompt} → {options[index]}" for index, prompt in enumerate(prompts[: len(options)])]
    return "\n".join(pairs)


def solve_single_academic(request: SolveQuestionRequest, settings: Settings, *, persist: bool = True) -> dict[str, Any]:
    question_type = detect_question_type(request.question)
    subject = infer_subject(request.question, request.subject or "")
    trusted_domains = resolve_trusted_domains(settings, request.trusted_domains if request.allow_web_verification else None)

    if question_type == "direct_math":
        answer, explanation = solve_direct_math(request.question)
        guarded = apply_final_guard(question_type, subject, answer, explanation)
        if not guarded:
            return {
                "answer": "",
                "explanation": "",
                "display_text": "تعذر تحديد الإجابة النهائية بثقة كافية لهذه الصياغة.",
                "confidence": 0.35,
                "matched_source": "final_guard_blocked",
                "source_trace": [SourceTraceItem(source="final_guard", detail="blocked_direct_math", score=0.35)],
                "answer_candidates": [],
                "question_type": question_type,
                "subject": subject,
                "decision_basis": "final_guard_blocked",
                "trusted_domains": trusted_domains,
                "web_results": [],
            }
        answer, explanation, _, guard_basis = guarded
        return {
            "answer": answer,
            "explanation": explanation,
            "display_text": render_response(question_type, answer, explanation),
            "confidence": 0.99,
            "matched_source": "direct_math_fast_path",
            "source_trace": [
                SourceTraceItem(source="direct_math", detail="expression_solver", score=0.99),
                SourceTraceItem(source="final_guard", detail=guard_basis, score=0.99),
            ],
            "answer_candidates": [],
            "question_type": question_type,
            "subject": subject,
            "decision_basis": "direct_math_fast_path",
            "trusted_domains": trusted_domains,
        }

    bank_match = search_approved_question_bank(
        request.question,
        grade=request.grade or "",
        subject=subject,
        term=request.term or "",
        question_type=question_type,
        settings=settings,
    )
    if bank_match:
        answer = bank_match.get("answer", "")
        explanation = bank_match.get("explanation", "")
        guarded = apply_final_guard(question_type, subject, answer, explanation)
        if not guarded:
            return {
                "answer": "",
                "explanation": "",
                "display_text": "تعذر تحديد الإجابة النهائية بثقة كافية لهذه الصياغة.",
                "confidence": 0.35,
                "matched_source": "final_guard_blocked",
                "source_trace": [
                    SourceTraceItem(
                        source="approved_question_bank",
                        detail=bank_match.get("question", ""),
                        score=float(bank_match.get("score", 0.0)),
                        metadata={"match_level": bank_match.get("match_level", "exact")},
                    ),
                    SourceTraceItem(source="final_guard", detail="blocked_approved_bank_answer", score=0.35),
                ],
                "answer_candidates": [],
                "question_type": question_type,
                "subject": subject,
                "decision_basis": "final_guard_blocked",
                "trusted_domains": trusted_domains,
                "web_results": [],
            }
        answer, explanation, _, guard_basis = guarded
        confidence = float(bank_match.get("score", 0.92))
        return {
            "answer": answer,
            "explanation": explanation,
            "display_text": render_response(question_type, answer, explanation),
            "confidence": confidence,
            "matched_source": "approved_question_bank",
            "source_trace": [
                SourceTraceItem(
                    source="approved_question_bank",
                    detail=bank_match.get("question", ""),
                    score=confidence,
                    metadata={"match_level": bank_match.get("match_level", "exact")},
                ),
                SourceTraceItem(source="final_guard", detail=guard_basis, score=confidence),
            ],
            "answer_candidates": [],
            "question_type": question_type,
            "subject": subject,
            "decision_basis": "approved_question_bank_fast_path",
            "trusted_domains": trusted_domains,
        }

    rule_result = solve_rule_based_question(request.question, question_type)
    if rule_result:
        answer, explanation, decision_basis = rule_result
        guarded = apply_final_guard(question_type, subject, answer, explanation)
        if guarded:
            guarded_answer, guarded_explanation, _, guard_basis = guarded
            confidence = 0.95
            return {
                "answer": guarded_answer,
                "explanation": guarded_explanation,
                "display_text": render_response(question_type, guarded_answer, guarded_explanation),
                "confidence": confidence,
                "matched_source": "rule_solver",
                "source_trace": [
                    SourceTraceItem(source="rule_solver", detail=decision_basis, score=confidence),
                    SourceTraceItem(source="final_guard", detail=guard_basis, score=confidence),
                ],
                "answer_candidates": [],
                "question_type": question_type,
                "subject": subject,
                "decision_basis": decision_basis,
                "trusted_domains": trusted_domains,
                "web_results": [],
            }

    curriculum = retrieve_curriculum_evidence(
        request.question,
        grade=request.grade or "",
        subject=subject,
        term=request.term or "",
        lesson=request.lesson or "",
        question_type=question_type,
    )

    source_trace: list[SourceTraceItem] = []
    if curriculum:
        source_trace.append(
            SourceTraceItem(
                source="curriculum_engine",
                detail=curriculum.get("lesson", ""),
                score=float(curriculum.get("score", 0.0)),
            )
        )

    web_results: list[dict[str, Any]] = []
    if request.allow_web_verification:
        web_results = SerpApiClient(settings).search(
            extract_search_prompt(request.question, question_type),
            trusted_domains,
        )
        if web_results:
            source_trace.append(
                SourceTraceItem(
                    source="web_verification_engine",
                    detail=", ".join(item.get("domain", "") for item in web_results[:3]),
                    score=round(mean([float(item.get("reliability", 0.45)) for item in web_results]), 4),
                    metadata={"results": len(web_results)},
                )
            )

    if question_type == "matching":
        answer = (curriculum or {}).get("answer") or _solve_matching_fallback(request.question)
        explanation = (curriculum or {}).get("explanation", "")
        confidence = max(float((curriculum or {}).get("score", 0.65)), 0.65 if answer else 0.0)
        matched_source = "curriculum_engine" if curriculum else "matching_fallback"
        guarded = apply_final_guard(question_type, subject, answer, explanation)
        if not guarded:
            return {
                "answer": "",
                "explanation": "",
                "display_text": "تعذر تحديد الإجابة النهائية بثقة كافية لهذه الصياغة.",
                "confidence": 0.35,
                "matched_source": "final_guard_blocked",
                "source_trace": source_trace + [SourceTraceItem(source="final_guard", detail="blocked_matching_answer", score=0.35)],
                "answer_candidates": [],
                "question_type": question_type,
                "subject": subject,
                "decision_basis": "final_guard_blocked",
                "trusted_domains": trusted_domains,
                "web_results": web_results,
            }
        answer, explanation, _, guard_basis = guarded
        source_trace.append(SourceTraceItem(source="final_guard", detail=guard_basis, score=confidence))
        if persist and answer:
            save_learned_answer(
                question=request.question,
                question_type=question_type,
                subject=subject,
                grade=request.grade or "",
                term=request.term or "",
                answer=answer,
                explanation=explanation,
                source=matched_source,
                confidence=confidence,
                approved=confidence >= 0.92,
                settings=settings,
            )
        return {
            "answer": answer,
            "explanation": explanation,
            "display_text": render_response(question_type, answer, explanation),
            "confidence": confidence,
            "matched_source": matched_source,
            "source_trace": source_trace,
            "answer_candidates": [],
            "question_type": question_type,
            "subject": subject,
            "decision_basis": matched_source,
            "trusted_domains": trusted_domains,
            "web_results": web_results,
        }

    candidates = extract_candidates(
        request.question,
        question_type,
        curriculum_answer=(curriculum or {}).get("answer", ""),
        bank_answer="",
    )
    answer, explanation, confidence, decision_basis, ranked_candidates = choose_final_answer(
        question_type,
        curriculum,
        web_results,
        candidates,
    )

    if not answer and question_type == "definition" and curriculum:
        answer = curriculum.get("answer", "")
        explanation = curriculum.get("explanation", "")
        confidence = float(curriculum.get("score", 0.7))
        decision_basis = "curriculum_definition"

    if not answer and web_results:
        web_fallback = build_web_answer_fallback(request.question, question_type, web_results)
        if web_fallback:
            answer, explanation, confidence, decision_basis = web_fallback

    if not answer:
        answer = ""
        explanation = ""
        confidence = 0.35
        decision_basis = "insufficient_evidence"

    matched_source = "curriculum_engine"
    if decision_basis.startswith("web_"):
        matched_source = "web_verification_engine"
    elif decision_basis.startswith("curriculum"):
        matched_source = "curriculum_engine"

    guarded = apply_final_guard(question_type, subject, answer, explanation)
    if not guarded:
        return {
            "answer": "",
            "explanation": "",
            "display_text": "تعذر تحديد الإجابة النهائية بثقة كافية لهذه الصياغة.",
            "confidence": min(confidence, 0.35),
            "matched_source": "final_guard_blocked",
            "source_trace": source_trace + [SourceTraceItem(source="final_guard", detail="blocked_unclear_or_cross_subject", score=min(confidence, 0.35))],
            "answer_candidates": ranked_candidates,
            "question_type": question_type,
            "subject": subject,
            "decision_basis": "final_guard_blocked",
            "trusted_domains": trusted_domains,
            "web_results": web_results,
        }

    answer, explanation, _, guard_basis = guarded
    source_trace.append(SourceTraceItem(source="final_guard", detail=guard_basis, score=confidence))

    if persist and answer and decision_basis != "insufficient_evidence":
        save_learned_answer(
            question=request.question,
            question_type=question_type,
            subject=subject,
            grade=request.grade or "",
            term=request.term or "",
            answer=answer,
            explanation=explanation,
            source=matched_source,
            confidence=confidence,
            approved=confidence >= 0.92,
            settings=settings,
        )

    return {
        "answer": answer,
        "explanation": explanation,
        "display_text": render_response(question_type, answer, explanation),
        "confidence": confidence,
        "matched_source": matched_source,
        "source_trace": source_trace,
        "answer_candidates": ranked_candidates,
        "question_type": question_type,
        "subject": subject,
        "decision_basis": decision_basis,
        "trusted_domains": trusted_domains,
        "web_results": web_results,
    }


def solve_question(request: SolveQuestionRequest, settings: Settings) -> SolveQuestionResponse:
    intent = detect_intent(request.question)
    trusted_domains = resolve_trusted_domains(settings, request.trusted_domains if request.allow_web_verification else None)

    if intent == "general_chat":
        answer = "أنا مساعد ذكي أساعدك في الدراسة، حل الأسئلة، والشرح والمحادثة بشكل مباشر."
        hidden = build_hidden_analysis(request, intent, "general", request.subject or "عام", 0.99, "general_chat_route", settings, trusted_domains)
        return SolveQuestionResponse(
            answer=answer,
            explanation="",
            display_text=answer,
            confidence=0.99,
            matched_source="general_chat_route",
            source_trace=[SourceTraceItem(source="intent_engine", detail="general_chat_route", score=0.99)],
            hidden_analysis=hidden,
        )

    if intent == "ui_action":
        answer = "تم. أرسل السؤال الكامل أو اختر المادة التي تريدها."
        hidden = build_hidden_analysis(request, intent, "general", request.subject or "عام", 0.98, "ui_action_route", settings, trusted_domains)
        return SolveQuestionResponse(
            answer=answer,
            explanation="",
            display_text=answer,
            confidence=0.98,
            matched_source="ui_action_route",
            source_trace=[SourceTraceItem(source="intent_engine", detail="ui_action_route", score=0.98)],
            hidden_analysis=hidden,
        )

    if intent in {"explain_request", "quiz_request"}:
        answer = "تم فهم الطلب التعليمي. أرسل اسم الدرس أو السؤال المطلوب وسأبدأ مباشرة بالطريقة المناسبة."
        hidden = build_hidden_analysis(request, intent, "general", request.subject or "عام", 0.9, "learning_request_route", settings, trusted_domains)
        return SolveQuestionResponse(
            answer=answer,
            explanation="",
            display_text=answer,
            confidence=0.9,
            matched_source="learning_request_route",
            source_trace=[SourceTraceItem(source="intent_engine", detail=intent, score=0.9)],
            hidden_analysis=hidden,
        )

    blocks = split_question_blocks(request.question)
    if len(blocks) > 1:
        solved_blocks = []
        rendered_lines = []
        combined_trace: list[SourceTraceItem] = []
        for index, block in enumerate(blocks, start=1):
            block_result = solve_single_academic(
                SolveQuestionRequest(
                    question=block,
                    grade=request.grade,
                    subject=request.subject,
                    term=request.term,
                    lesson=request.lesson,
                    trusted_domains=request.trusted_domains,
                    allow_web_verification=request.allow_web_verification,
                ),
                settings,
                persist=True,
            )
            solved_blocks.append(block_result)
            compact = block_result["answer"]
            if block_result["question_type"] == "true_false" and block_result["explanation"]:
                compact = f"{compact} — {block_result['explanation']}"
            rendered_lines.append(f"{index}) {compact}")
            combined_trace.extend(block_result["source_trace"])

        confidence = round(mean([float(item["confidence"]) for item in solved_blocks]), 4)
        hidden = build_hidden_analysis(
            request,
            "academic_question",
            "compound",
            infer_subject(request.question, request.subject or ""),
            confidence,
            "compound_router",
            settings,
            trusted_domains,
        )
        response = SolveQuestionResponse(
            answer="\n".join(rendered_lines),
            explanation="",
            display_text="✅ الإجابات:\n" + "\n".join(rendered_lines),
            confidence=confidence,
            matched_source="compound_router",
            source_trace=combined_trace[:8],
            hidden_analysis=hidden,
        )
        append_search_log(
            settings,
            SearchLogEntry(
                question=request.question,
                normalized_query=normalize_text(request.question),
                canonical_question=canonical_question(request.question, infer_subject(request.question, request.subject or ""), "compound"),
                question_type="compound",
                subject=infer_subject(request.question, request.subject or ""),
                trusted_domains=trusted_domains,
                serpapi_results=[],
                answer_candidates=[],
                final_answer=response.answer,
                confidence=response.confidence,
                source_trace=[item.model_dump() for item in response.source_trace],
                decision_basis="compound_router",
                matched_source="compound_router",
                created_at=utc_now_iso(),
            ),
        )
        return response

    solved = solve_single_academic(request, settings, persist=True)
    hidden = build_hidden_analysis(
        request,
        "academic_question",
        solved["question_type"],
        solved["subject"],
        float(solved["confidence"]),
        solved["decision_basis"],
        settings,
        solved["trusted_domains"],
    )
    response = SolveQuestionResponse(
        answer=solved["answer"],
        explanation=solved["explanation"],
        display_text=solved["display_text"],
        confidence=float(solved["confidence"]),
        matched_source=solved["matched_source"],
        source_trace=solved["source_trace"],
        answer_candidates=solved["answer_candidates"],
        hidden_analysis=hidden,
    )

    append_search_log(
        settings,
        SearchLogEntry(
            question=request.question,
            normalized_query=normalize_text(request.question),
            canonical_question=canonical_question(request.question, solved["subject"], solved["question_type"]),
            question_type=solved["question_type"],
            subject=solved["subject"],
            trusted_domains=solved["trusted_domains"],
            serpapi_results=[
                {
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "domain": item.get("domain", ""),
                    "reliability": item.get("reliability", 0.0),
                }
                for item in solved.get("web_results", [])
            ],
            answer_candidates=[item.model_dump() for item in solved["answer_candidates"]],
            final_answer=response.answer,
            confidence=response.confidence,
            source_trace=[item.model_dump() for item in response.source_trace],
            decision_basis=solved["decision_basis"],
            matched_source=solved["matched_source"],
            created_at=utc_now_iso(),
        ),
    )
    return response
