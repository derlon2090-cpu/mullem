const curriculumData = [
  {
    grade: "الثاني الثانوي",
    subject: "الرياضيات",
    term: "الفصل الدراسي الأول",
    lesson: "محيط الدائرة",
    unit: "الهندسة والقياس",
    concepts: ["نصف القطر", "محيط الدائرة", "التعويض في القانون"],
    content:
      "محيط الدائرة يساوي 2 × π × نصف القطر. إذا كان المعطى هو القطر فيجب قسمته على 2 أولًا للحصول على نصف القطر. يمكن تقريب π إلى 3.14 أو استخدام 22/7 عندما يكون ذلك مناسبًا.",
    commonMistakes: [
      "الخلط بين قانون المحيط وقانون المساحة",
      "استخدام القطر مكان نصف القطر مباشرة",
      "نسيان التقريب عند طلب قيمة عشرية"
    ],
    similarQuestion: "احسب محيط دائرة نصف قطرها 5 سم.",
    sampleQuestion: "احسب محيط الدائرة إذا كان نصف القطر 7"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الفيزياء",
    term: "الفصل الدراسي الأول",
    lesson: "الحركة المتسارعة",
    unit: "الحركة في بعد واحد",
    concepts: ["السرعة المتجهة", "التسارع", "المسافة والزمن"],
    content:
      "التسارع هو معدل تغير السرعة المتجهة بالنسبة للزمن. عند حل مسائل الحركة نحدد المعطيات أولًا، ثم نختار القانون المناسب مثل: التسارع = التغير في السرعة ÷ الزمن.",
    commonMistakes: [
      "الخلط بين السرعة والتسارع",
      "إهمال الوحدات",
      "اختيار قانون لا يناسب المعطيات"
    ],
    similarQuestion: "تحرك جسم من السكون حتى وصلت سرعته إلى 20 م/ث خلال 4 ثوان. احسب التسارع.",
    sampleQuestion: "ما المقصود بالتسارع وكيف نحسبه؟"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الكيمياء",
    term: "الفصل الدراسي الأول",
    lesson: "الروابط الكيميائية",
    unit: "بنية الذرة",
    concepts: ["الرابطة الأيونية", "الرابطة التساهمية", "الإلكترونات"],
    content:
      "تتكون الرابطة الأيونية من انتقال إلكترونات من ذرة إلى أخرى، بينما تتكون الرابطة التساهمية من مشاركة الإلكترونات بين الذرات. تحديد نوع الرابطة يعتمد على طبيعة العناصر الداخلة في المركب.",
    commonMistakes: [
      "الخلط بين الانتقال والمشاركة",
      "عدم ربط نوع الرابطة بنوع العناصر",
      "نسيان أثر التكافؤ"
    ],
    similarQuestion: "وضح الفرق بين الرابطة الأيونية والرابطة التساهمية مع مثال لكل منهما.",
    sampleQuestion: "ما الفرق بين الرابطة الأيونية والتساهمية؟"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة العربية",
    term: "الفصل الدراسي الأول",
    lesson: "المبتدأ والخبر",
    unit: "القواعد النحوية",
    concepts: ["الاسم المرفوع", "الجملة الاسمية", "الخبر المفرد والجملة"],
    content:
      "المبتدأ اسم مرفوع نبدأ به الجملة الاسمية، والخبر يبين المعنى الذي نخبر به عن المبتدأ. قد يكون الخبر مفردًا أو جملة أو شبه جملة حسب التركيب.",
    commonMistakes: [
      "الخلط بين الفاعل والمبتدأ",
      "اعتبار كل اسم أول الجملة مبتدأ من دون النظر إلى السياق",
      "إهمال علامة الرفع"
    ],
    similarQuestion: "استخرج المبتدأ والخبر من جملة: المدرسة نظيفة.",
    sampleQuestion: "حدد المبتدأ والخبر في جملة: العلم نور"
  },
  {
    grade: "الثاني الثانوي",
    subject: "اللغة الإنجليزية",
    term: "الفصل الدراسي الأول",
    lesson: "Present Simple",
    unit: "Grammar",
    concepts: ["verb agreement", "he/she/it", "daily routines"],
    content:
      "في المضارع البسيط نضيف s أو es للفعل إذا كان الفاعل he أو she أو it. يستخدم الزمن لوصف العادات والحقائق العامة.",
    commonMistakes: [
      "نسيان إضافة s مع he أو she",
      "استخدام am/is/are مع أفعال ليست في صيغة مستمرة",
      "الخلط بين الحاضر البسيط والمستمر"
    ],
    similarQuestion: "Correct the sentence: She go to school every day.",
    sampleQuestion: "صحح الجملة بالإنجليزية: He play football every day"
  },
  {
    grade: "الثاني الثانوي",
    subject: "الأحياء",
    term: "الفصل الدراسي الثاني",
    lesson: "الخلية",
    unit: "تركيب الكائنات الحية",
    concepts: ["العضيات", "النواة", "الغشاء البلازمي"],
    content:
      "الخلية هي الوحدة الأساسية في بناء الكائن الحي. تحتوي على عضيات متعددة، ولكل عضية وظيفة محددة مثل النواة التي تتحكم في أنشطة الخلية.",
    commonMistakes: [
      "عدم التمييز بين العضية ووظيفتها",
      "الخلط بين الخلية النباتية والحيوانية",
      "إهمال مفهوم الوحدة الأساسية للحياة"
    ],
    similarQuestion: "اذكر وظيفتين للنواة في الخلية.",
    sampleQuestion: "ما أهمية النواة داخل الخلية؟"
  },
  {
    grade: "الثاني الثانوي",
    subject: "العلوم",
    term: "الفصل الدراسي الثاني",
    lesson: "النظام البيئي",
    unit: "علم البيئة",
    concepts: ["المنتجات", "المستهلكات", "السلاسل الغذائية"],
    content:
      "المنتجات تصنع غذاءها بنفسها غالبًا بعملية البناء الضوئي، أما المستهلكات فتتغذى على كائنات أخرى للحصول على الطاقة. فهم هذا الفرق أساسي في دراسة السلاسل الغذائية.",
    commonMistakes: [
      "اعتبار جميع النباتات مستهلكات",
      "عدم ربط الكائن بمصدر طاقته",
      "الخلط بين آكل الأعشاب وآكل اللحوم"
    ],
    similarQuestion: "ما الفرق بين المستهلك الأولي والمستهلك الثانوي؟",
    sampleQuestion: "اشرح الفرق بين المنتجات والمستهلكات في النظام البيئي"
  },
  {
    grade: "الثاني الثانوي",
    subject: "المهارات الرقمية",
    term: "الفصل الدراسي الثالث",
    lesson: "أمن المعلومات",
    unit: "الثقافة الرقمية",
    concepts: ["كلمات المرور", "التصيد", "الحماية"],
    content:
      "أمن المعلومات يهتم بحماية البيانات والأجهزة من الوصول غير المصرح به. من أساسياته اختيار كلمات مرور قوية وعدم مشاركة البيانات مع الروابط المشبوهة.",
    commonMistakes: [
      "استخدام كلمات مرور ضعيفة",
      "الثقة بروابط مجهولة",
      "عدم تحديث أساليب الحماية"
    ],
    similarQuestion: "اذكر خطوتين لحماية حسابك الدراسي من الاختراق.",
    sampleQuestion: "كيف أحمي حسابي من التصيد الإلكتروني؟"
  }
];

