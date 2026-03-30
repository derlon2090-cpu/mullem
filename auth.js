const authTabs = document.querySelectorAll("[data-auth-tab]");
const loginForm = document.querySelector("[data-auth-login-form]");
const registerForm = document.querySelector("[data-auth-register-form]");
const authState = document.querySelector("[data-auth-state]");

const loginEmail = document.querySelector("[data-auth-login-email]");
const loginPassword = document.querySelector("[data-auth-login-password]");
const registerName = document.querySelector("[data-auth-register-name]");
const registerEmail = document.querySelector("[data-auth-register-email]");
const registerPassword = document.querySelector("[data-auth-register-password]");
const registerGrade = document.querySelector("[data-auth-register-grade]");
const googleButton = document.querySelector("[data-auth-google]");
const forgotButton = document.querySelector("[data-auth-forgot]");
const scrollTopButton = document.querySelector("[data-scroll-top]");
const authCopies = document.querySelectorAll("[data-auth-copy]");
const authTrustBlocks = document.querySelectorAll("[data-auth-trust]");
const authPreviewBlocks = document.querySelectorAll("[data-auth-preview]");
const authFeatureBlocks = document.querySelectorAll("[data-auth-feature]");

const storageKeys = {
  users: "mlm_users",
  currentUser: "mlm_current_user",
  adminSession: "mlm_admin_session"
};

const adminCredentials = {
  email: "admin@mullem.sa",
  password: "Mullem@2026"
};

function loadUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKeys.users) || "[]");
    return Array.isArray(parsed) && parsed.length
      ? parsed
      : [
          {
            id: "student-demo-1",
            name: "طالب تجريبي",
            email: "student@mullem.sa",
            role: "Student",
            package: "مجاني محدود",
            xp: 120,
            status: "نشط",
            activity: "بدأ استخدام المنصة",
            password: "Student@2026"
          }
        ];
  } catch (error) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(storageKeys.users, JSON.stringify(users));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function syncScrollTopButton() {
  if (!scrollTopButton) return;
  scrollTopButton.classList.toggle("visible", window.scrollY > 220);
}

function setActiveTab(mode) {
  const isLogin = mode === "login";
  authTabs.forEach((tab) => {
    tab.classList.toggle("active", tab.getAttribute("data-auth-tab") === mode);
  });
  loginForm.hidden = !isLogin;
  registerForm.hidden = isLogin;
  authCopies.forEach((block) => {
    block.hidden = block.getAttribute("data-auth-copy") !== mode;
  });
  authTrustBlocks.forEach((block) => {
    block.hidden = block.getAttribute("data-auth-trust") !== mode;
  });
  authPreviewBlocks.forEach((block) => {
    block.hidden = block.getAttribute("data-auth-preview") !== mode;
  });
  authFeatureBlocks.forEach((block) => {
    const targetMode = block.getAttribute("data-auth-feature");
    block.hidden = targetMode !== "login" && targetMode !== "register" ? false : targetMode !== mode;
  });
}

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.getAttribute("data-auth-tab"));
  });
});

setActiveTab("login");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = loginEmail.value.trim().toLowerCase();
  const password = loginPassword.value;

  if (!email || !password) {
    authState.textContent = "أدخل البريد الإلكتروني وكلمة المرور أولًا.";
    return;
  }

  if (!isValidEmail(email)) {
    authState.textContent = "البريد الإلكتروني غير صحيح.";
    return;
  }

  if (email === adminCredentials.email && password === adminCredentials.password) {
    localStorage.setItem(storageKeys.adminSession, "1");
    authState.textContent = "تم تسجيل الدخول بنجاح. جارٍ توجيهك إلى لوحة الإدارة.";
    window.location.href = "admin.html";
    return;
  }

  const users = loadUsers();
  const user = users.find((entry) => entry.email?.toLowerCase() === email && entry.password === password);

  if (!user) {
    authState.textContent = "كلمة المرور غير صحيحة أو الحساب غير موجود.";
    return;
  }

  localStorage.setItem(storageKeys.currentUser, user.id);
  authState.textContent = `أهلًا ${user.name}، تم تسجيل الدخول بنجاح.`;
  window.location.href = "index.html";
});

registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = registerName.value.trim();
  const email = registerEmail.value.trim().toLowerCase();
  const password = registerPassword.value;
  const grade = registerGrade.value;

  if (!name || !email || !password) {
    authState.textContent = "أكمل جميع الحقول أولًا.";
    return;
  }

  if (!isValidEmail(email)) {
    authState.textContent = "البريد الإلكتروني غير صحيح.";
    return;
  }

  if (password.length < 6) {
    authState.textContent = "كلمة المرور يجب أن تكون 6 أحرف أو أكثر.";
    return;
  }

  const users = loadUsers();
  if (users.some((entry) => entry.email?.toLowerCase() === email)) {
    authState.textContent = "هذا البريد مسجل مسبقًا.";
    return;
  }

  const user = {
    id: `student-${Date.now()}`,
    name,
    email,
    password,
    role: "Student",
    grade,
    package: "مجاني محدود",
    xp: 120,
    status: "نشط",
    activity: "أنشأ حسابًا جديدًا"
  };

  users.unshift(user);
  saveUsers(users);
  localStorage.setItem(storageKeys.currentUser, user.id);
  authState.textContent = `تم إنشاء الحساب بنجاح يا ${name}.`;
  window.location.href = "index.html";
});

if (googleButton) {
  googleButton.addEventListener("click", () => {
    const users = loadUsers();
    let user = users.find((entry) => entry.email === "google.student@mullem.sa");

    if (!user) {
      user = {
        id: `student-google-${Date.now()}`,
        name: "طالب Google",
        email: "google.student@mullem.sa",
        password: "GoogleLogin",
        role: "Student",
        grade: "الثاني الثانوي",
        package: "مجاني محدود",
        xp: 120,
        status: "نشط",
        activity: "سجل الدخول عبر Google"
      };
      users.unshift(user);
      saveUsers(users);
    }

    localStorage.setItem(storageKeys.currentUser, user.id);
    authState.textContent = "تم تسجيل الدخول عبر Google التجريبي، جارٍ تحويلك إلى الشات.";
    window.location.href = "index.html";
  });
}

if (forgotButton) {
  forgotButton.addEventListener("click", () => {
    authState.textContent = "لإعادة التعيين، أدخل بريدك أولًا ثم أنشئ كلمة مرور جديدة من تبويب إنشاء حساب.";
  });
}

if (scrollTopButton) {
  window.addEventListener("scroll", syncScrollTopButton, { passive: true });
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  syncScrollTopButton();
}
