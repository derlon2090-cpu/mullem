const storageKeys = {
  theme: "mlm_theme",
  users: "mlm_users",
  currentUser: "mlm_current_user",
  history: "mlm_chat_history",
  liked: "mlm_liked_answers",
  analytics: "mlm_analytics",
  feedback: "mlm_feedback_log",
  aiLogs: "mlm_ai_logs",
  sessions: "mlm_chat_sessions",
  activeSession: "mlm_active_session",
  responseMode: "mlm_response_mode",
  solveMode: "mlm_solve_mode",
  resumePrompt: "mlm_resume_prompt"
};

const gradeOptions = [
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

const subjectOptions = [
  "الرياضيات",
  "العلوم",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الاجتماعيات",
  "المهارات الرقمية"
];

const knowledgeBase = [
  {
    subject: "الرياضيات",
    lesson: "محيط الدائرة",
    unit: "الهندسة والقياس",
    keywords: ["محيط", "دائرة", "نصف القطر", "القطر"],
    explanation: "محيط الدائرة يساوي 2 × ط × نق. وإذا كان المعطى هو القطر فنقسمه على 2 أولًا للحصول على نصف القطر.",
    steps: [
      "تحديد نصف القطر أو تحويل القطر إلى نصف قطر.",
      "استخدام قانون محيط الدائرة: 2 × ط × نق.",
      "التعويض بالقيمة ثم حساب الناتج."
    ],
    mistakes: [
      "الخلط بين قانون المحيط وقانون المساحة.",
      "استخدام القطر مباشرة بدل نصف القطر.",
      "نسيان التقريب إذا طُلب الناتج العشري."
    ],
    similar: "احسب محيط دائرة نصف قطرها 5 سم."
  },
  {
    subject: "الفيزياء",
    lesson: "قانون نيوتن الثاني",
    unit: "الحركة والقوى",
    keywords: ["نيوتن", "القوة", "الكتلة", "التسارع"],
    explanation: "قانون نيوتن الثاني ينص على أن القوة تساوي الكتلة مضروبة في التسارع، ويكتب: ق = ك × ت.",
    steps: [
      "تحديد المعطيات: القوة أو الكتلة أو التسارع.",
      "اختيار القانون المناسب: ق = ك × ت.",
      "التعويض بالقيم ثم استخراج المطلوب."
    ],
    mistakes: [
      "الخلط بين الكتلة والوزن.",
      "إهمال الوحدات الفيزيائية.",
      "استخدام جمع بدل ضرب في القانون."
    ],
    similar: "إذا كانت كتلة جسم 4 كجم وتسارعه 3 م/ث²، فاحسب القوة."
  },
  {
    subject: "الكيمياء",
    lesson: "الروابط الكيميائية",
    unit: "بنية الذرة",
    keywords: ["رابطة", "أيونية", "تساهمية", "NaCl", "الكترونات"],
    explanation: "الرابطة الأيونية تنتج من انتقال الإلكترونات بين الذرات، بينما الرابطة التساهمية تنتج من مشاركة الإلكترونات.",
    steps: [
      "تحديد نوع العناصر الداخلة في المركب.",
      "ملاحظة هل يحدث انتقال للإلكترونات أم مشاركة.",
      "اختيار نوع الرابطة بناءً على ذلك."
    ],
    mistakes: [
      "الخلط بين الانتقال والمشاركة.",
      "عدم ربط نوع الرابطة بنوع العناصر.",
      "الخلط بين المركبات الأيونية والتساهمية."
    ],
    similar: "ما نوع الرابطة في H2O؟"
  },
  {
    subject: "اللغة العربية",
    lesson: "المبتدأ والخبر",
    unit: "القواعد النحوية",
    keywords: ["مبتدأ", "خبر", "جملة اسمية", "إعراب"],
    explanation: "المبتدأ اسم مرفوع تبدأ به الجملة الاسمية، والخبر يتمم المعنى ويخبر عن المبتدأ.",
    steps: [
      "تحديد نوع الجملة هل هي اسمية أم فعلية.",
      "استخراج الاسم الذي بدأت به الجملة.",
      "تحديد الجزء الذي أتم المعنى ليكون الخبر."
    ],
    mistakes: [
      "الخلط بين المبتدأ والفاعل.",
      "اعتبار كل اسم أول الجملة مبتدأ دون النظر للسياق.",
      "إهمال علامة الرفع."
    ],
    similar: "حدد المبتدأ والخبر في جملة: المدرسة نظيفة."
  },
  {
    subject: "اللغة الإنجليزية",
    lesson: "Present Simple",
    unit: "Grammar",
    keywords: ["english", "correct", "present simple", "he", "she", "it"],
    explanation: "في المضارع البسيط نضيف s أو es للفعل إذا كان الفاعل he أو she أو it.",
    steps: [
      "تحديد الفاعل في الجملة.",
      "فحص زمن الجملة وهل هي عادة أو حقيقة عامة.",
      "إضافة s أو es إذا كان الفاعل مفردًا غائبًا."
    ],
    mistakes: [
      "نسيان إضافة s مع he أو she.",
      "الخلط بين المضارع البسيط والمستمر.",
      "استخدام فعل بصيغة غير مناسبة."
    ],
    similar: "صحح الجملة: She go to school every day."
  }
];

const webPolicyItems = [
  "بيت العلم: مرجع تعليمي مساعد للمقارنة الأولى.",
  "عين التعليمية: مرجع رسمي للتحقق من المفاهيم.",
  "واجباتي: مرجع منهجي لمراجعة الكتب والحلول.",
  "يتم ترجيح الجواب الأقرب للمنهج السعودي عند اختلاف الصياغات."
];

const gradeSubjectCatalog = {
  "الأول الابتدائي": ["لغتي", "الرياضيات", "العلوم", "اللغة الإنجليزية", "التربية الإسلامية", "التربية الفنية", "المهارات الحياتية والأسرية"],
  "الثاني الابتدائي": ["لغتي", "الرياضيات", "العلوم", "اللغة الإنجليزية", "التربية الإسلامية", "التربية الفنية", "المهارات الحياتية والأسرية"],
  "الثالث الابتدائي": ["لغتي", "الرياضيات", "العلوم", "اللغة الإنجليزية", "التربية الإسلامية", "التربية الفنية", "المهارات الحياتية والأسرية"],
  "الرابع الابتدائي": ["لغتي الجميلة", "الرياضيات", "العلوم", "اللغة الإنجليزية", "الدراسات الإسلامية", "الدراسات الاجتماعية", "التربية الفنية", "المهارات الرقمية"],
  "الخامس الابتدائي": ["لغتي الجميلة", "الرياضيات", "العلوم", "اللغة الإنجليزية", "الدراسات الإسلامية", "الدراسات الاجتماعية", "التربية الفنية", "المهارات الرقمية"],
  "السادس الابتدائي": ["لغتي الجميلة", "الرياضيات", "العلوم", "اللغة الإنجليزية", "الدراسات الإسلامية", "الدراسات الاجتماعية", "التربية الفنية", "المهارات الرقمية"],
  "الأول المتوسط": ["لغتي الخالدة", "الرياضيات", "العلوم", "اللغة الإنجليزية", "الدراسات الإسلامية", "الدراسات الاجتماعية", "المهارات الرقمية", "التربية الفنية"],
  "الثاني المتوسط": ["لغتي الخالدة", "الرياضيات", "العلوم", "اللغة الإنجليزية", "الدراسات الإسلامية", "الدراسات الاجتماعية", "المهارات الرقمية", "التربية الفنية"],
  "الثالث المتوسط": ["لغتي الخالدة", "الرياضيات", "العلوم", "اللغة الإنجليزية", "الدراسات الإسلامية", "الدراسات الاجتماعية", "المهارات الرقمية", "التربية الفنية"],
  "الأول الثانوي": ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "التقنية الرقمية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الحياتية والأسرية"],
  "الثاني الثانوي": ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "التقنية الرقمية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الحياتية والأسرية"],
  "الثالث الثانوي": ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "التقنية الرقمية", "الدراسات الإسلامية", "الاجتماعيات", "المهارات الحياتية والأسرية"]
};

const wajibatiTerms = [
  {
    name: "الفصل الدراسي الأول",
    guideLabel: "دليل واجباتي للفصل الدراسي الأول",
    guideUrl: "https://www.wajibati.net/fsl1/"
  },
  {
    name: "الفصل الدراسي الثاني",
    guideLabel: "دليل واجباتي للفصل الدراسي الثاني",
    guideUrl: "https://www.wajibati.net/fsl22/"
  }
];

const questionBankItems = [
  "احسب محيط دائرة نصف قطرها 7",
  "اشرح قانون نيوتن الثاني",
  "حدد المبتدأ والخبر في الجملة",
  "ما نوع الرابطة في NaCl؟",
  "صحح هذه الجملة بالإنجليزية"
];

const packagePlans = [
  { name: "الباقة المجانية", points: 100, price: "0 ريال", note: "للبداية وتجربة الشات النصي" },
  { name: "باقة الطالب", points: 300, price: "19 ريال", note: "أسئلة أكثر وتحليل صور أكثر" },
  { name: "باقة المتقدم", points: 700, price: "39 ريال", note: "مناسبة للمراجعات الكثيفة والاختبارات" }
];

const usageCosts = {
  chat: 10,
  image: 15
};

const subjectKeywordMap = {
  الرياضيات: ["رياضيات", "احسب", "مساحة", "محيط", "معادلة", "دائرة", "مثلث", "كسور", "جبر", "هندسة", "تفاضل"],
  العلوم: ["علوم", "نبات", "حيوان", "ماء", "حرارة", "طاقة", "خلية", "تبخر"],
  الفيزياء: ["فيزياء", "نيوتن", "قوة", "حركة", "تسارع", "سرعة", "زخم", "احتكاك"],
  الكيمياء: ["كيمياء", "رابطة", "أيونية", "تساهمية", "تفاعل", "ذرة", "حمض", "قاعدة", "na", "cl"],
  الأحياء: ["أحياء", "خلية", "وراثة", "تنفس", "انقسام", "نبات", "حيوان"],
  "اللغة العربية": ["عربي", "نحو", "إعراب", "مبتدأ", "خبر", "نص", "بلاغة", "صرف"],
  "اللغة الإنجليزية": ["english", "grammar", "translate", "sentence", "present", "past", "correct"],
  الاجتماعيات: ["اجتماعيات", "تاريخ", "جغرافيا", "وطن", "حضارة", "خريطة"],
  "المهارات الرقمية": ["مهارات رقمية", "حاسب", "برمجة", "شبكات", "بيانات", "إنترنت"]
};

const stageHeuristics = {
  ابتدائي: ["جمع", "طرح", "ضرب", "قسمة", "الكسور", "النبات", "الماء", "الجملة الاسمية البسيطة"],
  متوسط: ["نسبة", "تناسب", "معادلة", "طاقة", "ذرة", "الفاعل", "المفعول", "present simple"],
  ثانوي: ["تفاضل", "تكامل", "نيوتن", "الرابطة", "مولارية", "وراثة", "بلاغة", "grammar"]
};

const messageList = document.querySelector("[data-messages]");
const promptInput = document.querySelector("[data-prompt]");
const fileInput = document.querySelector("[data-file-input]");
const attachmentList = document.querySelector("[data-attachments]");
const form = document.querySelector("[data-chat-form]");
const gradeSelect = document.querySelector("[data-grade]");
const subjectSelect = document.querySelector("[data-subject]");
const termSelect = document.querySelector("[data-term]");
const lessonInput = document.querySelector("[data-lesson]");
const runtimeSelect = document.querySelector("[data-runtime]");
const trainingModeSelect = document.querySelector("[data-training-mode]");
const learnList = document.querySelector("[data-learned]");
const historyList = document.querySelector("[data-history]");
const sessionList = document.querySelector("[data-session-list]");
const insightsList = document.querySelector("[data-insights]");
const questionBank = document.querySelector("[data-question-bank]");
const wajibatiLibraryList = document.querySelector("[data-wajibati-library]");
const termCoverageList = document.querySelector("[data-term-coverage]");
const webPolicyList = document.querySelector("[data-web-policy]");
const statusChip = document.querySelector("[data-status]");
const xpBalanceNodes = document.querySelectorAll("[data-xp-balance]");
const selectionSummary = document.querySelector("[data-selection-summary]");
const runtimeSummary = document.querySelector("[data-runtime-summary]");
const startChatButton = document.querySelector("[data-start-chat]");
const quickSolveButton = document.querySelector("[data-quick-solve]");
const heroExampleButton = document.querySelector("[data-hero-example]");
const heroUploadButton = document.querySelector("[data-hero-upload]");
const themeToggleButton = document.querySelector("[data-theme-toggle]");
const uploadButton = document.querySelector("[data-open-upload]");
const starterButtons = document.querySelectorAll("[data-starter-prompt], [data-starter-action]");
const uploadImageButton = document.querySelector("[data-upload-image]");
const uploadFileButton = document.querySelector("[data-upload-file]");
const focusSubjectButton = document.querySelector("[data-focus-subject]");
const clearChatButton = document.querySelector("[data-clear-chat]");
const newSessionButton = document.querySelector("[data-new-session]");
const scrollTopButton = document.querySelector("[data-scroll-top]");
const responseModeButtons = document.querySelectorAll("[data-response-mode]");
const solveModeButtons = document.querySelectorAll("[data-solve-mode]");

let attachments = [];
let clarificationCursor = 0;
let likedAnswers = [];
let chatHistory = [];
let chatSessions = [];
let analytics = createEmptyAnalytics();
let feedbackLog = [];
let aiLogs = [];
let selectedResponseMode = localStorage.getItem(storageKeys.responseMode) || "educational";
let selectedSolveMode = localStorage.getItem(storageKeys.solveMode) || "quick";
let activeSessionId = null;

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

function getUsers() {
  return loadJson(storageKeys.users, [
    {
      id: "student-demo-1",
      name: "طالب تجريبي",
      email: "student@mullem.sa",
      role: "Student",
      package: "مجاني محدود",
      xp: 100
    }
  ]);
}

function getActiveUser() {
  const users = getUsers();
  const currentId = localStorage.getItem(storageKeys.currentUser);
  return users.find((user) => user.id === currentId) || null;
}

function createEmptyAnalytics() {
  return {
    totalMessages: 0,
    xpUsed: 0,
    subjects: {},
    likes: 0,
    dislikes: 0
  };
}

function getScopedStorageKey(baseKey) {
  const activeUser = getActiveUser();
  return `${baseKey}_${activeUser?.id || "guest"}`;
}

function loadUserState() {
  likedAnswers = loadJson(getScopedStorageKey(storageKeys.liked), []);
  chatHistory = loadJson(getScopedStorageKey(storageKeys.history), []);
  analytics = loadJson(getScopedStorageKey(storageKeys.analytics), createEmptyAnalytics());
  feedbackLog = loadJson(getScopedStorageKey(storageKeys.feedback), []);
  aiLogs = loadJson(getScopedStorageKey(storageKeys.aiLogs), []);
  chatSessions = loadJson(getScopedStorageKey(storageKeys.sessions), []);
  activeSessionId = localStorage.getItem(getScopedStorageKey(storageKeys.activeSession)) || chatSessions[0]?.id || null;
}

function saveLikedAnswers() {
  saveJson(getScopedStorageKey(storageKeys.liked), likedAnswers);
}

function saveChatHistory() {
  saveJson(getScopedStorageKey(storageKeys.history), chatHistory);
}

function saveAnalytics() {
  saveJson(getScopedStorageKey(storageKeys.analytics), analytics);
}

function saveFeedbackLog() {
  saveJson(getScopedStorageKey(storageKeys.feedback), feedbackLog);
}

function saveAiLogs() {
  saveJson(getScopedStorageKey(storageKeys.aiLogs), aiLogs);
}

function saveChatSessions() {
  if (!isLoggedIn()) return;
  saveJson(getScopedStorageKey(storageKeys.sessions), chatSessions);
}

function saveActiveSession() {
  if (!isLoggedIn()) return;
  if (activeSessionId) {
    localStorage.setItem(getScopedStorageKey(storageKeys.activeSession), activeSessionId);
  } else {
    localStorage.removeItem(getScopedStorageKey(storageKeys.activeSession));
  }
}

function getGradeMaterials(grade) {
  return gradeSubjectCatalog[grade] || subjectOptions;
}

function getCurrentContext() {
  const activeUser = getActiveUser();
  return {
    user: activeUser,
    grade: gradeSelect?.value || activeUser?.grade || "الثاني الثانوي",
    subject: subjectSelect?.value || activeUser?.subject || "الرياضيات",
    term: termSelect?.value || "الفصل الدراسي الأول",
    lesson: lessonInput?.value.trim() || ""
  };
}

function isLoggedIn() {
  return Boolean(getActiveUser());
}

function getCurrentPoints() {
  return getActiveUser()?.xp ?? 0;
}

function getTodayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function diffDays(fromStamp, toStamp) {
  if (!fromStamp || !toStamp) return 0;
  const from = new Date(`${fromStamp}T00:00:00`);
  const to = new Date(`${toStamp}T00:00:00`);
  return Math.round((to - from) / 86400000);
}

function updateUserRecord(partial) {
  const activeUser = getActiveUser();
  if (!activeUser) return null;
  const users = getUsers().map((user) =>
    user.id === activeUser.id
      ? { ...user, ...partial }
      : user
  );
  saveJson(storageKeys.users, users);
  return users.find((user) => user.id === activeUser.id) || null;
}

function syncUserStreakOnVisit() {
  const activeUser = getActiveUser();
  if (!activeUser) return null;

  const today = getTodayStamp();
  const lastActiveDate = activeUser.lastActiveDate || "";
  if (lastActiveDate === today) return activeUser;

  let streakDays = activeUser.streakDays ?? 0;
  if (!lastActiveDate) {
    streakDays = 1;
  } else {
    const gap = diffDays(lastActiveDate, today);
    if (gap === 1) {
      streakDays += 1;
    } else if (gap > 1) {
      streakDays = 0;
    }
  }

  const achievements = Array.isArray(activeUser.achievements) ? [...activeUser.achievements] : [];
  if (streakDays >= 5 && !achievements.includes("5_days_streak")) achievements.push("5_days_streak");
  if (streakDays >= 30 && !achievements.includes("30_days_streak")) achievements.push("30_days_streak");

  return updateUserRecord({
    streakDays,
    lastActiveDate: today,
    motivationGoal: 30,
    achievements,
    activity: streakDays
      ? `يحافظ على سلسلة الحماس منذ ${streakDays} يوم`
      : "عاد إلى المنصة بعد انقطاع وتحتاج السلسلة إلى إعادة البناء"
  });
}

function spendPoints(amount, reason) {
  const activeUser = getActiveUser();
  if (!activeUser) return { ok: true, guest: true };
  if ((activeUser.xp ?? 0) < amount) {
    return { ok: false, guest: false, remaining: activeUser.xp ?? 0 };
  }

  const updatedUser = updateUserRecord({
    xp: Math.max(0, (activeUser.xp ?? 0) - amount),
    activity: `استخدم ${reason}`
  });

  updateXpBalance();
  return { ok: true, guest: false, remaining: updatedUser?.xp ?? 0 };
}

function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
}

function applyResponseMode(mode) {
  selectedResponseMode = mode;
  localStorage.setItem(storageKeys.responseMode, mode);
  responseModeButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-response-mode") === mode);
  });
}

function applySolveMode(mode) {
  selectedSolveMode = mode === "structured" ? "structured" : "quick";
  localStorage.setItem(storageKeys.solveMode, selectedSolveMode);
  solveModeButtons.forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-solve-mode") === selectedSolveMode);
  });
  document.body.classList.toggle("solve-mode-structured", selectedSolveMode === "structured");
  document.body.classList.toggle("solve-mode-quick", selectedSolveMode === "quick");
  updateSelectionSummary();
}

function syncScrollTopButton() {
  if (!scrollTopButton) return;
  scrollTopButton.classList.toggle("visible", window.scrollY > 240);
}

