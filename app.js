const messageList = document.querySelector("[data-messages]");
const promptInput = document.querySelector("[data-prompt]");
const fileInput = document.querySelector("[data-file-input]");
const attachmentList = document.querySelector("[data-attachments]");
const form = document.querySelector("[data-chat-form]");
const suggestionButtons = document.querySelectorAll("[data-suggestion]");
const gradeSelect = document.querySelector("[data-grade]");
const subjectSelect = document.querySelector("[data-subject]");
const termSelect = document.querySelector("[data-term]");
const lessonInput = document.querySelector("[data-lesson]");
const apiKeyInput = document.querySelector("[data-api-key]");
const webToggle = document.querySelector("[data-web-toggle]");
const learnList = document.querySelector("[data-learned]");
const statusChip = document.querySelector("[data-status]");

let attachments = [];
let likedMemory = JSON.parse(localStorage.getItem("mlm_liked_memory") || "[]");
let lastUserQuestion = "";

apiKeyInput.value = localStorage.getItem("mlm_openai_key") || "";
webToggle.checked = localStorage.getItem("mlm_web_enabled") === "1";

function saveSettings() {
  localStorage.setItem("mlm_openai_key", apiKeyInput.value.trim());
  localStorage.setItem("mlm_web_enabled", webToggle.checked ? "1" : "0");
  updateStatus();
}

function updateStatus() {
  const hasKey = Boolean(apiKeyInput.value.trim());
  statusChip.textContent = hasKey
    ? webToggle.checked
      ? "AI مفعل + مقارنة ويب"
      : "AI مفعل من داخل الموقع"
    : "وضع تجريبي محلي";
}

function autoGrow(element) {
  element.style.height = "0px";
  element.style.height = `${Math.min(element.scrollHeight, 190)}px`;
}

function createSourcesMarkup(sources) {
  if (!sources || sources.length === 0) {
    return "";
  }

  return `
    <div class="sources-list">
      ${sources
        .map(
          (source) => `
            <a class="source-link" href="${source}" target="_blank" rel="noreferrer">${source}</a>
          `
        )
        .join("")}
    </div>
  `;
}

function addMessage(role, title, content, options = {}) {
  const { likeable = false, sources = [] } = options;
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const heading = document.createElement("div");
  heading.className = "message-title";
  heading.textContent = title;

  const body = document.createElement("div");
  body.textContent = content;

  article.append(heading, body);

  if (sources.length > 0) {
    const sourcesWrap = document.createElement("div");
    sourcesWrap.innerHTML = createSourcesMarkup(sources);
    article.appendChild(sourcesWrap);
  }

  if (likeable) {
    const tools = document.createElement("div");
    tools.className = "message-tools";

    const likeButton = document.createElement("button");
    likeButton.type = "button";
    likeButton.className = "mini-btn";
    likeButton.innerHTML = "👍 أعجبني هذا الحل";
    likeButton.addEventListener("click", () => {
      likeButton.classList.add("active");
      likeButton.disabled = true;
      rememberLikedAnswer(lastUserQuestion, content);
    });

    tools.appendChild(likeButton);
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
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = "<strong>لا يوجد تعلم محفوظ بعد</strong><span>عند الإعجاب بإجابة، سيتذكرها ملم يحل ليستفيد منها في الأسئلة التالية.</span>";
    learnList.appendChild(item);
    return;
  }

  likedMemory.slice(0, 4).forEach((entry) => {
    const item = document.createElement("div");
    item.className = "memory-item";
    item.innerHTML = `<strong>${entry.question}</strong><span>${entry.summary}</span>`;
    learnList.appendChild(item);
  });
}

function rememberLikedAnswer(question, answer) {
  if (!question || !answer) return;

  const summary = answer.split("\n").slice(0, 3).join(" ").slice(0, 180);
  likedMemory.unshift({
    question,
    summary,
    savedAt: Date.now()
  });

  likedMemory = likedMemory.slice(0, 8);
  localStorage.setItem("mlm_liked_memory", JSON.stringify(likedMemory));
  renderLearnedMemory();
}

