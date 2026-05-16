(() => {
  const app = document.getElementById("sectionApp");
  if (!app) return;
  const mobileV2Root = document.getElementById("orlixor-mobile-v2") || (() => {
    const node = document.createElement("div");
    node.id = "orlixor-mobile-v2";
    document.body.insertBefore(node, app);
    return node;
  })();
  const uiRoots = [app, mobileV2Root].filter(Boolean);
  function bindUiEvent(type, listener, options) {
    for (const root of uiRoots) {
      root.addEventListener(type, listener, options);
    }
  }

  const LOGIN_FRAME_URL = "login.html?embed=1&mode=login";
  const LOGIN_PAGE_URL = "login.html";
  const ADMIN_PAGE_URL = "admin.html";
  const STUDENT_PAGE_URL = "student.html";
  const GUEST_URL = "guest.html";
  const HOME_URL = "index.html";
  const SEARCH_PARAM = "section";
  const workspaceMode = document.body?.dataset.workspaceMode === "home" ? "home" : "sections";
  const isHomeWorkspace = workspaceMode === "home";
  const shellBaseUrl = isHomeWorkspace ? HOME_URL : GUEST_URL;
  const assetVersion = "20260515-mobile-v2-009";
  const brandMarkUrl = `orlixor-mark.png?v=${assetVersion}`;
  const themeKey = "orlixor_guest_theme";
  const modelStorageKey = "orlixor_selected_model";
  const sidebarStorageKey = "orlixor_sidebar_collapsed";
  const recentToolsStorageKey = "orlixor_recent_tools";
  const appPreferencesStorageKey = "orlixor_app_preferences";
  const sectionSettingsStorageKey = "orlixor_section_settings";
  const savedConversationCacheLimit = 100;
  const attachmentPreviewUrls = new WeakMap();
  const avatarStoragePrefix = "orlixor_user_avatar_";
  const xpClaimStoragePrefix = "orlixor_xp_claimed_at_";
  const authBridgeKey = "mlm_auth_bridge";
  const legacyStorageKeys = {
    users: "mlm_users",
    currentUser: "mlm_current_user"
  };
  const defaultAppPreferences = {
    language: "العربية",
    timezone: "Asia/Riyadh",
    dateFormat: "YYYY-MM-DD",
    weekStart: "sunday",
    notifications: true,
    chatAlerts: true,
    files: true,
    saveChats: true,
    parentMonitoring: false
  };
  let sessionRefreshPromise = null;
  let dailyRewardLoadedForUserId = "";
  let dailyRewardTimer = null;

  const icons = {
    logo: `<img src="${brandMarkUrl}" alt="" aria-hidden="true">`,
    phone: '<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.4"/><path d="M10 5.5h4"/><circle cx="12" cy="18" r="0.9"/></svg>',
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
    chatSendError: "",
    homeConversationOpen: false,
    theme: loadStoredTheme(),
    appPreferences: loadAppPreferences(),
    authModalOpen: false,
    settingsModalOpen: false,
    settingsModalTab: "general",
    modelMenuOpen: false,
    selectedModel: loadSelectedModel(),
    sidebarCollapsed: loadSidebarCollapsed(),
    mobileSidebarOpen: false,
    toolView: "tools",
    recentTools: loadRecentTools(),
    openAiWebSearchV2: {
      query: "",
      language: "العربية",
      sourceType: "all",
      loading: false,
      error: "",
      result: null,
      history: [
        { query: "ما هي أحدث تقنيات الذكاء الاصطناعي في 2024؟", time: "اليوم - 10:45 ص" },
        { query: "تطورات سوق الأسهم السعودي", time: "أمس - 4:20 م" },
        { query: "فوائد القراءة اليومية على الصحة النفسية", time: "أمس - 11:15 ص" }
      ]
    },
    writingAssistant: {
      taskType: "generate",
      topic: "",
      details: "",
      contentType: "مقال",
      purpose: "إقناع",
      tone: "احترافية",
      toneText: "",
      toneTarget: "formal",
      toneLevel: "balanced",
      correctionText: "",
      correctionType: "full",
      correctionLevel: "balanced",
      correctionKeepStyle: true,
      expandText: "",
      expandLevel: "medium",
      expandFocus: "details",
      expandAudience: "عام",
      summaryText: "",
      summaryType: "bullets",
      summaryLength: "medium",
      summaryPointsCount: 5,
      styleText: "",
      styleGoal: "clarity",
      styleLevel: "balanced",
      styleAudience: "عام",
      styleKeepMeaning: true,
      summaryAudience: "عام",
      language: "العربية",
      length: "متوسط (300 - 500 كلمة)",
      loading: false,
      error: "",
      result: null
    },
    imageEnhancer: {
      fileName: "",
      fileSize: 0,
      fileType: "",
      width: 0,
      height: 0,
      scale: "2",
      quality: "medium",
      originalUrl: "",
      resultUrl: "",
      resultSize: 0,
      resultWidth: 0,
      resultHeight: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    },
    imageClarifier: {
      fileName: "",
      fileSize: 0,
      fileType: "",
      width: 0,
      height: 0,
      quality: "medium",
      noise: "medium",
      contrast: true,
      originalUrl: "",
      resultUrl: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    },
    pngToPdf: {
      images: [],
      pageSize: "A4",
      orientation: "portrait",
      margin: "20",
      fillPage: true,
      resultUrl: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: "",
      draggedId: ""
    },
    pdfToPng: {
      fileName: "",
      fileSize: 0,
      pagesCount: 0,
      pdf: null,
      previews: [],
      quality: "1.5",
      pageMode: "all",
      customPages: "",
      resultUrl: "",
      resultSize: 0,
      selectedPagesCount: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    },
    pdfUnlock: {
      file: null,
      fileName: "",
      fileSize: 0,
      mode: "remove",
      currentPassword: "",
      newPassword: "",
      ownership: "",
      reason: "",
      legalConfirm: false,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    },
    imageConverter: {
      images: [],
      targetFormat: "image/jpeg",
      quality: "0.85",
      resizeMode: "original",
      customWidth: "",
      customHeight: "",
      enhance: false,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    },
    imageCompressor: {
      images: [],
      compressionLevel: "70",
      outputFormat: "original",
      resizeEnabled: false,
      maxWidth: "",
      maxHeight: "",
      enhance: false,
      zoom: 1,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      comparisonUrl: "",
      comparison: null,
      compressedTotal: 0,
      savedBytes: 0,
      savedPercent: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    },
    imageRotator: {
      fileName: "",
      fileSize: 0,
      fileType: "",
      width: 0,
      height: 0,
      outputWidth: 0,
      outputHeight: 0,
      angle: 0,
      customAngle: "0",
      keepSize: true,
      enhance: false,
      previewUrl: "",
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: "",
      bitmap: null
    },
    imageCropper: {
      fileName: "",
      fileSize: 0,
      fileType: "",
      width: 0,
      height: 0,
      cropX: 0,
      cropY: 0,
      cropWidth: 0,
      cropHeight: 0,
      aspectRatio: "free",
      customWidth: "",
      customHeight: "",
      zoom: 1,
      enhance: false,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: "",
      dragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      bitmap: null
    },
    upgradeModalOpen: false,
    balancePanelOpen: false,
    dailyReward: {
      initialized: false,
      plan: "free",
      rewardAmount: 0,
      remainingMs: 0,
      canClaim: false,
      lastClaimedAt: null,
      nextClaimAt: null,
      nextRewardAt: null
    },
    dailyRewardRefreshInFlight: false,
    dailyRewardRefreshLastAttemptAt: 0,
    dailyRewardExpiredRefreshDone: false,
    notificationsOpen: false,
    notificationsTab: "all",
    notificationsLoading: false,
    notificationsError: "",
    notificationsData: null,
    notificationsUnreadCount: 0,
    notificationsLoaded: false,
    toolSuggestionModalOpen: false,
    toolSuggestionSubmitting: false,
    toolSuggestionError: "",
    toolSuggestionSuccess: "",
    toolSuggestionResultType: "",
    toolSuggestionImportance: 3,
    toolSuggestionAttachmentName: "",
    toolSuggestionAttachmentDataUrl: "",
    toolSuggestionReturnView: "tools",
    toolSuggestionDraft: {},
    likedReplies: {},
    openThreadMenuId: "",
    authReason: "",
    conversationIds: {},
    conversationUserId: "",
    savedConversationsLoaded: false,
    savedConversationsLoading: false,
    savedConversationsCacheLoadedUserId: "",
    hydratedConversationIds: {},
    hydratingConversationIds: {},
    settings: loadSectionSettings()
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

  const toolSuggestionCategories = [
    "الأكثر استخدامًا",
    "كتابة وتحرير",
    "تلخيص وتنظيم",
    "تحليل وبيانات",
    "إنتاجية",
    "تعليم وتعلم",
    "أدوات مجانية",
    "أدوات مرئية",
    "PDF وملفات",
    "أخرى"
  ];

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
      const stored = localStorage.getItem(themeKey);
      return ["light", "dark", "system"].includes(stored) ? stored : "light";
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

  function getSystemTheme() {
    try {
      return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
    } catch (_) {
      return "light";
    }
  }

  function getEffectiveTheme() {
    return state.theme === "system" ? getSystemTheme() : state.theme;
  }

  function loadAppPreferences() {
    try {
      const parsed = JSON.parse(localStorage.getItem(appPreferencesStorageKey) || "{}");
      return {
        ...defaultAppPreferences,
        ...(parsed && typeof parsed === "object" ? parsed : {})
      };
    } catch (_) {
      return { ...defaultAppPreferences };
    }
  }

  function saveAppPreferences() {
    try {
      localStorage.setItem(appPreferencesStorageKey, JSON.stringify(state.appPreferences || defaultAppPreferences));
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function updateAppPreference(key, value) {
    state.appPreferences = {
      ...defaultAppPreferences,
      ...(state.appPreferences || {}),
      [key]: value
    };
    saveAppPreferences();
    applyAppPreferences();
  }

  function loadSectionSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(sectionSettingsStorageKey) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveSectionSettings() {
    try {
      localStorage.setItem(sectionSettingsStorageKey, JSON.stringify(state.settings || {}));
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function applyAppPreferences() {
    const language = String(state.appPreferences?.language || "العربية");
    document.documentElement.lang = language === "English" ? "en" : "ar";
    document.documentElement.dir = "rtl";
  }

  function getPreferenceLabel(key, onLabel = "مفعّل", offLabel = "متوقف") {
    return state.appPreferences?.[key] ? onLabel : offLabel;
  }

  function getLocaleForPreferences() {
    return state.appPreferences?.language === "English" ? "en-US" : "ar-SA";
  }

  function getTimeZoneForPreferences() {
    return state.appPreferences?.timezone || "Asia/Riyadh";
  }

  function formatPreferenceDate(date) {
    const locale = getLocaleForPreferences();
    const timeZone = getTimeZoneForPreferences();
    const format = state.appPreferences?.dateFormat || "YYYY-MM-DD";

    if (format === "DD/MM/YYYY") {
      return date.toLocaleDateString(locale, {
        timeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    }

    if (format === "D MMM YYYY") {
      return date.toLocaleDateString(locale, {
        timeZone,
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${lookup.year || "0000"}-${lookup.month || "01"}-${lookup.day || "01"}`;
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

  function isCompactViewport() {
    return typeof window !== "undefined"
      && window.matchMedia
      && window.matchMedia("(max-width: 768px)").matches;
  }

  function setSidebarCollapsed(value) {
    state.sidebarCollapsed = Boolean(value);
    try {
      localStorage.setItem(sidebarStorageKey, state.sidebarCollapsed ? "1" : "0");
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function loadRecentTools() {
    try {
      const parsed = JSON.parse(localStorage.getItem(recentToolsStorageKey) || "[]");
      return Array.isArray(parsed)
        ? parsed
            .filter((item) => item && typeof item.key === "string")
            .slice(0, 4)
        : [];
    } catch (_) {
      return [];
    }
  }

  function saveRecentTools(items) {
    state.recentTools = Array.isArray(items) ? items.slice(0, 4) : [];
    try {
      localStorage.setItem(recentToolsStorageKey, JSON.stringify(state.recentTools));
    } catch (_) {
      // Ignore storage issues.
    }
  }

  function getToolSidebarMeta(key, fallbackTitle) {
    const meta = {
      "smart-search": { title: "البحث الذكي", subtitle: "بحث دقيق من مصادر موثوقة", icon: icons.search },
      "writing-assistant": { title: "مساعد الكتابة", subtitle: "تحسين وكتابة النصوص", icon: icons.edit },
      "image-enhancer": { title: "رفع جودة الصورة", subtitle: "تكبير وتحسين وضوح الصورة", icon: icons.image || icons.sparkle },
      "image-clarifier": { title: "توضيح الصورة", subtitle: "إزالة الضبابية وتحسين التفاصيل", icon: icons.sparkle },
      "png-to-pdf": { title: "تحويل PNG إلى PDF", subtitle: "تحويل الصور إلى ملف PDF", icon: icons.filePdf },
      "pdf-to-png": { title: "تحويل PDF إلى PNG", subtitle: "استخراج الصفحات كصور PNG", icon: icons.filePdf },
      "pdf-unlock": { title: "إزالة حماية PDF", subtitle: "إدارة كلمة مرور ملف PDF", icon: icons.lock },
      "image-converter": { title: "تحويل صيغة الصورة", subtitle: "تحويل JPG إلى PNG", icon: icons.document },
      "image-compressor": { title: "ضغط الصور", subtitle: "تقليل حجم الصور بجودة عالية", icon: icons.ai },
      "image-rotator": { title: "تدوير الصورة", subtitle: "تدوير الصور لأي اتجاه", icon: icons.refresh },
      "image-cropper": { title: "قص الصورة", subtitle: "تحديد الجزء المطلوب وحفظه", icon: icons.crop || icons.edit }
    };
    const selected = meta[key] || {};
    return {
      key,
      title: selected.title || fallbackTitle || "أداة Orlixor",
      subtitle: selected.subtitle || "متاحة من صفحة الأدوات",
      icon: selected.icon || icons.sparkle
    };
  }

  function recordRecentToolUse(key, fallbackTitle) {
    if (!key) return;
    const meta = getToolSidebarMeta(key, fallbackTitle);
    const next = [
      {
        key,
        title: meta.title,
        subtitle: meta.subtitle,
        progress: 80,
        updatedAt: Date.now()
      },
      ...(state.recentTools || []).filter((item) => item.key !== key)
    ];
    saveRecentTools(next);
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

  function getSavedConversationCacheKey(userId = state.currentUser?.id) {
    return getAccountStorageKey("saved_conversations", userId);
  }

  function normalizeConversationCacheItem(item) {
    const id = String(item?.id || "").trim();
    if (!id) return null;
    return {
      id,
      guest_session_id: item.guest_session_id || item.guestSessionId || null,
      user_id: item.user_id != null ? String(item.user_id) : null,
      project_id: item.project_id != null ? String(item.project_id) : null,
      title: item.title || null,
      subject: item.subject || null,
      stage: item.stage || null,
      grade: item.grade || null,
      term: item.term || null,
      status: item.status || "active",
      last_message_at: item.last_message_at || item.lastMessageAt || item.updated_at || item.updatedAt || null,
      created_at: item.created_at || item.createdAt || null,
      updated_at: item.updated_at || item.updatedAt || null
    };
  }

  function readSavedConversationCacheForUser(userId = state.currentUser?.id) {
    const key = getSavedConversationCacheKey(userId);
    if (!key) return [];
    const cached = loadJson(key, []);
    return (Array.isArray(cached) ? cached : [])
      .map(normalizeConversationCacheItem)
      .filter(Boolean)
      .slice(0, savedConversationCacheLimit);
  }

  function writeSavedConversationCacheForCurrentUser(items) {
    const key = getSavedConversationCacheKey();
    if (!key) return;
    const normalized = (Array.isArray(items) ? items : [])
      .map(normalizeConversationCacheItem)
      .filter(Boolean)
      .sort((first, second) => getConversationSortTime(second.last_message_at || second.updated_at || second.created_at) - getConversationSortTime(first.last_message_at || first.updated_at || first.created_at))
      .slice(0, savedConversationCacheLimit);
    try {
      localStorage.setItem(key, JSON.stringify(normalized));
    } catch (_) {
      // Cache is best-effort only; server data remains authoritative.
    }
  }

  function mergeSavedConversationCacheItem(item) {
    const normalized = normalizeConversationCacheItem(item);
    if (!normalized) return;
    const existing = readSavedConversationCacheForUser()
      .filter((entry) => String(entry.id) !== String(normalized.id));
    writeSavedConversationCacheForCurrentUser([normalized, ...existing]);
  }

  function removeSavedConversationCacheItem(conversationId) {
    const id = String(conversationId || "").trim();
    if (!id) return;
    writeSavedConversationCacheForCurrentUser(
      readSavedConversationCacheForUser().filter((entry) => String(entry.id) !== id)
    );
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

  function normalizeRoleKey(value) {
    return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  }

  function isAdminRole(value) {
    const role = normalizeRoleKey(value);
    return role === "admin" || role === "super_admin" || (role.includes("super") && role.includes("admin"));
  }

  function redirectToAdminDashboard() {
    try {
      localStorage.setItem("mlm_admin_session", "1");
      localStorage.removeItem(legacyStorageKeys.currentUser);
    } catch (_) {
      // Ignore storage issues; admin.html is still protected by the server session.
    }
    if (!window.location.pathname.toLowerCase().endsWith("/admin.html")) {
      window.location.href = ADMIN_PAGE_URL;
    }
  }

  function syncSessionFromCookies() {
    try {
      window.mullemApiClient?.restorePersistentAuthFromCookies?.();
      window.mullemApiClient?.syncLegacySessionUser?.();
    } catch (_) {
      // Ignore sync issues.
    }
  }

  function parseRewardTimeMs(value) {
    if (value == null || value === "") return 0;
    if (Number.isFinite(Number(value))) return Number(value);
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  function getDailyRewardMeta(user = {}) {
    const meta = user?.dailyReward || user?.daily_reward || {};
    return {
      amount: Number.isFinite(Number(meta.amount ?? user?.dailyRewardAmount ?? user?.daily_reward_amount ?? user?.packageDailyXp ?? user?.package_daily_xp))
        ? Number(meta.amount ?? user.dailyRewardAmount ?? user.daily_reward_amount ?? user.packageDailyXp ?? user.package_daily_xp)
        : 0,
      claimedToday: Boolean(meta.claimedToday ?? meta.claimed_today ?? false),
      nextRewardAt: meta.nextRewardAt || meta.nextDailyRewardAt || user?.nextDailyRewardAt || user?.next_daily_reward_at || null,
      lastClaimedAt: meta.lastClaimedAt || meta.last_daily_reward_claimed_at || user?.lastDailyRewardClaimedAt || user?.last_daily_reward_claimed_at || null,
      intervalMs: Number.isFinite(Number(meta.intervalMs || meta.interval_ms)) ? Number(meta.intervalMs || meta.interval_ms) : 0,
      remainingMs: Number.isFinite(Number(meta.remainingMs ?? meta.remaining_ms ?? meta.nextRewardInMs ?? meta.nextDailyRewardInMs ?? user?.nextDailyRewardInMs ?? user?.next_daily_reward_in_ms))
        ? Number(meta.remainingMs ?? meta.remaining_ms ?? meta.nextRewardInMs ?? meta.nextDailyRewardInMs ?? user.nextDailyRewardInMs ?? user.next_daily_reward_in_ms)
        : null,
      nextRewardInMs: Number.isFinite(Number(meta.remainingMs ?? meta.remaining_ms ?? meta.nextRewardInMs ?? meta.nextDailyRewardInMs ?? user?.nextDailyRewardInMs ?? user?.next_daily_reward_in_ms))
        ? Number(meta.remainingMs ?? meta.remaining_ms ?? meta.nextRewardInMs ?? meta.nextDailyRewardInMs ?? user.nextDailyRewardInMs ?? user.next_daily_reward_in_ms)
        : null
    };
  }

  function normalizeUser(user) {
    if (!user || typeof user !== "object") return null;
    const dailyReward = getDailyRewardMeta(user);
    const nextRewardAtMs = parseRewardTimeMs(dailyReward.nextRewardAt);
    const nextRewardInMs = Number(dailyReward.nextRewardInMs);
    return {
      id: String(user.id || ""),
      name: String(user.name || "").trim() || "مستخدم",
      email: String(user.email || "").trim(),
      role: normalizeRoleKey(user.role || "student"),
      stage: String(user.stage || "").trim(),
      grade: String(user.grade || "").trim(),
      subject: String(user.subject || "").trim(),
      package: String(user.package || user.package_name || user.packageName || "").trim(),
      packageName: String(user.packageName || user.package_name || user.package || "").trim(),
      packageKey: String(user.packageKey || user.package_key || user.planType || user.plan_type || "").trim(),
      planType: String(user.planType || user.plan_type || user.packageKey || user.package_key || "").trim(),
      plan_type: String(user.plan_type || user.planType || user.package_key || user.packageKey || "").trim(),
      plan: String(user.plan || user.planType || user.plan_type || user.packageKey || user.package_key || "").trim() || "free",
      avatar: String(user.avatar || user.avatar_url || user.avatarUrl || user.photo || user.picture || "").trim(),
      lastActiveDate: user.lastActiveDate || user.last_active_date || null,
      lastReset: user.lastReset || user.last_reset || user.lastActiveDate || user.last_active_date || null,
      packageDailyXp: Number.isFinite(Number(user.packageDailyXp || user.package_daily_xp)) ? Number(user.packageDailyXp || user.package_daily_xp) : 0,
      balance: Number.isFinite(Number(user.balance ?? user.xp)) ? Number(user.balance ?? user.xp) : 50,
      xp: Number.isFinite(Number(user.xp ?? user.balance)) ? Number(user.xp ?? user.balance) : 50,
      lastDailyRewardClaimedAt: dailyReward.lastClaimedAt || user.lastDailyRewardClaimedAt || user.last_daily_reward_claimed_at || null,
      lastDailyRewardAt: dailyReward.lastClaimedAt || user.lastDailyRewardAt || user.last_daily_reward_at || null,
      dailyRewardAmount: Number.isFinite(Number(dailyReward.amount))
        ? Number(dailyReward.amount)
        : 0,
      nextDailyRewardInMs: Number.isFinite(nextRewardInMs) ? nextRewardInMs : null,
      nextDailyRewardAt: nextRewardAtMs || 0,
      dailyRewardSyncedAt: Number.isFinite(Number(user.dailyRewardSyncedAt || 0))
        ? Number(user.dailyRewardSyncedAt || 0)
        : 0,
      dailyReward
    };
  }

  function persistEmbeddedUser(user) {
    const apiClient = getApiClient();
    if (!apiClient?.hasToken?.()) return null;

    const normalized = normalizeUser(user);
    if (!normalized?.id) return null;
    const dailyReward = getDailyRewardMeta(user);
    const hasServerCountdown = dailyReward.nextRewardInMs != null && Number.isFinite(Number(dailyReward.nextRewardInMs));
    const serverCountdownMs = hasServerCountdown ? Number(dailyReward.nextRewardInMs) : 0;
    const serverNextAt = parseRewardTimeMs(dailyReward.nextRewardAt);
    if (serverNextAt || hasServerCountdown) {
      const syncedAt = Date.now();
      normalized.nextDailyRewardInMs = hasServerCountdown ? Math.max(0, serverCountdownMs) : Math.max(0, serverNextAt - syncedAt);
      normalized.dailyRewardSyncedAt = syncedAt;
      normalized.nextDailyRewardAt = serverNextAt || (syncedAt + normalized.nextDailyRewardInMs);
      normalized.dailyReward = dailyReward;
    }
    if (isAdminRole(normalized.role)) {
      redirectToAdminDashboard();
      return null;
    }
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

    if (isAdminRole(payload.user?.role || payload.role)) {
      redirectToAdminDashboard();
      return null;
    }

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
    if (apiUser && isAdminRole(apiUser.role)) {
      redirectToAdminDashboard();
      return null;
    }
    if (apiUser) return apiUser;

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
          const refreshedUser = {
            ...result.data.user,
            dailyReward: result.data.dailyReward || result.data.user.dailyReward,
            nextDailyRewardAt: result.data.dailyReward?.nextRewardAt || result.data.nextDailyRewardAt || result.data.user.nextDailyRewardAt,
            nextDailyRewardInMs: result.data.dailyReward?.remainingMs ?? result.data.dailyReward?.nextRewardInMs ?? result.data.nextDailyRewardInMs ?? result.data.user.nextDailyRewardInMs,
            lastDailyRewardClaimedAt: result.data.dailyReward?.lastClaimedAt ?? result.data.user.lastDailyRewardClaimedAt,
            dailyRewardAmount: result.data.dailyReward?.amount ?? result.data.user.dailyRewardAmount
          };
          if (isAdminRole(refreshedUser.role)) {
            redirectToAdminDashboard();
            return;
          }
          state.currentUser = persistEmbeddedUser(refreshedUser) || getActiveUser();
          ensureAccountConversationState();
          render();
          scheduleSavedConversationSync();
        } else if (result?.status === 401 || result?.status === 403) {
          apiClient.clearSession?.();
          state.currentUser = null;
          state.balancePanelOpen = false;
          resetDailyRewardState();
          ensureAccountConversationState();
          render();
        }
      })
      .catch(() => {
        // Keep the page usable if the session refresh request fails.
      })
      .finally(() => {
        sessionRefreshPromise = null;
        if (isAuthenticated()) {
          maybeRefreshDailyRewardIfNeeded();
        }
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
    const explicit = Number(state.dailyReward?.rewardAmount || state.currentUser?.dailyRewardAmount || state.currentUser?.daily_reward_amount || 0);
    if (explicit > 0) return explicit;
    const paidDaily = Number(state.currentUser?.packageDailyXp || state.currentUser?.package_daily_xp || 0);
    return paidDaily > 0 ? paidDaily : 0;
  }

  function getCurrentDailyRewardPlan() {
    return String(state.dailyReward?.plan || state.currentUser?.plan || state.currentUser?.planType || state.currentUser?.plan_type || "free").trim() || "free";
  }

  function getXpClaimInfo() {
    if (!isAuthenticated()) {
      return { claimedAt: 0, nextAt: 0, remainingMs: 0, hasTimer: false };
    }

    const dailyReward = getDailyRewardMeta(state.currentUser || {});
    const hasServerCountdown = dailyReward.nextRewardInMs != null && Number.isFinite(Number(dailyReward.nextRewardInMs));
    const serverCountdownMs = hasServerCountdown ? Number(dailyReward.nextRewardInMs) : 0;
    const syncedAt = Number(state.currentUser?.dailyRewardSyncedAt || state.currentUser?.daily_reward_synced_at || 0);
    const parsedNextAt = parseRewardTimeMs(dailyReward.nextRewardAt) || parseRewardTimeMs(state.currentUser?.nextDailyRewardAt || state.currentUser?.next_daily_reward_at);
    const nextAt = parsedNextAt || (syncedAt && hasServerCountdown ? syncedAt + Math.max(0, serverCountdownMs) : 0);
    if (!nextAt) {
      return { claimedAt: syncedAt || Date.now(), nextAt: 0, remainingMs: 0, hasTimer: false };
    }
    return {
      claimedAt: syncedAt || Date.now(),
      nextAt,
      remainingMs: Math.max(0, nextAt - Date.now()),
      hasTimer: true
    };
  }

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0")
    };
  }

  function setDailyCountdownText(hours, minutes, seconds) {
    const hoursNode = document.querySelector("[data-daily-hours]");
    const minutesNode = document.querySelector("[data-daily-minutes]");
    const secondsNode = document.querySelector("[data-daily-seconds]");
    if (hoursNode) hoursNode.textContent = hours;
    if (minutesNode) minutesNode.textContent = minutes;
    if (secondsNode) secondsNode.textContent = seconds;
  }

  function setDailyRewardStatus(message) {
    const statusNode = document.querySelector("[data-daily-status]");
    if (statusNode) statusNode.textContent = message;
  }

  function setDailyRewardText(message) {
    const textNode = document.querySelector("[data-daily-reward-text]");
    if (textNode) textNode.textContent = message;
  }

  function resetDailyRewardState() {
    clearInterval(dailyRewardTimer);
    dailyRewardTimer = null;
    dailyRewardLoadedForUserId = "";
    state.dailyReward = {
      initialized: false,
      plan: "free",
      rewardAmount: 0,
      remainingMs: 0,
      canClaim: false,
      lastClaimedAt: null,
      nextClaimAt: null,
      nextRewardAt: null
    };
  }

  function updateBalanceUI(balance) {
    document.querySelectorAll("[data-user-balance]").forEach((node) => {
      node.textContent = formatNumber(balance ?? 0);
    });
  }

  function showBalanceError(message) {
    console.error("BALANCE_ERROR", message);
    clearInterval(dailyRewardTimer);
    dailyRewardTimer = null;
    setDailyCountdownText("00", "00", "00");
    setDailyRewardStatus(message || "تعذر التحقق من المكافأة");
  }

  function startDailyCountdown(remainingMs) {
    clearInterval(dailyRewardTimer);

    let endAt = Date.now() + Number(remainingMs || 0);

    function render() {
      const ms = Math.max(0, endAt - Date.now());
      const totalSeconds = Math.floor(ms / 1000);

      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");

      setDailyCountdownText(hours, minutes, seconds);

      if (ms <= 0) {
        clearInterval(dailyRewardTimer);
        dailyRewardTimer = null;

        setDailyRewardStatus("انتهى الوقت. سيتم استلام المكافأة عند تحديث الصفحة أو دخولك من جديد.");
      }
    }

    if (!Number.isFinite(endAt)) {
      showBalanceError("INVALID_REMAINING_MS");
      return;
    }

    setDailyRewardStatus("يتجدد رصيدك بعد انتهاء العدّاد");
    render();
    dailyRewardTimer = setInterval(render, 1000);
  }

  function maybeRefreshDailyRewardIfNeeded() {
    if (!isAuthenticated()) {
      state.dailyRewardRefreshInFlight = false;
      state.dailyRewardRefreshLastAttemptAt = 0;
      resetDailyRewardState();
      return;
    }

    if (sessionRefreshPromise) return;
    if (state.dailyRewardRefreshInFlight) return;
    Promise.resolve(initDailyReward()).catch(() => {
      // Keep the panel usable even if the reward request fails.
    });
  }

  async function initDailyReward() {
    if (!isAuthenticated()) return null;
    const userId = String(state.currentUser?.id || "");
    if (!userId) return state.currentUser;
    if (dailyRewardLoadedForUserId === userId && state.dailyReward.initialized) return state.currentUser;

    state.dailyRewardRefreshInFlight = true;
    state.dailyRewardRefreshLastAttemptAt = Date.now();
    setDailyRewardStatus("جاري التحقق من المكافأة...");

    const apiClient = getApiClient();
    const headers = { Accept: "application/json" };
    const token = apiClient?.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch("/api/daily-reward/claim", {
      method: "POST",
      credentials: "include",
      headers
    });

    try {
      const payload = await response.json().catch(() => null);
      const data = payload?.data && typeof payload.data === "object"
        ? { ...payload, ...payload.data }
        : payload;

      console.log("DAILY_REWARD_RESPONSE", data);

      if (!response.ok || !data?.ok) {
        console.error("DAILY_REWARD_FAILED", data);
        showBalanceError(data?.message || data?.error || "DAILY_REWARD_FAILED");
        return null;
      }

      const rewardAmount = Number(data.rewardAmount ?? data.dailyReward?.amount ?? data.user?.dailyRewardAmount ?? 0);
      const plan = String(data.plan || data.user?.plan || data.user?.planType || data.user?.plan_type || "free").trim() || "free";
      const remainingMs = Number(data.remainingMs ?? data.dailyReward?.remainingMs ?? data.dailyReward?.nextRewardInMs ?? data.nextDailyRewardInMs ?? data.user?.nextDailyRewardInMs ?? 0);
      const dailyReward = data.dailyReward || data.daily_reward || data.user?.dailyReward || {
        amount: rewardAmount,
        plan,
        canClaim: data.canClaim,
        lastClaimedAt: data.lastClaimedAt,
        nextClaimAt: data.nextClaimAt,
        nextRewardAt: data.nextClaimAt,
        remainingMs,
        nextRewardInMs: remainingMs
      };
      const nextUser = data.user
        ? {
            ...data.user,
            plan,
            balance: data.balance ?? data.user.balance,
            xp: data.balance ?? data.user.xp ?? data.user.balance,
            dailyReward,
            dailyRewardAmount: rewardAmount ?? dailyReward.amount ?? data.user.dailyRewardAmount,
            nextDailyRewardAt: dailyReward.nextRewardAt || dailyReward.nextClaimAt || data.nextDailyRewardAt || data.user.nextDailyRewardAt,
            nextDailyRewardInMs: remainingMs ?? dailyReward.remainingMs ?? dailyReward.nextRewardInMs ?? data.nextDailyRewardInMs ?? data.user.nextDailyRewardInMs,
            lastDailyRewardClaimedAt: dailyReward.lastClaimedAt ?? data.lastClaimedAt ?? data.user.lastDailyRewardClaimedAt,
            dailyRewardSyncedAt: Date.now()
          }
        : {
            ...(state.currentUser || {}),
            plan,
            balance: data.balance ?? state.currentUser?.balance ?? 0,
            xp: data.balance ?? state.currentUser?.xp ?? 0,
            dailyReward,
            dailyRewardAmount: rewardAmount ?? dailyReward.amount ?? state.currentUser?.dailyRewardAmount,
            nextDailyRewardAt: dailyReward.nextRewardAt || dailyReward.nextClaimAt || data.nextDailyRewardAt || state.currentUser?.nextDailyRewardAt,
            nextDailyRewardInMs: remainingMs ?? dailyReward.remainingMs ?? dailyReward.nextRewardInMs ?? data.nextDailyRewardInMs ?? state.currentUser?.nextDailyRewardInMs,
            lastDailyRewardClaimedAt: dailyReward.lastClaimedAt ?? data.lastClaimedAt ?? state.currentUser?.lastDailyRewardClaimedAt,
            dailyRewardSyncedAt: Date.now()
          };

      if (apiClient?.hasToken?.() && typeof apiClient.setSession === "function" && nextUser?.id) {
        apiClient.setSession({
          token: apiClient.getToken(),
          user: nextUser
        });
      }

      state.currentUser = persistEmbeddedUser(nextUser) || normalizeUser(nextUser) || state.currentUser;
      state.dailyReward = {
        initialized: true,
        plan,
        rewardAmount: Number.isFinite(rewardAmount) ? rewardAmount : 0,
        remainingMs: Number.isFinite(remainingMs) ? Math.max(0, remainingMs) : 0,
        canClaim: Boolean(data.canClaim),
        lastClaimedAt: dailyReward.lastClaimedAt || data.lastClaimedAt || null,
        nextClaimAt: dailyReward.nextClaimAt || data.nextClaimAt || null,
        nextRewardAt: dailyReward.nextRewardAt || data.nextDailyRewardAt || data.nextClaimAt || null
      };
      render();

      updateBalanceUI(data.balance ?? state.currentUser?.balance ?? 0);
      setDailyRewardText(`يتم تجديد ${formatNumber(state.dailyReward.rewardAmount)} XP حسب باقتك كل 24 ساعة من آخر استلام.`);

      if (!Number.isFinite(remainingMs) || remainingMs < 0) {
        resetDailyRewardState();
        showBalanceError("INVALID_REMAINING_MS");
        return state.currentUser;
      }

      startDailyCountdown(remainingMs);
      dailyRewardLoadedForUserId = userId;
      return state.currentUser;
    } finally {
      state.dailyRewardRefreshInFlight = false;
    }
  }

  function renderBalancePanel() {
    if (!isAuthenticated() || !state.balancePanelOpen) return "";
    const balance = getPreviewBalance();
    const rewardAmount = state.dailyReward.initialized
      ? Number(state.dailyReward.rewardAmount || getCurrentXpDailyReward() || 0)
      : 0;
    const claimInfo = getXpClaimInfo();
    const needsServerTimer = !claimInfo.hasTimer;
    const expired = claimInfo.hasTimer && claimInfo.remainingMs <= 0;
    const countdown = (needsServerTimer || expired)
      ? { hours: "24", minutes: "00", seconds: "00" }
      : formatCountdown(claimInfo.remainingMs);
    if (needsServerTimer || expired) maybeRefreshDailyRewardIfNeeded();
    const statusText = needsServerTimer
      ? "جاري التحقق من المكافأة..."
      : expired
        ? "انتهى الوقت. سيتم استلام المكافأة عند تحديث الصفحة أو دخولك من جديد."
        : "يتجدد رصيدك بعد انتهاء العدّاد";
    const rewardText = rewardAmount > 0
      ? `يتم تجديد ${formatNumber(rewardAmount)} XP حسب باقتك كل 24 ساعة من آخر استلام.`
      : "يتم تجديد XP حسب باقتك كل 24 ساعة من آخر استلام.";

    return `
      <div class="balance-popover" data-balance-panel>
        <span class="balance-popover-label">رصيدك الحالي</span>
        <strong><span data-user-balance>${formatNumber(balance)}</span> نقطة</strong>
        <div class="balance-popover-hint" data-daily-status>${statusText}</div>
        <div class="daily-timer balance-timer" dir="ltr" aria-label="وقت تجدد الرصيد">
          <span data-daily-hours>${countdown.hours}</span>
          <span>:</span>
          <span data-daily-minutes>${countdown.minutes}</span>
          <span>:</span>
          <span data-daily-seconds>${countdown.seconds}</span>
        </div>
        <div class="daily-labels balance-timer-labels">
          <span>ساعة</span>
          <span>دقيقة</span>
          <span>ثانية</span>
        </div>
        <p data-daily-reward-text>${escapeHtml(rewardText)}</p>
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
      state.savedConversationsCacheLoadedUserId = "";
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
      state.savedConversationsCacheLoadedUserId = "";
      state.hydratedConversationIds = {};
      state.hydratingConversationIds = {};
    }

    primeSavedConversationsFromCache(userId);
  }

  function getSavedConversationSections() {
    return Array.from(new Set([state.section, "dashboard", "messages"].filter((key) => state.threadState[key])));
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
      return date.toLocaleTimeString(getLocaleForPreferences(), {
        timeZone: getTimeZoneForPreferences(),
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return formatPreferenceDate(date);
  }

  function getConversationSortTime(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.getTime() : Date.now();
  }

  function getThreadSortTime(thread) {
    const rawTime = thread?.sortTime || thread?.updatedAtMs || thread?.stats?.sortTime || 0;
    return Number(rawTime) || 0;
  }

  function sortThreadGroupsByNewest(sectionKey) {
    const groups = state.threadState[sectionKey];
    if (!Array.isArray(groups)) return;

    groups.forEach((groupEntry) => {
      if (!Array.isArray(groupEntry.items)) return;
      groupEntry.items.sort((first, second) => getThreadSortTime(second) - getThreadSortTime(first));
    });
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
    const sortTime = getConversationSortTime(updatedAt);
    const stats = {
      created: formatConversationTime(summary.created_at),
      messages: normalizedMessages.length ? `${normalizedMessages.length} رسالة` : "محفوظة",
      updated: formatConversationTime(updatedAt),
      sortTime
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
      nextThread.sortTime = sortTime;
      nextThread.updatedAtMs = sortTime;
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
      sortThreadGroupsByNewest(sectionKey);
    });

    return primaryThread;
  }

  function primeSavedConversationsFromCache(userId = state.currentUser?.id) {
    const safeUserId = String(userId || "").trim();
    if (!safeUserId || state.savedConversationsCacheLoadedUserId === safeUserId) return false;
    state.savedConversationsCacheLoadedUserId = safeUserId;

    const cachedItems = readSavedConversationCacheForUser(safeUserId);
    if (!cachedItems.length) return false;

    cachedItems.forEach((item) => upsertSavedConversationThread(item));
    getSavedConversationSections().forEach((sectionKey) => sortThreadGroupsByNewest(sectionKey));
    saveConversationIdsForCurrentUser();
    return true;
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
    return isAuthenticated() ? Math.max(0, Number(state.currentUser.balance ?? state.currentUser.xp ?? 0)) : 2450;
  }

  function estimateTokens(text) {
    const value = String(text || "").trim();
    if (!value) return 0;
    return Math.ceil(value.length / 4);
  }

  function estimateXpCost(tokens) {
    let cost = 3;
    cost += Math.ceil(Math.max(0, Number(tokens) || 0) / 1000) * 1;
    return Math.min(cost, 15);
  }

  function getUserMaxInputTokens(user = state.currentUser) {
    const planText = [
      user?.packageKey,
      user?.planType,
      user?.plan_type,
      user?.package,
      user?.package_name,
      user?.packageName
    ].map((item) => String(item || "").toLowerCase()).join(" ");
    const dailyXp = Number(user?.packageDailyXp || user?.package_daily_xp || 0);

    if (/enterprise|business|elite|ultra|600|نخبة|مؤسسة|مؤسسات/.test(planText) || dailyXp >= 600) return 6000;
    if (/pro_plus|tuwaiq|tuwaiq_plus|250|طويق/.test(planText) || dailyXp >= 250) return 5000;
    if (/pro|spark|80|شرارة/.test(planText) || dailyXp >= 80) return 3000;
    return 1500;
  }

  function hasSubscriberToolsAccess(user = state.currentUser) {
    if (!user || !isAuthenticated()) return false;
    const planText = [
      user?.plan,
      user?.plan_key,
      user?.planKey,
      user?.packageKey,
      user?.planType,
      user?.plan_type,
      user?.package,
      user?.package_name,
      user?.packageName,
      user?.subscriptionPlan
    ].map((item) => String(item || "").trim().toLowerCase()).join(" ");
    const dailyXp = Number(user?.packageDailyXp || user?.package_daily_xp || 0);
    return dailyXp >= 80 || /(^|\s|_)(pro|spark|pro_plus|tuwaiq|pro_max|pioneer|business|elite|ultra)(\s|_|$)|شرارة|طويق|الرائد|الأعمال/.test(planText);
  }

  const imageEnhancerAllowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const imageEnhancerMaxFileSize = 20 * 1024 * 1024;
  const imageEnhancerMaxOutputPixels = 36000000;
  const pngToPdfAllowedTypes = ["image/png"];
  const pngToPdfMaxFileSize = 20 * 1024 * 1024;
  const pngToPdfPageSizes = {
    A4: [595.28, 841.89],
    letter: [612, 792]
  };
  const pdfToPngMaxFileSize = 50 * 1024 * 1024;
  const pdfUnlockMaxFileSize = 100 * 1024 * 1024;
  const pdfUnlockModes = {
    remove: "حذف كلمة المرور الحالية",
    reset: "إعادة تعيين كلمة مرور",
    forgot_password_remove: "حذف كلمة المرور عند نسيانها"
  };
  const pdfUnlockReasons = {
    forgot_password: "نسيت كلمة المرور",
    update_protection: "لدي نسخة قديمة وأحتاج تحديث الحماية",
    personal_file: "ملفي الشخصي وأريد إزالة القفل"
  };
  const imageConverterAllowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const imageConverterMaxFileSize = 20 * 1024 * 1024;
  const imageConverterMaxFiles = 20;
  const imageConverterFormats = {
    "image/jpeg": { label: "JPG", extension: "jpg" },
    "image/png": { label: "PNG", extension: "png" },
    "image/webp": { label: "WebP", extension: "webp" }
  };
  const imageCompressorAllowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const imageCompressorMaxFileSize = 20 * 1024 * 1024;
  const imageCompressorMaxFiles = 20;
  const imageCompressorFormats = {
    original: { label: "الصيغة الأصلية", extension: "" },
    "image/jpeg": { label: "JPG", extension: "jpg" },
    "image/webp": { label: "WebP", extension: "webp" },
    "image/png": { label: "PNG", extension: "png" }
  };
  const imageRotatorAllowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const imageRotatorMaxFileSize = 20 * 1024 * 1024;
  const imageCropperAllowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const imageCropperMaxFileSize = 20 * 1024 * 1024;
  const imageCropperAspectRatios = {
    free: null,
    "1:1": 1,
    "4:3": 4 / 3,
    "16:9": 16 / 9,
    "3:2": 3 / 2
  };

  function formatImageEnhancerFileSize(bytes) {
    const value = Number(bytes || 0);
    if (!value) return "0 KB";
    if (value >= 1024 * 1024) {
      return `${(value / (1024 * 1024)).toLocaleString("ar-SA", { maximumFractionDigits: 1 })} MB`;
    }
    return `${Math.max(1, Math.round(value / 1024)).toLocaleString("ar-SA")} KB`;
  }

  function revokeImageEnhancerUrl(url) {
    if (!url) return;
    try {
      URL.revokeObjectURL(url);
    } catch (_) {
      // Ignore URLs already released by the browser.
    }
  }

  function clearImageEnhancerResult(status = "") {
    revokeImageEnhancerUrl(state.imageEnhancer.resultUrl);
    state.imageEnhancer = {
      ...state.imageEnhancer,
      resultUrl: "",
      resultSize: 0,
      resultWidth: 0,
      resultHeight: 0,
      progress: 0,
      status
    };
  }

  function resetImageEnhancerState() {
    revokeImageEnhancerUrl(state.imageEnhancer.originalUrl);
    revokeImageEnhancerUrl(state.imageEnhancer.resultUrl);
    if (state.imageEnhancer.bitmap?.close) {
      state.imageEnhancer.bitmap.close();
    }
    state.imageEnhancer = {
      fileName: "",
      fileSize: 0,
      fileType: "",
      width: 0,
      height: 0,
      scale: "2",
      quality: "medium",
      originalUrl: "",
      resultUrl: "",
      resultSize: 0,
      resultWidth: 0,
      resultHeight: 0,
      loading: false,
      progress: 0,
      error: "",
      status: "",
      bitmap: null
    };
  }

  function clampImageValue(value) {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  function applyBasicImageEnhancement(ctx, width, height, quality) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const settings = {
      light: { contrast: 1.03, brightness: 1, saturation: 1.02 },
      medium: { contrast: 1.07, brightness: 2, saturation: 1.05 },
      strong: { contrast: 1.12, brightness: 4, saturation: 1.08 }
    }[quality] || { contrast: 1.07, brightness: 2, saturation: 1.05 };

    for (let index = 0; index < data.length; index += 4) {
      let red = (data[index] - 128) * settings.contrast + 128 + settings.brightness;
      let green = (data[index + 1] - 128) * settings.contrast + 128 + settings.brightness;
      let blue = (data[index + 2] - 128) * settings.contrast + 128 + settings.brightness;
      const gray = red * 0.299 + green * 0.587 + blue * 0.114;
      red = gray + (red - gray) * settings.saturation;
      green = gray + (green - gray) * settings.saturation;
      blue = gray + (blue - gray) * settings.saturation;
      data[index] = clampImageValue(red);
      data[index + 1] = clampImageValue(green);
      data[index + 2] = clampImageValue(blue);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  async function handleImageEnhancerFile(file) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }

    if (!file) return;
    if (!imageEnhancerAllowedTypes.includes(file.type)) {
      state.imageEnhancer.error = "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP.";
      render();
      return;
    }
    if (Number(file.size || 0) > imageEnhancerMaxFileSize) {
      state.imageEnhancer.error = "حجم الصورة كبير جدًا. الحد الأقصى 20MB.";
      render();
      return;
    }

    const originalUrl = URL.createObjectURL(file);
    try {
      const bitmap = await createImageBitmap(file);
      revokeImageEnhancerUrl(state.imageEnhancer.originalUrl);
      revokeImageEnhancerUrl(state.imageEnhancer.resultUrl);
      if (state.imageEnhancer.bitmap?.close) {
        state.imageEnhancer.bitmap.close();
      }
      state.imageEnhancer = {
        ...state.imageEnhancer,
        fileName: file.name || "image",
        fileSize: file.size || 0,
        fileType: file.type || "",
        width: bitmap.width,
        height: bitmap.height,
        originalUrl,
        resultUrl: "",
        resultSize: 0,
        resultWidth: 0,
        resultHeight: 0,
        bitmap,
        loading: false,
        progress: 0,
        error: "",
        status: "تم تحميل الصورة. اختر مستوى التحسين ثم اضغط رفع الجودة."
      };
      render();
    } catch (_) {
      revokeImageEnhancerUrl(originalUrl);
      state.imageEnhancer.error = "تعذر قراءة الصورة. جرّب ملفًا آخر.";
      render();
    }
  }

  async function runImageEnhancer() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }

    const enhancer = state.imageEnhancer;
    if (!enhancer.bitmap) {
      state.imageEnhancer.error = "اختر صورة أولًا.";
      render();
      return;
    }

    const scale = Number(enhancer.scale || 2);
    const quality = String(enhancer.quality || "medium");
    const outputWidth = Math.round(enhancer.bitmap.width * scale);
    const outputHeight = Math.round(enhancer.bitmap.height * scale);

    if (outputWidth * outputHeight > imageEnhancerMaxOutputPixels) {
      state.imageEnhancer.error = "أبعاد النتيجة كبيرة جدًا للمتصفح. جرّب تكبير 2x أو صورة أصغر.";
      render();
      return;
    }

    state.imageEnhancer = {
      ...state.imageEnhancer,
      loading: true,
      progress: 35,
      error: "",
      status: "جاري رفع الجودة داخل المتصفح..."
    };
    render();

    try {
      const outputCanvas = document.createElement("canvas");
      const outputCtx = outputCanvas.getContext("2d", { willReadFrequently: true });
      outputCanvas.width = outputWidth;
      outputCanvas.height = outputHeight;
      outputCtx.imageSmoothingEnabled = true;
      outputCtx.imageSmoothingQuality = "high";
      outputCtx.drawImage(enhancer.bitmap, 0, 0, outputWidth, outputHeight);
      applyBasicImageEnhancement(outputCtx, outputWidth, outputHeight, quality);

      const blob = await new Promise((resolve) => {
        outputCanvas.toBlob((item) => resolve(item), "image/png", 0.95);
      });
      if (!blob) throw new Error("canvas_export_failed");

      const resultUrl = URL.createObjectURL(blob);
      revokeImageEnhancerUrl(state.imageEnhancer.resultUrl);
      state.imageEnhancer = {
        ...state.imageEnhancer,
        resultUrl,
        resultSize: blob.size,
        resultWidth: outputWidth,
        resultHeight: outputHeight,
        loading: false,
        progress: 100,
        error: "",
        status: "تم تحسين الصورة بنجاح. يمكنك تحميل النتيجة الآن."
      };
      render();
    } catch (_) {
      state.imageEnhancer = {
        ...state.imageEnhancer,
        loading: false,
        progress: 0,
        error: "تعذر رفع جودة الصورة داخل المتصفح. جرّب صورة أصغر.",
        status: ""
      };
      render();
    }
  }

  function clearImageClarifierResult(status = "") {
    revokeImageEnhancerUrl(state.imageClarifier.resultUrl);
    state.imageClarifier = {
      ...state.imageClarifier,
      resultUrl: "",
      resultSize: 0,
      progress: 0,
      error: "",
      status
    };
  }

  function resetImageClarifierState() {
    revokeImageEnhancerUrl(state.imageClarifier.originalUrl);
    revokeImageEnhancerUrl(state.imageClarifier.resultUrl);
    if (state.imageClarifier.bitmap?.close) {
      state.imageClarifier.bitmap.close();
    }
    state.imageClarifier = {
      fileName: "",
      fileSize: 0,
      fileType: "",
      width: 0,
      height: 0,
      quality: "medium",
      noise: "medium",
      contrast: true,
      originalUrl: "",
      resultUrl: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: "",
      bitmap: null
    };
  }

  function adjustClarifierContrastBrightness(imageData, level) {
    const data = imageData.data;
    const settings = {
      light: { contrast: 1.05, brightness: 2 },
      medium: { contrast: 1.1, brightness: 4 },
      strong: { contrast: 1.16, brightness: 6 }
    };
    const active = settings[level] || settings.medium;

    for (let index = 0; index < data.length; index += 4) {
      data[index] = clampImageValue((data[index] - 128) * active.contrast + 128 + active.brightness);
      data[index + 1] = clampImageValue((data[index + 1] - 128) * active.contrast + 128 + active.brightness);
      data[index + 2] = clampImageValue((data[index + 2] - 128) * active.contrast + 128 + active.brightness);
    }

    return imageData;
  }

  function denoiseClarifierImageData(imageData, width, height, level) {
    if (level === "off" || width <= 2 || height <= 2) return imageData;
    const src = imageData.data;
    const output = new Uint8ClampedArray(src);
    const blend = level === "strong" ? 0.35 : 0.22;

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        for (let channel = 0; channel < 3; channel += 1) {
          let total = 0;
          let count = 0;

          for (let ky = -1; ky <= 1; ky += 1) {
            for (let kx = -1; kx <= 1; kx += 1) {
              const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + channel;
              total += src[pixelIndex];
              count += 1;
            }
          }

          const currentIndex = (y * width + x) * 4 + channel;
          const average = total / count;
          output[currentIndex] = clampImageValue(src[currentIndex] * (1 - blend) + average * blend);
        }
      }
    }

    imageData.data.set(output);
    return imageData;
  }

  function sharpenClarifierImageData(imageData, width, height, level) {
    if (width <= 2 || height <= 2) return imageData;
    const strength = {
      light: 0.25,
      medium: 0.45,
      strong: 0.7
    }[level] || 0.45;
    const src = imageData.data;
    const output = new Uint8ClampedArray(src);
    const kernel = [
      0, -strength, 0,
      -strength, 1 + 4 * strength, -strength,
      0, -strength, 0
    ];

    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        for (let channel = 0; channel < 3; channel += 1) {
          let sum = 0;
          let kernelIndex = 0;

          for (let ky = -1; ky <= 1; ky += 1) {
            for (let kx = -1; kx <= 1; kx += 1) {
              const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + channel;
              sum += src[pixelIndex] * kernel[kernelIndex];
              kernelIndex += 1;
            }
          }

          output[(y * width + x) * 4 + channel] = clampImageValue(sum);
        }
      }
    }

    imageData.data.set(output);
    return imageData;
  }

  function applyImageClarifierFilter(ctx, width, height, clarityLevel, denoiseLevel, contrastEnabled) {
    let imageData = ctx.getImageData(0, 0, width, height);

    if (contrastEnabled) {
      imageData = adjustClarifierContrastBrightness(imageData, clarityLevel);
    }
    imageData = denoiseClarifierImageData(imageData, width, height, denoiseLevel);
    imageData = sharpenClarifierImageData(imageData, width, height, clarityLevel);

    ctx.putImageData(imageData, 0, 0);
  }

  async function handleImageClarifierFile(file) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }

    if (!file) return;
    if (!imageEnhancerAllowedTypes.includes(file.type)) {
      state.imageClarifier.error = "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP.";
      render();
      return;
    }
    if (Number(file.size || 0) > imageEnhancerMaxFileSize) {
      state.imageClarifier.error = "حجم الصورة كبير جدًا. الحد الأقصى 20MB.";
      render();
      return;
    }

    const originalUrl = URL.createObjectURL(file);
    try {
      const bitmap = await createImageBitmap(file);
      if (bitmap.width * bitmap.height > imageEnhancerMaxOutputPixels) {
        bitmap.close?.();
        revokeImageEnhancerUrl(originalUrl);
        state.imageClarifier.error = "أبعاد الصورة كبيرة جدًا للمعالجة داخل المتصفح. جرّب صورة أصغر.";
        render();
        return;
      }
      revokeImageEnhancerUrl(state.imageClarifier.originalUrl);
      revokeImageEnhancerUrl(state.imageClarifier.resultUrl);
      if (state.imageClarifier.bitmap?.close) {
        state.imageClarifier.bitmap.close();
      }
      state.imageClarifier = {
        ...state.imageClarifier,
        fileName: file.name || "image",
        fileSize: file.size || 0,
        fileType: file.type || "",
        width: bitmap.width,
        height: bitmap.height,
        originalUrl,
        resultUrl: "",
        resultSize: 0,
        bitmap,
        loading: false,
        progress: 0,
        error: "",
        status: "تم تحميل الصورة. اختر مستوى التوضيح ثم اضغط توضيح الصورة."
      };
      render();
    } catch (_) {
      revokeImageEnhancerUrl(originalUrl);
      state.imageClarifier.error = "تعذر قراءة الصورة. جرّب ملفًا آخر.";
      render();
    }
  }

  async function runImageClarifier() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }

    const clarifier = state.imageClarifier;
    if (!clarifier.bitmap) {
      state.imageClarifier.error = "اختر صورة أولًا.";
      render();
      return;
    }

    state.imageClarifier = {
      ...state.imageClarifier,
      loading: true,
      progress: 45,
      error: "",
      status: "جاري توضيح الصورة داخل المتصفح..."
    };
    render();

    try {
      const outputCanvas = document.createElement("canvas");
      const outputCtx = outputCanvas.getContext("2d", { willReadFrequently: true });
      outputCanvas.width = clarifier.bitmap.width;
      outputCanvas.height = clarifier.bitmap.height;
      outputCtx.imageSmoothingEnabled = true;
      outputCtx.imageSmoothingQuality = "high";
      outputCtx.drawImage(clarifier.bitmap, 0, 0);
      applyImageClarifierFilter(
        outputCtx,
        outputCanvas.width,
        outputCanvas.height,
        String(clarifier.quality || "medium"),
        String(clarifier.noise || "medium"),
        clarifier.contrast !== false
      );

      const blob = await new Promise((resolve) => {
        outputCanvas.toBlob((item) => resolve(item), "image/png", 0.96);
      });
      if (!blob) throw new Error("canvas_export_failed");

      const resultUrl = URL.createObjectURL(blob);
      revokeImageEnhancerUrl(state.imageClarifier.resultUrl);
      state.imageClarifier = {
        ...state.imageClarifier,
        resultUrl,
        resultSize: blob.size,
        loading: false,
        progress: 100,
        error: "",
        status: "تم توضيح الصورة بنجاح. يمكنك تحميل النتيجة الآن."
      };
      render();
    } catch (_) {
      state.imageClarifier = {
        ...state.imageClarifier,
        loading: false,
        progress: 0,
        error: "تعذر توضيح الصورة داخل المتصفح. جرّب صورة أصغر.",
        status: ""
      };
      render();
    }
  }

  function createPngToPdfImageId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `png-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clearPngToPdfResult(status = "") {
    revokeImageEnhancerUrl(state.pngToPdf.resultUrl);
    state.pngToPdf = {
      ...state.pngToPdf,
      resultUrl: "",
      resultSize: 0,
      progress: 0,
      error: "",
      status
    };
  }

  function resetPngToPdfState() {
    (state.pngToPdf.images || []).forEach((image) => revokeImageEnhancerUrl(image.previewUrl));
    revokeImageEnhancerUrl(state.pngToPdf.resultUrl);
    state.pngToPdf = {
      images: [],
      pageSize: "A4",
      orientation: "portrait",
      margin: "20",
      fillPage: true,
      resultUrl: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: "",
      draggedId: ""
    };
  }

  async function addPngToPdfFiles(files) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }

    const incoming = Array.from(files || []);
    if (!incoming.length) return;

    const added = [];
    const rejected = [];
    for (const file of incoming) {
      const isPng = pngToPdfAllowedTypes.includes(file.type) || /\.png$/i.test(file.name || "");
      if (!isPng) {
        rejected.push(file.name || "file");
        continue;
      }
      if (Number(file.size || 0) > pngToPdfMaxFileSize) {
        rejected.push(file.name || "file");
        continue;
      }
      try {
        const bitmap = await createImageBitmap(file);
        const previewUrl = URL.createObjectURL(file);
        added.push({
          id: createPngToPdfImageId(),
          file,
          previewUrl,
          name: file.name || "image.png",
          size: file.size || 0,
          width: bitmap.width,
          height: bitmap.height
        });
        bitmap.close?.();
      } catch (_) {
        rejected.push(file.name || "file");
      }
    }

    if (added.length) {
      clearPngToPdfResult("تمت إضافة الصور. يمكنك ترتيبها ثم تحويلها إلى PDF.");
      state.pngToPdf.images = [...(state.pngToPdf.images || []), ...added];
      state.pngToPdf.error = "";
    }
    if (rejected.length && !added.length) {
      state.pngToPdf.error = "اختر صور PNG فقط، وبحجم لا يتجاوز 20MB لكل صورة.";
    } else if (rejected.length) {
      state.pngToPdf.status = "تم تجاهل بعض الملفات غير المدعومة أو الكبيرة.";
    }
    render();
  }

  function removePngToPdfImage(id) {
    const images = state.pngToPdf.images || [];
    const target = images.find((image) => image.id === id);
    if (target) revokeImageEnhancerUrl(target.previewUrl);
    state.pngToPdf.images = images.filter((image) => image.id !== id);
    clearPngToPdfResult(state.pngToPdf.images.length ? "تم حذف الصورة من القائمة." : "");
    render();
  }

  function movePngToPdfImage(id, direction) {
    const images = [...(state.pngToPdf.images || [])];
    const index = images.findIndex((image) => image.id === id);
    if (index < 0) return;
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const [item] = images.splice(index, 1);
    images.splice(nextIndex, 0, item);
    state.pngToPdf.images = images;
    clearPngToPdfResult("تم تحديث ترتيب الصور.");
    render();
  }

  function reorderPngToPdfImage(draggedId, targetId) {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const images = [...(state.pngToPdf.images || [])];
    const draggedIndex = images.findIndex((image) => image.id === draggedId);
    const targetIndex = images.findIndex((image) => image.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;
    const [draggedItem] = images.splice(draggedIndex, 1);
    images.splice(targetIndex, 0, draggedItem);
    state.pngToPdf.images = images;
    state.pngToPdf.draggedId = "";
    clearPngToPdfResult("تم تحديث ترتيب الصور.");
    render();
  }

  function loadPdfLib() {
    if (window.PDFLib?.PDFDocument) {
      return Promise.resolve(window.PDFLib);
    }
    if (window.__orlixorPdfLibPromise) {
      return window.__orlixorPdfLibPromise;
    }
    window.__orlixorPdfLibPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById("pdfLibScript");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.PDFLib));
        existingScript.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.id = "pdfLibScript";
      script.src = "https://unpkg.com/pdf-lib/dist/pdf-lib.min.js";
      script.async = true;
      script.onload = () => {
        if (window.PDFLib?.PDFDocument) {
          resolve(window.PDFLib);
        } else {
          reject(new Error("pdf-lib unavailable"));
        }
      };
      script.onerror = () => reject(new Error("pdf-lib failed to load"));
      document.head.appendChild(script);
    });
    return window.__orlixorPdfLibPromise;
  }

  function getPngToPdfPageDimensions({ pageSize, orientation, imageWidth, imageHeight }) {
    if (pageSize === "fit") {
      return {
        pageWidth: imageWidth,
        pageHeight: imageHeight
      };
    }
    let [width, height] = pngToPdfPageSizes[pageSize] || pngToPdfPageSizes.A4;
    if (orientation === "landscape") {
      [width, height] = [height, width];
    }
    return {
      pageWidth: width,
      pageHeight: height
    };
  }

  function fitPngImageIntoPage({ imageWidth, imageHeight, pageWidth, pageHeight, margin, fillPage }) {
    const availableWidth = Math.max(1, pageWidth - margin * 2);
    const availableHeight = Math.max(1, pageHeight - margin * 2);
    const imageRatio = imageWidth / imageHeight;
    const pageRatio = availableWidth / availableHeight;
    let width;
    let height;

    if (fillPage) {
      if (imageRatio > pageRatio) {
        height = availableHeight;
        width = height * imageRatio;
      } else {
        width = availableWidth;
        height = width / imageRatio;
      }
    } else if (imageRatio > pageRatio) {
      width = availableWidth;
      height = width / imageRatio;
    } else {
      height = availableHeight;
      width = height * imageRatio;
    }

    return {
      width,
      height,
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2
    };
  }

  async function convertPngImagesToPdfBytes(images, options) {
    const { PDFDocument } = await loadPdfLib();
    const pdfDoc = await PDFDocument.create();
    for (const image of images) {
      const imageBytes = await image.file.arrayBuffer();
      const pngImage = await pdfDoc.embedPng(imageBytes);
      const { pageWidth, pageHeight } = getPngToPdfPageDimensions({
        pageSize: options.pageSize,
        orientation: options.orientation,
        imageWidth: pngImage.width,
        imageHeight: pngImage.height
      });
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const fit = fitPngImageIntoPage({
        imageWidth: pngImage.width,
        imageHeight: pngImage.height,
        pageWidth,
        pageHeight,
        margin: options.margin,
        fillPage: options.fillPage
      });
      page.drawImage(pngImage, {
        x: fit.x,
        y: fit.y,
        width: fit.width,
        height: fit.height
      });
    }
    return pdfDoc.save();
  }

  async function runPngToPdfConversion() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    const images = state.pngToPdf.images || [];
    if (!images.length) {
      state.pngToPdf.error = "أضف صورة PNG واحدة على الأقل.";
      render();
      return;
    }

    state.pngToPdf = {
      ...state.pngToPdf,
      loading: true,
      progress: 35,
      error: "",
      status: "جاري تجهيز ملف PDF داخل المتصفح..."
    };
    render();

    try {
      const pdfBytes = await convertPngImagesToPdfBytes(images, {
        pageSize: state.pngToPdf.pageSize || "A4",
        orientation: state.pngToPdf.orientation || "portrait",
        margin: Number(state.pngToPdf.margin || 20),
        fillPage: state.pngToPdf.fillPage !== false
      });
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const resultUrl = URL.createObjectURL(blob);
      revokeImageEnhancerUrl(state.pngToPdf.resultUrl);
      state.pngToPdf = {
        ...state.pngToPdf,
        resultUrl,
        resultSize: blob.size,
        loading: false,
        progress: 100,
        error: "",
        status: "تم تحويل الصور إلى PDF بنجاح. يمكنك تحميل الملف الآن."
      };
      render();
    } catch (_) {
      state.pngToPdf = {
        ...state.pngToPdf,
        loading: false,
        progress: 0,
        error: "تعذر تحويل الصور إلى PDF. تحقق من الاتصال لتحميل مكتبة pdf-lib ثم حاول مجددًا.",
        status: ""
      };
      render();
    }
  }

  function createImageConverterImageId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `converter-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clearImageConverterResult(status = "") {
    revokeImageEnhancerUrl(state.imageConverter.resultUrl);
    state.imageConverter = {
      ...state.imageConverter,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      progress: 0,
      error: "",
      status
    };
  }

  function resetImageConverterState() {
    (state.imageConverter.images || []).forEach((image) => revokeImageEnhancerUrl(image.previewUrl));
    revokeImageEnhancerUrl(state.imageConverter.resultUrl);
    state.imageConverter = {
      images: [],
      targetFormat: "image/jpeg",
      quality: "0.85",
      resizeMode: "original",
      customWidth: "",
      customHeight: "",
      enhance: false,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    };
  }

  function isImageConverterFileAllowed(file) {
    const name = String(file?.name || "");
    return imageConverterAllowedTypes.includes(file?.type) || /\.(jpe?g|png|webp)$/i.test(name);
  }

  async function addImageConverterFiles(files) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }

    const incoming = Array.from(files || []);
    if (!incoming.length) return;
    const availableSlots = Math.max(0, imageConverterMaxFiles - (state.imageConverter.images || []).length);
    if (!availableSlots) {
      state.imageConverter.error = `الحد الأقصى ${imageConverterMaxFiles.toLocaleString("ar-SA")} صورة.`;
      render();
      return;
    }

    const added = [];
    const rejected = [];
    const limited = incoming.slice(0, availableSlots);
    for (const file of limited) {
      if (!isImageConverterFileAllowed(file)) {
        rejected.push(file.name || "file");
        continue;
      }
      if (Number(file.size || 0) > imageConverterMaxFileSize) {
        rejected.push(file.name || "file");
        continue;
      }
      try {
        const bitmap = await createImageBitmap(file);
        const previewUrl = URL.createObjectURL(file);
        added.push({
          id: createImageConverterImageId(),
          file,
          previewUrl,
          name: file.name || "image",
          size: file.size || 0,
          type: file.type || "image",
          width: bitmap.width,
          height: bitmap.height
        });
        bitmap.close?.();
      } catch (_) {
        rejected.push(file.name || "file");
      }
    }

    if (added.length) {
      clearImageConverterResult("تمت إضافة الصور. اختر الصيغة والجودة ثم ابدأ التحويل.");
      state.imageConverter.images = [...(state.imageConverter.images || []), ...added];
      state.imageConverter.error = "";
    }
    if (incoming.length > availableSlots) {
      state.imageConverter.status = `تمت إضافة الحد المتاح فقط. الحد الأقصى ${imageConverterMaxFiles.toLocaleString("ar-SA")} صورة.`;
    }
    if (rejected.length && !added.length) {
      state.imageConverter.error = "اختر صور JPG أو PNG أو WebP فقط، وبحجم لا يتجاوز 20MB لكل صورة.";
    } else if (rejected.length) {
      state.imageConverter.status = "تم تجاهل بعض الملفات غير المدعومة أو الكبيرة.";
    }
    render();
  }

  function removeImageConverterImage(id) {
    const images = state.imageConverter.images || [];
    const target = images.find((image) => image.id === id);
    if (target) revokeImageEnhancerUrl(target.previewUrl);
    state.imageConverter.images = images.filter((image) => image.id !== id);
    clearImageConverterResult(state.imageConverter.images.length ? "تم حذف الصورة من القائمة." : "");
    render();
  }

  function getImageConverterOutputSize(originalWidth, originalHeight) {
    const resizeMode = state.imageConverter.resizeMode || "original";
    let width = Number(originalWidth || 1);
    let height = Number(originalHeight || 1);

    if (resizeMode === "small") {
      width = Math.max(1, Math.round(width * 0.5));
      height = Math.max(1, Math.round(height * 0.5));
    } else if (resizeMode === "custom") {
      const customWidth = Math.max(0, Math.round(Number(state.imageConverter.customWidth || 0)));
      const customHeight = Math.max(0, Math.round(Number(state.imageConverter.customHeight || 0)));
      if (customWidth && customHeight) {
        width = customWidth;
        height = customHeight;
      } else if (customWidth) {
        width = customWidth;
        height = Math.max(1, Math.round(originalHeight * (customWidth / originalWidth)));
      } else if (customHeight) {
        height = customHeight;
        width = Math.max(1, Math.round(originalWidth * (customHeight / originalHeight)));
      }
    }

    width = Math.min(12000, Math.max(1, width));
    height = Math.min(12000, Math.max(1, height));
    if (width * height > imageEnhancerMaxOutputPixels) {
      const ratio = Math.sqrt(imageEnhancerMaxOutputPixels / (width * height));
      width = Math.max(1, Math.floor(width * ratio));
      height = Math.max(1, Math.floor(height * ratio));
    }
    return { width, height };
  }

  function buildImageConverterFileName(originalName, targetFormat) {
    const extension = imageConverterFormats[targetFormat]?.extension || "jpg";
    const base = String(originalName || "orlixor-image")
      .replace(/\.[^/.]+$/, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim() || "orlixor-image";
    return `${base}.${extension}`;
  }

  function imageConverterCanvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  async function convertImageConverterImage(image) {
    const targetFormat = imageConverterFormats[state.imageConverter.targetFormat]
      ? state.imageConverter.targetFormat
      : "image/jpeg";
    const quality = Math.max(0.1, Math.min(1, Number(state.imageConverter.quality || 0.85)));
    const bitmap = await createImageBitmap(image.file);
    const { width, height } = getImageConverterOutputSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: Boolean(state.imageConverter.enhance) });
    canvas.width = width;
    canvas.height = height;

    if (targetFormat === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    if (state.imageConverter.enhance) {
      applyBasicImageEnhancement(ctx, width, height, "light");
    }

    const blob = await imageConverterCanvasToBlob(canvas, targetFormat, quality);
    if (!blob) throw new Error("image_export_failed");
    if (targetFormat === "image/webp" && blob.type && blob.type !== "image/webp") {
      throw new Error("webp_export_unsupported");
    }

    return {
      blob,
      fileName: buildImageConverterFileName(image.name, targetFormat)
    };
  }

  async function convertImageConverterImagesToZip(images) {
    const JSZip = await loadJsZip();
    const zip = new JSZip();
    for (let index = 0; index < images.length; index += 1) {
      state.imageConverter.progress = Math.max(8, Math.round(((index + 1) / images.length) * 88));
      state.imageConverter.status = `جاري تحويل الصورة ${index + 1} من ${images.length}...`;
      render();
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const result = await convertImageConverterImage(images[index]);
      zip.file(`${String(index + 1).padStart(2, "0")}-${result.fileName}`, result.blob);
    }
    state.imageConverter.progress = 95;
    state.imageConverter.status = "جاري ضغط الصور داخل ملف ZIP...";
    render();
    return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  }

  async function runImageConverterConversion() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    const images = state.imageConverter.images || [];
    if (!images.length) {
      state.imageConverter.error = "أضف صورة واحدة على الأقل.";
      render();
      return;
    }

    state.imageConverter = {
      ...state.imageConverter,
      loading: true,
      progress: 5,
      error: "",
      status: "جاري تجهيز التحويل داخل المتصفح..."
    };
    render();

    try {
      let blob;
      let fileName;
      if (images.length === 1) {
        const result = await convertImageConverterImage(images[0]);
        blob = result.blob;
        fileName = result.fileName;
      } else {
        blob = await convertImageConverterImagesToZip(images);
        fileName = "orlixor-converted-images.zip";
      }

      const resultUrl = URL.createObjectURL(blob);
      revokeImageEnhancerUrl(state.imageConverter.resultUrl);
      state.imageConverter = {
        ...state.imageConverter,
        resultUrl,
        resultFileName: fileName,
        resultSize: blob.size,
        loading: false,
        progress: 100,
        error: "",
        status: images.length === 1
          ? "تم تحويل الصورة بنجاح. يمكنك تحميل النتيجة الآن."
          : "تم تحويل الصور وتجهيز ملف ZIP بنجاح."
      };
      render();
    } catch (error) {
      state.imageConverter = {
        ...state.imageConverter,
        loading: false,
        progress: 0,
        error: String(error?.message || "").includes("webp")
          ? "متصفحك لا يدعم تصدير WebP حاليًا. جرّب PNG أو JPG."
          : "تعذر تحويل الصور داخل المتصفح. جرّب صورًا أصغر أو صيغة مختلفة.",
        status: ""
      };
      render();
    }
  }

  function createImageCompressorImageId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `compressor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clearImageCompressorResult(status = "") {
    revokeImageEnhancerUrl(state.imageCompressor.resultUrl);
    revokeImageEnhancerUrl(state.imageCompressor.comparisonUrl);
    state.imageCompressor = {
      ...state.imageCompressor,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      comparisonUrl: "",
      comparison: null,
      compressedTotal: 0,
      savedBytes: 0,
      savedPercent: 0,
      progress: 0,
      error: "",
      status
    };
  }

  function resetImageCompressorState() {
    (state.imageCompressor.images || []).forEach((image) => revokeImageEnhancerUrl(image.previewUrl));
    revokeImageEnhancerUrl(state.imageCompressor.resultUrl);
    revokeImageEnhancerUrl(state.imageCompressor.comparisonUrl);
    state.imageCompressor = {
      images: [],
      compressionLevel: "70",
      outputFormat: "original",
      resizeEnabled: false,
      maxWidth: "",
      maxHeight: "",
      enhance: false,
      zoom: 1,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      comparisonUrl: "",
      comparison: null,
      compressedTotal: 0,
      savedBytes: 0,
      savedPercent: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    };
  }

  function isImageCompressorFileAllowed(file) {
    const name = String(file?.name || "");
    return imageCompressorAllowedTypes.includes(file?.type) || /\.(jpe?g|png|webp)$/i.test(name);
  }

  async function addImageCompressorFiles(files) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }

    const incoming = Array.from(files || []);
    if (!incoming.length) return;
    const availableSlots = Math.max(0, imageCompressorMaxFiles - (state.imageCompressor.images || []).length);
    if (!availableSlots) {
      state.imageCompressor.error = `الحد الأقصى ${imageCompressorMaxFiles.toLocaleString("ar-SA")} صورة.`;
      render();
      return;
    }

    const added = [];
    const rejected = [];
    const limited = incoming.slice(0, availableSlots);
    for (const file of limited) {
      if (!isImageCompressorFileAllowed(file) || Number(file.size || 0) > imageCompressorMaxFileSize) {
        rejected.push(file.name || "file");
        continue;
      }
      try {
        const bitmap = await createImageBitmap(file);
        const previewUrl = URL.createObjectURL(file);
        added.push({
          id: createImageCompressorImageId(),
          file,
          previewUrl,
          name: file.name || "image",
          size: file.size || 0,
          type: file.type || "image",
          width: bitmap.width,
          height: bitmap.height
        });
        bitmap.close?.();
      } catch (_) {
        rejected.push(file.name || "file");
      }
    }

    if (added.length) {
      clearImageCompressorResult("تمت إضافة الصور. اختر مستوى الضغط ثم ابدأ الضغط.");
      state.imageCompressor.images = [...(state.imageCompressor.images || []), ...added];
      state.imageCompressor.error = "";
    }
    if (incoming.length > availableSlots) {
      state.imageCompressor.status = `تمت إضافة الحد المتاح فقط. الحد الأقصى ${imageCompressorMaxFiles.toLocaleString("ar-SA")} صورة.`;
    }
    if (rejected.length && !added.length) {
      state.imageCompressor.error = "اختر صور JPG أو PNG أو WebP فقط، وبحجم لا يتجاوز 20MB لكل صورة.";
    } else if (rejected.length) {
      state.imageCompressor.status = "تم تجاهل بعض الملفات غير المدعومة أو الكبيرة.";
    }
    render();
  }

  function removeImageCompressorImage(id) {
    const images = state.imageCompressor.images || [];
    const target = images.find((image) => image.id === id);
    if (target) revokeImageEnhancerUrl(target.previewUrl);
    state.imageCompressor.images = images.filter((image) => image.id !== id);
    clearImageCompressorResult(state.imageCompressor.images.length ? "تم حذف الصورة من القائمة." : "");
    render();
  }

  function getImageCompressorQuality() {
    const value = Number(state.imageCompressor.compressionLevel || 70);
    return Math.max(0.4, Math.min(0.95, value / 100));
  }

  function getImageCompressorOutputFormat(originalType) {
    const selected = state.imageCompressor.outputFormat || "original";
    if (imageConverterFormats[selected]) return selected;
    if (selected === "original" && originalType === "image/png") return "image/webp";
    if (selected === "original" && imageConverterFormats[originalType]) return originalType;
    return "image/jpeg";
  }

  function getImageCompressorOutputSize(originalWidth, originalHeight) {
    let width = Math.max(1, Number(originalWidth || 1));
    let height = Math.max(1, Number(originalHeight || 1));

    if (state.imageCompressor.resizeEnabled) {
      const maxWidth = Math.max(0, Math.round(Number(state.imageCompressor.maxWidth || 0))) || width;
      const maxHeight = Math.max(0, Math.round(Number(state.imageCompressor.maxHeight || 0))) || height;
      const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }

    width = Math.min(12000, Math.max(1, width));
    height = Math.min(12000, Math.max(1, height));
    if (width * height > imageEnhancerMaxOutputPixels) {
      const ratio = Math.sqrt(imageEnhancerMaxOutputPixels / (width * height));
      width = Math.max(1, Math.floor(width * ratio));
      height = Math.max(1, Math.floor(height * ratio));
    }

    return { width, height };
  }

  function buildImageCompressorFileName(originalName, outputFormat) {
    const extension = imageConverterFormats[outputFormat]?.extension || "jpg";
    const base = String(originalName || "orlixor-image")
      .replace(/\.[^/.]+$/, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim() || "orlixor-image";
    return `${base}-compressed.${extension}`;
  }

  function imageCompressorCanvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  async function compressImageCompressorImage(image) {
    const bitmap = await createImageBitmap(image.file);
    const outputFormat = getImageCompressorOutputFormat(image.type);
    const quality = getImageCompressorQuality();
    const { width, height } = getImageCompressorOutputSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: Boolean(state.imageCompressor.enhance) });
    canvas.width = width;
    canvas.height = height;

    if (outputFormat === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    if (state.imageCompressor.enhance) {
      applyBasicImageEnhancement(ctx, width, height, "light");
    }

    const blob = await imageCompressorCanvasToBlob(canvas, outputFormat, quality);
    if (!blob) throw new Error("image_compress_failed");
    if (outputFormat === "image/webp" && blob.type && blob.type !== "image/webp") {
      throw new Error("webp_export_unsupported");
    }

    const originalSize = Number(image.size || image.file?.size || 0);
    const compressedSize = Number(blob.size || 0);
    const savedBytes = Math.max(0, originalSize - compressedSize);
    const savedPercent = originalSize ? Math.max(0, Math.round((savedBytes / originalSize) * 100)) : 0;

    return {
      blob,
      fileName: buildImageCompressorFileName(image.name, outputFormat),
      outputFormat,
      outputWidth: width,
      outputHeight: height,
      originalSize,
      compressedSize,
      savedBytes,
      savedPercent,
      isLarger: compressedSize > originalSize
    };
  }

  async function compressImageCompressorImagesToZip(images) {
    const JSZip = await loadJsZip();
    const zip = new JSZip();
    const results = [];
    for (let index = 0; index < images.length; index += 1) {
      state.imageCompressor.progress = Math.max(8, Math.round(((index + 1) / images.length) * 88));
      state.imageCompressor.status = `جاري ضغط الصورة ${index + 1} من ${images.length}...`;
      render();
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const result = await compressImageCompressorImage(images[index]);
      results.push(result);
      zip.file(`${String(index + 1).padStart(2, "0")}-${result.fileName}`, result.blob);
    }
    state.imageCompressor.progress = 95;
    state.imageCompressor.status = "جاري تجميع الصور المضغوطة داخل ملف ZIP...";
    render();
    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
    return { blob, results };
  }

  async function runImageCompressorCompression() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    const images = state.imageCompressor.images || [];
    if (!images.length) {
      state.imageCompressor.error = "أضف صورة واحدة على الأقل.";
      render();
      return;
    }

    state.imageCompressor = {
      ...state.imageCompressor,
      loading: true,
      progress: 5,
      error: "",
      status: "جاري ضغط الصور داخل المتصفح..."
    };
    render();

    try {
      let blob;
      let fileName;
      let results = [];
      if (images.length === 1) {
        const result = await compressImageCompressorImage(images[0]);
        results = [result];
        blob = result.blob;
        fileName = result.fileName;
      } else {
        const zipResult = await compressImageCompressorImagesToZip(images);
        results = zipResult.results;
        blob = zipResult.blob;
        fileName = "orlixor-compressed-images.zip";
      }

      const firstImage = images[0];
      const firstResult = results[0];
      const resultUrl = URL.createObjectURL(blob);
      const comparisonUrl = firstResult ? URL.createObjectURL(firstResult.blob) : "";
      const originalTotal = images.reduce((sum, image) => sum + Number(image.size || 0), 0);
      const compressedTotal = results.reduce((sum, result) => sum + Number(result.compressedSize || 0), 0);
      const savedBytes = Math.max(0, originalTotal - compressedTotal);
      const savedPercent = originalTotal ? Math.max(0, Math.round((savedBytes / originalTotal) * 100)) : 0;
      const hasLargerOutput = results.some((result) => result.isLarger);

      revokeImageEnhancerUrl(state.imageCompressor.resultUrl);
      revokeImageEnhancerUrl(state.imageCompressor.comparisonUrl);
      state.imageCompressor = {
        ...state.imageCompressor,
        resultUrl,
        resultFileName: fileName,
        resultSize: blob.size,
        comparisonUrl,
        comparison: firstResult ? {
          fileName: firstImage?.name || "",
          originalUrl: firstImage?.previewUrl || "",
          originalSize: firstResult.originalSize,
          compressedSize: firstResult.compressedSize,
          savedBytes: firstResult.savedBytes,
          savedPercent: firstResult.savedPercent,
          outputWidth: firstResult.outputWidth,
          outputHeight: firstResult.outputHeight,
          isLarger: firstResult.isLarger
        } : null,
        compressedTotal,
        savedBytes,
        savedPercent,
        loading: false,
        progress: 100,
        error: "",
        status: hasLargerOutput
          ? "تم الضغط، لكن بعض الملفات الناتجة أكبر من الأصل. جرّب WebP أو مستوى ضغط أعلى."
          : images.length === 1
            ? "تم ضغط الصورة بنجاح. يمكنك تحميل النتيجة الآن."
            : "تم ضغط الصور وتجهيز ملف ZIP بنجاح."
      };
      render();
    } catch (error) {
      state.imageCompressor = {
        ...state.imageCompressor,
        loading: false,
        progress: 0,
        error: String(error?.message || "").includes("webp")
          ? "متصفحك لا يدعم تصدير WebP حاليًا. جرّب JPG أو PNG."
          : "تعذر ضغط الصور داخل المتصفح. جرّب صورًا أصغر أو صيغة مختلفة.",
        status: ""
      };
      render();
    }
  }

  function getImageRotatorFileType(file) {
    if (imageRotatorAllowedTypes.includes(file?.type)) return file.type;
    const name = String(file?.name || "").toLowerCase();
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    return "";
  }

  function normalizeImageRotatorAngle(angle) {
    const value = Number(angle || 0);
    return ((Math.round(value) % 360) + 360) % 360;
  }

  function getImageRotatorExtension(type, fileName = "") {
    const fromType = imageConverterFormats[type]?.extension;
    if (fromType) return fromType;
    const match = String(fileName || "").match(/\.([a-z0-9]+)$/i);
    return (match?.[1] || "png").toLowerCase();
  }

  function buildImageRotatorFileName(fileName, type) {
    const base = String(fileName || "orlixor-image")
      .replace(/\.[^/.]+$/, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim() || "orlixor-image";
    return `${base}-rotated.${getImageRotatorExtension(type, fileName)}`;
  }

  function clearImageRotatorResult(status = "") {
    revokeImageEnhancerUrl(state.imageRotator.resultUrl);
    state.imageRotator = {
      ...state.imageRotator,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      progress: 0,
      error: "",
      status
    };
  }

  function resetImageRotatorState() {
    revokeImageEnhancerUrl(state.imageRotator.previewUrl);
    revokeImageEnhancerUrl(state.imageRotator.resultUrl);
    try {
      state.imageRotator.bitmap?.close?.();
    } catch (_) {
      // Ignore bitmap cleanup errors.
    }
    state.imageRotator = {
      fileName: "",
      fileSize: 0,
      fileType: "",
      width: 0,
      height: 0,
      outputWidth: 0,
      outputHeight: 0,
      angle: 0,
      customAngle: "0",
      keepSize: true,
      enhance: false,
      previewUrl: "",
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: "",
      bitmap: null
    };
  }

  function createImageRotatorCanvas({ bitmap, angle, keepSize, enhance, type }) {
    const radians = normalizeImageRotatorAngle(angle) * Math.PI / 180;
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;
    let outputWidth = originalWidth;
    let outputHeight = originalHeight;

    if (!keepSize) {
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));
      outputWidth = Math.ceil(originalWidth * cos + originalHeight * sin);
      outputHeight = Math.ceil(originalWidth * sin + originalHeight * cos);
    } else if (normalizeImageRotatorAngle(angle) % 180 !== 0) {
      outputWidth = originalHeight;
      outputHeight = originalWidth;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: Boolean(enhance) });
    canvas.width = Math.max(1, outputWidth);
    canvas.height = Math.max(1, outputHeight);

    if (type === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);
    ctx.restore();

    if (enhance) {
      applyBasicImageEnhancement(ctx, canvas.width, canvas.height, "light");
    }

    return canvas;
  }

  function imageRotatorCanvasToBlob(canvas, type) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type || "image/png", 0.95);
    });
  }

  async function refreshImageRotatorPreview(status = "") {
    const rotator = state.imageRotator;
    if (!rotator.bitmap) return;
    const type = rotator.fileType || "image/png";
    const canvas = createImageRotatorCanvas({
      bitmap: rotator.bitmap,
      angle: rotator.angle,
      keepSize: rotator.keepSize !== false,
      enhance: Boolean(rotator.enhance),
      type
    });
    const blob = await imageRotatorCanvasToBlob(canvas, type);
    if (!blob) throw new Error("rotate_preview_failed");
    const previewUrl = URL.createObjectURL(blob);
    revokeImageEnhancerUrl(state.imageRotator.previewUrl);
    revokeImageEnhancerUrl(state.imageRotator.resultUrl);
    state.imageRotator = {
      ...state.imageRotator,
      previewUrl,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      outputWidth: canvas.width,
      outputHeight: canvas.height,
      progress: 0,
      error: "",
      status
    };
  }

  async function handleImageRotatorFile(file) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    if (!file) return;
    const fileType = getImageRotatorFileType(file);
    if (!fileType) {
      state.imageRotator.error = "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.";
      render();
      return;
    }
    if (Number(file.size || 0) > imageRotatorMaxFileSize) {
      state.imageRotator.error = "حجم الصورة كبير جدًا. الحد الأقصى 20MB.";
      render();
      return;
    }

    revokeImageEnhancerUrl(state.imageRotator.previewUrl);
    revokeImageEnhancerUrl(state.imageRotator.resultUrl);
    try {
      state.imageRotator.bitmap?.close?.();
    } catch (_) {
      // Ignore bitmap cleanup errors.
    }

    state.imageRotator = {
      ...state.imageRotator,
      fileName: file.name || "image",
      fileSize: file.size || 0,
      fileType,
      width: 0,
      height: 0,
      outputWidth: 0,
      outputHeight: 0,
      angle: 0,
      customAngle: "0",
      previewUrl: "",
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: true,
      progress: 35,
      error: "",
      status: "جاري قراءة الصورة داخل المتصفح..."
    };
    render();

    try {
      const bitmap = await createImageBitmap(file);
      state.imageRotator = {
        ...state.imageRotator,
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        outputWidth: bitmap.width,
        outputHeight: bitmap.height,
        loading: true,
        progress: 70,
        status: "جاري تجهيز المعاينة..."
      };
      await refreshImageRotatorPreview("تم تحميل الصورة. اختر اتجاه التدوير ثم حمّل النتيجة.");
      state.imageRotator.loading = false;
      state.imageRotator.progress = 0;
      render();
    } catch (_) {
      state.imageRotator = {
        ...state.imageRotator,
        bitmap: null,
        loading: false,
        progress: 0,
        previewUrl: "",
        error: "تعذر قراءة الصورة داخل المتصفح. جرّب صورة أخرى.",
        status: ""
      };
      render();
    }
  }

  async function updateImageRotatorAngle(angle, absolute = false) {
    if (!state.imageRotator.bitmap) {
      state.imageRotator.error = "اختر صورة أولًا.";
      render();
      return;
    }
    const nextAngle = absolute
      ? normalizeImageRotatorAngle(angle)
      : normalizeImageRotatorAngle(Number(state.imageRotator.angle || 0) + Number(angle || 0));
    state.imageRotator.angle = nextAngle;
    state.imageRotator.customAngle = String(nextAngle);
    state.imageRotator.loading = true;
    state.imageRotator.progress = 55;
    state.imageRotator.error = "";
    state.imageRotator.status = "جاري تدوير المعاينة...";
    render();
    try {
      await refreshImageRotatorPreview("تم تحديث زاوية التدوير.");
      state.imageRotator.loading = false;
      state.imageRotator.progress = 0;
    } catch (_) {
      state.imageRotator.loading = false;
      state.imageRotator.progress = 0;
      state.imageRotator.error = "تعذر تدوير الصورة. جرّب زاوية أخرى.";
      state.imageRotator.status = "";
    }
    render();
  }

  async function rerenderImageRotatorPreviewAfterSetting(status = "الإعدادات تغيّرت. شغّل التدوير من جديد.") {
    if (!state.imageRotator.bitmap) {
      render();
      return;
    }
    state.imageRotator.loading = true;
    state.imageRotator.progress = 45;
    state.imageRotator.error = "";
    state.imageRotator.status = "جاري تحديث المعاينة...";
    render();
    try {
      await refreshImageRotatorPreview(status);
      state.imageRotator.loading = false;
      state.imageRotator.progress = 0;
    } catch (_) {
      state.imageRotator.loading = false;
      state.imageRotator.progress = 0;
      state.imageRotator.error = "تعذر تحديث المعاينة.";
      state.imageRotator.status = "";
    }
    render();
  }

  async function runImageRotatorExport() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    const rotator = state.imageRotator;
    if (!rotator.bitmap) {
      state.imageRotator.error = "اختر صورة أولًا.";
      render();
      return;
    }
    state.imageRotator = {
      ...state.imageRotator,
      loading: true,
      progress: 65,
      error: "",
      status: "جاري تجهيز الصورة للتحميل..."
    };
    render();
    try {
      const type = state.imageRotator.fileType || "image/png";
      const canvas = createImageRotatorCanvas({
        bitmap: state.imageRotator.bitmap,
        angle: state.imageRotator.angle,
        keepSize: state.imageRotator.keepSize !== false,
        enhance: Boolean(state.imageRotator.enhance),
        type
      });
      const blob = await imageRotatorCanvasToBlob(canvas, type);
      if (!blob) throw new Error("rotate_export_failed");
      const resultUrl = URL.createObjectURL(blob);
      revokeImageEnhancerUrl(state.imageRotator.resultUrl);
      state.imageRotator = {
        ...state.imageRotator,
        resultUrl,
        resultFileName: buildImageRotatorFileName(state.imageRotator.fileName, type),
        resultSize: blob.size,
        outputWidth: canvas.width,
        outputHeight: canvas.height,
        loading: false,
        progress: 100,
        error: "",
        status: "تم تدوير الصورة بنجاح. يمكنك تحميل النتيجة الآن."
      };
      render();
    } catch (_) {
      state.imageRotator = {
        ...state.imageRotator,
        loading: false,
        progress: 0,
        error: "تعذر تجهيز الصورة للتحميل. جرّب صورة أصغر.",
        status: ""
      };
      render();
    }
  }

  function getImageCropperFileType(file) {
    if (imageCropperAllowedTypes.includes(file?.type)) return file.type;
    const name = String(file?.name || "").toLowerCase();
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    return "";
  }

  function getImageCropperExtension(type, fileName = "") {
    const fromType = imageConverterFormats[type]?.extension;
    if (fromType) return fromType;
    const match = String(fileName || "").match(/\.([a-z0-9]+)$/i);
    return (match?.[1] || "png").toLowerCase();
  }

  function buildImageCropperFileName(fileName, type) {
    const base = String(fileName || "orlixor-image")
      .replace(/\.[^/.]+$/, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim() || "orlixor-image";
    return `${base}-cropped.${getImageCropperExtension(type, fileName)}`;
  }

  function clearImageCropperResult(status = "") {
    revokeImageEnhancerUrl(state.imageCropper.resultUrl);
    state.imageCropper = {
      ...state.imageCropper,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      progress: 0,
      error: "",
      status
    };
  }

  function resetImageCropperState() {
    revokeImageEnhancerUrl(state.imageCropper.resultUrl);
    try {
      state.imageCropper.bitmap?.close?.();
    } catch (_) {
      // Ignore bitmap cleanup errors.
    }
    state.imageCropper = {
      fileName: "",
      fileSize: 0,
      fileType: "",
      width: 0,
      height: 0,
      cropX: 0,
      cropY: 0,
      cropWidth: 0,
      cropHeight: 0,
      aspectRatio: "free",
      customWidth: "",
      customHeight: "",
      zoom: 1,
      enhance: false,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: "",
      dragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      bitmap: null
    };
  }

  function getInitialImageCropperCrop(width, height) {
    return {
      cropX: Math.round(width * 0.15),
      cropY: Math.round(height * 0.15),
      cropWidth: Math.max(1, Math.round(width * 0.7)),
      cropHeight: Math.max(1, Math.round(height * 0.7))
    };
  }

  function normalizeImageCropperCrop(partial = {}) {
    const cropper = state.imageCropper;
    const imageWidth = Math.max(1, Number(cropper.width || cropper.bitmap?.width || 1));
    const imageHeight = Math.max(1, Number(cropper.height || cropper.bitmap?.height || 1));
    let cropWidth = Math.round(Number(partial.cropWidth ?? cropper.cropWidth) || Math.round(imageWidth * 0.7));
    let cropHeight = Math.round(Number(partial.cropHeight ?? cropper.cropHeight) || Math.round(imageHeight * 0.7));
    let cropX = Math.round(Number(partial.cropX ?? cropper.cropX) || 0);
    let cropY = Math.round(Number(partial.cropY ?? cropper.cropY) || 0);

    cropWidth = Math.max(1, Math.min(cropWidth, imageWidth));
    cropHeight = Math.max(1, Math.min(cropHeight, imageHeight));
    cropX = Math.max(0, Math.min(cropX, imageWidth - cropWidth));
    cropY = Math.max(0, Math.min(cropY, imageHeight - cropHeight));

    return { cropX, cropY, cropWidth, cropHeight };
  }

  function setImageCropperCrop(partial = {}, status = "") {
    const crop = normalizeImageCropperCrop(partial);
    state.imageCropper = {
      ...state.imageCropper,
      ...crop
    };
    clearImageCropperResult(status);
  }

  function applyImageCropperAspectRatio(ratioKey) {
    if (!state.imageCropper.bitmap) {
      state.imageCropper.aspectRatio = ratioKey;
      render();
      return;
    }
    const ratio = imageCropperAspectRatios[ratioKey] || null;
    state.imageCropper.aspectRatio = ratioKey;
    if (!ratio) {
      clearImageCropperResult("تم اختيار القص الحر.");
      render();
      return;
    }
    const current = normalizeImageCropperCrop();
    let cropWidth = current.cropWidth;
    let cropHeight = Math.round(cropWidth / ratio);
    if (current.cropY + cropHeight > state.imageCropper.height) {
      cropHeight = Math.max(1, state.imageCropper.height - current.cropY);
      cropWidth = Math.round(cropHeight * ratio);
    }
    setImageCropperCrop({ cropWidth, cropHeight }, "تم تحديث نسبة القص.");
    render();
  }

  function moveImageCropperCrop(dx, dy) {
    if (!state.imageCropper.bitmap) return;
    const stepX = Math.max(8, Math.round(state.imageCropper.width * 0.035));
    const stepY = Math.max(8, Math.round(state.imageCropper.height * 0.035));
    setImageCropperCrop({
      cropX: state.imageCropper.cropX + dx * stepX,
      cropY: state.imageCropper.cropY + dy * stepY
    }, "تم تحريك منطقة القص.");
    render();
  }

  function updateImageCropperZoom(delta) {
    const current = Number(state.imageCropper.zoom || 1);
    state.imageCropper.zoom = Math.max(0.65, Math.min(1.45, Number((current + delta).toFixed(2))));
    render();
  }

  function getImageCropperCanvasPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    return {
      x: Math.round((event.clientX - rect.left) * (canvas.width / rect.width)),
      y: Math.round((event.clientY - rect.top) * (canvas.height / rect.height))
    };
  }

  function isPointInsideImageCropperCrop(point) {
    const crop = normalizeImageCropperCrop();
    return point.x >= crop.cropX
      && point.x <= crop.cropX + crop.cropWidth
      && point.y >= crop.cropY
      && point.y <= crop.cropY + crop.cropHeight;
  }

  function drawImageCropperPreview() {
    const cropper = state.imageCropper;
    const canvas = app.querySelector("[data-image-cropper-canvas]");
    if (!canvas || !cropper.bitmap) return;
    const ctx = canvas.getContext("2d");
    const crop = normalizeImageCropperCrop();
    canvas.width = cropper.bitmap.width;
    canvas.height = cropper.bitmap.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(cropper.bitmap, 0, 0);
    ctx.save();
    ctx.fillStyle = "rgba(7, 12, 30, 0.58)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      cropper.bitmap,
      crop.cropX,
      crop.cropY,
      crop.cropWidth,
      crop.cropHeight,
      crop.cropX,
      crop.cropY,
      crop.cropWidth,
      crop.cropHeight
    );
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(2, Math.round(canvas.width / 450));
    ctx.strokeRect(crop.cropX, crop.cropY, crop.cropWidth, crop.cropHeight);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.72)";
    ctx.lineWidth = Math.max(1, Math.round(canvas.width / 1200));
    for (let index = 1; index < 3; index += 1) {
      const gridX = crop.cropX + (crop.cropWidth / 3) * index;
      const gridY = crop.cropY + (crop.cropHeight / 3) * index;
      ctx.beginPath();
      ctx.moveTo(gridX, crop.cropY);
      ctx.lineTo(gridX, crop.cropY + crop.cropHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crop.cropX, gridY);
      ctx.lineTo(crop.cropX + crop.cropWidth, gridY);
      ctx.stroke();
    }
    const handle = Math.max(10, Math.round(canvas.width / 120));
    const points = [
      [crop.cropX, crop.cropY],
      [crop.cropX + crop.cropWidth, crop.cropY],
      [crop.cropX, crop.cropY + crop.cropHeight],
      [crop.cropX + crop.cropWidth, crop.cropY + crop.cropHeight]
    ];
    ctx.fillStyle = "#ffffff";
    points.forEach(([x, y]) => {
      ctx.fillRect(x - handle / 2, y - handle / 2, handle, handle);
    });
    ctx.restore();
    canvas.style.cursor = cropper.dragging ? "grabbing" : "grab";
  }

  async function handleImageCropperFile(file) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    if (!file) return;
    const fileType = getImageCropperFileType(file);
    if (!fileType) {
      state.imageCropper.error = "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.";
      render();
      return;
    }
    if (Number(file.size || 0) > imageCropperMaxFileSize) {
      state.imageCropper.error = "حجم الصورة كبير جدًا. الحد الأقصى 20MB.";
      render();
      return;
    }

    revokeImageEnhancerUrl(state.imageCropper.resultUrl);
    try {
      state.imageCropper.bitmap?.close?.();
    } catch (_) {
      // Ignore bitmap cleanup errors.
    }

    state.imageCropper = {
      ...state.imageCropper,
      fileName: file.name || "image",
      fileSize: file.size || 0,
      fileType,
      width: 0,
      height: 0,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: true,
      progress: 35,
      error: "",
      status: "جاري قراءة الصورة داخل المتصفح...",
      dragging: false,
      bitmap: null
    };
    render();

    try {
      const bitmap = await createImageBitmap(file);
      const crop = getInitialImageCropperCrop(bitmap.width, bitmap.height);
      state.imageCropper = {
        ...state.imageCropper,
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        ...crop,
        aspectRatio: "free",
        customWidth: String(crop.cropWidth),
        customHeight: String(crop.cropHeight),
        zoom: 1,
        loading: false,
        progress: 0,
        error: "",
        status: "تم تحميل الصورة. حرّك مربع القص أو اختر نسبة جاهزة."
      };
      render();
    } catch (_) {
      state.imageCropper = {
        ...state.imageCropper,
        bitmap: null,
        loading: false,
        progress: 0,
        error: "تعذر قراءة الصورة داخل المتصفح. جرّب صورة أخرى.",
        status: ""
      };
      render();
    }
  }

  function imageCropperCanvasToBlob(canvas, type) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), type || "image/png", 0.95);
    });
  }

  async function runImageCropperExport() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    const cropper = state.imageCropper;
    if (!cropper.bitmap) {
      state.imageCropper.error = "اختر صورة أولًا.";
      render();
      return;
    }
    const crop = normalizeImageCropperCrop();
    state.imageCropper = {
      ...state.imageCropper,
      loading: true,
      progress: 65,
      error: "",
      status: "جاري قص الصورة داخل المتصفح..."
    };
    render();
    try {
      const type = state.imageCropper.fileType || "image/png";
      const outputCanvas = document.createElement("canvas");
      const outputCtx = outputCanvas.getContext("2d", { willReadFrequently: Boolean(state.imageCropper.enhance) });
      outputCanvas.width = crop.cropWidth;
      outputCanvas.height = crop.cropHeight;
      if (type === "image/jpeg") {
        outputCtx.fillStyle = "#ffffff";
        outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
      }
      outputCtx.imageSmoothingEnabled = true;
      outputCtx.imageSmoothingQuality = "high";
      outputCtx.drawImage(
        state.imageCropper.bitmap,
        crop.cropX,
        crop.cropY,
        crop.cropWidth,
        crop.cropHeight,
        0,
        0,
        crop.cropWidth,
        crop.cropHeight
      );
      if (state.imageCropper.enhance) {
        applyBasicImageEnhancement(outputCtx, outputCanvas.width, outputCanvas.height, "light");
      }
      const blob = await imageCropperCanvasToBlob(outputCanvas, type);
      if (!blob) throw new Error("crop_export_failed");
      const resultUrl = URL.createObjectURL(blob);
      revokeImageEnhancerUrl(state.imageCropper.resultUrl);
      state.imageCropper = {
        ...state.imageCropper,
        resultUrl,
        resultFileName: buildImageCropperFileName(state.imageCropper.fileName, type),
        resultSize: blob.size,
        loading: false,
        progress: 100,
        error: "",
        status: "تم قص الصورة بنجاح. يمكنك تحميل النتيجة الآن."
      };
      render();
    } catch (_) {
      state.imageCropper = {
        ...state.imageCropper,
        loading: false,
        progress: 0,
        error: "تعذر قص الصورة. جرّب تحديد مساحة أصغر.",
        status: ""
      };
      render();
    }
  }

  async function rotateImageCropperSource(degrees) {
    if (!state.imageCropper.bitmap) {
      state.imageCropper.error = "اختر صورة أولًا.";
      render();
      return;
    }
    const angle = Number(degrees || 0);
    if (!angle) return;
    state.imageCropper = {
      ...state.imageCropper,
      loading: true,
      progress: 45,
      error: "",
      status: "جاري تدوير الصورة قبل القص..."
    };
    render();
    try {
      const type = state.imageCropper.fileType || "image/png";
      const canvas = createImageRotatorCanvas({
        bitmap: state.imageCropper.bitmap,
        angle,
        keepSize: false,
        enhance: false,
        type
      });
      const blob = await imageRotatorCanvasToBlob(canvas, type);
      if (!blob) throw new Error("cropper_rotate_failed");
      const bitmap = await createImageBitmap(blob);
      try {
        state.imageCropper.bitmap?.close?.();
      } catch (_) {
        // Ignore bitmap cleanup errors.
      }
      revokeImageEnhancerUrl(state.imageCropper.resultUrl);
      const crop = getInitialImageCropperCrop(bitmap.width, bitmap.height);
      state.imageCropper = {
        ...state.imageCropper,
        bitmap,
        width: bitmap.width,
        height: bitmap.height,
        ...crop,
        aspectRatio: "free",
        customWidth: String(crop.cropWidth),
        customHeight: String(crop.cropHeight),
        resultUrl: "",
        resultFileName: "",
        resultSize: 0,
        loading: false,
        progress: 0,
        error: "",
        status: "تم تدوير الصورة. حدّد منطقة القص من جديد."
      };
      render();
    } catch (_) {
      state.imageCropper = {
        ...state.imageCropper,
        loading: false,
        progress: 0,
        error: "تعذر تدوير الصورة قبل القص. جرّب صورة أخرى.",
        status: ""
      };
      render();
    }
  }

  function clearPdfToPngResult(status = "") {
    revokeImageEnhancerUrl(state.pdfToPng.resultUrl);
    state.pdfToPng = {
      ...state.pdfToPng,
      resultUrl: "",
      resultSize: 0,
      selectedPagesCount: 0,
      progress: 0,
      error: "",
      status
    };
  }

  function resetPdfToPngState() {
    (state.pdfToPng.previews || []).forEach((preview) => revokeImageEnhancerUrl(preview.url));
    revokeImageEnhancerUrl(state.pdfToPng.resultUrl);
    try {
      state.pdfToPng.pdf?.destroy?.();
    } catch (_) {
      // Ignore pdf.js cleanup errors.
    }
    state.pdfToPng = {
      fileName: "",
      fileSize: 0,
      pagesCount: 0,
      pdf: null,
      previews: [],
      quality: "1.5",
      pageMode: "all",
      customPages: "",
      resultUrl: "",
      resultSize: 0,
      selectedPagesCount: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    };
  }

  async function loadPdfJs() {
    if (window.pdfjsLib?.getDocument) {
      return window.pdfjsLib;
    }
    if (!window.__orlixorPdfJsPromise) {
      window.__orlixorPdfJsPromise = import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.mjs")
        .then((pdfjsLib) => {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/legacy/build/pdf.worker.mjs";
          window.pdfjsLib = pdfjsLib;
          return pdfjsLib;
        });
    }
    return window.__orlixorPdfJsPromise;
  }

  function loadJsZip() {
    if (window.JSZip) {
      return Promise.resolve(window.JSZip);
    }
    if (window.__orlixorJsZipPromise) {
      return window.__orlixorJsZipPromise;
    }
    window.__orlixorJsZipPromise = new Promise((resolve, reject) => {
      const existingScript = document.getElementById("jsZipScript");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.JSZip));
        existingScript.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.id = "jsZipScript";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.async = true;
      script.onload = () => {
        if (window.JSZip) {
          resolve(window.JSZip);
        } else {
          reject(new Error("JSZip unavailable"));
        }
      };
      script.onerror = () => reject(new Error("JSZip failed to load"));
      document.head.appendChild(script);
    });
    return window.__orlixorJsZipPromise;
  }

  function isPdfToPngPasswordError(error) {
    const text = `${error?.name || ""} ${error?.message || ""}`.toLowerCase();
    return text.includes("password") || text.includes("encrypted");
  }

  async function renderPdfPreviewImage(pdf, pageNumber) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 0.25 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise((resolve) => canvas.toBlob((item) => resolve(item), "image/png", 0.9));
    return blob ? URL.createObjectURL(blob) : "";
  }

  async function buildPdfToPngPreviews(pdf) {
    const previewCount = Math.min(pdf.numPages, 6);
    const previews = [];
    for (let pageNumber = 1; pageNumber <= previewCount; pageNumber += 1) {
      const url = await renderPdfPreviewImage(pdf, pageNumber);
      if (url) {
        previews.push({ pageNumber, url });
      }
    }
    return previews;
  }

  async function handlePdfToPngFile(file) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
    if (!isPdf) {
      state.pdfToPng.error = "الملف يجب أن يكون PDF.";
      render();
      return;
    }
    if (Number(file.size || 0) > pdfToPngMaxFileSize) {
      state.pdfToPng.error = "حجم ملف PDF كبير جدًا. الحد الأقصى 50MB.";
      render();
      return;
    }

    const previousPreviews = state.pdfToPng.previews || [];
    previousPreviews.forEach((preview) => revokeImageEnhancerUrl(preview.url));
    revokeImageEnhancerUrl(state.pdfToPng.resultUrl);
    try {
      state.pdfToPng.pdf?.destroy?.();
    } catch (_) {
      // Ignore cleanup errors.
    }

    state.pdfToPng = {
      ...state.pdfToPng,
      fileName: file.name || "document.pdf",
      fileSize: file.size || 0,
      pagesCount: 0,
      pdf: null,
      previews: [],
      resultUrl: "",
      resultSize: 0,
      selectedPagesCount: 0,
      loading: true,
      progress: 20,
      error: "",
      status: "جاري قراءة ملف PDF داخل المتصفح..."
    };
    render();

    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      state.pdfToPng = {
        ...state.pdfToPng,
        pdf,
        pagesCount: pdf.numPages,
        loading: true,
        progress: 55,
        status: "جاري إنشاء معاينة الصفحات..."
      };
      render();
      const previews = await buildPdfToPngPreviews(pdf);
      state.pdfToPng = {
        ...state.pdfToPng,
        previews,
        loading: false,
        progress: 0,
        error: "",
        status: pdf.numPages > 24
          ? "قد يستغرق التحويل وقتًا أطول حسب عدد الصفحات."
          : "تم تحميل ملف PDF. اختر الصفحات والجودة ثم ابدأ التحويل."
      };
      render();
    } catch (error) {
      state.pdfToPng = {
        ...state.pdfToPng,
        pdf: null,
        pagesCount: 0,
        previews: [],
        loading: false,
        progress: 0,
        error: isPdfToPngPasswordError(error)
          ? "هذا الملف محمي بكلمة مرور ولا يمكن تحويله."
          : "تعذر قراءة ملف PDF داخل المتصفح. جرّب ملفًا آخر.",
        status: ""
      };
      render();
    }
  }

  function parsePdfToPngPageRanges(input, totalPages) {
    const pages = new Set();
    String(input || "").split(",").forEach((rawPart) => {
      const part = rawPart.trim();
      if (!part) return;
      if (part.includes("-")) {
        const [startRaw, endRaw] = part.split("-");
        const start = Number(startRaw);
        const end = Number(endRaw);
        if (!Number.isFinite(start) || !Number.isFinite(end)) return;
        const low = Math.min(start, end);
        const high = Math.max(start, end);
        for (let page = low; page <= high; page += 1) {
          if (page >= 1 && page <= totalPages) pages.add(page);
        }
      } else {
        const page = Number(part);
        if (Number.isFinite(page) && page >= 1 && page <= totalPages) {
          pages.add(page);
        }
      }
    });
    return [...pages].sort((a, b) => a - b);
  }

  function getPdfToPngSelectedPages(totalPages) {
    if (state.pdfToPng.pageMode !== "custom") {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    return parsePdfToPngPageRanges(state.pdfToPng.customPages, totalPages);
  }

  async function renderPdfPageToPngBlob({ pdf, pageNumber, scale }) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    await page.render({ canvasContext: ctx, viewport }).promise;
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png", 1));
  }

  async function convertPdfToPngZip({ pdf, pages, qualityScale }) {
    const JSZip = await loadJsZip();
    const zip = new JSZip();
    for (let index = 0; index < pages.length; index += 1) {
      const pageNumber = pages[index];
      const percent = Math.max(8, Math.round(((index + 1) / pages.length) * 88));
      state.pdfToPng.progress = percent;
      state.pdfToPng.status = `جاري تحويل الصفحة ${index + 1} من ${pages.length}...`;
      render();
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      const blob = await renderPdfPageToPngBlob({ pdf, pageNumber, scale: qualityScale });
      if (!blob) throw new Error("png_render_failed");
      zip.file(`page-${String(pageNumber).padStart(3, "0")}.png`, blob);
    }
    state.pdfToPng.progress = 95;
    state.pdfToPng.status = "جاري ضغط الصور داخل ملف ZIP...";
    render();
    return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  }

  async function runPdfToPngConversion() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    const pdf = state.pdfToPng.pdf;
    if (!pdf) {
      state.pdfToPng.error = "اختر ملف PDF أولًا.";
      render();
      return;
    }
    const pages = getPdfToPngSelectedPages(pdf.numPages);
    if (!pages.length) {
      state.pdfToPng.error = "اختر صفحات صحيحة للتحويل.";
      render();
      return;
    }
    if (pages.length > 24) {
      state.pdfToPng.status = "قد يستغرق التحويل وقتًا أطول حسب عدد الصفحات.";
    }
    state.pdfToPng = {
      ...state.pdfToPng,
      loading: true,
      progress: 5,
      error: "",
      selectedPagesCount: pages.length,
      status: "جاري تجهيز التحويل..."
    };
    render();

    try {
      const zipBlob = await convertPdfToPngZip({
        pdf,
        pages,
        qualityScale: Number(state.pdfToPng.quality || 1.5)
      });
      const resultUrl = URL.createObjectURL(zipBlob);
      revokeImageEnhancerUrl(state.pdfToPng.resultUrl);
      state.pdfToPng = {
        ...state.pdfToPng,
        resultUrl,
        resultSize: zipBlob.size,
        loading: false,
        progress: 100,
        error: "",
        status: "تم تحويل الصفحات إلى PNG وتجهيز ملف ZIP."
      };
      render();
    } catch (error) {
      state.pdfToPng = {
        ...state.pdfToPng,
        loading: false,
        progress: 0,
        error: isPdfToPngPasswordError(error)
          ? "هذا الملف محمي بكلمة مرور ولا يمكن تحويله."
          : "تعذر تحويل PDF إلى PNG. تحقق من الاتصال لتحميل المكتبات ثم حاول مجددًا.",
        status: ""
      };
      render();
    }
  }

  function clearPdfUnlockResult(status = "") {
    revokeImageEnhancerUrl(state.pdfUnlock.resultUrl);
    state.pdfUnlock = {
      ...state.pdfUnlock,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      progress: 0,
      error: "",
      status
    };
  }

  function resetPdfUnlockState() {
    revokeImageEnhancerUrl(state.pdfUnlock.resultUrl);
    state.pdfUnlock = {
      file: null,
      fileName: "",
      fileSize: 0,
      mode: "remove",
      currentPassword: "",
      newPassword: "",
      ownership: "",
      reason: "",
      legalConfirm: false,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      loading: false,
      progress: 0,
      error: "",
      status: ""
    };
  }

  async function handlePdfUnlockFile(file) {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    if (!file) return;
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
    if (!isPdf) {
      state.pdfUnlock.error = "الملف يجب أن يكون PDF.";
      render();
      return;
    }
    if (Number(file.size || 0) > pdfUnlockMaxFileSize) {
      state.pdfUnlock.error = "حجم ملف PDF كبير جدًا. الحد الأقصى 100MB.";
      render();
      return;
    }
    revokeImageEnhancerUrl(state.pdfUnlock.resultUrl);
    state.pdfUnlock = {
      ...state.pdfUnlock,
      file,
      fileName: file.name || "protected.pdf",
      fileSize: file.size || 0,
      resultUrl: "",
      resultFileName: "",
      resultSize: 0,
      error: "",
      status: "تم اختيار الملف. أدخل البيانات المطلوبة ثم نفّذ العملية."
    };
    render();
  }

  function canRunPdfUnlock() {
    const pdfUnlock = state.pdfUnlock || {};
    if (!pdfUnlock.file || pdfUnlock.loading) return false;
    if (pdfUnlock.ownership !== "yes" || !pdfUnlock.legalConfirm || !pdfUnlock.reason) return false;
    if (pdfUnlock.mode === "reset") {
      return Boolean(pdfUnlock.currentPassword) && String(pdfUnlock.newPassword || "").length >= 6;
    }
    if (pdfUnlock.mode === "remove") {
      return Boolean(pdfUnlock.currentPassword);
    }
    if (pdfUnlock.mode === "forgot_password_remove") {
      return pdfUnlock.reason === "forgot_password";
    }
    return false;
  }

  function getPdfUnlockAuthToken() {
    try {
      const key = window.mullemApiClient?.storageKeys?.token || "mlm_api_token";
      const stored = localStorage.getItem(key);
      if (stored) return stored;
      const cookieMatch = String(document.cookie || "")
        .split("; ")
        .find((item) => item.startsWith("mlm_auth_token="));
      return cookieMatch ? decodeURIComponent(cookieMatch.slice("mlm_auth_token=".length)) : "";
    } catch (_) {
      return "";
    }
  }

  async function postPdfUnlockFormData(formData) {
    const candidates = typeof window.mullemApiClient?.buildApiCandidates === "function"
      ? window.mullemApiClient.buildApiCandidates("/tools/pdf/remove-protection")
      : ["/api/tools/pdf/remove-protection"];
    const token = getPdfUnlockAuthToken();
    let lastError = "تعذر معالجة الملف.";

    for (const url of candidates) {
      try {
        const response = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });
        if (response.ok) {
          return response.blob();
        }
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const payload = await response.json().catch(() => null);
          lastError = payload?.message || payload?.error || lastError;
        } else {
          lastError = await response.text().catch(() => lastError) || lastError;
        }
      } catch (error) {
        lastError = error?.message || lastError;
      }
    }

    throw new Error(lastError);
  }

  function buildPdfUnlockDownloadName(fileName, mode) {
    const base = String(fileName || "orlixor-document.pdf")
      .replace(/\.pdf$/i, "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .trim() || "orlixor-document";
    return mode === "reset" ? `${base}-protected.pdf` : `${base}-unlocked.pdf`;
  }

  async function runPdfUnlockProcessing() {
    if (!hasSubscriberToolsAccess()) {
      state.upgradeModalOpen = true;
      render();
      return;
    }
    const pdfUnlock = state.pdfUnlock || {};
    if (!pdfUnlock.file) {
      state.pdfUnlock.error = "اختر ملف PDF أولًا.";
      render();
      return;
    }
    if (pdfUnlock.ownership !== "yes") {
      state.pdfUnlock.error = "يجب تأكيد أنك المالك أو لديك تصريح قانوني.";
      render();
      return;
    }
    if (!pdfUnlock.reason) {
      state.pdfUnlock.error = "اختر سبب الاستخدام.";
      render();
      return;
    }
    if (!pdfUnlock.legalConfirm) {
      state.pdfUnlock.error = "يجب الموافقة على التعهد قبل التنفيذ.";
      render();
      return;
    }
    if ((pdfUnlock.mode === "remove" || pdfUnlock.mode === "reset") && !pdfUnlock.currentPassword) {
      state.pdfUnlock.error = "أدخل كلمة المرور الحالية للملف.";
      render();
      return;
    }
    if (pdfUnlock.mode === "reset" && String(pdfUnlock.newPassword || "").length < 6) {
      state.pdfUnlock.error = "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.";
      render();
      return;
    }
    if (pdfUnlock.mode === "forgot_password_remove" && pdfUnlock.reason !== "forgot_password") {
      state.pdfUnlock.error = "خيار نسيان كلمة المرور يتطلب اختيار سبب: نسيت كلمة المرور.";
      render();
      return;
    }

    state.pdfUnlock = {
      ...state.pdfUnlock,
      loading: true,
      progress: 18,
      error: "",
      status: "جاري إرسال الملف إلى السيرفر الآمن..."
    };
    render();

    try {
      const formData = new FormData();
      formData.append("file", pdfUnlock.file);
      formData.append("currentPassword", pdfUnlock.mode === "forgot_password_remove" ? "" : pdfUnlock.currentPassword);
      formData.append("mode", pdfUnlock.mode);
      formData.append("newPassword", pdfUnlock.mode === "reset" ? pdfUnlock.newPassword : "");
      formData.append("ownershipConfirmed", String(pdfUnlock.ownership === "yes"));
      formData.append("legalAgreement", String(Boolean(pdfUnlock.legalConfirm)));
      formData.append("reason", pdfUnlock.reason);

      state.pdfUnlock.progress = 62;
      state.pdfUnlock.status = "جاري معالجة الملف بدون حفظ كلمات المرور...";
      render();

      const blob = await postPdfUnlockFormData(formData);
      const resultUrl = URL.createObjectURL(blob);
      revokeImageEnhancerUrl(state.pdfUnlock.resultUrl);
      state.pdfUnlock = {
        ...state.pdfUnlock,
        resultUrl,
        resultFileName: buildPdfUnlockDownloadName(pdfUnlock.fileName, pdfUnlock.mode),
        resultSize: blob.size,
        loading: false,
        progress: 100,
        error: "",
        status: "تم تجهيز الملف. يمكنك تحميل النسخة الجديدة الآن."
      };
      render();
    } catch (error) {
      state.pdfUnlock = {
        ...state.pdfUnlock,
        loading: false,
        progress: 0,
        error: error?.message || "تعذر معالجة الملف. تأكد من كلمة المرور وصلاحية الملف.",
        status: ""
      };
      render();
    }
  }

  function showXpWarning({ tokens, xp, maxAllowed }) {
    const safeTokens = Math.max(0, Number(tokens) || 0);
    const safeXp = Math.max(1, Number(xp) || 1);
    const safeMax = Math.max(0, Number(maxAllowed) || 0);
    const message = [
      "⚠️ هذا الطلب كبير",
      "",
      `عدد التوكن المتوقع: ${safeTokens.toLocaleString("ar-SA")}`,
      safeMax ? `حد خطتك التقريبي: ${safeMax.toLocaleString("ar-SA")} توكن` : "",
      `التكلفة المتوقعة: ${safeXp} XP`,
      "",
      "قد يتم استهلاك رصيد أعلى من المعتاد.",
      "التكلفة تقديرية، والخصم الفعلي يتم بعد الرد.",
      "",
      "هل ترغب بالمتابعة؟"
    ].filter(Boolean).join("\n");

    return Promise.resolve(typeof window.confirm === "function" ? window.confirm(message) : true);
  }

  async function confirmLargeChatRequest(message) {
    const estimatedTokens = estimateTokens(message);
    const maxAllowed = getUserMaxInputTokens(state.currentUser);
    if (estimatedTokens <= maxAllowed) return true;

    return showXpWarning({
      tokens: estimatedTokens,
      xp: estimateXpCost(estimatedTokens),
      maxAllowed
    });
  }

  function getUserPackageLabel(user = state.currentUser) {
    if (!user) return "الباقة المجانية";
    const values = [
      user.plan,
      user.plan_key,
      user.planKey,
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

  function getUserPackageKey(user = state.currentUser) {
    const values = [
      user?.plan,
      user?.plan_key,
      user?.planKey,
      user?.packageKey,
      user?.package_key,
      user?.planType,
      user?.plan_type,
      user?.package,
      user?.package_name,
      user?.packageName
    ].map((value) => String(value || "").trim()).filter(Boolean);
    const normalized = values.join(" ").toLowerCase();
    const dailyXp = Number(user?.packageDailyXp || user?.package_daily_xp || 0);

    if (/business|enterprise|elite|ultra|pro[_\s-]?max|pioneer|الرائد|الأعمال/.test(normalized) || dailyXp >= 600) return "pro_max";
    if (/pro[_\s-]?plus|tuwaiq|tuwaiq_plus|plus|طويق|بلس/.test(normalized) || dailyXp >= 250) return "pro_plus";
    if (/(^|\s|_|-)(pro|spark|nano)(\s|_|-|$)|شرارة|نانو/.test(normalized) || dailyXp >= 80) return "pro";
    return "starter";
  }

  function getNextUpgradeTarget(user = state.currentUser) {
    const currentKey = getUserPackageKey(user);
    const targets = {
      starter: { key: "pro", name: "شرارة", title: "الترقية إلى شرارة", activeTitle: "باقة شرارة" },
      pro: { key: "pro_plus", name: "طويق", title: "الترقية إلى طويق", activeTitle: "باقة طويق" },
      pro_plus: { key: "pro_max", name: "الرائد", title: "الترقية إلى الرائد", activeTitle: "باقة الرائد" },
      pro_max: { key: "pro_max", name: "الرائد", title: "باقة الرائد مفعلة", activeTitle: "باقة الرائد" }
    };
    return targets[currentKey] || targets.starter;
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
      removeSavedConversationCacheItem(apiConversationId);
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

  function getMessageFeedbackKey(message, index = 0) {
    const activeThreadId = getActiveThread()?.id || state.section || "thread";
    return String(message?.id || message?.message_id || message?.feedbackId || `${activeThreadId}-assistant-${index}`);
  }

  function renderMessage(message, index = 0) {
    if (message.role === "assistant") {
      const feedbackKey = getMessageFeedbackKey(message, index);
      const isLiked = Boolean(state.likedReplies[feedbackKey]);
      const safeBody = message.body && Array.isArray(message.body.bullets)
        ? {
            heading: coerceDisplayText(message.body.heading),
            bullets: message.body.bullets.map((item) => coerceDisplayText(item)).filter(Boolean)
          }
        : assistantReply("رد محفوظ", splitReplyToBullets(message.body));
      if (!safeBody.heading && !safeBody.bullets.length) {
        safeBody.heading = "رد محفوظ";
        safeBody.bullets = ["لم يصلنا نص واضح من الخدمة."];
      }
      return `
        <article class="guest-message assistant">
          <div class="guest-message-mark">${icons.logo}</div>
          <div class="guest-message-body">
            ${safeBody.heading ? `<h3>${escapeHtml(safeBody.heading)}</h3>` : ""}
            ${safeBody.bullets.length ? `
              <ul>
                ${safeBody.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            ` : ""}
            <div class="guest-message-actions">
              <button class="ghost-action ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-copy-reply>${icons.copy}</button>
              <button class="ghost-action ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-refresh-reply>${icons.refresh}</button>
              <button class="ghost-action feedback-btn ${isLiked ? "liked" : ""} ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-like-reply="${escapeHtml(feedbackKey)}" aria-pressed="${isLiked ? "true" : "false"}">${icons.thumbsUp}</button>
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

  function formatAttachmentSize(file) {
    const bytes = Number(file?.size || 0);
    if (!bytes) return "0 KB";
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  function getAttachmentDisplayName(file) {
    const name = String(file?.name || "ملف مرفق").trim();
    return name || "ملف مرفق";
  }

  function getAttachmentPreviewUrl(file) {
    if (!file || !isVisionImageFile(file)) return "";
    const existing = attachmentPreviewUrls.get(file);
    if (existing) return existing;
    const previewUrl = URL.createObjectURL(file);
    attachmentPreviewUrls.set(file, previewUrl);
    return previewUrl;
  }

  function revokeAttachmentPreview(file) {
    const previewUrl = file ? attachmentPreviewUrls.get(file) : "";
    if (!previewUrl) return;
    URL.revokeObjectURL(previewUrl);
    attachmentPreviewUrls.delete(file);
  }

  function setSelectedFiles(files = []) {
    state.selectedFiles.forEach((file) => {
      if (!files.includes(file)) revokeAttachmentPreview(file);
    });
    state.selectedFiles = files;
  }

  function clearSelectedFiles() {
    setSelectedFiles([]);
  }

  function renderAttachmentPreview(file) {
    const previewUrl = getAttachmentPreviewUrl(file);
    if (!previewUrl) {
      return `<div class="guest-attachment-preview placeholder" aria-hidden="true">${icons.document}</div>`;
    }
    return `<img class="guest-attachment-preview" src="${escapeHtml(previewUrl)}" alt="${escapeHtml(getAttachmentDisplayName(file))}">`;
  }

  function renderAttachmentPills() {
    if (!state.selectedFiles.length) return "";
    return `
      <div class="guest-attachment-pills">
        ${state.selectedFiles.map((file, index) => `
          <article class="guest-attachment-pill ${isVisionImageFile(file) ? "has-preview" : ""}">
            <button class="guest-attachment-remove" type="button" data-remove-file="${index}" aria-label="إزالة ${escapeHtml(file.name)}">×</button>
            <div class="guest-attachment-info">
              <span class="guest-attachment-file-icon" aria-hidden="true">${icons.document}</span>
              <div>
                <strong>${escapeHtml(getAttachmentDisplayName(file))}</strong>
                <small>${escapeHtml(formatAttachmentSize(file))}</small>
                <em>تم رفع الملف بنجاح</em>
              </div>
            </div>
            ${renderAttachmentPreview(file)}
          </article>
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
          <button class="circle-control ${isAuthenticated() ? "" : "requires-auth"}" type="button" aria-label="الإشعارات" data-open-notifications>
            ${icons.bell}
            ${renderNotificationBellBadge()}
          </button>
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
        <button class="home-sidebar-toggle" type="button" data-toggle-sidebar aria-label="${state.mobileSidebarOpen ? "إغلاق الشريط الجانبي" : "فتح الشريط الجانبي"}" aria-expanded="${state.mobileSidebarOpen ? "true" : "false"}">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="balance-menu-wrap">
          <button class="ghost-balance ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-balance aria-expanded="${state.balancePanelOpen ? "true" : "false"}">
            <span class="balance-caret">⌄</span>
            <span>الرصيد: ${formatNumber(getPreviewBalance())} نقطة</span>
            ${icons.sparkle}
          </button>
          ${renderBalancePanel()}
        </div>
        <button class="circle-control ${isAuthenticated() ? "" : "requires-auth"}" type="button" aria-label="الإشعارات" data-open-notifications>
          ${icons.bell}
          ${renderNotificationBellBadge()}
        </button>
        <button class="circle-control" type="button" aria-label="تبديل الثيم" data-theme-toggle>${icons.moon}</button>
        ${accountButton}
      </div>
    `;
  }

  function renderMobileHeader() {
    const accountButton = `
      <button class="mobile-login-btn${isAuthenticated() ? " is-auth" : ""}" type="button" data-open-account aria-label="${isAuthenticated() ? "الحساب" : "تسجيل الدخول"}">
        <span aria-hidden="true">${icons.user}</span>
      </button>
    `;

    return `
      <div class="mobile-viewport-pill" aria-label="وضع الجوال">
        <span class="mobile-viewport-pill-text">جوال</span>
        <span class="mobile-viewport-pill-icon" aria-hidden="true">${icons.phone}</span>
      </div>
      <header class="mobile-header" aria-label="شريط الجوال">
        <button class="mobile-menu-btn" type="button" data-toggle-sidebar aria-label="${state.mobileSidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}" aria-expanded="${state.mobileSidebarOpen ? "true" : "false"}">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="mobile-brand" aria-label="Orlixor">
          <span class="mobile-brand-mark" aria-hidden="true">${icons.logo}</span>
        </div>
        <div class="mobile-header-actions">
          <button class="mobile-icon-btn" type="button" aria-label="الإشعارات" data-open-notifications>
            ${icons.bell}
            ${renderNotificationBellBadge()}
          </button>
          ${accountButton}
        </div>
      </header>
    `;
  }

  function renderMobileDrawer() {
    const drawerItems = [
      ["messages", "المحادثات", icons.chat],
      ["files", "الملفات", icons.projects],
      ["tools", "الأدوات", icons.ai],
      ["models", "النماذج", icons.library],
      ["settings", "الإعدادات", icons.settings],
      ["help", "المساعدة", icons.eye],
      ["logout", "تسجيل الخروج", icons.login]
    ];

    return `
      <aside class="mobile-menu-drawer" aria-hidden="${state.mobileSidebarOpen ? "false" : "true"}">
        <header class="mobile-menu-head">
          <button class="mobile-menu-btn mobile-menu-head-btn" type="button" data-toggle-sidebar aria-label="القائمة">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <span class="mobile-menu-brand" aria-hidden="true">${icons.logo}</span>
          <button class="mobile-drawer-close" type="button" data-toggle-sidebar aria-label="إغلاق القائمة">×</button>
        </header>
        <nav class="mobile-menu-list" aria-label="قائمة الجوال">
          ${drawerItems.map(([key, label, icon]) => `
            <button class="mobile-menu-item" type="button" data-mobile-nav="${escapeHtml(key)}">
              <span class="mobile-menu-item-icon" aria-hidden="true">${icon}</span>
              <span>${escapeHtml(label)}</span>
            </button>
          `).join("")}
        </nav>
      </aside>
    `;
  }

  function renderMobileV2(profile) {
    const cards = [
      ["كتابة المحتوى", "إنشاء محتوى احترافي", "sparkle"],
      ["أفكار وإبداع", "الحصول على أفكار جديدة", "star"],
      ["مساعدة برمجية", "حل المشكلات البرمجية", "code"],
      ["ترجمة", "ترجمة النصوص بدقة", "internet"]
    ];

    const accountButton = isAuthenticated()
      ? `<button class="omv2-icon-btn" type="button" data-open-account aria-label="الحساب">${icons.user}</button>`
      : `<button class="omv2-icon-btn" type="button" data-open-account aria-label="تسجيل الدخول">${icons.user}</button>`;

    return `
      <div class="omv2-shell ${state.mobileSidebarOpen ? "is-open" : ""}">
        <aside class="omv2-drawer" aria-hidden="${state.mobileSidebarOpen ? "false" : "true"}">
          <header class="omv2-drawer-head">
            <button class="omv2-menu omv2-menu-head" type="button" data-toggle-sidebar aria-label="القائمة">☰</button>
            <img src="${brandMarkUrl}" alt="Orlixor" class="omv2-drawer-logo">
            <button class="omv2-close" type="button" data-toggle-sidebar aria-label="إغلاق القائمة">×</button>
          </header>
          <nav class="omv2-drawer-list" aria-label="قائمة الجوال">
            <button type="button" class="omv2-drawer-item" data-mobile-nav="messages"><span>💬</span><b>المحادثات</b></button>
            <button type="button" class="omv2-drawer-item" data-mobile-nav="files"><span>📁</span><b>الملفات</b></button>
            <button type="button" class="omv2-drawer-item" data-mobile-nav="tools"><span>🔳</span><b>الأدوات</b></button>
            <button type="button" class="omv2-drawer-item" data-mobile-nav="models"><span>🔳</span><b>النماذج</b></button>
            <button type="button" class="omv2-drawer-item" data-mobile-nav="settings"><span>⚙</span><b>الإعدادات</b></button>
            <button type="button" class="omv2-drawer-item" data-mobile-nav="help"><span>?</span><b>المساعدة</b></button>
            <button type="button" class="omv2-drawer-item" data-mobile-nav="logout"><span>↩</span><b>تسجيل الخروج</b></button>
          </nav>
        </aside>
        <div class="omv2-backdrop" data-toggle-sidebar aria-hidden="${state.mobileSidebarOpen ? "false" : "true"}"></div>
        <header class="omv2-header">
          <button class="omv2-menu" type="button" data-toggle-sidebar aria-label="${state.mobileSidebarOpen ? "إغلاق القائمة" : "فتح القائمة"}">☰</button>
          <img src="${brandMarkUrl}" alt="Orlixor" class="omv2-logo">
          <div class="omv2-icons">
            <button class="omv2-icon-btn" type="button" data-open-notifications aria-label="الإشعارات">${icons.bell}${renderNotificationBellBadge()}</button>
            ${accountButton}
          </div>
        </header>
        <main class="omv2-main">
          <div class="omv2-badge"><span aria-hidden="true">${icons.phone}</span><span>جوال</span></div>
          <section class="omv2-hero">
            <h1>👋 مرحباً بك</h1>
            <p>كيف يمكنني مساعدتك اليوم؟</p>
          </section>
          <section class="omv2-cards" aria-label="اختصارات Orlixor">
            ${cards.map(([title, desc, icon]) => `
              <button class="omv2-card ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-card="${escapeHtml(title)}">
                <span class="omv2-card-icon" aria-hidden="true">${icons[icon]}</span>
                <span class="omv2-card-copy">
                  <b>${escapeHtml(title)}</b>
                  <small>${escapeHtml(desc)}</small>
                </span>
              </button>
            `).join("")}
          </section>
        ${renderConversation(profile)}
        ${renderAttachmentPills()}
        </main>
        <form class="omv2-composer guest-compose home-compose" data-compose-form>
          <input class="compose-input omv2-input" type="text" data-compose-input value="${escapeHtml(getComposerValue())}" placeholder="اكتب رسالتك هنا..." ${state.sending ? "disabled" : ""}>
          ${renderComposeStatus()}
          <div class="omv2-actions">
            <button class="omv2-send" type="submit" aria-label="إرسال">${icons.send}</button>
            <button class="omv2-tool" type="button" data-open-tools>أدوات</button>
            <button class="omv2-tool ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-pick-file>إرفاق ملف</button>
          </div>
        </form>
        ${renderAuthModal()}
        ${renderUpgradeModal()}
        ${renderSettingsModal()}
        ${renderNotificationsModal()}
        <input type="file" id="guestFilePicker" hidden multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md,.ppt,.pptx">
        <div class="guest-toast-stack" aria-live="polite"></div>
      </div>
    `;
  }

  function getNotificationsPayload() {
    const payload = state.notificationsData && typeof state.notificationsData === "object"
      ? state.notificationsData
      : {};
    const sections = payload.sections && typeof payload.sections === "object" ? payload.sections : {};
    return {
      unreadCount: Number(payload.unreadCount ?? state.notificationsUnreadCount ?? 0) || 0,
      sections: {
        xpDiscounts: Array.isArray(sections.xpDiscounts) ? sections.xpDiscounts : [],
        officialUpdates: Array.isArray(sections.officialUpdates) ? sections.officialUpdates : [],
        featureUpdates: Array.isArray(sections.featureUpdates) ? sections.featureUpdates : [],
        account: Array.isArray(sections.account) ? sections.account : []
      }
    };
  }

  function flattenNotifications(payload = getNotificationsPayload()) {
    return [
      ...payload.sections.xpDiscounts,
      ...payload.sections.officialUpdates,
      ...payload.sections.featureUpdates,
      ...payload.sections.account
    ];
  }

  function buildFallbackNotifications() {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString();
    const createdAt = now.toISOString();
    const items = [
      {
        id: "fallback-xp-tuwaiq",
        title: "خصم على باقة طويق",
        body: "احصل على 30% XP إضافية عند شراء باقة طويق",
        type: "xp_discount",
        badge: "خصم 30%",
        icon: "gift",
        expires_at: expiresAt,
        created_at: createdAt,
        isRead: false
      },
      {
        id: "fallback-xp-system",
        title: "تحديث نظام نقاط XP",
        body: "تم تحسين أداء النظام وإضافة خيارات جديدة لإدارة النقاط",
        type: "official_update",
        badge: "تحديث",
        icon: "sparkle",
        created_at: createdAt,
        isRead: false
      },
      {
        id: "fallback-maintenance",
        title: "صيانة مجدولة",
        body: "ستتم صيانة الخوادم يوم الأحد من 2 ص إلى 4 ص",
        type: "official_update",
        badge: "إعلان",
        icon: "megaphone",
        created_at: createdAt,
        isRead: false
      },
      {
        id: "fallback-summary-tool",
        title: "أداة تلخيص المحتوى",
        body: "أداة جديدة تساعدك على تلخيص أي نص بسرعة وذكاء",
        type: "feature_update",
        badge: "إضافة جديدة",
        icon: "document",
        created_at: createdAt,
        isRead: false
      },
      {
        id: "fallback-ui",
        title: "تحسين واجهة المستخدم",
        body: "تم تحسين سرعة الموقع وتجربة المستخدم بشكل عام",
        type: "feature_update",
        badge: "تحسين",
        icon: "image",
        created_at: createdAt,
        isRead: false
      }
    ];
    return {
      unreadCount: items.filter((item) => !item.isRead).length,
      sections: {
        xpDiscounts: items.filter((item) => item.type === "xp_discount"),
        officialUpdates: items.filter((item) => item.type === "official_update"),
        featureUpdates: items.filter((item) => item.type === "feature_update"),
        account: items.filter((item) => item.type === "account")
      },
      items,
      fallback: true
    };
  }

  function renderNotificationBellBadge() {
    const count = Number(state.notificationsUnreadCount || getNotificationsPayload().unreadCount || 0);
    if (!isAuthenticated() || count <= 0) return "";
    return `<span class="notification-count-badge">${count > 9 ? "9+" : escapeHtml(count)}</span>`;
  }

  function getNotificationIcon(iconKey, type) {
    const key = String(iconKey || "").trim();
    if (key === "gift" || type === "xp_discount") return icons.gift;
    if (key === "megaphone") {
      return '<svg viewBox="0 0 24 24"><path d="M4 13h4l9 5V6L8 11H4v2Z"/><path d="M8 13v5a2 2 0 0 0 2 2h1"/><path d="M19 9a4 4 0 0 1 0 6"/></svg>';
    }
    if (key === "image") {
      return '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="m7 16 4-4 3 3 2-2 3 3"/><circle cx="9" cy="9" r="1.5"/></svg>';
    }
    if (key === "bell" || type === "account") return icons.bell;
    if (key === "document") return icons.document;
    return icons.sparkle;
  }

  function formatNotificationTime(item) {
    if (item?.type === "xp_discount" && item.expires_at) {
      const expiresAt = new Date(item.expires_at);
      const diff = expiresAt.getTime() - Date.now();
      if (Number.isFinite(diff) && diff > 0) {
        const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
        return days <= 1 ? "ينتهي خلال يوم" : `ينتهي خلال ${days} يوم`;
      }
    }

    const sourceDate = item?.created_at || item?.starts_at;
    if (!sourceDate) return "";
    const date = new Date(sourceDate);
    if (!Number.isFinite(date.getTime())) return "";
    return date.toLocaleDateString("ar-SA", { month: "long", day: "numeric" });
  }

  function getNotificationSectionItems(items) {
    if (state.notificationsTab !== "unread") return items;
    return items.filter((item) => !item.isRead);
  }

  function renderNotificationCard(item, variant = "compact") {
    const unreadClass = item.isRead ? "" : "unread";
    const timeLabel = formatNotificationTime(item);
    const badge = item.badge || (item.type === "xp_discount" ? "خصم" : "تحديث");
    const isHero = variant === "hero";
    const isDropdown = variant === "dropdown";

    if (isDropdown) {
      return `
        <article class="notification-card is-dropdown ${unreadClass}" data-notification-id="${escapeHtml(item.id)}">
          <span class="notification-unread-dot" aria-hidden="true"></span>
          <span class="notification-icon" aria-hidden="true">${getNotificationIcon(item.icon, item.type)}</span>
          <div class="notification-card-body">
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.body)}</p>
            ${timeLabel ? `<small>${escapeHtml(timeLabel)}</small>` : ""}
          </div>
        </article>
      `;
    }

    return `
      <article class="notification-card ${unreadClass} ${isHero ? "is-hero" : ""}" data-notification-id="${escapeHtml(item.id)}">
        <span class="notification-icon" aria-hidden="true">${getNotificationIcon(item.icon, item.type)}</span>
        <div class="notification-card-body">
          <span class="notification-badge-label">${escapeHtml(badge)}</span>
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.body)}</p>
          ${timeLabel ? `<small>${escapeHtml(timeLabel)}</small>` : ""}
        </div>
      </article>
    `;
  }

  function renderNotificationSection({ title, icon, items, type, hero = false }) {
    const visibleItems = getNotificationSectionItems(items).slice(0, 2);
    if (!visibleItems.length) return "";

    return `
      <section class="notification-section">
        <header class="notification-section-title">
          <div>
            <span>${icon}</span>
            <strong>${escapeHtml(title)}</strong>
          </div>
          <button type="button" data-notifications-view-all="${escapeHtml(type)}">عرض الكل ←</button>
        </header>
        <div class="notification-section-list">
          ${visibleItems.map((item) => renderNotificationCard(item, hero ? "hero" : "compact")).join("")}
        </div>
      </section>
    `;
  }

  function renderNotificationsModal() {
    if (!state.notificationsOpen) return "";
    const payload = getNotificationsPayload();
    const dropdownItems = getNotificationSectionItems(flattenNotifications(payload)).slice(0, 5);
    const hasVisibleNotifications = dropdownItems.length > 0;

    return `
      <div class="notifications-gate is-open is-compact">
        <button class="notifications-backdrop" type="button" data-close-notifications aria-label="إغلاق التنبيهات"></button>
        <section class="notifications-panel is-compact" role="dialog" aria-modal="true" aria-label="التنبيهات">
          <header class="notification-mini-header">
            <button class="notification-mini-link" type="button" data-notifications-view-all="all">عرض الكل</button>
            <strong>التنبيهات</strong>
            <button class="notification-mini-settings" type="button" data-open-notification-settings aria-label="إعدادات التنبيهات">${icons.settings}</button>
          </header>

          ${state.notificationsLoading ? `
            <div class="notifications-loading">
              <span>${icons.sparkle}</span>
              <strong>جاري تحميل التنبيهات...</strong>
            </div>
          ` : ""}

          ${state.notificationsError ? `
            <div class="notifications-empty is-error">
              <span>${icons.bell}</span>
              <strong>${escapeHtml(state.notificationsError)}</strong>
            </div>
          ` : ""}

          ${!state.notificationsLoading && !state.notificationsError && hasVisibleNotifications ? `
            <div class="notification-mini-list">
              ${dropdownItems.map((item) => renderNotificationCard(item, "dropdown")).join("")}
            </div>
          ` : ""}

          ${!state.notificationsLoading && !state.notificationsError && !hasVisibleNotifications ? `
            <div class="notifications-empty">
              <span>${icons.sparkle}</span>
              <strong>${state.notificationsTab === "unread" ? "لا توجد تنبيهات غير مقروءة" : "لا توجد تنبيهات حاليًا"}</strong>
              <p>عند توفر خصومات أو تحديثات جديدة ستظهر هنا مباشرة.</p>
            </div>
          ` : ""}

          <footer class="notifications-footer">
            <button type="button" data-open-notification-settings>${icons.bell}<span>إعدادات التنبيهات</span></button>
          </footer>
        </section>
      </div>
    `;
  }

  async function loadNotifications(options = {}) {
    if (!isAuthenticated()) return;
    const apiClient = getApiClient();
    if (!apiClient?.getNotifications) return;
    if (state.notificationsLoading && !options.force) return;

    state.notificationsLoading = !options.silent;
    state.notificationsError = "";
    if (!options.silent) render();

    try {
      const result = await apiClient.getNotifications({
        limit: 20,
        tab: state.notificationsTab === "unread" ? "unread" : ""
      });
      if (!result.ok) {
        throw new Error(result.message || "تعذر تحميل الإشعارات الآن");
      }
      state.notificationsData = result.data || null;
      state.notificationsUnreadCount = Number(result.data?.unreadCount || 0);
      state.notificationsLoaded = true;
      if (result.data?.user) {
        const token = apiClient.getToken?.();
        if (token) apiClient.setSession?.({ token, user: result.data.user });
        state.currentUser = normalizeUser(result.data.user);
      }
    } catch (error) {
      if (!state.notificationsData) {
        state.notificationsData = null;
        state.notificationsUnreadCount = 0;
        state.notificationsLoaded = false;
      }
      state.notificationsError = options.silent ? "" : (error?.message || "تعذر تحميل الإشعارات من لوحة الإدارة الآن.");
    } finally {
      state.notificationsLoading = false;
      render();
    }
  }

  function openNotificationsPanel() {
    if (!isAuthenticated()) {
      openAuthModal("سجّل دخولك لعرض الإشعارات الخاصة بحسابك.");
      return;
    }
    state.notificationsOpen = true;
    state.notificationsTab = state.notificationsTab || "all";
    state.balancePanelOpen = false;
    state.notificationsError = "";
    render();
    loadNotifications({ force: true });
  }

  async function markNotificationRead(notificationId) {
    const id = String(notificationId || "").trim();
    if (!id) return;
    const payload = getNotificationsPayload();
    const allItems = flattenNotifications(payload);
    const target = allItems.find((item) => String(item.id) === id);
    if (target?.isRead) return;
    if (target) {
      target.isRead = true;
      state.notificationsUnreadCount = Math.max(0, Number(state.notificationsUnreadCount || payload.unreadCount || 0) - 1);
      render();
    }

    const apiClient = getApiClient();
    if (!apiClient?.markNotificationRead) return;
    try {
      const result = await apiClient.markNotificationRead(id);
      if (result.ok && result.data) {
        state.notificationsData = result.data;
        state.notificationsUnreadCount = Number(result.data.unreadCount || 0);
        render();
      }
    } catch (_) {
      // Keep the optimistic UI state; the next load will reconcile it.
    }
  }

  async function markAllNotificationsRead() {
    const payload = getNotificationsPayload();
    const allItems = flattenNotifications(payload);
    for (const item of allItems) item.isRead = true;
    state.notificationsUnreadCount = 0;
    render();

    const apiClient = getApiClient();
    if (!apiClient?.markAllNotificationsRead) return;
    try {
      const result = await apiClient.markAllNotificationsRead();
      if (result.ok && result.data) {
        state.notificationsData = result.data;
        state.notificationsUnreadCount = Number(result.data.unreadCount || 0);
        render();
      }
    } catch (_) {
      showToast("تم تحديث الواجهة، وسنزامن حالة القراءة عند إعادة التحميل.");
    }
  }

  function renderModelSwitcher() {
    const activeProfile = getSelectedModelProfile();
    return `
      <div class="model-switcher-wrap">
        <button class="ai-switcher" type="button" data-model-menu aria-expanded="${state.modelMenuOpen ? "true" : "false"}">
          <span class="ai-switcher-mark">${icons.logo}</span>
          <span class="ai-switcher-divider" aria-hidden="true"></span>
          <span class="ai-switcher-name">${escapeHtml(activeProfile.name)}</span>
          <i class="ai-switcher-caret" aria-hidden="true">⌄</i>
          <span class="ai-switcher-dots" aria-hidden="true"></span>
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
    const preferences = {
      ...defaultAppPreferences,
      ...(state.appPreferences || {})
    };
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
            <button class="settings-inline-action ${preferences.notifications ? "success" : ""}" type="button" data-preference-toggle="notifications">${getPreferenceLabel("notifications")}</button>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.chat}</span>
            <div class="settings-option-copy">
              <strong>تنبيهات المحادثات</strong>
              <small>إظهار تنبيه عند حفظ أو تحديث محادثة.</small>
            </div>
            <button class="settings-inline-action ${preferences.chatAlerts ? "success" : ""}" type="button" data-preference-toggle="chatAlerts">${getPreferenceLabel("chatAlerts")}</button>
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
            <button class="settings-inline-action ${preferences.files ? "success" : ""}" type="button" data-preference-toggle="files">${preferences.files ? "متاح" : "متوقف"}</button>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.internet}</span>
            <div class="settings-option-copy">
              <strong>البحث في الإنترنت</strong>
              <small>استخدمه عند الحاجة لمعلومة حديثة.</small>
            </div>
            <button class="settings-inline-action ${settings.webEnabled ? "success" : ""}" type="button" data-toggle-web>${settings.webEnabled ? "مفعّل" : "متوقف"}</button>
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
            <button class="settings-inline-action ${preferences.saveChats ? "success" : ""}" type="button" data-preference-toggle="saveChats">${getPreferenceLabel("saveChats")}</button>
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
            <button class="settings-inline-action" type="button" data-refresh-session>تحديث</button>
          </article>
          <article class="settings-option-row">
            <span class="settings-option-icon">${icons.login}</span>
            <div class="settings-option-copy">
              <strong>إنهاء جلسة هذا الجهاز</strong>
              <small>يسجل خروجك من هذا المتصفح فقط.</small>
            </div>
            <button class="settings-inline-action danger" type="button" data-logout>خروج</button>
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
              <small>عرض ملخصات الاستخدام والتقدم داخل الحساب.</small>
            </div>
            <button class="settings-inline-action ${preferences.parentMonitoring ? "success" : ""}" type="button" data-preference-toggle="parentMonitoring">${getPreferenceLabel("parentMonitoring")}</button>
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
            <button type="button" data-modal-theme="system" class="${state.theme === "system" ? "active" : ""}">تلقائي</button>
          </div>
        </article>

        <article class="settings-option-row">
          <span class="settings-option-icon">A</span>
          <div class="settings-option-copy">
            <strong>اللغة</strong>
            <small>تغيير لغة واجهة المنصة</small>
          </div>
          <select data-preference-select="language">
            ${["العربية", "English"].map((item) => `
              <option value="${escapeHtml(item)}" ${preferences.language === item ? "selected" : ""}>${escapeHtml(item)}</option>
            `).join("")}
          </select>
        </article>

        <article class="settings-option-row">
          <span class="settings-option-icon">${icons.moon}</span>
          <div class="settings-option-copy">
            <strong>المنطقة الزمنية</strong>
            <small>تحديد المنطقة الزمنية الخاصة بك</small>
          </div>
          <select data-preference-select="timezone">
            <option value="Asia/Riyadh" ${preferences.timezone === "Asia/Riyadh" ? "selected" : ""}>الرياض (GMT+3)</option>
            <option value="Asia/Dubai" ${preferences.timezone === "Asia/Dubai" ? "selected" : ""}>دبي (GMT+4)</option>
            <option value="UTC" ${preferences.timezone === "UTC" ? "selected" : ""}>UTC</option>
          </select>
        </article>

        <article class="settings-option-row">
          <span class="settings-option-icon">${icons.document}</span>
          <div class="settings-option-copy">
            <strong>تنسيق التاريخ</strong>
            <small>اختر تنسيق عرض التاريخ</small>
          </div>
          <select data-preference-select="dateFormat">
            <option value="YYYY-MM-DD" ${preferences.dateFormat === "YYYY-MM-DD" ? "selected" : ""}>YYYY-MM-DD</option>
            <option value="DD/MM/YYYY" ${preferences.dateFormat === "DD/MM/YYYY" ? "selected" : ""}>DD/MM/YYYY</option>
            <option value="D MMM YYYY" ${preferences.dateFormat === "D MMM YYYY" ? "selected" : ""}>D MMM YYYY</option>
          </select>
        </article>

        <article class="settings-option-row">
          <span class="settings-option-icon">${icons.sparkle}</span>
          <div class="settings-option-copy">
            <strong>بداية الأسبوع من</strong>
            <small>اختر اليوم الذي يبدأ منه الأسبوع</small>
          </div>
          <div class="settings-segmented">
            <button type="button" data-preference-choice="weekStart" data-preference-value="sunday" class="${preferences.weekStart === "sunday" ? "active" : ""}">الأحد</button>
            <button type="button" data-preference-choice="weekStart" data-preference-value="saturday" class="${preferences.weekStart === "saturday" ? "active" : ""}">السبت</button>
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

  function renderToolsTopControls() {
    return `
      <div class="tools-page-actions">
        <button class="tools-unified-return" type="button" data-return-chat>
          <span aria-hidden="true">←</span>
          <b>العودة إلى الشات</b>
        </button>
        <button class="tools-xp-badge ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-balance>
          <span aria-hidden="true">${icons.bolt}</span>
          <b>${escapeHtml(formatNumber(getPreviewBalance()))} XP</b>
          <small>المتاح</small>
        </button>
      </div>
    `;
  }

  function renderToolsSuggestion() {
    return `
      <p class="tools-suggest">
        هل لديك اقتراح لأداة جديدة؟
        <button type="button" data-open-tool-suggestion>أخبرنا عن رأيك</button>
      </p>
    `;
  }

  function hasToolPage(tool) {
    return Boolean(tool?.key);
  }

  function renderToolAvailabilityBadge(tool, subscriberOnly = false) {
    if (!hasToolPage(tool)) {
      return '<span class="tool-availability-badge is-development">قيد التطوير</span>';
    }
    const available = subscriberOnly ? hasSubscriberToolsAccess() : isAuthenticated();
    const label = available ? "متاحة في باقتك" : (subscriberOnly ? "غير متاحة في باقتك" : "سجّل الدخول");
    return `<span class="tool-availability-badge ${available ? "is-available" : "is-unavailable"}">${escapeHtml(label)}</span>`;
  }

  function renderToolAction(tool, className) {
    const ready = hasToolPage(tool);
    return `
      <span class="${className} ${ready ? "" : "is-development"}">
        <span>${ready ? "استخدم الأداة" : "قيد التطوير"}</span>
        ${ready ? '<b aria-hidden="true">←</b>' : ""}
      </span>
    `;
  }

  function getToolCardAttrs(tool, subscriberOnly = false) {
    if (!hasToolPage(tool)) {
      return `data-dev-tool data-card="${escapeHtml(tool.title)}" aria-disabled="true"`;
    }
    if (subscriberOnly && !hasSubscriberToolsAccess()) {
      return `data-open-upgrade data-card="${escapeHtml(tool.title)}"`;
    }
    return `data-tool-key="${escapeHtml(tool.key)}" data-card="${escapeHtml(tool.title)}"`;
  }

  function renderWritingEditingToolsMain() {
    const categories = [
      { title: "الأكثر استخدامًا" },
      { title: "كتابة وتحرير", writingTools: true },
      { title: "تلخيص وتنظيم", summaryTools: true },
      { title: "تحليل وبيانات", dataTools: true },
      { title: "إنتاجية", productivityTools: true },
      { title: "تعليم وتعلم", educationTools: true },
      { title: "أدوات مجانية", freeTools: true }
    ];
    const writingToolIcons = {
      calendar: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16M8 14h2M12 14h2M16 14h1"/></svg>',
      targetUser: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/><path d="M19 5.5h2M20 4.5v2"/></svg>',
      tag: '<svg viewBox="0 0 24 24"><path d="M4 12V5h7l9 9-7 7Z"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>',
      list: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h1M4 12h1M4 18h1"/></svg>',
      folder: '<svg viewBox="0 0 24 24"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/></svg>'
    };
    const tools = [
      {
        title: "تحويل اللغة",
        description: "ترجمة المحتوى مع الحفاظ على المعنى والسياق",
        icon: icons.internet
      },
      {
        title: "تحسين الجمهور",
        description: "تكييف الأسلوب واللغة بما يناسب الجمهور المستهدف",
        icon: writingToolIcons.targetUser
      },
      {
        title: "جدولة النشر",
        description: "تخطيط وتنظيم مواعيد نشر المحتوى على المنصات المختلفة",
        icon: writingToolIcons.calendar
      },
      {
        title: "مراجع وتوثيق",
        description: "إنشاء مراجع وتنسيق الاقتباسات بأنماط مختلفة بسهولة",
        icon: icons.settings
      },
      {
        title: "قوالب جاهزة",
        description: "استخدام قوالب احترافية لمختلف أنواع المحتوى",
        icon: writingToolIcons.folder
      },
      {
        title: "تحليل قابلية القراءة",
        description: "قياس مستوى صعوبة القراءة وتحسين أسلوب النص",
        icon: icons.bolt
      },
      {
        title: "اقتراح عناوين جذابة",
        description: "الحصول على أفكار عناوين ملفتة تزيد من التفاعل",
        icon: writingToolIcons.tag
      },
      {
        title: "قوائم المهام تحريرية",
        description: "إنشاء قوائم مهام للمشاريع الكتابية ومتابعة التقدم",
        icon: writingToolIcons.list
      }
    ];

    return `
      <section class="guest-main tools-main tools-writing-main" aria-label="كتابة وتحرير">
        <div class="tools-page writing-tools-page">
          ${renderToolsTopControls()}
          <header class="tools-hero writing-tools-hero">
            <div class="tools-title-row">
              <span class="tools-title-icon" aria-hidden="true">${icons.edit}</span>
              <h1>كتابة وتحرير</h1>
            </div>
            <p>أدوات متقدمة تساعدك على كتابة وتحرير محتوى احترافي بجودة عالية</p>
          </header>

          <nav class="tools-unified-bar" aria-label="تصنيفات الأدوات">
            ${categories.map((category, index) => `
              <button class="tools-unified-filter ${category.writingTools ? "is-active" : ""}" type="button" ${category.freeTools ? "data-open-free-tools" : category.writingTools ? "data-open-writing-tools" : category.summaryTools ? "data-open-summary-tools" : category.dataTools ? "data-open-data-tools" : category.productivityTools ? "data-open-productivity-tools" : category.educationTools ? "data-open-education-tools" : "data-open-tools"}>
                ${escapeHtml(category.title)}
              </button>
            `).join("")}
          </nav>

          <section class="tools-grid writing-tools-grid" aria-label="أدوات الكتابة والتحرير">
            ${tools.map((tool) => `
              <button class="tool-card writing-tool-card" type="button" ${getToolCardAttrs(tool)}>
                <span class="tool-card-star" aria-hidden="true">${icons.star}</span>
                ${renderToolAvailabilityBadge(tool)}
                <span class="tool-card-icon" aria-hidden="true">${tool.icon}</span>
                <strong>${escapeHtml(tool.title)}</strong>
                <span class="tool-card-copy">${escapeHtml(tool.description)}</span>
                ${renderToolAction(tool, "writing-tool-action")}
              </button>
            `).join("")}
          </section>
          ${renderToolsSuggestion()}
        </div>
      </section>
    `;
  }

  function renderSummaryOrganizationToolsMain() {
    const categories = [
      { title: "الأكثر استخدامًا" },
      { title: "كتابة وتحرير", writingTools: true },
      { title: "تلخيص وتنظيم", summaryTools: true },
      { title: "تحليل وبيانات", dataTools: true },
      { title: "إنتاجية", productivityTools: true },
      { title: "تعليم وتعلم", educationTools: true },
      { title: "أدوات مجانية", freeTools: true }
    ];
    const summaryToolIcons = {
      stack: '<svg viewBox="0 0 24 24"><path d="M7 6h11a2 2 0 0 1 2 2v10"/><rect x="4" y="4" width="13" height="13" rx="2"/><path d="M8 8h5M8 11h5M8 14h3"/></svg>',
      executive: '<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M8 12h8M8 16h6"/></svg>',
      bullets: '<svg viewBox="0 0 24 24"><path d="M9 6h10M9 12h10M9 18h10"/><circle cx="5" cy="6" r="1.2"/><circle cx="5" cy="12" r="1.2"/><circle cx="5" cy="18" r="1.2"/></svg>',
      document: '<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M8 11h8M8 15h8M8 18h5"/></svg>',
      extract: '<svg viewBox="0 0 24 24"><path d="M5 5h14M5 19h14M7 8h10v8H7z"/><path d="M10 11h4M10 14h4"/></svg>',
      tasks: '<svg viewBox="0 0 24 24"><path d="m5 7 1.5 1.5L10 5M12 7h7M5 13l1.5 1.5L10 11M12 13h7M5 19l1.5 1.5L10 17M12 19h7"/></svg>',
      table: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M4 15h16M10 5v14M16 5v14"/></svg>',
      folder: '<svg viewBox="0 0 24 24"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/></svg>'
    };
    const groups = [
      {
        title: "ملخص سريع",
        icon: icons.sparkle,
        tools: [
          {
            title: "تجميع المعلومات",
            description: "دمج عدة نصوص في ملخص موحد ومنظم",
            icon: summaryToolIcons.stack
          },
          {
            title: "خلاصة تنفيذية",
            description: "إنشاء ملخص تنفيذي جاهز للعروض والاجتماعات",
            icon: summaryToolIcons.executive
          },
          {
            title: "تلخيص إلى نقاط",
            description: "تحويل النص إلى نقاط رئيسية مرتبة وواضحة",
            icon: summaryToolIcons.bullets
          },
          {
            title: "تلخيص نص طويل",
            description: "تلخيص المقالات والتقارير الطويلة في نقاط مختصرة",
            icon: summaryToolIcons.document
          }
        ]
      },
      {
        title: "تنظيم المحتوى",
        icon: summaryToolIcons.table,
        tools: [
          {
            title: "استخراج عناصر أساسية",
            description: "استخراج الأسماء، التواريخ، الأرقام والحقائق المهمة",
            icon: summaryToolIcons.extract
          },
          {
            title: "قوائم مهام",
            description: "تحويل النص إلى قائمة مهام مرتبة حسب الأولوية",
            icon: summaryToolIcons.tasks
          },
          {
            title: "إنشاء جداول منظمة",
            description: "تحويل المعلومات إلى جداول مرتبة وسهلة",
            icon: summaryToolIcons.table
          },
          {
            title: "تنظيم وتقسيم المحتوى",
            description: "تقسيم المحتوى إلى أقسام وعناوين فرعية",
            icon: summaryToolIcons.folder
          }
        ]
      }
    ];

    return `
      <section class="guest-main tools-main tools-summary-main" aria-label="تلخيص وتنظيم">
        <div class="tools-page summary-tools-page">
          ${renderToolsTopControls()}
          <header class="tools-hero summary-tools-hero">
            <div class="tools-title-row">
              <span class="tools-title-icon" aria-hidden="true">${icons.document}</span>
              <h1>تلخيص وتنظيم</h1>
            </div>
            <p>أدوات ذكية تساعدك على تلخيص المعلومات وتنظيمها بذكاء</p>
          </header>

          <nav class="tools-unified-bar" aria-label="تصنيفات الأدوات">
            ${categories.map((category) => `
              <button class="tools-unified-filter ${category.summaryTools ? "is-active" : ""}" type="button" ${category.freeTools ? "data-open-free-tools" : category.writingTools ? "data-open-writing-tools" : category.summaryTools ? "data-open-summary-tools" : category.dataTools ? "data-open-data-tools" : category.productivityTools ? "data-open-productivity-tools" : category.educationTools ? "data-open-education-tools" : "data-open-tools"}>
                ${escapeHtml(category.title)}
              </button>
            `).join("")}
          </nav>

          <div class="summary-tools-sections">
            ${groups.map((group) => `
              <section class="summary-tools-block" aria-label="${escapeHtml(group.title)}">
                <h2>
                  <span aria-hidden="true">${group.icon}</span>
                  <b>${escapeHtml(group.title)}</b>
                </h2>
                <div class="tools-grid summary-tools-grid">
                  ${group.tools.map((tool) => `
                    <button class="tool-card summary-tool-card" type="button" ${getToolCardAttrs(tool)}>
                      <span class="tool-card-star" aria-hidden="true">${icons.star}</span>
                      ${renderToolAvailabilityBadge(tool)}
                      <span class="tool-card-icon" aria-hidden="true">${tool.icon}</span>
                      <strong>${escapeHtml(tool.title)}</strong>
                      <span class="tool-card-copy">${escapeHtml(tool.description)}</span>
                      ${renderToolAction(tool, "summary-tool-action")}
                    </button>
                  `).join("")}
                </div>
              </section>
            `).join("")}
          </div>
          ${renderToolsSuggestion()}
        </div>
      </section>
    `;
  }

  function renderDataAnalysisToolsMain() {
    const categories = [
      { title: "الأكثر استخدامًا" },
      { title: "كتابة وتحرير", writingTools: true },
      { title: "تلخيص وتنظيم", summaryTools: true },
      { title: "تحليل وبيانات", dataTools: true },
      { title: "إنتاجية", productivityTools: true },
      { title: "تعليم وتعلم", educationTools: true },
      { title: "أدوات مجانية", freeTools: true }
    ];
    const dataToolIcons = {
      trend: '<svg viewBox="0 0 24 24"><path d="M4 18h16"/><path d="m6 15 4-5 4 3 4-7"/><path d="M16 6h2v2"/></svg>',
      database: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
      chart: '<svg viewBox="0 0 24 24"><path d="M5 19V5"/><path d="M5 19h15"/><rect x="8" y="12" width="2.7" height="5"/><rect x="12.2" y="8" width="2.7" height="9"/><rect x="16.4" y="5" width="2.7" height="12"/></svg>',
      sheet: '<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M8 12h8M8 16h8M11 10v8M15 10v8"/></svg>',
      clean: '<svg viewBox="0 0 24 24"><path d="M5 6h14l-5.5 6.4V19l-3 1.5v-8.1Z"/><path d="M8 5V3M16 5V3"/></svg>',
      anomaly: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/><path d="M8.5 11h5M11 8.5v5"/></svg>',
      forecast: '<svg viewBox="0 0 24 24"><path d="M5 18h14"/><path d="M6 15c2.2-4.5 4.3-5.5 6.5-3s4.2 1.8 5.5-3.5"/><circle cx="7" cy="15" r="1"/><circle cx="12.5" cy="12.5" r="1"/><circle cx="18" cy="8.5" r="1"/></svg>',
      aggregate: '<svg viewBox="0 0 24 24"><path d="M7 7h10M7 12h10M7 17h10"/><path d="M4 7h.1M4 12h.1M4 17h.1M20 7h.1M20 12h.1M20 17h.1"/></svg>'
    };
    const tools = [
      {
        title: "تحليل الاتجاهات",
        description: "اكتشاف الأنماط والاتجاهات داخل البيانات",
        icon: dataToolIcons.trend
      },
      {
        title: "استعلام البيانات",
        description: "كتابة استعلامات SQL مبسطة لاستخراج البيانات",
        icon: dataToolIcons.database
      },
      {
        title: "إنشاء تقارير بيانية",
        description: "إنشاء تقارير ورسوم بيانية احترافية",
        icon: dataToolIcons.chart
      },
      {
        title: "تحليل الجداول",
        description: "تحليل ملفات الجداول واستخراج المعلومات والملاحظات",
        icon: dataToolIcons.sheet
      },
      {
        title: "تنظيف البيانات",
        description: "تنظيف ومعالجة البيانات وإزالة القيم المكررة والخاطئة",
        icon: dataToolIcons.clean
      },
      {
        title: "كشف الشذوذ",
        description: "اكتشاف القيم الشاذة والفروقات غير الطبيعية",
        icon: dataToolIcons.anomaly
      },
      {
        title: "التنبؤ والتحليل التقديري",
        description: "عمل نماذج أولية وتوقع النتائج المستقبلية",
        icon: dataToolIcons.forecast
      },
      {
        title: "تحليل البيانات المجمعة",
        description: "تلخيص وتحليل البيانات من مصادر متعددة",
        icon: dataToolIcons.aggregate
      }
    ];

    return `
      <section class="guest-main tools-main tools-data-main" aria-label="تحليل وبيانات">
        <div class="tools-page data-tools-page">
          ${renderToolsTopControls()}
          <header class="tools-hero data-tools-hero">
            <div class="tools-title-row">
              <span class="tools-title-icon" aria-hidden="true">${dataToolIcons.chart}</span>
              <h1>تحليل وبيانات</h1>
            </div>
            <p>مجموعة أدوات متخصصة لتحليل البيانات واستكشاف الرؤى واتخاذ قرارات مبنية على البيانات</p>
          </header>

          <nav class="tools-unified-bar" aria-label="تصنيفات الأدوات">
            ${categories.map((category) => `
              <button class="tools-unified-filter ${category.dataTools ? "is-active" : ""}" type="button" ${category.freeTools ? "data-open-free-tools" : category.writingTools ? "data-open-writing-tools" : category.summaryTools ? "data-open-summary-tools" : category.dataTools ? "data-open-data-tools" : category.productivityTools ? "data-open-productivity-tools" : category.educationTools ? "data-open-education-tools" : "data-open-tools"}>
                ${escapeHtml(category.title)}
              </button>
            `).join("")}
          </nav>

          <section class="data-tools-block" aria-label="أدوات التحليل والبيانات">
            <h2>
              <span aria-hidden="true">${dataToolIcons.chart}</span>
              <b>أدوات التحليل والبيانات</b>
            </h2>
            <div class="tools-grid data-tools-grid">
              ${tools.map((tool) => `
                <button class="tool-card data-tool-card" type="button" ${getToolCardAttrs(tool)}>
                  <span class="tool-card-star" aria-hidden="true">${icons.star}</span>
                  ${renderToolAvailabilityBadge(tool)}
                  <span class="tool-card-icon" aria-hidden="true">${tool.icon}</span>
                  <strong>${escapeHtml(tool.title)}</strong>
                  <span class="tool-card-copy">${escapeHtml(tool.description)}</span>
                  ${renderToolAction(tool, "data-tool-action")}
                </button>
              `).join("")}
            </div>
          </section>
          ${renderToolsSuggestion()}
        </div>
      </section>
    `;
  }

  function renderProductivityToolsMain() {
    const categories = [
      { title: "الأكثر استخدامًا" },
      { title: "كتابة وتحرير", writingTools: true },
      { title: "تلخيص وتنظيم", summaryTools: true },
      { title: "تحليل وبيانات", dataTools: true },
      { title: "إنتاجية", productivityTools: true },
      { title: "تعليم وتعلم", educationTools: true },
      { title: "أدوات مجانية", freeTools: true }
    ];
    const productivityToolIcons = {
      target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.3"/></svg>',
      calendar: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v4M16 3v4M4 10h16M8 14h2M12 14h2M16 14h1"/></svg>',
      checklist: '<svg viewBox="0 0 24 24"><path d="m5 7 1.4 1.4L9.5 5M12 7h7M5 13l1.4 1.4L9.5 11M12 13h7M5 19l1.4 1.4L9.5 17M12 19h7"/></svg>',
      timer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7"/><path d="M9 3h6M12 7v6l3 2"/></svg>',
      bolt: '<svg viewBox="0 0 24 24"><path d="m13 2-8 12h6l-1 8 8-12h-6z"/></svg>',
      folder: '<svg viewBox="0 0 24 24"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H10l2 2h5.5A2.5 2.5 0 0 1 20 9.5v7A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z"/></svg>',
      note: '<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M8 12h7M8 16h5"/></svg>',
      bell: '<svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>'
    };
    const tools = [
      {
        title: "تحديد الأهداف",
        description: "حدد أهدافك وابدأ بخطة واضحة لتنفيذها",
        icon: productivityToolIcons.target
      },
      {
        title: "جدولة المواعيد",
        description: "تنظيم مواعيدك واجتماعاتك في مكان واحد",
        icon: productivityToolIcons.calendar
      },
      {
        title: "قائمة المهام",
        description: "إنشاء وإدارة المهام اليومية وتتبع تقدمك",
        icon: productivityToolIcons.checklist
      },
      {
        title: "تركيز العمل",
        description: "تقنية بومودورو لتنظيم الوقت وزيادة التركيز",
        icon: productivityToolIcons.timer
      },
      {
        title: "عادات يومية",
        description: "بناء عادات إيجابية ومتابعة تقدمك يوميًا",
        icon: productivityToolIcons.bolt
      },
      {
        title: "إدارة المشاريع",
        description: "تنظيم مشاريعك ومهام الفريق بكفاءة عالية",
        icon: productivityToolIcons.folder
      },
      {
        title: "الملاحظات السريعة",
        description: "تدوين أفكارك وملاحظاتك بسرعة وسهولة",
        icon: productivityToolIcons.note
      },
      {
        title: "التذكيرات الذكية",
        description: "تذكيرات ذكية في الوقت المناسب لعدم نسيان مهامك",
        icon: productivityToolIcons.bell
      }
    ];

    return `
      <section class="guest-main tools-main tools-productivity-main" aria-label="إنتاجية">
        <div class="tools-page productivity-tools-page">
          ${renderToolsTopControls()}
          <header class="tools-hero productivity-tools-hero">
            <div class="tools-title-row">
              <span class="tools-title-icon" aria-hidden="true">${productivityToolIcons.bolt}</span>
              <h1>إنتاجية</h1>
            </div>
            <p>أدوات ذكية تساعدك على تنظيم وقتك ومهامك وزيادة إنتاجيتك</p>
          </header>

          <nav class="tools-unified-bar" aria-label="تصنيفات الأدوات">
            ${categories.map((category) => `
              <button class="tools-unified-filter ${category.productivityTools ? "is-active" : ""}" type="button" ${category.freeTools ? "data-open-free-tools" : category.writingTools ? "data-open-writing-tools" : category.summaryTools ? "data-open-summary-tools" : category.dataTools ? "data-open-data-tools" : category.productivityTools ? "data-open-productivity-tools" : category.educationTools ? "data-open-education-tools" : "data-open-tools"}>
                ${escapeHtml(category.title)}
              </button>
            `).join("")}
          </nav>

          <section class="productivity-tools-block" aria-label="أدوات الإنتاجية">
            <h2>
              <span aria-hidden="true">${icons.sparkle}</span>
              <b>ملخص سريع</b>
            </h2>
            <div class="tools-grid productivity-tools-grid">
              ${tools.map((tool) => `
                <button class="tool-card productivity-tool-card" type="button" ${getToolCardAttrs(tool)}>
                  <span class="tool-card-star" aria-hidden="true">${icons.star}</span>
                  ${renderToolAvailabilityBadge(tool)}
                  <span class="tool-card-icon" aria-hidden="true">${tool.icon}</span>
                  <strong>${escapeHtml(tool.title)}</strong>
                  <span class="tool-card-copy">${escapeHtml(tool.description)}</span>
                  ${renderToolAction(tool, "productivity-tool-action")}
                </button>
              `).join("")}
            </div>
          </section>
          ${renderToolsSuggestion()}
        </div>
      </section>
    `;
  }

  function renderEducationLearningToolsMain() {
    const categories = [
      { title: "الأكثر استخدامًا" },
      { title: "كتابة وتحرير", writingTools: true },
      { title: "تلخيص وتنظيم", summaryTools: true },
      { title: "تحليل وبيانات", dataTools: true },
      { title: "إنتاجية", productivityTools: true },
      { title: "تعليم وتعلم", educationTools: true },
      { title: "أدوات مجانية", freeTools: true }
    ];
    const educationToolIcons = {
      board: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M8 20h8M12 16v4M8 9h8M8 12h5"/></svg>',
      quiz: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="m8 8 1.3 1.3L12 6.5M14 8h3M8 14h1M12 14h5"/></svg>',
      cards: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="14" rx="2"/><path d="M9 4h8a2 2 0 0 1 2 2v11M9 11h6M9 15h5"/></svg>',
      explain: '<svg viewBox="0 0 24 24"><path d="M6 3h9l3 3v15H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M8 12h8M8 16h5"/></svg>',
      content: '<svg viewBox="0 0 24 24"><path d="M6 4h12v16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>',
      idea: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1.2.9-1.5 1.8-1.6 3H9.6c-.1-1.2-.4-2.1-1.6-3Z"/></svg>',
      language: '<svg viewBox="0 0 24 24"><path d="M4 5h8M8 5v14M5 9c.8 2.8 2.8 5 6 6"/><path d="M11 9c-.8 2.8-2.8 5-6 6"/><path d="M14 19l4-9 4 9M15.5 16h5"/></svg>',
      plan: '<svg viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path d="M8 7h8M8 11h6M8 15h5"/></svg>'
    };
    const tools = [
      {
        title: "تلخيص الدروس",
        description: "تلخيص الدروس والمحاضرات في نقاط رئيسية منظمة",
        icon: educationToolIcons.board
      },
      {
        title: "اختبارات وأسئلة",
        description: "إنشاء اختبارات وأسئلة متنوعة مع إجابات نموذجية",
        icon: educationToolIcons.quiz
      },
      {
        title: "بطاقات مراجعة",
        description: "إنشاء بطاقات مراجعة تفاعلية للحفظ والمذاكرة",
        icon: educationToolIcons.cards
      },
      {
        title: "شرح المفاهيم",
        description: "تبسيط وشرح المفاهيم المعقدة بطريقة سهلة ومبسطة",
        icon: educationToolIcons.explain
      },
      {
        title: "إنشاء محتوى تعليمي",
        description: "إنشاء محتوى تعليمي جاهز من نص طويل وتقسيمه لوحدات",
        icon: educationToolIcons.content
      },
      {
        title: "أمثلة تطبيقية",
        description: "إيجاد أمثلة عملية وتطبيقات على المفاهيم النظرية",
        icon: educationToolIcons.idea
      },
      {
        title: "مساعد اللغة",
        description: "تحسين الكتابة وفهم القواعد وترجمة النصوص التعليمية",
        icon: educationToolIcons.language
      },
      {
        title: "خطة دراسية",
        description: "إنشاء خطط دراسية منظمة حسب أهدافك ووقتك",
        icon: educationToolIcons.plan
      }
    ];

    return `
      <section class="guest-main tools-main tools-education-main" aria-label="تعليم وتعلم">
        <div class="tools-page education-tools-page">
          ${renderToolsTopControls()}
          <header class="tools-hero education-tools-hero">
            <div class="tools-title-row">
              <span class="tools-title-icon" aria-hidden="true">${educationToolIcons.plan}</span>
              <h1>تعليم وتعلم</h1>
            </div>
            <p>أدوات تعليمية ذكية تساعدك على الدراسة والتعلم بوضوح وتنظيم</p>
          </header>

          <nav class="tools-unified-bar" aria-label="تصنيفات الأدوات">
            ${categories.map((category) => `
              <button class="tools-unified-filter ${category.educationTools ? "is-active" : ""}" type="button" ${category.freeTools ? "data-open-free-tools" : category.writingTools ? "data-open-writing-tools" : category.summaryTools ? "data-open-summary-tools" : category.dataTools ? "data-open-data-tools" : category.productivityTools ? "data-open-productivity-tools" : category.educationTools ? "data-open-education-tools" : "data-open-tools"}>
                ${escapeHtml(category.title)}
              </button>
            `).join("")}
          </nav>

          <section class="education-tools-block" aria-label="أدوات التعليم والتعلم">
            <h2>
              <span aria-hidden="true">${educationToolIcons.quiz}</span>
              <b>أدوات التعليم والتعلم</b>
            </h2>
            <div class="tools-grid education-tools-grid">
              ${tools.map((tool) => `
                <button class="tool-card education-tool-card" type="button" ${getToolCardAttrs(tool)}>
                  <span class="tool-card-star" aria-hidden="true">${icons.star}</span>
                  ${renderToolAvailabilityBadge(tool)}
                  <span class="tool-card-icon" aria-hidden="true">${tool.icon}</span>
                  <strong>${escapeHtml(tool.title)}</strong>
                  <span class="tool-card-copy">${escapeHtml(tool.description)}</span>
                  ${renderToolAction(tool, "education-tool-action")}
                </button>
              `).join("")}
            </div>
          </section>
          ${renderToolsSuggestion()}
        </div>
      </section>
    `;
  }

  function renderToolsMain(profile) {
    const showingSubscriberTools = state.toolView === "subscriber-tools";
    const hasSubscriberAccess = hasSubscriberToolsAccess();
    const subscriberToolIcons = {
      image: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="m7 16 3.2-3.2 2.7 2.7 2.3-2.3L19 17"/><circle cx="9" cy="10" r="1.4"/></svg>',
      crop: '<svg viewBox="0 0 24 24"><path d="M6 3v13a2 2 0 0 0 2 2h13"/><path d="M3 6h13a2 2 0 0 1 2 2v13"/><path d="M9 9h6v6H9z"/></svg>',
      split: '<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M9 8h2M9 12h6M9 16h6"/></svg>',
      merge: '<svg viewBox="0 0 24 24"><path d="M6 4h8l3 3v9H6Z"/><path d="M14 4v4h4"/><path d="M9 19h9V9"/><path d="M9 11h5M9 14h5"/></svg>',
      watermark: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="m7 17 10-10M8.5 8.5l7 7M12 5v14M5 12h14"/></svg>',
      ocr: '<svg viewBox="0 0 24 24"><path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3"/><path d="M8 9h8M12 9v7M9.5 16h5"/></svg>',
      hd: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 15V9M8 12h3M11 15V9M14 9h2.2A2.8 2.8 0 0 1 19 11.8v.4A2.8 2.8 0 0 1 16.2 15H14Z"/></svg>',
      flip: '<svg viewBox="0 0 24 24"><path d="M7 5v14M17 5v14"/><path d="m10 8 4 4-4 4M14 8l-4 4 4 4"/></svg>'
    };
    const categories = [
      { title: "الأكثر استخدامًا" },
      { title: "كتابة وتحرير", writingTools: true },
      { title: "تلخيص وتنظيم", summaryTools: true },
      { title: "تحليل وبيانات", dataTools: true },
      { title: "إنتاجية", productivityTools: true },
      { title: "تعليم وتعلم", educationTools: true },
      { title: "أدوات مجانية", freeTools: true }
    ];
    const tools = [
      {
        key: "smart-search",
        title: "البحث الذكي",
        description: "البحث عن معلومات دقيقة من مصادر موثوقة",
        icon: icons.search
      },
      {
        key: "writing-assistant",
        title: "مساعد الكتابة",
        description: "كتابة وتحسين النصوص بجودة عالية وبأسلوب احترافي",
        icon: icons.edit
      },
      {
        title: "صناعة ملخصات",
        description: "إنشاء ملخصات احترافية من النصوص أو الملفات",
        icon: icons.document
      },
      {
        title: "تلخيص محتوى",
        description: "تلخيص أي نص طويل إلى نقاط مختصرة وواضحة",
        icon: icons.notes
      },
      {
        title: "ترجمة ذكية",
        description: "ترجمة النصوص بدقة عالية ولغة واضحة",
        icon: icons.internet
      },
      {
        title: "استخراج البيانات",
        description: "استخراج البيانات من النصوص والملفات المنظمة",
        icon: icons.tests
      },
      {
        title: "أفكار ومقترحات",
        description: "الحصول على أفكار إبداعية لمشاريعك ومحتواك",
        icon: icons.sparkle
      },
      {
        title: "تحليل المحتوى",
        description: "تحليل النصوص واستخراج المفاهيم الرئيسية",
        icon: icons.ai
      }
    ];
    const subscriberTools = [
      { title: "حذف صفحات", description: "حذف صفحات محددة من الملفات بسرعة ودقة", icon: icons.delete },
      { title: "تعديل النصوص والروابط", description: "تعديل النصوص والروابط داخل الملفات", icon: icons.edit },
      { title: "تغيير كلمة المرور", description: "تغيير كلمة مرور الملفات بخطوات بسيطة", icon: icons.lock },
      { key: "pdf-unlock", title: "إزالة الحماية", description: "إزالة الحماية من ملفات PDF بكل سهولة وأمان", icon: icons.lock },
      { title: "تعديل الصور", description: "تحسين الصور داخل الملفات أو استخراجها بجودة عالية", icon: subscriberToolIcons.image },
      { key: "image-compressor", title: "ضغط الملفات", description: "تقليل حجم الملفات مع الحفاظ على الجودة", icon: subscriberToolIcons.split },
      { title: "تقسيم الملفات", description: "تقسيم الملفات إلى أجزاء حسب الحاجة", icon: subscriberToolIcons.split },
      { title: "دمج ملفات", description: "دمج عدة ملفات في ملف واحد بترتيب اختياري", icon: subscriberToolIcons.merge },
      { key: "image-cropper", title: "قص الصورة", description: "قص وتحديد الجزء المطلوب من الصورة", icon: subscriberToolIcons.crop },
      { key: "image-converter", title: "تحويل صيغة الصورة", description: "تحويل الصور بين مختلف الصيغ JPG, PNG, WebP", icon: subscriberToolIcons.image },
      { title: "استخراج النص من الصورة", description: "استخراج النصوص من الصور بدقة عالية OCR", icon: subscriberToolIcons.ocr },
      { key: "image-clarifier", title: "توضيح الصورة", description: "تحسين وضوح الصورة وإزالة الضبابية", icon: subscriberToolIcons.hd },
      { title: "استخراج النص من الصورة (OCR)", description: "استخراج النصوص من الصور بدقة عالية", icon: subscriberToolIcons.ocr },
      { title: "حذف علامة مائية", description: "إزالة العلامات المائية من الملفات", icon: subscriberToolIcons.watermark },
      { title: "قلب الصورة", description: "قلب الصورة أفقيًا أو عموديًا بسهولة", icon: subscriberToolIcons.flip },
      { key: "image-rotator", title: "تدوير الصورة", description: "تدوير الصور إلى أي اتجاه بسهولة", icon: icons.refresh }
    ];
    const visibleTools = showingSubscriberTools ? subscriberTools : tools;
    const heroTitle = showingSubscriberTools ? "أدوات مجانية للمشتركين" : "أدوات الذكاء الاصطناعي";
    const heroTitleHtml = showingSubscriberTools ? 'أدوات مجانية <span class="tools-title-accent">للمشتركين</span>' : escapeHtml(heroTitle);
    const heroDescription = showingSubscriberTools
      ? "مجموعة من الأدوات الحصرية المتقدمة التي تعمل مباشرة في متصفحك"
      : "مجموعة من الأدوات الذكية لمساعدتك في العمل والإبداع";
    const heroIcon = showingSubscriberTools ? icons.gift : icons.settings;

    return `
      <section class="guest-main tools-main" aria-label="${escapeHtml(heroTitle)}">
        <div class="tools-page">
          ${renderToolsTopControls()}

          <header class="tools-hero ${showingSubscriberTools ? "is-subscriber-tools" : ""}">
            <div class="tools-title-row">
              <span class="tools-title-icon" aria-hidden="true">${heroIcon}</span>
              <h1>${heroTitleHtml}</h1>
            </div>
            <p>${escapeHtml(heroDescription)}</p>
          </header>

          <nav class="tools-unified-bar" aria-label="تصنيفات الأدوات">
            ${categories.map((category, index) => `
              <button class="tools-unified-filter ${category.freeTools ? (showingSubscriberTools ? "is-active" : "") : (!showingSubscriberTools && index === 0 ? "is-active" : "")}" type="button" ${category.freeTools ? "data-open-free-tools" : category.writingTools ? "data-open-writing-tools" : category.summaryTools ? "data-open-summary-tools" : category.dataTools ? "data-open-data-tools" : category.productivityTools ? "data-open-productivity-tools" : category.educationTools ? "data-open-education-tools" : "data-open-tools"}>
                ${escapeHtml(category.title)}
              </button>
            `).join("")}
          </nav>

          <section class="tools-grid ${showingSubscriberTools ? "is-subscriber-filter" : ""}">
            ${visibleTools.map((tool) => {
              const attrs = getToolCardAttrs(tool, showingSubscriberTools);
              const ready = hasToolPage(tool);
              const authClass = ready && (!isAuthenticated() || (showingSubscriberTools && !hasSubscriberAccess)) ? "requires-auth" : "";
              return `
              <button class="tool-card ${showingSubscriberTools ? "subscriber-tool-card" : ""} ${authClass}" type="button" ${attrs}>
                <span class="tool-card-star" aria-hidden="true">${icons.star}</span>
                ${renderToolAvailabilityBadge(tool, showingSubscriberTools)}
                <span class="tool-card-icon" aria-hidden="true">${tool.icon}</span>
                <strong>${escapeHtml(tool.title)}</strong>
                <span class="tool-card-copy">${escapeHtml(tool.description)}</span>
                ${renderToolAction(tool, "tool-card-action")}
              </button>
            `;
            }).join("")}
          </section>

          ${renderToolsSuggestion()}
        </div>
      </section>
    `;
  }

  function renderSubscriberToolsMain(profile) {
    const hasSubscriberAccess = hasSubscriberToolsAccess();
    const toolIcons = {
      hd: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 15V9M8 12h3M11 15V9M14 9h2.2A2.8 2.8 0 0 1 19 11.8v.4A2.8 2.8 0 0 1 16.2 15H14Z"/></svg>',
      imagePlus: '<svg viewBox="0 0 24 24"><rect x="4" y="6" width="14" height="14" rx="2"/><path d="m7 16 3-3 2.5 2.5L15 13l3 3"/><circle cx="9" cy="10" r="1.3"/><path d="M18 4v6M15 7h6"/></svg>',
      pngPdf: '<svg viewBox="0 0 24 24"><path d="M5 4h9l4 4v8H5Z"/><path d="M14 4v5h5"/><path d="M8 12h5M8 15h3"/><rect x="12" y="11" width="8" height="9" rx="1.4"/><path d="M14 16h4M14 18h2"/></svg>',
      pdfPng: '<svg viewBox="0 0 24 24"><path d="M5 4h9l4 4v8H5Z"/><path d="M14 4v5h5"/><path d="M8 13h5"/><rect x="11" y="10" width="9" height="10" rx="1.5"/><path d="m13 17 2-2 1.4 1.4 1.1-1.1 1.5 1.7"/><circle cx="14" cy="13" r=".9"/></svg>',
      image: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="m7 16 3.2-3.2 2.7 2.7 2.3-2.3L19 17"/><circle cx="9" cy="10" r="1.4"/></svg>',
      crop: '<svg viewBox="0 0 24 24"><path d="M6 3v13a2 2 0 0 0 2 2h13"/><path d="M3 6h13a2 2 0 0 1 2 2v13"/><path d="M9 9h6v6H9z"/></svg>',
      compress: '<svg viewBox="0 0 24 24"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/><path d="M3 9l6-6M21 9l-6-6M3 15l6 6M21 15l-6 6"/></svg>',
      unlock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M9 10V7.5A3.5 3.5 0 0 1 15 5"/></svg>',
      split: '<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M9 8h2M9 12h6M9 16h6"/></svg>',
      merge: '<svg viewBox="0 0 24 24"><path d="M6 4h8l3 3v9H6Z"/><path d="M14 4v4h4"/><path d="M9 19h9V9"/><path d="M9 11h5M9 14h5"/></svg>',
      watermark: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7"/><path d="m7 17 10-10M8.5 8.5l7 7M12 5v14M5 12h14"/></svg>',
      ocr: '<svg viewBox="0 0 24 24"><path d="M4 8V5h3M17 5h3v3M20 16v3h-3M7 19H4v-3"/><path d="M8 9h8M12 9v7M9.5 16h5"/></svg>'
    };

    const tools = [
      { title: "حذف صفحات", description: "حذف صفحات محددة من الملفات بسرعة ودقة", icon: icons.delete },
      { title: "تعديل النصوص والروابط", description: "تعديل النصوص والروابط داخل الملفات", icon: icons.edit },
      { title: "تغيير كلمة المرور", description: "تغيير كلمة مرور الملفات بخطوات بسيطة", icon: icons.lock },
      { key: "pdf-unlock", title: "إزالة الحماية", description: "إزالة الحماية من ملفات PDF بكل سهولة وأمان", icon: toolIcons.unlock },
      { title: "تعديل الصور", description: "تحسين الصور داخل الملفات أو استخراجها بجودة عالية", icon: toolIcons.image },
      { key: "image-compressor", title: "ضغط الملفات", description: "تقليل حجم الملفات مع الحفاظ على الجودة", icon: toolIcons.compress },
      { title: "تقسيم الملفات", description: "تقسيم الملفات إلى أجزاء حسب الحاجة", icon: toolIcons.split },
      { title: "دمج ملفات", description: "دمج عدة ملفات في ملف واحد بترتيب اختياري", icon: toolIcons.merge },
      { key: "image-cropper", title: "قص الصورة", description: "قص وتحديد الجزء المطلوب من الصورة", icon: toolIcons.crop },
      { key: "image-converter", title: "تحويل صيغة الصورة", description: "تحويل الصور بين مختلف الصيغ JPG, PNG, WebP", icon: toolIcons.image },
      { title: "استخراج النص من الصورة", description: "استخراج النصوص من الصور بدقة عالية OCR", icon: toolIcons.ocr },
      { key: "image-clarifier", title: "توضيح الصورة", description: "تحسين وضوح الصورة وإزالة الضبابية", icon: toolIcons.hd },
      { title: "استخراج النص من الصورة (OCR)", description: "استخراج النصوص من الصور بدقة عالية", icon: toolIcons.ocr },
      { title: "حذف علامة مائية", description: "إزالة العلامات المائية من الملفات", icon: toolIcons.watermark },
      { title: "قلب الصورة", description: "قلب الصورة أفقيًا أو عموديًا بسهولة", icon: '<svg viewBox="0 0 24 24"><path d="M7 5v14M17 5v14"/><path d="m10 8 4 4-4 4M14 8l-4 4 4 4"/></svg>' },
      { key: "image-rotator", title: "تدوير الصورة", description: "تدوير الصور إلى أي اتجاه بسهولة", icon: icons.refresh }
    ];

    const categories = [
      { title: "الكل" },
      { title: "كتابة وتحرير", writingTools: true },
      { title: "تلخيص وتنظيم", summaryTools: true },
      { title: "تحليل وبيانات", dataTools: true },
      { title: "إنتاجية", productivityTools: true },
      { title: "تعليم وتعلم", educationTools: true },
      { title: "أدوات مجانية", freeTools: true }
    ];
    const availabilityLabel = hasSubscriberAccess ? "متاحة في باقتك" : "غير متاحة في باقتك";

    return `
      <section class="guest-main tools-main free-tools-main" aria-label="أدوات مجانية للمشتركين">
        <div class="tools-page free-tools-page">
          ${renderToolsTopControls()}

          <header class="free-tools-hero">
            <div class="free-tools-title">
              <span class="free-tools-gift" aria-hidden="true">${icons.gift}</span>
              <h1><span>أدوات مجانية</span> <b>للمشتركين</b></h1>
              <span class="free-tools-sparkle" aria-hidden="true">${icons.sparkle}</span>
            </div>
            <p>مجموعة من الأدوات الحصرية المتقدمة التي تعمل مباشرة في متصفحك</p>
            <span class="free-tools-locked-badge ${hasSubscriberAccess ? "is-open" : ""}">
              ${hasSubscriberAccess ? icons.sparkle : icons.lock}
              <b>${hasSubscriberAccess ? "متاحة في باقتك الحالية" : "متاحة لباقة شرارة وطويق والرائد"}</b>
            </span>
          </header>

          <nav class="tools-unified-bar" aria-label="تصنيفات أدوات المشتركين">
            ${categories.map((category) => `
              <button class="tools-unified-filter ${category.freeTools ? "is-active" : ""}" type="button" ${category.freeTools ? "data-open-free-tools" : category.writingTools ? "data-open-writing-tools" : category.summaryTools ? "data-open-summary-tools" : category.dataTools ? "data-open-data-tools" : category.productivityTools ? "data-open-productivity-tools" : category.educationTools ? "data-open-education-tools" : "data-open-tools"}>
                ${escapeHtml(category.title)}
              </button>
            `).join("")}
          </nav>

          <section class="free-tools-grid" aria-label="قائمة الأدوات المجانية للمشتركين">
            ${tools.map((tool) => {
              const ready = hasToolPage(tool);
              const attrs = getToolCardAttrs(tool, true);
              const statusLabel = ready ? availabilityLabel : "قيد التطوير";
              return `
              <button class="free-tool-card ${ready && hasSubscriberAccess ? "is-unlocked" : ""} ${ready && !hasSubscriberAccess ? "requires-auth" : ""} ${ready ? "" : "is-development"}" type="button" ${attrs} aria-label="${escapeHtml(`${tool.title} - ${statusLabel}`)}">
                <span class="free-tool-favorite" aria-hidden="true">${icons.star}</span>
                <span class="free-tool-body">
                  <span class="free-tool-icon" aria-hidden="true">${tool.icon}</span>
                  <span class="free-tool-copy">
                    <strong>${escapeHtml(tool.title)}</strong>
                    <small>${escapeHtml(tool.description)}</small>
                  </span>
                </span>
                <span class="free-tool-lock ${ready ? (hasSubscriberAccess ? "is-open" : "") : "is-development"}">
                  <b>${escapeHtml(statusLabel)}</b>
                  ${ready ? (hasSubscriberAccess ? icons.sparkle : icons.lock) : icons.sparkle}
                </span>
              </button>
            `;
            }).join("")}
          </section>
          ${renderToolsSuggestion()}

          <footer class="free-tools-benefits" aria-label="مزايا أدوات المشتركين">
            <article class="free-tools-footer-card">
              <i aria-hidden="true">${icons.crown}</i>
              <span>
                <b>أدوات قوية للمشتركين</b>
                <small>استمتع بإمكانيات متقدمة تساعدك على إنجاز مهامك بشكل أسرع.</small>
              </span>
            </article>
            <div class="free-tools-suggest-center">
              <span>هل لديك اقتراح لأداة جديدة؟</span>
              <small>نحن نعمل باستمرار على إضافة أدوات ذكية بناءً على اقتراحاتك</small>
              <button type="button" data-open-tool-suggestion>اقترح أداة جديدة</button>
            </div>
            <article class="free-tools-footer-card">
              <i aria-hidden="true">${icons.gift}</i>
              <span>
                <b>تحديثات مستمرة</b>
                <small>نضيف أدوات ومميزات جديدة باستمرار للمشتركين.</small>
              </span>
            </article>
          </footer>
        </div>
      </section>
    `;
  }

  function renderImageEnhancerMain() {
    const enhancer = state.imageEnhancer || {};
    const hasAccess = hasSubscriberToolsAccess();
    const scale = String(enhancer.scale || "2");
    const quality = String(enhancer.quality || "medium");
    const hasImage = Boolean(enhancer.originalUrl);
    const hasResult = Boolean(enhancer.resultUrl);
    const canEnhance = hasAccess && hasImage && !enhancer.loading;
    const hdIcon = '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M8 15V9M8 12h3M11 15V9M14 9h2.2A2.8 2.8 0 0 1 19 11.8v.4A2.8 2.8 0 0 1 16.2 15H14Z"/></svg>';
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const magicIcon = '<svg viewBox="0 0 24 24"><path d="m5 19 9-9"/><path d="m13 5 6 6"/><path d="m14 4 6 6"/><path d="M7 4l.8 2.2L10 7l-2.2.8L7 10l-.8-2.2L4 7l2.2-.8Z"/><path d="M18 14l.7 1.8 1.8.7-1.8.7L18 19l-.7-1.8-1.8-.7 1.8-.7Z"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const steps = [
      { number: "1", title: "ارفع صورتك", description: "اختر الصورة التي تريد تحسينها", icon: uploadIcon },
      { number: "2", title: "معالجة ذكية", description: "تتم المعالجة داخل المتصفح", icon: magicIcon },
      { number: "3", title: "تحميل الصورة", description: "احصل على صورتك بجودة أعلى", icon: downloadIcon }
    ];
    const features = [
      "رفع الجودة حتى 4x بدون فقدان التفاصيل",
      "تحسين الألوان والإضاءة تلقائيًا",
      "تقليل التشويش وتنعيم الصورة",
      "مناسبة للصور الشخصية والمنتجات والمشاهد الطبيعية",
      "نتائج سريعة واحترافية"
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main image-enhancer-main" aria-label="رفع جودة الصورة">
          <div class="image-enhancer-page">
            <button class="image-enhancer-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="image-enhancer-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لاستخدام رفع جودة الصورة بدون API وبدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main image-enhancer-main" aria-label="رفع جودة الصورة">
        <div class="image-enhancer-page">
          <button class="image-enhancer-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="image-enhancer-hero">
            <span class="image-enhancer-hd" aria-hidden="true">${hdIcon}</span>
            <div>
              <span class="image-enhancer-sparkle" aria-hidden="true">${icons.sparkle}</span>
              <h1>رفع جودة الصورة</h1>
              <p>ارفع جودة صورك مع الحفاظ على التفاصيل والوضوح الطبيعي</p>
            </div>
          </header>

          <section class="image-enhancer-grid">
            <div class="image-enhancer-upload-card">
              <input data-image-enhancer-input type="file" accept="image/png,image/jpeg,image/webp" hidden>
              <div class="image-enhancer-dropzone ${hasImage ? "has-image" : ""}" data-image-enhancer-dropzone>
                <span class="image-enhancer-upload-icon" aria-hidden="true">${uploadIcon}</span>
                <h2>${hasImage ? escapeHtml(enhancer.fileName || "تم اختيار الصورة") : "اسحب وأفلت صورتك هنا"}</h2>
                <p>${hasImage ? `${escapeHtml(formatImageEnhancerFileSize(enhancer.fileSize))} · ${escapeHtml(`${enhancer.width || 0} × ${enhancer.height || 0}`)} px` : "أو انقر لاختيار صورة من جهازك"}</p>
                <button class="image-enhancer-primary" type="button" data-image-enhancer-choose>
                  <span>اختيار صورة</span>
                  ${icons.attach}
                </button>
                <small>يدعم: JPG, PNG, WEBP<br>الحد الأقصى لحجم الملف 20MB</small>
              </div>
            </div>

            <aside class="image-enhancer-info">
              <article class="image-enhancer-card">
                <span class="image-enhancer-card-icon" aria-hidden="true">${icons.sparkle}</span>
                <h2>ماذا تقدم هذه الأداة؟</h2>
                <ul>
                  ${features.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
              <article class="image-enhancer-tip">
                <span aria-hidden="true">${icons.bolt}</span>
                <div>
                  <h2>نصيحة للحصول على أفضل نتيجة</h2>
                  <p>يفضل استخدام صورة واضحة قدر الإمكان للحصول على أفضل تحسين للجودة</p>
                </div>
              </article>
            </aside>
          </section>

          ${hasImage ? `
            <section class="image-enhancer-settings">
              <label>
                <span>حجم التكبير</span>
                <select data-image-enhancer-scale>
                  <option value="2" ${scale === "2" ? "selected" : ""}>تكبير 2x</option>
                  <option value="4" ${scale === "4" ? "selected" : ""}>تكبير 4x</option>
                </select>
              </label>
              <label>
                <span>مستوى التحسين</span>
                <select data-image-enhancer-quality>
                  <option value="light" ${quality === "light" ? "selected" : ""}>تحسين خفيف</option>
                  <option value="medium" ${quality === "medium" ? "selected" : ""}>تحسين متوسط</option>
                  <option value="strong" ${quality === "strong" ? "selected" : ""}>تحسين قوي</option>
                </select>
              </label>
              <button class="image-enhancer-run" type="button" data-image-enhancer-run ${canEnhance ? "" : "disabled"}>
                ${enhancer.loading ? "جاري المعالجة..." : "رفع جودة الصورة"}
                ${magicIcon}
              </button>
              <button class="image-enhancer-reset" type="button" data-image-enhancer-reset>إعادة تعيين</button>
            </section>
          ` : ""}

          ${enhancer.loading || enhancer.status || enhancer.error ? `
            <section class="image-enhancer-status ${enhancer.error ? "is-error" : ""}">
              <p>${escapeHtml(enhancer.error || enhancer.status || "")}</p>
              ${enhancer.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(enhancer.progress || 0)))}%"></i></span>` : ""}
            </section>
          ` : ""}

          ${hasImage ? `
            <section class="image-enhancer-preview">
              <article>
                <header>
                  <h2>قبل المعالجة</h2>
                  <span>${escapeHtml(`${enhancer.width || 0} × ${enhancer.height || 0}`)} px</span>
                </header>
                <div><img src="${escapeHtml(enhancer.originalUrl)}" alt="معاينة الصورة الأصلية"></div>
              </article>
              <article class="${hasResult ? "" : "is-empty"}">
                <header>
                  <h2>بعد المعالجة</h2>
                  <span>${hasResult ? escapeHtml(`${enhancer.resultWidth || 0} × ${enhancer.resultHeight || 0}`) : "بانتظار التحسين"}${hasResult ? " px" : ""}</span>
                </header>
                <div>
                  ${hasResult ? `<img src="${escapeHtml(enhancer.resultUrl)}" alt="معاينة الصورة المحسنة">` : `<span>${magicIcon}</span>`}
                </div>
              </article>
            </section>
          ` : ""}

          ${hasResult ? `
            <div class="image-enhancer-download-row">
              <span>حجم النتيجة: ${escapeHtml(formatImageEnhancerFileSize(enhancer.resultSize))}</span>
              <a class="image-enhancer-download" href="${escapeHtml(enhancer.resultUrl)}" download="orlixor-enhanced.png">
                <span>تحميل الصورة</span>
                ${downloadIcon}
              </a>
            </div>
          ` : ""}

          <section class="image-enhancer-steps">
            <h2>كيف تعمل الأداة؟</h2>
            <div>
              ${steps.map((step) => `
                <article>
                  <span class="image-enhancer-step-number">${escapeHtml(step.number)}</span>
                  <i aria-hidden="true">${step.icon}</i>
                  <strong>${escapeHtml(step.title)}</strong>
                  <small>${escapeHtml(step.description)}</small>
                </article>
              `).join("")}
            </div>
          </section>

          <section class="image-enhancer-privacy">
            <span aria-hidden="true">${icons.lock}</span>
            <div>
              <h2>خصوصيتك تهمنا</h2>
              <p>صورك تُعالج داخل متصفحك ولا يتم رفعها إلى خوادمنا.</p>
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderImageClarifierMain() {
    const clarifier = state.imageClarifier || {};
    const hasAccess = hasSubscriberToolsAccess();
    const quality = String(clarifier.quality || "medium");
    const noise = String(clarifier.noise || "medium");
    const contrastEnabled = clarifier.contrast !== false;
    const hasImage = Boolean(clarifier.originalUrl);
    const hasResult = Boolean(clarifier.resultUrl);
    const canRun = hasAccess && hasImage && !clarifier.loading;
    const imageIcon = '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="m7 16 3.2-3.2 2.7 2.7 2.3-2.3L19 17"/><circle cx="9" cy="10" r="1.4"/><path d="M18 3v6M15 6h6"/></svg>';
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const tuneIcon = '<svg viewBox="0 0 24 24"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></svg>';
    const waveIcon = '<svg viewBox="0 0 24 24"><path d="M4 8c2.5-3 5.5-3 8 0s5.5 3 8 0"/><path d="M4 16c2.5-3 5.5-3 8 0s5.5 3 8 0"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const qualityLabels = { light: "خفيف", medium: "متوسط", strong: "قوي" };
    const noiseLabels = { off: "إيقاف", medium: "متوسط", strong: "قوي" };
    const typeLabel = String(clarifier.fileType || "").replace("image/", "").toUpperCase() || "-";
    const features = [
      "تحسين ملامح ووضوح تفاصيل الصورة",
      "تقليل التشويش والضبابية",
      "إبراز التفاصيل الدقيقة",
      "إزالة التشويش الناتج عن الاهتزاز",
      "نتائج طبيعية واحترافية"
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main image-clarifier-main" aria-label="توضيح الصورة">
          <div class="image-clarifier-page">
            <button class="image-clarifier-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="image-clarifier-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لاستخدام توضيح الصورة داخل المتصفح بدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main image-clarifier-main" aria-label="توضيح الصورة">
        <div class="image-clarifier-page">
          <button class="image-clarifier-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="image-clarifier-hero">
            <span class="image-clarifier-icon" aria-hidden="true">${imageIcon}</span>
            <div>
              <span class="image-clarifier-sparkles" aria-hidden="true">${icons.sparkle}</span>
              <h1>توضيح الصورة</h1>
              <p>حسّن وضوح صورتك وإزالة الضبابية للحصول على صورة أكثر نقاءً وتفاصيل أدق.</p>
            </div>
          </header>

          <section class="image-clarifier-top-grid">
            <div class="image-clarifier-upload-card">
              <input data-image-clarifier-input type="file" accept="image/png,image/jpeg,image/webp" hidden>
              <div class="image-clarifier-dropzone ${hasImage ? "has-image" : ""}" data-image-clarifier-dropzone>
                <span class="image-clarifier-upload-icon" aria-hidden="true">${uploadIcon}</span>
                <h2>${hasImage ? escapeHtml(clarifier.fileName || "تم اختيار الصورة") : "اسحب وأفلت صورتك هنا"}</h2>
                <p>${hasImage ? `${escapeHtml(formatImageEnhancerFileSize(clarifier.fileSize))} · ${escapeHtml(`${clarifier.width || 0} × ${clarifier.height || 0}`)} px` : "أو انقر لاختيار صورة من جهازك"}</p>
                <button class="image-clarifier-primary" type="button" data-image-clarifier-choose>
                  <span>اختيار صورة</span>
                  ${icons.attach}
                </button>
                <small>يدعم: JPG, PNG, WEBP<br>الحد الأقصى لحجم الملف 20MB</small>
              </div>
            </div>

            <aside class="image-clarifier-info-stack">
              <article class="image-clarifier-card">
                <span class="image-clarifier-card-icon" aria-hidden="true">${icons.star}</span>
                <h2>ماذا تقدم هذه الأداة؟</h2>
                <ul>
                  ${features.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
              <article class="image-clarifier-tip">
                <span aria-hidden="true">${icons.bolt}</span>
                <div>
                  <h2>نصيحة للحصول على أفضل نتيجة</h2>
                  <p>استخدم صور بإضاءة جيدة قدر الإمكان للحصول على أفضل تحسين.</p>
                </div>
              </article>
            </aside>
          </section>

          <section class="image-clarifier-controls">
            <button class="image-clarifier-run" type="button" data-image-clarifier-run ${canRun ? "" : "disabled"}>
              ${clarifier.loading ? "جاري التوضيح..." : "توضيح الصورة"}
              ${icons.sparkle}
            </button>
            <label>
              <span>مستوى التوضيح</span>
              <select data-image-clarifier-quality>
                <option value="light" ${quality === "light" ? "selected" : ""}>توضيح خفيف</option>
                <option value="medium" ${quality === "medium" ? "selected" : ""}>توضيح متوسط</option>
                <option value="strong" ${quality === "strong" ? "selected" : ""}>توضيح قوي</option>
              </select>
              ${tuneIcon}
            </label>
            <label>
              <span>تقليل الضوضاء</span>
              <select data-image-clarifier-noise>
                <option value="off" ${noise === "off" ? "selected" : ""}>بدون تقليل ضوضاء</option>
                <option value="medium" ${noise === "medium" ? "selected" : ""}>تقليل متوسط</option>
                <option value="strong" ${noise === "strong" ? "selected" : ""}>تقليل قوي</option>
              </select>
              ${waveIcon}
            </label>
            <label>
              <span>تحسين التباين</span>
              <select data-image-clarifier-contrast>
                <option value="on" ${contrastEnabled ? "selected" : ""}>تشغيل</option>
                <option value="off" ${contrastEnabled ? "" : "selected"}>إيقاف</option>
              </select>
              ${icons.bolt}
            </label>
          </section>

          ${clarifier.loading || clarifier.status || clarifier.error ? `
            <section class="image-clarifier-status ${clarifier.error ? "is-error" : ""}">
              <p>${escapeHtml(clarifier.error || clarifier.status || "")}</p>
              ${clarifier.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(clarifier.progress || 0)))}%"></i></span>` : ""}
            </section>
          ` : ""}

          <section class="image-clarifier-workspace">
            <article class="image-clarifier-comparison ${hasResult ? "has-result" : ""} ${hasImage ? "" : "is-empty"}">
              ${hasImage ? `
                <div class="image-clarifier-stage">
                  <img class="image-clarifier-before-img" src="${escapeHtml(clarifier.originalUrl)}" alt="الصورة قبل التوضيح">
                  ${hasResult ? `<div class="image-clarifier-after-layer"><img src="${escapeHtml(clarifier.resultUrl)}" alt="الصورة بعد التوضيح"></div>` : ""}
                  <span class="image-clarifier-label is-before">قبل</span>
                  <span class="image-clarifier-label is-after">بعد</span>
                  ${hasResult ? `<span class="image-clarifier-divider"><i>‹ ›</i></span>` : `<span class="image-clarifier-empty-mark">${imageIcon}</span>`}
                </div>
              ` : `
                <div class="image-clarifier-stage">
                  <span class="image-clarifier-empty-mark">${imageIcon}</span>
                  <p>ارفع صورة لعرض المقارنة هنا</p>
                </div>
              `}
              <footer>
                <span>${icons.lock}</span>
                <p>صورك تُعالج داخل متصفحك ولا يتم رفعها إلى خوادمنا.</p>
              </footer>
            </article>

            <aside class="image-clarifier-meta">
              <h2>معلومات الصورة</h2>
              <dl>
                <div><dt>اسم الملف</dt><dd>${hasImage ? escapeHtml(clarifier.fileName || "-") : "-"}</dd></div>
                <div><dt>الحجم</dt><dd>${hasImage ? escapeHtml(formatImageEnhancerFileSize(clarifier.fileSize)) : "-"}</dd></div>
                <div><dt>الأبعاد</dt><dd>${hasImage ? escapeHtml(`${clarifier.width || 0} × ${clarifier.height || 0}`) : "-"}</dd></div>
                <div><dt>النوع</dt><dd>${hasImage ? escapeHtml(typeLabel) : "-"}</dd></div>
                <div><dt>التوضيح</dt><dd>${escapeHtml(qualityLabels[quality] || "متوسط")}</dd></div>
                <div><dt>الضوضاء</dt><dd>${escapeHtml(noiseLabels[noise] || "متوسط")}</dd></div>
                <div><dt>التباين</dt><dd>${contrastEnabled ? "تشغيل" : "إيقاف"}</dd></div>
              </dl>
              ${hasResult ? `
                <a class="image-clarifier-download" href="${escapeHtml(clarifier.resultUrl)}" download="orlixor-clarified.png">
                  <span>تحميل الصورة المحسنة</span>
                  ${downloadIcon}
                </a>
              ` : `
                <button class="image-clarifier-download is-disabled" type="button" disabled>
                  <span>تحميل الصورة المحسنة</span>
                  ${downloadIcon}
                </button>
                <small>سيظهر الزر بعد المعالجة</small>
              `}
              <button class="image-clarifier-reset" type="button" data-image-clarifier-reset>
                <span>إعادة تعيين</span>
                ${icons.refresh}
              </button>
            </aside>
          </section>
        </div>
      </section>
    `;
  }

  function renderPngToPdfMain() {
    const png = state.pngToPdf || {};
    const hasAccess = hasSubscriberToolsAccess();
    const images = Array.isArray(png.images) ? png.images : [];
    const hasImages = images.length > 0;
    const hasResult = Boolean(png.resultUrl);
    const canConvert = hasAccess && hasImages && !png.loading;
    const pageSize = String(png.pageSize || "A4");
    const orientation = String(png.orientation || "portrait");
    const margin = String(png.margin || "20");
    const fillPage = png.fillPage !== false;
    const totalSize = images.reduce((sum, image) => sum + Number(image.size || 0), 0);
    const pdfIcon = '<svg viewBox="0 0 24 24"><path d="M5 4h9l4 4v8H5Z"/><path d="M14 4v5h5"/><path d="M8 12h5M8 15h3"/><rect x="12" y="11" width="8" height="9" rx="1.4"/><path d="M14 16h4M14 18h2"/></svg>';
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const features = [
      "تحويل PNG إلى PDF بدون فقدان الجودة",
      "دعم تحويل عدة صور دفعة واحدة",
      "ترتيب الصور قبل التحويل",
      "حجم واتجاه وهوامش مرنة",
      "الصور لا تغادر متصفحك"
    ];
    const tips = [
      "استخدم صور عالية الدقة للحصول على أفضل جودة PDF",
      "تأكد من ترتيب الصور قبل التحويل النهائي",
      "يفضل استخدام نفس مقاس الصور للحصول على تنسيق متناسق"
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main png-pdf-main" aria-label="تحويل PNG إلى PDF">
          <div class="png-pdf-page">
            <button class="png-pdf-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="png-pdf-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لتحويل صور PNG إلى PDF داخل المتصفح بدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main png-pdf-main" aria-label="تحويل PNG إلى PDF">
        <div class="png-pdf-page">
          <button class="png-pdf-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="png-pdf-hero">
            <span class="png-pdf-hero-icon" aria-hidden="true">${pdfIcon}</span>
            <div>
              <span class="png-pdf-sparkles" aria-hidden="true">${icons.sparkle}</span>
              <h1>تحويل PNG إلى PDF</h1>
              <p>حوّل صور PNG إلى ملف PDF عالي الجودة بسرعة وخصوصية داخل متصفحك.</p>
            </div>
          </header>

          <section class="png-pdf-top-grid">
            <div class="png-pdf-upload-card">
              <input data-png-pdf-input type="file" accept="image/png" multiple hidden>
              <div class="png-pdf-dropzone ${hasImages ? "has-images" : ""}" data-png-pdf-dropzone>
                <span class="png-pdf-upload-icon" aria-hidden="true">${uploadIcon}</span>
                <h2>${hasImages ? `${images.length.toLocaleString("ar-SA")} صور PNG جاهزة` : "اسحب وأفلت ملفات PNG هنا"}</h2>
                <p>${hasImages ? `الحجم الإجمالي: ${escapeHtml(formatImageEnhancerFileSize(totalSize))}` : "أو انقر لاختيار الصور من جهازك"}</p>
                <button class="png-pdf-primary" type="button" data-png-pdf-choose>
                  <span>اختيار صور PNG</span>
                  ${icons.attach}
                </button>
                <small>PNG فقط · الحد الأقصى 20MB لكل صورة</small>
              </div>
            </div>

            <aside class="png-pdf-info-stack">
              <article class="png-pdf-card">
                <span class="png-pdf-card-icon" aria-hidden="true">${icons.star}</span>
                <h2>ميزات الأداة</h2>
                <ul>
                  ${features.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
              <article class="png-pdf-privacy">
                <span aria-hidden="true">${icons.lock}</span>
                <div>
                  <h2>خصوصيتك تهمنا</h2>
                  <p>جميع الملفات تتم معالجتها داخل متصفحك ولا يتم رفعها إلى خوادمنا.</p>
                </div>
              </article>
            </aside>
          </section>

          <section class="png-pdf-workspace">
            <article class="png-pdf-images-panel">
              <header>
                <h2>الصور المضافة (${images.length.toLocaleString("ar-SA")})</h2>
                <div>
                  <button type="button" data-png-pdf-choose>${icons.plus}<span>إضافة المزيد</span></button>
                  <button type="button" data-png-pdf-reset ${hasImages ? "" : "disabled"}>${icons.delete}<span>حذف الكل</span></button>
                </div>
              </header>
              <div class="png-pdf-images-list ${hasImages ? "" : "is-empty"}">
                ${hasImages ? images.map((image, index) => `
                  <article class="png-pdf-image-item" draggable="true" data-png-pdf-item="${escapeHtml(image.id)}">
                    <img src="${escapeHtml(image.previewUrl)}" alt="${escapeHtml(image.name)}">
                    <div class="png-pdf-image-copy">
                      <strong>${escapeHtml(image.name)}</strong>
                      <small>${escapeHtml(formatImageEnhancerFileSize(image.size))} · ${escapeHtml(`${image.width} × ${image.height}`)}</small>
                    </div>
                    <div class="png-pdf-image-actions">
                      <button type="button" data-png-pdf-move="${escapeHtml(image.id)}" data-direction="up" ${index === 0 ? "disabled" : ""} aria-label="رفع الصورة">↑</button>
                      <button type="button" data-png-pdf-move="${escapeHtml(image.id)}" data-direction="down" ${index === images.length - 1 ? "disabled" : ""} aria-label="إنزال الصورة">↓</button>
                      <button type="button" data-png-pdf-remove="${escapeHtml(image.id)}" aria-label="حذف الصورة">${icons.delete}</button>
                    </div>
                    <span class="png-pdf-drag-handle" aria-hidden="true">⋮⋮</span>
                  </article>
                `).join("") : `
                  <div>
                    <span aria-hidden="true">${pdfIcon}</span>
                    <p>أضف صور PNG لعرضها وترتيبها هنا قبل التحويل.</p>
                  </div>
                `}
              </div>
            </article>

            <aside class="png-pdf-settings">
              <article class="png-pdf-options">
                <h2>خيارات التحويل</h2>
                <label>
                  <span>حجم الصفحة</span>
                  <select data-png-pdf-setting="pageSize">
                    <option value="A4" ${pageSize === "A4" ? "selected" : ""}>A4 (210 × 297 mm)</option>
                    <option value="letter" ${pageSize === "letter" ? "selected" : ""}>Letter</option>
                    <option value="fit" ${pageSize === "fit" ? "selected" : ""}>حسب مقاس الصورة</option>
                  </select>
                </label>
                <label>
                  <span>اتجاه الصفحة</span>
                  <select data-png-pdf-setting="orientation">
                    <option value="portrait" ${orientation === "portrait" ? "selected" : ""}>عمودي</option>
                    <option value="landscape" ${orientation === "landscape" ? "selected" : ""}>أفقي</option>
                  </select>
                </label>
                <label>
                  <span>الهوامش</span>
                  <select data-png-pdf-setting="margin">
                    <option value="0" ${margin === "0" ? "selected" : ""}>بدون هامش</option>
                    <option value="20" ${margin === "20" ? "selected" : ""}>هامش خفيف</option>
                    <option value="40" ${margin === "40" ? "selected" : ""}>هامش متوسط</option>
                  </select>
                </label>
                <label class="png-pdf-toggle">
                  <input type="checkbox" data-png-pdf-fill ${fillPage ? "checked" : ""}>
                  <span>ضبط الصور لملء الصفحة</span>
                </label>
              </article>

              <article class="png-pdf-tips">
                <h2>نصائح للحصول على أفضل نتيجة</h2>
                <ul>
                  ${tips.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>

              ${png.loading || png.status || png.error ? `
                <section class="png-pdf-status ${png.error ? "is-error" : ""}">
                  <p>${escapeHtml(png.error || png.status || "")}</p>
                  ${png.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(png.progress || 0)))}%"></i></span>` : ""}
                </section>
              ` : ""}

              <button class="png-pdf-convert" type="button" data-png-pdf-convert ${canConvert ? "" : "disabled"}>
                ${png.loading ? "جاري التحويل..." : "تحويل إلى PDF"}
                ${pdfIcon}
              </button>
              ${hasResult ? `
                <a class="png-pdf-download" href="${escapeHtml(png.resultUrl)}" download="orlixor-images.pdf">
                  <span>تحميل ملف PDF</span>
                  ${downloadIcon}
                </a>
                <small class="png-pdf-result-size">حجم الملف: ${escapeHtml(formatImageEnhancerFileSize(png.resultSize))}</small>
              ` : `
                <small class="png-pdf-result-size">سيظهر زر التحميل بعد التحويل</small>
              `}
            </aside>
          </section>
        </div>
      </section>
    `;
  }

  function renderPdfToPngMain() {
    const pdfPng = state.pdfToPng || {};
    const hasAccess = hasSubscriberToolsAccess();
    const previews = Array.isArray(pdfPng.previews) ? pdfPng.previews : [];
    const hasPdf = Boolean(pdfPng.pdf);
    const hasResult = Boolean(pdfPng.resultUrl);
    const canConvert = hasAccess && hasPdf && !pdfPng.loading;
    const quality = String(pdfPng.quality || "1.5");
    const pageMode = String(pdfPng.pageMode || "all");
    const pagesCount = Number(pdfPng.pagesCount || pdfPng.pdf?.numPages || 0);
    const selectedPages = hasPdf ? getPdfToPngSelectedPages(pagesCount) : [];
    const displayedSelectedPagesCount = pageMode === "custom" ? selectedPages.length : pagesCount;
    const pdfIcon = '<svg viewBox="0 0 24 24"><path d="M5 4h9l4 4v8H5Z"/><path d="M14 4v5h5"/><path d="M8 13h5"/><rect x="11" y="10" width="9" height="10" rx="1.5"/><path d="m13 17 2-2 1.4 1.4 1.1-1.1 1.5 1.7"/><circle cx="14" cy="13" r=".9"/></svg>';
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const features = [
      "تحويل سريع بجودة عالية",
      "تحويل كل صفحة إلى صورة PNG منفصلة",
      "دعم ملفات PDF متعددة الصفحات",
      "حفظ الصور داخل ملف ZIP جاهز",
      "المعالجة داخل متصفحك"
    ];
    const tips = [
      "استخدم جودة عالية للحصول على صور أوضح عند التكبير",
      "اختر صفحات محددة إذا كان الملف كبيرًا لتسريع التحويل",
      "إذا كان الملف محميًا بكلمة مرور فلن يمكن تحويله داخل المتصفح"
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main png-pdf-main pdf-png-main" aria-label="تحويل PDF إلى PNG">
          <div class="png-pdf-page">
            <button class="png-pdf-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="png-pdf-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لتحويل صفحات PDF إلى صور PNG داخل المتصفح بدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main png-pdf-main pdf-png-main" aria-label="تحويل PDF إلى PNG">
        <div class="png-pdf-page">
          <button class="png-pdf-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="png-pdf-hero">
            <span class="png-pdf-hero-icon" aria-hidden="true">${pdfIcon}</span>
            <div>
              <span class="png-pdf-sparkles" aria-hidden="true">${icons.sparkle}</span>
              <h1>تحويل PDF إلى PNG</h1>
              <p>حوّل صفحات ملف PDF إلى صور PNG عالية الجودة بسهولة وسرعة داخل متصفحك.</p>
            </div>
          </header>

          <section class="png-pdf-top-grid">
            <div class="png-pdf-upload-card">
              <input data-pdf-png-input type="file" accept="application/pdf,.pdf" hidden>
              <div class="png-pdf-dropzone ${hasPdf ? "has-images" : ""}" data-pdf-png-dropzone>
                <span class="png-pdf-upload-icon" aria-hidden="true">${uploadIcon}</span>
                <h2>${hasPdf ? "ملف PDF جاهز للتحويل" : "اسحب وأفلت ملف PDF هنا"}</h2>
                <p>${hasPdf ? `${escapeHtml(pdfPng.fileName || "document.pdf")} · ${escapeHtml(formatImageEnhancerFileSize(pdfPng.fileSize))}` : "أو انقر لاختيار الملف من جهازك"}</p>
                <button class="png-pdf-primary" type="button" data-pdf-png-choose>
                  <span>اختيار ملف PDF</span>
                  ${icons.attach}
                </button>
                <small>PDF فقط · الحد الأقصى 50MB</small>
              </div>
            </div>

            <aside class="png-pdf-info-stack">
              <article class="png-pdf-card">
                <span class="png-pdf-card-icon" aria-hidden="true">${icons.star}</span>
                <h2>ميزات الأداة</h2>
                <ul>
                  ${features.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
              <article class="png-pdf-privacy">
                <span aria-hidden="true">${icons.lock}</span>
                <div>
                  <h2>خصوصيتك تهمنا</h2>
                  <p>جميع الملفات تتم معالجتها داخل متصفحك ولا يتم رفعها إلى خوادمنا.</p>
                </div>
              </article>
            </aside>
          </section>

          <section class="png-pdf-workspace pdf-png-workspace">
            <article class="png-pdf-images-panel pdf-png-file-panel">
              <header>
                <h2>معلومات الملف</h2>
                <div>
                  <button type="button" data-pdf-png-choose>${icons.plus}<span>اختيار ملف آخر</span></button>
                  <button type="button" data-pdf-png-reset ${hasPdf ? "" : "disabled"}>${icons.refresh}<span>إعادة تعيين</span></button>
                </div>
              </header>
              <div class="pdf-png-file-info">
                <span>
                  <b>اسم الملف</b>
                  <small>${hasPdf ? escapeHtml(pdfPng.fileName || "document.pdf") : "-"}</small>
                </span>
                <span>
                  <b>عدد الصفحات</b>
                  <small>${hasPdf ? pagesCount.toLocaleString("ar-SA") : "-"}</small>
                </span>
                <span>
                  <b>الحجم</b>
                  <small>${hasPdf ? escapeHtml(formatImageEnhancerFileSize(pdfPng.fileSize)) : "-"}</small>
                </span>
              </div>

              <h2 class="pdf-png-preview-title">معاينة الصفحات</h2>
              <div class="pdf-png-previews ${previews.length ? "" : "is-empty"}">
                ${previews.length ? previews.map((preview) => `
                  <article class="pdf-png-page-preview">
                    <img src="${escapeHtml(preview.url)}" alt="${escapeHtml(`صفحة ${preview.pageNumber}`)}">
                    <span>صفحة ${Number(preview.pageNumber || 0).toLocaleString("ar-SA")}</span>
                  </article>
                `).join("") : `
                  <div>
                    <span aria-hidden="true">${pdfIcon}</span>
                    <p>ستظهر معاينة الصفحات هنا بعد رفع ملف PDF.</p>
                  </div>
                `}
                ${hasPdf && pagesCount > previews.length ? `
                  <article class="pdf-png-more-pages">
                    <b>+ ${(pagesCount - previews.length).toLocaleString("ar-SA")}</b>
                    <span>صفحات أخرى</span>
                  </article>
                ` : ""}
              </div>
            </article>

            <aside class="png-pdf-settings">
              <article class="png-pdf-options">
                <h2>خيارات التحويل</h2>
                <label>
                  <span>جودة الصورة</span>
                  <select data-pdf-png-quality>
                    <option value="1" ${quality === "1" ? "selected" : ""}>جودة عادية</option>
                    <option value="1.5" ${quality === "1.5" ? "selected" : ""}>جودة عالية</option>
                    <option value="2" ${quality === "2" ? "selected" : ""}>جودة عالية جدًا</option>
                  </select>
                </label>
                <label>
                  <span>صيغة الصورة</span>
                  <select disabled>
                    <option>PNG</option>
                  </select>
                </label>
                <label>
                  <span>الصفحات</span>
                  <select data-pdf-png-page-mode>
                    <option value="all" ${pageMode === "all" ? "selected" : ""}>كل الصفحات</option>
                    <option value="custom" ${pageMode === "custom" ? "selected" : ""}>صفحات محددة</option>
                  </select>
                </label>
                <label class="pdf-png-custom-pages ${pageMode === "custom" ? "" : "is-hidden"}">
                  <span>اكتب الصفحات المطلوبة</span>
                  <input data-pdf-png-custom-pages value="${escapeHtml(pdfPng.customPages || "")}" placeholder="مثال: 1,3,5-8" ${pageMode === "custom" ? "" : "disabled"}>
                </label>
                <small>سيتم إنشاء ملف ZIP يحتوي على جميع الصور الناتجة.</small>
              </article>

              <article class="png-pdf-tips">
                <h2>نصيحة</h2>
                <ul>
                  ${tips.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>

              ${pdfPng.loading || pdfPng.status || pdfPng.error ? `
                <section class="png-pdf-status ${pdfPng.error ? "is-error" : ""}">
                  <p>${escapeHtml(pdfPng.error || pdfPng.status || "")}</p>
                  ${pdfPng.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(pdfPng.progress || 0)))}%"></i></span>` : ""}
                </section>
              ` : ""}

              <button class="png-pdf-convert" type="button" data-pdf-png-convert ${canConvert ? "" : "disabled"}>
                ${pdfPng.loading ? "جاري التحويل..." : "تحويل إلى PNG"}
                ${pdfIcon}
              </button>
              ${hasPdf ? `<small class="png-pdf-result-size">الصفحات المحددة: ${displayedSelectedPagesCount.toLocaleString("ar-SA")}</small>` : ""}
              ${hasResult ? `
                <a class="png-pdf-download" href="${escapeHtml(pdfPng.resultUrl)}" download="orlixor-pdf-pages.zip">
                  <span>تحميل الصور ZIP</span>
                  ${downloadIcon}
                </a>
                <small class="png-pdf-result-size">حجم الملف: ${escapeHtml(formatImageEnhancerFileSize(pdfPng.resultSize))}</small>
              ` : `
                <small class="png-pdf-result-size">سيظهر زر التحميل بعد التحويل</small>
              `}
            </aside>
          </section>
        </div>
      </section>
    `;
  }

  function renderPdfUnlockMain() {
    const unlock = state.pdfUnlock || {};
    const hasAccess = hasSubscriberToolsAccess();
    const hasFile = Boolean(unlock.file);
    const hasResult = Boolean(unlock.resultUrl);
    const canProcess = hasAccess && canRunPdfUnlock();
    const mode = pdfUnlockModes[unlock.mode] ? unlock.mode : "remove";
    const reason = pdfUnlockReasons[unlock.reason] ? unlock.reason : "";
    const pdfIcon = '<svg viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>';
    const lockIcon = '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const features = [
      "إزالة حماية PDF بكلمة المرور الحالية",
      "إعادة تعيين كلمة مرور جديدة",
      "لا توجد محاولات تخمين أو كسر كلمات مرور",
      "معالجة آمنة عبر qpdf على السيرفر",
      "لا يتم حفظ كلمات المرور أو خصم XP"
    ];
    const steps = [
      ["اختر ملف PDF محمي", "قم برفع الملف المحمي بكلمة مرور."],
      ["اختر طريقة الإزالة", "استخدم كلمة المرور الحالية أو مسار نسيان كلمة المرور."],
      ["تأكيد التعهد", "وافق فقط إذا كنت المالك أو لديك تصريح."],
      ["إزالة الحماية", "سيتم إنشاء نسخة جديدة من الملف."],
      ["تحميل الملف", "احصل على PDF غير محمي أو بكلمة مرور جديدة."]
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main png-pdf-main pdf-unlock-main" aria-label="إزالة حماية PDF">
          <div class="png-pdf-page">
            <button class="png-pdf-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="png-pdf-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لإدارة حماية ملفات PDF بدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main png-pdf-main pdf-unlock-main" aria-label="إزالة حماية PDF">
        <div class="png-pdf-page">
          <button class="png-pdf-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="png-pdf-hero pdf-unlock-hero">
            <span class="png-pdf-hero-icon" aria-hidden="true">${lockIcon}</span>
            <div>
              <h1>إزالة حماية PDF</h1>
              <p>إزالة كلمة المرور من ملفات PDF بسهولة وأمان.</p>
            </div>
          </header>

          <section class="pdf-unlock-layout">
            <aside class="pdf-unlock-left">
              <article class="png-pdf-upload-card">
                <input data-pdf-unlock-input type="file" accept="application/pdf,.pdf" hidden>
                <div class="png-pdf-dropzone ${hasFile ? "has-images" : ""}" data-pdf-unlock-dropzone>
                  <span class="png-pdf-upload-icon" aria-hidden="true">${uploadIcon}</span>
                  <h2>${hasFile ? "ملف PDF جاهز" : "اسحب وأفلت ملف PDF هنا"}</h2>
                  <p>${hasFile ? escapeHtml(unlock.fileName || "protected.pdf") : "أو انقر لاختيار الملف من جهازك"}</p>
                  <button class="png-pdf-primary" type="button" data-pdf-unlock-choose>
                    <span>اختيار ملف PDF</span>
                    ${icons.attach}
                  </button>
                  <small>PDF فقط · الحد الأقصى 100MB للملف الواحد</small>
                </div>
              </article>

              <article class="png-pdf-card pdf-unlock-feature-card">
                <span class="png-pdf-card-icon" aria-hidden="true">${icons.lock}</span>
                <h2>مميزات الأداة</h2>
                <ul>
                  ${features.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>

              <article class="png-pdf-tips pdf-unlock-note">
                <h2>نصيحة قانونية</h2>
                <p>تأكد من أنك تملك الملف أو لديك تصريح قانوني قبل إزالة الحماية.</p>
              </article>
            </aside>

            <main class="pdf-unlock-center">
              <article class="pdf-unlock-file-card">
                <header>
                  <h2>الملف المحدد</h2>
                  ${hasFile ? `<button type="button" data-pdf-unlock-reset aria-label="حذف الملف">${icons.delete}</button>` : ""}
                </header>
                <div class="pdf-unlock-file-row ${hasFile ? "" : "is-empty"}">
                  <span aria-hidden="true">${pdfIcon}</span>
                  <div>
                    <strong>${hasFile ? escapeHtml(unlock.fileName || "-") : "لم يتم اختيار ملف بعد"}</strong>
                    <small>${hasFile ? `${escapeHtml(formatImageEnhancerFileSize(unlock.fileSize))} · PDF` : "اختر ملف PDF محمي للبدء"}</small>
                  </div>
                  <b>${hasFile ? "محمي" : "-"}</b>
                </div>
                <p class="pdf-unlock-warning">${icons.warning || "!"} هذه الأداة لا تكسر كلمات المرور ولا تستعيدها. أغلب ملفات PDF المشفرة تحتاج كلمة المرور الحالية.</p>
              </article>

              <article class="pdf-unlock-form-card">
                <h2>اختر طريقة الحماية</h2>
                <div class="pdf-unlock-mode-grid">
                  ${Object.entries(pdfUnlockModes).map(([value, label]) => `
                    <label class="${mode === value ? "is-active" : ""}">
                      <input type="radio" name="pdfUnlockMode" value="${escapeHtml(value)}" data-pdf-unlock-mode ${mode === value ? "checked" : ""}>
                      <span>${escapeHtml(label)}</span>
                      <small>${value === "remove"
                        ? "احذف القفل باستخدام كلمة المرور الحالية."
                        : value === "reset"
                          ? "افتح الملف ثم عيّن كلمة مرور جديدة."
                          : "لا يستخدم التخمين، وقد يفشل بدون كلمة المرور."}</small>
                    </label>
                  `).join("")}
                </div>

                <div class="pdf-unlock-fields">
                  <label class="${mode === "forgot_password_remove" ? "is-muted" : ""}">
                    <span>كلمة المرور الحالية</span>
                    <input data-pdf-unlock-field="currentPassword" type="password" value="${escapeHtml(unlock.currentPassword || "")}" placeholder="أدخل كلمة المرور الحالية" ${mode === "forgot_password_remove" ? "disabled" : ""}>
                  </label>
                  ${mode === "reset" ? `
                    <label>
                      <span>كلمة المرور الجديدة</span>
                      <input data-pdf-unlock-field="newPassword" type="password" value="${escapeHtml(unlock.newPassword || "")}" placeholder="6 أحرف على الأقل">
                    </label>
                  ` : ""}
                </div>

                <div class="pdf-unlock-legal">
                  <h3>اختبار الملكية</h3>
                  <p>هل أنت مالك هذا الملف أو لديك تصريح قانوني لمعالجته؟</p>
                  <div class="pdf-unlock-ownership">
                    <label class="${unlock.ownership === "yes" ? "is-active" : ""}">
                      <input type="radio" name="pdfUnlockOwnership" value="yes" data-pdf-unlock-ownership ${unlock.ownership === "yes" ? "checked" : ""}>
                      <span>نعم، أنا المالك أو لدي تصريح</span>
                    </label>
                    <label class="${unlock.ownership === "no" ? "is-active is-danger" : ""}">
                      <input type="radio" name="pdfUnlockOwnership" value="no" data-pdf-unlock-ownership ${unlock.ownership === "no" ? "checked" : ""}>
                      <span>لا</span>
                    </label>
                  </div>
                  <label>
                    <span>سبب حذف كلمة المرور</span>
                    <select data-pdf-unlock-reason>
                      <option value="">اختر السبب</option>
                      ${Object.entries(pdfUnlockReasons).map(([value, label]) => `<option value="${escapeHtml(value)}" ${reason === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
                    </select>
                  </label>
                  <label class="png-pdf-toggle pdf-unlock-confirm">
                    <input type="checkbox" data-pdf-unlock-legal ${unlock.legalConfirm ? "checked" : ""}>
                    <span>أقر وأتعهد أنني المالك أو لدي تصريح قانوني لمعالجة هذا الملف، وأنني أستخدم الأداة فقط لإدارة ملف أملكه.</span>
                  </label>
                </div>

                ${unlock.loading || unlock.status || unlock.error ? `
                  <section class="png-pdf-status ${unlock.error ? "is-error" : ""}">
                    <p>${escapeHtml(unlock.error || unlock.status || "")}</p>
                    ${unlock.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(unlock.progress || 0)))}%"></i></span>` : ""}
                  </section>
                ` : ""}
              </article>

              <footer class="image-rotator-actions pdf-unlock-actions">
                <button class="image-rotator-reset" type="button" data-pdf-unlock-reset ${hasFile ? "" : "disabled"}>
                  ${icons.refresh}
                  <span>إعادة تعيين</span>
                </button>
                <button class="png-pdf-convert" type="button" data-pdf-unlock-run ${canProcess ? "" : "disabled"}>
                  <span>${unlock.loading ? "جاري المعالجة..." : "إزالة الحماية وحفظ الملف"}</span>
                  ${lockIcon}
                </button>
                ${hasResult ? `
                  <a class="png-pdf-download" href="${escapeHtml(unlock.resultUrl)}" download="${escapeHtml(unlock.resultFileName || "orlixor-unlocked.pdf")}">
                    <span>تحميل الملف</span>
                    ${downloadIcon}
                  </a>
                ` : ""}
              </footer>
              <small class="image-rotator-privacy">${icons.lock} لا يتم حفظ كلمة المرور أو إرسالها لأي API خارجي.</small>
            </main>

            <aside class="pdf-unlock-right">
              <article class="pdf-unlock-steps">
                <h2>خطوات إزالة الحماية</h2>
                ${steps.map(([title, copy], index) => `
                  <div>
                    <span aria-hidden="true">${icons.lock}</span>
                    <b>${(index + 1).toLocaleString("ar-SA")}</b>
                    <strong>${escapeHtml(title)}</strong>
                    <p>${escapeHtml(copy)}</p>
                  </div>
                `).join("")}
              </article>
              <article class="png-pdf-privacy">
                <span aria-hidden="true">${icons.lock}</span>
                <div>
                  <h2>خصوصيتك تهمنا</h2>
                  <p>يتم حذف الملفات المؤقتة بعد المعالجة، ولا يتم تسجيل كلمات المرور.</p>
                </div>
              </article>
            </aside>
          </section>
        </div>
      </section>
    `;
  }

  function renderImageConverterMain() {
    const converter = state.imageConverter || {};
    const hasAccess = hasSubscriberToolsAccess();
    const images = Array.isArray(converter.images) ? converter.images : [];
    const hasImages = images.length > 0;
    const hasResult = Boolean(converter.resultUrl);
    const canConvert = hasAccess && hasImages && !converter.loading;
    const targetFormat = imageConverterFormats[converter.targetFormat] ? converter.targetFormat : "image/jpeg";
    const quality = String(converter.quality || "0.85");
    const resizeMode = String(converter.resizeMode || "original");
    const totalSize = images.reduce((sum, image) => sum + Number(image.size || 0), 0);
    const convertedLabel = imageConverterFormats[targetFormat]?.label || "JPG";
    const imageIcon = '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2.5"/><path d="m7 16 3.2-3.2 2.7 2.7 2.3-2.3L19 17"/><circle cx="9" cy="10" r="1.4"/></svg>';
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const features = [
      "دعم الصيغ الشائعة JPG و PNG و WebP",
      "تحويل عدة صور في وقت واحد",
      "الحفاظ على الجودة الأصلية",
      "سرعة عالية ومعالجة آمنة",
      "معاينة قبل التحويل"
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main png-pdf-main image-converter-main" aria-label="تحويل صيغة الصورة">
          <div class="png-pdf-page">
            <button class="png-pdf-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="png-pdf-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لتحويل صيغ الصور داخل المتصفح بدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main png-pdf-main image-converter-main" aria-label="تحويل صيغة الصورة">
        <div class="png-pdf-page">
          <button class="png-pdf-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="png-pdf-hero">
            <span class="png-pdf-hero-icon" aria-hidden="true">${imageIcon}</span>
            <div>
              <span class="png-pdf-sparkles" aria-hidden="true">${icons.sparkle}</span>
              <h1>تحويل صيغة الصورة</h1>
              <p>حوّل صورك بين صيغ مختلفة بسهولة وسرعة مع الحفاظ على الجودة.</p>
            </div>
          </header>

          <section class="png-pdf-top-grid">
            <div class="png-pdf-upload-card">
              <input data-image-converter-input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
              <div class="png-pdf-dropzone ${hasImages ? "has-images" : ""}" data-image-converter-dropzone>
                <span class="png-pdf-upload-icon" aria-hidden="true">${uploadIcon}</span>
                <h2>${hasImages ? `${images.length.toLocaleString("ar-SA")} صور جاهزة` : "اسحب وأفلت صورك هنا"}</h2>
                <p>${hasImages ? `الحجم الإجمالي: ${escapeHtml(formatImageEnhancerFileSize(totalSize))}` : "أو انقر لاختيار الصور من جهازك"}</p>
                <button class="png-pdf-primary" type="button" data-image-converter-choose>
                  <span>اختيار الصور</span>
                  ${icons.attach}
                </button>
                <small>JPG, PNG, WebP · الحد الأقصى 20MB لكل صورة</small>
              </div>
            </div>

            <aside class="png-pdf-info-stack">
              <article class="png-pdf-card">
                <span class="png-pdf-card-icon" aria-hidden="true">${icons.star}</span>
                <h2>ميزات الأداة</h2>
                <ul>
                  ${features.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
              <article class="png-pdf-privacy">
                <span aria-hidden="true">${icons.lock}</span>
                <div>
                  <h2>خصوصيتك تهمنا</h2>
                  <p>جميع صورك تتم معالجتها داخل متصفحك ولا يتم رفعها إلى خوادمنا.</p>
                </div>
              </article>
            </aside>
          </section>

          <section class="png-pdf-workspace image-converter-workspace">
            <article class="png-pdf-images-panel">
              <header>
                <h2>الصور المضافة (${images.length.toLocaleString("ar-SA")})</h2>
                <div>
                  <button type="button" data-image-converter-choose>${icons.plus}<span>إضافة المزيد</span></button>
                  <button type="button" data-image-converter-reset ${hasImages ? "" : "disabled"}>${icons.delete}<span>حذف الكل</span></button>
                </div>
              </header>
              <div class="png-pdf-images-list image-converter-images-list ${hasImages ? "" : "is-empty"}">
                ${hasImages ? images.map((image) => `
                  <article class="png-pdf-image-item image-converter-image-item">
                    <button class="image-converter-remove" type="button" data-image-converter-remove="${escapeHtml(image.id)}" aria-label="حذف الصورة">×</button>
                    <img src="${escapeHtml(image.previewUrl)}" alt="${escapeHtml(image.name)}">
                    <div class="png-pdf-image-copy">
                      <strong>${escapeHtml(image.name)}</strong>
                      <small>${escapeHtml(formatImageEnhancerFileSize(image.size))}</small>
                      <small>${escapeHtml(`${image.width} × ${image.height}`)}</small>
                    </div>
                    <span class="png-pdf-drag-handle" aria-hidden="true">⋮</span>
                  </article>
                `).join("") : `
                  <div>
                    <span aria-hidden="true">${imageIcon}</span>
                    <p>أضف صور JPG أو PNG أو WebP لمعاينتها هنا قبل التحويل.</p>
                  </div>
                `}
              </div>
              <footer class="image-converter-panel-footer">
                <span>${icons.sparkle}</span>
                <b>${images.length.toLocaleString("ar-SA")} صور جاهزة للتحويل</b>
              </footer>
            </article>

            <aside class="png-pdf-settings">
              <article class="png-pdf-options image-converter-options">
                <h2>خيارات التحويل</h2>
                <label>
                  <span>تحويل إلى</span>
                  <div class="image-converter-format-tabs" role="group" aria-label="صيغة الإخراج">
                    ${Object.entries(imageConverterFormats).map(([format, item]) => `
                      <button class="${format === targetFormat ? "is-active" : ""}" type="button" data-image-converter-format="${escapeHtml(format)}">${escapeHtml(item.label)}</button>
                    `).join("")}
                  </div>
                </label>
                <label>
                  <span>جودة الصورة</span>
                  <select data-image-converter-quality>
                    <option value="0.7" ${quality === "0.7" ? "selected" : ""}>متوسطة</option>
                    <option value="0.85" ${quality === "0.85" ? "selected" : ""}>عالية</option>
                    <option value="0.95" ${quality === "0.95" ? "selected" : ""}>عالية جدًا</option>
                  </select>
                </label>
                <label>
                  <span>الحجم</span>
                  <select data-image-converter-resize>
                    <option value="original" ${resizeMode === "original" ? "selected" : ""}>نفس الحجم الأصلي</option>
                    <option value="small" ${resizeMode === "small" ? "selected" : ""}>تصغير 50%</option>
                    <option value="custom" ${resizeMode === "custom" ? "selected" : ""}>مقاس مخصص</option>
                  </select>
                </label>
                <div class="image-converter-custom-size ${resizeMode === "custom" ? "" : "is-hidden"}">
                  <label>
                    <span>العرض</span>
                    <input data-image-converter-custom="width" type="number" min="1" max="12000" value="${escapeHtml(converter.customWidth || "")}" placeholder="العرض">
                  </label>
                  <label>
                    <span>الارتفاع</span>
                    <input data-image-converter-custom="height" type="number" min="1" max="12000" value="${escapeHtml(converter.customHeight || "")}" placeholder="الارتفاع">
                  </label>
                </div>
                <label class="png-pdf-toggle">
                  <input type="checkbox" data-image-converter-enhance ${converter.enhance ? "checked" : ""}>
                  <span>تحسين بسيط قبل التحويل</span>
                </label>
              </article>

              <article class="png-pdf-tips image-converter-tip">
                <h2>نصيحة</h2>
                <p>للحصول على أفضل جودة، اختر JPG بجودة عالية للصور العادية، وPNG عند الحاجة للشفافية.</p>
              </article>

              ${converter.loading || converter.status || converter.error ? `
                <section class="png-pdf-status ${converter.error ? "is-error" : ""}">
                  <p>${escapeHtml(converter.error || converter.status || "")}</p>
                  ${converter.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(converter.progress || 0)))}%"></i></span>` : ""}
                </section>
              ` : ""}

              <button class="png-pdf-convert" type="button" data-image-converter-convert ${canConvert ? "" : "disabled"}>
                ${converter.loading ? "جاري التحويل..." : `تحويل الصور (${images.length.toLocaleString("ar-SA")})`}
                ${icons.sparkle}
              </button>
              ${hasResult ? `
                <a class="png-pdf-download" href="${escapeHtml(converter.resultUrl)}" download="${escapeHtml(converter.resultFileName || "orlixor-converted-image.jpg")}">
                  <span>${images.length > 1 ? "تحميل ZIP" : `تحميل ${escapeHtml(convertedLabel)}`}</span>
                  ${downloadIcon}
                </a>
                <small class="png-pdf-result-size">حجم الملف: ${escapeHtml(formatImageEnhancerFileSize(converter.resultSize))}</small>
              ` : `
                <small class="png-pdf-result-size">سيتم تحويل الصور وتحميلها كاملة عند الضغط على التحويل</small>
              `}
            </aside>
          </section>
        </div>
      </section>
    `;
  }

  function renderImageCompressorMain() {
    const compressor = state.imageCompressor || {};
    const hasAccess = hasSubscriberToolsAccess();
    const images = Array.isArray(compressor.images) ? compressor.images : [];
    const hasImages = images.length > 0;
    const hasResult = Boolean(compressor.resultUrl);
    const canCompress = hasAccess && hasImages && !compressor.loading;
    const totalSize = images.reduce((sum, image) => sum + Number(image.size || 0), 0);
    const compressionLevel = Math.max(40, Math.min(95, Number(compressor.compressionLevel || 70)));
    const outputFormat = imageCompressorFormats[compressor.outputFormat] ? compressor.outputFormat : "original";
    const comparison = compressor.comparison || null;
    const previewImage = images[0] || null;
    const beforeSize = comparison ? comparison.originalSize : totalSize;
    const afterSize = comparison ? comparison.compressedSize : compressor.compressedTotal;
    const savedBytes = comparison ? comparison.savedBytes : compressor.savedBytes;
    const savedPercent = comparison ? comparison.savedPercent : compressor.savedPercent;
    const zoom = Math.round(Number(compressor.zoom || 1) * 100);
    const compressIcon = '<svg viewBox="0 0 24 24"><path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/><path d="M3 9l6-6M21 9l-6-6M3 15l6 6M21 15l-6 6"/></svg>';
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const expandIcon = '<svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>';
    const features = [
      "تقليل حجم الصور مع الحفاظ على الجودة قدر الإمكان",
      "دعم جميع الصيغ الشائعة JPG و PNG و WebP",
      "ضغط عدة صور وتحميلها في ملف ZIP",
      "معالجة سريعة وآمنة داخل المتصفح",
      "مقارنة مباشرة قبل وبعد الضغط"
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main png-pdf-main image-compressor-main" aria-label="ضغط الصور">
          <div class="png-pdf-page">
            <button class="png-pdf-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="png-pdf-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لضغط الصور داخل المتصفح بدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main png-pdf-main image-compressor-main" aria-label="ضغط الصور">
        <div class="png-pdf-page">
          <button class="png-pdf-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="png-pdf-hero image-compressor-hero">
            <span class="png-pdf-hero-icon" aria-hidden="true">${compressIcon}</span>
            <div>
              <h1>ضغط الصور</h1>
              <p>تقليل حجم الصور مع الحفاظ على الجودة قدر الإمكان.</p>
            </div>
          </header>

          <section class="image-compressor-layout">
            <aside class="image-compressor-left">
              <article class="png-pdf-upload-card">
                <input data-image-compressor-input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
                <div class="png-pdf-dropzone ${hasImages ? "has-images" : ""}" data-image-compressor-dropzone>
                  <span class="png-pdf-upload-icon" aria-hidden="true">${uploadIcon}</span>
                  <h2>${hasImages ? `${images.length.toLocaleString("ar-SA")} صور جاهزة` : "اسحب وأفلت صورك هنا"}</h2>
                  <p>${hasImages ? `الحجم الإجمالي: ${escapeHtml(formatImageEnhancerFileSize(totalSize))}` : "أو انقر لاختيار الصور من جهازك"}</p>
                  <button class="png-pdf-primary" type="button" data-image-compressor-choose>
                    <span>اختيار الصور</span>
                    ${icons.attach}
                  </button>
                  <small>JPG, PNG, WebP · الحد الأقصى 20MB لكل صورة</small>
                </div>
              </article>

              <article class="png-pdf-options image-compressor-options">
                <h2>خيارات الضغط ${icons.settings}</h2>
                <label class="image-compressor-range">
                  <span>مستوى الضغط</span>
                  <b>${compressionLevel.toLocaleString("ar-SA")}%</b>
                  <input data-image-compressor-level type="range" min="40" max="95" value="${compressionLevel}">
                  <small><span>أقل حجم</span><span>أفضل جودة</span></small>
                </label>
                <label>
                  <span>نوع الملف</span>
                  <select data-image-compressor-format>
                    ${Object.entries(imageCompressorFormats).map(([format, item]) => `
                      <option value="${escapeHtml(format)}" ${format === outputFormat ? "selected" : ""}>${escapeHtml(item.label)}</option>
                    `).join("")}
                  </select>
                </label>
                <label class="png-pdf-toggle">
                  <input type="checkbox" data-image-compressor-resize ${compressor.resizeEnabled ? "checked" : ""}>
                  <span>تقليل أبعاد الصورة</span>
                </label>
                <div class="image-compressor-custom-size ${compressor.resizeEnabled ? "" : "is-disabled"}">
                  <input data-image-compressor-size="width" type="number" min="1" max="12000" value="${escapeHtml(compressor.maxWidth || "")}" placeholder="العرض">
                  <span>px</span>
                  <input data-image-compressor-size="height" type="number" min="1" max="12000" value="${escapeHtml(compressor.maxHeight || "")}" placeholder="الارتفاع">
                  <span>px</span>
                </div>
                <label class="png-pdf-toggle">
                  <input type="checkbox" data-image-compressor-enhance ${compressor.enhance ? "checked" : ""}>
                  <span>تحسين بسيط بعد الضغط</span>
                </label>
              </article>
            </aside>

            <main class="image-compressor-center">
              <article class="image-rotator-preview-card image-compressor-preview-card">
                <header>
                  <h2>معاينة المقارنة</h2>
                  <div class="image-rotator-zoom">
                    <button type="button" data-image-compressor-zoom="-0.1" aria-label="تصغير">${icons.minus || "−"}</button>
                    <b>${zoom.toLocaleString("ar-SA")}%</b>
                    <button type="button" data-image-compressor-zoom="0.1" aria-label="تكبير">${icons.plus}</button>
                    <span aria-hidden="true">${expandIcon}</span>
                  </div>
                </header>
                <div class="image-compressor-compare-frame ${previewImage ? "" : "is-empty"}">
                  ${comparison && compressor.comparisonUrl ? `
                    <div class="image-compressor-compare" style="transform: scale(${Number(compressor.zoom || 1).toFixed(2)});">
                      <img src="${escapeHtml(comparison.originalUrl)}" alt="قبل الضغط">
                      <img src="${escapeHtml(compressor.comparisonUrl)}" alt="بعد الضغط">
                      <span class="is-before">قبل الضغط<br>${escapeHtml(formatImageEnhancerFileSize(comparison.originalSize))}</span>
                      <span class="is-after">بعد الضغط<br>${escapeHtml(formatImageEnhancerFileSize(comparison.compressedSize))}</span>
                      <i aria-hidden="true">↔</i>
                    </div>
                  ` : previewImage ? `
                    <div class="image-compressor-single-preview" style="transform: scale(${Number(compressor.zoom || 1).toFixed(2)});">
                      <img src="${escapeHtml(previewImage.previewUrl)}" alt="${escapeHtml(previewImage.name)}">
                      <span>قبل الضغط<br>${escapeHtml(formatImageEnhancerFileSize(previewImage.size))}</span>
                    </div>
                  ` : `
                    <div>
                      <span aria-hidden="true">${compressIcon}</span>
                      <p>أضف صورة لعرض المقارنة قبل وبعد الضغط هنا.</p>
                    </div>
                  `}
                </div>
                <dl class="image-compressor-stats">
                  <div><dt>الملف الأصلي</dt><dd>${beforeSize ? escapeHtml(formatImageEnhancerFileSize(beforeSize)) : "-"}</dd></div>
                  <div><dt>بعد الضغط</dt><dd>${afterSize ? escapeHtml(formatImageEnhancerFileSize(afterSize)) : "-"}</dd></div>
                  <div><dt>التوفير</dt><dd>${savedBytes ? `${escapeHtml(formatImageEnhancerFileSize(savedBytes))} (${savedPercent.toLocaleString("ar-SA")}%)` : "-"}</dd></div>
                </dl>
                <article class="png-pdf-tips image-compressor-note">
                  <h2>نصيحة</h2>
                  <p>كلما زاد مستوى الضغط قل حجم الملف. قد تظهر تغيّرات بسيطة في تفاصيل الجودة.</p>
                </article>
              </article>

              ${compressor.loading || compressor.status || compressor.error ? `
                <section class="png-pdf-status image-compressor-status ${compressor.error ? "is-error" : ""}">
                  <p>${escapeHtml(compressor.error || compressor.status || "")}</p>
                  ${compressor.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(compressor.progress || 0)))}%"></i></span>` : ""}
                </section>
              ` : ""}

              <footer class="image-rotator-actions image-compressor-actions">
                <button class="image-rotator-reset" type="button" data-image-compressor-reset ${hasImages ? "" : "disabled"}>
                  ${icons.refresh}
                  <span>إعادة تعيين</span>
                </button>
                <button class="png-pdf-convert" type="button" data-image-compressor-run ${canCompress ? "" : "disabled"}>
                  <span>${compressor.loading ? "جاري الضغط..." : `ضغط الصور (${images.length.toLocaleString("ar-SA")})`}</span>
                  ${compressIcon}
                </button>
                ${hasResult ? `
                  <a class="png-pdf-download" href="${escapeHtml(compressor.resultUrl)}" download="${escapeHtml(compressor.resultFileName || "orlixor-compressed-image.jpg")}">
                    <span>${images.length > 1 ? "تحميل ZIP" : "تحميل الصورة"}</span>
                    ${downloadIcon}
                  </a>
                ` : ""}
              </footer>
              <small class="image-rotator-privacy">${icons.lock} صورك تُعالج داخل متصفحك ولا يتم رفعها إلى خوادمنا.</small>
            </main>

            <aside class="image-compressor-right">
              <article class="png-pdf-images-panel image-compressor-list-panel">
                <header>
                  <h2>الصور المضافة (${images.length.toLocaleString("ar-SA")})</h2>
                  <button type="button" data-image-compressor-reset ${hasImages ? "" : "disabled"}>${icons.delete}<span>حذف الكل</span></button>
                </header>
                <div class="image-compressor-list ${hasImages ? "" : "is-empty"}">
                  ${hasImages ? images.map((image) => `
                    <article class="image-compressor-item">
                      <img src="${escapeHtml(image.previewUrl)}" alt="${escapeHtml(image.name)}">
                      <div>
                        <strong>${escapeHtml(image.name)}</strong>
                        <small>${escapeHtml(formatImageEnhancerFileSize(image.size))}</small>
                        <small>${escapeHtml(`${image.width} × ${image.height}`)}</small>
                      </div>
                      <button type="button" data-image-compressor-remove="${escapeHtml(image.id)}" aria-label="حذف الصورة">×</button>
                    </article>
                  `).join("") : `
                    <div>
                      <span aria-hidden="true">${compressIcon}</span>
                      <p>ستظهر الصور المختارة هنا.</p>
                    </div>
                  `}
                </div>
              </article>

              <article class="png-pdf-card image-compressor-features">
                <span class="png-pdf-card-icon" aria-hidden="true">${icons.lock}</span>
                <h2>مميزات الأداة</h2>
                <ul>
                  ${features.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
            </aside>
          </section>
        </div>
      </section>
    `;
  }

  function renderImageRotatorMain() {
    const rotator = state.imageRotator || {};
    const hasAccess = hasSubscriberToolsAccess();
    const hasImage = Boolean(rotator.bitmap && rotator.previewUrl);
    const hasResult = Boolean(rotator.resultUrl);
    const canExport = hasAccess && hasImage && !rotator.loading;
    const angle = normalizeImageRotatorAngle(rotator.angle || 0);
    const customAngle = String(rotator.customAngle ?? angle);
    const fileTypeLabel = imageConverterFormats[rotator.fileType]?.label || (rotator.fileType ? rotator.fileType.replace("image/", "").toUpperCase() : "-");
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const rotateIcon = '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v6h-6"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const expandIcon = '<svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>';
    const tips = [
      "يمكنك تدوير الصورة بزوايا جاهزة",
      "تثبيت الأبعاد يحافظ على تنسيق مناسب",
      "جميع العمليات تتم داخل متصفحك",
      "مناسب لجميع أنواع الصور"
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main png-pdf-main image-rotator-main" aria-label="تدوير الصورة">
          <div class="png-pdf-page">
            <button class="png-pdf-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="png-pdf-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لتدوير الصور داخل المتصفح بدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main png-pdf-main image-rotator-main" aria-label="تدوير الصورة">
        <div class="png-pdf-page">
          <button class="png-pdf-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="png-pdf-hero image-rotator-hero">
            <span class="png-pdf-hero-icon" aria-hidden="true">${rotateIcon}</span>
            <div>
              <h1>تدوير الصورة</h1>
              <p>دوّر الصور إلى أي اتجاه بسهولة وسرعة مع حفظ الجودة الأصلية.</p>
            </div>
          </header>

          <section class="image-rotator-layout">
            <aside class="image-rotator-left">
              <article class="png-pdf-upload-card">
                <input data-image-rotator-input type="file" accept="image/png,image/jpeg,image/webp" hidden>
                <div class="png-pdf-dropzone ${hasImage ? "has-images" : ""}" data-image-rotator-dropzone>
                  <span class="png-pdf-upload-icon" aria-hidden="true">${uploadIcon}</span>
                  <h2>${hasImage ? "صورتك جاهزة للتدوير" : "اسحب وأفلت صورتك هنا"}</h2>
                  <p>${hasImage ? escapeHtml(rotator.fileName || "image") : "أو انقر لاختيار صورة من جهازك"}</p>
                  <button class="png-pdf-primary" type="button" data-image-rotator-choose>
                    <span>اختيار صورة</span>
                    ${icons.attach}
                  </button>
                  <small>JPG, PNG, WebP · الحد الأقصى 20MB لكل صورة</small>
                </div>
              </article>

              <article class="png-pdf-card image-rotator-tips">
                <span class="png-pdf-card-icon" aria-hidden="true">${icons.sparkle}</span>
                <h2>نصائح</h2>
                <ul>
                  ${tips.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
            </aside>

            <article class="image-rotator-preview-card">
              <header>
                <h2>معاينة الصورة</h2>
                <div class="image-rotator-zoom" aria-hidden="true">
                  <span>${icons.search}</span>
                  <b>100%</b>
                  <span>${icons.search}</span>
                  <span>${expandIcon}</span>
                </div>
              </header>
              <div class="image-rotator-preview-frame ${hasImage ? "" : "is-empty"}">
                ${hasImage ? `
                  <img src="${escapeHtml(rotator.previewUrl)}" alt="${escapeHtml(rotator.fileName || "الصورة")}">
                ` : `
                  <div>
                    <span aria-hidden="true">${rotateIcon}</span>
                    <p>ارفع صورة لعرض المعاينة هنا.</p>
                  </div>
                `}
              </div>
              <dl class="image-rotator-info-row">
                <div><dt>اسم الملف</dt><dd>${hasImage ? escapeHtml(rotator.fileName || "-") : "-"}</dd></div>
                <div><dt>الحجم</dt><dd>${hasImage ? escapeHtml(formatImageEnhancerFileSize(rotator.fileSize)) : "-"}</dd></div>
                <div><dt>الأبعاد</dt><dd>${hasImage ? escapeHtml(`${rotator.outputWidth || rotator.width} × ${rotator.outputHeight || rotator.height}`) : "-"}</dd></div>
                <div><dt>النوع</dt><dd>${escapeHtml(fileTypeLabel)}</dd></div>
              </dl>
            </article>

            <aside class="image-rotator-options">
              <article class="png-pdf-options">
                <h2>خيارات التدوير ${icons.settings}</h2>
                <span class="image-rotator-angle-badge">الزاوية الحالية: ${angle.toLocaleString("ar-SA")}°</span>
                <button type="button" data-image-rotator-rotate="90">${rotateIcon}<span>90° مع عقارب الساعة</span></button>
                <button type="button" data-image-rotator-rotate="-90">${rotateIcon}<span>90° عكس عقارب الساعة</span></button>
                <button type="button" data-image-rotator-rotate="180">${rotateIcon}<span>180° قلب الصورة</span></button>
                <button type="button" data-image-rotator-rotate="270">${rotateIcon}<span>270° عكس عقارب الساعة</span></button>
                <label class="image-rotator-custom-angle">
                  <span>تدوير مخصص</span>
                  <div>
                    <input data-image-rotator-custom-angle type="number" min="0" max="359" value="${escapeHtml(customAngle)}" placeholder="0">
                    <button type="button" data-image-rotator-apply-custom>تطبيق</button>
                  </div>
                  <small>أدخل قيمة بين 0 و 359</small>
                </label>
                <label class="png-pdf-toggle">
                  <input type="checkbox" data-image-rotator-keep-size ${rotator.keepSize !== false ? "checked" : ""}>
                  <span>تثبيت الأبعاد</span>
                </label>
                <label class="png-pdf-toggle">
                  <input type="checkbox" data-image-rotator-enhance ${rotator.enhance ? "checked" : ""}>
                  <span>تحسين بسيط بعد التدوير</span>
                </label>
              </article>
            </aside>
          </section>

          ${rotator.loading || rotator.status || rotator.error ? `
            <section class="png-pdf-status image-rotator-status ${rotator.error ? "is-error" : ""}">
              <p>${escapeHtml(rotator.error || rotator.status || "")}</p>
              ${rotator.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(rotator.progress || 0)))}%"></i></span>` : ""}
            </section>
          ` : ""}

          <footer class="image-rotator-actions">
            <button class="image-rotator-reset" type="button" data-image-rotator-reset ${hasImage ? "" : "disabled"}>
              ${icons.refresh}
              <span>إعادة تعيين</span>
            </button>
            <button class="png-pdf-convert" type="button" data-image-rotator-export ${canExport ? "" : "disabled"}>
              <span>تدوير الصورة</span>
              ${rotateIcon}
            </button>
            ${hasResult ? `
              <a class="png-pdf-download" href="${escapeHtml(rotator.resultUrl)}" download="${escapeHtml(rotator.resultFileName || "orlixor-rotated.png")}">
                <span>تحميل الصورة</span>
                ${downloadIcon}
              </a>
            ` : ""}
          </footer>
          <small class="image-rotator-privacy">${icons.lock} صورك تُعالج داخل متصفحك ولا يتم رفعها إلى خوادمنا.</small>
        </div>
      </section>
    `;
  }

  function renderImageCropperMain() {
    const cropper = state.imageCropper || {};
    const hasAccess = hasSubscriberToolsAccess();
    const hasImage = Boolean(cropper.bitmap);
    const hasResult = Boolean(cropper.resultUrl);
    const canExport = hasAccess && hasImage && !cropper.loading;
    const crop = hasImage ? normalizeImageCropperCrop() : { cropX: 0, cropY: 0, cropWidth: 0, cropHeight: 0 };
    const zoom = Math.round(Number(cropper.zoom || 1) * 100);
    const fileTypeLabel = imageConverterFormats[cropper.fileType]?.label || (cropper.fileType ? cropper.fileType.replace("image/", "").toUpperCase() : "-");
    const cropIcon = '<svg viewBox="0 0 24 24"><path d="M6 3v13a2 2 0 0 0 2 2h13"/><path d="M3 6h13a2 2 0 0 1 2 2v13"/><path d="M9 9h6v6H9z"/></svg>';
    const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M12 16V7"/><path d="m8.5 10.5 3.5-3.5 3.5 3.5"/><path d="M20 16.5a4.5 4.5 0 0 1-4.5 4.5h-7A5.5 5.5 0 0 1 8 10.02 6 6 0 0 1 19.74 12"/></svg>';
    const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M5 21h14"/></svg>';
    const expandIcon = '<svg viewBox="0 0 24 24"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>';
    const tips = [
      "اسحب مربع القص أو استخدم أزرار التحريك",
      "اختر نسبة جاهزة للحصول على مقاس مضبوط",
      "يمكن إدخال عرض وارتفاع مخصصين",
      "صورك لا تغادر متصفحك"
    ];
    const ratios = [
      ["free", "حرة"],
      ["1:1", "1:1"],
      ["4:3", "4:3"],
      ["16:9", "16:9"],
      ["3:2", "3:2"]
    ];
    const moveButtons = [
      ["-1,-1", "↖"], ["0,-1", "↑"], ["1,-1", "↗"],
      ["-1,0", "←"], ["0,0", "⌾"], ["1,0", "→"],
      ["-1,1", "↙"], ["0,1", "↓"], ["1,1", "↘"]
    ];

    if (!hasAccess) {
      return `
        <section class="guest-main tools-main png-pdf-main image-cropper-main" aria-label="قص الصورة">
          <div class="png-pdf-page">
            <button class="png-pdf-back" type="button" data-open-free-tools>
              <span aria-hidden="true">←</span>
              <b>العودة للأدوات</b>
            </button>
            <section class="png-pdf-locked">
              <span aria-hidden="true">${icons.lock}</span>
              <h1>هذه الأداة متاحة للمشتركين فقط</h1>
              <p>فعّل باقة شرارة أو طويق أو الرائد لقص الصور داخل المتصفح بدون XP.</p>
              <button type="button" data-open-upgrade>عرض الباقات</button>
            </section>
          </div>
        </section>
      `;
    }

    return `
      <section class="guest-main tools-main png-pdf-main image-cropper-main" aria-label="قص الصورة">
        <div class="png-pdf-page">
          <button class="png-pdf-back" type="button" data-open-free-tools>
            <span aria-hidden="true">←</span>
            <b>العودة للأدوات</b>
          </button>

          <header class="png-pdf-hero image-rotator-hero">
            <span class="png-pdf-hero-icon" aria-hidden="true">${cropIcon}</span>
            <div>
              <h1>قص الصورة</h1>
              <p>قص وتحديد الجزء المطلوب من الصورة بسهولة.</p>
            </div>
          </header>

          <section class="image-rotator-layout image-cropper-layout">
            <aside class="image-rotator-left">
              <article class="png-pdf-upload-card">
                <input data-image-cropper-input type="file" accept="image/png,image/jpeg,image/webp" hidden>
                <div class="png-pdf-dropzone ${hasImage ? "has-images" : ""}" data-image-cropper-dropzone>
                  <span class="png-pdf-upload-icon" aria-hidden="true">${uploadIcon}</span>
                  <h2>${hasImage ? "صورتك جاهزة للقص" : "اسحب وأفلت صورتك هنا"}</h2>
                  <p>${hasImage ? escapeHtml(cropper.fileName || "image") : "أو انقر لاختيار صورة من جهازك"}</p>
                  <button class="png-pdf-primary" type="button" data-image-cropper-choose>
                    <span>اختيار صورة</span>
                    ${icons.attach}
                  </button>
                  <small>JPG, PNG, WebP · الحد الأقصى 20MB لكل صورة</small>
                </div>
              </article>

              <article class="png-pdf-card image-cropper-info">
                <span class="png-pdf-card-icon" aria-hidden="true">${icons.document}</span>
                <h2>معلومات الصورة</h2>
                <dl>
                  <div><dt>اسم الملف</dt><dd>${hasImage ? escapeHtml(cropper.fileName || "-") : "-"}</dd></div>
                  <div><dt>النوع</dt><dd>${escapeHtml(fileTypeLabel)}</dd></div>
                  <div><dt>الحجم</dt><dd>${hasImage ? escapeHtml(formatImageEnhancerFileSize(cropper.fileSize)) : "-"}</dd></div>
                  <div><dt>الأبعاد</dt><dd>${hasImage ? escapeHtml(`${cropper.width} × ${cropper.height}`) : "-"}</dd></div>
                </dl>
              </article>

              <article class="png-pdf-card image-rotator-tips image-cropper-tip-card">
                <span class="png-pdf-card-icon" aria-hidden="true">${icons.sparkle}</span>
                <h2>نصيحة</h2>
                <ul>
                  ${tips.map((item) => `<li>${icons.sparkle}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
            </aside>

            <article class="image-rotator-preview-card image-cropper-preview-card">
              <header>
                <h2>معاينة الصورة</h2>
                <div class="image-rotator-zoom">
                  <button type="button" data-image-cropper-zoom="-0.1" aria-label="تصغير">${icons.search}</button>
                  <b>${zoom.toLocaleString("ar-SA")}%</b>
                  <button type="button" data-image-cropper-zoom="0.1" aria-label="تكبير">${icons.plus}</button>
                  <span aria-hidden="true">${expandIcon}</span>
                </div>
              </header>
              <div class="image-cropper-canvas-frame ${hasImage ? "" : "is-empty"}">
                ${hasImage ? `
                  <canvas data-image-cropper-canvas style="transform: scale(${Number(cropper.zoom || 1).toFixed(2)});"></canvas>
                ` : `
                  <div>
                    <span aria-hidden="true">${cropIcon}</span>
                    <p>ارفع صورة لعرض منطقة القص هنا.</p>
                  </div>
                `}
              </div>
              <dl class="image-rotator-info-row image-cropper-output-row">
                <div><dt>أبعاد الجزء المحدد</dt><dd>${hasImage ? escapeHtml(`${crop.cropWidth} × ${crop.cropHeight}`) : "-"}</dd></div>
                <div><dt>العرض</dt><dd>${hasImage ? crop.cropWidth.toLocaleString("ar-SA") : "-"}</dd></div>
                <div><dt>الارتفاع</dt><dd>${hasImage ? crop.cropHeight.toLocaleString("ar-SA") : "-"}</dd></div>
                <div><dt>النسبة</dt><dd>${escapeHtml(cropper.aspectRatio === "free" ? "حرة" : cropper.aspectRatio || "حرة")}</dd></div>
              </dl>
            </article>

            <aside class="image-rotator-options image-cropper-options">
              <article class="png-pdf-options">
                <h2>خيارات القص ${icons.settings}</h2>
                <label>
                  <span>نسبة الأبعاد</span>
                  <div class="image-cropper-ratio-grid">
                    ${ratios.map(([value, label]) => `
                      <button class="${(cropper.aspectRatio || "free") === value ? "is-active" : ""}" type="button" data-image-cropper-ratio="${escapeHtml(value)}">
                        <span>${escapeHtml(label)}</span>
                      </button>
                    `).join("")}
                  </div>
                </label>
                <label>
                  <span>أبعاد مخصصة</span>
                  <div class="image-cropper-custom-size">
                    <input data-image-cropper-size="width" type="number" min="1" max="${hasImage ? cropper.width : 12000}" value="${escapeHtml(cropper.customWidth || "")}" placeholder="العرض (px)">
                    <input data-image-cropper-size="height" type="number" min="1" max="${hasImage ? cropper.height : 12000}" value="${escapeHtml(cropper.customHeight || "")}" placeholder="الارتفاع (px)">
                  </div>
                </label>
                <label>
                  <span>موقع القص</span>
                  <div class="image-cropper-move-grid">
                    ${moveButtons.map(([value, label]) => `<button type="button" data-image-cropper-move="${escapeHtml(value)}">${escapeHtml(label)}</button>`).join("")}
                  </div>
                </label>
                <label>
                  <span>تدوير الصورة</span>
                  <div class="image-cropper-rotate-row">
                    <button type="button" data-image-cropper-rotate="-90">90°</button>
                    <button type="button" data-image-cropper-rotate="90">90°</button>
                  </div>
                </label>
                <label class="png-pdf-toggle">
                  <input type="checkbox" data-image-cropper-enhance ${cropper.enhance ? "checked" : ""}>
                  <span>تحسين بسيط بعد القص</span>
                </label>
              </article>
            </aside>
          </section>

          ${cropper.loading || cropper.status || cropper.error ? `
            <section class="png-pdf-status image-rotator-status ${cropper.error ? "is-error" : ""}">
              <p>${escapeHtml(cropper.error || cropper.status || "")}</p>
              ${cropper.loading ? `<span><i style="width:${Math.max(8, Math.min(100, Number(cropper.progress || 0)))}%"></i></span>` : ""}
            </section>
          ` : ""}

          <footer class="image-rotator-actions image-cropper-actions">
            <button class="image-rotator-reset" type="button" data-image-cropper-reset ${hasImage ? "" : "disabled"}>
              ${icons.refresh}
              <span>إعادة تعيين</span>
            </button>
            <button class="png-pdf-convert" type="button" data-image-cropper-export ${canExport ? "" : "disabled"}>
              <span>قص الصورة وحفظها</span>
              ${downloadIcon}
            </button>
            ${hasResult ? `
              <a class="png-pdf-download" href="${escapeHtml(cropper.resultUrl)}" download="${escapeHtml(cropper.resultFileName || "orlixor-cropped.png")}">
                <span>تحميل الصورة</span>
                ${downloadIcon}
              </a>
            ` : ""}
          </footer>
          <small class="image-rotator-privacy">${icons.lock} صورك تتم معالجتها داخل متصفحك ولا يتم رفعها إلى خوادمنا.</small>
        </div>
      </section>
    `;
  }

  function renderOpenAiWebSearchV2Main(profile) {
    const smart = state.openAiWebSearchV2 || {};
    const result = smart.result || null;
    const sources = Array.isArray(result?.sources) ? result.sources.slice(0, 5) : [];
    const suggestions = [
      "ما هي فوائد الذكاء الاصطناعي في التعليم؟",
      "تطورات سوق الأسهم السعودي 2024",
      "أفضل طرق إدارة الوقت",
      "آخر أخبار الاقتصاد العالمي اليوم",
      "شرح مبسط لتقنية البلوك تشين",
      "ما هي مصادر الطاقة المتجددة؟"
    ];

    return `
      <section class="guest-main tools-main smart-search-main" aria-label="البحث الذكي">
        <header class="guest-main-topbar tools-main-topbar">
          ${renderModelSwitcher()}
          ${renderHomeTopActions()}
        </header>

        <div class="smart-search-page">
          <button class="smart-search-back" type="button" data-tools-back>
            <span aria-hidden="true">←</span>
            <span>العودة إلى الأدوات</span>
          </button>

          <header class="smart-search-hero">
            <div class="smart-search-title">
              <h1>البحث الذكي</h1>
              <span aria-hidden="true">${icons.search}</span>
            </div>
            <p>ابحث عن معلومات دقيقة من مصادر موثوقة خلال ثواني</p>
          </header>

          <section class="smart-search-layout">
            <form class="smart-search-box" data-smart-search-form>
              <label class="smart-search-query">
                <span aria-hidden="true">${icons.search}</span>
                <input
                  type="search"
                  value="${escapeHtml(smart.query || "")}"
                  placeholder="اكتب سؤالك هنا..."
                  data-smart-search-query
                  autocomplete="off"
                >
              </label>
              <p class="smart-search-example">مثال: ما هي أحدث التطورات في الذكاء الاصطناعي؟</p>

              <div class="smart-search-controls">
                <label>
                  <select data-smart-search-source>
                    ${[
                      ["all", "كل المصادر"],
                      ["news", "أخبار"],
                      ["academic", "أكاديمي"],
                      ["tech", "تقني"]
                    ].map(([value, label]) => `
                      <option value="${value}" ${smart.sourceType === value ? "selected" : ""}>${label}</option>
                    `).join("")}
                  </select>
                  <span>${icons.internet}</span>
                </label>
                <label>
                  <select data-smart-search-language>
                    ${["العربية", "English"].map((item) => `
                      <option value="${escapeHtml(item)}" ${smart.language === item ? "selected" : ""}>اللغة: ${escapeHtml(item)}</option>
                    `).join("")}
                  </select>
                  <span>文</span>
                </label>
                <button class="smart-search-submit ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-smart-search-submit ${smart.loading ? "disabled" : ""}>
                  <span>${smart.loading ? "جاري البحث..." : "بحث ذكي"}</span>
                  ${icons.sparkle}
                </button>
              </div>
            </form>

            <aside class="smart-search-info">
              <h2>حول البحث الذكي</h2>
              <p>يستخدم البحث الذكي مصادر موثوقة وحديثة ويقدم معلومات دقيقة مع روابط للمصادر.</p>
              ${[
                "نتائج دقيقة وسريعة",
                "مصادر موثوقة وحديثة",
                "روابط للمراجع والمصادر",
                "تلخيص ذكي للمعلومات"
              ].map((item) => `
                <span><b>✓</b>${escapeHtml(item)}</span>
              `).join("")}
            </aside>
          </section>

          ${smart.error ? `
            <section class="smart-search-result is-error">
              <strong>تعذر تنفيذ البحث</strong>
              <p>${escapeHtml(smart.error)}</p>
            </section>
          ` : ""}

          ${result ? `
            <section class="smart-search-result">
              <header>
                <strong>نتيجة البحث</strong>
                <span>${escapeHtml(result.xp_spent ? `${result.xp_spent} XP` : "بحث موثوق")}</span>
              </header>
              <div class="smart-search-answer">${formatOpenAiWebSearchV2Answer(result.answer || result.summary || "")}</div>
              ${sources.length ? `
                <div class="smart-search-sources">
                  <b>المصادر</b>
                  ${sources.map((source) => `
                    <a href="${escapeHtml(source.url || "#")}" target="_blank" rel="noopener noreferrer">
                      ${escapeHtml(source.title || source.url || "مصدر")}
                    </a>
                  `).join("")}
                </div>
              ` : ""}
              <button type="button" class="smart-search-open-chat" data-card="فتح البحث كمحادثة">افتح كمحادثة</button>
            </section>
          ` : ""}

          <section class="smart-suggestions">
            <h2>اقتراحات شائعة</h2>
            <div>
              ${suggestions.map((item) => `
                <button type="button" data-smart-suggestion="${escapeHtml(item)}">
                  ${escapeHtml(item)}
                  ${icons.search}
                </button>
              `).join("")}
            </div>
          </section>

          <section class="smart-history">
            <h2>عمليات البحث السابقة</h2>
            <div>
              ${(smart.history || []).map((item) => `
                <article>
                  <button type="button" data-smart-suggestion="${escapeHtml(item.query)}">›</button>
                  <span>${escapeHtml(item.time || "")}</span>
                  <strong>${escapeHtml(item.query || "")}</strong>
                  <button type="button" aria-label="حذف">${icons.delete}</button>
                </article>
              `).join("")}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function formatOpenAiWebSearchV2Answer(text) {
    const cleaned = coerceDisplayText(text).trim();
    if (!cleaned) return "<p>لم تصل نتيجة واضحة بعد.</p>";
    return cleaned
      .split(/\n{2,}/)
      .map((block) => `<p>${escapeHtml(block.replace(/\n/g, " ").trim())}</p>`)
      .join("");
  }

  function renderToneAssistantMain(profile, writing, tasks, activeTask) {
    const toneOptions = [
      ["formal", "رسمي", "مناسب للمراسلات والتقارير", icons.subjects],
      ["friendly", "ودود", "واضح وبسيط وقريب من القارئ", icons.user],
      ["marketing", "تسويقي", "جذاب ومؤثر لزيادة التفاعل", icons.share],
      ["academic", "أكاديمي", "علمي وموثوق ومناسب للبحوث", icons.tests],
      ["concise", "مختصر", "موجز ومباشر في الطرح", icons.notes],
      ["inspiring", "ملهم", "محفز وملهم للقارئ", icons.star]
    ];
    const levelOptions = [
      ["balanced", "متوازن (موصى به)"],
      ["light", "خفيف"],
      ["strong", "قوي"]
    ];
    const examples = [
      "رسالة بريد رسمية",
      "محتوى تعليمي",
      "تقرير عمل",
      "منشور تسويقي",
      "دعوة فعالية"
    ];
    const output = coerceDisplayText(writing.result?.output || "");
    const textLength = String(writing.toneText || "").length;

    return `
      <section class="guest-main tools-main writing-main tone-main" aria-label="تغيير النبرة">
        <header class="guest-main-topbar tools-main-topbar">
          ${renderModelSwitcher()}
          ${renderHomeTopActions()}
        </header>

        <div class="writing-page tone-page">
          <button class="writing-back tone-back" type="button" data-tools-back>
            <span aria-hidden="true">←</span>
            <span>العودة إلى الأدوات</span>
          </button>

          <header class="writing-hero tone-hero">
            <div class="writing-title tone-title">
              <h1>مساعد الكتابة</h1>
              <span aria-hidden="true">${icons.edit}</span>
            </div>
            <p>اكتب وحسّن نصوصك باحترافية وجودة عالية</p>
          </header>

          <div class="writing-task-tabs tone-task-tabs" role="list" aria-label="أنواع الكتابة">
            ${tasks.map(([key, title, description, icon]) => `
              <button class="writing-task-card ${activeTask === key ? "is-active" : ""}" type="button" data-writing-task="${escapeHtml(key)}">
                <span aria-hidden="true">${icon}</span>
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(description)}</small>
              </button>
            `).join("")}
          </div>

          <section class="tone-layout">
            <aside class="tone-settings-card">
              <h2>إعدادات تغيير النبرة</h2>
              <p>اختر نبرة النص</p>
              <div class="tone-option-list">
                ${toneOptions.map(([key, label, hint, icon]) => `
                  <button class="tone-option ${writing.toneTarget === key ? "is-active" : ""}" type="button" data-tone-option="${escapeHtml(key)}">
                    <span class="tone-option-check" aria-hidden="true">${writing.toneTarget === key ? "●" : ""}</span>
                    <span class="tone-option-icon" aria-hidden="true">${icon}</span>
                    <strong>${escapeHtml(label)}</strong>
                    <small>${escapeHtml(hint)}</small>
                  </button>
                `).join("")}
              </div>

              <label class="tone-level">
                <span>${icons.settings}<b>خيارات إضافية</b></span>
                <select data-tone-field="level">
                  ${levelOptions.map(([key, label]) => `
                    <option value="${escapeHtml(key)}" ${writing.toneLevel === key ? "selected" : ""}>${escapeHtml(label)}</option>
                  `).join("")}
                </select>
              </label>

              <button class="tone-submit ${isAuthenticated() ? "" : "requires-auth"}" type="submit" form="toneChangerForm" ${writing.loading ? "disabled" : ""}>
                ${writing.loading ? "جاري التغيير..." : "تغيير النبرة"}
                ${icons.ai}
              </button>
              <small class="tone-cost">تكلفة العملية: 5 XP</small>
            </aside>

            <form class="tone-editor-card" id="toneChangerForm" data-tone-form>
              <section class="tone-text-panel">
                <header>
                  <div>
                    <h2>النص الأصلي</h2>
                    <p>ادخل النص الذي تريد تغيير نبرته</p>
                  </div>
                  ${icons.document}
                </header>
                <textarea
                  maxlength="4000"
                  data-tone-field="text"
                  placeholder="اكتب النص الأصلي هنا..."
                >${escapeHtml(writing.toneText || "")}</textarea>
                <small>${escapeHtml(String(textLength))}/4000</small>
              </section>

              <div class="tone-divider" aria-hidden="true">↓</div>

              <section class="tone-text-panel tone-output-panel">
                <header>
                  <div>
                    <h2>النص بعد تغيير النبرة</h2>
                    <p>النص الناتج بعد تطبيق النبرة المختارة</p>
                  </div>
                  ${icons.ai}
                </header>
                <div class="tone-output-box ${output ? "" : "is-empty"}">${output ? formatOpenAiWebSearchV2Answer(output) : "<p>سيظهر النص بعد التعديل هنا.</p>"}</div>
                <small>${escapeHtml(String(output.length))}/4000</small>
              </section>

              <div class="tone-result-actions">
                <button type="button" data-copy-tone-result ${output ? "" : "disabled"}>${icons.copy}<span>نسخ النص</span></button>
                <button type="button" data-download-tone-result ${output ? "" : "disabled"}><span aria-hidden="true">↓</span><span>تنزيل</span></button>
                <button type="button" data-retry-tone ${output ? "" : "disabled"}>${icons.refresh}<span>إعادة المحاولة</span></button>
              </div>
            </form>
          </section>

          ${writing.error ? `
            <section class="writing-result is-error tone-error">
              <strong>تعذر تغيير النبرة</strong>
              <p>${escapeHtml(writing.error)}</p>
            </section>
          ` : ""}

          <section class="tone-examples">
            <header>
              <h2>أمثلة سريعة</h2>
              ${icons.bolt}
            </header>
            <div>
              ${examples.map((item) => `
                <button type="button" data-tone-example="${escapeHtml(item)}">
                  <span>${escapeHtml(item)}</span>
                  ${icons.document}
                </button>
              `).join("")}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderCorrectionAssistantMain(profile, writing, tasks, activeTask) {
    const correctionTypes = [
      ["full", "النحوي والإملائي", "تصحيح كامل للنص", icons.notes],
      ["grammar", "النحوي فقط", "تدقيق تركيب الجمل", icons.document],
      ["spelling", "الإملائي فقط", "تصحيح الكلمات والترقيم", icons.tests]
    ];
    const levelOptions = [
      ["balanced", "متوسط (موصى به)"],
      ["light", "بسيط"],
      ["strong", "قوي"]
    ];
    const styleOptions = [
      ["keep", "الحفاظ على الأسلوب"],
      ["improve", "تحسين الأسلوب"]
    ];
    const examples = [
      "تصحيح مقال",
      "تصحيح رسالة",
      "تدقيق تقرير",
      "تصحيح بحث",
      "مراجعة محتوى"
    ];
    const output = coerceDisplayText(writing.result?.output || "");
    const textLength = String(writing.correctionText || "").length;
    const xpCost = writing.correctionLevel === "strong" ? 7 : 5;
    const keepStyleValue = writing.correctionKeepStyle === false ? "improve" : "keep";

    return `
      <section class="guest-main tools-main writing-main tone-main correction-main" aria-label="تصحيح لغوي">
        <header class="guest-main-topbar tools-main-topbar">
          ${renderModelSwitcher()}
          ${renderHomeTopActions()}
        </header>

        <div class="writing-page tone-page correction-page">
          <button class="writing-back tone-back" type="button" data-tools-back>
            <span aria-hidden="true">←</span>
            <span>العودة إلى الأدوات</span>
          </button>

          <header class="writing-hero tone-hero">
            <div class="writing-title tone-title">
              <h1>مساعد الكتابة</h1>
              <span aria-hidden="true">${icons.edit}</span>
            </div>
            <p>اكتب وحسّن نصوصك باحترافية وجودة عالية</p>
          </header>

          <div class="writing-task-tabs tone-task-tabs correction-task-tabs" role="list" aria-label="أنواع الكتابة">
            ${tasks.map(([key, title, description, icon]) => `
              <button class="writing-task-card ${activeTask === key ? "is-active" : ""}" type="button" data-writing-task="${escapeHtml(key)}">
                <span aria-hidden="true">${icon}</span>
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(description)}</small>
              </button>
            `).join("")}
          </div>

          <section class="tone-layout correction-layout">
            <aside class="tone-settings-card correction-settings-card">
              <h2>إعدادات التصحيح اللغوي</h2>

              <p>نوع التصحيح</p>
              <div class="correction-type-grid" role="list" aria-label="نوع التصحيح">
                ${correctionTypes.map(([key, label, hint, icon]) => `
                  <button class="correction-choice ${writing.correctionType === key ? "is-active" : ""}" type="button" data-correction-type="${escapeHtml(key)}">
                    <span class="correction-choice-icon" aria-hidden="true">${icon}</span>
                    <strong>${escapeHtml(label)}</strong>
                    <small>${escapeHtml(hint)}</small>
                    <i aria-hidden="true">${writing.correctionType === key ? "●" : ""}</i>
                  </button>
                `).join("")}
              </div>

              <label class="tone-level correction-level">
                <span>${icons.tests}<b>مستوى التدقيق</b></span>
                <select data-correction-field="level">
                  ${levelOptions.map(([key, label]) => `
                    <option value="${escapeHtml(key)}" ${writing.correctionLevel === key ? "selected" : ""}>${escapeHtml(label)}</option>
                  `).join("")}
                </select>
                <small>دقيق ومتوازن بين التصحيح والتنسيق</small>
              </label>

              <label class="tone-level correction-level">
                <span>${icons.internet}<b>أسلوب النص</b></span>
                <select data-correction-field="style">
                  ${styleOptions.map(([key, label]) => `
                    <option value="${escapeHtml(key)}" ${keepStyleValue === key ? "selected" : ""}>${escapeHtml(label)}</option>
                  `).join("")}
                </select>
                <small>اختر هل تريد الحفاظ على الأسلوب أو تحسينه</small>
              </label>

              <label class="correction-toggle">
                <input type="checkbox" data-correction-field="keepStyle" ${writing.correctionKeepStyle === false ? "" : "checked"}>
                <span aria-hidden="true"></span>
                <b>الحفاظ على التنسيق</b>
                <small>الحفاظ على العناوين والقوائم والنقاط</small>
              </label>

              <button class="tone-submit correction-submit ${isAuthenticated() ? "" : "requires-auth"}" type="submit" form="correctionTextForm" ${writing.loading ? "disabled" : ""}>
                ${writing.loading ? "جاري التصحيح..." : "تصحيح النص"}
                ${icons.sparkle}
              </button>
              <small class="tone-cost">تكلفة العملية: ${escapeHtml(String(xpCost))} XP</small>
            </aside>

            <form class="tone-editor-card correction-editor-card" id="correctionTextForm" data-correction-form>
              <section class="tone-text-panel correction-text-panel">
                <header>
                  <div>
                    <h2>النص الأصلي</h2>
                    <p>ادخل النص الذي تريد تصحيحه</p>
                  </div>
                  ${icons.document}
                </header>
                <textarea
                  maxlength="5000"
                  data-correction-field="text"
                  placeholder="الصق النص الذي تريد تدقيقه هنا..."
                >${escapeHtml(writing.correctionText || "")}</textarea>
                <small>${escapeHtml(String(textLength))}/5000</small>
              </section>

              <div class="tone-divider" aria-hidden="true">↓</div>

              <section class="tone-text-panel tone-output-panel correction-output-panel">
                <header>
                  <div>
                    <h2>النص بعد التصحيح</h2>
                    <p>النص المصحح والمحسن</p>
                  </div>
                  ${icons.ai}
                </header>
                <div class="tone-output-box correction-output-box ${output ? "" : "is-empty"}">${output ? formatOpenAiWebSearchV2Answer(output) : "<p>سيظهر النص المصحح هنا.</p>"}</div>
                <small>${escapeHtml(String(output.length))}/5000</small>
              </section>

              <div class="tone-result-actions correction-result-actions">
                <button type="button" data-copy-correction-result ${output ? "" : "disabled"}>${icons.copy}<span>نسخ النص</span></button>
                <button type="button" data-download-correction-result ${output ? "" : "disabled"}><span aria-hidden="true">↓</span><span>تنزيل</span></button>
                <button type="button" data-retry-correction ${output ? "" : "disabled"}>${icons.refresh}<span>إعادة المحاولة</span></button>
              </div>
            </form>
          </section>

          ${writing.error ? `
            <section class="writing-result is-error tone-error">
              <strong>تعذر تصحيح النص</strong>
              <p>${escapeHtml(writing.error)}</p>
            </section>
          ` : ""}

          <section class="tone-examples correction-examples">
            <header>
              <h2>أمثلة سريعة</h2>
              ${icons.bolt}
            </header>
            <div>
              ${examples.map((item) => `
                <button type="button" data-correction-example="${escapeHtml(item)}">
                  <span>${escapeHtml(item)}</span>
                  ${icons.document}
                </button>
              `).join("")}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderExpandAssistantMain(profile, writing, tasks, activeTask) {
    const levelOptions = [
      ["light", "خفيف", "توسيع خفيف"],
      ["medium", "متوسط", "توسيع متوسط"],
      ["deep", "مفصل", "توسيع مفصل"]
    ];
    const focusOptions = [
      ["details", "تفاصيل وأمثلة", "إضافة تفاصيل مفيدة", icons.ai],
      ["explanation", "شرح أعمق", "توضيح الفكرة أكثر", icons.book || icons.subjects],
      ["examples", "أمثلة واقعية", "إضافة أمثلة عملية", icons.subjects],
      ["context", "سياق وخلفية", "ربط الفكرة بسياقها", icons.sparkle]
    ];
    const audienceOptions = ["عام", "طلاب", "عملاء", "فريق عمل", "أكاديمي"];
    const examples = ["تقرير", "خطة مشروع", "خطة عمل", "فكرة منتج", "مقال قصير"];
    const output = coerceDisplayText(writing.result?.output || "");
    const textLength = String(writing.expandText || "").length;
    const xpCost = writing.expandLevel === "deep" ? 12 : 8;

    return `
      <section class="guest-main tools-main writing-main tone-main expand-main" aria-label="توسيع النص">
        <header class="guest-main-topbar tools-main-topbar">
          ${renderModelSwitcher()}
          ${renderHomeTopActions()}
        </header>

        <div class="writing-page tone-page expand-page">
          <button class="writing-back tone-back" type="button" data-tools-back>
            <span aria-hidden="true">←</span>
            <span>العودة إلى الأدوات</span>
          </button>

          <header class="writing-hero tone-hero">
            <div class="writing-title tone-title">
              <h1>مساعد الكتابة</h1>
              <span aria-hidden="true">${icons.edit}</span>
            </div>
            <p>اكتب وحسن نصوصك باحترافية وبجودة عالية</p>
          </header>

          <div class="writing-task-tabs tone-task-tabs" role="list" aria-label="أنواع الكتابة">
            ${tasks.map(([key, title, description, icon]) => `
              <button class="writing-task-card ${activeTask === key ? "is-active" : ""}" type="button" data-writing-task="${escapeHtml(key)}">
                <span aria-hidden="true">${icon}</span>
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(description)}</small>
              </button>
            `).join("")}
          </div>

          <section class="tone-layout expand-layout">
            <aside class="tone-settings-card expand-settings-card">
              <h2>إعدادات توسيع النص</h2>

              <label class="tone-level expand-level">
                <span>${icons.bolt}<b>مستوى التوسيع</b></span>
                <select data-expand-field="level">
                  ${levelOptions.map(([key, label]) => `
                    <option value="${escapeHtml(key)}" ${writing.expandLevel === key ? "selected" : ""}>${escapeHtml(label)}</option>
                  `).join("")}
                </select>
                <small>اختر مستوى التوسيع المطلوب للنص</small>
              </label>

              <p class="expand-focus-title">التركيز على</p>
              <div class="expand-focus-grid" role="list" aria-label="تركيز التوسيع">
                ${focusOptions.map(([key, label, hint, icon]) => `
                  <button class="expand-focus-option ${writing.expandFocus === key ? "is-active" : ""}" type="button" data-expand-focus="${escapeHtml(key)}">
                    <span aria-hidden="true">${icon}</span>
                    <strong>${escapeHtml(label)}</strong>
                    <small>${escapeHtml(hint)}</small>
                    <i aria-hidden="true">${writing.expandFocus === key ? "●" : ""}</i>
                  </button>
                `).join("")}
              </div>

              <label class="tone-level expand-level">
                <span>${icons.user}<b>الجمهور المستهدف</b></span>
                <select data-expand-field="audience">
                  ${audienceOptions.map((item) => `
                    <option value="${escapeHtml(item)}" ${writing.expandAudience === item ? "selected" : ""}>${escapeHtml(item)}</option>
                  `).join("")}
                </select>
              </label>

              <button class="tone-submit expand-submit ${isAuthenticated() ? "" : "requires-auth"}" type="submit" form="expandTextForm" ${writing.loading ? "disabled" : ""}>
                ${writing.loading ? "جاري توسيع النص..." : "توسيع النص"}
                ${icons.sparkle}
              </button>
              <small class="tone-cost">تكلفة العملية: ${xpCost} XP</small>
            </aside>

            <form class="tone-editor-card expand-editor-card" id="expandTextForm" data-expand-form>
              <section class="tone-text-panel expand-text-panel">
                <header>
                  <div>
                    <h2>النص الأصلي</h2>
                    <p>ادخل النص الذي تريد توسيعه</p>
                  </div>
                  ${icons.document}
                </header>
                <textarea
                  maxlength="3500"
                  data-expand-field="text"
                  placeholder="اكتب النص الأصلي هنا..."
                >${escapeHtml(writing.expandText || "")}</textarea>
                <small>${escapeHtml(String(textLength))}/3500</small>
              </section>

              <div class="tone-divider" aria-hidden="true">↓</div>

              <section class="tone-text-panel tone-output-panel expand-text-panel">
                <header>
                  <div>
                    <h2>النص بعد التوسيع</h2>
                    <p>النص الناتج بعد التوسيع</p>
                  </div>
                  ${icons.ai}
                </header>
                <div class="tone-output-box expand-output-box ${output ? "" : "is-empty"}">${output ? formatOpenAiWebSearchV2Answer(output) : "<p>سيظهر النص بعد التوسيع هنا.</p>"}</div>
                <small>${escapeHtml(String(output.length))}/4000</small>
              </section>

              <div class="tone-result-actions expand-result-actions">
                <button type="button" data-copy-expand-result ${output ? "" : "disabled"}>${icons.copy}<span>نسخ النص</span></button>
                <button type="button" data-download-expand-result ${output ? "" : "disabled"}><span aria-hidden="true">↓</span><span>تنزيل</span></button>
                <button type="button" data-retry-expand ${output ? "" : "disabled"}>${icons.refresh}<span>إعادة المحاولة</span></button>
              </div>
            </form>
          </section>

          ${writing.error ? `
            <section class="writing-result is-error tone-error">
              <strong>تعذر توسيع النص</strong>
              <p>${escapeHtml(writing.error)}</p>
            </section>
          ` : ""}

          <section class="tone-examples expand-examples">
            <header>
              <h2>أمثلة سريعة</h2>
              ${icons.bolt}
            </header>
            <div>
              ${examples.map((item) => `
                <button type="button" data-expand-example="${escapeHtml(item)}">
                  <span>${escapeHtml(item)}</span>
                  ${icons.document}
                </button>
              `).join("")}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderSummarizeAssistantMain(profile, writing, tasks, activeTask) {
    const summaryTypes = [
      ["bullets", "نقاط رئيسية", "أهم الأفكار كنقاط", icons.notes],
      ["paragraph", "ملخص فقرة", "فقرة مختصرة مترابطة", icons.document],
      ["executive", "ملخص تنفيذي", "قرارات وأفكار مهمة", icons.subjects]
    ];
    const summaryLengths = [
      ["short", "قصير", "ملخص سريع"],
      ["medium", "متوسط", "توازن مناسب"],
      ["detailed", "مفصل", "تفاصيل أكثر"]
    ];
    const pointOptions = [3, 4, 5, 6, 7, 8, 9, 10];
    const audienceOptions = ["عام", "طلاب", "عملاء", "فريق عمل", "أكاديمي"];
    const examples = [
      "ملخص اجتماع",
      "تلخيص محاضرة",
      "ملخص كتاب",
      "تلخيص تقرير بحثي",
      "ملخص مقال طويل"
    ];
    const output = coerceDisplayText(writing.result?.output || "");
    const textLength = String(writing.summaryText || "").length;
    const xpCost = writing.summaryLength === "detailed" || textLength > 6000 ? 10 : 6;

    return `
      <section class="guest-main tools-main writing-main tone-main summary-main" aria-label="تلخيص النص">
        <header class="guest-main-topbar tools-main-topbar">
          ${renderModelSwitcher()}
          ${renderHomeTopActions()}
        </header>

        <div class="writing-page tone-page expand-page summary-page">
          <button class="writing-back tone-back" type="button" data-tools-back>
            <span aria-hidden="true">←</span>
            <span>العودة إلى الأدوات</span>
          </button>

          <header class="writing-hero tone-hero">
            <div class="writing-title tone-title">
              <h1>مساعد الكتابة</h1>
              <span aria-hidden="true">${icons.edit}</span>
            </div>
            <p>اكتب وحسّن نصوصك باحترافية وجودة عالية</p>
          </header>

          <div class="writing-task-tabs tone-task-tabs" role="list" aria-label="أنواع الكتابة">
            ${tasks.map(([key, title, description, icon]) => `
              <button class="writing-task-card ${activeTask === key ? "is-active" : ""}" type="button" data-writing-task="${escapeHtml(key)}">
                <span aria-hidden="true">${icon}</span>
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(description)}</small>
              </button>
            `).join("")}
          </div>

          <section class="tone-layout expand-layout summary-layout">
            <aside class="tone-settings-card expand-settings-card summary-settings-card">
              <h2>إعدادات تلخيص النص</h2>

              <p class="summary-option-title">${icons.settings}<span>نوع الملخص</span></p>
              <div class="summary-choice-grid summary-type-grid" role="list" aria-label="نوع الملخص">
                ${summaryTypes.map(([key, label, hint, icon]) => `
                  <button class="summary-choice ${writing.summaryType === key ? "is-active" : ""}" type="button" data-summary-type="${escapeHtml(key)}">
                    <span class="summary-choice-icon" aria-hidden="true">${icon}</span>
                    <strong>${escapeHtml(label)}</strong>
                    <small>${escapeHtml(hint)}</small>
                    <i aria-hidden="true">${writing.summaryType === key ? "●" : ""}</i>
                  </button>
                `).join("")}
              </div>

              <p class="summary-option-title">${icons.notes}<span>طول الملخص</span></p>
              <div class="summary-choice-grid summary-length-grid" role="list" aria-label="طول الملخص">
                ${summaryLengths.map(([key, label, hint]) => `
                  <button class="summary-choice summary-length-choice ${writing.summaryLength === key ? "is-active" : ""}" type="button" data-summary-length="${escapeHtml(key)}">
                    <strong>${escapeHtml(label)}</strong>
                    <small>${escapeHtml(hint)}</small>
                    <i aria-hidden="true">${writing.summaryLength === key ? "●" : ""}</i>
                  </button>
                `).join("")}
              </div>

              <label class="tone-level summary-level">
                <span>${icons.notes}<b>عدد النقاط</b></span>
                <select data-summary-field="pointsCount">
                  ${pointOptions.map((item) => `
                    <option value="${item}" ${Number(writing.summaryPointsCount || 5) === item ? "selected" : ""}>${item} نقاط</option>
                  `).join("")}
                </select>
              </label>

              <label class="tone-level summary-level">
                <span>${icons.user}<b>الجمهور المستهدف (اختياري)</b></span>
                <select data-summary-field="audience">
                  ${audienceOptions.map((item) => `
                    <option value="${escapeHtml(item)}" ${writing.summaryAudience === item ? "selected" : ""}>${escapeHtml(item)}</option>
                  `).join("")}
                </select>
              </label>

              <button class="tone-submit expand-submit summary-submit ${isAuthenticated() ? "" : "requires-auth"}" type="submit" form="summarizeTextForm" ${writing.loading ? "disabled" : ""}>
                ${writing.loading ? "جاري تلخيص النص..." : "تلخيص النص"}
                ${icons.sparkle}
              </button>
              <small class="tone-cost">تكلفة العملية: ${xpCost} XP</small>
            </aside>

            <form class="tone-editor-card expand-editor-card summary-editor-card" id="summarizeTextForm" data-summary-form>
              <section class="tone-text-panel expand-text-panel summary-text-panel">
                <header>
                  <div>
                    <h2>النص الأصلي</h2>
                    <p>أدخل النص الذي تريد تلخيصه</p>
                  </div>
                  ${icons.document}
                </header>
                <textarea
                  maxlength="12000"
                  data-summary-field="text"
                  placeholder="الصق النص الطويل هنا..."
                >${escapeHtml(writing.summaryText || "")}</textarea>
                <small>${escapeHtml(String(textLength))}/12000</small>
              </section>

              <div class="tone-divider" aria-hidden="true">↓</div>

              <section class="tone-text-panel tone-output-panel expand-text-panel summary-text-panel">
                <header>
                  <div>
                    <h2>الملخص الناتج</h2>
                    <p>النص بعد تلخيصه</p>
                  </div>
                  ${icons.ai}
                </header>
                <div class="tone-output-box expand-output-box summary-output-box ${output ? "" : "is-empty"}">${output ? formatOpenAiWebSearchV2Answer(output) : "<p>سيظهر الملخص هنا بعد تنفيذ العملية.</p>"}</div>
                <small>${escapeHtml(String(output.length))}/4000</small>
              </section>

              <div class="tone-result-actions expand-result-actions summary-result-actions">
                <button type="button" data-copy-summary-result ${output ? "" : "disabled"}>${icons.copy}<span>نسخ النص</span></button>
                <button type="button" data-download-summary-result ${output ? "" : "disabled"}><span aria-hidden="true">↓</span><span>تنزيل</span></button>
                <button type="button" data-retry-summary ${output ? "" : "disabled"}>${icons.refresh}<span>إعادة المحاولة</span></button>
              </div>
            </form>
          </section>

          ${writing.error ? `
            <section class="writing-result is-error tone-error">
              <strong>تعذر تلخيص النص</strong>
              <p>${escapeHtml(writing.error)}</p>
            </section>
          ` : ""}

          <section class="tone-examples expand-examples summary-examples">
            <header>
              <h2>أمثلة سريعة</h2>
              ${icons.bolt}
            </header>
            <div>
              ${examples.map((item) => `
                <button type="button" data-summary-example="${escapeHtml(item)}">
                  <span>${escapeHtml(item)}</span>
                  ${icons.document}
                </button>
              `).join("")}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderStyleAssistantMain(profile, writing, tasks, activeTask) {
    const styleGoals = [
      ["clarity", "وضوح النص", "إزالة الغموض والتكرار", icons.ai],
      ["professional", "احترافية أعلى", "أسلوب مناسب للأعمال", icons.projects || icons.settings],
      ["persuasive", "جاذبية وإقناع", "نص أقوى وأكثر تأثيرًا", icons.bolt],
      ["smooth", "بساطة وسلاسة", "صياغة مريحة للقارئ", icons.ai],
      ["impact", "قوة وتأثير", "نبرة أقوى وأكثر حضورًا", icons.bolt],
      ["organized", "تنظيم أفضل", "ترتيب الأفكار بوضوح", icons.notes]
    ];
    const styleLevels = [
      ["light", "خفيف", "تحسين بسيط"],
      ["balanced", "متوسط", "تحسين متوازن"],
      ["deep", "عميق", "تحسين شامل"]
    ];
    const audienceOptions = ["عام", "طلاب", "عملاء", "فريق عمل", "أكاديمي"];
    const examples = ["رسالة رسمية", "محتوى إبداعي", "مقال تسويقي", "تقرير عمل", "نص أكاديمي"];
    const output = coerceDisplayText(writing.result?.output || "");
    const textLength = String(writing.styleText || "").length;
    const xpCost = writing.styleLevel === "deep" || textLength > 2500 ? 8 : 5;

    return `
      <section class="guest-main tools-main writing-main tone-main correction-main style-main" aria-label="تحسين الأسلوب">
        <header class="guest-main-topbar tools-main-topbar">
          ${renderModelSwitcher()}
          ${renderHomeTopActions()}
        </header>

        <div class="writing-page tone-page correction-page style-page">
          <button class="writing-back tone-back" type="button" data-tools-back>
            <span aria-hidden="true">←</span>
            <span>العودة إلى الأدوات</span>
          </button>

          <header class="writing-hero tone-hero">
            <div class="writing-title tone-title">
              <h1>مساعد الكتابة</h1>
              <span aria-hidden="true">${icons.edit}</span>
            </div>
            <p>اكتب وحسّن نصوصك باحترافية وجودة عالية</p>
          </header>

          <div class="writing-task-tabs tone-task-tabs correction-task-tabs" role="list" aria-label="أنواع الكتابة">
            ${tasks.map(([key, title, description, icon]) => `
              <button class="writing-task-card ${activeTask === key ? "is-active" : ""}" type="button" data-writing-task="${escapeHtml(key)}">
                <span aria-hidden="true">${icon}</span>
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(description)}</small>
              </button>
            `).join("")}
          </div>

          <section class="tone-layout correction-layout style-layout">
            <aside class="tone-settings-card correction-settings-card style-settings-card">
              <h2>إعدادات تحسين الأسلوب</h2>

              <p>الهدف من التحسين</p>
              <div class="correction-type-grid style-goal-grid" role="list" aria-label="هدف التحسين">
                ${styleGoals.map(([key, label, hint, icon]) => `
                  <button class="correction-choice style-choice ${writing.styleGoal === key ? "is-active" : ""}" type="button" data-style-goal="${escapeHtml(key)}">
                    <span class="correction-choice-icon" aria-hidden="true">${icon}</span>
                    <strong>${escapeHtml(label)}</strong>
                    <small>${escapeHtml(hint)}</small>
                    <i aria-hidden="true">${writing.styleGoal === key ? "●" : ""}</i>
                  </button>
                `).join("")}
              </div>

              <p class="summary-option-title">${icons.settings}<span>مستوى التحسين</span></p>
              <div class="summary-choice-grid summary-length-grid style-level-grid" role="list" aria-label="مستوى التحسين">
                ${styleLevels.map(([key, label, hint]) => `
                  <button class="summary-choice summary-length-choice ${writing.styleLevel === key ? "is-active" : ""}" type="button" data-style-level="${escapeHtml(key)}">
                    <strong>${escapeHtml(label)}</strong>
                    <small>${escapeHtml(hint)}</small>
                    <i aria-hidden="true">${writing.styleLevel === key ? "●" : ""}</i>
                  </button>
                `).join("")}
              </div>

              <label class="tone-level correction-level">
                <span>${icons.user}<b>الجمهور المستهدف (اختياري)</b></span>
                <select data-style-field="audience">
                  ${audienceOptions.map((item) => `
                    <option value="${escapeHtml(item)}" ${writing.styleAudience === item ? "selected" : ""}>${escapeHtml(item)}</option>
                  `).join("")}
                </select>
              </label>

              <label class="correction-toggle">
                <input type="checkbox" data-style-field="keepMeaning" ${writing.styleKeepMeaning === false ? "" : "checked"}>
                <span aria-hidden="true"></span>
                <b>الحفاظ على المعنى الأصلي</b>
                <small>الحفاظ على الفكرة والمعنى دون تغيير</small>
              </label>

              <button class="tone-submit correction-submit style-submit ${isAuthenticated() ? "" : "requires-auth"}" type="submit" form="improveStyleForm" ${writing.loading ? "disabled" : ""}>
                ${writing.loading ? "جاري تحسين الأسلوب..." : "تحسين الأسلوب"}
                ${icons.sparkle}
              </button>
              <small class="tone-cost">تكلفة العملية: ${escapeHtml(String(xpCost))} XP</small>
            </aside>

            <form class="tone-editor-card correction-editor-card style-editor-card" id="improveStyleForm" data-style-form>
              <section class="tone-text-panel correction-text-panel style-text-panel">
                <header>
                  <div>
                    <h2>النص الأصلي</h2>
                    <p>أدخل النص الذي تريد تحسين أسلوبه</p>
                  </div>
                  ${icons.document}
                </header>
                <textarea
                  maxlength="5000"
                  data-style-field="text"
                  placeholder="الصق النص الذي تريد تحسينه هنا..."
                >${escapeHtml(writing.styleText || "")}</textarea>
                <small>${escapeHtml(String(textLength))}/5000</small>
              </section>

              <div class="tone-divider" aria-hidden="true">↓</div>

              <section class="tone-text-panel tone-output-panel correction-output-panel style-output-panel">
                <header>
                  <div>
                    <h2>النص بعد تحسين الأسلوب</h2>
                    <p>النص الناتج بعد تحسين أسلوبه</p>
                  </div>
                  ${icons.ai}
                </header>
                <div class="tone-output-box correction-output-box style-output-box ${output ? "" : "is-empty"}">${output ? formatOpenAiWebSearchV2Answer(output) : "<p>سيظهر النص المحسّن هنا بعد تنفيذ العملية.</p>"}</div>
                <small>${escapeHtml(String(output.length))}/5000</small>
              </section>

              <div class="tone-result-actions correction-result-actions style-result-actions">
                <button type="button" data-copy-style-result ${output ? "" : "disabled"}>${icons.copy}<span>نسخ النص</span></button>
                <button type="button" data-download-style-result ${output ? "" : "disabled"}><span aria-hidden="true">↓</span><span>تنزيل</span></button>
                <button type="button" data-retry-style ${output ? "" : "disabled"}>${icons.refresh}<span>إعادة المحاولة</span></button>
              </div>
            </form>
          </section>

          ${writing.error ? `
            <section class="writing-result is-error tone-error">
              <strong>تعذر تحسين الأسلوب</strong>
              <p>${escapeHtml(writing.error)}</p>
            </section>
          ` : ""}

          <section class="tone-examples correction-examples style-examples">
            <header>
              <h2>أمثلة سريعة</h2>
              ${icons.bolt}
            </header>
            <div>
              ${examples.map((item) => `
                <button type="button" data-style-example="${escapeHtml(item)}">
                  <span>${escapeHtml(item)}</span>
                  ${icons.document}
                </button>
              `).join("")}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderWritingAssistantMain(profile) {
    const writing = state.writingAssistant || {};
    const activeTask = writing.taskType || "generate";
    const tasks = [
      ["generate", "كتابة من الصفر", "إنشاء محتوى جديد", icons.sparkle],
      ["tone", "تغيير النبرة", "تحويل الأسلوب", icons.ai],
      ["expand", "توسيع نص", "إضافة تفاصيل ومقترحات", icons.document],
      ["summarize", "تلخيص نص", "اختصار إلى نقاط واضحة", icons.notes],
      ["rewrite", "تصحيح لغوي", "تصحيح وتحسين الصياغة", icons.edit],
      ["style", "تحسين الأسلوب", "جعل النص أكثر احترافية", icons.settings]
    ];
    if (activeTask === "tone") {
      return renderToneAssistantMain(profile, writing, tasks, activeTask);
    }
    if (activeTask === "expand") {
      return renderExpandAssistantMain(profile, writing, tasks, activeTask);
    }
    if (activeTask === "summarize") {
      return renderSummarizeAssistantMain(profile, writing, tasks, activeTask);
    }
    if (activeTask === "rewrite") {
      return renderCorrectionAssistantMain(profile, writing, tasks, activeTask);
    }
    if (activeTask === "style") {
      return renderStyleAssistantMain(profile, writing, tasks, activeTask);
    }
    const selectOptions = {
      contentType: ["مقال", "منشور", "رسالة", "إعلان", "ملخص", "سكربت"],
      purpose: ["إقناع", "شرح", "تسويق", "تعليم", "إخبار", "تحفيز"],
      tone: ["احترافية", "ودية", "رسمية", "تسويقية", "أكاديمية", "مختصرة"],
      language: ["العربية", "English"],
      length: ["قصير (100 - 200 كلمة)", "متوسط (300 - 500 كلمة)", "طويل (700+ كلمة)"]
    };
    const examples = [
      "مقدمة مقالة عن الذكاء الاصطناعي",
      "شرح منتج بطريقة تسويقية",
      "رسالة بريد احترافية",
      "منشور قصير لمنصة تعليمية"
    ];
    const renderSelect = (key, label, iconKey) => `
      <label class="writing-setting">
        <span>${escapeHtml(label)}</span>
        <div>
          <select data-writing-field="${escapeHtml(key)}">
            ${(selectOptions[key] || []).map((item) => `
              <option value="${escapeHtml(item)}" ${writing[key] === item ? "selected" : ""}>${escapeHtml(item)}</option>
            `).join("")}
          </select>
          ${icons[iconKey] || icons.settings}
        </div>
      </label>
    `;

    return `
      <section class="guest-main tools-main writing-main" aria-label="مساعد الكتابة">
        <header class="guest-main-topbar tools-main-topbar">
          ${renderModelSwitcher()}
          ${renderHomeTopActions()}
        </header>

        <div class="writing-page">
          <button class="writing-back" type="button" data-tools-back>
            <span aria-hidden="true">←</span>
            <span>العودة إلى الأدوات</span>
          </button>

          <header class="writing-hero">
            <div class="writing-title">
              <h1>مساعد الكتابة</h1>
              <span aria-hidden="true">${icons.edit}</span>
            </div>
            <p>اكتب وحسّن نصوصك باحترافية وجودة عالية</p>
          </header>

          <div class="writing-task-tabs" role="list" aria-label="أنواع الكتابة">
            ${tasks.map(([key, title, description, icon]) => `
              <button class="writing-task-card ${activeTask === key ? "is-active" : ""}" type="button" data-writing-task="${escapeHtml(key)}">
                <span aria-hidden="true">${icon}</span>
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(description)}</small>
              </button>
            `).join("")}
          </div>

          <section class="writing-layout">
            <aside class="writing-settings-card">
              <h2>إعدادات الكتابة</h2>
              ${renderSelect("contentType", "نوع المحتوى", "document")}
              ${renderSelect("purpose", "الغرض من الكتابة", "ai")}
              ${renderSelect("tone", "النبرة", "sparkle")}
              ${renderSelect("language", "اللغة", "internet")}
              ${renderSelect("length", "الطول التقريبي", "settings")}
              <button class="writing-submit-side ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-writing-submit ${writing.loading ? "disabled" : ""}>
                ${writing.loading ? "جاري الإنشاء..." : "إنشاء النص"}
                ${icons.sparkle}
              </button>
            </aside>

            <form class="writing-form-card" id="writingAssistantForm" data-writing-form>
              <label class="writing-field">
                <span>موضوع الكتابة أو الفكرة الرئيسية</span>
                <input
                  type="text"
                  value="${escapeHtml(writing.topic || "")}"
                  placeholder="اكتب موضوعك هنا، مثال: تأثير الذكاء الاصطناعي على سوق العمل"
                  data-writing-field="topic"
                  autocomplete="off"
                >
              </label>

              <label class="writing-field">
                <span>تفاصيل إضافية (اختياري)</span>
                <textarea
                  rows="8"
                  maxlength="2000"
                  placeholder="أضف أي تفاصيل أو نقاط تريد تضمينها في النص..."
                  data-writing-field="details"
                >${escapeHtml(writing.details || "")}</textarea>
                <small>${escapeHtml(String(writing.details || "").length)}/2000</small>
              </label>

              <div class="writing-actions">
                <button type="button" data-writing-add-points>
                  ${icons.notes}
                  <span>إضافة نقاط رئيسية</span>
                </button>
                <button type="button" data-writing-submit ${writing.loading ? "disabled" : ""}>
                  ${writing.loading ? "جاري الإنشاء..." : "إنشاء النص"}
                  ${icons.sparkle}
                </button>
              </div>
            </form>
          </section>

          ${writing.error ? `
            <section class="writing-result is-error">
              <strong>تعذر تنفيذ مساعد الكتابة</strong>
              <p>${escapeHtml(writing.error)}</p>
            </section>
          ` : ""}

          ${writing.result ? `
            <section class="writing-result">
              <header>
                <strong>النص الناتج</strong>
                <span>${escapeHtml(writing.result.xp_spent ? `${writing.result.xp_spent} XP` : "جاهز")}</span>
              </header>
              <div class="writing-output">${formatOpenAiWebSearchV2Answer(writing.result.output || writing.result.answer || "")}</div>
              <button type="button" data-copy-writing-result>${icons.copy}<span>نسخ النص</span></button>
            </section>
          ` : ""}

          <section class="writing-examples">
            <header>
              <h2>أمثلة سريعة</h2>
              ${icons.bolt}
            </header>
            <div>
              ${examples.map((item) => `
                <button type="button" data-writing-example="${escapeHtml(item)}">
                  <span>${escapeHtml(item)}</span>
                  ${icons.document}
                </button>
              `).join("")}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  function renderMobileHomePanel() {
    const cards = [
      ["كتابة المحتوى", "إنشاء محتوى احترافي", "sparkle"],
      ["أفكار وإبداع", "الحصول على أفكار جديدة", "star"],
      ["مساعدة برمجية", "حل المشكلات البرمجية", "code"],
      ["ترجمة", "ترجمة النصوص بدقة", "internet"]
    ];

    return `
      <section class="ov-mobile-home" aria-label="واجهة Orlixor للجوال">
        <section class="ov-mobile-hero">
          <h1><span>👋</span> مرحباً بك</h1>
          <p>كيف يمكنني مساعدتك اليوم؟</p>
        </section>
        <nav class="ov-mobile-actions" aria-label="اختصارات Orlixor">
          ${cards.map(([title, desc, icon]) => `
            <button class="ov-mobile-action ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-card="${escapeHtml(title)}">
              <i class="ov-mobile-action-icon" aria-hidden="true">${icons[icon]}</i>
              <span class="ov-mobile-action-copy">
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(desc)}</small>
              </span>
            </button>
          `).join("")}
        </nav>
      </section>
    `;
  }

  function renderHomeMain(profile) {
    const firstName = isAuthenticated()
      ? String(state.currentUser?.name || "أحمد").trim().split(/\s+/)[0] || "أحمد"
      : "بك";
    const greeting = firstName === "بك" ? "مرحبًا بك" : `مرحبًا بك، ${escapeHtml(firstName)}`;
    const isChatting = state.homeConversationOpen;

    const mainClass = [
      "guest-main",
      "home-orlixor-main",
      isChatting ? "is-chatting" : "",
      state.selectedFiles.length ? "has-attachments" : ""
    ].filter(Boolean).join(" ");

    return `
      <section class="${mainClass}">
        <header class="guest-main-topbar home-main-topbar">
          ${renderModelSwitcher()}
          <span class="home-mobile-logo" aria-hidden="true">${icons.logo}</span>
          ${renderHomeTopActions()}
        </header>

        ${isChatting ? "" : `
          ${renderMobileHomePanel()}
          <section class="home-hero-panel home-desktop-hero">
            <span class="home-hero-mark" aria-hidden="true">${icons.logo}</span>
            <h1>${greeting} <span>👋</span></h1>
            <p>كيف يمكنني مساعدتك اليوم؟</p>
          </section>

          <section class="guest-quick-grid home-quick-grid home-desktop-actions">
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
            ${state.sending ? "disabled" : ""}
          >
          ${renderComposeStatus()}
          <div class="home-compose-actions">
            <button class="home-compose-tool ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-pick-file>
              ${icons.attach}
              <span>إرفاق ملف</span>
            </button>
            <button class="home-compose-tool" type="button" data-open-tools>
              ${icons.settings}
              <span>أدوات</span>
            </button>
          </div>
          ${renderComposeSendButton()}
        </form>
        <p class="guest-compose-note home-compose-note">قد يخطئ Orlixor في بعض المعلومات. تحقّق من المعلومات المهمة.</p>
      </section>
    `;
  }

  function renderMobileHomeShell(profile) {
    return `
      <div class="mobile-app ${getEffectiveTheme() === "dark" ? "theme-dark" : ""} ${state.mobileSidebarOpen ? "is-mobile-sidebar-open" : ""}">
        ${renderMobileHeader()}
        <div class="mobile-drawer-backdrop" data-toggle-sidebar aria-hidden="${state.mobileSidebarOpen ? "false" : "true"}"></div>
        ${renderMobileDrawer()}
        <main class="mobile-home" aria-label="الواجهة الرئيسية">
          ${renderMobileHomePanel()}
          ${renderConversation(profile)}
          ${renderAttachmentPills()}
        </main>
        <form class="guest-compose home-compose mobile-composer" data-compose-form>
          <input
            class="compose-input"
            data-compose-input
            value="${escapeHtml(getComposerValue())}"
            placeholder="اكتب رسالتك هنا..."
            ${state.sending ? "disabled" : ""}
          >
          ${renderComposeStatus()}
          <div class="home-compose-actions">
            <button class="home-compose-tool ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-pick-file>
              ${icons.attach}
              <span>إرفاق ملف</span>
            </button>
            <button class="home-compose-tool" type="button" data-open-tools>
              ${icons.settings}
              <span>أدوات</span>
            </button>
          </div>
          ${renderComposeSendButton()}
        </form>
      </div>
    `;
  }

  function renderMain(profile) {
    if (state.toolSuggestionModalOpen) {
      return renderToolSuggestionPage(profile);
    }
    if (profile.key === "ai-tools") {
      if (state.toolView === "smart-search") {
        return renderOpenAiWebSearchV2Main(profile);
      }
      if (state.toolView === "writing-assistant") {
        return renderWritingAssistantMain(profile);
      }
      if (state.toolView === "writing-tools") {
        return renderWritingEditingToolsMain(profile);
      }
      if (state.toolView === "summary-tools") {
        return renderSummaryOrganizationToolsMain(profile);
      }
      if (state.toolView === "data-tools") {
        return renderDataAnalysisToolsMain(profile);
      }
      if (state.toolView === "productivity-tools") {
        return renderProductivityToolsMain(profile);
      }
      if (state.toolView === "education-tools") {
        return renderEducationLearningToolsMain(profile);
      }
      if (state.toolView === "image-enhancer") {
        return renderImageEnhancerMain(profile);
      }
      if (state.toolView === "image-clarifier") {
        return renderImageClarifierMain(profile);
      }
      if (state.toolView === "png-to-pdf") {
        return renderPngToPdfMain(profile);
      }
      if (state.toolView === "pdf-to-png") {
        return renderPdfToPngMain(profile);
      }
      if (state.toolView === "pdf-unlock") {
        return renderPdfUnlockMain(profile);
      }
      if (state.toolView === "image-converter") {
        return renderImageConverterMain(profile);
      }
      if (state.toolView === "image-compressor") {
        return renderImageCompressorMain(profile);
      }
      if (state.toolView === "image-rotator") {
        return renderImageRotatorMain(profile);
      }
      if (state.toolView === "image-cropper") {
        return renderImageCropperMain(profile);
      }
      return renderToolsMain(profile);
    }
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
            ${state.sending ? "disabled" : ""}
          >
          ${renderComposeStatus()}
          ${renderComposeSendButton()}
        </form>
        <p class="guest-compose-note">قد يخطئ Orlixor في بعض المعلومات، تحقّق من المعلومات المهمة.</p>
      </section>
    `;
  }

  function renderToolsSidebarPanel() {
    const recent = (state.recentTools || [])[0] || null;
    const recentMeta = recent ? getToolSidebarMeta(recent.key, recent.title) : null;
    const progress = recent ? Math.max(0, Math.min(100, Number(recent.progress || 80))) : 0;

    return `
      <label class="guest-search-box tools-sidebar-search">
        <input type="search" placeholder="ابحث في الأدوات" data-tools-sidebar-search>
        <span>${icons.search}</span>
      </label>

      <div class="tools-sidebar-panel">
        ${recent ? `
          <section class="tools-sidebar-recent" aria-label="آخر أداة استخدمتها">
            <h3>آخر أداة استخدمتها</h3>
            <button class="tools-sidebar-last-card" type="button" data-tool-key="${escapeHtml(recent.key)}" data-card="${escapeHtml(recentMeta.title)}">
              <span class="tools-sidebar-tool-icon" aria-hidden="true">${recentMeta.icon}</span>
              <span class="tools-sidebar-tool-copy">
                <strong>${escapeHtml(recentMeta.title)}</strong>
                <small>${escapeHtml(recentMeta.subtitle)}</small>
              </span>
              <span class="tools-sidebar-arrow" aria-hidden="true">›</span>
              <span class="tools-sidebar-progress">
                <i style="width:${progress}%"></i>
              </span>
              <b>${progress}% مكتمل</b>
            </button>
            <button class="tools-sidebar-follow" type="button" data-tool-key="${escapeHtml(recent.key)}" data-card="${escapeHtml(recentMeta.title)}">
              <span aria-hidden="true">${icons.refresh}</span>
              متابعة التقدم
            </button>
          </section>
        ` : `
          <section class="tools-sidebar-empty" aria-label="الأدوات المستخدمة مؤخراً">
            <span aria-hidden="true">${icons.sparkle}</span>
            <strong>لا توجد أدوات مستخدمة مؤخراً</strong>
            <p>عند استخدام أي أداة، ستظهر هنا لتتمكن من المتابعة بسهولة.</p>
          </section>
        `}
      </div>

      <button class="tools-sidebar-browse" type="button" data-open-tools>
        <span aria-hidden="true">${icons.ai}</span>
        تصفح جميع الأدوات
      </button>
    `;
  }

  function renderSidebar() {
    const userCard = getUserCardMeta();
    const isToolsWorkspace = state.section === "ai-tools";
    const isChatSidebar = ["dashboard", "messages"].includes(state.section);
    const upgradeTarget = getNextUpgradeTarget();
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
      <aside class="guest-sidebar mobile-drawer"${isCompactViewport() && !state.mobileSidebarOpen ? " hidden aria-hidden=\"true\"" : ""}>
        <div class="guest-sidebar-head">
          <a class="guest-brand" href="${shellBaseUrl}" aria-label="Orlixor">
            <span class="guest-brand-full guest-brand-combo">
              <img class="guest-brand-symbol" src="${brandMarkUrl}" alt="" aria-hidden="true">
              <span class="guest-brand-word">Orlixor</span>
            </span>
            <img class="guest-brand-mark" src="${brandMarkUrl}" alt="" aria-hidden="true">
          </a>
          <button class="guest-sidebar-toggle" type="button" data-toggle-sidebar aria-label="${state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}" aria-expanded="${state.sidebarCollapsed ? "false" : "true"}">
            <span class="toggle-expanded" aria-hidden="true">&lsaquo;&lsaquo;</span>
            <span class="toggle-collapsed" aria-hidden="true">&rsaquo;&rsaquo;</span>
          </button>
        </div>

        <div class="guest-collapsed-tools" aria-label="اختصارات الشريط الجانبي">
          <button class="guest-rail-btn ${isAuthenticated() ? "" : "requires-auth"}" type="button" data-new-chat aria-label="دردشة جديدة">${icons.edit}</button>
          <button class="guest-rail-btn" type="button" data-focus-history-search aria-label="البحث في المحادثات">${icons.search}</button>
          <button class="guest-rail-btn is-tools" type="button" data-open-tools aria-label="أدوات">${icons.settings}<span class="guest-rail-label">أدوات</span></button>
          <button class="guest-rail-btn" type="button" data-open-account aria-label="المزيد">${icons.menu}</button>
        </div>

        ${isToolsWorkspace ? renderToolsSidebarPanel() : `
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

          ${isChatSidebar ? `
            <button class="guest-upgrade-card" type="button" data-open-upgrade>
              <div class="upgrade-mark">${icons.crown}</div>
              <div>
                <strong>${escapeHtml(upgradeTarget.title)}</strong>
                <span>استمتع بمزايا إضافية وتجربة أفضل</span>
              </div>
            </button>
          ` : ""}
        `}

        ${isToolsWorkspace ? "" : userAccountCard}
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
    const currentPlanKey = getUserPackageKey();
    const upgradeTarget = getNextUpgradeTarget();
    const upgradeHeading = currentPlanKey === "pro_max"
      ? `${escapeHtml(upgradeTarget.activeTitle)} <span>مفعلة</span>`
      : `الترقية إلى <span>${escapeHtml(upgradeTarget.name)}</span>`;

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
        <section class="upgrade-modal-card" role="dialog" aria-modal="true" aria-label="${escapeHtml(upgradeTarget.title)}">
          <button class="upgrade-close-btn" type="button" data-close-upgrade aria-label="إغلاق">×</button>
          <header class="upgrade-modal-head">
            <div class="upgrade-title-mark">${icons.crown}</div>
            <div>
              <h2>${upgradeHeading}</h2>
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

  function renderToolSuggestionModal() {
    if (!state.toolSuggestionModalOpen) return "";
    const importance = Math.max(1, Math.min(5, Number(state.toolSuggestionImportance || 3)));
    const draft = state.toolSuggestionDraft || {};
    const statusClass = state.toolSuggestionResultType === "matched" || state.toolSuggestionResultType === "already_voted"
      ? "is-matched"
      : "is-created";
    return `
      <div class="tool-suggestion-gate is-open">
        <button class="tool-suggestion-backdrop" type="button" data-close-tool-suggestion aria-label="إغلاق نموذج اقتراح أداة"></button>
        <section class="tool-suggestion-card" role="dialog" aria-modal="true" aria-label="اقتراح أداة جديدة">
          <button class="tool-suggestion-close" type="button" data-close-tool-suggestion aria-label="إغلاق">×</button>
          <header class="tool-suggestion-head">
            <span class="tool-suggestion-mark" aria-hidden="true">${icons.sparkle}</span>
            <div>
              <h2>اقتراح أداة جديدة</h2>
              <p>شاركنا الأداة التي تحتاجها، وإذا كان هناك اقتراح مشابه سنضيف صوتك عليه بدل التكرار.</p>
            </div>
          </header>

          <div class="tool-suggestion-reward">
            <span aria-hidden="true">${icons.gift}</span>
            <b>إذا تم تنفيذ الأداة لاحقًا تحصل أنت وكل من صوّت عليها على 50 XP تلقائيًا.</b>
          </div>

          <form class="tool-suggestion-form" data-tool-suggestion-form>
            <div class="tool-suggestion-grid">
              <label>
                <span>اسم الأداة المقترحة *</span>
                <input class="tool-suggestion-field" name="title" maxlength="180" required placeholder="مثال: مزيل خلفية الصور" value="${escapeHtml(draft.title || "")}">
              </label>
              <label>
                <span>فئة الأداة *</span>
                <select class="tool-suggestion-field" name="category" required>
                  ${toolSuggestionCategories.map((category) => `<option value="${escapeHtml(category)}" ${category === (draft.category || "") ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
                </select>
              </label>
            </div>
            <label>
              <span>وصف الأداة *</span>
              <textarea class="tool-suggestion-field" name="description" maxlength="1800" required placeholder="اشرح ماذا تفعل الأداة بشكل مختصر وواضح">${escapeHtml(draft.description || "")}</textarea>
            </label>
            <label>
              <span>لماذا تحتاج هذه الأداة؟ *</span>
              <textarea class="tool-suggestion-field" name="useCase" maxlength="1800" required placeholder="اذكر حالة الاستخدام أو المشكلة التي ستحلها الأداة">${escapeHtml(draft.useCase || "")}</textarea>
            </label>
            <label>
              <span>اقتراحات إضافية</span>
              <textarea class="tool-suggestion-field" name="extraNotes" maxlength="1400" placeholder="أي تفاصيل اختيارية مثل الصيغ المدعومة أو طريقة العمل">${escapeHtml(draft.extraNotes || "")}</textarea>
            </label>

            <div class="tool-suggestion-bottom-row">
              <div class="tool-suggestion-importance">
                <span>تقييم الأهمية</span>
                <div>
                  ${[1, 2, 3, 4, 5].map((value) => `
                    <button class="${value === importance ? "is-active" : ""}" type="button" data-tool-suggestion-importance="${value}">${value}</button>
                  `).join("")}
                </div>
              </div>
              <label class="tool-suggestion-upload">
                <input type="file" accept="image/png,image/jpeg,image/webp" data-tool-suggestion-image hidden>
                <span>${icons.document}</span>
                <b>${state.toolSuggestionAttachmentName ? escapeHtml(state.toolSuggestionAttachmentName) : "صورة توضيحية اختيارية"}</b>
                <small>PNG, JPG, WebP حتى 5MB</small>
              </label>
            </div>

            ${state.toolSuggestionError ? `<p class="tool-suggestion-alert is-error">${escapeHtml(state.toolSuggestionError)}</p>` : ""}
            ${state.toolSuggestionSuccess ? `<p class="tool-suggestion-alert ${statusClass}">${escapeHtml(state.toolSuggestionSuccess)}</p>` : ""}

            <footer class="tool-suggestion-actions">
              <button class="tool-suggestion-secondary" type="button" data-close-tool-suggestion>إلغاء</button>
              <button class="tool-suggestion-primary" type="submit" ${state.toolSuggestionSubmitting ? "disabled" : ""}>
                ${state.toolSuggestionSubmitting ? "جاري الإرسال..." : "إرسال الاقتراح"}
              </button>
            </footer>
          </form>
        </section>
      </div>
    `;
  }

  function renderToolSuggestionPage() {
    const importance = Math.max(1, Math.min(5, Number(state.toolSuggestionImportance || 3)));
    const draft = state.toolSuggestionDraft || {};
    const statusClass = state.toolSuggestionResultType === "matched" || state.toolSuggestionResultType === "already_voted"
      ? "is-matched"
      : "is-created";
    const categoryValue = draft.category || "";
    const descriptionLength = String(draft.description || "").length;
    const useCaseLength = String(draft.useCase || "").length;
    const statsSeed = Math.max(1, importance);

    return `
      <section class="guest-main tools-main tool-suggestion-main" aria-label="اقتراح أداة جديدة">
        <div class="tool-suggestion-page">
          <div class="tool-suggestion-topbar">
            <button class="tool-suggestion-return" type="button" data-close-tool-suggestion>
              <span aria-hidden="true">←</span>
              <b>العودة إلى الأدوات</b>
            </button>
            <nav class="tool-suggestion-breadcrumb" aria-label="مسار الصفحة">
              <span>الرئيسية</span>
              <span aria-hidden="true">‹</span>
              <span>الأدوات</span>
              <span aria-hidden="true">‹</span>
              <b>اقتراح أداة جديدة</b>
            </nav>
          </div>

          <header class="tool-suggestion-hero">
            <div class="tool-suggestion-hero-title">
              <h1>اقتراح أداة جديدة</h1>
              <span class="tool-suggestion-hero-mark" aria-hidden="true">${icons.sparkle}</span>
            </div>
            <p>أخبرنا عن الأداة التي تتمنى وجودها في أورليكس، وسنأخذ اقتراحك بعين الاعتبار</p>
          </header>

          <div class="tool-suggestion-layout">
            <form class="tool-suggestion-form-card" data-tool-suggestion-form>
              <header class="tool-suggestion-card-head">
                <h2>معلومات الأداة المقترحة</h2>
                <span aria-hidden="true">${icons.bell}</span>
              </header>

              <div class="tool-suggestion-grid">
                <label>
                  <span>اسم الأداة المقترحة *</span>
                  <input class="tool-suggestion-field" data-tool-suggestion-input="title" name="title" maxlength="180" required placeholder="مثال: أداة تلخيص المقالات" value="${escapeHtml(draft.title || "")}">
                </label>
                <label>
                  <span>اختر فئة الأداة *</span>
                  <select class="tool-suggestion-field" data-tool-suggestion-input="category" name="category" required>
                    <option value="" ${categoryValue ? "" : "selected"} disabled>اختر فئة مناسبة</option>
                    ${toolSuggestionCategories.map((category) => `<option value="${escapeHtml(category)}" ${category === categoryValue ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
                  </select>
                </label>
              </div>

              <label class="tool-suggestion-wide-field">
                <span>وصف الأداة *</span>
                <small>صف لنا الأداة التي تقترحها وما الذي ستساعد المستخدم على القيام به</small>
                <textarea class="tool-suggestion-field" data-tool-suggestion-input="description" name="description" maxlength="500" required placeholder="اكتب وصفًا واضحًا للأداة ومميزاتها وطريقة عملها المقترحة...">${escapeHtml(draft.description || "")}</textarea>
                <b class="tool-suggestion-counter">${escapeHtml(`${descriptionLength}/500`)}</b>
              </label>

              <label class="tool-suggestion-wide-field">
                <span>لماذا تعتقد أن هذه الأداة مهمة؟ *</span>
                <small>ما المشكلة التي ستحلها هذه الأداة للمستخدمين؟</small>
                <textarea class="tool-suggestion-field" data-tool-suggestion-input="useCase" name="useCase" maxlength="300" required placeholder="اشرح لنا لماذا تحتاج هذه الأداة...">${escapeHtml(draft.useCase || "")}</textarea>
                <b class="tool-suggestion-counter">${escapeHtml(`${useCaseLength}/300`)}</b>
              </label>

              <div class="tool-suggestion-bottom-row">
                <div class="tool-suggestion-importance">
                  <span>مستوى أهمية الأداة</span>
                  <small>حدد مدى أهمية هذه الأداة بالنسبة لك</small>
                  <div>
                    ${[1, 2, 3, 4, 5].map((value) => `
                      <button class="${value === importance ? "is-active" : ""}" type="button" data-tool-suggestion-importance="${value}" aria-pressed="${value === importance ? "true" : "false"}">${value}</button>
                    `).join("")}
                  </div>
                </div>

                <label>
                  <span>اقتراحات إضافية (اختياري)</span>
                  <small>ميزات إضافية، أمثلة، أو أي ملاحظات أخرى</small>
                  <input class="tool-suggestion-field" data-tool-suggestion-input="extraNotes" name="extraNotes" maxlength="300" placeholder="أي أفكار إضافية تود مشاركتها..." value="${escapeHtml(draft.extraNotes || "")}">
                </label>
              </div>

              <label class="tool-suggestion-upload">
                <input type="file" accept="image/png,image/jpeg,image/webp" data-tool-suggestion-image hidden>
                <span aria-hidden="true">${icons.attach}</span>
                <div>
                  <b>${state.toolSuggestionAttachmentName ? escapeHtml(state.toolSuggestionAttachmentName) : "إضافة صورة توضيحية (اختياري)"}</b>
                  <small>يمكنك إضافة صورة توضح فكرتك بشكل أفضل (JPG, PNG, WebP حتى 5MB)</small>
                </div>
              </label>

              ${state.toolSuggestionError ? `<p class="tool-suggestion-alert is-error">${escapeHtml(state.toolSuggestionError)}</p>` : ""}
              ${state.toolSuggestionSuccess ? `<p class="tool-suggestion-alert ${statusClass}">${escapeHtml(state.toolSuggestionSuccess)}</p>` : ""}

              <footer class="tool-suggestion-actions">
                <button class="tool-suggestion-primary" type="submit" ${state.toolSuggestionSubmitting ? "disabled" : ""}>
                  <span>${state.toolSuggestionSubmitting ? "جاري الإرسال..." : "إرسال الاقتراح"}</span>
                  ${icons.send}
                </button>
                <button class="tool-suggestion-secondary" type="button" data-close-tool-suggestion>إلغاء</button>
              </footer>
            </form>

            <aside class="tool-suggestion-info-panel" aria-label="كيف تعمل هذه الخدمة؟">
              <section class="tool-suggestion-side-card tool-suggestion-how">
                <header>
                  <span class="tool-suggestion-side-icon" aria-hidden="true">${icons.sparkle}</span>
                  <h2>كيف تعمل هذه الخدمة؟</h2>
                </header>

                <div class="tool-suggestion-steps">
                  <article>
                    <span>${icons.edit}</span>
                    <div>
                      <b>أرسل اقتراحات</b>
                      <small>اكتب تفاصيل الأداة التي تتمنى وجودها في أورليكس وارسل اقتراحك.</small>
                    </div>
                  </article>
                  <article>
                    <span>${icons.group}</span>
                    <div>
                      <b>مراجعة فريق أورليكس</b>
                      <small>يقوم فريقنا بمراجعة جميع الاقتراحات وتقييمها بناءً على احتياجات المستخدمين.</small>
                    </div>
                  </article>
                  <article>
                    <span>${icons.bolt}</span>
                    <div>
                      <b>التطوير والتصويت</b>
                      <small>إذا تم اختيار اقتراحك، سنعمل على تطويره وستكون من أوائل من يجربه.</small>
                    </div>
                  </article>
                </div>
              </section>

              <section class="tool-suggestion-side-card tool-suggestion-stats">
                <header>
                  <h3>إحصائيات الاقتراحات</h3>
                  <span aria-hidden="true">${icons.ai}</span>
                </header>
                <div class="tool-suggestion-stats-grid">
                  <div>
                    <strong>${escapeHtml(formatNumber(112 + statsSeed))}</strong>
                    <small>تم تنفيذها</small>
                  </div>
                  <div>
                    <strong>${escapeHtml(formatNumber(356 + statsSeed))}</strong>
                    <small>قيد المراجعة</small>
                  </div>
                  <div>
                    <strong>${escapeHtml(formatNumber(1248 + statsSeed))}</strong>
                    <small>إجمالي الاقتراحات</small>
                  </div>
                </div>
              </section>

              <section class="tool-suggestion-side-card tool-suggestion-reward-card">
                <span aria-hidden="true">${icons.crown}</span>
                <div>
                  <h3>مكافأة خاصة</h3>
                  <p>إذا تم تنفيذ أداتك المقترحة، ستحصل على 50 XP كمكافأة لتحفيز مساهمتك!</p>
                </div>
              </section>
            </aside>
          </div>

          <footer class="tool-suggestion-footnote">
            <span aria-hidden="true">${icons.lock}</span>
            <p>جميع الاقتراحات تساهم في تطوير منصة أورليكس. نشكرك على مشاركتك وإبداعك!</p>
          </footer>
        </div>
      </section>
    `;
  }

  function renderShell() {
    const profile = getProfile();
    const isToolsWorkspace = state.section === "ai-tools";
    const isSubscriberTools = isToolsWorkspace && ["image-enhancer", "image-clarifier", "png-to-pdf", "pdf-to-png", "pdf-unlock", "image-converter", "image-compressor", "image-rotator", "image-cropper"].includes(state.toolView);
    const compactViewport = isCompactViewport();
    document.body.classList.toggle("is-mobile-app", compactViewport);
    if (compactViewport) {
      mobileV2Root.innerHTML = renderMobileV2(profile);
      app.innerHTML = "";
      return;
    }
    mobileV2Root.innerHTML = "";
    app.innerHTML = `
      <div class="desktop-app">
        <div class="guest-shell ${getEffectiveTheme() === "dark" ? "theme-dark" : ""} ${isHomeWorkspace ? "is-home-workspace" : ""} ${isToolsWorkspace ? "is-tools-workspace" : ""} ${isSubscriberTools ? "is-subscriber-tools" : ""} ${state.sidebarCollapsed ? "is-sidebar-collapsed" : ""} ${state.mobileSidebarOpen ? "is-mobile-sidebar-open" : ""}">
          ${renderMobileHeader()}
          <div class="mobile-drawer-backdrop" data-toggle-sidebar aria-hidden="${state.mobileSidebarOpen ? "false" : "true"}"${isCompactViewport() && !state.mobileSidebarOpen ? " hidden" : ""}></div>
          ${renderSidebar()}
          ${renderMain(profile)}
          ${isHomeWorkspace ? "" : renderRightPanel(profile)}
          <input type="file" id="guestFilePicker" hidden multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.md,.ppt,.pptx">
        </div>
      </div>
      ${renderAuthModal()}
      ${renderUpgradeModal()}
      ${renderSettingsModal()}
      ${renderNotificationsModal()}
      <div class="guest-toast-stack" aria-live="polite"></div>
    `;
  }

  function showToast(message, duration = 4000) {
    const stack = mobileV2Root.querySelector(".guest-toast-stack") || app.querySelector(".guest-toast-stack");
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

  function resetToolSuggestionFormState() {
    state.toolSuggestionError = "";
    state.toolSuggestionSuccess = "";
    state.toolSuggestionResultType = "";
    state.toolSuggestionImportance = 3;
    state.toolSuggestionAttachmentName = "";
    state.toolSuggestionAttachmentDataUrl = "";
    state.toolSuggestionDraft = {};
  }

  function getScrollSnapshot() {
    const pageScroller = document.scrollingElement || document.documentElement;
    const mainScroller = mobileV2Root.querySelector(".guest-main") || app.querySelector(".guest-main");
    const conversationScroller = mobileV2Root.querySelector(".guest-conversation-card") || app.querySelector(".guest-conversation-card");
    return {
      windowX: window.scrollX || 0,
      windowY: window.scrollY || 0,
      pageTop: pageScroller?.scrollTop || 0,
      pageLeft: pageScroller?.scrollLeft || 0,
      mainTop: mainScroller?.scrollTop || 0,
      mainLeft: mainScroller?.scrollLeft || 0,
      conversationTop: conversationScroller?.scrollTop || 0,
      conversationLeft: conversationScroller?.scrollLeft || 0
    };
  }

  function restoreScrollSnapshot(snapshot) {
    if (!snapshot) return;
    const pageScroller = document.scrollingElement || document.documentElement;
    const mainScroller = mobileV2Root.querySelector(".guest-main") || app.querySelector(".guest-main");
    const conversationScroller = mobileV2Root.querySelector(".guest-conversation-card") || app.querySelector(".guest-conversation-card");
    if (pageScroller) {
      pageScroller.scrollTop = snapshot.pageTop;
      pageScroller.scrollLeft = snapshot.pageLeft;
    }
    if (mainScroller) {
      mainScroller.scrollTop = snapshot.mainTop;
      mainScroller.scrollLeft = snapshot.mainLeft;
    }
    if (conversationScroller) {
      conversationScroller.scrollTop = snapshot.conversationTop;
      conversationScroller.scrollLeft = snapshot.conversationLeft;
    }
    window.scrollTo(snapshot.windowX, snapshot.windowY);
  }

  function preserveScrollPosition(callback) {
    const snapshot = getScrollSnapshot();
    const result = callback();
    restoreScrollSnapshot(snapshot);
    window.requestAnimationFrame(() => restoreScrollSnapshot(snapshot));
    return result;
  }

  function focusComposerSoon() {
    window.requestAnimationFrame(() => {
      const composeInput = mobileV2Root.querySelector("[data-compose-input]") || app.querySelector("[data-compose-input]");
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
      const conversation = mobileV2Root.querySelector(".guest-conversation-card") || app.querySelector(".guest-conversation-card");
      if (!conversation) return;
      conversation.scrollTop = conversation.scrollHeight;
    });
  }

  function getComposeStatusText() {
    if (state.sending) return "جاري الإرسال...";
    return String(state.chatSendError || "").trim();
  }

  function renderComposeStatus() {
    const statusText = getComposeStatusText();
    if (!statusText) return "";
    return `<span class="compose-send-status ${state.chatSendError ? "is-error" : ""}" data-compose-status>${escapeHtml(statusText)}</span>`;
  }

  function renderComposeSendButton() {
    const buttonClass = [
      "compose-send",
      isAuthenticated() ? "" : "requires-auth",
      state.sending ? "is-sending" : ""
    ].filter(Boolean).join(" ");
    const label = state.sending ? "جاري الإرسال" : "إرسال";
    const content = state.sending
      ? '<span class="compose-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>'
      : icons.send;

    return `
      <button class="${buttonClass}" type="submit" ${state.sending ? "disabled" : ""} aria-label="${label}" aria-busy="${state.sending ? "true" : "false"}">
        ${content}
      </button>
    `;
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
        mergeSavedConversationCacheItem(result.data.conversation);
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
      let result = await apiClient.getStudentConversations({ limit: 100 });
      if ((!result?.ok || !Array.isArray(result.data?.items)) && apiClient.getChatSessions) {
        result = await apiClient.getChatSessions({ limit: 100 });
      }
      if (result?.ok) {
        const items = Array.isArray(result.data?.items) ? result.data.items : [];
        if (items.length || !readSavedConversationCacheForUser().length) {
          writeSavedConversationCacheForCurrentUser(items);
        }
        items.forEach((item) => upsertSavedConversationThread(item));
        getSavedConversationSections().forEach((sectionKey) => sortThreadGroupsByNewest(sectionKey));
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
    if (state.appPreferences?.saveChats === false) return;
    window.setTimeout(() => {
      syncSavedConversations();
    }, 0);
  }

  function setSection(sectionKey, replace = false) {
    if (!sectionProfiles[sectionKey]) return;
    state.section = sectionKey;
    state.mobileSidebarOpen = false;
    if (sectionKey !== "ai-tools") {
      state.toolView = "tools";
    }
    ensureThreadState(sectionKey);
    if (isAuthenticated()) {
      state.savedConversationsLoaded = false;
      scheduleSavedConversationSync();
    }
    updateUrl(replace);
    render();
  }

  function getFileInput() {
    return mobileV2Root.querySelector("#guestFilePicker") || app.querySelector("#guestFilePicker");
  }

  function createNewThreadFromDraft(title = "محادثة جديدة") {
    const sectionKey = state.section;
    const nowSortTime = Date.now();
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
      { created: "الآن", messages: "0 رسائل", updated: "الآن", sortTime: nowSortTime }
    );
    newThread.messages = [];
    newThread.sortTime = nowSortTime;
    newThread.updatedAtMs = nowSortTime;

    const todayGroup = state.threadState[sectionKey][0];
    if (todayGroup) {
      todayGroup.items.unshift(newThread);
    } else {
      state.threadState[sectionKey].unshift(group("اليوم", [newThread]));
    }
    sortThreadGroupsByNewest(sectionKey);
    state.activeThreadId[sectionKey] = newThread.id;
    setComposerValue("", sectionKey);
  }

  function removeSelectedFile(index) {
    if (index < 0 || index >= state.selectedFiles.length) return;
    preserveScrollPosition(() => {
      const [removed] = state.selectedFiles.splice(index, 1);
      revokeAttachmentPreview(removed);
      render();
    });
  }

  function pickFiles() {
    if (!isAuthenticated()) {
      openAuthModal("أضف الملفات بعد تسجيل الدخول.");
      return;
    }
    if (state.appPreferences?.files === false) {
      showToast("رفع الملفات متوقف من الإعدادات.");
      state.settingsModalTab = "apps";
      state.settingsModalOpen = true;
      render();
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

  function isVisionImageFile(file) {
    const type = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();
    return ["image/png", "image/jpeg", "image/webp"].includes(type)
      || /\.(png|jpe?g|webp)$/i.test(name);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Unable to read file."));
      reader.readAsDataURL(file);
    });
  }

  function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load image."));
      image.src = dataUrl;
    });
  }

  async function compressImageForVision(file) {
    const sourceDataUrl = await readFileAsDataUrl(file);
    const image = await loadImageFromDataUrl(sourceDataUrl);
    const attempts = [
      { maxSide: 1600, quality: 0.84 },
      { maxSide: 1200, quality: 0.78 },
      { maxSide: 900, quality: 0.72 }
    ];

    for (const attempt of attempts) {
      const ratio = Math.min(1, attempt.maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * ratio));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * ratio));
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", attempt.quality);
      if (dataUrl.length <= 1_600_000 || attempt === attempts[attempts.length - 1]) {
        return {
          name: file.name || "image.jpg",
          type: "image/jpeg",
          url: dataUrl,
          width,
          height,
          original_size: Number(file.size || 0)
        };
      }
    }

    return null;
  }

  async function readImageAttachments(files = []) {
    const images = [];
    for (const file of files.filter(isVisionImageFile).slice(0, 4)) {
      if (Number(file.size || 0) > 10 * 1024 * 1024) continue;
      try {
        const image = await compressImageForVision(file);
        if (image?.url) images.push(image);
      } catch (_) {
        // Image payloads are optional; the filename is still sent.
      }
    }
    return images;
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
    if (state.sending) return;
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

    state.sending = true;
    state.chatSendError = "";
    render();

    const outgoingFiles = [...state.selectedFiles];
    const outboundMessage = input || "حلل المرفقات المرسلة.";
    const canSendLargeRequest = await confirmLargeChatRequest(outboundMessage);
    if (!canSendLargeRequest) {
      state.sending = false;
      render();
      showToast("تم إلغاء الإرسال قبل استهلاك XP.");
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

    const displayUserMessage = input || `أرسلت ${outgoingFiles.length} مرفق للتحليل.`;
    const newUserMessage = { role: "user", body: displayUserMessage };
    const pendingAssistant = {
      role: "assistant",
      body: assistantReply("جاري تجهيز الرد...", ["نعالج رسالتك الآن ونرتب الإجابة من الخادم."])
    };

    threadEntry.messages.push(newUserMessage, pendingAssistant);
    state.homeConversationOpen = true;
    const sentAtMs = Date.now();
    threadEntry.time = "الآن";
    threadEntry.sortTime = sentAtMs;
    threadEntry.updatedAtMs = sentAtMs;
    threadEntry.stats = {
      ...(threadEntry.stats || {}),
      updated: "الآن",
      messages: `${Math.max(1, threadEntry.messages.length)} رسالة`,
      sortTime: sentAtMs
    };
    sortThreadGroupsByNewest(state.section);
    render();
    scrollConversationToLatest();

    let sentSuccessfully = false;

    const formatChatFailureMessage = (result, hasImageAttachments = false) => {
      const status = Number(result?.status || 0);
      const message = String(result?.message || "").trim();
      if (status === 401 || status === 403) return "انتهت الجلسة، سجّل الدخول من جديد.";
      if (status === 413) return hasImageAttachments ? "الصورة أو الملف كبير جدًا. جرّب صورة أصغر." : "الطلب كبير جدًا. اختصر الرسالة ثم أعد المحاولة.";
      if (status === 429) return "طلبات كثيرة، حاول بعد قليل.";
      if (status === 404) return "مسار الشات غير موجود على هذا الدومين. تحقق من API backend أو رابط النشر.";
      if (status >= 500) return message || (hasImageAttachments ? "حدث خطأ في خادم تحليل الصور." : "حدث خطأ في الخادم.");
      if (result?.networkError || status === 0) return "تعذر الاتصال بالـ Backend. تحقق من رابط API أو اتصالك ثم أعد المحاولة.";
      return message || "تعذر تنفيذ الطلب.";
    };

    try {
      const attachmentPreviews = await readAttachmentPreviews(outgoingFiles);
      const attachmentImages = await readImageAttachments(outgoingFiles);
      const hasImageAttachments = outgoingFiles.some(isVisionImageFile);
      if (hasImageAttachments && !attachmentImages.length) {
        throw new Error("تعذر تجهيز الصورة للإرسال. استخدم PNG أو JPG أو WebP بحجم أقل من 10MB.");
      }
      if (hasImageAttachments && apiClient.getReady) {
        const ready = await apiClient.getReady({ task: "image" });
        if (!ready?.ok) {
          throw new Error(ready?.message || "خدمة تحليل الصور غير جاهزة على الخادم الآن.");
        }
      }
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
        attachment_previews: attachmentPreviews,
        attachment_images: attachmentImages
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
        resetDailyRewardState();
        setComposerValue(input);
        state.authReason = "انتهت الجلسة أو لم تكتمل. سجّل دخولك مرة أخرى حتى يعمل الشات من حسابك.";
        state.authModalOpen = true;
        return;
      }

      if (!result.ok || !result.data?.assistant_message?.body) {
        const hasImageAttachments = outgoingFiles.some(isVisionImageFile);
        state.chatSendError = "تعذر إرسال الرسالة، حاول مرة أخرى.";
        threadEntry.messages.push({
          role: "assistant",
          body: assistantReply(hasImageAttachments ? "تعذر تحليل الصورة الآن." : "تعذر الوصول إلى خدمة الشات الآن.", [
            formatChatFailureMessage(result, hasImageAttachments)
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
          body: buildAssistantReplyFromText(result.data.assistant_message.body)
        });
        if (result.data.conversation_id) {
          const savedAt = new Date().toISOString();
          const savedAtMs = getConversationSortTime(savedAt);
          threadEntry.sortTime = savedAtMs;
          threadEntry.updatedAtMs = savedAtMs;
          threadEntry.stats = {
            ...(threadEntry.stats || {}),
            updated: "الآن",
            sortTime: savedAtMs
          };
          upsertSavedConversationThread({
            id: String(result.data.conversation_id),
            title: input || threadEntry.title,
            last_message_at: savedAt,
            created_at: threadEntry.stats?.created || savedAt
          }, threadEntry.messages);
          mergeSavedConversationCacheItem({
            id: String(result.data.conversation_id),
            title: input || threadEntry.title,
            last_message_at: savedAt,
            created_at: savedAt,
            updated_at: savedAt
          });
          state.hydratedConversationIds[String(result.data.conversation_id)] = true;
          saveConversationIdsForCurrentUser();
        }
        if (input || outgoingFiles.length) {
          threadEntry.title = ["محادثة جديدة", "تحليل مرفقات"].includes(threadEntry.title)
            ? (input || "تحليل مرفقات").slice(0, 32)
            : threadEntry.title;
        }
        sentSuccessfully = true;
        state.chatSendError = "";
        setComposerValue("");
      }
    } catch (error) {
      threadEntry.messages.pop();
      const hasImageAttachments = outgoingFiles.some(isVisionImageFile);
      const errorMessage = String(error?.message || "").trim();
      state.chatSendError = "تعذر إرسال الرسالة، حاول مرة أخرى.";
      showToast(state.chatSendError);
      threadEntry.messages.push({
        role: "assistant",
        body: assistantReply(
          hasImageAttachments ? "تعذر تحليل الصورة الآن." : "تعذر الوصول إلى خدمة الشات الآن.",
          [
            errorMessage ||
              (hasImageAttachments
                ? "لم يكتمل إرسال الصورة إلى الخادم. تحقق من خدمة تحليل الصور ثم أعد المحاولة."
                : "تعذر الاتصال بالـ Backend. تحقق من رابط API أو أعد المحاولة بعد قليل.")
          ]
        )
      });
    } finally {
      state.sending = false;
      if (sentSuccessfully) {
        clearSelectedFiles();
      } else {
        state.selectedFiles = outgoingFiles;
      }
      render();
      scrollConversationToLatest();
    }
  }

  async function submitOpenAiWebSearchV2() {
    const queryInput = app.querySelector("[data-smart-search-query]");
    const languageInput = app.querySelector("[data-smart-search-language]");
    const sourceInput = app.querySelector("[data-smart-search-source]");
    const query = String(queryInput?.value || state.openAiWebSearchV2.query || "").trim();

    if (!query) {
      state.openAiWebSearchV2.error = "اكتب سؤال البحث أولًا.";
      preserveScrollPosition(() => render());
      return;
    }

    if (!isAuthenticated()) {
      state.openAiWebSearchV2.query = query;
      openAuthModal("سجّل دخولك لاستخدام البحث الذكي.");
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient?.assistantV3) {
      state.openAiWebSearchV2.error = "خدمة المساعد غير جاهزة الآن.";
      preserveScrollPosition(() => render());
      return;
    }

    state.openAiWebSearchV2 = {
      ...state.openAiWebSearchV2,
      query,
      language: String(languageInput?.value || state.openAiWebSearchV2.language || "العربية"),
      sourceType: String(sourceInput?.value || state.openAiWebSearchV2.sourceType || "all"),
      loading: true,
      error: "",
      result: null
    };
    preserveScrollPosition(() => render());

    try {
      const result = await apiClient.assistantV3({
        message: query
      });

      if (!result?.ok) {
        throw new Error(getErrorMessage(
          result?.message ||
          result?.payload?.message ||
          result?.payload?.details ||
          result?.payload?.error ||
          result?.payload ||
          result?.raw ||
          `HTTP ${result?.status || 0}`
        ));
      }

      if (result.data?.user) {
        const token = apiClient.getToken?.();
        if (token) {
          apiClient.setSession?.({ token, user: result.data.user });
        }
        state.currentUser = persistEmbeddedUser(result.data.user) || normalizeUser(result.data.user) || state.currentUser;
      }

      const historyItem = {
        query,
        time: "now"
      };
      state.openAiWebSearchV2 = {
        ...state.openAiWebSearchV2,
        loading: false,
        error: "",
        result: result.data || {},
        history: [historyItem, ...(state.openAiWebSearchV2.history || []).filter((item) => item.query !== query)].slice(0, 6)
      };
      preserveScrollPosition(() => render());
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("CLIENT_SEARCH_ERROR", {
        message,
        error
      });
      state.openAiWebSearchV2 = {
        ...state.openAiWebSearchV2,
        loading: false,
        error: message
      };
      preserveScrollPosition(() => render());
    }
  }

  async function submitWritingAssistant() {
    const readField = (key) => app.querySelector(`[data-writing-field="${key}"]`);
    const topic = String(readField("topic")?.value || state.writingAssistant.topic || "").trim();
    const details = String(readField("details")?.value || state.writingAssistant.details || "").trim();

    if (!topic && !details) {
      state.writingAssistant.error = "اكتب موضوعًا أو نصًا ليعمل مساعد الكتابة.";
      preserveScrollPosition(() => render());
      return;
    }

    if (!isAuthenticated()) {
      state.writingAssistant = {
        ...state.writingAssistant,
        topic,
        details,
        error: ""
      };
      openAuthModal("سجّل دخولك لاستخدام مساعد الكتابة وحفظ الناتج داخل حسابك.");
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient?.runWritingAssistant) {
      state.writingAssistant.error = "خدمة مساعد الكتابة غير جاهزة الآن.";
      preserveScrollPosition(() => render());
      return;
    }

    state.writingAssistant = {
      ...state.writingAssistant,
      topic,
      details,
      contentType: String(readField("contentType")?.value || state.writingAssistant.contentType || "مقال"),
      purpose: String(readField("purpose")?.value || state.writingAssistant.purpose || "إقناع"),
      tone: String(readField("tone")?.value || state.writingAssistant.tone || "احترافية"),
      language: String(readField("language")?.value || state.writingAssistant.language || "العربية"),
      length: String(readField("length")?.value || state.writingAssistant.length || "متوسط (300 - 500 كلمة)"),
      loading: true,
      error: "",
      result: null
    };
    preserveScrollPosition(() => render());

    try {
      const result = await apiClient.runWritingAssistant({
        task_type: state.writingAssistant.taskType,
        input_text: topic,
        details,
        options: {
          content_type: state.writingAssistant.contentType,
          purpose: state.writingAssistant.purpose,
          tone: state.writingAssistant.tone,
          language: state.writingAssistant.language,
          length: state.writingAssistant.length
        }
      });

      if (!result?.ok) {
        throw new Error(result?.message || "تعذر تشغيل مساعد الكتابة الآن.");
      }

      if (result.data?.user) {
        const token = apiClient.getToken?.();
        if (token) {
          apiClient.setSession?.({ token, user: result.data.user });
        }
        state.currentUser = persistEmbeddedUser(result.data.user) || normalizeUser(result.data.user) || state.currentUser;
      }

      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: "",
        result: result.data || {}
      };
      preserveScrollPosition(() => render());
    } catch (error) {
      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: error?.message || "تعذر تشغيل مساعد الكتابة الآن."
      };
      preserveScrollPosition(() => render());
    }
  }

  function getErrorMessage(error) {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;

    if (typeof error === "object") {
      return (
        error.message ||
        error.details ||
        error.error ||
        JSON.stringify(error, null, 2)
      );
    }

    return String(error);
  }

  async function submitToneTool() {
    const textField = app.querySelector('[data-tone-field="text"]');
    const levelField = app.querySelector('[data-tone-field="level"]');
    const text = String(textField?.value || state.writingAssistant.toneText || "").trim();
    const tone = String(state.writingAssistant.toneTarget || "formal");
    const level = String(levelField?.value || state.writingAssistant.toneLevel || "balanced");

    if (text.length < 5) {
      state.writingAssistant.error = "اكتب نصًا أطول قليلًا لتغيير النبرة.";
      render();
      return;
    }

    if (!isAuthenticated()) {
      state.writingAssistant = {
        ...state.writingAssistant,
        toneText: text,
        toneLevel: level,
        error: ""
      };
      openAuthModal("سجّل دخولك لاستخدام تغيير النبرة وحفظ النتيجة داخل حسابك.");
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient?.changeTone) {
      state.writingAssistant.error = "خدمة تغيير النبرة غير جاهزة الآن.";
      render();
      return;
    }

    state.writingAssistant = {
      ...state.writingAssistant,
      toneText: text,
      toneTarget: tone,
      toneLevel: level,
      loading: true,
      error: "",
      result: null
    };
    render();

    try {
      const result = await apiClient.changeTone({
        text,
        tone,
        level
      });

      if (!result?.ok) {
        throw new Error(result?.message || "تعذر تغيير النبرة الآن.");
      }

      if (result.data?.user) {
        const token = apiClient.getToken?.();
        if (token) {
          apiClient.setSession?.({ token, user: result.data.user });
        }
        state.currentUser = persistEmbeddedUser(result.data.user) || normalizeUser(result.data.user) || state.currentUser;
      }

      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: "",
        result: result.data || {}
      };
      render();
    } catch (error) {
      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: error?.message || "تعذر تغيير النبرة الآن."
      };
      render();
    }
  }

  async function submitCorrectionTextTool() {
    const textField = app.querySelector('[data-correction-field="text"]');
    const levelField = app.querySelector('[data-correction-field="level"]');
    const styleField = app.querySelector('[data-correction-field="style"]');
    const keepStyleField = app.querySelector('[data-correction-field="keepStyle"]');
    const text = String(textField?.value || state.writingAssistant.correctionText || "").trim();
    const type = String(state.writingAssistant.correctionType || "full");
    const level = String(levelField?.value || state.writingAssistant.correctionLevel || "balanced");
    const style = String(styleField?.value || (state.writingAssistant.correctionKeepStyle === false ? "improve" : "keep"));
    const keepStyle = keepStyleField ? Boolean(keepStyleField.checked) : style !== "improve";

    if (text.length < 5) {
      state.writingAssistant.error = "النص قصير جدًا. اكتب جملة أو فقرة لتصحيحها.";
      render();
      return;
    }

    if (!isAuthenticated()) {
      state.writingAssistant = {
        ...state.writingAssistant,
        correctionText: text,
        correctionType: type,
        correctionLevel: level,
        correctionKeepStyle: keepStyle
      };
      openAuthModal("سجّل دخولك لاستخدام التصحيح اللغوي وحفظ النتيجة في حسابك.");
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient?.correctText) {
      state.writingAssistant.error = "خدمة التصحيح اللغوي غير جاهزة الآن.";
      render();
      return;
    }

    state.writingAssistant = {
      ...state.writingAssistant,
      correctionText: text,
      correctionType: type,
      correctionLevel: level,
      correctionKeepStyle: keepStyle,
      loading: true,
      error: "",
      result: null
    };
    render();

    try {
      const result = await apiClient.correctText({
        text,
        type,
        level,
        keepStyle
      });

      if (!result?.ok) {
        throw new Error(result?.message || "تعذر تصحيح النص الآن.");
      }

      const data = result?.data || result || {};
      const nextUser = data.user || result?.user;
      if (nextUser) {
        try {
          const token = apiClient.getToken?.();
          if (token) {
            apiClient.setSession?.({ token, user: nextUser });
          }
          state.currentUser = persistEmbeddedUser(nextUser) || normalizeUser(nextUser) || state.currentUser;
        } catch (sessionError) {
          console.warn("XP UI update failed:", sessionError);
        }
      }
      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        result: data,
        error: ""
      };
      render();
    } catch (error) {
      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: error?.message || "تعذر تصحيح النص الآن."
      };
      render();
    }
  }

  async function submitExpandTextTool() {
    const textField = app.querySelector('[data-expand-field="text"]');
    const levelField = app.querySelector('[data-expand-field="level"]');
    const audienceField = app.querySelector('[data-expand-field="audience"]');
    const text = String(textField?.value || state.writingAssistant.expandText || "").trim();
    const level = String(levelField?.value || state.writingAssistant.expandLevel || "medium");
    const focus = String(state.writingAssistant.expandFocus || "details");
    const audience = String(audienceField?.value || state.writingAssistant.expandAudience || "عام").trim() || "عام";

    if (text.length < 10) {
      state.writingAssistant.error = "النص قصير جدًا. اكتب فكرة أو جملة واضحة لتوسيعها.";
      render();
      return;
    }

    if (!isAuthenticated()) {
      state.writingAssistant = {
        ...state.writingAssistant,
        expandText: text,
        expandLevel: level,
        expandAudience: audience,
        error: ""
      };
      openAuthModal("سجّل دخولك لاستخدام توسيع النص وحفظ النتيجة داخل حسابك.");
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient?.expandText) {
      state.writingAssistant.error = "خدمة توسيع النص غير جاهزة الآن.";
      render();
      return;
    }

    state.writingAssistant = {
      ...state.writingAssistant,
      expandText: text,
      expandLevel: level,
      expandFocus: focus,
      expandAudience: audience,
      loading: true,
      error: "",
      result: null
    };
    render();

    try {
      const result = await apiClient.expandText({
        text,
        level,
        focus,
        audience
      });

      if (!result?.ok) {
        throw new Error(result?.message || "تعذر توسيع النص الآن.");
      }

      if (result.data?.user) {
        const token = apiClient.getToken?.();
        if (token) {
          apiClient.setSession?.({ token, user: result.data.user });
        }
        state.currentUser = persistEmbeddedUser(result.data.user) || normalizeUser(result.data.user) || state.currentUser;
      }

      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: "",
        result: result.data || {}
      };
      render();
    } catch (error) {
      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: error?.message || "تعذر توسيع النص الآن."
      };
      render();
    }
  }

  async function submitSummarizeTextTool() {
    const textField = app.querySelector('[data-summary-field="text"]');
    const pointsField = app.querySelector('[data-summary-field="pointsCount"]');
    const audienceField = app.querySelector('[data-summary-field="audience"]');
    const text = String(textField?.value || state.writingAssistant.summaryText || "").trim();
    const summaryType = String(state.writingAssistant.summaryType || "bullets");
    const summaryLength = String(state.writingAssistant.summaryLength || "medium");
    const pointsCount = Number(pointsField?.value || state.writingAssistant.summaryPointsCount || 5);
    const audience = String(audienceField?.value || state.writingAssistant.summaryAudience || "عام").trim() || "عام";

    if (text.length < 30) {
      state.writingAssistant.error = "النص قصير جدًا للتلخيص. الصق فقرة أو نصًا أطول قليلًا.";
      render();
      return;
    }

    if (!isAuthenticated()) {
      state.writingAssistant = {
        ...state.writingAssistant,
        summaryText: text,
        summaryType,
        summaryLength,
        summaryPointsCount: Number.isFinite(pointsCount) ? pointsCount : 5,
        summaryAudience: audience,
        error: ""
      };
      openAuthModal("سجّل دخولك لاستخدام تلخيص النص وحفظ النتيجة داخل حسابك.");
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient?.summarizeText) {
      state.writingAssistant.error = "خدمة تلخيص النص غير جاهزة الآن.";
      render();
      return;
    }

    state.writingAssistant = {
      ...state.writingAssistant,
      summaryText: text,
      summaryType,
      summaryLength,
      summaryPointsCount: Number.isFinite(pointsCount) ? pointsCount : 5,
      summaryAudience: audience,
      loading: true,
      error: "",
      result: null
    };
    render();

    try {
      const result = await apiClient.summarizeText({
        text,
        summaryType,
        summaryLength,
        pointsCount: state.writingAssistant.summaryPointsCount,
        audience
      });

      if (!result?.ok) {
        throw new Error(result?.message || "تعذر تلخيص النص الآن.");
      }

      if (result.data?.user) {
        const token = apiClient.getToken?.();
        if (token) {
          apiClient.setSession?.({ token, user: result.data.user });
        }
        state.currentUser = persistEmbeddedUser(result.data.user) || normalizeUser(result.data.user) || state.currentUser;
      }

      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: "",
        result: result.data || {}
      };
      render();
    } catch (error) {
      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: error?.message || "تعذر تلخيص النص الآن."
      };
      render();
    }
  }

  async function submitImproveStyleTool() {
    const textField = app.querySelector('[data-style-field="text"]');
    const audienceField = app.querySelector('[data-style-field="audience"]');
    const keepMeaningField = app.querySelector('[data-style-field="keepMeaning"]');
    const text = String(textField?.value || state.writingAssistant.styleText || "").trim();
    const goal = String(state.writingAssistant.styleGoal || "clarity");
    const level = String(state.writingAssistant.styleLevel || "balanced");
    const audience = String(audienceField?.value || state.writingAssistant.styleAudience || "عام").trim() || "عام";
    const keepMeaning = keepMeaningField ? Boolean(keepMeaningField.checked) : state.writingAssistant.styleKeepMeaning !== false;

    if (text.length < 10) {
      state.writingAssistant.error = "النص قصير جدًا. اكتب جملة أو فقرة واضحة لتحسينها.";
      render();
      return;
    }

    if (!isAuthenticated()) {
      state.writingAssistant = {
        ...state.writingAssistant,
        styleText: text,
        styleGoal: goal,
        styleLevel: level,
        styleAudience: audience,
        styleKeepMeaning: keepMeaning,
        error: ""
      };
      openAuthModal("سجّل دخولك لاستخدام تحسين الأسلوب وحفظ النتيجة داخل حسابك.");
      return;
    }

    const apiClient = getApiClient();
    if (!apiClient?.improveStyle) {
      state.writingAssistant.error = "خدمة تحسين الأسلوب غير جاهزة الآن.";
      render();
      return;
    }

    state.writingAssistant = {
      ...state.writingAssistant,
      styleText: text,
      styleGoal: goal,
      styleLevel: level,
      styleAudience: audience,
      styleKeepMeaning: keepMeaning,
      loading: true,
      error: "",
      result: null
    };
    render();

    try {
      const result = await apiClient.improveStyle({
        text,
        goal,
        level,
        audience,
        keepMeaning
      });

      if (!result?.ok) {
        throw new Error(result?.message || "تعذر تحسين الأسلوب الآن.");
      }

      if (result.data?.user) {
        const token = apiClient.getToken?.();
        if (token) {
          apiClient.setSession?.({ token, user: result.data.user });
        }
        state.currentUser = persistEmbeddedUser(result.data.user) || normalizeUser(result.data.user) || state.currentUser;
      }

      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: "",
        result: result.data || {}
      };
      render();
    } catch (error) {
      state.writingAssistant = {
        ...state.writingAssistant,
        loading: false,
        error: error?.message || "تعذر تحسين الأسلوب الآن."
      };
      render();
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

  function buildAssistantReplyFromText(text) {
    const parts = splitReplyToBullets(text).filter(Boolean);
    const heading = parts.shift() || "";
    return assistantReply(heading, parts);
  }

  function readToolSuggestionImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("تعذر قراءة الصورة."));
      reader.readAsDataURL(file);
    });
  }

  function captureToolSuggestionDraft(form = app.querySelector("[data-tool-suggestion-form]")) {
    if (!form) return state.toolSuggestionDraft || {};
    const formData = new FormData(form);
    const draft = {
      title: String(formData.get("title") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      useCase: String(formData.get("useCase") || "").trim(),
      extraNotes: String(formData.get("extraNotes") || "").trim()
    };
    state.toolSuggestionDraft = draft;
    return draft;
  }

  async function handleToolSuggestionImage(file) {
    captureToolSuggestionDraft();
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      state.toolSuggestionError = "الصورة التوضيحية يجب أن تكون PNG أو JPG أو WebP.";
      state.toolSuggestionAttachmentName = "";
      state.toolSuggestionAttachmentDataUrl = "";
      render();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      state.toolSuggestionError = "حجم الصورة التوضيحية يجب ألا يتجاوز 5MB.";
      state.toolSuggestionAttachmentName = "";
      state.toolSuggestionAttachmentDataUrl = "";
      render();
      return;
    }
    try {
      const dataUrl = await readToolSuggestionImage(file);
      state.toolSuggestionError = "";
      state.toolSuggestionAttachmentName = file.name;
      state.toolSuggestionAttachmentDataUrl = dataUrl;
      render();
    } catch (error) {
      state.toolSuggestionError = error?.message || "تعذر قراءة الصورة التوضيحية.";
      render();
    }
  }

  async function submitToolSuggestionForm(form) {
    if (state.toolSuggestionSubmitting) return;
    if (!isAuthenticated()) {
      state.toolSuggestionModalOpen = false;
      openAuthModal("سجّل دخولك حتى ترسل اقتراح أداة جديدة.");
      return;
    }
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      useCase: String(formData.get("useCase") || "").trim(),
      extraNotes: String(formData.get("extraNotes") || "").trim(),
      importance: Math.max(1, Math.min(5, Number(state.toolSuggestionImportance || 3))),
      attachmentName: state.toolSuggestionAttachmentName,
      attachmentDataUrl: state.toolSuggestionAttachmentDataUrl
    };
    if (!payload.title || !payload.category || !payload.description || !payload.useCase) {
      state.toolSuggestionError = "أكمل الحقول المطلوبة قبل إرسال الاقتراح.";
      state.toolSuggestionSuccess = "";
      render();
      return;
    }
    state.toolSuggestionDraft = payload;
    state.toolSuggestionSubmitting = true;
    state.toolSuggestionError = "";
    state.toolSuggestionSuccess = "";
    render();
    const result = await getApiClient()?.submitToolSuggestion?.(payload);
    state.toolSuggestionSubmitting = false;
    if (!result?.ok) {
      state.toolSuggestionError = result?.message || "تعذر إرسال الاقتراح الآن، حاول مرة أخرى.";
      render();
      return;
    }
    const data = result.data || {};
    state.toolSuggestionResultType = data.type || "";
    state.toolSuggestionSuccess = data.message || "تم إرسال اقتراحك بنجاح، شكرًا لمساعدتنا في تطوير Orlixor.";
    state.toolSuggestionAttachmentName = "";
    state.toolSuggestionAttachmentDataUrl = "";
    state.toolSuggestionImportance = 3;
    state.toolSuggestionDraft = {};
    render();
  }

  function bindEvents() {
    const fileInput = getFileInput();
    fileInput?.addEventListener("change", (event) => {
      const files = Array.from(event.target.files || []);
      preserveScrollPosition(() => {
        setSelectedFiles(files);
        render();
      });
    });

    bindUiEvent("click", async (event) => {
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
      if (
        state.mobileSidebarOpen
        && isCompactViewport()
        && !event.target.closest(".guest-sidebar")
        && !event.target.closest(".mobile-menu-drawer")
        && !event.target.closest("[data-toggle-sidebar]")
      ) {
        state.mobileSidebarOpen = false;
        render();
        return;
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

      if (event.target.closest("[data-focus-history-search]")) {
        event.preventDefault();
        setSidebarCollapsed(false);
        render();
        setTimeout(() => app.querySelector("[data-history-search]")?.focus(), 0);
        return;
      }

      const navButton = event.target.closest("[data-nav]");
      if (navButton) {
        state.openThreadMenuId = "";
        setSection(navButton.getAttribute("data-nav"));
        return;
      }

      const mobileNavButton = event.target.closest("[data-mobile-nav]");
      if (mobileNavButton) {
        event.preventDefault();
        event.stopPropagation();
        const target = mobileNavButton.getAttribute("data-mobile-nav") || "";
        state.mobileSidebarOpen = false;
        if (target === "messages") {
          setSection("messages");
          return;
        }
        if (target === "files") {
          setSection("library");
          return;
        }
        if (target === "tools") {
          setSection("ai-tools");
          return;
        }
        if (target === "models") {
          state.modelMenuOpen = true;
          render();
          return;
        }
        if (target === "settings") {
          state.settingsModalOpen = true;
          render();
          return;
        }
        if (target === "help") {
          showToast("فريق Orlixor قريب منك. اكتب سؤالك وسنساعدك.");
          render();
          return;
        }
        if (target === "logout") {
          const apiClient = getApiClient();
          const finishLogout = () => {
            resetAccountConversationThreads();
            localStorage.removeItem(legacyStorageKeys.currentUser);
            state.currentUser = getActiveUser();
            state.balancePanelOpen = false;
            state.settingsModalOpen = false;
            state.notificationsOpen = false;
            render();
          };
          if (apiClient?.logout) {
            apiClient.logout().finally(finishLogout);
          } else {
            finishLogout();
          }
          return;
        }
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

      if (event.target.closest("[data-close-tool-suggestion]")) {
        state.toolSuggestionModalOpen = false;
        state.toolSuggestionSubmitting = false;
        state.toolView = state.toolSuggestionReturnView || "tools";
        render();
        return;
      }

      if (event.target.closest("[data-open-tool-suggestion]")) {
        event.preventDefault();
        if (!isAuthenticated()) {
          openAuthModal("سجّل دخولك حتى ترسل اقتراح أداة جديدة.");
          return;
        }
        state.toolSuggestionReturnView = state.toolView || "tools";
        resetToolSuggestionFormState();
        state.toolSuggestionModalOpen = true;
        state.toolView = "tools";
        render();
        return;
      }

      const suggestionImportance = event.target.closest("[data-tool-suggestion-importance]");
      if (suggestionImportance) {
        event.preventDefault();
        captureToolSuggestionDraft();
        state.toolSuggestionImportance = Number(suggestionImportance.getAttribute("data-tool-suggestion-importance") || 3);
        render();
        return;
      }

      if (event.target.closest("[data-close-notifications]")) {
        state.notificationsOpen = false;
        render();
        return;
      }

      if (event.target.closest("[data-open-notifications]")) {
        openNotificationsPanel();
        return;
      }

      if (event.target.closest("[data-open-notification-settings]")) {
        state.notificationsOpen = false;
        state.settingsModalTab = "notifications";
        state.settingsModalOpen = true;
        render();
        return;
      }

      const notificationsTabButton = event.target.closest("[data-notifications-tab]");
      if (notificationsTabButton) {
        state.notificationsTab = notificationsTabButton.getAttribute("data-notifications-tab") || "all";
        render();
        loadNotifications({ force: true });
        return;
      }

      if (event.target.closest("[data-notification-read-all]")) {
        await markAllNotificationsRead();
        return;
      }

      const notificationCard = event.target.closest("[data-notification-id]");
      if (notificationCard) {
        await markNotificationRead(notificationCard.getAttribute("data-notification-id"));
        return;
      }

      if (event.target.closest("[data-notifications-view-all]")) {
        showToast("صفحة الإشعارات الكاملة قيد التجهيز، وهذه النافذة تعرض آخر التحديثات الآن.");
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

      if (event.target.closest("[data-open-writing-tools]")) {
        state.homeConversationOpen = false;
        state.openThreadMenuId = "";
        state.toolView = "writing-tools";
        setSection("ai-tools");
        return;
      }

      if (event.target.closest("[data-open-summary-tools]")) {
        state.homeConversationOpen = false;
        state.openThreadMenuId = "";
        state.toolView = "summary-tools";
        setSection("ai-tools");
        return;
      }

      if (event.target.closest("[data-open-data-tools]")) {
        state.homeConversationOpen = false;
        state.openThreadMenuId = "";
        state.toolView = "data-tools";
        setSection("ai-tools");
        return;
      }

      if (event.target.closest("[data-open-productivity-tools]")) {
        state.homeConversationOpen = false;
        state.openThreadMenuId = "";
        state.toolView = "productivity-tools";
        setSection("ai-tools");
        return;
      }

      if (event.target.closest("[data-open-education-tools]")) {
        state.homeConversationOpen = false;
        state.openThreadMenuId = "";
        state.toolView = "education-tools";
        setSection("ai-tools");
        return;
      }

      if (event.target.closest("[data-open-tools]")) {
        state.homeConversationOpen = false;
        state.openThreadMenuId = "";
        state.toolView = "tools";
        setSection("ai-tools");
        return;
      }

      if (event.target.closest("[data-open-free-tools]")) {
        state.toolView = "subscriber-tools";
        state.openThreadMenuId = "";
        state.modelMenuOpen = false;
        render();
        return;
      }

      if (event.target.closest("[data-return-chat]")) {
        state.homeConversationOpen = false;
        state.openThreadMenuId = "";
        state.toolView = "tools";
        setSection("dashboard");
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
        if (isCompactViewport()) {
          state.mobileSidebarOpen = !state.mobileSidebarOpen;
        } else {
          state.mobileSidebarOpen = false;
          setSidebarCollapsed(!state.sidebarCollapsed);
        }
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

      const preferenceToggle = event.target.closest("[data-preference-toggle]");
      if (preferenceToggle) {
        event.preventDefault();
        const key = preferenceToggle.getAttribute("data-preference-toggle");
        if (!key) return;
        const currentValue = Boolean(state.appPreferences?.[key]);
        updateAppPreference(key, !currentValue);
        if (key === "saveChats" && !currentValue) {
          state.savedConversationsLoaded = false;
          scheduleSavedConversationSync();
        }
        render();
        return;
      }

      const preferenceChoice = event.target.closest("[data-preference-choice]");
      if (preferenceChoice) {
        event.preventDefault();
        const key = preferenceChoice.getAttribute("data-preference-choice");
        const value = preferenceChoice.getAttribute("data-preference-value");
        if (!key || value == null) return;
        updateAppPreference(key, value);
        render();
        return;
      }

      if (event.target.closest("[data-refresh-session]")) {
        event.preventDefault();
        Promise.resolve(refreshSessionUser()).finally(() => {
          showToast("تم تحديث حالة الجلسة.");
        });
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
        state.theme = ["light", "dark", "system"].includes(nextTheme) ? nextTheme : "light";
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
          state.notificationsOpen = false;
          state.notificationsData = null;
          state.notificationsUnreadCount = 0;
          state.notificationsLoaded = false;
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
        event.preventDefault();
        event.stopPropagation();
        pickFiles();
        return;
      }

      if (event.target.closest("[data-image-enhancer-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-image-enhancer-input]")?.click();
        return;
      }

      if (event.target.closest("[data-image-enhancer-run]")) {
        await runImageEnhancer();
        return;
      }

      if (event.target.closest("[data-image-enhancer-reset]")) {
        resetImageEnhancerState();
        render();
        return;
      }

      if (event.target.closest("[data-image-clarifier-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-image-clarifier-input]")?.click();
        return;
      }

      if (event.target.closest("[data-image-clarifier-run]")) {
        await runImageClarifier();
        return;
      }

      if (event.target.closest("[data-image-clarifier-reset]")) {
        resetImageClarifierState();
        render();
        return;
      }

      if (event.target.closest("[data-png-pdf-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-png-pdf-input]")?.click();
        return;
      }

      if (event.target.closest("[data-png-pdf-convert]")) {
        await runPngToPdfConversion();
        return;
      }

      if (event.target.closest("[data-png-pdf-reset]")) {
        resetPngToPdfState();
        render();
        return;
      }

      if (event.target.closest("[data-pdf-png-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-pdf-png-input]")?.click();
        return;
      }

      if (event.target.closest("[data-pdf-png-convert]")) {
        await runPdfToPngConversion();
        return;
      }

      if (event.target.closest("[data-pdf-png-reset]")) {
        resetPdfToPngState();
        render();
        return;
      }

      if (event.target.closest("[data-pdf-unlock-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-pdf-unlock-input]")?.click();
        return;
      }

      if (event.target.closest("[data-pdf-unlock-run]")) {
        await runPdfUnlockProcessing();
        return;
      }

      if (event.target.closest("[data-pdf-unlock-reset]")) {
        resetPdfUnlockState();
        render();
        return;
      }

      if (event.target.closest("[data-image-converter-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-image-converter-input]")?.click();
        return;
      }

      if (event.target.closest("[data-image-converter-convert]")) {
        await runImageConverterConversion();
        return;
      }

      if (event.target.closest("[data-image-converter-reset]")) {
        resetImageConverterState();
        render();
        return;
      }

      if (event.target.closest("[data-image-compressor-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-image-compressor-input]")?.click();
        return;
      }

      if (event.target.closest("[data-image-compressor-run]")) {
        await runImageCompressorCompression();
        return;
      }

      if (event.target.closest("[data-image-compressor-reset]")) {
        resetImageCompressorState();
        render();
        return;
      }

      const imageCompressorZoom = event.target.closest("[data-image-compressor-zoom]");
      if (imageCompressorZoom) {
        const current = Number(state.imageCompressor.zoom || 1);
        const delta = Number(imageCompressorZoom.getAttribute("data-image-compressor-zoom") || 0);
        state.imageCompressor.zoom = Math.max(0.65, Math.min(1.45, Number((current + delta).toFixed(2))));
        render();
        return;
      }

      if (event.target.closest("[data-image-rotator-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-image-rotator-input]")?.click();
        return;
      }

      const imageRotatorRotate = event.target.closest("[data-image-rotator-rotate]");
      if (imageRotatorRotate) {
        await updateImageRotatorAngle(Number(imageRotatorRotate.getAttribute("data-image-rotator-rotate") || 0), false);
        return;
      }

      if (event.target.closest("[data-image-rotator-apply-custom]")) {
        await updateImageRotatorAngle(Number(state.imageRotator.customAngle || 0), true);
        return;
      }

      if (event.target.closest("[data-image-rotator-export]")) {
        await runImageRotatorExport();
        return;
      }

      if (event.target.closest("[data-image-rotator-reset]")) {
        if (state.imageRotator.bitmap) {
          await updateImageRotatorAngle(0, true);
        } else {
          resetImageRotatorState();
          render();
        }
        return;
      }

      if (event.target.closest("[data-image-cropper-choose]")) {
        if (!hasSubscriberToolsAccess()) {
          state.upgradeModalOpen = true;
          render();
          return;
        }
        app.querySelector("[data-image-cropper-input]")?.click();
        return;
      }

      const imageCropperRatio = event.target.closest("[data-image-cropper-ratio]");
      if (imageCropperRatio) {
        applyImageCropperAspectRatio(imageCropperRatio.getAttribute("data-image-cropper-ratio") || "free");
        return;
      }

      const imageCropperMove = event.target.closest("[data-image-cropper-move]");
      if (imageCropperMove) {
        const [dx, dy] = String(imageCropperMove.getAttribute("data-image-cropper-move") || "0,0")
          .split(",")
          .map(Number);
        if (dx === 0 && dy === 0) {
          const crop = getInitialImageCropperCrop(state.imageCropper.width || 1, state.imageCropper.height || 1);
          state.imageCropper.customWidth = String(crop.cropWidth);
          state.imageCropper.customHeight = String(crop.cropHeight);
          setImageCropperCrop(crop, "تم توسيط منطقة القص.");
          render();
        } else {
          moveImageCropperCrop(dx || 0, dy || 0);
        }
        return;
      }

      const imageCropperZoom = event.target.closest("[data-image-cropper-zoom]");
      if (imageCropperZoom) {
        updateImageCropperZoom(Number(imageCropperZoom.getAttribute("data-image-cropper-zoom") || 0));
        return;
      }

      const imageCropperRotate = event.target.closest("[data-image-cropper-rotate]");
      if (imageCropperRotate) {
        await rotateImageCropperSource(Number(imageCropperRotate.getAttribute("data-image-cropper-rotate") || 0));
        return;
      }

      if (event.target.closest("[data-image-cropper-export]")) {
        await runImageCropperExport();
        return;
      }

      if (event.target.closest("[data-image-cropper-reset]")) {
        if (state.imageCropper.bitmap) {
          const crop = getInitialImageCropperCrop(state.imageCropper.width || 1, state.imageCropper.height || 1);
          state.imageCropper.aspectRatio = "free";
          state.imageCropper.customWidth = String(crop.cropWidth);
          state.imageCropper.customHeight = String(crop.cropHeight);
          setImageCropperCrop(crop, "تمت إعادة تعيين منطقة القص.");
        } else {
          resetImageCropperState();
        }
        render();
        return;
      }

      const imageConverterRemove = event.target.closest("[data-image-converter-remove]");
      if (imageConverterRemove) {
        removeImageConverterImage(imageConverterRemove.getAttribute("data-image-converter-remove") || "");
        return;
      }

      const imageCompressorRemove = event.target.closest("[data-image-compressor-remove]");
      if (imageCompressorRemove) {
        removeImageCompressorImage(imageCompressorRemove.getAttribute("data-image-compressor-remove") || "");
        return;
      }

      const imageConverterFormat = event.target.closest("[data-image-converter-format]");
      if (imageConverterFormat) {
        const nextFormat = imageConverterFormat.getAttribute("data-image-converter-format") || "image/jpeg";
        state.imageConverter.targetFormat = imageConverterFormats[nextFormat] ? nextFormat : "image/jpeg";
        clearImageConverterResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
        render();
        return;
      }

      const pngPdfRemove = event.target.closest("[data-png-pdf-remove]");
      if (pngPdfRemove) {
        removePngToPdfImage(pngPdfRemove.getAttribute("data-png-pdf-remove") || "");
        return;
      }

      const pngPdfMove = event.target.closest("[data-png-pdf-move]");
      if (pngPdfMove) {
        movePngToPdfImage(
          pngPdfMove.getAttribute("data-png-pdf-move") || "",
          pngPdfMove.getAttribute("data-direction") || "down"
        );
        return;
      }

      const removeFile = event.target.closest("[data-remove-file]");
      if (removeFile) {
        event.preventDefault();
        event.stopPropagation();
        removeSelectedFile(Number(removeFile.getAttribute("data-remove-file")));
        return;
      }

      if (event.target.closest("[data-tools-back]")) {
        state.toolView = "tools";
        state.openAiWebSearchV2.error = "";
        state.writingAssistant.error = "";
        render();
        return;
      }

      const openAiWebSearchV2Submit = event.target.closest("[data-smart-search-submit]");
      if (openAiWebSearchV2Submit) {
        event.preventDefault();
        event.stopPropagation();
        submitOpenAiWebSearchV2();
        return;
      }

      const writingSubmit = event.target.closest("[data-writing-submit]");
      if (writingSubmit) {
        event.preventDefault();
        event.stopPropagation();
        submitWritingAssistant();
        return;
      }

      const smartSuggestion = event.target.closest("[data-smart-suggestion]");
      if (smartSuggestion) {
        state.openAiWebSearchV2.query = smartSuggestion.getAttribute("data-smart-suggestion") || "";
        state.openAiWebSearchV2.error = "";
        render();
        return;
      }

      const devToolButton = event.target.closest("[data-dev-tool]");
      if (devToolButton) {
        const label = devToolButton.getAttribute("data-card") || "هذه الأداة";
        showToast(`${label} قيد التطوير حاليًا.`);
        return;
      }

      const toolButton = event.target.closest("[data-tool-key]");
      if (toolButton) {
        const toolKey = toolButton.getAttribute("data-tool-key") || "";
        const toolTitle = toolButton.getAttribute("data-card") || "";
        recordRecentToolUse(toolKey, toolTitle);
        if (toolKey === "smart-search") {
          state.toolView = "smart-search";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "writing-assistant") {
          state.toolView = "writing-assistant";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "image-enhancer") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "image-enhancer";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "image-clarifier") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "image-clarifier";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "png-to-pdf") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "png-to-pdf";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "pdf-to-png") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "pdf-to-png";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "pdf-unlock") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "pdf-unlock";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "image-converter") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "image-converter";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "image-compressor") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "image-compressor";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "image-rotator") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "image-rotator";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
        if (toolKey === "image-cropper") {
          if (!hasSubscriberToolsAccess()) {
            state.upgradeModalOpen = true;
            render();
            return;
          }
          state.toolView = "image-cropper";
          state.openThreadMenuId = "";
          state.modelMenuOpen = false;
          render();
          return;
        }
      }

      const writingTaskButton = event.target.closest("[data-writing-task]");
      if (writingTaskButton) {
        state.writingAssistant.taskType = writingTaskButton.getAttribute("data-writing-task") || "generate";
        state.writingAssistant.error = "";
        state.writingAssistant.result = null;
        render();
        return;
      }

      const writingExample = event.target.closest("[data-writing-example]");
      if (writingExample) {
        state.writingAssistant.topic = writingExample.getAttribute("data-writing-example") || "";
        state.writingAssistant.error = "";
        render();
        return;
      }

      if (event.target.closest("[data-writing-add-points]")) {
        state.writingAssistant.details = `${state.writingAssistant.details || ""}${state.writingAssistant.details ? "\n" : ""}- النقطة الأولى\n- النقطة الثانية\n- النقطة الثالثة`;
        render();
        return;
      }

      if (event.target.closest("[data-copy-writing-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || state.writingAssistant.result?.answer || "");
        if (!text) {
          showToast("لا يوجد نص جاهز للنسخ.");
          return;
        }
        navigator.clipboard?.writeText(text).then(() => {
          showToast("تم نسخ النص.");
        }).catch(() => {
          showToast("تعذر نسخ النص الآن.");
        });
        return;
      }

      const toneOption = event.target.closest("[data-tone-option]");
      if (toneOption) {
        state.writingAssistant.toneTarget = toneOption.getAttribute("data-tone-option") || "formal";
        state.writingAssistant.error = "";
        render();
        return;
      }

      const toneExample = event.target.closest("[data-tone-example]");
      if (toneExample) {
        const exampleLabel = toneExample.getAttribute("data-tone-example") || "";
        const examples = {
          "رسالة بريد رسمية": "نحتاج نبلغ العميل أن المشروع تأخر يومين، ونبغى الكلام يكون محترم وواضح.",
          "محتوى تعليمي": "الذكاء الاصطناعي يساعد الطلاب على فهم الدروس بشكل أسرع إذا استخدموه بطريقة صحيحة.",
          "تقرير عمل": "خلصنا المرحلة الأولى من المشروع واحتجنا نراجع بعض التفاصيل قبل التسليم.",
          "منشور تسويقي": "منصتنا تساعدك تكتب محتوى أفضل وتوفر وقتك في إعداد النصوص.",
          "دعوة فعالية": "ندعوكم لحضور لقاء تعريفي عن أدوات Orlixor وكيف تساعد في العمل اليومي."
        };
        state.writingAssistant.toneText = examples[exampleLabel] || exampleLabel;
        state.writingAssistant.error = "";
        render();
        return;
      }

      if (event.target.closest("[data-copy-tone-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد نص جاهز للنسخ.");
          return;
        }
        navigator.clipboard?.writeText(text).then(() => {
          showToast("تم نسخ النص.");
        }).catch(() => {
          showToast("تعذر نسخ النص الآن.");
        });
        return;
      }

      if (event.target.closest("[data-download-tone-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد نص جاهز للتنزيل.");
          return;
        }
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "orlixor-tone-result.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 500);
        showToast("تم تجهيز ملف النص.");
        return;
      }

      if (event.target.closest("[data-retry-tone]")) {
        submitToneTool();
        return;
      }

      const correctionType = event.target.closest("[data-correction-type]");
      if (correctionType) {
        state.writingAssistant.correctionType = correctionType.getAttribute("data-correction-type") || "full";
        state.writingAssistant.error = "";
        render();
        return;
      }

      const correctionExample = event.target.closest("[data-correction-example]");
      if (correctionExample) {
        const exampleLabel = correctionExample.getAttribute("data-correction-example") || "";
        const examples = {
          "تصحيح مقال": "يعد الذكاء الاصطناعي من التقنيات الحديثه التي تغير عالمنا بسرعه كبيره. حيث يساعد في تحسين العمليات وزياده الكفاءه وتقليل التكاليف.",
          "تصحيح رسالة": "السلام عليكم، نود ابلاغكم انه تم استلام طلبكم وسيتم مراجعته في اقرب وقت ممكن وشكرا لكم.",
          "تدقيق تقرير": "يوضح التقرير ان الفريق انجز المرحلة الاولى بنجاح، لكن يوجد بعض الملاحظات التي تحتاج الى مراجعة قبل التسليم النهائي.",
          "تصحيح بحث": "تواجه هذه التقنيات العديد من التحديات مثل خصوصية البيانات وامانها ومستقبل الوظائف.",
          "مراجعة محتوى": "منصتنا تساعد المستخدمين على كتابة محتوى افضل وتنظيم افكارهم بشكل اسرع وادق."
        };
        state.writingAssistant.correctionText = examples[exampleLabel] || exampleLabel;
        state.writingAssistant.error = "";
        render();
        return;
      }

      if (event.target.closest("[data-copy-correction-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد نص مصحح جاهز للنسخ.");
          return;
        }
        navigator.clipboard?.writeText(text).then(() => {
          showToast("تم نسخ النص.");
        }).catch(() => {
          showToast("تعذر نسخ النص الآن.");
        });
        return;
      }

      if (event.target.closest("[data-download-correction-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد نص مصحح جاهز للتنزيل.");
          return;
        }
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "orlixor-corrected-text.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 500);
        showToast("تم تجهيز ملف النص.");
        return;
      }

      if (event.target.closest("[data-retry-correction]")) {
        submitCorrectionTextTool();
        return;
      }

      const expandFocus = event.target.closest("[data-expand-focus]");
      if (expandFocus) {
        state.writingAssistant.expandFocus = expandFocus.getAttribute("data-expand-focus") || "details";
        state.writingAssistant.error = "";
        render();
        return;
      }

      const expandExample = event.target.closest("[data-expand-example]");
      if (expandExample) {
        const exampleLabel = expandExample.getAttribute("data-expand-example") || "";
        const examples = {
          "تقرير": "الذكاء الاصطناعي يساعد الشركات على أتمتة المهام وتحسين الكفاءة.",
          "خطة مشروع": "نريد إطلاق منصة تعليمية تساعد الطلاب على تنظيم مذاكرتهم.",
          "خطة عمل": "نحتاج خطة لتحسين تجربة العملاء وزيادة المبيعات خلال شهر.",
          "فكرة منتج": "تطبيق يساعد المستخدمين على ترتيب مهامهم اليومية بذكاء.",
          "مقال قصير": "التعلم المستمر يساعد الإنسان على تطوير مهاراته ومواكبة التغيرات."
        };
        state.writingAssistant.expandText = examples[exampleLabel] || exampleLabel;
        state.writingAssistant.error = "";
        render();
        return;
      }

      if (event.target.closest("[data-copy-expand-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد نص جاهز للنسخ.");
          return;
        }
        navigator.clipboard?.writeText(text).then(() => {
          showToast("تم نسخ النص.");
        }).catch(() => {
          showToast("تعذر نسخ النص الآن.");
        });
        return;
      }

      if (event.target.closest("[data-download-expand-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد نص جاهز للتنزيل.");
          return;
        }
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "orlixor-expanded-text.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 500);
        showToast("تم تجهيز ملف النص.");
        return;
      }

      if (event.target.closest("[data-retry-expand]")) {
        submitExpandTextTool();
        return;
      }

      const summaryType = event.target.closest("[data-summary-type]");
      if (summaryType) {
        state.writingAssistant.summaryType = summaryType.getAttribute("data-summary-type") || "bullets";
        state.writingAssistant.error = "";
        render();
        return;
      }

      const summaryLength = event.target.closest("[data-summary-length]");
      if (summaryLength) {
        state.writingAssistant.summaryLength = summaryLength.getAttribute("data-summary-length") || "medium";
        state.writingAssistant.error = "";
        render();
        return;
      }

      const summaryExample = event.target.closest("[data-summary-example]");
      if (summaryExample) {
        const exampleLabel = summaryExample.getAttribute("data-summary-example") || "";
        const examples = {
          "ملخص اجتماع": "ناقش الفريق خطة إطلاق المنتج خلال الربع القادم، وتم الاتفاق على تحسين صفحة التسجيل، وتبسيط تجربة المستخدم، وتجهيز حملة تعريفية قبل الإطلاق بأسبوعين. كما تقرر متابعة مؤشرات التسجيل يوميًا وتوزيع المهام على فرق التصميم والتطوير والتسويق.",
          "تلخيص محاضرة": "تناولت المحاضرة مفهوم الذكاء الاصطناعي وتطبيقاته في التعليم والصحة والأعمال، مع التركيز على أهمية استخدامه بمسؤولية، وفهم حدوده، والتحقق من النتائج قبل الاعتماد عليها في القرارات المهمة.",
          "ملخص كتاب": "يتحدث الكتاب عن بناء العادات الصغيرة وكيف يمكن للتغييرات البسيطة المتكررة أن تصنع نتائج كبيرة على المدى الطويل، ويؤكد أن البيئة والوضوح والاستمرارية أهم من الحماس المؤقت.",
          "تلخيص تقرير بحثي": "يشير التقرير إلى أن استخدام الأدوات الذكية في بيئات العمل يزيد الإنتاجية عند دمجه مع تدريب مناسب وسياسات واضحة لحماية البيانات، لكنه يتطلب متابعة مستمرة لتقليل الأخطاء وتحسين جودة المخرجات.",
          "ملخص مقال طويل": "يتناول المقال أثر التقنية الحديثة على الحياة اليومية، موضحًا كيف ساعدت في تسريع الوصول للمعلومات وتحسين التواصل، مع الإشارة إلى تحديات الخصوصية والانتباه والاستخدام المتوازن."
        };
        state.writingAssistant.summaryText = examples[exampleLabel] || exampleLabel;
        state.writingAssistant.error = "";
        render();
        return;
      }

      if (event.target.closest("[data-copy-summary-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد ملخص جاهز للنسخ.");
          return;
        }
        navigator.clipboard?.writeText(text).then(() => {
          showToast("تم نسخ الملخص.");
        }).catch(() => {
          showToast("تعذر نسخ الملخص الآن.");
        });
        return;
      }

      if (event.target.closest("[data-download-summary-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد ملخص جاهز للتنزيل.");
          return;
        }
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "orlixor-summary.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 500);
        showToast("تم تجهيز ملف الملخص.");
        return;
      }

      if (event.target.closest("[data-retry-summary]")) {
        submitSummarizeTextTool();
        return;
      }

      const styleGoal = event.target.closest("[data-style-goal]");
      if (styleGoal) {
        state.writingAssistant.styleGoal = styleGoal.getAttribute("data-style-goal") || "clarity";
        state.writingAssistant.error = "";
        render();
        return;
      }

      const styleLevel = event.target.closest("[data-style-level]");
      if (styleLevel) {
        state.writingAssistant.styleLevel = styleLevel.getAttribute("data-style-level") || "balanced";
        state.writingAssistant.error = "";
        render();
        return;
      }

      const styleExample = event.target.closest("[data-style-example]");
      if (styleExample) {
        const exampleLabel = styleExample.getAttribute("data-style-example") || "";
        const examples = {
          "رسالة رسمية": "نرغب في إبلاغكم بأننا سنبدأ تنفيذ الخطة الجديدة الأسبوع القادم، ونأمل من الجميع التعاون لإنجاحها.",
          "محتوى إبداعي": "التقنية تغير العالم بسرعة كبيرة وتفتح فرصًا جديدة للتعلم والعمل والإبداع.",
          "مقال تسويقي": "منتجنا يساعد الفرق على إنجاز أعمالها بسرعة أكبر وتنظيم أفضل وتجربة استخدام مريحة.",
          "تقرير عمل": "شهد المشروع تقدمًا واضحًا هذا الأسبوع، وتم إنجاز معظم المهام الأساسية مع وجود بعض النقاط التي تحتاج متابعة.",
          "نص أكاديمي": "تساهم القراءة المنتظمة في تطوير التفكير النقدي وتحسين القدرة على تحليل المعلومات وفهمها."
        };
        state.writingAssistant.styleText = examples[exampleLabel] || exampleLabel;
        state.writingAssistant.error = "";
        render();
        return;
      }

      if (event.target.closest("[data-copy-style-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد نص محسّن جاهز للنسخ.");
          return;
        }
        navigator.clipboard?.writeText(text).then(() => {
          showToast("تم نسخ النص.");
        }).catch(() => {
          showToast("تعذر نسخ النص الآن.");
        });
        return;
      }

      if (event.target.closest("[data-download-style-result]")) {
        const text = coerceDisplayText(state.writingAssistant.result?.output || "");
        if (!text) {
          showToast("لا يوجد نص محسّن جاهز للتنزيل.");
          return;
        }
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "orlixor-style-result.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 500);
        showToast("تم تجهيز ملف النص.");
        return;
      }

      if (event.target.closest("[data-retry-style]")) {
        submitImproveStyleTool();
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
        ensureThreadState();
        state.settings[state.section].webEnabled = !state.settings[state.section].webEnabled;
        saveSectionSettings();
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

      if (event.target.closest("[data-refresh-reply]")) {
        if (!isAuthenticated()) {
          openAuthModal("أكمل التفاعل بعد تسجيل الدخول.");
          return;
        }
        return;
      }

      const likeButton = event.target.closest("[data-like-reply]");
      if (likeButton) {
        event.preventDefault();
        event.stopPropagation();
        if (!isAuthenticated()) {
          openAuthModal("أكمل التفاعل بعد تسجيل الدخول.");
          return;
        }
        const feedbackKey = likeButton.getAttribute("data-like-reply") || "";
        if (feedbackKey) {
          const nextLiked = !state.likedReplies[feedbackKey];
          state.likedReplies[feedbackKey] = nextLiked;
          likeButton.classList.toggle("liked", nextLiked);
          likeButton.setAttribute("aria-pressed", nextLiked ? "true" : "false");
          const apiClient = getApiClient();
          if (apiClient?.sendMessageFeedback) {
            const activeThread = getActiveThread();
            const conversationId = state.conversationIds?.[activeThread?.id] || "";
            apiClient.sendMessageFeedback(feedbackKey, {
              feedback: state.likedReplies[feedbackKey] ? "like" : null,
              conversation_id: conversationId,
              model_key: state.selectedModel || "orlixor"
            }).catch(() => {
              state.likedReplies[feedbackKey] = !nextLiked;
              likeButton.classList.toggle("liked", !nextLiked);
              likeButton.setAttribute("aria-pressed", !nextLiked ? "true" : "false");
            });
          }
        }
        return;
      }

      if (shouldCloseBalance || shouldCloseThreadMenu) {
        render();
      }
    });

    bindUiEvent("input", (event) => {
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

      const toolSuggestionField = event.target.closest("[data-tool-suggestion-input]");
      if (toolSuggestionField) {
        const form = toolSuggestionField.closest("[data-tool-suggestion-form]");
        const draft = captureToolSuggestionDraft(form);
        const fieldName = toolSuggestionField.getAttribute("data-tool-suggestion-input") || "";
        if (fieldName === "description") {
          const counter = toolSuggestionField.closest("label")?.querySelector(".tool-suggestion-counter");
          if (counter) counter.textContent = `${String(draft.description || "").length}/500`;
        }
        if (fieldName === "useCase") {
          const counter = toolSuggestionField.closest("label")?.querySelector(".tool-suggestion-counter");
          if (counter) counter.textContent = `${String(draft.useCase || "").length}/300`;
        }
      }

      const smartQuery = event.target.closest("[data-smart-search-query]");
      if (smartQuery) {
        state.openAiWebSearchV2.query = smartQuery.value;
        state.openAiWebSearchV2.error = "";
      }

      const writingField = event.target.closest("[data-writing-field]");
      if (writingField && ["topic", "details"].includes(writingField.getAttribute("data-writing-field"))) {
        const key = writingField.getAttribute("data-writing-field");
        state.writingAssistant[key] = writingField.value;
        state.writingAssistant.error = "";
      }

      const toneField = event.target.closest("[data-tone-field]");
      if (toneField && toneField.getAttribute("data-tone-field") === "text") {
        state.writingAssistant.toneText = toneField.value;
        state.writingAssistant.error = "";
      }

      const correctionField = event.target.closest("[data-correction-field]");
      if (correctionField && correctionField.getAttribute("data-correction-field") === "text") {
        state.writingAssistant.correctionText = correctionField.value;
        state.writingAssistant.error = "";
      }

      const expandField = event.target.closest("[data-expand-field]");
      if (expandField && expandField.getAttribute("data-expand-field") === "text") {
        state.writingAssistant.expandText = expandField.value;
        state.writingAssistant.error = "";
      }

      const summaryField = event.target.closest("[data-summary-field]");
      if (summaryField && summaryField.getAttribute("data-summary-field") === "text") {
        state.writingAssistant.summaryText = summaryField.value;
        state.writingAssistant.error = "";
      }

      const styleField = event.target.closest("[data-style-field]");
      if (styleField && styleField.getAttribute("data-style-field") === "text") {
        state.writingAssistant.styleText = styleField.value;
        state.writingAssistant.error = "";
      }

      const pdfUnlockField = event.target.closest("[data-pdf-unlock-field]");
      if (pdfUnlockField) {
        const key = pdfUnlockField.getAttribute("data-pdf-unlock-field");
        if (key === "currentPassword") {
          state.pdfUnlock.currentPassword = pdfUnlockField.value;
        }
        if (key === "newPassword") {
          state.pdfUnlock.newPassword = pdfUnlockField.value;
        }
        clearPdfUnlockResult("الإعدادات تغيّرت. نفّذ العملية من جديد.");
        const runButton = app.querySelector("[data-pdf-unlock-run]");
        if (runButton) runButton.disabled = !canRunPdfUnlock();
        app.querySelector(".pdf-unlock-actions .png-pdf-download")?.remove();
      }

      const pdfPngCustomPages = event.target.closest("[data-pdf-png-custom-pages]");
      if (pdfPngCustomPages) {
        state.pdfToPng.customPages = pdfPngCustomPages.value;
        clearPdfToPngResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
      }

      const imageConverterCustom = event.target.closest("[data-image-converter-custom]");
      if (imageConverterCustom) {
        const key = imageConverterCustom.getAttribute("data-image-converter-custom");
        if (key === "width") {
          state.imageConverter.customWidth = imageConverterCustom.value;
        }
        if (key === "height") {
          state.imageConverter.customHeight = imageConverterCustom.value;
        }
        clearImageConverterResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
      }

      const imageCompressorLevel = event.target.closest("[data-image-compressor-level]");
      if (imageCompressorLevel) {
        state.imageCompressor.compressionLevel = imageCompressorLevel.value;
        clearImageCompressorResult("الإعدادات تغيّرت. اضغط الصور من جديد.");
        render();
        return;
      }

      const imageCompressorSize = event.target.closest("[data-image-compressor-size]");
      if (imageCompressorSize) {
        const key = imageCompressorSize.getAttribute("data-image-compressor-size");
        if (key === "width") {
          state.imageCompressor.maxWidth = imageCompressorSize.value;
        }
        if (key === "height") {
          state.imageCompressor.maxHeight = imageCompressorSize.value;
        }
        clearImageCompressorResult("الإعدادات تغيّرت. اضغط الصور من جديد.");
      }

      const imageRotatorCustomAngle = event.target.closest("[data-image-rotator-custom-angle]");
      if (imageRotatorCustomAngle) {
        state.imageRotator.customAngle = imageRotatorCustomAngle.value;
        clearImageRotatorResult("اختر تطبيق الزاوية المخصصة لتحديث المعاينة.");
      }
      const imageCropperSize = event.target.closest("[data-image-cropper-size]");
      if (imageCropperSize) {
        const key = imageCropperSize.getAttribute("data-image-cropper-size");
        const value = Math.round(Number(imageCropperSize.value || 0));
        if (key === "width") {
          state.imageCropper.customWidth = imageCropperSize.value;
        }
        if (key === "height") {
          state.imageCropper.customHeight = imageCropperSize.value;
        }
        if (state.imageCropper.bitmap && value > 0) {
          const nextCrop = {};
          if (key === "width") nextCrop.cropWidth = value;
          if (key === "height") nextCrop.cropHeight = value;
          setImageCropperCrop(nextCrop, "تم تحديث أبعاد القص.");
          render();
        }
      }
    });

    bindUiEvent("change", async (event) => {
      const toolSuggestionImage = event.target.closest("[data-tool-suggestion-image]");
      if (toolSuggestionImage) {
        await handleToolSuggestionImage(toolSuggestionImage.files?.[0]);
        toolSuggestionImage.value = "";
        return;
      }

      const toolSuggestionSelect = event.target.closest("[data-tool-suggestion-input]");
      if (toolSuggestionSelect) {
        captureToolSuggestionDraft(toolSuggestionSelect.closest("[data-tool-suggestion-form]"));
      }

      const imageEnhancerInput = event.target.closest("[data-image-enhancer-input]");
      if (imageEnhancerInput) {
        await handleImageEnhancerFile(imageEnhancerInput.files?.[0]);
        imageEnhancerInput.value = "";
        return;
      }

      const imageEnhancerScale = event.target.closest("[data-image-enhancer-scale]");
      if (imageEnhancerScale) {
        state.imageEnhancer.scale = imageEnhancerScale.value === "4" ? "4" : "2";
        clearImageEnhancerResult("الإعدادات تغيّرت. شغّل التحسين من جديد.");
        render();
        return;
      }

      const imageEnhancerQuality = event.target.closest("[data-image-enhancer-quality]");
      if (imageEnhancerQuality) {
        state.imageEnhancer.quality = ["light", "medium", "strong"].includes(imageEnhancerQuality.value)
          ? imageEnhancerQuality.value
          : "medium";
        clearImageEnhancerResult("الإعدادات تغيّرت. شغّل التحسين من جديد.");
        render();
        return;
      }

      const imageClarifierInput = event.target.closest("[data-image-clarifier-input]");
      if (imageClarifierInput) {
        await handleImageClarifierFile(imageClarifierInput.files?.[0]);
        imageClarifierInput.value = "";
        return;
      }

      const imageClarifierQuality = event.target.closest("[data-image-clarifier-quality]");
      if (imageClarifierQuality) {
        state.imageClarifier.quality = ["light", "medium", "strong"].includes(imageClarifierQuality.value)
          ? imageClarifierQuality.value
          : "medium";
        clearImageClarifierResult("الإعدادات تغيّرت. شغّل التوضيح من جديد.");
        render();
        return;
      }

      const imageClarifierNoise = event.target.closest("[data-image-clarifier-noise]");
      if (imageClarifierNoise) {
        state.imageClarifier.noise = ["off", "medium", "strong"].includes(imageClarifierNoise.value)
          ? imageClarifierNoise.value
          : "medium";
        clearImageClarifierResult("الإعدادات تغيّرت. شغّل التوضيح من جديد.");
        render();
        return;
      }

      const imageClarifierContrast = event.target.closest("[data-image-clarifier-contrast]");
      if (imageClarifierContrast) {
        state.imageClarifier.contrast = imageClarifierContrast.value !== "off";
        clearImageClarifierResult("الإعدادات تغيّرت. شغّل التوضيح من جديد.");
        render();
        return;
      }

      const pngPdfInput = event.target.closest("[data-png-pdf-input]");
      if (pngPdfInput) {
        await addPngToPdfFiles(pngPdfInput.files);
        pngPdfInput.value = "";
        return;
      }

      const pngPdfSetting = event.target.closest("[data-png-pdf-setting]");
      if (pngPdfSetting) {
        const key = pngPdfSetting.getAttribute("data-png-pdf-setting");
        const value = pngPdfSetting.value;
        if (key === "pageSize") {
          state.pngToPdf.pageSize = ["A4", "letter", "fit"].includes(value) ? value : "A4";
        }
        if (key === "orientation") {
          state.pngToPdf.orientation = value === "landscape" ? "landscape" : "portrait";
        }
        if (key === "margin") {
          state.pngToPdf.margin = ["0", "20", "40"].includes(value) ? value : "20";
        }
        clearPngToPdfResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
        render();
        return;
      }

      const pngPdfFill = event.target.closest("[data-png-pdf-fill]");
      if (pngPdfFill) {
        state.pngToPdf.fillPage = Boolean(pngPdfFill.checked);
        clearPngToPdfResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
        render();
        return;
      }

      const pdfUnlockInput = event.target.closest("[data-pdf-unlock-input]");
      if (pdfUnlockInput) {
        await handlePdfUnlockFile(pdfUnlockInput.files?.[0]);
        pdfUnlockInput.value = "";
        return;
      }

      const pdfUnlockMode = event.target.closest("[data-pdf-unlock-mode]");
      if (pdfUnlockMode) {
        state.pdfUnlock.mode = pdfUnlockModes[pdfUnlockMode.value] ? pdfUnlockMode.value : "remove";
        if (state.pdfUnlock.mode === "forgot_password_remove") {
          state.pdfUnlock.currentPassword = "";
          state.pdfUnlock.newPassword = "";
          state.pdfUnlock.reason = "forgot_password";
        }
        clearPdfUnlockResult("الإعدادات تغيّرت. نفّذ العملية من جديد.");
        render();
        return;
      }

      const pdfUnlockOwnership = event.target.closest("[data-pdf-unlock-ownership]");
      if (pdfUnlockOwnership) {
        state.pdfUnlock.ownership = pdfUnlockOwnership.value === "yes" ? "yes" : "no";
        clearPdfUnlockResult(state.pdfUnlock.ownership === "yes" ? "تم تأكيد الملكية. أكمل التعهد قبل التنفيذ." : "لا يمكن المتابعة بدون تصريح قانوني.");
        render();
        return;
      }

      const pdfUnlockReason = event.target.closest("[data-pdf-unlock-reason]");
      if (pdfUnlockReason) {
        state.pdfUnlock.reason = pdfUnlockReasons[pdfUnlockReason.value] ? pdfUnlockReason.value : "";
        clearPdfUnlockResult("الإعدادات تغيّرت. نفّذ العملية من جديد.");
        render();
        return;
      }

      const pdfUnlockLegal = event.target.closest("[data-pdf-unlock-legal]");
      if (pdfUnlockLegal) {
        state.pdfUnlock.legalConfirm = Boolean(pdfUnlockLegal.checked);
        clearPdfUnlockResult(state.pdfUnlock.legalConfirm ? "تم تسجيل التعهد. يمكنك تنفيذ العملية عند اكتمال البيانات." : "يجب الموافقة على التعهد قبل التنفيذ.");
        render();
        return;
      }

      const pdfPngInput = event.target.closest("[data-pdf-png-input]");
      if (pdfPngInput) {
        await handlePdfToPngFile(pdfPngInput.files?.[0]);
        pdfPngInput.value = "";
        return;
      }

      const pdfPngQuality = event.target.closest("[data-pdf-png-quality]");
      if (pdfPngQuality) {
        state.pdfToPng.quality = ["1", "1.5", "2"].includes(pdfPngQuality.value) ? pdfPngQuality.value : "1.5";
        clearPdfToPngResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
        render();
        return;
      }

      const pdfPngPageMode = event.target.closest("[data-pdf-png-page-mode]");
      if (pdfPngPageMode) {
        state.pdfToPng.pageMode = pdfPngPageMode.value === "custom" ? "custom" : "all";
        clearPdfToPngResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
        render();
        return;
      }

      const imageConverterInput = event.target.closest("[data-image-converter-input]");
      if (imageConverterInput) {
        await addImageConverterFiles(imageConverterInput.files);
        imageConverterInput.value = "";
        return;
      }

      const imageConverterQuality = event.target.closest("[data-image-converter-quality]");
      if (imageConverterQuality) {
        state.imageConverter.quality = ["0.7", "0.85", "0.95"].includes(imageConverterQuality.value)
          ? imageConverterQuality.value
          : "0.85";
        clearImageConverterResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
        render();
        return;
      }

      const imageConverterResize = event.target.closest("[data-image-converter-resize]");
      if (imageConverterResize) {
        state.imageConverter.resizeMode = ["original", "small", "custom"].includes(imageConverterResize.value)
          ? imageConverterResize.value
          : "original";
        clearImageConverterResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
        render();
        return;
      }

      const imageConverterEnhance = event.target.closest("[data-image-converter-enhance]");
      if (imageConverterEnhance) {
        state.imageConverter.enhance = Boolean(imageConverterEnhance.checked);
        clearImageConverterResult("الإعدادات تغيّرت. شغّل التحويل من جديد.");
        render();
        return;
      }

      const imageCompressorInput = event.target.closest("[data-image-compressor-input]");
      if (imageCompressorInput) {
        await addImageCompressorFiles(imageCompressorInput.files);
        imageCompressorInput.value = "";
        return;
      }

      const imageCompressorFormat = event.target.closest("[data-image-compressor-format]");
      if (imageCompressorFormat) {
        state.imageCompressor.outputFormat = imageCompressorFormats[imageCompressorFormat.value]
          ? imageCompressorFormat.value
          : "original";
        clearImageCompressorResult("الإعدادات تغيّرت. اضغط الصور من جديد.");
        render();
        return;
      }

      const imageCompressorResize = event.target.closest("[data-image-compressor-resize]");
      if (imageCompressorResize) {
        state.imageCompressor.resizeEnabled = Boolean(imageCompressorResize.checked);
        clearImageCompressorResult("الإعدادات تغيّرت. اضغط الصور من جديد.");
        render();
        return;
      }

      const imageCompressorEnhance = event.target.closest("[data-image-compressor-enhance]");
      if (imageCompressorEnhance) {
        state.imageCompressor.enhance = Boolean(imageCompressorEnhance.checked);
        clearImageCompressorResult("الإعدادات تغيّرت. اضغط الصور من جديد.");
        render();
        return;
      }

      const imageRotatorInput = event.target.closest("[data-image-rotator-input]");
      if (imageRotatorInput) {
        await handleImageRotatorFile(imageRotatorInput.files?.[0]);
        imageRotatorInput.value = "";
        return;
      }

      const imageRotatorKeepSize = event.target.closest("[data-image-rotator-keep-size]");
      if (imageRotatorKeepSize) {
        state.imageRotator.keepSize = Boolean(imageRotatorKeepSize.checked);
        await rerenderImageRotatorPreviewAfterSetting("تم تحديث إعداد تثبيت الأبعاد.");
        return;
      }

      const imageRotatorEnhance = event.target.closest("[data-image-rotator-enhance]");
      if (imageRotatorEnhance) {
        state.imageRotator.enhance = Boolean(imageRotatorEnhance.checked);
        await rerenderImageRotatorPreviewAfterSetting("تم تحديث إعداد التحسين البسيط.");
        return;
      }

      const imageCropperInput = event.target.closest("[data-image-cropper-input]");
      if (imageCropperInput) {
        await handleImageCropperFile(imageCropperInput.files?.[0]);
        imageCropperInput.value = "";
        return;
      }

      const imageCropperEnhance = event.target.closest("[data-image-cropper-enhance]");
      if (imageCropperEnhance) {
        state.imageCropper.enhance = Boolean(imageCropperEnhance.checked);
        clearImageCropperResult("الإعدادات تغيّرت. قص الصورة من جديد.");
        render();
        return;
      }

      const smartSource = event.target.closest("[data-smart-search-source]");
      if (smartSource) {
        state.openAiWebSearchV2.sourceType = smartSource.value;
        return;
      }

      const smartLanguage = event.target.closest("[data-smart-search-language]");
      if (smartLanguage) {
        state.openAiWebSearchV2.language = smartLanguage.value;
        return;
      }

      const writingField = event.target.closest("[data-writing-field]");
      if (writingField) {
        const key = writingField.getAttribute("data-writing-field");
        if (["contentType", "purpose", "tone", "language", "length"].includes(key)) {
          state.writingAssistant[key] = writingField.value;
          state.writingAssistant.error = "";
          return;
        }
      }

      const toneField = event.target.closest("[data-tone-field]");
      if (toneField && toneField.getAttribute("data-tone-field") === "level") {
        state.writingAssistant.toneLevel = toneField.value;
        state.writingAssistant.error = "";
        return;
      }

      const correctionField = event.target.closest("[data-correction-field]");
      if (correctionField) {
        const key = correctionField.getAttribute("data-correction-field");
        if (key === "level") {
          state.writingAssistant.correctionLevel = correctionField.value;
          state.writingAssistant.error = "";
          render();
          return;
        }
        if (key === "style") {
          state.writingAssistant.correctionKeepStyle = correctionField.value !== "improve";
          state.writingAssistant.error = "";
          render();
          return;
        }
        if (key === "keepStyle") {
          state.writingAssistant.correctionKeepStyle = Boolean(correctionField.checked);
          state.writingAssistant.error = "";
          render();
          return;
        }
      }

      const expandField = event.target.closest("[data-expand-field]");
      if (expandField) {
        const key = expandField.getAttribute("data-expand-field");
        if (key === "level") {
          state.writingAssistant.expandLevel = expandField.value;
          state.writingAssistant.error = "";
          return;
        }
        if (key === "audience") {
          state.writingAssistant.expandAudience = expandField.value;
          state.writingAssistant.error = "";
          return;
        }
      }

      const summaryField = event.target.closest("[data-summary-field]");
      if (summaryField) {
        const key = summaryField.getAttribute("data-summary-field");
        if (key === "pointsCount") {
          state.writingAssistant.summaryPointsCount = Number(summaryField.value || 5);
          state.writingAssistant.error = "";
          return;
        }
        if (key === "audience") {
          state.writingAssistant.summaryAudience = summaryField.value;
          state.writingAssistant.error = "";
          return;
        }
      }

      const styleField = event.target.closest("[data-style-field]");
      if (styleField) {
        const key = styleField.getAttribute("data-style-field");
        if (key === "audience") {
          state.writingAssistant.styleAudience = styleField.value;
          state.writingAssistant.error = "";
          return;
        }
        if (key === "keepMeaning") {
          state.writingAssistant.styleKeepMeaning = Boolean(styleField.checked);
          state.writingAssistant.error = "";
          render();
          return;
        }
      }

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
        preserveScrollPosition(() => {
          setSelectedFiles(files);
          render();
        });
        if (files.length) {
          showToast(`تم إرفاق ${files.length} ملف.`);
        } else {
          showToast("اختر صورة أو مستندًا مدعومًا.");
        }
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

      const preferenceSelect = event.target.closest("[data-preference-select]");
      if (preferenceSelect) {
        const key = preferenceSelect.getAttribute("data-preference-select");
        if (!key) return;
        updateAppPreference(key, preferenceSelect.value);
        render();
        return;
      }

      const select = event.target.closest("[data-setting]");
      if (!select) return;
      if (!isAuthenticated()) {
        openAuthModal("عدّل الإعدادات بعد تسجيل الدخول.");
        return;
      }
      ensureThreadState();
      state.settings[state.section][select.getAttribute("data-setting")] = select.value;
      saveSectionSettings();
      render();
    });

    bindUiEvent("dragstart", (event) => {
      const item = event.target.closest?.("[data-png-pdf-item]");
      if (!item) return;
      const id = item.getAttribute("data-png-pdf-item") || "";
      state.pngToPdf.draggedId = id;
      event.dataTransfer?.setData("text/plain", id);
      item.classList.add("is-dragging");
    });

    bindUiEvent("dragend", (event) => {
      const item = event.target.closest?.("[data-png-pdf-item]");
      if (!item) return;
      item.classList.remove("is-dragging");
      state.pngToPdf.draggedId = "";
    });

    bindUiEvent("pointerdown", (event) => {
      const canvas = event.target.closest?.("[data-image-cropper-canvas]");
      if (!canvas || !state.imageCropper.bitmap) return;
      const point = getImageCropperCanvasPoint(event, canvas);
      if (!isPointInsideImageCropperCrop(point)) return;
      event.preventDefault();
      state.imageCropper.dragging = true;
      state.imageCropper.dragOffsetX = point.x - state.imageCropper.cropX;
      state.imageCropper.dragOffsetY = point.y - state.imageCropper.cropY;
      canvas.setPointerCapture?.(event.pointerId);
      drawImageCropperPreview();
    });

    bindUiEvent("pointermove", (event) => {
      if (!state.imageCropper.dragging) return;
      const canvas = app.querySelector("[data-image-cropper-canvas]");
      if (!canvas) return;
      event.preventDefault();
      const point = getImageCropperCanvasPoint(event, canvas);
      const crop = normalizeImageCropperCrop({
        cropX: point.x - state.imageCropper.dragOffsetX,
        cropY: point.y - state.imageCropper.dragOffsetY
      });
      revokeImageEnhancerUrl(state.imageCropper.resultUrl);
      state.imageCropper = {
        ...state.imageCropper,
        ...crop,
        resultUrl: "",
        resultFileName: "",
        resultSize: 0,
        progress: 0,
        error: "",
        status: "تم تحريك منطقة القص."
      };
      drawImageCropperPreview();
    });

    function stopImageCropperDrag() {
      if (!state.imageCropper.dragging) return;
      state.imageCropper.dragging = false;
      render();
    }

    bindUiEvent("pointerup", stopImageCropperDrag);
    bindUiEvent("pointercancel", stopImageCropperDrag);

    bindUiEvent("dragover", (event) => {
      const sortItem = event.target.closest?.("[data-png-pdf-item]");
      if (sortItem) {
        event.preventDefault();
        return;
      }
      const dropZone = event.target.closest?.("[data-image-enhancer-dropzone], [data-image-clarifier-dropzone], [data-png-pdf-dropzone], [data-pdf-png-dropzone], [data-pdf-unlock-dropzone], [data-image-converter-dropzone], [data-image-compressor-dropzone], [data-image-rotator-dropzone], [data-image-cropper-dropzone]");
      if (!dropZone) return;
      event.preventDefault();
      dropZone.classList.add("is-drag-over");
    });

    bindUiEvent("dragleave", (event) => {
      const dropZone = event.target.closest?.("[data-image-enhancer-dropzone], [data-image-clarifier-dropzone], [data-png-pdf-dropzone], [data-pdf-png-dropzone], [data-pdf-unlock-dropzone], [data-image-converter-dropzone], [data-image-compressor-dropzone], [data-image-rotator-dropzone], [data-image-cropper-dropzone]");
      if (!dropZone) return;
      dropZone.classList.remove("is-drag-over");
    });

    bindUiEvent("drop", async (event) => {
      const sortItem = event.target.closest?.("[data-png-pdf-item]");
      if (sortItem) {
        event.preventDefault();
        reorderPngToPdfImage(
          state.pngToPdf.draggedId || event.dataTransfer?.getData("text/plain") || "",
          sortItem.getAttribute("data-png-pdf-item") || ""
        );
        return;
      }
      const dropZone = event.target.closest?.("[data-image-enhancer-dropzone], [data-image-clarifier-dropzone], [data-png-pdf-dropzone], [data-pdf-png-dropzone], [data-pdf-unlock-dropzone], [data-image-converter-dropzone], [data-image-compressor-dropzone], [data-image-rotator-dropzone], [data-image-cropper-dropzone]");
      if (!dropZone) return;
      event.preventDefault();
      dropZone.classList.remove("is-drag-over");
      if (dropZone.matches("[data-png-pdf-dropzone]")) {
        await addPngToPdfFiles(event.dataTransfer?.files);
      } else if (dropZone.matches("[data-pdf-png-dropzone]")) {
        await handlePdfToPngFile(event.dataTransfer?.files?.[0]);
      } else if (dropZone.matches("[data-pdf-unlock-dropzone]")) {
        await handlePdfUnlockFile(event.dataTransfer?.files?.[0]);
      } else if (dropZone.matches("[data-image-converter-dropzone]")) {
        await addImageConverterFiles(event.dataTransfer?.files);
      } else if (dropZone.matches("[data-image-compressor-dropzone]")) {
        await addImageCompressorFiles(event.dataTransfer?.files);
      } else if (dropZone.matches("[data-image-rotator-dropzone]")) {
        await handleImageRotatorFile(event.dataTransfer?.files?.[0]);
      } else if (dropZone.matches("[data-image-cropper-dropzone]")) {
        await handleImageCropperFile(event.dataTransfer?.files?.[0]);
      } else if (dropZone.matches("[data-image-clarifier-dropzone]")) {
        await handleImageClarifierFile(event.dataTransfer?.files?.[0]);
      } else {
        await handleImageEnhancerFile(event.dataTransfer?.files?.[0]);
      }
    });

    bindUiEvent("focusin", (event) => {
      if (event.target.closest("[data-auth-focus]") && !isAuthenticated()) {
        openAuthModal("هذه الأداة تحتاج إلى تسجيل الدخول أولًا.");
      }
    });

    bindUiEvent("submit", (event) => {
      const toolSuggestionForm = event.target.closest("[data-tool-suggestion-form]");
      if (toolSuggestionForm) {
        event.preventDefault();
        submitToolSuggestionForm(toolSuggestionForm);
        return;
      }

      const openAiWebSearchV2Form = event.target.closest("[data-smart-search-form]");
      if (openAiWebSearchV2Form) {
        event.preventDefault();
        submitOpenAiWebSearchV2();
        return;
      }

      const toneForm = event.target.closest("[data-tone-form]");
      if (toneForm) {
        event.preventDefault();
        submitToneTool();
        return;
      }

      const correctionForm = event.target.closest("[data-correction-form]");
      if (correctionForm) {
        event.preventDefault();
        submitCorrectionTextTool();
        return;
      }

      const expandForm = event.target.closest("[data-expand-form]");
      if (expandForm) {
        event.preventDefault();
        submitExpandTextTool();
        return;
      }

      const summaryForm = event.target.closest("[data-summary-form]");
      if (summaryForm) {
        event.preventDefault();
        submitSummarizeTextTool();
        return;
      }

      const styleForm = event.target.closest("[data-style-form]");
      if (styleForm) {
        event.preventDefault();
        submitImproveStyleTool();
        return;
      }

      const writingForm = event.target.closest("[data-writing-form]");
      if (writingForm) {
        event.preventDefault();
        submitWritingAssistant();
        return;
      }

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
      if (isAdminRole(payload.user?.role || payload.role)) {
        redirectToAdminDashboard();
        return;
      }
      state.currentUser = persistEmbeddedUser(payload.user) || getActiveUser();
      ensureAccountConversationState();
      state.authModalOpen = false;
      state.settingsModalOpen = false;
      render();
      maybeRefreshDailyRewardIfNeeded();
      scheduleSavedConversationSync();
      focusComposerSoon();
    });
  }

  function render() {
    state.currentUser = getActiveUser();
    ensureAccountConversationState();
    ensureThreadState();
    renderShell();
    drawImageCropperPreview();
    scheduleSavedConversationSync();
  }

  window.addEventListener("popstate", () => {
    state.section = resolveSection();
    ensureThreadState();
    render();
  });

  updateUrl(true);
  applyAppPreferences();
  bindEvents();
  render();
  refreshSessionUser();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initDailyReward().catch(() => {});
    }, { once: true });
  } else {
    initDailyReward().catch(() => {});
  }
  window.setTimeout(() => {
    if (isAuthenticated()) {
      loadNotifications({ silent: true, force: true });
    }
  }, 400);
  window.setInterval(() => {
    if (state.authModalOpen) {
      applyBridgedAuthSession();
    }
  }, 700);
  window.setInterval(() => {
    maybeRefreshDailyRewardIfNeeded();
    if (state.balancePanelOpen) {
      render();
    }
  }, 1000);
})();




