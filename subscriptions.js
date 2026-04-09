const packagesAuthStateRoot = document.querySelector("[data-packages-auth-state]");
const packagesDashboardRoot = document.querySelector("[data-packages-dashboard]");
const packagesGridRoot = document.querySelector("[data-packages-grid]");
const packageTopXpRoot = document.querySelector("[data-package-top-xp]");
const packageTopStatusRoot = document.querySelector("[data-package-top-status]");
const currentPackageNameRoot = document.querySelector("[data-current-package-name]");
const currentPackageXpRoot = document.querySelector("[data-current-package-xp]");
const currentPackageDailyRoot = document.querySelector("[data-current-package-daily]");
const currentPackagePriceRoot = document.querySelector("[data-current-package-price]");
const currentPackageDurationRoot = document.querySelector("[data-current-package-duration]");
const currentPackageExpiryRoot = document.querySelector("[data-current-package-expiry]");
const currentPackageSummaryRoot = document.querySelector("[data-current-package-summary]");
const currentPackageBenefitsRoot = document.querySelector("[data-current-package-benefits]");
const packageUserNameRoot = document.querySelector("[data-package-user-name]");
const themeTogglePackagesButton = document.querySelector("[data-theme-toggle]");
const packagesScrollTopButton = document.querySelector("[data-scroll-top]");

function escapePackagesHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPackagesPrice(value) {
  const amount = Number(value || 0);
  return `${amount} ريال`;
}

function formatPackagesXp(value) {
  return `${Number(value || 0)} XP`;
}

function formatPackagesDuration(value) {
  const days = Number(value || 0);
  if (!days) return "مجانية";
  if (days === 30) return "شهر واحد";
  return `${days} يوم`;
}

function formatPackagesDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(parsed);
  } catch (_) {
    return parsed.toISOString().slice(0, 10);
  }
}

function applyPackagesTheme(theme) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.body.classList.toggle("theme-dark", nextTheme === "dark");
  document.body.classList.toggle("theme-light", nextTheme !== "dark");
  localStorage.setItem("mlm_theme", nextTheme);
}

function syncPackagesScrollTop() {
  if (!packagesScrollTopButton) return;
  packagesScrollTopButton.classList.toggle("visible", window.scrollY > 400);
}

function renderPackagesAuthState(message, isError = false) {
  if (!packagesAuthStateRoot) return;
  packagesAuthStateRoot.hidden = false;
  packagesAuthStateRoot.innerHTML = `
    <div class="packages-lock-card${isError ? " packages-lock-card-error" : ""}">
      <strong>${isError ? "تعذر تحميل بيانات الباقات" : "هذه الصفحة تتطلب تسجيل الدخول إلى الحساب"}</strong>
      <p>${escapePackagesHtml(message)}</p>
      <div class="packages-lock-actions">
        <a class="primary-btn" href="login.html">تسجيل الدخول</a>
        <a class="secondary-btn" href="student.html">العودة إلى الشات</a>
      </div>
    </div>
  `;
}

function renderCurrentPackage(user) {
  if (packageTopXpRoot) packageTopXpRoot.textContent = String(Number(user?.xp || 0));
  if (packageTopStatusRoot) {
    packageTopStatusRoot.textContent = user?.package
      ? `باقتك الحالية: ${user.package}`
      : "سجل الدخول لعرض باقتك الحالية";
  }
  if (currentPackageNameRoot) currentPackageNameRoot.textContent = user?.package || "التمهيدية";
  if (currentPackageXpRoot) currentPackageXpRoot.textContent = formatPackagesXp(user?.xp || 0);
  if (currentPackageDailyRoot) currentPackageDailyRoot.textContent = formatPackagesXp(user?.packageDailyXp || 0);
  if (currentPackagePriceRoot) currentPackagePriceRoot.textContent = formatPackagesPrice(user?.packagePriceSar || 0);
  if (currentPackageDurationRoot) currentPackageDurationRoot.textContent = formatPackagesDuration(user?.packageDurationDays || 0);
  if (currentPackageExpiryRoot) {
    currentPackageExpiryRoot.textContent = user?.packageExpiresAt
      ? `تنتهي الباقة في ${formatPackagesDate(user.packageExpiresAt)}${Number.isFinite(Number(user?.packageDaysRemaining)) ? ` (${user.packageDaysRemaining} يوم متبقٍ)` : ""}`
      : "الباقة المجانية لا تنتهي وتبقى نقطة البداية داخل المنصة.";
  }
  if (currentPackageSummaryRoot) {
    currentPackageSummaryRoot.textContent = user?.packageSummary
      || "هذه الباقة تعطيك نقطة انطلاق داخل المنصة، ويمكن للأدمن تعديلها أو ترقيتها حسب احتياجك.";
  }
  if (currentPackageBenefitsRoot) {
    const benefits = Array.isArray(user?.packageBenefits) ? user.packageBenefits : [];
    currentPackageBenefitsRoot.innerHTML = benefits.length
      ? benefits.map((item) => `<li>${escapePackagesHtml(item)}</li>`).join("")
      : "<li>تجميع الحماس اليومي ومتابعة تقدمك داخل المنصة.</li>";
  }
  if (packageUserNameRoot) packageUserNameRoot.textContent = user?.name || "طالب ملم";
}

