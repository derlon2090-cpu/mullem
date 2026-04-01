const adminStatsRoot = document.querySelector("[data-admin-stats]");
const usersTableRoot = document.querySelector("[data-users-table]");
const feedbackListRoot = document.querySelector("[data-feedback-list]");
const reportListRoot = document.querySelector("[data-report-list]");
const roleListRoot = document.querySelector("[data-role-list]");
const activityListRoot = document.querySelector("[data-activity-list]");
const adminAuthRoot = document.querySelector("[data-admin-auth]");
const adminAppRoot = document.querySelector("[data-admin-app]");
const adminLoginForm = document.querySelector("[data-admin-login-form]");
const adminEmailInput = document.querySelector("[data-admin-email]");
const adminPasswordInput = document.querySelector("[data-admin-password]");
const adminLoginState = document.querySelector("[data-admin-login-state]");
const adminLogoutButton = document.querySelector("[data-admin-logout]");
const passwordToggleButtons = document.querySelectorAll("[data-password-toggle]");

const adminCredentials = {
  email: "admin@mullem.sa",
  password: "Mullem@2026"
};

const adminSessionKey = "mlm_admin_session";
const adminRoles = [
  {
    name: "Super Admin",
    description: "تحكم كامل في المنصة، المستخدمين، التقارير، الصلاحيات، والتصدير.",
    permissions: ["مشاهدة المستخدمين", "تعديل المستخدمين", "حظر المستخدمين", "إدارة المحتوى", "إدارة الاشتراكات", "مشاهدة التقارير", "تصدير البيانات", "سجل النشاطات"]
  },
  {
    name: "Admin",
    description: "إدارة تشغيلية يومية للمستخدمين والمحتوى والاشتراكات.",
    permissions: ["مشاهدة المستخدمين", "تعديل المستخدمين", "حظر المستخدمين", "إدارة المحتوى", "إدارة الاشتراكات", "مشاهدة التقارير", "سجل النشاطات"]
  },
  {
    name: "Moderator",
    description: "متابعة الحسابات والبلاغات والإشراف على السلوك والمحتوى العام.",
    permissions: ["مشاهدة المستخدمين", "حظر المستخدمين", "إدارة المحتوى", "مشاهدة التقارير", "سجل النشاطات"]
  },
  {
    name: "Support",
    description: "مساندة المستخدمين ومتابعة المشاكل والحسابات من منظور الدعم.",
    permissions: ["مشاهدة المستخدمين", "تعديل المستخدمين", "مشاهدة التقارير", "سجل النشاطات"]
  },
  {
    name: "Content Manager",
    description: "إدارة الدروس، الملفات، وبنوك الأسئلة والمحتوى التعليمي.",
    permissions: ["إدارة المحتوى", "مشاهدة التقارير", "تصدير البيانات", "سجل النشاطات"]
  }
];

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function isAdminLoggedIn() {
  return localStorage.getItem(adminSessionKey) === "1";
}

function updateAdminView() {
  const loggedIn = isAdminLoggedIn();
  if (adminAuthRoot) adminAuthRoot.hidden = loggedIn;
  if (adminAppRoot) adminAppRoot.hidden = !loggedIn;
  if (adminLogoutButton) adminLogoutButton.hidden = !loggedIn;
}

