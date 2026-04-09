(function adminPackagesModule() {
  const packagesRoot = document.querySelector("[data-admin-packages]");
  if (!packagesRoot) return;

  let packageItems = [];

  function getAdminPackagesClient() {
    return window.mullemApiClient && typeof window.mullemApiClient.getAdminPackages === "function"
      ? window.mullemApiClient
      : null;
  }

  function escapeAdminPackagesHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatAdminPackagesPrice(value) {
    return `${Number(value || 0)} ريال`;
  }

  function formatAdminPackagesDuration(value) {
    const days = Number(value || 0);
    if (!days) return "مجانية";
    if (days === 30) return "شهر واحد";
    return `${days} يوم`;
  }

  function buildPackageAssignmentHint() {
    if (!packageItems.length) return "لا توجد باقات محملة الآن.";
    return packageItems
      .map((item, index) => `${index + 1}. ${item.name} — ${item.daily_xp} XP يوميًا — ${item.price_sar} ريال — ${formatAdminPackagesDuration(item.duration_days)}`)
      .join("\n");
  }

  function resolveSelectedPackage(input) {
    const normalized = String(input || "").trim().toLowerCase();
    if (!normalized) return null;

    const byIndex = Number(normalized);
    if (Number.isFinite(byIndex) && byIndex >= 1 && byIndex <= packageItems.length) {
      return packageItems[byIndex - 1];
    }

    return packageItems.find((item) => {
      const name = String(item.name || "").trim().toLowerCase();
      const key = String(item.key || "").trim().toLowerCase();
      return String(item.id) === normalized || name === normalized || key === normalized;
    }) || null;
  }

  function renderAdminPackages() {
    if (!packagesRoot) return;

    if (!packageItems.length) {
      packagesRoot.innerHTML = `
        <div class="admin-item">
          <strong>لم يتم تحميل الباقات بعد</strong>
          <span>سجّل دخول الأدمن ثم حدّث الصفحة حتى نقرأ الباقات من قاعدة البيانات.</span>
        </div>
      `;
      return;
    }

    packagesRoot.innerHTML = `
      <div class="admin-packages-grid">
        ${packageItems.map((item) => `
          <article class="admin-package-card" data-package-card="${escapeAdminPackagesHtml(item.id)}">
            <div class="admin-package-head">
              <div>
                <strong>${escapeAdminPackagesHtml(item.name || "باقة")}</strong>
                <span>${formatAdminPackagesPrice(item.price_sar)} • ${formatAdminPackagesDuration(item.duration_days)}</span>
              </div>
              <div class="admin-package-badges">
                ${item.is_default ? '<span class="admin-source-chip">الافتراضية</span>' : ""}
                ${item.is_active ? '<span class="admin-source-chip">نشطة</span>' : '<span class="admin-source-chip">متوقفة</span>'}
              </div>
            </div>

            <div class="admin-package-form">
              <label>
                <span>اسم الباقة</span>
                <input class="field" type="text" data-package-name value="${escapeAdminPackagesHtml(item.name || "")}">
              </label>
              <label>
                <span>المفتاح الداخلي</span>
                <input class="field" type="text" data-package-key value="${escapeAdminPackagesHtml(item.key || "")}">
              </label>
              <label>
                <span>XP يومي</span>
                <input class="field" type="number" min="0" step="1" data-package-daily value="${escapeAdminPackagesHtml(item.daily_xp || 0)}">
              </label>
              <label>
                <span>السعر الشهري</span>
                <input class="field" type="number" min="0" step="1" data-package-price value="${escapeAdminPackagesHtml(item.price_sar || 0)}">
              </label>
              <label>
                <span>مدة الباقة بالأيام</span>
                <input class="field" type="number" min="0" step="1" data-package-duration value="${escapeAdminPackagesHtml(item.duration_days || 0)}">
              </label>
              <label class="admin-package-summary">
                <span>الوصف المختصر</span>
                <textarea class="field" rows="3" data-package-summary>${escapeAdminPackagesHtml(item.summary || "")}</textarea>
              </label>
              <label class="admin-package-summary">
                <span>المزايا المختصرة (كل ميزة في سطر)</span>
                <textarea class="field" rows="4" data-package-benefits>${escapeAdminPackagesHtml((Array.isArray(item.benefits) ? item.benefits : []).join("\n"))}</textarea>
              </label>
              <label class="admin-check">
                <input type="checkbox" data-package-active ${item.is_active ? "checked" : ""}>
                <span>نشطة للعرض في صفحة الباقات</span>
              </label>
              <label class="admin-check">
                <input type="checkbox" data-package-default ${item.is_default ? "checked" : ""}>
                <span>الباقة الافتراضية للحسابات الجديدة</span>
              </label>
            </div>

            <div class="admin-table-actions">
              <button type="button" class="primary-btn" data-package-save="${escapeAdminPackagesHtml(item.id)}">حفظ التعديلات</button>
            </div>
            <div class="small-copy" data-package-state="${escapeAdminPackagesHtml(item.id)}">أي تعديل هنا يُحفظ في قاعدة البيانات ويظهر مباشرة داخل صفحة الباقات.</div>
          </article>
        `).join("")}
      </div>
    `;
  }

  async function loadAdminPackages() {
    const apiClient = getAdminPackagesClient();
    if (!apiClient || !apiClient.hasToken()) {
      renderAdminPackages();
      return;
    }

    const result = await apiClient.getAdminPackages();
    if (!result.ok || !Array.isArray(result.data?.items)) {
      packagesRoot.innerHTML = `
        <div class="admin-item">
          <strong>تعذر تحميل الباقات</strong>
          <span>${escapeAdminPackagesHtml(result.message || "الخادم لم يرجع قائمة الباقات الآن.")}</span>
        </div>
      `;
      return;
    }

    packageItems = result.data.items
      .slice()
      .sort((left, right) => Number(left.sort_order || 0) - Number(right.sort_order || 0));
    renderAdminPackages();
  }

  async function savePackageFromCard(packageId) {
    const apiClient = getAdminPackagesClient();
    const card = packagesRoot.querySelector(`[data-package-card="${CSS.escape(String(packageId))}"]`);
    if (!apiClient || !card) return;

    const state = card.querySelector(`[data-package-state="${CSS.escape(String(packageId))}"]`);
    if (state) state.textContent = "جارٍ حفظ تعديلات الباقة...";

    const payload = {
      name: card.querySelector("[data-package-name]")?.value?.trim() || "",
      key: card.querySelector("[data-package-key]")?.value?.trim() || "",
      daily_xp: Number(card.querySelector("[data-package-daily]")?.value || 0),
      price_sar: Number(card.querySelector("[data-package-price]")?.value || 0),
      duration_days: Number(card.querySelector("[data-package-duration]")?.value || 0),
      summary: card.querySelector("[data-package-summary]")?.value?.trim() || "",
      benefits: card.querySelector("[data-package-benefits]")?.value?.trim() || "",
      is_active: Boolean(card.querySelector("[data-package-active]")?.checked),
      is_default: Boolean(card.querySelector("[data-package-default]")?.checked)
    };

    const result = await apiClient.updateAdminPackage(packageId, payload);
    if (!result.ok) {
      if (state) state.textContent = result.message || "تعذر حفظ تعديلات الباقة.";
      return;
    }

    if (state) state.textContent = "تم حفظ التعديلات في قاعدة البيانات بنجاح.";
    await loadAdminPackages();
    if (typeof refreshAdminData === "function") refreshAdminData();
  }

  const originalEditUserRecord = typeof editUserRecord === "function" ? editUserRecord : null;
  window.editUserRecord = async function editUserRecordWithPackages(userId) {
    const user = typeof getUsers === "function"
      ? getUsers().find((entry) => String(entry.id) === String(userId))
      : null;

    if (!user) {
      if (originalEditUserRecord) return originalEditUserRecord(userId);
      return;
    }

    if (!packageItems.length) {
      await loadAdminPackages();
    }

    const name = window.prompt("اسم المستخدم", user.name || "");
    if (name === null) return;

    const email = window.prompt("البريد الإلكتروني", user.email || "");
    if (email === null) return;

    const grade = window.prompt("الصف الدراسي", user.grade || "");
    if (grade === null) return;

    const subject = window.prompt("المادة", user.subject || "");
    if (subject === null) return;

    const role = window.prompt("الدور", user.role || "Student");
    if (role === null) return;

    const packageSelection = window.prompt(
      `اختر الباقة للمستخدم:\n${buildPackageAssignmentHint()}\n\nيمكنك كتابة رقم الباقة أو اسمها أو مفتاحها.`,
      user.packageId ? String(user.packageId) : (user.package || "")
    );
    if (packageSelection === null) return;

    const xpRaw = window.prompt("رصيد XP", String(user.xp ?? 0));
    if (xpRaw === null) return;

    const status = window.prompt("الحالة (نشط / محظور / موقوف)", user.status || "نشط");
    if (status === null) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail && typeof isValidEmail === "function" && !isValidEmail(normalizedEmail)) {
      window.alert("البريد الإلكتروني غير صحيح.");
      return;
    }

    const xp = Number(xpRaw);
    if (!Number.isFinite(xp)) {
      window.alert("رصيد XP يجب أن يكون رقمًا صحيحًا.");
      return;
    }

    const selectedPackage = resolveSelectedPackage(packageSelection);
    const nextPayload = {
      name: name.trim() || user.name,
      email: normalizedEmail || user.email,
      grade: grade.trim(),
      subject: subject.trim(),
      role: role.trim() || user.role,
      package_id: selectedPackage?.id ?? user.packageId ?? null,
      package: selectedPackage?.name || String(packageSelection || user.package || "").trim(),
      xp,
      status: status.trim() || "نشط",
      activity: "تم تعديل الحساب والباقات من لوحة الأدمن"
    };

    const result = typeof persistAdminUserUpdate === "function"
      ? await persistAdminUserUpdate(userId, nextPayload, () => nextPayload)
      : { ok: false, message: "تعذر الوصول إلى دالة تحديث المستخدم." };

    if (!result.ok) {
      window.alert(result.message || "تعذر تحديث بيانات المستخدم.");
      return;
    }

    window.alert("تم تحديث المستخدم وباقته بنجاح.");
    if (typeof refreshAdminData === "function") refreshAdminData();
  };

  packagesRoot.addEventListener("click", (event) => {
    const saveButton = event.target.closest("[data-package-save]");
    if (!saveButton) return;
    savePackageFromCard(saveButton.getAttribute("data-package-save"));
  });

  const originalRefreshAdminData = typeof refreshAdminData === "function" ? refreshAdminData : null;
  window.refreshAdminData = function refreshAdminDataWithPackages() {
    if (originalRefreshAdminData) originalRefreshAdminData();
    loadAdminPackages();
  };

  if (typeof isAdminLoggedIn === "function" && isAdminLoggedIn()) {
    loadAdminPackages();
  } else {
    renderAdminPackages();
  }
})();
