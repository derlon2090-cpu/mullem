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
  return `${Number(value || 0)} ريال`;
}

function formatPackagesXp(value) {
  return `${Number(value || 0)} XP`;
}

function formatPackagesDuration(value) {
  const days = Number(value || 0);
  if (!days) return "بدون مدة اشتراك";
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

function getGuestPackageSnapshot() {
  return {
    name: "التجربة المجانية",
    xpText: "50 XP بعد التسجيل",
    dailyText: "5 XP يوميًا بعد الدخول",
    priceText: "0 ريال",
    durationText: "متاحة للزائر",
    expiryText: "يمكنك استعراض الباقات الآن، وتفعيل أي باقة يتطلب تسجيل الدخول إلى حسابك.",
    summary: "الوضع المجاني يمنح الزائر استعراض الباقات والمنصة، ويبدأ الحساب الجديد بـ 50 XP مع حفظ التقدم بعد تسجيل الدخول، ثم يتجدد له 5 XP يوميًا.",
    benefits: [
      "عرض جميع الباقات قبل إنشاء الحساب",
      "الشات يفتح بعد تسجيل الدخول فقط",
      "50 XP بداية للحساب عند التسجيل + 5 XP يوميًا"
    ]
  };
}

function getFallbackPackagesCatalog() {
  return [
    {
      id: "fallback-pro",
      name: "شرارة",
      daily_xp: 80,
      price_sar: 9,
      duration_days: 30,
      is_active: 1,
      is_default: 0,
      summary: "بداية ذكية وسعر بسيط للاستخدام اليومي الخفيف.",
      benefits: [
        "80 XP يوميًا لمدة شهر",
        "9 ريال شهريًا",
        "حفظ المحادثات والمشروعات داخل الحساب"
      ]
    },
    {
      id: "fallback-pro-plus",
      name: "طويق",
      daily_xp: 250,
      price_sar: 29,
      duration_days: 30,
      is_active: 1,
      is_default: 0,
      summary: "ثبات وقوة للاستخدام المتوازن والمذاكرة اليومية.",
      benefits: [
        "250 XP يوميًا لمدة شهر",
        "29 ريال شهريًا",
        "توازن أفضل بين السعر والاستخدام"
      ]
    },
    {
      id: "fallback-pro-max",
      name: "الرائد",
      daily_xp: 600,
      price_sar: 59,
      duration_days: 30,
      is_active: 1,
      is_default: 0,
      summary: "لمن يريد الوصول لكل شيء بأعلى سرعة ورصيد يومي أكبر.",
      benefits: [
        "600 XP يوميًا لمدة شهر",
        "59 ريال شهريًا",
        "أفضل خيار للمواد الثقيلة والمشروعات"
      ]
    }
  ];
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

function renderPackagesAuthState(_message, isError = false) {
  if (!packagesAuthStateRoot) return;
  packagesAuthStateRoot.hidden = false;
  packagesAuthStateRoot.innerHTML = `
    <div class="packages-lock-card packages-lock-card-minimal${isError ? " packages-lock-card-error" : ""}">
      <div class="packages-lock-actions">
        <a class="primary-btn" href="login.html">تسجيل الدخول</a>
        <a class="secondary-btn" href="index.html">العودة إلى الشات</a>
      </div>
    </div>
  `;
}

function hidePackagesAuthState() {
  if (!packagesAuthStateRoot) return;
  packagesAuthStateRoot.hidden = true;
}

function renderCurrentPackage(user) {
  if (user) {
    if (packageTopXpRoot) packageTopXpRoot.textContent = String(Number(user.xp || 0));
    if (packageTopStatusRoot) {
      packageTopStatusRoot.textContent = user.package
        ? `باقتك الحالية: ${user.package}`
        : "سجّل الدخول لمعرفة باقتك الحالية";
    }
    if (currentPackageNameRoot) currentPackageNameRoot.textContent = user.package || "التمهيدية";
    if (currentPackageXpRoot) currentPackageXpRoot.textContent = formatPackagesXp(user.xp || 0);
    if (currentPackageDailyRoot) currentPackageDailyRoot.textContent = formatPackagesXp(user.packageDailyXp || 0);
    if (currentPackagePriceRoot) currentPackagePriceRoot.textContent = formatPackagesPrice(user.packagePriceSar || 0);
    if (currentPackageDurationRoot) currentPackageDurationRoot.textContent = formatPackagesDuration(user.packageDurationDays || 0);
    if (currentPackageExpiryRoot) {
      currentPackageExpiryRoot.textContent = user.packageExpiresAt
        ? `تنتهي الباقة في ${formatPackagesDate(user.packageExpiresAt)}${Number.isFinite(Number(user.packageDaysRemaining)) ? ` (${user.packageDaysRemaining} يوم متبقٍ)` : ""}`
        : "هذه الباقة لا تملك مدة اشتراك حالية أو أنها الباقة المجانية.";
    }
    if (currentPackageSummaryRoot) {
      currentPackageSummaryRoot.textContent = user.packageSummary
        || "يمكنك متابعة باقتك الحالية وتجدد رصيدك اليومي من هذه الصفحة.";
    }
    if (currentPackageBenefitsRoot) {
      const benefits = Array.isArray(user.packageBenefits) ? user.packageBenefits : [];
      currentPackageBenefitsRoot.innerHTML = benefits.length
        ? benefits.map((item) => `<li>${escapePackagesHtml(item)}</li>`).join("")
        : "<li>هذه الباقة صالحة لمتابعة دروسك ومحادثاتك داخل المنصة.</li>";
    }
    if (packageUserNameRoot) packageUserNameRoot.textContent = user.name || "طالب ملم";
    return;
  }

  const guestView = getGuestPackageSnapshot();
  if (packageTopXpRoot) packageTopXpRoot.textContent = "0";
  if (packageTopStatusRoot) packageTopStatusRoot.textContent = "تصفّح الباقات مفتوح، وتسجيل الدخول مطلوب لطلب التفعيل.";
  if (currentPackageNameRoot) currentPackageNameRoot.textContent = guestView.name;
  if (currentPackageXpRoot) currentPackageXpRoot.textContent = guestView.xpText;
  if (currentPackageDailyRoot) currentPackageDailyRoot.textContent = guestView.dailyText;
  if (currentPackagePriceRoot) currentPackagePriceRoot.textContent = guestView.priceText;
  if (currentPackageDurationRoot) currentPackageDurationRoot.textContent = guestView.durationText;
  if (currentPackageExpiryRoot) currentPackageExpiryRoot.textContent = guestView.expiryText;
  if (currentPackageSummaryRoot) currentPackageSummaryRoot.textContent = guestView.summary;
  if (currentPackageBenefitsRoot) {
    currentPackageBenefitsRoot.innerHTML = guestView.benefits
      .map((item) => `<li>${escapePackagesHtml(item)}</li>`)
      .join("");
  }
  if (packageUserNameRoot) packageUserNameRoot.textContent = "زائر المنصة";
}

function renderPackageCardAction(item, currentUser, isCurrent) {
  if (!currentUser) {
    return `
      <a class="primary-btn" href="login.html">سجّل الدخول لطلبها</a>
      <span class="packages-plan-note">عرض الباقات متاح الآن، لكن تفعيل الباقة يتم بعد تسجيل الدخول إلى الحساب.</span>
    `;
  }

  if (isCurrent) {
    return `
      <button class="primary-btn" type="button" disabled>مفعلة الآن</button>
      <span class="packages-plan-note">هذه هي الباقة المفعلة على حسابك حاليًا.</span>
    `;
  }

  return `
    <button class="primary-btn" type="button" disabled>الطلب عبر المتجر قريبًا</button>
    <span class="packages-plan-note">سيتم تفعيل الطلب عبر المتجر لاحقًا، ويمكن للأدمن أيضًا تفعيلها مباشرة لك.</span>
  `;
}

function renderPackageCards(items, currentUser) {
  if (!packagesGridRoot) return;
  const currentPackageId = currentUser?.packageId != null ? String(currentUser.packageId) : "";
  packagesGridRoot.innerHTML = items.map((item) => {
    const isCurrent = currentPackageId && currentPackageId === String(item.id);
    const tags = [
      isCurrent ? '<span class="packages-card-badge packages-card-badge-current">مفعلة لحسابك</span>' : "",
      item.is_default ? '<span class="packages-card-badge">الافتراضية</span>' : "",
      !item.is_active ? '<span class="packages-card-badge packages-card-badge-muted">متوقفة</span>' : ""
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
          ${renderPackageCardAction(item, currentUser, isCurrent)}
        </div>
      </article>
    `;
  }).join("");
}

async function bootstrapPackagesPage() {
  const apiClient = window.mullemApiClient;
  const fallbackItems = getFallbackPackagesCatalog();
  if (!apiClient || typeof apiClient.getPackages !== "function") {
    renderCurrentPackage(null);
    renderPackageCards(fallbackItems, null);
    if (packagesDashboardRoot) packagesDashboardRoot.hidden = false;
    renderPackagesAuthState("يمكنك استعراض الباقات الآن، وتفعيل أي باقة يتطلب تسجيل الدخول إلى الحساب.", false);
    return;
  }

  const hasSession = apiClient.hasToken();
  const [packagesResult, meResult] = await Promise.all([
    apiClient.getPackages(),
    hasSession ? apiClient.me() : Promise.resolve({ ok: true, data: { user: null } })
  ]);
  const cachedUser = typeof apiClient.getSessionUser === "function" ? apiClient.getSessionUser() : null;
  const user = packagesResult.data?.user || meResult.data?.user || cachedUser || null;
  const items = Array.isArray(packagesResult.data?.items)
    ? packagesResult.data.items
        .slice()
        .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0))
    : fallbackItems;

  renderCurrentPackage(user);
  renderPackageCards(items, user);

  if (packagesDashboardRoot) {
    packagesDashboardRoot.hidden = false;
  }

  if (user) {
    hidePackagesAuthState();
  } else {
    const fallbackNotice = !packagesResult.ok
      ? "نعرض لك الباقات المتاحة الآن مباشرة. قد تتأخر مزامنة التفاصيل من الخادم لحظيًا، لكن طلب أي باقة ما زال يتطلب تسجيل الدخول."
      : "يمكنك الآن الاطلاع على تفاصيل كل باقة ومزاياها. لتفعيل أي باقة أو طلبها يجب تسجيل الدخول إلى حسابك في المنصة.";
    renderPackagesAuthState(fallbackNotice);
  }
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
    renderCurrentPackage(null);
    renderPackageCards(getFallbackPackagesCatalog(), null);
    if (packagesDashboardRoot) packagesDashboardRoot.hidden = false;
    renderPackagesAuthState(error?.message || "نعرض لك الباقات الآن، وتعذر فقط مزامنة البيانات المباشرة من الخادم.", false);
  });
}

initializePackagesPage();