function getTopEntry(record, fallback) {
  const top = Object.entries(record || {}).sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (${top[1]})` : fallback;
}

function getUsers() {
  const users = loadJson("mlm_users", []);
  return users.length
    ? users
    : [
        {
          name: "طالب تجريبي",
          role: "Student",
          package: "مجاني محدود",
          xp: 100,
          status: "نشط",
          activity: "لا يوجد نشاط بعد"
        }
      ];
}

function getAnalytics() {
  return {
    totalMessages: 0,
    totalLikes: 0,
    totalDislikes: 0,
    xpUsed: 0,
    dailyMessages: {},
    subjects: {},
    savedSessions: 0,
    ...loadJson("mlm_analytics", {})
  };
}

function getFeedback() {
  const liked = loadJson("mlm_liked_memory", []);
  const disliked = loadJson("mlm_disliked_memory", []);
  return {
    liked,
    disliked
  };
}

function renderStats() {
  if (!adminStatsRoot) return;
  const analytics = getAnalytics();
  const users = getUsers();
  const todayKey = new Date().toISOString().slice(0, 10);
  const runtime = localStorage.getItem("mlm_runtime") || "vLLM Runtime";
  const trainingMode = localStorage.getItem("mlm_training_mode") || "Prompt + RAG";

  const stats = [
    { label: "عدد المستخدمين", value: users.length, note: "إجمالي الحسابات الموجودة" },
    { label: "الرسائل اليومية", value: analytics.dailyMessages[todayKey] || 0, note: "عدد الرسائل اليوم" },
    { label: "الحسابات النشطة", value: users.filter((user) => user.status === "نشط").length, note: "المستخدمون النشطون حاليًا" },
    { label: "استهلاك XP", value: analytics.xpUsed || 0, note: "الاستهلاك التراكمي" },
    { label: "أكثر مادة استخدامًا", value: getTopEntry(analytics.subjects, "لا توجد بيانات بعد"), note: "المادة الأعلى تفاعلًا" },
    { label: "وضع التشغيل", value: runtime, note: trainingMode }
  ];

  adminStatsRoot.innerHTML = stats
    .map(
      (stat) => `
        <article class="stat-card">
          <span>${stat.label}</span>
          <strong>${stat.value}</strong>
          <span>${stat.note}</span>
        </article>
      `
    )
    .join("");
}

function renderUsersTable() {
  if (!usersTableRoot) return;
  const rows = getUsers()
    .map(
      (user) => `
        <tr>
          <td>${user.name || "بدون اسم"}</td>
          <td>${user.role || "Student"}</td>
          <td>${user.package || "مجاني محدود"}</td>
          <td>${user.xp ?? 0}</td>
          <td>${user.status || "نشط"}</td>
          <td>${user.activity || "لا يوجد نشاط مسجل"}</td>
        </tr>
      `
    )
    .join("");

  usersTableRoot.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>الاسم</th>
          <th>الدور</th>
          <th>الباقة</th>
          <th>XP</th>
          <th>الحالة</th>
          <th>آخر نشاط</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderFeedback() {
  if (!feedbackListRoot) return;
  const { liked, disliked } = getFeedback();
  const entries = [
    ...liked.slice(0, 3).map((item) => ({ type: "إعجاب", status: "إيجابي", ...item })),
    ...disliked.slice(0, 3).map((item) => ({ type: "لم يعجبني", status: "بحاجة إلى مراجعة", ...item }))
  ];

  feedbackListRoot.innerHTML = entries.length
    ? entries
        .map(
          (entry) => `
            <div class="admin-item">
              <strong>${entry.type} | ${entry.subject || "عام"} | ${entry.lesson || "بدون درس"}</strong>
              <span>${entry.question || entry.preview || "لا يوجد نص محفوظ"}</span>
              <span>${entry.status}</span>
            </div>
          `
        )
        .join("")
    : `
        <div class="admin-item">
          <strong>لا توجد تقييمات بعد</strong>
          <span>ستظهر هنا الإعجابات وعدم الإعجاب عندما يبدأ الطلاب تقييم الإجابات.</span>
        </div>
      `;
}

function renderRoleMatrix() {
  if (!roleListRoot) return;
  roleListRoot.innerHTML = adminRoles
    .map(
      (role) => `
        <div class="admin-item">
          <strong>${role.name}</strong>
          <span>${role.description}</span>
          <div class="permission-grid">
            ${role.permissions.map((permission) => `<span class="permission-chip">${permission}</span>`).join("")}
          </div>
        </div>
      `
    )
    .join("");
}

function renderActivityLog() {
  if (!activityListRoot) return;
  const users = getUsers();
  const activities = users
    .slice(0, 8)
    .map((user) => ({
      title: `${user.name || "مستخدم"} — ${user.role || "Student"}`,
      detail: user.activity || "لا يوجد نشاط مسجل بعد.",
      meta: `${user.status || "نشط"}${user.package ? ` • ${user.package}` : ""}`
    }));

  activityListRoot.innerHTML = activities.length
    ? activities
        .map(
          (item) => `
            <div class="admin-item">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
              <span>${item.meta}</span>
            </div>
          `
        )
        .join("")
    : `
        <div class="admin-item">
          <strong>لا توجد نشاطات بعد</strong>
          <span>سيظهر هنا آخر ما تم داخل المنصة عندما يبدأ المستخدمون والأدمن بالتفاعل.</span>
        </div>
      `;
}

function renderReports() {
  if (!reportListRoot) return;
  const analytics = getAnalytics();
  const reports = [
    `إجمالي الرسائل التعليمية: ${analytics.totalMessages || 0}.`,
    `الإعجابات: ${analytics.totalLikes || 0} | لم يعجبني: ${analytics.totalDislikes || 0}.`,
    `المحادثات المحفوظة للمراجعة: ${analytics.savedSessions || 0}.`,
    `أكثر مادة تحتاج متابعة: ${getTopEntry(analytics.subjects, "لا توجد مادة بارزة بعد")}.`,
    `هذه اللوحة تعرض ملخص الاستخدام داخل النسخة الحالية من المنصة.`
  ];

  reportListRoot.innerHTML = reports
    .map(
      (report) => `
        <div class="admin-item">
          <strong>تقرير</strong>
          <span>${report}</span>
        </div>
      `
    )
    .join("");
}

function bindPasswordToggles() {
  passwordToggleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-password-toggle");
      const input = targetId ? document.getElementById(targetId) : null;
      if (!input) return;
      const shouldShow = input.type === "password";
      input.type = shouldShow ? "text" : "password";
      button.setAttribute("aria-pressed", shouldShow ? "true" : "false");
      button.setAttribute("aria-label", shouldShow ? "إخفاء كلمة المرور" : "إظهار كلمة المرور");
    });
  });
}

adminLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = (adminEmailInput?.value || "").trim().toLowerCase();
  const password = adminPasswordInput?.value || "";

  if (email === adminCredentials.email && password === adminCredentials.password) {
    localStorage.setItem(adminSessionKey, "1");
    if (adminLoginState) adminLoginState.textContent = "تم تسجيل دخول الأدمن بنجاح.";
    updateAdminView();
    renderStats();
    renderUsersTable();
    renderFeedback();
    renderRoleMatrix();
    renderActivityLog();
    renderReports();
    return;
  }

  if (adminLoginState) {
    adminLoginState.textContent = "بيانات دخول الأدمن غير صحيحة. تأكد من البريد وكلمة المرور.";
  }
});

adminLogoutButton?.addEventListener("click", () => {
  localStorage.removeItem(adminSessionKey);
  if (adminEmailInput) adminEmailInput.value = "";
  if (adminPasswordInput) adminPasswordInput.value = "";
  if (adminLoginState) adminLoginState.textContent = "تم تسجيل الخروج.";
  updateAdminView();
  window.location.href = "login.html";
});

updateAdminView();
bindPasswordToggles();

if (isAdminLoggedIn()) {
  renderStats();
  renderUsersTable();
  renderFeedback();
  renderRoleMatrix();
  renderActivityLog();
  renderReports();
}
