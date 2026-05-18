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
const loginError = document.querySelector("[data-auth-login-error]");
const registerError = document.querySelector("[data-auth-register-error]");
const googleButton = document.querySelector("[data-auth-google]");
const googleError = document.querySelector("[data-auth-google-error]");
const appleButton = document.querySelector("[data-auth-apple]");
const microsoftButton = document.querySelector("[data-auth-microsoft]");
const forgotButton = document.querySelector("[data-auth-forgot]");
const backButton = document.querySelector("[data-auth-back]");
const scrollTopButton = document.querySelector("[data-scroll-top]");
const registerSubmitButton = document.querySelector("[data-register-submit]");
const passwordToggleButtons = document.querySelectorAll("[data-password-toggle]");
let authStateTimer = 0;
let loginSubmitting = false;
let registerSubmitting = false;

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
  email: "super.admin.orlixor.2026@orlixor.ai",
  password: "Orlixor#Admin!2026$Secure-9Qv"
};

const isEmbeddedAuth = new URLSearchParams(window.location.search).get("embed") === "1";
const authBridgeKey = "mlm_auth_bridge";
const savedConversationCacheLimit = 100;

function getReferralCodeFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("referral_code") || params.get("referralCode") || params.get("ref") || "";
    if (code) {
      localStorage.setItem("mlm_referral_code", String(code).trim().toUpperCase());
      return String(code).trim().toUpperCase();
    }
    return String(localStorage.getItem("mlm_referral_code") || "").trim().toUpperCase();
  } catch (_) {
    return "";
  }
}

function normalizeAuthRoleKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function getAuthRoleValue(value) {
  if (value && typeof value === "object") {
    return value.rbacRole || value.rbac_role || value.role || "";
  }
  return value;
}

function isAuthAdminRole(value) {
  const role = normalizeAuthRoleKey(getAuthRoleValue(value));
  return role === "owner" ||
    role === "admin" ||
    role === "super_admin" ||
    (role.includes("super") && role.includes("admin"));
}

function formatAuthRole(value) {
  if (!isAuthAdminRole(value)) return "Student";
  const role = normalizeAuthRoleKey(getAuthRoleValue(value));
  return role === "owner" || role.includes("super") ? "Super Admin" : "Admin";
}

try {
  window.mullemApiClient?.restorePersistentAuthFromCookies?.();
  window.mullemApiClient?.syncLegacySessionUser?.();
  window.mullemApiClient?.persistLegacyAuthState?.();
} catch (_) {
  // Ignore cookie restoration issues during auth bootstrap.
}

try {
  const activeAdminSession = localStorage.getItem(storageKeys.adminSession);
  const apiClient = getApiClient();
  const hasApiSession = Boolean(apiClient?.hasToken?.());
  const sessionUser = apiClient?.getSessionUser?.();
  const isStudentSession = Boolean(hasApiSession && sessionUser && !isAuthAdminRole(sessionUser));
  if (!isEmbeddedAuth && activeAdminSession === "1" && hasApiSession) {
    window.location.href = "admin.html";
  } else if (!isEmbeddedAuth && isStudentSession && !window.location.pathname.endsWith("admin.html")) {
    window.location.href = "index.html";
  }
} catch (_) {
  // Ignore storage access issues on auth bootstrap.
}

function getGoogleAuthUrl() {
  const configured = String(window.MULLEM_GOOGLE_OAUTH_URL || "").trim();
  return configured || "";
}

function getApiClient() {
  return window.mullemApiClient && typeof window.mullemApiClient.request === "function"
    ? window.mullemApiClient
    : null;
}

function persistClientAuthState() {
  try {
    window.mullemApiClient?.persistLegacyAuthState?.();
  } catch (_) {
    // Ignore persistence issues on restricted browsers.
  }
}

function notifyEmbeddedAuthSuccess(payload = {}) {
  if (!isEmbeddedAuth || window.parent === window) return false;
  try {
    const targetOrigin = window.location.origin && window.location.origin !== "null"
      ? window.location.origin
      : "*";
    window.parent.postMessage(
      {
        type: "mullem-auth-success",
        payload
      },
      targetOrigin
    );
    return true;
  } catch (_) {
    return false;
  }
}