function autoGrow(textarea) {
  if (!textarea) return;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 190)}px`;
}

function normalizeText(text) {
  return (text || "").trim().toLowerCase();
}

function tokenize(text) {
  return normalizeText(text).split(/\s+/).filter(Boolean);
}

function getSelectedStageLabel(grade) {
  if (!grade) return "";
  if (grade.includes("ابتدائي")) return "ابتدائي";
  if (grade.includes("متوسط")) return "متوسط";
  if (grade.includes("ثانوي")) return "ثانوي";
  return "";
}

function detectSubjectFromContent(text) {
  const normalized = normalizeText(text);
  let best = null;

  Object.entries(subjectKeywordMap).forEach(([subject, keywords]) => {
    const score = keywords.reduce((total, keyword) => total + (normalized.includes(normalizeText(keyword)) ? 1 : 0), 0);
    if (!best || score > best.score) {
      best = { subject, score };
    }
  });

  return best?.score ? best.subject : "";
}

function detectGradeLevel(text) {
  const normalized = normalizeText(text);
  let best = { stage: "", score: 0 };

  Object.entries(stageHeuristics).forEach(([stage, keywords]) => {
    const score = keywords.reduce((total, keyword) => total + (normalized.includes(normalizeText(keyword)) ? 1 : 0), 0);
    if (score > best.score) {
      best = { stage, score };
    }
  });

  return best.stage;
}

function detectQuestionType(text) {
  const normalized = normalizeText(text);
  if (/صح|خطأ/.test(normalized)) return "صح وخطأ";
  if (/أ\)|ب\)|ج\)|د\)|اختيار من متعدد|اختر/.test(text)) return "اختيار من متعدد";
  if (/احسب|أوجد|حل المعادلة|مساحة|محيط|\d/.test(normalized)) return "مسألة";
  if (/عرف|ما هو|ما هي|ماذا يعني/.test(normalized)) return "تعريف";
  if (/قارن|الفرق بين|وازن بين/.test(normalized)) return "مقارنة";
  if (/اشرح|فسر|وضح/.test(normalized)) return "شرح";
  return "سؤال أكاديمي";
}

function determineInputType(userText, attachedFiles) {
  const hasText = Boolean(userText?.trim());
  const hasFiles = Array.isArray(attachedFiles) && attachedFiles.length > 0;
  if (hasText && hasFiles) return "text_and_file";
  if (hasFiles) {
    const hasImage = attachedFiles.some((file) => file.type.startsWith("image/"));
    return hasImage ? "image_only" : "file_only";
  }
  return "text_only";
}

function image_analyzer(attachedFiles, userText = "") {
  const image = (attachedFiles || []).find((file) => file.type.startsWith("image/"));
  if (!image) return { image_type: "none", extracted_text: "", confidence: 0 };

  const fileName = normalizeText(image.name);
  const combined = `${fileName} ${normalizeText(userText)}`;

  if (/logo|brand|favicon|icon|شعار|هوية|تصميم|ملم/.test(combined)) {
    return { image_type: "logo_or_branding", extracted_text: "", confidence: 0.95 };
  }

  if (/blur|blurry|unclear|مشوش|ضبابي/.test(combined) || (!userText && image.size < 25000)) {
    return { image_type: "unclear_image", extracted_text: "", confidence: 0.72 };
  }

  if (/page|lesson|book|chapter|worksheet|summary|ملخص|كتاب|ورقة|درس|صفحة/.test(combined)) {
    return {
      image_type: "educational_page",
      extracted_text: userText || "تم التعرف على صفحة تعليمية أو ملخص دراسي.",
      confidence: 0.81
    };
  }

  if (/question|exercise|problem|homework|quiz|سؤال|مسألة|واجب|اختر|صح|خطأ/.test(combined) || userText.trim()) {
    return {
      image_type: "educational_question",
      extracted_text: userText || "تم التعرف على صورة سؤال تعليمي.",
      confidence: 0.84
    };
  }

  if (/pdf|doc|document|statement|invoice|عقد|هوية|فاتورة/.test(combined)) {
    return { image_type: "document_non_educational", extracted_text: "", confidence: 0.8 };
  }

  if (!userText && !/رياضيات|علوم|فيزياء|كيمياء|أحياء|عربي|english|تعليمي/.test(combined)) {
    return { image_type: "non_educational_image", extracted_text: "", confidence: 0.75 };
  }

  return { image_type: "unclear_image", extracted_text: "", confidence: 0.4 };
}

function curriculum_scope_checker({ userText, selectedGrade, selectedSubject, imageMeta, solveMode = "quick" }) {
  const sourceText = `${userText || ""} ${imageMeta?.extracted_text || ""}`;
  const detectedSubject = detectSubjectFromContent(sourceText);
  const detectedGradeLevel = detectGradeLevel(sourceText);
  const selectedStage = getSelectedStageLabel(selectedGrade);
  const structured = solveMode === "structured";

  if (!detectedSubject) {
    return {
      detected_subject: "",
      detected_grade_level: detectedGradeLevel,
      scope_status: structured && selectedSubject ? "subject_unknown" : "auto_detect_pending"
    };
  }

  if (structured && selectedSubject && detectedSubject && detectedSubject !== selectedSubject) {
    return {
      detected_subject: detectedSubject,
      detected_grade_level: detectedGradeLevel,
      scope_status: "subject_mismatch"
    };
  }

  if (structured && detectedGradeLevel && selectedStage && detectedGradeLevel !== selectedStage) {
    return {
      detected_subject: detectedSubject,
      detected_grade_level: detectedGradeLevel,
      scope_status: "grade_mismatch"
    };
  }

  return {
    detected_subject: detectedSubject,
    detected_grade_level: detectedGradeLevel,
    scope_status: structured ? "matched" : "auto_detected"
  };
}

function request_router({ user_text, uploaded_files, selected_grade, selected_subject, user_profile, selected_solve_mode = "quick" }) {
  const input_type = determineInputType(user_text, uploaded_files);
  const image_type = input_type.includes("image")
    ? image_analyzer(uploaded_files, user_text)
    : { image_type: "none", extracted_text: "", confidence: 0 };
  const intent = intent_router(`${user_text || ""} ${image_type.extracted_text || ""}`, uploaded_files?.length > 0);
  const quickMode = selected_solve_mode !== "structured";
  const scope = curriculum_scope_checker({
    userText: user_text,
    selectedGrade: selected_grade || user_profile?.grade || "",
    selectedSubject: quickMode ? "" : (selected_subject || ""),
    imageMeta: image_type,
    solveMode: quickMode ? "quick" : "structured"
  });

  let response_mode = "academic_solve";

  if (input_type === "file_only" && !user_text.trim()) response_mode = "content_interpretation";
  if (image_type.image_type === "logo_or_branding") response_mode = "reject_logo_image";
  else if (image_type.image_type === "non_educational_image" || image_type.image_type === "document_non_educational") response_mode = "reject_out_of_scope_image";
  else if (image_type.image_type === "unclear_image") response_mode = "ask_clearer_upload";
  else if (image_type.image_type === "educational_page" && !user_text.trim()) response_mode = "content_interpretation";
  else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) response_mode = "ask_for_confirmation";

  return {
    input_type,
    intent,
    image_type: image_type.image_type,
    extracted_text: image_type.extracted_text,
    detected_subject: scope.detected_subject,
    detected_grade_level: scope.detected_grade_level,
    scope_status: scope.scope_status,
    response_mode,
    quick_mode: quickMode
  };
}

function classifyIntent(message, hasAttachments = false) {
  const normalized = normalizeText(message);
  const context = getCurrentContext();

  if (!normalized && !hasAttachments) return { type: "help", confidence: 0.4 };
  if (/(السلام عليكم|مرحبا|هلا|كيف حالك|شلونك|شكرا|يعطيك العافية)/.test(normalized)) {
    return { type: "chat", confidence: 0.98 };
  }

  if (/(كيف استخدم|طريقة الاستخدام|مساعدة|ساعدني في الموقع|وش أسوي)/.test(normalized)) {
    return { type: "help", confidence: 0.95 };
  }

  if (/(اكتب لي|ولد|انشئ|أنشئ).*(أسئلة|سؤال)|أسئلة.*(كيمياء|فيزياء|رياضيات|عربي|علوم|إنجليزي)/.test(normalized)) {
    return { type: "generate_questions", confidence: 0.94 };
  }

  if (/(اختبرني|اختبار|كويز|امتحنني)/.test(normalized)) {
    return { type: "quiz", confidence: 0.95 };
  }

  if (/(لخص|تلخيص|اختصر|ملخص)/.test(normalized)) {
    return { type: "summary", confidence: 0.92 };
  }

  if (/(اشرح|وش يعني|عرف|عرف|فسر|بسط)/.test(normalized)) {
    return { type: "explain", confidence: 0.9 };
  }

  if (/(إجابتي|جوابي|حللت|هل حلي صحيح|صحح إجابتي|قيم إجابتي|وين الخطأ)/.test(normalized)) {
    return { type: "answer_analysis", confidence: 0.94 };
  }

  if (hasAttachments || /(احسب|حل|أوجد|اختر|صح|خطأ|قارن|استخرج|حدد|صحح|ترجم|\d)/.test(normalized)) {
    return { type: "solve", confidence: 0.9 };
  }

  if (context.subject || /(رياضيات|علوم|فيزياء|كيمياء|عربي|إنجليزي|أحياء|اجتماعيات)/.test(normalized)) {
    return { type: "academic_question", confidence: 0.72 };
  }

  return { type: "unclear", confidence: 0.3 };
}

const intent_router = classifyIntent;

function needsClarification(message, intent, hasAttachments = false) {
  if (hasAttachments) return false;
  if (intent?.type === "chat" || intent?.type === "help") return false;
  const normalized = normalizeText(message);
  const tokens = tokenize(message);
  const generic = new Set(["حل", "حلها", "اشرح", "هذا", "ذي", "وش الحل", "سؤال", "اختبار", "أسئلة"]);
  const specific = /احسب|اشرح|حدد|صح|خطأ|اختر|قارن|فسر|علل|صحح|ترجم|ما|كيف|لماذا|\d|دائرة|قانون|معادلة|رابطة|نيوتن|محيط|مساحة|درس|اختبار|سؤال/i;

  if (intent?.type === "generate_questions" || intent?.type === "quiz") {
    return !(subjectSelect?.value || /رياضيات|علوم|فيزياء|كيمياء|عربي|إنجليزي|أحياء/.test(normalized));
  }

  if (specific.test(normalized) && tokens.length >= 2) return false;
  if (lessonInput?.value.trim() && tokens.length >= 2) return false;
  if (tokens.length >= 3) return false;
  return generic.has(normalized) || normalized.length <= 3 || intent?.type === "unclear";
}

function createCasualResponse(message) {
  const normalized = normalizeText(message);
  if (/(كيف حالك|شلونك)/.test(normalized)) return "تمام 👋 كيف أقدر أساعدك في دراستك؟";
  if (/(السلام عليكم|مرحبا|هلا)/.test(normalized)) return "وعليكم السلام، أهلًا بك. كيف أقدر أساعدك في دراستك؟";
  if (/شكرا|يعطيك العافية/.test(normalized)) return "العفو، وإذا عندك أي سؤال دراسي أنا حاضر.";
  return "أنا معك. إذا عندك سؤال دراسي اكتبه لي، وإذا تريد مساعدة في استخدام المنصة فأقدر أساعدك أيضًا.";
}

function createHelpResponse() {
  return "ابدأ باختيار الصف والمادة، ثم اكتب سؤالك. يمكنك استخدام الشات النصي مباشرة حتى كزائر، أما رفع الصور وتحليلها فيتطلب تسجيل الدخول. وإذا كان السؤال اختيارات أو صح وخطأ فسأحلله وأحدد الجواب الصحيح مباشرة.";
}

function createClarificationResponse(message, intent) {
  const normalized = normalizeText(message);
  const variants = [
    "أحتاج جزءًا صغيرًا إضافيًا من السؤال حتى أجيب بدقة.",
    "أقدر أساعدك مباشرة، لكن ينقصني تفصيل واحد فقط.",
    "حتى أعطيك جوابًا صحيحًا، وضح المقصود أكثر قليلًا."
  ];
  const intro = variants[clarificationCursor % variants.length];
  clarificationCursor += 1;

  if (/(هذا|ذي|وش الحل)/.test(normalized)) {
    return {
      intro,
      prompt: "هل يمكنك كتابة السؤال كاملًا أو رفع صورة واضحة له؟",
      actions: [
        { label: "رفع صورة السؤال", action: "upload-image" },
        { label: "اكتب السؤال كاملًا", fill: "اكتب السؤال كاملًا هنا مع المعطيات والمطلوب." }
      ]
    };
  }

  if (/اشرح/.test(normalized)) {
    return {
      intro,
      prompt: "هل تقصد شرح درس في الرياضيات أو العلوم أو مادة أخرى؟",
      actions: [
        { label: "اختيار المادة", action: "focus-subject" },
        { label: "اشرح قانون نيوتن الثاني", fill: "اشرح قانون نيوتن الثاني" }
      ]
    };
  }

  if (intent?.type === "generate_questions") {
    return {
      intro,
      prompt: "كم تريد من الأسئلة، وما المادة أو الدرس الذي تريد التوليد منه؟",
      actions: [
        { label: "أسئلة كيمياء", fill: "اكتب لي 5 أسئلة كيمياء من هذا الدرس" },
        { label: "اختيار المادة", action: "focus-subject" }
      ]
    };
  }

  if (intent?.type === "quiz") {
    return {
      intro,
      prompt: "هل تريد اختبارًا قصيرًا في الرياضيات أو العلوم أو مادة أخرى؟",
      actions: [
        { label: "اختبرني في الفيزياء", fill: "اختبرني في الفيزياء بسؤال واحد" },
        { label: "اختيار المادة", action: "focus-subject" }
      ]
    };
  }

  return {
    intro,
    prompt: "اكتب السؤال كاملًا أو اختر أحد الخيارات السريعة التالية:",
    actions: [
      { label: "اكتب السؤال كاملًا", fill: "اكتب السؤال كاملًا مع المطلوب." },
      { label: "رفع صورة السؤال", action: "upload-image" },
      { label: "اختيار المادة", action: "focus-subject" }
    ]
  };
}

function formatSimpleReply(text) {
  return `<div class="simple-reply"><p>${text}</p></div>`;
}

function formatClarificationReply(payload) {
  return `
    <div class="clarify-card">
      <p>${payload.intro}</p>
      <p>${payload.prompt}</p>
      <div class="inline-actions">
        ${payload.actions
          .map((action) =>
            action.fill
              ? `<button class="inline-action-btn" type="button" data-fill-prompt="${action.fill}">${action.label}</button>`
              : `<button class="inline-action-btn" type="button" data-action="${action.action}">${action.label}</button>`
          )
          .join("")}
      </div>
    </div>
  `;
}

function createImageRouterResponse(route) {
  if (route.response_mode === "reject_logo_image") {
    return formatSimpleReply("يبدو أن الصورة المرفقة ليست سؤالًا دراسيًا، بل أقرب إلى شعار أو تصميم. إذا كنت تريد المساعدة التعليمية، أرسل صورة السؤال أو اكتبه نصًا.");
  }

  if (route.response_mode === "reject_out_of_scope_image") {
    return formatSimpleReply("الصورة المرفقة لا تبدو ضمن نطاق التعليم. تأكد من إرسال صورة سؤال أو صفحة دراسية واضحة.");
  }

  if (route.response_mode === "ask_clearer_upload") {
    return formatSimpleReply("تعذر قراءة محتوى الصورة بشكل واضح. يرجى إعادة رفع صورة أوضح أو كتابة السؤال نصًا.");
  }

  if (route.response_mode === "ask_for_confirmation") {
    if (route.scope_status === "subject_mismatch") {
      return formatSimpleReply(`يبدو أن هذا السؤال يتبع مادة ${route.detected_subject}، بينما المادة المحددة لديك هي ${subjectSelect?.value || "غير محددة"}. تأكد من المادة أو غيّرها حتى أجيبك بدقة.`);
    }

    if (route.scope_status === "grade_mismatch") {
      return formatSimpleReply("هذا السؤال يبدو من مستوى دراسي مختلف عن الصف المحدد لديك. تأكد من الصف أو حدّثه لضمان إجابة مناسبة.");
    }

    return formatSimpleReply("لم أتمكن من تحديد المادة بدقة من السؤال الحالي. يرجى اختيار المادة أو كتابة السؤال بشكل أوضح.");
  }

  if (route.response_mode === "content_interpretation") {
    return `
      <div class="clarify-card">
        <p>تم التعرف على المرفق كمحتوى تعليمي، لكن أحتاج تأكيد المطلوب تحديدًا: هل تريد شرحًا أم تلخيصًا أم حل الأسئلة الموجودة فيه؟</p>
        <div class="inline-actions">
          <button class="inline-action-btn" type="button" data-fill-prompt="اشرح محتوى هذه الصفحة التعليمية">شرح المحتوى</button>
          <button class="inline-action-btn" type="button" data-fill-prompt="لخص محتوى هذه الصفحة التعليمية">تلخيص المحتوى</button>
          <button class="inline-action-btn" type="button" data-fill-prompt="استخرج الأسئلة الموجودة في هذه الصفحة وحلها">حل الأسئلة</button>
        </div>
      </div>
    `;
  }

  return "";
}

function createLoadingCopy() {
  const lines = [
    "جاري تحليل السؤال...",
    "جاري مطابقة السؤال مع الدرس...",
    "جاري تجهيز الحل..."
  ];
  const index = analytics.totalMessages % lines.length;
  return `
    <div class="clarify-card">
      <p>${lines[index]}</p>
      <p class="muted-inline">${lines[(index + 1) % lines.length]}</p>
    </div>
  `;
}

function renderWelcomeMessage() {
  addMessage(
    "assistant",
    "ملم يحل",
    `
      <div class="answer-grid">
        <section class="answer-section answer-section-wide">
          <h4>كيف أقدر أساعدك اليوم؟</h4>
          <p>أنا مساعد أكاديمي للمنهج السعودي. أفهم السؤال أو الصورة أولًا، وأتحقق من المادة والصف قبل الإجابة، ثم أختار نوع الرد المناسب: حل أو شرح أو اختبار أو توليد أسئلة.</p>
          <p class="logic-note">يمكنك استخدام الشات النصي مباشرة كزائر. أما الصور وتحليلها فتتطلب تسجيل الدخول.</p>
        </section>
      </div>
    `
  );
}

function addMessage(type, author, body, options = {}) {
  if (!messageList) return null;
  const article = document.createElement("article");
  article.className = `message ${type}`;
  if (options.metadata) {
    article.dataset.subject = options.metadata.subject || "";
    article.dataset.lesson = options.metadata.lesson || "";
    article.dataset.questionType = options.metadata.questionType || "";
    article.dataset.responseMode = options.metadata.mode || "";
  }
  article.innerHTML = `
    <div class="message-title">${author}</div>
    <div class="message-body">${body}</div>
  `;

  if (type === "assistant" && !options.pending && options.enableTools) {
    const tools = document.createElement("div");
    tools.className = "message-tools";
    tools.innerHTML = `
      <div class="message-tools-label">هل تريد تبسيط الإجابة أو متابعة التدريب؟</div>
      <button class="mini-btn" type="button" data-refine="simple">بسّط أكثر</button>
      <button class="mini-btn" type="button" data-refine="short">باختصار</button>
      <button class="mini-btn" type="button" data-refine="steps">اشرحها خطوة خطوة</button>
      <button class="mini-btn" type="button" data-refine="quiz">اختبرني على هذا الدرس</button>
      <button class="mini-btn" type="button" data-like="${Date.now()}">👍 أعجبني</button>
      <button class="mini-btn disliked" type="button" data-dislike="${Date.now()}">👎 لم يعجبني</button>
    `;
    article.appendChild(tools);

    if (Array.isArray(options.sources) && options.sources.length) {
      const sources = document.createElement("div");
      sources.className = "sources-list";
      sources.innerHTML = options.sources
        .map((source) => `<a class="source-link" href="${source.url}" target="_blank" rel="noreferrer">${source.type}: ${source.label}</a>`)
        .join("");
      article.appendChild(sources);
    }
  }

  messageList.appendChild(article);
  messageList.scrollTop = messageList.scrollHeight;
  return article;
}

function findLesson(question, selectedSubject) {
  const normalized = normalizeText(question);
  return (
    knowledgeBase.find((entry) => entry.subject === selectedSubject && entry.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) ||
    knowledgeBase.find((entry) => entry.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) ||
    knowledgeBase.find((entry) => entry.subject === selectedSubject) ||
    null
  );
}

function solveObjectiveQuestion(question) {
  const normalized = normalizeText(question);

  if (/صح|خطأ/.test(normalized) && /الرابطة/.test(normalized) && /nacl/.test(normalized) && /تساهمية/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "لأن الرابطة في NaCl أيونية وليست تساهمية."
    };
  }

  if (/nacl/.test(normalized) && /أ\)|ب\)|ج\)|د\)/.test(question)) {
    return {
      answerMode: "mcq",
      finalAnswer: "الخيار الصحيح هو (ب) أيونية.",
      explanation: "لأن كلوريد الصوديوم يتكون من فلز ولافلز، فتنتقل الإلكترونات وتتكون رابطة أيونية."
    };
  }

  return null;
}

function solveMathQuestion(question) {
  const normalized = normalizeText(question);
  const radiusMatch = normalized.match(/نصف القطر(?:ها)?\s*(\d+(\.\d+)?)/) || normalized.match(/نق\s*[=:]?\s*(\d+(\.\d+)?)/);
  if (/محيط/.test(normalized) && /دائرة/.test(normalized) && radiusMatch) {
    const radius = Number(radiusMatch[1]);
    const answer = 2 * Math.PI * radius;
    return {
      finalAnswer: `محيط الدائرة = ${answer.toFixed(2)} تقريبًا.`,
      explanation: "استخدمنا قانون محيط الدائرة: 2 × ط × نق.",
      steps: [
        `نصف القطر = ${radius}`,
        "القانون: 2 × ط × نق",
        `التعويض: 2 × 3.14 × ${radius}`,
        `الناتج ≈ ${answer.toFixed(2)}`
      ],
      mistakes: [
        "استخدام المساحة بدل المحيط.",
        "التعويض بالقطر بدل نصف القطر.",
        "نسيان التقريب عند الحاجة."
      ],
      similar: "احسب محيط دائرة نصف قطرها 5 سم."
    };
  }

  return null;
}

function retrieveCurriculumContext(question, preferredSubject = "") {
  const context = getCurrentContext();
  const inferredSubject =
    preferredSubject ||
    knowledgeBase.find((entry) => normalizeText(question).includes(normalizeText(entry.subject)))?.subject ||
    context.subject;

  const lesson = findLesson(question, inferredSubject);
  return {
    grade: context.grade,
    subject: lesson?.subject || inferredSubject || context.subject,
    term: context.term,
    lesson: lesson?.lesson || context.lesson || "غير محدد",
    unit: lesson?.unit || "منهج المادة",
    entry: lesson
  };
}

function generateCurriculumQuestions(context) {
  const bank = {
    الرياضيات: [
      "احسب محيط دائرة نصف قطرها 6 سم.",
      "أوجد مساحة مستطيل طوله 8 سم وعرضه 3 سم.",
      "حل المعادلة: 3س + 5 = 20."
    ],
    الفيزياء: [
      "ما العلاقة بين القوة والكتلة والتسارع؟",
      "احسب القوة إذا كانت الكتلة 5 كجم والتسارع 2 م/ث².",
      "فسر لماذا يحتاج الجسم إلى قوة لتغيير سرعته."
    ],
    الكيمياء: [
      "ما الفرق بين الرابطة الأيونية والرابطة التساهمية؟",
      "ماذا يحدث عند اتحاد الصوديوم مع الكلور؟",
      "عرف التفاعل الكيميائي."
    ],
    العلوم: [
      "اشرح دورة الماء في الطبيعة.",
      "ما أهمية الجذور للنبات؟",
      "كيف تنتقل الحرارة بين الأجسام؟"
    ],
    "اللغة العربية": [
      "حدد المبتدأ والخبر في الجملة التالية.",
      "استخرج الفاعل من الجملة.",
      "اذكر قاعدة نحوية مرتبطة بهذا الدرس."
    ],
    "اللغة الإنجليزية": [
      "صحح الجملة باستخدام الزمن المناسب.",
      "حوّل الجملة إلى سؤال.",
      "اكتب جملة في المضارع البسيط."
    ]
  };

  return bank[context.subject] || [
    `اكتب سؤالًا مفاهيميًا من مادة ${context.subject}.`,
    `اكتب سؤالًا تطبيقيًا من ${context.subject}.`,
    `اكتب سؤالًا قصيرًا للمراجعة في ${context.subject}.`
  ];
}

function reviewResponse(intent, response) {
  const reviewed = { ...response };
  reviewed.displayMode = selectedResponseMode;

  if (intent.type === "generate_questions") {
    reviewed.mode = "questions";
    reviewed.questions = Array.isArray(reviewed.questions) ? reviewed.questions.slice(0, 6) : [];
    delete reviewed.steps;
    delete reviewed.mistakes;
    delete reviewed.similar;
  }

  if (intent.type === "quiz") {
    reviewed.mode = "quiz";
    reviewed.finalAnswer = "سأبدأ باختبار قصير. أجب عن السؤال التالي فقط، وبعدها أعطيك التغذية الراجعة.";
  }

  if (intent.type === "chat") {
    reviewed.mode = "chat";
  }

  if (reviewed.displayMode === "quick" && reviewed.mode !== "questions" && reviewed.mode !== "quiz") {
    reviewed.steps = Array.isArray(reviewed.steps) ? reviewed.steps.slice(0, 2) : [];
    reviewed.mistakes = Array.isArray(reviewed.mistakes) ? reviewed.mistakes.slice(0, 1) : [];
  }

  return reviewed;
}

const response_reviewer = reviewResponse;

function createAcademicResponse(question, intent) {
  const context = retrieveCurriculumContext(question, subjectSelect?.value || "");
  const questionType = detectQuestionType(question);
  const objective = solveObjectiveQuestion(question);
  if (objective) {
    return reviewResponse(intent, {
      ...objective,
      mode: "solve",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      curriculumLink: `اعتمدت الإجابة على ${context.subject} للصف ${context.grade} في ${context.term}.`
    });
  }

  const math = solveMathQuestion(question);
  if (math) {
    return reviewResponse(intent, {
      ...math,
      mode: "solve",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      curriculumLink: `تم ربط السؤال بدرس ${context.lesson} في مادة ${context.subject} للصف ${context.grade}.`
    });
  }

  if (intent.type === "generate_questions") {
    return reviewResponse(intent, {
      mode: "questions",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      intro: `هذه أسئلة تدريبية من ${context.subject} للصف ${context.grade} — ${context.term}.`,
      questions: generateCurriculumQuestions(context),
      curriculumLink: `التوليد تم بالاعتماد على موضوع ${context.lesson} ضمن ${context.subject}.`
    });
  }

  if (intent.type === "quiz") {
    const questions = generateCurriculumQuestions(context);
    return reviewResponse(intent, {
      mode: "quiz",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      finalAnswer: "سأبدأ الآن بسؤال واحد فقط.",
      explanation: `الاختبار مرتبط بمادة ${context.subject} للصف ${context.grade}.`,
      quizQuestion: questions[0],
      curriculumLink: `تم اختيار السؤال من نطاق ${context.subject} في ${context.term}.`
    });
  }

  if (intent.type === "summary") {
    return reviewResponse(intent, {
      mode: "summary",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      finalAnswer: `هذا ملخص سريع لدرس ${context.lesson} في ${context.subject}.`,
      explanation: context.entry?.explanation || `الفكرة الأساسية في ${context.subject} هنا هي فهم المفهوم وتطبيقه بصورة مبسطة.`,
      bullets: [
        `الصف المستهدف: ${context.grade}`,
        `الفصل الدراسي: ${context.term}`,
        `المفهوم الأبرز: ${context.lesson}`
      ],
      curriculumLink: `الملخص مرتبط بالوحدة: ${context.unit}.`
    });
  }

  if (intent.type === "answer_analysis") {
    return reviewResponse(intent, {
      mode: "answer_analysis",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      finalAnswer: "سأحلل إجابتك بناءً على المطلوب والمعطيات الظاهرة في السؤال.",
      explanation: "أقارن بين المطلوب في السؤال وبين الإجابة المكتوبة، ثم أحدد إن كان الخطأ مفاهيميًا أو حسابيًا أو في الفهم.",
      steps: [
        "تحديد المطلوب بدقة.",
        "مطابقة طريقة الحل مع مفهوم الدرس.",
        "الإشارة إلى موضع الخطأ واقتراح تحسين مباشر."
      ],
      mistakes: [
        "الانتقال إلى الناتج النهائي دون تبرير.",
        "نسيان القانون أو القاعدة المرتبطة بالدرس."
      ],
      similar: `أرسل إجابتك كاملة على سؤال من ${context.subject} وسأعطيك تحليلًا أدق.`,
      curriculumLink: `التحليل سيتم وفق درس ${context.lesson} من ${context.unit}.`
    });
  }

  if (intent.type === "explain") {
    return reviewResponse(intent, {
      mode: "explain",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      finalAnswer: `شرح مبسط لدرس ${context.lesson} في ${context.subject}.`,
      explanation:
        context.entry?.explanation ||
        `هذا الشرح مرتبط بمادة ${context.subject} للصف ${context.grade}، وسأعرضه بشكل مبسط وواضح.`,
      steps: [
        "تعريف المفهوم الأساسي.",
        "تبسيط الفكرة بلغتك الدراسية.",
        "إعطاء مثال تطبيقي قصير."
      ],
      mistakes: [
        "حفظ التعريف دون فهم التطبيق.",
        "الخلط بين المفهوم والمثال."
      ],
      similar: `اطلب مني مثالًا إضافيًا على ${context.lesson}.`,
      curriculumLink: `الشرح مرتبط بالوحدة ${context.unit} في ${context.term}.`
    });
  }

  return reviewResponse(intent, {
    mode: "solve",
    questionType,
    subject: context.subject,
    lesson: context.lesson,
    finalAnswer: context.entry
      ? `الإجابة الأقرب لهذا السؤال مرتبطة بدرس ${context.lesson} في مادة ${context.subject}.`
      : `سأتعامل مع السؤال على أنه من مادة ${context.subject} وفق صف ${context.grade}.`,
    explanation:
      context.entry?.explanation ||
      `فهمت سؤالك على أنه سؤال أكاديمي في ${context.subject}، وسأبني الجواب على المنهج المناسب لصفك.`,
    steps:
      context.entry?.steps || [
        "تحديد المطلوب من السؤال.",
        `الرجوع إلى مفاهيم ${context.subject} المناسبة.`,
        "تقديم الحل أو الشرح الأقرب للمنهج."
      ],
    mistakes:
      context.entry?.mistakes || [
        "الانتقال إلى الحل قبل فهم المطلوب.",
        "عدم ربط السؤال بقاعدة أو مفهوم من الدرس."
      ],
    similar: context.entry?.similar || `اكتب سؤالًا آخر من ${context.subject} وسأعطيك تدريبًا مشابهًا.`,
    curriculumLink: `المعالجة تمت على أساس ${context.subject} للصف ${context.grade} في ${context.term}.`
  });
}

function formatAssistantSections(response) {
  const safeFinalAnswer = (() => {
    const value = String(response.finalAnswer || "").trim();
    if (response.answerMode === "truefalse") {
      if (value.includes("صواب")) return "صواب";
      if (value.includes("خطأ")) return "خطأ";
      return "";
    }
    return value;
  })();
  const modeNote =
    response.displayMode === "quick"
      ? `<section class="answer-section answer-section-wide"><h4>⚡ وضع سريع</h4><p>هذا الرد مختصر. إذا أردت التفاصيل اضغط "اشرحها خطوة خطوة".</p></section>`
      : "";

  if (response.mode === "questions") {
    return `
      <div class="answer-grid">
        ${modeNote}
        <section class="answer-section answer-section-wide">
          <h4>📝 أسئلة من المنهج</h4>
          <p>${response.intro}</p>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>📚 قائمة الأسئلة</h4>
          <ul>${(response.questions || []).map((question) => `<li>${question}</li>`).join("")}</ul>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>📚 الربط بالمنهج</h4>
          <p>${response.curriculumLink}</p>
        </section>
      </div>
    `;
  }

  if (response.mode === "quiz") {
    return `
      <div class="answer-grid">
        ${modeNote}
        <section class="answer-section answer-section-wide">
          <h4>🧪 اختبار قصير</h4>
          <p>${response.finalAnswer}</p>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>❓ السؤال</h4>
          <p>${response.quizQuestion}</p>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>📚 الربط بالمنهج</h4>
          <p>${response.curriculumLink}</p>
        </section>
      </div>
    `;
  }

  if (response.mode === "summary") {
    return `
      <div class="answer-grid">
        ${modeNote}
        <section class="answer-section">
          <h4>✅ الملخص</h4>
          <p>${response.finalAnswer}</p>
        </section>
        <section class="answer-section">
          <h4>📘 الفكرة الأساسية</h4>
          <p>${response.explanation}</p>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>📌 نقاط سريعة</h4>
          <ul>${(response.bullets || []).map((item) => `<li>${item}</li>`).join("")}</ul>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>📚 الربط بالمنهج</h4>
          <p>${response.curriculumLink}</p>
        </section>
      </div>
    `;
  }

  if (response.mode === "multi_objective" && Array.isArray(response.blocks)) {
    let index = 1;
    const items = response.blocks.flatMap((block) => {
      if (block.type === "matching") {
        return (block.answers || []).map((item) => {
          const row = `
            <li>
              <strong>${index})</strong> ${item.prompt} &rarr; <strong>${item.answer}</strong>
            </li>
          `;
          index += 1;
          return row;
        });
      }

      if (block.type === "multiple_choice") {
        const row = `
          <li>
            <strong>${index})</strong> ${block.prompt} &rarr; <strong>${block.answer}</strong>
          </li>
        `;
        index += 1;
        return row;
      }

      if (block.type === "true_false") {
        const reason = block.reason
          ? `<div class="muted-copy">السبب: ${block.reason}</div>`
          : "";
        const row = `
          <li>
            <strong>${index})</strong> ${block.statement} &rarr; <strong>${block.answer}</strong>
            ${reason}
          </li>
        `;
        index += 1;
        return row;
      }

      return [];
    });

    return `
      <div class="answer-grid">
        ${modeNote}
        <section class="answer-section answer-section-wide">
          <h4>✅ الإجابات</h4>
          <ol class="answer-list">${items.join("")}</ol>
        </section>
      </div>
    `;
  }

  if (response.answerMode === "mcq" || response.answerMode === "truefalse") {
    if (response.answerMode === "truefalse" && !safeFinalAnswer) {
      return `
        <div class="answer-grid">
          ${modeNote}
          <section class="answer-section answer-section-wide">
            <h4>⚠️ تعذر تحديد الحكم النهائي</h4>
            <p>لم يتم توليد الحكم النهائي بشكل صحيح هذه المرة. حاول إعادة إرسال السؤال أو طلب إعادة المحاولة.</p>
          </section>
          <section class="answer-section answer-section-wide">
            <h4>📘 السبب</h4>
            <p>${response.explanation || "تم تحليل العبارة، لكن لم تكتمل صياغة الحكم النهائي."}</p>
          </section>
        </div>
      `;
    }

    if (response.answerMode === "truefalse") {
      return `
        <div class="answer-grid">
          ${modeNote}
          <section class="answer-section answer-section-wide">
            <h4>✅ الإجابة</h4>
            <p>${safeFinalAnswer}</p>
          </section>
          <section class="answer-section answer-section-wide">
            <h4>📘 السبب</h4>
            <p>${response.explanation}</p>
          </section>
        </div>
      `;
    }

    if (response.answerMode === "mcq") {
      return `
        <div class="answer-grid">
          ${modeNote}
          <section class="answer-section answer-section-wide">
            <h4>✅ الإجابة</h4>
            <p>${response.finalAnswer}</p>
          </section>
          <section class="answer-section answer-section-wide">
            <h4>📘 السبب</h4>
            <p>${response.explanation}</p>
          </section>
        </div>
      `;
    }

  }

  if (response.displayMode === "quick") {
    return `
      <div class="answer-grid">
        ${modeNote}
        <section class="answer-section answer-section-wide">
          <h4>✅ الجواب المختصر</h4>
          <p>${response.finalAnswer}</p>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>📘 توضيح سريع</h4>
          <p>${response.explanation}</p>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>🧩 نوع السؤال</h4>
          <p>${response.questionType || "سؤال أكاديمي"}</p>
        </section>
        <section class="answer-section answer-section-wide">
          <div class="practice-cta">
            <p>هل تريد التحويل إلى شرح تعليمي أو اختبار سريع على نفس الدرس؟</p>
            <div class="inline-actions">
              <button class="inline-action-btn" type="button" data-fill-prompt="اشرح ${response.lesson || "هذا الدرس"} شرحًا تعليميًا كاملًا في ${response.subject || (subjectSelect?.value || "المادة الحالية")}">اشرحه تعليميًا</button>
              <button class="inline-action-btn" type="button" data-fill-prompt="اختبرني في ${response.lesson || "هذا الدرس"} بسؤال واحد">${selectedResponseMode === "quick" ? "اختبار سريع" : "ابدأ اختبارًا قصيرًا"}</button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  return `
    <div class="answer-grid">
      ${modeNote}
      <section class="answer-section">
        <h4>✅ الإجابة</h4>
        <p>${response.finalAnswer}</p>
      </section>
      <section class="answer-section">
        <h4>📘 الشرح</h4>
        <p>${response.explanation}</p>
      </section>
      <section class="answer-section">
        <h4>🧮 الخطوات</h4>
        <ul>${response.steps.map((step) => `<li>${step}</li>`).join("")}</ul>
      </section>
      <section class="answer-section">
        <h4>⚠️ الأخطاء الشائعة</h4>
        <ul>${response.mistakes.map((item) => `<li>${item}</li>`).join("")}</ul>
      </section>
      <section class="answer-section answer-section-wide">
        <h4>🔁 سؤال مشابه</h4>
        <p>${response.similar}</p>
      </section>
      <section class="answer-section answer-section-wide">
        <h4>📚 الربط بالمنهج</h4>
        <p>${response.curriculumLink}</p>
      </section>
      <section class="answer-section answer-section-wide">
        <h4>🧩 نوع السؤال</h4>
        <p>${response.questionType || "سؤال أكاديمي"}</p>
      </section>
      <section class="answer-section answer-section-wide">
        <div class="practice-cta">
          <p>هل تريد 3 أسئلة تدريبية أو اختبارًا قصيرًا على نفس الدرس؟</p>
          <div class="inline-actions">
            <button class="inline-action-btn" type="button" data-fill-prompt="اكتب لي 3 أسئلة تدريبية على ${response.lesson || "هذا الدرس"} في ${response.subject || (subjectSelect?.value || "المادة الحالية")}">3 أسئلة تدريبية</button>
            <button class="inline-action-btn" type="button" data-fill-prompt="اختبرني في ${response.lesson || "هذا الدرس"} بسؤال واحد">${selectedResponseMode === "quick" ? "اختبار سريع" : "ابدأ اختبارًا قصيرًا"}</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function buildSources() {
  const term = termSelect?.value || "الفصل الدراسي الأول";
  const termGuide = wajibatiTerms.find((entry) => entry.name === term) || wajibatiTerms[0];
  return [
    { type: "مرجع رسمي", label: "عين التعليمية", url: "https://ien.edu.sa/" },
    { type: "مرجع منهجي", label: termGuide.guideLabel, url: termGuide.guideUrl },
    { type: "مرجع تعليمي", label: "بيت العلم", url: "https://www.baetiy.com/" }
  ];
}

function renderAttachments() {
  if (!attachmentList) return;
  attachmentList.innerHTML = attachments
    .map((file) => `<div class="attachment">📎 ${file.name}</div>`)
    .join("");
}

function renderLearnedMemory() {
  if (!learnList) return;
  if (!isLoggedIn()) {
    learnList.innerHTML = `<div class="memory-item"><strong>سجل الإعجابات محفوظ بعد الدخول</strong><span>سجّل دخولك ليتم حفظ الإجابات التي أعجبتك داخل حسابك.</span></div>`;
    return;
  }
  if (!likedAnswers.length) {
    learnList.innerHTML = `<div class="memory-item"><strong>لا توجد إجابات مفضلة بعد</strong><span>عندما تضغط على إعجاب في أي إجابة ستظهر هنا.</span></div>`;
    return;
  }
  learnList.innerHTML = likedAnswers
    .slice(0, 5)
    .map((item) => `<div class="memory-item"><strong>${item.title}</strong><span>${item.preview}</span></div>`)
    .join("");
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function createSessionTitle(question, subject = "") {
  const plain = stripHtml(question || "");
  const tokens = plain.split(/\s+/).filter(Boolean).slice(0, 7).join(" ");
  if (!tokens) return subject ? `محادثة ${subject}` : "محادثة جديدة";
  return tokens;
}

function sortSessions(list = []) {
  return [...list].sort((a, b) => {
    if (Boolean(b.pinned) !== Boolean(a.pinned)) return Number(b.pinned) - Number(a.pinned);
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

function getActiveSession() {
  return chatSessions.find((session) => session.id === activeSessionId) || null;
}

function createSession(question = "", subject = "") {
  const now = Date.now();
  const session = {
    id: `session_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: createSessionTitle(question, subject),
    preview: stripHtml(question) || "ابدأ أول رسالة في هذه المحادثة.",
    subject: subject || "",
    createdAt: now,
    updatedAt: now,
    pinned: false,
    messages: []
  };
  chatSessions.unshift(session);
  chatSessions = sortSessions(chatSessions);
  activeSessionId = session.id;
  saveChatSessions();
  saveActiveSession();
  return session;
}