const storageKeys = {
  runtime: "mlm_runtime",
  trainingMode: "mlm_training_mode",
  likedMemory: "mlm_liked_memory",
  dislikedMemory: "mlm_disliked_memory",
  history: "mlm_chat_history",
  analytics: "mlm_analytics",
  users: "mlm_users"
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
const statusChip = document.querySelector("[data-status]");
const selectionSummary = document.querySelector("[data-selection-summary]");
const runtimeSummary = document.querySelector("[data-runtime-summary]");
const startChatButton = document.querySelector("[data-start-chat]");
const quickSolveButton = document.querySelector("[data-quick-solve]");
const uploadButton = document.querySelector("[data-open-upload]");

let attachments = [];
let lastUserQuestion = "";
let likedMemory = loadJson(storageKeys.likedMemory, []);
let dislikedMemory = loadJson(storageKeys.dislikedMemory, []);
let chatHistory = loadJson(storageKeys.history, []);
let analytics = loadJson(storageKeys.analytics, createDefaultAnalytics());
let users = loadJson(storageKeys.users, createDefaultUsers());

analytics = { ...createDefaultAnalytics(), ...analytics };

if (!Array.isArray(users) || users.length === 0) {
  users = createDefaultUsers();
}

runtimeSelect.value = localStorage.getItem(storageKeys.runtime) || "vLLM Runtime";
trainingModeSelect.value = localStorage.getItem(storageKeys.trainingMode) || "Prompt + RAG";

function loadJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createDefaultAnalytics() {
  return {
    totalMessages: 0,
    totalLikes: 0,
    totalDislikes: 0,
    xpUsed: 0,
    dailyMessages: {},
    subjects: {},
    grades: {},
    feedback: [],
    savedSessions: 0
  };
}

function createDefaultUsers() {
  return [
    {
      id: "student-demo-1",
      name: "طالب تجريبي",
      role: "Student",
      package: "مجاني محدود",
      xp: 120,
      status: "نشط",
      activity: "بدأ استخدام الشات الأكاديمي"
    }
  ];
}

function saveSettings() {
  localStorage.setItem(storageKeys.runtime, runtimeSelect.value);
  localStorage.setItem(storageKeys.trainingMode, trainingModeSelect.value);
  updateStatus();
}

function updateStatus() {
  const runtime = runtimeSelect.value;
  const trainingMode = trainingModeSelect.value;
  statusChip.textContent = runtime === "وضع تجريبي داخل الواجهة" ? "وضع محلي تجريبي" : `AI محلي | ${runtime}`;
  runtimeSummary.textContent = `التشغيل الحالي: ${runtime} مع طبقة سلوكية ${trainingMode}. المعرفة تأتي من RAG للمنهج السعودي، أما أسلوب الرد فيمثّل سلوك ملم يحل.`;
}

function autoGrow(element) {
  element.style.height = "0px";
  element.style.height = `${Math.min(element.scrollHeight, 200)}px`;
}

function getCurrentSelection() {
  return {
    grade: gradeSelect.value,
    subject: subjectSelect.value,
    term: termSelect.value,
    lesson: lessonInput.value.trim() || "غير محدد"
  };
}

function updateSelectionSummary() {
  const selection = getCurrentSelection();
  selectionSummary.textContent = `الصف: ${selection.grade} | المادة: ${selection.subject} | الفصل: ${selection.term} | الدرس: ${selection.lesson}`;
  renderQuestionBank();
}

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

function findRelevantLesson(question) {
  const selection = getCurrentSelection();
  const normalizedQuestion = normalizeText(question);

  const exactMatches = curriculumData.filter((item) => {
    const sameGrade = item.grade === selection.grade;
    const sameSubject = item.subject === selection.subject;
    const sameTerm = item.term === selection.term;
    const lessonHint = normalizeText(selection.lesson);
    const lessonMatches =
      lessonHint === "غير محدد" ||
      normalizeText(item.lesson).includes(lessonHint) ||
      lessonHint.includes(normalizeText(item.lesson));
    const questionMatches =
      normalizedQuestion.includes(normalizeText(item.lesson)) ||
      normalizedQuestion.includes(normalizeText(item.unit)) ||
      item.concepts.some((concept) => normalizedQuestion.includes(normalizeText(concept)));

    return sameGrade && sameSubject && sameTerm && (lessonMatches || questionMatches);
  });

  if (exactMatches.length > 0) {
    return exactMatches[0];
  }

  const subjectMatches = curriculumData.filter(
    (item) =>
      item.grade === selection.grade &&
      item.subject === selection.subject &&
      item.term === selection.term
  );

  return subjectMatches[0] || curriculumData[0];
}

function buildCurriculumContext(lesson) {
  if (!lesson) {
    return "لا يوجد محتوى منهجي محلي مناسب حاليًا.";
  }

  return `
الوحدة: ${lesson.unit}
الدرس: ${lesson.lesson}
المفاهيم: ${lesson.concepts.join("، ")}
ملخص المنهج: ${lesson.content}
أخطاء شائعة في هذا الدرس: ${lesson.commonMistakes.join("، ")}
سؤال مشابه من نفس الدرس: ${lesson.similarQuestion}
  `.trim();
}

function detectQuestionType(question) {
  const normalized = normalizeText(question);

  if (normalized.includes("اختر") || normalized.includes("اختيار")) return "اختيار من متعدد";
  if (normalized.includes("صح") && normalized.includes("خطأ")) return "صح وخطأ";
  if (normalized.includes("اشرح") || normalized.includes("فسر")) return "سؤال تفسيري";
  if (normalized.includes("حل") || normalized.includes("احسب") || normalized.includes("معادلة")) return "مسألة حسابية";
  if (normalized.includes("صحح") || normalized.includes("correct")) return "تصحيح وصياغة";
  return "سؤال أكاديمي عام";
}

function formatAssistantSections(response) {
  return `
    <div class="answer-grid">
      <section class="answer-section">
        <h4>✅ الإجابة النهائية</h4>
        <p>${response.finalAnswer}</p>
      </section>
      <section class="answer-section">
        <h4>📘 الشرح</h4>
        <p>${response.explanation}</p>
      </section>
      <section class="answer-section">
        <h4>🧮 خطوات الحل</h4>
        <ul>${response.steps.map((step) => `<li>${step}</li>`).join("")}</ul>
      </section>
      <section class="answer-section">
        <h4>⚠️ أخطاء شائعة</h4>
        <ul>${response.mistakes.map((mistake) => `<li>${mistake}</li>`).join("")}</ul>
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

function createSourcesMarkup(sources) {
  if (!sources || sources.length === 0) {
    return "";
  }

  return `
    <div class="sources-list">
      ${sources
        .map(
          (source) =>
            `<a class="source-link" href="${source}" target="_blank" rel="noreferrer">${source}</a>`
        )
        .join("")}
    </div>
  `;
}

function addMessage(role, title, content, options = {}) {
  const { likeable = false, messagePayload = null, sources = [] } = options;
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const heading = document.createElement("div");
  heading.className = "message-title";
  heading.textContent = title;

  const body = document.createElement("div");
  body.className = "message-body";
  if (typeof content === "string") {
    body.innerHTML = content;
  }

  article.append(heading, body);

  if (sources.length > 0) {
    const sourcesWrap = document.createElement("div");
    sourcesWrap.innerHTML = createSourcesMarkup(sources);
    article.appendChild(sourcesWrap);
  }

  if (likeable && messagePayload) {
    const tools = document.createElement("div");
    tools.className = "message-tools";

    const likeButton = document.createElement("button");
    likeButton.type = "button";
    likeButton.className = "mini-btn";
    likeButton.textContent = "👍 أعجبني";

    const dislikeButton = document.createElement("button");
    dislikeButton.type = "button";
    dislikeButton.className = "mini-btn disliked";
    dislikeButton.textContent = "👎 لم يعجبني";

    likeButton.addEventListener("click", () => {
      if (likeButton.classList.contains("active")) return;
      likeButton.classList.add("active");
      dislikeButton.disabled = true;
      rememberFeedback("like", messagePayload);
    });

    dislikeButton.addEventListener("click", () => {
      if (dislikeButton.classList.contains("active")) return;
      dislikeButton.classList.add("active");
      likeButton.disabled = true;
      rememberFeedback("dislike", messagePayload);
    });

    tools.append(likeButton, dislikeButton);
    article.appendChild(tools);
  }

  messageList.appendChild(article);
  messageList.scrollTop = messageList.scrollHeight;
}

function renderAttachments() {
  attachmentList.innerHTML = "";

  attachments.forEach((file) => {
    const item = document.createElement("div");
    item.className = "attachment";
    item.textContent = file.name;
    attachmentList.appendChild(item);
  });
}

function renderLearnedMemory() {
  learnList.innerHTML = "";

  if (likedMemory.length === 0) {
    learnList.innerHTML = `
      <div class="memory-item">
        <strong>لا يوجد تفضيل محفوظ بعد</strong>
        <span>عندما تضغط إعجابًا على إجابة مناسبة سيعرضها ملم يحل هنا ليتعلم من النمط الذي فضّلته.</span>
      </div>
    `;
    return;
  }

  likedMemory.slice(0, 4).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = `<strong>${entry.question}</strong><span>${entry.summary}</span>`;
    learnList.appendChild(item);
  });
}

function renderHistory() {
  historyList.innerHTML = "";

  if (chatHistory.length === 0) {
    historyList.innerHTML = `
      <div class="history-item">
        <strong>لا توجد مراجعات محفوظة بعد</strong>
        <span>ستظهر هنا آخر الجلسات لتتمكن من العودة إليها ومراجعة تطورك الدراسي.</span>
      </div>
    `;
    return;
  }

  chatHistory.slice(0, 5).forEach((session) => {
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <strong>${session.subject} | ${session.lesson}</strong>
      <span>${session.question}</span>
    `;
    item.addEventListener("click", () => {
      promptInput.value = session.question;
      autoGrow(promptInput);
      subjectSelect.value = session.subject;
      gradeSelect.value = session.grade;
      termSelect.value = session.term;
      lessonInput.value = session.lesson === "غير محدد" ? "" : session.lesson;
      updateSelectionSummary();
      promptInput.focus();
    });
    historyList.appendChild(item);
  });
}