function renderPackageCards(items, currentUser) {
  if (!packagesGridRoot) return;
  const currentPackageId = currentUser?.packageId != null ? String(currentUser.packageId) : "";
  packagesGridRoot.innerHTML = items.map((item) => {
    const isCurrent = currentPackageId && currentPackageId === String(item.id);
    const tags = [
      isCurrent ? `<span class="packages-card-badge packages-card-badge-current">مفعلة لحسابك</span>` : "",
      item.is_default ? `<span class="packages-card-badge">الافتراضية</span>` : "",
      !item.is_active ? `<span class="packages-card-badge packages-card-badge-muted">متوقفة</span>` : ""
    ].filter(Boolean).join("");

    return `
      <article class="packages-plan-card${isCurrent ? " packages-plan-card-current" : ""}">
        <div class="packages-plan-head">
          <div>
            <strong>${escapePackagesHtml(item.name || "باقة")}</strong>
            <span>${formatPackagesPrice(item.price_sar)}</span>
          </div>
          <div class="packages-card-badges">${tags}</div>
        </div>
        <div class="packages-plan-xp">${formatPackagesXp(item.daily_xp)} يوميًا</div>
        <div class="packages-plan-duration">المدة: ${formatPackagesDuration(item.duration_days || 0)}</div>
        <p>${escapePackagesHtml(item.summary || "باقة يومية مخصصة لتجديد رصيد التعلم داخل المنصة.")}</p>
        <ul class="packages-plan-benefits">
          ${(Array.isArray(item.benefits) ? item.benefits : []).map((benefit) => `<li>${escapePackagesHtml(benefit)}</li>`).join("")}
        </ul>
        <div class="packages-plan-actions">
          <button class="primary-btn" type="button" disabled>${isCurrent ? "مفعلة الآن" : "اطلبها عبر المتجر قريبًا"}</button>
          <span class="packages-plan-note">يمكن للأدمن تفعيل هذه الباقة لك مباشرة من لوحة الإدارة.</span>
        </div>
      </article>
    `;
  }).join("");
}

async function bootstrapPackagesPage() {
  const apiClient = window.mullemApiClient;
  if (!apiClient || typeof apiClient.me !== "function") {
    renderPackagesAuthState("تعذر الوصول إلى خدمة الحساب الآن. حاول تحديث الصفحة بعد قليل.", true);
    return;
  }

  if (!apiClient.hasToken()) {
    renderPackagesAuthState("سجل الدخول إلى حسابك أولًا حتى نعرض باقتك الحالية والباقات اليومية المفعلة داخل المنصة.");
    return;
  }

  const [meResult, packagesResult] = await Promise.all([
    apiClient.me(),
    apiClient.getPackages()
  ]);

  if (!meResult.ok || !meResult.data?.user) {
    renderPackagesAuthState("لم نتمكن من قراءة جلسة الحساب الحالية. سجل الدخول مرة أخرى ثم افتح صفحة الباقات.", true);
    return;
  }

  if (!packagesResult.ok || !Array.isArray(packagesResult.data?.items)) {
    renderPackagesAuthState(packagesResult.message || "تعذر تحميل الباقات من الخادم الآن.", true);
    return;
  }

  const user = packagesResult.data?.user || meResult.data.user;
  const items = packagesResult.data.items
    .slice()
    .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0));

  renderCurrentPackage(user);
  renderPackageCards(items, user);
  if (packagesAuthStateRoot) packagesAuthStateRoot.hidden = true;
  if (packagesDashboardRoot) packagesDashboardRoot.hidden = false;
}

function initializePackagesPage() {
  applyPackagesTheme(localStorage.getItem("mlm_theme") || "light");
  themeTogglePackagesButton?.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("theme-dark") ? "light" : "dark";
    applyPackagesTheme(nextTheme);
  });

  packagesScrollTopButton?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", syncPackagesScrollTop, { passive: true });
  syncPackagesScrollTop();

  bootstrapPackagesPage().catch((error) => {
    renderPackagesAuthState(error?.message || "حدث خطأ غير متوقع أثناء تحميل صفحة الباقات.", true);
  });
}

initializePackagesPage();