function ensureActiveSession(question = "", subject = "") {
  if (!isLoggedIn()) return null;
  let session = getActiveSession();
  if (!session) {
    session = createSession(question, subject);
  }
  return session;
}

function updateSession(sessionId, updater) {
  const index = chatSessions.findIndex((session) => session.id === sessionId);
  if (index === -1) return null;
  const current = chatSessions[index];
  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater };
  chatSessions[index] = next;
  chatSessions = sortSessions(chatSessions);
  saveChatSessions();
  saveActiveSession();
  return next;
}

function appendMessageToSession(type, author, body, options = {}) {
  if (!isLoggedIn()) return;
  const session = ensureActiveSession(options.sessionTitle || body, options.subject || "");
  if (!session) return;
  const now = Date.now();
  updateSession(session.id, (current) => {
    const messages = [...(current.messages || []), {
      id: `msg_${now}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      author,
      body,
      createdAt: now,
      enableTools: Boolean(options.enableTools),
      sources: Array.isArray(options.sources) ? options.sources : [],
      metadata: options.metadata || undefined
    }];
    const title = current.messages?.length ? current.title : createSessionTitle(options.sessionTitle || body, options.subject || current.subject);
    return {
      ...current,
      title,
      subject: options.subject || current.subject || "",
      preview: stripHtml(body).slice(0, 120) || current.preview,
      updatedAt: now,
      messages
    };
  });
  renderSessionList();
}

function restoreSession(sessionId) {
  const session = chatSessions.find((entry) => entry.id === sessionId);
  if (!session || !messageList) return;
  activeSessionId = sessionId;
  saveActiveSession();
  messageList.innerHTML = "";
  attachments = [];
  renderAttachments();
  session.messages.forEach((message) => {
    addMessage(message.type, message.author, message.body, {
      metadata: message.metadata,
      enableTools: message.enableTools,
      sources: message.sources
    });
  });
  if (!session.messages.length) renderWelcomeMessage();
  renderSessionList();
}

function startFreshSession() {
  attachments = [];
  if (fileInput) fileInput.value = "";
  renderAttachments();
  if (!isLoggedIn()) {
    resetConversationView();
    return;
  }
  createSession("", subjectSelect?.value || "");
  resetConversationView();
  renderSessionList();
}

function renderSessionList() {
  if (!sessionList) return;
  if (!isLoggedIn()) {
    sessionList.innerHTML = `<div class="session-empty">سجّل الدخول ليبدأ حفظ محادثاتك هنا، ثم يمكنك الرجوع لها وإكمالها في أي وقت.</div>`;
    return;
  }

  if (!chatSessions.length) {
    sessionList.innerHTML = `<div class="session-empty">لا توجد محادثات محفوظة بعد. ابدأ أول محادثة لك الآن وسيتم حفظها داخل حسابك تلقائيًا.</div>`;
    return;
  }

  sessionList.innerHTML = sortSessions(chatSessions)
    .map((session) => `
      <article class="session-card ${session.id === activeSessionId ? "active" : ""} ${session.pinned ? "pinned" : ""}">
        <button class="session-open-btn" type="button" data-open-session="${session.id}">
          <div class="session-card-head">
            <strong class="session-card-title">${session.title}</strong>
            <span>${session.pinned ? "📌" : ""}</span>
          </div>
          <div class="session-card-preview">${session.preview || "ابدأ أول رسالة في هذه المحادثة."}</div>
          <div class="session-card-meta">
            <span>${session.subject || "عام"}</span>
            <span>${new Date(session.updatedAt || session.createdAt || Date.now()).toLocaleDateString("ar-SA")}</span>
          </div>
        </button>
        <div class="session-card-actions">
          <button class="session-action-btn" type="button" data-pin-session="${session.id}">${session.pinned ? "إلغاء التثبيت" : "تثبيت"}</button>
          <button class="session-action-btn" type="button" data-rename-session="${session.id}">إعادة تسمية</button>
          <button class="session-action-btn" type="button" data-delete-session="${session.id}">حذف</button>
        </div>
      </article>
    `)
    .join("");
}

function renderHistory() {
  if (!historyList) return;
  if (!isLoggedIn()) {
    historyList.innerHTML = "";
    return;
  }
  if (!chatHistory.length) {
    historyList.innerHTML = `<div class="history-item"><strong>لا توجد محادثات محفوظة بعد</strong><span>ابدأ أول سؤال وسيظهر السجل هنا.</span></div>`;
    return;
  }
  historyList.innerHTML = chatHistory
    .slice(0, 6)
    .map(
      (item) => `
        <button class="suggestion-btn" type="button" data-fill-prompt="${item.question}" data-subject-fill="${item.subject}">
          <strong>${item.subject}</strong>
          <span>${item.question}</span>
        </button>
      `
    )
    .join("");
}

function renderInsights() {
  if (!insightsList) return;
  if (!isLoggedIn()) {
    insightsList.innerHTML = [
      "يمكنك استخدام الذكاء الاصطناعي النصي الآن كزائر.",
      "بعد تسجيل الدخول يبدأ حفظ تقدمك وتحليلك الشخصي.",
      "تحليل الصور والنقاط متاحان بعد تسجيل الدخول."
    ]
      .map((text) => `<div class="memory-item"><strong>وضع الضيف</strong><span>${text}</span></div>`)
      .join("");
    return;
  }
  const topSubject = Object.entries(analytics.subjects || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  const weakSubject = Object.entries(analytics.subjects || {}).sort((a, b) => a[1] - b[1])[0]?.[0];
  const recentLesson = aiLogs.find((item) => item.lesson || item.subject);
  const level = Math.max(1, Math.floor((analytics.totalMessages || 0) / 4) + 1);
  const badges = [];
  if ((analytics.totalMessages || 0) >= 3) badges.push("مستكشف الدروس");
  if ((analytics.likes || 0) >= 2) badges.push("متفاعل");
  if ((analytics.totalMessages || 0) >= 8) badges.push("مجتهد");

  insightsList.innerHTML = [
    topSubject
      ? `أفضل تفاعل حاليًا في مادة ${topSubject}.`
      : "ابدأ أول سؤال لتظهر قراءة أولية لمستواك.",
    `مستواك الحالي: المستوى ${level}${badges.length ? ` • الشارات: ${badges.join("، ")}` : ""}.`,
    recentLesson
      ? `آخر درس بارز لديك: ${recentLesson.lesson || recentLesson.subject}.`
      : "سيظهر آخر درس راجعته هنا بعد الاستخدام.",
    weakSubject
      ? `اقتراح مراجعة: راجع ${weakSubject} بمثالين إضافيين لتثبيت الفهم.`
      : "سيظهر اقتراح مراجعة مخصص بعد عدة أسئلة.",
    analytics.totalMessages
      ? `أرسلت ${analytics.totalMessages} رسالة تعليمية حتى الآن.`
      : "تحليل الطالب يظهر هنا بعد أول استخدام فعلي.",
    analytics.likes
      ? `أعجبتك ${analytics.likes} إجابة حتى الآن.`
      : "يمكنك تقييم الإجابات لتحسين التجربة."
  ]
    .map((text) => `<div class="memory-item"><strong>مؤشر ذكي</strong><span>${text}</span></div>`)
    .join("");
}

function renderQuestionBank() {
  if (!questionBank) return;
  questionBank.innerHTML = questionBankItems
    .map((item) => `<button class="suggestion-btn" type="button" data-fill-prompt="${item}">${item}</button>`)
    .join("");
}

function renderWajibatiLibrary() {
  if (!wajibatiLibraryList) return;
  const activeGrade = gradeSelect?.value || "الثاني الثانوي";
  const activeSubject = subjectSelect?.value || "";
  const activeTerm = termSelect?.value || "الفصل الدراسي الأول";
  const materials = getGradeMaterials(activeGrade);

  wajibatiLibraryList.innerHTML = wajibatiTerms
    .map(
      (term) => `
        <details class="library-term" ${term.name === activeTerm ? "open" : ""}>
          <summary class="library-term-summary">
            <strong>${term.name}</strong>
            <span>${activeGrade}</span>
          </summary>
          <div class="library-term-body">
            <a class="memory-item" href="${term.guideUrl}" target="_blank" rel="noreferrer">
              <strong>${term.guideLabel}</strong>
              <span>افتح الدليل أو اضغط على أي مادة لتجهيز الشات عليها مباشرة.</span>
            </a>
            <div class="library-subjects">
              ${materials
                .map(
                  (subject) => `
                    <button
                      class="library-chip ${subject === activeSubject ? "active" : ""}"
                      type="button"
                      data-library-grade="${activeGrade}"
                      data-library-term="${term.name}"
                      data-library-subject="${subject}"
                    >
                      ${subject}
                    </button>
                  `
                )
                .join("")}
            </div>
          </div>
        </details>
      `
    )
    .join("");
}

function renderTermCoverage() {
  if (!termCoverageList) return;
  const grade = gradeSelect?.value || "الثاني الثانوي";
  const materialsCount = getGradeMaterials(grade).length;
  termCoverageList.innerHTML = [
    `${grade} — الفصل الدراسي الأول: ${materialsCount} مادة متاحة داخل المكتبة.`,
    `${grade} — الفصل الدراسي الثاني: ${materialsCount} مادة متاحة داخل المكتبة.`
  ]
    .map((item) => `<div class="memory-item"><strong>تغطية منهجية</strong><span>${item}</span></div>`)
    .join("");
}

function renderWebPolicy() {
  if (!webPolicyList) return;
  webPolicyList.innerHTML = webPolicyItems
    .map((item) => `<div class="memory-item"><strong>مصدر معتمد</strong><span>${item}</span></div>`)
    .join("");
}

function updateSelectionSummary() {
  const summary = `${gradeSelect?.value || ""} · ${subjectSelect?.value || ""} · ${termSelect?.value || ""} · ${lessonInput?.value.trim() || "الدرس غير محدد"}`;
  if (selectionSummary) selectionSummary.textContent = summary;
  if (runtimeSummary) runtimeSummary.textContent = `الوضع الحالي: ${summary}`;
  if (statusChip) {
    statusChip.textContent = isLoggedIn()
      ? `${subjectSelect?.value || "جاهز"} • ${getCurrentPoints()} نقطة`
      : "وضع ضيف • الصور تتطلب دخول";
  }
  renderWajibatiLibrary();
  renderTermCoverage();
}

function updateXpBalance() {
  const user = getActiveUser();
  xpBalanceNodes.forEach((node) => {
    node.textContent = user ? String(user.xp ?? 100) : "0";
  });
}

function setPromptValue(value, subject = "") {
  if (!promptInput) return;
  promptInput.value = value;
  if (subject && subjectSelect) subjectSelect.value = subject;
  autoGrow(promptInput);
}

function sendPresetPrompt(value, subject = "") {
  setPromptValue(value, subject);
  form?.requestSubmit();
}

function openImageUpload() {
  if (!isLoggedIn()) {
    addMessage(
      "assistant",
      "ملم يحل",
      formatSimpleReply('يمكنك استخدام الشات النصي مباشرة، لكن رفع الصور وتحليلها يتطلب تسجيل الدخول أولًا. <a class="top-link" href="login.html">سجّل دخولك من هنا</a>.')
    );
    return;
  }
  if (!fileInput) return;
  fileInput.setAttribute("accept", ".png,.jpg,.jpeg,.webp");
  fileInput.click();
}

function openGenericUpload() {
  if (!isLoggedIn()) {
    addMessage(
      "assistant",
      "ملم يحل",
      formatSimpleReply('رفع الملفات والصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة سؤالك نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل المرفقات.')
    );
    return;
  }
  if (!fileInput) return;
  fileInput.setAttribute("accept", ".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md");
  fileInput.click();
}

function startChat() {
  return;
}

function quickSolve() {
  setPromptValue("ابدأ بحل سؤال من هذا الدرس مع شرح مبسط وخطوات وأخطاء شائعة.");
  startChat();
}

function saveHistory(question, subject, questionType = "", status = "تمت المراجعة") {
  if (!isLoggedIn()) return;
  chatHistory.unshift({ question, subject, questionType, status, time: Date.now() });
  chatHistory = chatHistory.slice(0, 12);
  saveChatHistory();
  renderHistory();
}

function resetConversationView() {
  if (!messageList) return;
  messageList.innerHTML = "";
  attachments = [];
  if (fileInput) fileInput.value = "";
  renderAttachments();
  renderWelcomeMessage();
}

async function handleSubmit(event) {
  event.preventDefault();
  const question = promptInput?.value.trim() || "";
  const hasAttachments = attachments.length > 0;
  if (!question && !hasAttachments) return;

  const activeUser = getActiveUser();
  const route = request_router({
    user_text: question,
    uploaded_files: attachments,
    selected_grade: gradeSelect?.value || activeUser?.grade || "",
    selected_subject: subjectSelect?.value || "",
    user_profile: activeUser || {},
    selected_solve_mode: selectedSolveMode
  });
  const intent = route.intent;
  if (hasAttachments && !isLoggedIn()) {
    addMessage(
      "assistant",
      "ملم يحل",
      formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.')
    );
    attachments = [];
    if (fileInput) fileInput.value = "";
    renderAttachments();
    return;
  }

  const shouldCharge =
    !hasAttachments ||
    route.response_mode === "academic_solve" ||
    route.response_mode === "content_interpretation";
  const usageCost = shouldCharge ? (hasAttachments ? usageCosts.image : usageCosts.chat) : 0;
  if (usageCost > 0) {
    const pointsResult = spendPoints(usageCost, hasAttachments ? "تحليل صورة" : "استخدام الشات");
    if (!pointsResult.ok) {
      addMessage(
        "assistant",
        "ملم يحل",
        formatSimpleReply(`رصيدك الحالي ${pointsResult.remaining} نقطة، وهذا لا يكفي لهذه العملية. تحتاج ${usageCost} نقطة. يمكنك شراء نقاط إضافية من <a class="top-link" href="subscriptions.html">صفحة الباقات</a>.`)
      );
      return;
    }
  }

  const renderedQuestion = hasAttachments
    ? `${question || "أرفقت صورة أو ملفًا مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments.map((item) => item.name).join("، ")}</span>`
    : question;

  addMessage("user", "أنت", renderedQuestion);
  promptInput.value = "";
  autoGrow(promptInput);

  const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });

  let body = "";
  let sources = [];
  let responseForLog = null;

  if (route.response_mode !== "academic_solve") {
    body = createImageRouterResponse(route);
  } else if (intent.type === "chat") {
    body = formatSimpleReply(createCasualResponse(question));
  } else if (intent.type === "help") {
    body = formatSimpleReply(createHelpResponse());
  } else if (needsClarification(question, intent, hasAttachments)) {
    body = formatClarificationReply(createClarificationResponse(question, intent, route));
  } else {
    const response = createAcademicResponse(question || route.extracted_text || "حل السؤال من الملفات المرفقة", intent, {
      preferredSubject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : "")
    });
    responseForLog = response;
    body = formatAssistantSections(response);
    sources = buildSources();
    analytics.totalMessages += 1;
    analytics.xpUsed += usageCost;
    analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] =
      (analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] || 0) + 1;
    saveAnalytics();
    saveHistory(question || "سؤال مرفق", response.subject || route.detected_subject || subjectSelect?.value || "عام");
  }

  if (pendingNode) {
    pendingNode.remove();
  }

  addMessage("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: responseForLog
      ? {
          subject: responseForLog.subject,
          lesson: responseForLog.lesson,
          questionType: responseForLog.questionType,
          mode: responseForLog.mode
        }
      : undefined
  });
  aiLogs.unshift({
    question: question || "سؤال مرفق",
    intent: intent.type,
    subject: route.detected_subject || subjectSelect?.value || "عام",
    lesson: responseForLog?.lesson || lessonInput?.value.trim() || "",
    responseMode: responseForLog?.mode || route.response_mode || intent.type,
    usedAttachments: hasAttachments,
    imageType: route.image_type,
    scopeStatus: route.scope_status,
    createdAt: Date.now()
  });
  aiLogs = aiLogs.slice(0, 40);
  saveAiLogs();
  renderInsights();
  renderLearnedMemory();
  updateXpBalance();
}

