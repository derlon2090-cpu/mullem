(() => {
  if (window.__mullemRuntimePatched) return;
  window.__mullemRuntimePatched = true;

  const form = document.querySelector("[data-chat-form]");
  const messageList = document.querySelector("[data-messages]");
  const promptInput = document.querySelector("[data-prompt]");
  const fileInput = document.querySelector("[data-file-input]");
  const gradeSelect = document.querySelector("[data-grade]");
  const subjectSelect = document.querySelector("[data-subject]");
  const lessonInput = document.querySelector("[data-lesson]");

  if (!form || !messageList || !promptInput) return;

  const runtimeState = {
    pendingSolveConfirmation: null
  };

  function getSolveMode() {
    const active = document.querySelector("[data-solve-mode].active");
    return active?.getAttribute("data-solve-mode") || "quick";
  }

  function isAffirmativeReply(text) {
    return /^(نعم|اي|أيوه|ايوه|أكيد|اكمل|كمل|تمام|موافق|نعم أكمل)$/i.test((text || "").trim());
  }

  function isNegativeReply(text) {
    return /^(لا|مو|ليس|لا شكرا|لا شكرًا|غير المادة|غيّر المادة)$/i.test((text || "").trim());
  }

  function isUserNearBottom() {
    const threshold = 140;
    return messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight <= threshold;
  }

  function scrollMessagesToBottom(force = false) {
    if (force || isUserNearBottom()) {
      messageList.scrollTop = messageList.scrollHeight;
      messageList.lastElementChild?.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }

  function setupAutoScroll() {
    if (messageList.dataset.runtimeAutoscroll === "1") return;
    messageList.dataset.runtimeAutoscroll = "1";
    const observer = new MutationObserver(() => scrollMessagesToBottom());
    observer.observe(messageList, { childList: true, subtree: true, characterData: true });
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
      selectedGrade: gradeSelect?.value || activeUser?.grade || "",
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

  async function runtimeHandleSubmit(event) {
    if (event.target !== form) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const question = promptInput.value.trim();
    const attachments = Array.from(fileInput?.files || []);
    const hasAttachments = attachments.length > 0;
    if (!question && !hasAttachments) return;

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
      scrollMessagesToBottom(true);
      return;
    }

    if (runtimeState.pendingSolveConfirmation && isNegativeReply(question) && !hasAttachments) {
      runtimeState.pendingSolveConfirmation = null;
      addMessage("user", "أنت", question);
      addMessage("assistant", "ملم يحل", formatSimpleReply("حسنًا، اختر المادة من القائمة وسأكمل الحل بدقة أكبر."));
      subjectSelect?.focus();
      scrollMessagesToBottom(true);
      return;
    }

    const route = detectRoute(question, attachments);
    const intent = route.intent;

    if (hasAttachments && typeof isLoggedIn === "function" && !isLoggedIn()) {
      addMessage("assistant", "ملم يحل", formatSimpleReply('تحليل الصور متاح بعد تسجيل الدخول فقط. يمكنك الآن كتابة السؤال نصيًا، أو <a class="top-link" href="login.html">تسجيل الدخول</a> لتفعيل تحليل الصور.'));
      if (fileInput) fileInput.value = "";
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

    promptInput.value = "";
    autoGrow(promptInput);

    const pendingNode = addMessage("assistant", "ملم يحل", createLoadingCopy(), { pending: true });
    let body = "";
    let sources = [];
    let responseForLog = null;

    if (route.response_mode !== "academic_solve") {
      runtimeState.pendingSolveConfirmation = route.response_mode === "ask_for_confirmation"
        ? { question, route, intent, subject: route.detected_subject || "" }
        : null;
      body = createRouteReply(route);
    } else if (intent.type === "chat") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatSimpleReply(createCasualResponse(question));
    } else if (intent.type === "help") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatSimpleReply(createHelpResponse());
    } else if (typeof needsClarification === "function" && needsClarification(question, intent, hasAttachments) && route.question_type !== "صح وخطأ" && route.question_type !== "اختيار من متعدد") {
      runtimeState.pendingSolveConfirmation = null;
      body = formatClarificationReply(createClarificationResponse(question, intent, route));
    } else {
      runtimeState.pendingSolveConfirmation = null;
      responseForLog = createAcademicResponse(question || route.extracted_text || "حل السؤال من المرفقات", intent, {
        preferredSubject: route.detected_subject || (subjectSelect?.value || ""),
        detectedSubject: route.detected_subject || "",
        subjectConfidence: route.subject_confidence,
        route
      });
      body = formatAssistantSections(responseForLog);
      sources = typeof buildSources === "function" ? buildSources() : [];

      if (typeof saveHistory === "function") {
        saveHistory(
          question || "سؤال مرفق",
          responseForLog.subject || route.detected_subject || subjectSelect?.value || "عام",
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
    scrollMessagesToBottom(true);
  }

  setupAutoScroll();
  document.addEventListener("submit", runtimeHandleSubmit, true);
})();
