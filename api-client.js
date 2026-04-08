(() => {
  if (window.mullemApiClient) return;

  const storageKeys = {
    token: "mlm_api_token",
    user: "mlm_api_user",
    baseUrl: "mlm_api_base_url"
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

  function sanitizeBaseUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function resolveBaseUrl() {
    const runtimeBase =
      typeof window.MULLEM_API_BASE === "string"
        ? window.MULLEM_API_BASE
        : document.documentElement?.getAttribute("data-api-base") ||
          document.body?.getAttribute("data-api-base") ||
          localStorage.getItem(storageKeys.baseUrl) ||
          "";

    return sanitizeBaseUrl(runtimeBase);
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

  function buildApiCandidates(path) {
    const cleanPath = `/${String(path || "").replace(/^\/+/, "")}`;
    const baseUrl = resolveBaseUrl();
    const configuredApiUrl = buildApiUrl(cleanPath);
    const sameOriginApiUrl = buildSameOriginApiUrl(cleanPath);
    const candidates = [configuredApiUrl, sameOriginApiUrl];

    if (baseUrl) {
      if (/\/api$/i.test(baseUrl)) {
        candidates.push(`${baseUrl.replace(/\/api$/i, "")}${cleanPath}`);
      } else {
        candidates.push(`${baseUrl}${cleanPath}`);
      }
    }

    candidates.push(cleanPath);

    return Array.from(new Set(candidates.filter(Boolean)));
  }

  function getToken() {
    try {
      return localStorage.getItem(storageKeys.token) || "";
    } catch (_) {
      return "";
    }
  }

  function getSessionUser() {
    return loadJson(storageKeys.user, null);
  }

  function hasToken() {
    return Boolean(getToken());
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
      subject: existing.subject || "",
      package: existing.package || "API Connected",
      xp: Number.isFinite(Number(existing.xp)) ? Number(existing.xp) : 100,
      streakDays: Number.isFinite(Number(existing.streakDays)) ? Number(existing.streakDays) : 0,
      lastActiveDate: existing.lastActiveDate || "",
      achievements: Array.isArray(existing.achievements) ? existing.achievements : [],
      status: existing.status || (status === "active" ? "نشط" : status),
      activity: existing.activity || "تمت مزامنة الحساب مع الخادم"
    };
  }

  function syncLegacySessionUser() {
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

  function setSession(session) {
    const token = String(session?.token || "").trim();
    const user = session?.user || null;

    if (!token || !user) {
      clearSession();
      return;
    }

    localStorage.setItem(storageKeys.token, token);
    saveJson(storageKeys.user, user);
    syncLegacySessionUser();
  }

  function clearSession() {
    try {
      localStorage.removeItem(storageKeys.token);
      localStorage.removeItem(storageKeys.user);
    } catch (_) {
      // Ignore cleanup issues.
    }
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

    const requestInit = {
      method: options.method || "GET",
      headers,
      body: bodyIsFormData
        ? options.body
        : options.body != null
          ? JSON.stringify(options.body)
          : undefined
    };

    let lastFailure = null;
    const candidates = buildApiCandidates(path);

    for (const url of candidates) {
      try {
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        const isJsonResponse = contentType.includes("application/json");
        const payload = await parseResponsePayload(response);
        const data = payload?.data ?? null;
        const message =
          payload?.message ||
          payload?.error ||
          (response.ok ? "OK" : "Request failed");

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

        if (result.ok) {
          if (url === buildSameOriginApiUrl(path) && resolveBaseUrl()) {
            setBaseUrl("");
          }
          return result;
        }

        lastFailure = result;
        if (!result.serverUnavailable) {
          return result;
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
      }
    }

    return lastFailure || {
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

  async function login(payload) {
    const result = await request("/auth/login", {
      method: "POST",
      body: payload,
      skipAuth: true
    });

    if (result.ok && result.data?.token && result.data?.user) {
      setSession({
        token: result.data.token,
        user: result.data.user
      });
    }

    return result;
  }

  async function register(payload) {
    const result = await request("/auth/register", {
      method: "POST",
      body: payload,
      skipAuth: true
    });

    if (result.ok && result.data?.token && result.data?.user) {
      setSession({
        token: result.data.token,
        user: result.data.user
      });
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

  async function sendChat(payload) {
    return request("/chat/send", {
      method: "POST",
      body: payload
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

  async function performLogout(redirectTo = "index.html") {
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

  syncLegacySessionUser();

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
    sendChat,
    streamChat,
    getChatSessions,
    getChatSession,
    getToken,
    hasToken,
    getSessionUser,
    setSession,
    clearSession,
    syncLegacySessionUser,
    performLogout
  };
})();
