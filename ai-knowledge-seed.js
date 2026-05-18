"use strict";

const aiIntelligence = require("./ai-intelligence-layer");

const AI_KNOWLEDGE_SEED = [
  {
    sourceKey: "kb-plans-pricing-2026",
    title: "شرح الباقات والأسعار",
    category: "plans",
    source: "official_pricing",
    tags: ["plans", "pricing", "xp"],
    content: [
      "باقات Orlixor الحالية هي: المجانية، Spark، Tuwaiq، وPioneer.",
      "الباقة المجانية سعرها 0 ريال وتمنح 5 XP يوميًا للاستخدام الأساسي.",
      "باقة Spark سعرها 9 ريال لمدة 30 يومًا وتمنح 80 XP يوميًا.",
      "باقة Tuwaiq سعرها 29 ريال لمدة 30 يومًا وتمنح 250 XP يوميًا.",
      "باقة Pioneer سعرها 59 ريال لمدة 30 يومًا وتمنح 600 XP يوميًا.",
      "الاشتراك مدته 30 يومًا، وعند انتهاء المدة يحتاج المستخدم إلى تجديد أو ترقية حسب إعدادات الدفع المتاحة."
    ].join("\n")
  },
  {
    sourceKey: "kb-xp-token-limits-2026",
    title: "حدود XP والتوكن والصور",
    category: "limits",
    source: "official_limits",
    tags: ["limits", "tokens", "xp"],
    content: [
      "استهلاك XP الافتراضي: الرسالة العادية 10 XP، الصورة الواحدة 15 XP، تحليل ملف 20 XP، والبحث المتقدم 25 XP.",
      "المجانية: 5 XP يوميًا، 20K توكن يوميًا، 600K توكن شهريًا، صورة واحدة يوميًا، وحد أقصى 2K توكن للرسالة.",
      "Spark: 80 XP يوميًا، 120K توكن يوميًا، 3.6M توكن شهريًا، 5 صور يوميًا، وحد أقصى 6K توكن للرسالة.",
      "Tuwaiq: 250 XP يوميًا، 400K توكن يوميًا، 12M توكن شهريًا، 20 صورة يوميًا، وحد أقصى 12K توكن للرسالة.",
      "Pioneer: 600 XP يوميًا، 1M توكن يوميًا، 30M توكن شهريًا، 60 صورة يوميًا، وحد أقصى 32K توكن للرسالة.",
      "التحكم يعتمد على XP وحدود التوكن والرسائل والصور معًا، وليس على XP وحده."
    ].join("\n")
  },
  {
    sourceKey: "kb-fair-use-policy-2026",
    title: "سياسة الاستخدام العادل",
    category: "policy",
    source: "official_policy",
    tags: ["fair_use", "limits", "abuse"],
    content: [
      "سياسة الاستخدام العادل تهدف لحماية المنصة من الاستنزاف وضمان تجربة مستقرة لكل المستخدمين.",
      "عند تجاوز الحد اليومي تظهر رسالة توضّح وقت إعادة التحديث.",
      "عند تجاوز الحد الشهري يمكن للمستخدم الترقية أو انتظار التجديد القادم.",
      "عند إرسال رسالة طويلة تتجاوز حد الرسالة الواحدة قد تظهر نافذة تأكيد توضّح التكلفة الإضافية من XP والتوكن.",
      "قد يتم إيقاف الطلب مباشرة عند تجاوز XP أو التوكن أو الصور أو معدل الطلبات."
    ].join("\n")
  },
  {
    sourceKey: "kb-login-how-to-2026",
    title: "طريقة تسجيل الدخول",
    category: "auth",
    source: "official_auth_docs",
    tags: ["login", "auth", "account"],
    content: [
      "يمكن تسجيل الدخول في Orlixor باستخدام البريد الإلكتروني وكلمة المرور.",
      "قد تتوفر خيارات دخول اجتماعي مثل Google أو Microsoft أو Apple إذا كانت مفاتيح المزود مفعلة في إعدادات الخادم.",
      "زر تذكرني يحافظ على الجلسة من خلال token أو cookie آمن حسب إعدادات المتصفح والخادم.",
      "إذا لم يكن المستخدم مسجلًا يمكنه إنشاء حساب جديد ثم العودة إلى صفحة العمل."
    ].join("\n")
  },
  {
    sourceKey: "kb-login-troubleshooting-2026",
    title: "حل مشاكل تسجيل الدخول",
    category: "auth",
    source: "support_playbook",
    tags: ["login", "troubleshooting", "support"],
    content: [
      "إذا ظهرت رسالة البريد الإلكتروني أو كلمة المرور غير صحيحة، يجب التأكد من كتابة البريد وكلمة المرور بشكل صحيح.",
      "إذا ظهرت رسالة الحساب غير موجود، يحتاج المستخدم إلى إنشاء حساب أو التأكد من البريد المستخدم.",
      "إذا ظهرت رسالة خدمة تسجيل الدخول غير مفعلة، فهذا يعني أن مزود الدخول مثل Google أو Apple أو Microsoft غير مفعّل في إعدادات الخادم.",
      "إذا ظهر خطأ اتصال بالخادم، جرّب تحديث الصفحة، التأكد من الاتصال، أو المحاولة لاحقًا.",
      "إذا استمرت المشكلة، يجب مراجعة سجلات الخادم لمعرفة status code والرسالة الحقيقية."
    ].join("\n")
  },
  {
    sourceKey: "kb-subscription-upgrade-2026",
    title: "طريقة الاشتراك والترقية",
    category: "billing",
    source: "official_billing",
    tags: ["subscription", "upgrade", "billing", "ترقية", "اشتراك", "باقتي"],
    content: [
      "يمكن للمستخدم ترقية باقته من صفحة الاشتراكات أو الباقات داخل الموقع.",
      "إذا سأل المستخدم: كيف أرفع باقتي؟ فالخطوة الصحيحة هي فتح صفحة الاشتراكات أو الباقات، اختيار Spark أو Tuwaiq أو Pioneer، ثم إكمال الدفع أو التفعيل المتاح.",
      "اختيار Spark مناسب للاستخدام اليومي الخفيف، وTuwaiq مناسب للاستخدام المتوسط والتحليل والكتابة، وPioneer مناسب للاستخدام العالي والمشاريع الكثيرة.",
      "بعد الترقية يتم تحديث حدود XP والتوكن والصور حسب الباقة الجديدة.",
      "مدة الاشتراك 30 يومًا، ويجب أن تظهر حالة الاشتراك وتاريخ الانتهاء في الحساب عند توفر بيانات الدفع."
    ].join("\n")
  },
  {
    sourceKey: "kb-privacy-policy-2026",
    title: "سياسة الخصوصية وحفظ البيانات",
    category: "privacy",
    source: "official_privacy",
    tags: ["privacy", "data", "sanitization"],
    content: [
      "Orlixor لا يستخدم بيانات المستخدمين للتدريب العشوائي التلقائي.",
      "أي محتوى يُستخدم لتحسين المعرفة يجب أن يمر عبر Sanitization لإزالة الإيميلات، أرقام الجوال، API keys، التوكنات، الروابط الخاصة، والعناوين الحساسة.",
      "الردود الممتازة لا تدخل Knowledge Base تلقائيًا إلا بعد موافقة الأدمن.",
      "Fine-tuning معطل حاليًا، والتحسين يعتمد على RAG، مراجعة الجودة، تحسين الـ prompts، وتقييمات المستخدمين.",
      "لوحة الأدمن يجب أن تعرض محتوى منقحًا فقط ولا تعرض بيانات حساسة."
    ].join("\n")
  },
  {
    sourceKey: "kb-models-how-it-works-2026",
    title: "طريقة عمل النماذج واختيارها",
    category: "models",
    source: "ai_platform_docs",
    tags: ["models", "router", "rag"],
    content: [
      "AI Intelligence Layer يحلل نوع السؤال وحجمه وحاجة الطلب إلى reasoning أو coding أو creativity أو سرعة.",
      "المستخدم المجاني يستخدم النموذج الأقل تكلفة للدردشة النصية الأساسية.",
      "المشترك يحصل على نماذج أوسع حسب الباقة: Spark للاستخدام المتوسط، Tuwaiq للتحليل والكتابة الاحترافية، وPioneer لأعلى حدود وأولوية.",
      "قبل إرسال السؤال للنموذج، يحاول RAG استرجاع أفضل 3 إلى 5 مصادر معتمدة من Knowledge Base.",
      "Model Router يوازن بين الجودة والتكلفة والحدود اليومية والشهرية حتى لا ترتفع التكلفة على المنصة."
    ].join("\n")
  },
  {
    sourceKey: "kb-user-faq-2026",
    title: "أسئلة شائعة للمستخدمين",
    category: "faq",
    source: "support_faq",
    tags: ["faq", "support", "users"],
    content: [
      "س: كم سعر باقة طويق؟ ج: باقة Tuwaiq سعرها 29 ريال لمدة 30 يومًا وتمنح 250 XP يوميًا.",
      "س: كم XP يوميًا في Spark؟ ج: تمنح Spark مقدار 80 XP يوميًا.",
      "س: هل يتم حفظ محادثاتي؟ ج: قد تُحفظ المحادثات داخل حسابك لتحسين التجربة، لكن لا يتم تدريب النموذج عليها تلقائيًا، وأي محتوى معرفي يحتاج Sanitization وموافقة أدمن.",
      "س: لماذا لا أستطيع تسجيل الدخول؟ ج: قد يكون السبب كلمة مرور خاطئة، حساب غير موجود، مزود دخول غير مفعّل، أو مشكلة اتصال بالخادم.",
      "س: كيف أرفع باقتي؟ ج: من صفحة الاشتراكات أو الباقات اختر الباقة المناسبة وأكمل خطوات الدفع أو التفعيل المتاحة."
    ].join("\n")
  },
  {
    sourceKey: "kb-admin-ai-quality-workflow-2026",
    title: "سير عمل جودة الذكاء الاصطناعي",
    category: "admin",
    source: "ai_operations",
    tags: ["quality", "admin", "review"],
    content: [
      "لوحة AI Admin Dashboard تعرض Overview، Knowledge Base، Review Excellent Answers، Feedback Analytics، Model Performance، وRAG Debug.",
      "الردود التي يتم تقييمها كممتازة أو مفيدة للحفظ أو تم حل المشكلة تظهر في Review Excellent Answers.",
      "الأدمن يستطيع تعديل الإجابة قبل اعتمادها، أو رفضها، أو تحويلها إلى Knowledge Base مع status approved.",
      "RAG لا يستخدم المصادر draft أو rejected؛ فقط المصادر approved تدخل في الاسترجاع.",
      "Fine-tuning يبقى Disabled حتى تتوفر Dataset نظيفة ومراجعة بشرية."
    ].join("\n")
  }
];

