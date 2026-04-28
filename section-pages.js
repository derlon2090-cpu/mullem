(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const app = document.getElementById("sectionApp");
  const initialPageKey = document.body.dataset.page || "messages";
  const LOGIN_URL = "login.html";

  if (!app) return;

  const icons = {
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 10h6V4h-6zM4 20h6v-3H4z"/></svg>',
    messages: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5A8.7 8.7 0 0 1 8 18.8L3 20l1.4-4.5A8.5 8.5 0 1 1 21 11.5Z"/></svg>',
    projects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 12h8M8 15h5"/></svg>',
    library: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h13v16H6a3 3 0 0 0 0-6h13"/><path d="M6 20a3 3 0 1 1 0-6"/></svg>',
    subjects: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6V4M8 4h8M5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"/><path d="M8 14h8"/></svg>',
    aiTools: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/><circle cx="12" cy="12" r="4"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5M9 13h6M9 17h4"/></svg>',
    tests: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="m9 14 2 2 4-4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 1.7 2.6 3-.1.9 2.8 2.7 1-.2 3 2.4 1.9-1.9 2.4.2 3-2.7 1-.9 2.8-3-.1L12 21l-1.7-2.6-3 .1-.9-2.8-2.7-1 .2-3L1.5 12l1.9-2.4-.2-3 2.7-1 .9-2.8 3 .1Z"/><circle cx="12" cy="12" r="3.2"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19c2.5-.5 4.5-2.5 5-5l7-7a4.2 4.2 0 0 0 0-6 4.2 4.2 0 0 0-6 0l-7 7c-.5 2.5-2.5 4.5-5 5 2 1 3 2 4 4 1-1 2-2 4-4Z"/><path d="M14 10 9 15"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5M4 19h16"/><path d="M8 15v-4M12 15V8M16 15V6"/></svg>',
    megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10v4a2 2 0 0 0 2 2h2l4 4V6L7 10H5a2 2 0 0 0-2 2Z"/><path d="M15 8a4 4 0 0 1 0 8"/><path d="M17 5a8 8 0 0 1 0 14"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M15 3v5h5"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 11.5V16c0 1.8 2.2 3.2 5 3.2s5-1.4 5-3.2v-4.5"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 20 4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z"/><path d="m13.5 6.5 4 4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 5 6v5c0 5 3.5 8.5 7 10 3.5-1.5 7-5 7-10V6l-7-3Z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3.5"/><path d="M20 21v-2a4 4 0 0 0-3-3.9"/><path d="M14 4.1a3.5 3.5 0 0 1 0 5.8"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-4-4L7 21"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7Z"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18" cy="12" r="1.7"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 17A2.5 2.5 0 0 0 4 19.5V5a2 2 0 0 1 2-2h14v14Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>'
  };

  const navItems = [
    { key: "dashboard", label: "الرئيسية", href: "index.html", icon: "dashboard" },
    { key: "messages", label: "المحادثات", href: "messages.html", icon: "messages" },
    { key: "projects", label: "المشاريع", href: "projects.html", icon: "projects" },
    { key: "library", label: "المكتبة", href: "library.html", icon: "library" },
    { key: "subjects", label: "المواد الدراسية", href: "subjects.html", icon: "subjects" },
    { key: "ai-tools", label: "أدوات الذكاء الاصطناعي", href: "ai-tools.html", icon: "aiTools" },
    { key: "notes", label: "الملاحظات", href: "notes.html", icon: "notes" },
    { key: "tests", label: "الاختبارات", href: "tests.html", icon: "tests" },
    { key: "settings", label: "الإعدادات", href: "settings.html", icon: "settings" }
  ];

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const storageKey = (key) => `orlixor-public-${key}`;
  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const makeId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

  function toast(message) {
    let stack = $(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    stack.appendChild(item);
    setTimeout(() => item.remove(), 2600);
  }

  function loadState(key, defaults) {
    try {
      const raw = localStorage.getItem(storageKey(key));
      if (!raw) return clone(defaults);
      return { ...clone(defaults), ...JSON.parse(raw) };
    } catch {
      return clone(defaults);
    }
  }

  const pageMap = {
    dashboard: {
      title: "لوحة التحكم",
      subtitle: "شريط واحد ثابت للضيف. تنقّل بين الأقسام من نفس الواجهة، وعند محاولة الاستخدام سيتم طلب تسجيل الدخول.",
      searchPlaceholder: "ابحث عن قسم أو خدمة...",
      primaryLabel: "تسجيل الدخول",
      defaults: {
        search: ""
      },
      render() {
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="workspace-grid-3">
            <button class="project-card" type="button" data-section-nav="messages">
              <div class="card-icon">${icons.messages}</div>
              <strong>المحادثات</strong>
              <span>استعرض واجهة الشات قبل تسجيل الدخول.</span>
              <div class="card-stat">شات ذكي</div>
            </button>
            <button class="project-card" type="button" data-section-nav="projects">
              <div class="card-icon blue">${icons.projects}</div>
              <strong>المشاريع</strong>
              <span>تنظيم الملفات والمسارات الدراسية في عرض واحد.</span>
              <div class="card-stat">تنظيم مرن</div>
            </button>
            <button class="project-card" type="button" data-section-nav="library">
              <div class="card-icon mint">${icons.library}</div>
              <strong>المكتبة</strong>
              <span>معاينة المستندات والمواد المحفوظة داخل المنصة.</span>
              <div class="card-stat">محتوى محفوظ</div>
            </button>
          </div>
          <div class="workspace-grid-3" style="margin-top:18px;">
            <button class="project-card" type="button" data-section-nav="subjects">
              <div class="card-icon orange">${icons.subjects}</div>
              <strong>المواد الدراسية</strong>
              <span>اعرف شكل عرض المواد والتقدم قبل الدخول.</span>
              <div class="card-stat">مسارات تعليمية</div>
            </button>
            <button class="project-card" type="button" data-section-nav="ai-tools">
              <div class="card-icon pink">${icons.aiTools}</div>
              <strong>أدوات الذكاء الاصطناعي</strong>
              <span>استعرض الأدوات المتاحة من نفس الواجهة العامة.</span>
              <div class="card-stat">أدوات ذكية</div>
            </button>
            <button class="project-card" type="button" data-section-nav="tests">
              <div class="card-icon">${icons.tests}</div>
              <strong>الاختبارات</strong>
              <span>شاهد نماذج الاختبارات والنتائج قبل تسجيل الدخول.</span>
              <div class="card-stat">تقييم فوري</div>
            </button>
          </div>
        `;
      },
      bind() {}
    },
    messages: {
      title: "المحادثات",
      subtitle: "نفس روح التصميم المرجعي ولكن كواجهة حقيقية يمكنك استخدامها مباشرة.",
      searchPlaceholder: "ابحث في المحادثات...",
      primaryLabel: "محادثة جديدة",
      defaults: {
        search: "",
        activeId: "conv-1",
        conversations: [
          {
            id: "conv-1",
            title: "تحليل البيانات",
            preview: "أريد تحليل البيانات الخاصة بمبيعات الشهر الماضي",
            time: "منذ دقائق",
            messages: [
              { role: "assistant", text: "مرحبًا، كيف يمكنني مساعدتك اليوم؟" },
              { role: "user", text: "أريد تحليل البيانات الخاصة بمبيعات الشهر الماضي" },
              { role: "assistant", text: "بالتأكيد، يمكنني تنظيم البيانات، استخراج الأنماط المهمة، وتلخيص النتائج بشكل واضح يساعدك على اتخاذ قرارات أفضل." }
            ]
          },
          {
            id: "conv-2",
            title: "خطة تسويقية",
            preview: "ابنِ لي خطة تسويقية لمتجر إلكتروني",
            time: "منذ ساعة",
            messages: [
              { role: "assistant", text: "لنبدأ بتحديد الجمهور المستهدف ثم القنوات المناسبة للإطلاق." }
            ]
          },
          {
            id: "conv-3",
            title: "مساعدة برمجية",
            preview: "ساعدني في إصلاح واجهة المستخدم",
            time: "منذ ساعتين",
            messages: [
              { role: "assistant", text: "أرسل لي المشكلة الحالية وسأرتب لك الحل خطوة بخطوة." }
            ]
          },
          {
            id: "conv-4",
            title: "بحث قانوني",
            preview: "لخّص لي النقاط القانونية الرئيسية",
            time: "منذ 3 أيام",
            messages: [
              { role: "assistant", text: "أستطيع إعداد ملخص مركز ومنظم للنقاط الرئيسية." }
            ]
          }
        ]
      },
      render(state) {
        const list = state.conversations.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          if (!needle) return true;
          return `${item.title} ${item.preview}`.toLowerCase().includes(needle);
        });
        const active = state.conversations.find((item) => item.id === state.activeId) || list[0] || state.conversations[0];
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="messages-layout">
            <section class="workspace-panel messages-sidebar">
              <div class="workspace-page-tools">
                <button class="workspace-secondary-btn" type="button" data-new-conversation>${icons.plus}محادثة جديدة</button>
              </div>
              <label class="workspace-mini-search">
                ${icons.search}
                <input data-page-search value="${escapeHtml(state.search)}" placeholder="ابحث في المحادثات">
              </label>
              <div class="conversation-list">
                ${list.map((item) => `
                  <button class="conversation-card ${item.id === active?.id ? "is-active" : ""}" type="button" data-conversation="${item.id}">
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml(item.preview)}</span>
                    <small>${escapeHtml(item.time)}</small>
                  </button>
                `).join("") || '<div class="empty-state">لا توجد محادثات مطابقة الآن.</div>'}
              </div>
            </section>
            <section class="workspace-panel chat-panel">
              <div class="chat-header-row">
                <div>
                  <strong>${escapeHtml(active?.title || "محادثة جديدة")}</strong>
                  <div class="muted-time">${escapeHtml(active?.time || "الآن")}</div>
                </div>
                <button class="workspace-menu-btn" type="button" data-chat-info>${icons.dots}</button>
              </div>
              <div class="chat-thread">
                ${(active?.messages || []).map((message) => `
                  <div class="chat-bubble ${message.role}">
                    ${escapeHtml(message.text)}
                  </div>
                `).join("")}
              </div>
              <form class="chat-compose" data-send-form>
                <input name="message" placeholder="اكتب رسالتك هنا..." autocomplete="off">
                <button class="chat-send-btn" type="submit" aria-label="إرسال">${icons.send}</button>
              </form>
            </section>
          </div>
        `;
      },
      bind(root, state, setState) {
        $$("[data-conversation]", root).forEach((button) => {
          button.addEventListener("click", () => setState({ ...state, activeId: button.dataset.conversation }, false));
        });
        $("[data-new-conversation]", root)?.addEventListener("click", () => {
          const title = window.prompt("اسم المحادثة الجديدة", "محادثة جديدة");
          if (!title) return;
          const created = {
            id: makeId("conv"),
            title,
            preview: "ابدأ كتابة سؤالك الآن",
            time: "الآن",
            messages: [{ role: "assistant", text: `تم إنشاء "${title}" بنجاح. ابدأ سؤالك وسأتابع معك هنا.` }]
          };
          setState({
            ...state,
            activeId: created.id,
            conversations: [created, ...state.conversations]
          });
          toast("تم إنشاء محادثة جديدة.");
        });
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $("[data-send-form]", root)?.addEventListener("submit", (event) => {
          event.preventDefault();
          const input = event.currentTarget.elements.message;
          const text = input.value.trim();
          if (!text) return;
          const nextConversations = state.conversations.map((item) => {
            if (item.id !== state.activeId) return item;
            return {
              ...item,
              preview: text,
              time: "الآن",
              messages: [
                ...item.messages,
                { role: "user", text },
                { role: "assistant", text: `فهمت طلبك حول "${text}". أستطيع الآن تحويله إلى خطوات واضحة أو تلخيص أو إجابة مباشرة حسب ما تريد.` }
              ]
            };
          });
          input.value = "";
          setState({ ...state, conversations: nextConversations });
        });
        $("[data-chat-info]", root)?.addEventListener("click", () => toast("هذه محادثة تفاعلية عامة بدون تسجيل دخول."));
      }
    },
    projects: {
      title: "المشاريع",
      subtitle: "نظّم مشاريعك ومهامك في بطاقات مرنة مثل المرجع تمامًا.",
      searchPlaceholder: "ابحث في المشاريع...",
      primaryLabel: "مشروع جديد",
      defaults: {
        search: "",
        projects: [
          { id: "project-1", title: "مشروع التسويق", updated: "تحديث منذ 2 يوم", count: 12, icon: "rocket", tone: "purple" },
          { id: "project-2", title: "تحليل البيانات", updated: "تحديث منذ 2 يوم", count: 8, icon: "chart", tone: "blue" },
          { id: "project-3", title: "تطوير الموقع", updated: "تحديث منذ 4 أيام", count: 16, icon: "megaphone", tone: "mint" },
          { id: "project-4", title: "خطة المحتوى", updated: "تحديث منذ 2 يوم", count: 9, icon: "file", tone: "purple" },
          { id: "project-5", title: "بحث السوق", updated: "تحديث منذ 2 يوم", count: 9, icon: "users", tone: "orange" },
          { id: "project-6", title: "تطبيق الجوال", updated: "تحديث منذ 4 أيام", count: 11, icon: "subjects", tone: "pink" }
        ]
      },
      render(state) {
        const list = state.projects.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          if (!needle) return true;
          return item.title.toLowerCase().includes(needle);
        });
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="workspace-page-tools">
            <button class="workspace-secondary-btn" type="button" data-new-project>${icons.plus}مشروع جديد</button>
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ابحث في المشاريع">
            </label>
          </div>
          <div class="workspace-grid-3">
            ${list.map((item) => `
              <button class="project-card" type="button" data-project="${item.id}">
                <div class="card-icon ${item.tone}">${icons[item.icon]}</div>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.updated)}</span>
                <div class="card-stat">${item.count} مهمة</div>
              </button>
            `).join("") || '<div class="empty-state">لا توجد مشاريع مطابقة للبحث.</div>'}
          </div>
        `;
      },
      bind(root, state, setState) {
        $("[data-new-project]", root)?.addEventListener("click", () => {
          const title = window.prompt("اسم المشروع الجديد", "مشروع جديد");
          if (!title) return;
          const project = {
            id: makeId("project"),
            title,
            updated: "تحديث الآن",
            count: 1,
            icon: "rocket",
            tone: "purple"
          };
          setState({ ...state, projects: [project, ...state.projects] });
          toast("تمت إضافة المشروع الجديد.");
        });
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $$("[data-project]", root).forEach((button) => {
          button.addEventListener("click", () => {
            const project = state.projects.find((item) => item.id === button.dataset.project);
            toast(`"${project?.title || "المشروع"}" جاهز الآن للمتابعة.`);
          });
        });
      }
    },
    library: {
      title: "المكتبة",
      subtitle: "ملفاتك مرتبة وفلاترها تعمل، بنفس أسلوب الواجهة المرجعية.",
      searchPlaceholder: "ابحث في المكتبة...",
      primaryLabel: "رفع ملف",
      defaults: {
        search: "",
        filter: "الكل",
        filters: ["الكل", "رائجة", "ملفات", "وورد", "إكسل", "عروض تقديمية"],
        files: [
          { id: "file-1", title: "دليل المستخدم", type: "PDF", size: "2.4 MB", icon: "file", tone: "purple", category: "ملفات" },
          { id: "file-2", title: "استراتيجية التسويق", type: "DOCX", size: "1.1 MB", icon: "notes", tone: "blue", category: "وورد" },
          { id: "file-3", title: "تقرير المبيعات", type: "XLSX", size: "850 KB", icon: "chart", tone: "mint", category: "إكسل" },
          { id: "file-4", title: "عرض تقديمي", type: "PPTX", size: "3.2 MB", icon: "subjects", tone: "orange", category: "عروض تقديمية" },
          { id: "file-5", title: "بحث المنافسين", type: "PDF", size: "1.7 MB", icon: "search", tone: "pink", category: "ملفات" },
          { id: "file-6", title: "خطة المشروع", type: "DOCX", size: "950 KB", icon: "projects", tone: "blue", category: "وورد" }
        ]
      },
      render(state) {
        const list = state.files.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          const matchText = !needle || `${item.title} ${item.type}`.toLowerCase().includes(needle);
          const matchFilter = state.filter === "الكل" || item.category === state.filter;
          return matchText && matchFilter;
        });
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="workspace-page-tools">
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ابحث في المكتبة">
            </label>
          </div>
          <div class="pill-row">
            ${state.filters.map((item) => `
              <button class="workspace-pill ${state.filter === item ? "is-active" : ""}" type="button" data-filter="${escapeHtml(item)}">
                ${item}
              </button>
            `).join("")}
          </div>
          <div class="workspace-grid-3" style="margin-top:18px;">
            ${list.map((item) => `
              <article class="file-card">
                <div class="file-card-head">
                  <div class="card-icon ${item.tone}">${icons[item.icon]}</div>
                  <button class="workspace-menu-btn" type="button" data-file-menu="${item.id}">${icons.dots}</button>
                </div>
                <strong>${escapeHtml(item.title)}</strong>
                <span class="file-type">${escapeHtml(item.type)}</span>
                <small>${escapeHtml(item.size)}</small>
              </article>
            `).join("") || '<div class="empty-state">لا توجد ملفات مطابقة لهذا الفلتر.</div>'}
          </div>
        `;
      },
      bind(root, state, setState) {
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $$("[data-filter]", root).forEach((button) => {
          button.addEventListener("click", () => setState({ ...state, filter: button.dataset.filter }, false));
        });
        $$("[data-file-menu]", root).forEach((button) => {
          button.addEventListener("click", () => toast("يمكنك فتح الملف أو مشاركته أو حفظه للمراجعة."));
        });
      }
    },
    subjects: {
      title: "المواد الدراسية",
      subtitle: "إحصاءات سريعة وتقدّم واضح للمقررات الرئيسية.",
      searchPlaceholder: "ابحث عن مادة أو مقرر...",
      primaryLabel: "استعراض المواد",
      defaults: {
        search: "",
        stats: [
          { value: "128", label: "إجمالي المقررات" },
          { value: "64", label: "الدروس" },
          { value: "24", label: "الاختبارات" },
          { value: "36h", label: "إجمالي التقدم" }
        ],
        progress: [
          { title: "الذكاء الاصطناعي للمبتدئين", meta: "24 درس", percent: 75 },
          { title: "تصميم تجربة المستخدم", meta: "19 درس", percent: 60 },
          { title: "تحليل البيانات", meta: "20 درس", percent: 90 },
          { title: "تطوير تطبيقات الذكاء الاصطناعي", meta: "14 درس", percent: 30 }
        ]
      },
      render(state) {
        const progress = state.progress.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          if (!needle) return true;
          return `${item.title} ${item.meta}`.toLowerCase().includes(needle);
        });
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="workspace-page-tools">
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ابحث عن مادة">
            </label>
          </div>
          <div class="subject-stats">
            ${state.stats.map((item) => `
              <article class="subject-stat-box">
                <strong>${item.value}</strong>
                <span>${item.label}</span>
              </article>
            `).join("")}
          </div>
          <section class="workspace-panel subject-progress-panel">
            <strong class="subject-progress-title">المقررات</strong>
            <div class="subject-progress-list" style="margin-top:18px;">
              ${progress.map((item) => `
                <div class="subject-progress-row">
                  <div class="subject-progress-copy">
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml(item.meta)}</span>
                    <div class="progress-track"><b style="width:${item.percent}%"></b></div>
                  </div>
                  <strong>${item.percent}%</strong>
                </div>
              `).join("") || '<div class="empty-state">لا توجد مواد مطابقة للبحث.</div>'}
            </div>
          </section>
        `;
      },
      bind(root, state, setState) {
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
      }
    },
    "ai-tools": {
      title: "أدوات الذكاء الاصطناعي",
      subtitle: "مجموعة أدوات عملية جاهزة للاستخدام الفوري.",
      searchPlaceholder: "ابحث عن أداة...",
      primaryLabel: "تشغيل أداة",
      defaults: {
        search: "",
        tools: [
          { id: "tool-1", title: "مساعد الكتابة", desc: "صياغة النصوص والمقالات باحترافية.", icon: "pencil", tone: "blue" },
          { id: "tool-2", title: "تحليل البيانات", desc: "تحويل الجداول إلى قراءات واضحة وسريعة.", icon: "chart", tone: "purple" },
          { id: "tool-3", title: "توليد الصور", desc: "إنشاء صور مخصصة للأفكار والعروض.", icon: "image", tone: "orange" },
          { id: "tool-4", title: "تلخيص النصوص", desc: "تلخيص طويل أو قصير للنصوص والمستندات.", icon: "file", tone: "blue" },
          { id: "tool-5", title: "ترجمة ذكية", desc: "ترجمة دقيقة بصياغة طبيعية وواضحة.", icon: "globe", tone: "mint" },
          { id: "tool-6", title: "مساعد البرمجة", desc: "مساعدة في كتابة الكود وتحسينه.", icon: "spark", tone: "orange" }
        ]
      },
      render(state) {
        const list = state.tools.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          if (!needle) return true;
          return `${item.title} ${item.desc}`.toLowerCase().includes(needle);
        });
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="workspace-page-tools">
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ابحث عن أداة">
            </label>
          </div>
          <div class="workspace-grid-3">
            ${list.map((item) => `
              <article class="tool-card">
                <div class="card-icon ${item.tone}">${icons[item.icon]}</div>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.desc)}</p>
                <button class="workspace-secondary-btn tool-action" type="button" data-tool="${item.id}">استخدام</button>
              </article>
            `).join("") || '<div class="empty-state">لا توجد أدوات مطابقة الآن.</div>'}
          </div>
        `;
      },
      bind(root, state, setState) {
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $$("[data-tool]", root).forEach((button) => {
          button.addEventListener("click", () => {
            const tool = state.tools.find((item) => item.id === button.dataset.tool);
            toast(`تم تشغيل "${tool?.title || "الأداة"}" بشكل تجريبي.`);
          });
        });
      }
    },
    notes: {
      title: "الملاحظات",
      subtitle: "ملاحظات سريعة منظمة داخل قائمة حقيقية قابلة للإضافة والفتح.",
      searchPlaceholder: "ابحث في الملاحظات...",
      primaryLabel: "ملاحظة جديدة",
      defaults: {
        search: "",
        notes: [
          { id: "note-1", title: "أفكار المشروع الجديد", excerpt: "ملاحظات حول تطوير المشروع...", time: "منذ 5 دقائق", tone: "green" },
          { id: "note-2", title: "اجتماع الفريق", excerpt: "ملخص اجتماع اليوم مع الفريق", time: "منذ 4 ساعات", tone: "blue" },
          { id: "note-3", title: "قائمة المهام", excerpt: "المهام المطلوبة لإنجازها هذا الأسبوع", time: "منذ 1 يوم", tone: "red" },
          { id: "note-4", title: "أفكار المحتوى", excerpt: "أفكار لمحتوى وسائل التواصل الاجتماعي", time: "منذ 3 أيام", tone: "purple" }
        ]
      },
      render(state) {
        const list = state.notes.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          if (!needle) return true;
          return `${item.title} ${item.excerpt}`.toLowerCase().includes(needle);
        });
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="workspace-page-tools">
            <button class="workspace-secondary-btn" type="button" data-new-note>${icons.plus}ملاحظة جديدة</button>
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ابحث في الملاحظات">
            </label>
          </div>
          <section class="workspace-panel notes-panel">
            ${list.map((item) => `
              <button class="note-row" type="button" data-note="${item.id}">
                <span class="note-icon ${item.tone}">${icons.file}</span>
                <span class="note-copy">
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.excerpt)}</p>
                </span>
                <small class="muted-time">${escapeHtml(item.time)}</small>
                <span class="workspace-menu-btn">${icons.dots}</span>
              </button>
            `).join("") || '<div class="empty-state">لا توجد ملاحظات مطابقة الآن.</div>'}
          </section>
        `;
      },
      bind(root, state, setState) {
        $("[data-new-note]", root)?.addEventListener("click", () => {
          const title = window.prompt("عنوان الملاحظة", "ملاحظة جديدة");
          if (!title) return;
          const note = {
            id: makeId("note"),
            title,
            excerpt: "اكتب تفاصيل الملاحظة هنا...",
            time: "الآن",
            tone: "purple"
          };
          setState({ ...state, notes: [note, ...state.notes] });
          toast("تم إنشاء ملاحظة جديدة.");
        });
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $$("[data-note]", root).forEach((button) => {
          button.addEventListener("click", () => {
            const note = state.notes.find((item) => item.id === button.dataset.note);
            toast(`فتحت "${note?.title || "الملاحظة"}" بنجاح.`);
          });
        });
      }
    },
    tests: {
      title: "الاختبارات",
      subtitle: "مؤشرات ونتائج واختبارات جاهزة للمتابعة الفورية.",
      searchPlaceholder: "ابحث عن اختبار...",
      primaryLabel: "اختبار جديد",
      defaults: {
        search: "",
        metrics: [
          { value: "24", label: "اختبار جديد" },
          { value: "18", label: "مفتوحة" },
          { value: "85%", label: "متوسط النتيجة" },
          { value: "98%", label: "أفضل نتيجة" }
        ],
        tests: [
          { id: "test-1", title: "اختبار الذكاء الاصطناعي", score: "95%", time: "منذ 2 يوم" },
          { id: "test-2", title: "اختبار تحليل البيانات", score: "88%", time: "منذ 3 يوم" },
          { id: "test-3", title: "اختبار تعلم الآلة", score: "92%", time: "منذ 5 يوم" },
          { id: "test-4", title: "اختبار الرياضيات", score: "75%", time: "منذ أسبوع" }
        ]
      },
      render(state) {
        const list = state.tests.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          if (!needle) return true;
          return item.title.toLowerCase().includes(needle);
        });
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="workspace-page-tools">
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ابحث عن اختبار">
            </label>
          </div>
          <div class="test-metrics">
            <div class="test-summary">
              ${state.metrics.map((item) => `
                <article class="metric-box">
                  <strong>${item.value}</strong>
                  <span>${item.label}</span>
                </article>
              `).join("")}
            </div>
            <section class="workspace-panel notes-panel">
              ${list.map((item) => `
                <div class="test-row">
                  <span class="test-icon note-icon purple">${icons.spark}</span>
                  <span class="test-copy">
                    <strong>${escapeHtml(item.title)}</strong>
                    <p>${escapeHtml(item.time)}</p>
                  </span>
                  <span class="test-score-pill">${item.score}</span>
                  <button class="workspace-inline-btn" type="button" data-start-test="${item.id}">عرض النتيجة</button>
                </div>
              `).join("") || '<div class="empty-state">لا توجد اختبارات مطابقة الآن.</div>'}
            </section>
          </div>
        `;
      },
      bind(root, state, setState) {
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $$("[data-start-test]", root).forEach((button) => {
          button.addEventListener("click", () => {
            const test = state.tests.find((item) => item.id === button.dataset.startTest);
            toast(`تم فتح نتيجة "${test?.title || "الاختبار"}".`);
          });
        });
      }
    },
    settings: {
      title: "الإعدادات",
      subtitle: "بطاقات إعدادات فعلية مع منطقة تفاصيل قابلة للتبديل.",
      searchPlaceholder: "ابحث في الإعدادات...",
      primaryLabel: "تخصيص سريع",
      defaults: {
        search: "",
        active: "profile",
        settings: [
          { id: "profile", title: "الملف الشخصي", desc: "إدارة معلوماتك الشخصية", icon: "users", tone: "purple", detail: "يمكنك هنا تعديل الاسم، الصورة، والبيانات الأساسية الخاصة بحسابك." },
          { id: "security", title: "الأمان والخصوصية", desc: "إدارة الأمان والخصوصية", icon: "shield", tone: "mint", detail: "اضبط الحماية وتحقق من خيارات الأمان والخصوصية المرتبطة بالحساب." },
          { id: "alerts", title: "الإشعارات", desc: "إدارة الإشعارات والتنبيهات", icon: "bell", tone: "orange", detail: "خصص رسائل التنبيه، التنبيهات الذكية، وقنوات الإشعار المفضلة لديك." },
          { id: "appearance", title: "المظهر", desc: "تخصيص مظهر التطبيق", icon: "spark", tone: "pink", detail: "بدّل بين أنماط الواجهة ونظم عرض العناصر لتلائم استخدامك اليومي." },
          { id: "language", title: "اللغة والمنطقة", desc: "إعدادات اللغة والمنطقة", icon: "globe", tone: "blue", detail: "اختر اللغة، المنطقة الزمنية، وطريقة عرض التنسيقات داخل المنصة." },
          { id: "integrations", title: "التكاملات", desc: "إدارة التطبيقات المتصلة", icon: "projects", tone: "purple", detail: "استعرض التكاملات النشطة واربط الخدمات الخارجية التي تحتاجها." }
        ]
      },
      render(state) {
        const list = state.settings.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          if (!needle) return true;
          return `${item.title} ${item.desc}`.toLowerCase().includes(needle);
        });
        const active = state.settings.find((item) => item.id === state.active) || list[0] || state.settings[0];
        return `
          <div class="workspace-page-header">
            <h1>${this.title}</h1>
            <p>${this.subtitle}</p>
          </div>
          <div class="workspace-page-tools">
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ابحث في الإعدادات">
            </label>
          </div>
          <div class="workspace-grid-settings">
            ${list.map((item) => `
              <button class="setting-card" type="button" data-setting="${item.id}">
                <div class="card-icon ${item.tone}">${icons[item.icon]}</div>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.desc)}</span>
              </button>
            `).join("") || '<div class="empty-state">لا توجد إعدادات مطابقة الآن.</div>'}
          </div>
          <section class="workspace-panel settings-detail">
            <strong>${escapeHtml(active?.title || "الإعدادات")}</strong>
            <p>${escapeHtml(active?.detail || "اختر إحدى البطاقات لعرض التفاصيل هنا.")}</p>
          </section>
        `;
      },
      bind(root, state, setState) {
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $$("[data-setting]", root).forEach((button) => {
          button.addEventListener("click", () => setState({ ...state, active: button.dataset.setting }, false));
        });
      }
    }
  };

  function guestUrl(sectionKey) {
    return `guest.html?section=${encodeURIComponent(sectionKey)}`;
  }

  if (!window.location.pathname.toLowerCase().endsWith("guest.html")) {
    window.location.replace(guestUrl(initialPageKey));
    return;
  }

  function resolvePageKey() {
    const urlSection = new URLSearchParams(window.location.search).get("section");
    if (urlSection && pageMap[urlSection]) return urlSection;
    if (pageMap[initialPageKey]) return initialPageKey;
    return "messages";
  }

  let currentPageKey = resolvePageKey();
  let state = clone(pageMap[currentPageKey].defaults);

  function syncGuestUrl(replace = false) {
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", guestUrl(currentPageKey));
  }

  syncGuestUrl(true);

  function persist() {}

  function setState(next, shouldPersist = true) {
    state = next;
    if (shouldPersist) persist();
    render();
  }

  function renderSidebarNav() {
    return navItems
      .map((item) => {
        const active = item.key === currentPageKey ? "is-active" : "";
        return `
          <button class="workspace-nav-link ${active}" type="button" data-section-nav="${item.key}">
            <span>${item.label}</span>
            <i>${icons[item.icon]}</i>
          </button>
        `;
      })
      .join("");
  }

  function shell(content, pageConfig) {
    return `
      <div class="workspace-shell">
        <aside class="workspace-sidebar" aria-label="التنقل">
          <nav class="workspace-nav">${renderSidebarNav()}</nav>
        </aside>
        <section class="workspace-main">
          <header class="workspace-topbar">
            <div class="workspace-topbar-meta">نسخة استعراض عامة</div>
            <div class="workspace-topbar-actions">
              <label class="workspace-search">
                <span class="workspace-chip">⌘ K</span>
                <input data-global-search value="${escapeHtml(state.search || "")}" placeholder="${escapeHtml(pageConfig.searchPlaceholder)}">
                ${icons.search}
              </label>
              <button class="workspace-icon-btn" type="button" aria-label="الإشعارات">${icons.bell}</button>
              <button class="workspace-icon-btn" type="button" aria-label="الملف الشخصي">${icons.users}</button>
            </div>
          </header>
          <div data-page-content>${content}</div>
        </section>
      </div>
    `;
  }

  function handlePrimaryAction() {
    window.location.href = LOGIN_URL;
  }

  function redirectToLogin() {
    window.location.href = LOGIN_URL;
  }

  function setSection(nextSectionKey, replace = false) {
    if (!pageMap[nextSectionKey] || nextSectionKey === currentPageKey) return;
    currentPageKey = nextSectionKey;
    state = clone(pageMap[currentPageKey].defaults);
    syncGuestUrl(replace);
    render();
  }
  function bindAuthPreviewGate() {
    app.addEventListener("click", (event) => {
      if (event.target.closest(".workspace-nav-link, .workspace-brand, [data-section-nav]")) return;
      if (
        event.target.closest(
          "[data-primary-action], .workspace-icon-btn, .workspace-search, [data-page-content] button, [data-page-content] input, [data-page-content] textarea, [data-page-content] select, [data-page-content] a"
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
        redirectToLogin();
      }
    }, true);

    app.addEventListener("submit", (event) => {
      if (!event.target.closest("[data-page-content] form")) return;
      event.preventDefault();
      event.stopPropagation();
      redirectToLogin();
    }, true);

    app.addEventListener("focusin", (event) => {
      if (
        event.target.closest(".workspace-search input, [data-page-content] input, [data-page-content] textarea, [data-page-content] select")
      ) {
        redirectToLogin();
      }
    }, true);
  }

  function bindGlobal() {
    $("[data-primary-action]", app)?.addEventListener("click", redirectToLogin);
    $$("[data-section-nav]", app).forEach((button) => {
      button.addEventListener("click", () => setSection(button.dataset.sectionNav));
    });
    $$(".workspace-icon-btn", app).forEach((button) => {
      button.addEventListener("click", redirectToLogin);
    });
    bindAuthPreviewGate();
  }

  function render() {
    const pageConfig = pageMap[currentPageKey];
    if (!pageConfig) return;
    app.innerHTML = `<div class="workspace-app">${shell(pageConfig.render(state), pageConfig)}</div>`;
    bindGlobal();
    pageConfig.bind(app, state, setState);
  }

  window.addEventListener("popstate", () => {
    const nextPageKey = resolvePageKey();
    if (!pageMap[nextPageKey] || nextPageKey === currentPageKey) return;
    currentPageKey = nextPageKey;
    state = clone(pageMap[currentPageKey].defaults);
    render();
  });

  render();
})();
