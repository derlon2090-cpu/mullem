(() => {
  try {
    const cookieKeys = {
      token: "mlm_auth_token",
      user: "mlm_auth_user",
      currentUser: "mlm_auth_current_user",
      adminSession: "mlm_auth_admin_session",
      logoutMarker: "mlm_auth_logged_out"
    };

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
        // Ignore cookie cleanup issues during early bootstrap.
      }
    }

    function getRootCookieDomain() {
      const host = String(window.location?.hostname || "").toLowerCase();
      if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return "";
      const parts = host.split(".").filter(Boolean);
      if (parts.length < 2) return "";
      return `.${parts.slice(-2).join(".")}`;
    }

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
        // Ignore storage failures during early bootstrap.
      }
    }

    function restorePersistentAuthState() {
      const logoutMarker = localStorage.getItem(cookieKeys.logoutMarker) || getCookie(cookieKeys.logoutMarker);
      if (logoutMarker === "1") {
        [
          "mlm_api_token",
          "mlm_api_user",
          "mlm_current_user",
          "mlm_admin_session"
        ].forEach((key) => localStorage.removeItem(key));
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

      if (cookieToken && !localStorage.getItem("mlm_api_token")) {
        localStorage.setItem("mlm_api_token", cookieToken);
      }

      let parsedUser = null;
      if (cookieUser) {
        try {
          parsedUser = JSON.parse(cookieUser);
          if (!localStorage.getItem("mlm_api_user")) {
            saveJson("mlm_api_user", parsedUser);
          }
        } catch (_) {
          parsedUser = null;
        }
      }

      if (cookieCurrentUser && !localStorage.getItem("mlm_current_user")) {
        localStorage.setItem("mlm_current_user", cookieCurrentUser);
      }

      if (cookieAdminSession && !localStorage.getItem("mlm_admin_session")) {
        localStorage.setItem("mlm_admin_session", cookieAdminSession);
      }

      const sessionUser = parsedUser || loadJson("mlm_api_user", null);
      if (sessionUser?.id) {
        const legacyUsers = loadJson("mlm_users", []);
        const existing = legacyUsers.find((user) => String(user.id) === String(sessionUser.id));
        const mergedUser = {
          ...(existing || {}),
          id: String(sessionUser.id),
          name: sessionUser.name || existing?.name || "",
          email: String(sessionUser.email || existing?.email || "").toLowerCase(),
          password: existing?.password || "",
          role: String(sessionUser.role || existing?.role || "student").toLowerCase() === "admin" ? "Admin" : "Student",
          stage: sessionUser.stage || existing?.stage || "",
          grade: sessionUser.grade || existing?.grade || "",
          subject: sessionUser.subject || existing?.subject || "",
          package: sessionUser.package || existing?.package || "API Connected",
          xp: Number.isFinite(Number(sessionUser.xp)) ? Number(sessionUser.xp) : Number(existing?.xp || 0),
          streakDays: Number.isFinite(Number(existing?.streakDays)) ? Number(existing.streakDays) : 0,
          lastActiveDate: existing?.lastActiveDate || "",
          achievements: Array.isArray(existing?.achievements) ? existing.achievements : [],
          status: existing?.status || "نشط",
          activity: existing?.activity || "تمت استعادة الجلسة من الكوكيز"
        };

        saveJson(
          "mlm_users",
          [mergedUser, ...legacyUsers.filter((user) => String(user.id) !== String(mergedUser.id))]
        );
      }
    }

    restorePersistentAuthState();
    window.mullemApiClient?.restorePersistentAuthFromCookies?.();
    window.mullemApiClient?.syncLegacySessionUser?.();
    window.mullemApiClient?.persistLegacyAuthState?.();

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (window.location.hash === "#chat") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    const currentUser = localStorage.getItem("mlm_current_user");
    const protectedPages = [
      "student.html",
      "chat.html",
      "analysis.html",
      "teacher.html",
      "files.html",
      "profile.html"
    ];
    const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();

    if (currentUser) {
      const users = JSON.parse(localStorage.getItem("mlm_users") || "[]");
      const activeUser = users.find((user) => user.id === currentUser);
      const hasRequiredProfile =
        Boolean(activeUser?.name?.trim?.()) &&
        Boolean(activeUser?.email?.trim?.()) &&
        Boolean(activeUser?.grade?.trim?.());

      if (protectedPages.includes(currentPage) && !hasRequiredProfile) {
        localStorage.removeItem("mlm_current_user");
        window.location.replace("login.html");
        return;
      }
    }

    if (!currentUser) {
      [
        "mlm_liked_answers_guest",
        "mlm_chat_history_guest",
        "mlm_analytics_guest",
        "mlm_feedback_log_guest",
        "mlm_ai_logs_guest",
        "mlm_chat_sessions_guest",
        "mlm_active_session_guest",
        "mlm_resume_prompt"
      ].forEach((key) => localStorage.removeItem(key));

      if (protectedPages.includes(currentPage)) {
        window.location.replace("login.html");
        return;
      }
    }

  } catch (_) {
    // Ignore storage/bootstrap issues and let the app continue loading.
  }
})();
