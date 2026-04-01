(() => {
  try {
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
