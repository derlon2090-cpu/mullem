const authTabs = document.querySelectorAll("[data-auth-tab]");
const authPanels = document.querySelectorAll("[data-auth-panel]");
const loginForm = document.querySelector("[data-auth-login-form]");
const registerForm = document.querySelector("[data-auth-register-form]");
const forgotEmailForm = document.querySelector("[data-auth-forgot-email-form]");
const codeForm = document.querySelector("[data-auth-code-form]");
const resetForm = document.querySelector("[data-auth-reset-form]");
const verifyForm = document.querySelector("[data-auth-verify-form]");
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
const verifyCodeInput = document.querySelector("[data-auth-verify-code]");
const verifyCopy = document.querySelector("[data-auth-verify-copy]");
const verifyNote = document.querySelector("[data-auth-verify-note]");
const googleButton = document.querySelector("[data-auth-google]");
const forgotButton = document.querySelector("[data-auth-forgot]");
const backButton = document.querySelector("[data-auth-back]");
const scrollTopButton = document.querySelector("[data-scroll-top]");
const registerSubmitButton = document.querySelector("[data-register-submit]");
const passwordToggleButtons = document.querySelectorAll("[data-password-toggle]");

const storageKeys = {
  users: "mlm_users",
  currentUser: "mlm_current_user",
  adminSession: "mlm_admin_session",
  passwordReset: "mlm_password_reset",
  pendingAuth: "mlm_pending_auth",
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

try {
  const activeAdminSession = localStorage.getItem(storageKeys.adminSession);
  const activeUserId = localStorage.getItem(storageKeys.currentUser);
  if (activeAdminSession === "1") {
    window.location.href = "admin.html";
  } else if (activeUserId && !window.location.pathname.endsWith("admin.html")) {
    window.location.href = "student.html";
  }
} catch (_) {
  // Ignore storage access issues on auth bootstrap.
}

const googleAuthUrl = "https://accounts.google.com/v3/signin/accountchooser?client_id=310079877066-matp293bddarf3hnstcd4t86qcbn6st5.apps.googleusercontent.com&code_challenge=ukLxkUvQSTdXKMpvgFaNecXJL-OMuKYappJshQR2cPg&code_challenge_method=S256&redirect_uri=https%3A%2F%2Ffor-test.runasp.net%2Fsignin-google&response_type=code&scope=openid+profile+email&state=CfDJ8NrJmZRANOhNtI69Ce945adjwp7Isi5KvuQ686lo2OZSc7mi2ByPR9OIRUGFCuoM0GKoPmtPGFeYGfqDlBagKlGcJ1qUvEJLEiOmU25DbgjkOLah1Z0Gzft4zMYpXuZbV7x-msInU3yFey9MJaxAMUAeAnWauRWh82A4agHZRMixBPlcwn7n2OmqIf7kbkYoqwzLJwY53VCVu006sObab8ZFSSumssGv5MQvUZ9ycO4hYoD-5FZ3QoUtNBUcQ25_xpGRb1mhIHkLQo_zU3Ii8JZEPW3fzcbVPFxf_2JSCIuXpPBqZg9-i5y5ro6tQkPyDi28QA_OLXPIDyC7DM_2y8fdfp9j2XgMXckXIparQ2r3sTsuMVuM88hpQRMA-a8WZfnpGDTQ1GV65DFerR3mwzc&dsh=S1310616813%3A1774886189779982&o2v=2&service=lso&flowName=GeneralOAuthFlow&opparams=%253F&continue=https%3A%2F%2Faccounts.google.com%2Fsignin%2Foauth%2Fconsent%3Fauthuser%3Dunknown%26part%3DAJi8hANR2Ua5iZYW7V082zIowf-wy4291zvcivR3wVqEgNKV3AkS1VKhcamB2Ng3oYEDZ_XL4t2TtqFwiphRc9VlyZTXH4wPR6p2lRn0013lTgGpw4enahAV4RZ1d_zFZXsYHMTjSbFhQ67BNaN18tC_LuuNDkJl4QwCM4B3S0ez-xp6GtXe7hinveaGp4F27-DzParuNym9MRD3zsyqBciJdhf27YD4n5hDPTIDI5HW9LONlhZFhcttI9iKBB2upFy8oPTUZsdLy5WVvKUXliwTdMv1cfF3K9t5UNMYfTfql2yEqLXKM6QrZxUoTlgPYLWSaSQTtzAr-K8Adp39VHLFj3272eszFop82qR-1Kqfj5LD-WIrMvQCmcNnWmW_rvhtoc1NApna6nAW2f2WfPHM_N3fvWovjFPFvo3r61QSgw_R8yC0Pwf8yskjUkoJTTD5qcAlTTobhwQCZjU3aw1jB8ONQ8K2OQ%26flowName%3DGeneralOAuthFlow%26as%3DS1310616813%253A1774886189779982%26client_id%3D310079877066-matp293bddarf3hnstcd4t86qcbn6st5.apps.googleusercontent.com%26requestPath%3D%252Fsignin%252Foauth%252Fconsent%23&app_domain=https%3A%2F%2Ffor-test.runasp.net";

function getApiClient() {
  return window.mullemApiClient && typeof window.mullemApiClient.request === "function"
    ? window.mullemApiClient
    : null;
}

function inferStageFromGrade(grade) {
  const value = String(grade || "").trim();
  if (!value) return "";
  if (value.includes("ابتدائي")) return "ابتدائي";
  if (value.includes("متوسط")) return "متوسط";
  if (value.includes("ثانوي")) return "ثانوي";
  return "";
}

function normalizeApiUserForLocal(user) {
  const existing = loadUsers().find((entry) => String(entry.id) === String(user?.id));
  return {
    ...(existing || {}),
    id: String(user?.id ?? existing?.id ?? `student-${Date.now()}`),
    name: user?.name || existing?.name || "",
    email: String(user?.email || existing?.email || "").toLowerCase(),
    password: existing?.password || "",
    role: String(user?.role || existing?.role || "student").toLowerCase() === "admin" ? "Admin" : "Student",
    stage: user?.stage || existing?.stage || inferStageFromGrade(user?.grade || existing?.grade || ""),
    grade: user?.grade || existing?.grade || "",
    subject: existing?.subject || "الرياضيات",
    package: existing?.package || "API Connected",
    xp: Number.isFinite(Number(existing?.xp)) ? Number(existing.xp) : 100,
    streakDays: Number.isFinite(Number(existing?.streakDays)) ? Number(existing.streakDays) : 0,
    lastActiveDate: existing?.lastActiveDate || "",
    achievements: Array.isArray(existing?.achievements) ? existing.achievements : [],
    status: existing?.status || (String(user?.status || "").toLowerCase() === "active" ? "نشط" : String(user?.status || "نشط")),
    activity: existing?.activity || "تمت مزامنة الحساب مع الخادم"
  };
}

function upsertApiUserLocally(user) {
  const normalizedUser = normalizeApiUserForLocal(user);
  const nextUsers = [
    normalizedUser,
    ...loadUsers().filter((entry) => String(entry.id) !== String(normalizedUser.id))
  ];
  saveUsers(nextUsers);
  return normalizedUser;
}

function completeStudentApiLogin(user, message) {
  const normalizedUser = upsertApiUserLocally(user);
  localStorage.removeItem(storageKeys.adminSession);
  localStorage.setItem(storageKeys.currentUser, normalizedUser.id);
  ensureUserWorkspace(normalizedUser.id);
  clearPendingAuth();
  setState(message || `أهلًا ${normalizedUser.name}، تم تسجيل الدخول بنجاح عبر الخادم.`);
  redirectToStudent();
}

function completeAdminApiLogin(message) {
  localStorage.setItem(storageKeys.adminSession, "1");
  localStorage.removeItem(storageKeys.currentUser);
  clearPendingAuth();
  setState(message || "تم تسجيل دخول الأدمن بنجاح عبر الخادم.");
  window.location.href = "admin.html";
}

function shouldFallbackToLocalAuth(result) {
  return !result || result.serverUnavailable;
}

function findLocalUserByEmail(email) {
  return loadUsers().find((entry) => entry.email.toLowerCase() === String(email || "").trim().toLowerCase()) || null;
}

function findLocalUserByEmailAndPassword(email, password) {
  const user = findLocalUserByEmail(email);
  if (!user || user.password !== password) return null;
  return user;
}

async function importLegacyUserToApi(apiClient, user) {
  if (!apiClient || typeof apiClient.importLegacyUsers !== "function" || !user?.email || !user?.password) {
    return { ok: false };
  }

  return apiClient.importLegacyUsers([
    {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      stage: user.stage,
      grade: user.grade,
      subject: user.subject,
      package: user.package,
      packageKey: user.packageKey,
      xp: user.xp,
      streakDays: user.streakDays,
      motivationScore: user.motivationScore,
      lastActiveDate: user.lastActiveDate,
      achievements: user.achievements,
      status: user.status,
      activity: user.activity
    }
  ]);
}

function handleLocalLoginFallback(email, password) {
  const matchingLocalUser = findLocalUserByEmailAndPassword(email, password);
  if (matchingLocalUser) {
    setState("الحساب موجود محليًا فقط حاليًا. أعد المحاولة بعد عودة الخادم ليتم ترحيله إلى قاعدة البيانات.");
    return;
  }

  setState("الخادم غير متاح الآن، لذلك لا يمكن تسجيل الدخول قبل الاتصال بقاعدة البيانات.");
}

function handleLocalRegisterFallback(name, email, password, grade) {
  setState("الخادم غير متاح الآن، لذلك لا يمكن إنشاء الحساب إلا بعد الاتصال بقاعدة البيانات.");
}

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
  if (mode === "verify") {
    renderPendingAuth(loadPendingAuth());
    return;
  }
  if (mode === "register") {
    clearPendingAuth();
    if (verifyNote) verifyNote.hidden = true;
    setState("أنشئ حسابك ثم أدخل رمز التحقق لإكمال الدخول إلى المنصة.");
    registerName?.focus();
    return;
  }
  if (mode === "forgot") {
    clearPendingAuth();
    if (verifyNote) verifyNote.hidden = true;
    resetForgotFlow();
    setState("أدخل بريدك الإلكتروني لبدء استعادة كلمة المرور.");
    forgotEmail?.focus();
    return;
  }
  clearPendingAuth();
  if (verifyNote) verifyNote.hidden = true;
  setState("أدخل بياناتك ثم أكمل التحقق للوصول إلى المنصة.");
  loginEmail?.focus();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateVerificationCode() {
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

function savePendingAuth(request) {
  saveJson(storageKeys.pendingAuth, request);
}

function loadPendingAuth() {
  return loadJson(storageKeys.pendingAuth, null);
}

function clearPendingAuth() {
  localStorage.removeItem(storageKeys.pendingAuth);
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

function renderPendingAuth(request) {
  if (!request) return;
  if (verifyCopy) {
    verifyCopy.textContent =
      request.flow === "register"
        ? `أدخل رمز التحقق لإتمام إنشاء حساب ${request.name || ""} والدخول إلى المنصة.`
        : `أدخل رمز التحقق لإكمال الدخول إلى حساب ${request.email || ""}.`;
  }

  if (verifyNote) {
    verifyNote.hidden = false;
    verifyNote.textContent = `تم تجهيز رمز تحقق لهذا البريد. في النسخة الحالية من المنصة سيظهر لك الرمز هنا إلى حين ربط خدمة بريد فعلية: ${request.code}`;
  }
}

function startAuthVerification(request) {
  savePendingAuth(request);
  renderPendingAuth(request);
  setActivePanel("verify");
  if (verifyCodeInput) {
    verifyCodeInput.value = "";
    verifyCodeInput.focus();
  }
  setState(
    request.flow === "register"
      ? "أدخل رمز التحقق لإتمام إنشاء الحساب والدخول إلى المنصة."
      : "أدخل رمز التحقق لإكمال تسجيل الدخول إلى حسابك."
  );
}

function redirectToStudent() {
  window.location.href = "student.html";
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
bindPasswordToggles();

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  const email = (loginEmail?.value || "").trim().toLowerCase();
  const password = loginPassword?.value || "";
  const apiClient = getApiClient();

  if (!email || !password) {
    setState("أدخل البريد الإلكتروني وكلمة المرور أولًا.");
    return;
  }

  if (!isValidEmail(email)) {
    setState("البريد الإلكتروني غير صحيح.");
    return;
  }

  if (!apiClient) {
    handleLocalLoginFallback(email, password);
    return;
  }

  let apiResult = await apiClient.login({
    email,
    password,
    device_name: "mullem-web"
  });

  if (shouldFallbackToLocalAuth(apiResult)) {
    handleLocalLoginFallback(email, password);
    return;
  }

  if (!apiResult.ok && /invalid email or password|البريد الإلكتروني أو كلمة المرور غير صحيحة/i.test(apiResult.message || "")) {
    const matchingLocalUser = findLocalUserByEmailAndPassword(email, password);
    if (matchingLocalUser) {
      const importResult = await importLegacyUserToApi(apiClient, matchingLocalUser);
      if (importResult?.ok) {
        apiResult = await apiClient.login({
          email,
          password,
          device_name: "mullem-web"
        });
      }
    }
  }

  if (!apiResult.ok && /النظام القديم|legacy/i.test(apiResult.message || "")) {
    if (forgotEmail) forgotEmail.value = email;
    openAuthMode("forgot");
    setState(apiResult.message);
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  if (apiResult.ok && apiResult.data?.user) {
    if (String(apiResult.data.user.role || "").toLowerCase() === "admin") {
      completeAdminApiLogin("تم تسجيل دخول الأدمن بنجاح.");
      return;
    }

    completeStudentApiLogin(
      apiResult.data.user,
      `أهلًا ${apiResult.data.user.name || ""}، تم تسجيل الدخول بنجاح.`
    );
    return;
  }

  setState(apiResult.message || "تعذر تسجيل الدخول. تحقق من البيانات ثم حاول مرة أخرى.");
}, { capture: true });

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  const name = (registerName?.value || "").trim();
  const email = (registerEmail?.value || "").trim().toLowerCase();
  const password = registerPassword?.value || "";
  const grade = registerGrade?.value || "الثاني الثانوي";
  const apiClient = getApiClient();

  if (!name || !email || !password) {
    setState("أكمل جميع الحقول أولًا.");
    return;
  }

  if (!isValidEmail(email)) {
    setState("البريد الإلكتروني غير صحيح.");
    return;
  }

  if (!apiClient) {
    handleLocalRegisterFallback(name, email, password, grade);
    return;
  }

  let apiResult = await apiClient.register({
    name,
    email,
    password,
    password_confirmation: password,
    grade,
    stage: inferStageFromGrade(grade),
    device_name: "mullem-web"
  });

  if (shouldFallbackToLocalAuth(apiResult)) {
    handleLocalRegisterFallback(name, email, password, grade);
    return;
  }

  if (!apiResult.ok && /هذا البريد مسجل بالفعل|already registered/i.test(apiResult.message || "")) {
    const matchingLocalUser = findLocalUserByEmailAndPassword(email, password);
    if (matchingLocalUser) {
      const importResult = await importLegacyUserToApi(apiClient, matchingLocalUser);
      if (importResult?.ok) {
        const retryLogin = await apiClient.login({
          email,
          password,
          device_name: "mullem-web"
        });

        if (retryLogin.ok && retryLogin.data?.user) {
          completeStudentApiLogin(
            retryLogin.data.user,
            `تمت مزامنة الحساب القديم بنجاح يا ${retryLogin.data.user.name || name}.`
          );
          return;
        }
      }
    }
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  if (apiResult.ok && apiResult.data?.user) {
    completeStudentApiLogin(
      apiResult.data.user,
      `تم إنشاء الحساب بنجاح يا ${apiResult.data.user.name || name}.`
    );
    return;
  }

  setState(apiResult.message || "تعذر إنشاء الحساب الآن. تحقق من البيانات ثم حاول مرة أخرى.");
}, { capture: true });

forgotButton?.addEventListener("click", () => {
  openAuthMode("forgot");
});

backButton?.addEventListener("click", () => {
  openAuthMode("login");
});

forgotEmailForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = (forgotEmail?.value || "").trim().toLowerCase();
  const apiClient = getApiClient();

  if (!email) {
    setState("أدخل بريدك الإلكتروني أولًا.");
    return;
  }

  if (!isValidEmail(email)) {
    setState("البريد الإلكتروني غير صحيح.");
    return;
  }

  if (!apiClient || typeof apiClient.requestPasswordReset !== "function") {
    setState("الخادم غير متاح الآن، لذلك لا يمكن استعادة كلمة المرور.");
    return;
  }

  const result = await apiClient.requestPasswordReset({ email });
  if (!result.ok) {
    const localUser = findLocalUserByEmail(email);
    if (localUser?.password) {
      const importResult = await importLegacyUserToApi(apiClient, localUser);
      if (importResult?.ok) {
        const retryResult = await apiClient.requestPasswordReset({ email });
        if (retryResult.ok) {
          const retryCode = String(retryResult.data?.reset_code || "");
          saveResetRequest({ email, code: retryCode, verified: false });
          if (forgotEmailForm) forgotEmailForm.hidden = true;
          if (codeForm) codeForm.hidden = false;
          setState(
            retryCode
              ? `تم تجهيز رمز التحقق: ${retryCode} - هذه النسخة التجريبية تعرض الرمز داخل الموقع.`
              : "تم إرسال رمز التحقق إلى بريدك الإلكتروني."
          );
          return;
        }
      }
    }

    setState(result.message || "تعذر إرسال رمز استعادة كلمة المرور.");
    return;
  }

  const code = String(result.data?.reset_code || "");
  saveResetRequest({ email, code, verified: false });
  if (forgotEmailForm) forgotEmailForm.hidden = true;
  if (codeForm) codeForm.hidden = false;
  setState(
    code
      ? `تم تجهيز رمز التحقق: ${code} - هذه النسخة التجريبية تعرض الرمز داخل الموقع.`
      : "تم إرسال رمز التحقق إلى بريدك الإلكتروني."
  );
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

resetForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const request = loadResetRequest();
  const apiClient = getApiClient();
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

  if (!apiClient || typeof apiClient.resetPassword !== "function") {
    setState("الخادم غير متاح الآن، لذلك لا يمكن تحديث كلمة المرور.");
    return;
  }

  const result = await apiClient.resetPassword({
    email: request.email,
    code: request.code,
    password: newPassword.value,
    password_confirmation: confirmPassword.value
  });

  if (!result.ok) {
    setState(result.message || "تعذر تحديث كلمة المرور الآن.");
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
  setState(result.message || "تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.");
});

verifyForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const request = loadPendingAuth();
  if (!request) {
    setState("لا يوجد طلب تحقق نشط حاليًا. أعد تسجيل الدخول أو إنشاء الحساب.");
    openAuthMode("login");
    return;
  }

  if ((verifyCodeInput?.value || "").trim() !== request.code) {
    setState("رمز التحقق غير صحيح.");
    return;
  }

  if (request.flow === "register") {
    const users = loadUsers();
    if (users.some((entry) => entry.email.toLowerCase() === request.email.toLowerCase())) {
      clearPendingAuth();
      setState("هذا البريد مسجل مسبقًا.");
      openAuthMode("login");
      return;
    }

    const newUser = request.user;
    users.unshift(newUser);
    saveUsers(users);
    localStorage.removeItem(storageKeys.adminSession);
    localStorage.setItem(storageKeys.currentUser, newUser.id);
    ensureUserWorkspace(newUser.id);
    clearPendingAuth();
    setState(`تم إنشاء الحساب بنجاح يا ${newUser.name}.`);
    redirectToStudent();
    return;
  }

  const user = loadUsers().find((entry) => entry.id === request.userId);
  if (!user) {
    clearPendingAuth();
    setState("تعذر العثور على الحساب. أعد تسجيل الدخول من جديد.");
    openAuthMode("login");
    return;
  }

  if (user.status === "محظور") {
    clearPendingAuth();
    setState("هذا الحساب محظور حاليًا. تواصل مع إدارة المنصة إذا كنت ترى أن هذا الإجراء غير صحيح.");
    openAuthMode("login");
    return;
  }

  localStorage.removeItem(storageKeys.adminSession);
  localStorage.setItem(storageKeys.currentUser, user.id);
  ensureUserWorkspace(user.id);
  clearPendingAuth();
  setState(`أهلًا ${user.name}، تم تسجيل الدخول بنجاح.`);
  redirectToStudent();
});

googleButton?.addEventListener("click", () => {
  window.location.href = googleAuthUrl;
});

registerSubmitButton?.addEventListener("click", () => {
  registerForm?.requestSubmit();
});

const pendingAuth = loadPendingAuth();
if (pendingAuth) {
  openAuthMode("verify");
}

window.addEventListener("scroll", syncScrollTopButton, { passive: true });
scrollTopButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
syncScrollTopButton();
