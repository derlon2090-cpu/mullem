const authTabs = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll("[data-auth-panel]");
const loginForm = document.querySelector("[data-auth-login-form]");
const registerForm = document.querySelector("[data-auth-register-form]");
const forgotEmailForm = document.querySelector("[data-auth-forgot-email-form]");
const codeForm = document.querySelector("[data-auth-code-form]");
const resetForm = document.querySelector("[data-auth-reset-form]");
const authState = document.querySelector("[data-auth-state]");
const loginEmail = document.querySelector("[data-auth-login-email]");
const loginPassword = document.querySelector("[data-auth-login-password]");
const registerName = document.querySelector("[data-auth-register-name]");
const registerEmail = document.querySelector("[data-auth-register-email]");
const registerPassword = document.querySelector("[data-auth-register-password]");
const registerGrade = document.querySelector("[data-auth-register-grade]");
const forgotEmail = document.querySelector("[data-auth-forgot-email]");
const forgotCode = document.querySelector("[data-auth-code]");
const newPassword = document.querySelector("[data-auth-new-password]");
const confirmPassword = document.querySelector("[data-auth-confirm-password]");
const googleButton = document.querySelector("[data-auth-google]");
const forgotButton = document.querySelector("[data-auth-forgot]");
const backButton = document.querySelector("[data-auth-back]");
const scrollTopButton = document.querySelector("[data-scroll-top]");
const registerSubmitButton = document.querySelector("[data-register-submit]");

const storageKeys = {
  users: "mlm_users",
  currentUser: "mlm_current_user",
  adminSession: "mlm_admin_session",
  passwordReset: "mlm_password_reset",
  history: "mlm_chat_history",
  liked: "mlm_liked_answers",
  analytics: "mlm_analytics",
  aiLogs: "mlm_ai_logs",
  feedback: "mlm_feedback_log",
  sessions: "mlm_chat_sessions",
  activeSession: "mlm_active_session"
};

const adminCredentials = {
  email: "admin@mullem.sa",
  password: "Mullem@2026"
};

const googleAuthUrl = "https://accounts.google.com/v3/signin/accountchooser?client_id=310079877066-matp293bddarf3hnstcd4t86qcbn6st5.apps.googleusercontent.com&code_challenge=ukLxkUvQSTdXKMpvgFaNecXJL-OMuKYappJshQR2cPg&code_challenge_method=S256&redirect_uri=https%3A%2F%2Ffor-test.runasp.net%2Fsignin-google&response_type=code&scope=openid+profile+email&state=CfDJ8NrJmZRANOhNtI69Ce945adjwp7Isi5KvuQ686lo2OZSc7mi2ByPR9OIRUGFCuoM0GKoPmtPGFeYGfqDlBagKlGcJ1qUvEJLEiOmU25DbgjkOLah1Z0Gzft4zMYpXuZbV7x-msInU3yFey9MJaxAMUAeAnWauRWh82A4agHZRMixBPlcwn7n2OmqIf7kbkYoqwzLJwY53VCVu006sObab8ZFSSumssGv5MQvUZ9ycO4hYoD-5FZ3QoUtNBUcQ25_xpGRb1mhIHkLQo_zU3Ii8JZEPW3fzcbVPFxf_2JSCIuXpPBqZg9-i5y5ro6tQkPyDi28QA_OLXPIDyC7DM_2y8fdfp9j2XgMXckXIparQ2r3sTsuMVuM88hpQRMA-a8WZfnpGDTQ1GV65DFerR3mwzc&dsh=S1310616813%3A1774886189779982&o2v=2&service=lso&flowName=GeneralOAuthFlow&opparams=%253F&continue=https%3A%2F%2Faccounts.google.com%2Fsignin%2Foauth%2Fconsent%3Fauthuser%3Dunknown%26part%3DAJi8hANR2Ua5iZYW7V082zIowf-wy4291zvcivR3wVqEgNKV3AkS1VKhcamB2Ng3oYEDZ_XL4t2TtqFwiphRc9VlyZTXH4wPR6p2lRn0013lTgGpw4enahAV4RZ1d_zFZXsYHMTjSbFhQ67BNaN18tC_LuuNDkJl4QwCM4B3S0ez-xp6GtXe7hinveaGp4F27-DzParuNym9MRD3zsyqBciJdhf27YD4n5hDPTIDI5HW9LONlhZFhcttI9iKBB2upFy8oPTUZsdLy5WVvKUXliwTdMv1cfF3K9t5UNMYfTfql2yEqLXKM6QrZxUoTlgPYLWSaSQTtzAr-K8Adp39VHLFj3272eszFop82qR-1Kqfj5LD-WIrMvQCmcNnWmW_rvhtoc1NApna6nAW2f2WfPHM_N3fvWovjFPFvo3r61QSgw_R8yC0Pwf8yskjUkoJTTD5qcAlTTobhwQCZjU3aw1jB8ONQ8K2OQ%26flowName%3DGeneralOAuthFlow%26as%3DS1310616813%253A1774886189779982%26client_id%3D310079877066-matp293bddarf3hnstcd4t86qcbn6st5.apps.googleusercontent.com%26requestPath%3D%252Fsignin%252Foauth%252Fconsent%23&app_domain=https%3A%2F%2Ffor-test.runasp.net";

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

