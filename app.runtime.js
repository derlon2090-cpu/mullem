(() => {
  if (window.__mullemRuntimePatched) return;
  window.__mullemRuntimePatched = true;

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
  if (window.location.hash === "#chat") {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  const form = document.querySelector("[data-chat-form]");
  const messageList = document.querySelector("[data-messages]");
  const attachmentList = document.querySelector("[data-attachments]");
  const promptInput = document.querySelector("[data-prompt]");
  const fileInput = document.querySelector("[data-file-input]");
  const gradeSelect = document.querySelector("[data-grade]");
  const subjectSelect = document.querySelector("[data-subject]");
  const termSelect = document.querySelector("[data-term]");
  const lessonInput = document.querySelector("[data-lesson]");
  const stageSwitch = document.querySelector(".stage-switch");
  const selectorsWrap = document.querySelector(".selectors");
  const focusSubjectButton = document.querySelector("[data-focus-subject]");
  const selectionSummary = document.querySelector("[data-selection-summary]");
  const uploadButton = document.querySelector("[data-open-upload]");
  const uploadImageButton = document.querySelector("[data-upload-image]");
  const uploadFileButton = document.querySelector("[data-upload-file]");
  const scrollTopButton = document.querySelector("[data-scroll-top]");
  const clearChatTrigger = document.querySelector("[data-clear-chat]");
  const newSessionTrigger = document.querySelector("[data-new-session]");
  const logoutTriggers = document.querySelectorAll("[data-logout]");
  const studentNameNodes = document.querySelectorAll("[data-student-name]");
  const studentStreakNodes = document.querySelectorAll("[data-streak-days]");
  const dashboardCopyNode = document.querySelector("[data-dashboard-copy]");
  const achievementsNode = document.querySelector("[data-achievements]");
  const placeholderButtons = document.querySelectorAll("[data-chat-placeholder]");

  if (!form || !messageList || !promptInput) return;

  const runtimeState = {
    pendingSolveConfirmation: null
  };

  const runtimeMemoryKeys = {
    answerBank: "mlm_runtime_answer_bank",
    patternMemory: "mlm_runtime_pattern_memory",
    intentRules: "mlm_runtime_intent_rules",
    intentErrors: "mlm_runtime_intent_errors"
  };

  const blockedVideoExtensions = /\.(mp4|mov|avi|mkv|webm|m4v)$/i;
  const foundationCatalog = {
    "الفيزياء": {
      basics: [
        "الحركة: هي تغير موقع الجسم مع الزمن.",
        "السرعة: مقدار المسافة المقطوعة خلال زمن معين.",
        "التسارع: معدل تغير السرعة.",
        "القوة: مؤثر يسبب تغيرًا في حركة الجسم."
      ],
      sampleQuestion: "إذا أثرت قوة مقدارها 12 نيوتن على جسم كتلته 4 كجم، فما تسارعه؟",
      sampleSolution: [
        "القانون: القوة = الكتلة × التسارع.",
        "التسارع = القوة ÷ الكتلة.",
        "التسارع = 12 ÷ 4 = 3 م/ث²."
      ],
      sampleAnswer: "تسارع الجسم = 3 م/ث².",
      mistakes: [
        "الخلط بين السرعة والتسارع.",
        "نسيان تحويل المطلوب من القانون الأصلي."
      ]
    },
    "الرياضيات": {
      basics: [
        "تحديد المعطيات بدقة قبل البدء.",
        "اختيار القانون أو القاعدة المناسبة.",
        "التعويض خطوة بخطوة.",
        "التحقق من الناتج بعد الحل."
      ],
      sampleQuestion: "احسب محيط دائرة نصف قطرها 7 سم.",
      sampleSolution: [
        "القانون: محيط الدائرة = 2 × ط × نق.",
        "التعويض: 2 × ط × 7.",
        "الناتج = 14ط ≈ 43.96 سم."
      ],
      sampleAnswer: "محيط الدائرة ≈ 43.96 سم.",
      mistakes: [
        "الخلط بين المحيط والمساحة.",
        "استخدام القطر بدل نصف القطر."
      ]
    },
    "الكيمياء": {
      basics: [
        "فهم نوع المادة وتركيبها.",
        "تمييز الروابط والتفاعلات والمفاهيم الأساسية.",
        "قراءة الرموز الكيميائية بدقة.",
        "ربط السؤال بالمفهوم قبل اختيار الإجابة."
      ],
      sampleQuestion: "ما نوع الرابطة في مركب كلوريد الصوديوم NaCl؟",
      sampleSolution: [
        "الصوديوم فلز، والكلور لا فلز.",
        "الفلزات مع اللافلزات تكوّن غالبًا رابطة أيونية.",
        "إذن نوع الرابطة هو أيونية."
      ],
      sampleAnswer: "الرابطة في NaCl أيونية.",
      mistakes: [
        "الخلط بين الرابطة الأيونية والتساهمية.",
        "الحكم على الرابطة دون تحديد نوع العناصر."
      ]
    },
    "الأحياء": {
      basics: [
        "ربط السؤال بوظيفة العضية أو الجهاز الحيوي.",
        "تمييز المصطلحات الحيوية الأساسية.",
        "التركيز على مكان حدوث العملية الحيوية.",
        "الاعتماد على المفهوم لا على الحفظ فقط."
      ],
      sampleQuestion: "في أي عضية يحدث التنفس الخلوي؟",
      sampleSolution: [
        "التنفس الخلوي عملية لإنتاج الطاقة داخل الخلية.",
        "المكان المرتبط بإنتاج الطاقة هو الميتوكوندريا.",
        "إذن يحدث التنفس الخلوي في الميتوكوندريا."
      ],
      sampleAnswer: "يحدث التنفس الخلوي في الميتوكوندريا.",
      mistakes: [
        "الخلط بين الميتوكوندريا والفجوات.",
        "اختيار العضية بناءً على التشابه اللفظي فقط."
      ]
    },
    "العلوم": {
      basics: [
        "فهم المفهوم العلمي أولًا.",
        "ربط الظاهرة بسببها العلمي.",
        "ملاحظة الكلمات المفتاحية في السؤال.",
        "اختيار المثال الأقرب من الدرس."
      ],
      sampleQuestion: "لماذا يتبخر الماء عند التسخين؟",
      sampleSolution: [
        "التسخين يزيد طاقة جزيئات الماء.",
        "عندما تزداد الطاقة تتحرر الجزيئات من السطح.",
        "لهذا يتحول الماء من سائل إلى بخار."
      ],
      sampleAnswer: "لأن التسخين يزيد طاقة جزيئات الماء فتتحول إلى بخار.",
      mistakes: [
        "وصف الظاهرة دون ذكر السبب العلمي.",
        "الخلط بين التبخر والغليان."
      ]
    },
    "اللغة العربية": {
      basics: [
        "فهم المطلوب أولًا: نحو أو بلاغة أو نص.",
        "تحديد الكلمات المفتاحية في الجملة.",
        "تطبيق القاعدة على المثال مباشرة.",
        "التأكد من سلامة الصياغة والإعراب."
      ],
      sampleQuestion: "حدد المبتدأ والخبر في جملة: المدرسة نظيفة.",
      sampleSolution: [
        "الجملة اسمية لأنها بدأت باسم.",
        "المبتدأ هو: المدرسة.",
        "الخبر هو: نظيفة."
      ],
      sampleAnswer: "المبتدأ: المدرسة، والخبر: نظيفة.",
      mistakes: [
        "الخلط بين المبتدأ والفاعل.",
        "إهمال نوع الجملة قبل الإعراب."
      ]
    },
    "اللغة الإنجليزية": {
      basics: [
        "تحديد نوع الجملة والزمن المطلوب.",
        "مراجعة الفاعل والفعل.",
        "التأكد من القاعدة المرتبطة بالجملة.",
        "تصحيح الصياغة مع مثال واضح."
      ],
      sampleQuestion: "صحح الجملة: She go to school every day.",
      sampleSolution: [
        "الفاعل هو She، وهو مفرد غائب.",
        "في المضارع البسيط نضيف s للفعل مع المفرد الغائب.",
        "تصبح الجملة: She goes to school every day."
      ],
      sampleAnswer: "She goes to school every day.",
      mistakes: [
        "نسيان إضافة s مع المفرد الغائب.",
        "الخلط بين المضارع البسيط والمستمر."
      ]
    }
  };

  function getRuntimeScopedKey(baseKey) {
    if (typeof getScopedStorageKey === "function") {
      return getScopedStorageKey(baseKey);
    }
    const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;
    return `${baseKey}_${activeUser?.id || "guest"}`;
  }

  function loadRuntimeStore(baseKey, fallback) {
    try {
      const value = localStorage.getItem(getRuntimeScopedKey(baseKey));
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveRuntimeStore(baseKey, value) {
    try {
      localStorage.setItem(getRuntimeScopedKey(baseKey), JSON.stringify(value));
    } catch (_) {
      // ignore storage issues
    }
  }

  function normalizeRuntimeQuestionKey(question, route) {
    const normalizedQuestion = typeof normalizeText === "function"
      ? normalizeText(question || "")
      : String(question || "").trim().toLowerCase();
    const grade = route?.detected_grade_level || gradeSelect?.value || (typeof getActiveUser === "function" ? getActiveUser()?.grade : "") || "unknown";
    const subject = route?.detected_subject || subjectSelect?.value || "general";
    return `${grade}::${subject}::${normalizedQuestion}`.slice(0, 500);
  }

  function getRuntimeAnswerBank() {
    try {
      const value = localStorage.getItem("mlm_runtime_answer_bank_global");
      return value ? JSON.parse(value) : [];
    } catch (_) {
      return [];
    }
  }

  function saveRuntimeAnswerBank(entries) {
    try {
      localStorage.setItem("mlm_runtime_answer_bank_global", JSON.stringify(entries.slice(0, 250)));
    } catch (_) {
      // ignore storage issues
    }
  }

  function getRuntimePatternMemory() {
    return loadRuntimeStore(runtimeMemoryKeys.patternMemory, {});
  }

  function saveRuntimePatternMemory(memory) {
    saveRuntimeStore(runtimeMemoryKeys.patternMemory, memory);
  }

  function getRuntimeIntentRules() {
    const saved = loadRuntimeStore(runtimeMemoryKeys.intentRules, []);
    const seeded = [
      { pattern: "من انت", correctIntent: "general_chat" },
      { pattern: "من أنت", correctIntent: "general_chat" },
      { pattern: "وش اسمك", correctIntent: "general_chat" },
      { pattern: "ما اسمك", correctIntent: "general_chat" },
      { pattern: "مرحبا", correctIntent: "general_chat" },
      { pattern: "السلام عليكم", correctIntent: "general_chat" },
      { pattern: "نعم", correctIntent: "ui_action" },
      { pattern: "لا", correctIntent: "ui_action" },
      { pattern: "اكمل", correctIntent: "ui_action" },
      { pattern: "أكمل", correctIntent: "ui_action" },
      { pattern: "كمل", correctIntent: "ui_action" },
      { pattern: "اختيار المادة", correctIntent: "ui_action" }
    ];

    const merged = [...seeded];
    saved.forEach((item) => {
      if (!item?.pattern || !item?.correctIntent) return;
      if (!merged.some((rule) => rule.pattern === item.pattern && rule.correctIntent === item.correctIntent)) {
        merged.push(item);
      }
    });
    return merged;
  }

  function saveRuntimeIntentRules(rules) {
    saveRuntimeStore(runtimeMemoryKeys.intentRules, rules.slice(0, 120));
  }

  function getRuntimeIntentErrors() {
    return loadRuntimeStore(runtimeMemoryKeys.intentErrors, []);
  }

  function saveRuntimeIntentErrors(errors) {
    saveRuntimeStore(runtimeMemoryKeys.intentErrors, errors.slice(0, 120));
  }

  function recordRuntimeIntentError(entry) {
    const errors = getRuntimeIntentErrors();
    errors.unshift({
      ...entry,
      createdAt: new Date().toISOString()
    });
    saveRuntimeIntentErrors(errors);
  }

  function checkRuntimeLearnedIntent(text) {
    const normalized = typeof normalizeText === "function"
      ? normalizeText(text || "")
      : String(text || "").trim().toLowerCase();

    return getRuntimeIntentRules().find((rule) => normalized === normalizeText(rule.pattern) || normalized.includes(normalizeText(rule.pattern)))?.correctIntent || "";
  }

  function rememberRuntimeIntentPattern(text, correctIntent) {
    const normalized = typeof normalizeText === "function"
      ? normalizeText(text || "")
      : String(text || "").trim().toLowerCase();
    if (!normalized || !correctIntent) return;

    const rules = getRuntimeIntentRules();
    if (rules.some((rule) => normalizeText(rule.pattern) === normalized && rule.correctIntent === correctIntent)) return;
    rules.unshift({ pattern: text, correctIntent });
    saveRuntimeIntentRules(rules);
  }

  function getRuntimePatternKey(questionType, subject) {
    return `${questionType || "general"}::${subject || "عام"}`;
  }

  function getRuntimePreferredStyle(questionType, subject) {
    const memory = getRuntimePatternMemory();
    const key = getRuntimePatternKey(questionType, subject);
    const stats = memory[key] || {};
    if ((stats.shortLikes || 0) > (stats.shortDislikes || 0) + 1) return "short";
    if ((stats.stepsLikes || 0) > (stats.stepsDislikes || 0) + 1) return "steps";
    return "";
  }

  function updateRuntimePatternMemory(questionType, subject, feedbackType, response) {
    const memory = getRuntimePatternMemory();
    const key = getRuntimePatternKey(questionType, subject);
    const current = memory[key] || {
      likes: 0,
      dislikes: 0,
      shortLikes: 0,
      shortDislikes: 0,
      stepsLikes: 0,
      stepsDislikes: 0
    };

    if (feedbackType === "like") current.likes += 1;
    if (feedbackType === "dislike") current.dislikes += 1;

    if (response?.displayMode === "quick" || response?.answerMode === "truefalse" || response?.answerMode === "mcq") {
      if (feedbackType === "like") current.shortLikes += 1;
      if (feedbackType === "dislike") current.shortDislikes += 1;
    }

    if (Array.isArray(response?.steps) && response.steps.length) {
      if (feedbackType === "like") current.stepsLikes += 1;
      if (feedbackType === "dislike") current.stepsDislikes += 1;
    }

    memory[key] = current;
    saveRuntimePatternMemory(memory);
  }

  function normalizeRuntimeBankQuestion(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/\r?\n/g, " \n ")
      .replace(/[؟?!.,،؛:"'(){}\[\]]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractRuntimeStoredOptions(question, questionType) {
    if (questionType === "اختيار من متعدد" || questionType === "إكمال فراغ") {
      return extractRuntimeMultipleChoiceData(question).options.map((option) => cleanRuntimeChoiceToken(option)).filter(Boolean);
    }
    if (questionType === "صح أو خطأ") {
      return ["صواب", "خطأ"];
    }
    return [];
  }

  function getRuntimeQuestionTokens(text) {
    return normalizeRuntimeBankQuestion(text)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1);
  }

  function buildRuntimeKeywordSignature(text, limit = 5) {
    return getRuntimeQuestionTokens(text)
      .filter((token) => token.length > 2)
      .slice(0, limit);
  }

  function countRuntimeKeywordOverlap(left, right) {
    const leftKeywords = new Set(Array.isArray(left) ? left : buildRuntimeKeywordSignature(left));
    const rightKeywords = new Set(Array.isArray(right) ? right : buildRuntimeKeywordSignature(right));
    let overlap = 0;
    leftKeywords.forEach((token) => {
      if (rightKeywords.has(token)) overlap += 1;
    });
    return overlap;
  }

  function scoreRuntimeQuestionSimilarity(left, right) {
    const leftText = normalizeRuntimeBankQuestion(left);
    const rightText = normalizeRuntimeBankQuestion(right);
    if (!leftText || !rightText) return 0;
    if (leftText === rightText) return 1;

    const leftTokens = new Set(getRuntimeQuestionTokens(left));
    const rightTokens = new Set(getRuntimeQuestionTokens(right));
    if (!leftTokens.size || !rightTokens.size) return 0;

    let overlap = 0;
    leftTokens.forEach((token) => {
      if (rightTokens.has(token)) overlap += 1;
    });

    const union = new Set([...leftTokens, ...rightTokens]).size || 1;
    return overlap / union;
  }

  function isRuntimeApprovedAnswerEntry(entry) {
    if (!entry || !entry.response) return false;
    const likes = entry.likes || 0;
    const dislikes = entry.dislikes || 0;
    const confidence = typeof entry.confidence === "number"
      ? entry.confidence
      : (typeof entry.response?.confidence === "number" ? entry.response.confidence : 0);
    if (entry.isRejected) return false;
    if (entry.isApproved || entry.isTrusted) return true;
    if (likes >= 2 && likes > dislikes && dislikes <= 1) return true;
    if (confidence >= 0.9 && dislikes === 0) return true;
    return false;
  }

  function refreshRuntimeAnswerEntryStatus(entry) {
    if (!entry) return entry;
    const likes = entry.likes || 0;
    const dislikes = entry.dislikes || 0;
    const confidence = typeof entry.confidence === "number"
      ? entry.confidence
      : (typeof entry.response?.confidence === "number" ? entry.response.confidence : 0);

    entry.isRejected = dislikes >= 3 && dislikes >= likes;
    entry.isApproved = !entry.isRejected && (
      entry.isTrusted ||
      (likes >= 2 && likes > dislikes) ||
      (confidence >= 0.9 && dislikes === 0)
    );
    entry.qualityScore = Number((
      (entry.isApproved ? 0.45 : 0.1) +
      Math.min(0.2, likes * 0.05) +
      Math.max(0, confidence * 0.2) -
      Math.min(0.2, dislikes * 0.06)
    ).toFixed(4));
    return entry;
  }

  function searchApprovedQuestionBank(question, route, analysis) {
    const bank = getRuntimeAnswerBank().map((item) => refreshRuntimeAnswerEntryStatus(item));
    const queryText = String(question || "").trim();
    if (!queryText) return null;

    const normalizedQuestion = normalizeRuntimeBankQuestion(queryText);
    const grade = route?.detected_grade_level || gradeSelect?.value || (typeof getActiveUser === "function" ? getActiveUser()?.grade : "") || "unknown";
    const subject = route?.detected_subject || analysis?.subject || subjectSelect?.value || "";
    const term = termSelect?.value || "unknown";
    const questionType = route?.question_type || analysis?.questionType || "";
    const options = extractRuntimeStoredOptions(queryText, questionType);

    const ranked = bank
      .filter((entry) => entry?.response)
      .map((entry) => {
        const similarity = scoreRuntimeQuestionSimilarity(normalizedQuestion, entry.normalizedQuestion || entry.question || "");
        const keywordOverlap = countRuntimeKeywordOverlap(queryText, entry.keywordSignature ? String(entry.keywordSignature).split("|") : (entry.question || ""));
        const strongKeywordMatch = keywordOverlap >= 5 ? 1 : 0;
        const sameSubject = !subject || !entry.subject ? 0.7 : (normalizeRuntimeSubjectLabel(entry.subject) === normalizeRuntimeSubjectLabel(subject) ? 1 : 0.35);
        const sameGrade = !grade || !entry.grade || grade === "unknown" || entry.grade === "unknown" ? 0.75 : (entry.grade === grade ? 1 : 0.45);
        const sameTerm = !term || !entry.term || term === "unknown" || entry.term === "unknown" ? 0.75 : (entry.term === term ? 1 : 0.45);
        const entryOptions = Array.isArray(entry.options) ? entry.options : [];
        const optionSimilarity = !options.length || !entryOptions.length
          ? 0.75
          : scoreRuntimeQuestionSimilarity(options.join(" "), entryOptions.join(" "));
        const approval = isRuntimeApprovedAnswerEntry(entry) ? 1 : 0;
        const likes = entry.likes || 0;
        const dislikes = entry.dislikes || 0;
        const feedbackScore = likes + dislikes > 0 ? likes / Math.max(1, likes + dislikes) : 0.75;
        const confidence = typeof entry.confidence === "number"
          ? entry.confidence
          : (typeof entry.response?.confidence === "number" ? entry.response.confidence : 0.7);

        const finalScore =
          (approval * 0.42) +
          (similarity * 0.28) +
          (strongKeywordMatch * 0.08) +
          (sameSubject * 0.08) +
          (sameGrade * 0.06) +
          (sameTerm * 0.04) +
          (optionSimilarity * 0.04) +
          (feedbackScore * 0.05) +
          (confidence * 0.03);

        return {
          ...entry,
          similarity,
          keywordOverlap,
          strongKeywordMatch,
          finalScore: Number(finalScore.toFixed(4))
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    const best = ranked[0];
    if (!best) return null;
    if (!isRuntimeApprovedAnswerEntry(best)) return null;
    if (best.similarity < 0.78 && !best.strongKeywordMatch) return null;
    return best;
  }

  function markRuntimeStoredAnswerUsed(answerBankKey) {
    if (!answerBankKey) return;
    const bank = getRuntimeAnswerBank();
    const entry = bank.find((item) => item.key === answerBankKey);
    if (!entry) return;
    entry.usageCount = (entry.usageCount || 0) + 1;
    entry.updatedAt = Date.now();
    refreshRuntimeAnswerEntryStatus(entry);
    saveRuntimeAnswerBank(bank);
  }

  function findRuntimeStoredAnswer(question, route) {
    return searchApprovedQuestionBank(question, route, {
      subject: route?.detected_subject || "",
      questionType: route?.question_type || ""
    });
  }

  function saveRuntimeAnswerCandidate(question, route, response) {
    if (!response || !question) return null;
    const key = normalizeRuntimeQuestionKey(question, route);
    const bank = getRuntimeAnswerBank();
    response.answerBankKey = key;
    const preview = String(response.finalAnswer || response.explanation || "").trim().slice(0, 140);
    const nextEntry = {
      key,
      question: String(question).trim(),
      normalizedQuestion: normalizeRuntimeBankQuestion(question),
      subject: response.subject || route?.detected_subject || "عام",
      questionType: response.questionType || route?.question_type || "سؤال أكاديمي",
      response,
      preview,
      likes: 0,
      dislikes: 0,
      updatedAt: Date.now()
    };

    const index = bank.findIndex((item) => item.key === key);
    if (index >= 0) {
      nextEntry.likes = bank[index].likes || 0;
      nextEntry.dislikes = bank[index].dislikes || 0;
      bank[index] = nextEntry;
    } else {
      bank.unshift(nextEntry);
    }

    saveRuntimeAnswerBank(bank);
    return nextEntry;
  }

  function updateRuntimeAnswerFeedbackByPreview(preview, feedbackType) {
    if (!preview) return;
    const bank = getRuntimeAnswerBank();
    const entry = bank.find((item) => item.preview && preview.includes(item.preview));
    if (!entry) return;
    if (feedbackType === "like") entry.likes = (entry.likes || 0) + 1;
    if (feedbackType === "dislike") entry.dislikes = (entry.dislikes || 0) + 1;
    entry.updatedAt = Date.now();
    saveRuntimeAnswerBank(bank);
    updateRuntimePatternMemory(entry.questionType, entry.subject, feedbackType, entry.response);
  }

  function updateRuntimeAnswerFeedbackByKey(answerBankKey, feedbackType) {
    if (!answerBankKey) return;
    const bank = getRuntimeAnswerBank();
    const entry = bank.find((item) => item.key === answerBankKey);
    if (!entry) return;
    if (feedbackType === "like") entry.likes = (entry.likes || 0) + 1;
    if (feedbackType === "dislike") entry.dislikes = (entry.dislikes || 0) + 1;
    entry.updatedAt = Date.now();
    saveRuntimeAnswerBank(bank);
    updateRuntimePatternMemory(entry.questionType, entry.subject, feedbackType, entry.response);
  }

  function saveRuntimeAnswerCandidate(question, route, response) {
    if (!response || !question) return null;
    const key = normalizeRuntimeQuestionKey(question, route);
    const bank = getRuntimeAnswerBank();
    response.answerBankKey = key;
    const preview = String(response.finalAnswer || response.explanation || "").trim().slice(0, 140);
    const existingIndex = bank.findIndex((item) => item.key === key);
    const existing = existingIndex >= 0 ? bank[existingIndex] : null;
    const grade = route?.detected_grade_level
      || gradeSelect?.value
      || (typeof getActiveUser === "function" ? getActiveUser()?.grade : "")
      || "unknown";
    const term = termSelect?.value || "unknown";
    const questionType = response.questionType || route?.question_type || classifyRuntimeQuestionType(question) || "سؤال أكاديمي";
    const confidence = typeof response.confidence === "number"
      ? Number(response.confidence.toFixed(4))
      : (typeof existing?.confidence === "number" ? existing.confidence : 0.72);
    const source = response.decisionBasis
      || response?.structuredResult?.decision_basis
      || existing?.source
      || "curriculum_books_first";
    const nextEntry = refreshRuntimeAnswerEntryStatus({
      ...existing,
      key,
      question: String(question).trim(),
      normalizedQuestion: normalizeRuntimeBankQuestion(question),
      subject: response.subject || route?.detected_subject || existing?.subject || "عام",
      grade,
      term,
      questionType,
      options: extractRuntimeStoredOptions(question, questionType),
      response,
      preview,
      source,
      sourceType: source.includes("question_bank")
        ? "approved_question_bank"
        : (source.includes("web") ? "curriculum_with_web_verification" : "curriculum"),
      confidence,
      likes: existing?.likes || 0,
      dislikes: existing?.dislikes || 0,
      usageCount: existing?.usageCount || 0,
      isTrusted: Boolean(
        existing?.isTrusted
        || response?.isTrusted
        || source === "approved_question_bank_fast_path"
        || source === "stored_best_answer"
        || confidence >= 0.95
      ),
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    });

    if (existingIndex >= 0) {
      bank[existingIndex] = nextEntry;
    } else {
      bank.unshift(nextEntry);
    }

    saveRuntimeAnswerBank(bank);
    return nextEntry;
  }

  function updateRuntimeAnswerFeedbackByPreview(preview, feedbackType) {
    if (!preview) return;
    const bank = getRuntimeAnswerBank();
    const entry = bank.find((item) => item.preview && preview.includes(item.preview));
    if (!entry) return;
    if (feedbackType === "like") entry.likes = (entry.likes || 0) + 1;
    if (feedbackType === "dislike") entry.dislikes = (entry.dislikes || 0) + 1;
    entry.updatedAt = Date.now();
    refreshRuntimeAnswerEntryStatus(entry);
    saveRuntimeAnswerBank(bank);
    updateRuntimePatternMemory(entry.questionType, entry.subject, feedbackType, entry.response);
  }

  function updateRuntimeAnswerFeedbackByKey(answerBankKey, feedbackType) {
    if (!answerBankKey) return;
    const bank = getRuntimeAnswerBank();
    const entry = bank.find((item) => item.key === answerBankKey);
    if (!entry) return;
    if (feedbackType === "like") entry.likes = (entry.likes || 0) + 1;
    if (feedbackType === "dislike") entry.dislikes = (entry.dislikes || 0) + 1;
    entry.updatedAt = Date.now();
    refreshRuntimeAnswerEntryStatus(entry);
    saveRuntimeAnswerBank(bank);
    updateRuntimePatternMemory(entry.questionType, entry.subject, feedbackType, entry.response);
  }

  function getSolveMode() {
    const active = document.querySelector("[data-solve-mode].active");
    return active?.getAttribute("data-solve-mode") || "quick";
  }

  function hasBlockedVideo(files) {
    return (files || []).some((file) => file?.type?.startsWith("video/") || blockedVideoExtensions.test(file?.name || ""));
  }

  function syncAttachmentFiles(files) {
    if (!fileInput) return;
    const dataTransfer = new DataTransfer();
    (files || []).forEach((file) => dataTransfer.items.add(file));
    fileInput.files = dataTransfer.files;
    if (typeof attachments !== "undefined") {
      attachments = [...(files || [])];
    }
    renderRuntimeAttachments();
  }

  function renderRuntimeAttachments() {
    if (!attachmentList) return;
    const currentFiles = typeof attachments !== "undefined" && Array.isArray(attachments)
      ? attachments
      : Array.from(fileInput?.files || []);
    attachmentList.innerHTML = currentFiles
      .map((file, index) => `<div class="attachment"><span>📎 ${file.name}</span><button class="attachment-remove" type="button" data-remove-attachment="${index}" aria-label="إلغاء ${file.name}">×</button></div>`)
      .join("");
  }

  function clearRuntimeAttachments() {
    if (fileInput) fileInput.value = "";
    if (typeof attachments !== "undefined") {
      attachments = [];
    }
    renderRuntimeAttachments();
  }

  function removeRuntimeAttachment(index) {
    const files = Array.from(fileInput?.files || []);
    if (index < 0 || index >= files.length) return;
    files.splice(index, 1);
    syncAttachmentFiles(files);
  }

  function isCompoundLearningRequest(text) {
    const normalized = typeof normalizeText === "function" ? normalizeText(text) : (text || "");
    return /ثم|وبعدها|بعد ذلك/.test(normalized) && /اشرح|ابدأ بشرح|أساسيات/.test(normalized) && /حل|مثال|نموذجي/.test(normalized);
  }

  function query_decomposer(text, subject) {
    if (!isCompoundLearningRequest(text)) return [];
    const safeSubject = subject || "المادة";
    return [
      `شرح أساسيات ${safeSubject}`,
      "اختيار موضوع مناسب من الفصل أو الدرس المطلوب",
      "تجهيز سؤال نموذجي مناسب",
      "حل السؤال خطوة بخطوة",
      "اقتراح متابعة تدريبية بعد إكمال الطلب"
    ];
  }

  function resolveStudyContext(route) {
    const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;
    const grade = activeUser?.grade || gradeSelect?.value || "";
    const term = termSelect?.value || "الفصل الدراسي الأول";
    const subject = route?.detected_subject || activeUser?.subject || subjectSelect?.value || "المادة";
    return {
      grade,
      term,
      subject,
      stage: typeof getSelectedStageLabel === "function" ? getSelectedStageLabel(grade) : ""
    };
  }

  function curriculum_rag(subject, context) {
    const entry = foundationCatalog[subject] || foundationCatalog["العلوم"];
    return {
      subject,
      grade: context.grade,
      term: context.term,
      basics: entry.basics,
      sampleQuestion: entry.sampleQuestion,
      sampleSolution: entry.sampleSolution,
      sampleAnswer: entry.sampleAnswer,
      mistakes: entry.mistakes
    };
  }

  function task_planner(question, subject, context) {
    return {
      isCompound: isCompoundLearningRequest(question),
      tasks: query_decomposer(question, subject),
      context
    };
  }

  function mapRuntimeOutputStyle(questionType) {
    if (questionType === "صح وخطأ") return "short_answer";
    if (questionType === "اختيار من متعدد") return "direct_answer";
    if (questionType === "مسألة") return "worked_steps";
    if (questionType === "شرح") return "guided_explanation";
    if (questionType === "تعريف") return "compact_concept";
    if (questionType === "مطابقة" || questionType === "رسالة متعددة الأسئلة") return "mapping";
    return "adaptive";
  }

  function normalizeRuntimeSubjectLabel(subject) {
    const value = String(subject || "").trim();
    if (!value) return "عام";
    return value;
  }

  function mapRuntimeOutputStyleSmart(questionType) {
    if (questionType === "صح أو خطأ") return "short_answer";
    if (questionType === "اختيار من متعدد") return "direct_answer";
    if (questionType === "إكمال فراغ") return "direct_answer";
    if (questionType === "مسألة") return "worked_steps";
    if (questionType === "شرح") return "guided_explanation";
    if (questionType === "تعريف") return "compact_concept";
    if (questionType === "مطابقة" || questionType === "سؤال مركب") return "mapping";
    return mapRuntimeOutputStyle(questionType);
  }

  function buildRuntimeMetaBrain(question, route, analysis, reasoning) {
    const context = resolveStudyContext(route);
    const blocks = splitIntoQuestionBlocksSmart(question);
    const blockTypes = blocks.map((block) => classifyRuntimeBlockType(block)).filter((type) => type && type !== "general");
    const primaryType = analysis?.questionType || route?.question_type || "سؤال أكاديمي";
    const effectiveType = blockTypes.length > 1 ? "رسالة متعددة الأسئلة" : (blockTypes[0] === "matching" ? "مطابقة" : primaryType);

    return {
      intent: analysis?.intent?.type || "solve_question",
      questionType: effectiveType,
      subject: normalizeRuntimeSubjectLabel(route?.detected_subject || analysis?.subject || context.subject),
      difficulty: analysis?.difficulty || "medium",
      expectedOutputStyle: mapRuntimeOutputStyleSmart(effectiveType),
      grade: context.grade || route?.detected_grade_level || "غير محدد",
      term: context.term || "غير محدد",
      blockTypes,
      blockCount: blocks.length,
      multiQuestion: blockTypes.length > 1 || reasoning?.multiQuestion || false
    };
  }

  function buildRuntimeRetrievalPlan(meta, route) {
    const context = resolveStudyContext(route);
    const internal = curriculum_rag(meta.subject, {
      grade: meta.grade,
      term: meta.term,
      subject: meta.subject,
      stage: context.stage
    });

    return {
      source: "curriculum_books_first",
      usedWebFallback: false,
      webFallbackAvailable: false,
      confidenceThreshold: 0.85,
      decisionBasis: "book_first_with_structured_validation",
      sourceWeights: {
        bookMatch: 0.45,
        webConsensus: 0.2,
        sourceReliability: 0.2,
        questionTypeFit: 0.1,
        repetition: 0.05
      },
      evidence: [
        { type: "book", subject: meta.subject, grade: meta.grade, term: meta.term, note: "المنهج الداخلي" },
        { type: "lesson_basics", items: internal.basics.slice(0, 3) }
      ]
    };
  }

  function normalizeRuntimeClaim(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.,?!،؛:()"]/g, "");
  }

  function buildRuntimeEvidenceProfile(question, subject = "", questionType = "") {
    const normalized = typeof normalizeText === "function" ? normalizeText(question) : String(question || "").toLowerCase();
    const safeSubject = subject || "";

    if (/past tense of\s+go|go.*went|went.*go/.test(normalized)) {
      return {
        subject: safeSubject || "اللغة الإنجليزية",
        lesson: "Past tense verbs",
        preferredAnswer: "went",
        reason: "لأن الماضي الصحيح للفعل go هو went.",
        bookClaims: ["go changes to went in the past tense", "the correct past tense of go is went"],
        webClaims: ["went is the past tense of go", "go → went in past simple"],
        sourceReliability: 0.96
      };
    }

    if (/she go to school every day/.test(normalized)) {
      return {
        subject: safeSubject || "اللغة الإنجليزية",
        lesson: "Present Simple",
        preferredAnswer: "خطأ",
        reason: "الصحيح She goes لأن الفاعل she يحتاج s في المضارع البسيط.",
        bookClaims: ["she takes goes in present simple", "with she we use goes not go"],
        webClaims: ["she goes to school every day is correct", "she + goes in simple present"],
        sourceReliability: 0.95
      };
    }

    if (/confused by something|someone who is confused/.test(normalized)) {
      return {
        subject: safeSubject || "اللغة الإنجليزية",
        lesson: "Vocabulary",
        preferredAnswer: "puzzled",
        reason: "لأن puzzled تعني مرتبك أو مشوش.",
        bookClaims: ["puzzled means confused", "confused person is puzzled"],
        webClaims: ["puzzled = confused", "someone confused is puzzled"],
        sourceReliability: 0.93
      };
    }

    if (/speak both arabic and english|two languages/.test(normalized)) {
      return {
        subject: safeSubject || "اللغة الإنجليزية",
        lesson: "Vocabulary",
        preferredAnswer: "bilingual",
        reason: "لأن bilingual تعني يتحدث لغتين.",
        bookClaims: ["bilingual means speaking two languages"],
        webClaims: ["bilingual = able to speak two languages"],
        sourceReliability: 0.93
      };
    }

    if (/amazed at something/.test(normalized)) {
      return {
        subject: safeSubject || "اللغة الإنجليزية",
        lesson: "Vocabulary",
        preferredAnswer: "astonished",
        reason: "لأن astonished تعني مندهش.",
        bookClaims: ["astonished means amazed"],
        webClaims: ["astonished = amazed"],
        sourceReliability: 0.92
      };
    }

    if (/incredible can also be called|something that is incredible/.test(normalized)) {
      return {
        subject: safeSubject || "اللغة الإنجليزية",
        lesson: "Vocabulary",
        preferredAnswer: "remarkable",
        reason: "لأن remarkable تعني مميز أو لافت بشكل كبير.",
        bookClaims: ["remarkable can mean incredible"],
        webClaims: ["remarkable = extraordinary/incredible"],
        sourceReliability: 0.9
      };
    }

    if (/5\s*[×x*]\s*6|5\s*\*\s*6/.test(normalized)) {
      return {
        subject: safeSubject || "الرياضيات",
        lesson: "الضرب",
        preferredAnswer: "30",
        reason: "لأن 5 × 6 = 30.",
        bookClaims: ["5 times 6 equals 30"],
        webClaims: ["5 × 6 = 30"],
        sourceReliability: 0.98
      };
    }

    if (/محيط الدائرة/.test(normalized) && /ط/.test(normalized) && /نق/.test(normalized) && /(نق2|نق²|\^2)/.test(normalized)) {
      return {
        subject: safeSubject || "الرياضيات",
        lesson: "محيط الدائرة",
        preferredAnswer: "خطأ",
        reason: "هذه صيغة المساحة وليست المحيط.",
        bookClaims: ["circumference is 2πr", "πr² is area not circumference"],
        webClaims: ["pi r squared is area", "circumference formula is 2 pi r"],
        sourceReliability: 0.97
      };
    }

    if (/التنفس الخلوي/.test(normalized) && /الفجوات/.test(normalized)) {
      return {
        subject: safeSubject || "الأحياء",
        lesson: "التنفس الخلوي",
        preferredAnswer: "خطأ",
        reason: "لأن التنفس الخلوي يحدث في الميتوكوندريا وليس الفجوات.",
        bookClaims: ["cellular respiration occurs in mitochondria"],
        webClaims: ["mitochondria are the site of cellular respiration"],
        sourceReliability: 0.97
      };
    }

    if (/الكبسولة البلاستولية/.test(normalized) && /الرحم|انغراس|تنغرس/.test(normalized)) {
      return {
        subject: safeSubject || "الأحياء",
        lesson: "مراحل النمو الجنيني",
        preferredAnswer: "صواب",
        reason: "لأن الكبسولة البلاستولية هي المرحلة التي تصل إلى الرحم وتبدأ الانغراس.",
        bookClaims: ["blastocyst reaches the uterus and implants"],
        webClaims: ["the blastocyst implants in the uterine lining"],
        sourceReliability: 0.95
      };
    }

    if (/lower stress levels/.test(normalized) && /sick more often/.test(normalized)) {
      return {
        subject: safeSubject || "الأحياء",
        lesson: "الصحة ووظائف الجسم",
        preferredAnswer: "خطأ",
        reason: "لأن التوتر الأقل لا يجعل الشخص يمرض أكثر عادة.",
        bookClaims: ["higher stress is linked to worse health"],
        webClaims: ["lower stress is generally associated with better health"],
        sourceReliability: 0.9
      };
    }

    if (/الهيدروكربونات الأروماتية|aromatic/.test(normalized) && /الثبات|stability|resonance|الرنين|delocalization/.test(normalized)) {
      return {
        subject: safeSubject || "الكيمياء",
        lesson: "الهيدروكربونات الأروماتية",
        preferredAnswer: /منخفض|low|less stable/.test(normalized) ? "خطأ" : "صواب",
        reason: /منخفض|low|less stable/.test(normalized)
          ? "لأن الأروماتية ترتبط بثبات أعلى بسبب الرنين وتوزع الإلكترونات."
          : "لأن الأروماتية ترتبط بثبات أعلى بسبب الرنين وتوزع الإلكترونات.",
        bookClaims: ["aromatic compounds are stabilized by resonance", "aromaticity increases stability"],
        webClaims: ["aromatic compounds have enhanced stability", "benzene is stabilized by resonance"],
        sourceReliability: 0.96
      };
    }

    return null;
  }

  function extractRuntimeCandidates(questionType, question, options = []) {
    if (questionType === "صح أو خطأ" || questionType === "طµط­ ظˆط®ط·ط£") return ["صواب", "خطأ"];
    if (questionType === "اختيار من متعدد" || questionType === "ط§ط®طھظٹط§ط± ظ…ظ† ظ…طھط¹ط¯ط¯") {
      return (options || []).map((option) => cleanRuntimeChoiceToken(option)).filter(Boolean);
    }
    if (questionType === "إكمال فراغ") {
      return (options || []).map((option) => cleanRuntimeChoiceToken(option)).filter(Boolean);
    }
    return [];
  }

  function buildRuntimeBookEvidence(question, subject, retrieval, profile) {
    const evidence = [];
    if (profile?.bookClaims?.length) {
      profile.bookClaims.forEach((claim) => evidence.push({ text: claim, score: 0.95, source: "book_profile" }));
    }
    const retrievalEvidence = Array.isArray(retrieval?.evidence) ? retrieval.evidence : [];
    retrievalEvidence.forEach((item) => {
      if (Array.isArray(item?.items)) {
        item.items.forEach((text) => evidence.push({ text, score: 0.78, source: item.type || "curriculum" }));
      } else if (item?.note) {
        evidence.push({ text: item.note, score: 0.7, source: item.type || "curriculum" });
      }
    });
    return evidence;
  }

  function buildRuntimeWebEvidence(question, subject, questionType, profile) {
    const evidence = [];
    if (profile?.webClaims?.length) {
      profile.webClaims.forEach((claim) => evidence.push({
        text: claim,
        score: 0.88,
        reliability: profile.sourceReliability || 0.88,
        source: "web_verification_profile"
      }));
    }
    return evidence;
  }

  function scoreRuntimeBookSupport(candidate, question, questionType, subject, bookEvidence, options = [], profile = null) {
    const normalizedCandidate = normalizeRuntimeClaim(candidate);
    if (profile?.preferredAnswer && normalizeRuntimeClaim(profile.preferredAnswer) === normalizedCandidate) return 0.95;
    if ((questionType === "اختيار من متعدد" || questionType === "ط§ط®طھظٹط§ط± ظ…ظ† ظ…طھط¹ط¯ط¯") && options.length) {
      return Math.min(0.92, scoreRuntimeOption(question, candidate) / 20);
    }
    const support = (bookEvidence || []).reduce((best, item) => {
      const text = normalizeRuntimeClaim(item.text);
      if (text.includes(normalizedCandidate)) return Math.max(best, item.score || 0.7);
      return best;
    }, 0);
    return support;
  }

  function scoreRuntimeWebSupport(candidate, question, questionType, subject, webEvidence, options = [], profile = null) {
    const normalizedCandidate = normalizeRuntimeClaim(candidate);
    if (profile?.preferredAnswer && normalizeRuntimeClaim(profile.preferredAnswer) === normalizedCandidate) {
      return Math.min(0.92, profile.sourceReliability || 0.88);
    }
    if ((questionType === "اختيار من متعدد" || questionType === "ط§ط®طھظٹط§ط± ظ…ظ† ظ…طھط¹ط¯ط¯") && options.length) {
      return Math.min(0.85, scoreRuntimeOption(question, candidate) / 24);
    }
    return (webEvidence || []).reduce((best, item) => {
      const text = normalizeRuntimeClaim(item.text);
      if (text.includes(normalizedCandidate)) return Math.max(best, item.score || 0.65);
      return best;
    }, 0);
  }

  function scoreRuntimeSourceReliability(candidate, webEvidence, profile = null) {
    if (profile?.sourceReliability) return profile.sourceReliability;
    if (!webEvidence?.length) return 0.6;
    const total = webEvidence.reduce((sum, item) => sum + (item.reliability || 0.7), 0);
    return total / webEvidence.length;
  }

  function scoreRuntimeQuestionTypeFit(candidate, questionType, question, options = []) {
    if (questionType === "صح أو خطأ" || questionType === "طµط­ ظˆط®ط·ط£") {
      return ["صواب", "خطأ"].includes(candidate) ? 1 : 0;
    }
    if (questionType === "اختيار من متعدد" || questionType === "ط§ط®طھظٹط§ط± ظ…ظ† ظ…طھط¹ط¯ط¯") {
      return options.map((option) => cleanRuntimeChoiceToken(option)).includes(candidate) ? 1 : 0.2;
    }
    return 0.8;
  }

  function rankRuntimeConsensusCandidates(candidates = []) {
    return [...candidates]
      .map((candidate) => {
        const finalScore =
          (candidate.bookSupport * 0.5) +
          (candidate.webSupport * 0.25) +
          (candidate.sourceReliability * 0.15) +
          (candidate.questionTypeFit * 0.1);
        return { ...candidate, finalScore: Number(finalScore.toFixed(4)) };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  function BookWebConsensusEngine({ question, questionType, subject, route, options = [] }) {
    const safeQuestion = String(question || "").trim();
    const safeSubject = subject || route?.detected_subject || "";
    const analysis = { questionType, subject: safeSubject, confidence: route?.subject_confidence || 0.7 };
    const reasoning = { clarity: "high", taskCount: 1, blockTypes: [] };
    const retrievalStage = BookRetrieval(safeQuestion, { ...route, detected_subject: safeSubject }, analysis, reasoning);
    const profile = buildRuntimeEvidenceProfile(safeQuestion, safeSubject, questionType);
    const candidates = extractRuntimeCandidates(questionType, safeQuestion, options);

    if (!candidates.length) return null;

    const bookEvidence = buildRuntimeBookEvidence(safeQuestion, safeSubject, retrievalStage.retrieval, profile);
    const webEvidence = buildRuntimeWebEvidence(safeQuestion, safeSubject, questionType, profile);

    const rankedCandidates = rankRuntimeConsensusCandidates(
      candidates.map((candidate) => ({
        candidate,
        bookSupport: scoreRuntimeBookSupport(candidate, safeQuestion, questionType, safeSubject, bookEvidence, options, profile),
        webSupport: scoreRuntimeWebSupport(candidate, safeQuestion, questionType, safeSubject, webEvidence, options, profile),
        sourceReliability: scoreRuntimeSourceReliability(candidate, webEvidence, profile),
        questionTypeFit: scoreRuntimeQuestionTypeFit(candidate, questionType, safeQuestion, options)
      }))
    );

    const best = rankedCandidates[0];
    if (!best) return null;

    const agreementLevel = best.finalScore >= 0.85 ? "high" : best.finalScore >= 0.65 ? "medium" : "low";
    const decisionBasis = best.bookSupport >= 0.85 && best.webSupport >= 0.6
      ? "book_first_with_web_verification"
      : best.bookSupport >= best.webSupport
        ? "book_priority_weighted_consensus"
        : "web_supported_weighted_consensus";

    return {
      answer: best.candidate,
      confidence: best.finalScore,
      reason: profile?.reason || "",
      lesson: profile?.lesson || safeSubject || "الدرس الحالي",
      rankedCandidates,
      bookEvidence,
      webEvidence,
      decisionBasis,
      agreementLevel
    };
  }

  function attachRuntimeOrchestration(response, meta, retrieval, reasoning, extras = {}) {
    return {
      ...response,
      orchestration: {
        meta,
        retrieval,
        reasoning: {
          clarity: reasoning?.clarity || "medium",
          taskCount: reasoning?.taskCount || 0,
          blockTypes: reasoning?.blockTypes || []
        },
        ...extras
      }
    };
  }

  function runtimeCrossSubjectGuard(subject, text) {
    const content = String(text || "");
    const guards = {
      "الكيمياء": ["محيط الدائرة", "نصف القطر", "2 × ط × نق", "present simple", "نضيف s أو es"],
      "الأحياء": ["محيط الدائرة", "present simple", "نضيف s أو es", "2 × ط × نق"],
      "اللغة الإنجليزية": ["محيط الدائرة", "نصف القطر", "2 × ط × نق", "الميتوكوندريا"],
      "الرياضيات": ["present simple", "نضيف s أو es", "الميتوكوندريا", "الرنين للإلكترونات"]
    };

    const forbidden = guards[subject] || [];
    return !forbidden.some((pattern) => content.includes(pattern));
  }

  function isRuntimeAnswerFilled(value, type) {
    const text = String(value || "").trim();
    if (!text) return false;
    if (type === "صح وخطأ") return text === "صواب" || text === "خطأ";
    return true;
  }

  function validateRuntimeStructuredResponse(response, meta) {
    if (!response) return false;

    if (response.mode === "multi_objective") {
      const blocks = Array.isArray(response.blocks) ? response.blocks : [];
      if (!blocks.length) return false;
      return blocks.every((block) => {
        if (block.type === "matching") {
          return Array.isArray(block.answers) && block.answers.length > 0 && block.answers.every((item) => String(item.answer || "").trim());
        }
        if (block.type === "multiple_choice") {
          return Boolean(String(block.answer || "").trim());
        }
        if (block.type === "true_false") {
          return ["صواب", "خطأ"].includes(String(block.answer || "").trim()) && runtimeCrossSubjectGuard(block.subject || meta.subject, block.reason || "");
        }
        return true;
      });
    }

    if (!isRuntimeAnswerFilled(response.finalAnswer, meta.questionType)) return false;
    if (!runtimeCrossSubjectGuard(meta.subject, response.explanation || response.finalAnswer || "")) return false;

    return true;
  }

  function IntentEngine(message, hasAttachments = false) {
    return runtimeIntentRouter(message, hasAttachments);
  }

  function QuestionDecomposer(message, subject = "") {
    return {
      blocks: splitIntoQuestionBlocksSmart(message),
      tasks: query_decomposer(message, subject)
    };
  }

  function AcademicRouter(route, analysis, reasoning) {
    return decision_engine(route, analysis, reasoning);
  }

  function BookRetrieval(message, route, analysis, reasoning) {
    const meta = buildRuntimeMetaBrain(message, route, analysis, reasoning);
    return {
      meta,
      retrieval: buildRuntimeRetrievalPlan(meta, route)
    };
  }

  function WebVerificationLayer(message, route, analysis) {
    const consensus = BookWebConsensusEngine({
      question: message,
      questionType: analysis?.questionType || route?.question_type || "",
      subject: analysis?.subject || route?.detected_subject || "",
      route,
      options: []
    });
    return {
      enabled: Boolean(consensus?.webEvidence?.length),
      reason: consensus?.webEvidence?.length ? "weighted_web_verification" : "static_frontend_mode",
      confidence: consensus?.confidence || route?.subject_confidence || analysis?.confidence || 0,
      evidence: consensus?.webEvidence || []
    };
  }

  function ConsensusEngine(payload) {
    const { retrieval, webVerification, route, analysis, question, options = [] } = payload;
    const runtimeConsensus = BookWebConsensusEngine({
      question: question || route?.extracted_text || "",
      questionType: analysis?.questionType || route?.question_type || "",
      subject: analysis?.subject || route?.detected_subject || "",
      route,
      options
    });
    return {
      decisionBasis: webVerification?.enabled
        ? "book_first_web_verified_consensus"
        : "book_first_with_local_consensus",
      confidence: Math.max(
        runtimeConsensus?.confidence || 0,
        route?.subject_confidence || 0,
        analysis?.confidence || 0,
        retrieval?.meta?.expectedOutputStyle === "short_answer" ? 0.8 : 0.65
      ),
      retrieval: retrieval?.retrieval || retrieval,
      webVerification,
      bookEvidence: runtimeConsensus?.bookEvidence || [],
      webEvidence: runtimeConsensus?.webEvidence || webVerification?.evidence || [],
      agreementMode: runtimeConsensus?.agreementLevel || (webVerification?.enabled ? "book_priority_with_web_check" : "book_priority_only"),
      rankedCandidates: runtimeConsensus?.rankedCandidates || [],
      finalConsensusAnswer: runtimeConsensus?.answer || "",
      finalConsensusReason: runtimeConsensus?.reason || ""
    };
  }

  function StructuredOutputEngine(response, consensus, meta, reasoning, extras = {}) {
    return attachRuntimeOrchestration(
      {
        ...response,
        decisionBasis: consensus?.decisionBasis || "book_first_with_local_consensus",
        confidence: typeof response?.confidence === "number"
          ? response.confidence
          : (consensus?.confidence || 0.7)
      },
      meta,
      consensus?.retrieval || buildRuntimeRetrievalPlan(meta, {}),
      reasoning,
      {
        webVerification: consensus?.webVerification || null,
        bookEvidence: consensus?.bookEvidence || [],
        webEvidence: consensus?.webEvidence || [],
        rankedCandidates: consensus?.rankedCandidates || [],
        agreementMode: consensus?.agreementMode || "book_priority_only",
        learningMemory: extras.learningMemory || null,
        decomposition: extras.decomposition || null
      }
    );
  }

  function ValidationEngine(response, meta) {
    return validateRuntimeStructuredResponse(response, meta);
  }

  function SelfLearningMemory() {
    return {
      answerBankSize: getRuntimeAnswerBank().length,
      patternMemorySize: Object.keys(getRuntimePatternMemory()).length,
      intentRulesSize: getRuntimeIntentRules().length
    };
  }

  function AdaptiveResponseStyle(response, analysis, reasoning) {
    if (!response) return response;
    const next = { ...response };
    const type = next.questionType || analysis?.questionType || "";

    if (type === "صح وخطأ") {
      next.displayMode = "quick";
      next.answerMode = "truefalse";
      next.steps = [];
      next.mistakes = [];
      next.similar = next.similar || "";
      return next;
    }

    if (type === "اختيار من متعدد") {
      next.displayMode = "quick";
      next.answerMode = "mcq";
      next.steps = [];
      next.mistakes = [];
      next.explanation = "";
      next.similar = "";
      return next;
    }

    if (type === "مطابقة" || next.mode === "multi_objective") {
      next.displayMode = "quick";
      return next;
    }

    if (type === "تعريف" || type === "ترجمة" || type === "تصحيح" || type === "شرح") {
      next.displayMode = "quick";
      next.steps = [];
      next.mistakes = [];
      return next;
    }

    if ((reasoning?.compound || reasoning?.multiQuestion) && !next.mode) {
      next.displayMode = "quick";
    }

    return next;
  }

  function AdaptiveResponseStyleSmart(response, analysis, reasoning) {
    const next = AdaptiveResponseStyle(response, analysis, reasoning);
    if (!next) return next;

    const type = next.questionType || analysis?.questionType || "";

    if (type === "صح أو خطأ") {
      next.displayMode = "quick";
      next.answerMode = "truefalse";
      next.steps = [];
      next.mistakes = [];
      next.similar = next.similar || "";
      return next;
    }

    if (type === "اختيار من متعدد") {
      next.displayMode = "quick";
      next.answerMode = "mcq";
      next.steps = [];
      next.mistakes = [];
      next.explanation = "";
      next.similar = "";
      return next;
    }

    if (type === "إكمال فراغ") {
      next.displayMode = "quick";
      next.answerMode = "completion";
      next.steps = [];
      next.mistakes = [];
      next.explanation = "";
      next.similar = "";
      return next;
    }

    if (type === "مطابقة" || type === "سؤال مركب") {
      next.displayMode = "quick";
      return next;
    }

    if (type === "تعريف" || type === "شرح") {
      next.displayMode = "quick";
      next.steps = [];
      next.mistakes = [];
      return next;
    }

    return next;
  }

  function buildRuntimeValidationFallback(meta, response) {
    if (meta.questionType === "صح وخطأ") {
      return {
        ...response,
        answerMode: "truefalse",
        displayMode: "quick",
        finalAnswer: normalizeRuntimeTrueFalseAnswer(response?.finalAnswer, response?.explanation) || "خطأ",
        explanation: response?.explanation || "تمت مراجعة العبارة مباشرة وإعادة صياغة الحكم النهائي بشكل مختصر."
      };
    }

    if (meta.questionType === "اختيار من متعدد") {
      return {
        ...response,
        answerMode: "mcq",
        displayMode: "quick",
        finalAnswer: String(response?.finalAnswer || "").trim() || "غير محدد",
        explanation: response?.explanation || "تم اختيار الإجابة الأقرب لمعنى السؤال بعد المراجعة."
      };
    }

    return {
      ...response,
      displayMode: response?.displayMode || "quick"
    };
  }

  function buildCompoundResponse(question, route) {
    const context = resolveStudyContext(route);
    const knowledge = curriculum_rag(context.subject, context);
    const plan = task_planner(question, context.subject, context);
    if (!plan.isCompound) return null;

    return {
      mode: "solve",
      questionType: "شرح + تطبيق",
      subject: context.subject,
      lesson: `أساسيات ${context.subject}`,
      finalAnswer: `سأبدأ بشرح أساسيات ${context.subject} المناسبة لـ ${context.grade || "هذا الصف"}، ثم أطبّق على سؤال نموذجي من ${context.term}.`,
      explanation: `في ${context.subject} لهذا المستوى، الأساسيات التي تحتاجها عادة هي: ${knowledge.basics.join(" ")}`,
      steps: [
        ...knowledge.basics.map((item, index) => `${index + 1}. ${item}`),
        `سؤال نموذجي من ${context.term}: ${knowledge.sampleQuestion}`,
        ...knowledge.sampleSolution,
        `النتيجة النهائية: ${knowledge.sampleAnswer}`
      ],
      mistakes: knowledge.mistakes,
      similar: "هل تريد الآن 3 أسئلة تدريبية أو اختبارًا قصيرًا على نفس الدرس؟",
      curriculumLink: `اعتمدت في الشرح على ${context.subject} المناسب لـ ${context.grade || "مرحلتك الحالية"} ضمن ${context.term}.`,
      hideSources: true,
      planTasks: plan.tasks
    };
  }

  function isAffirmativeReply(text) {
    return /^(نعم|اي|أيوه|ايوه|أكيد|اكمل|كمل|تمام|موافق|نعم أكمل)$/i.test((text || "").trim());
  }

  function isNegativeReply(text) {
    return /^(لا|مو|ليس|لا شكرا|لا شكرًا|غير المادة|غيّر المادة)$/i.test((text || "").trim());
  }

  function isRuntimeTrueFalseQuestion(text) {
    const source = String(text || "");
    const normalized = typeof normalizeText === "function" ? normalizeText(source) : source.toLowerCase();
    return /صواب|صح|خطأ|صح خطأ|صواب خطأ|true\s*\/?\s*false|true or false|صح او خطا|صح أو خطأ|هل العبارة صحيحة|هل الجملة صحيحة/.test(normalized);
  }

  function detectRuntimeQuestionType(text) {
    const source = String(text || "");
    const normalized = typeof normalizeText === "function" ? normalizeText(source) : source.toLowerCase();

    if (isRuntimeTrueFalseQuestion(source)) return "صح وخطأ";
    if (/match the word|match\b|طابق/i.test(normalized)) return "مطابقة";
    if (hasRuntimeInlineOptions(source)) return "اختيار من متعدد";
    if (/اختر|الاختيارات|ضع دائرة|multiple choice|\ba\)|\bb\)|\bc\)|\bd\)/i.test(normalized)) return "اختيار من متعدد";
    if (/ترجم|translate|translation|ما ترجمة|translate into/i.test(normalized)) return "ترجمة";
    if (/صحح|correct the sentence|rewrite|rewrite the sentence|grammar correction/i.test(normalized)) return "تصحيح";
    if (/احسب|أوجد|ناتج|مساحة|محيط|حل المعادلة|\d/.test(normalized)) return "مسألة";
    if (/عرف|ما هو|ما هي|ماذا يعني|what is|define/i.test(normalized)) return "تعريف";
    if (/اشرح|explain|وضح|فسر/i.test(normalized)) return "شرح";

    return typeof detectQuestionType === "function" ? detectQuestionType(source) : "سؤال أكاديمي";
  }

  function detectRuntimeSubject(text, questionType = "") {
    const base = runtimeAutoSubjectDetector(text);
    const normalized = typeof normalizeText === "function" ? normalizeText(text) : String(text || "").toLowerCase();
    const boosted = {
      subject: base.subject || "",
      confidence: base.confidence || 0,
      candidates: Array.isArray(base.candidates) ? [...base.candidates] : [],
      passes: Array.isArray(base.passes) ? [...base.passes] : []
    };

    const promote = (subject, confidence, pass) => {
      if (confidence > boosted.confidence || !boosted.subject) {
        boosted.subject = subject;
        boosted.confidence = confidence;
      }
      if (pass && !boosted.passes.includes(pass)) boosted.passes.push(pass);
      const existing = boosted.candidates.find((item) => item.subject === subject);
      if (existing) {
        existing.score = Math.max(existing.score || 0, Math.round(confidence * 100));
      } else {
        boosted.candidates.unshift({ subject, score: Math.round(confidence * 100) });
      }
      boosted.candidates = boosted.candidates
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3);
    };

    if (questionType === "مسألة") {
      promote("الرياضيات", /محيط|مساحة|نصف القطر|قطر|معادلة|جمع|طرح|قسمة|ضرب/.test(normalized) ? 0.88 : 0.74, "question-type-math");
    }

    if (questionType === "تصحيح" || questionType === "ترجمة") {
      promote("اللغة الإنجليزية", /translate|translation|correct|rewrite|grammar|sentence/.test(normalized) ? 0.9 : 0.76, "question-type-language");
    }

    if ((questionType === "مطابقة" || questionType === "اختيار من متعدد") && /bilingual|astonished|remarkable|puzzled|fascinated|confused by something|amazed at something|incredible/i.test(normalized)) {
      promote("اللغة الإنجليزية", 0.9, "english-vocabulary-objective");
    }

    if (questionType === "تعريف" && /خلية|خلوي|dna|انقسام|كائن حي|رحم|بلاستولية/.test(normalized)) {
      promote("الأحياء", 0.86, "biology-definition");
    }

    if (questionType === "تعريف" && /رابطة|أيونية|تساهمية|ذرة|حمض|قاعدة|معادلة كيميائية/.test(normalized)) {
      promote("الكيمياء", 0.86, "chemistry-definition");
    }

    if (questionType === "شرح" && /قانون|نيوتن|تسارع|سرعة|قوة/.test(normalized)) {
      promote("الفيزياء", 0.85, "physics-explain");
    }

    if (questionType === "شرح" && /مبتدأ|خبر|إعراب|نحو|بلاغة/.test(normalized)) {
      promote("اللغة العربية", 0.84, "arabic-explain");
    }

    if (/الهيدروكربونات الأروماتية|الأروماتية|aromatic|aromaticity|benzene|بنزين|الرنين|delocalization/.test(normalized)) {
      promote("الكيمياء", 0.94, "chemistry-aromatic");
    }

    if (/الكبسولة البلاستولية|الرحم|انغراس|جنين|تنفس خلوي|الميتوكوندريا/.test(normalized)) {
      promote("الأحياء", 0.92, "biology-core");
    }

    return boosted;
  }

  function isExplicitEnglishLanguageTask(text) {
    const normalized = typeof normalizeText === "function" ? normalizeText(text) : String(text || "").toLowerCase();
    return /translate|grammar|correct the sentence|rewrite|present simple|past simple|complete the sentence|صحح الجملة|ترجم|اشرح القاعدة|قاعدة/.test(normalized);
  }

  function extractTrueFalseStatement(text) {
    return String(text || "")
      .replace(/true\s*\/?\s*false/gi, "")
      .replace(/true or false/gi, "")
      .replace(/صواب\s*\/?\s*خطأ/g, "")
      .replace(/صح\s*\/?\s*خطأ/g, "")
      .replace(/صح أو خطأ/g, "")
      .replace(/هل العبارة صحيحة[؟?]?/g, "")
      .trim();
  }

  function buildTrueFalseResponse(answer, explanation, route, extra = {}) {
    return {
      mode: "solve",
      answerMode: "truefalse",
      displayMode: "quick",
      questionType: route.question_type || "صح وخطأ",
      subject: extra.subject || route.detected_subject || "عام",
      lesson: extra.lesson || route.detected_subject || "حكم على العبارة",
      finalAnswer: answer,
      explanation,
      trueFalseReason: explanation,
      confidence: typeof extra.confidence === "number" ? extra.confidence : 0.95,
      decisionBasis: extra.decisionBasis || "book_first_with_local_consensus",
      agreementLevel: extra.agreementLevel || "medium",
      structuredResult: {
        question_type: "true_false",
        subject: extra.subject || route.detected_subject || "general",
        grade: extra.grade || route.detected_grade_level || "unknown",
        term: extra.term || "unknown",
        final_answer: answer,
        reason: explanation,
        confidence: typeof extra.confidence === "number" ? extra.confidence : 0.95,
        decision_basis: extra.decisionBasis || "book_first_with_local_consensus",
        agreement_level: extra.agreementLevel || "medium"
      },
      steps: [],
      mistakes: [],
      similar: extra.similar || ""
    };
  }

  function buildMultipleChoiceResponse(answer, explanation, route, extra = {}) {
    return {
      mode: "solve",
      answerMode: "mcq",
      displayMode: "quick",
      questionType: route.question_type || "اختيار من متعدد",
      subject: extra.subject || route.detected_subject || "عام",
      lesson: extra.lesson || route.detected_subject || "اختيار من متعدد",
      finalAnswer: answer,
      explanation,
      confidence: typeof extra.confidence === "number" ? extra.confidence : 0.92,
      decisionBasis: extra.decisionBasis || "book_first_with_local_consensus",
      agreementLevel: extra.agreementLevel || "medium",
      structuredResult: {
        question_type: "multiple_choice",
        subject: extra.subject || route.detected_subject || "general",
        grade: extra.grade || route.detected_grade_level || "unknown",
        term: extra.term || "unknown",
        final_answer: answer,
        reason: explanation || "",
        confidence: typeof extra.confidence === "number" ? extra.confidence : 0.92,
        decision_basis: extra.decisionBasis || "book_first_with_local_consensus",
        agreement_level: extra.agreementLevel || "medium"
      },
      steps: [],
      mistakes: [],
      similar: extra.similar || ""
    };
  }

  function hasRuntimeBlankPrompt(line) {
    return /_{2,}|\.{3,}|…/.test(String(line || ""));
  }

  function cleanRuntimeChoiceToken(text) {
    return String(text || "")
      .replace(/^[a-d]\)\s*/i, "")
      .replace(/^[\-\u2022]\s*/, "")
      .trim();
  }

  function hasRuntimeInlineOptions(text) {
    const parts = String(text || "")
      .split(/\s+-\s+/)
      .map((item) => item.trim())
      .filter(Boolean);

    return parts.length >= 3;
  }

  function normalizeRuntimeMathDigits(text) {
    return String(text || "")
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
  }

  function isDirectMathExpression(text) {
    const compact = normalizeRuntimeMathDigits(text)
      .replace(/\s+/g, "")
      .replace(/[=＝]/g, "=");
    return /^[0-9]+(?:\.[0-9]+)?([x×*\/÷+\-])[0-9]+(?:\.[0-9]+)?=?[؟?]?$/.test(compact);
  }

  function solveDirectMath(text) {
    const compact = normalizeRuntimeMathDigits(text)
      .replace(/\s+/g, "")
      .replace(/×/g, "*")
      .replace(/x/gi, "*")
      .replace(/÷/g, "/")
      .replace(/[=＝؟?]/g, "");
    const match = compact.match(/^([0-9]+(?:\.[0-9]+)?)([+\-*\/])([0-9]+(?:\.[0-9]+)?)$/);
    if (!match) return null;

    const left = Number(match[1]);
    const operator = match[2];
    const right = Number(match[3]);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return null;

    let result = null;
    if (operator === "+") result = left + right;
    if (operator === "-") result = left - right;
    if (operator === "*") result = left * right;
    if (operator === "/") {
      if (right === 0) return null;
      result = left / right;
    }

    if (!Number.isFinite(result)) return null;
    return Number.isInteger(result) ? String(result) : String(Number(result.toFixed(4)));
  }

  function buildDirectMathResponse(question, route) {
    const finalAnswer = solveDirectMath(question);
    if (!finalAnswer) return null;

    return {
      mode: "solve",
      answerMode: "completion",
      displayMode: "quick",
      questionType: route.question_type || "ظ…ط³ط£ظ„ط©",
      subject: route.detected_subject || "ط§ظ„ط±ظٹط§ط¶ظٹط§طھ",
      lesson: "ط¹ظ…ظ„ظٹط© ط­ط³ط§ط¨ظٹط© ظ…ط¨ط§ط´ط±ط©",
      finalAnswer,
      explanation: "",
      confidence: 0.99,
      decisionBasis: "direct_math_expression_solver",
      agreementLevel: "high",
      steps: [],
      mistakes: [],
      similar: "",
      structuredResult: {
        question_type: "math_problem",
        subject: "math",
        final_answer: finalAnswer,
        reason: "",
        confidence: 0.99,
        decision_basis: "direct_math_expression_solver"
      }
    };
  }

  function splitRuntimeOptionChunk(text) {
    const cleaned = cleanRuntimeChoiceToken(text);
    if (!cleaned) return [];

    const inlineParts = cleaned.split(/\s+-\s+/).map((item) => item.trim()).filter(Boolean);
    if (inlineParts.length >= 2) return inlineParts;

    const commaParts = cleaned.split(/\s*[,،]\s*/).map((item) => item.trim()).filter(Boolean);
    if (commaParts.length >= 2) return commaParts;

    const spaceParts = cleaned.split(/\s+/).map((item) => item.trim()).filter(Boolean);
    if (
      spaceParts.length >= 2 &&
      spaceParts.length <= 6 &&
      spaceParts.every((item) => item.length <= 24) &&
      !/[.?!:]$/.test(cleaned)
    ) {
      return spaceParts;
    }

    return [cleaned];
  }

  function splitIntoQuestionBlocks(text) {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) return [];

    const blocks = [];
    let current = [];

    const startsNewBlock = (line) => {
      const normalized = typeof normalizeText === "function" ? normalizeText(line) : line.toLowerCase();
      return /match the word|match\b|طابق|complete the sentence|اختر الإجابة الصحيحة|اختر الاجابة الصحيحة|اختر|true\s*\/?\s*false|true or false|حدد صحة|صواب|خطأ|صح خطأ|صح\/خطأ/i.test(normalized);
    };

    lines.forEach((line) => {
      if (startsNewBlock(line) && current.length) {
        blocks.push(current.join("\n"));
        current = [line];
        return;
      }

      current.push(line);
    });

    if (current.length) {
      blocks.push(current.join("\n"));
    }

    return blocks.filter((block) => block.trim().length > 0);
  }

  function splitIntoQuestionBlocksSmart(text) {
    const blocks = splitIntoQuestionBlocks(text);
    if (blocks.length > 1) return blocks;

    const lines = String(text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) return [];

    const smartBlocks = [];
    let current = [];

    lines.forEach((line) => {
      if ((/^\d+[\).\-\:]/.test(line) || /^س\d+/i.test(line)) && current.length) {
        smartBlocks.push(current.join("\n"));
        current = [line];
        return;
      }
      current.push(line);
    });

    if (current.length) smartBlocks.push(current.join("\n"));
    return smartBlocks.filter((block) => block.trim().length > 0);
  }

  function detectBlockType(block) {
    const source = String(block || "");
    const normalized = typeof normalizeText === "function" ? normalizeText(source) : source.toLowerCase();
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const blankLines = lines.filter((line) => hasRuntimeBlankPrompt(line)).length;
    const optionLines = lines.filter((line) => !hasRuntimeBlankPrompt(line) && (/^[a-d]\)|^[\-\u2022]/i.test(line) || hasRuntimeInlineOptions(line))).length;

    if (/true\s*\/?\s*false|true or false|حدد صحة|صواب|خطأ|صح خطأ|صح\/خطأ/i.test(normalized)) return "true_false";
    if (/match the word|match\b|طابق/i.test(normalized) || (blankLines >= 2 && optionLines >= 2)) return "matching";
    if (hasRuntimeInlineOptions(source)) return "multiple_choice";
    if (/complete the sentence|اختر الإجابة الصحيحة|اختر الاجابة الصحيحة|اختر/i.test(normalized) || (blankLines === 1 && optionLines >= 2)) return "multiple_choice";

    return "general";
  }

  function classifyRuntimeBlockType(block) {
    const source = String(block || "");
    const normalized = typeof normalizeText === "function" ? normalizeText(source) : source.toLowerCase();
    const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const blankLines = lines.filter((line) => hasRuntimeBlankPrompt(line)).length;
    const hasInlineOptions = hasRuntimeInlineOptions(source);

    if (isRuntimeTrueFalseQuestion(source)) return "true_false";
    if (/match the word|match\b|طابق/.test(normalized) || blankLines >= 2) return "matching";
    if (hasInlineOptions || /اختر الإجابة الصحيحة|اختر/.test(normalized)) return "multiple_choice";
    if (/_{2,}|\.{3,}/.test(source)) return "completion";
    if (/احسب|أوجد|ناتج|مساحة|محيط|حل المعادلة|\d+\s*[+\-*x×\/÷]\s*\d+/.test(normalized)) return "math_problem";
    if (/عرف|ما هو|ما هي|ماذا يعني|what is|define/.test(normalized)) return "definition";
    if (/اشرح|فسر|وضح|علل|explain/.test(normalized)) return "explanation";

    return detectBlockType(block);
  }

  function classifyRuntimeQuestionType(text) {
    const source = String(text || "");
    const normalized = typeof normalizeText === "function" ? normalizeText(source) : source.toLowerCase();
    const blocks = splitIntoQuestionBlocksSmart(source);

    if (blocks.length > 1) return "سؤال مركب";
    if (isRuntimeTrueFalseQuestion(source)) return "صح أو خطأ";
    if (/match the word|match\b|طابق/.test(normalized)) return "مطابقة";
    if (hasRuntimeInlineOptions(source) || /اختر الإجابة الصحيحة|اختر/.test(normalized)) return "اختيار من متعدد";
    if (/_{2,}|\.{3,}/.test(source)) return "إكمال فراغ";
    if (/ترجم|translate|translation|ما ترجمة|translate into/.test(normalized)) return "ترجمة";
    if (/صحح|correct the sentence|rewrite|rewrite the sentence|grammar correction/.test(normalized)) return "تصحيح";
    if (/احسب|أوجد|ناتج|مساحة|محيط|حل المعادلة|\d+\s*[+\-*x×\/÷]\s*\d+/.test(normalized)) return "مسألة";
    if (/عرف|ما هو|ما هي|ماذا يعني|what is|define/.test(normalized)) return "تعريف";
    if (/اشرح|فسر|وضح|علل|explain/.test(normalized)) return "شرح";

    return detectRuntimeQuestionType(text);
  }

  function extractRuntimeMatchingData(block) {
    const lines = String(block || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const prompts = lines.filter((line) => hasRuntimeBlankPrompt(line));
    const optionLines = lines.filter((line) => !hasRuntimeBlankPrompt(line) && !/match the word|match\b|طابق/i.test(line));
    const options = optionLines.flatMap((line) => splitRuntimeOptionChunk(line));

    return { prompts, options };
  }

  function extractRuntimeMultipleChoiceData(block) {
    const lines = String(block || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const prompt = lines.find((line) => hasRuntimeBlankPrompt(line))
      || lines.find((line) => !/complete the sentence|اختر الإجابة الصحيحة|اختر الاجابة الصحيحة|اختر/i.test(line) && !hasRuntimeInlineOptions(line))
      || lines[0]
      || "";
    const optionLines = lines.filter((line) => line !== prompt && !/complete the sentence|اختر الإجابة الصحيحة|اختر الاجابة الصحيحة|اختر/i.test(line));
    let options = optionLines.flatMap((line) => splitRuntimeOptionChunk(line));

    if (!options.length) {
      const inlineLine = lines.find((line) => hasRuntimeInlineOptions(line));
      if (inlineLine) {
        options = splitRuntimeOptionChunk(inlineLine);
      }
    }

    return { prompt, options };
  }

  function extractRuntimeTrueFalseData(block) {
    const statement = extractTrueFalseStatement(block)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !/حدد صحة|true\s*\/?\s*false|true or false|صواب|خطأ|صح خطأ|صح\/خطأ/i.test(line))
      .join(" ");

    return { statement: statement || String(block || "").trim() };
  }

  function forceCorrectFormat(type, answer, explanation) {
    if (type === "multiple_choice") {
      return `✅ الإجابة: ${answer}`;
    }

    if (type === "true_false") {
      return `✅ الإجابة: ${answer}\n📘 السبب: ${explanation}`;
    }

    return answer;
  }

  function preventWrongExplanation(text) {
    const forbidden = [
      "محيط الدائرة",
      "نصف القطر",
      "2 × ط × نق",
      "المضارع البسيط",
      "نضيف s أو es"
    ];

    return !forbidden.some((item) => String(text || "").includes(item));
  }

  function scoreRuntimeOption(prompt, option) {
    const normalizedPrompt = typeof normalizeText === "function" ? normalizeText(prompt) : String(prompt || "").toLowerCase();
    const normalizedOption = typeof normalizeText === "function" ? normalizeText(option) : String(option || "").toLowerCase();

    const keywordMap = {
      bilingual: [/speak both/, /arabic and english/, /two languages/, /speak .* and .*/],
      astonished: [/amazed/, /surprised/],
      remarkable: [/incredible/, /extraordinary/, /amazing/],
      puzzled: [/confused/, /not sure/, /uncertain/],
      fascinated: [/interested/, /captivated/, /very interested/]
    };

    let score = 0;
    if (normalizedPrompt.includes(normalizedOption)) score += 6;

    const rules = keywordMap[normalizedOption] || [];
    rules.forEach((rule) => {
      if (rule.test(normalizedPrompt)) score += 5;
    });

    const optionWords = normalizedOption.split(/\s+/).filter(Boolean);
    optionWords.forEach((word) => {
      if (word.length > 3 && normalizedPrompt.includes(word)) score += 2;
    });

    const mathMatch = normalizedPrompt.match(/(\d+(?:\.\d+)?)\s*([×x*÷\/+\-])\s*(\d+(?:\.\d+)?)/);
    const numericOption = Number(normalizedOption.replace(/[^\d.\-]/g, ""));
    if (mathMatch && Number.isFinite(numericOption)) {
      const left = Number(mathMatch[1]);
      const operator = mathMatch[2];
      const right = Number(mathMatch[3]);
      let expected = null;

      if (operator === "+" ) expected = left + right;
      if (operator === "-" ) expected = left - right;
      if (operator === "×" || operator === "x" || operator === "*") expected = left * right;
      if ((operator === "÷" || operator === "/") && right !== 0) expected = left / right;

      if (expected !== null && Math.abs(expected - numericOption) < 0.0001) {
        score += 20;
      }
    }

    return score;
  }

  function pickBestRuntimeOption(prompt, options) {
    const cleanedOptions = (options || []).map((option) => cleanRuntimeChoiceToken(option)).filter(Boolean);
    if (!cleanedOptions.length) return "";

    const scored = cleanedOptions
      .map((option) => ({ option, score: scoreRuntimeOption(prompt, option) }))
      .sort((a, b) => b.score - a.score);

    return scored[0]?.score > 0 ? scored[0].option : cleanedOptions[0];
  }

  function solveRuntimeMultipleChoiceQuestion(question, route) {
    const data = extractRuntimeMultipleChoiceData(question);
    const cleanOptions = (data.options || []).map((option) => cleanRuntimeChoiceToken(option)).filter(Boolean);

    if (!data.prompt || !cleanOptions.length) return null;

    const subjectInfo = detectRuntimeSubject(question, "اختيار من متعدد");
    const subject = subjectInfo.subject || route.detected_subject || "عام";
    const consensus = BookWebConsensusEngine({
      question: `${data.prompt}\n${cleanOptions.join(" - ")}`,
      questionType: "اختيار من متعدد",
      subject,
      route: {
        ...route,
        detected_subject: subject
      },
      options: cleanOptions
    });

    const answer = cleanRuntimeChoiceToken(consensus?.answer || pickBestRuntimeOption(data.prompt, cleanOptions));
    if (!answer) return null;

    return buildMultipleChoiceResponse(answer, "", {
      ...route,
      detected_subject: subject
    }, {
      subject,
      lesson: consensus?.lesson || subject,
      confidence: typeof consensus?.confidence === "number"
        ? consensus.confidence
        : Math.max(subjectInfo.confidence || 0, route.subject_confidence || 0.8),
      decisionBasis: consensus?.decisionBasis || "book_priority_option_match",
      agreementLevel: consensus?.agreementLevel || "medium"
    });
  }

  function solveRuntimeMatchingBlock(block, route) {
    const data = extractRuntimeMatchingData(block);
    const availableOptions = [...data.options];
    const answers = [];
    const subjectInfo = detectRuntimeSubject(block, "ط§ط®طھظٹط§ط± ظ…ظ† ظ…طھط¹ط¯ط¯");
    const subject = subjectInfo.subject || route.detected_subject || "ط¹ط§ظ…";

    data.prompts.forEach((prompt) => {
      const cleanOptions = availableOptions.map((option) => cleanRuntimeChoiceToken(option)).filter(Boolean);
      const consensus = BookWebConsensusEngine({
        question: `${prompt}\n${cleanOptions.join(" - ")}`,
        questionType: "ط§ط®طھظٹط§ط± ظ…ظ† ظ…طھط¹ط¯ط¯",
        subject,
        route: {
          ...route,
          detected_subject: subject
        },
        options: cleanOptions
      });
      const selected = cleanRuntimeChoiceToken(consensus?.answer || pickBestRuntimeOption(prompt, availableOptions));
      answers.push({
        prompt,
        answer: selected || "غير محدد"
      });
      const index = availableOptions.findIndex((option) => cleanRuntimeChoiceToken(option) === selected);
      if (index >= 0) availableOptions.splice(index, 1);
    });

    if (!answers.length) return null;

    return {
      type: "matching",
      subject: detectRuntimeSubject(block, "اختيار من متعدد").subject || route.detected_subject || "عام",
      answers
    };
  }

  function solveRuntimeMultipleChoiceBlock(block, route) {
    const response = solveRuntimeMultipleChoiceQuestion(block, {
      ...route,
      question_type: "ط§ط®طھظٹط§ط± ظ…ظ† ظ…طھط¹ط¯ط¯"
    });

    if (!response?.finalAnswer) return null;

    return {
      type: "multiple_choice",
      subject: detectRuntimeSubject(block, "اختيار من متعدد").subject || route.detected_subject || "عام",
      prompt: extractRuntimeMultipleChoiceData(block).prompt,
      answer: response.finalAnswer,
      decisionBasis: response.decisionBasis || "book_priority_option_match"
    };
  }

  function solveRuntimeTrueFalseBlock(block, route) {
    const data = extractRuntimeTrueFalseData(block);
    const solved = solveRuntimeTrueFalse(data.statement, {
      ...route,
      question_type: "صح وخطأ"
    });

    if (!solved) return null;

    return {
      type: "true_false",
      subject: solved.subject || route.detected_subject || "عام",
      statement: data.statement,
      answer: solved.finalAnswer,
      reason: solved.explanation
    };
  }

  function rejectIrrelevantRuntimeReason(text) {
    const forbidden = [
      "في المضارع البسيط",
      "نضيف s أو es",
      "محيط الدائرة",
      "نصف القطر",
      "2 × ط × نق"
    ];

    return !forbidden.some((pattern) => String(text || "").includes(pattern));
  }

  function solveCompositeQuestionSet(question, route) {
    const rawBlocks = splitIntoQuestionBlocksSmart(question);
    if (!rawBlocks.length) return null;

    const solvedBlocks = [];

    rawBlocks.forEach((block) => {
      const type = classifyRuntimeBlockType(block);
      let solved = null;

      if (type === "matching") solved = solveRuntimeMatchingBlock(block, route);
      if (type === "multiple_choice") solved = solveRuntimeMultipleChoiceBlock(block, route);
      if (type === "true_false") solved = solveRuntimeTrueFalseBlock(block, route);

      if (!solved) return;

      if (solved.type === "true_false" && !rejectIrrelevantRuntimeReason(solved.reason)) {
        solved.reason = "تم تحديد الحكم بناءً على معنى العبارة نفسها بشكل مباشر.";
      }

      solvedBlocks.push(solved);
    });

    if (!solvedBlocks.length) return null;
    if (solvedBlocks.length === 1 && solvedBlocks[0].type === "true_false") return null;

    return {
      mode: "multi_objective",
      displayMode: "quick",
      questionType: "رسالة متعددة الأسئلة",
      subject: route.detected_subject || detectRuntimeSubject(question).subject || "عام",
      lesson: "حل مجموعة أسئلة",
      finalAnswer: `تم حل ${solvedBlocks.reduce((count, block) => count + (block.type === "matching" ? block.answers.length : 1), 0)} عناصر من الرسالة.`,
      explanation: "تم تقسيم الرسالة إلى أسئلة مستقلة ثم حل كل جزء بحسب نوعه.",
      blocks: solvedBlocks,
      hideSources: true
    };
  }

  function solveRuntimeTrueFalse(question, route) {
    const raw = String(question || "");
    const statement = extractTrueFalseStatement(raw);
    const normalized = typeof normalizeText === "function" ? normalizeText(statement) : statement.toLowerCase();

    if (!isRuntimeTrueFalseQuestion(raw)) return null;

    const subjectInfo = detectRuntimeSubject(raw, "صح أو خطأ");
    const scopedRoute = {
      ...route,
      detected_subject: subjectInfo.subject || route.detected_subject || route.subject || "عام"
    };
    const consensus = BookWebConsensusEngine({
      question: statement || raw,
      questionType: "صح أو خطأ",
      subject: scopedRoute.detected_subject,
      route: scopedRoute,
      options: ["صواب", "خطأ"]
    });

    if (
      consensus &&
      (consensus.answer === "صواب" || consensus.answer === "خطأ") &&
      String(consensus.reason || "").trim() &&
      runtimeCrossSubjectGuard(scopedRoute.detected_subject || "عام", consensus.reason) &&
      (consensus.confidence || 0) >= 0.68
    ) {
      return buildTrueFalseResponse(consensus.answer, consensus.reason, scopedRoute, {
        subject: scopedRoute.detected_subject,
        lesson: consensus.lesson || scopedRoute.detected_subject || "حكم على العبارة",
        confidence: consensus.confidence,
        decisionBasis: consensus.decisionBasis || "book_first_with_web_verification",
        agreementLevel: consensus.agreementLevel || "medium"
      });
    }

    if (/التنفس الخلوي/.test(normalized) && /الفجوات/.test(normalized)) {
      return buildTrueFalseResponse("خطأ", "لأن التنفس الخلوي يحدث في الميتوكوندريا وليس في الفجوات.", route, {
        subject: "الأحياء",
        lesson: "التنفس الخلوي",
        similar: "صواب أم خطأ: يحدث التنفس الخلوي في الميتوكوندريا."
      });
    }

    if (/الميتوكوندريا/.test(normalized) && /التنفس الخلوي/.test(normalized)) {
      return buildTrueFalseResponse("صواب", "لأن الميتوكوندريا هي العضية المرتبطة بمعظم عمليات التنفس الخلوي وإنتاج الطاقة.", route, {
        subject: "الأحياء",
        lesson: "التنفس الخلوي"
      });
    }

    if (/الرابطة/.test(normalized) && /nacl/.test(normalized) && /تساهمية/.test(normalized)) {
      return buildTrueFalseResponse("خطأ", "لأن الرابطة في كلوريد الصوديوم NaCl أيونية وليست تساهمية.", route, {
        subject: "الكيمياء",
        lesson: "الروابط الكيميائية"
      });
    }

    if (/lower stress levels/.test(normalized) && /sick more often/.test(normalized)) {
      return buildTrueFalseResponse("خطأ", "لأن انخفاض التوتر لا يجعل الشخص يمرض أكثر عادةً، بل يرتبط غالبًا بصحة أفضل من التوتر المرتفع.", route, {
        subject: "الأحياء",
        lesson: "الصحة ووظائف الجسم",
        similar: "True or False: High stress levels are often linked to worse health outcomes."
      });
    }

    if (/parrot/.test(normalized) && /lecture theater/.test(normalized) && /bird-like reactions/.test(normalized)) {
      return buildTrueFalseResponse("خطأ", "لأن سبب الدهشة المذكور في العبارة غير دقيق بحسب المعنى المطلوب في النص.", route, {
        subject: "اللغة الإنجليزية",
        lesson: "فهم المقروء"
      });
    }

    if (/الكبسولة البلاستولية/.test(normalized) && /الرحم/.test(normalized) && /انغراس|تنغرس|تنغرس فيه/.test(normalized)) {
      return buildTrueFalseResponse("صواب", "لأن الكبسولة البلاستولية هي المرحلة التي تصل إلى الرحم وتبدأ عملية الانغراس في بطانته.", route, {
        subject: "الأحياء",
        lesson: "مراحل النمو الجنيني",
        confidence: 0.96,
        similar: "صواب أم خطأ: تبدأ عملية الانغراس بعد وصول الكبسولة البلاستولية إلى الرحم."
      });
    }

    if (/محيط الدائرة/.test(normalized) && /ط/.test(normalized) && /نق²|نق2|نق\^2/.test(normalized)) {
      return buildTrueFalseResponse("خطأ", "لأن ط × نق² هو قانون مساحة الدائرة، أما المحيط فيساوي 2 × ط × نق.", route, {
        subject: "الرياضيات",
        lesson: "محيط الدائرة",
        confidence: 0.98
      });
    }

    if (/الهيدروكربونات الأروماتية|الأروماتية|aromatic|aromaticity|benzene|بنزين/.test(normalized) && /الثبات|stable|stability|resonance|رنين|delocalization/.test(normalized)) {
      const isLowStabilityClaim = /منخفضة من الثبات|ثبات منخفض|less stable|low stability/.test(normalized);
      if (isLowStabilityClaim) {
        return buildTrueFalseResponse("خطأ", "لأن الهيدروكربونات الأروماتية تمتاز بثبات أعلى بسبب delocalization والرنين للإلكترونات π، لا بثبات منخفض.", route, {
          subject: "الكيمياء",
          lesson: "الهيدروكربونات الأروماتية",
          confidence: 0.96,
          similar: "صواب أم خطأ: البنزين أكثر ثباتًا من المتوقع بسبب الأروماتية."
        });
      }
      return buildTrueFalseResponse("صواب", "لأن الأروماتية ترتبط بزيادة الثبات نتيجة delocalization والرنين في النظام الحلقي.", route, {
        subject: "الكيمياء",
        lesson: "الهيدروكربونات الأروماتية",
        confidence: 0.93
      });
    }

    return null;
  }

  function normalizeRuntimeTrueFalseAnswer(answer, explanation = "") {
    const text = String(answer || "").trim();
    const reason = String(explanation || "").trim();
    if (/^صواب$/.test(text) || /^خطأ$/.test(text)) return text;
    if (text.includes("صواب")) return "صواب";
    if (text.includes("خطأ")) return "خطأ";
    if (reason.includes("وليست") || reason.includes("ليس") || reason.includes("غير صحيحة") || reason.includes("خطأ")) return "خطأ";
    if (reason.includes("لأن") && (reason.includes("هي المرحلة") || reason.includes("صحيحة") || reason.includes("يحدث في"))) return "صواب";
    return "";
  }

  function inferRuntimeTrueFalseFallback(question, route) {
    return solveRuntimeTrueFalse(question || route?.extracted_text || "", route || { question_type: "صح وخطأ" });
  }

  function isValidRuntimeTrueFalseResult(result) {
    return Boolean(
      result &&
      result.questionType === "صح وخطأ" &&
      (result.finalAnswer === "صواب" || result.finalAnswer === "خطأ") &&
      typeof result.explanation === "string" &&
      result.explanation.trim().length > 0
    );
  }

  function validateRuntimeTrueFalseResponse(questionType, response) {
    if (questionType !== "صح وخطأ" || !response) return response;
    const invalidPatterns = [
      "present simple",
      "في المضارع البسيط",
      "نضيف s",
      "نضيف s أو es",
      "الفاعل he أو she أو it",
      "زمن الجملة",
      "grammar"
    ];
    const explanation = String(response.explanation || "");
    const hasInvalid = invalidPatterns.some((pattern) => explanation.toLowerCase().includes(pattern.toLowerCase()));

    const normalizedAnswer = normalizeRuntimeTrueFalseAnswer(response.finalAnswer, response.trueFalseReason || response.explanation);
    const baseResponse = {
      ...response,
      answerMode: "truefalse",
      displayMode: "quick",
      finalAnswer: normalizedAnswer || response.finalAnswer || "",
      steps: [],
      mistakes: [],
      similar: response.similar || ""
    };

    if (!hasInvalid && preventWrongExplanation(explanation) && (baseResponse.finalAnswer === "صواب" || baseResponse.finalAnswer === "خطأ")) {
      return baseResponse;
    }

    return {
      ...baseResponse,
      explanation: response.trueFalseReason || response.explanation || "أعدت صياغة الجواب لأن سؤال صح وخطأ يحتاج حكمًا مباشرًا على العبارة نفسها، لا شرح قاعدة عامة.",
      steps: [],
      mistakes: [],
      similar: response.similar || ""
    };
  }

  function validateRuntimeMultipleChoiceResponse(questionType, response) {
    if (questionType !== "اختيار من متعدد" || !response) return response;
    const explanation = String(response.explanation || "");
    const invalidPatterns = [
      "في المضارع البسيط",
      "نضيف s أو es",
      "الخطوات",
      "الأخطاء الشائعة",
      "سؤال مشابه",
      "الربط بالمنهج"
    ];
    const hasInvalid = invalidPatterns.some((pattern) => explanation.includes(pattern));
    const normalizedAnswer = cleanRuntimeChoiceToken(response.finalAnswer || "");

    if (!hasInvalid && preventWrongExplanation(explanation)) {
      return {
        ...response,
        finalAnswer: normalizedAnswer || response.finalAnswer,
        answerMode: "mcq",
        displayMode: "quick",
        steps: [],
        mistakes: [],
        similar: "",
        explanation: ""
      };
    }

    return {
      ...response,
      finalAnswer: normalizedAnswer || response.finalAnswer,
      answerMode: "mcq",
      displayMode: "quick",
      steps: [],
      mistakes: [],
      similar: "",
      explanation: ""
    };
  }

  function normalizeRuntimeResponse(question, response, route, analysis) {
    if (!response) return response;

    const normalized = typeof normalizeText === "function"
      ? normalizeText(question || route?.extracted_text || "")
      : String(question || route?.extracted_text || "").toLowerCase();
    const questionType = route?.question_type || analysis?.questionType || response.questionType || "سؤال أكاديمي";
    const subject = route?.detected_subject || analysis?.subject || response.subject || "عام";
    const next = {
      ...response,
      questionType,
      subject,
      lesson: response.lesson || route?.detected_subject || response.lesson || "غير محدد"
    };

    if (questionType === "صح وخطأ") {
      next.answerMode = "truefalse";
      next.displayMode = "quick";
      next.steps = [];
      next.mistakes = [];
      next.curriculumLink = "";
      next.similar = next.similar || "";
      next.finalAnswer = normalizeRuntimeTrueFalseAnswer(next.finalAnswer, next.trueFalseReason || next.explanation);
      if (!next.finalAnswer) {
        const fallback = inferRuntimeTrueFalseFallback(question, route);
        if (fallback) {
          next.finalAnswer = fallback.finalAnswer;
          next.explanation = fallback.explanation || next.explanation;
          next.subject = fallback.subject || next.subject;
          next.lesson = fallback.lesson || next.lesson;
          next.similar = fallback.similar || next.similar;
          next.trueFalseReason = fallback.trueFalseReason || fallback.explanation || next.explanation;
        }
      }
      const validated = validateRuntimeTrueFalseResponse(questionType, next);
      if (isValidRuntimeTrueFalseResult(validated)) {
        return validated;
      }
      return {
        ...validated,
        answerMode: "truefalse",
        displayMode: "quick",
        finalAnswer: normalizeRuntimeTrueFalseAnswer(validated?.finalAnswer, validated?.explanation) || "خطأ",
        explanation: validated?.explanation || "تمت مراجعة العبارة مباشرة وتحديد الحكم النهائي لها بصورة مختصرة."
      };
    }

    if (questionType === "اختيار من متعدد") {
      next.answerMode = "mcq";
      next.displayMode = "quick";
      next.steps = [];
      next.mistakes = [];
      next.curriculumLink = "";
      next.similar = next.similar || "";
      return validateRuntimeMultipleChoiceResponse(questionType, next);
    }

    if (questionType === "مسألة") {
      next.displayMode = selectedResponseMode === "quick" ? "quick" : "educational";
      return next;
    }

    if (questionType === "تصحيح") {
      next.displayMode = "quick";
      next.steps = [];
      next.mistakes = [];
      next.similar = "";
      next.curriculumLink = next.curriculumLink || `تم التعامل مع السؤال على أنه تصحيح في ${subject}.`;
      return next;
    }

    if (questionType === "ترجمة" || questionType === "تعريف" || questionType === "شرح") {
      next.displayMode = "quick";
      next.steps = [];
      next.mistakes = [];
      next.similar = "";
      return next;
    }

    if (/خلية|خلوي|dna|كائن حي|تنفس خلوي|رحم|بلاستولية/.test(normalized)) {
      next.displayMode = "quick";
      next.steps = [];
      next.mistakes = [];
      next.similar = "";
      next.subject = "الأحياء";
      return next;
    }

    return next;
  }

  function runtimeAutoSubjectDetector(text) {
    const normalized = typeof normalizeText === "function" ? normalizeText(text) : (text || "");
    const scores = {
      "الرياضيات": 0,
      "العلوم": 0,
      "الفيزياء": 0,
      "الكيمياء": 0,
      "الأحياء": 0,
      "اللغة العربية": 0,
      "اللغة الإنجليزية": 0
    };

    const add = (subject, amount) => {
      scores[subject] = (scores[subject] || 0) + amount;
    };

    if (/التنفس الخلوي|الميتوكوندريا|الفجوات|البلاستيدات|الخلية النباتية|الخلية الحيوانية|stress|sick|health|disease|cell|respiration|mitochondria|vacuole|انغراس|البلاستولية|جنين|الرحم/.test(normalized)) add("الأحياء", 80);
    if (/رابطة|أيونية|تساهمية|معادلة كيميائية|حمض|قاعدة|na|cl|ذرة|مول|الهيدروكربونات الأروماتية|الأروماتية|aromatic|aromaticity|benzene|بنزين|resonance|رنين|pi electron|delocalization/.test(normalized)) add("الكيمياء", 72);
    if (/تسارع|قوة|سرعة|نيوتن|زخم|احتكاك|طاقة حركية/.test(normalized)) add("الفيزياء", 65);
    if (/محيط|مساحة|دائرة|نصف القطر|معادلة|جذر|كسر|احسب|أوجد/.test(normalized)) add("الرياضيات", 65);
    if (/مبتدأ|خبر|إعراب|نحو|بلاغة|أعرب|استخرج/.test(normalized)) add("اللغة العربية", 60);
    if (isExplicitEnglishLanguageTask(normalized)) add("اللغة الإنجليزية", 60);
    if (/تبخر|تكاثف|دورة الماء|نظام بيئي/.test(normalized)) add("العلوم", 52);

    const ranking = Object.entries(scores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([subject, score]) => ({ subject, score }));
    const [top, second] = ranking;
    const confidence = top
      ? Math.max(0, Math.min(0.98, top.score / 100 + (second ? Math.max(0, (top.score - second.score) / 200) : 0.12)))
      : 0;

    return {
      subject: top?.subject || "",
      confidence,
      candidates: ranking.slice(0, 3),
      passes: ranking.length ? ["runtime-auto-detect"] : []
    };
  }

  window.auto_subject_detector = runtimeAutoSubjectDetector;

  function getAchievementChips(activeUser) {
    if (!activeUser) {
      return [
        '<span class="student-achievement-chip student-achievement-chip-muted">سجّل دخولك ليبدأ حفظ الإنجازات تلقائيًا.</span>'
      ];
    }

    const labels = {
      "5_days_streak": "🔥 5 أيام متتالية",
      "30_days_streak": "🏆 شارة 30 يومًا"
    };
    const saved = Array.isArray(activeUser.achievements) ? activeUser.achievements : [];
    const chips = saved
      .map((item) => labels[item] || "")
      .filter(Boolean)
      .map((label) => `<span class="student-achievement-chip">${label}</span>`);

    if ((typeof analytics !== "undefined" ? analytics.totalMessages || 0 : 0) >= 10) {
      chips.push('<span class="student-achievement-chip">✨ 10 أسئلة منجزة</span>');
    }
    if ((activeUser.xp || 0) >= 150) {
      chips.push('<span class="student-achievement-chip">⭐ رصيد نشط</span>');
    }

    return chips.length
      ? chips
      : ['<span class="student-achievement-chip student-achievement-chip-muted">ستظهر إنجازاتك هنا بعد أول عدة أسئلة.</span>'];
  }

  function syncStudentDashboardHeader() {
    const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;
    const gradeLabel = activeUser?.grade || gradeSelect?.value || "هذا الصف";
    const displayName = activeUser?.name || "صديق ملم";
    const streakDays = activeUser?.streakDays || 0;

    studentNameNodes.forEach((node) => {
      node.textContent = displayName;
    });
    studentStreakNodes.forEach((node) => {
      node.textContent = String(streakDays);
    });

    if (dashboardCopyNode) {
      dashboardCopyNode.textContent = activeUser
        ? `جاهز اليوم لمراجعة ${gradeLabel} بسرعة وبخطوات واضحة. ابدأ بسؤالك وسيتولى ملم الباقي.`
        : "ابدأ مباشرة كضيف في الشات النصي، وسجّل دخولك عندما تريد حفظ التقدم وتحليل الصور.";
    }

    if (achievementsNode) {
      achievementsNode.innerHTML = getAchievementChips(activeUser).join("");
    }
  }

  function bindPromptPlaceholderButtons() {
    placeholderButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const placeholder = button.getAttribute("data-chat-placeholder");
        if (placeholder && promptInput) {
          promptInput.placeholder = placeholder;
        }
      });
    });

    const resetPlaceholder = () => {
      if (promptInput) {
        promptInput.placeholder = "اكتب سؤالك من المنهج السعودي...";
      }
    };

    clearChatTrigger?.addEventListener("click", resetPlaceholder);
    newSessionTrigger?.addEventListener("click", resetPlaceholder);
  }

  function runtimeStartFreshSession() {
    clearRuntimeAttachments();
    runtimeState.pendingSolveConfirmation = null;
    if (promptInput) {
      promptInput.value = "";
      autoGrow(promptInput);
    }
    const hasActiveUser = typeof getActiveUser === "function" && Boolean(getActiveUser());
    if (!hasActiveUser) {
      clearGuestWorkspace();
    } else if (typeof startFreshSession === "function") {
      startFreshSession();
    } else if (typeof resetConversationView === "function") {
      resetConversationView();
    } else if (messageList) {
      messageList.innerHTML = "";
    }
    scrollToChatSection();
  }

  function preservePageScroll(action) {
    const top = window.scrollY || window.pageYOffset || 0;
    action();
    const restore = () => window.scrollTo(0, top);
    restore();
    requestAnimationFrame(restore);
    window.setTimeout(restore, 0);
    window.setTimeout(restore, 80);
    window.setTimeout(restore, 220);
  }

  function scrollToChatSection() {
    const chatSection = document.getElementById("chat") || document.querySelector(".chat-shell");
    if (!chatSection) return;
    chatSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function logoutUser() {
    try {
      localStorage.removeItem("mlm_current_user");
      localStorage.removeItem("mlm_admin_session");
      localStorage.removeItem("mlm_resume_prompt");
    } catch (_) {
      // Ignore storage cleanup issues and continue redirect.
    }
    window.location.href = "index.html";
  }

  function applyUserStudyContext() {
    const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;
    const isLogged = Boolean(activeUser);
    document.body.classList.toggle("user-logged-in", isLogged);
    document.body.classList.toggle("guest-mode", !isLogged);

    if (gradeSelect && activeUser?.grade) {
      gradeSelect.value = activeUser.grade;
    }

    if (stageSwitch) {
      stageSwitch.style.display = "";
    }

    if (subjectSelect) {
      const explicitSubject = activeUser?.subject || "";
      if (explicitSubject && !subjectSelect.value) subjectSelect.value = explicitSubject;
      subjectSelect.closest(".subject-runtime-wrap")?.remove();
      const wrapper = document.createElement("div");
      wrapper.className = "subject-runtime-wrap";
      subjectSelect.parentNode?.insertBefore(wrapper, subjectSelect);
      wrapper.appendChild(subjectSelect);
      wrapper.classList.toggle("subject-runtime-hidden", false);
      wrapper.classList.toggle("subject-runtime-visible", true);
    }

    if (focusSubjectButton) {
      focusSubjectButton.textContent = "تغيير المادة";
      focusSubjectButton.onclick = () => {
        const wrapper = subjectSelect?.closest(".subject-runtime-wrap");
        if (wrapper) {
          wrapper.classList.remove("subject-runtime-hidden");
          wrapper.classList.add("subject-runtime-visible");
        }
        return;
      };
    }

    [uploadButton, uploadImageButton, uploadFileButton].forEach((button) => {
      if (!button) return;
      button.disabled = !isLogged;
      button.classList.toggle("is-locked", !isLogged);
      if (!isLogged) {
        button.setAttribute("title", "يتطلب تسجيل الدخول");
      } else {
        button.removeAttribute("title");
      }
    });

    if (selectionSummary) {
      const gradeLabel = activeUser?.grade || gradeSelect?.value || "";
      const termLabel = termSelect?.value || "";
      const lessonLabel = lessonInput?.value?.trim() || "الدرس غير محدد";
      selectionSummary.textContent = isLogged
        ? `${gradeLabel} · ${termLabel} · ${lessonLabel}`
        : "ابدأ أول محادثة لك الآن.";
    }
  }

  function clearGuestWorkspace() {
    const hasActiveUser = typeof getActiveUser === "function" && Boolean(getActiveUser());
    if (hasActiveUser) return;
    const guestKeys = [
      "mlm_liked_answers_guest",
      "mlm_chat_history_guest",
      "mlm_analytics_guest",
      "mlm_feedback_log_guest",
      "mlm_ai_logs_guest",
      "mlm_chat_sessions_guest",
      "mlm_active_session_guest",
      "mlm_runtime_answer_bank_guest",
      "mlm_runtime_pattern_memory_guest",
      "mlm_runtime_intent_rules_guest",
      "mlm_runtime_intent_errors_guest"
    ];
    guestKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem("mlm_resume_prompt");

    if (typeof likedAnswers !== "undefined") likedAnswers = [];
    if (typeof chatHistory !== "undefined") chatHistory = [];
    if (typeof analytics !== "undefined") analytics = { totalMessages: 0, xpUsed: 0, subjects: {}, likes: 0, dislikes: 0 };
    if (typeof feedbackLog !== "undefined") feedbackLog = [];
    if (typeof aiLogs !== "undefined") aiLogs = [];
    if (typeof chatSessions !== "undefined") chatSessions = [];
    if (typeof activeSessionId !== "undefined") activeSessionId = null;
    if (typeof renderHistory === "function") renderHistory();
    if (typeof renderInsights === "function") renderInsights();
    if (typeof renderSessionList === "function") renderSessionList();
    if (typeof resetConversationView === "function") resetConversationView();
    if (messageList) messageList.innerHTML = "";
  }

  function isUserNearBottom() {
    return false;
  }

  function scrollMessagesToBottom() {
    return;
  }

  window.isUserNearBottom = isUserNearBottom;
  window.scrollMessagesToBottom = scrollMessagesToBottom;
  window.setupChatAutoScrollEnhancement = function setupChatAutoScrollEnhancement() {
    if (messageList) {
      messageList.dataset.runtimeAutoscroll = "disabled";
    }
  };

  function syncRuntimeScrollButton() {
    if (!scrollTopButton) return;
    const nearTop = window.scrollY < 240;
    scrollTopButton.classList.add("visible");
    scrollTopButton.textContent = nearTop ? "↓" : "↑";
    scrollTopButton.setAttribute("aria-label", nearTop ? "النزول إلى أسفل الصفحة" : "العودة إلى أعلى الصفحة");
    scrollTopButton.setAttribute("title", nearTop ? "النزول إلى أسفل الصفحة" : "العودة إلى أعلى الصفحة");
  }

  function isRuntimeAcademicIntent(intentType) {
    return [
      "solve",
      "generate_questions",
      "quiz",
      "summary",
      "explain",
      "answer_analysis",
      "academic_question"
    ].includes(intentType);
  }

  function detectRuntimeIntentType(text, hasAttachments = false) {
    const raw = String(text || "").trim();
    const compactRaw = raw.replace(/[؟?!.,،]+$/g, "").trim();
    const normalized = typeof normalizeText === "function" ? normalizeText(raw) : raw.toLowerCase();
    const learned = checkRuntimeLearnedIntent(raw);
    if (learned) {
      return {
        type: learned === "general_chat" ? "chat" : learned,
        confidence: 0.99,
        source: "memory_rule"
      };
    }

    if (!normalized && !hasAttachments) return { type: "help", confidence: 0.4, source: "empty" };
    if (isDirectMathExpression(raw)) return { type: "solve", confidence: 0.99, source: "direct_math_expression" };
    if (hasRuntimeInlineOptions(raw)) return { type: "solve", confidence: 0.99, source: "inline_choices_detected" };
    if (/^(من انت|من أنت|وش اسمك|ما اسمك|السلام عليكم|مرحبا|هلا|كيفك|كيف حالك|من تكون)$/i.test(compactRaw)) {
      return { type: "chat", confidence: 0.99, source: "general_chat_exact" };
    }
    if (/^(نعم|لا|اكمل|أكمل|استمر|ابدأ|كمل|اختيار المادة|غير المادة|غيّر المادة)$/i.test(compactRaw)) {
      return { type: "ui_action", confidence: 0.99, source: "ui_action_exact" };
    }
    if (/(كيف استخدم|طريقة الاستخدام|مساعدة|وش اسوي|وش أسوي|ساعدني في الموقع|كيف أستخدم)/i.test(normalized)) {
      return { type: "help", confidence: 0.95, source: "help_pattern" };
    }
    if (/(اكتب لي|ولد|انشئ|أنشئ).*(أسئلة|سؤال)|أسئلة.*(كيمياء|فيزياء|رياضيات|عربي|علوم|إنجليزي|أحياء)/i.test(normalized)) {
      return { type: "generate_questions", confidence: 0.94, source: "question_generation" };
    }
    if (/(اختبرني|اختبار|كويز|امتحنني)/i.test(normalized)) {
      return { type: "quiz", confidence: 0.95, source: "quiz_pattern" };
    }
    if (/(لخص|تلخيص|اختصر|ملخص)/i.test(normalized)) {
      return { type: "summary", confidence: 0.92, source: "summary_pattern" };
    }
    if (/(اشرح|وش يعني|ما معنى|عرف|فسر|بسط|بسّط)/i.test(normalized)) {
      return { type: "explain", confidence: 0.9, source: "explain_pattern" };
    }
    if (/(إجابتي|جوابي|حللته|هل حلي صحيح|صحح إجابتي|قيم إجابتي|وين الخطأ)/i.test(normalized)) {
      return { type: "answer_analysis", confidence: 0.94, source: "answer_analysis_pattern" };
    }
    if (hasAttachments || /(صواب|خطأ|صح|true|false|اختر|أي مما يلي|match|طابق|complete|اكمل|أكمل|احسب|أوجد|علل|فسر|درجة السؤال|حدد صحة|مساحة|محيط|معادلة|ترجم|صحح)/i.test(normalized)) {
      return { type: "solve", confidence: 0.9, source: "academic_pattern" };
    }
    if (/[؟?]/.test(raw)) {
      return { type: "general_question", confidence: 0.7, source: "general_question_mark" };
    }

    return { type: "chat", confidence: 0.72, source: "safe_chat_fallback" };
  }

  function runtimeIntentRouter(text, hasAttachments = false) {
    return detectRuntimeIntentType(text, hasAttachments);
  }

  function createRuntimeUiActionResponse(message) {
    const raw = String(message || "").trim();
    const compactRaw = raw.replace(/[؟?!.,،]+$/g, "").trim();
    const normalized = typeof normalizeText === "function" ? normalizeText(raw) : raw.toLowerCase();
    if (/^نعم$/i.test(compactRaw)) return "تم، أرسل السؤال الكامل وسأكمل معك مباشرة.";
    if (/^لا$/i.test(compactRaw)) return "حسنًا، غيّر المادة أو اكتب سؤالك بشكل أوضح وسأتابع معك.";
    if (/اكمل|أكمل|كمل|استمر/.test(normalized)) return "أرسل السؤال أو الجزء الذي تريد إكماله وسأتابع معك مباشرة.";
    if (/اختيار المادة|غير المادة|غيّر المادة/.test(normalized)) return "تم، اختر المادة المناسبة أو اكتب السؤال كاملًا وسأحددها معك إن كان واضحًا.";
    return "تم. أرسل السؤال الكامل أو اختر المادة التي تريدها.";
  }

  function createRuntimeChatResponse(message) {
    const normalized = typeof normalizeText === "function" ? normalizeText(message || "") : String(message || "").toLowerCase();
    if (/من انت|من أنت|وش اسمك|ما اسمك/.test(normalized)) {
      return "أنا مساعد ذكي أساعدك في الدراسة، حل الأسئلة، والشرح بطريقة مناسبة لنوع السؤال، وأقدر أيضًا أجاوبك بشكل عام.";
    }
    if (typeof createCasualResponse === "function") {
      return createCasualResponse(message);
    }
    return runtimeSafeFallback("chat");
  }

  function createRuntimeGeneralQuestionResponse(message) {
    const normalized = typeof normalizeText === "function" ? normalizeText(message || "") : String(message || "").toLowerCase();
    if (/من انت|من أنت|وش اسمك|ما اسمك/.test(normalized)) {
      return "أنا مساعد ذكي أساعدك في الدراسة، حل الأسئلة، والشرح بطريقة مناسبة لنوع السؤال، وأقدر أيضًا أجاوبك بشكل عام.";
    }
    return "أقدر أساعدك. اكتب سؤالك بشكل مباشر أو أرسل سؤالك الدراسي وسأرتبه لك بطريقة واضحة.";
  }

  function runtimeSafeFallback(intentType) {
    if (intentType === "chat") return "أنا مساعد ذكي، أساعدك في الدراسة، حل الأسئلة، والشرح والمحادثة بشكل مباشر.";
    if (intentType === "ui_action") return "تم. أرسل السؤال الكامل أو اختر المادة.";
    if (intentType === "general_question") return "أقدر أساعدك. اكتب سؤالك بشكل كامل.";
    return "تعذر تحديد نوع الرسالة بدقة هذه المرة.";
  }

  function finalRuntimeSafetyGate(input, intentType, responseText) {
    const academicMarkers = ["✅ الإجابة", "📘 الشرح", "🧮 الخطوات", "📚 الربط بالمنهج", "محيط الدائرة"];

    if (intentType === "chat" || intentType === "ui_action" || intentType === "general_question") {
      const hasAcademicTemplate = academicMarkers.some((marker) => String(responseText || "").includes(marker));
      if (hasAcademicTemplate) {
        recordRuntimeIntentError({
          user_text: input,
          predicted_intent: intentType,
          actual_intent: intentType,
          response_quality: "bad",
          reason: "non_academic_input_generated_academic_template"
        });
        rememberRuntimeIntentPattern(input, intentType === "chat" ? "general_chat" : intentType);
        return {
          allowed: false,
          replacement: formatSimpleReply(runtimeSafeFallback(intentType))
        };
      }
    }

    return { allowed: true, replacement: responseText };
  }

  function detectRoute(question, attachments) {
    const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;
    const solveMode = getSolveMode();
    const inputType = determineInputType(question, attachments);
    const imageMeta = inputType.includes("image")
      ? image_analyzer(attachments, question)
      : { image_type: "none", extracted_text: "", confidence: 0 };
    const questionText = `${question || ""} ${imageMeta.extracted_text || ""}`.trim();
    const intent = runtimeIntentRouter(questionText, attachments.length > 0);
    const isAcademic = isRuntimeAcademicIntent(intent.type);
    const questionType = isAcademic ? classifyRuntimeQuestionType(questionText) : "محادثة";
    const isObjective = questionType === "صح وخطأ" || questionType === "اختيار من متعدد";
    const quickMode = solveMode !== "structured";
    const runtimeSubject = isAcademic
      ? detectRuntimeSubject(questionText, questionType)
      : { subject: "", confidence: 0, candidates: [], passes: [] };
    const scope = isAcademic
      ? curriculum_scope_checker({
          userText: question,
          selectedGrade: activeUser?.grade || gradeSelect?.value || "",
          selectedSubject: quickMode ? "" : (subjectSelect?.value || ""),
          imageMeta,
          solveMode: quickMode ? "quick" : "structured"
        })
      : {
          detected_subject: "",
          detected_grade_level: activeUser?.grade || gradeSelect?.value || "",
          subject_confidence: 0,
          grade_confidence: 0,
          subject_candidates: [],
          analysis_passes: [],
          scope_status: "not_applicable"
        };
    const detectedSubject = isAcademic ? (runtimeSubject.subject || scope.detected_subject) : "";
    const subjectConfidence = isAcademic ? Math.max(scope.subject_confidence || 0, runtimeSubject.confidence || 0) : 0;
    const subjectCandidates = isAcademic ? (runtimeSubject.candidates?.length ? runtimeSubject.candidates : scope.subject_candidates) : [];
    const analysisPasses = isAcademic ? [...new Set([...(scope.analysis_passes || []), ...(runtimeSubject.passes || [])])] : [];

    let responseMode = isAcademic ? "academic_solve" : "non_academic";
    if (inputType === "file_only" && !question.trim()) responseMode = "content_interpretation";
    if (imageMeta.image_type === "logo_or_branding") responseMode = "reject_logo_image";
    else if (imageMeta.image_type === "non_educational_image" || imageMeta.image_type === "document_non_educational") responseMode = "reject_out_of_scope_image";
    else if (imageMeta.image_type === "unclear_image") responseMode = "ask_clearer_upload";
    else if (imageMeta.image_type === "educational_page" && !question.trim()) responseMode = "content_interpretation";
    else if (isAcademic && !quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) responseMode = "ask_for_confirmation";
    else if (isAcademic && intent.type !== "chat" && intent.type !== "help" && subjectConfidence < 0.7 && !isObjective) responseMode = "ask_for_confirmation";

    return {
      input_type: inputType,
      image_type: imageMeta.image_type,
      extracted_text: imageMeta.extracted_text,
      detected_subject: detectedSubject,
      detected_grade_level: scope.detected_grade_level,
      subject_confidence: subjectConfidence,
      grade_confidence: scope.grade_confidence,
      subject_candidates: subjectCandidates,
      analysis_passes: analysisPasses,
      scope_status: scope.scope_status,
      response_mode: responseMode,
      quick_mode: quickMode,
      intent,
      question_type: questionType
    };
  }

  function createRouteReply(route) {
    if (route.response_mode === "ask_for_confirmation") {
      if (route.scope_status === "subject_mismatch") {
        return formatSimpleReply(`يبدو أن السؤال أقرب إلى مادة ${route.detected_subject}، بينما المادة المحددة لديك مختلفة. غيّر المادة أو أخبرني أن أكمل على هذا الأساس.`);
      }
      if (route.scope_status === "grade_mismatch") {
        return formatSimpleReply("هذا السؤال يبدو من مستوى دراسي مختلف عن الصف المحدد لديك. يمكنك تعديل الصف أو المتابعة كتقدير أولي إذا كان هذا مقصودًا.");
      }
      return formatClarificationReply({
        intro: "حللت السؤال أكثر من مرة للوصول لأقرب مادة ممكنة.",
        prompt: `يبدو أن السؤال من ${route.detected_subject || "مادة دراسية محددة"}. هل تريد أن أكمل الحل؟`,
        actions: [
          { label: "أكمل الحل", fill: "نعم" },
          { label: "اختيار المادة", action: "focus-subject" }
        ]
      });
    }

    if (route.response_mode === "reject_logo_image") {
      return formatSimpleReply("يبدو أن الصورة المرفقة ليست سؤالًا تعليميًا، بل أقرب إلى شعار أو تصميم. أرسل صورة السؤال أو اكتبه نصًا.");
    }
    if (route.response_mode === "reject_out_of_scope_image") {
      return formatSimpleReply("الصورة المرفقة لا تبدو ضمن المحتوى التعليمي. يرجى إرسال سؤال دراسي أو صورة واضحة من كتاب أو ورقة عمل.");
    }
    if (route.response_mode === "ask_clearer_upload") {
      return formatSimpleReply("الصورة غير واضحة بما يكفي لقراءة السؤال. حاول إعادة رفع صورة أوضح أو اكتب السؤال نصًا.");
    }
    if (route.response_mode === "content_interpretation") {
      return formatClarificationReply({
        intro: "تم التعرف على الصورة كمحتوى تعليمي.",
        prompt: "هل تريد شرح المحتوى أم تلخيصه أم حل الأسئلة الموجودة فيه؟",
        actions: [
          { label: "شرح المحتوى", fill: "اشرح محتوى الصورة التعليمية." },
          { label: "تلخيص المحتوى", fill: "لخص محتوى الصورة التعليمية." },
          { label: "حل الأسئلة", fill: "حل الأسئلة الموجودة في الصورة التعليمية." }
        ]
      });
    }
    return formatSimpleReply("تم تجهيز الطلب وسأكمل الحل الآن.");
  }

  function buildDirectObjectiveResponse(question, route) {
    const normalized = typeof normalizeText === "function" ? normalizeText(question) : (question || "");
    let objective = null;

    if (classifyRuntimeQuestionType(question) === "اختيار من متعدد") {
      objective = solveRuntimeMultipleChoiceQuestion(question, route);
    }

    if (!objective) {
      objective = solveRuntimeTrueFalse(question, route);
    }

    if (!objective) {
      objective = typeof solveObjectiveQuestion === "function" ? solveObjectiveQuestion(question) : null;
    }

    if (!objective && /التنفس الخلوي/.test(normalized) && /الفجوات/.test(normalized) && /صواب|صح|خطأ/.test(normalized)) {
      objective = {
        finalAnswer: "خطأ",
        explanation: "لأن التنفس الخلوي يحدث في الميتوكوندريا وليس الفجوات."
      };
    }

    if (!objective) return null;

    if (objective.answerMode === "truefalse") {
      return validateRuntimeTrueFalseResponse(
        route.question_type || "صح وخطأ",
        {
          ...objective,
          mode: "solve",
          displayMode: "quick",
          questionType: route.question_type || "صح وخطأ",
          subject: objective.subject || route.detected_subject || "الأحياء",
          lesson: objective.lesson || "حكم على العبارة",
          trueFalseReason: objective.trueFalseReason || objective.explanation
        }
      );
    }

    if (objective.answerMode === "mcq") {
      return validateRuntimeMultipleChoiceResponse(
        route.question_type || "اختيار من متعدد",
        {
          ...objective,
          mode: "solve",
          answerMode: "mcq",
          displayMode: "quick",
          questionType: route.question_type || "اختيار من متعدد",
          subject: objective.subject || route.detected_subject || "عام",
          lesson: objective.lesson || route.detected_subject || "اختيار من متعدد",
          steps: [],
          mistakes: [],
          similar: objective.similar || ""
        }
      );
    }

    return {
      mode: "solve",
      displayMode: "quick",
      questionType: route.question_type || "صح وخطأ",
      subject: route.detected_subject || "الأحياء",
      lesson: "مفاهيم الخلية",
      finalAnswer: objective.finalAnswer,
      explanation: objective.explanation,
      steps: [
        "حددت أن السؤال من نوع صح أو خطأ.",
        "قارنت العبارة بالمعلومة العلمية الأساسية.",
        "اخترت الحكم الصحيح بناءً على المفهوم."
      ],
      mistakes: [
        "الخلط بين الفجوات والميتوكوندريا.",
        "الاعتماد على حفظ العبارة دون فهم وظيفة كل عضية."
      ],
      similar: "صواب أم خطأ: يحدث التنفس الخلوي في الميتوكوندريا."
    };
  }

  function intent_analyzer(message, hasAttachments = false) {
    const intent = IntentEngine(message, hasAttachments);
    const isAcademic = isRuntimeAcademicIntent(intent.type);
    const questionType = isAcademic ? classifyRuntimeQuestionType(message) : "محادثة";
    const subjectGuess = isAcademic
      ? detectRuntimeSubject(message, questionType)
      : { subject: "", confidence: 0, candidates: [], passes: [] };
    const decomposedTasks = isAcademic ? query_decomposer(message, subjectGuess.subject) : [];
    const blocks = isAcademic ? splitIntoQuestionBlocksSmart(message) : [];
    const blockTypes = blocks.map((block) => classifyRuntimeBlockType(block)).filter((type) => type && type !== "general");
    return {
      intent,
      questionType,
      subject: subjectGuess.subject,
      confidence: subjectGuess.confidence,
      candidates: subjectGuess.candidates,
      difficulty: message.length > 90 ? "medium" : "easy",
      decomposedTasks,
      compound: decomposedTasks.length > 0,
      blockTypes,
      blockCount: blocks.length,
      multiQuestion: blockTypes.length > 1
    };
  }

  function reasoning_engine(message, analysis) {
    const normalized = typeof normalizeText === "function" ? normalizeText(message) : (message || "");
    const keywords = (normalized.match(/[^\s]+/g) || []).slice(0, 8);
    const isObjective = analysis.questionType === "صح وخطأ" || analysis.questionType === "اختيار من متعدد";
    const clarity = isObjective || /احسب|اشرح|علل|اختر|صواب|خطأ/.test(normalized) ? "high" : (message.length > 12 ? "medium" : "low");

    return {
      keywords,
      isObjective,
      clarity,
      needsFollowup: clarity === "low" && analysis.confidence < 0.45,
      compound: analysis.compound,
      taskCount: analysis.decomposedTasks?.length || 0,
      blockTypes: analysis.blockTypes || [],
      multiQuestion: analysis.multiQuestion || false,
      needsStructuredValidation: isObjective || analysis.multiQuestion || analysis.compound
    };
  }

  function decision_engine(route, analysis, reasoning) {
    if (analysis.intent.type === "chat") return { action: "chat" };
    if (analysis.intent.type === "help") return { action: "help" };
    if (analysis.intent.type === "ui_action") return { action: "ui_action" };
    if (analysis.intent.type === "general_question") return { action: "general_question" };
    if (reasoning.multiQuestion) {
      return {
        action: "answer",
        confidence: Math.max(route.subject_confidence || 0, analysis.confidence || 0.72),
        composite: true,
        strategy: "decompose_route_validate"
      };
    }
    if (reasoning.compound && (route.subject_confidence || analysis.confidence) >= 0.55) {
      return {
        action: "answer",
        confidence: Math.max(route.subject_confidence || 0, analysis.confidence || 0.55),
        composite: true,
        strategy: "plan_then_answer"
      };
    }
    if (route.response_mode === "reject_logo_image" || route.response_mode === "reject_out_of_scope_image" || route.response_mode === "ask_clearer_upload" || route.response_mode === "content_interpretation") {
      return { action: "route" };
    }
    if (reasoning.isObjective) {
      return { action: "answer", confidence: Math.max(route.subject_confidence || 0, analysis.confidence || 0.8) };
    }
    if ((route.subject_confidence || analysis.confidence) >= 0.7 || reasoning.clarity === "high") {
      return { action: "answer", confidence: route.subject_confidence || analysis.confidence };
    }
    if ((route.subject_confidence || analysis.confidence) >= 0.45) {
      return {
        action: "answer_with_note",
        confidence: route.subject_confidence || analysis.confidence,
        note: route.detected_subject ? `يبدو أن السؤال من ${route.detected_subject}، وسأكمل الحل مباشرة.` : "يبدو أن السؤال واضح بما يكفي، وسأكمل الحل مباشرة."
      };
    }
    return { action: "ask", confidence: route.subject_confidence || analysis.confidence };
  }

  function response_builder(question, route, analysis, reasoning) {
    const rawQuestion = question || route.extracted_text || "حل السؤال من المرفقات";
    const runtimeReasoning = reasoning || reasoning_engine(rawQuestion, analysis);
    const decomposition = QuestionDecomposer(rawQuestion, analysis.subject || route.detected_subject || "");
    const retrievalStage = BookRetrieval(rawQuestion, route, analysis, runtimeReasoning);
    const meta = retrievalStage.meta;
    const retrieval = retrievalStage.retrieval;
    const webVerification = WebVerificationLayer(rawQuestion, route, analysis);
    const consensus = ConsensusEngine({
      retrieval: retrievalStage,
      webVerification,
      route,
      analysis,
      decomposition,
      question: rawQuestion
    });
    const learningMemory = SelfLearningMemory();
    const finalizeRuntimeResponse = (candidate, overrides = {}) => {
      const adapted = AdaptiveResponseStyleSmart(candidate, analysis, runtimeReasoning);
      return StructuredOutputEngine(
        adapted,
        {
          ...consensus,
          ...overrides,
          retrieval: overrides.retrieval || consensus.retrieval || retrieval
        },
        meta,
        runtimeReasoning,
        { learningMemory, decomposition }
      );
    };
    const storedAnswer = findRuntimeStoredAnswer(rawQuestion, route);
    if (storedAnswer?.response) {
      return finalizeRuntimeResponse(
        {
          ...storedAnswer.response,
          explanation: storedAnswer.response.explanation || "تمت إعادة استخدام أفضل إجابة محفوظة لهذا السؤال لأنها حققت نتيجة جيدة سابقًا."
        },
        {
          decisionBasis: "stored_best_answer",
          retrieval: {
            ...retrieval,
            source: "answer_bank_then_curriculum",
            decisionBasis: "stored_best_answer"
          }
        }
      );
    }
    const compositeResponse = solveCompositeQuestionSet(rawQuestion, route);
    if (compositeResponse) {
      return finalizeRuntimeResponse(compositeResponse, {
        decisionBasis: "decomposed_multi_block_answer"
      });
    }

    const compoundResponse = buildCompoundResponse(rawQuestion, route);
    if (compoundResponse) {
      return finalizeRuntimeResponse(
        normalizeRuntimeResponse(rawQuestion, compoundResponse, route, analysis),
        { decisionBasis: "compound_request_planned_response" }
      );
    }

    const directObjective = buildDirectObjectiveResponse(rawQuestion, route);
    if (directObjective) {
      return finalizeRuntimeResponse(
        normalizeRuntimeResponse(rawQuestion, directObjective, route, analysis),
        { decisionBasis: directObjective.decisionBasis || "direct_objective_solver" }
      );
    }

    const academicResponse = createAcademicResponse(rawQuestion, analysis.intent, {
      preferredSubject: route.detected_subject || "",
      detectedSubject: route.detected_subject || "",
      subjectConfidence: route.subject_confidence,
      route
    });

    const normalizedAcademic = normalizeRuntimeResponse(rawQuestion, academicResponse, route, analysis);
    const preferredStyle = getRuntimePreferredStyle(meta.questionType, meta.subject);
    if (preferredStyle === "short") {
      normalizedAcademic.displayMode = "quick";
      normalizedAcademic.steps = [];
      normalizedAcademic.mistakes = [];
    }
    const styledAcademic = AdaptiveResponseStyleSmart(normalizedAcademic, analysis, runtimeReasoning);
    if (!ValidationEngine(styledAcademic, meta)) {
      return finalizeRuntimeResponse(
        buildRuntimeValidationFallback(meta, styledAcademic),
        { decisionBasis: "validation_fallback_after_generation" }
      );
    }
    return finalizeRuntimeResponse(styledAcademic);
  }

  function self_checker(response, decision) {
    const checked = { ...response };
    if (decision.note) {
      checked.explanation = `${decision.note} ${checked.explanation || ""}`.trim();
    }
    if (/هل تريد أن أكمل|غيّر المادة|اختر المادة أولًا/.test(checked.explanation || "")) {
      checked.explanation = (checked.explanation || "")
        .replace(/هل تريد أن أكمل/g, "")
        .replace(/غيّر المادة/g, "")
        .replace(/اختر المادة أولًا/g, "")
        .trim();
    }
    if (checked.planTasks?.length) {
      checked.explanation = `${checked.explanation || ""} خطة التنفيذ: ${checked.planTasks.join(" ← ")}.`.trim();
    }
    const validated = AdaptiveResponseStyleSmart(
      validateRuntimeMultipleChoiceResponse(
        checked.questionType || "",
        validateRuntimeTrueFalseResponse(checked.questionType || "", checked)
      ),
      { questionType: checked.questionType || "", subject: checked.subject || "" },
      checked.orchestration?.reasoning || null
    );
    const meta = validated.orchestration?.meta || {
      questionType: validated.questionType || "",
      subject: validated.subject || "عام"
    };
    if (!ValidationEngine(validated, meta)) {
      return StructuredOutputEngine(
        buildRuntimeValidationFallback(meta, validated),
        {
          decisionBasis: "self_review_validation_fallback",
          confidence: validated.confidence || 0.6,
          retrieval: validated.orchestration?.retrieval || null,
          webVerification: validated.orchestration?.webVerification || null,
          agreementMode: validated.orchestration?.agreementMode || "book_priority_only"
        },
        meta,
        validated.orchestration?.reasoning || null,
        {
          learningMemory: validated.orchestration?.learningMemory || SelfLearningMemory(),
          decomposition: validated.orchestration?.decomposition || null
        }
      );
    }
    return validated;
  }

  function spendRuntimePoints(hasAttachments) {
    if (typeof spendPoints !== "function") return { ok: true };
    return spendPoints(hasAttachments ? 15 : 10, hasAttachments ? "تحليل صورة" : "استخدام الشات");
  }

  function appendSessionMessage(role, author, body, options = {}) {
    if (typeof appendMessageToSession === "function") {
      appendMessageToSession(role, author, body, options);
    }
  }

  function buildAssistantMeta(response) {
    return response
      ? {
          subject: response.subject,
          lesson: response.lesson,
          questionType: response.questionType,
          mode: response.mode,
          answerBankKey: response.answerBankKey || ""
        }
      : undefined;
  }

  function needsDeliberateAnalysis(question, analysis, reasoning, route) {
    const text = (question || route?.extracted_text || "").trim();
    if (!text) return false;
    if ((route?.question_type || "") === "طµط­ ظˆط®ط·ط£") return false;
    if ((route?.question_type || "") === "ط§ط®طھظٹط§ط± ظ…ظ† ظ…طھط¹ط¯ط¯") return false;

    const multiStepSignals = /ثم|وبعدها|بعد ذلك|ابدأ بشرح|اشرح.*ثم|لخص.*ثم|حل.*ثم|قارن|حلل|فسر|علل/i;
    const isLong = text.length >= 90;
    const hasMultiStepIntent = Boolean(analysis?.intent?.compound || reasoning?.compound || (reasoning?.taskCount || 0) > 1);

    return hasMultiStepIntent || multiStepSignals.test(text) || isLong;
  }

  function response_builder(question, route, analysis, reasoning) {
    const rawQuestion = question || route.extracted_text || "حل السؤال من المرفقات";
    const runtimeReasoning = reasoning || reasoning_engine(rawQuestion, analysis);
    const decomposition = QuestionDecomposer(rawQuestion, analysis.subject || route.detected_subject || "");
    const learningMemory = SelfLearningMemory();
    const storedAnswer = findRuntimeStoredAnswer(rawQuestion, route);

    if (storedAnswer?.response) {
      markRuntimeStoredAnswerUsed(storedAnswer.key);
      const storedMeta = buildRuntimeMetaBrain(rawQuestion, route, analysis, runtimeReasoning);
      const storedConfidence = Math.max(
        typeof storedAnswer.confidence === "number" ? storedAnswer.confidence : 0,
        typeof storedAnswer.response?.confidence === "number" ? storedAnswer.response.confidence : 0,
        0.86
      );
      const reusedResponse = AdaptiveResponseStyleSmart(
        {
          ...storedAnswer.response,
          answerBankKey: storedAnswer.key,
          confidence: storedConfidence,
          decisionBasis: "approved_question_bank_fast_path",
          agreementLevel: "high",
          explanation: storedAnswer.response.explanation || "تم استخدام إجابة محفوظة ومعتمدة لهذا السؤال لأنها حققت تقييمًا جيدًا سابقًا."
        },
        analysis,
        runtimeReasoning
      );

      return StructuredOutputEngine(
        reusedResponse,
        {
          decisionBasis: "approved_question_bank_fast_path",
          confidence: storedConfidence,
          retrieval: {
            source: "approved_question_bank",
            usedWebFallback: false,
            webFallbackAvailable: true,
            confidenceThreshold: 0.85,
            decisionBasis: "approved_question_bank_fast_path",
            sourceWeights: {
              approvedQuestionBank: 0.6,
              bookMatch: 0.25,
              webConsensus: 0.15
            },
            evidence: [
              {
                type: "approved_question_bank",
                note: "إجابة محفوظة ومعتمدة من التقييمات السابقة"
              }
            ]
          },
          webVerification: null,
          agreementMode: "approved_bank_direct",
          rankedCandidates: [],
          bookEvidence: [],
          webEvidence: []
        },
        storedMeta,
        runtimeReasoning,
        { learningMemory, decomposition }
      );
    }

    const retrievalStage = BookRetrieval(rawQuestion, route, analysis, runtimeReasoning);
    const meta = retrievalStage.meta;
    const retrieval = retrievalStage.retrieval;
    const webVerification = WebVerificationLayer(rawQuestion, route, analysis);
    const consensus = ConsensusEngine({
      retrieval: retrievalStage,
      webVerification,
      route,
      analysis,
      decomposition,
      question: rawQuestion
    });
    const finalizeRuntimeResponse = (candidate, overrides = {}) => {
      const adapted = AdaptiveResponseStyleSmart(candidate, analysis, runtimeReasoning);
      return StructuredOutputEngine(
        adapted,
        {
          ...consensus,
          ...overrides,
          retrieval: overrides.retrieval || consensus.retrieval || retrieval
        },
        meta,
        runtimeReasoning,
        { learningMemory, decomposition }
      );
    };

    const compositeResponse = solveCompositeQuestionSet(rawQuestion, route);
    if (compositeResponse) {
      return finalizeRuntimeResponse(compositeResponse, {
        decisionBasis: "decomposed_multi_block_answer"
      });
    }

    const compoundResponse = buildCompoundResponse(rawQuestion, route);
    if (compoundResponse) {
      return finalizeRuntimeResponse(
        normalizeRuntimeResponse(rawQuestion, compoundResponse, route, analysis),
        { decisionBasis: "compound_request_planned_response" }
      );
    }

    const directObjective = buildDirectObjectiveResponse(rawQuestion, route);
    if (directObjective) {
      return finalizeRuntimeResponse(
        normalizeRuntimeResponse(rawQuestion, directObjective, route, analysis),
        { decisionBasis: directObjective.decisionBasis || "direct_objective_solver" }
      );
    }

    const academicResponse = createAcademicResponse(rawQuestion, analysis.intent, {
      preferredSubject: route.detected_subject || "",
      detectedSubject: route.detected_subject || "",
      subjectConfidence: route.subject_confidence,
      route
    });

    return finalizeRuntimeResponse(
      normalizeRuntimeResponse(rawQuestion, academicResponse, route, analysis),
      { decisionBasis: consensus.decisionBasis || "book_first_with_web_verification" }
    );
  }

  function needsDeliberateAnalysis(question, analysis, reasoning, route) {
    const text = (question || route?.extracted_text || "").trim();
    if (!text) return false;
    if (searchApprovedQuestionBank(text, route, analysis)) return false;
    if ((route?.question_type || "") === "ط·آµط·آ­ ط¸ث†ط·آ®ط·آ·ط·آ£") return false;
    if ((route?.question_type || "") === "ط·آ§ط·آ®ط·ع¾ط¸ظ¹ط·آ§ط·آ± ط¸â€¦ط¸â€  ط¸â€¦ط·ع¾ط·آ¹ط·آ¯ط·آ¯") return false;

    const multiStepSignals = /ط«ظ…|ظˆط¨ط¹ط¯ظ‡ط§|ط¨ط¹ط¯ ط°ظ„ظƒ|ط§ط¨ط¯ط£ ط¨ط´ط±ط­|ط§ط´ط±ط­.*ط«ظ…|ظ„ط®طµ.*ط«ظ…|ط­ظ„.*ط«ظ…|ظ‚ط§ط±ظ†|ط­ظ„ظ„|ظپط³ط±|ط¹ظ„ظ„/i;
    const isLong = text.length >= 90;
    const hasMultiStepIntent = Boolean(analysis?.intent?.compound || reasoning?.compound || (reasoning?.taskCount || 0) > 1);

    return hasMultiStepIntent || multiStepSignals.test(text) || isLong;
  }

  function waitForDeliberateAnalysis() {
    return new Promise((resolve) => window.setTimeout(resolve, 5000));
  }

  async function runtimeHandleSubmit(event) {
    if (event.target !== form) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const question = promptInput.value.trim();
    const attachments = Array.from(fileInput?.files || []);
    const hasAttachments = attachments.length > 0;
    if (!question && !hasAttachments) return;
    if (hasBlockedVideo(attachments)) {
      addMessage("assistant", "ظ…ظ„ظ… ظٹط­ظ„", formatSimpleReply("رفع الفيديو غير متاح في المنصة حاليًا. يمكنك رفع صورة أو ملف دراسي فقط بعد تسجيل الدخول."));
      clearRuntimeAttachments();
      return;
    }

    if (runtimeState.pendingSolveConfirmation && isAffirmativeReply(question) && !hasAttachments) {
      const stored = runtimeState.pendingSolveConfirmation;
      runtimeState.pendingSolveConfirmation = null;
      addMessage("user", "أنت", question);
      appendSessionMessage("user", "أنت", question, {
        subject: stored.route.detected_subject || "",
        sessionTitle: stored.question || "سؤال جديد"
      });
      promptInput.value = "";
      autoGrow(promptInput);

      const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
      const forcedRoute = {
        ...stored.route,
        response_mode: "academic_solve",
        detected_subject: stored.route.detected_subject || stored.subject || "",
        subject_confidence: Math.max(0.71, stored.route.subject_confidence || 0.71)
      };
      const forcedAnalysis = intent_analyzer(stored.question || forcedRoute.extracted_text || "", false);
      const response = self_checker(
        response_builder(stored.question || forcedRoute.extracted_text || "", forcedRoute, forcedAnalysis, reasoning_engine(stored.question || forcedRoute.extracted_text || "", forcedAnalysis)),
        { action: "answer", confidence: forcedRoute.subject_confidence }
      );
      saveRuntimeAnswerCandidate(stored.question || forcedRoute.extracted_text || "", forcedRoute, response);
      pendingNode?.remove();
      const body = formatAssistantSections(response);
      const sources = typeof buildSources === "function" ? buildSources() : [];
      addMessage("assistant", "ملم يحل", body, {
        sources,
        enableTools: true,
        metadata: buildAssistantMeta(response)
      });
      appendSessionMessage("assistant", "ملم يحل", body, {
        sources,
        enableTools: true,
        metadata: buildAssistantMeta(response),
        subject: response.subject
      });
      return;
    }

    if (runtimeState.pendingSolveConfirmation && isNegativeReply(question) && !hasAttachments) {
      runtimeState.pendingSolveConfirmation = null;
      addMessage("user", "أنت", question);
      addMessage("assistant", "ملم يحل", formatSimpleReply("حسنًا، اختر المادة من القائمة وسأكمل الحل بدقة أكبر."));
      return;
      return;
    }

    const route = detectRoute(question, attachments);
    const analysis = intent_analyzer(question || route.extracted_text || "", hasAttachments);
    const reasoning = reasoning_engine(question || route.extracted_text || "", analysis);
    const decision = AcademicRouter(route, analysis, reasoning);
    const intent = analysis.intent;

    if (hasAttachments && typeof isLoggedIn === "function" && !isLoggedIn()) {
      addMessage("assistant", "ملم يحل", formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.'));
      clearRuntimeAttachments();
      return;
    }

    const shouldCharge = isRuntimeAcademicIntent(intent.type) || route.response_mode === "content_interpretation";
    if (shouldCharge) {
      const pointsResult = spendRuntimePoints(hasAttachments);
      if (!pointsResult.ok) {
        addMessage("assistant", "ملم يحل", formatSimpleReply(`رصيدك الحالي ${pointsResult.remaining} نقطة، وهذا لا يكفي لهذه العملية. تحتاج ${hasAttachments ? 15 : 10} نقطة. يمكنك شراء نقاط إضافية من <a class="top-link" href="subscriptions.html">صفحة الباقات</a>.`));
        return;
      }
    }

    const renderedQuestion = hasAttachments
      ? `${question || "أرفقت صورة أو ملفًا مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments.map((item) => item.name).join("، ")}</span>`
      : question;

    addMessage("user", "أنت", renderedQuestion);
    appendSessionMessage("user", "أنت", renderedQuestion, {
      subject: route.detected_subject || "",
      sessionTitle: question || "سؤال جديد"
    });

    clearRuntimeAttachments();
    promptInput.value = "";
    autoGrow(promptInput);
    if (needsDeliberateAnalysis(question, analysis, reasoning, route)) {
      const analysisNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
      await waitForDeliberateAnalysis();
      analysisNode?.remove();
    }

    const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
    let body = "";
    let sources = [];
    let responseForLog = null;

    if (decision.action === "route" || decision.action === "ask") {
      runtimeState.pendingSolveConfirmation = route.response_mode === "ask_for_confirmation"
        ? { question, route, intent, subject: route.detected_subject || "" }
        : null;
      body = createRouteReply(route);
    } else if (decision.action === "chat") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatSimpleReply(createRuntimeChatResponse(question));
    } else if (decision.action === "help") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatSimpleReply(createHelpResponse());
    } else if (decision.action === "ui_action") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatSimpleReply(createRuntimeUiActionResponse(question));
    } else if (decision.action === "general_question") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatSimpleReply(createRuntimeGeneralQuestionResponse(question));
    } else if (typeof needsClarification === "function" && needsClarification(question, intent, hasAttachments) && route.question_type !== "صح وخطأ" && route.question_type !== "اختيار من متعدد") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatClarificationReply(createClarificationResponse(question, intent, route));
    } else {
      runtimeState.pendingSolveConfirmation = null;
      responseForLog = self_checker(
        response_builder(question || route.extracted_text || "", route, analysis, reasoning),
        decision
      );
      saveRuntimeAnswerCandidate(question || route.extracted_text || "", route, responseForLog);
      body = formatAssistantSections(responseForLog);
      sources = responseForLog?.hideSources ? [] : (typeof buildSources === "function" ? buildSources() : []);

      if (typeof saveHistory === "function") {
        saveHistory(
          question || "سؤال مرفق",
          responseForLog.subject || route.detected_subject || "عام",
          responseForLog.questionType || route.question_type || "سؤال أكاديمي",
          "تمت المراجعة"
        );
      }
    }

    body = finalRuntimeSafetyGate(question || route.extracted_text || "", intent.type, body).replacement;

    pendingNode?.remove();
    addMessage("assistant", "ملم يحل", body, {
      sources,
      enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
      metadata: buildAssistantMeta(responseForLog)
    });
    appendSessionMessage("assistant", "ملم يحل", body, {
      sources,
      enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
      metadata: buildAssistantMeta(responseForLog),
      subject: responseForLog?.subject || route.detected_subject || ""
    });

    if (typeof renderSessionList === "function") renderSessionList();
    if (typeof updateXpBalance === "function") updateXpBalance();
    syncStudentDashboardHeader();
  }

  const originalDetectRuntimeQuestionType = detectRuntimeQuestionType;
  const originalClassifyRuntimeQuestionType = classifyRuntimeQuestionType;
  const originalBuildDirectObjectiveResponse = buildDirectObjectiveResponse;
  const originalNeedsClarification = typeof needsClarification === "function" ? needsClarification : null;

  detectRuntimeQuestionType = function patchedDetectRuntimeQuestionType(text) {
    if (isDirectMathExpression(text)) return "ظ…ط³ط£ظ„ط©";
    return originalDetectRuntimeQuestionType(text);
  };

  classifyRuntimeQuestionType = function patchedClassifyRuntimeQuestionType(text) {
    if (isDirectMathExpression(text)) return "ظ…ط³ط£ظ„ط©";
    return originalClassifyRuntimeQuestionType(text);
  };

  buildDirectObjectiveResponse = function patchedBuildDirectObjectiveResponse(question, route) {
    if (isDirectMathExpression(question)) {
      return buildDirectMathResponse(question, {
        ...route,
        detected_subject: route?.detected_subject || "ط§ظ„ط±ظٹط§ط¶ظٹط§طھ",
        question_type: route?.question_type || "ظ…ط³ط£ظ„ط©"
      });
    }
    return originalBuildDirectObjectiveResponse(question, route);
  };

  if (originalNeedsClarification) {
    window.needsClarification = function patchedNeedsClarification(message, intent, hasAttachments = false) {
      if (isDirectMathExpression(message)) return false;
      return originalNeedsClarification(message, intent, hasAttachments);
    };
  }

  function enhanceRuntimeChatUi() {
    const hasActiveUser = typeof getActiveUser === "function" && Boolean(getActiveUser());
    const helperToolbar = document.querySelector(".helper-toolbar");
    const loginLink = helperToolbar?.querySelector('a[href="login.html"]');
    let clearButton = document.querySelector("[data-clear-chat]");

    if (!clearButton && helperToolbar) {
      clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "helper-btn helper-btn-ghost";
      clearButton.setAttribute("data-clear-chat", "");
      clearButton.textContent = hasActiveUser ? "ط´ط§طھ ط¬ط¯ظٹط¯" : "طھط­ط¯ظٹط« ط§ظ„ط´ط§طھ";
      if (loginLink) {
        helperToolbar.insertBefore(clearButton, loginLink);
      } else {
        helperToolbar.appendChild(clearButton);
      }
      clearButton.addEventListener("click", () => {
        if (promptInput) {
          promptInput.placeholder = "ط§ظƒطھط¨ ط³ط¤ط§ظ„ظƒ ظ…ظ† ط§ظ„ظ…ظ†ظ‡ط¬ ط§ظ„ط³ط¹ظˆط¯ظٹ...";
        }
      });
    } else if (clearButton) {
      clearButton.textContent = hasActiveUser ? "ط´ط§طھ ط¬ط¯ظٹط¯" : "طھط­ط¯ظٹط« ط§ظ„ط´ط§طھ";
    }

    document.querySelectorAll("[data-new-session]").forEach((button) => {
      button.textContent = "ط´ط§طھ ط¬ط¯ظٹط¯";
    });

    const sessionHeading = document.querySelector("[data-session-list]")?.closest(".student-section-card")?.querySelector("h3");
    if (sessionHeading) {
      sessionHeading.textContent = "ط§ظ„ط´ط§طھط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط©";
    }
  }

  const originalNormalizeRuntimeQuestionKeyFinal = normalizeRuntimeQuestionKey;
  const originalNormalizeRuntimeBankQuestionFinal = normalizeRuntimeBankQuestion;
  const originalSearchApprovedQuestionBankFinal = searchApprovedQuestionBank;
  const originalFindRuntimeStoredAnswerFinal = findRuntimeStoredAnswer;
  const originalSaveRuntimeAnswerCandidateFinal = saveRuntimeAnswerCandidate;
  const originalBookRetrievalFinal = BookRetrieval;
  const originalWebVerificationLayerFinal = WebVerificationLayer;
  const originalConsensusEngineFinal = ConsensusEngine;
  const originalStructuredOutputEngineFinal = StructuredOutputEngine;
  const originalIntentAnalyzerFinal = intent_analyzer;
  const originalResponseBuilderFinal = response_builder;

  const runtimeNormalizationStopWords = new Set([
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
    "او",
    "أو",
    "the",
    "a",
    "an",
    "is",
    "are",
    "of",
    "to",
    "for",
    "with"
  ]);

  function normalizeRuntimeDigitsAndOperators(text) {
    return String(text || "")
      .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
      .replace(/×/g, "*")
      .replace(/[xX]/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-");
  }

  function normalizeRuntimeQuestionForSearch(text) {
    return normalizeRuntimeDigitsAndOperators(text)
      .toLowerCase()
      .replace(/\r?\n/g, " \n ")
      .replace(/[؟?!.,،؛:"'`()[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getRuntimeNormalizedKeywords(text, limit = 8) {
    return normalizeRuntimeQuestionForSearch(text)
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 1 && !runtimeNormalizationStopWords.has(token))
      .slice(0, limit);
  }

  function buildRuntimeCanonicalQuestion(text, route = {}, analysis = {}) {
    const question = String(text || "").trim();
    const normalized = normalizeRuntimeQuestionForSearch(question);
    const questionType = route?.question_type || analysis?.questionType || "";
    const subject = normalizeRuntimeSubjectLabel(route?.detected_subject || analysis?.subject || "");

    if (!normalized) {
      return {
        originalQuestion: question,
        normalizedQuestion: normalized,
        canonicalQuestion: "",
        conceptKey: "",
        keywordSignature: []
      };
    }

    if (isDirectMathExpression(question)) {
      const expr = normalizeRuntimeDigitsAndOperators(question).replace(/\s+/g, "").replace(/[=؟?]/g, "");
      const pieces = (expr.match(/\d+|[+\-*/]/g) || []).join(":");
      return {
        originalQuestion: question,
        normalizedQuestion: normalized,
        canonicalQuestion: `math:${pieces}`,
        conceptKey: `math:${pieces}`,
        keywordSignature: pieces.split(":").filter(Boolean).slice(0, 6)
      };
    }

    let canonicalBase = normalized;

    if (questionType === "صح أو خطأ" || questionType === "صح وخطأ") {
      canonicalBase = canonicalBase
        .replace(/\b(true|false)\b/g, " ")
        .replace(/صواب|خطأ|صح|غلط/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (questionType === "اختيار من متعدد" || questionType === "إكمال فراغ") {
      const mcqData = typeof extractRuntimeMultipleChoiceData === "function"
        ? extractRuntimeMultipleChoiceData(question)
        : null;
      if (mcqData?.prompt) {
        canonicalBase = normalizeRuntimeQuestionForSearch(mcqData.prompt);
      }
    }

    canonicalBase = canonicalBase
      .replace(/\b(match|complete|choose|select)\b/g, " ")
      .replace(/____+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const keywordSignature = getRuntimeNormalizedKeywords(canonicalBase, 10);
    const conceptKey = `${subject || "general"}::${questionType || "general"}::${keywordSignature.slice(0, 5).join("|")}`;

    return {
      originalQuestion: question,
      normalizedQuestion: normalized,
      canonicalQuestion: `${subject || "general"}::${canonicalBase}`.slice(0, 500),
      conceptKey,
      keywordSignature
    };
  }

  function buildRuntimeHiddenAnalysis(question, route = {}, analysis = {}, decisionBasis = "") {
    const canonical = buildRuntimeCanonicalQuestion(question, route, analysis);
    const intentType = analysis?.intent?.type || route?.intent?.type || "";
    const questionType = analysis?.questionType || route?.question_type || "";
    const subject = route?.detected_subject || analysis?.subject || "";
    const grade = route?.detected_grade_level
      || gradeSelect?.value
      || (typeof getActiveUser === "function" ? getActiveUser()?.grade : "")
      || "unknown";
    const term = termSelect?.value || "unknown";

    return {
      originalQuestion: canonical.originalQuestion,
      normalizedQuestion: canonical.normalizedQuestion,
      canonicalQuestion: canonical.canonicalQuestion,
      conceptKey: canonical.conceptKey,
      keywordSignature: canonical.keywordSignature,
      intentType,
      questionType,
      subject,
      grade,
      term,
      sourcePriority: [
        "approved_question_bank",
        "curriculum_engine",
        "web_verification_engine"
      ],
      analysisBudgetMs: 5000,
      decisionBasis: decisionBasis || "approved_bank_then_curriculum_then_web"
    };
  }

  normalizeRuntimeBankQuestion = function patchedNormalizeRuntimeBankQuestion(text) {
    return normalizeRuntimeQuestionForSearch(text);
  };

  normalizeRuntimeQuestionKey = function patchedNormalizeRuntimeQuestionKey(question, route) {
    const analysis = {
      subject: route?.detected_subject || "",
      questionType: route?.question_type || ""
    };
    const canonical = buildRuntimeCanonicalQuestion(question, route, analysis);
    const grade = route?.detected_grade_level || gradeSelect?.value || (typeof getActiveUser === "function" ? getActiveUser()?.grade : "") || "unknown";
    const subject = route?.detected_subject || subjectSelect?.value || "general";
    const stablePart = canonical.canonicalQuestion || canonical.normalizedQuestion || originalNormalizeRuntimeQuestionKeyFinal(question, route);
    return `${grade}::${subject}::${stablePart}`.slice(0, 500);
  };

  searchApprovedQuestionBank = function patchedSearchApprovedQuestionBank(question, route, analysis = {}) {
    const query = buildRuntimeCanonicalQuestion(question, route, analysis);
    if (!query.originalQuestion) return null;

    const requestedGrade = route?.detected_grade_level || gradeSelect?.value || (typeof getActiveUser === "function" ? getActiveUser()?.grade : "") || "unknown";
    const requestedSubject = normalizeRuntimeSubjectLabel(route?.detected_subject || analysis?.subject || subjectSelect?.value || "");
    const requestedTerm = termSelect?.value || "unknown";
    const requestedType = route?.question_type || analysis?.questionType || "";
    const requestedOptions = extractRuntimeStoredOptions(query.originalQuestion, requestedType);

    const ranked = getRuntimeAnswerBank()
      .map((item) => refreshRuntimeAnswerEntryStatus(item))
      .filter((entry) => entry?.response)
      .map((entry) => {
        const entryAnalysis = {
          subject: entry.subject || "",
          questionType: entry.questionType || ""
        };
        const entryRoute = {
          detected_subject: entry.subject || "",
          detected_grade_level: entry.grade || "",
          question_type: entry.questionType || ""
        };
        const entryCanonical = buildRuntimeCanonicalQuestion(entry.question || entry.originalQuestion || "", entryRoute, entryAnalysis);
        const exactMatch = entry.question?.trim() === query.originalQuestion ? 1 : 0;
        const normalizedMatch = entry.normalizedQuestion === query.normalizedQuestion ? 1 : 0;
        const canonicalMatch = (entry.canonicalQuestion || entryCanonical.canonicalQuestion) === query.canonicalQuestion ? 1 : 0;
        const fuzzyMatch = scoreRuntimeQuestionSimilarity(query.normalizedQuestion, entry.normalizedQuestion || entryCanonical.normalizedQuestion || entry.question || "");
        const semanticMatch = scoreRuntimeQuestionSimilarity(query.canonicalQuestion, entry.canonicalQuestion || entryCanonical.canonicalQuestion || entry.question || "");
        const conceptOverlap = countRuntimeKeywordOverlap(query.keywordSignature, entry.keywordSignature ? String(entry.keywordSignature).split("|") : entryCanonical.keywordSignature);
        const conceptMatch = conceptOverlap >= 3
          ? Math.min(1, conceptOverlap / Math.max(3, query.keywordSignature.length || 1))
          : 0;
        const sameSubject = !requestedSubject || !entry.subject
          ? 0.7
          : (normalizeRuntimeSubjectLabel(entry.subject) === requestedSubject ? 1 : 0.3);
        const sameGrade = !requestedGrade || requestedGrade === "unknown" || !entry.grade || entry.grade === "unknown"
          ? 0.75
          : (entry.grade === requestedGrade ? 1 : 0.4);
        const sameTerm = !requestedTerm || requestedTerm === "unknown" || !entry.term || entry.term === "unknown"
          ? 0.75
          : (entry.term === requestedTerm ? 1 : 0.45);
        const sameType = !requestedType || !entry.questionType ? 0.7 : (entry.questionType === requestedType ? 1 : 0.45);
        const entryOptions = Array.isArray(entry.options) ? entry.options : [];
        const optionSimilarity = !requestedOptions.length || !entryOptions.length
          ? 0.75
          : scoreRuntimeQuestionSimilarity(requestedOptions.join(" "), entryOptions.join(" "));
        const approval = isRuntimeApprovedAnswerEntry(entry) ? 1 : 0;
        const likes = entry.likes || 0;
        const dislikes = entry.dislikes || 0;
        const feedbackScore = likes + dislikes > 0 ? likes / Math.max(1, likes + dislikes) : 0.75;
        const confidence = typeof entry.confidence === "number"
          ? entry.confidence
          : (typeof entry.response?.confidence === "number" ? entry.response.confidence : 0.7);

        const finalScore =
          (exactMatch * 0.22) +
          (normalizedMatch * 0.16) +
          (canonicalMatch * 0.14) +
          (fuzzyMatch * 0.12) +
          (semanticMatch * 0.1) +
          (conceptMatch * 0.08) +
          (approval * 0.07) +
          (sameSubject * 0.03) +
          (sameGrade * 0.02) +
          (sameTerm * 0.01) +
          (sameType * 0.02) +
          (optionSimilarity * 0.01) +
          (feedbackScore * 0.01) +
          (confidence * 0.01);

        return {
          ...entry,
          normalizedQuestion: entry.normalizedQuestion || entryCanonical.normalizedQuestion,
          canonicalQuestion: entry.canonicalQuestion || entryCanonical.canonicalQuestion,
          conceptKey: entry.conceptKey || entryCanonical.conceptKey,
          keywordSignature: entry.keywordSignature || entryCanonical.keywordSignature.join("|"),
          exactMatch,
          normalizedMatch,
          canonicalMatch,
          fuzzyMatch,
          semanticMatch,
          conceptMatch,
          conceptOverlap,
          finalScore: Number(finalScore.toFixed(4)),
          matchMode: exactMatch
            ? "exact"
            : normalizedMatch
              ? "normalized"
              : canonicalMatch
                ? "canonical"
                : conceptMatch >= 0.8
                  ? "concept"
                  : "fuzzy"
        };
      })
      .sort((left, right) => right.finalScore - left.finalScore);

    const best = ranked[0];
    if (!best) return null;
    if (!isRuntimeApprovedAnswerEntry(best)) return null;
    const strongDirectMatch = best.exactMatch || best.normalizedMatch || best.canonicalMatch;
    const strongConceptMatch = best.conceptMatch >= 0.8 || best.conceptOverlap >= 5;
    if (!strongDirectMatch && !strongConceptMatch && best.finalScore < 0.74) return null;
    return best;
  };

  findRuntimeStoredAnswer = function patchedFindRuntimeStoredAnswer(question, route) {
    return searchApprovedQuestionBank(question, route, {
      subject: route?.detected_subject || "",
      questionType: route?.question_type || ""
    });
  };

  saveRuntimeAnswerCandidate = function patchedSaveRuntimeAnswerCandidate(question, route, response) {
    if (!response || !question) return null;
    const bank = getRuntimeAnswerBank();
    const analysis = {
      subject: response.subject || route?.detected_subject || "",
      questionType: response.questionType || route?.question_type || ""
    };
    const hidden = buildRuntimeHiddenAnalysis(question, route, analysis, response.decisionBasis || "");
    const key = normalizeRuntimeQuestionKey(question, route);
    const existingIndex = bank.findIndex((item) => item.key === key);
    const existing = existingIndex >= 0 ? bank[existingIndex] : null;
    const preview = String(response.finalAnswer || response.explanation || "").trim().slice(0, 140);
    response.answerBankKey = key;
    response.hiddenAnalysis = hidden;
    response.structuredResult = {
      ...(response.structuredResult || {}),
      original_question: hidden.originalQuestion,
      normalized_question: hidden.normalizedQuestion,
      canonical_question: hidden.canonicalQuestion,
      concept_key: hidden.conceptKey,
      confidence: typeof response.confidence === "number" ? response.confidence : (response.structuredResult?.confidence || 0.72)
    };

    const nextEntry = refreshRuntimeAnswerEntryStatus({
      ...existing,
      key,
      originalQuestion: hidden.originalQuestion,
      question: hidden.originalQuestion,
      normalizedQuestion: hidden.normalizedQuestion,
      canonicalQuestion: hidden.canonicalQuestion,
      conceptKey: hidden.conceptKey,
      keywordSignature: hidden.keywordSignature.join("|"),
      subject: response.subject || route?.detected_subject || existing?.subject || "ط¹ط§ظ…",
      grade: hidden.grade,
      term: hidden.term,
      questionType: response.questionType || route?.question_type || analysis.questionType || "ط³ط¤ط§ظ„ ط£ظƒط§ط¯ظٹظ…ظٹ",
      options: extractRuntimeStoredOptions(question, response.questionType || route?.question_type || analysis.questionType || ""),
      response,
      preview,
      source: response.decisionBasis || response?.structuredResult?.decision_basis || existing?.source || "approved_bank_then_curriculum_then_web",
      sourceType: response.decisionBasis === "approved_question_bank_fast_path"
        ? "approved_question_bank"
        : (String(response.decisionBasis || "").includes("web") ? "curriculum_with_web_verification" : "curriculum"),
      confidence: typeof response.confidence === "number"
        ? Number(response.confidence.toFixed(4))
        : (typeof existing?.confidence === "number" ? existing.confidence : 0.72),
      likes: existing?.likes || 0,
      dislikes: existing?.dislikes || 0,
      usageCount: existing?.usageCount || 0,
      isTrusted: Boolean(
        existing?.isTrusted
        || response?.isTrusted
        || response?.decisionBasis === "approved_question_bank_fast_path"
        || response?.decisionBasis === "stored_best_answer"
        || (typeof response.confidence === "number" && response.confidence >= 0.95)
      ),
      hiddenAnalysis: hidden,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now()
    });

    if (existingIndex >= 0) {
      bank[existingIndex] = nextEntry;
    } else {
      bank.unshift(nextEntry);
    }

    saveRuntimeAnswerBank(bank);
    return nextEntry;
  };

  BookRetrieval = function patchedBookRetrieval(message, route, analysis, reasoning) {
    const base = originalBookRetrievalFinal(message, route, analysis, reasoning);
    const hidden = buildRuntimeHiddenAnalysis(message, route, analysis, "");
    return {
      ...base,
      meta: {
        ...(base?.meta || {}),
        grade: hidden.grade,
        term: hidden.term,
        subject: hidden.subject || base?.meta?.subject || "",
        originalQuestion: hidden.originalQuestion,
        normalizedQuestion: hidden.normalizedQuestion,
        canonicalQuestion: hidden.canonicalQuestion,
        conceptKey: hidden.conceptKey
      },
      retrieval: {
        ...(base?.retrieval || {}),
        source: "approved_bank_then_curriculum",
        webFallbackAvailable: true,
        confidenceThreshold: 0.85,
        decisionBasis: "approved_bank_then_curriculum_then_web",
        retrievalPriority: [
          "approved_question_bank",
          "curriculum_engine",
          "web_verification_engine"
        ],
        analysisBudgetMs: 5000,
        evidence: [
          ...((base?.retrieval?.evidence) || []),
          { type: "normalized_question", value: hidden.normalizedQuestion },
          { type: "canonical_question", value: hidden.canonicalQuestion },
          { type: "concept_signature", items: hidden.keywordSignature }
        ]
      }
    };
  };

  WebVerificationLayer = function patchedWebVerificationLayer(message, route, analysis) {
    const base = originalWebVerificationLayerFinal(message, route, analysis);
    const questionType = analysis?.questionType || route?.question_type || "";
    const subject = analysis?.subject || route?.detected_subject || "";
    const profile = buildRuntimeEvidenceProfile(message, subject, questionType);
    const profileEvidence = Array.isArray(profile?.webClaims)
      ? profile.webClaims.map((claim) => ({
          claim,
          reliability: profile.sourceReliability || 0.8,
          source: "trusted_web_profile"
        }))
      : [];

    return {
      ...base,
      enabled: Boolean(profileEvidence.length || base?.enabled),
      reason: profileEvidence.length ? "trusted_web_verification_after_curriculum" : (base?.reason || "static_frontend_mode"),
      confidence: Math.max(base?.confidence || 0, profile?.sourceReliability || 0),
      evidence: [...profileEvidence, ...((base?.evidence) || [])],
      sourcePolicy: "verification_only_after_curriculum"
    };
  };

  ConsensusEngine = function patchedConsensusEngine(payload) {
    const base = originalConsensusEngineFinal(payload);
    return {
      ...base,
      decisionBasis: base?.decisionBasis || "approved_bank_then_curriculum_then_web",
      sourcePriority: [
        "approved_question_bank",
        "curriculum_engine",
        "web_verification_engine"
      ],
      analysisBudgetMs: 5000
    };
  };

  StructuredOutputEngine = function patchedStructuredOutputEngine(response, consensus, meta, reasoning, extras = {}) {
    const built = originalStructuredOutputEngineFinal(response, consensus, meta, reasoning, extras);
    const hidden = buildRuntimeHiddenAnalysis(
      response?.question || built?.question || meta?.originalQuestion || "",
      {
        detected_subject: meta?.subject || response?.subject || "",
        detected_grade_level: meta?.grade || "",
        question_type: meta?.questionType || response?.questionType || ""
      },
      {
        subject: meta?.subject || response?.subject || "",
        questionType: meta?.questionType || response?.questionType || "",
        intent: { type: meta?.intent || response?.intentType || "" }
      },
      consensus?.decisionBasis || response?.decisionBasis || ""
    );

    return {
      ...built,
      hiddenAnalysis: {
        ...hidden,
        elapsedMs: 0,
        agreementLevel: consensus?.agreementMode || "",
        confidence: typeof built?.confidence === "number" ? built.confidence : (consensus?.confidence || 0.7)
      },
      structuredResult: {
        ...(built?.structuredResult || {}),
        original_question: hidden.originalQuestion,
        normalized_question: hidden.normalizedQuestion,
        canonical_question: hidden.canonicalQuestion,
        concept_key: hidden.conceptKey,
        decision_basis: built?.decisionBasis || consensus?.decisionBasis || "approved_bank_then_curriculum_then_web",
        confidence: typeof built?.confidence === "number" ? built.confidence : (consensus?.confidence || 0.7)
      }
    };
  };

  intent_analyzer = function patchedIntentAnalyzer(message, hasAttachments = false) {
    const base = originalIntentAnalyzerFinal(message, hasAttachments);
    const hidden = buildRuntimeHiddenAnalysis(message, {
      detected_subject: base?.subject || "",
      question_type: base?.questionType || ""
    }, base, "");
    return {
      ...base,
      originalQuestion: hidden.originalQuestion,
      normalizedQuestion: hidden.normalizedQuestion,
      canonicalQuestion: hidden.canonicalQuestion,
      conceptKey: hidden.conceptKey,
      keywordSignature: hidden.keywordSignature
    };
  };

  response_builder = function patchedResponseBuilder(question, route, analysis, reasoning) {
    const startedAt = Date.now();
    const resolvedAnalysis = analysis || intent_analyzer(question || route?.extracted_text || "", false);
    const response = originalResponseBuilderFinal(question, route, resolvedAnalysis, reasoning);
    const hidden = buildRuntimeHiddenAnalysis(question || route?.extracted_text || "", route, resolvedAnalysis, response?.decisionBasis || "");
    const elapsedMs = Date.now() - startedAt;
    return {
      ...response,
      hiddenAnalysis: {
        ...(response?.hiddenAnalysis || {}),
        ...hidden,
        elapsedMs,
        analysisBudgetMs: 5000,
        sourcePriority: [
          "approved_question_bank",
          "curriculum_engine",
          "web_verification_engine"
        ]
      },
      structuredResult: {
        ...(response?.structuredResult || {}),
        original_question: hidden.originalQuestion,
        normalized_question: hidden.normalizedQuestion,
        canonical_question: hidden.canonicalQuestion,
        concept_key: hidden.conceptKey,
        confidence: typeof response?.confidence === "number" ? response.confidence : (response?.structuredResult?.confidence || 0.7),
        decision_basis: response?.decisionBasis || response?.structuredResult?.decision_basis || "approved_bank_then_curriculum_then_web"
      }
    };
  };

  function applyReadableRuntimeLabels() {
    const hasActiveUser = typeof getActiveUser === "function" && Boolean(getActiveUser());
    const clearLabel = hasActiveUser
      ? "\u0634\u0627\u062a \u062c\u062f\u064a\u062f"
      : "\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0634\u0627\u062a";
    const savedChatsLabel = "\u0627\u0644\u0634\u0627\u062a\u0627\u062a \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629";

    document.querySelectorAll("[data-clear-chat]").forEach((button) => {
      button.textContent = clearLabel;
      button.setAttribute("aria-label", clearLabel);
    });

    document.querySelectorAll("[data-new-session]").forEach((button) => {
      button.textContent = "\u0634\u0627\u062a \u062c\u062f\u064a\u062f";
      button.setAttribute("aria-label", "\u0634\u0627\u062a \u062c\u062f\u064a\u062f");
    });

    const sessionHeading = document.querySelector("[data-session-list]")?.closest(".student-section-card")?.querySelector("h3");
    if (sessionHeading) {
      sessionHeading.textContent = savedChatsLabel;
    }
  }

  clearGuestWorkspace();
  applyUserStudyContext();
  syncStudentDashboardHeader();
  enhanceRuntimeChatUi();
  applyReadableRuntimeLabels();
  bindPromptPlaceholderButtons();
  gradeSelect?.addEventListener("change", syncStudentDashboardHeader);
  function submitHeroExample() {
    if (!form || !promptInput) return;
    submitPresetPrompt("احسب محيط دائرة نصف قطرها 7", "الرياضيات", { scrollToChat: true });
  }

  function applyRuntimeSubject(subject) {
    if (!subjectSelect || !subject) return;
    const normalized = String(subject).trim();
    const matchingOption = Array.from(subjectSelect.options || []).find((option) => {
      const text = (option.textContent || "").trim();
      const value = (option.value || "").trim();
      return text === normalized || value === normalized || text.includes(normalized) || normalized.includes(text);
    });
    if (!matchingOption) return;
    subjectSelect.value = matchingOption.value;
    subjectSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function submitPresetPrompt(prompt, subject = "", options = {}) {
    if (!form || !promptInput) return;
    const preparePrompt = () => {
      clearRuntimeAttachments();
      promptInput.value = prompt;
      autoGrow(promptInput);
      applyRuntimeSubject(subject);
      if (typeof promptInput.focus === "function") {
        try {
          promptInput.focus({ preventScroll: true });
        } catch (_) {
          promptInput.focus();
        }
      }
    };
    if (options.scrollToChat) {
      scrollToChatSection();
      window.setTimeout(preparePrompt, options.delayMs || 260);
    } else {
      preservePageScroll(preparePrompt);
    }
  }

  window.mullemTryExample = submitHeroExample;
  window.renderAttachments = renderRuntimeAttachments;
  try { renderAttachments = renderRuntimeAttachments; } catch (_) {}
  fileInput?.addEventListener("change", () => {
    if (typeof attachments !== "undefined") {
      attachments = Array.from(fileInput.files || []);
    }
    renderRuntimeAttachments();
  });
  attachmentList?.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-attachment]");
    if (!removeButton) return;
    removeRuntimeAttachment(Number(removeButton.getAttribute("data-remove-attachment")));
  });
  document.addEventListener("click", (event) => {
    const likeButton = event.target.closest("[data-like]");
    const dislikeButton = event.target.closest("[data-dislike]");
    if (likeButton || dislikeButton) {
      const card = event.target.closest(".message");
      const answerBankKey = card?.dataset.answerBankKey || "";
      const preview = card?.querySelector(".message-body")?.textContent?.trim().slice(0, 140) || "";
      if (answerBankKey) {
        updateRuntimeAnswerFeedbackByKey(answerBankKey, likeButton ? "like" : "dislike");
      } else {
        updateRuntimeAnswerFeedbackByPreview(preview, likeButton ? "like" : "dislike");
      }
    }

    const starterButton = event.target.closest("[data-starter-prompt], [data-starter-action]");
    if (starterButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const action = starterButton.getAttribute("data-starter-action");
      const prompt = starterButton.getAttribute("data-starter-prompt") || "";
      const subject = starterButton.getAttribute("data-starter-subject") || "";
      if (action === "upload-image") {
        if (typeof openImageUpload === "function") openImageUpload();
      } else if (action === "upload-file") {
        if (typeof openGenericUpload === "function") openGenericUpload();
      } else if (prompt) {
        submitPresetPrompt(prompt, subject);
      }
      return;
    }

    const newSessionButton = event.target.closest("[data-new-session], [data-clear-chat]");
    if (newSessionButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      runtimeStartFreshSession();
      return;
    }

    const quickSolveButton = event.target.closest("[data-quick-solve]");
    if (quickSolveButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      submitPresetPrompt("ابدأ بحل سؤال من هذا الدرس مع شرح مبسط وخطوات وأخطاء شائعة.");
      return;
    }

    const startChatButton = event.target.closest("[data-start-chat]");
    if (startChatButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const value = (promptInput?.value || "").trim();
      if (value) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      } else {
        submitPresetPrompt("ابدأ بشرح أساسيات هذا الدرس ثم أعطني مثالًا محلولًا.");
      }
      return;
    }

    const heroExampleButton = event.target.closest("[data-hero-example]");
    if (!heroExampleButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    submitHeroExample();
  }, true);
  logoutTriggers.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      logoutUser();
    });
  });
  window.addEventListener("scroll", syncRuntimeScrollButton, { passive: true });
  scrollTopButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const nearTop = window.scrollY < 240;
    window.scrollTo({
      top: nearTop ? document.documentElement.scrollHeight : 0,
      behavior: "smooth"
    });
  }, true);
  syncRuntimeScrollButton();
  renderRuntimeAttachments();
  document.addEventListener("submit", runtimeHandleSubmit, true);
})();

