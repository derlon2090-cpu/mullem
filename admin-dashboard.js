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
    ai: {
      analytics: null,
      health: null,
      launch: null,
      beta: null,
      scale: null,
      knowledge: [],
      review: [],
      rag: null,
      loading: true,
      error: ""
    },
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
    aiOverview: $("[data-ai-overview]"),
    aiLaunchMonitor: $("[data-ai-launch-monitor]"),
    aiBetaAnalytics: $("[data-ai-beta-analytics]"),
    aiScaleGrowth: $("[data-ai-scale-growth]"),
    aiHealth: $("[data-ai-health]"),
    aiAlerts: $("[data-ai-alerts]"),
    aiFeedback: $("[data-ai-feedback]"),
    aiFeedbackModel: $("[data-ai-feedback-model]"),
    aiFeedbackPlan: $("[data-ai-feedback-plan]"),
    aiFeedbackQuestion: $("[data-ai-feedback-question]"),
    aiFeedbackFrom: $("[data-ai-feedback-from]"),
    aiFeedbackTo: $("[data-ai-feedback-to]"),
    aiModelPerformance: $("[data-ai-model-performance]"),
    aiKbForm: $("[data-ai-kb-form]"),
    aiKbList: $("[data-ai-kb-list]"),
    aiReviewList: $("[data-ai-review-list]"),
    aiRagForm: $("[data-ai-rag-form]"),
    aiRagQuestion: $("[data-ai-rag-question]"),
    aiRagResult: $("[data-ai-rag-result]"),
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
    const [stats, users, plans, subscriptions, xpLedger, logs, notifications, toolSuggestions, aiAnalytics, aiHealth, aiLaunch, aiBeta, aiScale, aiKnowledge, aiReview] = await Promise.all([
      api.getAdminStats(),
      api.getAdminUsers({ per_page: 200 }),
      api.getAdminPackages(),
      api.getAdminSubscriptions?.({ limit: 120 }) || api.request("/admin/subscriptions"),
      api.getAdminXpLedger?.({ limit: 140 }) || api.request("/admin/xp-ledger"),
      api.getAdminLogs?.({ limit: 140 }) || api.request("/admin/logs"),
      api.getAdminNotifications?.({ limit: 80 }) || api.request("/admin/notifications"),
      api.getAdminToolSuggestions?.({ limit: 120 }) || api.request("/admin/tool-suggestions"),
      api.getAdminAiIntelligence?.() || api.request("/admin/ai-intelligence"),
      api.getAdminAiHealth?.() || api.request("/admin/ai-health"),
      api.getAdminAiLaunchMonitor?.() || api.request("/admin/ai-launch-monitor"),
      api.getAdminBetaAnalytics?.({ days: 30 }) || api.request("/admin/beta-analytics"),
      api.getAdminScaleGrowth?.({ days: 30 }) || api.request("/admin/scale-growth"),
      api.getAdminAiKnowledge?.({ limit: 160 }) || api.request("/admin/ai-knowledge"),
      api.getAdminAiReview?.({ limit: 120 }) || api.request("/admin/ai-review")
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
    state.ai.loading = false;
    state.ai.error = [aiAnalytics, aiHealth, aiLaunch, aiBeta, aiScale, aiKnowledge, aiReview].find((item) => item && !item.ok)?.message || "";
    if (aiAnalytics.ok) state.ai.analytics = aiAnalytics.data || null;
    if (aiHealth.ok) state.ai.health = aiHealth.data || null;
    if (aiLaunch.ok) state.ai.launch = aiLaunch.data || null;
    if (aiBeta.ok) state.ai.beta = aiBeta.data || null;
    if (aiScale.ok) state.ai.scale = aiScale.data || null;
    if (aiKnowledge.ok) state.ai.knowledge = Array.isArray(aiKnowledge.data?.items) ? aiKnowledge.data.items : [];
    if (aiReview.ok) state.ai.review = Array.isArray(aiReview.data?.items) ? aiReview.data.items : [];

    renderAll();
  }

  function renderStats() {
    if (!nodes.stats) return;
    const stats = state.stats || {};
    const cards = [
      { label: "إجمالي الإيرادات", value: formatMoney(stats.revenue_total ?? stats.revenue ?? 0), delta: "+12.5%", icon: "$" },
      { label: "إجمالي XP المستخدم", value: formatNumber(stats.xp_used_total ?? 0), delta: "+8.7%", icon: "ϟ" },
      { label: "توكن الذكاء اليوم", value: formatNumber(stats.ai_daily_tokens ?? 0), delta: "مراقبة التكلفة", icon: "AI" },
      { label: "توكن الذكاء الشهري", value: formatNumber(stats.ai_monthly_tokens ?? 0), delta: "حدود الباقات", icon: "TK", warm: true },
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
    renderAiDashboard();
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

  function getAiAnalytics() {
    return state.ai.analytics?.analytics || {};
  }

  function getAiStatusLabel(status) {
    return {
      draft: "Draft",
      approved: "Approved",
      rejected: "Rejected",
      pending: "Pending"
    }[String(status || "").toLowerCase()] || status || "Draft";
  }

  function renderAiOverview(analytics) {
    if (!nodes.aiOverview) return;
    if (state.ai.loading) {
      nodes.aiOverview.innerHTML = `<article class="admin-kpi-card"><strong>Loading</strong><span>جاري تحميل بيانات AI</span></article>`;
      return;
    }
    if (state.ai.error && !analytics.overview) {
      nodes.aiOverview.innerHTML = `<article class="admin-kpi-card is-warm"><strong>خطأ</strong><span>${escapeHtml(state.ai.error)}</span></article>`;
      return;
    }
    const overview = analytics.overview || {};
    const bestModel = overview.best_model?.model_key || "غير متاح";
    const mostUsed = overview.most_used_model?.model_key || "غير متاح";
    const topReason = overview.top_dissatisfaction_reason?.reason || "لا يوجد";
    const cards = [
      { label: "رسائل اليوم", value: formatNumber(overview.messages_today || 0), delta: "AI requests", icon: "AI" },
      { label: "تكلفة التوكن", value: formatNumber(overview.token_cost_today || 0), delta: `${formatNumber(overview.tokens_today || 0)} token`, icon: "TK" },
      { label: "أفضل نموذج أداء", value: bestModel, delta: `${formatNumber(overview.best_model?.avg_quality || 0)} جودة`, icon: "Q" },
      { label: "الأكثر استخدامًا", value: mostUsed, delta: `${formatNumber(overview.most_used_model?.requests || 0)} طلب`, icon: "M" },
      { label: "متوسط الجودة", value: `${formatNumber(overview.avg_quality || 0)}%`, delta: `سرعة ${formatNumber(overview.avg_latency_ms || 0)}ms`, icon: "%" },
      { label: "سبب عدم الرضا", value: topReason, delta: `${formatNumber(overview.top_dissatisfaction_reason?.count || 0)} مرة`, icon: "!" }
    ];
    nodes.aiOverview.innerHTML = cards.map((card) => `
      <article class="admin-kpi-card">
        <span class="admin-kpi-icon">${escapeHtml(card.icon)}</span>
        <span>${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
        <small>${escapeHtml(card.delta)}</small>
        <i></i>
      </article>
    `).join("");
  }

  function renderAiHealth(health) {
    if (!nodes.aiHealth) return;
    if (!health) {
      nodes.aiHealth.innerHTML = `<div class="admin-empty-panel">جاري تحميل حالة AI...</div>`;
      return;
    }
    const deepseek = health.providers?.deepseek || {};
    const openai = health.providers?.openai || {};
    const rows = [
      ["DeepSeek", deepseek.status, deepseek.avg_latency_ms, deepseek.last_success_at, deepseek.last_error],
      ["OpenAI", openai.status, openai.avg_latency_ms, openai.last_success_at, openai.last_error],
      ["RAG", health.rag?.status, health.rag?.avg_latency_ms, health.rag?.last_success_at, health.rag?.last_error],
      ["Embeddings", health.embeddings?.status, health.embeddings?.avg_latency_ms, health.embeddings?.last_success_at, health.embeddings?.last_error],
      ["Vector Store", health.vector_store?.type || health.vector_store?.driver, 0, health.generated_at, health.vector_store?.status]
    ];
    nodes.aiHealth.innerHTML = `
      <table class="admin-data-table compact">
        <thead><tr><th>Service</th><th>Status</th><th>Avg Latency</th><th>Last Success</th><th>Last Error</th></tr></thead>
        <tbody>${rows.map(([name, status, latency, success, error]) => `
          <tr>
            <td><strong>${escapeHtml(name)}</strong></td>
            <td><mark class="admin-state">${escapeHtml(status || "unknown")}</mark></td>
            <td>${formatNumber(latency || 0)}ms</td>
            <td>${escapeHtml(success || "-")}</td>
            <td><span>${escapeHtml(error || "-")}</span></td>
          </tr>
        `).join("")}</tbody>
      </table>
      <div class="admin-empty-panel">
        Safe Mode: ${health.safe_mode?.active ? "Active" : "Inactive"} · Site cost: ${formatMoney(health.cost_guardrails?.site?.used || 0)} / ${formatMoney(health.cost_guardrails?.site?.limit || 0)}
      </div>
    `;
  }

  function renderAiLaunchMonitor(launch) {
    if (!nodes.aiLaunchMonitor) return;
    if (!launch) {
      nodes.aiLaunchMonitor.innerHTML = `<div class="admin-empty-panel">جاري تحميل Launch Monitor...</div>`;
      return;
    }
    const env = launch.env || {};
    const readiness = launch.readiness || {};
    const envRows = Object.entries(env).map(([key, value]) => `
      <tr>
        <td><strong>${escapeHtml(key)}</strong></td>
        <td><mark class="admin-state">${value?.configured || value?.connected || value?.value_present ? "configured" : "missing"}</mark></td>
        <td>${escapeHtml(value?.enabled === undefined ? "" : String(value.enabled))}</td>
      </tr>
    `).join("");
    const errors = Array.isArray(launch.last_ai_errors) ? launch.last_ai_errors : [];
    const critical = Array.isArray(readiness.critical_issues) ? readiness.critical_issues : [];
    const nonCritical = Array.isArray(readiness.non_critical_issues) ? readiness.non_critical_issues : [];
    nodes.aiLaunchMonitor.innerHTML = `
      <div class="admin-kpi-row">
        <article class="admin-kpi-card ${readiness.status === "ready" ? "" : "is-warm"}">
          <span>Launch Readiness</span>
          <strong>${escapeHtml(readiness.status === "ready" ? "Ready" : "Not Ready")}</strong>
          <small>${readiness.can_open_to_users ? "يمكن فتحه للمستخدمين" : "راجع المشاكل الحرجة أولًا"}</small>
        </article>
        <article class="admin-kpi-card">
          <span>تكلفة اليوم</span>
          <strong>${formatMoney(launch.cost_today_usd || 0)}</strong>
          <small>${formatNumber(launch.requests_today || 0)} طلب اليوم</small>
        </article>
        <article class="admin-kpi-card">
          <span>أعلى موديل تكلفة</span>
          <strong>${escapeHtml(launch.highest_cost_model?.model_key || "غير متاح")}</strong>
          <small>${formatNumber(launch.highest_cost_model?.total_cost || 0)} cost tokens</small>
        </article>
        <article class="admin-kpi-card ${launch.safe_mode?.active ? "is-warm" : ""}">
          <span>Safe Mode</span>
          <strong>${launch.safe_mode?.active ? "Active" : "Inactive"}</strong>
          <small>${escapeHtml((launch.safe_mode?.reasons || []).join(", ") || "normal")}</small>
        </article>
      </div>
      <div class="admin-row-actions" style="margin: 12px 0;">
        <button type="button" data-ai-safe-mode-toggle="1">Enable Safe Mode</button>
        <button type="button" data-ai-safe-mode-toggle="0">Disable Safe Mode</button>
        <button type="button" data-ai-safe-mode-toggle="reset">Use Env Default</button>
      </div>
      ${critical.length || nonCritical.length ? `
        <div class="admin-empty-panel">
          ${critical.map((item) => `<strong>Critical:</strong> ${escapeHtml(item)}`).join("<br>")}
          ${nonCritical.length ? `<br>${nonCritical.map((item) => `<span>Note: ${escapeHtml(item)}</span>`).join("<br>")}` : ""}
        </div>
      ` : `<div class="admin-empty-panel">لا توجد مشاكل إطلاق ظاهرة الآن.</div>`}
      <table class="admin-data-table compact">
        <thead><tr><th>Environment</th><th>Status</th><th>Enabled</th></tr></thead>
        <tbody>${envRows}</tbody>
      </table>
      <table class="admin-data-table compact">
        <thead><tr><th>آخر أخطاء AI</th><th>المصدر</th><th>الوقت</th></tr></thead>
        <tbody>${errors.map((error) => `
          <tr>
            <td><span>${escapeHtml(error.message || "")}</span></td>
            <td>${escapeHtml(error.source || error.type || "")}</td>
            <td>${escapeHtml(error.at || "")}</td>
          </tr>
        `).join("") || `<tr><td colspan="3">لا توجد أخطاء AI مسجلة في الذاكرة الحالية.</td></tr>`}</tbody>
      </table>
    `;
  }

  function renderAiBetaAnalytics(beta) {
    if (!nodes.aiBetaAnalytics) return;
    if (!beta) {
      nodes.aiBetaAnalytics.innerHTML = `<div class="admin-empty-panel">جاري تحميل Beta Analytics...</div>`;
      return;
    }
    const conversion = beta.conversion || {};
    const cost = beta.cost || {};
    const retention = beta.retention || {};
    const abuse = beta.abuse || {};
    const trends = beta.quality_trends || {};
    const topPlan = conversion.most_purchased_plan || {};
    const topCostUser = (cost.top_users || [])[0] || {};
    const rag = cost.rag || {};
    const code = cost.code || {};
    const recommendations = Array.isArray(beta.recommendations) ? beta.recommendations : [];
    const modelCosts = (cost.daily_by_model || []).slice(0, 8);
    const planCosts = (cost.by_plan || []).slice(0, 8);
    const qualityRows = (trends.daily || []).slice(0, 7);
    nodes.aiBetaAnalytics.innerHTML = `
      <div class="admin-kpi-row">
        <article class="admin-kpi-card">
          <span>Free Users</span>
          <strong>${formatNumber(conversion.free_users || 0)}</strong>
          <small>Paid: ${formatNumber(conversion.paid_users || 0)} آ· CVR ${formatNumber(conversion.conversion_rate_percent || 0)}%</small>
        </article>
        <article class="admin-kpi-card">
          <span>Most Purchased</span>
          <strong>${escapeHtml(topPlan.plan || "لا يوجد")}</strong>
          <small>${formatNumber(topPlan.purchases || 0)} شراء آ· ${formatNumber(topPlan.revenue_sar || 0)} SAR</small>
        </article>
        <article class="admin-kpi-card">
          <span>Active Today</span>
          <strong>${formatNumber(conversion.active_users_today || 0)}</strong>
          <small>${formatNumber(conversion.avg_messages_per_user || 0)} رسالة / مستخدم</small>
        </article>
        <article class="admin-kpi-card">
          <span>Avg Cost / Message</span>
          <strong>${formatMoney(cost.avg_cost_per_message_usd || 0)}</strong>
          <small>${formatNumber(cost.avg_tokens_per_user || 0)} token / user</small>
        </article>
        <article class="admin-kpi-card">
          <span>RAG Cost</span>
          <strong>${formatMoney(rag.cost_usd || 0)}</strong>
          <small>${formatNumber(rag.requests || 0)} طلب آ· جودة ${formatNumber(rag.avg_quality || 0)}%</small>
        </article>
        <article class="admin-kpi-card">
          <span>Code Cost</span>
          <strong>${formatMoney(code.cost_usd || 0)}</strong>
          <small>${formatNumber(code.requests || 0)} طلب آ· جودة ${formatNumber(code.avg_quality || 0)}%</small>
        </article>
        <article class="admin-kpi-card">
          <span>Retention</span>
          <strong>${formatNumber(retention.returning_users || 0)}</strong>
          <small>${formatNumber(retention.avg_session_duration_minutes || 0)} دقيقة جلسة</small>
        </article>
        <article class="admin-kpi-card ${abuse.total_events ? "is-warm" : ""}">
          <span>Abuse Signals</span>
          <strong>${formatNumber(abuse.total_events || 0)}</strong>
          <small>${formatNumber(abuse.cooldowns || 0)} cooldown آ· ${formatNumber(abuse.temporary_blocks || 0)} block</small>
        </article>
      </div>
      <section class="admin-dashboard-grid">
        <div>
          <h3>AI Cost by Model</h3>
          <table class="admin-data-table compact">
            <thead><tr><th>Day</th><th>Model</th><th>Requests</th><th>Cost</th><th>Quality</th></tr></thead>
            <tbody>${modelCosts.map((row) => `
              <tr>
                <td>${escapeHtml(row.day || "")}</td>
                <td><strong>${escapeHtml(row.model_key || "")}</strong><span>${escapeHtml(row.provider || "")}</span></td>
                <td>${formatNumber(row.requests || 0)}</td>
                <td>${formatMoney(row.cost_usd || 0)}</td>
                <td>${formatNumber(row.avg_quality || 0)}%</td>
              </tr>
            `).join("") || `<tr><td colspan="5">لا توجد تكلفة موديلات بعد.</td></tr>`}</tbody>
          </table>
        </div>
        <div>
          <h3>Cost by Plan</h3>
          <table class="admin-data-table compact">
            <thead><tr><th>Plan</th><th>Requests</th><th>Tokens</th><th>Cost</th></tr></thead>
            <tbody>${planCosts.map((row) => `
              <tr>
                <td><strong>${escapeHtml(row.plan || "")}</strong></td>
                <td>${formatNumber(row.requests || 0)}</td>
                <td>${formatNumber(row.tokens || 0)}</td>
                <td>${formatMoney(row.cost_usd || 0)}</td>
              </tr>
            `).join("") || `<tr><td colspan="4">لا توجد تكلفة حسب الباقة بعد.</td></tr>`}</tbody>
          </table>
          <div class="admin-empty-panel">Top user cost: #${escapeHtml(topCostUser.user_id || "-")} آ· ${formatMoney(topCostUser.cost_usd || 0)}</div>
        </div>
        <div>
          <h3>Quality Trends</h3>
          <table class="admin-data-table compact">
            <thead><tr><th>Day</th><th>Requests</th><th>Quality</th><th>Latency</th></tr></thead>
            <tbody>${qualityRows.map((row) => `
              <tr>
                <td>${escapeHtml(row.day || "")}</td>
                <td>${formatNumber(row.requests || 0)}</td>
                <td>${formatNumber(row.avg_quality || 0)}%</td>
                <td>${formatNumber(row.avg_latency_ms || 0)}ms</td>
              </tr>
            `).join("") || `<tr><td colspan="4">لا توجد بيانات جودة كافية بعد.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
      <section class="admin-dashboard-grid">
        <div>
          <h3>Top Exit / Stop Points</h3>
          <div class="admin-empty-panel">
            Exit: ${escapeHtml(conversion.top_exit_reason?.reason || "لا يوجد")} آ·
            Stop: ${escapeHtml(conversion.top_stop_point?.route || "لا يوجد")}
          </div>
          <table class="admin-data-table compact">
            <thead><tr><th>Abuse Reason</th><th>Count</th></tr></thead>
            <tbody>${(abuse.by_reason || []).slice(0, 8).map((row) => `
              <tr><td>${escapeHtml(row.reason || "")}</td><td>${formatNumber(row.count || 0)}</td></tr>
            `).join("") || `<tr><td colspan="2">لا توجد إشارات إساءة استخدام.</td></tr>`}</tbody>
          </table>
        </div>
        <div>
          <h3>Recommendations Engine</h3>
          ${(recommendations.length ? recommendations : [{ title: "لا توجد توصيات بعد", action: "استمر في جمع بيانات بيتا." }]).map((item) => `
            <div class="admin-empty-panel">
              <strong>${escapeHtml(item.priority || "normal")} آ· ${escapeHtml(item.title || "")}</strong><br>
              <span>${escapeHtml(item.action || "")}</span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderAiScaleGrowth(scale) {
    if (!nodes.aiScaleGrowth) return;
    if (!scale) {
      nodes.aiScaleGrowth.innerHTML = `<div class="admin-empty-panel">Loading Scale + Growth...</div>`;
      return;
    }
    const referrals = scale.referrals || {};
    const reputation = scale.reputation || {};
    const scaling = scale.scaling || {};
    const suggestions = (scale.knowledge_expansion?.suggestions || []).slice(0, 8);
    const topReferrers = (referrals.top_referrers || []).slice(0, 8);
    const notifications = (scale.notifications?.by_type || []).slice(0, 8);
    const recommendations = Array.isArray(scale.recommendations) ? scale.recommendations : [];
    nodes.aiScaleGrowth.innerHTML = `
      <div class="admin-kpi-row">
        <article class="admin-kpi-card">
          <span>Referrals</span>
          <strong>${formatNumber(referrals.total_referrals || 0)}</strong>
          <small>${formatNumber(referrals.conversions || 0)} conversions · ${formatNumber(referrals.rewards_xp || 0)} XP rewards</small>
        </article>
        <article class="admin-kpi-card">
          <span>Queue</span>
          <strong>${formatNumber(scaling.queue_size || 0)}</strong>
          <small>${formatNumber(scaling.concurrent_requests || 0)} concurrent · ${formatNumber(scaling.avg_queue_wait_ms || 0)}ms wait</small>
        </article>
        <article class="admin-kpi-card">
          <span>Generation</span>
          <strong>${formatNumber(scaling.avg_generation_ms || 0)}ms</strong>
          <small>${formatNumber(scaling.fallback_recoveries_since_start || 0)} provider recoveries</small>
        </article>
        <article class="admin-kpi-card ${Number(reputation.high_abuse_users || 0) ? "is-warm" : ""}">
          <span>Reputation</span>
          <strong>${formatNumber(reputation.avg_trust_score || 0)}</strong>
          <small>${formatNumber(reputation.high_abuse_users || 0)} high abuse · ${formatNumber(reputation.shadow_banned_users || 0)} shadow limited</small>
        </article>
        <article class="admin-kpi-card">
          <span>Memory</span>
          <strong>${formatNumber(scaling.memory_pressure?.heap_used_mb || 0)} MB</strong>
          <small>RSS ${formatNumber(scaling.memory_pressure?.rss_mb || 0)} MB</small>
        </article>
      </div>
      <section class="admin-dashboard-grid">
        <div>
          <h3>Top Referrers</h3>
          <table class="admin-data-table compact">
            <thead><tr><th>User</th><th>Referrals</th><th>Conversions</th><th>Rewards</th></tr></thead>
            <tbody>${topReferrers.map((row) => `
              <tr><td>#${escapeHtml(row.user_id || "")}</td><td>${formatNumber(row.referrals || 0)}</td><td>${formatNumber(row.conversions || 0)}</td><td>${formatNumber(row.rewards_xp || 0)} XP</td></tr>
            `).join("") || `<tr><td colspan="4">No referral data yet.</td></tr>`}</tbody>
          </table>
        </div>
        <div>
          <h3>Knowledge Expansion</h3>
          <table class="admin-data-table compact">
            <thead><tr><th>Suggestion</th><th>Category</th><th>Hits</th><th>Status</th></tr></thead>
            <tbody>${suggestions.map((row) => `
              <tr><td><strong>${escapeHtml(row.proposed_title || "")}</strong></td><td>${escapeHtml(row.proposed_category || "")}</td><td>${formatNumber(row.occurrences || 0)}</td><td>${escapeHtml(row.status || "")}</td></tr>
            `).join("") || `<tr><td colspan="4">No repeated-question suggestions yet.</td></tr>`}</tbody>
          </table>
        </div>
        <div>
          <h3>Usage Notifications</h3>
          <table class="admin-data-table compact">
            <thead><tr><th>Type</th><th>Sent</th></tr></thead>
            <tbody>${notifications.map((row) => `
              <tr><td>${escapeHtml(row.type || "")}</td><td>${formatNumber(row.sent || 0)}</td></tr>
            `).join("") || `<tr><td colspan="2">No notification activity yet.</td></tr>`}</tbody>
          </table>
        </div>
        <div>
          <h3>Scaling Recommendations</h3>
          ${(recommendations.length ? recommendations : ["No scaling action needed yet."]).map((item) => `
            <div class="admin-empty-panel">${escapeHtml(typeof item === "string" ? item : (item.action || item.title || ""))}</div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderAiAlerts(health) {
    if (!nodes.aiAlerts) return;
    const alerts = Array.isArray(health?.alerts) ? health.alerts : [];
    nodes.aiAlerts.innerHTML = alerts.length ? `
      <table class="admin-data-table compact">
        <thead><tr><th>Alert</th><th>Severity</th><th>Details</th></tr></thead>
        <tbody>${alerts.map((alert) => `
          <tr>
            <td><strong>${escapeHtml(alert.type || "alert")}</strong></td>
            <td><mark class="admin-state">${escapeHtml(alert.severity || "info")}</mark></td>
            <td><span>${escapeHtml(alert.message || "")}</span></td>
          </tr>
        `).join("")}</tbody>
      </table>
    ` : `<div class="admin-empty-panel">لا توجد تنبيهات AI حرجة الآن.</div>`;
  }

  function renderAiFeedbackFilters(feedbackRows, modelRows) {
    const currentModel = nodes.aiFeedbackModel?.value || "";
    const currentPlan = nodes.aiFeedbackPlan?.value || "";
    const currentQuestion = nodes.aiFeedbackQuestion?.value || "";
    const models = [...new Set([
      ...modelRows.map((item) => item.model_key),
      ...feedbackRows.map((item) => item.model_key)
    ].filter(Boolean))].sort();
    const plans = [...new Set(feedbackRows.map((item) => item.plan).filter(Boolean))].sort();
    const questionTypes = [...new Set(feedbackRows.map((item) => item.question_type).filter(Boolean))].sort();
    if (nodes.aiFeedbackModel) {
      nodes.aiFeedbackModel.innerHTML = `<option value="">كل الموديلات</option>${models.map((model) => `<option value="${escapeHtml(model)}">${escapeHtml(model)}</option>`).join("")}`;
      nodes.aiFeedbackModel.value = models.includes(currentModel) ? currentModel : "";
    }
    if (nodes.aiFeedbackPlan) {
      nodes.aiFeedbackPlan.innerHTML = `<option value="">كل الباقات</option>${plans.map((plan) => `<option value="${escapeHtml(plan)}">${escapeHtml(plan)}</option>`).join("")}`;
      nodes.aiFeedbackPlan.value = plans.includes(currentPlan) ? currentPlan : "";
    }
    if (nodes.aiFeedbackQuestion) {
      nodes.aiFeedbackQuestion.innerHTML = `<option value="">كل أنواع الأسئلة</option>${questionTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join("")}`;
      nodes.aiFeedbackQuestion.value = questionTypes.includes(currentQuestion) ? currentQuestion : "";
    }
  }

  function renderAiFeedback(analytics) {
    if (!nodes.aiFeedback) return;
    const feedbackRows = Array.isArray(analytics.feedback_analytics) ? analytics.feedback_analytics : [];
    const modelFilter = nodes.aiFeedbackModel?.value || "";
    const planFilter = nodes.aiFeedbackPlan?.value || "";
    const questionFilter = nodes.aiFeedbackQuestion?.value || "";
    const filtered = feedbackRows.filter((row) => {
      if (modelFilter && String(row.model_key || "") !== modelFilter) return false;
      if (planFilter && String(row.plan || "") !== planFilter) return false;
      if (questionFilter && String(row.question_type || "") !== questionFilter) return false;
      return true;
    });
    nodes.aiFeedback.innerHTML = filtered.length ? `
      <table class="admin-data-table">
        <thead><tr><th>السبب</th><th>الموديل</th><th>الباقة</th><th>نوع السؤال</th><th>العدد</th><th>الجودة</th></tr></thead>
        <tbody>${filtered.map((row) => `
          <tr>
            <td><strong>${escapeHtml(row.reason)}</strong><span>${escapeHtml(row.task_type || "")}</span></td>
            <td>${escapeHtml(row.model_key || "")}</td>
            <td>${escapeHtml(row.plan || "")}</td>
            <td>${escapeHtml(row.question_type || "")}</td>
            <td>${formatNumber(row.count || 0)}</td>
            <td>${formatNumber(row.avg_quality || 0)}%</td>
          </tr>
        `).join("")}</tbody>
      </table>
    ` : `<div class="admin-empty-panel">لا توجد تقييمات مطابقة للفلاتر الحالية.</div>`;
  }

  function renderAiModelPerformance(analytics) {
    if (!nodes.aiModelPerformance) return;
    const rows = Array.isArray(analytics.model_performance) ? analytics.model_performance : [];
    nodes.aiModelPerformance.innerHTML = rows.length ? `
      <table class="admin-data-table">
        <thead><tr><th>الموديل</th><th>الطلبات</th><th>Avg Tokens</th><th>Avg Cost</th><th>الجودة</th><th>السرعة</th><th>الرضا</th></tr></thead>
        <tbody>${rows.map((row) => `
          <tr>
            <td><strong>${escapeHtml(row.model_key)}</strong><span>${escapeHtml(row.provider || "")}</span></td>
            <td>${formatNumber(row.requests || row.events_count || 0)}</td>
            <td>${formatNumber(row.avg_tokens || 0)}</td>
            <td>${formatNumber(row.avg_cost || 0)}</td>
            <td>${formatNumber(row.avg_quality || 0)}%</td>
            <td>${formatNumber(row.avg_speed_ms || row.avg_latency_ms || 0)}ms</td>
            <td>${formatNumber(row.satisfaction_rate || 0)}%</td>
          </tr>
        `).join("")}</tbody>
      </table>
    ` : `<div class="admin-empty-panel">لا توجد أحداث جودة بعد.</div>`;
  }

  function renderAiKnowledgeList() {
    if (!nodes.aiKbList) return;
    const items = state.ai.knowledge || [];
    nodes.aiKbList.innerHTML = items.length ? `
      <table class="admin-data-table">
        <thead><tr><th>العنوان</th><th>التصنيف</th><th>الحالة</th><th>Chunks</th><th>الاستخدام</th><th>إجراءات</th></tr></thead>
        <tbody>${items.map((item) => `
          <tr>
            <td><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml((item.tags || []).join(", "))}</span></td>
            <td>${escapeHtml(item.category || "")}</td>
            <td><mark class="admin-state">${escapeHtml(getAiStatusLabel(item.status))}</mark></td>
            <td>${formatNumber(item.chunks_count || 0)}</td>
            <td>${formatNumber(item.total_usage || 0)}</td>
            <td class="admin-row-actions">
              <button type="button" data-ai-kb-status="${escapeHtml(item.id)}" data-status="approved">اعتماد</button>
              <button type="button" data-ai-kb-status="${escapeHtml(item.id)}" data-status="draft">Draft</button>
              <button class="admin-danger-btn" type="button" data-ai-kb-status="${escapeHtml(item.id)}" data-status="rejected">رفض</button>
            </td>
          </tr>
        `).join("")}</tbody>
      </table>
    ` : `<div class="admin-empty-panel">لا توجد مصادر معرفة بعد. أضف مصدرًا من النموذج بالأعلى.</div>`;
  }

  function renderAiReviewList() {
    if (!nodes.aiReviewList) return;
    const items = state.ai.review || [];
    nodes.aiReviewList.innerHTML = items.length ? `
      <table class="admin-data-table">
        <thead><tr><th>الإجابة</th><th>السؤال</th><th>الجودة</th><th>الحالة</th><th>إجراءات</th></tr></thead>
        <tbody>${items.map((item) => `
          <tr data-ai-review-row="${escapeHtml(item.id)}">
            <td><textarea class="field" rows="4" data-ai-review-output="${escapeHtml(item.id)}">${escapeHtml(item.ideal_output || "")}</textarea></td>
            <td><textarea class="field" rows="4" data-ai-review-input="${escapeHtml(item.id)}">${escapeHtml(item.input_text || "")}</textarea><span>${escapeHtml(item.task_type || "")} · ${escapeHtml(item.model_key || "")}</span></td>
            <td>${formatNumber(item.quality_score || 0)}%</td>
            <td><mark class="admin-state">${escapeHtml(getAiStatusLabel(item.review_status))}</mark></td>
            <td class="admin-row-actions">
              <button type="button" data-ai-review-approve="${escapeHtml(item.id)}">اعتماد KB</button>
              <button class="admin-danger-btn" type="button" data-ai-review-reject="${escapeHtml(item.id)}">رفض</button>
            </td>
          </tr>
        `).join("")}</tbody>
      </table>
    ` : `<div class="admin-empty-panel">لا توجد إجابات ممتازة بانتظار المراجعة.</div>`;
  }

  function renderAiRagResult() {
    if (!nodes.aiRagResult) return;
    const result = state.ai.rag;
    if (!result) {
      nodes.aiRagResult.innerHTML = `<div class="admin-empty-panel">اكتب سؤالًا لاختبار المصادر المسترجعة والرد النهائي.</div>`;
      return;
    }
    if (result.loading) {
      nodes.aiRagResult.innerHTML = `<div class="admin-empty-panel">جاري اختبار RAG...</div>`;
      return;
    }
    if (result.error) {
      nodes.aiRagResult.innerHTML = `<div class="admin-empty-panel">تعذر اختبار RAG: ${escapeHtml(result.error)}</div>`;
      return;
    }
    const sources = Array.isArray(result.sources) ? result.sources : [];
    nodes.aiRagResult.innerHTML = `
      <table class="admin-data-table compact">
        <tbody>
          <tr><td><strong>الموديل</strong></td><td>${escapeHtml(result.model?.key || "")} · ${escapeHtml(result.model?.provider || "")}</td></tr>
          <tr><td><strong>الزمن</strong></td><td>${formatNumber(result.latency_ms || 0)}ms</td></tr>
          <tr><td><strong>الرد النهائي</strong></td><td><span>${escapeHtml(result.answer || "")}</span></td></tr>
        </tbody>
      </table>
      <table class="admin-data-table">
        <thead><tr><th>المصدر</th><th>Similarity</th><th>Rank</th><th>سبب الاختيار</th><th>مقتطف</th></tr></thead>
        <tbody>${sources.map((source) => `
          <tr>
            <td><strong>${escapeHtml(source.title || "")}</strong><span>${escapeHtml(source.category || source.source || "")}</span></td>
            <td>${formatNumber(source.similarity || 0)}</td>
            <td>${formatNumber(source.rank_score || 0)}</td>
            <td>${escapeHtml(source.reason || "")}</td>
            <td><span>${escapeHtml(String(source.content || "").slice(0, 180))}</span></td>
          </tr>
        `).join("") || `<tr><td colspan="5">لا توجد مصادر مسترجعة. اعتمد مصادر في Knowledge Base أولًا.</td></tr>`}</tbody>
      </table>
    `;
  }

  function renderAiDashboard() {
    const analytics = getAiAnalytics();
    const health = state.ai.health || {};
    const launch = state.ai.launch || {};
    const modelRows = Array.isArray(analytics.model_performance) ? analytics.model_performance : [];
    const feedbackRows = Array.isArray(analytics.feedback_analytics) ? analytics.feedback_analytics : [];
    renderAiOverview(analytics);
    renderAiLaunchMonitor(launch);
    renderAiBetaAnalytics(state.ai.beta);
    renderAiScaleGrowth(state.ai.scale);
    renderAiHealth(health);
    renderAiAlerts(health);
    renderAiFeedbackFilters(feedbackRows, modelRows);
    renderAiFeedback(analytics);
    renderAiModelPerformance(analytics);
    renderAiKnowledgeList();
    renderAiReviewList();
    renderAiRagResult();
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

  async function loadAiAnalyticsWithFilters() {
    const params = {
      model: nodes.aiFeedbackModel?.value || "",
      plan: nodes.aiFeedbackPlan?.value || "",
      question_type: nodes.aiFeedbackQuestion?.value || "",
      from: nodes.aiFeedbackFrom?.value || "",
      to: nodes.aiFeedbackTo?.value || ""
    };
    const result = await api.getAdminAiIntelligence?.(params);
    if (!result?.ok) {
      state.ai.error = result?.message || "تعذر تحديث تحليلات AI.";
      renderAiDashboard();
      return;
    }
    state.ai.analytics = result.data || null;
    state.ai.error = "";
    renderAiDashboard();
  }

  async function createAiKnowledgeFromForm(form) {
    const formData = new FormData(form);
    const payload = {
      title: String(formData.get("title") || "").trim(),
      category: String(formData.get("category") || "faq").trim(),
      source: String(formData.get("source") || "").trim(),
      status: String(formData.get("status") || "draft").trim(),
      tags: String(formData.get("tags") || "").split(",").map((item) => item.trim()).filter(Boolean),
      content: String(formData.get("content") || "").trim()
    };
    if (!payload.title || !payload.content) {
      window.alert("اكتب عنوان ومحتوى المصدر أولًا.");
      return;
    }
    const result = await api.createAdminAiKnowledge?.(payload);
    if (!result?.ok) {
      window.alert(result?.message || "تعذر إضافة مصدر المعرفة.");
      return;
    }
    form.reset();
    await loadAdminData();
    setTab("ai");
  }

  async function setAiKnowledgeStatus(sourceId, status) {
    if (!sourceId || !status) return;
    const result = await api.updateAdminAiKnowledge?.(sourceId, { status });
    if (!result?.ok) {
      window.alert(result?.message || "تعذر تحديث حالة مصدر المعرفة.");
      return;
    }
    await loadAdminData();
    setTab("ai");
  }

  async function approveAiReview(exampleId) {
    if (!exampleId) return;
    const input = $$("[data-ai-review-input]").find((node) => node.dataset.aiReviewInput === String(exampleId))?.value || "";
    const output = $$("[data-ai-review-output]").find((node) => node.dataset.aiReviewOutput === String(exampleId))?.value || "";
    const result = await api.approveAdminAiReview?.(exampleId, {
      input_text: input,
      ideal_output: output,
      status: "approved"
    });
    if (!result?.ok) {
      window.alert(result?.message || "تعذر اعتماد الإجابة في Knowledge Base.");
      return;
    }
    await loadAdminData();
    setTab("ai");
  }

  async function rejectAiReview(exampleId) {
    if (!exampleId) return;
    const result = await api.rejectAdminAiReview?.(exampleId, {
      admin_note: "Rejected from AI Admin Dashboard"
    });
    if (!result?.ok) {
      window.alert(result?.message || "تعذر رفض الإجابة.");
      return;
    }
    await loadAdminData();
    setTab("ai");
  }

  async function runAiRagDebug(form) {
    const question = String(nodes.aiRagQuestion?.value || "").trim();
    if (!question) {
      window.alert("اكتب سؤال اختبار RAG أولًا.");
      return;
    }
    state.ai.rag = { loading: true };
    renderAiRagResult();
    const result = await api.debugAdminAiRag?.({ question });
    if (!result?.ok) {
      state.ai.rag = { error: result?.message || "RAG debug failed" };
      renderAiRagResult();
      return;
    }
    state.ai.rag = result.data || null;
    renderAiRagResult();
    form?.reset?.();
  }

  async function toggleAiSafeMode(value) {
    if (!api?.setAdminAiSafeMode) return;
    const enabled = value === "reset" ? null : value === "1";
    const result = await api.setAdminAiSafeMode(enabled);
    if (!result?.ok) {
      window.alert(result?.message || "تعذر تحديث Safe Mode.");
      return;
    }
    state.ai.launch = result.data?.launch_monitor || state.ai.launch;
    state.ai.health = result.data?.launch_monitor?.health || state.ai.health;
    renderAiDashboard();
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
    const aiKbStatusButton = event.target.closest("[data-ai-kb-status]");
    if (aiKbStatusButton) {
      await setAiKnowledgeStatus(aiKbStatusButton.dataset.aiKbStatus, aiKbStatusButton.dataset.status);
      return;
    }
    const aiReviewApproveButton = event.target.closest("[data-ai-review-approve]");
    if (aiReviewApproveButton) {
      await approveAiReview(aiReviewApproveButton.dataset.aiReviewApprove);
      return;
    }
    const aiReviewRejectButton = event.target.closest("[data-ai-review-reject]");
    if (aiReviewRejectButton) {
      await rejectAiReview(aiReviewRejectButton.dataset.aiReviewReject);
      return;
    }
    const aiFeedbackRefreshButton = event.target.closest("[data-ai-feedback-refresh]");
    if (aiFeedbackRefreshButton) {
      await loadAiAnalyticsWithFilters();
      return;
    }
    const aiSafeModeButton = event.target.closest("[data-ai-safe-mode-toggle]");
    if (aiSafeModeButton) {
      await toggleAiSafeMode(aiSafeModeButton.dataset.aiSafeModeToggle);
      return;
    }
  });

  document.addEventListener("submit", async (event) => {
    const notificationForm = event.target.closest("[data-notification-form]");
    if (notificationForm) {
      event.preventDefault();
      await createNotificationFromForm(notificationForm);
    }
    const aiKbForm = event.target.closest("[data-ai-kb-form]");
    if (aiKbForm) {
      event.preventDefault();
      await createAiKnowledgeFromForm(aiKbForm);
    }
    const aiRagForm = event.target.closest("[data-ai-rag-form]");
    if (aiRagForm) {
      event.preventDefault();
      await runAiRagDebug(aiRagForm);
    }
  });

  nodes.userSearch?.addEventListener("input", renderUsers);
  nodes.userStatus?.addEventListener("change", renderUsers);
  nodes.aiFeedbackModel?.addEventListener("change", renderAiDashboard);
  nodes.aiFeedbackPlan?.addEventListener("change", renderAiDashboard);
  nodes.aiFeedbackQuestion?.addEventListener("change", renderAiDashboard);
  nodes.aiFeedbackFrom?.addEventListener("change", loadAiAnalyticsWithFilters);
  nodes.aiFeedbackTo?.addEventListener("change", loadAiAnalyticsWithFilters);

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