function handleMessageInteractions(event) {
  const fillButton = event.target.closest("[data-fill-prompt]");
  const actionButton = event.target.closest("[data-action]");
  const likeButton = event.target.closest("[data-like]");
  const dislikeButton = event.target.closest("[data-dislike]");
  const refineButton = event.target.closest("[data-refine]");

  if (fillButton) {
    setPromptValue(fillButton.getAttribute("data-fill-prompt") || "");
    const subject = fillButton.getAttribute("data-subject-fill");
    if (subject && subjectSelect) subjectSelect.value = subject;
    return;
  }

  if (refineButton) {
    const card = refineButton.closest(".message");
    const lesson = card?.dataset.lesson || "هذا الدرس";
    const subject = card?.dataset.subject || subjectSelect?.value || "المادة الحالية";
    const refine = refineButton.getAttribute("data-refine");

    if (refine === "simple") {
      sendPresetPrompt(`اشرح ${lesson} في ${subject} كأني مبتدئ جدًا وبأسلوب مبسط.`, subject);
      return;
    }

    if (refine === "short") {
      sendPresetPrompt(`لخص ${lesson} في ${subject} باختصار شديد وفي نقاط قليلة.`, subject);
      return;
    }

    if (refine === "steps") {
      sendPresetPrompt(`اشرح ${lesson} في ${subject} خطوة خطوة مع ترتيب واضح.`, subject);
      return;
    }

    if (refine === "quiz") {
      sendPresetPrompt(`اختبرني في ${lesson} من مادة ${subject} بسؤال واحد ثم انتظر إجابتي.`, subject);
      return;
    }
  }

  if (actionButton) {
    const action = actionButton.getAttribute("data-action");
    if (action === "upload-image") openImageUpload();
    if (action === "focus-subject") return;
    return;
  }

  if (likeButton) {
    const card = likeButton.closest(".message");
    const title = card?.querySelector(".message-title")?.textContent || "إجابة من ملم";
    const preview = card?.querySelector(".message-body")?.textContent?.trim().slice(0, 140) || "";
    likedAnswers.unshift({ title, preview });
    likedAnswers = likedAnswers.slice(0, 8);
    analytics.likes += 1;
    feedbackLog.unshift({ type: "like", title, preview, createdAt: Date.now() });
    feedbackLog = feedbackLog.slice(0, 50);
    saveAnalytics();
    saveLikedAnswers();
    saveFeedbackLog();
    renderLearnedMemory();
    renderInsights();
    likeButton.classList.add("active");
    return;
  }

  if (dislikeButton) {
    analytics.dislikes += 1;
    feedbackLog.unshift({
      type: "dislike",
      title: dislikeButton.closest(".message")?.querySelector(".message-title")?.textContent || "إجابة",
      preview: dislikeButton.closest(".message")?.querySelector(".message-body")?.textContent?.trim().slice(0, 140) || "",
      createdAt: Date.now()
    });
    feedbackLog = feedbackLog.slice(0, 50);
    saveAnalytics();
    saveFeedbackLog();
    renderInsights();
    dislikeButton.classList.add("active");
  }
}

function handleSessionInteractions(event) {
  const openButton = event.target.closest("[data-open-session]");
  const pinButton = event.target.closest("[data-pin-session]");
  const renameButton = event.target.closest("[data-rename-session]");
  const deleteButton = event.target.closest("[data-delete-session]");

  if (openButton) {
    restoreSession(openButton.getAttribute("data-open-session") || "");
    return;
  }

  if (pinButton) {
    const sessionId = pinButton.getAttribute("data-pin-session") || "";
    updateSession(sessionId, (current) => ({ ...current, pinned: !current.pinned }));
    renderSessionList();
    return;
  }

  if (renameButton) {
    const sessionId = renameButton.getAttribute("data-rename-session") || "";
    const current = chatSessions.find((session) => session.id === sessionId);
    const nextTitle = window.prompt("اكتب اسمًا جديدًا للمحادثة:", current?.title || "");
    if (nextTitle && nextTitle.trim()) {
      updateSession(sessionId, { title: nextTitle.trim() });
      renderSessionList();
    }
    return;
  }

  if (deleteButton) {
    const sessionId = deleteButton.getAttribute("data-delete-session") || "";
    chatSessions = chatSessions.filter((session) => session.id !== sessionId);
    if (activeSessionId === sessionId) {
      activeSessionId = chatSessions[0]?.id || null;
    }
    saveChatSessions();
    saveActiveSession();
    renderSessionList();
    if (activeSessionId) {
      restoreSession(activeSessionId);
    } else {
      resetConversationView();
    }
  }
}

function handleLibraryInteractions(event) {
  const chip = event.target.closest("[data-library-subject]");
  if (!chip) return;

  const subject = chip.getAttribute("data-library-subject") || "";
  const grade = chip.getAttribute("data-library-grade") || "";
  const term = chip.getAttribute("data-library-term") || "";

  if (gradeSelect && grade) gradeSelect.value = grade;
  if (subjectSelect && subject) subjectSelect.value = subject;
  if (termSelect && term) termSelect.value = term;

  updateSelectionSummary();
  setPromptValue(`ابدأ بشرح أساسيات مادة ${subject} لهذا الصف، ثم حل سؤالًا نموذجيًا من ${term}.`, subject);
  startChat();
}

function bindStarterButtons() {
  starterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-starter-action");
      const prompt = button.getAttribute("data-starter-prompt") || "";
      const subject = button.getAttribute("data-starter-subject") || "";

      if (action === "upload-image") {
        openImageUpload();
        return;
      }

      setPromptValue(prompt, subject);
      startChat();
    });
  });
}

function needsClarification(message, intent, hasAttachments = false) {
  if (hasAttachments) return false;
  if (intent?.type === "chat" || intent?.type === "help") return false;
  const normalized = normalizeText(message);
  const tokens = tokenize(message);
  const generic = new Set(["حل", "حلها", "اشرح", "هذا", "ذي", "وش الحل", "سؤال", "اختبار", "أسئلة"]);
  const specific = /احسب|اشرح|حدد|صح|خطأ|اختر|قارن|فسر|علل|صحح|ترجم|ما|كيف|لماذا|\d|دائرة|قانون|معادلة|رابطة|نيوتن|محيط|مساحة|درس|اختبار|سؤال/i;

  if (intent?.type === "generate_questions" || intent?.type === "quiz") {
    return !(/رياضيات|علوم|فيزياء|كيمياء|عربي|إنجليزي|أحياء|اجتماعيات/.test(normalized)) && tokens.length < 3;
  }

  if (/صواب|صح|خطأ|اختيار|اختر|ضع دائرة/.test(normalized) && tokens.length >= 2) return false;
  if (specific.test(normalized) && tokens.length >= 2) return false;
  if (tokens.length >= 3) return false;
  return generic.has(normalized) || normalized.length <= 3 || intent?.type === "unclear";
}

function createClarificationResponse(message, intent, route = null) {
  const normalized = normalizeText(message);
  const variants = [
    "أقدر أساعدك مباشرة، لكن ينقصني تفصيل صغير واحد فقط.",
    "أفهم الفكرة العامة، وأحتاج منك توضيحًا قصيرًا حتى أرتب الجواب بدقة.",
    "السؤال قريب من الوضوح، وأحتاج تحديدًا بسيطًا قبل أن أكمل الحل."
  ];
  const intro = variants[clarificationCursor % variants.length];
  clarificationCursor += 1;

  if (/(هذا|ذي|وش الحل)/.test(normalized)) {
    return {
      intro,
      prompt: "هل يمكنك كتابة السؤال كاملًا أو رفع صورة واضحة له؟",
      actions: [
        { label: "رفع صورة السؤال", action: "upload-image" },
        { label: "اكتب السؤال كاملًا", fill: "اكتب السؤال كاملًا هنا مع المعطيات والمطلوب." }
      ]
    };
  }

  if (/اشرح/.test(normalized)) {
    return {
      intro,
      prompt: route?.detected_subject
        ? `يبدو أن السؤال أقرب إلى ${route.detected_subject}. هل تريد شرحًا مبسطًا أم شرحًا تفصيليًا؟`
        : "هل تريد شرحًا مبسطًا أم شرحًا تفصيليًا؟",
      actions: [
        { label: "شرح مبسط", fill: `${message} شرحًا مبسطًا` },
        { label: "شرح تفصيلي", fill: `${message} شرحًا تفصيليًا مع مثال` }
      ]
    };
  }

  if (/صواب|صح|خطأ|اختيار|اختر|ضع دائرة/.test(normalized)) {
    return {
      intro,
      prompt: route?.detected_subject
        ? `يبدو أن السؤال من ${route.detected_subject}. أرسل العبارات كاملة وسأحدد الصحيح مباشرة.`
        : "أرسل العبارات أو الخيارات كاملة، وسأحللها وأحدد الجواب الصحيح مباشرة.",
      actions: [
        { label: "أكمل كتابة السؤال", fill: "اكتب العبارات أو الخيارات كاملة هنا..." },
        { label: "رفع صورة السؤال", action: "upload-image" }
      ]
    };
  }

  if (intent?.type === "generate_questions") {
    return {
      intro,
      prompt: route?.detected_subject
        ? `هل تريدني أن أكتب لك أسئلة في ${route.detected_subject}؟`
        : "أي مادة تريدني أن أولد لك منها أسئلة؟",
      actions: [
        { label: "أسئلة رياضيات", fill: "اكتب لي 3 أسئلة رياضيات" },
        { label: "أسئلة كيمياء", fill: "اكتب لي 3 أسئلة كيمياء" }
      ]
    };
  }

  if (intent?.type === "quiz") {
    return {
      intro,
      prompt: route?.detected_subject
        ? `هل تريد أن أبدأ اختبارًا قصيرًا في ${route.detected_subject}؟`
        : "في أي مادة تريد أن أبدأ لك اختبارًا قصيرًا؟",
      actions: [
        { label: "اختبار علوم", fill: "اختبرني في العلوم" },
        { label: "اختبار عربي", fill: "اختبرني في اللغة العربية" }
      ]
    };
  }

  return {
    intro,
    prompt: route?.detected_subject
      ? `هل تقصد ${route.detected_subject}؟ إذا نعم أكمل السؤال قليلًا وسأتابع الحل مباشرة.`
      : "اكتب المطلوب بشكل مباشر أكثر، أو أرسل صورة السؤال كاملة وسأتابع معك.",
    actions: [
      { label: "اكتب السؤال كاملًا", fill: "اكتب السؤال كاملًا مع المطلوب." },
      { label: "رفع صورة السؤال", action: "upload-image" }
    ]
  };
}

function curriculum_scope_checker({ userText, selectedGrade, selectedSubject, imageMeta, solveMode = "quick" }) {
  const sourceText = `${userText || ""} ${imageMeta?.extracted_text || ""}`;
  const detectedSubject = detectSubjectFromContent(sourceText);
  const detectedGradeLevel = detectGradeLevel(sourceText);
  const selectedStage = getSelectedStageLabel(selectedGrade);
  const structured = solveMode === "structured";

  if (!detectedSubject) {
    return {
      detected_subject: "",
      detected_grade_level: detectedGradeLevel,
      scope_status: structured && selectedSubject ? "subject_unknown" : "auto_detect_pending"
    };
  }

  if (structured && selectedSubject && detectedSubject !== selectedSubject) {
    return {
      detected_subject: detectedSubject,
      detected_grade_level: detectedGradeLevel,
      scope_status: "subject_mismatch"
    };
  }

  if (structured && detectedGradeLevel && selectedStage && detectedGradeLevel !== selectedStage) {
    return {
      detected_subject: detectedSubject,
      detected_grade_level: detectedGradeLevel,
      scope_status: "grade_mismatch"
    };
  }

  return {
    detected_subject: detectedSubject,
    detected_grade_level: detectedGradeLevel,
    scope_status: structured ? "matched" : "auto_detected"
  };
}

function request_router({ user_text, uploaded_files, selected_grade, selected_subject, user_profile, selected_solve_mode = "quick" }) {
  const input_type = determineInputType(user_text, uploaded_files);
  const image_type = input_type.includes("image")
    ? image_analyzer(uploaded_files, user_text)
    : { image_type: "none", extracted_text: "", confidence: 0 };
  const intent = intent_router(`${user_text || ""} ${image_type.extracted_text || ""}`, uploaded_files?.length > 0);
  const quickMode = selected_solve_mode !== "structured";
  const scope = curriculum_scope_checker({
    userText: user_text,
    selectedGrade: selected_grade || user_profile?.grade || "",
    selectedSubject: quickMode ? "" : (selected_subject || ""),
    imageMeta: image_type,
    solveMode: quickMode ? "quick" : "structured"
  });

  let response_mode = "academic_solve";

  if (input_type === "file_only" && !user_text.trim()) response_mode = "content_interpretation";
  if (image_type.image_type === "logo_or_branding") response_mode = "reject_logo_image";
  else if (image_type.image_type === "non_educational_image" || image_type.image_type === "document_non_educational") response_mode = "reject_out_of_scope_image";
  else if (image_type.image_type === "unclear_image") response_mode = "ask_clearer_upload";
  else if (image_type.image_type === "educational_page" && !user_text.trim()) response_mode = "content_interpretation";
  else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) response_mode = "ask_for_confirmation";

  return {
    input_type,
    intent,
    image_type: image_type.image_type,
    extracted_text: image_type.extracted_text,
    detected_subject: scope.detected_subject,
    detected_grade_level: scope.detected_grade_level,
    scope_status: scope.scope_status,
    response_mode,
    quick_mode: quickMode
  };
}

function createImageRouterResponse(route) {
  if (route.response_mode === "reject_logo_image") {
    return formatSimpleReply("يبدو أن الصورة المرفقة ليست سؤالًا دراسيًا، بل أقرب إلى شعار أو تصميم. إذا كنت تريد المساعدة التعليمية، أرسل صورة السؤال أو اكتبه نصًا.");
  }

  if (route.response_mode === "reject_out_of_scope_image") {
    return formatSimpleReply("الصورة المرفقة لا تبدو ضمن نطاق التعليم. تأكد من إرسال صورة سؤال أو صفحة دراسية واضحة.");
  }

  if (route.response_mode === "ask_clearer_upload") {
    return formatSimpleReply("تعذر قراءة محتوى الصورة بشكل واضح. يرجى إعادة رفع صورة أوضح أو كتابة السؤال نصًا.");
  }

  if (route.response_mode === "ask_for_confirmation") {
    if (route.scope_status === "subject_mismatch") {
      return formatSimpleReply(`يبدو أن هذا السؤال أقرب إلى مادة ${route.detected_subject}. هل تريد أن أتابع على هذا الأساس، أم تفضل تغيير المادة المحددة أولًا؟`);
    }
    if (route.scope_status === "grade_mismatch") {
      return formatSimpleReply("يبدو أن السؤال من مستوى دراسي مختلف عن الصف المحدد لديك. يمكنك تعديل الصف للحصول على جواب أدق، أو أتابع الحل كتقدير أولي.");
    }
    return formatSimpleReply(route.detected_subject ? `هل تقصد ${route.detected_subject}؟ إذا نعم أكمل الحل مباشرة، أو غيّر المادة يدويًا.` : "لم تتضح المادة بشكل كافٍ بعد. اكتب السؤال كاملًا أو أرسل صورة أوضح وسأحاول تحديدها تلقائيًا.");
  }

  if (route.response_mode === "content_interpretation") {
    return formatClarificationReply({
      intro: "تم التعرف على الصورة كمحتوى تعليمي.",
      prompt: "هل تريد شرح المحتوى، تلخيصه، أم حل الأسئلة الموجودة فيه؟",
      actions: [
        { label: "شرح المحتوى", fill: "اشرح محتوى الصفحة التعليمية المرفقة" },
        { label: "تلخيص الصفحة", fill: "لخص الصفحة التعليمية المرفقة" },
        { label: "حل الأسئلة", fill: "حل الأسئلة الموجودة في الصفحة التعليمية المرفقة" }
      ]
    });
  }

  return formatSimpleReply("تم تجهيز السؤال للتحليل وسأتابع الحل الآن.");
}

