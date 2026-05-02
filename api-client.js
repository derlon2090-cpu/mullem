(() => {
  if (window.mullemApiClient) return;

  const storageKeys = {
    token: "mlm_api_token",
    user: "mlm_api_user",
    baseUrl: "mlm_api_base_url",
    logoutMarker: "mlm_auth_logged_out"
  };

  const cookieKeys = {
    token: "mlm_auth_token",
    user: "mlm_auth_user",
    currentUser: "mlm_auth_current_user",
    adminSession: "mlm_auth_admin_session",
    logoutMarker: "mlm_auth_logged_out"
  };

  function loadJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_) {
      // Ignore storage failures and keep the app usable.
    }
  }

  function setCookie(name, value, days = 30) {
    try {
      const maxAge = Math.max(1, Math.round(Number(days) || 30)) * 24 * 60 * 60;
      const encoded = `${encodeURIComponent(name)}=${encodeURIComponent(String(value || ""))}`;
      const secure = window.location?.protocol === "https:" ? "; Secure" : "";
      const base = `${encoded}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
      document.cookie = base;
      const rootDomain = getRootCookieDomain();
      if (rootDomain) {
        document.cookie = `${base}; domain=${rootDomain}`;
      }
    } catch (_) {
      // Ignore cookie failures and keep the app usable.
    }
  }

  function getCookie(name) {
    try {
      const encodedName = `${encodeURIComponent(name)}=`;
      const match = String(document.cookie || "")
        .split("; ")
        .find((item) => item.startsWith(encodedName));
      return match ? decodeURIComponent(match.slice(encodedName.length)) : "";
    } catch (_) {
      return "";
    }
  }

  function deleteCookie(name) {
    try {
      const encoded = `${encodeURIComponent(name)}=`;
      const secure = window.location?.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${encoded}; path=/; max-age=0; SameSite=Lax${secure}`;
      const rootDomain = getRootCookieDomain();
      if (rootDomain) {
        document.cookie = `${encoded}; path=/; max-age=0; SameSite=Lax${secure}; domain=${rootDomain}`;
      }
    } catch (_) {
      // Ignore cookie cleanup issues.
    }
  }

  function getRootCookieDomain() {
    const host = String(window.location?.hostname || "").toLowerCase();
    if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return "";
    const parts = host.split(".").filter(Boolean);
    if (parts.length < 2) return "";
    return `.${parts.slice(-2).join(".")}`;
  }

  function normalizeCookieUser(user) {
    if (!user || typeof user !== "object") return null;
    return {
      id: user.id ?? null,
      name: user.name || "",
      email: user.email || "",
      role: user.role || "student",
      stage: user.stage || "",
      grade: user.grade || "",
      subject: user.subject || "",
      package: user.package || "",
      packageKey: user.packageKey || user.package_key || "",
      packageDailyXp: Number.isFinite(Number(user.packageDailyXp || user.package_daily_xp))
        ? Number(user.packageDailyXp || user.package_daily_xp)
        : 0,
      packageStartedAt: user.packageStartedAt || user.package_started_at || null,
      packageExpiresAt: user.packageExpiresAt || user.package_expires_at || null,
      lastActiveDate: user.lastActiveDate || user.last_active_date || "",
      lastReset: user.lastReset || user.last_reset || user.lastActiveDate || user.last_active_date || "",
      last_reset: user.last_reset || user.lastReset || user.lastActiveDate || user.last_active_date || "",
      xp: Number.isFinite(Number(user.xp)) ? Number(user.xp) : 0
    };
  }

  function sanitizeBaseUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function isStaticHostLikely() {
    const host = getHostName();
    return host.endsWith(".github.io") || host.endsWith(".pages.dev") || host.endsWith(".netlify.app");
  }

  function getHostName() {
    return String(window.location?.hostname || "").toLowerCase();
  }

  function isLocalHost() {
    const hostname = getHostName();
    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "";
  }

  function getLocalLaravelBases() {
    if (!isLocalHost()) return [];
    return ["http://127.0.0.1:8010", "http://localhost:8010"];
  }

  function toReadableMessage(value) {
    if (typeof value === "string") {
      const message = value.trim();
      if (message.includes("Invalid value: 'input_text'")) {
        return "تعذر الوصول إلى خدمة الشات الآن. أعد المحاولة بعد قليل.";
      }
      if (/authentication is required to use chat/i.test(message)) {
        return "الشات متاح بعد تسجيل الدخول فقط. سجّل دخولك لفتح المحادثة داخل حسابك.";
      }
      if (/authentication is required/i.test(message)) {
        return "انتهت جلسة تسجيل الدخول أو لم يتم التحقق منها. سجّل دخولك مرة أخرى للمتابعة.";
      }
      if (/admin access is required/i.test(message)) {
        return "هذه العملية متاحة لحساب الأدمن فقط.";
      }
      if (/the page could not be found/i.test(message)) {
        return "تعذر الوصول إلى الخدمة المطلوبة الآن. حدّث الصفحة أو أعد المحاولة بعد قليل.";
      }
      if (/static hosting detected/i.test(message)) {
        return "تعذر الوصول إلى خادم الموقع الآن. حدّث الصفحة أو أعد المحاولة بعد قليل.";
      }
      return message;
    }

    if (value && typeof value === "object") {
      if (typeof value.message === "string" && value.message.trim()) {
        return value.message.trim();
      }

      if (typeof value.error === "string" && value.error.trim()) {
        return value.error.trim();
      }

      if (value.error && typeof value.error === "object") {
        if (typeof value.error.message === "string" && value.error.message.trim()) {
          return value.error.message.trim();
        }
      }

      if (typeof value.detail === "string" && value.detail.trim()) {
        return value.detail.trim();
      }

      try {
        return JSON.stringify(value);
      } catch (_) {
        return "";
      }
    }

    return String(value || "").trim();
  }

  function resolveBaseUrl() {
    const runtimeBase =
      typeof window.MULLEM_API_BASE === "string"
        ? window.MULLEM_API_BASE
        : document.documentElement?.getAttribute("data-api-base") ||
          document.body?.getAttribute("data-api-base") ||
          localStorage.getItem(storageKeys.baseUrl) ||
          "";

    const normalized = sanitizeBaseUrl(runtimeBase);
    if (normalized) return normalized;

    return getLocalLaravelBases()[0] || "";
  }

  function setBaseUrl(value) {
    const normalized = sanitizeBaseUrl(value);
    if (!normalized) {
      localStorage.removeItem(storageKeys.baseUrl);
      return "";
    }
    localStorage.setItem(storageKeys.baseUrl, normalized);
    return normalized;
  }

  function buildApiUrl(path) {
    const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;
    const baseUrl = resolveBaseUrl();

    if (!baseUrl) {
      return `/api${cleanPath}`;
    }

    if (/\/api$/i.test(baseUrl)) {
      return `${baseUrl}${cleanPath}`;
    }

    return `${baseUrl}/api${cleanPath}`;
  }

  function buildSameOriginApiUrl(path) {
    const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;
    return `/api${cleanPath}`;
  }

  function isSameOriginBase(baseUrl) {
    const normalized = sanitizeBaseUrl(baseUrl);
    if (!normalized) return true;

    try {
      const target = new URL(normalized, window.location.href);
      return target.origin === window.location.origin;
    } catch (_) {
      return true;
    }
  }

  function shouldTrySameOriginFallback() {
    const baseUrl = resolveBaseUrl();
    if (!baseUrl) return true;
    if (isLocalHost()) return true;
    return isSameOriginBase(baseUrl);
  }

  function buildApiCandidates(path) {
    const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;
    const baseUrl = resolveBaseUrl();
    const candidates = [];

    if (baseUrl) {
      candidates.push(buildApiUrl(cleanPath));
    }

    for (const localBase of getLocalLaravelBases()) {
      if (/\/api$/i.test(localBase)) {
        candidates.push(`${localBase}${cleanPath}`);
      } else {
        candidates.push(`${localBase}/api${cleanPath}`);
      }
    }

    if (shouldTrySameOriginFallback()) {
      candidates.push(buildSameOriginApiUrl(cleanPath));
    }

    return Array.from(new Set(candidates.map(sanitizeBaseUrl).filter(Boolean)));
  }

  function getToken() {
    try {
      return localStorage.getItem(storageKeys.token) || getCookie(cookieKeys.token) || "";
    } catch (_) {
      return getCookie(cookieKeys.token) || "";
    }
  }

  function getSessionUser() {
    const storedUser = loadJson(storageKeys.user, null);
    if (storedUser) return storedUser;
    const cookieUser = getCookie(cookieKeys.user);
    if (!cookieUser) return null;
    try {
      return JSON.parse(cookieUser);
    } catch (_) {
      return null;
    }
  }

  function restorePersistentAuthFromCookies() {
    try {
      const logoutMarker = localStorage.getItem(storageKeys.logoutMarker) || getCookie(cookieKeys.logoutMarker);
      if (logoutMarker === "1") {
        localStorage.removeItem(storageKeys.token);
        localStorage.removeItem(storageKeys.user);
        localStorage.removeItem("mlm_current_user");
        localStorage.removeItem("mlm_admin_session");
        deleteCookie(cookieKeys.token);
        deleteCookie(cookieKeys.user);
        deleteCookie(cookieKeys.currentUser);
        deleteCookie(cookieKeys.adminSession);
        return;
      }

      const cookieToken = getCookie(cookieKeys.token);
      const cookieUser = getCookie(cookieKeys.user);
      const cookieCurrentUser = getCookie(cookieKeys.currentUser);
      const cookieAdminSession = getCookie(cookieKeys.adminSession);
      const storedToken = localStorage.getItem(storageKeys.token) || "";

      if (!cookieToken && !storedToken) {
        localStorage.removeItem(storageKeys.token);
        localStorage.removeItem(storageKeys.user);
        localStorage.removeItem("mlm_current_user");
        localStorage.removeItem("mlm_admin_session");
        deleteCookie(cookieKeys.user);
        deleteCookie(cookieKeys.currentUser);
        deleteCookie(cookieKeys.adminSession);
        return;
      }

      if (cookieToken && !localStorage.getItem(storageKeys.token)) {
        localStorage.setItem(storageKeys.token, cookieToken);
      }

      if (cookieUser && !localStorage.getItem(storageKeys.user)) {
        try {
          const parsedUser = JSON.parse(cookieUser);
          saveJson(storageKeys.user, parsedUser);
        } catch (_) {
          // Ignore invalid cookie payloads.
        }
      }

      if (cookieCurrentUser && !localStorage.getItem("mlm_current_user")) {
        localStorage.setItem("mlm_current_user", cookieCurrentUser);
      }

      if (cookieAdminSession && !localStorage.getItem("mlm_admin_session")) {
        localStorage.setItem("mlm_admin_session", cookieAdminSession);
      }
    } catch (_) {
      // Ignore restore failures.
    }
  }

  function hasToken() {
    return Boolean(getToken());
  }

  function isAuthenticatedStudent() {
    const sessionUser = getSessionUser();
    return Boolean(hasToken() && sessionUser && String(sessionUser.role || "").toLowerCase() !== "admin");
  }

  function isPublicLandingPage() {
    const path = String(window.location?.pathname || "").toLowerCase();
    return !path || path.endsWith("/") || path.endsWith("/index.html");
  }

  function redirectAuthenticatedUserFromLanding() {
    return;
  }

  function upgradeHomeLinksForAuthenticatedUser() {
    return;
  }

  function normalizeLegacyUser(user, existingUser = null) {
    const existing = existingUser || {};
    const role = String(user?.role || existing.role || "student").toLowerCase();
    const status = String(user?.status || existing.status || "active").toLowerCase();

    return {
      id: String(user?.id ?? existing.id ?? `api-${Date.now()}`),
      name: user?.name || existing.name || "",
      email: String(user?.email || existing.email || "").toLowerCase(),
      password: existing.password || "",
      role: role === "admin" ? "Admin" : "Student",
      stage: user?.stage || existing.stage || "",
      grade: user?.grade || existing.grade || "",
      subject: user?.subject || existing.subject || "",
      package: user?.package || existing.package || "API Connected",
      packageId: user?.packageId ?? existing.packageId ?? null,
      packageKey: user?.packageKey || existing.packageKey || "",
      packageDailyXp: Number.isFinite(Number(user?.packageDailyXp || user?.package_daily_xp))
        ? Number(user.packageDailyXp || user.package_daily_xp)
        : Number(existing.packageDailyXp || 0),
      packagePriceSar: Number.isFinite(Number(user?.packagePriceSar))
        ? Number(user.packagePriceSar)
        : Number(existing.packagePriceSar || 0),
      packageDurationDays: Number.isFinite(Number(user?.packageDurationDays))
        ? Number(user.packageDurationDays)
        : Number(existing.packageDurationDays || 0),
      packageSummary: user?.packageSummary || existing.packageSummary || "",
      packageBenefits: Array.isArray(user?.packageBenefits)
        ? user.packageBenefits
        : (Array.isArray(existing.packageBenefits) ? existing.packageBenefits : []),
      packageStartedAt: user?.packageStartedAt || existing.packageStartedAt || null,
      packageExpiresAt: user?.packageExpiresAt || existing.packageExpiresAt || null,
      packageDaysRemaining: Number.isFinite(Number(user?.packageDaysRemaining))
        ? Number(user.packageDaysRemaining)
        : (Number.isFinite(Number(existing.packageDaysRemaining)) ? Number(existing.packageDaysRemaining) : null),
      xp: Number.isFinite(Number(user?.xp)) ? Number(user.xp) : (Number.isFinite(Number(existing.xp)) ? Number(existing.xp) : 50),
      streakDays: Number.isFinite(Number(user?.streakDays)) ? Number(user.streakDays) : (Number.isFinite(Number(existing.streakDays)) ? Number(existing.streakDays) : 0),
      motivationScore: Number.isFinite(Number(user?.motivationScore)) ? Number(user.motivationScore) : Number(existing.motivationScore || 0),
      lastActiveDate: user?.lastActiveDate || user?.last_active_date || existing.lastActiveDate || existing.last_active_date || "",
      lastReset: user?.lastReset || user?.last_reset || existing.lastReset || existing.last_reset || user?.lastActiveDate || user?.last_active_date || existing.lastActiveDate || "",
      last_reset: user?.last_reset || user?.lastReset || existing.last_reset || existing.lastReset || user?.lastActiveDate || user?.last_active_date || existing.lastActiveDate || "",
      achievements: Array.isArray(user?.achievements) ? user.achievements : (Array.isArray(existing.achievements) ? existing.achievements : []),
      status: user?.status || existing.status || (status === "active" ? "نشط" : status),
      activity: user?.activity || existing.activity || "تمت مزامنة الحساب مع الخادم"
    };
  }

  function syncLegacySessionUser() {
    if (!hasToken()) return;
    const sessionUser = getSessionUser();
    if (!sessionUser?.id) return;

    const legacyUsers = loadJson("mlm_users", []);
    const existingUser = legacyUsers.find((user) => String(user.id) === String(sessionUser.id));
    const mergedUser = normalizeLegacyUser(sessionUser, existingUser);
    const nextUsers = [
      mergedUser,
      ...legacyUsers.filter((user) => String(user.id) !== String(mergedUser.id))
    ];

    saveJson("mlm_users", nextUsers);

    if (String(sessionUser.role || "").toLowerCase() === "admin") {
      localStorage.setItem("mlm_admin_session", "1");
      localStorage.removeItem("mlm_current_user");
      return;
    }

    localStorage.removeItem("mlm_admin_session");
    localStorage.setItem("mlm_current_user", String(mergedUser.id));
  }

  function persistLegacyAuthState() {
    try {
      const currentUser = localStorage.getItem("mlm_current_user") || "";
      const adminSession = localStorage.getItem("mlm_admin_session") || "";
      const token = getToken();
      const sessionUser = getSessionUser();

      if (!token) {
        deleteCookie(cookieKeys.token);
        deleteCookie(cookieKeys.currentUser);
        deleteCookie(cookieKeys.user);
        deleteCookie(cookieKeys.adminSession);
        return;
      }

      setCookie(cookieKeys.token, token, 45);

      if (sessionUser) {
        setCookie(cookieKeys.user, JSON.stringify(normalizeCookieUser(sessionUser)), 45);
      } else {
        deleteCookie(cookieKeys.user);
      }

      if (currentUser) {
        setCookie(cookieKeys.currentUser, currentUser, 45);
      } else {
        deleteCookie(cookieKeys.currentUser);
      }

      if (adminSession === "1") {
        setCookie(cookieKeys.adminSession, "1", 45);
      } else {
        deleteCookie(cookieKeys.adminSession);
      }

      localStorage.removeItem(storageKeys.logoutMarker);
      deleteCookie(cookieKeys.logoutMarker);
    } catch (_) {
      // Ignore cookie persistence issues.
    }
  }

  function setSession(session) {
    const token = String(session?.token || "").trim();
    const user = session?.user || null;

    if (!token || !user) {
      clearSession();
      return;
    }

    localStorage.setItem(storageKeys.token, token);
    saveJson(storageKeys.user, user);
    localStorage.removeItem(storageKeys.logoutMarker);
    deleteCookie(cookieKeys.logoutMarker);
    syncLegacySessionUser();
    persistLegacyAuthState();
  }

  function clearSession() {
    try {
      localStorage.removeItem(storageKeys.token);
      localStorage.removeItem(storageKeys.user);
      localStorage.removeItem("mlm_current_user");
      localStorage.removeItem("mlm_admin_session");
    } catch (_) {
      // Ignore cleanup issues.
    }
    deleteCookie(cookieKeys.token);
    deleteCookie(cookieKeys.user);
    deleteCookie(cookieKeys.currentUser);
    deleteCookie(cookieKeys.adminSession);
  }

  function shouldRedirectAfterAuthFailure() {
    const path = String(window.location?.pathname || "").toLowerCase();
    return ["student.html", "admin.html", "profile.html"].some((page) => path.endsWith(`/${page}`) || path.endsWith(page));
  }

  function redirectToLoginAfterAuthFailure() {
    if (!shouldRedirectAfterAuthFailure()) return;

    try {
      if (window.__mullemAuthRedirectScheduled) return;
      window.__mullemAuthRedirectScheduled = true;
    } catch (_) {
      // Ignore guard assignment issues.
    }

    window.setTimeout(() => {
      window.location.href = "login.html";
    }, 250);
  }

  async function parseResponsePayload(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch (_) {
        return null;
      }
    }

    try {
      const text = await response.text();
      return text ? { message: text } : null;
    } catch (_) {
      return null;
    }
  }

  async function request(path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.headers || {})
    };

    const bodyIsFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    if (!bodyIsFormData && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (!options.skipAuth && hasToken()) {
      headers.Authorization = `Bearer ${getToken()}`;
    }

    const requestInitBase = {
      method: options.method || "GET",
      credentials: options.credentials || "include",
      headers,
      body: bodyIsFormData
        ? options.body
        : options.body != null
          ? JSON.stringify(options.body)
          : undefined
    };

    let lastFailure = null;
    let preferredFailure = null;
    const candidates = buildApiCandidates(path);

    for (const url of candidates) {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutMs = Number(options.timeoutMs) || 25000;
      const timeoutId = controller
        ? window.setTimeout(() => controller.abort(), timeoutMs)
        : 0;
      const requestInit = controller
        ? { ...requestInitBase, signal: controller.signal }
        : requestInitBase;
      try {
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        const isJsonResponse = contentType.includes("application/json");
        const payload = await parseResponsePayload(response);
        const data = payload?.data ?? null;
        const message =
          toReadableMessage(payload?.message) ||
          toReadableMessage(payload?.error) ||
          (response.ok ? "OK" : "Request failed");

        if (!isJsonResponse && /the page could not be found/i.test(message)) {
          lastFailure = {
            ok: false,
            status: response.status || 404,
            data: null,
            message: isStaticHostLikely()
              ? "Static hosting detected. Configure MULLEM_API_BASE with a real backend URL."
              : "The page could not be found",
            errors: {},
            payload,
            serverUnavailable: true,
            networkError: false
          };
          continue;
        }

        if (response.ok && !isJsonResponse) {
          lastFailure = {
            ok: false,
            status: response.status,
            data: null,
            message: "Invalid API response",
            errors: {},
            payload,
            serverUnavailable: true,
            networkError: false
          };
          continue;
        }

        const result = {
          ok: response.ok && (payload?.success ?? true),
          status: response.status,
          data,
          message,
          errors: payload?.errors || {},
          payload,
          serverUnavailable: response.status === 404 || response.status >= 500,
          networkError: false
        };

        if ((response.status === 401 || response.status === 403) && hasToken()) {
          clearSession();
          redirectToLoginAfterAuthFailure();
        }

        if (result.ok) {
          if (url.startsWith("http://127.0.0.1:8010") || url.startsWith("http://localhost:8010")) {
            setBaseUrl(url.replace(/\/api\/.*$/i, ""));
          }
          return result;
        }

        lastFailure = result;
        if (!result.serverUnavailable && !preferredFailure) {
          preferredFailure = result;
        }
      } catch (_) {
        lastFailure = {
          ok: false,
          status: 0,
          data: null,
          message: "Network request failed",
          errors: {},
          payload: null,
          serverUnavailable: true,
          networkError: true
        };
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
      }
    }

    return preferredFailure || lastFailure || {
      ok: false,
      status: 0,
      data: null,
      message: "Network request failed",
      errors: {},
      payload: null,
      serverUnavailable: true,
      networkError: true
    };
  }

  function extractAuthSession(result) {
    const data = result?.data || result?.payload?.data || result?.payload || {};
    const token = data.token || data.access_token || data.auth_token || data.plainTextToken || "";
    const user = data.user || data.account || data.student || null;
    return {
      token: String(token || "").trim(),
      user
    };
  }

  async function verifyAuthSessionAfterLogin(result, session) {
    if (!result?.ok || !session?.token || !session?.user) return result;

    setSession({
      token: session.token,
      user: session.user
    });

    const verified = await request("/auth/me", {
      method: "GET",
      timeoutMs: 15000
    });

    if (verified.ok && verified.data?.user) {
      setSession({
        token: session.token,
        user: verified.data.user
      });

      return {
        ...result,
        data: {
          ...(result.data || {}),
          user: verified.data.user,
          token: session.token
        },
        sessionVerified: true
      };
    }

    if (verified.status === 401 || verified.status === 403 || verified.networkError || verified.serverUnavailable) {
      clearSession();
      return {
        ...result,
        ok: false,
        status: verified.status || result.status || 0,
        message: verified.message || "تعذر تثبيت جلسة تسجيل الدخول. أعد المحاولة بعد قليل.",
        errors: verified.errors || result.errors || {},
        sessionVerified: false
      };
    }

    return result;
  }

  async function login(payload) {
    const result = await request("/auth/login", {
      method: "POST",
      body: payload,
      skipAuth: true
    });

    const session = extractAuthSession(result);
    if (result.ok && session.token && session.user) {
      return verifyAuthSessionAfterLogin(result, session);
    }

    return result;
  }

  async function register(payload) {
    const result = await request("/auth/register", {
      method: "POST",
      body: payload,
      skipAuth: true
    });

    const session = extractAuthSession(result);
    if (result.ok && session.token && session.user) {
      return verifyAuthSessionAfterLogin(result, session);
    }

    return result;
  }

  async function logout() {
    const result = await request("/auth/logout", {
      method: "POST"
    });
    clearSession();
    return result;
  }

  async function me() {
    const result = await request("/auth/me");
    if (result.ok && result.data?.user && hasToken()) {
      setSession({
        token: getToken(),
        user: result.data.user
      });
    }
    return result;
  }

  async function getPackages() {
    return request("/packages");
  }

  async function getStudentDashboard() {
    return request("/student/dashboard");
  }

  async function getGuestStatus(guestSessionId) {
    const query = new URLSearchParams();
    if (guestSessionId) query.set("guest_session_id", String(guestSessionId));
    return request(`/guest/status${query.toString() ? `?${query.toString()}` : ""}`, {
      method: "GET",
      skipAuth: true
    });
  }

  async function getStudentProjects(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value == null || value === "") return;
      query.set(key, String(value));
    });
    return request(`/student/projects${query.toString() ? `?${query.toString()}` : ""}`);
  }

  async function createStudentProject(payload) {
    return request("/student/projects", {
      method: "POST",
      body: payload
    });
  }

  async function updateStudentProject(projectId, payload) {
    return request(`/student/projects/${encodeURIComponent(String(projectId))}`, {
      method: "PATCH",
      body: payload
    });
  }

  async function getStudentConversations(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value == null || value === "") return;
      query.set(key, String(value));
    });
    return request(`/student/conversations${query.toString() ? `?${query.toString()}` : ""}`);
  }

  async function createStudentConversation(payload) {
    return request("/student/conversations", {
      method: "POST",
      body: payload
    });
  }

  async function getAdminStats() {
    return request("/admin/stats");
  }

  async function getAdminPackages() {
    return request("/admin/packages");
  }

  async function getAdminUsers(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value == null || value === "") return;
      query.set(key, String(value));
    });

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/admin/users${suffix}`);
  }

  async function updateAdminUser(userId, payload) {
    return request(`/admin/users/${encodeURIComponent(String(userId))}`, {
      method: "PATCH",
      body: payload
    });
  }

  async function updateAdminPackage(packageId, payload) {
    return request(`/admin/packages/${encodeURIComponent(String(packageId))}`, {
      method: "PATCH",
      body: payload
    });
  }

  async function sendChat(payload) {
    return request("/chat/send", {
      method: "POST",
      body: payload
    });
  }

  async function smartSearch(payload) {
    return request("/tools/smart-search", {
      method: "POST",
      body: payload
    });
  }

  async function runWritingAssistant(payload) {
    return request("/tools/writing-assistant", {
      method: "POST",
      body: payload
    });
  }

  async function getHealth() {
    return request("/health", {
      method: "GET",
      skipAuth: true
    });
  }

  async function streamChat(payload) {
    return request("/chat/stream", {
      method: "POST",
      body: payload
    });
  }

  async function getChatSessions() {
    return request("/chat/sessions");
  }

  async function getChatSession(conversationId) {
    return request(`/chat/sessions/${conversationId}`);
  }

  async function deleteChatSession(conversationId) {
    return request(`/chat/sessions/${encodeURIComponent(String(conversationId))}`, {
      method: "DELETE"
    });
  }

  async function performLogout(redirectTo = "index.html") {
    try {
      localStorage.setItem(storageKeys.logoutMarker, "1");
      setCookie(cookieKeys.logoutMarker, "1", 2);
    } catch (_) {
      // Ignore logout marker issues and continue cleanup.
    }

    if (hasToken()) {
      try {
        await logout();
      } catch (_) {
        clearSession();
      }
    } else {
      clearSession();
    }

    try {
      localStorage.removeItem("mlm_current_user");
      localStorage.removeItem("mlm_admin_session");
      localStorage.removeItem("mlm_resume_prompt");
      localStorage.removeItem("mlm_pending_auth");
    } catch (_) {
      // Ignore cleanup issues.
    }

    if (redirectTo) {
      window.location.href = redirectTo;
    }
  }

  document.addEventListener("click", (event) => {
    const logoutButton = event.target.closest("[data-logout]");
    if (!logoutButton) return;
    event.preventDefault();
    const redirectTarget = logoutButton.getAttribute("data-logout-redirect") || "index.html";
    performLogout(redirectTarget);
  });

  restorePersistentAuthFromCookies();
  syncLegacySessionUser();
  persistLegacyAuthState();
  redirectAuthenticatedUserFromLanding();
  upgradeHomeLinksForAuthenticatedUser();

  window.mullemApiClient = {
    storageKeys,
    resolveBaseUrl,
    setBaseUrl,
    buildApiUrl,
    request,
    buildSameOriginApiUrl,
    buildApiCandidates,
    login,
    register,
    logout,
    me,
    getPackages,
    getStudentDashboard,
    getGuestStatus,
    getStudentProjects,
    createStudentProject,
    updateStudentProject,
    getStudentConversations,
    createStudentConversation,
    getAdminStats,
    getAdminPackages,
    getAdminUsers,
    updateAdminPackage,
    updateAdminUser,
    sendChat,
    smartSearch,
    runWritingAssistant,
    getHealth,
    streamChat,
    getChatSessions,
    getChatSession,
    deleteChatSession,
    getToken,
    hasToken,
    isAuthenticatedStudent,
    getSessionUser,
    setSession,
    clearSession,
    syncLegacySessionUser,
    restorePersistentAuthFromCookies,
    persistLegacyAuthState,
    performLogout,
    redirectAuthenticatedUserFromLanding,
    upgradeHomeLinksForAuthenticatedUser
  };
})();