function renderInsights() {
  insightsList.innerHTML = "";

  const subjectRanking = Object.entries(analytics.subjects).sort((a, b) => b[1] - a[1]);
  const weakSubject = subjectRanking.length ? subjectRanking[subjectRanking.length - 1][0] : null;
  const strongSubject = subjectRanking.length ? subjectRanking[0][0] : null;
  const dislikedTopics = dislikedMemory.slice(0, 2).map((entry) => entry.lesson).filter(Boolean);

  const items = [
    strongSubject
      ? `أفضل نشاط حاليًا في مادة ${strongSubject}.`
      : "ابدأ أول سؤال لك لتظهر قراءة أولية لمستواك.",
    weakSubject
      ? `تحتاج مراجعة إضافية في ${weakSubject} إذا استمرت قلة التفاعل فيه.`
      : "لا توجد مادة ضعيفة واضحة حتى الآن.",
    dislikedTopics.length
      ? `لاحظنا صعوبة في: ${[...new Set(dislikedTopics)].join("، ")}.`
      : "لا توجد أخطاء متكررة كافية لاستخراج تنبيه دقيق بعد.",
    analytics.totalMessages > 0
      ? `أرسلت ${analytics.totalMessages} رسالة تعليمية حتى الآن، وهذا يساعد على تحليل أدق لمستواك.`
      : "تحليل الطالب يظهر هنا بعد أول استخدام فعلي."
  ];

  items.forEach((text) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = `<strong>مؤشر ذكي</strong><span>${text}</span>`;
    insightsList.appendChild(item);
  });
}