function buildSessionPayload(payload = {}) {
  const sessionPayload = { ...payload };
  const token = window.mullemApiClient?.getToken?.();
  if (token && sessionPayload.user && !sessionPayload.token) {
    sessionPayload.token = token;
  }
  return sessionPayload;
}

function getAccountStorageKey(suffix, userId) {
  const safeUserId = String(userId || "").trim();
  return safeUserId ? `orlixor_${suffix}_${safeUserId}` : "";
}

function normalizeLoginConversationCacheItem(item) {
  const id = String(item?.id || "").trim();
  if (!id) return null;
  return {
    id,
    guest_session_id: item.guest_session_id || item.guestSessionId || null,
    user_id: item.user_id != null ? String(item.user_id) : null,
    project_id: item.project_id != null ? String(item.project_id) : null,
    title: item.title || null,
    subject: item.subject || null,
    stage: item.stage || null,
    grade: item.grade || null,
    term: item.term || null,
    status: item.status || "active",
    last_message_at: item.last_message_at || item.lastMessageAt || item.updated_at || item.updatedAt || null,
    created_at: item.created_at || item.createdAt || null,
    updated_at: item.updated_at || item.updatedAt || null
  };
}

function getConversationSortTime(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : Date.now();
}

function cacheLoginConversationsForUser(user, conversations) {
  const userId = String(user?.id || "").trim();
  if (!userId || !Array.isArray(conversations) || !conversations.length) return;

  const normalized = conversations
    .map(normalizeLoginConversationCacheItem)
    .filter(Boolean)
    .sort((first, second) =>
      getConversationSortTime(second.last_message_at || second.updated_at || second.created_at) -
      getConversationSortTime(first.last_message_at || first.updated_at || first.created_at)
    )
    .slice(0, savedConversationCacheLimit);

  if (!normalized.length) return;

  try {
    localStorage.setItem(getAccountStorageKey("saved_conversations", userId), JSON.stringify(normalized));
    const conversationIdsKey = getAccountStorageKey("conversation_ids", userId);
    const conversationIds = loadJson(conversationIdsKey, {});
    normalized.forEach((item) => {
      conversationIds[`server-${item.id}`] = item.id;
    });
    localStorage.setItem(conversationIdsKey, JSON.stringify(conversationIds));
  } catch (_) {
    // The chat page will still fetch conversations from the server if cache storage is restricted.
  }
}

function persistAuthBridge(payload = {}) {
  const sessionPayload = buildSessionPayload(payload);
  if (!sessionPayload.token || !sessionPayload.user) return sessionPayload;
  try {
    localStorage.setItem(authBridgeKey, JSON.stringify({
      ...sessionPayload,
      createdAt: Date.now()
    }));
  } catch (_) {
    // Ignore bridge storage issues.
  }
  return sessionPayload;
}

function getAuthReturnUrl(defaultUrl) {
  if (defaultUrl === "admin.html") return defaultUrl;
  const requested = new URLSearchParams(window.location.search).get("return") || "";
  if (!requested) return defaultUrl;

  try {
    const target = new URL(requested, window.location.href);
    if (target.origin !== window.location.origin) return defaultUrl;
    const targetPath = String(target.pathname || "").toLowerCase();
    if (targetPath.endsWith("/admin.html") || targetPath.endsWith("admin.html")) return defaultUrl;
    return `${target.pathname}${target.search}${target.hash}` || defaultUrl;
  } catch (_) {
    return defaultUrl;
  }
}

function finishAuthSuccess(payload = {}, redirectUrl = "index.html") {
  const sessionPayload = persistAuthBridge(payload);
  if (notifyEmbeddedAuthSuccess(sessionPayload)) return true;
  const nextUrl = getAuthReturnUrl(redirectUrl);
  window.setTimeout(() => {
    window.location.href = nextUrl;
  }, 120);
  return false;
}

function inferStageFromGrade(grade) {
  const value = String(grade || "").trim();
  if (!value) return "";
  if (value.includes("ابتدائي")) return "ابتدائي";
  if (value.includes("متوسط")) return "متوسط";
  if (value.includes("ثانوي")) return "ثانوي";
  return "";
}

