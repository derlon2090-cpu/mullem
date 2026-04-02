from __future__ import annotations

try:
    from .question_bank import keyword_signature, normalize_text, similarity
except ImportError:  # pragma: no cover - runtime fallback when running as a flat module
    from question_bank import keyword_signature, normalize_text, similarity


CURRICULUM_FACTS: list[dict] = [
    {
        "subject": "اللغة الإنجليزية",
        "grade": "all",
        "term": "all",
        "lesson": "Grammar",
        "question_type": "multiple_choice",
        "patterns": ["past tense of go", "go in the past", "past form of go"],
        "answer": "went",
        "explanation": "The correct past tense of go is went.",
    },
    {
        "subject": "اللغة الإنجليزية",
        "grade": "all",
        "term": "all",
        "lesson": "Grammar",
        "question_type": "true_false",
        "patterns": ["she go to school every day", "she goes present simple"],
        "answer": "خطأ",
        "explanation": "الصحيح هو She goes to school every day لأن she تحتاج goes.",
    },
    {
        "subject": "الرياضيات",
        "grade": "all",
        "term": "all",
        "lesson": "الضرب",
        "question_type": "direct_math",
        "patterns": ["5*6", "4*3", "multiplication"],
        "answer": "",
        "explanation": "نطبّق عملية الضرب المباشر بين العددين.",
    },
    {
        "subject": "الرياضيات",
        "grade": "all",
        "term": "all",
        "lesson": "المحيط والمساحة",
        "question_type": "true_false",
        "patterns": ["محيط الدائرة يساوي ط نق2", "pi r squared circumference"],
        "answer": "خطأ",
        "explanation": "هذه صيغة المساحة وليست المحيط.",
    },
    {
        "subject": "الأحياء",
        "grade": "all",
        "term": "all",
        "lesson": "التنفس الخلوي",
        "question_type": "true_false",
        "patterns": ["التنفس الخلوي داخل الفجوات", "cellular respiration vacuole"],
        "answer": "خطأ",
        "explanation": "التنفس الخلوي يحدث في الميتوكوندريا وليس الفجوات.",
    },
    {
        "subject": "الأحياء",
        "grade": "all",
        "term": "all",
        "lesson": "التكاثر والتطور الجنيني",
        "question_type": "true_false",
        "patterns": ["الكبسولة البلاستولية تدخل الرحم لتنغرس", "blastocyst implantation uterus"],
        "answer": "صواب",
        "explanation": "الكبسولة البلاستولية هي المرحلة التي تصل إلى الرحم وتبدأ بالانغراس.",
    },
    {
        "subject": "الكيمياء",
        "grade": "all",
        "term": "all",
        "lesson": "الهيدروكربونات الأروماتية",
        "question_type": "true_false",
        "patterns": ["الهيدروكربونات الأروماتية قليلة الثبات", "aromatic low stability", "aromaticity stability"],
        "answer": "خطأ",
        "explanation": "الأروماتية ترتبط بثبات أعلى بسبب delocalization والرنين.",
    },
]


CURRICULUM_FACTS.extend(
    [
        {
            "subject": "الاجتماعيات",
            "grade": "all",
            "term": "all",
            "lesson": "الحضارة الرومانية",
            "question_type": "definition",
            "patterns": ["ماهي الحضارة الرومانية", "ما هي الحضارة الرومانية", "حضارة الرومان", "بحث عن الحضارة الرومانية", "منهجية الرومان", "roman civilization"],
            "answer": "الحضارة الرومانية حضارة قديمة نشأت في روما، وتميزت بالقانون والإدارة والجيش والطرق والعمارة، وتطورت من مملكة إلى جمهورية ثم إمبراطورية، وأثرت بقوة في أوروبا والبحر المتوسط.",
            "explanation": "تُعد من أبرز حضارات العالم القديم، ومن أهم آثارها النظام القانوني، والعمارة، وتنظيم المدن والطرق، وانتشار اللغة اللاتينية.",
        },
        {
            "subject": "الاجتماعيات",
            "grade": "all",
            "term": "all",
            "lesson": "الحضارة اليونانية",
            "question_type": "definition",
            "patterns": ["ماهي الحضارة اليونانية", "ما هي حضارة اليونان", "حضارة اليونان", "greek civilization"],
            "answer": "الحضارة اليونانية حضارة قديمة ازدهرت في بلاد اليونان، واشتهرت بالفلسفة والعلوم والفنون والمسرح، وبنظام المدينة الدولة مثل أثينا وإسبرطة.",
            "explanation": "كان لها أثر كبير في الفكر السياسي والفلسفي والعلمي، وانتقلت بعض إنجازاتها لاحقًا إلى الرومان وأوروبا.",
        },
        {
            "subject": "العلوم",
            "grade": "all",
            "term": "all",
            "lesson": "مرض كورونا",
            "question_type": "definition",
            "patterns": ["ماهو مرض الكورونا", "ما هو مرض كورونا", "مرض كورونا", "ماهو كورونا", "covid-19", "coronavirus"],
            "answer": "مرض كورونا أو كوفيد-19 هو مرض معدٍ يسببه فيروس كورونا المستجد، وقد يؤدي إلى أعراض تنفسية مثل الحمى والسعال والتعب وضيق التنفس.",
            "explanation": "تختلف شدة الإصابة من خفيفة إلى شديدة، وتساعد النظافة والتهوية واللقاحات واتباع الإرشادات الصحية في تقليل الانتشار والمضاعفات.",
        },
    ]
)


def retrieve_curriculum_evidence(
    question: str,
    grade: str = "",
    subject: str = "",
    term: str = "",
    lesson: str = "",
    question_type: str = "",
) -> dict | None:
    normalized = normalize_text(question)
    question_keywords = keyword_signature(question)
    ranked: list[dict] = []

    for fact in CURRICULUM_FACTS:
        pattern_score = max((similarity(normalized, pattern) for pattern in fact["patterns"]), default=0.0)
        keyword_score = sum(1 for token in question_keywords if token in normalize_text(" ".join(fact["patterns"])))
        subject_score = 1.0 if not subject or subject == fact["subject"] else 0.35
        grade_score = 1.0 if not grade or fact["grade"] == "all" or grade == fact["grade"] else 0.6
        term_score = 1.0 if not term or fact["term"] == "all" or term == fact["term"] else 0.7
        type_score = 1.0 if not question_type or fact["question_type"] == question_type else 0.5
        lesson_score = 1.0 if not lesson or lesson == fact["lesson"] else 0.7

        total = (
            pattern_score * 0.42
            + min(1.0, keyword_score / 5) * 0.18
            + subject_score * 0.15
            + grade_score * 0.08
            + term_score * 0.07
            + type_score * 0.07
            + lesson_score * 0.03
        )

        ranked.append({**fact, "score": round(total, 4)})

    ranked.sort(key=lambda item: item["score"], reverse=True)
    best = ranked[0] if ranked else None
    if not best or best["score"] < 0.5:
        return None
    return best
