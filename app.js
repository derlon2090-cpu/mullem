const storageKeys = {
  theme: "mlm_theme",
  users: "mlm_users",
  currentUser: "mlm_current_user",
  history: "mlm_chat_history",
  liked: "mlm_liked_answers",
  analytics: "mlm_analytics",
  feedback: "mlm_feedback_log",
  aiLogs: "mlm_ai_logs"
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
const scrollTopButton = document.querySelector("[data-scroll-top]");

let attachments = [];
let clarificationCursor = 0;
let likedAnswers = [];
let chatHistory = [];
let analytics = createEmptyAnalytics();
let feedbackLog = [];
let aiLogs = [];

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
          <p>أنا مساعد أكاديمي للمنهج السعودي. أستطيع حل الأسئلة، شرح الدروس، تحليل الأخطاء، وتحديد الإجابة الصحيحة إذا كان السؤال اختيارات أو صح أو خطأ.</p>
          <p class="logic-note">جرّب أحد هذه الأمثلة: احسب محيط دائرة نصف قطرها 7 | اشرح قانون نيوتن الثاني | حل هذا السؤال | حل سؤال من صورة</p>
        </section>
      </div>
    `
  );
}

function addMessage(type, author, body, options = {}) {
  if (!messageList) return null;
  const article = document.createElement("article");
  article.className = `message ${type}`;
  article.innerHTML = `
    <div class="message-title">${author}</div>
    <div class="message-body">${body}</div>
  `;

  if (type === "assistant" && !options.pending) {
    const tools = document.createElement("div");
    tools.className = "message-tools";
    tools.innerHTML = `
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

  return reviewed;
}

const response_reviewer = reviewResponse;

