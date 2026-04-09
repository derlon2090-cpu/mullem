(() => {
  const STORAGE_KEY = "mlm_api_base_url";
  const STATIC_HOST_SUFFIXES = [".github.io", ".pages.dev", ".netlify.app"];
  const DEFAULT_BACKEND_URL = "https://mullem.onrender.com";

  function sanitizeBaseUrl(value) {
    return String(value || "").trim().replace(/\/+$/, "");
  }

  function safeLocalStorageGet(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch (_) {
      return "";
    }
  }

  function safeLocalStorageSet(key, value) {
    try {
      if (value) {
        localStorage.setItem(key, value);
      }
    } catch (_) {
      // Ignore storage issues and keep config readable.
    }
  }

  const currentUrl = new URL(window.location.href);
  const queryBase = sanitizeBaseUrl(
    currentUrl.searchParams.get("api") || currentUrl.searchParams.get("backend")
  );
  const metaBase = sanitizeBaseUrl(
    document.querySelector('meta[name="mullem-api-base"]')?.getAttribute("content") || ""
  );
  const storedBase = sanitizeBaseUrl(safeLocalStorageGet(STORAGE_KEY));
  const presetBase = sanitizeBaseUrl(window.MULLEM_API_BASE || DEFAULT_BACKEND_URL);

  const resolvedBase = queryBase || presetBase || metaBase || storedBase || "";
  const host = String(window.location.hostname || "").toLowerCase();
  const isStaticHost = STATIC_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  const deploymentMode = resolvedBase
    ? "external-backend"
    : (isStaticHost ? "static-host-needs-backend" : "same-origin-or-external-backend");

  if (queryBase) {
    safeLocalStorageSet(STORAGE_KEY, queryBase);
  }

  window.MULLEM_API_BASE = resolvedBase;
  window.MULLEM_RUNTIME_INFO = {
    deploymentMode,
    isStaticHost,
    backendConfigured: Boolean(resolvedBase),
    backendUrl: resolvedBase || null,
    notes: [
      "If the site is deployed as a full Node app, leave MULLEM_API_BASE empty.",
      "If the frontend is deployed separately as static files, set MULLEM_API_BASE to the backend URL.",
      "You can temporarily override the backend from the URL using ?api=https://your-backend-domain.com."
    ]
  };
})();
