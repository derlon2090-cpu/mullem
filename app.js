const suggestions = [
  "احسب محيط الدائرة إذا كان نصف القطر 7",
  "اشرح الفرق بين المنتجات والمستهلكات في النظام البيئي",
  "حدد المبتدأ والخبر في جملة: العلم نور",
  "صحح الجملة بالإنجليزية: He play football every day"
];

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

let attachments = [];

function autoGrow(element) {
  element.style.height = "0px";
  element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
}

function addMessage(role, title, content) {
  const article = document.createElement("article");
  article.className = `message ${role}`;

  const heading = document.createElement("div");
  heading.className = "message-title";
  heading.textContent = title;

  const body = document.createElement("div");
  body.textContent = content;

  article.append(heading, body);
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

function buildAcademicAnswer(question, subject, grade, term, lesson) {
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

ربط بالمنهج:
${grade} - ${term} - ${lesson || "الهندسة والقياس"}.

خطأ شائع:
نسيان ضرب الناتج في 2 أو الخلط بين المحيط والمساحة.

سؤال مشابه:
احسب محيط الدائرة إذا كان نصف القطر 5.`;
  }

  if (normalized.includes("النظام البيئي") || normalized.includes("المنتجات") || normalized.includes("المستهلكات")) {
    return `الإجابة النهائية:
المنتجات تصنع غذاءها بنفسها مثل النباتات، أما المستهلكات فتحصل على غذائها من كائنات أخرى.

الشرح:
1. المنتجات تعتمد على ضوء الشمس والتمثيل الضوئي.
2. المستهلكات لا تصنع غذاءها بنفسها.
3. كل نوع له دور في توازن النظام البيئي.

سبب الإجابة:
الفرق الأساسي بينهما هو طريقة الحصول على الغذاء.

مراجعة مرتبطة:
علاقات الكائنات الحية داخل النظام البيئي.

سؤال مشابه:
اذكر مثالًا على منتج ومثالًا على مستهلك مع التوضيح.`;
  }

  if (normalized.includes("المبتدأ") || normalized.includes("الخبر") || normalized.includes("العلم نور")) {
    return `الإجابة النهائية:
المبتدأ: العلم
الخبر: نور

الشرح:
1. الجملة اسمية لأنها بدأت باسم.
2. الاسم الأول هو المبتدأ.
3. الكلمة التي أكملت المعنى هي الخبر.

سبب الإجابة:
الجملة "العلم نور" من أبسط صور الجملة الاسمية في المنهج.

خطأ شائع:
اعتبار الكلمتين معًا مبتدأ أو تجاهل نوع الجملة.

سؤال مشابه:
حدد المبتدأ والخبر في الجملة: الصدق نجاة.`;
  }

  if (normalized.includes("he play") || normalized.includes("present simple") || normalized.includes("صحح")) {
    return `الإجابة النهائية:
He plays football every day.

الشرح:
1. الجملة في المضارع البسيط.
2. الفاعل هو He.
3. مع he / she / it نضيف s أو es للفعل.

سبب الإجابة:
الفعل مع He لا يبقى بصيغته المجردة في الجملة المثبتة.

سؤال مشابه:
صحح الجملة: She go to school by bus.`;
  }

  return `الإجابة النهائية:
تم تحليل سؤالك في مادة ${subject} للمرحلة ${grade}.

الشرح الذكي:
1. فهمت السؤال وربطته بسياق ${term}.
2. حددت أن الدرس الأقرب هو ${lesson || "الدرس الحالي"}.
3. سأعرض الحل بصيغة تعليمية: النتيجة، السبب، والخطوات.

سبب الإجابة:
هذا الرد مهيأ كواجهة أولية لمنصة "ملم". يمكن ربطه لاحقًا بذكاء اصطناعي فعلي أو API تعليمية لرفع الدقة أكثر.

ملاحظة:
إذا أرفقت ملفًا أو صورة، فالمساعد يعتبرها جزءًا من السؤال ويحللها مع النص.

سؤال مشابه:
اكتب سؤالًا آخر من نفس الدرس وسأجيب عليه بنفس التنسيق.`;
}

function handleSubmit(event) {
  event.preventDefault();

  const prompt = promptInput.value.trim();
  if (!prompt && attachments.length === 0) {
    return;
  }

  const grade = gradeSelect.value;
  const subject = subjectSelect.value;
  const term = termSelect.value;
  const lesson = lessonInput.value.trim();

  const userText = attachments.length
    ? `${prompt || "تم إرفاق ملفات للسؤال"}\n\nالملفات المرفقة: ${attachments.map((file) => file.name).join("، ")}`
    : prompt;

  addMessage("user", "أنت", userText);

  const answer = buildAcademicAnswer(prompt || "تحليل ملف مرفق", subject, grade, term, lesson);
  const attachmentHint = attachments.length
    ? `\n\nتم أيضًا استلام الملفات التالية: ${attachments.map((file) => file.name).join("، ")}`
    : "";
  addMessage("assistant", "ملم الذكي", answer + attachmentHint);

  promptInput.value = "";
  attachments = [];
  renderAttachments();
  autoGrow(promptInput);
}

promptInput.addEventListener("input", () => autoGrow(promptInput));

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

addMessage(
  "assistant",
  "ملم الذكي",
  `أهلًا بك في ملم.\n\nأنا مساعد أكاديمي مخصص للمناهج السعودية. أستطيع مساعدتك في الرياضيات والعلوم والعربي والإنجليزي عبر شرح منظم، حل خطوة بخطوة، وسؤال مشابه للتدريب.\n\nابدأ بكتابة سؤالك، أو اضغط زر + لإرفاق ملف أو صورة.`
);