function parseRewardTimeMs(value) {
  if (value == null || value === "") return 0;
  if (Number.isFinite(Number(value))) return Number(value);
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getDailyRewardMeta(user = {}) {
  const meta = user?.dailyReward || user?.daily_reward || {};
  return {
    amount: Number.isFinite(Number(meta.amount ?? user?.dailyRewardAmount ?? user?.daily_reward_amount ?? user?.packageDailyXp ?? user?.package_daily_xp))
      ? Number(meta.amount ?? user.dailyRewardAmount ?? user.daily_reward_amount ?? user.packageDailyXp ?? user.package_daily_xp)
      : 0,
    nextRewardAt: meta.nextRewardAt || meta.nextDailyRewardAt || user?.nextDailyRewardAt || user?.next_daily_reward_at || null,
    lastClaimedAt: meta.lastClaimedAt || meta.last_daily_reward_claimed_at || user?.lastDailyRewardClaimedAt || user?.last_daily_reward_claimed_at || null,
    intervalMs: Number.isFinite(Number(meta.intervalMs || meta.interval_ms)) ? Number(meta.intervalMs || meta.interval_ms) : 0,
    remainingMs: Number.isFinite(Number(meta.remainingMs ?? meta.remaining_ms ?? meta.nextRewardInMs ?? meta.nextDailyRewardInMs ?? user?.nextDailyRewardInMs ?? user?.next_daily_reward_in_ms))
      ? Number(meta.remainingMs ?? meta.remaining_ms ?? meta.nextRewardInMs ?? meta.nextDailyRewardInMs ?? user.nextDailyRewardInMs ?? user.next_daily_reward_in_ms)
      : 0,
    nextRewardInMs: Number.isFinite(Number(meta.nextRewardInMs ?? meta.nextDailyRewardInMs ?? user?.nextDailyRewardInMs ?? user?.next_daily_reward_in_ms))
      ? Number(meta.nextRewardInMs ?? meta.nextDailyRewardInMs ?? user.nextDailyRewardInMs ?? user.next_daily_reward_in_ms)
      : 0
  };
}

function normalizeApiUserForLocal(user) {
  const existing = loadUsers().find((entry) => String(entry.id) === String(user?.id));
  const dailyReward = getDailyRewardMeta(user || {});
  const existingDailyReward = getDailyRewardMeta(existing || {});
  const nextRewardAtMs = parseRewardTimeMs(dailyReward.nextRewardAt) || parseRewardTimeMs(existingDailyReward.nextRewardAt);
  return {
    ...(existing || {}),
    id: String(user?.id ?? existing?.id ?? `student-${Date.now()}`),
    name: user?.name || existing?.name || "",
    email: String(user?.email || existing?.email || "").toLowerCase(),
    password: existing?.password || "",
    role: formatAuthRole(user?.role || existing?.role || "student"),
    stage: user?.stage || existing?.stage || inferStageFromGrade(user?.grade || existing?.grade || ""),
    grade: user?.grade || existing?.grade || "",
    subject: existing?.subject || "الرياضيات",
    package: existing?.package || "API Connected",
    balance: Number.isFinite(Number(user?.balance ?? user?.xp)) ? Number(user.balance ?? user.xp) : (Number.isFinite(Number(existing?.balance ?? existing?.xp)) ? Number(existing.balance ?? existing.xp) : 50),
    xp: Number.isFinite(Number(user?.xp ?? user?.balance)) ? Number(user.xp ?? user.balance) : (Number.isFinite(Number(existing?.xp ?? existing?.balance)) ? Number(existing.xp ?? existing.balance) : 50),
    lastDailyRewardClaimedAt: dailyReward.lastClaimedAt || user?.lastDailyRewardClaimedAt || user?.last_daily_reward_claimed_at || existing?.lastDailyRewardClaimedAt || existing?.last_daily_reward_claimed_at || "",
    lastDailyRewardAt: dailyReward.lastClaimedAt || user?.lastDailyRewardAt || user?.last_daily_reward_at || existing?.lastDailyRewardAt || existing?.last_daily_reward_at || "",
    dailyRewardAmount: Number.isFinite(Number(dailyReward.amount))
      ? Number(dailyReward.amount)
      : (Number.isFinite(Number(existingDailyReward.amount)) ? Number(existingDailyReward.amount) : 0),
    nextDailyRewardInMs: Number.isFinite(Number(dailyReward.nextRewardInMs))
      ? Number(dailyReward.nextRewardInMs)
      : (Number.isFinite(Number(existingDailyReward.nextRewardInMs)) ? Number(existingDailyReward.nextRewardInMs) : 0),
    nextDailyRewardAt: nextRewardAtMs || 0,
    dailyRewardSyncedAt: Number.isFinite(Number(user?.dailyRewardSyncedAt ?? user?.daily_reward_synced_at))
      ? Number(user.dailyRewardSyncedAt ?? user.daily_reward_synced_at)
      : (Number.isFinite(Number(existing?.dailyRewardSyncedAt ?? existing?.daily_reward_synced_at)) ? Number(existing.dailyRewardSyncedAt ?? existing.daily_reward_synced_at) : 0),
    dailyReward: dailyReward.nextRewardAt ? dailyReward : existingDailyReward,
    streakDays: Number.isFinite(Number(existing?.streakDays)) ? Number(existing.streakDays) : 0,
    lastActiveDate: existing?.lastActiveDate || "",
    achievements: Array.isArray(existing?.achievements) ? existing.achievements : [],
    status: existing?.status || (String(user?.status || "").toLowerCase() === "active" ? "نشط" : String(user?.status || "نشط")),
    activity: existing?.activity || "تمت مزامنة الحساب مع الخادم"
  };
}

function upsertApiUserLocally(user, passwordOverride = "") {
  const normalizedUser = normalizeApiUserForLocal(user);
  const nextUsers = [
    normalizedUser,
    ...loadUsers().filter((entry) => String(entry.id) !== String(normalizedUser.id))
  ];
  saveUsers(nextUsers);
  return normalizedUser;
}

function completeStudentApiLogin(user, message, passwordOverride = "", conversations = []) {
  const normalizedUser = upsertApiUserLocally(user, passwordOverride);
  cacheLoginConversationsForUser(normalizedUser, conversations);
  localStorage.removeItem(storageKeys.adminSession);
  localStorage.setItem(storageKeys.currentUser, normalizedUser.id);
  persistClientAuthState();
  ensureUserWorkspace(normalizedUser.id);
  clearPendingAuth();
  setSuccessState(message || `أهلًا ${normalizedUser.name}، تم تسجيل الدخول بنجاح عبر الخادم.`);
  finishAuthSuccess({ role: "student", user: normalizedUser }, "index.html");
}

function completeAdminApiLogin(message, user = null) {
  localStorage.setItem(storageKeys.adminSession, "1");
  localStorage.removeItem(storageKeys.currentUser);
  persistClientAuthState();
  clearPendingAuth();
  setSuccessState(message || "تم تسجيل دخول الأدمن بنجاح عبر الخادم.");
  const sessionUser = user || window.mullemApiClient?.getSessionUser?.() || null;
  finishAuthSuccess({ role: formatAuthRole(sessionUser || "admin"), user: sessionUser }, "admin.html");
}

function shouldFallbackToLocalAuth(result) {
  return false;
}

function handleLocalLoginFallback(email, password) {
  if (email === adminCredentials.email && password === adminCredentials.password) {
    localStorage.setItem(storageKeys.adminSession, "1");
    localStorage.removeItem(storageKeys.currentUser);
    persistClientAuthState();
    setSuccessState("تم تسجيل دخول الأدمن بنجاح. سيتم تحويلك الآن.");
    finishAuthSuccess({ role: "admin" }, "admin.html");
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

  if (userByEmail.status === "محظور") {
    setState("هذا الحساب محظور حاليًا. تواصل مع إدارة المنصة إذا كنت ترى أن هذا الإجراء غير صحيح.");
    return;
  }

  localStorage.removeItem(storageKeys.adminSession);
  startAuthVerification({
    flow: "login",
    userId: userByEmail.id,
    name: userByEmail.name,
    email: userByEmail.email,
    code: generateVerificationCode()
  });
}

function handleLocalRegisterFallback(name, email, password, grade) {
  if (password.length < 6) {
    setState("كلمة المرور يجب أن تكون 6 أحرف أو أكثر.");
    return;
  }

  const users = loadUsers();
  if (users.some((entry) => entry.email.toLowerCase() === email)) {
    const message = "الحساب موجود من قبل، يلزم تسجيل الدخول لدخول الحساب.";
    setInlineError(registerError, message);
    setState(message);
    return;
  }

  localStorage.removeItem(storageKeys.adminSession);
  startAuthVerification({
    flow: "register",
    code: generateVerificationCode(),
    name,
    email,
    user: {
      id: `student-${Date.now()}`,
      name,
      email,
      password,
      role: "Student",
      grade,
      subject: "الرياضيات",
      package: "مجاني محدود",
      xp: 50,
      streakDays: 0,
      lastActiveDate: "",
      achievements: [],
      status: "نشط",
      activity: "أنشأ حسابًا جديدًا"
    }
  });
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
      name: "طالب",
      email: "student@mullem.sa",
      password: "Student@2026",
      role: "Student",
      grade: "الثاني الثانوي",
      subject: "الرياضيات",
      package: "مجاني محدود",
      xp: 50,
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

function setState(text, options = {}) {
  if (!authState) return;
  window.clearTimeout(authStateTimer);
  const message = String(text || "").trim();
  authState.hidden = !message;
  authState.textContent = message;
  if (message && options.autoHide) {
    authStateTimer = window.setTimeout(() => {
      authState.hidden = true;
      authState.textContent = "";
    }, Number(options.duration) || 4000);
  }
}

function setSuccessState(text) {
  setState(text, { autoHide: true, duration: 4000 });
}

function setFormBusy(form, isBusy) {
  if (!form) return;
  form.classList.toggle("is-busy", Boolean(isBusy));
  form.setAttribute("aria-busy", isBusy ? "true" : "false");
  const submitButton = form.querySelector(".auth-submit");
  if (submitButton) {
    if (isBusy) {
      submitButton.dataset.defaultLabel = submitButton.dataset.defaultLabel || submitButton.textContent.trim();
      const loadingLabel = submitButton.getAttribute("data-loading-label") || "جاري المعالجة...";
      const labelTarget = submitButton.querySelector("span") || submitButton;
      labelTarget.textContent = loadingLabel;
    } else {
      const labelTarget = submitButton.querySelector("span") || submitButton;
      labelTarget.textContent = submitButton.dataset.defaultLabel || labelTarget.textContent;
    }
  }
  form.querySelectorAll("button, input, select").forEach((control) => {
    if (control.matches("[data-password-toggle]")) return;
    control.disabled = Boolean(isBusy);
  });
}

function setFieldError(field, hasError) {
  if (!field) return;
  field.classList.toggle("is-error", Boolean(hasError));
}

function setInlineError(target, message) {
  if (!target) return;
  if (!message) {
    target.hidden = true;
    target.textContent = "";
    return;
  }
  target.hidden = false;
  target.textContent = message;
}

function resetInlineErrors() {
  setInlineError(loginError, "");
  setInlineError(registerError, "");
  setInlineError(googleError, "");
  setFieldError(loginEmail, false);
  setFieldError(loginPassword, false);
  setFieldError(registerEmail, false);
  setFieldError(registerPassword, false);
}

function getAuthErrorCode(result = {}) {
  return String(result.payload?.code || result.payload?.error || result.code || result.error || "").trim();
}

function logLoginError(provider, result = {}) {
  const status = Number(result.status || 0);
  const message = String(result.message || result.payload?.message || result.error || "").trim();
  const code = getAuthErrorCode(result);
  console.error("LOGIN_ERROR", {
    provider,
    status,
    message,
    code
  });
}

function getProviderLabel(provider) {
  const key = String(provider || "").trim().toLowerCase();
  if (key === "google") return "Google";
  if (key === "apple") return "Apple";
  if (key === "microsoft" || key === "azure-ad") return "Microsoft";
  return provider || "مزود الدخول";
}

function getFriendlyProviderError(provider, result = {}) {
  const status = Number(result.status || 0);
  const code = getAuthErrorCode(result);
  const label = getProviderLabel(provider);
  if (code === "AUTH_PROVIDER_DISABLED" || status === 503) {
    return `خدمة تسجيل الدخول عبر ${label} غير مفعلة حاليًا.`;
  }
  if (code === "AUTH_PROVIDER_NOT_FOUND" || status === 404) {
    return "مزود تسجيل الدخول غير موجود.";
  }
  if (result.networkError || status === 0) {
    return "خطأ في الاتصال بالخادم.";
  }
  if (status >= 500) {
    return "حدث خطأ في الخادم، حاول لاحقًا.";
  }
  return String(result.message || result.payload?.message || `تعذر تسجيل الدخول عبر ${label}.`).trim();
}

function getFriendlyLoginError(result = {}) {
  const status = Number(result.status || 0);
  const rawMessage = String(result.message || "").trim();
  const code = getAuthErrorCode(result);
  const requestId = String(result.request_id || result.requestId || result.payload?.request_id || "").trim();
  const suffix = requestId ? ` (رقم الطلب: ${requestId})` : "";

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      message: "يبدو أنك غير متصل بالإنترنت",
      field: ""
    };
  }

  if (code === "AUTH_PROVIDER_DISABLED") {
    return {
      message: "خدمة تسجيل الدخول غير مفعلة حاليًا",
      field: ""
    };
  }

  if (code === "AUTH_PROVIDER_NOT_FOUND") {
    return {
      message: "تعذر العثور على خدمة تسجيل الدخول.",
      field: ""
    };
  }

  if (status === 0 || result.networkError) {
    return {
      message: "خطأ في الاتصال بالخادم.",
      field: ""
    };
  }

  if (status >= 500 || result.serverUnavailable) {
    return {
      message: `حدث خطأ في الخادم، حاول لاحقًا${suffix}`,
      field: ""
    };
  }

  if (code === "ACCOUNT_NOT_FOUND") {
    return {
      message: "الحساب غير موجود",
      field: "email"
    };
  }

  if (code === "WRONG_PASSWORD") {
    return {
      message: "كلمة المرور خاطئة",
      field: "password"
    };
  }

  if (status === 401 || code === "WRONG_PASSWORD" || code === "INVALID_CREDENTIALS" || /invalid email or password|wrong password/i.test(rawMessage)) {
    return {
      message: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      field: "password"
    };
  }

  if (status === 429 || /rate[_ -]?limited|too many requests/i.test(rawMessage)) {
    return {
      message: "محاولات كثيرة، حاول بعد قليل",
      field: ""
    };
  }

  if (status === 404) {
    return {
      message: `الحساب غير موجود${suffix}`,
      field: "email"
    };
  }

  if (rawMessage) {
    return {
      message: rawMessage,
      field: /كلمة المرور|password/i.test(rawMessage) ? "password" : ""
    };
  }

  return {
    message: "تعذر تسجيل الدخول. تحقق من البيانات ثم حاول مرة أخرى.",
    field: ""
  };
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
    setState("");
    registerName?.focus();
    return;
  }
  if (mode === "forgot") {
    clearPendingAuth();
    if (verifyNote) verifyNote.hidden = true;
    resetForgotFlow();
    setState("");
    forgotEmail?.focus();
    return;
  }
  clearPendingAuth();
  if (verifyNote) verifyNote.hidden = true;
  setState("");
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
  if (isEmbeddedAuth) {
    const activeUserId = localStorage.getItem(storageKeys.currentUser);
    const user = loadUsers().find((entry) => String(entry.id) === String(activeUserId || ""));
    if (notifyEmbeddedAuthSuccess({ role: "student", user: user || null })) {
      return;
    }
  }
  window.location.href = "index.html";
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
  resetInlineErrors();
  const email = (loginEmail?.value || "").trim().toLowerCase();
  const password = loginPassword?.value || "";
  const apiClient = getApiClient();

  if (!email || !password) {
    const message = "أدخل البريد الإلكتروني وكلمة المرور أولًا.";
    setInlineError(loginError, message);
    setFieldError(loginPassword, !password);
    setState(message);
    return;
  }

  if (!isValidEmail(email)) {
    const message = "البريد الإلكتروني غير صحيح.";
    setInlineError(loginError, message);
    setState(message);
    return;
  }

  if (!apiClient) {
    setInlineError(loginError, "خدمة تسجيل الدخول غير جاهزة الآن. أعد المحاولة بعد قليل.");
    setState("خدمة تسجيل الدخول غير جاهزة الآن. أعد المحاولة بعد قليل.");
    return;
  }

  if (loginSubmitting) return;
  loginSubmitting = true;
  setFormBusy(loginForm, true);
  setState("جاري تسجيل الدخول...");
  let apiResult;
  try {
    apiResult = await apiClient.login({
      email,
      password,
      device_name: "mullem-web"
    });
  } catch (error) {
    apiResult = {
      ok: false,
      status: 0,
      serverUnavailable: true,
      networkError: true,
      error: String(error?.message || error || ""),
      message: "تعذر الاتصال بالخادم الآن."
    };
  } finally {
    loginSubmitting = false;
    setFormBusy(loginForm, false);
  }

  if (shouldFallbackToLocalAuth(apiResult)) {
    handleLocalLoginFallback(email, password);
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  if (!apiResult.ok || !apiResult.data?.user) {
    logLoginError("password", apiResult);
    const friendlyError = getFriendlyLoginError(apiResult);
    setInlineError(loginError, friendlyError.message);
    if (friendlyError.field === "email") {
      setFieldError(loginEmail, true);
    }
    if (friendlyError.field === "password") {
      setFieldError(loginPassword, true);
    }
    setState(friendlyError.message);
    return;
  }

  if (apiResult.ok && apiResult.data?.user) {
    if (isAuthAdminRole(apiResult.data.user)) {
      completeAdminApiLogin("تم تسجيل دخول الأدمن بنجاح.", apiResult.data.user);
      return;
    }

    completeStudentApiLogin(
      apiResult.data.user,
      `أهلًا ${apiResult.data.user.name || ""}، تم تسجيل الدخول بنجاح.`,
      password,
      apiResult.data.recent_conversations || apiResult.data.conversations || []
    );
    return;
  }

  const loginMessage = apiResult.message || "تعذر تسجيل الدخول. تحقق من البيانات ثم حاول مرة أخرى.";
  if (/invalid email or password/i.test(loginMessage) || /كلمة المرور/i.test(loginMessage)) {
    setInlineError(loginError, "البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من البيانات ثم حاول مرة أخرى.");
    setFieldError(loginPassword, true);
  } else {
    setInlineError(loginError, loginMessage);
  }
  setState(loginMessage);
}, { capture: true });

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  resetInlineErrors();
  const name = (registerName?.value || "").trim();
  const email = (registerEmail?.value || "").trim().toLowerCase();
  const password = registerPassword?.value || "";
  const grade = registerGrade?.value || "الثاني الثانوي";
  const apiClient = getApiClient();

  if (!name || !email || !password) {
    setState("أكمل جميع الحقول أولًا.");
    if (!password) {
      setInlineError(registerError, "اكتب كلمة مرور صالحة أولًا.");
      setFieldError(registerPassword, true);
    }
    return;
  }

  if (!isValidEmail(email)) {
    setState("البريد الإلكتروني غير صحيح.");
    return;
  }

  if (!apiClient) {
    setInlineError(registerError, "خدمة إنشاء الحساب غير جاهزة الآن. أعد المحاولة بعد قليل.");
    setState("خدمة إنشاء الحساب غير جاهزة الآن. أعد المحاولة بعد قليل.");
    return;
  }

  if (registerSubmitting) return;
  registerSubmitting = true;
  setFormBusy(registerForm, true);
  let apiResult;
  try {
    const referralCode = getReferralCodeFromUrl();
    apiResult = await apiClient.register({
      name,
      email,
      password,
      password_confirmation: password,
      grade,
      stage: inferStageFromGrade(grade),
      device_name: "mullem-web",
      referral_code: referralCode || undefined
    });
  } catch (_) {
    apiResult = {
      ok: false,
      serverUnavailable: true,
      message: "تعذر الاتصال بالخادم الآن."
    };
  } finally {
    registerSubmitting = false;
    setFormBusy(registerForm, false);
  }

  if (shouldFallbackToLocalAuth(apiResult)) {
    handleLocalRegisterFallback(name, email, password, grade);
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();

  if (apiResult.ok && apiResult.data?.user) {
    completeStudentApiLogin(
      apiResult.data.user,
      `تم إنشاء الحساب بنجاح يا ${apiResult.data.user.name || name}.`,
      password,
      apiResult.data.recent_conversations || apiResult.data.conversations || []
    );
    return;
  }

  const registerMessage = apiResult.message || "تعذر إنشاء الحساب الآن. تحقق من البيانات ثم حاول مرة أخرى.";
  if (/already registered|مسجل مسبق|الحساب موجود/i.test(registerMessage)) {
    const message = "الحساب موجود من قبل، يلزم تسجيل الدخول لدخول الحساب.";
    setInlineError(registerError, message);
    setState(message);
    return;
  }
  if (/password/i.test(registerMessage) || /كلمة المرور/i.test(registerMessage)) {
    setInlineError(registerError, "تحقق من كلمة المرور مرة أخرى.");
    setFieldError(registerPassword, true);
  } else {
    setInlineError(registerError, registerMessage);
  }
  setState(registerMessage);
}, { capture: true });

