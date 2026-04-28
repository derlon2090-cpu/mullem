(() => {
  const app = document.getElementById("sectionApp");
  if (!app) return;

  const LOGIN_FRAME_URL = "login.html?embed=1&mode=login";
  const LOGIN_PAGE_URL = "login.html";
  const STUDENT_PAGE_URL = "student.html";
  const GUEST_URL = "guest.html";
  const HOME_URL = "index.html";
  const SEARCH_PARAM = "section";
  const workspaceMode = document.body?.dataset.workspaceMode === "home" ? "home" : "sections";
  const isHomeWorkspace = workspaceMode === "home";
  const shellBaseUrl = isHomeWorkspace ? HOME_URL : GUEST_URL;
  const themeKey = "orlixor_guest_theme";
  const legacyStorageKeys = {
    users: "mlm_users",
    currentUser: "mlm_current_user"
  };

  const icons = {
    logo: '<img src="orlixor-mark.png" alt="" aria-hidden="true">',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>',
    login: '<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="3"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M20 11.5c0 4.1-3.8 7.5-8.5 7.5-1.2 0-2.4-.2-3.4-.7L4 20l1.4-3.2A7.1 7.1 0 0 1 3 11.5C3 7.4 6.8 4 11.5 4S20 7.4 20 11.5Z"/></svg>',
    projects: '<svg viewBox="0 0 24 24"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10l2 2h5.5A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5z"/><path d="M8 11h8M8 14h5"/></svg>',
    library: '<svg viewBox="0 0 24 24"><path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H19v16H8.5A2.5 2.5 0 0 0 6 21z"/><path d="M6 5.5V21H5a2 2 0 0 1-2-2V7.5A2.5 2.5 0 0 1 5.5 5z"/></svg>',
    subjects: '<svg viewBox="0 0 24 24"><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"/><path d="M5 7h14a2 2 0 0 1 2 2v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5V9a2 2 0 0 1 2-2Z"/><path d="M3 12h18M10 15h4"/></svg>',
    ai: '<svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M4.2 7l3.2 1.8M16.6 15.2 19.8 17M4.2 17l3.2-1.8M16.6 8.8 19.8 7"/><circle cx="12" cy="12" r="3.8"/></svg>',
    notes: '<svg viewBox="0 0 24 24"><path d="M7 4h8l4 4v11a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M15 4v4h4M8.5 13H15M8.5 16H13"/></svg>',
    tests: '<svg viewBox="0 0 24 24"><path d="M7 4h8l4 4v11a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M15 4v4h4M8.5 13l1.7 1.7L15 10"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="m12 3 1.8 2.1 2.8-.2 1 2.6 2.5 1-.2 2.8L21 12l-2.1 1.7.2 2.8-2.5 1-1 2.6-2.8-.2L12 21l-1.8-2.1-2.8.2-1-2.6-2.5-1 .2-2.8L3 12l2.1-1.7-.2-2.8 2.5-1 1-2.6 2.8.2Z"/><circle cx="12" cy="12" r="3.2"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M15 18H5.5a1.5 1.5 0 0 1-1.2-2.4l1.2-1.6V10a6.5 6.5 0 1 1 13 0v4l1.2 1.6a1.5 1.5 0 0 1-1.2 2.4H9"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.3A8 8 0 0 1 9.7 4 8 8 0 1 0 20 14.3Z"/></svg>',
    crown: '<svg viewBox="0 0 24 24"><path d="m3 8 4.4 4.4L12 6l4.6 6.4L21 8l-2 10H5L3 8Z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>',
    attach: '<svg viewBox="0 0 24 24"><path d="m21.4 11-8.5 8.5a5 5 0 1 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 4.9l-9.2 9.3a2 2 0 1 1-2.9-2.8l8-8"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></svg>',
    document: '<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5"/></svg>',
    internet: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>',
    code: '<svg viewBox="0 0 24 24"><path d="m8 8-4 4 4 4"/><path d="m16 8 4 4-4 4"/><path d="m14 5-4 14"/></svg>',
    delete: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7 7 20a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9L18 7"/><path d="M9 7V4h6v3"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    refresh: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15.4-6.4L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 21v-5h5"/></svg>',
    thumbsUp: '<svg viewBox="0 0 24 24"><path d="M7 10v11H4V10h3Z"/><path d="M10 21h6a2 2 0 0 0 2-1.6l1.2-6a2 2 0 0 0-2-2.4h-4.5l.7-3.6A2.3 2.3 0 0 0 11 5l-4 5v11h3Z"/></svg>',
    filePdf: '<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5"/><path d="M8 15h8M8 18h5"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2 6.5 20l1-6.2L3 9.6l6.2-.9Z"/></svg>'
  };

  const navItems = [
    { key: "dashboard", label: "لوحة التحكم", icon: "home" },
    { key: "messages", label: "المحادثات", icon: "chat" },
    { key: "projects", label: "المشاريع", icon: "projects" },
    { key: "library", label: "المكتبة", icon: "library" },
    { key: "subjects", label: "المواد الدراسية", icon: "subjects" },
    { key: "ai-tools", label: "أدوات الذكاء الاصطناعي", icon: "ai" },
    { key: "notes", label: "الملاحظات", icon: "notes" },
    { key: "tests", label: "الاختبارات", icon: "tests" },
    { key: "settings", label: "الإعدادات", icon: "settings" }
  ];

  const sectionProfiles = {
    dashboard: buildProfile({
      key: "dashboard",
      heroTitle: "مرحبًا بك!",
      heroSubtitle: "أنا Orlixor AI، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟",
      responseMode: "مرن",
      responseLength: "متوازن",
      webEnabled: true,
      quickCards: [
        ["تحليل البيانات", "تحميل وتحليل ملف بيانات", "ai"],
        ["تلخيص المحتوى", "تلخيص النصوص والملفات", "document"],
        ["كتابة المحتوى", "إنشاء محتوى احترافي", "sparkle"],
        ["أفكار وإبداع", "الحصول على أفكار جديدة", "star"]
      ],
      groups: [
        group("اليوم", [
          thread("dash-1", "تحليل السوق السعودي 2024", "10:30 AM", "أريد تحليل السوق السعودي في عام 2024 في قطاع التجارة الإلكترونية.", assistantReply("إليك تحليلًا شاملًا للسوق السعودي في قطاع التجارة الإلكترونية لعام 2024:", [
            "نمو السوق مدفوع بزيادة الاعتماد على الشراء الرقمي والخدمات اللوجستية السريعة.",
            "أبرز المحركات الحالية: المدفوعات الرقمية، سلوك المستهلك المحمول، والطلب على التوصيل في نفس اليوم.",
            "أهم التحديات: المنافسة السعرية، ارتفاع تكلفة الإعلانات، والحاجة إلى تجربة مستخدم أكثر سلاسة."
          ]), "ملف تحليلي أساسي", { created: "اليوم 10:30 AM", messages: "8 رسائل", updated: "منذ دقيقة واحدة" }),
          thread("dash-2", "خطة إطلاق أكاديمية", "9:10 AM", "أعطني خطة إطلاق مختصرة لمنصة تعليمية جديدة في السعودية.", assistantReply("هذه بداية سريعة لخطة الإطلاق:", [
            "بناء عرض قيمة واضح للطلاب وأولياء الأمور.",
            "البدء بمحتوى مجاني قصير لاكتساب الثقة.",
            "ربط الإطلاق بحملة محتوى وتجارب استخدام مباشرة."
          ]), "خطة_إطلاق.pdf", { created: "اليوم 9:10 AM", messages: "5 رسائل", updated: "منذ 12 دقيقة" })
        ]),
        group("أمس", [
          thread("dash-3", "دراسة جدوى مشروع", "أمس", "أحتاج إلى دراسة جدوى أولية لمشروع تعليمي صغير.", assistantReply("تم إعداد تصور أولي يشمل:", [
            "الهدف من المشروع والجمهور المستهدف.",
            "التكاليف التشغيلية الأساسية والإيرادات المتوقعة.",
            "مخاطر التنفيذ وخيارات التوسع المرحلي."
          ]), "دراسة_جدوى.docx", { created: "أمس 6:20 PM", messages: "6 رسائل", updated: "أمس" })
        ])
      ]
    }),
    messages: buildProfile({
      key: "messages",
      heroTitle: "مرحبًا أحمد! 👋",
      heroSubtitle: "أنا Orlixor AI، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟",
      responseMode: "شرح",
      responseLength: "مفصل",
      webEnabled: true,
      quickCards: [
        ["تحليل البيانات", "تحميل وتحليل ملف بيانات", "ai"],
        ["تلخيص المحتوى", "تلخيص النصوص والملفات", "document"],
        ["كتابة المحتوى", "إنشاء محتوى احترافي", "sparkle"],
        ["أفكار وإبداع", "الحصول على أفكار جديدة", "star"]
      ],
      groups: [
        group("اليوم", [
          thread("msg-1", "تحليل السوق السعودي 2024", "10:30 AM", "أريد تحليل السوق السعودي في عام 2024 في قطاع التجارة الإلكترونية.", assistantReply("بالطبع، إليك تحليلًا شاملًا للسوق السعودي في قطاع التجارة الإلكترونية لعام 2024:", [
            "يشهد السوق السعودي نموًا متسارعًا مدفوعًا برؤية 2030 وزيادة انتشار التسوق عبر الإنترنت.",
            "نسبة المتسوقين عبر الإنترنت تتجاوز 79% مع توسع واضح في المدفوعات الرقمية.",
            "أكبر الفرص الحالية في اللوجستيات، تجربة المستخدم، والتخصيص الذكي للعروض."
          ]), "تقرير_السوق_السعودي.pdf", { created: "اليوم 10:30 AM", messages: "8 رسائل", updated: "منذ دقيقة واحدة" }),
          thread("msg-2", "مساعدة في كتابة محتوى", "9:14 AM", "اكتب لي مقدمة احترافية لتقرير عن الذكاء الاصطناعي في التعليم.", assistantReply("هذه مقدمة جاهزة بصياغة احترافية:", [
            "يشهد قطاع التعليم تحولًا متسارعًا بفضل تقنيات الذكاء الاصطناعي.",
            "أصبح بالإمكان تخصيص التعلم، رفع كفاءة التقييم، وتحسين تجربة الطالب اليومية.",
            "هذا التقرير يستعرض الأثر العملي لتلك التقنيات والفرص التي تفتحها للمؤسسات التعليمية."
          ]), "مقدمة_تقرير.docx", { created: "اليوم 9:14 AM", messages: "4 رسائل", updated: "منذ 14 دقيقة" })
        ]),
        group("هذا الأسبوع", [
          thread("msg-3", "تلخيص مقال علمي", "هذا الأسبوع", "لخّص لي هذا المقال العلمي في ثلاث نقاط واضحة.", assistantReply("تم تلخيص المقال في ثلاث نقاط رئيسية:", [
            "الفكرة المحورية للمقال تشرح أثر الأتمتة على جودة المخرجات.",
            "الدراسة تؤكد أن الدمج الصحيح للتقنيات يزيد من الكفاءة دون تقليل الجودة.",
            "أوصت النتائج بالتركيز على التدريب المستمر والقياس المرحلي."
          ]), "ملخص_مقال.md", { created: "هذا الأسبوع", messages: "3 رسائل", updated: "منذ يومين" })
        ])
      ]
    }),
    projects: buildProfile({
      key: "projects",
      heroTitle: "إدارة المشاريع بوضوح",
      heroSubtitle: "نظم خططك وملفاتك ومحادثاتك في مشروع واحد مرتب.",
      responseMode: "تنفيذي",
      responseLength: "متوازن",
      webEnabled: false,
      quickCards: [
        ["خطة مشروع", "هيكلة الأهداف والمهام", "projects"],
        ["تقسيم المهام", "تحويل المشروع إلى خطوات", "document"],
        ["توليد أفكار", "اقتراح مراحل تنفيذ جديدة", "sparkle"],
        ["صياغة العرض", "بناء عرض مشروع احترافي", "star"]
      ],
      groups: [
        group("اليوم", [
          thread("proj-1", "خطة متجر إلكتروني", "اليوم", "أنشئ لي خارطة طريق لمشروع متجر إلكتروني تعليمي.", assistantReply("هذه خارطة طريق أولية للمشروع:", [
            "مرحلة الاكتشاف: تحديد الفئة المستهدفة وعرض القيمة.",
            "مرحلة التنفيذ: الواجهة، إدارة المحتوى، وربط أدوات الشحن والدفع.",
            "مرحلة الإطلاق: المحتوى، التحليلات، وخطة التحسين بعد أول شهر."
          ]), "خارطة_طريق.pptx", { created: "اليوم 12:45 PM", messages: "7 رسائل", updated: "منذ 5 دقائق" }),
          thread("proj-2", "لوحة متابعة فريق", "اليوم", "ساعدني في بناء لوحة متابعة أسبوعية لفريق العمل.", assistantReply("لإنشاء لوحة متابعة فعالة نبدأ بـ:", [
            "تقسيم اللوحة إلى الأولويات والمهام الجارية والمتأخرة.",
            "تعيين مالك واضح لكل مهمة مع تاريخ تسليم.",
            "مراجعة أسبوعية قصيرة تعتمد على مؤشرات قابلة للقياس."
          ]), "متابعة_الفريق.xlsx", { created: "اليوم 11:20 AM", messages: "5 رسائل", updated: "منذ 18 دقيقة" })
        ]),
        group("هذا الأسبوع", [
          thread("proj-3", "مشروع هوية منصة", "هذا الأسبوع", "رتب لي خطوات تصميم هوية بصرية لمنصة تعليمية.", assistantReply("الخطوات المقترحة للهوية:", [
            "تحديد شخصية العلامة ومشاعرها الأساسية.",
            "اختيار نظام ألوان وخطوط متسق مع طبيعة الجمهور.",
            "إخراج مكتبة عناصر مرئية قابلة للتوسع عبر الويب والتطبيق."
          ]), "هوية_المنصة.fig", { created: "هذا الأسبوع", messages: "6 رسائل", updated: "منذ يوم" })
        ])
      ]
    }),
    library: buildProfile({
      key: "library",
      heroTitle: "مكتبتك مرتبة في مكان واحد",
      heroSubtitle: "كل الملفات والمراجع والمستندات قابلة للبحث والوصول السريع.",
      responseMode: "منظم",
      responseLength: "قصير",
      webEnabled: false,
      quickCards: [
        ["تنظيم المستندات", "ترتيب الملفات حسب المشاريع", "library"],
        ["استخراج الملخصات", "تلخيص سريع للمستندات", "document"],
        ["تحويل لملاحظات", "تحويل الملف إلى نقاط مذاكرة", "notes"],
        ["أسئلة من الملف", "إنشاء أسئلة مباشرة من المرجع", "tests"]
      ],
      groups: [
        group("مراجع حديثة", [
          thread("lib-1", "مرجع الذكاء الاصطناعي", "مضاف اليوم", "لخّص هذا المرجع في نقاط عملية قصيرة.", assistantReply("الملف يحتوي على محاور رئيسية يمكن تقسيمها إلى:", [
            "تعريفات أساسية ومصطلحات شائعة.",
            "أمثلة تطبيقية في التعليم والعمل.",
            "قائمة مراجع سريعة تساعد على التوسع لاحقًا."
          ]), "مرجع_AI.pdf", { created: "اليوم 8:40 AM", messages: "4 رسائل", updated: "اليوم" }),
          thread("lib-2", "ملف تسويق رقمي", "مضاف أمس", "استخرج لي أهم ثلاث أفكار من هذا الملف.", assistantReply("الأفكار الأبرز من الملف:", [
            "أهمية الرسائل القصيرة الواضحة في الإعلانات.",
            "القياس المستمر للحملات وتحسينها أسبوعيًا.",
            "دمج المحتوى التعليمي مع دعوات الإجراء لرفع التحويل."
          ]), "تسويق_رقمي.pdf", { created: "أمس 7:15 PM", messages: "3 رسائل", updated: "أمس" })
        ])
      ]
    }),
    subjects: buildProfile({
      key: "subjects",
      heroTitle: "المواد الدراسية",
      heroSubtitle: "تحكم ذكي في المسار الدراسي، المادة، والشرح المناسب لكل سؤال.",
      responseMode: "تعليمي",
      responseLength: "مفصل",
      webEnabled: true,
      quickCards: [
        ["شرح درس", "تبسيط الدروس خطوة بخطوة", "subjects"],
        ["حل واجب", "حل موجه بحسب المادة", "document"],
        ["اختبرني", "أسئلة تدريبية سريعة", "tests"],
        ["تلخيص وحدة", "ملخص مركز وسهل", "notes"]
      ],
      groups: [
        group("اليوم", [
          thread("sub-1", "مراجعة الرياضيات", "اليوم", "اشرح لي مفهوم الدوال التربيعية ببساطة.", assistantReply("لفهم الدوال التربيعية بسرعة ركز على:", [
            "الصيغة العامة: ax² + bx + c.",
            "الرسم البياني يكون على شكل قطع مكافئ.",
            "الاتجاه ونقطة الرأس يتحددان بقيمة a والعوامل الأخرى."
          ]), "رياضيات_وحدة_الدوال.pdf", { created: "اليوم 1:00 PM", messages: "9 رسائل", updated: "منذ 3 دقائق" }),
          thread("sub-2", "علوم - الطاقة", "اليوم", "أعطني ملخصًا سريعًا لدرس الطاقة.", assistantReply("ملخص مختصر للدرس:", [
            "الطاقة لا تفنى ولا تستحدث ولكن تتحول من شكل لآخر.",
            "من أهم أشكالها: الحركية، الحرارية، الكهربائية، والكيميائية.",
            "فهم التحولات يساعد في تفسير كثير من التطبيقات اليومية."
          ]), "علوم_الطاقة.txt", { created: "اليوم 11:50 AM", messages: "4 رسائل", updated: "منذ 25 دقيقة" })
        ])
      ]
    }),
    "ai-tools": buildProfile({
      key: "ai-tools",
      heroTitle: "أدوات الذكاء الاصطناعي",
      heroSubtitle: "مجموعة خدمات سريعة تساعدك على الإنتاج، الصياغة، والتحليل.",
      responseMode: "احترافي",
      responseLength: "متوازن",
      webEnabled: true,
      quickCards: [
        ["كتابة المحتوى", "صياغة نصوص احترافية", "sparkle"],
        ["تحليل البيانات", "قراءة وتقارير سريعة", "ai"],
        ["تلخيص الملفات", "تلخيص منظم ومباشر", "document"],
        ["توليد أفكار", "أفكار جديدة ومبتكرة", "star"]
      ],
      groups: [
        group("الأكثر استخدامًا", [
          thread("ai-1", "أداة كتابة المحتوى", "الآن", "اكتب لي وصفًا تسويقيًا قصيرًا لمنصة تعليمية.", assistantReply("وصف تسويقي جاهز:", [
            "منصة تعليمية ذكية تساعد الطالب على الفهم والحل والتلخيص داخل تجربة حديثة وسريعة.",
            "تجمع بين الشرح المنظم، التخصيص، وسهولة الوصول من أي جهاز.",
            "مصممة لتبسيط المذاكرة اليومية وتحويلها إلى تجربة أكثر راحة وفاعلية."
          ]), "وصف_تسويقي.docx", { created: "الآن", messages: "2 رسائل", updated: "الآن" }),
          thread("ai-2", "تحليل ملف مبيعات", "اليوم", "حلل لي هذا الملف واخرج أهم الملاحظات.", assistantReply("أهم الملاحظات الأولية من الملف:", [
            "المنتجات الأعلى أداءً ظهرت في نهاية الأسبوع.",
            "هناك تراجع ملحوظ في معدل التحويل في منتصف القمع.",
            "أفضل فرصة تحسين حاليًا هي اختبار الرسائل والعروض على الصفحة الرئيسية."
          ]), "مبيعات_Q1.xlsx", { created: "اليوم 9:30 AM", messages: "5 رسائل", updated: "اليوم" })
        ])
      ]
    }),
    notes: buildProfile({
      key: "notes",
      heroTitle: "الملاحظات",
      heroSubtitle: "قائمة ذكية للملاحظات السريعة داخل واجهة موحدة ومنظمة.",
      responseMode: "مختصر",
      responseLength: "قصير",
      webEnabled: false,
      quickCards: [
        ["ملاحظة جديدة", "ابدأ تدوين فكرة سريعة", "notes"],
        ["تلخيص إلى ملاحظات", "تحويل الشرح إلى نقاط", "document"],
        ["فرز حسب المشروع", "ترتيب الملاحظات بذكاء", "projects"],
        ["أسئلة من الملاحظة", "حوّل المعلومة لاختبار", "tests"]
      ],
      groups: [
        group("اليوم", [
          thread("note-1", "أفكار المشروع الجديد", "منذ 5 دقائق", "رتب لي أفكار المشروع إلى قائمة تنفيذية.", assistantReply("تم تحويل الأفكار إلى قائمة أولية:", [
            "تعريف الهدف الرئيسي للمشروع.",
            "تقسيم المهام إلى تنفيذ وتسويق وقياس.",
            "تحديد أول خطوة قابلة للتنفيذ خلال اليوم."
          ]), "أفكار_المشروع.md", { created: "اليوم 2:15 PM", messages: "3 رسائل", updated: "منذ 5 دقائق" }),
          thread("note-2", "اجتماع الفريق", "منذ 4 ساعات", "لخص لي قرارات اجتماع اليوم.", assistantReply("ملخص القرارات:", [
            "اعتماد الشكل الأولي للواجهة.",
            "توزيع المهام بين التصميم والبرمجة.",
            "تحديد مراجعة ثانية بعد اكتمال النموذج التفاعلي."
          ]), "اجتماع_الفريق.txt", { created: "اليوم 10:00 AM", messages: "4 رسائل", updated: "منذ 4 ساعات" })
        ])
      ]
    }),
    tests: buildProfile({
      key: "tests",
      heroTitle: "الاختبارات",
      heroSubtitle: "مؤشرات ونتائج واختبارات جاهزة للمتابعة السريعة.",
      responseMode: "تقييمي",
      responseLength: "قصير",
      webEnabled: false,
      quickCards: [
        ["اختبار سريع", "قياس فوري للمستوى", "tests"],
        ["تحليل النتيجة", "قراءة الأداء بدقة", "ai"],
        ["تصميم بنك أسئلة", "أسئلة جديدة لنفس الموضوع", "document"],
        ["خطة تحسين", "اقتراح خطوات بعد الاختبار", "sparkle"]
      ],
      groups: [
        group("هذا الأسبوع", [
          thread("test-1", "اختبار الذكاء الاصطناعي", "منذ 2 يوم", "اعرض لي تحليل نتيجة هذا الاختبار.", assistantReply("قراءة سريعة للنتيجة 95%:", [
            "الفهم النظري ممتاز جدًا.",
            "يحتاج المستخدم إلى تمارين تطبيقية إضافية في الأسئلة المركبة.",
            "أفضل خطوة تالية: اختبار قصير جديد بعد مراجعة 15 دقيقة."
          ]), "نتيجة_الاختبار.pdf", { created: "هذا الأسبوع", messages: "5 رسائل", updated: "منذ يومين" }),
          thread("test-2", "اختبار تحليل البيانات", "منذ 3 يوم", "كيف أرفع درجتي في الاختبار القادم؟", assistantReply("لتحسين الدرجة ركز على:", [
            "حل أسئلة مشابهة لنفس النوعيات التي أخطأت فيها.",
            "تقسيم المراجعة إلى جلسات قصيرة متتابعة.",
            "الرجوع إلى الملخصات ثم التطبيق الفوري بعدها."
          ]), "تحليل_نتيجة.md", { created: "هذا الأسبوع", messages: "4 رسائل", updated: "منذ 3 أيام" })
        ])
      ]
    }),
    settings: buildProfile({
      key: "settings",
      heroTitle: "إعدادات المحادثة",
      heroSubtitle: "اضبط اللغة وطول الرد وأسلوب المساعدة من نفس الواجهة.",
      responseMode: "مرن",
      responseLength: "متوازن",
      webEnabled: true,
      quickCards: [
        ["ضبط اللغة", "اختيار اللغة المناسبة", "internet"],
        ["تخصيص الرد", "تحديد النمط والطول", "settings"],
        ["تجربة الإنترنت", "تفعيل أو إيقاف البحث", "internet"],
        ["إعدادات الذكاء", "تخصيص المساعد الحالي", "ai"]
      ],
      groups: [
        group("آخر التغييرات", [
          thread("set-1", "إعدادات المحادثة", "الآن", "ما أفضل إعدادات لمحادثة تعليمية؟", assistantReply("أفضل إعدادات مقترحة للمحادثة التعليمية:", [
            "نمط الرد: شرح منظم وواضح.",
            "طول الرد: متوازن مع أمثلة عند الحاجة.",
            "تفعيل البحث فقط عندما تحتاج لمعلومة حديثة أو موثقة."
          ]), "إعدادات_مقترحة.txt", { created: "الآن", messages: "2 رسائل", updated: "الآن" })
        ])
      ]
    })
  };

  const state = {
    section: resolveSection(),
    currentUser: null,
    historySearch: {},
    threadState: cloneThreadState(),
    composerDraft: {},
    selectedFiles: [],
    sending: false,
    homeConversationOpen: false,
    theme: loadStoredTheme(),
    authModalOpen: false,
    settingsModalOpen: false,
    authReason: "",
    conversationIds: {},
    settings: {}
  };

  function buildProfile(config) {
    return {
      ...config,
      groups: config.groups || [],
      quickCards: config.quickCards || [],
      responseMode: config.responseMode || "مرن",
      responseLength: config.responseLength || "متوازن",
      webEnabled: Boolean(config.webEnabled)
    };
  }

  function group(title, items) {
    return { title, items };
  }

  function thread(id, title, time, prompt, response, fileLabel, stats) {
    return {
      id,
      title,
      time,
      fileLabel,
      stats,
      messages: [
        { role: "user", body: prompt },
        { role: "assistant", body: response }
      ]
    };
  }

  function assistantReply(heading, bullets) {
    return {
      heading,
      bullets
    };
  }

  function loadStoredTheme() {
    try {
      return localStorage.getItem(themeKey) === "dark" ? "dark" : "light";
    } catch (_) {
      return "light";
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem(themeKey, value);
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function cloneThreadState() {
    const next = {};
    Object.entries(sectionProfiles).forEach(([key, profile]) => {
      next[key] = profile.groups.map((entry) => ({
        title: entry.title,
        items: entry.items.map((item) => ({
          ...item,
          stats: { ...(item.stats || {}) },
          messages: item.messages.map((message) => {
            if (message.role === "assistant") {
              return {
                role: message.role,
                body: { ...message.body, bullets: [...message.body.bullets] }
              };
            }
            return { ...message };
          })
        }))
      }));
    });
    return next;
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function getApiClient() {
    return window.mullemApiClient && typeof window.mullemApiClient.sendChat === "function"
      ? window.mullemApiClient
      : null;
  }

  function syncSessionFromCookies() {
    try {
      window.mullemApiClient?.restorePersistentAuthFromCookies?.();
      window.mullemApiClient?.syncLegacySessionUser?.();
    } catch (_) {
      // Ignore sync issues.
    }
  }

  function normalizeUser(user) {
    if (!user || typeof user !== "object") return null;
    return {
      id: String(user.id || ""),
      name: String(user.name || "").trim() || "مستخدم",
      email: String(user.email || "").trim(),
      role: String(user.role || "student").toLowerCase(),
      stage: String(user.stage || "").trim(),
      grade: String(user.grade || "").trim(),
      subject: String(user.subject || "").trim(),
      xp: Number.isFinite(Number(user.xp)) ? Number(user.xp) : 50
    };
  }

  function getActiveUser() {
    syncSessionFromCookies();
    const apiUser = normalizeUser(getApiClient()?.getSessionUser?.());
    if (apiUser && apiUser.role !== "admin") return apiUser;
    const currentId = String(localStorage.getItem(legacyStorageKeys.currentUser) || "").trim();
    if (!currentId) return null;
    const users = loadJson(legacyStorageKeys.users, []);
    const user = users.find((entry) => String(entry.id) === currentId);
    return normalizeUser(user);
  }

  function isAuthenticated() {
    return Boolean(state.currentUser);
  }

  function getDefaultSection() {
    return isHomeWorkspace ? "messages" : "dashboard";
  }

  function resolveSection() {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get(SEARCH_PARAM) || getDefaultSection();
    return sectionProfiles[requested] ? requested : getDefaultSection();
  }

  function updateUrl(replace = false) {
    const params = new URLSearchParams(window.location.search);
    if (state.section === getDefaultSection()) {
      params.delete(SEARCH_PARAM);
    } else {
      params.set(SEARCH_PARAM, state.section);
    }
    const query = params.toString();
    const url = `${shellBaseUrl}${query ? `?${query}` : ""}`;
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
  }

  function getProfile(sectionKey = state.section) {
    return sectionProfiles[sectionKey] || sectionProfiles.dashboard;
  }

  function getSearchValue(sectionKey = state.section) {
    return state.historySearch[sectionKey] || "";
  }

  function getComposerValue(sectionKey = state.section) {
    return state.composerDraft[sectionKey] || "";
  }

  function setComposerValue(value, sectionKey = state.section) {
    state.composerDraft[sectionKey] = value;
  }

  function getThreadGroups(sectionKey = state.section) {
    return state.threadState[sectionKey] || [];
  }

  function getAllThreads(sectionKey = state.section) {
    return getThreadGroups(sectionKey).flatMap((groupEntry) => groupEntry.items);
  }

  function getActiveThread(sectionKey = state.section) {
    const threads = getAllThreads(sectionKey);
    const activeId = state.activeThreadId?.[sectionKey];
    return threads.find((item) => item.id === activeId) || threads[0] || null;
  }

  function ensureThreadState(sectionKey = state.section) {
    state.activeThreadId = state.activeThreadId || {};
    if (!state.activeThreadId[sectionKey]) {
      const firstThread = getAllThreads(sectionKey)[0];
      state.activeThreadId[sectionKey] = firstThread?.id || "";
    }
    state.settings[sectionKey] = state.settings[sectionKey] || {
      responseMode: getProfile(sectionKey).responseMode,
      language: "العربية",
      responseLength: getProfile(sectionKey).responseLength,
      webEnabled: getProfile(sectionKey).webEnabled
    };
  }

  function filterGroups(sectionKey = state.section) {
    const search = getSearchValue(sectionKey).trim().toLowerCase();
    if (!search) return getThreadGroups(sectionKey);
    return getThreadGroups(sectionKey)
      .map((groupEntry) => ({
        ...groupEntry,
        items: groupEntry.items.filter((item) =>
          `${item.title} ${item.time} ${item.fileLabel}`.toLowerCase().includes(search)
        )
      }))
      .filter((groupEntry) => groupEntry.items.length);
  }

  function getPreviewBalance() {
    return isAuthenticated() ? Math.max(0, Number(state.currentUser.xp || 0)) : 2450;
  }

  function getUserCardMeta() {
    if (isAuthenticated()) {
      return {
        title: state.currentUser.name,
        subtitle: "عضو مميز",
        action: "الإعدادات",
        guest: false
      };
    }
    return {
      title: "ضيف",
      subtitle: "يمكنك تصفح الواجهة قبل الدخول",
      action: "تسجيل الدخول",
      guest: true
    };
  }

  function renderNav() {
    return navItems.map((item) => `
      <button class="guest-nav-link ${item.key === state.section ? "is-active" : ""}" type="button" data-nav="${item.key}">
        <span>${escapeHtml(item.label)}</span>
        <i aria-hidden="true">${icons[item.icon]}</i>
      </button>
    `).join("");
  }

  function renderHistory() {
    const groups = filterGroups();
    const activeThread = getActiveThread();
    return groups.map((groupEntry) => `
      <section class="guest-history-group">
        <h3>${escapeHtml(groupEntry.title)}</h3>
        <div class="guest-history-list">
          ${groupEntry.items.map((item) => `
            <button class="guest-history-item ${activeThread?.id === item.id ? "is-active" : ""}" type="button" data-thread="${item.id}">
              <span class="guest-history-dot">${icons.chat}</span>
              <div class="guest-history-copy">
                <strong>${escapeHtml(item.title)}</strong>
                <small>${escapeHtml(item.time)}</small>
              </div>
              <span class="guest-history-badge">${icons.menu}</span>
            </button>
          `).join("")}
        </div>
      </section>
    `).join("") || '<div class="guest-empty-side">لا توجد عناصر مطابقة لبحثك الآن.</div>';
  }

  function renderQuickCards(profile) {
    const cards = isHomeWorkspace
      ? [
          ["ترجمة", "ترجمة النصوص بدقة", "internet"],
          ["مساعدة برمجية", "حل المشكلات البرمجية", "code"],
          ["أفكار وإبداع", "الحصول على أفكار جديدة", "star"],
          ["كتابة المحتوى", "إنشاء محتوى احترافي", "sparkle"],
          ["تلخيص المحتوى", "تلخيص النصوص والمقالات", "document"],
          ["تحليل البيانات", "تحليل وتصوير البيانات", "ai"]
        ]
      : profile.quickCards;
    return cards.map(([title, desc, icon]) => `
      <button class="guest-quick-card ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-card="${escapeHtml(title)}">
        <i class="guest-quick-icon" aria-hidden="true">${icons[icon]}</i>
        <div class="guest-quick-copy">
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(desc)}</span>
        </div>
      </button>
    `).join("");
  }

  function renderMessage(message) {
    if (message.role === "assistant") {
      return `
        <article class="guest-message assistant">
          <div class="guest-message-mark">${icons.logo}</div>
          <div class="guest-message-body">
            <h3>${escapeHtml(message.body.heading)}</h3>
            <ul>
              ${message.body.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
            <div class="guest-message-actions">
              <button class="ghost-action ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-copy-reply>${icons.copy}</button>
              <button class="ghost-action ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-refresh-reply>${icons.refresh}</button>
              <button class="ghost-action ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-like-reply>${icons.thumbsUp}</button>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <div class="guest-message user">
        <span>${escapeHtml(message.body)}</span>
      </div>
    `;
  }

  function renderConversation(profile) {
    const thread = getActiveThread();
    const messages = thread?.messages || [];
    if (isHomeWorkspace && !state.homeConversationOpen) {
      return "";
    }
    return `
      <section class="guest-conversation-card ${isHomeWorkspace ? "is-home-conversation" : ""}">
        ${isHomeWorkspace ? "" : `
          <header class="guest-conversation-head">
            <div>
              <strong>${escapeHtml(profile.heroTitle)}</strong>
              <p>${escapeHtml(profile.heroSubtitle)}</p>
            </div>
            <span class="guest-conversation-status">${isAuthenticated() ? "جاهز للإرسال" : "وضع الاستعراض"}</span>
          </header>
        `}
        <div class="guest-messages">
          ${messages.map(renderMessage).join("")}
        </div>
      </section>
    `;
  }

  function getMainHero(profile) {
    if (!isHomeWorkspace) {
      return {
        title: profile.heroTitle,
        subtitle: profile.heroSubtitle
      };
    }

    if (isAuthenticated()) {
      const firstName = String(state.currentUser?.name || "بك").trim().split(/\s+/)[0] || "بك";
      return {
        title: `مرحبًا ${firstName}! 👋`,
        subtitle: "أنا Orlixor AI، مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟"
      };
    }

    return {
      title: "مرحبًا بك!",
      subtitle: "أنا Orlixor AI، مساعدك الذكي. تصفح الواجهة بحرية، وعند الإرسال أو استخدام الأدوات سنطلب منك تسجيل الدخول."
    };
  }

  function renderAttachmentPills() {
    if (!state.selectedFiles.length) return "";
    return `
      <div class="guest-attachment-pills">
        ${state.selectedFiles.map((file, index) => `
          <span class="guest-attachment-pill">
            ${escapeHtml(file.name)}
            <button type="button" data-remove-file="${index}" aria-label="إزالة ${escapeHtml(file.name)}">×</button>
          </span>
        `).join("")}
      </div>
    `;
  }

  function renderRightPanel(profile) {
    const thread = getActiveThread();
    const settings = state.settings[state.section];
    const files = [
      ...(thread?.fileLabel ? [{ name: thread.fileLabel, size: "2.4 MB" }] : []),
      ...state.selectedFiles.map((file) => ({ name: file.name, size: `${Math.max(1, Math.round((file.size || 1024) / 1024))} KB` }))
    ];

    return `
      <aside class="guest-sidepanel">
        <div class="guest-sidepanel-top">
          <button class="ghost-balance ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-balance>
            ${icons.sparkle}
            <span>الرصيد: ${formatNumber(getPreviewBalance())} نقطة</span>
          </button>
          <button class="circle-control ${isAuthenticated() ? "" : "requires-auth"}" type="button" aria-label="الإشعارات">${icons.bell}</button>
          <button class="circle-control" type="button" aria-label="تبديل الثيم" data-theme-toggle>${icons.moon}</button>
        </div>

        <section class="side-card ai-card">
          <div class="ai-card-brand">
            <span class="ai-card-mark">${icons.logo}</span>
            <div>
              <strong>Orlixor AI</strong>
              <span>${isAuthenticated() ? "متصل الآن" : "استعراض آمن"}</span>
            </div>
          </div>
          <div class="ai-card-model">Orlixor GPT-4</div>
        </section>

        <section class="side-card settings-card">
          <h3>إعدادات المحادثة</h3>
          <label class="side-select">
            <span>نمط الرد</span>
            <select data-setting="responseMode" ${isAuthenticated() ? "" : 'data-auth-focus="1"'}>
              ${["شرح", "مرن", "مختصر", "احترافي", "تنفيذي", "تعليمي", "تقييمي", "منظم"].map((item) => `
                <option value="${escapeHtml(item)}" ${settings.responseMode === item ? "selected" : ""}>${escapeHtml(item)}</option>
              `).join("")}
            </select>
          </label>
          <label class="side-select">
            <span>اللغة</span>
            <select data-setting="language" ${isAuthenticated() ? "" : 'data-auth-focus="1"'}>
              ${["العربية", "English"].map((item) => `
                <option value="${escapeHtml(item)}" ${settings.language === item ? "selected" : ""}>${escapeHtml(item)}</option>
              `).join("")}
            </select>
          </label>
          <label class="side-select">
            <span>طول الرد</span>
            <select data-setting="responseLength" ${isAuthenticated() ? "" : 'data-auth-focus="1"'}>
              ${["قصير", "متوازن", "مفصل"].map((item) => `
                <option value="${escapeHtml(item)}" ${settings.responseLength === item ? "selected" : ""}>${escapeHtml(item)}</option>
              `).join("")}
            </select>
          </label>
          <button class="side-toggle ${settings.webEnabled ? "is-on" : ""} ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-toggle-web>
            <span class="side-toggle-track"><b></b></span>
            <span>البحث في الإنترنت</span>
          </button>
        </section>

        <section class="side-card files-card">
          <h3>الملفات</h3>
          <button class="file-dropzone ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-pick-file>
            اسحب وأفلت الملفات هنا<br>أو اضغط للاختيار
          </button>
          <div class="file-list">
            ${files.map((file) => `
              <div class="file-row">
                <span class="file-row-icon">${icons.filePdf}</span>
                <div>
                  <strong>${escapeHtml(file.name)}</strong>
                  <span>${escapeHtml(file.size)}</span>
                </div>
              </div>
            `).join("") || '<div class="side-empty">لا توجد ملفات بعد.</div>'}
          </div>
        </section>

        <section class="side-card stats-card">
          <h3>المحادثة الحالية</h3>
          <div class="stat-row"><span>تم إنشاء المحادثة</span><strong>${escapeHtml(thread?.stats?.created || "اليوم")}</strong></div>
          <div class="stat-row"><span>عدد الرسائل</span><strong>${escapeHtml(thread?.stats?.messages || "2 رسائل")}</strong></div>
          <div class="stat-row"><span>آخر تحديث</span><strong>${escapeHtml(thread?.stats?.updated || "الآن")}</strong></div>
        </section>

        <button class="delete-chat-btn ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-delete-thread>
          ${icons.delete}
          حذف المحادثة
        </button>

      </aside>
    `;
  }

  function renderHomeTopActions() {
    const userInitial = isAuthenticated()
      ? String(state.currentUser?.name || "م").trim().slice(0, 1)
      : "ض";

    return `
      <div class="home-top-actions">
        <button class="ghost-balance ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-balance>
          <span>الرصيد: ${formatNumber(getPreviewBalance())} نقطة</span>
          ${icons.sparkle}
        </button>
        <button class="circle-control ${isAuthenticated() ? "" : "requires-auth"}" type="button" aria-label="الإشعارات">${icons.bell}</button>
        <button class="circle-control" type="button" aria-label="تبديل الثيم" data-theme-toggle>${icons.moon}</button>
        <button class="home-avatar-button" type="button" data-open-account aria-label="الحساب">
          <span>${escapeHtml(userInitial)}</span>
          <i aria-hidden="true"></i>
        </button>
      </div>
    `;
  }

  function renderSettingsModal() {
    const userName = String(state.currentUser?.name || "ضيف").trim() || "ضيف";
    const firstLetter = userName.slice(0, 1);
    const settings = state.settings[state.section] || {};
    const modalTabs = [
      ["عام", "settings"],
      ["الإشعارات", "bell"],
      ["تخصيص", "ai"],
      ["التطبيقات", "subjects"],
      ["عناصر التحكم في البيانات", "library"],
      ["الأمان", "lock"],
      ["رقابة الوالدين", "user"],
      ["الحساب", "settings"]
    ];

    return `
      <div class="settings-gate ${state.settingsModalOpen ? "is-open" : ""}" ${state.settingsModalOpen ? "" : "hidden"}>
        <button class="settings-gate-backdrop" type="button" data-close-settings aria-label="إغلاق الإعدادات"></button>
        <section class="settings-modal-card" role="dialog" aria-modal="true" aria-label="الإعدادات">
          <button class="settings-close-btn" type="button" data-close-settings aria-label="إغلاق">×</button>

          <aside class="settings-modal-side">
            <div class="settings-profile">
              <span class="settings-avatar">${escapeHtml(firstLetter)}</span>
              <div>
                <strong>${escapeHtml(userName)}</strong>
                <span>عضو مميز</span>
              </div>
            </div>

            <nav class="settings-modal-nav" aria-label="أقسام الإعدادات">
              ${modalTabs.map(([label, icon], index) => `
                <button class="${index === 0 ? "active" : ""}" type="button">
                  <span>${icons[icon] || icons.settings}</span>
                  <b>${escapeHtml(label)}</b>
                </button>
              `).join("")}
            </nav>

            <button class="settings-logout-btn" type="button" data-logout>
              ${icons.login}
              <span>تسجيل الخروج</span>
            </button>
          </aside>

          <div class="settings-modal-main">
            <header>
              <h2>الإعدادات</h2>
              <p>إدارة تفضيلاتك وخياراتك الشخصية</p>
            </header>

            <section class="settings-general-head">
              <span>${icons.settings}</span>
              <div>
                <strong>عام</strong>
                <p>إدارة الإعدادات العامة لتجربة استخدام أفضل</p>
              </div>
            </section>

            <div class="settings-option-list">
              <article class="settings-option-row">
                <span class="settings-option-icon">${icons.internet}</span>
                <div class="settings-option-copy">
                  <strong>المظهر</strong>
                  <small>اختر المظهر المفضل لك</small>
                </div>
                <div class="settings-segmented">
                  <button type="button" data-modal-theme="light" class="${state.theme === "light" ? "active" : ""}">فاتح</button>
                  <button type="button" data-modal-theme="dark" class="${state.theme === "dark" ? "active" : ""}">داكن</button>
                  <button type="button" data-modal-theme="system">تلقائي</button>
                </div>
              </article>

              <article class="settings-option-row">
                <span class="settings-option-icon">A</span>
                <div class="settings-option-copy">
                  <strong>اللغة</strong>
                  <small>تغيير لغة واجهة المنصة</small>
                </div>
                <select data-setting="language">
                  ${["العربية", "English"].map((item) => `
                    <option value="${escapeHtml(item)}" ${settings.language === item ? "selected" : ""}>${escapeHtml(item)}</option>
                  `).join("")}
                </select>
              </article>

              <article class="settings-option-row">
                <span class="settings-option-icon">${icons.moon}</span>
                <div class="settings-option-copy">
                  <strong>المنطقة الزمنية</strong>
                  <small>تحديد المنطقة الزمنية الخاصة بك</small>
                </div>
                <select>
                  <option>(GMT+3) الرياض</option>
                  <option>(GMT+3) مكة</option>
                </select>
              </article>

              <article class="settings-option-row">
                <span class="settings-option-icon">${icons.document}</span>
                <div class="settings-option-copy">
                  <strong>تنسيق التاريخ</strong>
                  <small>اختر تنسيق عرض التاريخ</small>
                </div>
                <select>
                  <option>YYYY-MM-DD</option>
                  <option>DD/MM/YYYY</option>
                </select>
              </article>

              <article class="settings-option-row">
                <span class="settings-option-icon">${icons.sparkle}</span>
                <div class="settings-option-copy">
                  <strong>بداية الأسبوع من</strong>
                  <small>اختر اليوم الذي يبدأ منه الأسبوع</small>
                </div>
                <div class="settings-segmented">
                  <button type="button" class="active">الأحد</button>
                  <button type="button">السبت</button>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  function renderHomeMain(profile) {
    const firstName = isAuthenticated()
      ? String(state.currentUser?.name || "أحمد").trim().split(/\s+/)[0] || "أحمد"
      : "بك";
    const greeting = firstName === "بك" ? "مرحبًا بك" : `مرحبًا بك، ${escapeHtml(firstName)}`;
    const isChatting = state.homeConversationOpen;

    return `
      <section class="guest-main home-orlixor-main ${isChatting ? "is-chatting" : ""}">
        <header class="guest-main-topbar home-main-topbar">
          <button class="ai-switcher" type="button">
            <span class="ai-switcher-mark">${icons.logo}</span>
            <span>Orlixor AI</span>
            <i aria-hidden="true">⌄</i>
          </button>
          ${renderHomeTopActions()}
        </header>

        ${isChatting ? "" : `
          <section class="home-hero-panel">
            <span class="home-hero-mark" aria-hidden="true">${icons.logo}</span>
            <h1>${greeting} <span>👋</span></h1>
            <p>كيف يمكنني مساعدتك اليوم؟</p>
          </section>

          <section class="guest-quick-grid home-quick-grid">
            ${renderQuickCards(profile)}
          </section>
        `}

        ${renderConversation(profile)}

        ${renderAttachmentPills()}

        <form class="guest-compose home-compose" data-compose-form>
          <input
            class="compose-input"
            data-compose-input
            value="${escapeHtml(getComposerValue())}"
            placeholder="اكتب رسالتك هنا..."
          >
          <div class="home-compose-actions">
            <button class="home-compose-tool ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-pick-file>
              ${icons.attach}
              <span>إرفاق ملف</span>
            </button>
            <button class="home-compose-tool ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-toggle-web>
              ${icons.settings}
              <span>أدوات</span>
            </button>
          </div>
          <button class="compose-send ${isAuthenticated() ? "" : "requires-auth"}" type="submit" ${state.sending ? "disabled" : ""} aria-label="إرسال">
            ${icons.send}
          </button>
        </form>
        <p class="guest-compose-note home-compose-note">قد يخطئ Orlixor في بعض المعلومات. تحقّق من المعلومات المهمة.</p>
      </section>
    `;
  }

  function renderMain(profile) {
    if (isHomeWorkspace) {
      return renderHomeMain(profile);
    }
    const hero = getMainHero(profile);
    return `
      <section class="guest-main">
        <header class="guest-main-topbar">
          <button class="ai-switcher" type="button">
            <span class="ai-switcher-mark">${icons.logo}</span>
            <span>Orlixor AI</span>
          </button>
          <div class="guest-hero-copy">
            <h1>${escapeHtml(hero.title)}</h1>
            <p>${escapeHtml(hero.subtitle)}</p>
          </div>
        </header>

        <section class="guest-quick-grid">
          ${renderQuickCards(profile)}
        </section>

        ${renderConversation(profile)}

        ${renderAttachmentPills()}

        <form class="guest-compose" data-compose-form>
          <button class="compose-attach ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-pick-file aria-label="إضافة ملف">
            ${icons.attach}
          </button>
          <input
            class="compose-input"
            data-compose-input
            value="${escapeHtml(getComposerValue())}"
            placeholder="اكتب رسالتك هنا..."
            ${isAuthenticated() ? "" : 'data-auth-focus="1"'}
          >
          <button class="compose-send ${isAuthenticated() ? "" : "requires-auth"}" type="submit" ${state.sending ? "disabled" : ""} aria-label="إرسال">
            ${icons.send}
          </button>
        </form>
        <p class="guest-compose-note">قد يخطئ Orlixor في بعض المعلومات، تحقّق من المعلومات المهمة.</p>
      </section>
    `;
  }

  function renderSidebar() {
    const userCard = getUserCardMeta();
    const userAccountCard = userCard.guest
      ? `
        <button class="guest-user-card is-guest is-orlixor-guest" type="button" data-open-account>
          <span class="guest-user-head">
            <strong>ضيف</strong>
            <small aria-hidden="true"></small>
          </span>
          <span class="guest-user-lines">
            <span><i aria-hidden="true">${icons.user}</i>يمكنك</span>
            <span><i aria-hidden="true">${icons.internet}</i>تصفح</span>
            <span><i aria-hidden="true">${icons.eye}</i>الواجهة قبل</span>
            <span><i aria-hidden="true">${icons.lock}</i>الدخول</span>
          </span>
          <span class="guest-user-avatar" aria-hidden="true">${icons.user}</span>
          <span class="guest-user-action">تسجيل الدخول</span>
        </button>
      `
      : `
        <button class="guest-user-card is-member" type="button" data-open-account>
          <span class="guest-user-avatar">${escapeHtml(userCard.title.slice(0, 1))}</span>
          <span class="guest-user-copy">
            <strong>${escapeHtml(userCard.title)}</strong>
            <small>${escapeHtml(userCard.subtitle)}</small>
          </span>
          <span class="guest-user-menu" aria-hidden="true">${icons.menu}</span>
        </button>
      `;
    return `
      <aside class="guest-sidebar">
        <a class="guest-brand" href="${shellBaseUrl}" aria-label="Orlixor">
          <img src="orlixor-brand.png" alt="Orlixor">
        </a>

        <button class="guest-new-chat ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-new-chat>
          <span>محادثة جديدة</span>
          <i aria-hidden="true">${icons.plus}</i>
        </button>

        <label class="guest-search-box">
          <input type="search" value="${escapeHtml(getSearchValue())}" placeholder="بحث في المحادثات" data-history-search>
          <span>${icons.search}</span>
        </label>

        ${isHomeWorkspace ? "" : `
          <nav class="guest-nav" aria-label="أقسام المنصة">
            ${renderNav()}
          </nav>
        `}

        <div class="guest-history-wrap">
          ${renderHistory()}
        </div>

        <section class="guest-upgrade-card">
          <div class="upgrade-mark">${icons.crown}</div>
          <div>
            <strong>الترقية إلى Pro</strong>
            <span>استمتع بمزايا إضافية وتجربة أفضل</span>
          </div>
        </section>

        ${userAccountCard}
      </aside>
    `;
  }

  function renderAuthModal() {
    return `
      <div class="auth-gate ${state.authModalOpen ? "is-open" : ""}" ${state.authModalOpen ? "" : "hidden"}>
        <button class="auth-gate-backdrop" type="button" data-close-auth aria-label="إغلاق نافذة الدخول"></button>
        <div class="auth-gate-panel" role="dialog" aria-modal="true" aria-label="تسجيل الدخول">
          <div class="auth-gate-head">
            <div>
              <strong>سجّل دخولك أولًا</strong>
              <span>${escapeHtml(state.authReason || "استخدم حسابك للوصول إلى الشات والأدوات.")}</span>
            </div>
            <button class="auth-gate-close" type="button" data-close-auth aria-label="إغلاق">×</button>
          </div>
          <iframe class="auth-gate-frame" src="${LOGIN_FRAME_URL}" title="تسجيل الدخول"></iframe>
          <div class="auth-gate-footer">
            <button class="auth-gate-link" type="button" data-open-full-login>فتح صفحة الدخول الكاملة</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderShell() {
    const profile = getProfile();
    app.innerHTML = `
      <div class="guest-shell ${state.theme === "dark" ? "theme-dark" : ""} ${isHomeWorkspace ? "is-home-workspace" : ""}">
        ${renderSidebar()}
        ${renderMain(profile)}
        ${isHomeWorkspace ? "" : renderRightPanel(profile)}
        <input type="file" id="guestFilePicker" hidden multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md,.ppt,.pptx">
      </div>
      ${renderAuthModal()}
      ${renderSettingsModal()}
      <div class="guest-toast-stack" aria-live="polite"></div>
    `;
  }

  function showToast(message, duration = 4000) {
    const stack = app.querySelector(".guest-toast-stack");
    if (!stack) return;
    const node = document.createElement("div");
    node.className = "guest-toast";
    node.textContent = message;
    stack.appendChild(node);
    window.setTimeout(() => node.remove(), duration);
  }

  function openAuthModal(reason) {
    state.authReason = reason || "سجّل الدخول لاستخدام هذه الميزة.";
    state.authModalOpen = true;
    render();
  }

  function closeAuthModal() {
    state.authModalOpen = false;
    render();
  }

  function closeSettingsModal() {
    state.settingsModalOpen = false;
    render();
  }

  function scrollConversationToLatest() {
    window.requestAnimationFrame(() => {
      const conversation = app.querySelector(".guest-conversation-card");
      if (!conversation) return;
      conversation.scrollTop = conversation.scrollHeight;
    });
  }

  function setSection(sectionKey, replace = false) {
    if (!sectionProfiles[sectionKey]) return;
    state.section = sectionKey;
    ensureThreadState(sectionKey);
    updateUrl(replace);
    render();
  }

  function getFileInput() {
    return app.querySelector("#guestFilePicker");
  }

  function createNewThreadFromDraft(title = "محادثة جديدة") {
    const sectionKey = state.section;
    const newThread = thread(
      `thread-${Date.now()}`,
      title,
      "الآن",
      "ابدأ سؤالك الجديد هنا.",
      assistantReply("هذه مساحة محادثة جديدة.", [
        "اكتب أول طلب لك وسأرتبه لك مباشرة.",
        "يمكنك استخدام الملفات أو تغيير إعدادات الرد من الجانب.",
        "بعد الدخول يصبح الإرسال الفعلي مرتبطًا بحسابك."
      ]),
      "بدون ملف",
      { created: "الآن", messages: "0 رسائل", updated: "الآن" }
    );
    newThread.messages = [];

    const todayGroup = state.threadState[sectionKey][0];
    if (todayGroup) {
      todayGroup.items.unshift(newThread);
    } else {
      state.threadState[sectionKey].unshift(group("اليوم", [newThread]));
    }
    state.activeThreadId[sectionKey] = newThread.id;
    setComposerValue("", sectionKey);
  }

  function removeSelectedFile(index) {
    if (index < 0 || index >= state.selectedFiles.length) return;
    state.selectedFiles.splice(index, 1);
    render();
  }

  function pickFiles() {
    if (!isAuthenticated()) {
      openAuthModal("أضف الملفات بعد تسجيل الدخول.");
      return;
    }
    getFileInput()?.click();
  }

  async function submitMessage() {
    const input = (getComposerValue() || "").trim();
    if (!input && !state.selectedFiles.length) return;

    if (!isAuthenticated()) {
      openAuthModal("أرسل رسالتك بعد تسجيل الدخول.");
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient) {
      showToast("خدمة الشات غير جاهزة الآن.");
      return;
    }

    ensureThreadState();
    let threadEntry = getActiveThread();
    if (isHomeWorkspace && !state.homeConversationOpen) {
      createNewThreadFromDraft(input.slice(0, 28) || "محادثة جديدة");
      threadEntry = getActiveThread();
    } else if (!threadEntry) {
      createNewThreadFromDraft(input.slice(0, 28) || "محادثة جديدة");
      threadEntry = getActiveThread();
    }

    const outgoingFiles = [...state.selectedFiles];
    const newUserMessage = { role: "user", body: input };
    const pendingAssistant = {
      role: "assistant",
      body: assistantReply("جاري تجهيز الرد...", ["نعالج رسالتك الآن ونرتب الإجابة من الخادم."])
    };

    threadEntry.messages.push(newUserMessage, pendingAssistant);
    state.homeConversationOpen = true;
    threadEntry.time = "الآن";
    threadEntry.stats = {
      ...(threadEntry.stats || {}),
      updated: "الآن",
      messages: `${Math.max(1, threadEntry.messages.length)} رسالة`
    };
    state.sending = true;
    setComposerValue("");
    render();
    scrollConversationToLatest();

    try {
      const result = await apiClient.sendChat({
        conversation_id: state.conversationIds[threadEntry.id] || undefined,
        message: input,
        subject: state.currentUser?.subject || "",
        grade: state.currentUser?.grade || "",
        stage: state.currentUser?.stage || "",
        stream: false,
        has_attachment: outgoingFiles.length > 0,
        attachment_count: outgoingFiles.length,
        attachment_names: outgoingFiles.map((file) => file.name).slice(0, 8)
      });

      threadEntry.messages.pop();
      if (!result.ok || !result.data?.assistant_message?.body) {
        threadEntry.messages.push({
          role: "assistant",
          body: assistantReply("تعذر الوصول إلى خدمة الشات الآن.", [
            result.message || "أعد المحاولة بعد قليل أو تحقق من جاهزية الخادم."
          ])
        });
      } else {
        if (result.data.conversation_id) {
          state.conversationIds[threadEntry.id] = String(result.data.conversation_id);
        }
        threadEntry.messages.push({
          role: "assistant",
          body: assistantReply("تم توليد الرد بنجاح.", splitReplyToBullets(result.data.assistant_message.body))
        });
        if (input) {
          threadEntry.title = threadEntry.title === "محادثة جديدة" ? input.slice(0, 32) : threadEntry.title;
        }
      }
    } catch (_) {
      threadEntry.messages.pop();
      threadEntry.messages.push({
        role: "assistant",
        body: assistantReply("تعذر الوصول إلى خدمة الشات الآن.", [
          "تحقق من جاهزية الخادم ثم أعد المحاولة بعد قليل."
        ])
      });
    } finally {
      state.sending = false;
      state.selectedFiles = [];
      render();
      scrollConversationToLatest();
    }
  }

  function splitReplyToBullets(text) {
    const cleaned = String(text || "").trim();
    if (!cleaned) return ["لم يصلنا نص واضح من الخدمة."];
    const lines = cleaned
      .replace(/\r/g, "")
      .split(/\n+/)
      .map((line) => line.replace(/^[•*\-\d\.\)\s]+/, "").trim())
      .filter(Boolean);
    if (lines.length >= 2) return lines.slice(0, 6);
    const sentences = cleaned.split(/(?<=[.!؟])\s+/).map((item) => item.trim()).filter(Boolean);
    return (sentences.length ? sentences : [cleaned]).slice(0, 6);
  }

  function bindEvents() {
    const fileInput = getFileInput();
    fileInput?.addEventListener("change", (event) => {
      const files = Array.from(event.target.files || []);
      state.selectedFiles = files;
      render();
    });

    app.addEventListener("click", (event) => {
      const navButton = event.target.closest("[data-nav]");
      if (navButton) {
        setSection(navButton.getAttribute("data-nav"));
        return;
      }

      const threadButton = event.target.closest("[data-thread]");
      if (threadButton) {
        state.activeThreadId[state.section] = threadButton.getAttribute("data-thread") || "";
        state.homeConversationOpen = true;
        render();
        scrollConversationToLatest();
        return;
      }

      if (event.target.closest("[data-close-auth]")) {
        closeAuthModal();
        return;
      }

      if (event.target.closest("[data-close-settings]")) {
        closeSettingsModal();
        return;
      }

      if (event.target.closest("[data-open-full-login]")) {
        window.location.href = LOGIN_PAGE_URL;
        return;
      }

      if (event.target.closest("[data-theme-toggle]")) {
        state.theme = state.theme === "dark" ? "light" : "dark";
        setStoredTheme(state.theme);
        render();
        return;
      }

      if (event.target.closest("[data-open-account]")) {
        if (isAuthenticated()) {
          state.settingsModalOpen = true;
          render();
        } else {
          openAuthModal("افتح حسابك للوصول إلى التجربة الكاملة.");
        }
        return;
      }

      const modalThemeButton = event.target.closest("[data-modal-theme]");
      if (modalThemeButton) {
        const nextTheme = modalThemeButton.getAttribute("data-modal-theme") || "light";
        state.theme = nextTheme === "system" ? "light" : nextTheme;
        setStoredTheme(state.theme);
        render();
        return;
      }

      if (event.target.closest("[data-logout]")) {
        const apiClient = getApiClient();
        event.preventDefault();
        event.stopPropagation();
        const finishLogout = () => {
          localStorage.removeItem(legacyStorageKeys.currentUser);
          state.currentUser = getActiveUser();
          state.settingsModalOpen = false;
          state.authModalOpen = false;
          state.homeConversationOpen = false;
          render();
        };
        if (apiClient?.logout) {
          apiClient.logout().finally(finishLogout);
        } else {
          finishLogout();
        }
        return;
      }

      if (event.target.closest("[data-new-chat]")) {
        if (!isAuthenticated()) {
          openAuthModal("أنشئ محادثة جديدة بعد تسجيل الدخول.");
          return;
        }
        createNewThreadFromDraft("محادثة جديدة");
        state.homeConversationOpen = false;
        render();
        return;
      }

      if (event.target.closest("[data-pick-file]")) {
        pickFiles();
        return;
      }

      const removeFile = event.target.closest("[data-remove-file]");
      if (removeFile) {
        removeSelectedFile(Number(removeFile.getAttribute("data-remove-file")));
        return;
      }

      const cardButton = event.target.closest("[data-card]");
      if (cardButton) {
        const label = cardButton.getAttribute("data-card") || "";
        if (!isAuthenticated()) {
          openAuthModal(`استخدم "${label}" بعد تسجيل الدخول.`);
          return;
        }
        setComposerValue(`ساعدني في ${label}`);
        render();
        return;
      }

      if (event.target.closest("[data-toggle-web]")) {
        if (!isAuthenticated()) {
          openAuthModal("فعّل هذه الإعدادات بعد تسجيل الدخول.");
          return;
        }
        state.settings[state.section].webEnabled = !state.settings[state.section].webEnabled;
        render();
        return;
      }

      if (event.target.closest("[data-delete-thread]")) {
        if (!isAuthenticated()) {
          openAuthModal("احذف المحادثة بعد تسجيل الدخول.");
          return;
        }
        const sectionKey = state.section;
        const currentId = getActiveThread(sectionKey)?.id;
        state.threadState[sectionKey] = state.threadState[sectionKey]
          .map((groupEntry) => ({
            ...groupEntry,
            items: groupEntry.items.filter((item) => item.id !== currentId)
          }))
          .filter((groupEntry) => groupEntry.items.length);
        state.activeThreadId[sectionKey] = getAllThreads(sectionKey)[0]?.id || "";
        render();
        return;
      }

      if (event.target.closest("[data-copy-reply]")) {
        if (!isAuthenticated()) {
          openAuthModal("انسخ الرد بعد تسجيل الدخول.");
          return;
        }
        const assistant = [...(getActiveThread()?.messages || [])].reverse().find((message) => message.role === "assistant");
        const text = assistant?.body?.bullets?.join("\n") || "";
        navigator.clipboard?.writeText(text).then(() => {
          showToast("تم نسخ الرد.");
        }).catch(() => {
          showToast("تعذر نسخ الرد حاليًا.");
        });
        return;
      }

      if (event.target.closest("[data-refresh-reply]") || event.target.closest("[data-like-reply]")) {
        if (!isAuthenticated()) {
          openAuthModal("أكمل التفاعل بعد تسجيل الدخول.");
          return;
        }
        showToast("تم حفظ تفاعلك بنجاح.");
      }
    });

    app.addEventListener("input", (event) => {
      const searchInput = event.target.closest("[data-history-search]");
      if (searchInput) {
        state.historySearch[state.section] = searchInput.value;
        render();
        return;
      }

      const composeInput = event.target.closest("[data-compose-input]");
      if (composeInput) {
        if (!isAuthenticated()) {
          openAuthModal("اكتب رسالتك بعد تسجيل الدخول.");
          return;
        }
        setComposerValue(composeInput.value);
      }
    });

    app.addEventListener("change", (event) => {
      const select = event.target.closest("[data-setting]");
      if (!select) return;
      if (!isAuthenticated()) {
        openAuthModal("عدّل الإعدادات بعد تسجيل الدخول.");
        return;
      }
      state.settings[state.section][select.getAttribute("data-setting")] = select.value;
    });

    app.addEventListener("focusin", (event) => {
      if (event.target.closest("[data-auth-focus]") && !isAuthenticated()) {
        openAuthModal("هذه الأداة تحتاج إلى تسجيل الدخول أولًا.");
      }
    });

    app.addEventListener("submit", (event) => {
      const composeForm = event.target.closest("[data-compose-form]");
      if (!composeForm) return;
      event.preventDefault();
      submitMessage();
    });

    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "mullem-auth-success") return;
      state.currentUser = normalizeUser(event.data?.payload?.user) || getActiveUser();
      state.authModalOpen = false;
      state.settingsModalOpen = false;
      render();
      window.requestAnimationFrame(() => {
        const composeInput = app.querySelector("[data-compose-input]");
        if (composeInput && typeof composeInput.focus === "function") {
          composeInput.focus({ preventScroll: true });
        }
      });
    });
  }

  function render() {
    state.currentUser = getActiveUser();
    ensureThreadState();
    renderShell();
  }

  window.addEventListener("popstate", () => {
    state.section = resolveSection();
    ensureThreadState();
    render();
  });

  updateUrl(true);
  bindEvents();
  render();
})();