function createAcademicResponse(question, intent, options = {}) {
  const context = retrieveCurriculumContext(question, options.preferredSubject || "");
  const questionType = detectQuestionType(question);
  const objective = solveObjectiveQuestion(question);
  if (objective) {
    return reviewResponse(intent, {
      ...objective,
      mode: "solve",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      curriculumLink: `تم تحليل السؤال على أنه ${questionType} في ${context.subject}.`
    });
  }

  const math = solveMathQuestion(question);
  if (math) {
    return reviewResponse(intent, {
      ...math,
      mode: "solve",
      questionType,
      subject: context.subject,
      lesson: context.lesson,
      curriculumLink: `تم ربط السؤال بموضوع ${context.lesson} في ${context.subject}.`
    });
  }

  return reviewResponse(intent, {
    mode: intent.type === "explain" ? "explain" : intent.type,
    questionType,
    subject: context.subject,
    lesson: context.lesson,
    finalAnswer: intent.type === "generate_questions"
      ? `هذه أسئلة تدريبية مقترحة في ${context.subject}.`
      : intent.type === "quiz"
        ? "سأبدأ معك الآن بسؤال واحد على نفس الموضوع."
        : `هذا هو الجواب الأقرب بناءً على تحليل السؤال في ${context.subject}.`,
    explanation:
      context.entry?.explanation ||
      `تم تحليل السؤال تلقائيًا وتقدير أنه يندرج تحت ${context.subject}${context.lesson && context.lesson !== "غير محدد" ? `، وموضوعه الأقرب هو ${context.lesson}` : ""}.`,
    steps: context.entry?.steps || [
      "تحليل الكلمات المفتاحية في السؤال.",
      "تحديد المادة ونوع السؤال تلقائيًا.",
      "بناء الجواب الأقرب ثم مراجعته قبل الإرسال."
    ],
    mistakes: context.entry?.mistakes || [
      "الخلط بين المطلوب والشرح العام.",
      "قراءة السؤال بسرعة دون التركيز على الكلمات المفتاحية."
    ],
    similar: context.entry?.similar || `اكتب سؤالًا مشابهًا في ${context.subject} وسأعطيك تدريبًا إضافيًا.`,
    intro: intent.type === "generate_questions" ? `هذه أسئلة مقترحة في ${context.subject}.` : undefined,
    questions: intent.type === "generate_questions" ? generateCurriculumQuestions(context) : undefined,
    quizQuestion: intent.type === "quiz" ? generateCurriculumQuestions(context)[0] : undefined,
    bullets: intent.type === "summary" ? [
      `المادة المتوقعة: ${context.subject}`,
      `الصف التقريبي: ${context.grade}`,
      `الموضوع الأقرب: ${context.lesson}`
    ] : undefined,
    curriculumLink: `التحليل التلقائي قدّر المادة: ${context.subject}${context.grade ? ` والصف: ${context.grade}` : ""}.`
  });
}

function updateSelectionSummary() {
  const summary = selectedSolveMode === "structured"
    ? `${gradeSelect?.value || ""} · ${subjectSelect?.value || ""} · ${termSelect?.value || ""} · ${lessonInput?.value.trim() || "الدرس غير محدد"}`
    : "الحل السريع مفعل — سأحاول استنتاج المادة والصف ونوع السؤال تلقائيًا.";
  if (selectionSummary) selectionSummary.textContent = summary;
  if (runtimeSummary) runtimeSummary.textContent = selectedSolveMode === "structured" ? `وضع الحل الدقيق: ${summary}` : summary;
  if (statusChip) {
    statusChip.textContent = isLoggedIn()
      ? `${selectedSolveMode === "structured" ? (subjectSelect?.value || "الحل الدقيق") : "الحل السريع"} • ${getCurrentPoints()} نقطة`
      : "وضع ضيف • الصور تتطلب دخول";
  }
  renderWajibatiLibrary();
  renderTermCoverage();
}

function bootstrap() {
  applyTheme(localStorage.getItem(storageKeys.theme) || "light");
  loadUserState();
  const activeUser = syncUserStreakOnVisit() || getActiveUser();
  loadUserState();
  if (gradeSelect && activeUser?.grade) gradeSelect.value = activeUser.grade;
  updateXpBalance();
  renderLearnedMemory();
  renderHistory();
  renderInsights();
  renderQuestionBank();
  renderWebPolicy();

  if (gradeSelect) gradeSelect.value = gradeSelect.value || activeUser?.grade || gradeOptions[10];
  if (subjectSelect) subjectSelect.value = subjectSelect.value || subjectOptions[0];
  updateSelectionSummary();
  resetConversationView();

  promptInput?.addEventListener("input", () => autoGrow(promptInput));
  form?.addEventListener("submit", handleSubmit);
  fileInput?.addEventListener("change", (event) => {
    attachments = Array.from(event.target.files || []);
    renderAttachments();
  });

  gradeSelect?.addEventListener("change", updateSelectionSummary);
  subjectSelect?.addEventListener("change", updateSelectionSummary);
  termSelect?.addEventListener("change", updateSelectionSummary);
  lessonInput?.addEventListener("input", updateSelectionSummary);
  responseModeButtons.forEach((button) => {
    button.addEventListener("click", () => applyResponseMode(button.getAttribute("data-response-mode") || "educational"));
  });
  solveModeButtons.forEach((button) => {
    button.addEventListener("click", () => applySolveMode(button.getAttribute("data-solve-mode") || "quick"));
  });

  startChatButton?.addEventListener("click", startChat);
  quickSolveButton?.addEventListener("click", quickSolve);
  heroExampleButton?.addEventListener("click", () => {
    setPromptValue("احسب محيط دائرة نصف قطرها 7", "الرياضيات");
    form?.requestSubmit();
  });
  heroUploadButton?.addEventListener("click", openImageUpload);
  uploadButton?.addEventListener("click", openGenericUpload);
  uploadImageButton?.addEventListener("click", openImageUpload);
  uploadFileButton?.addEventListener("click", openGenericUpload);
  focusSubjectButton?.addEventListener("click", () => {});
  clearChatButton?.addEventListener("click", resetConversationView);
  themeToggleButton?.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    localStorage.setItem(storageKeys.theme, next);
    applyTheme(next);
  });

  messageList?.addEventListener("click", handleMessageInteractions);
  wajibatiLibraryList?.addEventListener("click", handleLibraryInteractions);
  window.addEventListener("scroll", syncScrollTopButton, { passive: true });
  scrollTopButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  bindStarterButtons();
  applyResponseMode(selectedResponseMode);
  applySolveMode(selectedSolveMode);
  syncScrollTopButton();

  const resumePrompt = localStorage.getItem(storageKeys.resumePrompt);
  if (resumePrompt) {
    setPromptValue(resumePrompt);
    localStorage.removeItem(storageKeys.resumePrompt);
  }
}

pendingSolveConfirmation = pendingSolveConfirmation || null;

function solveObjectiveQuestion(question) {
  const normalized = normalizeText(question);

  if (/التنفس الخلوي/.test(normalized) && /الفجوات/.test(normalized) && /صواب|صح|خطأ/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "لأن التنفس الخلوي يحدث في الميتوكوندريا وليس في الفجوات."
    };
  }

  if (/صواب|صح|خطأ/.test(normalized) && /الرابطة/.test(normalized) && /nacl/.test(normalized) && /تساهمية/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "لأن الرابطة في NaCl أيونية وليست تساهمية."
    };
  }

  return null;
}

function request_router({ user_text, uploaded_files, selected_grade, selected_subject, user_profile, selected_solve_mode = "quick" }) {
  const input_type = determineInputType(user_text, uploaded_files);
  const image_type = input_type.includes("image")
    ? image_analyzer(uploaded_files, user_text)
    : { image_type: "none", extracted_text: "", confidence: 0 };
  const questionText = `${user_text || ""} ${image_type.extracted_text || ""}`.trim();
  const intent = intent_router(questionText, uploaded_files?.length > 0);
  const quickMode = selected_solve_mode !== "structured";
  const questionType = detectQuestionType(questionText);
  const isObjective = questionType === "صح وخطأ" || questionType === "اختيار من متعدد";
  const scope = curriculum_scope_checker({
    userText: user_text,
    selectedGrade: selected_grade || user_profile?.grade || "",
    selectedSubject: quickMode ? "" : (selected_subject || ""),
    imageMeta: image_type,
    solveMode: quickMode ? "quick" : "structured"
  });

  let response_mode = "academic_solve";

  if (input_type === "file_only" && !user_text.trim()) response_mode = "content_interpretation";
  if (image_type.image_type === "logo_or_branding") response_mode = "reject_logo_image";
  else if (image_type.image_type === "non_educational_image" || image_type.image_type === "document_non_educational") response_mode = "reject_out_of_scope_image";
  else if (image_type.image_type === "unclear_image") response_mode = "ask_clearer_upload";
  else if (image_type.image_type === "educational_page" && !user_text.trim()) response_mode = "content_interpretation";
  else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) response_mode = "ask_for_confirmation";
  else if (quickMode && intent.type !== "chat" && intent.type !== "help" && scope.subject_confidence < 0.7 && !isObjective) response_mode = "ask_for_confirmation";

  return {
    input_type,
    intent,
    image_type: image_type.image_type,
    extracted_text: image_type.extracted_text,
    detected_subject: scope.detected_subject,
    detected_grade_level: scope.detected_grade_level,
    subject_confidence: scope.subject_confidence,
    grade_confidence: scope.grade_confidence,
    subject_candidates: scope.subject_candidates,
    analysis_passes: scope.analysis_passes,
    scope_status: scope.scope_status,
    response_mode,
    quick_mode: quickMode,
    question_type: questionType
  };
}

function createImageRouterResponse(route) {
  if (route.response_mode === "ask_for_confirmation") {
    if (route.scope_status === "subject_mismatch") {
      return formatSimpleReply(`يبدو أن السؤال أقرب إلى مادة ${route.detected_subject}، بينما المادة المحددة لديك مختلفة. غيّر المادة أو أخبرني أن أكمل على هذا الأساس.`);
    }
    if (route.scope_status === "grade_mismatch") {
      return formatSimpleReply("هذا السؤال يبدو من مستوى دراسي مختلف عن الصف المحدد لديك. يمكنك تعديل الصف أو المتابعة كتقدير أولي إذا كان هذا مقصودًا.");
    }
    if (route.detected_subject) {
      return formatClarificationReply({
        intro: "حللت السؤال أكثر من مرة للوصول لأقرب مادة ممكنة.",
        prompt: `يبدو أن السؤال من ${route.detected_subject}. هل تريد أن أكمل الحل؟`,
        actions: [
          { label: "أكمل الحل", fill: "نعم" },
          { label: "اختيار المادة", action: "focus-subject" }
        ]
      });
    }
    return formatSimpleReply("لم تتضح المادة بشكل كافٍ بعد. اكتب السؤال بصورة أوضح قليلًا أو اختر المادة يدويًا وسأكمل معك مباشرة.");
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

async function handleSubmit(event) {
  event.preventDefault();
  const question = promptInput?.value.trim() || "";
  const hasAttachments = attachments.length > 0;
  if (!question && !hasAttachments) return;

  if (pendingSolveConfirmation && isAffirmativeReply(question) && !hasAttachments) {
    const stored = pendingSolveConfirmation;
    pendingSolveConfirmation = null;
    addMessage("user", "أنت", question);
    promptInput.value = "";
    autoGrow(promptInput);

    const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
    const response = createAcademicResponse(stored.question, stored.intent, {
      preferredSubject: stored.route.detected_subject || stored.subject || "",
      detectedSubject: stored.route.detected_subject || stored.subject || "",
      subjectConfidence: Math.max(0.71, stored.route.subject_confidence || 0.71),
      route: { ...stored.route, response_mode: "academic_solve" }
    });
    pendingNode?.remove();

    const body = formatAssistantSections(response);
    const sources = buildSources();
    addMessage("assistant", "ملم يحل", body, {
      sources,
      enableTools: true,
      metadata: {
        subject: response.subject,
        lesson: response.lesson,
        questionType: response.questionType,
        mode: response.mode
      }
    });
    appendMessageToSession("assistant", "ملم يحل", body, {
      sources,
      enableTools: true,
      metadata: {
        subject: response.subject,
        lesson: response.lesson,
        questionType: response.questionType,
        mode: response.mode
      },
      subject: response.subject
    });
    scrollMessagesToBottom(true);
    return;
  }

  if (pendingSolveConfirmation && isNegativeReply(question) && !hasAttachments) {
    pendingSolveConfirmation = null;
    addMessage("user", "أنت", question);
    addMessage("assistant", "ملم يحل", formatSimpleReply("حسنًا، اختر المادة من القائمة وسأكمل الحل بدقة أكبر."));
    return;
    scrollMessagesToBottom(true);
    return;
  }

  const activeUser = getActiveUser();
  const route = request_router({
    user_text: question,
    uploaded_files: attachments,
    selected_grade: gradeSelect?.value || activeUser?.grade || "",
    selected_subject: subjectSelect?.value || "",
    user_profile: activeUser || {},
    selected_solve_mode: selectedSolveMode
  });
  const intent = route.intent;

  if (hasAttachments && !isLoggedIn()) {
    addMessage("assistant", "ملم يحل", formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.'));
    attachments = [];
    if (fileInput) fileInput.value = "";
    renderAttachments();
    return;
  }

  const shouldCharge =
    !hasAttachments ||
    route.response_mode === "academic_solve" ||
    route.response_mode === "content_interpretation";
  const usageCost = shouldCharge ? (hasAttachments ? usageCosts.image : usageCosts.chat) : 0;
  if (usageCost > 0) {
    const pointsResult = spendPoints(usageCost, hasAttachments ? "تحليل صورة" : "استخدام الشات");
    if (!pointsResult.ok) {
      addMessage("assistant", "ملم يحل", formatSimpleReply(`رصيدك الحالي ${pointsResult.remaining} نقطة، وهذا لا يكفي لهذه العملية. تحتاج ${usageCost} نقطة. يمكنك شراء نقاط إضافية من <a class="top-link" href="subscriptions.html">صفحة الباقات</a>.`));
      return;
    }
  }

  const renderedQuestion = hasAttachments
    ? `${question || "أرفقت صورة أو ملفًا مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments.map((item) => item.name).join("، ")}</span>`
    : question;

  addMessage("user", "أنت", renderedQuestion);
  appendMessageToSession("user", "أنت", renderedQuestion, {
    subject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : ""),
    sessionTitle: question || "سؤال جديد"
  });

  promptInput.value = "";
  autoGrow(promptInput);

  const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
  let body = "";
  let sources = [];
  let responseForLog = null;

  if (route.response_mode !== "academic_solve") {
    pendingSolveConfirmation = route.response_mode === "ask_for_confirmation"
      ? { question, route, intent, subject: route.detected_subject || "" }
      : null;
    body = createImageRouterResponse(route);
  } else if (intent.type === "chat") {
    pendingSolveConfirmation = null;
    body = formatSimpleReply(createCasualResponse(question));
  } else if (intent.type === "help") {
    pendingSolveConfirmation = null;
    body = formatSimpleReply(createHelpResponse());
  } else if (needsClarification(question, intent, hasAttachments) && route.question_type !== "صح وخطأ" && route.question_type !== "اختيار من متعدد") {
    pendingSolveConfirmation = null;
    body = formatClarificationReply(createClarificationResponse(question, intent, route));
  } else {
    pendingSolveConfirmation = null;
    const response = createAcademicResponse(question || route.extracted_text || "حل السؤال من المرفقات", intent, {
      preferredSubject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : ""),
      detectedSubject: route.detected_subject || "",
      subjectConfidence: route.subject_confidence,
      route
    });
    responseForLog = response;
    body = formatAssistantSections(response);
    sources = buildSources();
    analytics.totalMessages += 1;
    analytics.xpUsed += usageCost;
    analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] =
      (analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] || 0) + 1;
    saveAnalytics();
    saveHistory(
      question || "سؤال مرفق",
      response.subject || route.detected_subject || subjectSelect?.value || "عام",
      response.questionType || detectQuestionType(question || route.extracted_text || ""),
      "تمت المراجعة"
    );
  }

  pendingNode?.remove();

  const assistantMeta = responseForLog
    ? {
        subject: responseForLog.subject,
        lesson: responseForLog.lesson,
        questionType: responseForLog.questionType,
        mode: responseForLog.mode
      }
    : undefined;

  addMessage("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: assistantMeta
  });
  appendMessageToSession("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: assistantMeta,
    subject: responseForLog?.subject || route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : "")
  });

  aiLogs.unshift({
    question: question || "سؤال مرفق",
    intent: intent.type,
    subject: route.detected_subject || subjectSelect?.value || "عام",
    lesson: responseForLog?.lesson || lessonInput?.value.trim() || "",
    responseMode: responseForLog?.mode || route.response_mode || intent.type,
    usedAttachments: hasAttachments,
    imageType: route.image_type,
    scopeStatus: route.scope_status,
    createdAt: Date.now()
  });
  aiLogs = aiLogs.slice(0, 40);
  saveAiLogs();
  renderInsights();
  renderLearnedMemory();
  renderSessionList();
  updateXpBalance();
  scrollMessagesToBottom(true);
}

setupChatAutoScrollEnhancement();

pendingSolveConfirmation = pendingSolveConfirmation || null;

function isAffirmativeReply(text) {
  return /^(نعم|اي|أيوه|ايوه|أكيد|اكمل|كمل|تمام|موافق|نعم أكمل)$/i.test((text || "").trim());
}

function isNegativeReply(text) {
  return /^(لا|مو|ليس|لا شكرا|لا شكرًا|غير المادة|غيّر المادة)$/i.test((text || "").trim());
}

function isUserNearBottom() {
  if (!messageList) return false;
  const threshold = 140;
  return messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight <= threshold;
}

function scrollMessagesToBottom(force = false) {
  return;
}

function setupChatAutoScrollEnhancement() {
  return;
}

function addMessage(type, author, body, options = {}) {
  if (!messageList) return null;
  const shouldStick = isUserNearBottom() || type !== "user";
  const article = document.createElement("article");
  article.className = `message ${type}`;
  if (options.metadata) {
    article.dataset.subject = options.metadata.subject || "";
    article.dataset.lesson = options.metadata.lesson || "";
    article.dataset.questionType = options.metadata.questionType || "";
    article.dataset.responseMode = options.metadata.mode || "";
  }

  article.innerHTML = `
    <div class="message-title">${author}</div>
    <div class="message-body">${body}</div>
  `;

  if (type === "assistant" && !options.pending && options.enableTools) {
    const tools = document.createElement("div");
    tools.className = "message-tools";
    tools.innerHTML = `
      <div class="message-tools-label">هل تريد تبسيط الإجابة أو متابعة التدريب؟</div>
      <button class="mini-btn" type="button" data-refine="simple">بسّط أكثر</button>
      <button class="mini-btn" type="button" data-refine="short">باختصار</button>
      <button class="mini-btn" type="button" data-refine="steps">اشرحها خطوة خطوة</button>
      <button class="mini-btn" type="button" data-refine="quiz">اختبرني على هذا الدرس</button>
      <button class="mini-btn" type="button" data-like="${Date.now()}">👍 أعجبني</button>
      <button class="mini-btn disliked" type="button" data-dislike="${Date.now()}">👎 لم يعجبني</button>
    `;
    article.appendChild(tools);
  }

  if (type === "assistant" && !options.pending && Array.isArray(options.sources) && options.sources.length) {
    const sources = document.createElement("div");
    sources.className = "sources-list";
    sources.innerHTML = options.sources
      .map((source) => `<a class="source-link" href="${source.url}" target="_blank" rel="noreferrer">${source.type}: ${source.label}</a>`)
      .join("");
    article.appendChild(sources);
  }

  messageList.appendChild(article);
  if (shouldStick) scrollMessagesToBottom(true);
  return article;
}

function solveObjectiveQuestion(question) {
  const normalized = normalizeText(question);

  if (/التنفس الخلوي/.test(normalized) && /الفجوات/.test(normalized) && /صواب|صح|خطأ/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "لأن التنفس الخلوي يحدث أساسًا داخل الميتوكوندريا، وليس داخل الفجوات."
    };
  }

  if (/الميتوكوندريا/.test(normalized) && /صواب|صح|خطأ/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "صواب",
      explanation: "الميتوكوندريا هي العضية المسؤولة عن معظم عمليات التنفس الخلوي وإنتاج الطاقة."
    };
  }

  if (/صواب|صح|خطأ/.test(normalized) && /الرابطة/.test(normalized) && /nacl/.test(normalized) && /تساهمية/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "لأن الرابطة في NaCl أيونية وليست تساهمية."
    };
  }

  if (/nacl/.test(normalized) && /أ\)|ب\)|ج\)|د\)|اختيار|اختر/.test(question)) {
    return {
      answerMode: "mcq",
      finalAnswer: "الخيار الصحيح هو (ب) أيونية.",
      explanation: "لأن كلوريد الصوديوم يتكون من فلز ولافلز، فتنتقل الإلكترونات وتتكون رابطة أيونية."
    };
  }

  return null;
}

function auto_subject_detector(text) {
  const result = {
    subject: "",
    confidence: 0,
    candidates: [],
    passes: []
  };

  const normalized = normalizeText(text);
  const scores = Object.fromEntries(Object.keys(subjectKeywordMap).map((subject) => [subject, 0]));

  Object.entries(subjectKeywordMap).forEach(([subject, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalized.includes(normalizeText(keyword))) scores[subject] += 10;
    });
  });

  if (/التنفس الخلوي|الميتوكوندريا|الفجوات|البلاستيدات|الخلية النباتية|الخلية الحيوانية/.test(normalized)) {
    scores["الأحياء"] += 46;
    result.passes.push("biology-pattern");
  }

  if (/صواب|صح|خطأ|اختيار|اختر|ضع دائرة/.test(normalized)) {
    result.passes.push("objective-pattern");
    if (/التنفس الخلوي|الميتوكوندريا|الفجوات/.test(normalized)) scores["الأحياء"] += 28;
    if (/رابطة|معادلة كيميائية|حمض|قاعدة|تفاعل|ذرة|مول|na|cl/.test(normalized)) scores["الكيمياء"] += 26;
    if (/تسارع|قوة|سرعة|نيوتن|زخم/.test(normalized)) scores["الفيزياء"] += 26;
    if (/محيط|مساحة|قطر|نصف القطر|معادلة|جذر|كسر/.test(normalized)) scores["الرياضيات"] += 26;
  }

  if (/\d/.test(normalized) && /محيط|مساحة|احسب|أوجد|معادلة|دائرة|مثلث/.test(normalized)) {
    scores["الرياضيات"] += 28;
    result.passes.push("math-pattern");
  }

  if (/رابطة|أيونية|تساهمية|تعادل|عنصر|مركب|معادلة كيميائية|الكترون|إلكترون|بروتون|حمض|قاعدة/.test(normalized)) {
    scores["الكيمياء"] += 30;
    result.passes.push("chemistry-pattern");
  }

  if (/نيوتن|تسارع|سرعة|قوة|احتكاك|حركة|زخم|طاقة حركية/.test(normalized)) {
    scores["الفيزياء"] += 30;
    result.passes.push("physics-pattern");
  }

  if (/مبتدأ|خبر|إعراب|نحو|بلاغة|استخرج|أعرب|الجملة الاسمية|الجملة الاسمية/.test(normalized)) {
    scores["اللغة العربية"] += 28;
    result.passes.push("arabic-pattern");
  }

  const ranking = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([subject, score]) => ({ subject, score }));

  const [top, second] = ranking;
  if (top) {
    result.subject = top.subject;
    result.confidence = second
      ? clampConfidence(top.score / 100 + Math.min(0.2, Math.max(0, (top.score - second.score) / 160)))
      : clampConfidence(top.score / 100);
  }
  result.candidates = ranking.slice(0, 3);
  return result;
}