function renderQuestionBank() {
  questionBank.innerHTML = "";

  const selection = getCurrentSelection();
  const filtered = curriculumData.filter(
    (item) =>
      item.grade === selection.grade &&
      item.subject === selection.subject &&
      item.term === selection.term
  );

  const bank = filtered.length > 0 ? filtered : curriculumData.slice(0, 4);

  bank.slice(0, 4).forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-btn";
    button.textContent = entry.sampleQuestion;
    button.addEventListener("click", () => {
      lessonInput.value = entry.lesson;
      promptInput.value = entry.sampleQuestion;
      updateSelectionSummary();
      autoGrow(promptInput);
      promptInput.focus();
    });
    questionBank.appendChild(button);
  });
}

function rememberFeedback(type, messagePayload) {
  const summary = messagePayload.finalAnswer.slice(0, 180);
  const entry = {
    question: messagePayload.question,
    summary,
    subject: messagePayload.subject,
    grade: messagePayload.grade,
    term: messagePayload.term,
    lesson: messagePayload.lesson,
    savedAt: Date.now()
  };

  if (type === "like") {
    likedMemory.unshift(entry);
    likedMemory = likedMemory.slice(0, 10);
    analytics.totalLikes += 1;
    saveJson(storageKeys.likedMemory, likedMemory);
  } else {
    dislikedMemory.unshift(entry);
    dislikedMemory = dislikedMemory.slice(0, 10);
    analytics.totalDislikes += 1;
    saveJson(storageKeys.dislikedMemory, dislikedMemory);
  }

  analytics.feedback.unshift({
    type,
    question: entry.question,
    subject: entry.subject,
    grade: entry.grade,
    savedAt: entry.savedAt
  });
  analytics.feedback = analytics.feedback.slice(0, 20);
  saveAnalytics();
  renderLearnedMemory();
  renderInsights();
}

