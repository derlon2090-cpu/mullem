(() => {
  const form = document.querySelector("[data-hero-ai-form]");
  const input = document.querySelector("[data-hero-ai-input]");
  const fileInput = document.querySelector("[data-hero-ai-file]");
  const uploadButton = document.querySelector("[data-hero-ai-upload]");
  const uploadImageButton = document.querySelector("[data-hero-ai-upload-image]");
  const uploadFileButton = document.querySelector("[data-hero-ai-upload-file]");
  const attachmentsNode = document.querySelector("[data-hero-ai-attachments]");
  const responseNode = document.querySelector("[data-hero-ai-response]");
  const resumePromptKey = "mlm_resume_prompt";
  const conversationKey = "orlixor_hero_conversation_id";

  if (!form || !input || !fileInput || !attachmentsNode || !responseNode) return;

  let selectedFiles = [];
  let isSending = false;

  function getApiClient() {
    return window.mullemApiClient && typeof window.mullemApiClient.sendChat === "function"
      ? window.mullemApiClient
      : null;
  }

  function getSessionUser() {
    const apiClient = getApiClient();
    if (!apiClient || typeof apiClient.getSessionUser !== "function") return null;
    try {
      return apiClient.getSessionUser();
    } catch (_) {
      return null;
    }
  }

  function isAuthenticated() {
    const user = getSessionUser();
    if (user && String(user.role || "").toLowerCase() !== "admin") return true;
    const apiClient = getApiClient();
    if (!apiClient || typeof apiClient.isAuthenticatedStudent !== "function") return false;
    try {
      return Boolean(apiClient.isAuthenticatedStudent());
    } catch (_) {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function autoResize() {
    input.style.height = "0px";
    input.style.height = `${Math.min(input.scrollHeight, 152)}px`;
  }

  function setBusy(nextBusy) {
    isSending = nextBusy;
    form.querySelectorAll("button").forEach((button) => {
      button.disabled = nextBusy;
    });
    input.disabled = nextBusy;
  }

  function renderAttachments() {
    attachmentsNode.hidden = selectedFiles.length === 0;
    attachmentsNode.innerHTML = selectedFiles
      .map((file, index) => `
        <div class="orlixor-ask-attachment">
          <span>${escapeHtml(file.name)}</span>
          <button type="button" data-hero-ai-remove="${index}" aria-label="إزالة ${escapeHtml(file.name)}">×</button>
        </div>
      `)
      .join("");
  }

  function renderResponse(message, tone = "") {
    responseNode.hidden = !message;
    responseNode.classList.toggle("is-pending", tone === "pending");
    responseNode.classList.toggle("is-error", tone === "error");
    responseNode.textContent = message || "";
  }

  function appendAttachmentSummary(files) {
    if (!files.length) return;
    const list = document.createElement("div");
    list.className = "orlixor-ask-response-files";
    list.innerHTML = files.map((file) => `<span>${escapeHtml(file.name)}</span>`).join("");
    responseNode.appendChild(list);
  }

  function openPicker(acceptValue) {
    if (isSending) return;
    if (!isAuthenticated()) {
      const prompt = (input.value || "").trim();
      if (prompt) {
        try {
          localStorage.setItem(resumePromptKey, prompt);
        } catch (_) {
          // Ignore storage issues and continue to login.
        }
      }
      window.location.href = "login.html";
      return;
    }

    fileInput.accept = acceptValue;
    fileInput.click();
  }

  function rememberResumePrompt(value) {
    const prompt = String(value || "").trim();
    if (!prompt) return;
    try {
      localStorage.setItem(resumePromptKey, prompt);
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function buildPayload(question) {
    const user = getSessionUser() || {};
    const gradeSelect = document.querySelector("[data-grade]");
    const subjectSelect = document.querySelector("[data-subject]");
    const termSelect = document.querySelector("[data-term]");
    const lessonInput = document.querySelector("[data-lesson]");
    const conversationId = sessionStorage.getItem(conversationKey) || "";
    const attachmentNames = selectedFiles.map((file) => file.name).filter(Boolean).slice(0, 8);

    return {
      conversation_id: conversationId || undefined,
      message: question,
      subject: subjectSelect?.value || user.subject || "",
      grade: gradeSelect?.value || user.grade || "",
      stage: user.stage || "",
      term: termSelect?.value || "",
      lesson: lessonInput?.value?.trim() || "",
      has_attachment: attachmentNames.length > 0,
      attachment_count: attachmentNames.length,
      attachment_names: attachmentNames,
      stream: false
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSending) return;

    const question = (input.value || "").trim();
    if (!question && selectedFiles.length === 0) return;

    if (!isAuthenticated()) {
      rememberResumePrompt(question);
      window.location.href = "login.html";
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient) {
      renderResponse("خدمة الشات غير جاهزة الآن. تأكد من ربط API الخادم أولًا.", "error");
      return;
    }

    setBusy(true);
    renderResponse("جاري إرسال سؤالك وتحليل الطلب...", "pending");
    appendAttachmentSummary(selectedFiles);

    try {
      const result = await apiClient.sendChat(buildPayload(question));
      if (!result.ok || !result.data?.assistant_message?.body) {
        renderResponse(result.message || "تعذر الوصول إلى خدمة الشات الآن. حاول مرة أخرى بعد قليل.", "error");
        return;
      }

      if (result.data?.conversation_id) {
        sessionStorage.setItem(conversationKey, String(result.data.conversation_id));
      }

      renderResponse(result.data.assistant_message.body);
      appendAttachmentSummary(selectedFiles);
      input.value = "";
      selectedFiles = [];
      fileInput.value = "";
      renderAttachments();
      autoResize();
      try {
        localStorage.removeItem(resumePromptKey);
      } catch (_) {
        // Ignore storage issues after a successful send.
      }
    } catch (_) {
      renderResponse("تعذر الوصول إلى خدمة الشات الآن. حاول مرة أخرى بعد قليل.", "error");
    } finally {
      setBusy(false);
    }
  }

  attachmentsNode.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-hero-ai-remove]");
    if (!removeButton) return;
    const index = Number(removeButton.getAttribute("data-hero-ai-remove"));
    if (!Number.isFinite(index) || index < 0 || index >= selectedFiles.length) return;
    selectedFiles.splice(index, 1);
    renderAttachments();
  });

  uploadButton?.addEventListener("click", () => {
    openPicker(".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md,.ppt,.pptx");
  });

  uploadImageButton?.addEventListener("click", () => {
    openPicker(".png,.jpg,.jpeg,image/*");
  });

  uploadFileButton?.addEventListener("click", () => {
    openPicker(".pdf,.doc,.docx,.txt,.md,.ppt,.pptx");
  });

  fileInput.addEventListener("change", () => {
    selectedFiles = Array.from(fileInput.files || []);
    renderAttachments();
  });

  input.addEventListener("input", autoResize);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    form.requestSubmit();
  });

  form.addEventListener("submit", handleSubmit);

  try {
    const savedPrompt = localStorage.getItem(resumePromptKey);
    if (savedPrompt && !input.value.trim()) {
      input.value = savedPrompt;
    }
  } catch (_) {
    // Ignore storage issues when restoring a draft prompt.
  }

  autoResize();
  renderAttachments();
})();
