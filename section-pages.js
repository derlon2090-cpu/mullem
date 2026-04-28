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
    { key: "dashboard", label: "ظ„ظˆط­ط© ط§ظ„طھط­ظƒظ…", href: "index.html", icon: "dashboard" },
    { key: "messages", label: "ط§ظ„ظ…ط­ط§ط¯ط«ط§طھ", href: "messages.html", icon: "messages" },
    { key: "projects", label: "ط§ظ„ظ…ط´ط§ط±ظٹط¹", href: "projects.html", icon: "projects" },
    { key: "library", label: "ط§ظ„ظ…ظƒطھط¨ط©", href: "library.html", icon: "library" },
    { key: "subjects", label: "ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط¯ط±ط§ط³ظٹط©", href: "subjects.html", icon: "subjects" },
    { key: "ai-tools", label: "ط£ط¯ظˆط§طھ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ", href: "ai-tools.html", icon: "aiTools" },
    { key: "notes", label: "ط§ظ„ظ…ظ„ط§ط­ط¸ط§طھ", href: "notes.html", icon: "notes" },
    { key: "tests", label: "ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ", href: "tests.html", icon: "tests" },
    { key: "settings", label: "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ", href: "settings.html", icon: "settings" }
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
      title: "ط§ظ„ظ…ط­ط§ط¯ط«ط§طھ",
      subtitle: "ظ†ظپط³ ط±ظˆط­ ط§ظ„طھطµظ…ظٹظ… ط§ظ„ظ…ط±ط¬ط¹ظٹ ظˆظ„ظƒظ† ظƒظˆط§ط¬ظ‡ط© ط­ظ‚ظٹظ‚ظٹط© ظٹظ…ظƒظ†ظƒ ط§ط³طھط®ط¯ط§ظ…ظ‡ط§ ظ…ط¨ط§ط´ط±ط©.",
      searchPlaceholder: "ط§ط¨ط­ط« ظپظٹ ط§ظ„ظ…ط­ط§ط¯ط«ط§طھ...",
      primaryLabel: "ظ…ط­ط§ط¯ط«ط© ط¬ط¯ظٹط¯ط©",
      defaults: {
        search: "",
        activeId: "conv-1",
        conversations: [
          {
            id: "conv-1",
            title: "طھط­ظ„ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ",
            preview: "ط£ط±ظٹط¯ طھط­ظ„ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط®ط§طµط© ط¨ظ…ط¨ظٹط¹ط§طھ ط§ظ„ط´ظ‡ط± ط§ظ„ظ…ط§ط¶ظٹ",
            time: "ظ…ظ†ط° ط¯ظ‚ط§ط¦ظ‚",
            messages: [
              { role: "assistant", text: "ظ…ط±ط­ط¨ظ‹ط§طŒ ظƒظٹظپ ظٹظ…ظƒظ†ظ†ظٹ ظ…ط³ط§ط¹ط¯طھظƒ ط§ظ„ظٹظˆظ…طں" },
              { role: "user", text: "ط£ط±ظٹط¯ طھط­ظ„ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط®ط§طµط© ط¨ظ…ط¨ظٹط¹ط§طھ ط§ظ„ط´ظ‡ط± ط§ظ„ظ…ط§ط¶ظٹ" },
              { role: "assistant", text: "ط¨ط§ظ„طھط£ظƒظٹط¯طŒ ظٹظ…ظƒظ†ظ†ظٹ طھظ†ط¸ظٹظ… ط§ظ„ط¨ظٹط§ظ†ط§طھطŒ ط§ط³طھط®ط±ط§ط¬ ط§ظ„ط£ظ†ظ…ط§ط· ط§ظ„ظ…ظ‡ظ…ط©طŒ ظˆطھظ„ط®ظٹطµ ط§ظ„ظ†طھط§ط¦ط¬ ط¨ط´ظƒظ„ ظˆط§ط¶ط­ ظٹط³ط§ط¹ط¯ظƒ ط¹ظ„ظ‰ ط§طھط®ط§ط° ظ‚ط±ط§ط±ط§طھ ط£ظپط¶ظ„." }
            ]
          },
          {
            id: "conv-2",
            title: "ط®ط·ط© طھط³ظˆظٹظ‚ظٹط©",
            preview: "ط§ط¨ظ†ظگ ظ„ظٹ ط®ط·ط© طھط³ظˆظٹظ‚ظٹط© ظ„ظ…طھط¬ط± ط¥ظ„ظƒطھط±ظˆظ†ظٹ",
            time: "ظ…ظ†ط° ط³ط§ط¹ط©",
            messages: [
              { role: "assistant", text: "ظ„ظ†ط¨ط¯ط£ ط¨طھط­ط¯ظٹط¯ ط§ظ„ط¬ظ…ظ‡ظˆط± ط§ظ„ظ…ط³طھظ‡ط¯ظپ ط«ظ… ط§ظ„ظ‚ظ†ظˆط§طھ ط§ظ„ظ…ظ†ط§ط³ط¨ط© ظ„ظ„ط¥ط·ظ„ط§ظ‚." }
            ]
          },
          {
            id: "conv-3",
            title: "ظ…ط³ط§ط¹ط¯ط© ط¨ط±ظ…ط¬ظٹط©",
            preview: "ط³ط§ط¹ط¯ظ†ظٹ ظپظٹ ط¥طµظ„ط§ط­ ظˆط§ط¬ظ‡ط© ط§ظ„ظ…ط³طھط®ط¯ظ…",
            time: "ظ…ظ†ط° ط³ط§ط¹طھظٹظ†",
            messages: [
              { role: "assistant", text: "ط£ط±ط³ظ„ ظ„ظٹ ط§ظ„ظ…ط´ظƒظ„ط© ط§ظ„ط­ط§ظ„ظٹط© ظˆط³ط£ط±طھط¨ ظ„ظƒ ط§ظ„ط­ظ„ ط®ط·ظˆط© ط¨ط®ط·ظˆط©." }
            ]
          },
          {
            id: "conv-4",
            title: "ط¨ط­ط« ظ‚ط§ظ†ظˆظ†ظٹ",
            preview: "ظ„ط®ظ‘طµ ظ„ظٹ ط§ظ„ظ†ظ‚ط§ط· ط§ظ„ظ‚ط§ظ†ظˆظ†ظٹط© ط§ظ„ط±ط¦ظٹط³ظٹط©",
            time: "ظ…ظ†ط° 3 ط£ظٹط§ظ…",
            messages: [
              { role: "assistant", text: "ط£ط³طھط·ظٹط¹ ط¥ط¹ط¯ط§ط¯ ظ…ظ„ط®طµ ظ…ط±ظƒط² ظˆظ…ظ†ط¸ظ… ظ„ظ„ظ†ظ‚ط§ط· ط§ظ„ط±ط¦ظٹط³ظٹط©." }
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
                <button class="workspace-secondary-btn" type="button" data-new-conversation>${icons.plus}ظ…ط­ط§ط¯ط«ط© ط¬ط¯ظٹط¯ط©</button>
              </div>
              <label class="workspace-mini-search">
                ${icons.search}
                <input data-page-search value="${escapeHtml(state.search)}" placeholder="ط§ط¨ط­ط« ظپظٹ ط§ظ„ظ…ط­ط§ط¯ط«ط§طھ">
              </label>
              <div class="conversation-list">
                ${list.map((item) => `
                  <button class="conversation-card ${item.id === active?.id ? "is-active" : ""}" type="button" data-conversation="${item.id}">
                    <strong>${escapeHtml(item.title)}</strong>
                    <span>${escapeHtml(item.preview)}</span>
                    <small>${escapeHtml(item.time)}</small>
                  </button>
                `).join("") || '<div class="empty-state">ظ„ط§ طھظˆط¬ط¯ ظ…ط­ط§ط¯ط«ط§طھ ظ…ط·ط§ط¨ظ‚ط© ط§ظ„ط¢ظ†.</div>'}
              </div>
            </section>
            <section class="workspace-panel chat-panel">
              <div class="chat-header-row">
                <div>
                  <strong>${escapeHtml(active?.title || "ظ…ط­ط§ط¯ط«ط© ط¬ط¯ظٹط¯ط©")}</strong>
                  <div class="muted-time">${escapeHtml(active?.time || "ط§ظ„ط¢ظ†")}</div>
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
                <input name="message" placeholder="ط§ظƒطھط¨ ط±ط³ط§ظ„طھظƒ ظ‡ظ†ط§..." autocomplete="off">
                <button class="chat-send-btn" type="submit" aria-label="ط¥ط±ط³ط§ظ„">${icons.send}</button>
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
          const title = window.prompt("ط§ط³ظ… ط§ظ„ظ…ط­ط§ط¯ط«ط© ط§ظ„ط¬ط¯ظٹط¯ط©", "ظ…ط­ط§ط¯ط«ط© ط¬ط¯ظٹط¯ط©");
          if (!title) return;
          const created = {
            id: makeId("conv"),
            title,
            preview: "ط§ط¨ط¯ط£ ظƒطھط§ط¨ط© ط³ط¤ط§ظ„ظƒ ط§ظ„ط¢ظ†",
            time: "ط§ظ„ط¢ظ†",
            messages: [{ role: "assistant", text: `طھظ… ط¥ظ†ط´ط§ط، "${title}" ط¨ظ†ط¬ط§ط­. ط§ط¨ط¯ط£ ط³ط¤ط§ظ„ظƒ ظˆط³ط£طھط§ط¨ط¹ ظ…ط¹ظƒ ظ‡ظ†ط§.` }]
          };
          setState({
            ...state,
            activeId: created.id,
            conversations: [created, ...state.conversations]
          });
          toast("طھظ… ط¥ظ†ط´ط§ط، ظ…ط­ط§ط¯ط«ط© ط¬ط¯ظٹط¯ط©.");
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
              time: "ط§ظ„ط¢ظ†",
              messages: [
                ...item.messages,
                { role: "user", text },
                { role: "assistant", text: `ظپظ‡ظ…طھ ط·ظ„ط¨ظƒ ط­ظˆظ„ "${text}". ط£ط³طھط·ظٹط¹ ط§ظ„ط¢ظ† طھط­ظˆظٹظ„ظ‡ ط¥ظ„ظ‰ ط®ط·ظˆط§طھ ظˆط§ط¶ط­ط© ط£ظˆ طھظ„ط®ظٹطµ ط£ظˆ ط¥ط¬ط§ط¨ط© ظ…ط¨ط§ط´ط±ط© ط­ط³ط¨ ظ…ط§ طھط±ظٹط¯.` }
              ]
            };
          });
          input.value = "";
          setState({ ...state, conversations: nextConversations });
        });
        $("[data-chat-info]", root)?.addEventListener("click", () => toast("ظ‡ط°ظ‡ ظ…ط­ط§ط¯ط«ط© طھظپط§ط¹ظ„ظٹط© ط¹ط§ظ…ط© ط¨ط¯ظˆظ† طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„."));
      }
    },
    projects: {
      title: "ط§ظ„ظ…ط´ط§ط±ظٹط¹",
      subtitle: "ظ†ط¸ظ‘ظ… ظ…ط´ط§ط±ظٹط¹ظƒ ظˆظ…ظ‡ط§ظ…ظƒ ظپظٹ ط¨ط·ط§ظ‚ط§طھ ظ…ط±ظ†ط© ظ…ط«ظ„ ط§ظ„ظ…ط±ط¬ط¹ طھظ…ط§ظ…ظ‹ط§.",
      searchPlaceholder: "ط§ط¨ط­ط« ظپظٹ ط§ظ„ظ…ط´ط§ط±ظٹط¹...",
      primaryLabel: "ظ…ط´ط±ظˆط¹ ط¬ط¯ظٹط¯",
      defaults: {
        search: "",
        projects: [
          { id: "project-1", title: "ظ…ط´ط±ظˆط¹ ط§ظ„طھط³ظˆظٹظ‚", updated: "طھط­ط¯ظٹط« ظ…ظ†ط° 2 ظٹظˆظ…", count: 12, icon: "rocket", tone: "purple" },
          { id: "project-2", title: "طھط­ظ„ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ", updated: "طھط­ط¯ظٹط« ظ…ظ†ط° 2 ظٹظˆظ…", count: 8, icon: "chart", tone: "blue" },
          { id: "project-3", title: "طھط·ظˆظٹط± ط§ظ„ظ…ظˆظ‚ط¹", updated: "طھط­ط¯ظٹط« ظ…ظ†ط° 4 ط£ظٹط§ظ…", count: 16, icon: "megaphone", tone: "mint" },
          { id: "project-4", title: "ط®ط·ط© ط§ظ„ظ…ط­طھظˆظ‰", updated: "طھط­ط¯ظٹط« ظ…ظ†ط° 2 ظٹظˆظ…", count: 9, icon: "file", tone: "purple" },
          { id: "project-5", title: "ط¨ط­ط« ط§ظ„ط³ظˆظ‚", updated: "طھط­ط¯ظٹط« ظ…ظ†ط° 2 ظٹظˆظ…", count: 9, icon: "users", tone: "orange" },
          { id: "project-6", title: "طھط·ط¨ظٹظ‚ ط§ظ„ط¬ظˆط§ظ„", updated: "طھط­ط¯ظٹط« ظ…ظ†ط° 4 ط£ظٹط§ظ…", count: 11, icon: "subjects", tone: "pink" }
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
            <button class="workspace-secondary-btn" type="button" data-new-project>${icons.plus}ظ…ط´ط±ظˆط¹ ط¬ط¯ظٹط¯</button>
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ط§ط¨ط­ط« ظپظٹ ط§ظ„ظ…ط´ط§ط±ظٹط¹">
            </label>
          </div>
          <div class="workspace-grid-3">
            ${list.map((item) => `
              <button class="project-card" type="button" data-project="${item.id}">
                <div class="card-icon ${item.tone}">${icons[item.icon]}</div>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.updated)}</span>
                <div class="card-stat">${item.count} ظ…ظ‡ظ…ط©</div>
              </button>
            `).join("") || '<div class="empty-state">ظ„ط§ طھظˆط¬ط¯ ظ…ط´ط§ط±ظٹط¹ ظ…ط·ط§ط¨ظ‚ط© ظ„ظ„ط¨ط­ط«.</div>'}
          </div>
        `;
      },
      bind(root, state, setState) {
        $("[data-new-project]", root)?.addEventListener("click", () => {
          const title = window.prompt("ط§ط³ظ… ط§ظ„ظ…ط´ط±ظˆط¹ ط§ظ„ط¬ط¯ظٹط¯", "ظ…ط´ط±ظˆط¹ ط¬ط¯ظٹط¯");
          if (!title) return;
          const project = {
            id: makeId("project"),
            title,
            updated: "طھط­ط¯ظٹط« ط§ظ„ط¢ظ†",
            count: 1,
            icon: "rocket",
            tone: "purple"
          };
          setState({ ...state, projects: [project, ...state.projects] });
          toast("طھظ…طھ ط¥ط¶ط§ظپط© ط§ظ„ظ…ط´ط±ظˆط¹ ط§ظ„ط¬ط¯ظٹط¯.");
        });
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $$("[data-project]", root).forEach((button) => {
          button.addEventListener("click", () => {
            const project = state.projects.find((item) => item.id === button.dataset.project);
            toast(`"${project?.title || "ط§ظ„ظ…ط´ط±ظˆط¹"}" ط¬ط§ظ‡ط² ط§ظ„ط¢ظ† ظ„ظ„ظ…طھط§ط¨ط¹ط©.`);
          });
        });
      }
    },
    library: {
      title: "ط§ظ„ظ…ظƒطھط¨ط©",
      subtitle: "ظ…ظ„ظپط§طھظƒ ظ…ط±طھط¨ط© ظˆظپظ„ط§طھط±ظ‡ط§ طھط¹ظ…ظ„طŒ ط¨ظ†ظپط³ ط£ط³ظ„ظˆط¨ ط§ظ„ظˆط§ط¬ظ‡ط© ط§ظ„ظ…ط±ط¬ط¹ظٹط©.",
      searchPlaceholder: "ط§ط¨ط­ط« ظپظٹ ط§ظ„ظ…ظƒطھط¨ط©...",
      primaryLabel: "ط±ظپط¹ ظ…ظ„ظپ",
      defaults: {
        search: "",
        filter: "ط§ظ„ظƒظ„",
        filters: ["ط§ظ„ظƒظ„", "ط±ط§ط¦ط¬ط©", "ظ…ظ„ظپط§طھ", "ظˆظˆط±ط¯", "ط¥ظƒط³ظ„", "ط¹ط±ظˆط¶ طھظ‚ط¯ظٹظ…ظٹط©"],
        files: [
          { id: "file-1", title: "ط¯ظ„ظٹظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…", type: "PDF", size: "2.4 MB", icon: "file", tone: "purple", category: "ظ…ظ„ظپط§طھ" },
          { id: "file-2", title: "ط§ط³طھط±ط§طھظٹط¬ظٹط© ط§ظ„طھط³ظˆظٹظ‚", type: "DOCX", size: "1.1 MB", icon: "notes", tone: "blue", category: "ظˆظˆط±ط¯" },
          { id: "file-3", title: "طھظ‚ط±ظٹط± ط§ظ„ظ…ط¨ظٹط¹ط§طھ", type: "XLSX", size: "850 KB", icon: "chart", tone: "mint", category: "ط¥ظƒط³ظ„" },
          { id: "file-4", title: "ط¹ط±ط¶ طھظ‚ط¯ظٹظ…ظٹ", type: "PPTX", size: "3.2 MB", icon: "subjects", tone: "orange", category: "ط¹ط±ظˆط¶ طھظ‚ط¯ظٹظ…ظٹط©" },
          { id: "file-5", title: "ط¨ط­ط« ط§ظ„ظ…ظ†ط§ظپط³ظٹظ†", type: "PDF", size: "1.7 MB", icon: "search", tone: "pink", category: "ظ…ظ„ظپط§طھ" },
          { id: "file-6", title: "ط®ط·ط© ط§ظ„ظ…ط´ط±ظˆط¹", type: "DOCX", size: "950 KB", icon: "projects", tone: "blue", category: "ظˆظˆط±ط¯" }
        ]
      },
      render(state) {
        const list = state.files.filter((item) => {
          const needle = state.search.trim().toLowerCase();
          const matchText = !needle || `${item.title} ${item.type}`.toLowerCase().includes(needle);
          const matchFilter = state.filter === "ط§ظ„ظƒظ„" || item.category === state.filter;
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
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ط§ط¨ط­ط« ظپظٹ ط§ظ„ظ…ظƒطھط¨ط©">
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
            `).join("") || '<div class="empty-state">ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ظپط§طھ ظ…ط·ط§ط¨ظ‚ط© ظ„ظ‡ط°ط§ ط§ظ„ظپظ„طھط±.</div>'}
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
          button.addEventListener("click", () => toast("ظٹظ…ظƒظ†ظƒ ظپطھط­ ط§ظ„ظ…ظ„ظپ ط£ظˆ ظ…ط´ط§ط±ظƒطھظ‡ ط£ظˆ ط­ظپط¸ظ‡ ظ„ظ„ظ…ط±ط§ط¬ط¹ط©."));
        });
      }
    },
    subjects: {
      title: "ط§ظ„ظ…ظˆط§ط¯ ط§ظ„ط¯ط±ط§ط³ظٹط©",
      subtitle: "ط¥ط­طµط§ط،ط§طھ ط³ط±ظٹط¹ط© ظˆطھظ‚ط¯ظ‘ظ… ظˆط§ط¶ط­ ظ„ظ„ظ…ظ‚ط±ط±ط§طھ ط§ظ„ط±ط¦ظٹط³ظٹط©.",
      searchPlaceholder: "ط§ط¨ط­ط« ط¹ظ† ظ…ط§ط¯ط© ط£ظˆ ظ…ظ‚ط±ط±...",
      primaryLabel: "ط§ط³طھط¹ط±ط§ط¶ ط§ظ„ظ…ظˆط§ط¯",
      defaults: {
        search: "",
        stats: [
          { value: "128", label: "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ظ‚ط±ط±ط§طھ" },
          { value: "64", label: "ط§ظ„ط¯ط±ظˆط³" },
          { value: "24", label: "ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ" },
          { value: "36h", label: "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھظ‚ط¯ظ…" }
        ],
        progress: [
          { title: "ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ ظ„ظ„ظ…ط¨طھط¯ط¦ظٹظ†", meta: "24 ط¯ط±ط³", percent: 75 },
          { title: "طھطµظ…ظٹظ… طھط¬ط±ط¨ط© ط§ظ„ظ…ط³طھط®ط¯ظ…", meta: "19 ط¯ط±ط³", percent: 60 },
          { title: "طھط­ظ„ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ", meta: "20 ط¯ط±ط³", percent: 90 },
          { title: "طھط·ظˆظٹط± طھط·ط¨ظٹظ‚ط§طھ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ", meta: "14 ط¯ط±ط³", percent: 30 }
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
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ط§ط¨ط­ط« ط¹ظ† ظ…ط§ط¯ط©">
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
            <strong class="subject-progress-title">ط§ظ„ظ…ظ‚ط±ط±ط§طھ</strong>
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
              `).join("") || '<div class="empty-state">ظ„ط§ طھظˆط¬ط¯ ظ…ظˆط§ط¯ ظ…ط·ط§ط¨ظ‚ط© ظ„ظ„ط¨ط­ط«.</div>'}
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
      title: "ط£ط¯ظˆط§طھ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ",
      subtitle: "ظ…ط¬ظ…ظˆط¹ط© ط£ط¯ظˆط§طھ ط¹ظ…ظ„ظٹط© ط¬ط§ظ‡ط²ط© ظ„ظ„ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظپظˆط±ظٹ.",
      searchPlaceholder: "ط§ط¨ط­ط« ط¹ظ† ط£ط¯ط§ط©...",
      primaryLabel: "طھط´ط؛ظٹظ„ ط£ط¯ط§ط©",
      defaults: {
        search: "",
        tools: [
          { id: "tool-1", title: "ظ…ط³ط§ط¹ط¯ ط§ظ„ظƒطھط§ط¨ط©", desc: "طµظٹط§ط؛ط© ط§ظ„ظ†طµظˆطµ ظˆط§ظ„ظ…ظ‚ط§ظ„ط§طھ ط¨ط§ط­طھط±ط§ظپظٹط©.", icon: "pencil", tone: "blue" },
          { id: "tool-2", title: "طھط­ظ„ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ", desc: "طھط­ظˆظٹظ„ ط§ظ„ط¬ط¯ط§ظˆظ„ ط¥ظ„ظ‰ ظ‚ط±ط§ط،ط§طھ ظˆط§ط¶ط­ط© ظˆط³ط±ظٹط¹ط©.", icon: "chart", tone: "purple" },
          { id: "tool-3", title: "طھظˆظ„ظٹط¯ ط§ظ„طµظˆط±", desc: "ط¥ظ†ط´ط§ط، طµظˆط± ظ…ط®طµطµط© ظ„ظ„ط£ظپظƒط§ط± ظˆط§ظ„ط¹ط±ظˆط¶.", icon: "image", tone: "orange" },
          { id: "tool-4", title: "طھظ„ط®ظٹطµ ط§ظ„ظ†طµظˆطµ", desc: "طھظ„ط®ظٹطµ ط·ظˆظٹظ„ ط£ظˆ ظ‚طµظٹط± ظ„ظ„ظ†طµظˆطµ ظˆط§ظ„ظ…ط³طھظ†ط¯ط§طھ.", icon: "file", tone: "blue" },
          { id: "tool-5", title: "طھط±ط¬ظ…ط© ط°ظƒظٹط©", desc: "طھط±ط¬ظ…ط© ط¯ظ‚ظٹظ‚ط© ط¨طµظٹط§ط؛ط© ط·ط¨ظٹط¹ظٹط© ظˆظˆط§ط¶ط­ط©.", icon: "globe", tone: "mint" },
          { id: "tool-6", title: "ظ…ط³ط§ط¹ط¯ ط§ظ„ط¨ط±ظ…ط¬ط©", desc: "ظ…ط³ط§ط¹ط¯ط© ظپظٹ ظƒطھط§ط¨ط© ط§ظ„ظƒظˆط¯ ظˆطھط­ط³ظٹظ†ظ‡.", icon: "spark", tone: "orange" }
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
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ط§ط¨ط­ط« ط¹ظ† ط£ط¯ط§ط©">
            </label>
          </div>
          <div class="workspace-grid-3">
            ${list.map((item) => `
              <article class="tool-card">
                <div class="card-icon ${item.tone}">${icons[item.icon]}</div>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.desc)}</p>
                <button class="workspace-secondary-btn tool-action" type="button" data-tool="${item.id}">ط§ط³طھط®ط¯ط§ظ…</button>
              </article>
            `).join("") || '<div class="empty-state">ظ„ط§ طھظˆط¬ط¯ ط£ط¯ظˆط§طھ ظ…ط·ط§ط¨ظ‚ط© ط§ظ„ط¢ظ†.</div>'}
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
            toast(`طھظ… طھط´ط؛ظٹظ„ "${tool?.title || "ط§ظ„ط£ط¯ط§ط©"}" ط¨ط´ظƒظ„ طھط¬ط±ظٹط¨ظٹ.`);
          });
        });
      }
    },
    notes: {
      title: "ط§ظ„ظ…ظ„ط§ط­ط¸ط§طھ",
      subtitle: "ظ…ظ„ط§ط­ط¸ط§طھ ط³ط±ظٹط¹ط© ظ…ظ†ط¸ظ…ط© ط¯ط§ط®ظ„ ظ‚ط§ط¦ظ…ط© ط­ظ‚ظٹظ‚ظٹط© ظ‚ط§ط¨ظ„ط© ظ„ظ„ط¥ط¶ط§ظپط© ظˆط§ظ„ظپطھط­.",
      searchPlaceholder: "ط§ط¨ط­ط« ظپظٹ ط§ظ„ظ…ظ„ط§ط­ط¸ط§طھ...",
      primaryLabel: "ظ…ظ„ط§ط­ط¸ط© ط¬ط¯ظٹط¯ط©",
      defaults: {
        search: "",
        notes: [
          { id: "note-1", title: "ط£ظپظƒط§ط± ط§ظ„ظ…ط´ط±ظˆط¹ ط§ظ„ط¬ط¯ظٹط¯", excerpt: "ظ…ظ„ط§ط­ط¸ط§طھ ط­ظˆظ„ طھط·ظˆظٹط± ط§ظ„ظ…ط´ط±ظˆط¹...", time: "ظ…ظ†ط° 5 ط¯ظ‚ط§ط¦ظ‚", tone: "green" },
          { id: "note-2", title: "ط§ط¬طھظ…ط§ط¹ ط§ظ„ظپط±ظٹظ‚", excerpt: "ظ…ظ„ط®طµ ط§ط¬طھظ…ط§ط¹ ط§ظ„ظٹظˆظ… ظ…ط¹ ط§ظ„ظپط±ظٹظ‚", time: "ظ…ظ†ط° 4 ط³ط§ط¹ط§طھ", tone: "blue" },
          { id: "note-3", title: "ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظ‡ط§ظ…", excerpt: "ط§ظ„ظ…ظ‡ط§ظ… ط§ظ„ظ…ط·ظ„ظˆط¨ط© ظ„ط¥ظ†ط¬ط§ط²ظ‡ط§ ظ‡ط°ط§ ط§ظ„ط£ط³ط¨ظˆط¹", time: "ظ…ظ†ط° 1 ظٹظˆظ…", tone: "red" },
          { id: "note-4", title: "ط£ظپظƒط§ط± ط§ظ„ظ…ط­طھظˆظ‰", excerpt: "ط£ظپظƒط§ط± ظ„ظ…ط­طھظˆظ‰ ظˆط³ط§ط¦ظ„ ط§ظ„طھظˆط§طµظ„ ط§ظ„ط§ط¬طھظ…ط§ط¹ظٹ", time: "ظ…ظ†ط° 3 ط£ظٹط§ظ…", tone: "purple" }
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
            <button class="workspace-secondary-btn" type="button" data-new-note>${icons.plus}ظ…ظ„ط§ط­ط¸ط© ط¬ط¯ظٹط¯ط©</button>
            <label class="workspace-mini-search">
              ${icons.search}
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ط§ط¨ط­ط« ظپظٹ ط§ظ„ظ…ظ„ط§ط­ط¸ط§طھ">
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
            `).join("") || '<div class="empty-state">ظ„ط§ طھظˆط¬ط¯ ظ…ظ„ط§ط­ط¸ط§طھ ظ…ط·ط§ط¨ظ‚ط© ط§ظ„ط¢ظ†.</div>'}
          </section>
        `;
      },
      bind(root, state, setState) {
        $("[data-new-note]", root)?.addEventListener("click", () => {
          const title = window.prompt("ط¹ظ†ظˆط§ظ† ط§ظ„ظ…ظ„ط§ط­ط¸ط©", "ظ…ظ„ط§ط­ط¸ط© ط¬ط¯ظٹط¯ط©");
          if (!title) return;
          const note = {
            id: makeId("note"),
            title,
            excerpt: "ط§ظƒطھط¨ طھظپط§طµظٹظ„ ط§ظ„ظ…ظ„ط§ط­ط¸ط© ظ‡ظ†ط§...",
            time: "ط§ظ„ط¢ظ†",
            tone: "purple"
          };
          setState({ ...state, notes: [note, ...state.notes] });
          toast("طھظ… ط¥ظ†ط´ط§ط، ظ…ظ„ط§ط­ط¸ط© ط¬ط¯ظٹط¯ط©.");
        });
        $("[data-page-search]", root)?.addEventListener("input", (event) => {
          setState({ ...state, search: event.target.value }, false);
        });
        $$("[data-note]", root).forEach((button) => {
          button.addEventListener("click", () => {
            const note = state.notes.find((item) => item.id === button.dataset.note);
            toast(`ظپطھط­طھ "${note?.title || "ط§ظ„ظ…ظ„ط§ط­ط¸ط©"}" ط¨ظ†ط¬ط§ط­.`);
          });
        });
      }
    },
    tests: {
      title: "ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ",
      subtitle: "ظ…ط¤ط´ط±ط§طھ ظˆظ†طھط§ط¦ط¬ ظˆط§ط®طھط¨ط§ط±ط§طھ ط¬ط§ظ‡ط²ط© ظ„ظ„ظ…طھط§ط¨ط¹ط© ط§ظ„ظپظˆط±ظٹط©.",
      searchPlaceholder: "ط§ط¨ط­ط« ط¹ظ† ط§ط®طھط¨ط§ط±...",
      primaryLabel: "ط§ط®طھط¨ط§ط± ط¬ط¯ظٹط¯",
      defaults: {
        search: "",
        metrics: [
          { value: "24", label: "ط§ط®طھط¨ط§ط± ط¬ط¯ظٹط¯" },
          { value: "18", label: "ظ…ظپطھظˆط­ط©" },
          { value: "85%", label: "ظ…طھظˆط³ط· ط§ظ„ظ†طھظٹط¬ط©" },
          { value: "98%", label: "ط£ظپط¶ظ„ ظ†طھظٹط¬ط©" }
        ],
        tests: [
          { id: "test-1", title: "ط§ط®طھط¨ط§ط± ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ", score: "95%", time: "ظ…ظ†ط° 2 ظٹظˆظ…" },
          { id: "test-2", title: "ط§ط®طھط¨ط§ط± طھط­ظ„ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ", score: "88%", time: "ظ…ظ†ط° 3 ظٹظˆظ…" },
          { id: "test-3", title: "ط§ط®طھط¨ط§ط± طھط¹ظ„ظ… ط§ظ„ط¢ظ„ط©", score: "92%", time: "ظ…ظ†ط° 5 ظٹظˆظ…" },
          { id: "test-4", title: "ط§ط®طھط¨ط§ط± ط§ظ„ط±ظٹط§ط¶ظٹط§طھ", score: "75%", time: "ظ…ظ†ط° ط£ط³ط¨ظˆط¹" }
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
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ط§ط¨ط­ط« ط¹ظ† ط§ط®طھط¨ط§ط±">
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
                  <button class="workspace-inline-btn" type="button" data-start-test="${item.id}">ط¹ط±ط¶ ط§ظ„ظ†طھظٹط¬ط©</button>
                </div>
              `).join("") || '<div class="empty-state">ظ„ط§ طھظˆط¬ط¯ ط§ط®طھط¨ط§ط±ط§طھ ظ…ط·ط§ط¨ظ‚ط© ط§ظ„ط¢ظ†.</div>'}
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
            toast(`طھظ… ظپطھط­ ظ†طھظٹط¬ط© "${test?.title || "ط§ظ„ط§ط®طھط¨ط§ط±"}".`);
          });
        });
      }
    },
    settings: {
      title: "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ",
      subtitle: "ط¨ط·ط§ظ‚ط§طھ ط¥ط¹ط¯ط§ط¯ط§طھ ظپط¹ظ„ظٹط© ظ…ط¹ ظ…ظ†ط·ظ‚ط© طھظپط§طµظٹظ„ ظ‚ط§ط¨ظ„ط© ظ„ظ„طھط¨ط¯ظٹظ„.",
      searchPlaceholder: "ط§ط¨ط­ط« ظپظٹ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ...",
      primaryLabel: "طھط®طµظٹطµ ط³ط±ظٹط¹",
      defaults: {
        search: "",
        active: "profile",
        settings: [
          { id: "profile", title: "ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ", desc: "ط¥ط¯ط§ط±ط© ظ…ط¹ظ„ظˆظ…ط§طھظƒ ط§ظ„ط´ط®طµظٹط©", icon: "users", tone: "purple", detail: "ظٹظ…ظƒظ†ظƒ ظ‡ظ†ط§ طھط¹ط¯ظٹظ„ ط§ظ„ط§ط³ظ…طŒ ط§ظ„طµظˆط±ط©طŒ ظˆط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط© ط§ظ„ط®ط§طµط© ط¨ط­ط³ط§ط¨ظƒ." },
          { id: "security", title: "ط§ظ„ط£ظ…ط§ظ† ظˆط§ظ„ط®طµظˆطµظٹط©", desc: "ط¥ط¯ط§ط±ط© ط§ظ„ط£ظ…ط§ظ† ظˆط§ظ„ط®طµظˆطµظٹط©", icon: "shield", tone: "mint", detail: "ط§ط¶ط¨ط· ط§ظ„ط­ظ…ط§ظٹط© ظˆطھط­ظ‚ظ‚ ظ…ظ† ط®ظٹط§ط±ط§طھ ط§ظ„ط£ظ…ط§ظ† ظˆط§ظ„ط®طµظˆطµظٹط© ط§ظ„ظ…ط±طھط¨ط·ط© ط¨ط§ظ„ط­ط³ط§ط¨." },
          { id: "alerts", title: "ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ", desc: "ط¥ط¯ط§ط±ط© ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ظˆط§ظ„طھظ†ط¨ظٹظ‡ط§طھ", icon: "bell", tone: "orange", detail: "ط®طµطµ ط±ط³ط§ط¦ظ„ ط§ظ„طھظ†ط¨ظٹظ‡طŒ ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ ط§ظ„ط°ظƒظٹط©طŒ ظˆظ‚ظ†ظˆط§طھ ط§ظ„ط¥ط´ط¹ط§ط± ط§ظ„ظ…ظپط¶ظ„ط© ظ„ط¯ظٹظƒ." },
          { id: "appearance", title: "ط§ظ„ظ…ط¸ظ‡ط±", desc: "طھط®طµظٹطµ ظ…ط¸ظ‡ط± ط§ظ„طھط·ط¨ظٹظ‚", icon: "spark", tone: "pink", detail: "ط¨ط¯ظ‘ظ„ ط¨ظٹظ† ط£ظ†ظ…ط§ط· ط§ظ„ظˆط§ط¬ظ‡ط© ظˆظ†ط¸ظ… ط¹ط±ط¶ ط§ظ„ط¹ظ†ط§طµط± ظ„طھظ„ط§ط¦ظ… ط§ط³طھط®ط¯ط§ظ…ظƒ ط§ظ„ظٹظˆظ…ظٹ." },
          { id: "language", title: "ط§ظ„ظ„ط؛ط© ظˆط§ظ„ظ…ظ†ط·ظ‚ط©", desc: "ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ„ط؛ط© ظˆط§ظ„ظ…ظ†ط·ظ‚ط©", icon: "globe", tone: "blue", detail: "ط§ط®طھط± ط§ظ„ظ„ط؛ط©طŒ ط§ظ„ظ…ظ†ط·ظ‚ط© ط§ظ„ط²ظ…ظ†ظٹط©طŒ ظˆط·ط±ظٹظ‚ط© ط¹ط±ط¶ ط§ظ„طھظ†ط³ظٹظ‚ط§طھ ط¯ط§ط®ظ„ ط§ظ„ظ…ظ†طµط©." },
          { id: "integrations", title: "ط§ظ„طھظƒط§ظ…ظ„ط§طھ", desc: "ط¥ط¯ط§ط±ط© ط§ظ„طھط·ط¨ظٹظ‚ط§طھ ط§ظ„ظ…طھطµظ„ط©", icon: "projects", tone: "purple", detail: "ط§ط³طھط¹ط±ط¶ ط§ظ„طھظƒط§ظ…ظ„ط§طھ ط§ظ„ظ†ط´ط·ط© ظˆط§ط±ط¨ط· ط§ظ„ط®ط¯ظ…ط§طھ ط§ظ„ط®ط§ط±ط¬ظٹط© ط§ظ„طھظٹ طھط­طھط§ط¬ظ‡ط§." }
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
              <input data-page-search value="${escapeHtml(state.search)}" placeholder="ط§ط¨ط­ط« ظپظٹ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ">
            </label>
          </div>
          <div class="workspace-grid-settings">
            ${list.map((item) => `
              <button class="setting-card" type="button" data-setting="${item.id}">
                <div class="card-icon ${item.tone}">${icons[item.icon]}</div>
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.desc)}</span>
              </button>
            `).join("") || '<div class="empty-state">ظ„ط§ طھظˆط¬ط¯ ط¥ط¹ط¯ط§ط¯ط§طھ ظ…ط·ط§ط¨ظ‚ط© ط§ظ„ط¢ظ†.</div>'}
          </div>
          <section class="workspace-panel settings-detail">
            <strong>${escapeHtml(active?.title || "ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ")}</strong>
            <p>${escapeHtml(active?.detail || "ط§ط®طھط± ط¥ط­ط¯ظ‰ ط§ظ„ط¨ط·ط§ظ‚ط§طھ ظ„ط¹ط±ط¶ ط§ظ„طھظپط§طµظٹظ„ ظ‡ظ†ط§.")}</p>
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
        <aside class="workspace-sidebar" aria-label="ط§ظ„طھظ†ظ‚ظ„">
          <a class="workspace-brand" href="index.html" aria-label="Orlixor">
            <img src="orlixor-brand.png" alt="Orlixor">
          </a>
          <button class="workspace-primary-btn" type="button" data-primary-action>
            ${icons.plus}
            طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„
          </button>
          <nav class="workspace-nav">${renderSidebarNav()}</nav>
          <div class="workspace-sidebar-foot">
            <div class="workspace-user-card">
              <div class="workspace-user-avatar">${icons.spark}</div>
              <div class="workspace-user-copy">
                <strong>ط¶ظٹظپ ظ…ظ…ظٹط²</strong>
                <span>ظ†ط³ط®ط© ط§ط³طھط¹ط±ط§ط¶ ط¹ط§ظ…ط©</span>
              </div>
            </div>
          </div>
        </aside>
        <section class="workspace-main">
          <header class="workspace-topbar">
            <div class="workspace-topbar-meta">ظ†ط³ط®ط© ط§ط³طھط¹ط±ط§ط¶ ط¹ط§ظ…ط©</div>
            <div class="workspace-topbar-actions">
              <label class="workspace-search">
                <span class="workspace-chip">âŒک K</span>
                <input data-global-search value="${escapeHtml(state.search || "")}" placeholder="${escapeHtml(pageConfig.searchPlaceholder)}">
                ${icons.search}
              </label>
              <button class="workspace-icon-btn" type="button" aria-label="ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ">${icons.bell}</button>
              <button class="workspace-icon-btn" type="button" aria-label="ط§ظ„ظ…ظ„ظپ ط§ظ„ط´ط®طµظٹ">${icons.users}</button>
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