function saveAnalytics() {
  saveJson(storageKeys.analytics, analytics);
  saveJson(storageKeys.users, users);
}

function trackUsage(selection) {
  analytics.totalMessages += 1;
  analytics.xpUsed += 7;
  analytics.subjects[selection.subject] = (analytics.subjects[selection.subject] || 0) + 1;
  analytics.grades[selection.grade] = (analytics.grades[selection.grade] || 0) + 1;
  const dayKey = new Date().toISOString().slice(0, 10);
  analytics.dailyMessages[dayKey] = (analytics.dailyMessages[dayKey] || 0) + 1;
  users[0].xp = Math.max(0, users[0].xp - 7);
  users[0].activity = `آخر نشاط في ${selection.subject} - ${selection.lesson}`;
  saveAnalytics();
}

function saveSession(question, response) {
  const session = {
    question,
    grade: response.grade,
    subject: response.subject,
    term: response.term,
    lesson: response.lesson,
    finalAnswer: response.finalAnswer,
    savedAt: Date.now()
  };

  chatHistory.unshift(session);
  chatHistory = chatHistory.slice(0, 15);
  analytics.savedSessions = chatHistory.length;
  saveJson(storageKeys.history, chatHistory);
  saveAnalytics();
  renderHistory();
}

function createLocalResponse(question, lesson) {
  const questionType = detectQuestionType(question);
  const selection = getCurrentSelection();
  const finalAnswer =
    lesson && question
      ? `اعتمادًا على درس ${lesson.lesson} في ${selection.subject}، الحل الأقرب هو: ${lesson.content.split(" ").slice(0, 16).join(" ")}...`
      : `تم تحليل سؤالك في ${selection.subject}، لكن يفضّل تحديد الدرس بدقة لرفع جودة الإجابة.`;

  const explanation = lesson
    ? `ربطت السؤال بدرس ${lesson.lesson} من وحدة ${lesson.unit}، ثم استخرجت المفاهيم الأساسية: ${lesson.concepts.join("، ")}.`
    : `لم أجد درسًا مطابقًا بشكل كامل، لذلك اعتمدت على المادة والسياق العام لتقديم شرح تدريجي.`;

  const steps = lesson
    ? [
        `تحديد نوع السؤال: ${questionType}.`,
        `الرجوع إلى محتوى المنهج المحلي في درس ${lesson.lesson}.`,
        `استخراج الفكرة الأساسية: ${lesson.concepts[0]}.`,
        `بناء حل مبسط يناسب ${selection.grade} مع ربطه بالسياق الدراسي.`
      ]
    : [
        "قراءة صيغة السؤال وتحديد المطلوب.",
        "تجهيز شرح مبسط بناءً على المادة المختارة.",
        "اقتراح الدرس الأقرب لمراجعة الطالب."
      ];

  return {
    question,
    grade: selection.grade,
    subject: selection.subject,
    term: selection.term,
    lesson: lesson ? lesson.lesson : selection.lesson,
    finalAnswer,
    explanation,
    steps,
    mistakes: lesson ? lesson.commonMistakes : ["عدم تحديد الدرس بدقة", "القفز إلى النتيجة قبل فهم المطلوب"],
    similar: lesson ? lesson.similarQuestion : "اكتب سؤالًا آخر من نفس الدرس وسأولده لك بصيغة مشابهة.",
    curriculumLink: lesson
      ? `${selection.grade} > ${selection.subject} > ${selection.term} > ${lesson.unit} > ${lesson.lesson}`
      : `${selection.grade} > ${selection.subject} > ${selection.term}`
  };
}