function createAcademicResponse(question, intent) {
  const context = retrieveCurriculumContext(question, subjectSelect?.value || "");
  const objective = solveObjectiveQuestion(question);
  if (objective) {
    return reviewResponse(intent, {
      ...objective,
      mode: "solve",
      curriculumLink: `اعتمدت الإجابة على ${context.subject} للصف ${context.grade} في ${context.term}.`
    });
  }

  const math = solveMathQuestion(question);
  if (math) {
    return reviewResponse(intent, {
      ...math,
      mode: "solve",
      curriculumLink: `تم ربط السؤال بدرس ${context.lesson} في مادة ${context.subject} للصف ${context.grade}.`
    });
  }

  if (intent.type === "generate_questions") {
    return reviewResponse(intent, {
      mode: "questions",
      intro: `هذه أسئلة تدريبية من ${context.subject} للصف ${context.grade} — ${context.term}.`,
      questions: generateCurriculumQuestions(context),
      curriculumLink: `التوليد تم بالاعتماد على موضوع ${context.lesson} ضمن ${context.subject}.`
    });
  }

  if (intent.type === "quiz") {
    const questions = generateCurriculumQuestions(context);
    return reviewResponse(intent, {
      mode: "quiz",
      finalAnswer: "سأبدأ الآن بسؤال واحد فقط.",
      explanation: `الاختبار مرتبط بمادة ${context.subject} للصف ${context.grade}.`,
      quizQuestion: questions[0],
      curriculumLink: `تم اختيار السؤال من نطاق ${context.subject} في ${context.term}.`
    });
  }

  if (intent.type === "summary") {
    return reviewResponse(intent, {
      mode: "summary",
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
  if (response.mode === "questions") {
    return `
      <div class="answer-grid">
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

  if (response.answerMode === "mcq" || response.answerMode === "truefalse") {
    return `
      <div class="answer-grid">
        <section class="answer-section answer-section-wide">
          <h4>${response.answerMode === "truefalse" ? "✅ الحكم النهائي" : "✅ الخيار الصحيح"}</h4>
          <p>${response.finalAnswer}</p>
        </section>
        <section class="answer-section answer-section-wide">
          <h4>📘 التحليل المختصر</h4>
          <p>${response.explanation}</p>
        </section>
      </div>
    `;
  }

  return `
    <div class="answer-grid">
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

function renderHistory() {
  if (!historyList) return;
  if (!isLoggedIn()) {
    historyList.innerHTML = `<div class="history-item"><strong>التاريخ محفوظ للمستخدمين المسجلين</strong><span>يمكنك استخدام الشات الآن، لكن سجل المحادثات سيبدأ الحفظ بعد تسجيل الدخول.</span></div>`;
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
  insightsList.innerHTML = [
    topSubject
      ? `أفضل تفاعل حاليًا في مادة ${topSubject}.`
      : "ابدأ أول سؤال لتظهر قراءة أولية لمستواك.",
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
  promptInput.focus();
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
  if (!fileInput) return;
  fileInput.setAttribute("accept", ".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md");
  fileInput.click();
}

function startChat() {
  document.querySelector("#chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
  promptInput?.focus();
}

function quickSolve() {
  setPromptValue("ابدأ بحل سؤال من هذا الدرس مع شرح مبسط وخطوات وأخطاء شائعة.");
  startChat();
}

function saveHistory(question, subject) {
  chatHistory.unshift({ question, subject, time: Date.now() });
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

  const intent = classifyIntent(question, hasAttachments);
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

  const usageCost = hasAttachments ? usageCosts.image : usageCosts.chat;
  const pointsResult = spendPoints(usageCost, hasAttachments ? "تحليل صورة" : "استخدام الشات");
  if (!pointsResult.ok) {
    addMessage(
      "assistant",
      "ملم يحل",
      formatSimpleReply(`رصيدك الحالي ${pointsResult.remaining} نقطة، وهذا لا يكفي لهذه العملية. تحتاج ${usageCost} نقطة. يمكنك شراء نقاط إضافية من <a class="top-link" href="subscriptions.html">صفحة الباقات</a>.`)
    );
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

  if (intent.type === "chat") {
    body = formatSimpleReply(createCasualResponse(question));
  } else if (intent.type === "help") {
    body = formatSimpleReply(createHelpResponse());
  } else if (needsClarification(question, intent, hasAttachments)) {
    body = formatClarificationReply(createClarificationResponse(question, intent));
  } else {
    const response = createAcademicResponse(question || "حل السؤال من الملفات المرفقة", intent);
    responseForLog = response;
    body = formatAssistantSections(response);
    sources = buildSources();
    analytics.totalMessages += 1;
    analytics.xpUsed += usageCost;
    analytics.subjects[subjectSelect?.value || "عام"] = (analytics.subjects[subjectSelect?.value || "عام"] || 0) + 1;
    saveAnalytics();
    saveHistory(question || "سؤال مرفق", subjectSelect?.value || "عام");
  }

  if (pendingNode) {
    pendingNode.remove();
  }

  addMessage("assistant", "ملم يحل", body, { sources });
  aiLogs.unshift({
    question: question || "سؤال مرفق",
    intent: intent.type,
    subject: subjectSelect?.value || "عام",
    responseMode: responseForLog?.mode || intent.type,
    usedAttachments: hasAttachments,
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

  if (fillButton) {
    setPromptValue(fillButton.getAttribute("data-fill-prompt") || "");
    const subject = fillButton.getAttribute("data-subject-fill");
    if (subject && subjectSelect) subjectSelect.value = subject;
    return;
  }

  if (actionButton) {
    const action = actionButton.getAttribute("data-action");
    if (action === "upload-image") openImageUpload();
    if (action === "focus-subject") subjectSelect?.focus();
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

function bootstrap() {
  applyTheme(localStorage.getItem(storageKeys.theme) || "light");
  loadUserState();
  const activeUser = getActiveUser();
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

  startChatButton?.addEventListener("click", startChat);
  quickSolveButton?.addEventListener("click", quickSolve);
  heroExampleButton?.addEventListener("click", () => {
    setPromptValue("احسب محيط دائرة نصف قطرها 7", "الرياضيات");
    startChat();
  });
  heroUploadButton?.addEventListener("click", openImageUpload);
  uploadButton?.addEventListener("click", openGenericUpload);
  uploadImageButton?.addEventListener("click", openImageUpload);
  uploadFileButton?.addEventListener("click", openGenericUpload);
  focusSubjectButton?.addEventListener("click", () => subjectSelect?.focus());
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
  syncScrollTopButton();
}

bootstrap();