const AI_QUALITY_TEST_SET = [
  { id: "q001", question: "كم سعر باقة طويق؟", idealAnswer: "باقة Tuwaiq سعرها 29 ريال لمدة 30 يومًا وتمنح 250 XP يوميًا.", expectedSourceKey: "kb-plans-pricing-2026" },
  { id: "q002", question: "كم XP يوميًا في Spark؟", idealAnswer: "باقة Spark تمنح 80 XP يوميًا وسعرها 9 ريال لمدة 30 يومًا.", expectedSourceKey: "kb-plans-pricing-2026" },
  { id: "q003", question: "ما حدود التوكن في الباقة المجانية؟", idealAnswer: "المجانية تملك 20K توكن يوميًا و600K شهريًا وحد 2K توكن للرسالة.", expectedSourceKey: "kb-xp-token-limits-2026" },
  { id: "q004", question: "كم صورة أقدر أستخدم يوميًا في Pioneer؟", idealAnswer: "Pioneer تسمح حتى 60 صورة يوميًا حسب سياسة الحدود.", expectedSourceKey: "kb-xp-token-limits-2026" },
  { id: "q005", question: "ما سياسة الاستخدام العادل؟", idealAnswer: "هي سياسة تمنع الاستنزاف عبر حدود XP والتوكن والصور ومعدل الطلبات.", expectedSourceKey: "kb-fair-use-policy-2026" },
  { id: "q006", question: "لماذا تظهر نافذة تأكيد للرسائل الطويلة؟", idealAnswer: "لأن الرسالة تتجاوز حد الرسالة الواحدة وقد تحتاج تكلفة إضافية من XP والتوكن.", expectedSourceKey: "kb-fair-use-policy-2026" },
  { id: "q007", question: "كيف أسجل الدخول؟", idealAnswer: "يمكنك تسجيل الدخول بالبريد وكلمة المرور أو بمزود اجتماعي إذا كان مفعلاً.", expectedSourceKey: "kb-login-how-to-2026" },
  { id: "q008", question: "هل زر تذكرني يحفظ الجلسة؟", idealAnswer: "نعم، يحافظ على الجلسة عبر token أو cookie آمن حسب إعدادات الموقع.", expectedSourceKey: "kb-login-how-to-2026" },
  { id: "q009", question: "لماذا لا أستطيع تسجيل الدخول؟", idealAnswer: "قد يكون السبب كلمة مرور خاطئة، حساب غير موجود، مزود غير مفعل، أو مشكلة اتصال بالخادم.", expectedSourceKey: "kb-login-troubleshooting-2026" },
  { id: "q010", question: "ماذا تعني خدمة تسجيل الدخول غير مفعلة؟", idealAnswer: "تعني أن مزود الدخول مثل Google أو Apple أو Microsoft غير مفعّل في إعدادات الخادم.", expectedSourceKey: "kb-login-troubleshooting-2026" },
  { id: "q011", question: "كيف أرفع باقتي؟", idealAnswer: "اذهب إلى صفحة الاشتراكات أو الباقات واختر الباقة المناسبة ثم أكمل التفعيل أو الدفع.", expectedSourceKey: "kb-subscription-upgrade-2026" },
  { id: "q012", question: "ما أفضل باقة للمشاريع الكثيرة؟", idealAnswer: "Pioneer مناسبة للاستخدام العالي والمشاريع الكثيرة لأنها تمنح حدودًا أعلى وأولوية.", expectedSourceKey: "kb-subscription-upgrade-2026" },
  { id: "q013", question: "هل يتم حفظ محادثاتي؟", idealAnswer: "قد تُحفظ داخل حسابك لتحسين التجربة، لكنها لا تستخدم لتدريب عشوائي تلقائي.", expectedSourceKey: "kb-privacy-policy-2026" },
  { id: "q014", question: "هل تستخدمون بياناتي للتدريب؟", idealAnswer: "لا يوجد تدريب عشوائي تلقائي، وأي استخدام معرفي يحتاج تنقيحًا وموافقة أدمن.", expectedSourceKey: "kb-privacy-policy-2026" },
  { id: "q015", question: "ما البيانات الحساسة التي يتم حذفها؟", idealAnswer: "الإيميلات والجوالات ومفاتيح API والتوكنات والروابط الخاصة والعناوين الحساسة.", expectedSourceKey: "kb-privacy-policy-2026" },
  { id: "q016", question: "ما الفرق بين النماذج؟", idealAnswer: "الراوتر يختار النموذج حسب نوع السؤال وحجمه وحاجته للسرعة أو التحليل أو الإبداع.", expectedSourceKey: "kb-models-how-it-works-2026" },
  { id: "q017", question: "هل المستخدم المجاني يستخدم نموذج متقدم؟", idealAnswer: "المستخدم المجاني يستخدم النموذج الأقل تكلفة للدردشة النصية الأساسية.", expectedSourceKey: "kb-models-how-it-works-2026" },
  { id: "q018", question: "كيف يعمل RAG؟", idealAnswer: "يسترجع أفضل 3 إلى 5 مصادر معتمدة من Knowledge Base قبل إرسال السؤال للنموذج.", expectedSourceKey: "kb-models-how-it-works-2026" },
  { id: "q019", question: "ما النماذج المتاحة في Tuwaiq؟", idealAnswer: "Tuwaiq مناسبة للتحليل والكتابة الاحترافية وتتيح نماذج أوسع من المجانية وSpark.", expectedSourceKey: "kb-models-how-it-works-2026" },
  { id: "q020", question: "هل RAG يستخدم المصادر المرفوضة؟", idealAnswer: "لا، RAG يستخدم فقط المصادر التي حالتها approved ولا يستخدم draft أو rejected.", expectedSourceKey: "kb-admin-ai-quality-workflow-2026" },
  { id: "q021", question: "هل Fine-tuning مفعل؟", idealAnswer: "Fine-tuning معطل حاليًا ولا يبدأ إلا بعد Dataset نظيفة ومراجعة بشرية.", expectedSourceKey: "kb-admin-ai-quality-workflow-2026" },
  { id: "q022", question: "أين تظهر الردود الممتازة؟", idealAnswer: "تظهر في Review Excellent Answers عندما يتم تقييمها ممتازة أو مفيدة للحفظ أو تم حل المشكلة.", expectedSourceKey: "kb-admin-ai-quality-workflow-2026" },
  { id: "q023", question: "كم مدة الاشتراك؟", idealAnswer: "مدة الاشتراك في الباقات المدفوعة 30 يومًا.", expectedSourceKey: "kb-plans-pricing-2026" },
  { id: "q024", question: "كم حد توكن Pioneer الشهري؟", idealAnswer: "Pioneer تملك حدًا شهريًا قدره 30M توكن.", expectedSourceKey: "kb-xp-token-limits-2026" },
  { id: "q025", question: "ما تكلفة تحليل ملف؟", idealAnswer: "تحليل ملف يستهلك 20 XP حسب الاستهلاك الافتراضي.", expectedSourceKey: "kb-xp-token-limits-2026" },
  { id: "q026", question: "ما تكلفة البحث المتقدم؟", idealAnswer: "البحث المتقدم يستهلك 25 XP حسب الاستهلاك الافتراضي.", expectedSourceKey: "kb-xp-token-limits-2026" },
  { id: "q027", question: "ما رسالة تجاوز الحد الشهري؟", idealAnswer: "عند تجاوز الحد الشهري يمكن الترقية أو انتظار التجديد القادم.", expectedSourceKey: "kb-fair-use-policy-2026" },
  { id: "q028", question: "ما سبب خطأ الحساب غير موجود؟", idealAnswer: "يعني أن البريد غير مسجل أو يحتاج المستخدم إنشاء حساب جديد.", expectedSourceKey: "kb-login-troubleshooting-2026" },
  { id: "q029", question: "هل يمكن تعديل الرد الممتاز قبل اعتماده؟", idealAnswer: "نعم، يستطيع الأدمن تعديله قبل تحويله إلى Knowledge Base أو رفضه.", expectedSourceKey: "kb-admin-ai-quality-workflow-2026" },
  { id: "q030", question: "ما أفضل باقة للاستخدام المتوسط؟", idealAnswer: "Tuwaiq مناسبة للاستخدام المتوسط والتحليل والكتابة وتكلف 29 ريال لمدة 30 يومًا.", expectedSourceKey: "kb-subscription-upgrade-2026" }
];

