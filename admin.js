const adminStatsRoot = document.querySelector("[data-admin-stats]");
const usersTableRoot = document.querySelector("[data-users-table]");
const feedbackListRoot = document.querySelector("[data-feedback-list]");
const reportListRoot = document.querySelector("[data-report-list]");
const adminAuthRoot = document.querySelector("[data-admin-auth]");
const adminAppRoot = document.querySelector("[data-admin-app]");
const adminLoginForm = document.querySelector("[data-admin-login-form]");
const adminEmailInput = document.querySelector("[data-admin-email]");
const adminPasswordInput = document.querySelector("[data-admin-password]");
const adminLoginState = document.querySelector("[data-admin-login-state]");
const adminLogoutButton = document.querySelector("[data-admin-logout]");

const adminCredentials = {
  email: "admin@mullem.sa",
  password: "Mullem@2026"
};

const adminSessionKey = "mlm_admin_session";

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

if (isAdminLoggedIn()) {
  renderStats();
  renderUsersTable();
  renderFeedback();
  renderReports();
}
