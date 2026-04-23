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

  function isLocalHost(hostname) {
    const host = String(hostname || "").toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "";
  }

  const currentUrl = new URL(window.location.href);
  const queryBase = sanitizeBaseUrl(
    currentUrl.searchParams.get("api") || currentUrl.searchParams.get("backend")
  );
  const metaBase = sanitizeBaseUrl(
    document.querySelector('meta[name="mullem-api-base"]')?.getAttribute("content") || ""
  );
  const storedBase = sanitizeBaseUrl(safeLocalStorageGet(STORAGE_KEY));
  const host = String(window.location.hostname || "").toLowerCase();
  const isStaticHost = STATIC_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  const fallbackBase = isLocalHost(host) ? "" : DEFAULT_BACKEND_URL;
  const presetBase = sanitizeBaseUrl(window.MULLEM_API_BASE || fallbackBase);

  const resolvedBase = queryBase || presetBase || metaBase || storedBase || "";
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
      "If the site is deployed locally, leave MULLEM_API_BASE empty.",
      "In production, the frontend will default to the Render backend unless another API base is provided.",
      "You can temporarily override the backend from the URL using ?api=https://your-backend-domain.com."
    ]
  };
})();
