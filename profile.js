const profileStorageKeys = {
  theme: "mlm_theme",
  users: "mlm_users",
  currentUser: "mlm_current_user",
  history: "mlm_chat_history",
  analytics: "mlm_analytics",
  liked: "mlm_liked_answers",
  feedback: "mlm_feedback_log",
  aiLogs: "mlm_ai_logs",
  resumePrompt: "mlm_resume_prompt"
};

const profileElements = {
  themeToggle: document.querySelector("[data-theme-toggle]"),
  scrollTop: document.querySelector("[data-scroll-top]"),
  xp: document.querySelector("[data-profile-xp]"),
  name: document.querySelector("[data-profile-name]"),
  grade: document.querySelector("[data-profile-grade]"),
  greeting: document.querySelector("[data-profile-greeting]"),
  intro: document.querySelector("[data-profile-intro]"),
  streak: document.querySelector("[data-profile-streak]"),
  streakNote: document.querySelector("[data-profile-streak-note]"),
  goal: document.querySelector("[data-profile-goal]"),
  motivationFill: document.querySelector("[data-motivation-fill]"),
  motivation: document.querySelector("[data-profile-motivation]"),
  statQuestions: document.querySelector("[data-stat-questions]"),
  statAccuracy: document.querySelector("[data-stat-accuracy]"),
  statBest: document.querySelector("[data-stat-best]"),
  statWeak: document.querySelector("[data-stat-weak]"),
  strength: document.querySelector("[data-profile-strength]"),
  weakness: document.querySelector("[data-profile-weakness]"),
  achievements: document.querySelector("[data-achievements]"),
  history: document.querySelector("[data-profile-history]"),
  tests: document.querySelector("[data-profile-tests]")
};

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return loadJson(profileStorageKeys.users, []);
}

function getActiveUser() {
  const currentId = localStorage.getItem(profileStorageKeys.currentUser);
  return getUsers().find((user) => user.id === currentId) || null;
}

function getScopedKey(baseKey, userId) {
  return `${baseKey}_${userId}`;
}

function getTodayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function diffDays(fromStamp, toStamp) {
  if (!fromStamp || !toStamp) return 0;
  const from = new Date(`${fromStamp}T00:00:00`);
  const to = new Date(`${toStamp}T00:00:00`);
  return Math.round((to - from) / 86400000);
}

function updateUserRecord(activeUser, partial) {
  const users = getUsers().map((user) => (user.id === activeUser.id ? { ...user, ...partial } : user));
  saveJson(profileStorageKeys.users, users);
  return users.find((user) => user.id === activeUser.id) || null;
}

function syncUserStreakOnVisit(activeUser) {
  if (!activeUser) return null;
  const today = getTodayStamp();
  const lastActiveDate = activeUser.lastActiveDate || "";
  if (lastActiveDate === today) return activeUser;

  let streakDays = activeUser.streakDays ?? 0;
  if (!lastActiveDate) {
    streakDays = 1;
  } else {
    const gap = diffDays(lastActiveDate, today);
    if (gap === 1) streakDays += 1;
    else if (gap > 1) streakDays = 0;
  }

  const achievements = Array.isArray(activeUser.achievements) ? [...activeUser.achievements] : [];
  if (streakDays >= 5 && !achievements.includes("5_days_streak")) achievements.push("5_days_streak");
  if (streakDays >= 30 && !achievements.includes("30_days_streak")) achievements.push("30_days_streak");

  return updateUserRecord(activeUser, {
    streakDays,
    lastActiveDate: today,
    motivationGoal: 30,
    achievements,
    activity: streakDays
      ? `يحافظ على سلسلة الحماس منذ ${streakDays} يوم`
      : "عاد إلى المنصة بعد انقطاع"
  });
}

function applyTheme(theme) {
  document.body.classList.toggle("theme-dark", theme === "dark");
}

function syncScrollTopButton() {
  if (!profileElements.scrollTop) return;
  profileElements.scrollTop.classList.toggle("visible", window.scrollY > 240);
}

function formatDate(timestamp) {
  if (!timestamp) return "الآن";
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(timestamp));
}

function getSubjectStats(subjects = {}) {
  const entries = Object.entries(subjects).sort((a, b) => b[1] - a[1]);
  return {
    best: entries[0]?.[0] || "",
    weak: entries.length > 1 ? entries[entries.length - 1][0] : entries[0]?.[0] || ""
  };
}

