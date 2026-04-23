const adminStatsRoot = document.querySelector("[data-admin-stats]");
const usersTableRoot = document.querySelector("[data-users-table]");
const feedbackListRoot = document.querySelector("[data-feedback-list]");
const reportListRoot = document.querySelector("[data-report-list]");
const subscribersListRoot = document.querySelector("[data-subscribers-list]");
const activityListRoot = document.querySelector("[data-activity-list]");
const questionBankSummaryRoot = document.querySelector("[data-question-bank-summary]");
const questionBankTableRoot = document.querySelector("[data-question-bank-table]");
const questionBankForm = document.querySelector("[data-question-bank-form]");
const bankQuestionInput = document.querySelector("[data-bank-question]");
const bankTypeInput = document.querySelector("[data-bank-type]");
const bankOptionsInput = document.querySelector("[data-bank-options]");
const bankAnswerInput = document.querySelector("[data-bank-answer]");
const bankExplanationInput = document.querySelector("[data-bank-explanation]");
const bankGradeInput = document.querySelector("[data-bank-grade]");
const bankSubjectInput = document.querySelector("[data-bank-subject]");
const bankTermInput = document.querySelector("[data-bank-term]");
const bankLessonInput = document.querySelector("[data-bank-lesson]");
const bankSourceInput = document.querySelector("[data-bank-source]");
const bankConfidenceInput = document.querySelector("[data-bank-confidence]");
const bankApprovedInput = document.querySelector("[data-bank-approved]");
const bankFormState = document.querySelector("[data-bank-form-state]");
const generatorStatusRoot = document.querySelector("[data-generator-status]");
const generatorForm = document.querySelector("[data-generator-form]");
const generatorCountInput = document.querySelector("[data-generator-count]");
const generatorTermInput = document.querySelector("[data-generator-term]");
const generatorGradesInput = document.querySelector("[data-generator-grades]");
const generatorSubjectsInput = document.querySelector("[data-generator-subjects]");
const generatorToggleButton = document.querySelector("[data-generator-toggle]");
const generatorRunButton = document.querySelector("[data-generator-run]");
const generatorStateCopy = document.querySelector("[data-generator-state-copy]");
const generatorFeedbackRoot = document.querySelector("[data-generator-feedback]");
const generatorLogRoot = document.querySelector("[data-generator-log]");
const gradeBankPanelsRoot = document.querySelector("[data-grade-bank-panels]");
const adminAuthRoot = document.querySelector("[data-admin-auth]");
const adminAppRoot = document.querySelector("[data-admin-app]");
const adminLoginForm = document.querySelector("[data-admin-login-form]");
const adminEmailInput = document.querySelector("[data-admin-email]");
const adminPasswordInput = document.querySelector("[data-admin-password]");
const adminLoginState = document.querySelector("[data-admin-login-state]");
const adminLogoutButton = document.querySelector("[data-admin-logout]");
const passwordToggleButtons = document.querySelectorAll("[data-password-toggle]");

const adminCredentials = {
  email: "admin@mullem.sa",
  password: "Mullem@2026"
};

const adminSessionKey = "mlm_admin_session";
const adminRoles = [
  {
    name: "Super Admin",
    description: "تحكم كامل في المنصة، المستخدمين، التقارير، الصلاحيات، والتصدير.",
    permissions: ["مشاهدة المستخدمين", "تعديل المستخدمين", "حظر المستخدمين", "إدارة المحتوى", "إدارة الاشتراكات", "مشاهدة التقارير", "تصدير البيانات", "سجل النشاطات"]
  },
  {
    name: "Admin",
    description: "إدارة تشغيلية يومية للمستخدمين والمحتوى والاشتراكات.",
    permissions: ["مشاهدة المستخدمين", "تعديل المستخدمين", "حظر المستخدمين", "إدارة المحتوى", "إدارة الاشتراكات", "مشاهدة التقارير", "سجل النشاطات"]
  },
  {
    name: "Moderator",
    description: "متابعة الحسابات والبلاغات والإشراف على السلوك والمحتوى العام.",
    permissions: ["مشاهدة المستخدمين", "حظر المستخدمين", "إدارة المحتوى", "مشاهدة التقارير", "سجل النشاطات"]
  },
  {
    name: "Support",
    description: "مساندة المستخدمين ومتابعة المشاكل والحسابات من منظور الدعم.",
    permissions: ["مشاهدة المستخدمين", "تعديل المستخدمين", "مشاهدة التقارير", "سجل النشاطات"]
  },
  {
    name: "Content Manager",
    description: "إدارة الدروس، الملفات، وبنوك الأسئلة والمحتوى التعليمي.",
    permissions: ["إدارة المحتوى", "مشاهدة التقارير", "تصدير البيانات", "سجل النشاطات"]
  }
];

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function isAdminLoggedIn() {
  return localStorage.getItem(adminSessionKey) === "1";
}

function updateAdminView() {
  const loggedIn = isAdminLoggedIn();
  if (adminAuthRoot) adminAuthRoot.hidden = loggedIn;
  if (adminAppRoot) adminAppRoot.hidden = !loggedIn;
  if (adminLogoutButton) adminLogoutButton.hidden = !loggedIn;
}

function getAdminApiClient() {
  return window.mullemApiClient && typeof window.mullemApiClient.request === "function"
    ? window.mullemApiClient
    : null;
}

function shouldFallbackToLocalAdmin(result) {
  return !result || result.serverUnavailable;
}

function handleLocalAdminLogin(email, password) {
  if (adminLoginState) {
    adminLoginState.textContent = "الخادم غير متاح الآن، لذلك لا يمكن دخول الأدمن بدون قاعدة البيانات.";
  }
}

function getTopEntry(record, fallback) {
  const top = Object.entries(record || {}).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (${top[1]})` : fallback;
}

function normalizeUser(user, index) {
  return {
    id: user.id || `user-${index + 1}`,
    name: user.name || "بدون اسم",
    email: (user.email || "").toLowerCase(),
    role: user.role || "Student",
    package: user.package || "مجاني محدود",
    xp: Number.isFinite(Number(user.xp)) ? Number(user.xp) : 0,
    status: user.status || "نشط",
    activity: user.activity || "لا يوجد نشاط مسجل",
    grade: user.grade || "",
    subject: user.subject || "",
    password: user.password || "",
    streakDays: Number.isFinite(Number(user.streakDays)) ? Number(user.streakDays) : 0,
    achievements: Array.isArray(user.achievements) ? user.achievements : []
  };
}

function getUsers() {
  const users = loadJson("mlm_users", []);
  const source = users.length
    ? users
    : [
        {
          id: "student-demo-1",
          name: "طالب تجريبي",
          email: "student@mullem.sa",
          role: "Student",
          package: "مجاني محدود",
          xp: 100,
          status: "نشط",
          activity: "لا يوجد نشاط بعد",
          grade: "الثاني الثانوي",
          subject: "الرياضيات"
        }
      ];

  const normalized = source.map(normalizeUser);
  saveJson("mlm_users", normalized);
  return normalized;
}

function saveUsers(users) {
  saveJson("mlm_users", users.map(normalizeUser));
}

const answerBankStorageKey = "mlm_runtime_answer_bank_global";
const questionGeneratorSettingsKey = "mlm_question_generator_settings";
const questionGeneratorHistoryKey = "mlm_question_generator_history";
const allSaudiGrades = [
  "الأول الابتدائي",
  "الثاني الابتدائي",
  "الثالث الابتدائي",
  "الرابع الابتدائي",
  "الخامس الابتدائي",
  "السادس الابتدائي",
  "الأول المتوسط",
  "الثاني المتوسط",
  "الثالث المتوسط",
  "الأول الثانوي",
  "الثاني الثانوي",
  "الثالث الثانوي"
];

const generatorSeedLibrary = {
  "الرياضيات": [
    { lesson: "العمليات الأساسية", concept: "الضرب والقسمة", explanation: "السؤال يقيس فهم العملية الحسابية الأساسية." },
    { lesson: "الهندسة", concept: "المحيط والمساحة", explanation: "السؤال مرتبط بفهم الصيغة المناسبة للمفهوم الهندسي." }
  ],
  "العلوم": [
    { lesson: "المخلوقات الحية", concept: "خصائص الكائنات", explanation: "المطلوب تمييز الخاصية العلمية الصحيحة." },
    { lesson: "الطاقة", concept: "تحولات الطاقة", explanation: "السؤال يربط بين المفهوم العلمي والمثال المناسب." }
  ],
  "اللغة الإنجليزية": [
    { lesson: "Grammar", concept: "present / past forms", explanation: "السؤال يختبر الصيغة الصحيحة للكلمة داخل الجملة." },
    { lesson: "Vocabulary", concept: "word meaning", explanation: "السؤال يركز على اختيار الكلمة الأنسب للمعنى." }
  ],
  "اللغة العربية": [
    { lesson: "النحو", concept: "المبتدأ والخبر", explanation: "المطلوب تحديد الصياغة العربية الصحيحة." },
    { lesson: "الفهم القرائي", concept: "المعنى المباشر", explanation: "السؤال يعتمد على فهم المعنى والسياق." }
  ],
  "الفيزياء": [
    { lesson: "الحركة", concept: "السرعة والتسارع", explanation: "السؤال يقيس فهم العلاقة بين الكميات الفيزيائية." },
    { lesson: "القوى", concept: "قوانين نيوتن", explanation: "الحل يعتمد على المفهوم الأساسي للقوة والحركة." }
  ],
  "الكيمياء": [
    { lesson: "الذرات والروابط", concept: "الرابطة الكيميائية", explanation: "السؤال يختبر التمييز بين المفاهيم الكيميائية الصحيحة." },
    { lesson: "المحاليل", concept: "التركيز والذوبان", explanation: "المطلوب تحديد الفكرة الصحيحة المرتبطة بالمحاليل." }
  ],
  "الأحياء": [
    { lesson: "الخلية", concept: "العضيات ووظائفها", explanation: "السؤال يربط بين الجزء الحيوي ووظيفته." },
    { lesson: "أجهزة الجسم", concept: "التنفس والدوران", explanation: "المطلوب فهم الوظيفة الحيوية الأساسية." }
  ],
  "الدراسات الاجتماعية": [
    { lesson: "الجغرافيا", concept: "الموقع والمناخ", explanation: "السؤال يقيس الربط بين الظاهرة والموقع المناسب." },
    { lesson: "التاريخ", concept: "الأحداث والشخصيات", explanation: "السؤال يختبر فهم الحدث أو الشخصية الصحيحة." }
  ]
};

function normalizeAdminText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\r?\n/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitAdminLines(text) {
  return String(text || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAdminKeywords(text, limit = 5) {
  const stopWords = new Set(["في", "من", "على", "إلى", "عن", "هذا", "هذه", "ذلك", "التي", "الذي", "ضمن", "مع", "the", "is", "are", "of", "to", "and"]);
  return normalizeAdminText(text)
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token))
    .slice(0, limit);
}

function buildAdminKeywordSignature(text, limit = 5) {
  return getAdminKeywords(text, limit).join("|");
}

function buildRuntimeResponseFromBankEntry(entry) {
  const questionType = entry.questionType || "سؤال أكاديمي";
  const finalAnswer = entry.answer || entry.response?.finalAnswer || "";
  const explanation = entry.explanation || entry.response?.explanation || "";
  return {
    mode: "solve",
    displayMode: questionType === "مسألة" ? "educational" : "quick",
    questionType,
    subject: entry.subject || "عام",
    lesson: entry.lesson || "بدون درس",
    finalAnswer,
    explanation,
    confidence: typeof entry.confidence === "number" ? entry.confidence : 0.88,
    answerMode: questionType === "صح أو خطأ"
      ? "truefalse"
      : (questionType === "اختيار من متعدد" ? "mcq" : (questionType === "إكمال فراغ" ? "completion" : "")),
    steps: questionType === "مسألة" ? (entry.steps || ["تم تطبيق خطوات الحل المناسبة حسب المعطيات."]) : [],
    mistakes: [],
    similar: ""
  };
}

function normalizeQuestionBankEntry(entry, index = 0) {
  const question = String(entry.question || "").trim();
  const response = entry.response || buildRuntimeResponseFromBankEntry(entry);
  const confidence = Number.isFinite(Number(entry.confidence))
    ? Number(entry.confidence)
    : (Number.isFinite(Number(response.confidence)) ? Number(response.confidence) : 0.75);
  const likes = Number.isFinite(Number(entry.likes)) ? Number(entry.likes) : 0;
  const dislikes = Number.isFinite(Number(entry.dislikes)) ? Number(entry.dislikes) : 0;
  const approved = typeof entry.isApproved === "boolean"
    ? entry.isApproved
    : Boolean(entry.isTrusted || (likes >= 2 && likes > dislikes) || (confidence >= 0.9 && dislikes === 0));

  return {
    key: entry.key || `bank-${index + 1}`,
    question,
    normalizedQuestion: entry.normalizedQuestion || normalizeAdminText(question),
    keywordSignature: entry.keywordSignature || buildAdminKeywordSignature(question),
    questionType: entry.questionType || response.questionType || "سؤال أكاديمي",
    options: Array.isArray(entry.options) ? entry.options : splitAdminLines(entry.options || ""),
    answer: entry.answer || response.finalAnswer || "",
    explanation: entry.explanation || response.explanation || "",
    lesson: entry.lesson || response.lesson || "",
    subject: entry.subject || response.subject || "عام",
    grade: entry.grade || "unknown",
    term: entry.term || "unknown",
    source: entry.source || "system",
    sourceType: entry.sourceType || "internal",
    confidence,
    likes,
    dislikes,
    usageCount: Number.isFinite(Number(entry.usageCount)) ? Number(entry.usageCount) : 0,
    isTrusted: Boolean(entry.isTrusted),
    isApproved: approved,
    isRejected: typeof entry.isRejected === "boolean" ? entry.isRejected : (dislikes >= 3 && dislikes >= likes),
    qualityScore: Number.isFinite(Number(entry.qualityScore)) ? Number(entry.qualityScore) : Number((((approved ? 0.45 : 0.1) + Math.min(0.2, likes * 0.05) + (confidence * 0.2) - Math.min(0.2, dislikes * 0.06))).toFixed(4)),
    preview: entry.preview || String(entry.answer || response.finalAnswer || entry.explanation || "").trim().slice(0, 140),
    createdAt: entry.createdAt || Date.now(),
    updatedAt: entry.updatedAt || Date.now(),
    response: {
      ...response,
      questionType: response.questionType || entry.questionType || "سؤال أكاديمي",
      subject: response.subject || entry.subject || "عام",
      lesson: response.lesson || entry.lesson || "",
      finalAnswer: response.finalAnswer || entry.answer || "",
      explanation: response.explanation || entry.explanation || "",
      confidence
    }
  };
}

function getQuestionBank() {
  return loadJson(answerBankStorageKey, []).map(normalizeQuestionBankEntry);
}

function saveQuestionBank(entries) {
  saveJson(answerBankStorageKey, entries.map((entry, index) => normalizeQuestionBankEntry(entry, index)));
}

function getQuestionGeneratorSettings() {
  return {
    enabled: false,
    dailyTarget: 12,
    term: "all",
    grades: ["الثالث المتوسط", "الأول الثانوي", "الثاني الثانوي"],
    subjects: ["الرياضيات", "العلوم", "اللغة الإنجليزية"],
    generatedToday: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalGenerated: 0,
    totalApproved: 0,
    totalRejected: 0,
    lastRunDate: "",
    lastRunAt: "",
    lastResultMessage: "",
    lastResultStatus: "idle",
    recentRuns: [],
    sourcePriority: {
      curriculum: 0.5,
      internalBank: 0.3,
      trustedEducationalPatterns: 0.15,
      webVerification: 0.05
    },
    trustedPatternReference: "نمط الأسئلة التعليمية الشائع مثل بيت العلم مع إعادة صياغة كاملة",
    ...loadJson(questionGeneratorSettingsKey, {})
  };
}

function saveQuestionGeneratorSettings(settings) {
  saveJson(questionGeneratorSettingsKey, settings);
}

function getQuestionGeneratorHistory() {
  return loadJson(questionGeneratorHistoryKey, []);
}

function saveQuestionGeneratorHistory(entries) {
  saveJson(questionGeneratorHistoryKey, entries.slice(-2500));
}

function getGeneratorRunEntries(settings) {
  return Array.isArray(settings?.recentRuns) ? settings.recentRuns : [];
}

function appendGeneratorRunEntry(settings, entry) {
  return [
    entry,
    ...getGeneratorRunEntries(settings)
  ].slice(0, 10);
}

function setGeneratorFeedback(message, state = "idle") {
  if (generatorFeedbackRoot) {
    generatorFeedbackRoot.textContent = message;
    generatorFeedbackRoot.dataset.state = state;
  }

  if (generatorStateCopy) {
    generatorStateCopy.textContent = message;
  }
}

function setGeneratorButtonsBusy(isBusy) {
  if (generatorToggleButton) {
    generatorToggleButton.disabled = isBusy;
    generatorToggleButton.dataset.busy = isBusy ? "true" : "false";
  }

  if (generatorRunButton) {
    generatorRunButton.disabled = isBusy;
    generatorRunButton.dataset.busy = isBusy ? "true" : "false";
  }
}

function getGeneratorDraftSettings(baseSettings = getQuestionGeneratorSettings()) {
  return {
    ...baseSettings,
    dailyTarget: Math.max(1, Number(generatorCountInput?.value || baseSettings.dailyTarget || 12)),
    term: generatorTermInput?.value || baseSettings.term || "all",
    grades: splitAdminLines(generatorGradesInput?.value || "").length
      ? splitAdminLines(generatorGradesInput?.value || "")
      : baseSettings.grades,
    subjects: splitAdminLines(generatorSubjectsInput?.value || "").length
      ? splitAdminLines(generatorSubjectsInput?.value || "")
      : baseSettings.subjects
  };
}

function getGeneratorSeed(subject) {
  const seeds = generatorSeedLibrary[subject] || generatorSeedLibrary["الرياضيات"];
  return seeds[Math.floor(Math.random() * seeds.length)];
}

const generatorQuestionFrames = {
  "اختيار من متعدد": [
    ({ seed, subject, grade }) => `أي مما يلي يمثل الفكرة الصحيحة في درس ${seed.lesson} ضمن ${subject} للصف ${grade}؟`,
    ({ seed, subject, grade }) => `اختر الإجابة الأدق حول مفهوم "${seed.concept}" في ${subject} للصف ${grade}.`,
    ({ seed, subject }) => `في ${subject}، أي خيار يوضح مفهوم "${seed.concept}" بالشكل الصحيح؟`
  ],
  "صح أو خطأ": [
    ({ seed, subject }) => `في ${subject}: ترتبط فكرة "${seed.concept}" مباشرة بدرس ${seed.lesson}. صواب أم خطأ؟`,
    ({ seed, subject }) => `العبارة التالية من ${subject} صحيحة: ${seed.concept} جزء أساسي من ${seed.lesson}. صواب أم خطأ؟`,
    ({ seed, subject }) => `هل العبارة التالية صحيحة في ${subject}؟ "${seed.concept}" من المفاهيم المباشرة في ${seed.lesson}.`
  ],
  "إكمال فراغ": [
    ({ seed, subject }) => `أكمل الفراغ: في درس ${seed.lesson} من ${subject}، يرتبط المفهوم الأساسي بـ ______.`,
    ({ seed }) => `أكمل: المفهوم الذي يدور حوله درس ${seed.lesson} هو ______.`,
    ({ seed, subject }) => `في ${subject}، يكمل الطالب الجملة التالية بالمفهوم الصحيح: ______ هو أساس ${seed.lesson}.`
  ],
  "تعليل / تفسير": [
    ({ seed, subject }) => `علل: لماذا يعد مفهوم "${seed.concept}" مهمًا في درس ${seed.lesson} ضمن ${subject}؟`,
    ({ seed, subject }) => `فسر باختصار أهمية "${seed.concept}" في ${subject} داخل درس ${seed.lesson}.`,
    ({ seed }) => `ما سبب أهمية "${seed.concept}" عند دراسة ${seed.lesson}؟`
  ]
};

function pickGeneratorFrame(questionType, variationIndex) {
  const frames = generatorQuestionFrames[questionType] || generatorQuestionFrames["اختيار من متعدد"];
  return frames[variationIndex % frames.length];
}

function buildGeneratedQuestion({ grade, subject, term }, index, history = [], bank = []) {
  const gradeEntriesCount = bank.filter((entry) => entry.grade === grade && entry.subject === subject).length;
  const dateSeed = Number(new Date().toISOString().slice(8, 10));
  const variationIndex = gradeEntriesCount + index + dateSeed + history.length;
  const seed = getGeneratorSeed(subject);
  const typeCycle = ["اختيار من متعدد", "صح أو خطأ", "إكمال فراغ", "تعليل / تفسير"];
  const questionType = typeCycle[variationIndex % typeCycle.length];
  const questionBuilder = pickGeneratorFrame(questionType, variationIndex);
  const baseQuestion = questionBuilder({ seed, subject, grade, term });

  if (questionType === "اختيار من متعدد") {
    const options = subject === "اللغة الإنجليزية"
      ? ["correct", "wrong", "excellent", "quickly"]
      : [
          `${seed.concept} هو الفكرة الأساسية`,
          `يرتبط ${seed.concept} مباشرة بالدرس`,
          `المفهوم بعيد عن الدرس`,
          `لا توجد علاقة واضحة`
        ];
    return {
      questionType,
      question: baseQuestion,
      options,
      answer: subject === "اللغة الإنجليزية" ? "correct" : options[1],
      explanation: seed.explanation,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.89,
      generationMode: "curriculum_first_rewritten"
    };
  }

  if (questionType === "صح أو خطأ") {
    return {
      questionType,
      question: baseQuestion,
      options: ["صواب", "خطأ"],
      answer: "صواب",
      explanation: seed.explanation,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.91,
      generationMode: "curriculum_first_rewritten"
    };
  }

  if (questionType === "إكمال فراغ") {
    return {
      questionType,
      question: baseQuestion,
      options: [],
      answer: seed.concept,
      explanation: seed.explanation,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.87,
      generationMode: "curriculum_first_rewritten"
    };
  }

  return {
    questionType,
    question: baseQuestion,
    options: [],
    answer: `لأنه يرتبط مباشرة بهدف الدرس ويشرح الفكرة الأساسية فيه.`,
    explanation: seed.explanation,
    lesson: seed.lesson,
    concept: seed.concept,
    confidence: 0.85,
    generationMode: "curriculum_first_rewritten"
  };
}

function validateGeneratedQuestion(candidate, bank, history = []) {
  const hasQuestion = Boolean(candidate.question && candidate.question.trim());
  const hasAnswer = Boolean(candidate.answer && String(candidate.answer).trim());
  const normalizedQuestion = normalizeAdminText(candidate.question);
  const keywordSignature = buildAdminKeywordSignature(candidate.question);
  const duplicate = bank.some((entry) => (
    entry.normalizedQuestion === normalizedQuestion
    || (entry.keywordSignature && entry.keywordSignature === keywordSignature)
  ) && entry.grade === candidate.grade && entry.subject === candidate.subject && entry.term === candidate.term);
  const historyDuplicate = history.some((entry) => entry.signature === `${candidate.grade}|${candidate.subject}|${candidate.term}|${keywordSignature}`);
  const hasLogicalOptions = candidate.questionType !== "اختيار من متعدد" || (Array.isArray(candidate.options) && candidate.options.length >= 3);
  const confidence = Number(candidate.confidence || 0);
  const approved = hasQuestion && hasAnswer && hasLogicalOptions && !duplicate && !historyDuplicate && confidence >= 0.82;

  return {
    approved,
    rejected: !approved,
    reason: duplicate || historyDuplicate ? "مكرر" : (!hasLogicalOptions ? "خيارات غير كافية" : (!hasQuestion || !hasAnswer ? "سؤال غير مكتمل" : "اجتاز الفلترة"))
  };
}

function createGeneratedEntry(payload, settings, index, bank, history) {
  const built = buildGeneratedQuestion(payload, index, history, bank);
  const candidate = {
    key: `generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: built.question,
    questionType: payload.questionType || built.questionType || "اختيار من متعدد",
    options: built.options || [],
    answer: built.answer,
    explanation: built.explanation,
    subject: payload.subject,
    grade: payload.grade,
    term: payload.term,
    lesson: built.lesson,
    source: "مولد الأسئلة - المنهج السعودي أولًا + بنك داخلي + نمط صياغة موثوق معاد الصياغة",
    sourceType: "generated_curriculum_pattern",
    keywordSignature: buildAdminKeywordSignature(built.question),
    confidence: built.confidence,
    likes: 0,
    dislikes: 0,
    usageCount: 0,
    isTrusted: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    decisionBasis: "curriculum_first_with_internal_bank_and_trusted_pattern_style",
    sourcePriority: settings.sourcePriority,
    trustedPatternReference: settings.trustedPatternReference,
    generationMode: built.generationMode || "curriculum_first_rewritten",
    response: buildRuntimeResponseFromBankEntry({
      questionType: built.questionType || payload.questionType,
      answer: built.answer,
      explanation: built.explanation,
      subject: payload.subject,
      lesson: built.lesson,
      confidence: built.confidence
    })
  };
  candidate.questionType = built.questionType || candidate.questionType;
  const quality = validateGeneratedQuestion(candidate, bank, history);
  candidate.isApproved = quality.approved;
  candidate.isRejected = quality.rejected;
  candidate.qualityScore = Number((candidate.confidence - (quality.rejected ? 0.18 : 0)).toFixed(4));
  candidate.preview = String(candidate.answer || candidate.explanation || "").trim().slice(0, 140);
  return normalizeQuestionBankEntry(candidate);
}