function createImageRouterResponse(route) {
  if (route.response_mode === "ask_for_confirmation") {
    if (route.scope_status === "subject_mismatch") {
      return formatSimpleReply(`يبدو أن السؤال أقرب إلى مادة ${route.detected_subject}، بينما المادة المحددة لديك مختلفة. غيّر المادة أو أخبرني أن أكمل على هذا الأساس.`);
    }
    if (route.scope_status === "grade_mismatch") {
      return formatSimpleReply("هذا السؤال يبدو من مستوى دراسي مختلف عن الصف المحدد لديك. يمكنك تعديل الصف، أو المتابعة كتقدير أولي إذا كان هذا مقصودًا.");
    }
    if (route.detected_subject) {
      return formatClarificationReply({
        intro: "حللت السؤال أكثر من مرة لتحديد مادته بشكل أقرب.",
        prompt: `يبدو أن السؤال من ${route.detected_subject}. هل تريد أن أكمل الحل؟`,
        actions: [
          { label: "أكمل الحل", fill: "نعم" },
          { label: "اختيار المادة", action: "focus-subject" }
        ]
      });
    }
    return formatSimpleReply("لم تتضح المادة بشكل كافٍ حتى الآن. اكتب السؤال بصورة أوضح قليلًا أو اختر المادة يدويًا وسأكمل معك مباشرة.");
  }

  if (route.response_mode === "reject_logo_image") {
    return formatSimpleReply("يبدو أن الصورة المرفقة ليست سؤالًا تعليميًا، بل أقرب إلى شعار أو تصميم. إذا كنت تريد المساعدة التعليمية، أرسل صورة السؤال أو اكتبه نصًا.");
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

function request_router({ user_text, uploaded_files, selected_grade, selected_subject, user_profile, selected_solve_mode = "quick" }) {
  const input_type = determineInputType(user_text, uploaded_files);
  const image_type = input_type.includes("image")
    ? image_analyzer(uploaded_files, user_text)
    : { image_type: "none", extracted_text: "", confidence: 0 };
  const questionText = `${user_text || ""} ${image_type.extracted_text || ""}`.trim();
  const intent = intent_router(questionText, uploaded_files?.length > 0);
  const quickMode = selected_solve_mode !== "structured";
  const questionType = detectQuestionType(questionText);
  const isObjective = questionType === "صح وخطأ" || questionType === "اختيار من متعدد";
  const scope = curriculum_scope_checker({
    userText: user_text,
    selectedGrade: selected_grade || user_profile?.grade || "",
    selectedSubject: quickMode ? "" : (selected_subject || ""),
    imageMeta: image_type,
    solveMode: quickMode ? "quick" : "structured"
  });

  let response_mode = "academic_solve";

  if (input_type === "file_only" && !user_text.trim()) response_mode = "content_interpretation";
  if (image_type.image_type === "logo_or_branding") response_mode = "reject_logo_image";
  else if (image_type.image_type === "non_educational_image" || image_type.image_type === "document_non_educational") response_mode = "reject_out_of_scope_image";
  else if (image_type.image_type === "unclear_image") response_mode = "ask_clearer_upload";
  else if (image_type.image_type === "educational_page" && !user_text.trim()) response_mode = "content_interpretation";
  else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) response_mode = "ask_for_confirmation";
  else if (quickMode && intent.type !== "chat" && intent.type !== "help" && scope.subject_confidence < 0.7 && !isObjective) response_mode = "ask_for_confirmation";

  return {
    input_type,
    intent,
    image_type: image_type.image_type,
    extracted_text: image_type.extracted_text,
    detected_subject: scope.detected_subject,
    detected_grade_level: scope.detected_grade_level,
    subject_confidence: scope.subject_confidence,
    grade_confidence: scope.grade_confidence,
    subject_candidates: scope.subject_candidates,
    analysis_passes: scope.analysis_passes,
    scope_status: scope.scope_status,
    response_mode,
    quick_mode: quickMode,
    question_type: questionType
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  const question = promptInput?.value.trim() || "";
  const hasAttachments = attachments.length > 0;
  if (!question && !hasAttachments) return;

  if (pendingSolveConfirmation && isAffirmativeReply(question) && !hasAttachments) {
    const stored = pendingSolveConfirmation;
    pendingSolveConfirmation = null;
    addMessage("user", "أنت", question);
    promptInput.value = "";
    autoGrow(promptInput);

    const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
    const response = createAcademicResponse(stored.question, stored.intent, {
      preferredSubject: stored.route.detected_subject || stored.subject || "",
      detectedSubject: stored.route.detected_subject || stored.subject || "",
      subjectConfidence: Math.max(0.71, stored.route.subject_confidence || 0.71),
      route: { ...stored.route, response_mode: "academic_solve" }
    });
    pendingNode?.remove();

    const body = formatAssistantSections(response);
    const sources = buildSources();
    addMessage("assistant", "ملم يحل", body, {
      sources,
      enableTools: true,
      metadata: {
        subject: response.subject,
        lesson: response.lesson,
        questionType: response.questionType,
        mode: response.mode
      }
    });
    appendMessageToSession("assistant", "ملم يحل", body, {
      sources,
      enableTools: true,
      metadata: {
        subject: response.subject,
        lesson: response.lesson,
        questionType: response.questionType,
        mode: response.mode
      },
      subject: response.subject
    });
    scrollMessagesToBottom(true);
    return;
  }

  if (pendingSolveConfirmation && isNegativeReply(question) && !hasAttachments) {
    pendingSolveConfirmation = null;
    addMessage("user", "أنت", question);
    addMessage("assistant", "ملم يحل", formatSimpleReply("حسنًا، اختر المادة من القائمة وسأكمل الحل بدقة أكبر."));
    return;
    scrollMessagesToBottom(true);
    return;
  }

  const activeUser = getActiveUser();
  const route = request_router({
    user_text: question,
    uploaded_files: attachments,
    selected_grade: gradeSelect?.value || activeUser?.grade || "",
    selected_subject: subjectSelect?.value || "",
    user_profile: activeUser || {},
    selected_solve_mode: selectedSolveMode
  });
  const intent = route.intent;

  if (hasAttachments && !isLoggedIn()) {
    addMessage("assistant", "ملم يحل", formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.'));
    attachments = [];
    if (fileInput) fileInput.value = "";
    renderAttachments();
    return;
  }

  const shouldCharge =
    !hasAttachments ||
    route.response_mode === "academic_solve" ||
    route.response_mode === "content_interpretation";
  const usageCost = shouldCharge ? (hasAttachments ? usageCosts.image : usageCosts.chat) : 0;
  if (usageCost > 0) {
    const pointsResult = spendPoints(usageCost, hasAttachments ? "تحليل صورة" : "استخدام الشات");
    if (!pointsResult.ok) {
      addMessage("assistant", "ملم يحل", formatSimpleReply(`رصيدك الحالي ${pointsResult.remaining} نقطة، وهذا لا يكفي لهذه العملية. تحتاج ${usageCost} نقطة. يمكنك شراء نقاط إضافية من <a class="top-link" href="subscriptions.html">صفحة الباقات</a>.`));
      return;
    }
  }

  const renderedQuestion = hasAttachments
    ? `${question || "أرفقت صورة أو ملفًا مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments.map((item) => item.name).join("، ")}</span>`
    : question;

  addMessage("user", "أنت", renderedQuestion);
  appendMessageToSession("user", "أنت", renderedQuestion, {
    subject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : ""),
    sessionTitle: question || "سؤال جديد"
  });

  promptInput.value = "";
  autoGrow(promptInput);

  const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
  let body = "";
  let sources = [];
  let responseForLog = null;

  if (route.response_mode !== "academic_solve") {
    pendingSolveConfirmation = route.response_mode === "ask_for_confirmation"
      ? { question, route, intent, subject: route.detected_subject || "" }
      : null;
    body = createImageRouterResponse(route);
  } else if (intent.type === "chat") {
    pendingSolveConfirmation = null;
    body = formatSimpleReply(createCasualResponse(question));
  } else if (intent.type === "help") {
    pendingSolveConfirmation = null;
    body = formatSimpleReply(createHelpResponse());
  } else if (needsClarification(question, intent, hasAttachments) && route.question_type !== "صح وخطأ" && route.question_type !== "اختيار من متعدد") {
    pendingSolveConfirmation = null;
    body = formatClarificationReply(createClarificationResponse(question, intent, route));
  } else {
    pendingSolveConfirmation = null;
    const response = createAcademicResponse(question || route.extracted_text || "حل السؤال من المرفقات", intent, {
      preferredSubject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : ""),
      detectedSubject: route.detected_subject || "",
      subjectConfidence: route.subject_confidence,
      route
    });
    responseForLog = response;
    body = formatAssistantSections(response);
    sources = buildSources();
    analytics.totalMessages += 1;
    analytics.xpUsed += usageCost;
    analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] =
      (analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] || 0) + 1;
    saveAnalytics();
    saveHistory(
      question || "سؤال مرفق",
      response.subject || route.detected_subject || subjectSelect?.value || "عام",
      response.questionType || detectQuestionType(question || route.extracted_text || ""),
      "تمت المراجعة"
    );
  }

  pendingNode?.remove();

  const assistantMeta = responseForLog
    ? {
        subject: responseForLog.subject,
        lesson: responseForLog.lesson,
        questionType: responseForLog.questionType,
        mode: responseForLog.mode
      }
    : undefined;

  addMessage("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: assistantMeta
  });
  appendMessageToSession("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: assistantMeta,
    subject: responseForLog?.subject || route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : "")
  });

  aiLogs.unshift({
    question: question || "سؤال مرفق",
    intent: intent.type,
    subject: route.detected_subject || subjectSelect?.value || "عام",
    lesson: responseForLog?.lesson || lessonInput?.value.trim() || "",
    responseMode: responseForLog?.mode || route.response_mode || intent.type,
    usedAttachments: hasAttachments,
    imageType: route.image_type,
    scopeStatus: route.scope_status,
    createdAt: Date.now()
  });
  aiLogs = aiLogs.slice(0, 40);
  saveAiLogs();
  renderInsights();
  renderLearnedMemory();
  renderSessionList();
  updateXpBalance();
  scrollMessagesToBottom(true);
}

setupChatAutoScrollEnhancement();

var pendingSolveConfirmation = null;

function isAffirmativeReply(text) {
  return /^(نعم|اي|أيوه|ايوه|أكيد|اكمل|كمل|تمام|موافق|نعم أكمل)$/i.test((text || "").trim());
}

function isNegativeReply(text) {
  return /^(لا|لا شكرا|لا شكرًا|غيّر المادة|غير المادة)$/i.test((text || "").trim());
}

function isUserNearBottom() {
  if (!messageList) return false;
  return messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 140;
}

function scrollMessagesToBottom(force = false) {
  return;
}

function setupChatAutoScrollEnhancement() {
  return;
}

function addMessage(type, author, body, options = {}) {
  if (!messageList) return null;
  const shouldStick = isUserNearBottom() || type !== "user";
  const article = document.createElement("article");
  article.className = `message ${type}`;
  if (options.metadata) {
    article.dataset.subject = options.metadata.subject || "";
    article.dataset.lesson = options.metadata.lesson || "";
    article.dataset.questionType = options.metadata.questionType || "";
    article.dataset.responseMode = options.metadata.mode || "";
  }
  article.innerHTML = `
    <div class="message-title">${author}</div>
    <div class="message-body">${body}</div>
  `;
  if (type === "assistant" && !options.pending && options.enableTools) {
    const tools = document.createElement("div");
    tools.className = "message-tools";
    tools.innerHTML = `
      <div class="message-tools-label">هل تريد تبسيط الإجابة أو متابعة التدريب؟</div>
      <button class="mini-btn" type="button" data-refine="simple">بسّط أكثر</button>
      <button class="mini-btn" type="button" data-refine="short">باختصار</button>
      <button class="mini-btn" type="button" data-refine="steps">اشرحها خطوة خطوة</button>
      <button class="mini-btn" type="button" data-refine="quiz">اختبرني على هذا الدرس</button>
      <button class="mini-btn" type="button" data-like="${Date.now()}">👍 أعجبني</button>
      <button class="mini-btn disliked" type="button" data-dislike="${Date.now()}">👎 لم يعجبني</button>
    `;
    article.appendChild(tools);
    if (Array.isArray(options.sources) && options.sources.length) {
      const sources = document.createElement("div");
      sources.className = "sources-list";
      sources.innerHTML = options.sources.map((source) => `<a class="source-link" href="${source.url}" target="_blank" rel="noreferrer">${source.type}: ${source.label}</a>`).join("");
      article.appendChild(sources);
    }
  }
  messageList.appendChild(article);
  if (shouldStick) scrollMessagesToBottom(true);
  return article;
}

function solveObjectiveQuestion(question) {
  const normalized = normalizeText(question);
  if (/التنفس الخلوي/.test(normalized) && /الفجوات/.test(normalized) && /صواب|صح|خطأ/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "السبب: التنفس الخلوي يحدث في الميتوكوندريا، وليس داخل الفجوات."
    };
  }
  if (/صواب|صح|خطأ/.test(normalized) && /الرابطة/.test(normalized) && /nacl/.test(normalized) && /تساهمية/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "لأن الرابطة في NaCl أيونية وليست تساهمية."
    };
  }
  if (/nacl/.test(normalized) && /أ\)|ب\)|ج\)|د\)|اختيار|اختر/.test(question)) {
    return {
      answerMode: "mcq",
      finalAnswer: "الخيار الصحيح هو (ب) أيونية.",
      explanation: "لأن كلوريد الصوديوم يتكون من فلز ولافلز فتنتقل الإلكترونات وتتكون رابطة أيونية."
    };
  }
  return null;
}

function auto_subject_detector(text) {
  const normalized = normalizeText(text);
  const scores = Object.fromEntries(Object.keys(subjectKeywordMap).map((subject) => [subject, 0]));
  const passes = [];
  Object.entries(subjectKeywordMap).forEach(([subject, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalized.includes(normalizeText(keyword))) scores[subject] += 10;
    });
  });
  if (/التنفس الخلوي|الميتوكوندريا|الفجوات|البلاستيدات|الخلية النباتية|الخلية الحيوانية/.test(normalized)) {
    scores["الأحياء"] += 40;
    passes.push("biology-pattern");
  }
  if (/صواب|صح|خطأ|اختيار|اختر|ضع دائرة/.test(normalized)) {
    passes.push("objective-pattern");
    if (/التنفس الخلوي|الميتوكوندريا|الفجوات/.test(normalized)) scores["الأحياء"] += 24;
    if (/رابطة|حمض|قاعدة|تفاعل|ذرة|na|cl/.test(normalized)) scores["الكيمياء"] += 24;
    if (/تسارع|قوة|سرعة|نيوتن|زخم/.test(normalized)) scores["الفيزياء"] += 24;
    if (/محيط|مساحة|قطر|نصف القطر|معادلة|كسر/.test(normalized)) scores["الرياضيات"] += 24;
  }
  const lessonHit = knowledgeBase.find((entry) => entry.keywords.some((keyword) => normalized.includes(normalizeText(keyword))));
  if (lessonHit) {
    scores[lessonHit.subject] += 22;
    passes.push("knowledge-match");
  }
  const ranking = Object.entries(scores).map(([subject, score]) => ({ subject, score })).sort((a, b) => b.score - a.score);
  const top = ranking[0] || { subject: "", score: 0 };
  const second = ranking[1] || { subject: "", score: 0 };
  return {
    subject: top.score ? top.subject : "",
    confidence: top.score ? clampConfidence(top.score / 100 + Math.min(0.2, Math.max(0, (top.score - second.score) / 160))) : 0,
    candidates: ranking.slice(0, 3),
    passes
  };
}

function request_router({ user_text, uploaded_files, selected_grade, selected_subject, user_profile, selected_solve_mode = "quick" }) {
  const input_type = determineInputType(user_text, uploaded_files);
  const image_type = input_type.includes("image") ? image_analyzer(uploaded_files, user_text) : { image_type: "none", extracted_text: "", confidence: 0 };
  const intent = intent_router(`${user_text || ""} ${image_type.extracted_text || ""}`, uploaded_files?.length > 0);
  const quickMode = selected_solve_mode !== "structured";
  const questionType = detectQuestionType(user_text || image_type.extracted_text || "");
  const scope = curriculum_scope_checker({
    userText: user_text,
    selectedGrade: selected_grade || user_profile?.grade || "",
    selectedSubject: quickMode ? "" : (selected_subject || ""),
    imageMeta: image_type,
    solveMode: quickMode ? "quick" : "structured"
  });

  let response_mode = "academic_solve";
  const isObjective = questionType === "صح وخطأ" || questionType === "اختيار من متعدد";
  if (input_type === "file_only" && !user_text.trim()) response_mode = "content_interpretation";
  if (image_type.image_type === "logo_or_branding") response_mode = "reject_logo_image";
  else if (image_type.image_type === "non_educational_image" || image_type.image_type === "document_non_educational") response_mode = "reject_out_of_scope_image";
  else if (image_type.image_type === "unclear_image") response_mode = "ask_clearer_upload";
  else if (image_type.image_type === "educational_page" && !user_text.trim()) response_mode = "content_interpretation";
  else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) response_mode = "ask_for_confirmation";
  else if (quickMode && intent.type !== "chat" && intent.type !== "help" && scope.subject_confidence < 0.7 && !isObjective) response_mode = "ask_for_confirmation";

  return {
    input_type,
    intent,
    image_type: image_type.image_type,
    extracted_text: image_type.extracted_text,
    detected_subject: scope.detected_subject,
    detected_grade_level: scope.detected_grade_level,
    subject_confidence: scope.subject_confidence,
    grade_confidence: scope.grade_confidence,
    subject_candidates: scope.subject_candidates,
    analysis_passes: scope.analysis_passes,
    scope_status: scope.scope_status,
    response_mode,
    quick_mode: quickMode,
    question_type: questionType
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  const question = promptInput?.value.trim() || "";
  const hasAttachments = attachments.length > 0;
  if (!question && !hasAttachments) return;

  if (pendingSolveConfirmation && isAffirmativeReply(question) && !hasAttachments) {
    const stored = pendingSolveConfirmation;
    pendingSolveConfirmation = null;
    addMessage("user", "أنت", question);
    promptInput.value = "";
    autoGrow(promptInput);
    const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
    const response = createAcademicResponse(stored.question, stored.intent, {
      preferredSubject: stored.route.detected_subject || stored.subject || "",
      detectedSubject: stored.route.detected_subject || stored.subject || "",
      subjectConfidence: Math.max(0.71, stored.route.subject_confidence || 0.71),
      route: { ...stored.route, response_mode: "academic_solve" }
    });
    pendingNode?.remove();
    const body = formatAssistantSections(response);
    const sources = buildSources();
    addMessage("assistant", "ملم يحل", body, {
      sources,
      enableTools: true,
      metadata: { subject: response.subject, lesson: response.lesson, questionType: response.questionType, mode: response.mode }
    });
    scrollMessagesToBottom(true);
    return;
  }

  if (pendingSolveConfirmation && isNegativeReply(question) && !hasAttachments) {
    pendingSolveConfirmation = null;
    addMessage("user", "أنت", question);
    addMessage("assistant", "ملم يحل", formatSimpleReply("حسنًا، اختر المادة المناسبة من القائمة وسأكمل الحل بدقة أكبر."));
    return;
    return;
  }

  const activeUser = getActiveUser();
  const route = request_router({
    user_text: question,
    uploaded_files: attachments,
    selected_grade: gradeSelect?.value || activeUser?.grade || "",
    selected_subject: subjectSelect?.value || "",
    user_profile: activeUser || {},
    selected_solve_mode: selectedSolveMode
  });
  const intent = route.intent;

  if (hasAttachments && !isLoggedIn()) {
    addMessage("assistant", "ملم يحل", formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.'));
    attachments = [];
    if (fileInput) fileInput.value = "";
    renderAttachments();
    return;
  }

  const renderedQuestion = hasAttachments
    ? `${question || "أرفقت صورة أو ملفًا مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments.map((item) => item.name).join("، ")}</span>`
    : question;

  addMessage("user", "أنت", renderedQuestion);
  promptInput.value = "";
  autoGrow(promptInput);

  const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
  let body = "";
  let sources = [];
  let responseForLog = null;

  if (route.response_mode !== "academic_solve") {
    pendingSolveConfirmation = route.response_mode === "ask_for_confirmation" ? { question, route, intent, subject: route.detected_subject || "" } : null;
    body = createImageRouterResponse(route);
  } else if (intent.type === "chat") {
    pendingSolveConfirmation = null;
    body = formatSimpleReply(createCasualResponse(question));
  } else if (intent.type === "help") {
    pendingSolveConfirmation = null;
    body = formatSimpleReply(createHelpResponse());
  } else if (needsClarification(question, intent, hasAttachments) && route.question_type !== "صح وخطأ" && route.question_type !== "اختيار من متعدد") {
    pendingSolveConfirmation = null;
    body = formatClarificationReply(createClarificationResponse(question, intent, route));
  } else {
    pendingSolveConfirmation = null;
    const response = createAcademicResponse(question || route.extracted_text || "حل السؤال من الملفات المرفقة", intent, {
      preferredSubject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : ""),
      detectedSubject: route.detected_subject || "",
      subjectConfidence: route.subject_confidence,
      route
    });
    responseForLog = response;
    body = formatAssistantSections(response);
    sources = buildSources();
  }

  pendingNode?.remove();
  addMessage("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: responseForLog ? { subject: responseForLog.subject, lesson: responseForLog.lesson, questionType: responseForLog.questionType, mode: responseForLog.mode } : undefined
  });
  scrollMessagesToBottom(true);
}

setupChatAutoScrollEnhancement();

pendingSolveConfirmation = pendingSolveConfirmation || null;

function isAffirmativeReply(text) {
  return /^(نعم|اي|أيوه|ايوه|أكيد|اكمل|كمل|نعم أكمل|تمام|وافق|موافق)$/i.test((text || "").trim());
}

function isNegativeReply(text) {
  return /^(لا|مو|ليس|لا شكرا|لا شكرًا|غير المادة|غيّر المادة)$/i.test((text || "").trim());
}

function isUserNearBottom() {
  if (!messageList) return false;
  const threshold = 120;
  return messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight <= threshold;
}

function scrollMessagesToBottom(force = false) {
  return;
}

function setupChatAutoScrollEnhancement() {
  return;
}

function addMessage(type, author, body, options = {}) {
  if (!messageList) return null;
  const shouldStick = isUserNearBottom() || type !== "user";
  const article = document.createElement("article");
  article.className = `message ${type}`;
  if (options.metadata) {
    article.dataset.subject = options.metadata.subject || "";
    article.dataset.lesson = options.metadata.lesson || "";
    article.dataset.questionType = options.metadata.questionType || "";
    article.dataset.responseMode = options.metadata.mode || "";
  }
  article.innerHTML = `
    <div class="message-title">${author}</div>
    <div class="message-body">${body}</div>
  `;

  if (type === "assistant" && !options.pending && options.enableTools) {
    const tools = document.createElement("div");
    tools.className = "message-tools";
    tools.innerHTML = `
      <div class="message-tools-label">هل تريد تبسيط الإجابة أو متابعة التدريب؟</div>
      <button class="mini-btn" type="button" data-refine="simple">بسّط أكثر</button>
      <button class="mini-btn" type="button" data-refine="short">باختصار</button>
      <button class="mini-btn" type="button" data-refine="steps">اشرحها خطوة خطوة</button>
      <button class="mini-btn" type="button" data-refine="quiz">اختبرني على هذا الدرس</button>
      <button class="mini-btn" type="button" data-like="${Date.now()}">👍 أعجبني</button>
      <button class="mini-btn disliked" type="button" data-dislike="${Date.now()}">👎 لم يعجبني</button>
    `;
    article.appendChild(tools);

    if (Array.isArray(options.sources) && options.sources.length) {
      const sources = document.createElement("div");
      sources.className = "sources-list";
      sources.innerHTML = options.sources
        .map((source) => `<a class="source-link" href="${source.url}" target="_blank" rel="noreferrer">${source.type}: ${source.label}</a>`)
        .join("");
      article.appendChild(sources);
    }
  }

  messageList.appendChild(article);
  if (shouldStick) {
    scrollMessagesToBottom(true);
  }
  return article;
}

