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
      const entry = createGeneratedEntry({ grade, subject, term }, attempts, bank, history);
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function editUserRecord(userId) {
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

  updateUserRecord(userId, () => ({
    name: name.trim() || user.name,
    email: normalizedEmail || user.email,
    grade: grade.trim(),
    subject: subject.trim(),
    role: role.trim() || user.role,
    package: packageName.trim() || user.package,
    xp,
    status: status.trim() || "نشط",
    activity: "تم تعديل الحساب من لوحة الأدمن"
  }));

  window.alert("تم تحديث بيانات المستخدم.");
}

function toggleBanUser(userId) {
  const user = getUsers().find((entry) => entry.id === userId);
  if (!user) return;

  const willBan = user.status !== "محظور";
  const confirmed = window.confirm(
    willBan
      ? `هل تريد حظر المستخدم ${user.name}؟`
      : `هل تريد فك الحظر عن المستخدم ${user.name}؟`
  );

  if (!confirmed) return;

  updateUserRecord(userId, () => ({
    status: willBan ? "محظور" : "نشط",
    activity: willBan ? "تم حظر الحساب من لوحة الأدمن" : "تم فك الحظر عن الحساب من لوحة الأدمن"
  }));

  window.alert(willBan ? "تم حظر الحساب." : "تم فك الحظر عن الحساب.");
}

function editUserPoints(userId) {
  const user = getUsers().find((entry) => entry.id === userId);
  if (!user) return;

  const xpRaw = window.prompt(`تعديل نقاط ${user.name}`, String(user.xp ?? 0));
  if (xpRaw === null) return;

  const xp = Number(xpRaw);
  if (!Number.isFinite(xp)) {
    window.alert("قيمة النقاط يجب أن تكون رقمًا صحيحًا.");
    return;
  }

  updateUserRecord(userId, () => ({
    xp,
    activity: "تم تعديل النقاط من لوحة الأدمن"
  }));

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

adminLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = (adminEmailInput?.value || "").trim().toLowerCase();
  const password = adminPasswordInput?.value || "";

  if (email === adminCredentials.email && password === adminCredentials.password) {
    localStorage.setItem(adminSessionKey, "1");
    if (adminLoginState) adminLoginState.textContent = "تم تسجيل دخول الأدمن بنجاح.";
    updateAdminView();
    refreshAdminData();
    return;
  }

  if (adminLoginState) {
    adminLoginState.textContent = "بيانات دخول الأدمن غير صحيحة. تأكد من البريد وكلمة المرور.";
  }
});

adminLogoutButton?.addEventListener("click", () => {
  localStorage.removeItem(adminSessionKey);
  if (adminEmailInput) adminEmailInput.value = "";
  if (adminPasswordInput) adminPasswordInput.value = "";
  if (adminLoginState) adminLoginState.textContent = "تم تسجيل الخروج.";
  updateAdminView();
  window.location.href = "login.html";
});

updateAdminView();
bindPasswordToggles();

if (isAdminLoggedIn()) {
  refreshAdminData();
}