let generatorRunInProgress = false;

function runQuestionGenerator(manual = false) {
  if (generatorRunInProgress) return;
  generatorRunInProgress = true;

  try {
    const settings = getQuestionGeneratorSettings();
    const todayKey = new Date().toISOString().slice(0, 10);
    const history = getQuestionGeneratorHistory();
    const grades = (Array.isArray(settings.grades) && settings.grades.length ? settings.grades : allSaudiGrades.slice(0, 3));
    const subjects = (Array.isArray(settings.subjects) && settings.subjects.length ? settings.subjects : Object.keys(generatorSeedLibrary).slice(0, 3));
    const target = Math.max(1, Number(settings.dailyTarget || 12));
    const bank = getQuestionBank();
    let generated = 0;
    let approved = 0;
    let rejected = 0;
    let attempts = 0;

    while (generated < target && attempts < target * 8) {
      const grade = grades[attempts % grades.length];
      const subject = subjects[attempts % subjects.length];
      const term = settings.term === "all"
        ? ((attempts + Number(new Date().toISOString().slice(8, 10))) % 2 === 0 ? "الفصل الأول" : "الفصل الثاني")
        : settings.term;
      const entry = createGeneratedEntry({ grade, subject, term }, settings, attempts, bank, history);
      attempts += 1;
      if (entry.isRejected) {
        rejected += 1;
        continue;
      }
      bank.unshift(entry);
      history.push({
        date: todayKey,
        signature: `${entry.grade}|${entry.subject}|${entry.term}|${entry.keywordSignature}`,
        key: entry.key
      });
      generated += 1;
      approved += 1;
    }

    saveQuestionBank(bank);
    saveQuestionGeneratorHistory(history);
    const nextSettings = {
      ...settings,
      lastRunDate: todayKey,
      lastRunAt: new Date().toISOString(),
      generatedToday: settings.lastRunDate !== todayKey ? generated : (settings.generatedToday || 0) + generated,
      approvedToday: settings.lastRunDate !== todayKey ? approved : (settings.approvedToday || 0) + approved,
      rejectedToday: settings.lastRunDate !== todayKey ? rejected : (settings.rejectedToday || 0) + rejected,
      totalGenerated: (settings.totalGenerated || 0) + generated,
      totalApproved: (settings.totalApproved || 0) + approved,
      totalRejected: (settings.totalRejected || 0) + rejected
    };
    saveQuestionGeneratorSettings(nextSettings);

    if (generatorStateCopy) {
      generatorStateCopy.textContent = manual
        ? `تم تشغيل المولد الآن وإضافة ${generated} سؤال، منها ${approved} معتمدة.`
        : `تم تنفيذ التوليد اليومي وإضافة ${generated} سؤال جديد.`;
    }
  } finally {
    generatorRunInProgress = false;
  }
}

function ensureDailyGeneratorRun() {
  const settings = getQuestionGeneratorSettings();
  const todayKey = new Date().toISOString().slice(0, 10);
  if (!settings.enabled) return;
  if (settings.lastRunDate === todayKey) return;
  runQuestionGenerator(false);
}

function refreshAdminData() {
  ensureDailyGeneratorRun();
  renderStats();
  renderUsersTable();
  renderFeedback();
  renderSubscribersOverview();
  renderActivityLog();
  renderReports();
  renderQuestionBankSummary();
  renderQuestionBankTable();
  renderGradeBankPanels();
  renderGeneratorStatus();
  syncGeneratorForm();
}

function updateUserRecord(userId, updater) {
  const users = getUsers();
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return null;

  const current = users[index];
  const next = updater(current);
  if (!next) return null;

  users[index] = normalizeUser({ ...current, ...next }, index);
  saveUsers(users);

  if (users[index].status === "محظور" && localStorage.getItem("mlm_current_user") === userId) {
    localStorage.removeItem("mlm_current_user");
  }

  refreshAdminData();
  return users[index];
}

function upsertAdminUserSnapshot(user) {
  const normalizedUser = normalizeUser(user, 0);
  const nextUsers = [
    normalizedUser,
    ...getUsers().filter((entry) => String(entry.id) !== String(normalizedUser.id))
  ];
  saveUsers(nextUsers);
  refreshAdminData();
  return normalizedUser;
}