loginPassword?.addEventListener("input", () => {
  setInlineError(loginError, "");
  setFieldError(loginPassword, false);
});

registerPassword?.addEventListener("input", () => {
  setInlineError(registerError, "");
  setFieldError(registerPassword, false);
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
  setState(`تم إنشاء رمز التحقق: ${code} — استخدمه لإكمال العملية الآن.`);
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
    persistClientAuthState();
    ensureUserWorkspace(newUser.id);
    clearPendingAuth();
    setSuccessState(`تم إنشاء الحساب بنجاح يا ${newUser.name}.`);
    finishAuthSuccess({ role: "student", user: newUser }, "index.html");
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
  persistClientAuthState();
  ensureUserWorkspace(user.id);
  clearPendingAuth();
  setSuccessState(`أهلًا ${user.name}، تم تسجيل الدخول بنجاح.`);
  finishAuthSuccess({ role: "student", user }, "index.html");
});

async function startProviderLogin(provider) {
  const apiClient = getApiClient();
  const label = getProviderLabel(provider);
  resetInlineErrors();

  if (!apiClient?.request) {
    const message = "خطأ في الاتصال بالخادم.";
    logLoginError(provider, {
      status: 0,
      message,
      code: "AUTH_API_CLIENT_MISSING"
    });
    setInlineError(googleError, message);
    setState(message);
    return;
  }

  setState(`جاري التحقق من خدمة ${label}...`);

  let result;
  try {
    result = await apiClient.request(`/auth/provider/${encodeURIComponent(provider)}`, {
      method: "GET",
      skipAuth: true
    });
  } catch (error) {
    result = {
      ok: false,
      status: 0,
      networkError: true,
      message: error?.message || String(error || ""),
      code: "AUTH_PROVIDER_REQUEST_FAILED"
    };
  }

  if (!result?.ok) {
    logLoginError(provider, result);
    const message = getFriendlyProviderError(provider, result);
    setInlineError(googleError, message);
    setState(message);
    return;
  }

  const loginUrl = result.data?.login_url ||
    result.data?.loginUrl ||
    result.payload?.login_url ||
    result.payload?.loginUrl ||
    result.payload?.data?.login_url ||
    "";

  if (!loginUrl) {
    const missingUrlResult = {
      ...result,
      status: result.status || 500,
      message: "Provider login URL is missing",
      code: "AUTH_PROVIDER_LOGIN_URL_MISSING"
    };
    logLoginError(provider, missingUrlResult);
    const message = "خدمة تسجيل الدخول غير مفعلة حاليًا.";
    setInlineError(googleError, message);
    setState(message);
    return;
  }

  window.location.href = loginUrl;
}

function bindProviderButton(button, provider) {
  button?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    startProviderLogin(provider);
  }, { capture: true });
}

bindProviderButton(googleButton, "google");
bindProviderButton(appleButton, "apple");
bindProviderButton(microsoftButton, "microsoft");

registerSubmitButton?.addEventListener("click", () => {
  registerForm?.requestSubmit();
});

const pendingAuth = loadPendingAuth();
if (pendingAuth) {
  openAuthMode("verify");
}

if (isEmbeddedAuth) {
  const apiClient = getApiClient();
  const sessionUser = apiClient?.getSessionUser?.();
  const hasApiSession = Boolean(apiClient?.hasToken?.() && sessionUser);
  const activeAdminSession = localStorage.getItem(storageKeys.adminSession);
  if (activeAdminSession === "1" && hasApiSession) {
    notifyEmbeddedAuthSuccess({ role: "admin" });
  } else if (hasApiSession && !isAuthAdminRole(sessionUser)) {
    notifyEmbeddedAuthSuccess(buildSessionPayload({ role: "student", user: sessionUser }));
  }
}

window.addEventListener("scroll", syncScrollTopButton, { passive: true });
scrollTopButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
syncScrollTopButton();