function calculateAccuracy(analytics) {
  const totalReviews = (analytics.likes || 0) + (analytics.dislikes || 0);
  if (!totalReviews) return 0;
  return Math.round(((analytics.likes || 0) / totalReviews) * 100);
}

function renderAchievements(data) {
  const achievementConfig = [
    {
      id: "first_50_questions",
      title: "حل أول 50 سؤال",
      unlocked: (data.analytics.totalMessages || 0) >= 50
    },
    {
      id: "5_days_streak",
      title: "5 أيام متتالية",
      unlocked: (data.user.streakDays || 0) >= 5 || (data.user.achievements || []).includes("5_days_streak")
    },
    {
      id: "first_quiz_complete",
      title: "أول اختبار كامل",
      unlocked: data.tests.length >= 1
    },
    {
      id: "30_days_streak",
      title: "شارة 30 يوم",
      unlocked: (data.user.streakDays || 0) >= 30 || (data.user.achievements || []).includes("30_days_streak")
    }
  ];

  profileElements.achievements.innerHTML = achievementConfig
    .map(
      (item) => `
        <div class="achievement-chip ${item.unlocked ? "unlocked" : ""}">
          <strong>${item.unlocked ? "🏆" : "⏳"} ${item.title}</strong>
          <span>${item.unlocked ? "تم فتحها" : "تابع التدريب لفتحها"}</span>
        </div>
      `
    )
    .join("");
}

function renderHistory(items) {
  if (!profileElements.history) return;
  if (!items.length) {
    profileElements.history.innerHTML = `
      <div class="history-card">
        <strong>لا يوجد سجل تعلم محفوظ بعد</strong>
        <span>ابدأ أول سؤال بعد تسجيل الدخول، وسيظهر هنا لتتمكن من العودة إليه لاحقًا.</span>
      </div>
    `;
    return;
  }

  profileElements.history.innerHTML = items
    .slice(0, 8)
    .map(
      (item) => `
        <article class="history-card">
          <div class="history-card-head">
            <strong>${item.subject || "عام"}</strong>
            <span>${formatDate(item.time)}</span>
          </div>
          <p>${item.question}</p>
          <div class="history-card-meta">
            <span>${item.questionType || "سؤال دراسي"}</span>
            <span>${item.status || "تمت المراجعة"}</span>
          </div>
          <button class="mini-btn" type="button" data-resume-prompt="${item.question}">أكمل من هنا</button>
        </article>
      `
    )
    .join("");
}