async function persistAdminUserUpdate(userId, apiPayload, fallbackUpdater) {
  const apiClient = getAdminApiClient();

  if (apiClient && typeof apiClient.updateAdminUser === "function" && apiClient.hasToken() && isAdminLoggedIn()) {
    try {
      const result = await apiClient.updateAdminUser(userId, apiPayload);
      if (result.ok && result.data?.user) {
        return { ok: true, user: upsertAdminUserSnapshot(result.data.user), source: "api" };
      }

      if (!shouldFallbackToLocalAdmin(result)) {
        return {
          ok: false,
          message: result?.message || "تعذر حفظ بيانات المستخدم في الخادم."
        };
      }
    } catch (_) {
      // Keep the local fallback when the API write is unavailable.
    }
  }

  const updated = updateUserRecord(userId, fallbackUpdater);
  if (!updated) {
    return {
      ok: false,
      message: "تعذر العثور على المستخدم المطلوب."
    };
  }

  return {
    ok: true,
    user: updated,
    source: "local"
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function editUserRecord(userId) {
  const user = getUsers().find((entry) => entry.id === userId);
  if (!user) return;

  const name = window.prompt("اسم المستخدم", user.name || "");
  if (name === null) return;

  const email = window.prompt("البريد الإلكتروني", user.email || "");
  if (email === null) return;

  const grade = window.prompt("الصف الدراسي", user.grade || "");
  if (grade === null) return;

  const subject = window.prompt("المادة", user.subject || "");
  if (subject === null) return;

  const role = window.prompt("الدور", user.role || "Student");
  if (role === null) return;

  const packageName = window.prompt("الباقة", user.package || "مجاني محدود");
  if (packageName === null) return;

  const xpRaw = window.prompt("رصيد XP", String(user.xp ?? 0));
  if (xpRaw === null) return;

  const status = window.prompt("الحالة (نشط / محظور / موقوف)", user.status || "نشط");
  if (status === null) return;

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail && !isValidEmail(normalizedEmail)) {
    window.alert("البريد الإلكتروني غير صحيح.");
    return;
  }

  const xp = Number(xpRaw);
  if (!Number.isFinite(xp)) {
    window.alert("رصيد XP يجب أن يكون رقمًا صحيحًا.");
    return;
  }

  const nextPayload = {
    name: name.trim() || user.name,
    email: normalizedEmail || user.email,
    grade: grade.trim(),
    subject: subject.trim(),
    role: role.trim() || user.role,
    package: packageName.trim() || user.package,
    xp,
    status: status.trim() || "نشط",
    activity: "تم تعديل الحساب من لوحة الأدمن"
  };

  const result = await persistAdminUserUpdate(userId, nextPayload, () => nextPayload);
  if (!result.ok) {
    window.alert(result.message || "تعذر تحديث بيانات المستخدم.");
    return;
  }

  window.alert("تم تحديث بيانات المستخدم.");
}

async function toggleBanUser(userId) {
  const user = getUsers().find((entry) => entry.id === userId);
  if (!user) return;

  const willBan = user.status !== "محظور";
  const confirmed = window.confirm(
    willBan
      ? `هل تريد حظر المستخدم ${user.name}؟`
      : `هل تريد فك الحظر عن المستخدم ${user.name}؟`
  );

  if (!confirmed) return;

  const nextPayload = {
    status: willBan ? "محظور" : "نشط",
    activity: willBan ? "تم حظر الحساب من لوحة الأدمن" : "تم فك الحظر عن الحساب من لوحة الأدمن"
  };

  const result = await persistAdminUserUpdate(userId, nextPayload, () => nextPayload);
  if (!result.ok) {
    window.alert(result.message || "تعذر تحديث حالة المستخدم.");
    return;
  }

  window.alert(willBan ? "تم حظر الحساب." : "تم فك الحظر عن الحساب.");
}

async function editUserPoints(userId) {
  const user = getUsers().find((entry) => entry.id === userId);
  if (!user) return;

  const xpRaw = window.prompt(`تعديل نقاط ${user.name}`, String(user.xp ?? 0));
  if (xpRaw === null) return;

  const xp = Number(xpRaw);
  if (!Number.isFinite(xp)) {
    window.alert("قيمة النقاط يجب أن تكون رقمًا صحيحًا.");
    return;
  }

  const nextPayload = {
    xp,
    activity: "تم تعديل النقاط من لوحة الأدمن"
  };

  const result = await persistAdminUserUpdate(userId, nextPayload, () => nextPayload);

  if (!result.ok) {
    window.alert(result.message || "تعذر تحديث نقاط المستخدم.");
    return;
  }

  window.alert("تم تحديث النقاط بنجاح.");
}

function getAnalytics() {
  return {
    totalMessages: 0,
    totalLikes: 0,
    totalDislikes: 0,
    xpUsed: 0,
    dailyMessages: {},
    subjects: {},
    savedSessions: 0,
    ...loadJson("mlm_analytics", {})
  };
}

function getFeedback() {
  const liked = loadJson("mlm_liked_memory", []);
  const disliked = loadJson("mlm_disliked_memory", []);
  return {
    liked,
    disliked
  };
}

function renderStats() {
  if (!adminStatsRoot) return;
  const analytics = getAnalytics();
  const users = getUsers();
  const bank = getQuestionBank();
  const generator = getQuestionGeneratorSettings();
  const todayKey = new Date().toISOString().slice(0, 10);
  const runtime = localStorage.getItem("mlm_runtime") || "vLLM Runtime";
  const trainingMode = localStorage.getItem("mlm_training_mode") || "Prompt + RAG";

  const stats = [
    { label: "عدد المستخدمين", value: users.length, note: "إجمالي الحسابات الموجودة" },
    { label: "الرسائل اليومية", value: analytics.dailyMessages[todayKey] || 0, note: "عدد الرسائل اليوم" },
    { label: "الحسابات النشطة", value: users.filter((user) => user.status === "نشط").length, note: "المستخدمون النشطون حاليًا" },
    { label: "الأسئلة المحفوظة", value: bank.length, note: "كل ما حفظه النظام أو الأدمن" },
    { label: "الأسئلة المعتمدة", value: bank.filter((entry) => entry.isApproved).length, note: "جاهزة للإجابة السريعة" },
    { label: "استهلاك XP", value: analytics.xpUsed || 0, note: "الاستهلاك التراكمي" },
    { label: "أكثر مادة استخدامًا", value: getTopEntry(analytics.subjects, "لا توجد بيانات بعد"), note: "المادة الأعلى تفاعلًا" },
    { label: "المولد التلقائي", value: generator.enabled ? "يعمل" : "متوقف", note: `اليوم: ${generator.generatedToday || 0} سؤال` },
    { label: "وضع التشغيل", value: runtime, note: trainingMode }
  ];

  adminStatsRoot.innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card">
          <span>${stat.label}</span>
          <strong>${stat.value}</strong>
          <span>${stat.note}</span>
        </article>
      `
    )
    .join("");
}

function renderUsersTable() {
  if (!usersTableRoot) return;
  const rows = getUsers()
    .map(
      (user) => `
        <tr>
          <td>${user.name || "بدون اسم"}</td>
          <td>${user.email || "—"}</td>
          <td>${user.role || "Student"}</td>
          <td>${user.package || "مجاني محدود"}</td>
          <td>${user.xp ?? 0}</td>
          <td>${user.status || "نشط"}</td>
          <td>${user.activity || "لا يوجد نشاط مسجل"}</td>
          <td>
            <div class="admin-table-actions">
              <button type="button" class="mini-btn" data-admin-edit="${user.id}">تعديل</button>
              <button type="button" class="mini-btn admin-action-points" data-admin-points="${user.id}">تعديل النقاط</button>
              <button
                type="button"
                class="mini-btn ${user.status === "محظور" ? "admin-action-unban" : "admin-action-ban"}"
                data-admin-ban="${user.id}"
              >
                ${user.status === "محظور" ? "فك الحظر" : "حظر"}
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  usersTableRoot.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>الاسم</th>
          <th>البريد</th>
          <th>الدور</th>
          <th>الباقة</th>
          <th>XP</th>
          <th>الحالة</th>
          <th>آخر نشاط</th>
          <th>الإجراءات</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderFeedback() {
  if (!feedbackListRoot) return;
  const { liked, disliked } = getFeedback();
  const entries = [
    ...liked.slice(0, 3).map((item) => ({ type: "إعجاب", status: "إيجابي", ...item })),
    ...disliked.slice(0, 3).map((item) => ({ type: "لم يعجبني", status: "بحاجة إلى مراجعة", ...item }))
  ];

  feedbackListRoot.innerHTML = entries.length
    ? entries
        .map(
          (entry) => `
            <div class="admin-item">
              <strong>${entry.type} | ${entry.subject || "عام"} | ${entry.lesson || "بدون درس"}</strong>
              <span>${entry.question || entry.preview || "لا يوجد نص محفوظ"}</span>
              <span>${entry.status}</span>
            </div>
          `
        )
        .join("")
    : `
        <div class="admin-item">
          <strong>لا توجد تقييمات بعد</strong>
          <span>ستظهر هنا الإعجابات وعدم الإعجاب عندما يبدأ الطلاب تقييم الإجابات.</span>
        </div>
      `;
}

function renderSubscribersOverview() {
  if (!subscribersListRoot) return;
  const users = getUsers();
  const groups = users.reduce((result, user) => {
    const packageName = user.package || "مجاني محدود";
    if (!result[packageName]) result[packageName] = [];
    result[packageName].push(user);
    return result;
  }, {});

  const entries = Object.entries(groups);
  subscribersListRoot.innerHTML = entries.length
    ? entries
        .map(
          ([packageName, packageUsers]) => `
            <div class="admin-item">
              <strong>${packageName}</strong>
              <span>عدد المشتركين: ${packageUsers.length}</span>
              <div class="permission-grid">
                ${packageUsers
                  .slice(0, 6)
                  .map(
                    (user) => `
                      <span class="permission-chip">
                        ${user.name} • ${user.status} • ${user.xp} XP
                      </span>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `
        )
        .join("")
    : `
        <div class="admin-item">
          <strong>لا يوجد مشتركون بعد</strong>
          <span>ستظهر هنا الحسابات المقسمة حسب الباقات بعد بدء التسجيل في المنصة.</span>
        </div>
      `;
}

function renderActivityLog() {
  if (!activityListRoot) return;
  const users = getUsers();
  const activities = users
    .slice(0, 8)
    .map((user) => ({
      title: `${user.name || "مستخدم"} — ${user.role || "Student"}`,
      detail: user.activity || "لا يوجد نشاط مسجل بعد.",
      meta: `${user.status || "نشط"}${user.package ? ` • ${user.package}` : ""}`
    }));

  activityListRoot.innerHTML = activities.length
    ? activities
        .map(
          (item) => `
            <div class="admin-item">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
              <span>${item.meta}</span>
            </div>
          `
        )
        .join("")
    : `
        <div class="admin-item">
          <strong>لا توجد نشاطات بعد</strong>
          <span>سيظهر هنا آخر ما تم داخل المنصة عندما يبدأ المستخدمون والأدمن بالتفاعل.</span>
        </div>
      `;
}

function renderReports() {
  if (!reportListRoot) return;
  const analytics = getAnalytics();
  const reports = [
    `إجمالي الرسائل التعليمية: ${analytics.totalMessages || 0}.`,
    `الإعجابات: ${analytics.totalLikes || 0} | لم يعجبني: ${analytics.totalDislikes || 0}.`,
    `المحادثات المحفوظة للمراجعة: ${analytics.savedSessions || 0}.`,
    `أكثر مادة تحتاج متابعة: ${getTopEntry(analytics.subjects, "لا توجد مادة بارزة بعد")}.`,
    `هذه اللوحة تعرض ملخص الاستخدام داخل النسخة الحالية من المنصة.`
  ];

  reportListRoot.innerHTML = reports
    .map(
      (report) => `
        <div class="admin-item">
          <strong>تقرير</strong>
          <span>${report}</span>
        </div>
      `
    )
    .join("");
}

function renderQuestionBankSummary() {
  if (!questionBankSummaryRoot) return;
  const bank = getQuestionBank();
  const approved = bank.filter((entry) => entry.isApproved).length;
  const trusted = bank.filter((entry) => entry.isTrusted).length;
  const manual = bank.filter((entry) => String(entry.source || "").includes("يدوي") || String(entry.source || "").includes("admin")).length;
  const systemAdded = bank.length - manual;

  questionBankSummaryRoot.innerHTML = `
    <div class="admin-bank-grid">
      <div class="admin-bank-card">
        <strong>إجمالي العناصر</strong>
        <span>${bank.length} سؤال/إجابة محفوظة</span>
      </div>
      <div class="admin-bank-card">
        <strong>المعتمدة</strong>
        <span>${approved} عنصرًا جاهزًا للمسار السريع</span>
      </div>
      <div class="admin-bank-card">
        <strong>الموثوقة</strong>
        <span>${trusted} عنصرًا بعلامة ثقة مرتفعة</span>
      </div>
      <div class="admin-bank-card">
        <strong>إضافة النظام / الأدمن</strong>
        <span>${systemAdded} تلقائيًا • ${manual} يدويًا</span>
      </div>
    </div>
  `;
}

function renderQuestionBankTable() {
  if (!questionBankTableRoot) return;
  const rows = getQuestionBank()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 40)
    .map((entry) => `
      <tr>
        <td>${entry.question || "—"}</td>
        <td>${entry.questionType || "—"}</td>
        <td>${entry.subject || "—"}</td>
        <td>${entry.grade || "—"}</td>
        <td>${entry.term || "—"}</td>
        <td>${entry.answer || entry.response?.finalAnswer || "—"}</td>
        <td>${Number(entry.confidence || 0).toFixed(2)}</td>
        <td>${entry.likes || 0} / ${entry.dislikes || 0}</td>
        <td>${entry.isApproved ? "معتمد" : (entry.isRejected ? "مرفوض" : "قيد المراجعة")}</td>
        <td>
          <div class="admin-table-actions">
            <button type="button" class="mini-btn" data-bank-edit="${entry.key}">تعديل</button>
            <button type="button" class="mini-btn admin-action-unban" data-bank-approve="${entry.key}">
              ${entry.isApproved ? "إلغاء الاعتماد" : "اعتماد"}
            </button>
            <button type="button" class="mini-btn admin-action-ban" data-bank-delete="${entry.key}">حذف</button>
          </div>
        </td>
      </tr>
    `)
    .join("");

  questionBankTableRoot.innerHTML = `
    <div class="admin-table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>السؤال</th>
            <th>النوع</th>
            <th>المادة</th>
            <th>الصف</th>
            <th>الترم</th>
            <th>الإجابة</th>
            <th>الثقة</th>
            <th>التفاعل</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="10">لا توجد عناصر محفوظة بعد.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function renderGradeBankPanels() {
  if (!gradeBankPanelsRoot) return;
  const bank = getQuestionBank();
  gradeBankPanelsRoot.innerHTML = `
    <div class="admin-grade-grid">
      ${allSaudiGrades.map((grade) => {
        const gradeEntries = bank.filter((entry) => entry.grade === grade);
        const term1 = gradeEntries.filter((entry) => entry.term === "الفصل الأول").length;
        const term2 = gradeEntries.filter((entry) => entry.term === "الفصل الثاني").length;
        const subjectCounts = gradeEntries.reduce((acc, entry) => {
          const key = entry.subject || "عام";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const topSubjects = Object.entries(subjectCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([subject, count]) => `<span class="permission-chip">${subject} • ${count}</span>`)
          .join("");

        return `
          <article class="admin-grade-card">
            <strong>${grade}</strong>
            <span>عدد الأسئلة: ${gradeEntries.length}</span>
            <span>الفصل الأول: ${term1}</span>
            <span>الفصل الثاني: ${term2}</span>
            <div class="admin-grade-tags">${topSubjects || `<span class="admin-inline-note">لا توجد مواد محفوظة لهذا الصف بعد.</span>`}</div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderGeneratorStatus() {
  if (!generatorStatusRoot) return;
  const settings = getQuestionGeneratorSettings();
  generatorStatusRoot.innerHTML = `
    <div class="admin-bank-grid">
      <div class="admin-bank-card">
        <strong>حالة المولد</strong>
        <span>${settings.enabled ? "يعمل" : "متوقف"}</span>
      </div>
      <div class="admin-bank-card">
        <strong>إحصائيات اليوم</strong>
        <span>توليد: ${settings.generatedToday || 0} • اعتماد: ${settings.approvedToday || 0} • رفض: ${settings.rejectedToday || 0}</span>
      </div>
      <div class="admin-bank-card">
        <strong>الإجمالي التراكمي</strong>
        <span>توليد: ${settings.totalGenerated || 0} • اعتماد: ${settings.totalApproved || 0}</span>
      </div>
      <div class="admin-bank-card">
        <strong>آخر تشغيل</strong>
        <span>${settings.lastRunAt ? new Date(settings.lastRunAt).toLocaleString("ar-SA") : "لم يتم التشغيل بعد"}</span>
      </div>
    </div>
  `;

  if (generatorToggleButton) {
    generatorToggleButton.textContent = settings.enabled ? "إيقاف المولد" : "تشغيل المولد";
  }
}

function syncGeneratorForm() {
  const settings = getQuestionGeneratorSettings();
  if (generatorCountInput) generatorCountInput.value = settings.dailyTarget || 12;
  if (generatorTermInput) generatorTermInput.value = settings.term || "all";
  if (generatorGradesInput) generatorGradesInput.value = (settings.grades || []).join(", ");
  if (generatorSubjectsInput) generatorSubjectsInput.value = (settings.subjects || []).join(", ");
}

function upsertQuestionBankEntryFromForm() {
  const question = (bankQuestionInput?.value || "").trim();
  const answer = (bankAnswerInput?.value || "").trim();
  if (!question || !answer) {
    if (bankFormState) bankFormState.textContent = "اكتب نص السؤال والإجابة الصحيحة أولًا.";
    return;
  }

  const confidence = Number(bankConfidenceInput?.value || 0.9);
  const questionType = bankTypeInput?.value || "اختيار من متعدد";
  const entry = normalizeQuestionBankEntry({
    key: questionBankForm?.dataset.editingKey || `manual-${Date.now()}`,
    question,
    questionType,
    options: splitAdminLines(bankOptionsInput?.value || ""),
    answer,
    explanation: (bankExplanationInput?.value || "").trim(),
    grade: (bankGradeInput?.value || "").trim() || "unknown",
    subject: (bankSubjectInput?.value || "").trim() || "عام",
    term: bankTermInput?.value || "الفصل الأول",
    lesson: (bankLessonInput?.value || "").trim(),
    source: (bankSourceInput?.value || "").trim() || "إضافة يدوية من الأدمن",
    sourceType: "admin_manual",
    confidence: Number.isFinite(confidence) ? confidence : 0.9,
    isApproved: Boolean(bankApprovedInput?.checked),
    isTrusted: Boolean(bankApprovedInput?.checked),
    response: buildRuntimeResponseFromBankEntry({
      questionType,
      answer,
      explanation: (bankExplanationInput?.value || "").trim(),
      subject: (bankSubjectInput?.value || "").trim() || "عام",
      lesson: (bankLessonInput?.value || "").trim(),
      confidence: Number.isFinite(confidence) ? confidence : 0.9
    })
  });

  const bank = getQuestionBank();
  const index = bank.findIndex((item) => item.key === entry.key);
  if (index >= 0) bank[index] = entry;
  else bank.unshift(entry);
  saveQuestionBank(bank);

  if (questionBankForm) {
    questionBankForm.reset();
    delete questionBankForm.dataset.editingKey;
  }
  if (bankFormState) {
    bankFormState.textContent = "تم حفظ السؤال داخل قاعدة المنصة بنجاح.";
  }
  refreshAdminData();
}

function loadQuestionBankEntryIntoForm(entryKey) {
  const entry = getQuestionBank().find((item) => item.key === entryKey);
  if (!entry || !questionBankForm) return;
  questionBankForm.dataset.editingKey = entry.key;
  if (bankQuestionInput) bankQuestionInput.value = entry.question || "";
  if (bankTypeInput) bankTypeInput.value = entry.questionType || "اختيار من متعدد";
  if (bankOptionsInput) bankOptionsInput.value = (entry.options || []).join("\n");
  if (bankAnswerInput) bankAnswerInput.value = entry.answer || "";
  if (bankExplanationInput) bankExplanationInput.value = entry.explanation || "";
  if (bankGradeInput) bankGradeInput.value = entry.grade || "";
  if (bankSubjectInput) bankSubjectInput.value = entry.subject || "";
  if (bankTermInput) bankTermInput.value = entry.term || "الفصل الأول";
  if (bankLessonInput) bankLessonInput.value = entry.lesson || "";
  if (bankSourceInput) bankSourceInput.value = entry.source || "";
  if (bankConfidenceInput) bankConfidenceInput.value = entry.confidence ?? 0.9;
  if (bankApprovedInput) bankApprovedInput.checked = Boolean(entry.isApproved);
  if (bankFormState) bankFormState.textContent = "تم تحميل السؤال في النموذج لتعديله.";
}

function toggleQuestionBankApproval(entryKey) {
  const bank = getQuestionBank();
  const index = bank.findIndex((item) => item.key === entryKey);
  if (index === -1) return;
  bank[index].isApproved = !bank[index].isApproved;
  bank[index].isTrusted = bank[index].isApproved || bank[index].isTrusted;
  bank[index].updatedAt = Date.now();
  saveQuestionBank(bank);
  refreshAdminData();
}

function deleteQuestionBankEntry(entryKey) {
  const confirmed = window.confirm("هل تريد حذف هذا السؤال من القاعدة؟");
  if (!confirmed) return;
  const bank = getQuestionBank().filter((item) => item.key !== entryKey);
  saveQuestionBank(bank);
  refreshAdminData();
}

function bindPasswordToggles() {
  passwordToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-password-toggle");
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;
      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      button.setAttribute("aria-pressed", shouldShow ? "true" : "false");
      button.setAttribute("aria-label", shouldShow ? "إخفاء كلمة المرور" : "إظهار كلمة المرور");
    });
  });
}

usersTableRoot?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-admin-edit]");
  if (editButton) {
    editUserRecord(editButton.getAttribute("data-admin-edit"));
    return;
  }

  const pointsButton = event.target.closest("[data-admin-points]");
  if (pointsButton) {
    editUserPoints(pointsButton.getAttribute("data-admin-points"));
    return;
  }

  const banButton = event.target.closest("[data-admin-ban]");
  if (banButton) {
    toggleBanUser(banButton.getAttribute("data-admin-ban"));
  }
});

questionBankForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertQuestionBankEntryFromForm();
});

questionBankTableRoot?.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-bank-edit]");
  if (editButton) {
    loadQuestionBankEntryIntoForm(editButton.getAttribute("data-bank-edit"));
    return;
  }

  const approveButton = event.target.closest("[data-bank-approve]");
  if (approveButton) {
    toggleQuestionBankApproval(approveButton.getAttribute("data-bank-approve"));
    return;
  }

  const deleteButton = event.target.closest("[data-bank-delete]");
  if (deleteButton) {
    deleteQuestionBankEntry(deleteButton.getAttribute("data-bank-delete"));
  }
});

generatorForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const settings = getQuestionGeneratorSettings();
  const nextSettings = {
    ...settings,
    dailyTarget: Math.max(1, Number(generatorCountInput?.value || settings.dailyTarget || 12)),
    term: generatorTermInput?.value || settings.term || "all",
    grades: splitAdminLines(generatorGradesInput?.value || "").length
      ? splitAdminLines(generatorGradesInput?.value || "")
      : settings.grades,
    subjects: splitAdminLines(generatorSubjectsInput?.value || "").length
      ? splitAdminLines(generatorSubjectsInput?.value || "")
      : settings.subjects
  };
  saveQuestionGeneratorSettings(nextSettings);
  if (generatorStateCopy) generatorStateCopy.textContent = "تم حفظ إعدادات مولد الأسئلة.";
  refreshAdminData();
});

function handleGeneratorToggle() {
  const settings = getQuestionGeneratorSettings();
  const enabling = !settings.enabled;
  const nextSettings = {
    ...settings,
    enabled: enabling,
    dailyTarget: Math.max(1, Number(generatorCountInput?.value || settings.dailyTarget || 12)),
    term: generatorTermInput?.value || settings.term || "all",
    grades: splitAdminLines(generatorGradesInput?.value || "").length
      ? splitAdminLines(generatorGradesInput?.value || "")
      : settings.grades,
    subjects: splitAdminLines(generatorSubjectsInput?.value || "").length
      ? splitAdminLines(generatorSubjectsInput?.value || "")
      : settings.subjects
  };
  saveQuestionGeneratorSettings(nextSettings);

  if (enabling) {
    runQuestionGenerator(true);
  } else if (generatorStateCopy) {
    generatorStateCopy.textContent = "تم إيقاف المولد التلقائي.";
  }

  refreshAdminData();
}

function handleGeneratorRunNow() {
  runQuestionGenerator(true);
  refreshAdminData();
}

window.adminHandleGeneratorToggle = (event) => {
  if (event) {
    event.preventDefault?.();
    event.stopPropagation?.();
  }
  handleGeneratorToggle();
};

window.adminHandleGeneratorRunNow = (event) => {
  if (event) {
    event.preventDefault?.();
    event.stopPropagation?.();
  }
  handleGeneratorRunNow();
};

generatorToggleButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  handleGeneratorToggle();
});

generatorRunButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  handleGeneratorRunNow();
});

document.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-generator-toggle]");
  if (toggleButton) {
    event.preventDefault();
    event.stopPropagation();
    handleGeneratorToggle();
    return;
  }

  const runButton = event.target.closest("[data-generator-run]");
  if (runButton) {
    event.preventDefault();
    event.stopPropagation();
    handleGeneratorRunNow();
  }
});

adminLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();

  const email = (adminEmailInput?.value || "").trim().toLowerCase();
  const password = adminPasswordInput?.value || "";
  const apiClient = getAdminApiClient();

  if (!email || !password) {
    if (adminLoginState) {
      adminLoginState.textContent = "أدخل البريد وكلمة المرور أولًا.";
    }
    return;
  }

  if (!apiClient) {
    handleLocalAdminLogin(email, password);
    return;
  }

  const apiResult = await apiClient.login({
    email,
    password,
    device_name: "mullem-admin-web"
  });

  if (shouldFallbackToLocalAdmin(apiResult)) {
    handleLocalAdminLogin(email, password);
    return;
  }

  if (apiResult.ok && apiResult.data?.user) {
    if (String(apiResult.data.user.role || "").toLowerCase() !== "admin") {
      apiClient.clearSession();
      if (adminLoginState) {
        adminLoginState.textContent = "هذا الحساب لا يملك صلاحية دخول لوحة الأدمن.";
      }
      return;
    }

    localStorage.setItem(adminSessionKey, "1");
    localStorage.removeItem("mlm_current_user");
    if (adminLoginState) adminLoginState.textContent = "تم تسجيل دخول الأدمن بنجاح عبر الخادم.";
    updateAdminView();
    refreshAdminData();
    return;
  }

  if (adminLoginState) {
    adminLoginState.textContent = apiResult.message || "تعذر تسجيل دخول الأدمن. تحقق من البيانات ثم حاول مرة أخرى.";
  }
}, { capture: true });