async function toAttachmentInputs(files) {
  const inputs = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      const dataUrl = await fileToDataUrl(file);
      inputs.push({
        type: "input_image",
        image_url: dataUrl,
        detail: "auto"
      });
      continue;
    }

    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const text = await file.text();
      inputs.push({
        type: "input_text",
        text: `محتوى الملف (${file.name}):\n${text.slice(0, 10000)}`
      });
      continue;
    }

    inputs.push({
      type: "input_text",
      text: `تم إرفاق ملف باسم ${file.name}. إذا تعذر قراءة محتواه مباشرة فاعتمد على وصف السؤال والمرفقات المصاحبة.`
    });
  }

  return inputs;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractUrls(value, bucket = new Set()) {
  if (!value) return bucket;

  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/[^\s)"]+/g);
    if (matches) {
      matches.forEach((match) => bucket.add(match));
    }
    return bucket;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => extractUrls(item, bucket));
    return bucket;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => extractUrls(item, bucket));
  }

  return bucket;
}

function parseAiText(rawText, lesson) {
  const cleaned = rawText.trim();
  const paragraphs = cleaned.split(/\n+/).filter(Boolean);
  const finalAnswer = paragraphs[0] || "تمت معالجة السؤال بنجاح.";
  const explanation = paragraphs.slice(1, 3).join(" ") || lesson.content;
  const steps = paragraphs.length > 3
    ? paragraphs.slice(3, 7)
    : [
        `الرجوع إلى درس ${lesson.lesson}.`,
        "استخراج المفاهيم الأساسية من المنهج.",
        "بناء شرح مبسط ومباشر للطالب."
      ];

  return {
    question: lastUserQuestion,
    grade: gradeSelect.value,
    subject: subjectSelect.value,
    term: termSelect.value,
    lesson: lesson.lesson,
    finalAnswer,
    explanation,
    steps,
    mistakes: lesson.commonMistakes,
    similar: lesson.similarQuestion,
    curriculumLink: `${gradeSelect.value} > ${subjectSelect.value} > ${termSelect.value} > ${lesson.unit} > ${lesson.lesson}`
  };
}

