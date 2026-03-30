const adminStatsRoot = document.querySelector("[data-admin-stats]");
const usersTableRoot = document.querySelector("[data-users-table]");
const feedbackListRoot = document.querySelector("[data-feedback-list]");
const reportListRoot = document.querySelector("[data-report-list]");

const analytics = loadAdminJson("mlm_analytics", {
  totalMessages: 0,
  totalLikes: 0,
  totalDislikes: 0,
  xpUsed: 0,
  dailyMessages: {},
  subjects: {},
  grades: {},
  feedback: [],
  savedSessions: 0
});
const users = loadAdminJson("mlm_users", []);
const likedMemory = loadAdminJson("mlm_liked_memory", []);
const dislikedMemory = loadAdminJson("mlm_disliked_memory", []);
const runtime = localStorage.getItem("mlm_runtime") || "vLLM Runtime";
const trainingMode = localStorage.getItem("mlm_training_mode") || "Prompt + RAG";
const safeAnalytics = {
  totalMessages: 0,
  totalLikes: 0,
  totalDislikes: 0,
  xpUsed: 0,
  dailyMessages: {},
  subjects: {},
  grades: {},
  feedback: [],
  savedSessions: 0,
  ...analytics
};

function loadAdminJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
}

function getTopEntry(record, fallback) {
  const sorted = Object.entries(record || {}).sort((a, b) => b[1] - a[1]);
  return sorted.length ? `${sorted[0][0]} (${sorted[0][1]})` : fallback;
}

function renderStats() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const stats = [
    { label: "عدد المستخدمين", value: users.length || 1, note: "إجمالي الحسابات الموجودة محليًا" },
    { label: "الرسائل اليومية", value: safeAnalytics.dailyMessages[todayKey] || 0, note: "عدد الرسائل اليوم" },
    { label: "الاشتراكات النشطة", value: users.filter((user) => user.status === "نشط").length || 1, note: "الحسابات الفعالة حاليًا" },
    { label: "استهلاك XP", value: safeAnalytics.xpUsed || 0, note: "الاستهلاك المتراكم داخل النموذج الأولي" },
    { label: "أكثر المواد استخدامًا", value: getTopEntry(safeAnalytics.subjects, "لا توجد بيانات"), note: "المادة الأعلى نشاطًا" },
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
  const rows = (users.length ? users : [
    {
      name: "طالب تجريبي",
      role: "Student",
      package: "مجاني محدود",
      xp: 120,
      status: "نشط",
      activity: "لا يوجد نشاط بعد"
    }
  ])
    .map(
      (user) => `
        <tr>
          <td>${user.name}</td>
          <td>${user.role}</td>
          <td>${user.package}</td>
          <td>${user.xp}</td>
          <td>${user.status}</td>
          <td>${user.activity}</td>
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
  const feedbackEntries = [
    ...likedMemory.slice(0, 3).map((item) => ({ type: "إعجاب", color: "إيجابي", ...item })),
    ...dislikedMemory.slice(0, 3).map((item) => ({ type: "لم يعجبني", color: "بحاجة مراجعة", ...item }))
  ];

  if (feedbackEntries.length === 0) {
    feedbackListRoot.innerHTML = `
      <div class="admin-item">
        <strong>لا توجد تفاعلات بعد</strong>
        <span>عندما يبدأ الطلاب تقييم الإجابات ستظهر هنا آخر الردود المعجبة أو غير المعجبة.</span>
      </div>
    `;
    return;
  }

  feedbackListRoot.innerHTML = feedbackEntries
    .map(
      (entry) => `
        <div class="admin-item">
          <strong>${entry.type} | ${entry.subject} | ${entry.lesson}</strong>
          <span>${entry.question}</span>
          <span>${entry.color}</span>
        </div>
      `
    )
    .join("");
}

function renderReports() {
  const reports = [
    `إجمالي الرسائل التعليمية: ${safeAnalytics.totalMessages || 0}.`,
    `الإعجابات: ${safeAnalytics.totalLikes || 0} | لم يعجبني: ${safeAnalytics.totalDislikes || 0}.`,
    `المحادثات المحفوظة للمراجعة: ${safeAnalytics.savedSessions || 0}.`,
    `أكثر نقطة تحتاج متابعة حاليًا: ${getTopEntry(safeAnalytics.subjects, "لا توجد مادة بارزة بعد")}.`,
    `المحرك المحلي المختار: ${runtime} مع طبقة سلوكية ${trainingMode}.`
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

renderStats();
renderUsersTable();
renderFeedback();
renderReports();