function renderTests(tests) {
  if (!profileElements.tests) return;
  if (!tests.length) {
    profileElements.tests.innerHTML = `
      <div class="history-card">
        <strong>لا توجد اختبارات محفوظة بعد</strong>
        <span>عندما تطلب اختبارًا قصيرًا أو تدريبًا على درس معين سيظهر هنا.</span>
      </div>
    `;
    return;
  }

  profileElements.tests.innerHTML = tests
    .slice(0, 6)
    .map(
      (item, index) => `
        <article class="history-card">
          <div class="history-card-head">
            <strong>اختبار ${item.subject || "عام"} #${index + 1}</strong>
            <span>${formatDate(item.createdAt)}</span>
          </div>
          <p>${item.question}</p>
          <div class="history-card-meta">
            <span>الوضع: ${item.responseMode || "اختبار"}</span>
            <span>${item.scopeStatus === "match" ? "ضمن النطاق" : "بحاجة إلى تأكيد"}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function bootstrapProfile() {
  applyTheme(localStorage.getItem(profileStorageKeys.theme) || "light");
  let activeUser = getActiveUser();
  if (!activeUser) {
    window.location.href = "login.html";
    return;
  }

  activeUser = syncUserStreakOnVisit(activeUser) || activeUser;

  const analytics = loadJson(getScopedKey(profileStorageKeys.analytics, activeUser.id), {
    totalMessages: 0,
    xpUsed: 0,
    subjects: {},
    likes: 0,
    dislikes: 0
  });
  const history = loadJson(getScopedKey(profileStorageKeys.history, activeUser.id), []);
  const aiLogs = loadJson(getScopedKey(profileStorageKeys.aiLogs, activeUser.id), []);
  const tests = aiLogs.filter((item) => (item.responseMode || "").includes("quiz") || item.intent === "quiz");
  const stats = getSubjectStats(analytics.subjects || {});
  const accuracy = calculateAccuracy(analytics);
  const streakGoal = activeUser.motivationGoal || 30;
  const streakDays = activeUser.streakDays || 0;
  const remainingDays = Math.max(0, streakGoal - streakDays);

  if (profileElements.xp) profileElements.xp.textContent = String(activeUser.xp ?? 0);
  if (profileElements.name) profileElements.name.textContent = activeUser.name || "طالب ملم";
  if (profileElements.grade) {
    profileElements.grade.textContent = `${activeUser.grade || "لم يحدد الصف"} • ${stats.best || activeUser.subject || "المادة تتحدد من استخدامك"}`;
  }
  if (profileElements.greeting) {
    profileElements.greeting.textContent = `أهلًا ${activeUser.name || ""} 👋 لديك سلسلة حماس ${streakDays} يوم`;
  }
  if (profileElements.intro) {
    profileElements.intro.textContent = remainingDays
      ? `باقي لك ${remainingDays} يوم للوصول إلى شارة الحماس الكبرى. هل تريد إكمال تدريبك اليوم؟`
      : "رائع، وصلت إلى هدفك اليومي. استمر لتحافظ على الشارة.";
  }
  if (profileElements.streak) profileElements.streak.textContent = String(streakDays);
  if (profileElements.streakNote) {
    profileElements.streakNote.textContent = streakDays
      ? `إذا انقطعت يومًا واحدًا فستعود السلسلة إلى الصفر، فحافظ عليها اليوم.`
      : "ابدأ اليوم بأول سؤال حتى تتكوّن سلسلة الحماس.";
  }
  if (profileElements.goal) profileElements.goal.textContent = `الهدف: ${streakGoal} يوم`;
  if (profileElements.motivationFill) {
    profileElements.motivationFill.style.width = `${Math.min(100, Math.round((streakDays / streakGoal) * 100))}%`;
  }
  if (profileElements.motivation) {
    profileElements.motivation.textContent = streakDays
      ? `دخلت ${streakDays} يومًا متتاليًا 🔥 استمر حتى تصل إلى ${streakGoal} يوم وتحصل على الشارة.`
      : "سلسلة الحماس تبدأ من أول يوم دخول بعد التسجيل. اسأل اليوم وابدأ البناء.";
  }
  if (profileElements.statQuestions) profileElements.statQuestions.textContent = String(analytics.totalMessages || 0);
  if (profileElements.statAccuracy) profileElements.statAccuracy.textContent = `${accuracy}%`;
  if (profileElements.statBest) profileElements.statBest.textContent = stats.best || "لم تتحدد بعد";
  if (profileElements.statWeak) profileElements.statWeak.textContent = stats.weak || "لم تتحدد بعد";
  if (profileElements.strength) profileElements.strength.textContent = stats.best || "تتحدد بعد عدة أسئلة وتقييمات.";
  if (profileElements.weakness) {
    profileElements.weakness.textContent = stats.weak
      ? `${stats.weak} وتحتاج مراجعة إضافية وأسئلة أكثر.`
      : "لا توجد مادة ضعيفة واضحة حتى الآن.";
  }

  renderAchievements({ user: activeUser, analytics, tests });
  renderHistory(history);
  renderTests(tests);

  profileElements.themeToggle?.addEventListener("click", () => {
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    localStorage.setItem(profileStorageKeys.theme, next);
    applyTheme(next);
  });

  document.addEventListener("click", (event) => {
    const resumeButton = event.target.closest("[data-resume-prompt]");
    if (!resumeButton) return;
    localStorage.setItem(profileStorageKeys.resumePrompt, resumeButton.getAttribute("data-resume-prompt") || "");
    window.location.href = "student.html";
  });

  window.addEventListener("scroll", syncScrollTopButton, { passive: true });
  profileElements.scrollTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  syncScrollTopButton();
}

bootstrapProfile();

(async () => {
  const apiClient =
    window.mullemApiClient && typeof window.mullemApiClient.getStudentDashboard === "function"
      ? window.mullemApiClient
      : null;

  const activeUser = getActiveUser();
  if (!apiClient || !apiClient.hasToken() || !activeUser) {
    return;
  }

  try {
    const result = await apiClient.getStudentDashboard();
    if (!result.ok || !result.data?.user) {
      return;
    }

    updateUserRecord(activeUser, {
      ...activeUser,
      ...result.data.user,
      streakDays: Number.isFinite(Number(result.data.user.streakDays))
        ? Number(result.data.user.streakDays)
        : activeUser.streakDays,
      lastActiveDate: result.data.user.lastActiveDate || activeUser.lastActiveDate,
    });

    bootstrapProfile();
  } catch (_) {
    // Keep the local profile snapshot if API sync fails.
  }
})();