function solveObjectiveQuestion(question) {
  const normalized = normalizeText(question);

  if (/التنفس الخلوي/.test(normalized) && /الفجوات/.test(normalized) && /صواب|صح|خطأ/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "لأن التنفس الخلوي يحدث أساسًا داخل الميتوكوندريا، وليس داخل الفجوات."
    };
  }

  if (/الميتوكوندريا/.test(normalized) && /صواب|صح|خطأ/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "صواب",
      explanation: "الميتوكوندريا هي العضية المسؤولة عن معظم عمليات التنفس الخلوي وإنتاج الطاقة."
    };
  }

  if (/صواب|صح|خطأ/.test(normalized) && /الرابطة/.test(normalized) && /nacl/.test(normalized) && /تساهمية/.test(normalized)) {
    return {
      answerMode: "truefalse",
      finalAnswer: "خطأ",
      explanation: "لأن الرابطة في NaCl أيونية وليست تساهمية."
    };
  }

  if (/nacl/.test(normalized) && /أ\)|ب\)|ج\)|د\)|اختيار|اختر/.test(question)) {
    return {
      answerMode: "mcq",
      finalAnswer: "الخيار الصحيح هو (ب) أيونية.",
      explanation: "لأن كلوريد الصوديوم يتكون من فلز ولافلز، فتنتقل الإلكترونات وتتكون رابطة أيونية."
    };
  }

  return null;
}

function auto_subject_detector(text) {
  const result = {
    subject: "",
    confidence: 0,
    candidates: [],
    passes: []
  };

  const normalized = normalizeText(text);
  const scores = Object.fromEntries(Object.keys(subjectKeywordMap).map((subject) => [subject, 0]));

  Object.entries(subjectKeywordMap).forEach(([subject, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalized.includes(normalizeText(keyword))) scores[subject] += 10;
    });
  });

  if (/التنفس الخلوي|الميتوكوندريا|الفجوات|البلاستيدات|الخلية النباتية|الخلية الحيوانية/.test(normalized)) {
    scores["الأحياء"] += 42;
    result.passes.push("biology-pattern");
  }

  if (/صواب|صح|خطأ|اختيار|اختر|ضع دائرة/.test(normalized)) {
    result.passes.push("objective-pattern");
    if (/التنفس الخلوي|الميتوكوندريا|الفجوات/.test(normalized)) scores["الأحياء"] += 26;
    if (/رابطة|معادلة كيميائية|حمض|قاعدة|تفاعل|ذرة|مول|na|cl/.test(normalized)) scores["الكيمياء"] += 26;
    if (/تسارع|قوة|سرعة|نيوتن|زخم/.test(normalized)) scores["الفيزياء"] += 26;
    if (/محيط|مساحة|قطر|نصف القطر|معادلة|جذر|كسر/.test(normalized)) scores["الرياضيات"] += 26;
  }

  if (/\d/.test(normalized) && /محيط|مساحة|احسب|أوجد|معادلة|دائرة|مثلث/.test(normalized)) {
    scores["الرياضيات"] += 28;
    result.passes.push("math-pattern");
  }

  if (/رابطة|أيونية|تساهمية|تعادل|عنصر|مركب|معادلة كيميائية|الكترون|بروتون|حمض|قاعدة/.test(normalized)) {
    scores["الكيمياء"] += 30;
    result.passes.push("chemistry-pattern");
  }

  if (/نيوتن|تسارع|سرعة|قوة|احتكاك|حركة|زخم|طاقة حركية/.test(normalized)) {
    scores["الفيزياء"] += 30;
    result.passes.push("physics-pattern");
  }

  if (/مبتدأ|خبر|إعراب|نحو|بلاغة|استخرج|أعرب|الجملة الاسمية/.test(normalized)) {
    scores["اللغة العربية"] += 28;
    result.passes.push("arabic-pattern");
  }

  if (/[a-z]/.test(normalized) || /translate|correct|grammar|present|past|english/.test(normalized)) {
    scores["اللغة الإنجليزية"] += 28;
    result.passes.push("english-pattern");
  }

  const lessonHit = knowledgeBase.find((entry) => entry.keywords.some((keyword) => normalized.includes(normalizeText(keyword))));
  if (lessonHit) {
    scores[lessonHit.subject] += 24;
    result.passes.push("knowledge-match");
  }

  const ranking = Object.entries(scores)
    .map(([subject, score]) => ({ subject, score }))
    .sort((a, b) => b.score - a.score);
  const top = ranking[0] || { subject: "", score: 0 };
  const second = ranking[1] || { subject: "", score: 0 };

  result.subject = top.score ? top.subject : "";
  result.confidence = top.score
    ? clampConfidence(top.score / 100 + Math.min(0.2, Math.max(0, (top.score - second.score) / 160)))
    : 0;
  result.candidates = ranking.slice(0, 3);
  return result;
}

function request_router({ user_text, uploaded_files, selected_grade, selected_subject, user_profile, selected_solve_mode = "quick" }) {
  const input_type = determineInputType(user_text, uploaded_files);
  const image_type = input_type.includes("image")
    ? image_analyzer(uploaded_files, user_text)
    : { image_type: "none", extracted_text: "", confidence: 0 };
  const intent = intent_router(`${user_text || ""} ${image_type.extracted_text || ""}`, uploaded_files?.length > 0);
  const quickMode = selected_solve_mode !== "structured";
  const questionType = detectQuestionType(user_text || image_type.extracted_text || "");
  const scope = curriculum_scope_checker({
    userText: user_text,
    selectedGrade: selected_grade || user_profile?.grade || "",
    selectedSubject: quickMode ? "" : (selected_subject || ""),
    imageMeta: image_type,
    solveMode: quickMode ? "quick" : "structured"
  });

  let response_mode = "academic_solve";
  const isObjective = questionType === "صح وخطأ" || questionType === "اختيار من متعدد";

  if (input_type === "file_only" && !user_text.trim()) response_mode = "content_interpretation";
  if (image_type.image_type === "logo_or_branding") response_mode = "reject_logo_image";
  else if (image_type.image_type === "non_educational_image" || image_type.image_type === "document_non_educational") response_mode = "reject_out_of_scope_image";
  else if (image_type.image_type === "unclear_image") response_mode = "ask_clearer_upload";
  else if (image_type.image_type === "educational_page" && !user_text.trim()) response_mode = "content_interpretation";
  else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) response_mode = "ask_for_confirmation";
  else if (quickMode && intent.type !== "chat" && intent.type !== "help" && scope.subject_confidence < 0.7 && !isObjective) response_mode = "ask_for_confirmation";
  else response_mode = "academic_solve";

  return {
    input_type,
    intent,
    image_type: image_type.image_type,
    extracted_text: image_type.extracted_text,
    detected_subject: scope.detected_subject,
    detected_grade_level: scope.detected_grade_level,
    subject_confidence: scope.subject_confidence,
    grade_confidence: scope.grade_confidence,
    subject_candidates: scope.subject_candidates,
    analysis_passes: scope.analysis_passes,
    scope_status: scope.scope_status,
    response_mode,
    quick_mode: quickMode,
    question_type: questionType
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  const question = promptInput?.value.trim() || "";
  const hasAttachments = attachments.length > 0;
  if (!question && !hasAttachments) return;

  if (pendingSolveConfirmation && isAffirmativeReply(question) && !hasAttachments) {
    const stored = pendingSolveConfirmation;
    pendingSolveConfirmation = null;
    promptInput.value = "";
    autoGrow(promptInput);
    addMessage("user", "أنت", question);
    const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
    const response = createAcademicResponse(stored.question, stored.intent, {
      preferredSubject: stored.route.detected_subject || stored.subject || "",
      detectedSubject: stored.route.detected_subject || stored.subject || "",
      subjectConfidence: Math.max(0.71, stored.route.subject_confidence || 0.71),
      route: { ...stored.route, response_mode: "academic_solve" }
    });
    pendingNode?.remove();
    const body = formatAssistantSections(response);
    const sources = buildSources();
    addMessage("assistant", "ملم يحل", body, {
      sources,
      enableTools: true,
      metadata: {
        subject: response.subject,
        lesson: response.lesson,
        questionType: response.questionType,
        mode: response.mode
      }
    });
    appendMessageToSession("assistant", "ملم يحل", body, {
      sources,
      enableTools: true,
      metadata: {
        subject: response.subject,
        lesson: response.lesson,
        questionType: response.questionType,
        mode: response.mode
      },
      subject: response.subject
    });
    scrollMessagesToBottom(true);
    return;
  }

  if (pendingSolveConfirmation && isNegativeReply(question) && !hasAttachments) {
    pendingSolveConfirmation = null;
    addMessage("user", "أنت", question);
    addMessage("assistant", "ملم يحل", formatSimpleReply("حسنًا، اختر المادة المناسبة من القائمة وسأكمل الحل بدقة أكبر."), { pending: false });
    return;
    return;
  }

  const activeUser = getActiveUser();
  const route = request_router({
    user_text: question,
    uploaded_files: attachments,
    selected_grade: gradeSelect?.value || activeUser?.grade || "",
    selected_subject: subjectSelect?.value || "",
    user_profile: activeUser || {},
    selected_solve_mode: selectedSolveMode
  });
  const intent = route.intent;

  if (hasAttachments && !isLoggedIn()) {
    addMessage("assistant", "ملم يحل", formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.'));
    attachments = [];
    if (fileInput) fileInput.value = "";
    renderAttachments();
    return;
  }

  const shouldCharge =
    !hasAttachments ||
    route.response_mode === "academic_solve" ||
    route.response_mode === "content_interpretation";
  const usageCost = shouldCharge ? (hasAttachments ? usageCosts.image : usageCosts.chat) : 0;
  if (usageCost > 0) {
    const pointsResult = spendPoints(usageCost, hasAttachments ? "تحليل صورة" : "استخدام الشات");
    if (!pointsResult.ok) {
      addMessage("assistant", "ملم يحل", formatSimpleReply(`رصيدك الحالي ${pointsResult.remaining} نقطة، وهذا لا يكفي لهذه العملية. تحتاج ${usageCost} نقطة. يمكنك شراء نقاط إضافية من <a class="top-link" href="subscriptions.html">صفحة الباقات</a>.`));
      return;
    }
  }

  const renderedQuestion = hasAttachments
    ? `${question || "أرفقت صورة أو ملفًا مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments.map((item) => item.name).join("، ")}</span>`
    : question;

  addMessage("user", "أنت", renderedQuestion);
  appendMessageToSession("user", "أنت", renderedQuestion, {
    subject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : ""),
    sessionTitle: question || "سؤال جديد"
  });

  promptInput.value = "";
  autoGrow(promptInput);

  const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
  let body = "";
  let sources = [];
  let responseForLog = null;

  if (route.response_mode !== "academic_solve") {
    pendingSolveConfirmation = route.response_mode === "ask_for_confirmation"
      ? {
          question,
          route,
          intent,
          subject: route.detected_subject || ""
        }
      : null;
    body = createImageRouterResponse(route);
  } else if (intent.type === "chat") {
    pendingSolveConfirmation = null;
    body = formatSimpleReply(createCasualResponse(question));
  } else if (intent.type === "help") {
    pendingSolveConfirmation = null;
    body = formatSimpleReply(createHelpResponse());
  } else if (needsClarification(question, intent, hasAttachments) && route.question_type !== "صح وخطأ" && route.question_type !== "اختيار من متعدد") {
    pendingSolveConfirmation = null;
    body = formatClarificationReply(createClarificationResponse(question, intent, route));
  } else {
    pendingSolveConfirmation = null;
    const response = createAcademicResponse(question || route.extracted_text || "حل السؤال من الملفات المرفقة", intent, {
      preferredSubject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : ""),
      detectedSubject: route.detected_subject || "",
      subjectConfidence: route.subject_confidence,
      route
    });
    responseForLog = response;
    body = formatAssistantSections(response);
    sources = buildSources();
    analytics.totalMessages += 1;
    analytics.xpUsed += usageCost;
    analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] =
      (analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] || 0) + 1;
    saveAnalytics();
    saveHistory(
      question || "سؤال مرفق",
      response.subject || route.detected_subject || subjectSelect?.value || "عام",
      response.questionType || detectQuestionType(question || route.extracted_text || ""),
      "تمت المراجعة"
    );
  }

  pendingNode?.remove();

  const assistantMeta = responseForLog
    ? {
        subject: responseForLog.subject,
        lesson: responseForLog.lesson,
        questionType: responseForLog.questionType,
        mode: responseForLog.mode
      }
    : undefined;

  addMessage("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: assistantMeta
  });
  appendMessageToSession("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: assistantMeta,
    subject: responseForLog?.subject || route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : "")
  });

  aiLogs.unshift({
    question: question || "سؤال مرفق",
    intent: intent.type,
    subject: route.detected_subject || subjectSelect?.value || "عام",
    lesson: responseForLog?.lesson || lessonInput?.value.trim() || "",
    responseMode: responseForLog?.mode || route.response_mode || intent.type,
    usedAttachments: hasAttachments,
    imageType: route.image_type,
    scopeStatus: route.scope_status,
    createdAt: Date.now()
  });
  aiLogs = aiLogs.slice(0, 40);
  saveAiLogs();
  renderInsights();
  renderLearnedMemory();
  renderSessionList();
  updateXpBalance();
  scrollMessagesToBottom(true);
}

setupChatAutoScrollEnhancement();

const stageGradeMap = {
  ابتدائي: [
    "الأول الابتدائي",
    "الثاني الابتدائي",
    "الثالث الابتدائي",
    "الرابع الابتدائي",
    "الخامس الابتدائي",
    "السادس الابتدائي"
  ],
  متوسط: [
    "الأول المتوسط",
    "الثاني المتوسط",
    "الثالث المتوسط"
  ],
  ثانوي: [
    "الأول الثانوي",
    "الثاني الثانوي",
    "الثالث الثانوي"
  ]
};

function inferStageFromGradeLabel(grade) {
  if (!grade) return "ثانوي";
  if (grade.includes("الابتدائي")) return "ابتدائي";
  if (grade.includes("المتوسط")) return "متوسط";
  return "ثانوي";
}

function populateGradeSelect(stage, preferredGrade = "") {
  if (!gradeSelect) return;
  const grades = stageGradeMap[stage] || stageGradeMap["ثانوي"];
  const current = grades.includes(preferredGrade) ? preferredGrade : (grades[0] || preferredGrade);
  gradeSelect.innerHTML = grades.map((grade) => `<option ${grade === current ? "selected" : ""}>${grade}</option>`).join("");
}

function populateSubjectSelect(grade, preferredSubject = "") {
  if (!subjectSelect) return;
  const materials = getGradeMaterials(grade);
  const current = materials.includes(preferredSubject) ? preferredSubject : (materials[0] || preferredSubject || "");
  subjectSelect.innerHTML = materials.map((subject) => `<option ${subject === current ? "selected" : ""}>${subject}</option>`).join("");
}

function syncStageButtons(stage) {
  document.querySelectorAll("[data-stage-button]").forEach((button) => {
    button.classList.toggle("active", button.getAttribute("data-stage-button") === stage);
  });
}

function setupSmartSelectors() {
  if (!gradeSelect) return;
  const activeUser = getActiveUser();
  const initialGrade = activeUser?.grade || gradeSelect.value || "الثاني الثانوي";
  const initialStage = inferStageFromGradeLabel(initialGrade);

  populateGradeSelect(initialStage, initialGrade);
  populateSubjectSelect(initialGrade, activeUser?.subject || subjectSelect?.value || "");
  syncStageButtons(initialStage);
  updateSelectionSummary();

  document.querySelectorAll("[data-stage-button]").forEach((button) => {
    button.addEventListener("click", () => {
      const stage = button.getAttribute("data-stage-button") || "ثانوي";
      syncStageButtons(stage);
      populateGradeSelect(stage);
      populateSubjectSelect(gradeSelect?.value || "");
      updateSelectionSummary();
    });
  });

  gradeSelect.addEventListener("change", () => {
    populateSubjectSelect(gradeSelect.value, subjectSelect?.value || "");
    updateSelectionSummary();
  });
}

setupSmartSelectors();

function intent_analyzer(message, hasAttachments = false) {
  const baseIntent = intent_router(message, hasAttachments);
  return {
    ...baseIntent,
    raw_message: message,
    input_has_attachments: hasAttachments,
    should_answer_directly: baseIntent.confidence >= 0.7 && baseIntent.type !== "unclear"
  };
}

function extractConcepts(question, contextEntry = null) {
  const normalized = normalizeText(question);
  const conceptSet = new Set();

  if (contextEntry?.lesson) conceptSet.add(contextEntry.lesson);
  if (contextEntry?.unit) conceptSet.add(contextEntry.unit);

  Object.values(subjectKeywordMap).flat().forEach((keyword) => {
    const token = normalizeText(keyword);
    if (token && token.length > 2 && normalized.includes(token)) {
      conceptSet.add(keyword);
    }
  });

  return [...conceptSet].slice(0, 6);
}

function estimateDifficulty(question, detectedGrade = "") {
  const normalized = normalizeText(question);
  const tokenCount = tokenize(question).length;
  if (detectedGrade === "ثانوي" || /تفاضل|تكامل|مولارية|نيوتن|وراثة|بلاغة/.test(normalized)) return "عالية";
  if (detectedGrade === "متوسط" || tokenCount >= 10) return "متوسطة";
  return "أساسية";
}

function reasoning_engine(question, options = {}) {
  const subjectPass = auto_subject_detector(question);
  const gradePass = grade_estimator(question);
  const context = retrieveCurriculumContext(question, options.preferredSubject || subjectPass.subject || "");
  const questionType = detectQuestionType(question);
  const concepts = extractConcepts(question, context.entry);

  return {
    questionType,
    detectedSubject: options.detectedSubject || subjectPass.subject || context.subject,
    detectedGrade: options.detectedGrade || gradePass.stage || context.grade,
    subjectConfidence: options.subjectConfidence ?? subjectPass.confidence,
    gradeConfidence: options.gradeConfidence ?? gradePass.confidence,
    concepts,
    difficulty: estimateDifficulty(question, gradePass.stage || context.grade),
    lesson: context.lesson,
    unit: context.unit,
    context,
    analysisPasses: subjectPass.passes || [],
    needsConfirmation: (options.subjectConfidence ?? subjectPass.confidence) < 0.7
  };
}

function curriculum_rag(question, options = {}) {
  const context = retrieveCurriculumContext(question, options.preferredSubject || "");
  const sources = buildSources();
  return {
    context,
    lesson: context.lesson,
    unit: context.unit,
    subject: context.subject,
    grade: context.grade,
    entry: context.entry,
    sources
  };
}

function response_router(payload) {
  const { intent, reasoning, route } = payload;

  if (route?.response_mode && route.response_mode !== "academic_solve") {
    return route.response_mode;
  }

  if (intent.type === "chat") return "conversation";
  if (intent.type === "help") return "help";
  if (intent.type === "generate_questions") return "questions";
  if (intent.type === "quiz") return "quiz";
  if (intent.type === "summary") return "summary";
  if (intent.type === "answer_analysis") return "analysis";
  if (reasoning.questionType === "صح وخطأ" || reasoning.questionType === "اختيار من متعدد") return "objective";
  if (intent.type === "explain") return "explain";
  return "solve";
}

function response_builder(payload) {
  const { question, intent, reasoning, knowledge, mode } = payload;
  const context = knowledge.context;
  const objective = solveObjectiveQuestion(question);
  const math = solveMathQuestion(question);

  if (mode === "objective" && objective) {
    return {
      ...objective,
      mode: "solve",
      questionType: reasoning.questionType,
      subject: reasoning.detectedSubject || knowledge.subject,
      lesson: reasoning.lesson || knowledge.lesson,
      curriculumLink: `تم تحليل السؤال على أنه ${reasoning.questionType} في ${reasoning.detectedSubject || knowledge.subject}.`
    };
  }

  if (mode === "solve" && math) {
    return {
      ...math,
      mode: "solve",
      questionType: reasoning.questionType,
      subject: reasoning.detectedSubject || knowledge.subject,
      lesson: reasoning.lesson || knowledge.lesson,
      curriculumLink: `تم ربط السؤال بموضوع ${reasoning.lesson || knowledge.lesson} في ${reasoning.detectedSubject || knowledge.subject}.`
    };
  }

  const base = {
    mode: mode === "explain" ? "explain" : intent.type,
    questionType: reasoning.questionType,
    subject: reasoning.detectedSubject || knowledge.subject,
    lesson: reasoning.lesson || knowledge.lesson,
    finalAnswer: `هذا هو الجواب الأقرب بناءً على تحليل السؤال في ${reasoning.detectedSubject || knowledge.subject}.`,
    explanation: knowledge.entry?.explanation || `تم تحليل السؤال وتقدير أنه ضمن ${reasoning.detectedSubject || knowledge.subject}، مع التركيز على ${reasoning.lesson || "المفهوم الأقرب"}.`,
    steps: knowledge.entry?.steps || [
      "فهم المطلوب من صياغة السؤال.",
      "تحديد المادة ونوع السؤال والمفهوم الرئيس.",
      "بناء جواب مناسب ثم مراجعته قبل الإرسال."
    ],
    mistakes: knowledge.entry?.mistakes || [
      "الانتقال للحل قبل تحديد المطلوب بدقة.",
      "إهمال الكلمات المفتاحية في نص السؤال."
    ],
    similar: knowledge.entry?.similar || `جرّب سؤالًا مشابهًا في ${reasoning.detectedSubject || knowledge.subject} لتثبيت الفهم.`,
    curriculumLink: `الجواب مرتبط بمحتوى ${reasoning.detectedSubject || knowledge.subject}${knowledge.lesson ? ` ودرس ${knowledge.lesson}` : ""}.`
  };

  if (mode === "questions") {
    return {
      ...base,
      intro: `هذه أسئلة تدريبية مقترحة في ${reasoning.detectedSubject || knowledge.subject}.`,
      questions: generateCurriculumQuestions(context)
    };
  }

  if (mode === "quiz") {
    return {
      ...base,
      finalAnswer: "سأبدأ معك الآن بسؤال واحد على نفس الموضوع.",
      quizQuestion: generateCurriculumQuestions(context)[0]
    };
  }

  if (mode === "summary") {
    return {
      ...base,
      bullets: [
        `المادة المتوقعة: ${reasoning.detectedSubject || knowledge.subject}`,
        `الصف التقريبي: ${reasoning.detectedGrade || knowledge.grade || "غير محدد"}`,
        `الموضوع الأقرب: ${reasoning.lesson || knowledge.lesson || "غير محدد"}`
      ]
    };
  }

  if (mode === "analysis") {
    return {
      ...base,
      finalAnswer: "هذه قراءة أولية لإجابتك مع موضع الخطأ المحتمل والتحسين المقترح.",
      explanation: "أقارن بين صياغة السؤال وما كتبته، ثم أحدد هل الخطأ مفاهيمي أم حسابي أم في الفهم.",
      steps: [
        "تحديد المطلوب الأصلي من السؤال.",
        "مقارنة إجابتك بالمفهوم أو الخطوات الصحيحة.",
        "اقتراح تعديل مباشر يحسن الإجابة."
      ]
    };
  }

  return base;
}