async function requestAI(question, lesson) {
  const localResponse = createLocalResponse(question, lesson);
  const runtime = runtimeSelect.value;
  const trainingMode = trainingModeSelect.value;
  const attachmentsInput = await toAttachmentInputs(attachments);
  const hasFiles = attachmentsInput.length > 0;

  const response = {
    ...localResponse,
    explanation: `${localResponse.explanation} يعمل المحرك الحالي بصيغة ${runtime} مع نمط ${trainingMode}، لذلك يتم فصل المعرفة عن السلوك: المنهج يأتي من RAG المحلي، وأسلوب الرد يمثل سياسة ملم يحل.`,
    steps: [
      `تصنيف السؤال إلى: ${detectQuestionType(question)}.`,
      `استرجاع أقرب مقطع من درس ${lesson.lesson} ضمن ${lesson.unit}.`,
      `تطبيق سياسة الإجابة الخاصة بملم يحل: حل ثم شرح ثم أخطاء شائعة ثم سؤال مشابه.`,
      hasFiles
        ? "تحليل المرفقات كجزء من السؤال قبل بناء الجواب."
        : "بناء الإجابة مباشرة من السؤال النصي والسياق الدراسي.",
      `المحرك المفترض للتشغيل النهائي: ${runtime}.`
    ],
    curriculumLink: `${localResponse.curriculumLink} | طبقة التشغيل: ${runtime} | طبقة السلوك: ${trainingMode}`
  };

  return {
    response,
    sources: []
  };
}

function addPendingMessage() {
  addMessage(
    "assistant",
    "ملم يحل",
    `<div class="pending-copy">جارٍ تحليل السؤال وربطه بالمنهج السعودي ثم تجهيز الإجابة المنظمة...</div>`
  );
}