function splitSeedContent(content, maxLength = 1400) {
  const text = String(content || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const chunks = [];
  let current = "";
  for (const paragraph of paragraphs.length ? paragraphs : [text]) {
    if ((current + "\n\n" + paragraph).trim().length > maxLength && current) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current = `${current ? `${current}\n\n` : ""}${paragraph}`;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function seedAiKnowledgeBase(client, options = {}) {
  if (!client || typeof client.saveKnowledgeSource !== "function" || typeof client.saveKnowledgeChunk !== "function") {
    return { seeded: 0, chunks: 0, skipped: true, reason: "Knowledge Base client methods are unavailable." };
  }

  const entries = Array.isArray(options.entries) ? options.entries : AI_KNOWLEDGE_SEED;
  let seeded = 0;
  let chunksCount = 0;

  for (const entry of entries) {
    const sourceKey = String(entry.sourceKey || entry.source_key || "").trim();
    const title = String(entry.title || "").trim();
    const content = String(entry.content || "").trim();
    if (!sourceKey || !title || !content) continue;

    const sanitized = aiIntelligence.sanitizeSensitiveText(content);
    const source = await client.saveKnowledgeSource({
      source_key: sourceKey,
      source_type: "official_seed",
      title,
      category: entry.category || "faq",
      status: "approved",
      source: entry.source || "official_seed",
      tags: entry.tags || [],
      quality_score: entry.qualityScore || entry.quality_score || 88,
      is_active: true,
      metadata: {
        seed_version: "2026-05-18",
        privacy: "sanitized",
        privacy_findings: sanitized.findings
      }
    });

    const chunks = splitSeedContent(sanitized.text);
    for (let index = 0; index < chunks.length; index += 1) {
      const chunkSanitized = aiIntelligence.sanitizeSensitiveText(chunks[index]);
      await client.saveKnowledgeChunk({
        source_id: source?.id || source?.source_id || null,
        chunk_key: `${sourceKey}:${index + 1}`,
        title: chunks.length > 1 ? `${title} #${index + 1}` : title,
        content: chunkSanitized.text,
        sanitized_content: chunkSanitized.text,
        task_type: entry.taskType || entry.task_type || null,
        category: entry.category || "faq",
        status: "approved",
        tags: entry.tags || [],
        quality_score: entry.qualityScore || entry.quality_score || 88,
        feedback_score: 15,
        metadata: {
          seed_source_key: sourceKey,
          privacy_findings: chunkSanitized.findings
        }
      });
      chunksCount += 1;
    }
    seeded += 1;
  }

  return { seeded, chunks: chunksCount, skipped: false };
}

module.exports = {
  AI_KNOWLEDGE_SEED,
  AI_QUALITY_TEST_SET,
  seedAiKnowledgeBase
};

if (require.main === module) {
  (async () => {
    const { createFallbackDatabaseClient } = require("./fallback-db");
    const client = createFallbackDatabaseClient();
    await client.initialize();
    const result = await seedAiKnowledgeBase(client);
    console.log(JSON.stringify(result, null, 2));
    await client.close?.();
  })().catch((error) => {
    console.error(error?.stack || error?.message || error);
    process.exit(1);
  });
}