adminLogoutButton?.addEventListener("click", async (event) => {
  const apiClient = getAdminApiClient();
  if (!apiClient || !apiClient.hasToken()) {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  await apiClient.logout();
  localStorage.removeItem(adminSessionKey);
  if (adminEmailInput) adminEmailInput.value = "";
  if (adminPasswordInput) adminPasswordInput.value = "";
  if (adminLoginState) adminLoginState.textContent = "تم تسجيل الخروج.";
  updateAdminView();
  window.location.href = "login.html";
}, { capture: true });

function renderStats() {
  if (!adminStatsRoot) return;

  const analytics = getAnalytics();
  const users = getUsers();
  const bank = getQuestionBank();
  const generator = getQuestionGeneratorSettings();
  const feedback = getFeedback();

  const stats = [
    {
      label: "إجمالي المستخدمين",
      value: users.length,
      note: "كل الحسابات المسجلة داخل المنصة"
    },
    {
      label: "الأسئلة المعتمدة",
      value: bank.filter((entry) => entry.isApproved).length,
      note: "جاهزة للمسار السريع والإجابة المباشرة"
    },
    {
      label: "مولد اليوم",
      value: generator.generatedToday || 0,
      note: `المعتمد اليوم: ${generator.approvedToday || 0}`
    },
    {
      label: "حالة المولد",
      value: generator.enabled ? "يعمل" : "متوقف",
      note: generator.lastRunAt ? `آخر تشغيل: ${new Date(generator.lastRunAt).toLocaleString("ar-SA")}` : "لم يبدأ التشغيل بعد"
    },
    {
      label: "التقارير والتفاعل",
      value: (feedback.disliked?.length || 0) + (analytics.totalDislikes || 0),
      note: "إشارات تحتاج مراجعة أو تحسين"
    }
  ];

  adminStatsRoot.innerHTML = stats.map((stat) => `
    <article class="stat-card">
      <span>${stat.label}</span>
      <strong>${stat.value}</strong>
      <span>${stat.note}</span>
    </article>
  `).join("");
}

function renderGeneratorLog() {
  if (!generatorLogRoot) return;

  const settings = getQuestionGeneratorSettings();
  const runs = getGeneratorRunEntries(settings);

  if (!runs.length) {
    generatorLogRoot.innerHTML = `
      <div class="admin-log-item">
        <strong>لا توجد تشغيلات بعد</strong>
        <p>عند تشغيل المولد أو تشغيله يدويًا ستظهر هنا آخر النتائج بشكل واضح.</p>
      </div>
    `;
    return;
  }

  generatorLogRoot.innerHTML = runs.map((run) => {
    const modeLabel = run.mode === "manual"
      ? "تشغيل يدوي"
      : (run.mode === "daily" ? "تشغيل يومي" : "تغيير حالة");
    const statusLabel = run.status === "success"
      ? "نجح"
      : (run.status === "error" ? "فشل" : "تنبيه");
    const timestamp = run.at ? new Date(run.at).toLocaleString("ar-SA") : "الآن";

    return `
      <div class="admin-log-item">
        <strong>${modeLabel}</strong>
        <p>أضيف ${run.generated || 0} سؤال، واعتمد ${run.approved || 0}، ورُفض ${run.rejected || 0}.</p>
        <div class="admin-log-meta">
          <span class="admin-meta-chip">${statusLabel}</span>
          <span class="admin-meta-chip">${timestamp}</span>
        </div>
      </div>
    `;
  }).join("");
}

function renderGeneratorStatus() {
  if (!generatorStatusRoot) return;

  const settings = getQuestionGeneratorSettings();
  const stateLabel = settings.enabled ? "يعمل" : "متوقف";
  const resultMessage = settings.lastResultMessage || (settings.enabled
    ? "المولد جاهز ويعمل وفق الإعدادات الحالية."
    : "المولد متوقف حاليًا. يمكنك تشغيله أو حفظ الإعدادات أولًا.");

  generatorStatusRoot.innerHTML = `
    <div class="admin-bank-grid">
      <div class="admin-bank-card">
        <strong>الحالة الحالية</strong>
        <span>${stateLabel}</span>
      </div>
      <div class="admin-bank-card">
        <strong>إحصائيات اليوم</strong>
        <span>توليد: ${settings.generatedToday || 0} • اعتماد: ${settings.approvedToday || 0} • رفض: ${settings.rejectedToday || 0}</span>
      </div>
      <div class="admin-bank-card">
        <strong>آخر تشغيل</strong>
        <span>${settings.lastRunAt ? new Date(settings.lastRunAt).toLocaleString("ar-SA") : "لم يتم التشغيل بعد"}</span>
      </div>
      <div class="admin-bank-card">
        <strong>المصادر الفعالة</strong>
        <span>المنهج أولًا ثم البنك الداخلي ثم التحقق والمقارنة.</span>
      </div>
    </div>
  `;

  setGeneratorFeedback(resultMessage, settings.lastResultStatus || "idle");

  if (generatorToggleButton) {
    generatorToggleButton.textContent = settings.enabled ? "إيقاف المولد" : "تشغيل المولد";
    generatorToggleButton.setAttribute("aria-pressed", settings.enabled ? "true" : "false");
  }

  if (generatorRunButton) {
    generatorRunButton.textContent = generatorRunInProgress ? "جاري التنفيذ..." : "تشغيل يدوي الآن";
  }
}

function runQuestionGenerator(manual = false) {
  if (generatorRunInProgress) {
    setGeneratorFeedback("المولد يعمل الآن بالفعل. انتظر حتى ينتهي التشغيل الحالي.", "running");
    return { generated: 0, approved: 0, rejected: 0, skipped: true };
  }

  generatorRunInProgress = true;
  setGeneratorButtonsBusy(true);
  setGeneratorFeedback("جاري تشغيل مولد الأسئلة الآن ومراجعة النتائج...", "running");

  try {
    const settings = getQuestionGeneratorSettings();
    const todayKey = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const history = getQuestionGeneratorHistory();
    const grades = (Array.isArray(settings.grades) && settings.grades.length ? settings.grades : allSaudiGrades.slice(0, 3));
    const subjects = (Array.isArray(settings.subjects) && settings.subjects.length ? settings.subjects : Object.keys(generatorSeedLibrary).slice(0, 3));
    const target = Math.max(1, Number(settings.dailyTarget || 12));
    const bank = getQuestionBank();
    let generated = 0;
    let approved = 0;
    let rejected = 0;
    let attempts = 0;

    while (generated < target && attempts < target * 8) {
      const grade = grades[attempts % grades.length];
      const subject = subjects[attempts % subjects.length];
      const term = settings.term === "all"
        ? ((attempts + Number(new Date().toISOString().slice(8, 10))) % 2 === 0 ? "الفصل الأول" : "الفصل الثاني")
        : settings.term;
      const entry = createGeneratedEntry({ grade, subject, term }, settings, attempts, bank, history);
      attempts += 1;

      if (entry.isRejected) {
        rejected += 1;
        continue;
      }

      bank.unshift(entry);
      history.push({
        date: todayKey,
        signature: `${entry.grade}|${entry.subject}|${entry.term}|${entry.keywordSignature}`,
        key: entry.key
      });
      generated += 1;
      approved += 1;
    }

    saveQuestionBank(bank);
    saveQuestionGeneratorHistory(history);

    const summaryMessage = manual
      ? `تم تشغيل المولد الآن وإضافة ${generated} سؤال، منها ${approved} معتمدة و${rejected} مرفوضة.`
      : `تم تنفيذ التوليد اليومي وإضافة ${generated} سؤال جديد.`;

    const nextSettings = {
      ...settings,
      lastRunDate: todayKey,
      lastRunAt: nowIso,
      generatedToday: settings.lastRunDate !== todayKey ? generated : (settings.generatedToday || 0) + generated,
      approvedToday: settings.lastRunDate !== todayKey ? approved : (settings.approvedToday || 0) + approved,
      rejectedToday: settings.lastRunDate !== todayKey ? rejected : (settings.rejectedToday || 0) + rejected,
      totalGenerated: (settings.totalGenerated || 0) + generated,
      totalApproved: (settings.totalApproved || 0) + approved,
      totalRejected: (settings.totalRejected || 0) + rejected,
      lastResultMessage: summaryMessage,
      lastResultStatus: generated > 0 ? "success" : "warning",
      recentRuns: appendGeneratorRunEntry(settings, {
        at: nowIso,
        mode: manual ? "manual" : "daily",
        generated,
        approved,
        rejected,
        status: generated > 0 ? "success" : "warning"
      })
    };

    saveQuestionGeneratorSettings(nextSettings);
    setGeneratorFeedback(summaryMessage, generated > 0 ? "success" : "warning");
    return { generated, approved, rejected, skipped: false };
  } catch (error) {
    const settings = getQuestionGeneratorSettings();
    const message = "فشل تشغيل المولد في هذه المحاولة. حاول مرة أخرى بعد مراجعة الإعدادات.";
    saveQuestionGeneratorSettings({
      ...settings,
      lastResultMessage: message,
      lastResultStatus: "error",
      recentRuns: appendGeneratorRunEntry(settings, {
        at: new Date().toISOString(),
        mode: manual ? "manual" : "daily",
        generated: 0,
        approved: 0,
        rejected: 0,
        status: "error"
      })
    });
    setGeneratorFeedback(message, "error");
    console.error(error);
    return { generated: 0, approved: 0, rejected: 0, skipped: false, failed: true };
  } finally {
    generatorRunInProgress = false;
    setGeneratorButtonsBusy(false);
  }
}

function handleGeneratorToggle() {
  const settings = getQuestionGeneratorSettings();
  const enabling = !settings.enabled;
  const nextSettings = getGeneratorDraftSettings({
    ...settings,
    enabled: enabling
  });

  if (!enabling) {
    const nowIso = new Date().toISOString();
    saveQuestionGeneratorSettings({
      ...nextSettings,
      lastResultMessage: "تم إيقاف مولد الأسئلة التلقائي.",
      lastResultStatus: "warning",
      recentRuns: appendGeneratorRunEntry(settings, {
        at: nowIso,
        mode: "toggle",
        generated: 0,
        approved: 0,
        rejected: 0,
        status: "warning"
      })
    });
    setGeneratorFeedback("تم إيقاف مولد الأسئلة التلقائي.", "warning");
    refreshAdminData();
    return;
  }

  saveQuestionGeneratorSettings(nextSettings);
  runQuestionGenerator(true);
  refreshAdminData();
}

function handleGeneratorRunNow() {
  const settings = getGeneratorDraftSettings(getQuestionGeneratorSettings());
  saveQuestionGeneratorSettings(settings);
  runQuestionGenerator(true);
  refreshAdminData();
}

function refreshAdminData() {
  ensureDailyGeneratorRun();
  renderStats();
  renderUsersTable();
  renderFeedback();
  renderSubscribersOverview();
  renderActivityLog();
  renderReports();
  renderQuestionBankSummary();
  renderQuestionBankTable();
  renderGradeBankPanels();
  renderGeneratorStatus();
  renderGeneratorLog();
  syncGeneratorForm();
}

function renderUsersTable() {
  if (!usersTableRoot) return;

  const rows = getUsers()
    .map((user) => `
      <tr>
        <td>
          <div class="admin-user-cell">
            <strong>${user.name || "بدون اسم"}</strong>
            <span>${user.email || "—"}</span>
            <small>${user.grade || "بدون صف"}${user.subject ? ` • ${user.subject}` : ""}</small>
          </div>
        </td>
        <td>
          <div class="admin-user-stack">
            <strong>${user.role || "Student"}</strong>
            <span>${user.package || "مجاني محدود"}</span>
          </div>
        </td>
        <td>${user.xp ?? 0}</td>
        <td>
          <div class="admin-user-stack">
            <strong>${user.status || "نشط"}</strong>
            <span>${user.activity || "لا يوجد نشاط مسجل"}</span>
          </div>
        </td>
        <td>
          <div class="admin-table-actions">
            <button type="button" class="mini-btn" data-admin-edit="${user.id}">تعديل</button>
            <button type="button" class="mini-btn admin-action-points" data-admin-points="${user.id}">تعديل النقاط</button>
            <button
              type="button"
              class="mini-btn ${user.status === "محظور" ? "admin-action-unban" : "admin-action-ban"}"
              data-admin-ban="${user.id}"
            >
              ${user.status === "محظور" ? "فك الحظر" : "حظر"}
            </button>
          </div>
        </td>
      </tr>
    `)
    .join("");

  usersTableRoot.innerHTML = `
    <div class="admin-table-wrap">
      <table class="table admin-users-table">
        <thead>
          <tr>
            <th>المستخدم</th>
            <th>الدور والباقة</th>
            <th>XP</th>
            <th>الحالة وآخر نشاط</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderGeneratorStatus() {
  if (!generatorStatusRoot) return;

  const settings = getQuestionGeneratorSettings();
  const stateLabel = settings.enabled ? "يعمل" : "متوقف";
  const resultMessage = settings.lastResultMessage || (settings.enabled
    ? "المولد جاهز ويعمل وفق الإعدادات الحالية."
    : "المولد متوقف حاليًا. يمكنك تشغيله أو حفظ الإعدادات أولًا.");

  generatorStatusRoot.innerHTML = `
    <div class="admin-bank-grid">
      <div class="admin-bank-card">
        <strong>الحالة الحالية</strong>
        <span>${stateLabel}</span>
      </div>
      <div class="admin-bank-card">
        <strong>إحصائيات اليوم</strong>
        <span>توليد: ${settings.generatedToday || 0} • اعتماد: ${settings.approvedToday || 0} • رفض: ${settings.rejectedToday || 0}</span>
      </div>
      <div class="admin-bank-card">
        <strong>آخر تشغيل</strong>
        <span>${settings.lastRunAt ? new Date(settings.lastRunAt).toLocaleString("ar-SA") : "لم يتم التشغيل بعد"}</span>
      </div>
      <div class="admin-bank-card">
        <strong>المصادر الفعالة</strong>
        <span>المنهج السعودي أولًا، ثم بنك الأسئلة الداخلي، ثم نمط مصادر تعليمية موثوقة مثل بيت العلم، والويب للتحقق والمقارنة فقط.</span>
      </div>
    </div>
  `;

  setGeneratorFeedback(resultMessage, settings.lastResultStatus || "idle");

  if (generatorToggleButton) {
    generatorToggleButton.textContent = settings.enabled ? "إيقاف المولد" : "تشغيل المولد";
    generatorToggleButton.setAttribute("aria-pressed", settings.enabled ? "true" : "false");
  }

  if (generatorRunButton) {
    generatorRunButton.textContent = generatorRunInProgress ? "جاري التنفيذ..." : "تشغيل يدوي الآن";
  }
}

function getGeneratorPatternEntries(subject, grade, questionType, bank = getQuestionBank()) {
  return bank.filter((entry) => (
    entry.isApproved
    && entry.subject === subject
    && entry.questionType === questionType
    && (entry.grade === grade || entry.grade === "unknown")
    && entry.question
  ));
}

function extractGeneratorStylePrefix(question) {
  const text = String(question || "").trim();
  if (!text) return "";
  const markerMatch = text.match(/^(.{0,42}?[:؟?])/);
  if (markerMatch) return markerMatch[1].trim();
  return text.split(/\s+/).slice(0, 6).join(" ").trim();
}

function getGeneratorStylePrefix(subject, grade, questionType, variationIndex, bank = getQuestionBank()) {
  const entries = getGeneratorPatternEntries(subject, grade, questionType, bank);
  if (!entries.length) return "";
  const sample = entries[variationIndex % entries.length];
  return extractGeneratorStylePrefix(sample.question);
}

function buildGeneratorQuestionSignature(question, lesson, answer, questionType) {
  const normalized = normalizeAdminText(`${question} ${lesson} ${answer} ${questionType}`);
  return normalized.split(/\s+/).slice(0, 12).join("|");
}

function buildGeneratedQuestion({ grade, subject, term }, index, history = [], bank = []) {
  const gradeEntriesCount = bank.filter((entry) => entry.grade === grade && entry.subject === subject).length;
  const dateSeed = Number(new Date().toISOString().slice(8, 10));
  const variationIndex = gradeEntriesCount + index + dateSeed + history.length;
  const seed = getGeneratorSeed(subject);
  const weightedTypes = [
    "اختيار من متعدد",
    "صح أو خطأ",
    "اختيار من متعدد",
    "صح أو خطأ",
    "اختيار من متعدد",
    "إكمال فراغ",
    "تعليل / تفسير"
  ];
  const questionType = weightedTypes[variationIndex % weightedTypes.length];
  const stylePrefix = getGeneratorStylePrefix(subject, grade, questionType, variationIndex, bank);

  if (questionType === "اختيار من متعدد") {
    const options = [
      `${seed.concept} هو الفكرة الصحيحة في ${seed.lesson}`,
      `${seed.concept} بعيد عن موضوع ${seed.lesson}`,
      `${seed.lesson} لا يرتبط بـ ${seed.concept}`,
      `${seed.concept} مثال غير مناسب لهذا الدرس`
    ];
    const lead = stylePrefix || `اختر الإجابة الصحيحة في ${subject}`;
    return {
      questionType,
      question: `${lead}:\nأي عبارة تمثل مفهوم "${seed.concept}" في درس ${seed.lesson} للصف ${grade} في ${term}؟`,
      options,
      answer: options[0],
      explanation: seed.explanation,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.93,
      generationMode: "curriculum_first_rewritten_weighted"
    };
  }

  if (questionType === "صح أو خطأ") {
    const isTrue = variationIndex % 2 === 0;
    const statement = isTrue
      ? `يرتبط مفهوم "${seed.concept}" مباشرة بدرس ${seed.lesson} في ${subject}.`
      : `لا توجد علاقة بين مفهوم "${seed.concept}" ودرس ${seed.lesson} في ${subject}.`;
    const lead = stylePrefix || "صواب أم خطأ";
    return {
      questionType,
      question: `${lead}:\n${statement}`,
      options: ["صواب", "خطأ"],
      answer: isTrue ? "صواب" : "خطأ",
      explanation: isTrue
        ? seed.explanation
        : `لأن ${seed.concept} من المفاهيم الأساسية في ${seed.lesson} وليس بعيدًا عنه.`,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.94,
      generationMode: "curriculum_first_rewritten_weighted"
    };
  }

  if (questionType === "إكمال فراغ") {
    const lead = stylePrefix || "أكمل الفراغ";
    return {
      questionType,
      question: `${lead}:\nالمفهوم الأساسي في درس ${seed.lesson} هو ______.`,
      options: [],
      answer: seed.concept,
      explanation: seed.explanation,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.9,
      generationMode: "curriculum_first_rewritten_weighted"
    };
  }

  const lead = stylePrefix || "علل";
  return {
    questionType,
    question: `${lead}:\nلماذا يعد مفهوم "${seed.concept}" مهمًا في درس ${seed.lesson} ضمن ${subject}؟`,
    options: [],
    answer: `لأنه يوضح الفكرة الأساسية في ${seed.lesson} ويرتبط مباشرة بهدف الدرس.`,
    explanation: seed.explanation,
    lesson: seed.lesson,
    concept: seed.concept,
    confidence: 0.88,
    generationMode: "curriculum_first_rewritten_weighted"
  };
}

function validateGeneratedQuestion(candidate, bank, history = []) {
  const hasQuestion = Boolean(candidate.question && candidate.question.trim());
  const hasAnswer = Boolean(candidate.answer && String(candidate.answer).trim());
  const normalizedQuestion = normalizeAdminText(candidate.question);
  const strictSignature = buildGeneratorQuestionSignature(candidate.question, candidate.lesson, candidate.answer, candidate.questionType);
  const duplicate = bank.some((entry) => (
    entry.normalizedQuestion === normalizedQuestion
    || (
      buildGeneratorQuestionSignature(entry.question, entry.lesson, entry.answer, entry.questionType) === strictSignature
      && entry.grade === candidate.grade
      && entry.subject === candidate.subject
      && entry.term === candidate.term
    )
  ));
  const historyDuplicate = history.some((entry) => entry.signature === `${candidate.grade}|${candidate.subject}|${candidate.term}|${candidate.questionType}|${strictSignature}`);
  const hasLogicalOptions = candidate.questionType !== "اختيار من متعدد" || (Array.isArray(candidate.options) && candidate.options.length >= 4);
  const confidence = Number(candidate.confidence || 0);
  const approved = hasQuestion && hasAnswer && hasLogicalOptions && !duplicate && !historyDuplicate && confidence >= 0.78;

  return {
    approved,
    rejected: !approved,
    reason: duplicate || historyDuplicate ? "مكرر" : (!hasLogicalOptions ? "خيارات غير كافية" : (!hasQuestion || !hasAnswer ? "سؤال غير مكتمل" : "اجتاز الفلترة"))
  };
}

function createGeneratedEntry(payload, settings, index, bank, history) {
  const built = buildGeneratedQuestion(payload, index, history, bank);
  const candidate = {
    key: `generated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: built.question,
    questionType: payload.questionType || built.questionType || "اختيار من متعدد",
    options: built.options || [],
    answer: built.answer,
    explanation: built.explanation,
    subject: payload.subject,
    grade: payload.grade,
    term: payload.term,
    lesson: built.lesson,
    source: "مولد الأسئلة - المنهج السعودي أولًا + بنك داخلي + نمط مواقع تعليمية موثوقة مثل بيت العلم مع إعادة صياغة",
    sourceType: "generated_curriculum_pattern",
    keywordSignature: buildGeneratorQuestionSignature(built.question, built.lesson, built.answer, built.questionType),
    confidence: built.confidence,
    likes: 0,
    dislikes: 0,
    usageCount: 0,
    isTrusted: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    decisionBasis: "curriculum_first_with_internal_bank_and_trusted_pattern_style",
    sourcePriority: settings.sourcePriority,
    trustedPatternReference: settings.trustedPatternReference,
    generationMode: built.generationMode || "curriculum_first_rewritten_weighted",
    response: buildRuntimeResponseFromBankEntry({
      questionType: built.questionType || payload.questionType,
      answer: built.answer,
      explanation: built.explanation,
      subject: payload.subject,
      lesson: built.lesson,
      confidence: built.confidence
    })
  };
  candidate.questionType = built.questionType || candidate.questionType;
  const quality = validateGeneratedQuestion(candidate, bank, history);
  candidate.isApproved = quality.approved;
  candidate.isRejected = quality.rejected;
  candidate.qualityScore = Number((candidate.confidence - (quality.rejected ? 0.12 : 0)).toFixed(4));
  candidate.preview = String(candidate.answer || candidate.explanation || "").trim().slice(0, 140);
  return normalizeQuestionBankEntry(candidate);
}

const bankSearchInputEnhanced = document.querySelector("[data-bank-search]");
const generatorGradeChoicesRootEnhanced = document.querySelector("[data-generator-grade-choices]");
const generatorSubjectChoicesRootEnhanced = document.querySelector("[data-generator-subject-choices]");

