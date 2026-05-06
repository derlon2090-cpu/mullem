(() => {
  const api = window.mullemApiClient;
  const state = {
    admin: null,
    stats: {},
    users: [],
    plans: [],
    subscriptions: [],
    xpLedger: [],
    logs: [],
    tab: "dashboard"
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const nodes = {
    loginView: $("[data-admin-login-view]"),
    app: $("[data-admin-app]"),
    loginForm: $("[data-admin-login-form]"),
    email: $("[data-admin-email]"),
    password: $("[data-admin-password]"),
    loginState: $("[data-admin-login-state]"),
    logout: $("[data-admin-logout]"),
    stats: $("[data-admin-stats]"),
    usersTable: $("[data-users-table]"),
    userSearch: $("[data-user-search]"),
    userStatus: $("[data-user-status]"),
    plansList: $("[data-plans-list]"),
    assignForm: $("[data-assign-plan-form]"),
    assignUser: $("[data-assign-user]"),
    assignPlan: $("[data-assign-plan]"),
    assignDays: $("[data-assign-days]"),
    assignEmail: $("[data-assign-email]"),
    subscriptionsTable: $("[data-subscriptions-table]"),
    paymentsTable: $("[data-payments-table]"),
    transactionsTable: $("[data-transactions-table]"),
    xpForm: $("[data-xp-form]"),
    xpUser: $("[data-xp-user]"),
    xpAmount: $("[data-xp-amount]"),
    xpReason: $("[data-xp-reason]"),
    xpLedgerTable: $("[data-xp-ledger-table]"),
    logsTable: $("[data-admin-logs-table]"),
    toolsGrid: $("[data-tools-grid]"),
    messagesGrid: $("[data-messages-grid]"),
    settingsGrid: $("[data-settings-grid]"),
    planDonut: $("[data-plan-donut]"),
    totalUsers: $("[data-total-users]"),
    planLegend: $("[data-plan-legend]"),
    xpChart: $("[data-xp-chart]"),
    recentOperations: $("[data-recent-operations]"),
    topUsers: $("[data-top-users]"),
    recentSubscriptions: $("[data-recent-subscriptions]"),
    adminName: $("[data-admin-name]"),
    adminRole: $("[data-admin-role]"),
    adminNameSide: $("[data-admin-name-side]"),
    adminRoleSide: $("[data-admin-role-side]"),
    avatar: $("[data-admin-avatar]"),
    avatarLarge: $("[data-admin-avatar-large]")
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString("en-US");
  const formatMoney = (value) => `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function isAdminRole(user) {
    const role = String(user?.role || "").toLowerCase();
    return role.includes("admin");
  }

  function setLoginVisible(visible) {
    if (nodes.loginView) nodes.loginView.hidden = !visible;
    if (nodes.app) nodes.app.hidden = visible;
  }

  function setAdminIdentity(user) {
    state.admin = user || state.admin;
    const name = state.admin?.name || "أحمد السبيعي";
    const role = String(state.admin?.role || "Super Admin");
    const initial = name.trim().slice(0, 1) || "أ";
    [nodes.adminName, nodes.adminNameSide].forEach((node) => {
      if (node) node.textContent = name;
    });
    [nodes.adminRole, nodes.adminRoleSide].forEach((node) => {
      if (node) node.textContent = role;
    });
    [nodes.avatar, nodes.avatarLarge].forEach((node) => {
      if (node) node.textContent = initial;
    });
  }

  async function ensureAdminSession() {
    if (!api?.hasToken?.()) {
      setLoginVisible(true);
      return false;
    }

    const result = await api.me();
    if (!result.ok || !isAdminRole(result.data?.user)) {
      api.clearSession?.();
      setLoginVisible(true);
      return false;
    }

    setAdminIdentity(result.data.user);
    setLoginVisible(false);
    return true;
  }

  async function loadAdminData() {
    const [stats, users, plans, subscriptions, xpLedger, logs] = await Promise.all([
      api.getAdminStats(),
      api.getAdminUsers({ per_page: 200 }),
      api.getAdminPackages(),
      api.getAdminSubscriptions?.({ limit: 120 }) || api.request("/admin/subscriptions"),
      api.getAdminXpLedger?.({ limit: 140 }) || api.request("/admin/xp-ledger"),
      api.getAdminLogs?.({ limit: 140 }) || api.request("/admin/logs")
    ]);

    if (stats.ok) {
      state.stats = stats.data?.stats || {};
      setAdminIdentity(stats.data?.admin || state.admin);
    }
    if (users.ok) state.users = Array.isArray(users.data?.items) ? users.data.items : [];
    if (plans.ok) state.plans = Array.isArray(plans.data?.items) ? plans.data.items : [];
    if (subscriptions.ok) state.subscriptions = Array.isArray(subscriptions.data?.items) ? subscriptions.data.items : [];
    if (xpLedger.ok) state.xpLedger = Array.isArray(xpLedger.data?.items) ? xpLedger.data.items : [];
    if (logs.ok) state.logs = Array.isArray(logs.data?.items) ? logs.data.items : [];

    renderAll();
  }

  function renderStats() {
    if (!nodes.stats) return;
    const stats = state.stats || {};
    const cards = [
      { label: "إجمالي الإيرادات", value: formatMoney(stats.revenue_total ?? stats.revenue ?? 0), delta: "+12.5%", icon: "$" },
      { label: "إجمالي XP المستخدم", value: formatNumber(stats.xp_used_total ?? 0), delta: "+8.7%", icon: "ϟ" },
      { label: "إجمالي المستخدمين", value: formatNumber(stats.users_count ?? state.users.length), delta: "+10.2%", icon: "👥" },
      { label: "المشتركين النشطين", value: formatNumber(stats.active_subscriptions_count ?? state.subscriptions.filter((item) => item.status === "active").length), delta: "+9.3%", icon: "♕", warm: true },
      { label: "طلبات اليوم", value: formatNumber(stats.today_requests_count ?? 0), delta: "+15.1%", icon: "▤" }
    ];

    nodes.stats.innerHTML = cards.map((card) => `
      <article class="admin-kpi-card ${card.warm ? "is-warm" : ""}">
        <span class="admin-kpi-icon">${card.icon}</span>
        <span>${card.label}</span>
        <strong>${card.value}</strong>
        <small>${card.delta} من الفترة السابقة</small>
        <i></i>
      </article>
    `).join("");
  }

  function getPlanName(user) {
    return user.package || user.packageName || user.package_name || user.planType || user.plan_type || "المجانية";
  }

  function renderDistribution() {
    const counts = state.users.reduce((result, user) => {
      const plan = getPlanName(user);
      result[plan] = (result[plan] || 0) + 1;
      return result;
    }, {});
    const entries = Object.entries(counts);
    const total = entries.reduce((sum, item) => sum + item[1], 0) || 1;
    const colors = ["#6d4bff", "#12b3ff", "#13c783", "#ff6b57", "#ff9f2e"];
    let cursor = 0;
    const gradient = entries.map(([_, count], index) => {
      const start = cursor;
      const end = cursor + (count / total) * 360;
      cursor = end;
      return `${colors[index % colors.length]} ${start}deg ${end}deg`;
    }).join(", ");
    if (nodes.planDonut) nodes.planDonut.style.background = `conic-gradient(${gradient || "#edeafe 0deg 360deg"})`;
    if (nodes.totalUsers) nodes.totalUsers.textContent = formatNumber(total);
    if (nodes.planLegend) {
      nodes.planLegend.innerHTML = entries.map(([plan, count], index) => `
        <div><span style="background:${colors[index % colors.length]}"></span><strong>${escapeHtml(plan)}</strong><small>${formatNumber(count)} (${Math.round((count / total) * 100)}%)</small></div>
      `).join("");
    }
  }

  function renderXpChart() {
    if (!nodes.xpChart) return;
    const values = state.xpLedger
      .slice(0, 10)
      .reverse()
      .map((entry) => Math.abs(Number(entry.amount || 0)));
    const series = values.length ? values : [8, 12, 18, 22, 36, 40, 60, 48, 56, 73];
    const max = Math.max(...series, 1);
    const points = series.map((value, index) => {
      const x = 20 + index * (320 / Math.max(1, series.length - 1));
      const y = 180 - (value / max) * 150;
      return `${x},${y}`;
    }).join(" ");
    nodes.xpChart.innerHTML = `
      <svg viewBox="0 0 380 210" role="img" aria-label="استهلاك XP">
        <defs><linearGradient id="xpFill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#6d4bff" stop-opacity=".34"/><stop offset="1" stop-color="#6d4bff" stop-opacity="0"/></linearGradient></defs>
        <g class="grid">${[40, 80, 120, 160].map((y) => `<line x1="20" x2="360" y1="${y}" y2="${y}"></line>`).join("")}</g>
        <polyline class="area" points="20,190 ${points} 360,190"></polyline>
        <polyline class="line" points="${points}"></polyline>
        ${points.split(" ").map((point) => {
          const [x, y] = point.split(",");
          return `<circle cx="${x}" cy="${y}" r="4"></circle>`;
        }).join("")}
      </svg>
    `;
  }

  function renderRecentOperations() {
    if (!nodes.recentOperations) return;
    const items = state.logs.length ? state.logs : state.xpLedger;
    nodes.recentOperations.innerHTML = items.slice(0, 6).map((item) => `
      <div class="admin-operation-item">
        <div>
          <strong>${escapeHtml(item.action || item.type || "عملية")}</strong>
          <span>${escapeHtml(item.admin_name || item.user_name || item.reason || "Orlixor")}</span>
        </div>
        <small>تمت</small>
      </div>
    `).join("") || `<div class="admin-empty-panel">لا توجد عمليات بعد.</div>`;
  }

  function renderTables() {
    renderUsers();
    renderPlans();
    renderSubscriptions();
    renderXpLedger();
    renderLogs();
    renderDashboardTables();
    renderTools();
    renderSettings();
  }

  function filteredUsers() {
    const term = String(nodes.userSearch?.value || "").trim().toLowerCase();
    const status = String(nodes.userStatus?.value || "").trim().toLowerCase();
    return state.users.filter((user) => {
      const haystack = [user.name, user.email, getPlanName(user)].join(" ").toLowerCase();
      if (term && !haystack.includes(term)) return false;
      if (status && String(user.status || "").toLowerCase() !== status) return false;
      return true;
    });
  }

  function renderUsers() {
    if (!nodes.usersTable) return;
    const users = filteredUsers();
    nodes.usersTable.innerHTML = `
      <table class="admin-data-table">
        <thead><tr><th>المستخدم</th><th>الباقة</th><th>XP</th><th>الحالة</th><th>إجراءات</th></tr></thead>
        <tbody>
          ${users.map((user) => `
            <tr>
              <td><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.email)}</span></td>
              <td>${escapeHtml(getPlanName(user))}</td>
              <td>${formatNumber(user.xp)}</td>
              <td><mark class="admin-state">${escapeHtml(user.status || "active")}</mark></td>
              <td class="admin-row-actions">
                <button type="button" data-toggle-user="${escapeHtml(user.id)}">${String(user.status || "").toLowerCase() === "active" ? "تعطيل" : "تفعيل"}</button>
                <button type="button" data-user-add-xp="${escapeHtml(user.id)}">+ XP</button>
                <button type="button" data-user-remove-xp="${escapeHtml(user.id)}">- XP</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    renderUserSelects();
  }

  function renderPlans() {
    if (!nodes.plansList) return;
    nodes.plansList.innerHTML = state.plans.map((plan) => `
      <article class="admin-plan-card" data-plan-id="${escapeHtml(plan.id)}">
        <div>
          <strong>${escapeHtml(plan.name)}</strong>
          <span>${escapeHtml(plan.key)} · ${formatNumber(plan.daily_xp)} XP يوميًا</span>
        </div>
        <label>السعر<input class="field" type="number" min="0" step="1" value="${escapeHtml(plan.price_sar)}" data-plan-price></label>
        <label>XP اليومي<input class="field" type="number" min="0" step="1" value="${escapeHtml(plan.daily_xp)}" data-plan-xp></label>
        <label>المميزات<textarea class="field" data-plan-benefits>${escapeHtml((plan.benefits || []).join("\n"))}</textarea></label>
        <button class="primary-btn" type="button" data-save-plan="${escapeHtml(plan.id)}">حفظ الباقة</button>
      </article>
    `).join("");
  }

  function renderSubscriptions() {
    const rows = state.subscriptions;
    const table = `
      <table class="admin-data-table">
        <thead><tr><th>المستخدم</th><th>الباقة</th><th>المبلغ</th><th>الحالة</th><th>الانتهاء</th></tr></thead>
        <tbody>${rows.map((item) => `
          <tr><td><strong>${escapeHtml(item.user_name || "")}</strong><span>${escapeHtml(item.user_email || "")}</span></td><td>${escapeHtml(item.package_name || item.plan_key || item.package_key || "")}</td><td>${formatMoney(item.price_sar || 0)}</td><td><mark class="admin-state">${escapeHtml(item.status || "")}</mark></td><td>${escapeHtml(String(item.expires_at || "").slice(0, 10))}</td></tr>
        `).join("")}</tbody>
      </table>
    `;
    if (nodes.subscriptionsTable) nodes.subscriptionsTable.innerHTML = table;
    if (nodes.paymentsTable) nodes.paymentsTable.innerHTML = table;
  }

  function renderXpLedger() {
    const table = `
      <table class="admin-data-table">
        <thead><tr><th>المستخدم</th><th>الكمية</th><th>النوع</th><th>السبب</th><th>الأدمن</th></tr></thead>
        <tbody>${state.xpLedger.map((item) => `
          <tr><td><strong>${escapeHtml(item.user_name || "")}</strong><span>${escapeHtml(item.user_email || "")}</span></td><td>${formatNumber(item.amount)}</td><td>${escapeHtml(item.type)}</td><td>${escapeHtml(item.reason || "")}</td><td>${escapeHtml(item.admin_name || "")}</td></tr>
        `).join("")}</tbody>
      </table>
    `;
    if (nodes.xpLedgerTable) nodes.xpLedgerTable.innerHTML = table;
    if (nodes.transactionsTable) nodes.transactionsTable.innerHTML = table;
  }

  function renderLogs() {
    if (!nodes.logsTable) return;
    nodes.logsTable.innerHTML = `
      <table class="admin-data-table">
        <thead><tr><th>الأدمن</th><th>الإجراء</th><th>الهدف</th><th>IP</th><th>الوقت</th></tr></thead>
        <tbody>${state.logs.map((item) => `
          <tr><td><strong>${escapeHtml(item.admin_name || "")}</strong><span>${escapeHtml(item.admin_email || "")}</span></td><td>${escapeHtml(item.action)}</td><td>${escapeHtml(item.target_type || "")} #${escapeHtml(item.target_id || "")}</td><td>${escapeHtml(item.ip_address || "")}</td><td>${escapeHtml(String(item.created_at || "").slice(0, 19).replace("T", " "))}</td></tr>
        `).join("")}</tbody>
      </table>
    `;
  }

  function renderDashboardTables() {
    if (nodes.topUsers) {
      const top = [...state.users].sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0)).slice(0, 6);
      nodes.topUsers.innerHTML = `<table class="admin-data-table compact"><tbody>${top.map((user) => `<tr><td><strong>${escapeHtml(user.name)}</strong></td><td>${escapeHtml(getPlanName(user))}</td><td>${formatNumber(user.xp)}</td></tr>`).join("")}</tbody></table>`;
    }
    if (nodes.recentSubscriptions) {
      nodes.recentSubscriptions.innerHTML = `<table class="admin-data-table compact"><tbody>${state.subscriptions.slice(0, 6).map((item) => `<tr><td><strong>${escapeHtml(item.user_name || "")}</strong></td><td>${escapeHtml(item.package_name || "")}</td><td>${formatMoney(item.price_sar || 0)}</td><td><mark class="admin-state">${escapeHtml(item.status || "")}</mark></td></tr>`).join("")}</tbody></table>`;
    }
  }

  function renderUserSelects() {
    const options = state.users.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} · ${escapeHtml(user.email)}</option>`).join("");
    [nodes.assignUser, nodes.xpUser].forEach((node) => {
      if (node) node.innerHTML = options;
    });
    if (nodes.assignPlan) {
      nodes.assignPlan.innerHTML = state.plans.map((plan) => `<option value="${escapeHtml(plan.key)}">${escapeHtml(plan.name)} · ${formatNumber(plan.daily_xp)} XP</option>`).join("");
    }
  }

  function renderTools() {
    if (nodes.toolsGrid) {
      const tools = ["البحث الذكي", "مساعد الكتابة", "تلخيص المحتوى", "استخراج البيانات", "تحسين الصور", "PDF إلى PNG", "PNG إلى PDF", "OCR"];
      nodes.toolsGrid.innerHTML = tools.map((tool, index) => `
        <article class="admin-tool-card"><strong>${tool}</strong><span>${index < 4 ? "مجاني" : "للمشتركين"}</span><label><input type="checkbox" checked> مفعلة</label></article>
      `).join("");
    }
  }

  function renderSettings() {
    const settings = [
      ["إعدادات البريد", "قوالب تفعيل الباقات والتنبيهات"],
      ["إعدادات XP", "التجديد اليومي والحدود المالية"],
      ["إعدادات الموقع", "الظهور والهوية العامة"],
      ["إعدادات الصلاحيات", "admin و super_admin"]
    ];
    const html = settings.map(([title, text]) => `<article class="admin-setting-card"><strong>${title}</strong><span>${text}</span><button type="button">فتح</button></article>`).join("");
    if (nodes.settingsGrid) nodes.settingsGrid.innerHTML = html;
    if (nodes.messagesGrid) nodes.messagesGrid.innerHTML = html;
  }

  function renderAll() {
    renderStats();
    renderDistribution();
    renderXpChart();
    renderRecentOperations();
    renderTables();
  }

  function setTab(tab) {
    const safeTab = tab || "dashboard";
    state.tab = safeTab;
    $$("[data-admin-tab]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.adminTab === safeTab);
    });
    $$("[data-admin-panel]").forEach((panel) => {
      const active = panel.dataset.adminPanel === safeTab;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
  }

  async function savePlan(button) {
    const card = button.closest("[data-plan-id]");
    const id = card?.dataset.planId;
    if (!id) return;
    const payload = {
      price_sar: Number(card.querySelector("[data-plan-price]")?.value || 0),
      daily_xp: Number(card.querySelector("[data-plan-xp]")?.value || 0),
      benefits: String(card.querySelector("[data-plan-benefits]")?.value || "").split(/\r?\n+/).map((item) => item.trim()).filter(Boolean)
    };
    const result = await api.updateAdminPackage(id, payload);
    if (!result.ok) {
      window.alert(result.message || "تعذر حفظ الباقة.");
      return;
    }
    await loadAdminData();
  }

  async function toggleUser(userId) {
    const user = state.users.find((item) => String(item.id) === String(userId));
    if (!user) return;
    const nextStatus = String(user.status || "").toLowerCase() === "active" ? "suspended" : "active";
    const result = await api.updateAdminUser(userId, {
      status: nextStatus,
      activity: nextStatus === "active" ? "تم تفعيل الحساب من لوحة الأدمن" : "تم تعطيل الحساب من لوحة الأدمن"
    });
    if (!result.ok) window.alert(result.message || "تعذر تحديث المستخدم.");
    await loadAdminData();
  }

  async function quickXp(userId, action) {
    const amount = Number(window.prompt("كمية XP؟", "50") || 0);
    if (!amount) return;
    const reason = window.prompt("سبب العملية؟", action === "remove" ? "خصم يدوي من الأدمن" : "إضافة يدوية من الأدمن") || "";
    const method = action === "remove" ? api.removeAdminUserXp : api.addAdminUserXp;
    const result = await method(userId, { amount, reason });
    if (!result.ok) window.alert(result.message || "تعذر تعديل XP.");
    await loadAdminData();
  }

  nodes.loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!api) {
      if (nodes.loginState) nodes.loginState.textContent = "تعذر تحميل API.";
      return;
    }
    if (nodes.loginState) nodes.loginState.textContent = "جار التحقق من السيرفر...";
    const result = await api.login({
      email: nodes.email?.value || "",
      password: nodes.password?.value || "",
      device_name: "orlixor-admin-dashboard"
    });
    if (!result.ok || !isAdminRole(result.data?.user)) {
      api.clearSession?.();
      if (nodes.loginState) nodes.loginState.textContent = result.message || "غير مصرح لك بالدخول.";
      return;
    }
    setAdminIdentity(result.data.user);
    setLoginVisible(false);
    await loadAdminData();
  });

  nodes.logout?.addEventListener("click", async () => {
    try {
      if (api?.adminLogout) await api.adminLogout();
      else await api?.logout?.();
    } finally {
      api?.clearSession?.();
      setLoginVisible(true);
    }
  });

  document.addEventListener("click", async (event) => {
    const tabButton = event.target.closest("[data-admin-tab]");
    if (tabButton) {
      setTab(tabButton.dataset.adminTab);
      return;
    }
    const jumpButton = event.target.closest("[data-jump-tab]");
    if (jumpButton) {
      setTab(jumpButton.dataset.jumpTab);
      return;
    }
    const saveButton = event.target.closest("[data-save-plan]");
    if (saveButton) {
      await savePlan(saveButton);
      return;
    }
    const toggleButton = event.target.closest("[data-toggle-user]");
    if (toggleButton) {
      await toggleUser(toggleButton.dataset.toggleUser);
      return;
    }
    const addXp = event.target.closest("[data-user-add-xp]");
    if (addXp) {
      await quickXp(addXp.dataset.userAddXp, "add");
      return;
    }
    const removeXp = event.target.closest("[data-user-remove-xp]");
    if (removeXp) {
      await quickXp(removeXp.dataset.userRemoveXp, "remove");
    }
  });

  nodes.userSearch?.addEventListener("input", renderUsers);
  nodes.userStatus?.addEventListener("change", renderUsers);

  nodes.assignForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await api.assignAdminPlan({
      user_id: nodes.assignUser?.value,
      plan_key: nodes.assignPlan?.value,
      duration_days: Number(nodes.assignDays?.value || 30),
      send_email: Boolean(nodes.assignEmail?.checked)
    });
    if (!result.ok) {
      window.alert(result.message || "تعذر إرسال الباقة.");
      return;
    }
    await loadAdminData();
  });

  nodes.xpForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitter = event.submitter;
    const action = submitter?.dataset.xpAction || "add";
    const payload = {
      amount: Number(nodes.xpAmount?.value || 0),
      reason: nodes.xpReason?.value || ""
    };
    const method = action === "remove" ? api.removeAdminUserXp : api.addAdminUserXp;
    const result = await method(nodes.xpUser?.value, payload);
    if (!result.ok) {
      window.alert(result.message || "تعذر تعديل XP.");
      return;
    }
    if (nodes.xpAmount) nodes.xpAmount.value = "";
    if (nodes.xpReason) nodes.xpReason.value = "";
    await loadAdminData();
  });

  (async function boot() {
    setTab("dashboard");
    if (await ensureAdminSession()) {
      await loadAdminData();
    }
  })();
})();
