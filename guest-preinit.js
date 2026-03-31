(() => {
  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (window.location.hash === "#chat") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    const currentUser = localStorage.getItem("mlm_current_user");
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
    }

    window.addEventListener("load", () => {
      window.scrollTo(0, 0);
    });
  } catch (_) {
    // Ignore storage/bootstrap issues and let the app continue loading.
  }
})();