const generatorDefaultDailyTarget = 10000;
const generatorDefaultGradesEnhanced = allSaudiGrades.slice();
const generatorDefaultSubjectsEnhanced = Object.keys(generatorSeedLibrary);
const generatorContextPoolEnhanced = [
  "في مراجعة يومية سريعة",
  "في بطاقة تدريب قصيرة",
  "في سؤال مشابه لواجب المدرسة",
  "في تدريب نهاية الدرس",
  "في نموذج متابعة يومي",
  "في واجب منزلي مبسط",
  "في مراجعة قبل الاختبار",
  "في نشاط صفي قصير",
  "في تدريب على المفهوم الأساسي",
  "في سؤال تقويمي سريع",
  "في تطبيق على الفكرة الرئيسة",
  "في مراجعة الطالب لهذا الدرس"
];
const generatorFocusPoolEnhanced = [
  "اختر الأدق",
  "حدد الصحيح",
  "أكمل بشكل صحيح",
  "طابق المفهوم المناسب",
  "احكم على العبارة",
  "استخرج الإجابة الصحيحة",
  "ركز على المعنى المنهجي",
  "اعتمد على مفهوم الدرس",
  "اختر الإجابة المرتبطة بالمفهوم",
  "احسم الإجابة المباشرة"
];
const generatorMcqLeadsEnhanced = [
  "اختر الإجابة الصحيحة",
  "حدد الإجابة الأدق",
  "أي الخيارات التالية صحيح",
  "من بين الخيارات التالية"
];
const generatorTrueFalseLeadsEnhanced = [
  "صواب أم خطأ",
  "حدد صحة العبارة",
  "احكم على العبارة التالية"
];
const generatorCompletionLeadsEnhanced = [
  "أكمل الفراغ",
  "أكمل العبارة",
  "ضع الإجابة المناسبة"
];
const generatorExplanationLeadsEnhanced = [
  "علل",
  "فسر",
  "اذكر السبب"
];

function escapeAdminHtmlEnhanced(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeGeneratorDailyTargetEnhanced(value) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) return generatorDefaultDailyTarget;
  return Math.min(10000, Math.max(1, parsed));
}

function enforceGeneratorDailyTargetEnhanced(value) {
  return Math.max(generatorDefaultDailyTarget, normalizeGeneratorDailyTargetEnhanced(value));
}

function normalizeGeneratorSelectionEnhanced(values, fallback) {
  const cleaned = Array.isArray(values)
    ? values.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  return cleaned.length ? cleaned : fallback.slice();
}

function getQuestionGeneratorSettings() {
  const stored = loadJson(questionGeneratorSettingsKey, {}) || {};
  const defaults = {
    enabled: false,
    dailyTarget: generatorDefaultDailyTarget,
    term: "all",
    grades: generatorDefaultGradesEnhanced,
    subjects: generatorDefaultSubjectsEnhanced,
    generatedToday: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalGenerated: 0,
    totalApproved: 0,
    totalRejected: 0,
    lastRunDate: "",
    lastRunAt: "",
    lastResultMessage: "",
    lastResultStatus: "idle",
    recentRuns: [],
    sourcePriority: {
      curriculum: 0.5,
      internalBank: 0.25,
      trustedEducationalPatterns: 0.2,
      webVerification: 0.05
    },
    trustedPatternReference: "صياغة مشابهة للمصادر التعليمية الموثوقة مثل بيت العلم مع إعادة صياغة كاملة وبدون نسخ حرفي."
  };
  const merged = {
    ...defaults,
    ...stored
  };

  return {
    ...merged,
    dailyTarget: enforceGeneratorDailyTargetEnhanced(merged.dailyTarget),
    grades: normalizeGeneratorSelectionEnhanced(merged.grades, defaults.grades),
    subjects: normalizeGeneratorSelectionEnhanced(merged.subjects, defaults.subjects)
  };
}

function writeGeneratorSelectionFieldsEnhanced(settings) {
  if (generatorGradesInput) {
    generatorGradesInput.value = (settings.grades || []).join(", ");
  }
  if (generatorSubjectsInput) {
    generatorSubjectsInput.value = (settings.subjects || []).join(", ");
  }
}

function renderGeneratorChoiceChipsEnhanced(root, options, selectedValues, groupName) {
  if (!root) return;
  const selected = new Set(selectedValues || []);
  root.innerHTML = options.map((option, index) => `
    <label class="admin-choice-chip">
      <input
        type="checkbox"
        data-generator-choice-group="${groupName}"
        value="${escapeAdminHtmlEnhanced(option)}"
        ${selected.has(option) ? "checked" : ""}
        id="${groupName}-${index}"
      >
      <span>${escapeAdminHtmlEnhanced(option)}</span>
    </label>
  `).join("");
}

function getGeneratorChoiceSelectionEnhanced(root, fallback) {
  if (!root) return fallback.slice();
  const checked = Array.from(root.querySelectorAll('input[type="checkbox"]:checked'))
    .map((input) => String(input.value || "").trim())
    .filter(Boolean);
  return checked.length ? checked : fallback.slice();
}

function getGeneratorDraftSettings(baseSettings = getQuestionGeneratorSettings()) {
  const nextSettings = {
    ...baseSettings,
    dailyTarget: enforceGeneratorDailyTargetEnhanced(generatorCountInput?.value || baseSettings.dailyTarget || generatorDefaultDailyTarget),
    term: generatorTermInput?.value || baseSettings.term || "all",
    grades: getGeneratorChoiceSelectionEnhanced(generatorGradeChoicesRootEnhanced, normalizeGeneratorSelectionEnhanced(baseSettings.grades, generatorDefaultGradesEnhanced)),
    subjects: getGeneratorChoiceSelectionEnhanced(generatorSubjectChoicesRootEnhanced, normalizeGeneratorSelectionEnhanced(baseSettings.subjects, generatorDefaultSubjectsEnhanced))
  };

  writeGeneratorSelectionFieldsEnhanced(nextSettings);
  return nextSettings;
}

function syncGeneratorForm() {
  const settings = getQuestionGeneratorSettings();
  if (generatorCountInput) generatorCountInput.value = enforceGeneratorDailyTargetEnhanced(settings.dailyTarget);
  if (generatorTermInput) generatorTermInput.value = settings.term || "all";

  renderGeneratorChoiceChipsEnhanced(
    generatorGradeChoicesRootEnhanced,
    generatorDefaultGradesEnhanced,
    normalizeGeneratorSelectionEnhanced(settings.grades, generatorDefaultGradesEnhanced),
    "grades"
  );
  renderGeneratorChoiceChipsEnhanced(
    generatorSubjectChoicesRootEnhanced,
    generatorDefaultSubjectsEnhanced,
    normalizeGeneratorSelectionEnhanced(settings.subjects, generatorDefaultSubjectsEnhanced),
    "subjects"
  );
  writeGeneratorSelectionFieldsEnhanced(settings);
}

function buildGeneratorDistractorsEnhanced(subject, seed, variationIndex) {
  const sameSubjectSeeds = (generatorSeedLibrary[subject] || []).filter((item) => item.concept !== seed.concept);
  const alternateSeed = sameSubjectSeeds[variationIndex % Math.max(1, sameSubjectSeeds.length)] || null;
  const alternates = [
    alternateSeed ? `يرتبط أكثر بمفهوم "${alternateSeed.concept}" بدل ${seed.concept}` : "",
    `لا يمثل تطبيقًا صحيحًا لدرس ${seed.lesson}`,
    `يصف حالة لا تعكس مفهوم ${seed.concept} في ${subject}`,
    `يربط ${seed.concept} بدرس مختلف عن ${seed.lesson}`
  ].filter(Boolean);

  const rotated = alternates
    .slice(variationIndex % alternates.length)
    .concat(alternates.slice(0, variationIndex % alternates.length));

  return rotated.slice(0, 3);
}

function orderGeneratorOptionsEnhanced(answer, distractors, variationIndex) {
  const options = [answer, ...distractors];
  const rotation = variationIndex % options.length;
  return options.slice(rotation).concat(options.slice(0, rotation));
}

function buildGeneratedQuestion({ grade, subject, term }, index, history = [], bank = []) {
  const dateSeed = Number(new Date().toISOString().slice(8, 10));
  const variationIndex = history.length + bank.length + index + dateSeed;
  const seed = getGeneratorSeed(subject);
  const context = generatorContextPoolEnhanced[variationIndex % generatorContextPoolEnhanced.length];
  const focus = generatorFocusPoolEnhanced[Math.floor(variationIndex / generatorContextPoolEnhanced.length) % generatorFocusPoolEnhanced.length];
  const weightedTypes = [
    "اختيار من متعدد",
    "صح أو خطأ",
    "اختيار من متعدد",
    "صح أو خطأ",
    "اختيار من متعدد",
    "صح أو خطأ",
    "اختيار من متعدد",
    "صح أو خطأ",
    "اختيار من متعدد",
    "إكمال فراغ",
    "تعليل / تفسير"
  ];
  const questionType = weightedTypes[variationIndex % weightedTypes.length];
  const stylePrefix = getGeneratorStylePrefix(subject, grade, questionType, variationIndex, bank);

  if (questionType === "اختيار من متعدد") {
    const lead = stylePrefix || generatorMcqLeadsEnhanced[variationIndex % generatorMcqLeadsEnhanced.length];
    const answer = `${seed.concept} هو الأنسب لفهم ${seed.lesson}`;
    const distractors = buildGeneratorDistractorsEnhanced(subject, seed, variationIndex);
    return {
      questionType,
      question: `${lead}:\n${context}، ${focus}: ما العبارة الأدق التي تعبّر عن مفهوم "${seed.concept}" في درس ${seed.lesson} لمادة ${subject} للصف ${grade} في ${term}؟`,
      options: orderGeneratorOptionsEnhanced(answer, distractors, variationIndex),
      answer,
      explanation: seed.explanation,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.96,
      generationMode: "curriculum_first_rewritten_weighted_mcq_tf"
    };
  }

  if (questionType === "صح أو خطأ") {
    const lead = stylePrefix || generatorTrueFalseLeadsEnhanced[variationIndex % generatorTrueFalseLeadsEnhanced.length];
    const isTrue = variationIndex % 2 === 0;
    const statement = isTrue
      ? `${seed.concept} من المفاهيم الأساسية المرتبطة مباشرة بدرس ${seed.lesson} في مادة ${subject}.`
      : `${seed.concept} لا يرتبط إطلاقًا بدرس ${seed.lesson} في مادة ${subject}.`;
    return {
      questionType,
      question: `${lead}:\n${context}، ${focus}: ${statement}`,
      options: ["صواب", "خطأ"],
      answer: isTrue ? "صواب" : "خطأ",
      explanation: isTrue
        ? seed.explanation
        : `لأن ${seed.concept} مرتبط فعلًا بدرس ${seed.lesson} ضمن ${subject} وليس بعيدًا عنه.`,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.95,
      generationMode: "curriculum_first_rewritten_weighted_mcq_tf"
    };
  }

  if (questionType === "إكمال فراغ") {
    const lead = stylePrefix || generatorCompletionLeadsEnhanced[variationIndex % generatorCompletionLeadsEnhanced.length];
    return {
      questionType,
      question: `${lead}:\n${context}: المفهوم الأوضح في درس ${seed.lesson} هو ______.`,
      options: [],
      answer: seed.concept,
      explanation: seed.explanation,
      lesson: seed.lesson,
      concept: seed.concept,
      confidence: 0.9,
      generationMode: "curriculum_first_rewritten_weighted_mcq_tf"
    };
  }

  const lead = stylePrefix || generatorExplanationLeadsEnhanced[variationIndex % generatorExplanationLeadsEnhanced.length];
  return {
    questionType,
    question: `${lead}:\n${context}: لماذا يعد مفهوم "${seed.concept}" مهمًا داخل درس ${seed.lesson} في ${subject}؟`,
    options: [],
    answer: `لأنه يوضح الفكرة الأساسية لدرس ${seed.lesson} ويرتبط مباشرة بهدفه التعليمي.`,
    explanation: seed.explanation,
    lesson: seed.lesson,
    concept: seed.concept,
    confidence: 0.88,
    generationMode: "curriculum_first_rewritten_weighted_mcq_tf"
  };
}

function validateGeneratedQuestion(candidate, bank, history = []) {
  const normalizedQuestion = normalizeAdminText(candidate.question);
  const strictSignature = buildGeneratorQuestionSignature(candidate.question, candidate.lesson, candidate.answer, candidate.questionType);
  const duplicateInBank = bank.some((entry) => (
    entry.grade === candidate.grade
    && entry.subject === candidate.subject
    && entry.term === candidate.term
    && buildGeneratorQuestionSignature(entry.question, entry.lesson, entry.answer, entry.questionType) === strictSignature
  ));
  const duplicateInHistory = history.some((entry) => entry.signature === `${candidate.grade}|${candidate.subject}|${candidate.term}|${candidate.questionType}|${strictSignature}`);
  const hasQuestion = Boolean(normalizedQuestion);
  const hasAnswer = Boolean(String(candidate.answer || "").trim());
  const validOptions = candidate.questionType !== "اختيار من متعدد"
    || (Array.isArray(candidate.options) && candidate.options.length >= 4 && candidate.options.includes(candidate.answer));
  const approved = hasQuestion && hasAnswer && validOptions && !duplicateInBank && !duplicateInHistory && Number(candidate.confidence || 0) >= 0.72;

  return {
    approved,
    rejected: !approved,
    reason: duplicateInBank || duplicateInHistory
      ? "مكرر"
      : (!validOptions ? "خيارات غير مكتملة" : (!hasQuestion || !hasAnswer ? "سؤال غير مكتمل" : "اجتاز الفلترة"))
  };
}

function renderQuestionBankSummary() {
  if (!questionBankSummaryRoot) return;
  const bank = getQuestionBank();
  const approved = bank.filter((entry) => entry.isApproved).length;
  const trusted = bank.filter((entry) => entry.isTrusted).length;
  const manual = bank.filter((entry) => String(entry.source || "").includes("يدوي") || String(entry.source || "").includes("admin")).length;
  const systemAdded = bank.length - manual;
  const mcqCount = bank.filter((entry) => entry.questionType === "اختيار من متعدد").length;
  const trueFalseCount = bank.filter((entry) => entry.questionType === "صح أو خطأ").length;

  questionBankSummaryRoot.innerHTML = `
    <div class="admin-bank-grid">
      <div class="admin-bank-card">
        <strong>إجمالي العناصر</strong>
        <span>${bank.length} سؤال/إجابة محفوظة</span>
      </div>
      <div class="admin-bank-card">
        <strong>المعتمدة</strong>
        <span>${approved} عنصرًا جاهزًا للمسار السريع</span>
      </div>
      <div class="admin-bank-card">
        <strong>الموثوقة</strong>
        <span>${trusted} عنصرًا بعلامة ثقة مرتفعة</span>
      </div>
      <div class="admin-bank-card">
        <strong>إضافة النظام / الأدمن</strong>
        <span>${systemAdded} تلقائيًا • ${manual} يدويًا</span>
      </div>
      <div class="admin-bank-card">
        <strong>اختيار من متعدد</strong>
        <span>${mcqCount} سؤالًا محفوظًا</span>
      </div>
      <div class="admin-bank-card">
        <strong>صح/خطأ</strong>
        <span>${trueFalseCount} سؤالًا محفوظًا</span>
      </div>
    </div>
  `;
}

