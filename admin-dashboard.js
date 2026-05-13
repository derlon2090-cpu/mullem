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
    notifications: [],
    toolSuggestions: [],
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
    assignExpiresAt: $("[data-assign-expires-at]"),
    assignEmail: $("[data-assign-email]"),
    removePlanForm: $("[data-remove-plan-form]"),
    removePlanUser: $("[data-remove-plan-user]"),
    removePlanReason: $("[data-remove-plan-reason]"),
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
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function getExpiryPayload() {
    const explicitValue = String(nodes.assignExpiresAt?.value || "").trim();
    if (!explicitValue) {
      return {
        duration_days: Number(nodes.assignDays?.value || 30)
      };
    }

    const expiresAt = new Date(explicitValue);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      return { error: "اختر وقت انتهاء صحيح في المستقبل." };
    }

    return {
      expires_at: expiresAt.toISOString(),
      duration_days: Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / millisecondsPerDay))
    };
  }

  function setAssignExpiryMin() {
    if (!nodes.assignExpiresAt) return;
    const date = new Date(Date.now() + 60 * 60 * 1000);
    const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    nodes.assignExpiresAt.min = local;
  }

  function buildLoginUrl() {
    const loginUrl = new URL("login.html", window.location.href);
    loginUrl.searchParams.set("mode", "login");
    loginUrl.searchParams.set("return", "admin.html");
    return loginUrl.href;
  }

  function redirectToLogin() {
    window.location.href = buildLoginUrl();
  }

  function redirectToUserWorkspace() {
    window.location.href = "index.html";
  }

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
      redirectToLogin();
      return false;
    }

    const result = await api.me();
    if (!result.ok) {
      api.clearSession?.();
      redirectToLogin();
      return false;
    }

    if (!isAdminRole(result.data?.user)) {
      redirectToUserWorkspace();
      return false;
    }

    setAdminIdentity(result.data.user);
    setLoginVisible(false);
    return true;
  }

  async function loadAdminData() {
    const [stats, users, plans, subscriptions, xpLedger, logs, notifications, toolSuggestions] = await Promise.all([
      api.getAdminStats(),
      api.getAdminUsers({ per_page: 200 }),
      api.getAdminPackages(),
      api.getAdminSubscriptions?.({ limit: 120 }) || api.request("/admin/subscriptions"),
      api.getAdminXpLedger?.({ limit: 140 }) || api.request("/admin/xp-ledger"),
      api.getAdminLogs?.({ limit: 140 }) || api.request("/admin/logs"),
      api.getAdminNotifications?.({ limit: 80 }) || api.request("/admin/notifications"),
      api.getAdminToolSuggestions?.({ limit: 120 }) || api.request("/admin/tool-suggestions")
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
    if (notifications.ok) state.notifications = Array.isArray(notifications.data?.items) ? notifications.data.items : [];
    if (toolSuggestions.ok) state.toolSuggestions = Array.isArray(toolSuggestions.data?.items) ? toolSuggestions.data.items : [];

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
    return user.package || user.packageName || user.package_name || user.packageKey || user.planType || user.plan_type || "المجانية";
  }

  function getUserPlanId(user) {
    const userPackageId = user.packageId ?? user.package_id;
    if (userPackageId != null && userPackageId !== "") return String(userPackageId);

    const userPlanKey = String(user.packageKey || user.package_key || user.planType || user.plan_type || "").trim().toLowerCase();
    const userPlanName = String(getPlanName(user)).trim().toLowerCase();
    const match = state.plans.find((plan) => {
      const planKey = String(plan.key || plan.package_key || "").trim().toLowerCase();
      const planName = String(plan.name || plan.display_name || "").trim().toLowerCase();
      return (userPlanKey && planKey === userPlanKey) || (userPlanName && planName === userPlanName);
    });
    return match ? String(match.id) : "";
  }

  function renderUserPlanOptions(user) {
    const selectedPlanId = getUserPlanId(user);
    return state.plans.map((plan) => {
      const planId = String(plan.id);
      const selected = planId === selectedPlanId ? " selected" : "";
      return `<option value="${escapeHtml(planId)}"${selected}>${escapeHtml(plan.name)} · ${formatNumber(plan.daily_xp)} XP</option>`;
    }).join("");
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
        <g class="axis-labels">
          <text x="20" y="192">0</text>
          <text x="20" y="164">25K</text>
          <text x="20" y="124">50K</text>
          <text x="20" y="84">75K</text>
          <text x="20" y="44">100K</text>
          <text x="22" y="206">أبريل 18</text>
          <text x="168" y="206">مايو 09</text>
          <text x="320" y="206">مايو 18</text>
        </g>
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
    renderMessages();
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
        <thead><tr><th>المستخدم</th><th>الباقة</th><th>تعديل الباقة</th><th>XP</th><th>الحالة</th><th>إجراءات</th></tr></thead>
        <tbody>
          ${users.map((user) => `
            <tr>
              <td><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.email)}</span></td>
              <td>${escapeHtml(getPlanName(user))}</td>
              <td>
                <div class="admin-user-plan-edit">
                  <select class="field admin-user-plan-select" data-user-plan-select="${escapeHtml(user.id)}">
                    ${renderUserPlanOptions(user)}
                  </select>
                  <button type="button" data-save-user-plan="${escapeHtml(user.id)}">حفظ</button>
                </div>
              </td>
              <td>${formatNumber(user.xp)}</td>
              <td><mark class="admin-state">${escapeHtml(user.status || "active")}</mark></td>
              <td class="admin-row-actions">
                <button type="button" data-toggle-user="${escapeHtml(user.id)}">${String(user.status || "").toLowerCase() === "active" ? "تعطيل" : "تفعيل"}</button>
                <button class="admin-danger-btn" type="button" data-ban-user="${escapeHtml(user.id)}">${String(user.status || "").toLowerCase() === "banned" ? "فك الحظر" : "حظر"}</button>
                <button type="button" data-user-remove-plan="${escapeHtml(user.id)}">حذف الباقة</button>
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
    [nodes.assignUser, nodes.removePlanUser, nodes.xpUser].forEach((node) => {
      if (node) node.innerHTML = options;
    });
    if (nodes.assignPlan) {
      nodes.assignPlan.innerHTML = state.plans.map((plan) => `<option value="${escapeHtml(plan.key)}">${escapeHtml(plan.name)} · ${formatNumber(plan.daily_xp)} XP</option>`).join("");
    }
  }

  function getToolSuggestionStatusLabel(status) {
    return {
      pending: "قيد الانتظار",
      reviewing: "قيد المراجعة",
      approved: "معتمد",
      rejected: "مرفوض",
      implemented: "تم التنفيذ"
    }[String(status || "pending")] || "قيد الانتظار";
  }

  function getToolSuggestionStatusClass(status) {
    return `is-${String(status || "pending").replace(/[^a-z_]/g, "")}`;
  }

  function renderTools() {
    if (!nodes.toolsGrid) return;
    const tools = ["البحث الذكي", "مساعد الكتابة", "تلخيص المحتوى", "استخراج البيانات", "تحسين الصور", "PDF إلى PNG", "PNG إلى PDF", "OCR"];
    const statusCounts = ["pending", "reviewing", "approved", "implemented", "rejected"].map((status) => ({
      status,
      count: state.toolSuggestions.filter((item) => String(item.status || "pending") === status).length
    }));
    const suggestions = [...state.toolSuggestions].sort((a, b) => Number(b.votes_count || 0) - Number(a.votes_count || 0));

    nodes.toolsGrid.innerHTML = `
      <section class="admin-tools-live-grid">
        ${tools.map((tool, index) => `
          <article class="admin-tool-card">
            <strong>${escapeHtml(tool)}</strong>
            <span>${index < 4 ? "متاحة" : "للمشتركين"}</span>
            <label><input type="checkbox" checked> مفعلة</label>
          </article>
        `).join("")}
      </section>

      <section class="admin-tool-suggestions">
        <div class="admin-tool-suggestions-head">
          <div>
            <strong>اقتراحات الأدوات</strong>
            <span>راجع اقتراحات المستخدمين، اعتمدها، أو حوّلها إلى قيد التطوير، وعند التنفيذ يتم منح 50 XP تلقائيًا لكل مصوّت.</span>
          </div>
          <b>${formatNumber(state.toolSuggestions.length)} اقتراح</b>
        </div>
        <div class="admin-suggestion-stats">
          ${statusCounts.map((item) => `
            <span class="${getToolSuggestionStatusClass(item.status)}">
              <b>${formatNumber(item.count)}</b>
              ${escapeHtml(getToolSuggestionStatusLabel(item.status))}
            </span>
          `).join("")}
        </div>
        <div class="admin-suggestion-list">
          ${suggestions.map((item) => {
            const voters = Array.isArray(item.voters) ? item.voters : [];
            return `
              <article class="admin-suggestion-card ${getToolSuggestionStatusClass(item.status)}">
                <div class="admin-suggestion-main">
                  <span class="admin-suggestion-status ${getToolSuggestionStatusClass(item.status)}">${escapeHtml(getToolSuggestionStatusLabel(item.status))}</span>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.description || "بدون وصف")}</p>
                  <small>${escapeHtml(item.category || "أخرى")} · ${formatNumber(item.votes_count || 0)} صوت · أهمية ${formatNumber(item.importance || 3)}/5</small>
                  <small>المقترح الأول: ${escapeHtml(item.created_by_name || item.created_by_email || "مستخدم")} · ${escapeHtml(formatAdminDate(item.created_at))}</small>
                  ${item.use_case ? `<blockquote>${escapeHtml(item.use_case)}</blockquote>` : ""}
                  ${voters.length ? `<div class="admin-suggestion-voters">${voters.slice(0, 4).map((vote) => `<span>${escapeHtml(vote.name || vote.email || `#${vote.user_id}`)}</span>`).join("")}</div>` : ""}
                </div>
                <div class="admin-suggestion-actions">
                  <button type="button" data-tool-suggestion-status="${escapeHtml(item.id)}" data-status="reviewing">مراجعة</button>
                  <button type="button" data-tool-suggestion-status="${escapeHtml(item.id)}" data-status="approved">اعتماد</button>
                  <button type="button" data-tool-suggestion-status="${escapeHtml(item.id)}" data-status="pending">انتظار</button>
                  <button class="admin-warning-btn" type="button" data-tool-suggestion-status="${escapeHtml(item.id)}" data-status="implemented">تم التنفيذ + 50 XP</button>
                  <button class="admin-danger-btn" type="button" data-tool-suggestion-status="${escapeHtml(item.id)}" data-status="rejected">رفض</button>
                </div>
              </article>
            `;
          }).join("") || `<div class="admin-empty-panel">لا توجد اقتراحات أدوات حتى الآن.</div>`}
        </div>
      </section>
    `;
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
  }

  function getNotificationTypeLabel(type) {
    return {
      xp_discount: "خصومات XP",
      official_update: "تحديث رسمي",
      feature_update: "إضافة وتحديث",
      account: "إشعار حساب"
    }[String(type || "")] || "تحديث";
  }

  function getNotificationPlanLabel(plan) {
    return {
      all: "كل الباقات",
      free: "المجانية",
      starter: "المجانية",
      spark: "شرارة",
      pro: "شرارة",
      tuwaiq: "طويق",
      pro_plus: "طويق",
      pioneer: "الرائد",
      pro_max: "الرائد",
      business: "الأعمال"
    }[String(plan || "all")] || plan || "كل الباقات";
  }

  function formatAdminDate(value) {
    if (!value) return "بدون انتهاء";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "بدون انتهاء";
    return date.toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" });
  }

  function renderMessages() {
    if (!nodes.messagesGrid) return;
    const notificationsList = state.notifications.slice(0, 10).map((item) => `
      <article class="admin-notification-row">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.body)}</span>
          <small>${escapeHtml(getNotificationTypeLabel(item.type))} · ${escapeHtml(getNotificationPlanLabel(item.target_plan))} · ${escapeHtml(formatAdminDate(item.expires_at))}</small>
        </div>
        <button class="${item.is_active ? "" : "admin-danger-btn"}" type="button" data-toggle-notification="${escapeHtml(item.id)}" data-next-active="${item.is_active ? "0" : "1"}">
          ${item.is_active ? "إيقاف" : "تفعيل"}
        </button>
      </article>
    `).join("") || `<div class="admin-empty-panel">لا توجد إشعارات من لوحة الإدارة حتى الآن.</div>`;

    nodes.messagesGrid.innerHTML = `
      <form class="admin-notification-form" data-notification-form>
        <div class="admin-notification-form-head">
          <strong>إضافة تحديث جديد</strong>
          <span>سيظهر للمستخدمين مباشرة عند الضغط على زر الجرس حسب الباقة المحددة.</span>
        </div>
        <label>العنوان<input class="field" name="title" maxlength="180" required placeholder="مثال: خصم على باقة طويق"></label>
        <label>النص<textarea class="field" name="body" maxlength="1200" required placeholder="اكتب وصفًا مختصرًا للتحديث أو الخصم"></textarea></label>
        <div class="admin-notification-form-grid">
          <label>القسم
            <select class="field" name="type">
              <option value="xp_discount">خصومات XP</option>
              <option value="official_update">التحديثات الرسمية</option>
              <option value="feature_update">الإضافات والتحديثات</option>
              <option value="account">حساب المستخدم</option>
            </select>
          </label>
          <label>الشارة<input class="field" name="badge" maxlength="80" placeholder="خصم 30% / إعلان / تحديث"></label>
          <label>الأيقونة
            <select class="field" name="icon">
              <option value="gift">هدية</option>
              <option value="megaphone">إعلان</option>
              <option value="sparkle">لمعة</option>
              <option value="bell">جرس</option>
              <option value="document">مستند</option>
              <option value="image">صورة</option>
            </select>
          </label>
          <label>الباقة
            <select class="field" name="target_plan">
              <option value="all">كل الباقات</option>
              <option value="free">المجانية</option>
              <option value="spark">شرارة</option>
              <option value="tuwaiq">طويق</option>
              <option value="pioneer">الرائد</option>
              <option value="business">الأعمال</option>
            </select>
          </label>
          <label>ينتهي في<input class="field" name="expires_at" type="datetime-local"></label>
          <label>رابط اختياري<input class="field" name="action_url" placeholder="subscriptions.html"></label>
        </div>
        <button class="primary-btn" type="submit">إضافة التحديث</button>
      </form>
      <section class="admin-notification-list">
        <div class="admin-notification-form-head">
          <strong>آخر المستجدات المنشورة</strong>
          <span>هذه هي البيانات الحقيقية التي تظهر في نافذة الجرس.</span>
        </div>
        ${notificationsList}
      </section>
    `;
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

  async function setToolSuggestionStatus(suggestionId, status) {
    if (!suggestionId || !status) return;
    let result = null;
    if (status === "implemented") {
      const confirmed = window.confirm("سيتم وضع الاقتراح كمنفذ ومنح 50 XP لكل مستخدم اقترحه أو صوّت له. هل تريد المتابعة؟");
      if (!confirmed) return;
      result = await api.implementAdminToolSuggestion?.(suggestionId);
    } else if (status === "approved") {
      result = await api.approveAdminToolSuggestion?.(suggestionId);
    } else if (status === "rejected") {
      result = await api.rejectAdminToolSuggestion?.(suggestionId);
    } else {
      result = await api.updateAdminToolSuggestionStatus?.(suggestionId, { status });
    }
    if (!result?.ok) {
      window.alert(result?.message || "تعذر تحديث حالة الاقتراح.");
      return;
    }
    await loadAdminData();
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

  async function toggleUserBan(userId) {
    const user = state.users.find((item) => String(item.id) === String(userId));
    if (!user) return;
    const isBanned = String(user.status || "").toLowerCase() === "banned";
    if (!isBanned) {
      const confirmed = window.confirm(`حظر ${user.name || "المستخدم"} من دخول الموقع؟`);
      if (!confirmed) return;
    }
    const nextStatus = isBanned ? "active" : "banned";
    const result = await api.updateAdminUser(userId, {
      status: nextStatus,
      activity: isBanned ? "تم فك حظر المستخدم من لوحة الأدمن" : "تم حظر المستخدم من دخول الموقع عبر لوحة الأدمن"
    });
    if (!result.ok) {
      window.alert(result.message || "تعذر تحديث حظر المستخدم.");
      return;
    }
    await loadAdminData();
  }

  async function saveUserPlan(userId) {
    const select = $$("[data-user-plan-select]").find((node) => node.dataset.userPlanSelect === String(userId));
    const packageId = select?.value;
    const plan = state.plans.find((item) => String(item.id) === String(packageId));
    if (!packageId || !plan) {
      window.alert("اختر باقة صحيحة قبل الحفظ.");
      return;
    }

    const result = await api.updateAdminUser(userId, {
      package_id: packageId,
      activity: `تم تعديل الباقة إلى ${plan.name} من لوحة الأدمن`
    });
    if (!result.ok) {
      window.alert(result.message || "تعذر تعديل باقة المستخدم.");
      return;
    }
    await loadAdminData();
  }

  async function removeUserPlan(userId, reason = "") {
    if (!userId) return;
    const user = state.users.find((item) => String(item.id) === String(userId));
    const confirmed = window.confirm(`حذف الباقة الحالية من ${user?.name || "المستخدم"}؟`);
    if (!confirmed) return;

    const result = await api.updateAdminUser(userId, {
      package_id: null,
      package_name: "مجاني محدود",
      activity: reason || "تم حذف الباقة من لوحة الأدمن"
    });
    if (!result.ok) {
      window.alert(result.message || "تعذر حذف باقة المستخدم.");
      return;
    }
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

  function toIsoDateTime(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }

  async function createNotificationFromForm(form) {
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      body: String(formData.get("body") || "").trim(),
      type: String(formData.get("type") || "official_update"),
      badge: String(formData.get("badge") || "").trim(),
      icon: String(formData.get("icon") || "sparkle"),
      target_plan: String(formData.get("target_plan") || "all"),
      expires_at: toIsoDateTime(formData.get("expires_at")),
      action_url: String(formData.get("action_url") || "").trim()
    };

    if (!payload.title || !payload.body) {
      window.alert("اكتب عنوان ونص الإشعار أولًا.");
      return;
    }

    const result = await api.createAdminNotification(payload);
    if (!result.ok) {
      window.alert(result.message || "تعذر إضافة الإشعار.");
      return;
    }
    form.reset();
    await loadAdminData();
  }

  async function toggleNotification(notificationId, nextActive) {
    if (!notificationId || !api.updateAdminNotification) return;
    const result = await api.updateAdminNotification(notificationId, {
      is_active: String(nextActive) === "1"
    });
    if (!result.ok) {
      window.alert(result.message || "تعذر تحديث الإشعار.");
      return;
    }
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
      redirectToLogin();
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
    const saveUserPlanButton = event.target.closest("[data-save-user-plan]");
    if (saveUserPlanButton) {
      await saveUserPlan(saveUserPlanButton.dataset.saveUserPlan);
      return;
    }
    const toggleButton = event.target.closest("[data-toggle-user]");
    if (toggleButton) {
      await toggleUser(toggleButton.dataset.toggleUser);
      return;
    }
    const banButton = event.target.closest("[data-ban-user]");
    if (banButton) {
      await toggleUserBan(banButton.dataset.banUser);
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
      return;
    }
    const removePlan = event.target.closest("[data-user-remove-plan]");
    if (removePlan) {
      await removeUserPlan(removePlan.dataset.userRemovePlan);
      return;
    }
    const toggleNotificationButton = event.target.closest("[data-toggle-notification]");
    if (toggleNotificationButton) {
      await toggleNotification(toggleNotificationButton.dataset.toggleNotification, toggleNotificationButton.dataset.nextActive);
      return;
    }
    const suggestionStatusButton = event.target.closest("[data-tool-suggestion-status]");
    if (suggestionStatusButton) {
      await setToolSuggestionStatus(suggestionStatusButton.dataset.toolSuggestionStatus, suggestionStatusButton.dataset.status);
      return;
    }
  });

  document.addEventListener("submit", async (event) => {
    const notificationForm = event.target.closest("[data-notification-form]");
    if (notificationForm) {
      event.preventDefault();
      await createNotificationFromForm(notificationForm);
    }
  });

  nodes.userSearch?.addEventListener("input", renderUsers);
  nodes.userStatus?.addEventListener("change", renderUsers);

  nodes.assignForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const expiryPayload = getExpiryPayload();
    if (expiryPayload.error) {
      window.alert(expiryPayload.error);
      return;
    }
    const result = await api.assignAdminPlan({
      user_id: nodes.assignUser?.value,
      plan_key: nodes.assignPlan?.value,
      ...expiryPayload,
      send_email: Boolean(nodes.assignEmail?.checked)
    });
    if (!result.ok) {
      window.alert(result.message || "تعذر إرسال الباقة.");
      return;
    }
    await loadAdminData();
  });

  nodes.removePlanForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await removeUserPlan(nodes.removePlanUser?.value, nodes.removePlanReason?.value || "");
    if (nodes.removePlanReason) nodes.removePlanReason.value = "";
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
    setAssignExpiryMin();
    setTab("dashboard");
    if (await ensureAdminSession()) {
      await loadAdminData();
    }
  })();
})();
