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
    patternMemory: "mlm_runtime_pattern_memory"
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
    return loadRuntimeStore(runtimeMemoryKeys.answerBank, []);
  }

  function saveRuntimeAnswerBank(entries) {
    saveRuntimeStore(runtimeMemoryKeys.answerBank, entries.slice(0, 80));
  }

  function getRuntimePatternMemory() {
    return loadRuntimeStore(runtimeMemoryKeys.patternMemory, {});
  }

  function saveRuntimePatternMemory(memory) {
    saveRuntimeStore(runtimeMemoryKeys.patternMemory, memory);
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

  function findRuntimeStoredAnswer(question, route) {
    const key = normalizeRuntimeQuestionKey(question, route);
    const bank = getRuntimeAnswerBank();
    const entry = bank.find((item) => item.key === key && (item.likes || 0) >= (item.dislikes || 0) && item.response);
    return entry || null;
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

  function buildRuntimeMetaBrain(question, route, analysis, reasoning) {
    const context = resolveStudyContext(route);
    const blocks = splitIntoQuestionBlocks(question);
    const blockTypes = blocks.map((block) => detectBlockType(block)).filter((type) => type && type !== "general");
    const primaryType = analysis?.questionType || route?.question_type || "سؤال أكاديمي";
    const effectiveType = blockTypes.length > 1 ? "رسالة متعددة الأسئلة" : (blockTypes[0] === "matching" ? "مطابقة" : primaryType);

    return {
      intent: analysis?.intent?.type || "solve_question",
      questionType: effectiveType,
      subject: normalizeRuntimeSubjectLabel(route?.detected_subject || analysis?.subject || context.subject),
      difficulty: analysis?.difficulty || "medium",
      expectedOutputStyle: mapRuntimeOutputStyle(effectiveType),
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

  function attachRuntimeOrchestration(response, meta, retrieval, reasoning) {
    return {
      ...response,
      orchestration: {
        meta,
        retrieval,
        reasoning: {
          clarity: reasoning?.clarity || "medium",
          taskCount: reasoning?.taskCount || 0,
          blockTypes: reasoning?.blockTypes || []
        }
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
      structuredResult: {
        question_type: "true_false",
        subject: extra.subject || route.detected_subject || "general",
        grade: extra.grade || route.detected_grade_level || "unknown",
        term: extra.term || "unknown",
        final_answer: answer,
        reason: explanation,
        confidence: typeof extra.confidence === "number" ? extra.confidence : 0.95
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

  function solveRuntimeMatchingBlock(block, route) {
    const data = extractRuntimeMatchingData(block);
    const availableOptions = [...data.options];
    const answers = [];

    data.prompts.forEach((prompt) => {
      const selected = pickBestRuntimeOption(prompt, availableOptions);
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
    const data = extractRuntimeMultipleChoiceData(block);
    const answer = pickBestRuntimeOption(data.prompt, data.options);

    if (!data.prompt || !answer) return null;

    return {
      type: "multiple_choice",
      subject: detectRuntimeSubject(block, "اختيار من متعدد").subject || route.detected_subject || "عام",
      prompt: data.prompt,
      answer
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
    const rawBlocks = splitIntoQuestionBlocks(question);
    if (!rawBlocks.length) return null;

    const solvedBlocks = [];

    rawBlocks.forEach((block) => {
      const type = detectBlockType(block);
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
    if (typeof startFreshSession === "function") {
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
      "mlm_runtime_pattern_memory_guest"
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

  function detectRoute(question, attachments) {
    const activeUser = typeof getActiveUser === "function" ? getActiveUser() : null;
    const solveMode = getSolveMode();
    const inputType = determineInputType(question, attachments);
    const imageMeta = inputType.includes("image")
      ? image_analyzer(attachments, question)
      : { image_type: "none", extracted_text: "", confidence: 0 };
    const questionText = `${question || ""} ${imageMeta.extracted_text || ""}`.trim();
    const intent = intent_router(questionText, attachments.length > 0);
    const questionType = detectRuntimeQuestionType(questionText);
    const isObjective = questionType === "صح وخطأ" || questionType === "اختيار من متعدد";
    const quickMode = solveMode !== "structured";
    const runtimeSubject = detectRuntimeSubject(questionText, questionType);
    const scope = curriculum_scope_checker({
      userText: question,
      selectedGrade: activeUser?.grade || gradeSelect?.value || "",
      selectedSubject: quickMode ? "" : (subjectSelect?.value || ""),
      imageMeta,
      solveMode: quickMode ? "quick" : "structured"
    });
    const detectedSubject = runtimeSubject.subject || scope.detected_subject;
    const subjectConfidence = Math.max(scope.subject_confidence || 0, runtimeSubject.confidence || 0);
    const subjectCandidates = runtimeSubject.candidates?.length ? runtimeSubject.candidates : scope.subject_candidates;
    const analysisPasses = [...new Set([...(scope.analysis_passes || []), ...(runtimeSubject.passes || [])])];

    let responseMode = "academic_solve";
    if (inputType === "file_only" && !question.trim()) responseMode = "content_interpretation";
    if (imageMeta.image_type === "logo_or_branding") responseMode = "reject_logo_image";
    else if (imageMeta.image_type === "non_educational_image" || imageMeta.image_type === "document_non_educational") responseMode = "reject_out_of_scope_image";
    else if (imageMeta.image_type === "unclear_image") responseMode = "ask_clearer_upload";
    else if (imageMeta.image_type === "educational_page" && !question.trim()) responseMode = "content_interpretation";
    else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) responseMode = "ask_for_confirmation";
    else if (quickMode && intent.type !== "chat" && intent.type !== "help" && subjectConfidence < 0.7 && !isObjective) responseMode = "ask_for_confirmation";

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
    let objective = solveRuntimeTrueFalse(question, route);

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
    const intent = intent_router(message, hasAttachments);
    const questionType = detectRuntimeQuestionType(message);
    const subjectGuess = detectRuntimeSubject(message, questionType);
    const decomposedTasks = query_decomposer(message, subjectGuess.subject);
    const blocks = splitIntoQuestionBlocks(message);
    const blockTypes = blocks.map((block) => detectBlockType(block)).filter((type) => type && type !== "general");
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
    const meta = buildRuntimeMetaBrain(rawQuestion, route, analysis, runtimeReasoning);
    const retrieval = buildRuntimeRetrievalPlan(meta, route);
    const storedAnswer = findRuntimeStoredAnswer(rawQuestion, route);
    if (storedAnswer?.response) {
      return attachRuntimeOrchestration(
        {
          ...storedAnswer.response,
          explanation: storedAnswer.response.explanation || "تمت إعادة استخدام أفضل إجابة محفوظة لهذا السؤال لأنها حققت نتيجة جيدة سابقًا."
        },
        meta,
        {
          ...retrieval,
          source: "answer_bank_then_curriculum",
          decisionBasis: "stored_best_answer"
        },
        runtimeReasoning
      );
    }
    const compositeResponse = solveCompositeQuestionSet(rawQuestion, route);
    if (compositeResponse) {
      return attachRuntimeOrchestration(compositeResponse, meta, retrieval, runtimeReasoning);
    }

    const compoundResponse = buildCompoundResponse(rawQuestion, route);
    if (compoundResponse) {
      return attachRuntimeOrchestration(
        normalizeRuntimeResponse(rawQuestion, compoundResponse, route, analysis),
        meta,
        retrieval,
        runtimeReasoning
      );
    }

    const directObjective = buildDirectObjectiveResponse(rawQuestion, route);
    if (directObjective) {
      return attachRuntimeOrchestration(
        normalizeRuntimeResponse(rawQuestion, directObjective, route, analysis),
        meta,
        retrieval,
        runtimeReasoning
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
    if (!validateRuntimeStructuredResponse(normalizedAcademic, meta)) {
      return attachRuntimeOrchestration(
        buildRuntimeValidationFallback(meta, normalizedAcademic),
        meta,
        retrieval,
        runtimeReasoning
      );
    }
    return attachRuntimeOrchestration(normalizedAcademic, meta, retrieval, runtimeReasoning);
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
    const validated = validateRuntimeMultipleChoiceResponse(
      checked.questionType || "",
      validateRuntimeTrueFalseResponse(checked.questionType || "", checked)
    );
    const meta = validated.orchestration?.meta || {
      questionType: validated.questionType || "",
      subject: validated.subject || "عام"
    };
    if (!validateRuntimeStructuredResponse(validated, meta)) {
      return attachRuntimeOrchestration(
        buildRuntimeValidationFallback(meta, validated),
        meta,
        validated.orchestration?.retrieval || null,
        validated.orchestration?.reasoning || null
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
    const decision = decision_engine(route, analysis, reasoning);
    const intent = analysis.intent;

    if (hasAttachments && typeof isLoggedIn === "function" && !isLoggedIn()) {
      addMessage("assistant", "ملم يحل", formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.'));
      clearRuntimeAttachments();
      return;
    }

    const shouldCharge = !hasAttachments || route.response_mode === "academic_solve" || route.response_mode === "content_interpretation";
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
      body = formatSimpleReply(createCasualResponse(question));
    } else if (decision.action === "help") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatSimpleReply(createHelpResponse());
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

  clearGuestWorkspace();
  applyUserStudyContext();
  syncStudentDashboardHeader();
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
    const runSubmit = () => {
      clearRuntimeAttachments();
      promptInput.value = prompt;
      autoGrow(promptInput);
      applyRuntimeSubject(subject);
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    };
    if (options.scrollToChat) {
      runSubmit();
    } else {
      preservePageScroll(runSubmit);
    }
    if (options.scrollToChat) {
      scrollToChatSection();
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