async function handleSubmit(event) {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  if (!prompt && attachments.length === 0) return;

  const selection = getCurrentSelection();
  const lesson = findRelevantLesson(prompt || selection.lesson);
  lastUserQuestion = prompt || "سؤال مرفوع عبر ملفات مرفقة";

  const userText = attachments.length
    ? `${prompt || "أرفقت ملفًا أو صورة مع السؤال."}<br><span class="muted-inline">المرفقات: ${attachments
        .map((file) => file.name)
        .join("، ")}</span>`
    : prompt;

  addMessage("user", "أنت", userText);
  addPendingMessage();
  trackUsage({
    grade: selection.grade,
    subject: selection.subject,
    lesson: lesson.lesson
  });

  try {
    const pendingMessage = messageList.lastElementChild;
    const { response, sources } = await requestAI(prompt || "حل السؤال من الملفات المرفقة", lesson);

    if (pendingMessage) {
      pendingMessage.remove();
    }

    addMessage("assistant", "ملم يحل", formatAssistantSections(response), {
      likeable: true,
      messagePayload: response,
      sources
    });

    saveSession(lastUserQuestion, response);
    renderInsights();
  } catch (error) {
    const pendingMessage = messageList.lastElementChild;
    if (pendingMessage) {
      pendingMessage.remove();
    }

    addMessage(
      "assistant",
      "ملم يحل",
      `<div class="answer-grid">
        <section class="answer-section answer-section-wide">
          <h4>⚠️ تعذر الاتصال</h4>
          <p>${error instanceof Error ? error.message : "حدث خطأ غير معروف"}.</p>
          <p>يمكنك المتابعة في الوضع المحلي التجريبي، ثم ربط الواجهة لاحقًا بسيرفر vLLM أو Ollama داخل المنصة عند تجهيز البنية الخلفية.</p>
        </section>
      </div>`
    );
  }

  promptInput.value = "";
  attachments = [];
  if (fileInput) {
    fileInput.value = "";
  }
  renderAttachments();
  autoGrow(promptInput);
}

function startChat() {
  updateSelectionSummary();
  promptInput.focus();
  addMessage(
    "assistant",
    "ملم يحل",
    `<div class="answer-grid">
      <section class="answer-section answer-section-wide">
        <h4>🚀 تم تجهيز الجلسة</h4>
        <p>تم تثبيت السياق الدراسي على ${gradeSelect.value} - ${subjectSelect.value} - ${termSelect.value} - ${lessonInput.value.trim() || "الدرس غير المحدد"}.</p>
        <p>يمكنك الآن كتابة السؤال، أو الضغط على + لرفع صورة من الكتاب أو ملف ملاحظات.</p>
      </section>
    </div>`
  );
}

function quickSolve() {
  promptInput.value = "ابدأ بحل سؤال من هذا الدرس مع شرح مبسط وخطوات وأخطاء شائعة.";
  autoGrow(promptInput);
  startChat();
}

promptInput.addEventListener("input", () => autoGrow(promptInput));
runtimeSelect.addEventListener("change", saveSettings);
trainingModeSelect.addEventListener("change", saveSettings);
gradeSelect.addEventListener("change", updateSelectionSummary);
subjectSelect.addEventListener("change", updateSelectionSummary);
termSelect.addEventListener("change", updateSelectionSummary);
lessonInput.addEventListener("input", updateSelectionSummary);
startChatButton.addEventListener("click", startChat);
quickSolveButton.addEventListener("click", quickSolve);
uploadButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (event) => {
  attachments = Array.from(event.target.files || []);
  renderAttachments();
});
form.addEventListener("submit", handleSubmit);

renderLearnedMemory();
renderHistory();
renderInsights();
updateSelectionSummary();
updateStatus();
saveJson(storageKeys.users, users);

addMessage(
  "assistant",
  "ملم يحل",
  `<div class="answer-grid">
    <section class="answer-section answer-section-wide">
      <h4>مرحبًا بك في ملم يحل</h4>
      <p>أنا شات أكاديمي سعودي يجيب من سياق الصف والمادة والدرس أولًا، ثم يعرض الإجابة النهائية والشرح والخطوات والأخطاء الشائعة والسؤال المشابه.</p>
      <p>ابدأ باختيار الصف والمادة والدرس، ثم اضغط <strong>ابدأ الشات</strong> أو أرسل سؤالك مباشرة.</p>
    </section>
  </div>`
);