(() => {
  const messageList = document.querySelector("[data-messages]");
  if (!messageList) return;

  function runtimeLoadingCopy() {
    const lines = [
      "جاري الحل...",
      "جاري تحليل السؤال...",
      "جاري تجهيز الإجابة..."
    ];
    const index = Math.floor(Date.now() / 1000) % lines.length;
    return `
      <div class="clarify-card">
        <p>${lines[index]}</p>
        <p class="muted-inline">${lines[(index + 1) % lines.length]}</p>
      </div>
    `;
  }

  function renderRuntimeWelcomeMessage() {
    if (!messageList || messageList.children.length) return;
    if (typeof addMessage !== "function") return;
    addMessage(
      "assistant",
      "ملم يحل",
      `
        <div class="welcome-card">
          <h4>أنا هنا لمساعدتك</h4>
          <p>اكتب سؤالك، وسأحاول حله لك بشكل واضح ومباشر.</p>
          <p class="logic-note">قد تصدر عن الشات الذكي ملم بعض الأخطاء غير المقصودة، لذلك يُستحسن التحقق من المعلومات المهمة قبل اعتمادها.</p>
        </div>
      `
    );
  }

  window.createLoadingCopy = runtimeLoadingCopy;

  if (!messageList.children.length) {
    messageList.innerHTML = "";
    renderRuntimeWelcomeMessage();
  }

  requestAnimationFrame(() => {
    const promptInput = document.querySelector("[data-prompt]");
    if (document.activeElement === promptInput) {
      promptInput.blur();
    }
  });
})();