function renderQuestionBankTable() {
  if (!questionBankTableRoot) return;
  const query = normalizeAdminText(bankSearchInputEnhanced?.value || "");
  const bank = getQuestionBank()
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .filter((entry) => {
      if (!query) return true;
      const haystack = normalizeAdminText([
        entry.question,
        entry.answer,
        entry.subject,
        entry.grade,
        entry.term,
        entry.lesson
      ].join(" "));
      return haystack.includes(query);
    });

  const rows = bank
    .slice(0, query ? 120 : 60)
    .map((entry) => `
      <tr>
        <td>${escapeAdminHtmlEnhanced(entry.question || "—")}</td>
        <td>${escapeAdminHtmlEnhanced(entry.questionType || "—")}</td>
        <td>${escapeAdminHtmlEnhanced(entry.subject || "—")}</td>
        <td>${escapeAdminHtmlEnhanced(entry.grade || "—")}</td>
        <td>${escapeAdminHtmlEnhanced(entry.term || "—")}</td>
        <td>${escapeAdminHtmlEnhanced(entry.answer || entry.response?.finalAnswer || "—")}</td>
        <td>${Number(entry.confidence || 0).toFixed(2)}</td>
        <td>${entry.likes || 0} / ${entry.dislikes || 0}</td>
        <td>${entry.isApproved ? "معتمد" : (entry.isRejected ? "مرفوض" : "قيد المراجعة")}</td>
        <td>
          <div class="admin-table-actions">
            <button type="button" class="mini-btn" data-bank-edit="${escapeAdminHtmlEnhanced(entry.key)}">تعديل</button>
            <button type="button" class="mini-btn admin-action-unban" data-bank-approve="${escapeAdminHtmlEnhanced(entry.key)}">
              ${entry.isApproved ? "إلغاء الاعتماد" : "اعتماد"}
            </button>
            <button type="button" class="mini-btn admin-action-ban" data-bank-delete="${escapeAdminHtmlEnhanced(entry.key)}">حذف</button>
          </div>
        </td>
      </tr>
    `)
    .join("");

  questionBankTableRoot.innerHTML = `
    <div class="admin-inline-note">${query ? `نتائج البحث: ${bank.length}` : "يعرض أحدث الأسئلة المحفوظة مع إمكانية التعديل والاعتماد."}</div>
    <div class="admin-table-wrap">
      <table class="table admin-users-table">
        <thead>
          <tr>
            <th>السؤال</th>
            <th>النوع</th>
            <th>المادة</th>
            <th>الصف</th>
            <th>الترم</th>
            <th>الإجابة</th>
            <th>الثقة</th>
            <th>التفاعل</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="10">لا توجد أسئلة مطابقة لبحثك الحالي.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function runQuestionGenerator(manual = false) {
  if (generatorRunInProgress) {
    setGeneratorFeedback("المولد يعمل الآن بالفعل. انتظر حتى ينتهي التشغيل الحالي.", "running");
    return { generated: 0, approved: 0, rejected: 0, skipped: true };
  }

  generatorRunInProgress = true;
  setGeneratorButtonsBusy(true);
  setGeneratorFeedback("جاري تشغيل مولد الأسئلة الآن ومراجعة النتائج...", "running");

  try {
    const settings = getQuestionGeneratorSettings();
    const todayKey = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const history = getQuestionGeneratorHistory();
    const grades = normalizeGeneratorSelectionEnhanced(settings.grades, generatorDefaultGradesEnhanced);
    const subjects = normalizeGeneratorSelectionEnhanced(settings.subjects, generatorDefaultSubjectsEnhanced);
    const target = normalizeGeneratorDailyTargetEnhanced(settings.dailyTarget || generatorDefaultDailyTarget);
    const maxAttempts = Math.max(target * 3, 600);
    const bank = getQuestionBank();
    let generated = 0;
    let approved = 0;
    let rejected = 0;
    let attempts = 0;

    while (generated < target && attempts < maxAttempts) {
      const grade = grades[attempts % grades.length];
      const subject = subjects[Math.floor(attempts / Math.max(1, grades.length)) % subjects.length];
      const term = settings.term === "all"
        ? ((attempts + Number(new Date().toISOString().slice(8, 10))) % 2 === 0 ? "الفصل الأول" : "الفصل الثاني")
        : settings.term;
      const entry = createGeneratedEntry({ grade, subject, term }, settings, attempts, bank, history);
      attempts += 1;

      if (entry.isRejected) {
        rejected += 1;
        continue;
      }

      bank.unshift(entry);
      history.push({
        date: todayKey,
        signature: `${entry.grade}|${entry.subject}|${entry.term}|${entry.questionType}|${buildGeneratorQuestionSignature(entry.question, entry.lesson, entry.answer, entry.questionType)}`,
        key: entry.key
      });
      generated += 1;
      approved += 1;
    }

    saveQuestionBank(bank);
    saveQuestionGeneratorHistory(history);

    const summaryMessage = manual
      ? `تم تشغيل المولد الآن وإضافة ${generated} سؤال، منها ${approved} معتمدة و${rejected} مرفوضة.`
      : `تم تنفيذ التوليد اليومي وإضافة ${generated} سؤال جديد.`;

    const nextSettings = {
      ...settings,
      lastRunDate: todayKey,
      lastRunAt: nowIso,
      generatedToday: settings.lastRunDate !== todayKey ? generated : (settings.generatedToday || 0) + generated,
      approvedToday: settings.lastRunDate !== todayKey ? approved : (settings.approvedToday || 0) + approved,
      rejectedToday: settings.lastRunDate !== todayKey ? rejected : (settings.rejectedToday || 0) + rejected,
      totalGenerated: (settings.totalGenerated || 0) + generated,
      totalApproved: (settings.totalApproved || 0) + approved,
      totalRejected: (settings.totalRejected || 0) + rejected,
      lastResultMessage: summaryMessage,
      lastResultStatus: generated > 0 ? "success" : "warning",
      recentRuns: appendGeneratorRunEntry(settings, {
        at: nowIso,
        mode: manual ? "manual" : "daily",
        generated,
        approved,
        rejected,
        status: generated > 0 ? "success" : "warning"
      })
    };

    saveQuestionGeneratorSettings(nextSettings);
    setGeneratorFeedback(summaryMessage, generated > 0 ? "success" : "warning");
    return { generated, approved, rejected, skipped: false };
  } catch (error) {
    const settings = getQuestionGeneratorSettings();
    const message = "فشل تشغيل المولد في هذه المحاولة. حاول مرة أخرى بعد مراجعة الإعدادات.";
    saveQuestionGeneratorSettings({
      ...settings,
      lastResultMessage: message,
      lastResultStatus: "error",
      recentRuns: appendGeneratorRunEntry(settings, {
        at: new Date().toISOString(),
        mode: manual ? "manual" : "daily",
        generated: 0,
        approved: 0,
        rejected: 0,
        status: "error"
      })
    });
    setGeneratorFeedback(message, "error");
    console.error(error);
    return { generated: 0, approved: 0, rejected: 0, skipped: false, failed: true };
  } finally {
    generatorRunInProgress = false;
    setGeneratorButtonsBusy(false);
  }
}

bankSearchInputEnhanced?.addEventListener("input", () => {
  renderQuestionBankTable();
});

document.addEventListener("change", (event) => {
  const choiceInput = event.target;
  if (!(choiceInput instanceof HTMLInputElement)) return;
  if (!choiceInput.matches("[data-generator-choice-group]")) return;
  writeGeneratorSelectionFieldsEnhanced(getGeneratorDraftSettings(getQuestionGeneratorSettings()));
});

updateAdminView();
bindPasswordToggles();

if (isAdminLoggedIn()) {
  refreshAdminData();
}

(() => {
  const generatorStageConfig = {
    "ابتدائي": {
      grades: [
        "الأول الابتدائي",
        "الثاني الابتدائي",
        "الثالث الابتدائي",
        "الرابع الابتدائي",
        "الخامس الابتدائي",
        "السادس الابتدائي"
      ],
      subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الاجتماعية"]
    },
    "متوسط": {
      grades: [
        "الأول المتوسط",
        "الثاني المتوسط",
        "الثالث المتوسط"
      ],
      subjects: ["الرياضيات", "العلوم", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الاجتماعية"]
    },
    "ثانوي": {
      grades: [
        "الأول الثانوي",
        "الثاني الثانوي",
        "الثالث الثانوي"
      ],
      subjects: ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الدراسات الاجتماعية"]
    }
  };

  const originalGetQuestionGeneratorSettingsFinal = getQuestionGeneratorSettings;
  const originalGetGeneratorDraftSettingsFinal = getGeneratorDraftSettings;
  const originalSyncGeneratorFormFinal = syncGeneratorForm;
  const originalRenderQuestionBankSummaryFinal = renderQuestionBankSummary;
  const originalRenderQuestionBankTableFinal = renderQuestionBankTable;
  const originalRenderGeneratorStatusFinal = renderGeneratorStatus;
  const originalRenderUsersTableFinal = renderUsersTable;
  const originalRefreshAdminDataFinal = refreshAdminData;

  function getGeneratorStageFromGrade(grade) {
    const safeGrade = String(grade || "").trim();
    return Object.entries(generatorStageConfig).find(([, config]) => config.grades.includes(safeGrade))?.[0] || "";
  }

  function inferGeneratorStage(settings) {
    if (settings?.stage && generatorStageConfig[settings.stage]) return settings.stage;
    const gradeStage = Array.isArray(settings?.grades)
      ? settings.grades.map(getGeneratorStageFromGrade).find(Boolean)
      : "";
    if (gradeStage) return gradeStage;
    return "ثانوي";
  }

  function getStageScopedSubjects(stage) {
    const allowed = generatorStageConfig[stage]?.subjects || generatorStageConfig["ثانوي"].subjects;
    return allowed.filter((subject) => Object.prototype.hasOwnProperty.call(generatorSeedLibrary, subject));
  }

  function ensureGeneratorStageSwitch() {
    if (!generatorForm) return null;
    let root = generatorForm.querySelector("[data-generator-stage-switch]");
    if (!root) {
      const wrapper = document.createElement("div");
      wrapper.className = "admin-multiselect-block";
      wrapper.innerHTML = `
        <div class="admin-multiselect-head">
          <strong>المرحلة المستهدفة</strong>
          <span>ابدأ بتحديد المرحلة، ثم اختر الصفوف والمواد الخاصة بها فقط حتى يكون التوليد أدق وأكثر ترتيبًا.</span>
        </div>
        <div class="admin-stage-switch" data-generator-stage-switch></div>
      `;
      const firstGrid = generatorForm.querySelector(".admin-form-grid");
      if (firstGrid) {
        firstGrid.insertAdjacentElement("afterend", wrapper);
      } else {
        generatorForm.prepend(wrapper);
      }
      root = wrapper.querySelector("[data-generator-stage-switch]");
    }

    if (root && !root.dataset.bound) {
      root.addEventListener("click", (event) => {
        const button = event.target.closest("[data-generator-stage]");
        if (!button) return;
        const stage = button.getAttribute("data-generator-stage") || "ثانوي";
        const current = getQuestionGeneratorSettings();
        const scopedSubjects = getStageScopedSubjects(stage);
        const scopedGrades = generatorStageConfig[stage]?.grades || [];
        saveQuestionGeneratorSettings({
          ...current,
          stage,
          grades: scopedGrades.slice(0, Math.min(3, scopedGrades.length)),
          subjects: scopedSubjects.slice(0, Math.min(3, scopedSubjects.length))
        });
        syncGeneratorForm();
        renderGeneratorStatus();
      });
      root.dataset.bound = "true";
    }

    return root;
  }

  function renderGeneratorStageSwitch(settings) {
    const root = ensureGeneratorStageSwitch();
    if (!root) return;
    const activeStage = inferGeneratorStage(settings);
    root.innerHTML = Object.keys(generatorStageConfig).map((stage) => `
      <button
        class="admin-stage-btn ${stage === activeStage ? "active" : ""}"
        type="button"
        data-generator-stage="${escapeAdminHtmlEnhanced(stage)}"
        aria-pressed="${stage === activeStage ? "true" : "false"}"
      >
        ${escapeAdminHtmlEnhanced(stage)}
      </button>
    `).join("");
  }

  getQuestionGeneratorSettings = function patchedGetQuestionGeneratorSettings() {
    const settings = originalGetQuestionGeneratorSettingsFinal();
    const stage = inferGeneratorStage(settings);
    const allowedGrades = generatorStageConfig[stage]?.grades || generatorStageConfig["ثانوي"].grades;
    const allowedSubjects = getStageScopedSubjects(stage);
    const safeGrades = Array.isArray(settings.grades)
      ? settings.grades.filter((grade) => allowedGrades.includes(grade))
      : [];
    const safeSubjects = Array.isArray(settings.subjects)
      ? settings.subjects.filter((subject) => allowedSubjects.includes(subject))
      : [];

    return {
      ...settings,
      stage,
      grades: safeGrades.length ? safeGrades : allowedGrades.slice(0, Math.min(3, allowedGrades.length)),
      subjects: safeSubjects.length ? safeSubjects : allowedSubjects.slice(0, Math.min(3, allowedSubjects.length))
    };
  };

  getGeneratorDraftSettings = function patchedGetGeneratorDraftSettings(baseSettings = getQuestionGeneratorSettings()) {
    const currentStage = generatorForm?.querySelector("[data-generator-stage].active")?.getAttribute("data-generator-stage")
      || inferGeneratorStage(baseSettings);
    const scopedGrades = generatorStageConfig[currentStage]?.grades || generatorStageConfig["ثانوي"].grades;
    const scopedSubjects = getStageScopedSubjects(currentStage);
    const selectedGrades = getGeneratorChoiceSelectionEnhanced(generatorGradeChoicesRootEnhanced, scopedGrades.slice(0, Math.min(3, scopedGrades.length)))
      .filter((grade) => scopedGrades.includes(grade));
    const selectedSubjects = getGeneratorChoiceSelectionEnhanced(generatorSubjectChoicesRootEnhanced, scopedSubjects.slice(0, Math.min(3, scopedSubjects.length)))
      .filter((subject) => scopedSubjects.includes(subject));

    const nextSettings = {
      ...originalGetGeneratorDraftSettingsFinal(baseSettings),
      stage: currentStage,
      grades: selectedGrades.length ? selectedGrades : scopedGrades.slice(0, Math.min(3, scopedGrades.length)),
      subjects: selectedSubjects.length ? selectedSubjects : scopedSubjects.slice(0, Math.min(3, scopedSubjects.length))
    };

    writeGeneratorSelectionFieldsEnhanced(nextSettings);
    return nextSettings;
  };

  syncGeneratorForm = function patchedSyncGeneratorForm() {
    const settings = getQuestionGeneratorSettings();
    const activeStage = inferGeneratorStage(settings);
    const scopedGrades = generatorStageConfig[activeStage]?.grades || generatorStageConfig["ثانوي"].grades;
    const scopedSubjects = getStageScopedSubjects(activeStage);

    if (generatorCountInput) generatorCountInput.value = enforceGeneratorDailyTargetEnhanced(settings.dailyTarget);
    if (generatorTermInput) generatorTermInput.value = settings.term || "all";

    renderGeneratorStageSwitch(settings);
    renderGeneratorChoiceChipsEnhanced(
      generatorGradeChoicesRootEnhanced,
      scopedGrades,
      (settings.grades || []).filter((grade) => scopedGrades.includes(grade)),
      "grades"
    );
    renderGeneratorChoiceChipsEnhanced(
      generatorSubjectChoicesRootEnhanced,
      scopedSubjects,
      (settings.subjects || []).filter((subject) => scopedSubjects.includes(subject)),
      "subjects"
    );
    writeGeneratorSelectionFieldsEnhanced(settings);
  };

  function getQuestionBankSourceStats(bank) {
    const sources = bank.reduce((acc, entry) => {
      const label = entry.sourceType || entry.source || "internal";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
    const top = Object.entries(sources).sort((a, b) => b[1] - a[1])[0];
    return {
      topSource: top?.[0] || "لا يوجد مصدر بارز بعد",
      topSourceCount: top?.[1] || 0
    };
  }

  renderQuestionBankSummary = function patchedRenderQuestionBankSummary() {
    if (!questionBankSummaryRoot) return;
    const bank = getQuestionBank();
    const approved = bank.filter((entry) => entry.isApproved).length;
    const mcqCount = bank.filter((entry) => entry.questionType === "اختيار من متعدد").length;
    const trueFalseCount = bank.filter((entry) => entry.questionType === "صح أو خطأ").length;
    const sourceStats = getQuestionBankSourceStats(bank);

    questionBankSummaryRoot.innerHTML = `
      <div class="admin-bank-grid">
        <div class="admin-bank-card">
          <strong>إجمالي الأسئلة</strong>
          <span>${bank.length} سؤال محفوظ داخل النظام</span>
        </div>
        <div class="admin-bank-card">
          <strong>الأسئلة المعتمدة</strong>
          <span>${approved} سؤالًا جاهزًا للمسار السريع</span>
        </div>
        <div class="admin-bank-card">
          <strong>الأكثر إضافة حسب المصدر</strong>
          <span>${sourceStats.topSource} • ${sourceStats.topSourceCount}</span>
        </div>
        <div class="admin-bank-card">
          <strong>تركيز الأنواع</strong>
          <span>اختيار: ${mcqCount} • صح/خطأ: ${trueFalseCount}</span>
        </div>
      </div>
    `;
  };

  renderQuestionBankTable = function patchedRenderQuestionBankTable() {
    if (!questionBankTableRoot) return;
    const query = normalizeAdminText(bankSearchInputEnhanced?.value || "");
    const bank = getQuestionBank()
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    if (!query) {
      questionBankTableRoot.innerHTML = `
        <div class="admin-bank-search-note">
          <strong>بنك الأسئلة محفوظ داخليًا</strong>
          <span>لن نعرض قائمة الأسئلة كاملة هنا حتى تبقى لوحة الأدمن أخف. اكتب اسم السؤال أو جزءًا منه في البحث، أو أضف سؤالًا جديدًا من النموذج المجاور.</span>
        </div>
      `;
      return;
    }

    const matches = bank.filter((entry) => {
      const haystack = normalizeAdminText([
        entry.question,
        entry.normalizedQuestion,
        entry.subject,
        entry.grade,
        entry.term,
        entry.lesson
      ].join(" "));
      return haystack.includes(query);
    }).slice(0, 8);

    questionBankTableRoot.innerHTML = matches.length
      ? `
          <div class="admin-bank-search-results">
            ${matches.map((entry) => `
              <article class="admin-search-result-card">
                <strong>${escapeAdminHtmlEnhanced(entry.question || "بدون نص")}</strong>
                <div class="admin-search-result-meta">
                  <span>${escapeAdminHtmlEnhanced(entry.questionType || "عام")}</span>
                  <span>${escapeAdminHtmlEnhanced(entry.subject || "عام")}</span>
                  <span>${escapeAdminHtmlEnhanced(entry.grade || "غير محدد")}</span>
                  <span>${escapeAdminHtmlEnhanced(entry.term || "غير محدد")}</span>
                </div>
                <div class="admin-table-actions">
                  <button type="button" class="mini-btn" data-bank-edit="${escapeAdminHtmlEnhanced(entry.key)}">تعديل</button>
                  <button type="button" class="mini-btn admin-action-unban" data-bank-approve="${escapeAdminHtmlEnhanced(entry.key)}">
                    ${entry.isApproved ? "إلغاء الاعتماد" : "اعتماد"}
                  </button>
                  <button type="button" class="mini-btn admin-action-ban" data-bank-delete="${escapeAdminHtmlEnhanced(entry.key)}">حذف</button>
                </div>
              </article>
            `).join("")}
          </div>
        `
      : `
          <div class="admin-bank-search-note">
            <strong>لا توجد نتيجة مطابقة</strong>
            <span>جرّب كتابة جزء آخر من اسم السؤال، أو أضفه يدويًا إذا لم يكن موجودًا بعد.</span>
          </div>
        `;
  };

  renderGeneratorStatus = function patchedRenderGeneratorStatus() {
    originalRenderGeneratorStatusFinal();
    const settings = getQuestionGeneratorSettings();
    const stage = inferGeneratorStage(settings);
    if (generatorStatusRoot) {
      generatorStatusRoot.insertAdjacentHTML("beforeend", `
        <div class="admin-bank-grid">
          <div class="admin-bank-card">
            <strong>المرحلة الحالية</strong>
            <span>${escapeAdminHtmlEnhanced(stage)}</span>
          </div>
          <div class="admin-bank-card">
            <strong>الصفوف المحددة</strong>
            <span>${escapeAdminHtmlEnhanced((settings.grades || []).join("، "))}</span>
          </div>
          <div class="admin-bank-card">
            <strong>المواد المحددة</strong>
            <span>${escapeAdminHtmlEnhanced((settings.subjects || []).join("، "))}</span>
          </div>
          <div class="admin-bank-card">
            <strong>التدريب المستمر</strong>
            <span>كل سؤال معتمد يُحفظ ويُستخدم لاحقًا في المسار السريع داخل الشات.</span>
          </div>
        </div>
      `);
    }
  };

  renderUsersTable = function patchedRenderUsersTable() {
    if (!usersTableRoot) return;
    const rows = getUsers()
      .map((user) => `
        <tr>
          <td>
            <div class="admin-user-cell">
              <strong>${escapeAdminHtmlEnhanced(user.name || "بدون اسم")}</strong>
              <span>${escapeAdminHtmlEnhanced(user.email || "—")}</span>
              <small>${escapeAdminHtmlEnhanced(user.grade || "بدون صف")}${user.subject ? ` • ${escapeAdminHtmlEnhanced(user.subject)}` : ""}</small>
            </div>
          </td>
          <td>
            <div class="admin-user-stack">
              <strong>${escapeAdminHtmlEnhanced(user.role || "Student")}</strong>
              <span>${escapeAdminHtmlEnhanced(user.package || "مجاني محدود")}</span>
            </div>
          </td>
          <td>${user.xp ?? 0}</td>
          <td>
            <div class="admin-user-stack">
              <strong>${escapeAdminHtmlEnhanced(user.status || "نشط")}</strong>
              <span>${escapeAdminHtmlEnhanced(user.activity || "لا يوجد نشاط مسجل")}</span>
            </div>
          </td>
          <td>
            <div class="admin-table-actions">
              <button type="button" class="mini-btn" data-admin-edit="${escapeAdminHtmlEnhanced(user.id)}">تعديل البيانات</button>
              <button type="button" class="mini-btn admin-action-points" data-admin-points="${escapeAdminHtmlEnhanced(user.id)}">تعديل النقاط</button>
              <button
                type="button"
                class="mini-btn ${user.status === "محظور" ? "admin-action-unban" : "admin-action-ban"}"
                data-admin-ban="${escapeAdminHtmlEnhanced(user.id)}"
              >
                ${user.status === "محظور" ? "فك الحظر" : "حظر الحساب"}
              </button>
            </div>
          </td>
        </tr>
      `)
      .join("");

    usersTableRoot.innerHTML = `
      <div class="admin-inline-note">جميع الإجراءات واضحة من اليمين: تعديل البيانات، تعديل النقاط، ثم الحظر أو فك الحظر.</div>
      <div class="admin-table-wrap">
        <table class="table admin-users-table">
          <thead>
            <tr>
              <th>المستخدم</th>
              <th>الدور والباقة</th>
              <th>XP</th>
              <th>الحالة وآخر نشاط</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  refreshAdminData = function patchedRefreshAdminData() {
    originalRefreshAdminDataFinal();
    syncGeneratorForm();
  };

  bankSearchInputEnhanced?.setAttribute("placeholder", "ابحث باسم السؤال أو جزء منه للتأكد من وجوده داخل النظام");
  ensureGeneratorStageSwitch();
  if (isAdminLoggedIn()) {
    refreshAdminData();
  }
})();

