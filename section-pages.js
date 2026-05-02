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
  const modelStorageKey = "orlixor_selected_model";
  const sidebarStorageKey = "orlixor_sidebar_collapsed";
  const avatarStoragePrefix = "orlixor_user_avatar_";
  const xpClaimStoragePrefix = "orlixor_xp_claimed_at_";
  const authBridgeKey = "mlm_auth_bridge";
  const legacyStorageKeys = {
    users: "mlm_users",
    currentUser: "mlm_current_user"
  };
  let sessionRefreshPromise = null;

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
    devices: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="11" rx="2"/><path d="M8 20h8M10 15.5 9.5 20M14 15.5l.5 4.5"/></svg>',
    notes: '<svg viewBox="0 0 24 24"><path d="M7 4h8l4 4v11a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M15 4v4h4M8.5 13H15M8.5 16H13"/></svg>',
    tests: '<svg viewBox="0 0 24 24"><path d="M7 4h8l4 4v11a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M15 4v4h4M8.5 13l1.7 1.7L15 10"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><path d="m12 3 1.8 2.1 2.8-.2 1 2.6 2.5 1-.2 2.8L21 12l-2.1 1.7.2 2.8-2.5 1-1 2.6-2.8-.2L12 21l-1.8-2.1-2.8.2-1-2.6-2.5-1 .2-2.8L3 12l2.1-1.7-.2-2.8 2.5-1 1-2.6 2.8.2Z"/><circle cx="12" cy="12" r="3.2"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M15 18H5.5a1.5 1.5 0 0 1-1.2-2.4l1.2-1.6V10a6.5 6.5 0 1 1 13 0v4l1.2 1.6a1.5 1.5 0 0 1-1.2 2.4H9"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.3A8 8 0 0 1 9.7 4 8 8 0 1 0 20 14.3Z"/></svg>',
    crown: '<svg viewBox="0 0 24 24"><path d="m3 8 4.4 4.4L12 6l4.6 6.4L21 8l-2 10H5L3 8Z"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><path d="M20 12v8H4v-8M3 8h18v4H3zM12 8v12"/><path d="M12 8H8.5A2.5 2.5 0 1 1 12 5.5V8Zm0 0h3.5A2.5 2.5 0 1 0 12 5.5V8Z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z"/></svg>',
    gem: '<svg viewBox="0 0 24 24"><path d="M6.5 3h11L22 9l-10 12L2 9l4.5-6Z"/><path d="M2 9h20M8 9l4 12 4-12M7 3l1 6M17 3l-1 6"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>',
    attach: '<svg viewBox="0 0 24 24"><path d="m21.4 11-8.5 8.5a5 5 0 1 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 4.9l-9.2 9.3a2 2 0 1 1-2.9-2.8l8-8"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24"><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></svg>',
    document: '<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5"/></svg>',
    internet: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M18 8a3 3 0 1 0-2.8-4H15a3 3 0 0 0 3 4Z"/><path d="M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="M18 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/><path d="m8.7 15.9 6.6-3.8M8.7 8.1l6.6 3.8"/></svg>',
    group: '<svg viewBox="0 0 24 24"><path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0"/><path d="M17 10.5a3 3 0 1 0 0-6"/><path d="M16 14a5 5 0 0 1 5 5"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="m4 20 4.5-1 10-10a2.2 2.2 0 0 0-3.1-3.1l-10 10Z"/><path d="M13.5 7.5 16.5 10.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="m15 4 5 5-4 1.5-3 3V18l-2 2-3.5-3.5L4 13l2-2h4.5l3-3Z"/><path d="m8 16-4 4"/></svg>',
    archive: '<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4z"/><path d="M3 4h18v3H3z"/><path d="M9 11h6"/></svg>',
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

  const modelProfiles = {
    orlixor: {
      key: "orlixor",
      name: "Orlixor AI",
      label: "Orlixor AI",
      badge: "الموصى به",
      description: "الأكثر توازنًا للشرح والكتابة والأسئلة العامة.",
      icon: "logo",
      xp: "قد يستهلك حتى 15 XP لكل رسالة"
    },
    turbo: {
      key: "turbo",
      name: "Orlixor AI Turbo",
      label: "Orlixor AI Turbo",
      badge: "الأسرع",
      description: "أسرع استجابة للمهام اليومية والردود المختصرة.",
      icon: "bolt",
      xp: "قد يستهلك حتى 10 XP لكل رسالة"
    },
    pro: {
      key: "pro",
      name: "Orlixor AI Pro",
      label: "Orlixor AI Pro",
      badge: "للتحليل المتقدم",
      description: "أدق نموذج لتحليل معمق ونتائج دقيقة.",
      icon: "star",
      xp: "قد يستهلك حتى 15 XP أو أكثر حسب الاستهلاك"
    },
    creative: {
      key: "creative",
      name: "Orlixor AI Creative",
      label: "Orlixor AI Creative",
      badge: "للإبداع والكتابة",
      description: "أفضل للكتابة الإبداعية والتسويق وصناعة المحتوى.",
      icon: "edit",
      xp: "قد يستهلك حتى 15 XP حسب طول النص"
    },
    alpha: {
      key: "alpha",
      name: "Orlixor AI Alpha",
      label: "Orlixor AI Alpha",
      badge: "قيد التطوير",
      description: "نموذجنا القادم في التطوير، لأفكار أعمق وتجارب أكثر ذكاءً.",
      icon: "sparkle",
      xp: "سيتم إطلاقه قريبًا",
      disabled: true
    }
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
    settingsModalTab: "general",
    modelMenuOpen: false,
    selectedModel: loadSelectedModel(),
    sidebarCollapsed: loadSidebarCollapsed(),
    upgradeModalOpen: false,
    balancePanelOpen: false,
    openThreadMenuId: "",
    authReason: "",
    conversationIds: {},
    conversationUserId: "",
    savedConversationsLoaded: false,
    savedConversationsLoading: false,
    hydratedConversationIds: {},
    hydratingConversationIds: {},
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

  function coerceDisplayText(value, depth = 0, seen = new WeakSet()) {
    if (value == null || depth > 8) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
      return value
        .map((item) => coerceDisplayText(item, depth + 1, seen))
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }
    if (typeof value !== "object") return "";
    if (seen.has(value)) return "";
    seen.add(value);

    const preferredKeys = ["body", "text", "content", "output_text", "value", "message", "display_text", "answer", "final_answer"];
    for (const key of preferredKeys) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
      const text = coerceDisplayText(value[key], depth + 1, seen);
      if (text && text !== "[object Object]") return text;
    }

    return Object.entries(value)
      .filter(([key]) => !["id", "type", "role", "status", "metadata", "usage", "annotations"].includes(key))
      .map(([, item]) => coerceDisplayText(item, depth + 1, seen))
      .filter(Boolean)
      .join("\n\n")
      .trim();
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

  function loadSelectedModel() {
    try {
      const stored = localStorage.getItem(modelStorageKey);
      return modelProfiles[stored] && !modelProfiles[stored].disabled ? stored : "orlixor";
    } catch (_) {
      return "orlixor";
    }
  }

  function setSelectedModel(value) {
    const next = modelProfiles[value] && !modelProfiles[value].disabled ? value : "orlixor";
    state.selectedModel = next;
    try {
      localStorage.setItem(modelStorageKey, next);
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function loadSidebarCollapsed() {
    try {
      return localStorage.getItem(sidebarStorageKey) === "1";
    } catch (_) {
      return false;
    }
  }

  function setSidebarCollapsed(value) {
    state.sidebarCollapsed = Boolean(value);
    try {
      localStorage.setItem(sidebarStorageKey, state.sidebarCollapsed ? "1" : "0");
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function getSelectedModelProfile() {
    return modelProfiles[state.selectedModel] || modelProfiles.orlixor;
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

  function getAccountStorageKey(suffix, userId = state.currentUser?.id) {
    const safeUserId = String(userId || "").trim();
    return safeUserId ? `orlixor_${suffix}_${safeUserId}` : "";
  }

  function loadConversationIdsForUser(userId = state.currentUser?.id) {
    const key = getAccountStorageKey("conversation_ids", userId);
    if (!key) return {};
    return loadJson(key, {});
  }

  function saveConversationIdsForCurrentUser() {
    const key = getAccountStorageKey("conversation_ids");
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(state.conversationIds || {}));
    } catch (_) {
      // Keep the chat usable if storage is restricted.
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
      package: String(user.package || user.package_name || user.packageName || "").trim(),
      packageName: String(user.packageName || user.package_name || user.package || "").trim(),
      packageKey: String(user.packageKey || user.package_key || user.planType || user.plan_type || "").trim(),
      planType: String(user.planType || user.plan_type || user.packageKey || user.package_key || "").trim(),
      plan_type: String(user.plan_type || user.planType || user.package_key || user.packageKey || "").trim(),
      avatar: String(user.avatar || user.avatar_url || user.avatarUrl || user.photo || user.picture || "").trim(),
      lastActiveDate: user.lastActiveDate || user.last_active_date || null,
      lastReset: user.lastReset || user.last_reset || user.lastActiveDate || user.last_active_date || null,
      packageDailyXp: Number.isFinite(Number(user.packageDailyXp || user.package_daily_xp)) ? Number(user.packageDailyXp || user.package_daily_xp) : 0,
      xp: Number.isFinite(Number(user.xp)) ? Number(user.xp) : 50
    };
  }

  function persistEmbeddedUser(user) {
    const apiClient = getApiClient();
    if (!apiClient?.hasToken?.()) return null;

    const normalized = normalizeUser(user);
    if (!normalized?.id || normalized.role === "admin") return null;
    try {
      const users = loadJson(legacyStorageKeys.users, []);
      const existing = users.find((entry) => String(entry.id) === normalized.id) || {};
      const nextUser = {
        ...existing,
        ...normalized,
        role: existing.role || "Student",
        status: existing.status || "نشط"
      };
      const nextUsers = [
        nextUser,
        ...users.filter((entry) => String(entry.id) !== normalized.id)
      ];
      localStorage.setItem(legacyStorageKeys.users, JSON.stringify(nextUsers));
      localStorage.setItem(legacyStorageKeys.currentUser, normalized.id);
    } catch (_) {
      // Keep the authenticated UI usable even if localStorage is restricted.
    }
    return normalized;
  }

  function consumeAuthBridge() {
    let payload = null;
    try {
      const raw = localStorage.getItem(authBridgeKey);
      if (!raw) return null;
      payload = JSON.parse(raw);
      localStorage.removeItem(authBridgeKey);
    } catch (_) {
      try {
        localStorage.removeItem(authBridgeKey);
      } catch (__) {
        // Ignore cleanup issues.
      }
      return null;
    }

    const createdAt = Number(payload?.createdAt || 0);
    const isFresh = !createdAt || Date.now() - createdAt < 10 * 60 * 1000;
    if (!isFresh || !payload?.token || !payload?.user) return null;

    const apiClient = getApiClient();
    apiClient?.setSession?.({
      token: payload.token,
      user: payload.user
    });

    return persistEmbeddedUser(payload.user);
  }

  function getActiveUser() {
    const bridgedUser = consumeAuthBridge();
    if (bridgedUser) return bridgedUser;

    syncSessionFromCookies();
    const apiClient = getApiClient();
    const hasServerSession = Boolean(apiClient?.hasToken?.());
    if (!hasServerSession) {
      try {
        localStorage.removeItem(legacyStorageKeys.currentUser);
        localStorage.removeItem("mlm_admin_session");
      } catch (_) {
        // Ignore cleanup issues.
      }
      return null;
    }

    const apiUser = normalizeUser(apiClient?.getSessionUser?.());
    if (apiUser && apiUser.role !== "admin") return apiUser;

    // Do not trust legacy local users without a verified API session user.
    // This prevents stale "guest/member" cards from unlocking UI after logout or expired tokens.
    return null;
  }

  function isAuthenticated() {
    return Boolean(state.currentUser);
  }

  async function refreshSessionUser() {
    const apiClient = getApiClient();
    if (!apiClient?.hasToken?.() || sessionRefreshPromise) {
      return sessionRefreshPromise;
    }

    sessionRefreshPromise = apiClient.me()
      .then((result) => {
        if (result?.ok && result.data?.user) {
          state.currentUser = persistEmbeddedUser(result.data.user) || getActiveUser();
          ensureAccountConversationState();
          render();
          scheduleSavedConversationSync();
        } else if (result?.status === 401 || result?.status === 403) {
          apiClient.clearSession?.();
          state.currentUser = null;
          state.balancePanelOpen = false;
          ensureAccountConversationState();
          render();
        }
      })
      .catch(() => {
        // Keep the page usable if the session refresh request fails.
      })
      .finally(() => {
        sessionRefreshPromise = null;
      });

    return sessionRefreshPromise;
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

  function getUserAvatarStorageKey(user = state.currentUser) {
    const userId = String(user?.id || user?.email || "guest").trim() || "guest";
    return `${avatarStoragePrefix}${userId}`;
  }

  function getXpClaimStorageKey(user = state.currentUser) {
    const userId = String(user?.id || user?.email || "guest").trim() || "guest";
    return `${xpClaimStoragePrefix}${userId}`;
  }

  function getUserAvatar(user = state.currentUser) {
    const embeddedAvatar = String(user?.avatar || user?.avatar_url || user?.avatarUrl || user?.photo || user?.picture || "").trim();
    if (embeddedAvatar) return embeddedAvatar;
    try {
      return String(localStorage.getItem(getUserAvatarStorageKey(user)) || "").trim();
    } catch (_) {
      return "";
    }
  }

  function renderUserAvatar(className = "guest-user-avatar", user = state.currentUser) {
    const userName = String(user?.name || user?.email || "ضيف").trim() || "ضيف";
    const initial = userName.slice(0, 1);
    const avatar = getUserAvatar(user);
    if (avatar) {
      return `<span class="${className} has-image"><img src="${escapeHtml(avatar)}" alt="${escapeHtml(userName)}"></span>`;
    }
    return `<span class="${className}">${escapeHtml(initial)}</span>`;
  }

  function getTodayIsoDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function getCurrentXpDailyReward() {
    const paidDaily = Number(state.currentUser?.packageDailyXp || state.currentUser?.package_daily_xp || 0);
    return paidDaily > 0 ? paidDaily : 5;
  }

  function getXpClaimInfo() {
    if (!isAuthenticated()) {
      return { claimedAt: 0, nextAt: 0, remainingMs: 0 };
    }

    const key = getXpClaimStorageKey();
    const today = getTodayIsoDate();
    const lastReset = String(state.currentUser?.lastReset || state.currentUser?.last_reset || state.currentUser?.lastActiveDate || "").slice(0, 10);
    const resetDate = lastReset || today;
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(key) || "null");
    } catch (_) {
      saved = null;
    }

    if (!saved || saved.resetDate !== resetDate) {
      saved = {
        resetDate,
        claimedAt: Date.now()
      };
      try {
        localStorage.setItem(key, JSON.stringify(saved));
      } catch (_) {
        // Keep countdown best-effort if storage is unavailable.
      }
    }

    const claimedAt = Number(saved.claimedAt || Date.now());
    const nextAt = claimedAt + 24 * 60 * 60 * 1000;
    return {
      claimedAt,
      nextAt,
      remainingMs: Math.max(0, nextAt - Date.now())
    };
  }

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0")
    };
  }

  function renderBalancePanel() {
    if (!isAuthenticated() || !state.balancePanelOpen) return "";
    const balance = getPreviewBalance();
    const dailyReward = getCurrentXpDailyReward();
    const countdown = formatCountdown(getXpClaimInfo().remainingMs);

    return `
      <div class="balance-popover" data-balance-panel>
        <span class="balance-popover-label">رصيدك الحالي</span>
        <strong>${formatNumber(balance)} نقطة</strong>
        <span class="balance-popover-hint">يتجدد رصيدك اليومي بعد</span>
        <div class="balance-timer" aria-label="وقت تجدد الرصيد">
          <b>${countdown.hours}</b>
          <i>:</i>
          <b>${countdown.minutes}</b>
          <i>:</i>
          <b>${countdown.seconds}</b>
        </div>
        <div class="balance-timer-labels">
          <span>ساعة</span>
          <span>دقيقة</span>
          <span>ثانية</span>
        </div>
        <p>يتم تجديد ${formatNumber(dailyReward)} XP عند دخولك اليومي. لا يتراكم الرصيد أثناء غيابك.</p>
      </div>
    `;
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

  function resetAccountConversationThreads() {
    const mappedThreadIds = new Set(Object.keys(state.conversationIds || {}));
    Object.keys(state.threadState || {}).forEach((sectionKey) => {
      state.threadState[sectionKey] = (state.threadState[sectionKey] || [])
        .map((groupEntry) => ({
          ...groupEntry,
          items: (groupEntry.items || []).filter((item) =>
            !item.fromServer && !mappedThreadIds.has(item.id)
          )
        }))
        .filter((groupEntry) => groupEntry.items.length && !groupEntry.savedAccountGroup);
      if (state.activeThreadId?.[sectionKey] && !getAllThreads(sectionKey).some((item) => item.id === state.activeThreadId[sectionKey])) {
        state.activeThreadId[sectionKey] = getAllThreads(sectionKey)[0]?.id || "";
      }
    });
  }

  function ensureAccountConversationState() {
    const userId = isAuthenticated() ? String(state.currentUser.id || "") : "";
    if (!userId) {
      if (state.conversationUserId || Object.keys(state.conversationIds || {}).length) {
        resetAccountConversationThreads();
      }
      state.conversationIds = {};
      state.conversationUserId = "";
      state.savedConversationsLoaded = false;
      state.savedConversationsLoading = false;
      state.hydratedConversationIds = {};
      state.hydratingConversationIds = {};
      return;
    }

    if (state.conversationUserId !== userId) {
      resetAccountConversationThreads();
      state.conversationIds = loadConversationIdsForUser(userId);
      state.conversationUserId = userId;
      state.savedConversationsLoaded = false;
      state.savedConversationsLoading = false;
      state.hydratedConversationIds = {};
      state.hydratingConversationIds = {};
    }
  }

  function getSavedConversationSections() {
    const primary = isHomeWorkspace ? "messages" : state.section;
    return Array.from(new Set([primary, "messages"].filter((key) => state.threadState[key])));
  }

  function getSavedConversationGroup(sectionKey) {
    state.threadState[sectionKey] = state.threadState[sectionKey] || [];
    let savedGroup = state.threadState[sectionKey].find((entry) => entry.savedAccountGroup);
    if (!savedGroup) {
      savedGroup = { title: "محفوظة في حسابك", items: [], savedAccountGroup: true };
      state.threadState[sectionKey].unshift(savedGroup);
    }
    return savedGroup;
  }

  function formatConversationTime(value) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "محفوظ";
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    if (sameDay) {
      return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  }

  function normalizeApiMessages(messages) {
    return (Array.isArray(messages) ? messages : [])
      .map((message) => {
        const role = String(message.role || "").toLowerCase() === "assistant" ? "assistant" : "user";
        const text = coerceDisplayText(message.text || message.body || message.content || "");
        if (!text) return null;
        if (role === "assistant") {
          return { role, body: assistantReply("رد محفوظ", splitReplyToBullets(text)) };
        }
        return { role, body: text };
      })
      .filter(Boolean);
  }

  function getThreadTitleFromMessages(messages, fallback) {
    const firstUserMessage = (messages || []).find((message) => message.role === "user" && message.body);
    return (coerceDisplayText(fallback) || coerceDisplayText(firstUserMessage?.body) || "محادثة محفوظة").slice(0, 48);
  }

  function upsertSavedConversationThread(summary, messages = []) {
    const apiId = String(summary?.id || "").trim();
    if (!apiId) return null;
    const normalizedMessages = normalizeApiMessages(messages);
    const updatedAt = summary.last_message_at || summary.updated_at || summary.created_at;
    const stats = {
      created: formatConversationTime(summary.created_at),
      messages: normalizedMessages.length ? `${normalizedMessages.length} رسالة` : "محفوظة",
      updated: formatConversationTime(updatedAt)
    };
    let primaryThread = null;

    getSavedConversationSections().forEach((sectionKey) => {
      const existing = getAllThreads(sectionKey).find((item) => state.conversationIds[item.id] === apiId);
      const threadId = existing?.id || `server-${apiId}`;
      const nextThread = existing || {
        id: threadId,
        fromServer: true,
        messages: []
      };
      nextThread.title = getThreadTitleFromMessages(normalizedMessages, summary.title);
      nextThread.time = formatConversationTime(updatedAt);
      nextThread.fileLabel = summary.project_id ? "مشروع محفوظ" : "محفوظ في حسابك";
      nextThread.stats = stats;
      if (normalizedMessages.length || !nextThread.messages?.length) {
        nextThread.messages = normalizedMessages;
      }
      state.conversationIds[threadId] = apiId;
      if (!existing) {
        getSavedConversationGroup(sectionKey).items.unshift(nextThread);
      }
      if (sectionKey === state.section || !primaryThread) {
        primaryThread = nextThread;
      }
    });

    return primaryThread;
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

  function getUserPackageLabel(user = state.currentUser) {
    if (!user) return "الباقة المجانية";
    const values = [
      user.packageKey,
      user.planType,
      user.plan_type,
      user.package,
      user.package_name,
      user.packageName
    ].map((value) => String(value || "").trim()).filter(Boolean);
    const normalized = values.join(" ").toLowerCase();
    if (/pro[_\s-]?max|pioneer|الرائد/.test(normalized)) return "باقة الرائد";
    if (/pro[_\s-]?plus|plus|tuwaiq|طويق|بلس/.test(normalized)) return "باقة طويق";
    if (/(^|\s)pro(\s|$)|spark|شرارة|nano|نانو/.test(normalized)) return "باقة شرارة";
    if (/starter|free|مجاني|مجانية|محدود/.test(normalized)) return "الباقة المجانية";

    const displayName = String(user.package || user.package_name || user.packageName || "").trim();
    if (!displayName) return "الباقة المجانية";
    if (/^باقة|^الباقة/.test(displayName)) return displayName;
    return `باقة ${displayName}`;
  }

  function getUserCardMeta() {
    if (isAuthenticated()) {
      return {
        title: state.currentUser.name,
        subtitle: getUserPackageLabel(state.currentUser),
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

  function renderThreadMenu(item) {
    const threadId = escapeHtml(item.id);
    return `
      <div class="thread-actions-menu" data-thread-menu-panel>
        <button type="button" data-thread-action="share" data-thread-id="${threadId}">
          <span>مشاركة</span>
          <i>${icons.share}</i>
        </button>
        <button type="button" data-thread-action="group" data-thread-id="${threadId}">
          <span>بدء دردشة جماعية</span>
          <i>${icons.group}</i>
        </button>
        <button type="button" data-thread-action="rename" data-thread-id="${threadId}">
          <span>إعادة التسمية</span>
          <i>${icons.edit}</i>
        </button>
        <button type="button" data-thread-action="pin" data-thread-id="${threadId}">
          <span>${item.pinned ? "إلغاء التثبيت" : "تثبيت لدردشة"}</span>
          <i>${icons.pin}</i>
        </button>
        <button type="button" data-thread-action="archive" data-thread-id="${threadId}">
          <span>أرشفة</span>
          <i>${icons.archive}</i>
        </button>
        <button class="danger" type="button" data-thread-action="delete" data-thread-id="${threadId}">
          <span>حذف</span>
          <i>${icons.delete}</i>
        </button>
      </div>
    `;
  }

  function renderHistory() {
    const groups = filterGroups();
    const activeThread = getActiveThread();
    return groups.map((groupEntry) => `
      <section class="guest-history-group">
        <h3>${escapeHtml(groupEntry.title)}</h3>
        <div class="guest-history-list">
          ${groupEntry.items.map((item) => `
            <div class="guest-history-item-wrap ${activeThread?.id === item.id ? "is-active" : ""} ${state.openThreadMenuId === item.id ? "menu-open" : ""}">
              <button class="guest-history-item" type="button" data-thread="${item.id}">
                <span class="guest-history-dot">${icons.chat}</span>
                <div class="guest-history-copy">
                  <strong>${escapeHtml(item.title)}</strong>
                  <small>${escapeHtml(item.time)}</small>
                </div>
              </button>
              <button class="guest-history-more" type="button" data-thread-menu="${item.id}" aria-label="خيارات المحادثة" aria-expanded="${state.openThreadMenuId === item.id ? "true" : "false"}">${icons.menu}</button>
              ${state.openThreadMenuId === item.id ? renderThreadMenu(item) : ""}
            </div>
          `).join("")}
        </div>
      </section>
    `).join("") || '<div class="guest-empty-side">لا توجد عناصر مطابقة لبحثك الآن.</div>';
  }

  function updateThreadById(threadId, updater, sectionKey = state.section) {
    let updatedThread = null;
    state.threadState[sectionKey] = (state.threadState[sectionKey] || []).map((groupEntry) => ({
      ...groupEntry,
      items: groupEntry.items.map((item) => {
        if (item.id !== threadId) return item;
        updatedThread = updater(item);
        return updatedThread;
      })
    }));
    return updatedThread;
  }

  function removeThreadById(threadId, sectionKey = state.section) {
    if (!threadId) return false;
    const apiConversationId = state.conversationIds?.[threadId] || "";
    const sectionsToClean = apiConversationId
      ? Object.keys(state.threadState || {})
      : [sectionKey];
    const mappedThreadIdsToRemove = new Set();
    Object.keys(state.conversationIds || {}).forEach((mappedThreadId) => {
      if (mappedThreadId === threadId || (apiConversationId && state.conversationIds[mappedThreadId] === apiConversationId)) {
        mappedThreadIdsToRemove.add(mappedThreadId);
        delete state.conversationIds[mappedThreadId];
      }
    });
    if (apiConversationId) {
      delete state.hydratedConversationIds[apiConversationId];
      delete state.hydratingConversationIds[apiConversationId];
    }

    let removed = false;
    sectionsToClean.forEach((targetSection) => {
      state.threadState[targetSection] = (state.threadState[targetSection] || [])
        .map((groupEntry) => ({
          ...groupEntry,
          items: groupEntry.items.filter((item) => {
            const keep = item.id !== threadId && !mappedThreadIdsToRemove.has(item.id);
            removed = removed || !keep;
            return keep;
          })
        }))
        .filter((groupEntry) => groupEntry.items.length);

      if (state.activeThreadId?.[targetSection] === threadId || mappedThreadIdsToRemove.has(state.activeThreadId?.[targetSection])) {
        state.activeThreadId[targetSection] = getAllThreads(targetSection)[0]?.id || "";
      }
    });

    saveConversationIdsForCurrentUser();
    return removed;
  }

  function pinThreadById(threadId, sectionKey = state.section) {
    let target = null;
    state.threadState[sectionKey] = (state.threadState[sectionKey] || [])
      .map((groupEntry) => ({
        ...groupEntry,
        items: groupEntry.items.filter((item) => {
          if (item.id !== threadId) return true;
          target = { ...item, pinned: !item.pinned };
          return false;
        })
      }))
      .filter((groupEntry) => groupEntry.items.length);

    if (!target) return null;
    const nextGroups = state.threadState[sectionKey] || [];
    if (!nextGroups.length) {
      state.threadState[sectionKey] = [group(target.pinned ? "مثبتة" : "اليوم", [target])];
      return target;
    }
    nextGroups[0] = {
      ...nextGroups[0],
      items: target.pinned ? [target, ...nextGroups[0].items] : [...nextGroups[0].items, target]
    };
    state.threadState[sectionKey] = nextGroups;
    return target;
  }

  function getThreadShareText(thread) {
    const title = thread?.title || "محادثة Orlixor";
    return `${title}\n${window.location.href}`;
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
      const safeBody = message.body && Array.isArray(message.body.bullets)
        ? {
            heading: coerceDisplayText(message.body.heading) || "رد محفوظ",
            bullets: message.body.bullets.map((item) => coerceDisplayText(item)).filter(Boolean)
          }
        : assistantReply("رد محفوظ", splitReplyToBullets(message.body));
      if (!safeBody.bullets.length) {
        safeBody.bullets = ["لم يصلنا نص واضح من الخدمة."];
      }
      return `
        <article class="guest-message assistant">
          <div class="guest-message-mark">${icons.logo}</div>
          <div class="guest-message-body">
            <h3>${escapeHtml(safeBody.heading)}</h3>
            <ul>
              ${safeBody.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
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

    if (isHomeWorkspace) {
      const messageTime = message.time || getActiveThread()?.time || "الآن";
      return `
        <div class="guest-message-row user">
          <div class="guest-message user">
            <span>${escapeHtml(message.body)}</span>
            <small>${escapeHtml(messageTime)} ✓</small>
          </div>
          ${renderUserAvatar("guest-message-avatar")}
        </div>
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
          <div class="ai-card-model">Orlixor AI</div>
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
    const accountButton = isAuthenticated()
      ? `
        <button class="home-avatar-button" type="button" data-open-account aria-label="الحساب">
          ${renderUserAvatar("home-avatar-image")}
          <i aria-hidden="true"></i>
        </button>
      `
      : "";

    return `
      <div class="home-top-actions">
        <div class="balance-menu-wrap">
          <button class="ghost-balance ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-balance aria-expanded="${state.balancePanelOpen ? "true" : "false"}">
            <span class="balance-caret">⌄</span>
            <span>الرصيد: ${formatNumber(getPreviewBalance())} نقطة</span>
            ${icons.sparkle}
          </button>
          ${renderBalancePanel()}
        </div>
        <button class="circle-control ${isAuthenticated() ? "" : "requires-auth"}" type="button" aria-label="الإشعارات">${icons.bell}</button>
        <button class="circle-control" type="button" aria-label="تبديل الثيم" data-theme-toggle>${icons.moon}</button>
        ${accountButton}
      </div>
    `;
  }

  function renderModelSwitcher() {
    const activeProfile = getSelectedModelProfile();
    return `
      <div class="model-switcher-wrap">
        <button class="ai-switcher" type="button" data-model-menu aria-expanded="${state.modelMenuOpen ? "true" : "false"}">
          <span class="ai-switcher-mark">${icons.logo}</span>
          <span>${escapeHtml(activeProfile.name)}</span>
          <i aria-hidden="true">⌄</i>
        </button>
        <div class="model-menu ${state.modelMenuOpen ? "is-open" : ""}" data-model-menu-panel ${state.modelMenuOpen ? "" : "hidden"}>
          <div class="model-menu-head">
            <span>${icons.sparkle}</span>
            <div>
              <strong>اختر النموذج</strong>
              <small>كل نموذج مصمم لمهام مختلفة</small>
            </div>
          </div>
          <div class="model-menu-list">
            ${Object.values(modelProfiles).map((profile) => `
              <button class="model-option model-${escapeHtml(profile.key)} ${state.selectedModel === profile.key ? "active" : ""} ${profile.disabled ? "is-disabled" : ""}" type="button" data-select-model="${escapeHtml(profile.key)}" ${profile.disabled ? "disabled aria-disabled=\"true\"" : ""}>
                <span class="model-option-radio"></span>
                <span class="model-option-copy">
                  <strong>${escapeHtml(profile.label)}${profile.badge ? ` <b class="model-option-badge">${escapeHtml(profile.badge)}</b>` : ""}</strong>
                  <small>${escapeHtml(profile.description)}</small>
                  <em>${escapeHtml(profile.xp)}</em>
                </span>
                <span class="model-option-icon">${icons[profile.icon] || icons.logo}</span>
              </button>
            `).join("")}
          </div>
          <p class="model-menu-note">${icons.internet} كل نموذج يستخدم إعدادات مختلفة حسب نوع المهمة.</p>
        </div>
      </div>
    `;
  }

  function renderSettingsContent(tabKey, settings) {
    if (tabKey === "notifications") {
      return `
        <section class="settings-general-head">
          <span>${icons.bell}</span>
          <div>
            <strong>الإشعارات</strong>
            <p>تحكم في التنبيهات المهمة داخل حسابك.</p>
          </div>
        </section>
        <div class="settings-option-list">
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.bell}</span>
            <div class="settings-option-copy">
              <strong>تنبيهات الرصيد</strong>
              <small>إشعار عند قرب انتهاء رصيد XP اليومي.</small>
            </div>
            <button class="settings-inline-action" type="button" data-settings-action="notifications">مفعّل</button>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.chat}</span>
            <div class="settings-option-copy">
              <strong>تنبيهات المحادثات</strong>
              <small>إظهار تنبيه عند حفظ أو تحديث محادثة.</small>
            </div>
            <button class="settings-inline-action" type="button" data-settings-action="chat-alerts">مفعّل</button>
          </article>
        </div>
      `;
    }

    if (tabKey === "personalization") {
      return `
        <section class="settings-general-head">
          <span>${icons.ai}</span>
          <div>
            <strong>تخصيص</strong>
            <p>اضبط أسلوب Orlixor حسب طريقة مذاكرتك.</p>
          </div>
        </section>
        <div class="settings-option-list">
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.ai}</span>
            <div class="settings-option-copy">
              <strong>أسلوب الشرح</strong>
              <small>اختر طريقة الرد المناسبة لك.</small>
            </div>
            <select data-setting="responseMode">
              ${["شرح", "مرن", "مختصر", "احترافي", "تعليمي"].map((item) => `
                <option value="${escapeHtml(item)}" ${settings.responseMode === item ? "selected" : ""}>${escapeHtml(item)}</option>
              `).join("")}
            </select>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.document}</span>
            <div class="settings-option-copy">
              <strong>طول الرد</strong>
              <small>اختر بين رد مختصر أو مفصل.</small>
            </div>
            <select data-setting="responseLength">
              ${["قصير", "متوازن", "مفصل"].map((item) => `
                <option value="${escapeHtml(item)}" ${settings.responseLength === item ? "selected" : ""}>${escapeHtml(item)}</option>
              `).join("")}
            </select>
          </article>
        </div>
      `;
    }

    if (tabKey === "apps") {
      return `
        <section class="settings-general-head">
          <span>${icons.subjects}</span>
          <div>
            <strong>التطبيقات</strong>
            <p>إدارة أدوات المنصة والاختصارات المتاحة.</p>
          </div>
        </section>
        <div class="settings-option-list">
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.attach}</span>
            <div class="settings-option-copy">
              <strong>رفع الملفات</strong>
              <small>السماح بإرفاق الصور والمستندات داخل المحادثة.</small>
            </div>
            <button class="settings-inline-action" type="button" data-settings-action="files">متاح</button>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.internet}</span>
            <div class="settings-option-copy">
              <strong>البحث في الإنترنت</strong>
              <small>استخدمه عند الحاجة لمعلومة حديثة.</small>
            </div>
            <button class="settings-inline-action" type="button" data-toggle-web>${settings.webEnabled ? "مفعّل" : "متوقف"}</button>
          </article>
        </div>
      `;
    }

    if (tabKey === "data") {
      return `
        <section class="settings-general-head">
          <span>${icons.library}</span>
          <div>
            <strong>عناصر التحكم في البيانات</strong>
            <p>إدارة البيانات المحفوظة داخل حسابك.</p>
          </div>
        </section>
        <div class="settings-option-list">
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.chat}</span>
            <div class="settings-option-copy">
              <strong>حفظ المحادثات</strong>
              <small>المحادثات تحفظ داخل حسابك عند تسجيل الدخول.</small>
            </div>
            <span class="settings-pill">مفعّل</span>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.delete}</span>
            <div class="settings-option-copy">
              <strong>حذف المحادثة الحالية</strong>
              <small>إزالة المحادثة المفتوحة من القائمة.</small>
            </div>
            <button class="settings-inline-action danger" type="button" data-delete-thread>حذف</button>
          </article>
        </div>
      `;
    }

    if (tabKey === "security") {
      return `
        <section class="settings-general-head">
          <span>${icons.lock}</span>
          <div>
            <strong>الأمان</strong>
            <p>خيارات تساعدك في حماية حسابك.</p>
          </div>
        </section>
        <div class="settings-option-list">
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.lock}</span>
            <div class="settings-option-copy">
              <strong>حالة الجلسة</strong>
              <small>تسجيل الدخول محفوظ حتى تسجّل الخروج.</small>
            </div>
            <span class="settings-pill">آمن</span>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.login}</span>
            <div class="settings-option-copy">
              <strong>تسجيل الخروج</strong>
              <small>إنهاء الجلسة الحالية من هذا المتصفح.</small>
            </div>
            <button class="settings-inline-action danger" type="button" data-logout>خروج</button>
          </article>
        </div>
      `;
    }

    if (tabKey === "devices") {
      return `
        <section class="settings-general-head">
          <span>${icons.devices}</span>
          <div>
            <strong>الأجهزة</strong>
            <p>إدارة الأجهزة التي تم تسجيل الدخول عليها.</p>
          </div>
        </section>
        <div class="settings-option-list">
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.devices}</span>
            <div class="settings-option-copy">
              <strong>هذا الجهاز</strong>
              <small>Windows / Chrome - نشط الآن</small>
            </div>
            <span class="settings-pill success">نشط الآن</span>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.user}</span>
            <div class="settings-option-copy">
              <strong>الأجهزة النشطة</strong>
              <small>يمكنك تسجيل الخروج يدويًا عند الحاجة.</small>
            </div>
            <span class="settings-pill">1 جهاز</span>
          </article>
        </div>
      `;
    }

    if (tabKey === "parents") {
      return `
        <section class="settings-general-head">
          <span>${icons.user}</span>
          <div>
            <strong>رقابة الوالدين</strong>
            <p>إعدادات إشراف خفيفة لتجربة تعليمية آمنة.</p>
          </div>
        </section>
        <div class="settings-option-list">
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.eye}</span>
            <div class="settings-option-copy">
              <strong>وضع المتابعة</strong>
              <small>عرض ملخصات الاستخدام والتقدم لاحقًا.</small>
            </div>
            <span class="settings-pill">قريبًا</span>
          </article>
        </div>
      `;
    }

    if (tabKey === "account") {
      return `
        <section class="settings-general-head">
          <span>${icons.settings}</span>
          <div>
            <strong>الحساب</strong>
            <p>معلومات الحساب والباقة الحالية.</p>
          </div>
        </section>
        <div class="settings-option-list">
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.user}</span>
            <div class="settings-option-copy">
              <strong>الاسم والبريد</strong>
              <small>${escapeHtml(state.currentUser?.email || "غير متاح")}</small>
            </div>
            <span class="settings-pill">${escapeHtml(getUserPackageLabel(state.currentUser))}</span>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.crown}</span>
            <div class="settings-option-copy">
              <strong>الباقة الحالية</strong>
              <small>يمكنك الترقية من بطاقة Pro في الشريط الجانبي.</small>
            </div>
            <button class="settings-inline-action" type="button" data-open-upgrade>ترقية</button>
          </article>
        </div>
      `;
    }

    return `
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
    `;
  }

  function renderSettingsModal() {
    const userName = String(state.currentUser?.name || "ضيف").trim() || "ضيف";
    const packageLabel = getUserPackageLabel(state.currentUser);
    const settings = state.settings[state.section] || {};
    const activeSettingsTab = state.settingsModalTab || "general";
    const modalTabs = [
      ["general", "عام", "settings"],
      ["notifications", "الإشعارات", "bell"],
      ["personalization", "تخصيص", "ai"],
      ["apps", "التطبيقات", "subjects"],
      ["data", "عناصر التحكم في البيانات", "library"],
      ["security", "الأمان", "lock"],
      ["devices", "الأجهزة", "devices"],
      ["parents", "رقابة الوالدين", "user"],
      ["account", "الحساب", "settings"]
    ];

    return `
      <div class="settings-gate ${state.settingsModalOpen ? "is-open" : ""}" ${state.settingsModalOpen ? "" : "hidden"}>
        <button class="settings-gate-backdrop" type="button" data-close-settings aria-label="إغلاق الإعدادات"></button>
        <section class="settings-modal-card" role="dialog" aria-modal="true" aria-label="الإعدادات">
          <button class="settings-close-btn" type="button" data-close-settings aria-label="إغلاق">×</button>

          <aside class="settings-modal-side">
            <div class="settings-profile">
              <label class="settings-avatar-upload">
                ${renderUserAvatar("settings-avatar")}
                <input type="file" accept="image/*" data-avatar-upload>
                <small>تغيير الصورة</small>
              </label>
              <div>
                <strong>${escapeHtml(userName)}</strong>
                <span>${escapeHtml(packageLabel)}</span>
              </div>
            </div>

            <nav class="settings-modal-nav" aria-label="أقسام الإعدادات">
              ${modalTabs.map(([key, label, icon]) => `
                <button class="${activeSettingsTab === key ? "active" : ""}" type="button" data-settings-tab="${escapeHtml(key)}">
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

            ${renderSettingsContent(activeSettingsTab, settings)}
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
          ${renderModelSwitcher()}
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
          ${renderModelSwitcher()}
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
        <div class="guest-user-card is-member">
          ${renderUserAvatar("guest-user-avatar")}
          <span class="guest-user-copy">
            <strong>${escapeHtml(userCard.title)}</strong>
            <small>${escapeHtml(userCard.subtitle)}</small>
          </span>
          <button class="guest-user-menu" type="button" data-open-account aria-label="إعدادات الحساب">${icons.menu}</button>
        </div>
      `;
    return `
      <aside class="guest-sidebar">
        <div class="guest-sidebar-head">
          <a class="guest-brand" href="${shellBaseUrl}" aria-label="Orlixor">
            <img class="guest-brand-full" src="orlixor-brand.png" alt="Orlixor">
            <img class="guest-brand-mark" src="orlixor-mark.png" alt="" aria-hidden="true">
          </a>
          <button class="guest-sidebar-toggle" type="button" data-toggle-sidebar aria-label="${state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}" aria-expanded="${state.sidebarCollapsed ? "false" : "true"}">
            <span class="toggle-expanded" aria-hidden="true">&lsaquo;&lsaquo;</span>
            <span class="toggle-collapsed" aria-hidden="true">&rsaquo;&rsaquo;</span>
          </button>
        </div>

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

        <button class="guest-upgrade-card" type="button" data-open-upgrade>
          <div class="upgrade-mark">${icons.crown}</div>
          <div>
            <strong>الترقية إلى Pro</strong>
            <span>استمتع بمزايا إضافية وتجربة أفضل</span>
          </div>
        </button>

        ${userAccountCard}
      </aside>
    `;
  }

  function renderAuthModal() {
    if (!state.authModalOpen) return "";

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

  function renderUpgradeModal() {
    if (!state.upgradeModalOpen) return "";
    const currentPlanKey = String(state.currentUser?.packageKey || state.currentUser?.planType || state.currentUser?.plan_type || "").trim();

    const plans = [
      {
        key: "starter",
        title: "الباقة المجانية",
        english: "Free",
        subtitle: "ابدأ تجربتك مجانًا",
        price: "0",
        unit: "ريال / شهر",
        xp: "5 XP يوميًا",
        icon: icons.gift,
        action: "ابدأ مجانًا",
        accent: "free",
        benefits: [
          "5 XP يوميًا يتجدد كل يوم",
          "تحصل على 50 XP عند أول تسجيل دخول",
          "الوصول إلى النماذج الأساسية",
          "رسائل محدودة يوميًا",
          "حفظ المحادثات داخل حسابك"
        ]
      },
      {
        key: "pro",
        title: "باقة شرارة",
        english: "Spark",
        subtitle: "بداية ذكية وسعر بسيط",
        price: "9",
        unit: "ريال / شهر",
        xp: "80 XP يوميًا",
        icon: icons.bolt,
        action: "اختر باقة شرارة",
        accent: "green",
        benefits: [
          "80 XP يتجدد يوميًا لمدة شهر",
          "9 ريال شهريًا فقط",
          "رسائل وتحليلات أكثر",
          "إنشاء الصور الأساسية",
          "إجابات دقيقة وسريعة"
        ]
      },
      {
        key: "pro_plus",
        title: "باقة طويق",
        english: "Tuwaiq",
        subtitle: "اسم يرمز للثبات والقوة والطموح",
        price: "29",
        unit: "ريال / شهر",
        xp: "250 XP يوميًا",
        icon: icons.document,
        action: "اختر باقة طويق",
        accent: "blue",
        benefits: [
          "250 XP يتجدد يوميًا لمدة شهر",
          "29 ريال شهريًا",
          "الوصول إلى جميع النماذج المتقدمة",
          "ذاكرة موسعة للمحادثات",
          "مناسبة للمشروعات والمواد المتعددة"
        ]
      },
      {
        key: "pro_max",
        title: "باقة الرائد",
        english: "Pioneer",
        subtitle: "لمن يريد الوصول لكل شيء بأعلى سرعة",
        price: "59",
        unit: "ريال / شهر",
        xp: "600 XP يوميًا",
        icon: icons.gem,
        action: "اختر باقة الرائد",
        featured: true,
        benefits: [
          "600 XP يتجدد يوميًا لمدة شهر",
          "59 ريال شهريًا",
          "استخدام أكبر لجميع النماذج",
          "أفضل للمشروعات الكبيرة",
          "أولوية أعلى في التجربة والدعم"
        ]
      }
    ];

    return `
      <div class="upgrade-gate is-open">
        <button class="upgrade-gate-backdrop" type="button" data-close-upgrade aria-label="إغلاق نافذة الترقية"></button>
        <section class="upgrade-modal-card" role="dialog" aria-modal="true" aria-label="الترقية إلى Pro">
          <button class="upgrade-close-btn" type="button" data-close-upgrade aria-label="إغلاق">×</button>
          <header class="upgrade-modal-head">
            <div class="upgrade-title-mark">${icons.crown}</div>
            <div>
              <h2>الترقية إلى <span>Pro</span></h2>
              <p>استمتع بمزايا إضافية وتجربة أفضل</p>
            </div>
          </header>

          <div class="upgrade-period-tabs" aria-label="مدة الاشتراك">
            <button type="button">شهري</button>
            <button type="button" class="active">سنوي</button>
            <span>خصم 20%</span>
            <b>توفير أكبر</b>
          </div>

          <div class="upgrade-plans">
            ${plans.map((plan) => `
              <article class="upgrade-plan ${plan.featured ? "is-featured" : ""} ${plan.accent ? `is-${plan.accent}` : ""}">
                ${plan.featured ? '<strong class="upgrade-best">الأكثر شعبية ★</strong>' : ""}
                <div class="upgrade-plan-head">
                  <span class="upgrade-plan-icon" aria-hidden="true">${plan.icon}</span>
                  <div>
                    <h3>${escapeHtml(plan.title)} <small>${escapeHtml(plan.english)}</small></h3>
                    <p>${escapeHtml(plan.subtitle)}</p>
                  </div>
                </div>
                <div class="upgrade-price">
                  <strong>${escapeHtml(plan.price)}</strong>
                  <span>${escapeHtml(plan.unit)}</span>
                </div>
                <p class="upgrade-plan-xp">${escapeHtml(plan.xp)}</p>
                <button class="upgrade-plan-action ${currentPlanKey === plan.key ? "is-current" : ""}" type="button" data-select-plan="${escapeHtml(plan.key)}">
                  ${currentPlanKey === plan.key ? "خطتك الحالية" : escapeHtml(plan.action)}
                </button>
                <ul>
                  ${plan.benefits.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
            `).join("")}
          </div>

          <footer class="upgrade-modal-foot">
            <span>${icons.refresh}<b>إلغاء في أي وقت</b><small>بدون أي رسوم خفية</small></span>
            <span>${icons.sparkle}<b>تحديثات مستمرة</b><small>مميزات جديدة باستمرار</small></span>
            <span>${icons.lock}<b>دفع آمن</b><small>بياناتك محمية بالكامل</small></span>
            <span>${icons.bell}<b>دعم على مدار الساعة</b><small>فريق جاهز لمساعدتك</small></span>
          </footer>
        </section>
      </div>
    `;
  }

  function renderShell() {
    const profile = getProfile();
    app.innerHTML = `
      <div class="guest-shell ${state.theme === "dark" ? "theme-dark" : ""} ${isHomeWorkspace ? "is-home-workspace" : ""} ${state.sidebarCollapsed ? "is-sidebar-collapsed" : ""}">
        ${renderSidebar()}
        ${renderMain(profile)}
        ${isHomeWorkspace ? "" : renderRightPanel(profile)}
        <input type="file" id="guestFilePicker" hidden multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md,.ppt,.pptx">
      </div>
      ${renderAuthModal()}
      ${renderUpgradeModal()}
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

  function buildFullLoginUrl() {
    const returnPath = `${window.location.pathname || "/index.html"}${window.location.search || ""}${window.location.hash || ""}`;
    const loginUrl = new URL(LOGIN_PAGE_URL, window.location.href);
    loginUrl.searchParams.set("mode", "login");
    loginUrl.searchParams.set("return", returnPath);
    return loginUrl.href;
  }

  function openAuthModal(reason) {
    state.authReason = reason || "سجّل الدخول لاستخدام هذه الميزة.";
    try {
      const draft = getComposerValue();
      if (draft) {
        localStorage.setItem("mlm_resume_prompt", draft);
      }
    } catch (_) {
      // Ignore draft persistence issues.
    }
    window.location.href = buildFullLoginUrl();
  }

  function closeAuthModal() {
    state.authModalOpen = false;
    render();
  }

  function closeSettingsModal() {
    state.settingsModalOpen = false;
    render();
  }

  function closeUpgradeModal() {
    state.upgradeModalOpen = false;
    render();
  }

  function focusComposerSoon() {
    window.requestAnimationFrame(() => {
      const composeInput = app.querySelector("[data-compose-input]");
      if (composeInput && typeof composeInput.focus === "function") {
        composeInput.focus({ preventScroll: true });
      }
    });
  }

  function applyBridgedAuthSession() {
    const bridgedUser = consumeAuthBridge();
    if (!bridgedUser) return false;
    state.currentUser = bridgedUser;
    ensureAccountConversationState();
    state.authModalOpen = false;
    state.settingsModalOpen = false;
    render();
    scheduleSavedConversationSync();
    focusComposerSoon();
    return true;
  }

  function scrollConversationToLatest() {
    window.requestAnimationFrame(() => {
      const conversation = app.querySelector(".guest-conversation-card");
      if (!conversation) return;
      conversation.scrollTop = conversation.scrollHeight;
    });
  }

  async function hydrateSavedConversation(threadId) {
    const apiClient = getApiClient();
    const conversationId = state.conversationIds?.[threadId];
    if (!apiClient?.getChatSession || !conversationId) return;
    if (state.hydratedConversationIds[conversationId] || state.hydratingConversationIds[conversationId]) return;

    state.hydratingConversationIds[conversationId] = true;
    try {
      const result = await apiClient.getChatSession(conversationId);
      if (result?.ok && result.data?.conversation) {
        upsertSavedConversationThread(result.data.conversation, result.data.messages || []);
        state.hydratedConversationIds[conversationId] = true;
        saveConversationIdsForCurrentUser();
        render();
        scrollConversationToLatest();
      }
    } finally {
      delete state.hydratingConversationIds[conversationId];
    }
  }

  async function syncSavedConversations() {
    ensureAccountConversationState();
    const apiClient = getApiClient();
    if (!isAuthenticated() || !apiClient?.getStudentConversations) return;
    if (state.savedConversationsLoaded || state.savedConversationsLoading) return;

    state.savedConversationsLoading = true;
    try {
      const result = await apiClient.getStudentConversations({ limit: 60 });
      if (result?.ok) {
        const items = Array.isArray(result.data?.items) ? result.data.items : [];
        items.forEach((item) => upsertSavedConversationThread(item));
        state.savedConversationsLoaded = true;
        saveConversationIdsForCurrentUser();
        const activeThread = getActiveThread();
        if (activeThread?.fromServer || state.conversationIds[activeThread?.id]) {
          hydrateSavedConversation(activeThread.id);
        }
        render();
      }
    } finally {
      state.savedConversationsLoading = false;
    }
  }

  function scheduleSavedConversationSync() {
    window.setTimeout(() => {
      syncSavedConversations();
    }, 0);
  }

  function setSection(sectionKey, replace = false) {
    if (!sectionProfiles[sectionKey]) return;
    state.section = sectionKey;
    ensureThreadState(sectionKey);
    if (isAuthenticated()) {
      state.savedConversationsLoaded = false;
      scheduleSavedConversationSync();
    }
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

  function canPreviewTextFile(file) {
    const name = String(file?.name || "").toLowerCase();
    const type = String(file?.type || "").toLowerCase();
    return type.startsWith("text/")
      || /\.(txt|md|csv|json|html|css|js|ts|tsx|jsx)$/i.test(name);
  }

  async function readAttachmentPreviews(files = []) {
    const previews = [];
    for (const file of files.slice(0, 4)) {
      if (!canPreviewTextFile(file) || Number(file.size || 0) > 512 * 1024) continue;
      try {
        const text = await file.text();
        const content = String(text || "").replace(/\s+/g, " ").trim().slice(0, 4000);
        if (content) {
          previews.push({
            name: file.name,
            type: file.type || "text/plain",
            content
          });
        }
      } catch (_) {
        // File previews are optional; the attachment name is still sent.
      }
    }
    return previews;
  }

  async function deleteThreadPermanently(threadId, sectionKey = state.section) {
    if (!threadId) return false;
    const apiClient = getApiClient();
    const conversationId = state.conversationIds?.[threadId] || "";

    if (conversationId && apiClient?.deleteChatSession) {
      const result = await apiClient.deleteChatSession(conversationId);
      if (!result?.ok && result?.status !== 404) {
        throw new Error(result?.message || "تعذر حذف المحادثة من الخادم.");
      }
    }

    return removeThreadById(threadId, sectionKey);
  }

  async function submitMessage() {
    state.currentUser = getActiveUser() || state.currentUser;
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
    const hasOutgoingDraftFiles = state.selectedFiles.length > 0;
    const draftTitle = input.slice(0, 28) || (hasOutgoingDraftFiles ? "تحليل مرفقات" : "محادثة جديدة");
    if (isHomeWorkspace && !state.homeConversationOpen) {
      createNewThreadFromDraft(draftTitle);
      threadEntry = getActiveThread();
    } else if (!threadEntry) {
      createNewThreadFromDraft(draftTitle);
      threadEntry = getActiveThread();
    }

    const outgoingFiles = [...state.selectedFiles];
    const outboundMessage = input || "حلل المرفقات المرسلة.";
    const displayUserMessage = input || `أرسلت ${outgoingFiles.length} مرفق للتحليل.`;
    const newUserMessage = { role: "user", body: displayUserMessage };
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

    let shouldKeepDraft = false;

    try {
      const attachmentPreviews = await readAttachmentPreviews(outgoingFiles);
      const result = await apiClient.sendChat({
        conversation_id: state.conversationIds[threadEntry.id] || undefined,
        selected_model: state.selectedModel || "orlixor",
        message: outboundMessage,
        subject: state.currentUser?.subject || "",
        grade: state.currentUser?.grade || "",
        stage: state.currentUser?.stage || "",
        stream: false,
        has_attachment: outgoingFiles.length > 0,
        attachment_count: outgoingFiles.length,
        attachment_names: outgoingFiles.map((file) => file.name).slice(0, 8),
        attachment_previews: attachmentPreviews
      });

      threadEntry.messages.pop();
      const authMessage = String(result.message || "");
      if (result.status === 401 || result.status === 403 || /authentication is required/i.test(authMessage)) {
        apiClient.clearSession?.();
        try {
          localStorage.removeItem(legacyStorageKeys.currentUser);
          localStorage.removeItem("mlm_admin_session");
        } catch (_) {
          // Ignore cleanup issues.
        }
        state.currentUser = null;
        shouldKeepDraft = true;
        setComposerValue(input);
        state.authReason = "انتهت الجلسة أو لم تكتمل. سجّل دخولك مرة أخرى حتى يعمل الشات من حسابك.";
        state.authModalOpen = true;
        return;
      }

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
          saveConversationIdsForCurrentUser();
        }
        if (result.data.user) {
          const token = apiClient.getToken?.();
          if (token) {
            apiClient.setSession?.({ token, user: result.data.user });
          }
          state.currentUser = persistEmbeddedUser(result.data.user) || normalizeUser(result.data.user) || state.currentUser;
        }
        threadEntry.messages.push({
          role: "assistant",
          body: assistantReply("تم توليد الرد بنجاح.", splitReplyToBullets(result.data.assistant_message.body))
        });
        if (result.data.conversation_id) {
          upsertSavedConversationThread({
            id: String(result.data.conversation_id),
            title: input || threadEntry.title,
            last_message_at: new Date().toISOString(),
            created_at: threadEntry.stats?.created || new Date().toISOString()
          }, threadEntry.messages);
          state.hydratedConversationIds[String(result.data.conversation_id)] = true;
          saveConversationIdsForCurrentUser();
        }
        if (input || outgoingFiles.length) {
          threadEntry.title = ["محادثة جديدة", "تحليل مرفقات"].includes(threadEntry.title)
            ? (input || "تحليل مرفقات").slice(0, 32)
            : threadEntry.title;
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
      if (!shouldKeepDraft) {
        state.selectedFiles = [];
      } else {
        state.selectedFiles = outgoingFiles;
      }
      render();
      scrollConversationToLatest();
    }
  }

  function splitReplyToBullets(text) {
    const cleaned = coerceDisplayText(text).replace(/\[object Object\]/g, "").trim();
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

    app.addEventListener("click", async (event) => {
      const shouldCloseBalance = state.balancePanelOpen
        && !event.target.closest("[data-balance]")
        && !event.target.closest("[data-balance-panel]");
      if (shouldCloseBalance) {
        state.balancePanelOpen = false;
      }
      const shouldCloseThreadMenu = state.openThreadMenuId
        && !event.target.closest("[data-thread-menu]")
        && !event.target.closest("[data-thread-menu-panel]");
      if (shouldCloseThreadMenu) {
        state.openThreadMenuId = "";
      }
      const shouldCloseModelMenu = state.modelMenuOpen
        && !event.target.closest("[data-model-menu]")
        && !event.target.closest("[data-model-menu-panel]");
      if (shouldCloseModelMenu) {
        state.modelMenuOpen = false;
      }

      const modelMenuButton = event.target.closest("[data-model-menu]");
      if (modelMenuButton) {
        event.preventDefault();
        state.modelMenuOpen = !state.modelMenuOpen;
        render();
        return;
      }

      const modelOption = event.target.closest("[data-select-model]");
      if (modelOption) {
        event.preventDefault();
        setSelectedModel(modelOption.getAttribute("data-select-model") || "orlixor");
        state.modelMenuOpen = false;
        render();
        return;
      }

      const navButton = event.target.closest("[data-nav]");
      if (navButton) {
        state.openThreadMenuId = "";
        setSection(navButton.getAttribute("data-nav"));
        return;
      }

      const menuButton = event.target.closest("[data-thread-menu]");
      if (menuButton) {
        event.preventDefault();
        event.stopPropagation();
        const threadId = menuButton.getAttribute("data-thread-menu") || "";
        state.openThreadMenuId = state.openThreadMenuId === threadId ? "" : threadId;
        render();
        return;
      }

      const threadAction = event.target.closest("[data-thread-action]");
      if (threadAction) {
        event.preventDefault();
        event.stopPropagation();
        const action = threadAction.getAttribute("data-thread-action") || "";
        const threadId = threadAction.getAttribute("data-thread-id") || "";
        const thread = getAllThreads().find((item) => item.id === threadId);
        state.openThreadMenuId = "";

        if (!thread) {
          render();
          return;
        }

        if (action === "share") {
          const text = getThreadShareText(thread);
          if (navigator.share) {
            navigator.share({ title: thread.title, text }).catch(() => {});
          } else {
            navigator.clipboard?.writeText(text);
            showToast("تم نسخ رابط المشاركة.");
          }
          render();
          return;
        }

        if (action === "group") {
          if (!isAuthenticated()) {
            openAuthModal("سجّل دخولك لبدء دردشة جماعية.");
            return;
          }
          state.activeThreadId[state.section] = threadId;
          state.homeConversationOpen = true;
          setComposerValue(`ابدأ دردشة جماعية حول: ${thread.title}`);
          showToast("تم تجهيز دردشة جماعية لهذه المحادثة.");
          render();
          return;
        }

        if (action === "rename") {
          if (!isAuthenticated()) {
            openAuthModal("سجّل دخولك لإعادة تسمية المحادثة.");
            return;
          }
          const nextTitle = window.prompt("اكتب الاسم الجديد للمحادثة", thread.title);
          if (nextTitle && nextTitle.trim()) {
            updateThreadById(threadId, (item) => ({ ...item, title: nextTitle.trim().slice(0, 60) }));
            showToast("تمت إعادة تسمية المحادثة.");
          }
          render();
          return;
        }

        if (action === "pin") {
          if (!isAuthenticated()) {
            openAuthModal("سجّل دخولك لتثبيت المحادثة.");
            return;
          }
          const pinnedThread = pinThreadById(threadId);
          showToast(pinnedThread?.pinned ? "تم تثبيت المحادثة." : "تم إلغاء تثبيت المحادثة.");
          render();
          return;
        }

        if (action === "archive") {
          if (!isAuthenticated()) {
            openAuthModal("سجّل دخولك لأرشفة المحادثة.");
            return;
          }
          removeThreadById(threadId);
          showToast("تمت أرشفة المحادثة.");
          render();
          return;
        }

        if (action === "delete") {
          if (!isAuthenticated()) {
            openAuthModal("سجّل دخولك لحذف المحادثة.");
            return;
          }
          if (window.confirm("هل تريد حذف هذه المحادثة؟")) {
            try {
              await deleteThreadPermanently(threadId);
              showToast("تم حذف المحادثة.");
            } catch (error) {
              showToast(error?.message || "تعذر حذف المحادثة من الخادم.");
            }
          }
          render();
          return;
        }
      }

      const threadButton = event.target.closest("[data-thread]");
      if (threadButton) {
        const threadId = threadButton.getAttribute("data-thread") || "";
        state.openThreadMenuId = "";
        state.activeThreadId[state.section] = threadId;
        state.homeConversationOpen = true;
        render();
        hydrateSavedConversation(threadId);
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

      if (event.target.closest("[data-close-upgrade]")) {
        closeUpgradeModal();
        return;
      }

      if (event.target.closest("[data-balance]")) {
        if (!isAuthenticated()) {
          openAuthModal("سجّل دخولك لعرض رصيد XP ووقت التجدد اليومي.");
          return;
        }
        state.balancePanelOpen = !state.balancePanelOpen;
        render();
        return;
      }

      if (event.target.closest("[data-open-upgrade]")) {
        state.upgradeModalOpen = true;
        render();
        return;
      }

      const selectedPlan = event.target.closest("[data-select-plan]");
      if (selectedPlan) {
        const planName = selectedPlan.getAttribute("data-select-plan") || "pro";
        if (!isAuthenticated()) {
          state.upgradeModalOpen = false;
          openAuthModal("سجّل دخولك أولًا حتى تتمكن من اختيار الباقة المناسبة.");
          return;
        }
        showToast(`تم اختيار باقة ${planName}. سيتم تفعيل الطلب عبر المتجر قريبًا.`);
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

      if (event.target.closest("[data-toggle-sidebar]")) {
        event.preventDefault();
        setSidebarCollapsed(!state.sidebarCollapsed);
        render();
        return;
      }

      if (event.target.closest("[data-open-account]")) {
        state.currentUser = getActiveUser() || state.currentUser;
        if (isAuthenticated()) {
          state.settingsModalTab = state.settingsModalTab || "general";
          state.settingsModalOpen = true;
          render();
        } else {
          openAuthModal("افتح حسابك للوصول إلى التجربة الكاملة.");
        }
        return;
      }

      const settingsTabButton = event.target.closest("[data-settings-tab]");
      if (settingsTabButton) {
        state.settingsModalTab = settingsTabButton.getAttribute("data-settings-tab") || "general";
        render();
        return;
      }

      const settingsActionButton = event.target.closest("[data-settings-action]");
      if (settingsActionButton) {
        event.preventDefault();
        showToast("تم حفظ الإجراء داخل الإعدادات.");
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
          resetAccountConversationThreads();
          localStorage.removeItem(legacyStorageKeys.currentUser);
          state.currentUser = getActiveUser();
          state.conversationIds = {};
          state.conversationUserId = "";
          state.savedConversationsLoaded = false;
          state.savedConversationsLoading = false;
          state.hydratedConversationIds = {};
          state.hydratingConversationIds = {};
          state.settingsModalOpen = false;
          state.authModalOpen = false;
          state.upgradeModalOpen = false;
          state.balancePanelOpen = false;
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
        try {
          await deleteThreadPermanently(currentId, sectionKey);
          showToast("تم حذف المحادثة.");
        } catch (error) {
          showToast(error?.message || "تعذر حذف المحادثة من الخادم.");
        }
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

      if (shouldCloseBalance || shouldCloseThreadMenu) {
        render();
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
      const filePicker = event.target.closest("#guestFilePicker");
      if (filePicker) {
        const allowedTypes = /\.(pdf|docx?|png|jpe?g|webp|gif|txt|md|pptx?)$/i;
        const files = Array.from(filePicker.files || [])
          .filter((file) => allowedTypes.test(file.name || "") || /^image\//i.test(file.type || ""))
          .slice(0, 8);
        const oversized = files.find((file) => Number(file.size || 0) > 10 * 1024 * 1024);
        if (oversized) {
          showToast("حجم الملف كبير. اختر ملفًا أقل من 10MB.");
          filePicker.value = "";
          return;
        }
        state.selectedFiles = files;
        if (files.length) {
          showToast(`تم إرفاق ${files.length} ملف.`);
        } else {
          showToast("اختر صورة أو مستندًا مدعومًا.");
        }
        render();
        return;
      }

      const avatarInput = event.target.closest("[data-avatar-upload]");
      if (avatarInput) {
        if (!isAuthenticated()) {
          openAuthModal("حدّث صورة حسابك بعد تسجيل الدخول.");
          avatarInput.value = "";
          return;
        }
        const file = avatarInput.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          showToast("اختر ملف صورة فقط.");
          avatarInput.value = "";
          return;
        }
        if (file.size > 1024 * 1024) {
          showToast("حجم الصورة كبير. اختر صورة أقل من 1MB.");
          avatarInput.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const avatar = String(reader.result || "");
          try {
            localStorage.setItem(getUserAvatarStorageKey(), avatar);
          } catch (_) {
            showToast("تعذر حفظ الصورة في هذا المتصفح.");
            return;
          }
          state.currentUser = { ...state.currentUser, avatar };
          showToast("تم تحديث صورة الحساب.");
          render();
        };
        reader.onerror = () => showToast("تعذر قراءة الصورة.");
        reader.readAsDataURL(file);
        return;
      }

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
      if (!state.authModalOpen) return;
      const payload = event.data?.payload || {};
      const apiClient = getApiClient();
      if (payload.token && payload.user) {
        apiClient?.setSession?.({
          token: payload.token,
          user: payload.user
        });
      }
      state.currentUser = persistEmbeddedUser(payload.user) || getActiveUser();
      ensureAccountConversationState();
      state.authModalOpen = false;
      state.settingsModalOpen = false;
      render();
      scheduleSavedConversationSync();
      focusComposerSoon();
    });
  }

  function render() {
    state.currentUser = getActiveUser();
    ensureAccountConversationState();
    ensureThreadState();
    renderShell();
    scheduleSavedConversationSync();
  }

  window.addEventListener("popstate", () => {
    state.section = resolveSection();
    ensureThreadState();
    render();
  });

  updateUrl(true);
  bindEvents();
  render();
  refreshSessionUser();
  window.setInterval(() => {
    if (state.authModalOpen) {
      applyBridgedAuthSession();
    }
  }, 700);
  window.setInterval(() => {
    if (state.balancePanelOpen) {
      render();
    }
  }, 1000);
})();
