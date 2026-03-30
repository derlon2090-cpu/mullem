const storageKeys = {
  theme: "mlm_theme",
  users: "mlm_users",
  currentUser: "mlm_current_user",
  history: "mlm_chat_history",
  liked: "mlm_liked_answers",
  analytics: "mlm_analytics"
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
      xp: 120
    }
  ]);
}

function getActiveUser() {
  const users = getUsers();
  const currentId = localStorage.getItem(storageKeys.currentUser);
  return users.find((user) => user.id === currentId) || users[0];
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

function getGradeMaterials(grade) {
  return gradeSubjectCatalog[grade] || subjectOptions;
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
  if (hasAttachments) return "academic";
  if (!normalized) return "help";
  if (/(كيف حالك|السلام عليكم|مرحبا|هلا|شكرا)/.test(normalized)) return "chat";
  if (/(كيف استخدم|طريقة الاستخدام|ساعدني في الموقع|مساعدة)/.test(normalized)) return "help";
  return "academic";
}

function needsClarification(message, hasAttachments = false) {
  if (hasAttachments) return false;
  const normalized = normalizeText(message);
  const tokens = tokenize(message);
  const generic = new Set(["حل", "حلها", "اشرح", "هذا", "ذي", "وش الحل", "سؤال"]);
  const specific = /احسب|اشرح|حدد|صح|خطأ|اختر|قارن|فسر|علل|صحح|ترجم|ما|كيف|لماذا|\d|دائرة|قانون|معادلة|رابطة|نيوتن|محيط|مساحة/i;
  if (specific.test(normalized) && tokens.length >= 2) return false;
  if (lessonInput?.value.trim() && tokens.length >= 2) return false;
  if (tokens.length >= 3) return false;
  return generic.has(normalized) || normalized.length <= 3;
}

function createCasualResponse(message) {
  const normalized = normalizeText(message);
  if (/(كيف حالك|شلونك)/.test(normalized)) return "تمام 👋 كيف أقدر أساعدك في دراستك؟";
  if (/(السلام عليكم|مرحبا|هلا)/.test(normalized)) return "وعليكم السلام، أهلًا بك. كيف أقدر أساعدك في دراستك؟";
  if (/شكرا|يعطيك العافية/.test(normalized)) return "العفو، وإذا عندك أي سؤال دراسي أنا حاضر.";
  return "أنا معك. إذا عندك سؤال دراسي اكتبه لي، وإذا تريد مساعدة في استخدام المنصة فأقدر أساعدك أيضًا.";
}

function createHelpResponse() {
  return "ابدأ باختيار الصف والمادة، ثم اكتب سؤالك أو ارفع صورة السؤال. وإذا كان السؤال اختيارات أو صح وخطأ فسأحلله وأحدد الجواب الصحيح مباشرة.";
}

function createClarificationResponse(message) {
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

function createAcademicResponse(question) {
  const selection = {
    grade: gradeSelect?.value || "الثاني الثانوي",
    subject: subjectSelect?.value || "الرياضيات",
    term: termSelect?.value || "الفصل الدراسي الأول",
    lesson: lessonInput?.value.trim() || "غير محدد"
  };

  const objective = solveObjectiveQuestion(question);
  if (objective) return objective;

  const math = solveMathQuestion(question);
  if (math) return math;

  const lesson = findLesson(question, selection.subject);
  const subject = lesson?.subject || selection.subject;
  const topic = lesson?.lesson || selection.lesson;

  return {
    finalAnswer: lesson
      ? `الإجابة الأقرب لهذا السؤال مرتبطة بدرس ${topic} في مادة ${subject}.`
      : `هذا السؤال يبدو ضمن مادة ${subject}، وسأشرحه لك بشكل مبسط ومباشر.`,
    explanation: lesson
      ? lesson.explanation
      : `فهمت سؤالك على أنه سؤال أكاديمي في ${subject}. إذا أردت دقة أعلى يمكنك كتابة اسم الدرس أو إرسال صورة السؤال.`,
    steps: lesson
      ? lesson.steps
      : [
          "قراءة السؤال وتحديد المطلوب.",
          `الرجوع إلى مفاهيم مادة ${subject}.`,
          "تقديم حل أو شرح مبسط يناسب المرحلة."
        ],
    mistakes: lesson
      ? lesson.mistakes
      : [
          "القفز إلى الإجابة قبل فهم المطلوب.",
          "عدم تحديد المعطيات بشكل كامل."
        ],
    similar: lesson?.similar || `اكتب سؤالًا آخر من نفس الدرس في ${subject} وسأعطيك تدريبًا مشابهًا.`,
    curriculumLink: lesson
      ? `يرتبط هذا السؤال بدرس ${topic} من وحدة ${lesson.unit}.`
      : `يمكن تحسين الربط بالمنهج إذا كتبت اسم الدرس أو أرسلت صورة السؤال.`
  };
}

function formatAssistantSections(response) {
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
  if (statusChip) statusChip.textContent = subjectSelect?.value || "جاهز للمساعدة";
  renderWajibatiLibrary();
  renderTermCoverage();
}

function updateXpBalance() {
  const user = getActiveUser();
  xpBalanceNodes.forEach((node) => {
    node.textContent = String(user?.xp ?? 120);
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

  const renderedQuestion = hasAttachments
    ? `${question || "أرفقت صورة أو ملفًا مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments.map((item) => item.name).join("، ")}</span>`
    : question;

  addMessage("user", "أنت", renderedQuestion);
  promptInput.value = "";
  autoGrow(promptInput);

  const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
  const intent = classifyIntent(question, hasAttachments);

  let body = "";
  let sources = [];

  if (intent === "chat") {
    body = formatSimpleReply(createCasualResponse(question));
  } else if (intent === "help") {
    body = formatSimpleReply(createHelpResponse());
  } else if (needsClarification(question, hasAttachments)) {
    body = formatClarificationReply(createClarificationResponse(question));
  } else {
    const response = createAcademicResponse(question || "حل السؤال من الملفات المرفقة");
    body = formatAssistantSections(response);
    sources = buildSources();
    analytics.totalMessages += 1;
    analytics.xpUsed += 5;
    analytics.subjects[subjectSelect?.value || "عام"] = (analytics.subjects[subjectSelect?.value || "عام"] || 0) + 1;
    saveAnalytics();
    saveHistory(question || "سؤال مرفق", subjectSelect?.value || "عام");
  }

  if (pendingNode) {
    pendingNode.remove();
  }

  addMessage("assistant", "ملم يحل", body, { sources });
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
    saveAnalytics();
    saveLikedAnswers();
    renderLearnedMemory();
    renderInsights();
    likeButton.classList.add("active");
    return;
  }

  if (dislikeButton) {
    analytics.dislikes += 1;
    saveAnalytics();
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
  updateXpBalance();
  renderLearnedMemory();
  renderHistory();
  renderInsights();
  renderQuestionBank();
  renderWebPolicy();
  updateSelectionSummary();
  resetConversationView();

  if (gradeSelect) gradeSelect.value = gradeSelect.value || gradeOptions[10];
  if (subjectSelect) subjectSelect.value = subjectSelect.value || subjectOptions[0];

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