(() => {
  const localGeneratorDisabledMessage = "تم تعطيل مولد الأسئلة المحلي. المنصة تعتمد الآن على Laravel API وAI فقط.";

  function hideLocalGeneratorUi() {
    document.querySelectorAll('a[href="#admin-generator"]').forEach((link) => link.remove());
    document.querySelectorAll("#admin-generator").forEach((section) => {
      section.hidden = true;
    });
  }

  function disableLocalGeneratorState() {
    if (typeof getQuestionGeneratorSettings !== "function" || typeof saveQuestionGeneratorSettings !== "function") {
      return;
    }

    const settings = getQuestionGeneratorSettings();
    saveQuestionGeneratorSettings({
      ...settings,
      enabled: false,
      lastResultMessage: localGeneratorDisabledMessage,
      lastResultStatus: "warning"
    });

    if (typeof setGeneratorButtonsBusy === "function") {
      setGeneratorButtonsBusy(false);
    }

    if (typeof setGeneratorFeedback === "function") {
      setGeneratorFeedback(localGeneratorDisabledMessage, "warning");
    }
  }

  const originalRefreshAdminDataApiOnly = refreshAdminData;

  ensureDailyGeneratorRun = function disabledEnsureDailyGeneratorRun() {
    return;
  };

  runQuestionGenerator = function disabledRunQuestionGenerator() {
    disableLocalGeneratorState();
    hideLocalGeneratorUi();
    return {
      generated: 0,
      approved: 0,
      rejected: 0,
      skipped: true,
      disabled: true
    };
  };

  handleGeneratorToggle = function disabledHandleGeneratorToggle() {
    disableLocalGeneratorState();
    hideLocalGeneratorUi();
  };

  handleGeneratorRunNow = function disabledHandleGeneratorRunNow() {
    disableLocalGeneratorState();
    hideLocalGeneratorUi();
  };

  window.adminHandleGeneratorToggle = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    handleGeneratorToggle();
  };

  window.adminHandleGeneratorRunNow = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    handleGeneratorRunNow();
  };

  refreshAdminData = function refreshAdminDataApiOnly() {
    disableLocalGeneratorState();
    originalRefreshAdminDataApiOnly();
    hideLocalGeneratorUi();
  };

  hideLocalGeneratorUi();

  if (typeof isAdminLoggedIn === "function" && isAdminLoggedIn()) {
    disableLocalGeneratorState();
    hideLocalGeneratorUi();
  }
})();

(() => {
  const adminSearchConfigStorageKey = "mlm_admin_search_config";
  const defaultTrustedDomains = [
    { domain: "ien.edu.sa", label: "عين والمنصات الرسمية" },
    { domain: "beitalelm.com", label: "بيت العلم" },
    { domain: "mawdoo3.com", label: "موضوع" },
  ];

  function getLocalAdminSearchConfig() {
    return {
      trustedDomains: defaultTrustedDomains.map((item) => item.domain),
      ...loadJson(adminSearchConfigStorageKey, {}),
    };
  }

  function saveLocalAdminSearchConfig(config) {
    saveJson(adminSearchConfigStorageKey, config);
  }

  function findAdminSourcePanel() {
    return document.querySelector(".admin-source-list")?.closest(".admin-panel") || null;
  }

  function collectSelectedDomains(root) {
    if (!root) return [];
    return Array.from(root.querySelectorAll("[data-admin-domain-option]:checked"))
      .map((input) => input.value.trim())
      .filter(Boolean);
  }

  async function syncSearchConfigFromBackend() {
    try {
      const apiClient = getAdminApiClient();
      if (!apiClient) throw new Error("backend unavailable");
      const result = await apiClient.request("/admin/search-config");
      if (!result.ok || !result.payload) throw new Error("backend unavailable");
      const payload = result.payload;
      const nextConfig = {
        trustedDomains: Array.isArray(payload.trusted_domains) && payload.trusted_domains.length
          ? payload.trusted_domains
          : defaultTrustedDomains.map((item) => item.domain),
      };
      saveLocalAdminSearchConfig(nextConfig);
      renderTrustedDomainsManager();
    } catch {
      // Keep the local config silently when backend is not mounted on the same origin yet.
    }
  }

  async function pushSearchConfigToBackend(root) {
    const status = root?.querySelector("[data-admin-domain-status]");
    const trustedDomains = collectSelectedDomains(root);
    const apiClient = getAdminApiClient();
    saveLocalAdminSearchConfig({ trustedDomains });
    if (status) {
      status.textContent = "جاري مزامنة المواقع الموثوقة مع الخلفية...";
    }

    try {
      if (!apiClient) throw new Error("sync failed");
      const result = await apiClient.request("/admin/search-config", {
        method: "PUT",
        body: { trusted_domains: trustedDomains },
      });
      if (!result.ok || !result.payload) throw new Error("sync failed");
      const payload = result.payload;
      saveLocalAdminSearchConfig({ trustedDomains: payload.trusted_domains || trustedDomains });
      if (status) {
        status.textContent = "تم حفظ المواقع الموثوقة في الخلفية بنجاح.";
      }
    } catch {
      if (status) {
        status.textContent = "تم حفظ الاختيار محليًا داخل لوحة الأدمن. عند توفر الـ backend سيتم إرسالها إليه مباشرة.";
      }
    }
  }

  function renderTrustedDomainsManager() {
    const panel = findAdminSourcePanel();
    if (!panel) return;

    const existing = panel.querySelector("[data-admin-domain-manager]");
    if (existing) existing.remove();

    const config = getLocalAdminSearchConfig();
    const block = document.createElement("div");
    block.className = "admin-domain-manager";
    block.setAttribute("data-admin-domain-manager", "true");
    block.innerHTML = `
      <div class="admin-domain-head">
        <strong>المواقع الموثوقة للبحث والتحقق</strong>
        <span>هذه المواقع فقط تُرسل إلى الـ backend كـ whitelist للبحث عبر SerpApi.</span>
      </div>
      <div class="admin-domain-grid">
        ${defaultTrustedDomains.map((item) => `
          <label class="admin-domain-option">
            <input
              type="checkbox"
              data-admin-domain-option
              value="${item.domain}"
              ${config.trustedDomains.includes(item.domain) ? "checked" : ""}
            >
            <span>${item.label}</span>
            <small>${item.domain}</small>
          </label>
        `).join("")}
      </div>
      <div class="admin-domain-actions">
        <button type="button" class="mini-btn" data-admin-domain-save>حفظ المواقع</button>
        <button type="button" class="mini-btn admin-action-points" data-admin-domain-sync>مزامنة مع الخلفية</button>
      </div>
      <div class="small-copy" data-admin-domain-status>المفتاح لا يُحفظ هنا، بل على السيرفر فقط. هذه القائمة تضبط النطاقات الموثوقة لا غير.</div>
    `;
    panel.appendChild(block);

    block.querySelector("[data-admin-domain-save]")?.addEventListener("click", () => {
      const trustedDomains = collectSelectedDomains(block);
      saveLocalAdminSearchConfig({ trustedDomains });
      const status = block.querySelector("[data-admin-domain-status]");
      if (status) {
        status.textContent = "تم حفظ اختيار المواقع الموثوقة داخل لوحة الأدمن.";
      }
    });

    block.querySelector("[data-admin-domain-sync]")?.addEventListener("click", () => {
      pushSearchConfigToBackend(block);
    });
  }

  const originalRefreshAdminDataDomains = refreshAdminData;
  refreshAdminData = function refreshAdminDataWithTrustedDomains() {
    originalRefreshAdminDataDomains();
    renderTrustedDomainsManager();
  };

  if (isAdminLoggedIn()) {
    renderTrustedDomainsManager();
    syncSearchConfigFromBackend();
  }
})();

(() => {
  const adminApiStatsStorageKey = "mlm_admin_api_stats";

  function buildAdminStatsFromApi(apiStats) {
    if (!adminStatsRoot || !apiStats) return false;

    const stats = [
      { label: "إجمالي المستخدمين", value: apiStats.users_count ?? 0, note: "مأخوذة من Laravel API" },
      { label: "الطلاب", value: apiStats.students_count ?? 0, note: "عدد حسابات الطلاب" },
      { label: "الأدمن", value: apiStats.admins_count ?? 0, note: "عدد حسابات الإدارة" },
      { label: "المحادثات", value: apiStats.conversations_count ?? 0, note: "إجمالي المحادثات المحفوظة" },
      { label: "الرسائل", value: apiStats.messages_count ?? 0, note: "إجمالي الرسائل في النظام" },
      { label: "الحسابات النشطة", value: apiStats.active_users_count ?? 0, note: "الحسابات النشطة حاليًا" }
    ];

    adminStatsRoot.innerHTML = stats
      .map(
        (stat) => `
          <article class="stat-card">
            <span>${stat.label}</span>
            <strong>${stat.value}</strong>
            <span>${stat.note}</span>
          </article>
        `
      )
      .join("");

    return true;
  }

  async function syncAdminSnapshotFromApi() {
    const apiClient = getAdminApiClient();
    if (!apiClient || !apiClient.hasToken() || !isAdminLoggedIn()) return;

    try {
      const [statsResult, usersResult] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAdminUsers({ per_page: 100 }),
      ]);

      if (statsResult.ok && statsResult.data?.stats) {
        saveJson(adminApiStatsStorageKey, statsResult.data.stats);
        buildAdminStatsFromApi(statsResult.data.stats);
      }

      if (usersResult.ok && Array.isArray(usersResult.data?.items)) {
        saveUsers(usersResult.data.items);
        renderUsersTable();
      }
    } catch (_) {
      // Keep the local admin snapshot when API sync fails.
    }
  }

  const originalRenderStatsFromLocal = renderStats;
  renderStats = function renderStatsWithApiPreference() {
    const apiStats = loadJson(adminApiStatsStorageKey, null);
    if (buildAdminStatsFromApi(apiStats)) {
      return;
    }

    originalRenderStatsFromLocal();
  };

  const originalRefreshAdminDataApiSnapshot = refreshAdminData;
  refreshAdminData = function refreshAdminDataWithApiSnapshot() {
    originalRefreshAdminDataApiSnapshot();
    syncAdminSnapshotFromApi();
  };

  if (isAdminLoggedIn()) {
    syncAdminSnapshotFromApi();
  }
})();
