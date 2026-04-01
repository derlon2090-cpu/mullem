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
  const studentNameNodes = document.querySelectorAll("[data-student-name]");
  const studentStreakNodes = document.querySelectorAll("[data-streak-days]");
  const dashboardCopyNode = document.querySelector("[data-dashboard-copy]");
  const achievementsNode = document.querySelector("[data-achievements]");
  const placeholderButtons = document.querySelectorAll("[data-chat-placeholder]");

  if (!form || !messageList || !promptInput) return;

  const runtimeState = {
    pendingSolveConfirmation: null
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

    if (/التنفس الخلوي|الميتوكوندريا|الفجوات|البلاستيدات|الخلية النباتية|الخلية الحيوانية/.test(normalized)) add("الأحياء", 80);
    if (/رابطة|أيونية|تساهمية|معادلة كيميائية|حمض|قاعدة|na|cl|ذرة|مول/.test(normalized)) add("الكيمياء", 65);
    if (/تسارع|قوة|سرعة|نيوتن|زخم|احتكاك|طاقة حركية/.test(normalized)) add("الفيزياء", 65);
    if (/محيط|مساحة|دائرة|نصف القطر|معادلة|جذر|كسر|احسب|أوجد/.test(normalized)) add("الرياضيات", 65);
    if (/مبتدأ|خبر|إعراب|نحو|بلاغة|أعرب|استخرج/.test(normalized)) add("اللغة العربية", 60);
    if (/[a-z]/.test(normalized) || /translate|grammar|correct|present|past|english/.test(normalized)) add("اللغة الإنجليزية", 60);
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
      "mlm_active_session_guest"
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
    const questionType = detectQuestionType(questionText);
    const isObjective = questionType === "صح وخطأ" || questionType === "اختيار من متعدد";
    const quickMode = solveMode !== "structured";
    const scope = curriculum_scope_checker({
      userText: question,
      selectedGrade: activeUser?.grade || gradeSelect?.value || "",
      selectedSubject: quickMode ? "" : (subjectSelect?.value || ""),
      imageMeta,
      solveMode: quickMode ? "quick" : "structured"
    });

    let responseMode = "academic_solve";
    if (inputType === "file_only" && !question.trim()) responseMode = "content_interpretation";
    if (imageMeta.image_type === "logo_or_branding") responseMode = "reject_logo_image";
    else if (imageMeta.image_type === "non_educational_image" || imageMeta.image_type === "document_non_educational") responseMode = "reject_out_of_scope_image";
    else if (imageMeta.image_type === "unclear_image") responseMode = "ask_clearer_upload";
    else if (imageMeta.image_type === "educational_page" && !question.trim()) responseMode = "content_interpretation";
    else if (!quickMode && (scope.scope_status === "subject_mismatch" || scope.scope_status === "grade_mismatch" || scope.scope_status === "subject_unknown")) responseMode = "ask_for_confirmation";
    else if (quickMode && intent.type !== "chat" && intent.type !== "help" && scope.subject_confidence < 0.7 && !isObjective) responseMode = "ask_for_confirmation";

    return {
      input_type: inputType,
      image_type: imageMeta.image_type,
      extracted_text: imageMeta.extracted_text,
      detected_subject: scope.detected_subject,
      detected_grade_level: scope.detected_grade_level,
      subject_confidence: scope.subject_confidence,
      grade_confidence: scope.grade_confidence,
      subject_candidates: scope.subject_candidates,
      analysis_passes: scope.analysis_passes,
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
    let objective = typeof solveObjectiveQuestion === "function" ? solveObjectiveQuestion(question) : null;

    if (!objective && /التنفس الخلوي/.test(normalized) && /الفجوات/.test(normalized) && /صواب|صح|خطأ/.test(normalized)) {
      objective = {
        finalAnswer: "خطأ",
        explanation: "لأن التنفس الخلوي يحدث في الميتوكوندريا وليس الفجوات."
      };
    }

    if (!objective) return null;

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
    const subjectGuess = runtimeAutoSubjectDetector(message);
    const decomposedTasks = query_decomposer(message, subjectGuess.subject);
    return {
      intent,
      questionType: detectQuestionType(message),
      subject: subjectGuess.subject,
      confidence: subjectGuess.confidence,
      candidates: subjectGuess.candidates,
      difficulty: message.length > 90 ? "medium" : "easy",
      decomposedTasks,
      compound: decomposedTasks.length > 0
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
      taskCount: analysis.decomposedTasks?.length || 0
    };
  }

  function decision_engine(route, analysis, reasoning) {
    if (analysis.intent.type === "chat") return { action: "chat" };
    if (analysis.intent.type === "help") return { action: "help" };
    if (reasoning.compound && (route.subject_confidence || analysis.confidence) >= 0.55) {
      return { action: "answer", confidence: Math.max(route.subject_confidence || 0, analysis.confidence || 0.55), composite: true };
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

  function response_builder(question, route, analysis) {
    return buildCompoundResponse(question, route)
      || buildDirectObjectiveResponse(question, route)
      || createAcademicResponse(question || route.extracted_text || "حل السؤال من المرفقات", analysis.intent, {
        preferredSubject: route.detected_subject || "",
        detectedSubject: route.detected_subject || "",
        subjectConfidence: route.subject_confidence,
        route
      });
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
    return checked;
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
          mode: response.mode
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
      const response = createAcademicResponse(stored.question, stored.intent, {
        preferredSubject: stored.route.detected_subject || stored.subject || "",
        detectedSubject: stored.route.detected_subject || stored.subject || "",
        subjectConfidence: Math.max(0.71, stored.route.subject_confidence || 0.71),
        route: { ...stored.route, response_mode: "academic_solve" }
      });
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
        response_builder(question || route.extracted_text || "", route, analysis),
        decision
      );
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
    clearRuntimeAttachments();
    promptInput.value = "احسب محيط دائرة نصف قطرها 7";
    autoGrow(promptInput);

    if (subjectSelect) {
      const mathOption = Array.from(subjectSelect.options || []).find((option) =>
        (option.textContent || "").includes("رياض")
      );
      if (mathOption) {
        subjectSelect.value = mathOption.value;
        subjectSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
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
    const heroExampleButton = event.target.closest("[data-hero-example]");
    if (!heroExampleButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    submitHeroExample();
  }, true);
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