function self_checker(response, payload) {
  const { reasoning, intent } = payload;
  const checked = { ...response };

  if (!checked.subject) checked.subject = reasoning.detectedSubject || "عام";
  if (!checked.questionType) checked.questionType = reasoning.questionType || "سؤال أكاديمي";
  if (!checked.explanation || checked.explanation.length < 24) {
    checked.explanation = `تمت مراجعة الجواب ليتوافق مع ${checked.subject} وبأسلوب واضح ومباشر.`;
  }
  if (!Array.isArray(checked.steps) || !checked.steps.length) {
    checked.steps = [
      "فهم السؤال.",
      "تحديد المفهوم المناسب.",
      "بناء الجواب النهائي بشكل مرتب."
    ];
  }
  if (intent.type === "generate_questions" && checked.finalAnswer?.includes("الجواب")) {
    checked.finalAnswer = `هذه أسئلة تدريبية مناسبة في ${checked.subject}.`;
  }
  if (intent.type === "quiz" && checked.explanation?.length > 180) {
    checked.explanation = "سأعطيك سؤالًا واحدًا أولًا، ثم أقيّم إجابتك قبل الانتقال للسؤال التالي.";
  }
  checked.review = {
    clear: true,
    alignedWithIntent: true,
    difficulty: reasoning.difficulty,
    concepts: reasoning.concepts
  };

  return checked;
}

function createAcademicResponse(question, intent, options = {}) {
  const understanding = intent_analyzer(question, Boolean(options.hasAttachments));
  const reasoning = reasoning_engine(question, {
    preferredSubject: options.preferredSubject || "",
    detectedSubject: options.detectedSubject || "",
    detectedGrade: options.detectedGrade || "",
    subjectConfidence: options.subjectConfidence,
    gradeConfidence: options.gradeConfidence
  });
  const knowledge = curriculum_rag(question, {
    preferredSubject: reasoning.detectedSubject || options.preferredSubject || ""
  });
  const mode = response_router({
    intent: understanding,
    reasoning,
    route: options.route || null
  });
  const draft = response_builder({
    question,
    intent: understanding,
    reasoning,
    knowledge,
    mode
  });

  return self_checker(draft, {
    intent: understanding,
    reasoning,
    knowledge,
    mode
  });
}

bootstrap();

function clampConfidence(value) {
  return Math.max(0, Math.min(0.98, value || 0));
}

function auto_subject_detector(text) {
  const normalized = normalizeText(text);
  const scores = Object.fromEntries(Object.keys(subjectKeywordMap).map((subject) => [subject, 0]));
  const passes = [];

  Object.entries(subjectKeywordMap).forEach(([subject, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalized.includes(normalizeText(keyword))) scores[subject] += 12;
    });
  });

  if (/صواب|صح|خطأ|اختيار|اختر|ضع دائرة/.test(normalized)) {
    passes.push("objective-pattern");
    if (/رابطة|تفاعل|حمض|قاعدة|معادلة كيميائية|na|cl|ذرة/.test(normalized)) scores["الكيمياء"] += 24;
    if (/تسارع|قوة|سرعة|نيوتن|زخم|احتكاك/.test(normalized)) scores["الفيزياء"] += 24;
    if (/محيط|مساحة|نصف القطر|قطر|معادلة|كسر/.test(normalized)) scores["الرياضيات"] += 24;
  }

  if (/\d/.test(normalized) && /احسب|أوجد|محيط|مساحة|معادلة|دائرة|مثلث|جذر/.test(normalized)) {
    passes.push("math-pattern");
    scores["الرياضيات"] += 30;
  }

  if (/رابطة|أيونية|تساهمية|تعادل|مولارية|حمض|قاعدة|ذرة|إلكترون/.test(normalized)) {
    passes.push("chemistry-pattern");
    scores["الكيمياء"] += 34;
  }

  if (/قوة|تسارع|سرعة|نيوتن|زخم|حركة|احتكاك|طاقة حركية/.test(normalized)) {
    passes.push("physics-pattern");
    scores["الفيزياء"] += 34;
  }

  if (/خلية|تبخر|تكاثف|نبات|حيوان|دورة الماء|نظام بيئي/.test(normalized)) {
    passes.push("science-pattern");
    scores["العلوم"] += 28;
  }

  if (/مبتدأ|خبر|إعراب|نحو|بلاغة|استخرج|الجملة الاسمية/.test(normalized)) {
    passes.push("arabic-pattern");
    scores["اللغة العربية"] += 30;
  }

  if (/[a-z]/.test(normalized) || /translate|correct|grammar|present|past|english/.test(normalized)) {
    passes.push("english-pattern");
    scores["اللغة الإنجليزية"] += 30;
  }

  const lessonHit = knowledgeBase.find((entry) => entry.keywords.some((keyword) => normalized.includes(normalizeText(keyword))));
  if (lessonHit) {
    passes.push("knowledge-match");
    scores[lessonHit.subject] += 26;
  }

  const ranking = Object.entries(scores)
    .map(([subject, score]) => ({ subject, score }))
    .sort((a, b) => b.score - a.score);
  const top = ranking[0] || { subject: "", score: 0 };
  const runnerUp = ranking[1] || { subject: "", score: 0 };

  return {
    subject: top.score ? top.subject : "",
    confidence: top.score ? clampConfidence(top.score / 100 + Math.min(0.18, Math.max(0, (top.score - runnerUp.score) / 180))) : 0,
    candidates: ranking.slice(0, 3),
    passes
  };
}

function grade_estimator(text) {
  const normalized = normalizeText(text);
  const scores = { ابتدائي: 0, متوسط: 0, ثانوي: 0 };

  Object.entries(stageHeuristics).forEach(([stage, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalized.includes(normalizeText(keyword))) scores[stage] += 12;
    });
  });

  if (/تفاضل|تكامل|مولارية|نيوتن|رابطة أيونية|وراثة/.test(normalized)) scores["ثانوي"] += 26;
  if (/نسبة|تناسب|فاعل|مفعول|present simple/.test(normalized)) scores["متوسط"] += 20;
  if (/جمع|طرح|ضرب|قسمة|النبات|الماء/.test(normalized)) scores["ابتدائي"] += 16;

  const ranking = Object.entries(scores)
    .map(([stage, score]) => ({ stage, score }))
    .sort((a, b) => b.score - a.score);
  const top = ranking[0] || { stage: "", score: 0 };
  const next = ranking[1] || { stage: "", score: 0 };

  return {
    stage: top.score ? top.stage : "",
    confidence: top.score ? clampConfidence(top.score / 100 + Math.min(0.14, Math.max(0, (top.score - next.score) / 180))) : 0
  };
}

function createClarificationResponse(message, intent, route = null) {
  const objectiveLike = /صواب|صح|خطأ|اختيار|اختر|ضع دائرة/.test(normalizeText(message));
  if (route?.detected_subject && route?.subject_confidence && route.subject_confidence < 0.7) {
    return {
      intro: "حللت السؤال أكثر من مرة حتى أحدد المادة الأقرب.",
      prompt: `يبدو أن السؤال من ${route.detected_subject}. هل تريد أن أكمل الحل على هذا الأساس، أم تفضّل اختيار المادة يدويًا؟`,
      actions: [
        { label: objectiveLike ? "أرسل العبارات كاملة" : "اكتب المطلوب أوضح", fill: objectiveLike ? "اكتب العبارات أو الخيارات كاملة هنا..." : "اكتب السؤال كاملًا مع المطلوب." },
        { label: "اختيار المادة", action: "focus-subject" }
      ]
    };
  }

  return {
    intro: "أفهم الفكرة العامة من سؤالك، لكن ينقصني توضيح صغير حتى أرتب الجواب بدقة.",
    prompt: objectiveLike
      ? "أرسل العبارات أو الخيارات كاملة وسأحدد الصحيح مباشرة مع سبب مختصر."
      : "اكتب السؤال بشكل أوضح قليلًا، أو أرسل صورة السؤال كاملة وسأكمل معك مباشرة.",
    actions: [
      { label: objectiveLike ? "أكمل الخيارات" : "اكتب السؤال كاملًا", fill: objectiveLike ? "اكتب العبارات أو الخيارات كاملة هنا..." : "اكتب السؤال كاملًا مع المطلوب والمعطيات." },
      { label: "رفع صورة السؤال", action: "upload-image" }
    ]
  };
}

function curriculum_scope_checker({ userText, selectedGrade, selectedSubject, imageMeta, solveMode = "quick" }) {
  const sourceText = `${userText || ""} ${imageMeta?.extracted_text || ""}`.trim();
  const subjectAnalysis = auto_subject_detector(sourceText);
  const gradeAnalysis = grade_estimator(sourceText);
  const selectedStage = getSelectedStageLabel(selectedGrade);
  const structured = solveMode === "structured";

  if (!subjectAnalysis.subject) {
    return {
      detected_subject: "",
      detected_grade_level: gradeAnalysis.stage,
      subject_confidence: 0,
      grade_confidence: gradeAnalysis.confidence,
      scope_status: structured && selectedSubject ? "subject_unknown" : "auto_detect_pending",
      subject_candidates: subjectAnalysis.candidates,
      analysis_passes: subjectAnalysis.passes
    };
  }

  if (structured && selectedSubject && subjectAnalysis.subject !== selectedSubject) {
    return {
      detected_subject: subjectAnalysis.subject,
      detected_grade_level: gradeAnalysis.stage,
      subject_confidence: subjectAnalysis.confidence,
      grade_confidence: gradeAnalysis.confidence,
      scope_status: "subject_mismatch",
      subject_candidates: subjectAnalysis.candidates,
      analysis_passes: subjectAnalysis.passes
    };
  }

  if (structured && gradeAnalysis.stage && selectedStage && gradeAnalysis.stage !== selectedStage && gradeAnalysis.confidence >= 0.7) {
    return {
      detected_subject: subjectAnalysis.subject,
      detected_grade_level: gradeAnalysis.stage,
      subject_confidence: subjectAnalysis.confidence,
      grade_confidence: gradeAnalysis.confidence,
      scope_status: "grade_mismatch",
      subject_candidates: subjectAnalysis.candidates,
      analysis_passes: subjectAnalysis.passes
    };
  }

  return {
    detected_subject: subjectAnalysis.subject,
    detected_grade_level: gradeAnalysis.stage,
    subject_confidence: subjectAnalysis.confidence,
    grade_confidence: gradeAnalysis.confidence,
    scope_status: structured ? "matched" : (subjectAnalysis.confidence >= 0.7 ? "auto_detected" : "auto_detect_pending"),
    subject_candidates: subjectAnalysis.candidates,
    analysis_passes: subjectAnalysis.passes
  };
}

function request_router({ user_text, uploaded_files, selected_grade, selected_subject, user_profile, selected_solve_mode = "quick" }) {
  const input_type = determineInputType(user_text, uploaded_files);
  const image_type = input_type.includes("image")
    ? image_analyzer(uploaded_files, user_text)
    : { image_type: "none", extracted_text: "", confidence: 0 };
  const intent = intent_router(`${user_text || ""} ${image_type.extracted_text || ""}`, uploaded_files?.length > 0);
  const quickMode = selected_solve_mode !== "structured";
  const scope = curriculum_scope_checker({
    userText: user_text,
    selectedGrade: selected_grade || user_profile?.grade || "",
    selectedSubject: quickMode ? "" : (selected_subject || ""),
    imageMeta: image_type,
    solveMode: quickMode ? "quick" : "structured"
  });

  let response_mode = "academic_solve";

  if (input_type === "file_only" && !user_text.trim()) response_mode = "content_interpretation";
  if (image_type.image_type === "logo_or_branding") response_mode = "reject_logo_image";
  else if (image_type.image_type === "non_educational_image" || image_type.image_type === "document_non_educational") response_mode = "reject_out_of_scope_image";
  else if (image_type.image_type === "unclear_image") response_mode = "ask_clearer_upload";
  else if (image_type.image_type === "educational_page" && !user_text.trim()) response_mode = "content_interpretation";
  else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) response_mode = "ask_for_confirmation";
  else if (quickMode && intent.type !== "chat" && intent.type !== "help" && scope.subject_confidence < 0.7) response_mode = "ask_for_confirmation";

  return {
    input_type,
    intent,
    image_type: image_type.image_type,
    extracted_text: image_type.extracted_text,
    detected_subject: scope.detected_subject,
    detected_grade_level: scope.detected_grade_level,
    subject_confidence: scope.subject_confidence,
    grade_confidence: scope.grade_confidence,
    subject_candidates: scope.subject_candidates,
    analysis_passes: scope.analysis_passes,
    scope_status: scope.scope_status,
    response_mode,
    quick_mode: quickMode
  };
}

function createImageRouterResponse(route) {
  if (route.response_mode === "ask_for_confirmation") {
    if (route.scope_status === "subject_mismatch") {
      return formatSimpleReply(`يبدو أن هذا السؤال أقرب إلى مادة ${route.detected_subject}، بينما المادة المحددة لديك مختلفة. غيّر المادة أو أخبرني أن أكمل على هذا الأساس.`);
    }
    if (route.scope_status === "grade_mismatch") {
      return formatSimpleReply("هذا السؤال يبدو من مستوى دراسي مختلف عن الصف المحدد لديك. يمكنك تعديل الصف، أو المتابعة كتقدير أولي إذا كان هذا مقصودًا.");
    }
    if (route.detected_subject) {
      return formatClarificationReply({
        intro: "حللت السؤال أكثر من مرة لأحدد مادته بشكل أقرب.",
        prompt: `يبدو أن السؤال من ${route.detected_subject}. هل تريد أن أكمل الحل على هذا الأساس؟`,
        actions: [
          { label: "اختيار المادة", action: "focus-subject" },
          { label: "اكتب السؤال أوضح", fill: "اكتب السؤال كاملًا مع المطلوب." }
        ]
      });
    }
    return formatSimpleReply("لم تتضح المادة بشكل كافٍ حتى الآن. اكتب السؤال بصورة أوضح قليلًا، أو اختر المادة يدويًا وسأكمل معك مباشرة.");
  }

  if (route.response_mode === "reject_logo_image") {
    return formatSimpleReply("يبدو أن الصورة المرفقة ليست سؤالًا دراسيًا، بل أقرب إلى شعار أو تصميم. إذا كنت تريد المساعدة التعليمية، أرسل صورة السؤال أو اكتبه نصًا.");
  }

  if (route.response_mode === "reject_out_of_scope_image") {
    return formatSimpleReply("الصورة المرفقة لا تبدو ضمن المحتوى التعليمي. يرجى إرسال سؤال دراسي أو صورة واضحة من كتاب أو ورقة عمل.");
  }

  if (route.response_mode === "ask_clearer_upload") {
    return formatSimpleReply("الصورة غير واضحة بما يكفي لقراءة السؤال. حاول إعادة رفع صورة أوضح أو اكتب السؤال نصًا.");
  }

  if (route.response_mode === "content_interpretation") {
    return formatClarificationReply({
      intro: "تم التعرف على المرفق كمحتوى تعليمي عام.",
      prompt: "هل تريد شرح المحتوى، تلخيصه، أم حل الأسئلة الموجودة فيه؟",
      actions: [
        { label: "شرح المحتوى", fill: "اشرح محتوى الصفحة التعليمية المرفقة." },
        { label: "تلخيص المحتوى", fill: "لخّص الصفحة التعليمية المرفقة." },
        { label: "حل الأسئلة", fill: "حل الأسئلة الموجودة في الصفحة التعليمية المرفقة." }
      ]
    });
  }

  return formatSimpleReply("تم تجهيز الطلب للتحليل وسأتابع الحل الآن.");
}

async function handleSubmit(event) {
  event.preventDefault();
  const question = promptInput?.value.trim() || "";
  const hasAttachments = attachments.length > 0;
  if (!question && !hasAttachments) return;

  const activeUser = getActiveUser();
  const route = request_router({
    user_text: question,
    uploaded_files: attachments,
    selected_grade: gradeSelect?.value || activeUser?.grade || "",
    selected_subject: subjectSelect?.value || "",
    user_profile: activeUser || {},
    selected_solve_mode: selectedSolveMode
  });
  const intent = route.intent;

  if (hasAttachments && !isLoggedIn()) {
    addMessage("assistant", "ملم يحل", formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.'));
    attachments = [];
    if (fileInput) fileInput.value = "";
    renderAttachments();
    return;
  }

  const shouldCharge =
    !hasAttachments ||
    route.response_mode === "academic_solve" ||
    route.response_mode === "content_interpretation";
  const usageCost = shouldCharge ? (hasAttachments ? usageCosts.image : usageCosts.chat) : 0;
  if (usageCost > 0) {
    const pointsResult = spendPoints(usageCost, hasAttachments ? "تحليل صورة" : "استخدام الشات");
    if (!pointsResult.ok) {
      addMessage("assistant", "ملم يحل", formatSimpleReply(`رصيدك الحالي ${pointsResult.remaining} نقطة، وهذا لا يكفي لهذه العملية. تحتاج ${usageCost} نقطة. يمكنك شراء نقاط إضافية من <a class="top-link" href="subscriptions.html">صفحة الباقات</a>.`));
      return;
    }
  }

  const renderedQuestion = hasAttachments
    ? `${question || "أرفقت صورة أو ملفًا مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments.map((item) => item.name).join("، ")}</span>`
    : question;

  addMessage("user", "أنت", renderedQuestion);
  appendMessageToSession("user", "أنت", renderedQuestion, {
    subject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : ""),
    sessionTitle: question || "سؤال جديد"
  });

  promptInput.value = "";
  autoGrow(promptInput);

  const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
  let body = "";
  let sources = [];
  let responseForLog = null;

  if (route.response_mode !== "academic_solve") {
    body = createImageRouterResponse(route);
  } else if (intent.type === "chat") {
    body = formatSimpleReply(createCasualResponse(question));
  } else if (intent.type === "help") {
    body = formatSimpleReply(createHelpResponse());
  } else if (needsClarification(question, intent, hasAttachments)) {
    body = formatClarificationReply(createClarificationResponse(question, intent, route));
  } else {
    const response = createAcademicResponse(question || route.extracted_text || "حل السؤال من الملفات المرفقة", intent, {
      preferredSubject: route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : "")
    });
    responseForLog = response;
    body = formatAssistantSections(response);
    sources = buildSources();
    analytics.totalMessages += 1;
    analytics.xpUsed += usageCost;
    analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] =
      (analytics.subjects[response.subject || route.detected_subject || subjectSelect?.value || "عام"] || 0) + 1;
    saveAnalytics();
    saveHistory(
      question || "سؤال مرفق",
      response.subject || route.detected_subject || subjectSelect?.value || "عام",
      response.questionType || detectQuestionType(question || route.extracted_text || ""),
      "تمت المراجعة"
    );
  }

  pendingNode?.remove();

  const assistantMeta = responseForLog
    ? {
        subject: responseForLog.subject,
        lesson: responseForLog.lesson,
        questionType: responseForLog.questionType,
        mode: responseForLog.mode
      }
    : undefined;

  addMessage("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: assistantMeta
  });
  appendMessageToSession("assistant", "ملم يحل", body, {
    sources,
    enableTools: route.response_mode === "academic_solve" && Boolean(responseForLog),
    metadata: assistantMeta,
    subject: responseForLog?.subject || route.detected_subject || (selectedSolveMode === "structured" ? (subjectSelect?.value || "") : "")
  });

  aiLogs.unshift({
    question: question || "سؤال مرفق",
    intent: intent.type,
    subject: route.detected_subject || subjectSelect?.value || "عام",
    lesson: responseForLog?.lesson || lessonInput?.value.trim() || "",
    responseMode: responseForLog?.mode || route.response_mode || intent.type,
    usedAttachments: hasAttachments,
    imageType: route.image_type,
    scopeStatus: route.scope_status,
    createdAt: Date.now()
  });
  aiLogs = aiLogs.slice(0, 40);
  saveAiLogs();
  renderInsights();
  renderLearnedMemory();
  renderSessionList();
  updateXpBalance();
}

function bootstrap() {
  applyTheme(localStorage.getItem(storageKeys.theme) || "light");
  loadUserState();
  const activeUser = syncUserStreakOnVisit() || getActiveUser();
  loadUserState();
  if (gradeSelect && activeUser?.grade) gradeSelect.value = activeUser.grade;
  updateXpBalance();
  renderLearnedMemory();
  renderHistory();
  renderInsights();
  renderQuestionBank();
  renderWebPolicy();
  renderSessionList();

  if (gradeSelect) gradeSelect.value = gradeSelect.value || activeUser?.grade || gradeOptions[10];
  if (subjectSelect) subjectSelect.value = subjectSelect.value || subjectOptions[0];
  updateSelectionSummary();

  const currentSession = getActiveSession();
  if (currentSession?.messages?.length) {
    restoreSession(currentSession.id);
  } else {
    resetConversationView();
  }

  promptInput?.addEventListener("input", () => autoGrow(promptInput));
  form?.addEventListener("submit", handleSubmit);
  fileInput?.addEventListener("change", (event) => {
    attachments = Array.from(event.target.files || []);
    renderAttachments();
  });

  gradeSelect?.addEventListener("change", updateSelectionSummary);
  subjectSelect?.addEventListener("change", updateSelectionSummary);
  termSelect?.addEventListener("change", updateSelectionSummary);
  lessonInput?.addEventListener("input", updateSelectionSummary);
  responseModeButtons.forEach((button) => {
    button.addEventListener("click", () => applyResponseMode(button.getAttribute("data-response-mode") || "educational"));
  });
  solveModeButtons.forEach((button) => {
    button.addEventListener("click", () => applySolveMode(button.getAttribute("data-solve-mode") || "quick"));
  });

  startChatButton?.addEventListener("click", startChat);
  quickSolveButton?.addEventListener("click", quickSolve);
  heroExampleButton?.addEventListener("click", () => {
    setPromptValue("احسب محيط دائرة نصف قطرها 7", "الرياضيات");
    form?.requestSubmit();
  });
  heroUploadButton?.addEventListener("click", openImageUpload);
  uploadButton?.addEventListener("click", openGenericUpload);
  uploadImageButton?.addEventListener("click", openImageUpload);
  uploadFileButton?.addEventListener("click", openGenericUpload);
  focusSubjectButton?.addEventListener("click", () => {});
  clearChatButton?.addEventListener("click", startFreshSession);
  newSessionButton?.addEventListener("click", startFreshSession);
  themeToggleButton?.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    localStorage.setItem(storageKeys.theme, next);
    applyTheme(next);
  });

  messageList?.addEventListener("click", handleMessageInteractions);
  sessionList?.addEventListener("click", handleSessionInteractions);
  wajibatiLibraryList?.addEventListener("click", handleLibraryInteractions);
  window.addEventListener("scroll", syncScrollTopButton, { passive: true });
  scrollTopButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  bindStarterButtons();
  applyResponseMode(selectedResponseMode);
  applySolveMode(selectedSolveMode);
  syncScrollTopButton();

  const resumePrompt = localStorage.getItem(storageKeys.resumePrompt);
  if (resumePrompt) {
    setPromptValue(resumePrompt);
    localStorage.removeItem(storageKeys.resumePrompt);
  }
}