function loadUsers() {
  const stored = loadJson(storageKeys.users, []);
  if (stored.length) return stored;
  return [
    {
      id: "student-demo-1",
      name: "طالب تجريبي",
      email: "student@mullem.sa",
      password: "Student@2026",
      role: "Student",
      grade: "الثاني الثانوي",
      subject: "الرياضيات",
      package: "مجاني محدود",
      xp: 100,
      streakDays: 0,
      lastActiveDate: "",
      achievements: [],
      status: "نشط",
      activity: "بدأ استخدام المنصة"
    }
  ];
}

function saveUsers(users) {
  saveJson(storageKeys.users, users);
}

function setState(text) {
  if (authState) authState.textContent = text;
}

function setActivePanel(mode) {
  authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.getAttribute("data-auth-tab") === mode);
  });
  authPanels.forEach((panel) => {
    panel.hidden = panel.getAttribute("data-auth-panel") !== mode;
  });
}

function openAuthMode(mode) {
  setActivePanel(mode);
  if (mode === "register") {
    setState("أنشئ حسابك ثم ابدأ الشات مباشرة.");
    registerName?.focus();
    return;
  }
  if (mode === "forgot") {
    resetForgotFlow();
    setState("أدخل بريدك الإلكتروني لبدء استعادة كلمة المرور.");
    forgotEmail?.focus();
    return;
  }
  setState("أدخل بياناتك للوصول إلى المنصة.");
  loginEmail?.focus();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function ensureUserWorkspace(userId) {
  const keys = [
    [`${storageKeys.analytics}_${userId}`, { totalMessages: 0, xpUsed: 0, subjects: {}, likes: 0, dislikes: 0 }],
    [`${storageKeys.history}_${userId}`, []],
    [`${storageKeys.liked}_${userId}`, []],
    [`${storageKeys.aiLogs}_${userId}`, []],
    [`${storageKeys.feedback}_${userId}`, []],
    [`${storageKeys.sessions}_${userId}`, []]
  ];

  keys.forEach(([key, fallback]) => {
    if (!localStorage.getItem(key)) saveJson(key, fallback);
  });
  localStorage.removeItem(`${storageKeys.activeSession}_${userId}`);
}

function saveResetRequest(request) {
  saveJson(storageKeys.passwordReset, request);
}

function loadResetRequest() {
  return loadJson(storageKeys.passwordReset, null);
}

function syncScrollTopButton() {
  if (!scrollTopButton) return;
  scrollTopButton.classList.toggle("visible", window.scrollY > 220);
}

function resetForgotFlow() {
  if (forgotEmailForm) forgotEmailForm.hidden = false;
  if (codeForm) codeForm.hidden = true;
  if (resetForm) resetForm.hidden = true;
}

function redirectToStudent() {
  window.location.href = "student.html";
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    openAuthMode(tab.getAttribute("data-auth-tab") || "login");
  });
});

document.addEventListener("click", (event) => {
  const switchButton = event.target.closest("[data-auth-open]");
  if (!switchButton) return;
  const mode = switchButton.getAttribute("data-auth-open") || "login";
  openAuthMode(mode);
});

openAuthMode(new URLSearchParams(window.location.search).get("mode") || (window.location.hash === "#register" ? "register" : "login"));
resetForgotFlow();

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const email = (loginEmail?.value || "").trim().toLowerCase();
  const password = loginPassword?.value || "";

  if (!email || !password) {
    setState("أدخل البريد الإلكتروني وكلمة المرور أولًا.");
    return;
  }

  if (!isValidEmail(email)) {
    setState("البريد الإلكتروني غير صحيح.");
    return;
  }

  if (email === adminCredentials.email && password === adminCredentials.password) {
    localStorage.setItem(storageKeys.adminSession, "1");
    localStorage.removeItem(storageKeys.currentUser);
    setState("تم تسجيل دخول الأدمن بنجاح. سيتم تحويلك الآن.");
    window.location.href = "admin.html";
    return;
  }

  const userByEmail = loadUsers().find((entry) => entry.email.toLowerCase() === email);
  if (!userByEmail) {
    setState("البريد الإلكتروني غير مسجل في المنصة.");
    return;
  }

  if (userByEmail.password !== password) {
    setState("كلمة المرور غير صحيحة.");
    return;
  }

  const user = userByEmail;
  if (!user) {
    setState("كلمة المرور غير صحيحة أو الحساب غير موجود.");
    return;
  }

  localStorage.removeItem(storageKeys.adminSession);
  localStorage.setItem(storageKeys.currentUser, user.id);
  ensureUserWorkspace(user.id);
  setState(`أهلًا ${user.name}، تم تسجيل الدخول بنجاح.`);
  redirectToStudent();
});

registerForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = (registerName?.value || "").trim();
  const email = (registerEmail?.value || "").trim().toLowerCase();
  const password = registerPassword?.value || "";
  const grade = registerGrade?.value || "الثاني الثانوي";

  if (!name || !email || !password) {
    setState("أكمل جميع الحقول أولًا.");
    return;
  }

  if (!isValidEmail(email)) {
    setState("البريد الإلكتروني غير صحيح.");
    return;
  }

  if (password.length < 6) {
    setState("كلمة المرور يجب أن تكون 6 أحرف أو أكثر.");
    return;
  }

  const users = loadUsers();
  if (users.some((entry) => entry.email.toLowerCase() === email)) {
    setState("هذا البريد مسجل مسبقًا.");
    return;
  }

  const user = {
    id: `student-${Date.now()}`,
    name,
    email,
    password,
    role: "Student",
    grade,
    subject: "الرياضيات",
    package: "مجاني محدود",
    xp: 100,
    streakDays: 0,
    lastActiveDate: "",
    achievements: [],
    status: "نشط",
    activity: "أنشأ حسابًا جديدًا"
  };

  users.unshift(user);
  saveUsers(users);
  localStorage.removeItem(storageKeys.adminSession);
  localStorage.setItem(storageKeys.currentUser, user.id);
  ensureUserWorkspace(user.id);
  setState(`تم إنشاء الحساب بنجاح يا ${name}. سيتم تحويلك الآن.`);
  redirectToStudent();
});

forgotButton?.addEventListener("click", () => {
  openAuthMode("forgot");
});

backButton?.addEventListener("click", () => {
  openAuthMode("login");
});

forgotEmailForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = (forgotEmail?.value || "").trim().toLowerCase();
  const user = loadUsers().find((entry) => entry.email.toLowerCase() === email);

  if (!email) {
    setState("أدخل بريدك الإلكتروني أولًا.");
    return;
  }

  if (!isValidEmail(email)) {
    setState("البريد الإلكتروني غير صحيح.");
    return;
  }

  if (!user) {
    setState("لا يوجد حساب مرتبط بهذا البريد.");
    return;
  }

  const code = generateResetCode();
  saveResetRequest({ email, code, verified: false });
  if (forgotEmailForm) forgotEmailForm.hidden = true;
  if (codeForm) codeForm.hidden = false;
  setState(`تم إنشاء كود التحقق: ${code} — هذه نسخة تجريبية داخل الموقع.`);
});

codeForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const request = loadResetRequest();
  if (!request) {
    setState("ابدأ من خطوة البريد الإلكتروني أولًا.");
    return;
  }

  if ((forgotCode?.value || "").trim() !== request.code) {
    setState("كود التحقق غير صحيح.");
    return;
  }

  saveResetRequest({ ...request, verified: true });
  if (codeForm) codeForm.hidden = true;
  if (resetForm) resetForm.hidden = false;
  setState("تم التحقق من الكود. اكتب كلمة المرور الجديدة الآن.");
});

resetForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const request = loadResetRequest();
  if (!request?.verified) {
    setState("أكمل التحقق أولًا.");
    return;
  }

  if ((newPassword?.value || "").length < 6) {
    setState("كلمة المرور الجديدة يجب أن تكون 6 أحرف أو أكثر.");
    return;
  }

  if ((newPassword?.value || "") !== (confirmPassword?.value || "")) {
    setState("كلمتا المرور غير متطابقتين.");
    return;
  }

  const users = loadUsers().map((user) =>
    user.email.toLowerCase() === request.email
      ? { ...user, password: newPassword.value }
      : user
  );

  saveUsers(users);
  localStorage.removeItem(storageKeys.passwordReset);
  setActivePanel("login");
  resetForgotFlow();
  setState("تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.");
});

googleButton?.addEventListener("click", () => {
  window.location.href = googleAuthUrl;
});

registerSubmitButton?.addEventListener("click", () => {
  registerForm?.requestSubmit();
});

window.addEventListener("scroll", syncScrollTopButton, { passive: true });
scrollTopButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
syncScrollTopButton();