function buildFallbackAnswer(question, subject, grade, term, lesson) {
  const normalized = question.trim().toLowerCase();

  if (normalized.includes("محيط") && normalized.includes("الدائرة")) {
    return `الإجابة النهائية:
محيط الدائرة = 14π ≈ 43.96، وإذا استخدمت 22/7 فالناتج 44.

الشرح خطوة بخطوة:
1. القانون: محيط الدائرة = 2 × π × نصف القطر.
2. التعويض: 2 × π × 7.
3. الناتج: 14π.
4. بالتقريب: 14 × 3.14 = 43.96.

سبب الإجابة:
لأن السؤال أعطى نصف القطر مباشرة، والقانون يعتمد على نصف القطر.

ملاحظة أكاديمية:
قد تختلف طريقة الحل بحسب المعلم أو الكتاب، لذلك نعرض أكثر من أسلوب عند الحاجة.

ربط بالمنهج السعودي:
${grade} - ${term} - ${lesson || "الهندسة والقياس"}.

سؤال مشابه:
احسب محيط الدائرة إذا كان نصف القطر 5.`;
  }

  return `الإجابة النهائية:
تم تحليل سؤالك في مادة ${subject} للمرحلة ${grade}.

الشرح الذكي:
1. فهمت السؤال وربطته بسياق ${term}.
2. حددت أن الدرس الأقرب هو ${lesson || "الدرس الحالي"}.
3. إذا كانت هناك ملفات أو صور مرفقة فسأعتبرها جزءًا من السؤال.

المنهج السعودي أولًا:
أقدّم الجواب بصياغة تعليمية موجهة للفصول الدراسية السعودية، ثم أقارن بالمعلومة العامة عند الحاجة.

تنبيه ذكي:
قد تختلف طريقة الحل بحسب المعلم أو الكتاب، لذلك نعرض أكثر من أسلوب عند الحاجة.

سؤال مشابه:
اكتب سؤالًا آخر من نفس الدرس وسأجيب عليه بنفس التنسيق.`;
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
        text: `محتوى ملف مرفق (${file.name}):\n${text.slice(0, 12000)}`
      });
      continue;
    }

    inputs.push({
      type: "input_text",
      text: `تم إرفاق ملف باسم ${file.name}. إذا لم يمكن قراءة المحتوى مباشرة، اعتمد على وصف السؤال والنص المرافق.`
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

async function requestAI(question) {
  const apiKey = apiKeyInput.value.trim();
  const subject = subjectSelect.value;
  const grade = gradeSelect.value;
  const term = termSelect.value;
  const lesson = lessonInput.value.trim();

  if (!apiKey) {
    return {
      text: buildFallbackAnswer(question, subject, grade, term, lesson),
      sources: []
    };
  }

  const memoryContext = likedMemory
    .slice(0, 4)
    .map((entry, index) => `${index + 1}. سؤال سابق: ${entry.question}\n   خلاصة إجابة معجبة: ${entry.summary}`)
    .join("\n");

  const attachmentsInput = await toAttachmentInputs(attachments);
  const userContent = [
    {
      type: "input_text",
      text: `
السؤال:
${question}

بيانات الطالب:
- الصف: ${grade}
- المادة: ${subject}
- الفصل: ${term}
- الدرس: ${lesson || "غير محدد"}

سياق تعلم سابق من إجابات أعجب بها المستخدم:
${memoryContext || "لا يوجد بعد"}
      `.trim()
    },
    ...attachmentsInput
  ];

  const tools = [];
  if (webToggle.checked) {
    tools.push({
      type: "web_search",
      user_location: {
        type: "approximate",
        country: "SA",
        city: "Riyadh",
        region: "Riyadh",
        timezone: "Asia/Riyadh"
      }
    });
  }

  const payload = {
    model: "gpt-5",
    instructions: `
أنت "ملم يحل"، مساعد أكاديمي ذكي للمناهج السعودية.

التزم بالتالي:
- أجب بالعربية الفصحى المبسطة.
- اعتمد على المنهج السعودي أولًا عند الإمكان.
- إذا فُعّل البحث على الويب فقارن بين المعلومات العامة والمنهج، وعند التعارض قدّم جواب المنهج السعودي أولًا ثم اذكر الفرق بإيجاز.
- حل الأسئلة الأكاديمية بدقة كبيرة وشرح واضح.
- لا تعطِ الجواب النهائي فقط، بل اشرح السبب والخطوات.
- إذا كان السؤال رياضيات أو فيزياء أو كيمياء فاعرض الحل خطوة بخطوة.
- إذا كانت هناك صورة أو ملف فاعتبره جزءًا من السؤال.
- اختم دائمًا بسؤال مشابه أو خطوة تدريبية قصيرة.
- أدرج ملاحظة قصيرة: قد تختلف طريقة الحل بحسب المعلم أو الكتاب، لذلك نعرض أكثر من أسلوب عند الحاجة.
    `.trim(),
    include: webToggle.checked ? ["web_search_call.action.sources"] : [],
    tools,
    input: [
      {
        role: "user",
        content: userContent
      }
    ]
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "تعذر الوصول إلى خدمة الذكاء الاصطناعي.");
  }

  const data = await response.json();
  return {
    text: data.output_text || "لم يصل نص واضح من النموذج.",
    sources: Array.from(extractUrls(data)).slice(0, 6)
  };
}

async function handleSubmit(event) {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  if (!prompt && attachments.length === 0) return;

  lastUserQuestion = prompt || "سؤال مع ملفات مرفقة";

  const userText = attachments.length
    ? `${prompt || "تم إرفاق ملفات للسؤال"}\n\nالملفات المرفقة: ${attachments.map((file) => file.name).join("، ")}`
    : prompt;

  addMessage("user", "أنت", userText);
  addMessage("assistant", "ملم يحل", "جارٍ تحليل السؤال واستخراج أفضل إجابة ممكنة...", { likeable: false });

  try {
    const pendingMessage = messageList.lastElementChild;
    const result = await requestAI(prompt || "حل السؤال من الملفات المرفقة");

    if (pendingMessage) {
      pendingMessage.remove();
    }

    const sourcesNote = webToggle.checked && result.sources.length === 0
      ? "\n\nملاحظة: تم تفعيل البحث، لكن لم تظهر روابط قابلة للاستخراج من الاستجابة الحالية."
      : "";

    addMessage("assistant", "ملم يحل", result.text + sourcesNote, {
      likeable: true,
      sources: result.sources
    });
  } catch (error) {
    const pendingMessage = messageList.lastElementChild;
    if (pendingMessage) {
      pendingMessage.remove();
    }

    addMessage(
      "assistant",
      "ملم يحل",
      `حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.\n\n${error instanceof Error ? error.message : "خطأ غير معروف"}\n\nإذا كنت تستخدم هذه النسخة مباشرة من المتصفح، فالأفضل للتشغيل الإنتاجي نقل مفتاح API إلى خادم آمن بدل وضعه في الواجهة.`,
      { likeable: false }
    );
  }

  promptInput.value = "";
  attachments = [];
  renderAttachments();
  autoGrow(promptInput);
}

promptInput.addEventListener("input", () => autoGrow(promptInput));
apiKeyInput.addEventListener("input", saveSettings);
webToggle.addEventListener("change", saveSettings);

fileInput.addEventListener("change", (event) => {
  attachments = Array.from(event.target.files || []);
  renderAttachments();
});

form.addEventListener("submit", handleSubmit);

suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    promptInput.value = button.getAttribute("data-suggestion") || "";
    autoGrow(promptInput);
    promptInput.focus();
  });
});

renderLearnedMemory();
updateStatus();

addMessage(
  "assistant",
  "ملم يحل",
  `أهلًا بك في ملم يحل.\n\nأنا مساعد أكاديمي مخصص للمناهج السعودية. أستطيع حل الأسئلة، شرح الخطوات، مقارنة المعلومة عند تفعيل بحث الويب، والاستفادة من الإجابات التي أعجبتك لتحسين السياق في المحادثات التالية.\n\nقد تختلف طريقة الحل بحسب المعلم أو الكتاب، لذلك نعرض أكثر من أسلوب عند الحاجة.\n\nأدخل مفتاح API في الإعدادات الجانبية إن أردت تشغيل AI فعلي من داخل الموقع، ثم ابدأ بكتابة سؤالك أو اضغط زر + لإرفاق ملف أو صورة.`,
  { likeable: false }
);
