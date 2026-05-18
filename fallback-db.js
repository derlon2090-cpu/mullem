const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FALLBACK_FILE = path.join(__dirname, "runtime-fallback-db.json");
const DAILY_REWARD_INTERVAL_MS = 24 * 60 * 60 * 1000;

const DEFAULT_PACKAGES = [
  {
    id: 1,
    package_key: "starter",
    display_name: "المجانية",
    daily_xp: 5,
    price_sar: 0,
    duration_days: 0,
    summary: "خطة البداية للتجربة الأساسية داخل المنصة.",
    benefits: ["تجربة أولية", "الوصول الأساسي للشات", "ترقية لاحقًا عند الحاجة"],
    is_active: 1,
    is_default: 1,
    sort_order: 1
  },
  {
    id: 2,
    package_key: "pro",
    display_name: "شرارة",
    daily_xp: 80,
    price_sar: 9,
    duration_days: 30,
    summary: "بداية ذكية وسعر بسيط للاستخدام اليومي الخفيف.",
    benefits: ["80 XP يوميًا", "9 ريال شهريًا", "حفظ المحادثات والمشروعات داخل الحساب"],
    is_active: 1,
    is_default: 0,
    sort_order: 2
  },
  {
    id: 3,
    package_key: "pro_plus",
    display_name: "طويق",
    daily_xp: 250,
    price_sar: 29,
    duration_days: 30,
    summary: "ثبات وقوة للاستخدام المتوازن والمذاكرة اليومية.",
    benefits: ["250 XP يوميًا", "29 ريال شهريًا", "توازن أفضل بين السعر والاستخدام"],
    is_active: 1,
    is_default: 0,
    sort_order: 3
  },
  {
    id: 4,
    package_key: "pro_max",
    display_name: "الرائد",
    daily_xp: 600,
    price_sar: 59,
    duration_days: 30,
    summary: "لمن يريد الوصول لكل شيء بأعلى سرعة ورصيد يومي أكبر.",
    benefits: ["600 XP يوميًا", "59 ريال شهريًا", "مناسبة للمشروعات والمواد المتعددة"],
    is_active: 1,
    is_default: 0,
    sort_order: 4
  }
];

function nowIso() {
  return new Date().toISOString();
}

function toJson(value) {
  return JSON.stringify(value, null, 2);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBenefits(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(/\r?\n+/)
    .map((item) => item.replace(/^[\s\-*•]+/, "").trim())
    .filter(Boolean);
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const text = String(value || "").trim().toLowerCase();
  return text === "1" || text === "true" || text === "yes" || text === "on";
}

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function parseTimestampMs(value) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : 0;
}

function getDailyRewardState(lastClaimedAt, nowDate = new Date(), intervalMs = DAILY_REWARD_INTERVAL_MS) {
  const now = nowDate.getTime();
  let lastClaim = parseTimestampMs(lastClaimedAt);
  let correctedLastClaimedAt = null;

  if (lastClaimedAt && (!lastClaim || lastClaim > now)) {
    lastClaim = now;
    correctedLastClaimedAt = nowDate.toISOString();
  }

  const safeInterval = Math.max(1, Number(intervalMs || DAILY_REWARD_INTERVAL_MS));
  const elapsed = lastClaim ? now - lastClaim : safeInterval;
  const canClaim = !lastClaim || elapsed >= safeInterval;
  const nextRewardAt = canClaim ? now : lastClaim + safeInterval;

  return {
    canClaim,
    nextRewardAt,
    remainingMs: canClaim ? 0 : Math.max(0, nextRewardAt - now),
    lastClaimedAt: lastClaim ? new Date(lastClaim).toISOString() : null,
    correctedLastClaimedAt
  };
}

function parseDateStampMs(value) {
  const match = String(value || "").slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return 0;
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function diffDateStamps(startDate, endDate) {
  const start = parseDateStampMs(startDate);
  const end = parseDateStampMs(endDate);
  if (!start || !end) return 0;
  return Math.round((end - start) / 86400000);
}

function getDailyXpPlanKey(user = {}) {
  const planText = [
    user.plan_type,
    user.planType,
    user.package_key,
    user.packageKey,
    user.package_name,
    user.packageName,
    user.package
  ].map((item) => String(item || "").trim().toLowerCase()).join(" ");
  const packageDailyXp = Math.max(0, Number(user.package_daily_xp || user.packageDailyXp || 0));

  if (/(^|\s)(pro_max|pioneer|elite|ultra)(\s|$)/.test(planText) || packageDailyXp >= 600) return "pioneer";
  if (/(^|\s)(pro_plus|tuwaiq|plus)(\s|$)/.test(planText) || packageDailyXp >= 250) return "tuwaiq";
  if (/(^|\s)(pro|spark)(\s|$)/.test(planText) || packageDailyXp >= 80) return "spark";
  return "free";
}

function getDailyXpForUserPlan(user = {}, options = {}) {
  const dailyXpByPlan = options.dailyXpByPlan && typeof options.dailyXpByPlan === "object" ? options.dailyXpByPlan : {};
  const planKey = getDailyXpPlanKey(user);
  if (Object.prototype.hasOwnProperty.call(dailyXpByPlan, planKey)) {
    return Math.max(0, Math.round(Number(dailyXpByPlan[planKey] || 0)));
  }

  const packageDailyXp = Math.max(0, Number(user.package_daily_xp || user.packageDailyXp || 0));
  return packageDailyXp > 0
    ? Math.round(packageDailyXp)
    : Math.max(0, Math.round(Number(options.defaultDailyXp || 0)));
}

function normalizeAiStatus(value, fallback = "draft") {
  if (!String(value || "").trim() && fallback === "") return "";
  const status = String(value || fallback || "draft").trim().toLowerCase();
  return ["draft", "approved", "rejected", "pending"].includes(status) ? status : fallback;
}

function normalizeAiCategory(value) {
  return String(value || "faq").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 80) || "faq";
}

function normalizeAiTags(value) {
  const items = Array.isArray(value)
    ? value
    : String(value || "").split(",").map((item) => item.trim());
  return [...new Set(items.map((item) => String(item || "").trim().slice(0, 40)).filter(Boolean))].slice(0, 12);
}

function extractSearchTerms(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3)
    .slice(0, 12);
}

function addDays(date, days) {
  return new Date(date.getTime() + (Math.max(0, Number(days) || 0) * 86400000));
}

function createEmptyState() {
  return {
    counters: {
      users: 1,
      packages: DEFAULT_PACKAGES.length + 1,
      tokens: 1,
      projects: 1,
      messages: 1,
      guestUsage: 1,
      toolUsage: 1,
      xpLedger: 1,
      adminLogs: 1,
      notifications: 1,
      notificationReads: 1,
      aiFeedback: 1,
      aiTrainingExamples: 1,
      aiKnowledgeSources: 1,
      aiKnowledgeChunks: 1,
      aiQualityEvents: 1
    },
    packages: clone(DEFAULT_PACKAGES),
    users: [],
    apiTokens: [],
    projects: [],
    conversations: [],
    messages: [],
    guestUsage: [],
    toolUsage: [],
    xpLedger: [],
    adminLogs: [],
    notifications: [],
    notificationReads: [],
    aiFeedback: [],
    aiTrainingExamples: [],
    aiKnowledgeSources: [],
    aiKnowledgeChunks: [],
    aiQualityEvents: []
  };
}

function createFallbackDatabaseClient() {
  let state = {
    configured: true,
    connected: true,
    mode: "fallback-file",
    message: "File-based persistence is active."
  };
  let data = createEmptyState();

  function ensureFile() {
    if (!fs.existsSync(FALLBACK_FILE)) {
      fs.writeFileSync(FALLBACK_FILE, toJson(data), "utf8");
    }
  }

  function load() {
    ensureFile();
    try {
      const parsed = JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf8"));
      data = {
        ...createEmptyState(),
        ...parsed,
        counters: { ...createEmptyState().counters, ...(parsed.counters || {}) }
      };
      syncDefaultPackages();
      syncUserRewardFields();
    } catch (_) {
      data = createEmptyState();
      persist();
    }
  }

  function persist() {
    fs.writeFileSync(FALLBACK_FILE, toJson(data), "utf8");
  }

  function syncDefaultPackages() {
    const existingPackages = Array.isArray(data.packages) ? data.packages : [];
    const nextPackages = [...existingPackages];
    for (const defaultPackage of DEFAULT_PACKAGES) {
      const index = nextPackages.findIndex((item) =>
        String(item.package_key || "").trim().toLowerCase() === String(defaultPackage.package_key).toLowerCase()
      );
      if (index === -1) {
        nextPackages.push(clone(defaultPackage));
      } else {
        nextPackages[index] = {
          ...nextPackages[index],
          ...clone(defaultPackage),
          id: nextPackages[index].id || defaultPackage.id
        };
      }
    }
    data.packages = nextPackages.sort((a, b) =>
      Number(a.sort_order || 0) - Number(b.sort_order || 0) ||
      Number(a.id || 0) - Number(b.id || 0)
    );
    data.counters.packages = Math.max(
      Number(data.counters.packages || 1),
      ...data.packages.map((item) => Number(item.id || 0) + 1)
    );
    persist();
  }

  function syncUserRewardFields() {
    data.users = (Array.isArray(data.users) ? data.users : []).map((user) => {
      const balance = Math.max(0, Number(user.balance ?? user.xp ?? user.total_xp ?? 0) || 0);
      const pkg = (Array.isArray(data.packages) ? data.packages : []).find((item) =>
        (user.package_id && Number(item.id) === Number(user.package_id)) ||
        (String(item.package_key || "").trim().toLowerCase() === String(user.package_key || user.plan_type || "").trim().toLowerCase())
      );
      const packageDailyXp = Math.max(0, Math.round(Number(pkg?.daily_xp ?? user.package_daily_xp ?? 0) || 0));
      const dailyRewardAmount = Math.max(0, Math.round(Number(packageDailyXp || user.daily_reward_amount || user.dailyRewardAmount || 0) || 0));
      return {
        ...user,
        package_daily_xp: packageDailyXp || Number(user.package_daily_xp || 0),
        balance,
        xp: Math.max(0, Number(user.xp ?? balance) || 0),
        total_xp: Math.max(0, Number(user.total_xp ?? user.xp ?? balance) || 0),
        daily_reward_amount: dailyRewardAmount,
        last_daily_reward_claimed_at: user.last_daily_reward_claimed_at || user.lastDailyRewardClaimedAt || null,
        last_daily_reward_at: user.last_daily_reward_at || user.lastDailyRewardAt || user.last_daily_xp_granted_at || null
      };
    });
    persist();
  }

  function nextId(key) {
    const value = Number(data.counters[key] || 1);
    data.counters[key] = value + 1;
    return value;
  }

  function listPackagesSync(includeInactive = false) {
    return [...data.packages]
      .filter((item) => includeInactive || Number(item.is_active || 0) === 1)
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(a.id || 0) - Number(b.id || 0))
      .map((item) => ({ ...item, benefits: normalizeBenefits(item.benefits) }));
  }

  function findPackageByIdSync(id) {
    return listPackagesSync(true).find((item) => Number(item.id) === Number(id)) || null;
  }

  function findPackageByKeyOrNameSync(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return null;
    const aliasMap = {
      "نانو": "pro",
      nano: "pro",
      "شرارة": "pro",
      spark: "pro",
      "بلس": "pro_plus",
      "طويق": "pro_plus",
      tuwaiq: "pro_plus",
      plus: "pro_plus",
      "برو": "pro_max",
      "الرائد": "pro_max",
      pioneer: "pro_max",
      "برو بلس": "pro_plus",
      "برو ماكس": "pro_max"
    };
    const packageKey = aliasMap[normalized] || normalized;
    return listPackagesSync(true).find((item) => {
      return String(item.package_key || "").trim().toLowerCase() === packageKey
        || String(item.display_name || "").trim().toLowerCase() === normalized;
    }) || null;
  }

  function findDefaultPackageSync() {
    return listPackagesSync(true).find((item) => Number(item.is_default || 0) === 1) || listPackagesSync(true)[0] || null;
  }

  function packageWindow(pkg) {
    const durationDays = Math.max(0, Number(pkg?.duration_days || 0));
    if (!durationDays) {
      return { package_started_at: null, package_expires_at: null };
    }
    const startDate = new Date();
    return {
      package_started_at: startDate.toISOString(),
      package_expires_at: addDays(startDate, durationDays).toISOString()
    };
  }

  function mergePackageIntoUser(user, pkg) {
    const targetPackage = pkg || findDefaultPackageSync();
    if (!targetPackage) return user;
    const period = packageWindow(targetPackage);
    return {
      ...user,
      package_id: targetPackage.id,
      package_key: targetPackage.package_key,
      package_name: targetPackage.display_name,
      plan_type: targetPackage.package_key,
      package_daily_xp: Number(targetPackage.daily_xp || 0),
      package_price_sar: Number(targetPackage.price_sar || 0),
      package_duration_days: Number(targetPackage.duration_days || 0),
      package_summary: String(targetPackage.summary || "").trim(),
      package_benefits: normalizeBenefits(targetPackage.benefits),
      package_started_at: period.package_started_at,
      package_expires_at: period.package_expires_at
    };
  }

  function findUserByEmailSync(email) {
    const normalized = String(email || "").trim().toLowerCase();
    return data.users.find((item) => String(item.email || "").trim().toLowerCase() === normalized) || null;
  }

  function findUserByIdSync(id) {
    return data.users.find((item) => String(item.id) === String(id)) || null;
  }

  function findConversationSync(id) {
    return data.conversations.find((item) => String(item.id) === String(id)) || null;
  }

  function enrichConversation(conversation) {
    if (!conversation) return null;
    return { ...conversation };
  }

  function listConversationMessages(conversationId, limit = 20) {
    return data.messages
      .filter((item) => String(item.conversation_id) === String(conversationId))
      .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")))
      .slice(-Math.max(1, Number(limit) || 20))
      .map((item) => ({ ...item }));
  }

  async function initialize() {
    load();
    state = {
      configured: true,
      connected: true,
      mode: "fallback-file",
      message: "File-based persistence is active."
    };
  }

  function isReady() {
    return true;
  }

  function getState() {
    return { ...state };
  }

  async function findPackageById(id) {
    return findPackageByIdSync(id);
  }

  async function findDefaultPackage() {
    return findDefaultPackageSync();
  }

  async function findPackageByKeyOrName(value) {
    return findPackageByKeyOrNameSync(value);
  }

  async function listPackages(options = {}) {
    return listPackagesSync(Boolean(options.include_inactive));
  }

  async function updatePackage(id, changes = {}) {
    const index = data.packages.findIndex((item) => Number(item.id) === Number(id));
    if (index === -1) return null;
    const current = data.packages[index];
    const next = {
      ...current,
      ...changes,
      benefits: "benefits" in changes ? normalizeBenefits(changes.benefits) : normalizeBenefits(current.benefits)
    };
    if (Number(next.is_default || 0) === 1) {
      data.packages = data.packages.map((item) => ({ ...item, is_default: Number(item.id) === Number(id) ? 1 : 0 }));
    }
    data.packages[index] = next;
    persist();
    return { ...next, benefits: normalizeBenefits(next.benefits) };
  }

  async function createPackage(payload = {}) {
    const packageKey = String(payload.package_key || payload.key || "").trim().toLowerCase().replace(/\s+/g, "_");
    const displayName = String(payload.display_name || payload.name || "").trim();
    if (!packageKey || !displayName) return null;
    const item = {
      id: nextId("packages"),
      package_key: packageKey,
      display_name: displayName,
      daily_xp: Math.max(0, Math.round(Number(payload.daily_xp || payload.dailyXp || 0) || 0)),
      price_sar: Math.max(0, Number(payload.price_sar || payload.priceSar || payload.monthly_price || 0) || 0),
      duration_days: Math.max(0, Math.round(Number(payload.duration_days || payload.durationDays || 30) || 30)),
      summary: String(payload.summary || "").trim(),
      benefits: normalizeBenefits(payload.benefits || payload.features || []),
      is_active: "is_active" in payload ? (normalizeBoolean(payload.is_active) ? 1 : 0) : 1,
      is_default: 0,
      sort_order: Math.max(0, Math.round(Number(payload.sort_order || payload.sortOrder || 99) || 99))
    };
    data.packages.push(item);
    persist();
    return { ...item, benefits: normalizeBenefits(item.benefits) };
  }

  async function findUserByEmail(email) {
    return findUserByEmailSync(email);
  }

  async function findUserById(id) {
    return findUserByIdSync(id);
  }

  async function createUser(payload = {}) {
    const pkg = payload.package_id
      ? findPackageByIdSync(payload.package_id)
      : findPackageByKeyOrNameSync(payload.package_key || payload.package_name) || findDefaultPackageSync();
    const now = nowIso();
    let user = {
      id: nextId("users"),
      name: String(payload.name || "").trim(),
      email: String(payload.email || "").trim().toLowerCase(),
      password_hash: String(payload.password_hash || ""),
      role: String(payload.role || "student").trim().toLowerCase() || "student",
      stage: String(payload.stage || "").trim(),
      grade: String(payload.grade || "").trim(),
      subject: String(payload.subject || "").trim(),
      balance: Number.isFinite(Number(payload.balance ?? payload.xp)) ? Number(payload.balance ?? payload.xp) : 0,
      xp: Number.isFinite(Number(payload.xp ?? payload.balance)) ? Number(payload.xp ?? payload.balance) : 0,
      total_xp: Number.isFinite(Number(payload.total_xp ?? payload.xp ?? payload.balance)) ? Number(payload.total_xp ?? payload.xp ?? payload.balance) : 0,
      daily_reward_amount: Math.max(0, Math.round(Number(payload.daily_reward_amount ?? payload.dailyRewardAmount ?? pkg?.daily_xp ?? 0) || 0)),
      streak_days: Number(payload.streak_days || 0),
      motivation_score: Number(payload.motivation_score || 0),
      last_active_date: payload.last_active_date || null,
      last_reset: payload.last_reset || payload.last_active_date || null,
      last_daily_xp_claimed_date: payload.last_daily_xp_claimed_date || payload.last_reset || payload.last_active_date || null,
      last_daily_xp_granted_at: payload.last_daily_xp_granted_at || payload.lastDailyXpGrantedAt || null,
      last_daily_reward_claimed_at: payload.last_daily_reward_claimed_at || payload.lastDailyRewardClaimedAt || null,
      last_daily_reward_at: payload.last_daily_reward_at || payload.lastDailyRewardAt || payload.last_daily_xp_granted_at || null,
      signup_bonus_claimed: "signup_bonus_claimed" in payload ? normalizeBoolean(payload.signup_bonus_claimed) : false,
      achievements: Array.isArray(payload.achievements) ? payload.achievements : [],
      status: String(payload.status || "active").trim().toLowerCase() || "active",
      activity: String(payload.activity || "").trim(),
      created_at: now,
      updated_at: now
    };
    user = mergePackageIntoUser(user, pkg);
    if ("package_started_at" in payload) user.package_started_at = payload.package_started_at;
    if ("package_expires_at" in payload) user.package_expires_at = payload.package_expires_at;
    data.users.push(user);
    persist();
    return { ...user };
  }

  async function ensureUserByEmail(payload = {}) {
    const existing = findUserByEmailSync(payload.email);
    if (existing) return { ...existing };
    return createUser(payload);
  }

  async function updateUser(id, changes = {}) {
    const index = data.users.findIndex((item) => String(item.id) === String(id));
    if (index === -1) return null;
    let current = data.users[index];
    const normalizedChanges = { ...changes };
    if ("lastDailyRewardClaimedAt" in normalizedChanges && !("last_daily_reward_claimed_at" in normalizedChanges)) {
      normalizedChanges.last_daily_reward_claimed_at = normalizedChanges.lastDailyRewardClaimedAt;
    }
    if ("lastDailyRewardAt" in normalizedChanges && !("last_daily_reward_at" in normalizedChanges)) {
      normalizedChanges.last_daily_reward_at = normalizedChanges.lastDailyRewardAt;
    }
    if ("dailyRewardAmount" in normalizedChanges && !("daily_reward_amount" in normalizedChanges)) {
      normalizedChanges.daily_reward_amount = normalizedChanges.dailyRewardAmount;
    }
    if ("balance" in normalizedChanges) normalizedChanges.balance = Math.max(0, Math.round(Number(normalizedChanges.balance || 0) || 0));
    if ("daily_reward_amount" in normalizedChanges) normalizedChanges.daily_reward_amount = Math.max(0, Math.round(Number(normalizedChanges.daily_reward_amount || 0) || 0));
    if ("last_daily_reward_claimed_at" in normalizedChanges) normalizedChanges.last_daily_reward_claimed_at = normalizedChanges.last_daily_reward_claimed_at || null;
    if ("xp" in normalizedChanges && !("balance" in normalizedChanges)) normalizedChanges.balance = normalizedChanges.xp;
    if ("balance" in normalizedChanges && !("xp" in normalizedChanges)) normalizedChanges.xp = normalizedChanges.balance;
    if ("xp" in normalizedChanges && !("total_xp" in normalizedChanges)) normalizedChanges.total_xp = normalizedChanges.xp;
    if ("total_xp" in normalizedChanges && !("xp" in normalizedChanges)) normalizedChanges.xp = normalizedChanges.total_xp;
    if ("total_xp" in normalizedChanges && !("balance" in normalizedChanges)) normalizedChanges.balance = normalizedChanges.total_xp;
    let next = {
      ...current,
      ...normalizedChanges,
      updated_at: nowIso()
    };
    if ("last_active_date" in normalizedChanges && !("last_reset" in normalizedChanges)) next.last_reset = normalizedChanges.last_active_date;
    if ("package_id" in normalizedChanges || "package_key" in normalizedChanges || "package_name" in normalizedChanges) {
      const pkg = normalizedChanges.package_id
        ? findPackageByIdSync(normalizedChanges.package_id)
        : findPackageByKeyOrNameSync(normalizedChanges.package_key || normalizedChanges.package_name || "");
      next = mergePackageIntoUser(next, pkg);
      if ("package_started_at" in normalizedChanges) next.package_started_at = normalizedChanges.package_started_at;
      if ("package_expires_at" in normalizedChanges) next.package_expires_at = normalizedChanges.package_expires_at;
      if ("package_name" in normalizedChanges && !pkg) next.package_name = String(normalizedChanges.package_name || "").trim();
    }
    data.users[index] = next;
    persist();
    return { ...next };
  }

  async function listUsers(query = {}) {
    const search = String(query.search || "").trim().toLowerCase();
    const role = String(query.role || "").trim().toLowerCase();
    const statusFilter = String(query.status || "").trim().toLowerCase();
    const offset = Math.max(0, Number(query.offset || 0));
    const limit = Math.max(1, Number(query.limit || 20));
    let items = [...data.users];
    if (search) {
      items = items.filter((item) => {
        return String(item.name || "").toLowerCase().includes(search)
          || String(item.email || "").toLowerCase().includes(search);
      });
    }
    if (role) items = items.filter((item) => String(item.role || "").toLowerCase() === role);
    if (statusFilter) items = items.filter((item) => String(item.status || "").toLowerCase() === statusFilter);
    const total = items.length;
    items = items.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    return {
      total,
      items: items.slice(offset, offset + limit).map((item) => ({ ...item }))
    };
  }

  async function createApiToken(payload = {}) {
    const token = {
      id: nextId("tokens"),
      user_id: Number(payload.user_id),
      name: String(payload.name || "mullem-web").trim(),
      token_hash: String(payload.token_hash || "").trim(),
      created_at: nowIso(),
      last_used_at: nowIso(),
      revoked_at: null
    };
    data.apiTokens.push(token);
    persist();
    return { ...token };
  }

  async function findUserByTokenHash(tokenHash) {
    const token = data.apiTokens.find((item) => String(item.token_hash) === String(tokenHash) && !item.revoked_at);
    if (!token) return null;
    return findUserByIdSync(token.user_id);
  }

  async function touchApiToken(tokenHash) {
    const token = data.apiTokens.find((item) => String(item.token_hash) === String(tokenHash) && !item.revoked_at);
    if (!token) return null;
    token.last_used_at = nowIso();
    persist();
    return { ...token };
  }

  async function revokeApiToken(tokenHash) {
    const token = data.apiTokens.find((item) => String(item.token_hash) === String(tokenHash) && !item.revoked_at);
    if (!token) return false;
    token.revoked_at = nowIso();
    persist();
    return true;
  }

  async function findProjectById(projectId, userId) {
    const project = data.projects.find((item) => String(item.id) === String(projectId) && String(item.user_id) === String(userId));
    return project ? { ...project } : null;
  }

  async function listProjects(userId, options = {}) {
    const includeArchived = Boolean(options.include_archived);
    const limit = Math.max(1, Number(options.limit || 50));
    return data.projects
      .filter((item) => String(item.user_id) === String(userId) && (includeArchived || !Number(item.is_archived || 0)))
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
      .slice(0, limit)
      .map((item) => {
        const conversationsCount = data.conversations.filter((conv) => String(conv.project_id || "") === String(item.id)).length;
        return { ...item, conversations_count: conversationsCount };
      });
  }

  async function createProject(payload = {}) {
    const project = {
      id: nextId("projects"),
      user_id: Number(payload.user_id),
      title: String(payload.title || "").trim(),
      subject: String(payload.subject || "").trim(),
      stage: String(payload.stage || "").trim(),
      grade: String(payload.grade || "").trim(),
      term: String(payload.term || "").trim(),
      lesson: String(payload.lesson || "").trim(),
      description: String(payload.description || "").trim(),
      is_archived: 0,
      created_at: nowIso(),
      updated_at: nowIso(),
      last_activity_at: nowIso()
    };
    data.projects.push(project);
    persist();
    return { ...project, conversations_count: 0 };
  }

  async function updateProject(projectId, userId, changes = {}) {
    const index = data.projects.findIndex((item) => String(item.id) === String(projectId) && String(item.user_id) === String(userId));
    if (index === -1) return null;
    const next = { ...data.projects[index], ...changes, updated_at: nowIso() };
    data.projects[index] = next;
    persist();
    return { ...next };
  }

  async function getOrCreateConversation(payload = {}) {
    let conversationId = String(payload.id || payload.conversation_id || "").trim() || crypto.randomUUID();
    let requestedGuestId = String(payload.guest_session_id || "").trim();
    const requestedUserId = payload.user_id != null ? Number(payload.user_id) : null;
    let existing = findConversationSync(conversationId);
    if (!existing && requestedGuestId) {
      existing = data.conversations.find((item) => String(item.guest_session_id || "") === requestedGuestId) || null;
    }
    if (existing) {
      const belongsToAnotherUser = requestedUserId && existing.user_id && Number(existing.user_id) !== requestedUserId;
      if (belongsToAnotherUser) {
        conversationId = crypto.randomUUID();
        requestedGuestId = "";
        existing = null;
      } else {
        if (requestedUserId && !existing.user_id) existing.user_id = requestedUserId;
        if (payload.project_id != null && !existing.project_id) existing.project_id = Number(payload.project_id);
        if (payload.subject && !existing.subject) existing.subject = String(payload.subject).trim();
        if (payload.stage && !existing.stage) existing.stage = String(payload.stage).trim();
        if (payload.grade && !existing.grade) existing.grade = String(payload.grade).trim();
        if (payload.term && !existing.term) existing.term = String(payload.term).trim();
        existing.updated_at = nowIso();
        persist();
        return enrichConversation(existing);
      }
    }

    const conversation = {
      id: conversationId,
      guest_session_id: requestedGuestId || null,
      user_id: requestedUserId,
      project_id: payload.project_id != null ? Number(payload.project_id) : null,
      title: String(payload.title || payload.message || "").trim() || null,
      subject: String(payload.subject || "").trim() || null,
      stage: String(payload.stage || "").trim() || null,
      grade: String(payload.grade || "").trim() || null,
      term: String(payload.term || "").trim() || null,
      status: "active",
      created_at: nowIso(),
      updated_at: nowIso(),
      last_message_at: null
    };
    data.conversations.push(conversation);
    if (conversation.project_id) {
      const project = data.projects.find((item) => Number(item.id) === Number(conversation.project_id));
      if (project) project.last_activity_at = nowIso();
    }
    persist();
    return enrichConversation(conversation);
  }

  async function saveMessage(conversationId, role, text, source = "web", metadata = {}) {
    const conversation = findConversationSync(conversationId);
    if (!conversation) return null;
    const message = {
      id: nextId("messages"),
      conversation_id: conversationId,
      role: String(role || "").trim(),
      text: String(text || "").trim(),
      user_id: metadata.user_id || metadata.userId || null,
      model_key: metadata.model_key || metadata.modelKey || null,
      input_tokens: Math.max(0, Math.round(Number(metadata.input_tokens || metadata.inputTokens || 0) || 0)),
      output_tokens: Math.max(0, Math.round(Number(metadata.output_tokens || metadata.outputTokens || 0) || 0)),
      xp_cost: Math.max(0, Math.round(Number(metadata.xp_cost || metadata.xpCost || 0) || 0)),
      source: String(source || "web").trim(),
      created_at: nowIso()
    };
    data.messages.push(message);
    conversation.updated_at = message.created_at;
    conversation.last_message_at = message.created_at;
    if (!conversation.title && role === "user") {
      conversation.title = String(text || "").trim().slice(0, 180) || "محادثة";
    }
    if (conversation.project_id) {
      const project = data.projects.find((item) => Number(item.id) === Number(conversation.project_id));
      if (project) {
        project.updated_at = message.created_at;
        project.last_activity_at = message.created_at;
      }
    }
    persist();
    return { ...message };
  }

  async function listMessages(conversationId, limit = 20) {
    return listConversationMessages(conversationId, limit);
  }

  async function listRecentConversations(limit = 20) {
    return [...data.conversations]
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
      .slice(0, Math.max(1, Number(limit) || 20))
      .map(enrichConversation);
  }

  async function listUserConversations(userId, options = {}) {
    const limit = Math.max(1, Number(options.limit || 20));
    const projectId = options.project_id != null ? String(options.project_id) : "";
    return data.conversations
      .filter((item) => String(item.user_id) === String(userId) && (!projectId || String(item.project_id || "") === projectId))
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
      .slice(0, limit)
      .map(enrichConversation);
  }

  async function listUserMemoryCandidates(userId, options = {}) {
    const currentConversationId = String(options.currentConversationId || options.current_conversation_id || "").trim();
    const limit = Math.max(1, Number(options.limit || 20));
    const userConversations = data.conversations
      .filter((item) => String(item.user_id) === String(userId) && String(item.id) !== currentConversationId)
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
      .slice(0, limit);
    return userConversations.map((conversation) => {
      const messages = listConversationMessages(conversation.id, 8);
      return {
        ...conversation,
        messages
      };
    });
  }

  async function getConversationById(conversationId) {
    return enrichConversation(findConversationSync(conversationId));
  }

  async function getConversationByGuestSessionId(guestSessionId) {
    const conversation = data.conversations.find((item) => String(item.guest_session_id || "") === String(guestSessionId || "")) || null;
    return enrichConversation(conversation);
  }

  async function getGuestUsage(guestSessionId) {
    const today = getTodayStamp();
    const row = data.guestUsage.find((item) => String(item.guest_session_id) === String(guestSessionId) && String(item.usage_date) === today) || null;
    return row ? { ...row } : null;
  }

  async function incrementGuestUsage(guestSessionId, amount = 1) {
    const today = getTodayStamp();
    let row = data.guestUsage.find((item) => String(item.guest_session_id) === String(guestSessionId) && String(item.usage_date) === today) || null;
    if (!row) {
      row = {
        id: nextId("guestUsage"),
        guest_session_id: String(guestSessionId || "").trim(),
        usage_date: today,
        messages_count: 0,
        updated_at: nowIso()
      };
      data.guestUsage.push(row);
    }
    row.messages_count = Number(row.messages_count || 0) + Math.max(0, Number(amount) || 0);
    row.updated_at = nowIso();
    persist();
    return { ...row };
  }

  async function recordXpLedger(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const amount = Math.round(Number(payload.amount || 0) || 0);
    const type = String(payload.type || "").trim().toLowerCase().slice(0, 40);
    if (!userId || !type || !amount) return null;

    const entry = {
      id: nextId("xpLedger"),
      user_id: userId,
      amount,
      type,
      reason: String(payload.reason || "").trim(),
      admin_id: payload.admin_id || payload.adminId ? Number(payload.admin_id || payload.adminId) : null,
      created_at: nowIso()
    };
    data.xpLedger.push(entry);
    persist();
    return { ...entry };
  }

  async function saveToolUsage(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const toolKey = String(payload.tool_key || payload.toolKey || payload.tool || "").trim().slice(0, 80);
    if (!userId || !toolKey) return null;
    const entry = {
      id: nextId("toolUsage"),
      user_id: userId,
      tool_key: toolKey,
      task_type: String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
      input_text: String(payload.input_text || payload.inputText || "").trim() || null,
      output_text: String(payload.output_text || payload.outputText || "").trim() || null,
      xp_cost: Math.max(0, Math.round(Number(payload.xp_cost || payload.xpCost || 0) || 0)),
      input_tokens: Math.max(0, Math.round(Number(payload.input_tokens || payload.inputTokens || 0) || 0)),
      output_tokens: Math.max(0, Math.round(Number(payload.output_tokens || payload.outputTokens || 0) || 0)),
      metadata: payload.metadata || null,
      created_at: nowIso()
    };
    data.toolUsage.push(entry);
    persist();
    return { ...entry };
  }

  async function saveFeedback(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const rating = String(payload.rating || "").trim().toLowerCase();
    if (!userId || !rating) return null;
    const entry = {
      id: nextId("aiFeedback"),
      user_id: userId,
      conversation_id: payload.conversation_id || payload.conversationId || null,
      message_id: payload.message_id || payload.messageId ? Number(payload.message_id || payload.messageId) : null,
      model_key: String(payload.model_key || payload.modelKey || "").trim().slice(0, 80) || null,
      provider: String(payload.provider || "").trim().slice(0, 40) || null,
      rating: rating.slice(0, 20),
      reason: String(payload.reason || payload.note || "").trim() || null,
      feedback_type: String(payload.feedback_type || payload.feedbackType || "").trim().slice(0, 40) || null,
      task_type: String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
      question_type: String(payload.question_type || payload.questionType || "").trim().slice(0, 80) || null,
      prompt_key: String(payload.prompt_key || payload.promptKey || "").trim().slice(0, 160) || null,
      prompt_version: String(payload.prompt_version || payload.promptVersion || "").trim().slice(0, 80) || null,
      quality_score: Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 0)))),
      metadata: payload.metadata || null,
      created_at: nowIso()
    };
    data.aiFeedback.push(entry);
    persist();
    return { ...entry };
  }

  async function saveAiTrainingExample(payload = {}) {
    const inputText = String(payload.input_text || payload.inputText || "").trim();
    const idealOutput = String(payload.ideal_output || payload.idealOutput || "").trim();
    if (!inputText || !idealOutput) return null;
    const entry = {
      id: nextId("aiTrainingExamples"),
      input_text: inputText,
      ideal_output: idealOutput,
      task_type: String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
      model_key: String(payload.model_key || payload.modelKey || "").trim().slice(0, 80) || null,
      quality_score: Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 0)))),
      approved_by_admin: normalizeBoolean(payload.approved_by_admin || payload.approvedByAdmin),
      review_status: normalizeAiStatus(payload.review_status || payload.reviewStatus, "pending"),
      admin_note: String(payload.admin_note || payload.adminNote || "").trim() || null,
      metadata: payload.metadata || null,
      created_at: nowIso(),
      updated_at: nowIso()
    };
    data.aiTrainingExamples.push(entry);
    persist();
    return { ...entry };
  }

  async function listExcellentAnswerCandidates(options = {}) {
    const status = normalizeAiStatus(options.status || options.review_status || options.reviewStatus, "");
    const taskType = String(options.task_type || options.taskType || "").trim();
    const modelKey = String(options.model_key || options.modelKey || "").trim();
    const limit = Math.max(1, Math.min(Number(options.limit || 80), 250));
    return [...data.aiTrainingExamples]
      .filter((item) => !status || String(item.review_status || "pending") === status)
      .filter((item) => !taskType || String(item.task_type || "") === taskType)
      .filter((item) => !modelKey || String(item.model_key || "") === modelKey)
      .sort((a, b) =>
        String(a.review_status || "pending").localeCompare(String(b.review_status || "pending")) ||
        Number(b.quality_score || 0) - Number(a.quality_score || 0) ||
        String(b.created_at || "").localeCompare(String(a.created_at || ""))
      )
      .slice(0, limit)
      .map((item) => ({ ...item }));
  }

  async function getTrainingExampleById(exampleId) {
    const item = data.aiTrainingExamples.find((entry) => String(entry.id) === String(exampleId)) || null;
    return item ? { ...item } : null;
  }

  async function updateTrainingExampleReview(exampleId, payload = {}) {
    const index = data.aiTrainingExamples.findIndex((item) => String(item.id) === String(exampleId));
    if (index < 0) return null;
    const current = data.aiTrainingExamples[index];
    const status = normalizeAiStatus(payload.review_status || payload.reviewStatus || payload.status, "pending");
    const next = {
      ...current,
      input_text: String(payload.input_text || payload.inputText || "").trim() || current.input_text,
      ideal_output: String(payload.ideal_output || payload.idealOutput || "").trim() || current.ideal_output,
      review_status: status,
      approved_by_admin: status === "approved",
      admin_note: String(payload.admin_note || payload.adminNote || "").trim() || current.admin_note || null,
      metadata: payload.metadata ? { ...(current.metadata || {}), ...payload.metadata } : current.metadata,
      updated_at: nowIso()
    };
    data.aiTrainingExamples[index] = next;
    persist();
    return { ...next };
  }

  async function saveKnowledgeSource(payload = {}) {
    const title = String(payload.title || "").trim().slice(0, 255);
    const sourceKey = String(payload.source_key || payload.sourceKey || title || crypto.randomUUID()).trim().slice(0, 160);
    if (!title || !sourceKey) return null;
    const existingIndex = data.aiKnowledgeSources.findIndex((item) => String(item.source_key) === sourceKey);
    const existing = existingIndex >= 0 ? data.aiKnowledgeSources[existingIndex] : null;
    const item = {
      ...(existing || {}),
      id: existing?.id || nextId("aiKnowledgeSources"),
      source_key: sourceKey,
      source_type: String(payload.source_type || payload.sourceType || "manual").trim().slice(0, 80),
      title,
      url: String(payload.url || "").trim() || null,
      quality_score: Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 60)))),
      is_active: payload.is_active === undefined ? true : normalizeBoolean(payload.is_active || payload.isActive),
      metadata: payload.metadata ? { ...(existing?.metadata || {}), ...payload.metadata } : existing?.metadata || null,
      category: normalizeAiCategory(payload.category),
      status: normalizeAiStatus(payload.status, "draft"),
      source_label: String(payload.source || payload.source_label || payload.sourceLabel || "").trim().slice(0, 255) || null,
      tags: normalizeAiTags(payload.tags),
      created_at: existing?.created_at || nowIso(),
      updated_at: nowIso()
    };
    if (existingIndex >= 0) data.aiKnowledgeSources[existingIndex] = item;
    else data.aiKnowledgeSources.push(item);
    persist();
    return { ...item };
  }

  async function saveKnowledgeChunk(payload = {}) {
    const content = String(payload.content || payload.chunk_text || payload.text || "").trim();
    if (!content) return null;
    const chunkKey = String(payload.chunk_key || payload.chunkKey || crypto.randomUUID()).trim().slice(0, 180);
    const existingIndex = data.aiKnowledgeChunks.findIndex((item) => String(item.chunk_key) === chunkKey);
    const existing = existingIndex >= 0 ? data.aiKnowledgeChunks[existingIndex] : null;
    const item = {
      ...(existing || {}),
      id: existing?.id || nextId("aiKnowledgeChunks"),
      source_id: payload.source_id || payload.sourceId ? Number(payload.source_id || payload.sourceId) : null,
      chunk_key: chunkKey,
      title: String(payload.title || "").trim().slice(0, 255) || null,
      content,
      sanitized_content: String(payload.sanitized_content || payload.sanitizedContent || content).trim() || null,
      embedding: payload.embedding || null,
      task_type: String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
      quality_score: Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 60)))),
      feedback_score: Math.max(-100, Math.min(100, Math.round(Number(payload.feedback_score || payload.feedbackScore || 0)))),
      usage_count: Math.max(0, Number(existing?.usage_count || 0)),
      metadata: payload.metadata ? { ...(existing?.metadata || {}), ...payload.metadata } : existing?.metadata || null,
      category: normalizeAiCategory(payload.category),
      status: normalizeAiStatus(payload.status, "draft"),
      tags: normalizeAiTags(payload.tags),
      created_at: existing?.created_at || nowIso(),
      updated_at: nowIso()
    };
    if (existingIndex >= 0) data.aiKnowledgeChunks[existingIndex] = item;
    else data.aiKnowledgeChunks.push(item);
    persist();
    return { ...item };
  }

  async function listKnowledgeSources(options = {}) {
    const status = normalizeAiStatus(options.status, "");
    const category = options.category ? normalizeAiCategory(options.category) : "";
    const limit = Math.max(1, Math.min(Number(options.limit || 120), 300));
    return [...data.aiKnowledgeSources]
      .filter((source) => !status || String(source.status || "") === status)
      .filter((source) => !category || String(source.category || "") === category)
      .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
      .slice(0, limit)
      .map((source) => {
        const chunks = data.aiKnowledgeChunks.filter((chunk) => Number(chunk.source_id || 0) === Number(source.id || 0));
        return {
          ...source,
          chunks_count: chunks.length,
          total_usage: chunks.reduce((total, chunk) => total + Number(chunk.usage_count || 0), 0)
        };
      });
  }

  async function updateKnowledgeSource(sourceId, payload = {}) {
    const index = data.aiKnowledgeSources.findIndex((item) => String(item.id) === String(sourceId));
    if (index < 0) return null;
    const current = data.aiKnowledgeSources[index];
    const nextStatus = payload.status ? normalizeAiStatus(payload.status, "draft") : current.status;
    const next = {
      ...current,
      title: String(payload.title || "").trim() || current.title,
      source_type: String(payload.source_type || payload.sourceType || "").trim() || current.source_type,
      category: payload.category ? normalizeAiCategory(payload.category) : current.category,
      status: nextStatus,
      source_label: String(payload.source || payload.source_label || payload.sourceLabel || "").trim() || current.source_label,
      url: String(payload.url || "").trim() || current.url,
      tags: Object.prototype.hasOwnProperty.call(payload, "tags") ? normalizeAiTags(payload.tags) : current.tags,
      is_active: Object.prototype.hasOwnProperty.call(payload, "is_active") || Object.prototype.hasOwnProperty.call(payload, "isActive")
        ? normalizeBoolean(payload.is_active || payload.isActive)
        : current.is_active,
      metadata: payload.metadata ? { ...(current.metadata || {}), ...payload.metadata } : current.metadata,
      updated_at: nowIso()
    };
    data.aiKnowledgeSources[index] = next;
    if (payload.status) {
      data.aiKnowledgeChunks = data.aiKnowledgeChunks.map((chunk) =>
        Number(chunk.source_id || 0) === Number(next.id || 0)
          ? { ...chunk, status: nextStatus, updated_at: nowIso() }
          : chunk
      );
    }
    persist();
    return { ...next };
  }

  async function listKnowledgeChunks(options = {}) {
    const terms = extractSearchTerms(options.query || options.text || "");
    const taskType = String(options.task_type || options.taskType || "").trim();
    const limit = Math.max(1, Math.min(Number(options.limit || 8), 20));
    const approvedSources = new Map(
      data.aiKnowledgeSources
        .filter((source) => source.is_active !== false && source.status === "approved")
        .map((source) => [Number(source.id), source])
    );

    return data.aiKnowledgeChunks
      .filter((chunk) => chunk.status === "approved" && approvedSources.has(Number(chunk.source_id || 0)))
      .filter((chunk) => !taskType || !chunk.task_type || String(chunk.task_type) === taskType)
      .map((chunk) => {
        const source = approvedSources.get(Number(chunk.source_id || 0)) || {};
        const haystack = [
          chunk.title || "",
          chunk.sanitized_content || chunk.content || "",
          Array.isArray(chunk.tags) ? chunk.tags.join(" ") : chunk.tags || "",
          source.title || "",
          source.source_key || "",
          source.source_label || "",
          source.category || "",
          Array.isArray(source.tags) ? source.tags.join(" ") : source.tags || ""
        ].join(" ").toLowerCase();
        const keywordScore = terms.reduce((score, term) => score + (haystack.includes(term) ? 10 : 0), 0);
        return {
          ...chunk,
          content: chunk.sanitized_content || chunk.content,
          source_title: source.title || "",
          source_key: source.source_key || "",
          source_type: source.source_type || "",
          source_category: source.category || "",
          source_status: source.status || "",
          source_label: source.source_label || "",
          source_tags: source.tags || [],
          url: source.url || null,
          keyword_score: keywordScore
        };
      })
      .filter((chunk) => !terms.length || Number(chunk.keyword_score || 0) > 0)
      .sort((a, b) =>
        Number(b.keyword_score || 0) - Number(a.keyword_score || 0) ||
        Number(b.quality_score || 0) - Number(a.quality_score || 0) ||
        Number(b.feedback_score || 0) - Number(a.feedback_score || 0)
      )
      .slice(0, limit)
      .map((chunk) => ({ ...chunk }));
  }

  async function recordAiQualityEvent(payload = {}) {
    const entry = {
      id: nextId("aiQualityEvents"),
      user_id: payload.user_id || payload.userId ? Number(payload.user_id || payload.userId) : null,
      conversation_id: payload.conversation_id || payload.conversationId || null,
      message_id: payload.message_id || payload.messageId ? Number(payload.message_id || payload.messageId) : null,
      task_type: String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
      question_type: String(payload.question_type || payload.questionType || "").trim().slice(0, 80) || null,
      model_key: String(payload.model_key || payload.modelKey || "").trim().slice(0, 80) || null,
      provider: String(payload.provider || "").trim().slice(0, 40) || null,
      prompt_key: String(payload.prompt_key || payload.promptKey || "").trim().slice(0, 160) || null,
      prompt_version: String(payload.prompt_version || payload.promptVersion || "").trim().slice(0, 80) || null,
      quality_score: Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 0)))),
      accuracy_score: Math.max(0, Math.min(100, Math.round(Number(payload.accuracy_score || payload.accuracyScore || 0)))),
      length_score: Math.max(0, Math.min(100, Math.round(Number(payload.length_score || payload.lengthScore || 0)))),
      speed_score: Math.max(0, Math.min(100, Math.round(Number(payload.speed_score || payload.speedScore || 0)))),
      satisfaction_score: Math.max(0, Math.min(100, Math.round(Number(payload.satisfaction_score || payload.satisfactionScore || 0)))),
      cost_score: Math.max(0, Math.min(100, Math.round(Number(payload.cost_score || payload.costScore || 0)))),
      latency_ms: Math.max(0, Math.round(Number(payload.latency_ms || payload.latencyMs || 0))),
      input_tokens: Math.max(0, Math.round(Number(payload.input_tokens || payload.inputTokens || 0))),
      output_tokens: Math.max(0, Math.round(Number(payload.output_tokens || payload.outputTokens || 0))),
      token_cost: Math.max(0, Math.round(Number(payload.token_cost || payload.tokenCost || 0))),
      xp_cost: Math.max(0, Math.round(Number(payload.xp_cost || payload.xpCost || 0))),
      user_feedback: String(payload.user_feedback || payload.userFeedback || "").trim().slice(0, 40) || null,
      was_cached: normalizeBoolean(payload.was_cached || payload.wasCached),
      metadata: payload.metadata || null,
      created_at: nowIso()
    };
    data.aiQualityEvents.push(entry);
    persist();
    return { ...entry };
  }

  async function getAiIntelligenceAnalytics() {
    const modelMap = new Map();
    for (const event of data.aiQualityEvents || []) {
      const key = `${event.model_key || "unknown"}:${event.provider || "unknown"}`;
      const row = modelMap.get(key) || {
        model_key: event.model_key || "unknown",
        provider: event.provider || "unknown",
        requests: 0,
        events_count: 0,
        quality: 0,
        latency: 0,
        tokens: 0,
        cost: 0,
        xp: 0,
        satisfied: 0
      };
      const tokens = Number(event.input_tokens || 0) + Number(event.output_tokens || 0);
      row.requests += 1;
      row.events_count += 1;
      row.quality += Number(event.quality_score || 0);
      row.latency += Number(event.latency_ms || 0);
      row.tokens += tokens;
      row.cost += Number(event.token_cost || 0);
      row.xp += Number(event.xp_cost || 0);
      if (Number(event.satisfaction_score || 0) >= 70 || ["like", "excellent", "save_worthy", "solved"].includes(String(event.user_feedback || ""))) row.satisfied += 1;
      modelMap.set(key, row);
    }
    const modelPerformance = [...modelMap.values()].map((row) => ({
      model_key: row.model_key,
      provider: row.provider,
      requests: row.requests,
      events_count: row.events_count,
      avg_quality: Math.round(row.quality / Math.max(1, row.events_count)),
      avg_speed_ms: Math.round(row.latency / Math.max(1, row.events_count)),
      avg_latency_ms: Math.round(row.latency / Math.max(1, row.events_count)),
      avg_tokens: Math.round(row.tokens / Math.max(1, row.events_count)),
      avg_cost: Math.round(row.cost / Math.max(1, row.events_count)),
      total_tokens: row.tokens,
      total_cost: row.cost,
      total_xp: row.xp,
      satisfaction_rate: Math.round((row.satisfied * 100) / Math.max(1, row.events_count))
    }));
    const feedbackMap = new Map();
    for (const item of data.aiFeedback || []) {
      const reason = item.feedback_type || item.rating || "unknown";
      const key = [reason, item.model_key || "unknown", item.task_type || "unknown", item.question_type || "unknown"].join(":");
      const row = feedbackMap.get(key) || {
        reason,
        model_key: item.model_key || "unknown",
        provider: item.provider || "unknown",
        task_type: item.task_type || "unknown",
        question_type: item.question_type || "unknown",
        plan: "fallback",
        count: 0,
        quality: 0
      };
      row.count += 1;
      row.quality += Number(item.quality_score || 0);
      feedbackMap.set(key, row);
    }
    const feedbackAnalytics = [...feedbackMap.values()].map((row) => ({
      ...row,
      avg_quality: Math.round(row.quality / Math.max(1, row.count))
    }));
    const chunks = data.aiKnowledgeChunks || [];
    const approvedChunks = chunks.filter((item) => item.status === "approved");
    const avgQuality = modelPerformance.length
      ? Math.round(modelPerformance.reduce((total, row) => total + Number(row.avg_quality || 0), 0) / modelPerformance.length)
      : 0;
    return {
      overview: {
        messages_today: data.aiQualityEvents.length,
        tokens_today: data.aiQualityEvents.reduce((total, event) => total + Number(event.input_tokens || 0) + Number(event.output_tokens || 0), 0),
        token_cost_today: data.aiQualityEvents.reduce((total, event) => total + Number(event.token_cost || 0), 0),
        best_model: modelPerformance.sort((a, b) => Number(b.avg_quality || 0) - Number(a.avg_quality || 0))[0] || null,
        most_used_model: modelPerformance.sort((a, b) => Number(b.requests || 0) - Number(a.requests || 0))[0] || null,
        avg_quality: avgQuality,
        avg_latency_ms: modelPerformance.length ? Math.round(modelPerformance.reduce((total, row) => total + Number(row.avg_latency_ms || 0), 0) / modelPerformance.length) : 0,
        top_dissatisfaction_reason: feedbackAnalytics[0] || null
      },
      model_performance: modelPerformance,
      feedback_reasons: feedbackAnalytics,
      feedback_analytics: feedbackAnalytics,
      task_quality: [],
      knowledge_base: {
        chunks_count: chunks.length,
        approved_chunks_count: approvedChunks.length,
        avg_quality: chunks.length ? Math.round(chunks.reduce((total, chunk) => total + Number(chunk.quality_score || 0), 0) / chunks.length) : 0,
        total_usage: chunks.reduce((total, chunk) => total + Number(chunk.usage_count || 0), 0)
      },
      excellent_answers: {
        total: data.aiTrainingExamples.length,
        pending: data.aiTrainingExamples.filter((item) => item.review_status === "pending").length,
        approved: data.aiTrainingExamples.filter((item) => item.review_status === "approved").length,
        rejected: data.aiTrainingExamples.filter((item) => item.review_status === "rejected").length
      }
    };
  }

  async function getAiUsageStats(userId) {
    const safeUserId = Number(userId);
    if (!safeUserId) {
      return { dailyTokens: 0, monthlyTokens: 0, dailyImages: 0 };
    }
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const messageRows = Array.from(data.messages || []);
    const toolRows = Array.from(data.toolUsage || []);
    const allRows = [
      ...messageRows
        .filter((item) => Number(item.user_id || item.userId || 0) === safeUserId)
        .map((item) => ({
          created_at: item.created_at,
          tokens: Number(item.input_tokens || item.inputTokens || 0) + Number(item.output_tokens || item.outputTokens || 0),
          images: 0
        })),
      ...toolRows
        .filter((item) => Number(item.user_id || item.userId || 0) === safeUserId)
        .map((item) => ({
          created_at: item.created_at,
          tokens: Number(item.input_tokens || item.inputTokens || 0) + Number(item.output_tokens || item.outputTokens || 0),
          images: String(item.tool_key || item.toolKey || "") === "image_system" ? 1 : 0
        }))
    ];

    return allRows.reduce((stats, item) => {
      const createdAt = new Date(item.created_at || 0);
      if (Number.isNaN(createdAt.getTime())) return stats;
      if (createdAt >= dayStart) {
        stats.dailyTokens += Math.max(0, Number(item.tokens || 0));
        stats.dailyImages += Math.max(0, Number(item.images || 0));
      }
      if (createdAt >= monthStart) {
        stats.monthlyTokens += Math.max(0, Number(item.tokens || 0));
      }
      return stats;
    }, { dailyTokens: 0, monthlyTokens: 0, dailyImages: 0 });
  }

  async function recordAdminLog(payload = {}) {
    const action = String(payload.action || "").trim().slice(0, 80);
    if (!action) return null;
    const entry = {
      id: nextId("adminLogs"),
      admin_id: payload.admin_id || payload.adminId ? Number(payload.admin_id || payload.adminId) : null,
      action,
      target_type: String(payload.target_type || payload.targetType || "").trim().slice(0, 80),
      target_id: payload.target_id || payload.targetId ? String(payload.target_id || payload.targetId).slice(0, 120) : "",
      details_json: payload.details_json || payload.details || payload.detailsJson || null,
      ip_address: String(payload.ip_address || payload.ipAddress || "").trim().slice(0, 80),
      created_at: nowIso()
    };
    data.adminLogs.push(entry);
    persist();
    return { ...entry };
  }

  function getNotificationTargetPlansForUser(user = {}) {
    const values = new Set(["all"]);
    [
      user.plan_type,
      user.plan_key,
      user.package_key,
      user.package,
      user.package_name
    ].forEach((value) => {
      const text = String(value || "").trim().toLowerCase();
      if (text) values.add(text);
    });

    const combined = Array.from(values).join(" ");
    if (/starter|free|مجاني|المجانية/.test(combined)) {
      values.add("starter");
      values.add("free");
    }
    if (/spark|pro|شرارة/.test(combined)) {
      values.add("spark");
      values.add("pro");
    }
    if (/tuwaiq|pro_plus|طويق/.test(combined)) {
      values.add("tuwaiq");
      values.add("pro_plus");
    }
    if (/pioneer|pro_max|رائد|الرائد/.test(combined)) {
      values.add("pioneer");
      values.add("pro_max");
    }
    return Array.from(values);
  }

  function serializeNotification(item = {}, userId = null) {
    const isRead = userId
      ? data.notificationReads.some((read) =>
        String(read.notification_id) === String(item.id) && String(read.user_id) === String(userId)
      )
      : false;
    return {
      id: String(item.id),
      title: String(item.title || "").trim(),
      body: String(item.body || "").trim(),
      type: String(item.type || "").trim(),
      badge: String(item.badge || "").trim(),
      icon: String(item.icon || "").trim(),
      target_plan: String(item.target_plan || "all").trim(),
      target_user_id: item.target_user_id != null ? String(item.target_user_id) : null,
      action_url: String(item.action_url || "").trim() || null,
      starts_at: item.starts_at || null,
      expires_at: item.expires_at || null,
      is_active: item.is_active == null ? true : Boolean(item.is_active),
      created_at: item.created_at || null,
      updated_at: item.updated_at || null,
      isRead
    };
  }

  function groupNotifications(items = []) {
    return {
      xpDiscounts: items.filter((item) => item.type === "xp_discount"),
      officialUpdates: items.filter((item) => item.type === "official_update"),
      featureUpdates: items.filter((item) => item.type === "feature_update"),
      account: items.filter((item) => item.type === "account")
    };
  }

  async function listNotificationsForUser(user, options = {}) {
    const userId = Number(user?.id || options.userId);
    if (!userId) {
      return { unreadCount: 0, sections: groupNotifications([]), items: [] };
    }
    const now = Date.now();
    const targetPlans = getNotificationTargetPlansForUser(user);
    const limit = Math.max(1, Math.min(Number(options.limit || 20), 80));
    const unreadOnly = Boolean(options.unreadOnly);
    const items = data.notifications
      .filter((item) => item.is_active !== false)
      .filter((item) => !item.starts_at || parseTimestampMs(item.starts_at) <= now)
      .filter((item) => !item.expires_at || parseTimestampMs(item.expires_at) > now)
      .filter((item) =>
        targetPlans.includes(String(item.target_plan || "all").trim().toLowerCase()) ||
        String(item.target_user_id || "") === String(userId)
      )
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
      .map((item) => serializeNotification(item, userId))
      .filter((item) => !unreadOnly || !item.isRead)
      .slice(0, limit);

    return {
      unreadCount: items.filter((item) => !item.isRead).length,
      sections: groupNotifications(items),
      items
    };
  }

  async function markNotificationAsRead(userId, notificationId) {
    const safeUserId = Number(userId);
    const safeNotificationId = Number(notificationId);
    if (!safeUserId || !safeNotificationId) return null;
    const existing = data.notificationReads.find((item) =>
      Number(item.user_id) === safeUserId && Number(item.notification_id) === safeNotificationId
    );
    if (existing) {
      existing.read_at = nowIso();
      persist();
      return { ...existing };
    }
    const entry = {
      id: nextId("notificationReads"),
      notification_id: safeNotificationId,
      user_id: safeUserId,
      read_at: nowIso(),
      created_at: nowIso()
    };
    data.notificationReads.push(entry);
    persist();
    return { ...entry };
  }

  async function markAllNotificationsAsRead(user) {
    const notifications = await listNotificationsForUser(user, { limit: 80 });
    let markedCount = 0;
    for (const notification of notifications.items) {
      if (notification.isRead) continue;
      await markNotificationAsRead(user.id, notification.id);
      markedCount += 1;
    }
    return { markedCount };
  }

  async function listAdminNotifications(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 80), 200));
    const includeInactive = options.includeInactive !== false;
    return [...data.notifications]
      .filter((item) => includeInactive || item.is_active !== false)
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
      .slice(0, limit)
      .map((item) => serializeNotification(item));
  }

  async function createNotification(payload = {}) {
    const title = String(payload.title || "").trim().slice(0, 180);
    const type = String(payload.type || "official_update").trim().slice(0, 40);
    const existingIndex = data.notifications.findIndex((item) =>
      String(item.title || "") === title && String(item.type || "") === type
    );
    const item = {
      id: existingIndex >= 0 ? data.notifications[existingIndex].id : nextId("notifications"),
      title,
      body: String(payload.body || "").trim(),
      type,
      badge: String(payload.badge || "").trim().slice(0, 80),
      icon: String(payload.icon || "sparkle").trim().slice(0, 40),
      target_plan: String(payload.target_plan || payload.targetPlan || "all").trim().slice(0, 80) || "all",
      target_user_id: payload.target_user_id || payload.targetUserId ? Number(payload.target_user_id || payload.targetUserId) : null,
      action_url: String(payload.action_url || payload.actionUrl || "").trim(),
      starts_at: payload.starts_at || payload.startsAt || nowIso(),
      expires_at: payload.expires_at || payload.expiresAt || null,
      is_active: payload.is_active == null ? true : normalizeBoolean(payload.is_active),
      created_at: existingIndex >= 0 ? data.notifications[existingIndex].created_at : nowIso(),
      updated_at: nowIso()
    };
    if (existingIndex >= 0) data.notifications[existingIndex] = item;
    else data.notifications.push(item);
    persist();
    return serializeNotification(item);
  }

  async function updateNotification(notificationId, changes = {}) {
    const index = data.notifications.findIndex((item) => String(item.id) === String(notificationId));
    if (index === -1) return null;
    data.notifications[index] = {
      ...data.notifications[index],
      ...changes,
      updated_at: nowIso()
    };
    persist();
    return serializeNotification(data.notifications[index]);
  }

  async function listSubscriptions(options = {}) {
    const status = String(options.status || "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(Number(options.limit || 80), 250));
    const rows = data.users
      .filter((user) => !status || (status === "active" && Number(user.package_daily_xp || 0) > 0))
      .map((user) => ({
        id: `fallback-sub-${user.id}`,
        user_id: user.id,
        package_key: user.package_key || user.plan_type || "starter",
        package_name: user.package_name || user.package || "مجاني محدود",
        daily_xp: Number(user.package_daily_xp || 0),
        price_sar: Number(user.package_price_sar || 0),
        status: Number(user.package_daily_xp || 0) > 0 ? "active" : "free",
        started_at: user.package_started_at || null,
        expires_at: user.package_expires_at || null,
        created_at: user.created_at || null,
        user_name: user.name,
        user_email: user.email,
        user_xp: user.xp
      }))
      .slice(0, limit);
    return rows;
  }

  async function assignPackageToUser(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const index = data.users.findIndex((item) => Number(item.id) === userId);
    const selectedPackage = payload.package_id
      ? findPackageByIdSync(payload.package_id)
      : findPackageByKeyOrNameSync(payload.package_key || payload.planKey || payload.package || "");
    if (index === -1 || !selectedPackage) return null;
    const startDate = new Date();
    const explicitExpiresAt = payload.expires_at || payload.expiresAt ? new Date(payload.expires_at || payload.expiresAt) : null;
    const expiresAt = explicitExpiresAt && !Number.isNaN(explicitExpiresAt.getTime())
      ? explicitExpiresAt
      : addDays(startDate, Math.max(1, Math.round(Number(payload.duration_days || payload.durationDays || selectedPackage.duration_days || 30) || 30)));
    data.users[index] = {
      ...mergePackageIntoUser(data.users[index], selectedPackage),
      package_started_at: startDate.toISOString(),
      package_expires_at: expiresAt.toISOString(),
      updated_at: nowIso()
    };
    persist();
    return { ...data.users[index] };
  }

  async function adjustUserXpByAdmin(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const amount = Math.round(Number(payload.amount || 0) || 0);
    const index = data.users.findIndex((item) => Number(item.id) === userId);
    if (index === -1 || !amount) return null;
    const reason = String(payload.reason || "Admin XP adjustment").trim();
    const adminId = payload.admin_id || payload.adminId ? Number(payload.admin_id || payload.adminId) : null;
    const nextBalance = Math.max(0, Number(data.users[index].balance ?? data.users[index].xp ?? 0) + amount);
    data.users[index].balance = nextBalance;
    data.users[index].xp = nextBalance;
    data.users[index].total_xp = nextBalance;
    data.users[index].activity = reason;
    data.users[index].updated_at = nowIso();
    await recordXpLedger({
      user_id: userId,
      amount,
      type: payload.type || (amount >= 0 ? "admin_add" : "admin_remove"),
      reason,
      admin_id: adminId
    });
    await recordAdminLog({
      admin_id: adminId,
      action: amount >= 0 ? "ADMIN_ADD_XP" : "ADMIN_REMOVE_XP",
      target_type: "user",
      target_id: userId,
      details: { amount, reason },
      ip_address: payload.ip_address || payload.ipAddress || ""
    });
    persist();
    return { ...data.users[index] };
  }

  async function listXpLedger(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 100), 500));
    const userId = options.user_id || options.userId ? String(options.user_id || options.userId) : "";
    return [...data.xpLedger]
      .filter((entry) => !userId || String(entry.user_id) === userId)
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
      .slice(0, limit)
      .map((entry) => {
        const user = findUserByIdSync(entry.user_id) || {};
        const admin = findUserByIdSync(entry.admin_id) || {};
        return {
          ...entry,
          user_name: user.name || "",
          user_email: user.email || "",
          admin_name: admin.name || "",
          admin_email: admin.email || ""
        };
      });
  }

  async function listAdminLogs(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 100), 500));
    return [...data.adminLogs]
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
      .slice(0, limit)
      .map((entry) => {
        const admin = findUserByIdSync(entry.admin_id) || {};
        return {
          ...entry,
          admin_name: admin.name || "",
          admin_email: admin.email || ""
        };
      });
  }

  async function grantDailyXpIfNeeded(userId, options = {}) {
    const index = data.users.findIndex((item) => String(item.id) === String(userId));
    if (index === -1) return null;

    const user = data.users[index];
    const now = new Date();
    const nowStamp = now.toISOString();
    const today = getTodayStamp();
    const activity = String(options.activity || options.activityText || "").trim().slice(0, 255);
    const role = String(user.role || "student").trim().toLowerCase();
    const canReceiveXp = role !== "admin";
    const firstSignupXp = Math.max(0, Math.round(Number(options.firstSignupXp ?? 50) || 0));
    const motivationBonus = Math.max(0, Math.round(Number(options.motivationBonus || 0) || 0));
    const signupBonusClaimed = user.signup_bonus_claimed !== false;
    const shouldGrantSignup = canReceiveXp && !signupBonusClaimed && firstSignupXp > 0;
    const lastDailyRewardClaimedAt = user.last_daily_reward_claimed_at || null;
    const rewardState = getDailyRewardState(lastDailyRewardClaimedAt, now, options.dailyRewardIntervalMs);
    // Daily reward issuance is owned exclusively by /api/reward-claim.
    const shouldGrantDaily = false;
    const requestedDailyRewardAmount = Math.max(0, Math.round(Number(options.dailyRewardAmount || 0) || 0));
    const dailyRewardAmount = requestedDailyRewardAmount || getDailyXpForUserPlan(user, options);
    const dailyXpAward = shouldGrantDaily ? dailyRewardAmount : 0;

    console.log("DAILY_REWARD_CHECK", {
      userId: user.id,
      balance: Number(user.balance ?? user.xp ?? 0),
      lastDailyRewardClaimedAt,
      dailyRewardAmount,
      remainingMs: rewardState.remainingMs,
      shouldReward: shouldGrantDaily
    });

    let nextXp = Math.max(0, Number(user.balance ?? user.xp ?? 0));
    const ledgerEntries = [];

    if (shouldGrantSignup) {
      nextXp += firstSignupXp;
      ledgerEntries.push({
        amount: firstSignupXp,
        type: "signup_bonus",
        reason: "First signup bonus"
      });
    }

    if (dailyXpAward > 0) {
      nextXp += dailyXpAward;
      ledgerEntries.push({
        amount: dailyXpAward,
        type: "daily_grant",
        reason: `Daily XP grant for ${getDailyXpPlanKey(user)}`
      });
    }

    if (shouldGrantSignup || shouldGrantDaily || rewardState.correctedLastClaimedAt) {
      const lastActiveDate = String(user.last_active_date || "");
      let streakDays = Number(user.streak_days || 0);
      if (!lastActiveDate) {
        streakDays = 1;
      } else {
        const gap = diffDateStamps(lastActiveDate, today);
        if (gap === 1) streakDays += 1;
        else if (gap > 1) streakDays = 1;
        else if (gap < 0) streakDays = Math.max(1, streakDays);
      }

      const achievements = Array.isArray(user.achievements) ? [...user.achievements] : [];
      if (streakDays >= 5 && !achievements.includes("5_days_streak")) achievements.push("5_days_streak");
      if (streakDays >= 30 && !achievements.includes("30_days_streak")) achievements.push("30_days_streak");

      Object.assign(user, {
        last_active_date: today,
        last_reset: today,
        signup_bonus_claimed: shouldGrantSignup ? true : signupBonusClaimed,
        streak_days: streakDays,
        motivation_score: Number(user.motivation_score || 0) + motivationBonus,
        balance: nextXp,
        xp: nextXp,
        total_xp: nextXp,
        daily_reward_amount: dailyRewardAmount,
        plan_type: String(user.package_key || user.plan_type || user.package_name || "starter").trim() || "starter",
        achievements,
        activity: activity || `Daily XP grant: +${dailyXpAward} XP`,
        updated_at: nowStamp
      });

      if (shouldGrantDaily) {
        user.last_daily_xp_claimed_date = today;
        user.last_daily_xp_granted_at = nowStamp;
        user.last_daily_reward_at = nowStamp;
        user.last_daily_reward_claimed_at = nowStamp;
      } else if (rewardState.correctedLastClaimedAt) {
        user.last_daily_xp_granted_at = rewardState.correctedLastClaimedAt;
        user.last_daily_reward_at = rewardState.correctedLastClaimedAt;
        user.last_daily_reward_claimed_at = rewardState.correctedLastClaimedAt;
      }
    } else if (activity) {
      user.last_active_date = today;
      user.activity = activity;
      user.updated_at = nowStamp;
    }

    for (const entry of ledgerEntries) {
      data.xpLedger.push({
        id: nextId("xpLedger"),
        user_id: Number(user.id),
        amount: entry.amount,
        type: entry.type,
        reason: entry.reason,
        created_at: nowStamp
      });
    }

    data.users[index] = user;
    persist();
    return { ...user };
  }

  async function claimDailyReward(userId, options = {}) {
    const index = data.users.findIndex((item) => String(item.id) === String(userId));
    if (index === -1) return null;

    const user = data.users[index];
    const now = options.now instanceof Date ? options.now : new Date();
    const nowStamp = now.toISOString();
    const rewardState = getDailyRewardState(
      user.last_daily_reward_claimed_at || user.lastDailyRewardClaimedAt || null,
      now,
      options.intervalMs || DAILY_REWARD_INTERVAL_MS
    );

    if (!rewardState.canClaim) {
      if (rewardState.correctedLastClaimedAt) {
        user.last_daily_reward_claimed_at = rewardState.correctedLastClaimedAt;
        user.last_daily_reward_at = rewardState.correctedLastClaimedAt;
        user.last_daily_xp_granted_at = rewardState.correctedLastClaimedAt;
        user.updated_at = nowStamp;
        data.users[index] = user;
        persist();
      }

      return {
        user: { ...user },
        claimed: false,
        added: 0,
        balance: Math.max(0, Number(user.balance ?? user.xp ?? 0) || 0)
      };
    }

    const rewardAmount = Math.max(0, Math.round(Number(options.rewardAmount || 0) || 0));
    const currentBalance = Math.max(0, Number(user.balance ?? user.xp ?? 0) || 0);
    const nextBalance = currentBalance + rewardAmount;

    Object.assign(user, {
      balance: nextBalance,
      xp: nextBalance,
      total_xp: nextBalance,
      daily_reward_amount: rewardAmount,
      last_daily_reward_claimed_at: nowStamp,
      last_daily_reward_at: nowStamp,
      last_daily_xp_granted_at: nowStamp,
      last_daily_xp_claimed_date: nowStamp.slice(0, 10),
      updated_at: nowStamp
    });

    if (rewardAmount > 0 && options.recordLedger !== false) {
      data.xpLedger.push({
        id: nextId("xpLedger"),
        user_id: Number(user.id),
        amount: rewardAmount,
        type: "daily_grant",
        reason: String(options.reason || "Daily reward claim").trim(),
        admin_id: null,
        created_at: nowStamp
      });
    }

    data.users[index] = user;
    persist();
    return {
      user: { ...user },
      claimed: true,
      added: rewardAmount,
      balance: nextBalance
    };
  }

  async function getAdminStats() {
    const activeSubscriptions = data.users.filter((item) => Number(item.package_daily_xp || 0) > 0);
    const xpUsed = data.xpLedger
      .filter((item) => Number(item.amount || 0) < 0)
      .reduce((total, item) => total + Math.abs(Number(item.amount || 0)), 0);
    const today = getTodayStamp();
    const monthPrefix = today.slice(0, 7);
    const aiUsageRows = [
      ...data.messages.map((item) => ({
        created_at: item.created_at,
        tokens: Number(item.input_tokens || 0) + Number(item.output_tokens || 0),
        xp_cost: Number(item.xp_cost || 0),
        images: 0
      })),
      ...(data.toolUsage || []).map((item) => ({
        created_at: item.created_at,
        tokens: Number(item.input_tokens || 0) + Number(item.output_tokens || 0),
        xp_cost: Number(item.xp_cost || 0),
        images: String(item.tool_key || "") === "image_system" ? 1 : 0
      }))
    ];
    const aiDailyRows = aiUsageRows.filter((item) => String(item.created_at || "").slice(0, 10) === today);
    const aiMonthlyRows = aiUsageRows.filter((item) => String(item.created_at || "").slice(0, 7) === monthPrefix);
    return {
      total_users: data.users.length,
      users_count: data.users.length,
      total_students: data.users.filter((item) => String(item.role) === "student").length,
      students_count: data.users.filter((item) => String(item.role) === "student").length,
      total_admins: data.users.filter((item) => String(item.role) === "admin").length,
      admins_count: data.users.filter((item) => String(item.role || "").includes("admin")).length,
      active_users_count: data.users.filter((item) => String(item.status || "active") === "active").length,
      active_subscriptions_count: activeSubscriptions.length,
      revenue_total: activeSubscriptions.reduce((total, item) => total + Number(item.package_price_sar || 0), 0),
      xp_used_total: xpUsed,
      today_requests_count: data.messages.filter((item) => String(item.created_at || "").slice(0, 10) === today).length,
      ai_daily_tokens: aiDailyRows.reduce((total, item) => total + Math.max(0, Number(item.tokens || 0)), 0),
      ai_monthly_tokens: aiMonthlyRows.reduce((total, item) => total + Math.max(0, Number(item.tokens || 0)), 0),
      ai_total_tokens: aiUsageRows.reduce((total, item) => total + Math.max(0, Number(item.tokens || 0)), 0),
      ai_xp_spent_total: aiUsageRows.reduce((total, item) => total + Math.max(0, Number(item.xp_cost || 0)), 0),
      ai_daily_images: aiDailyRows.reduce((total, item) => total + Math.max(0, Number(item.images || 0)), 0),
      ai_daily_requests: aiDailyRows.length,
      total_projects: data.projects.length,
      projects_count: data.projects.length,
      total_conversations: data.conversations.length,
      conversations_count: data.conversations.length,
      total_messages: data.messages.length,
      messages_count: data.messages.length,
      active_packages: data.packages.filter((item) => Number(item.is_active || 0) === 1).length,
      packages_count: data.packages.filter((item) => Number(item.is_active || 0) === 1).length
    };
  }

  async function getStudentDashboard(userId) {
    const user = findUserByIdSync(userId);
    if (!user) return null;
    const projects = await listProjects(userId, { limit: 8 });
    const recentConversations = await listUserConversations(userId, { limit: 8 });
    return {
      user: { ...user },
      stats: {
        conversations_count: data.conversations.filter((item) => String(item.user_id) === String(userId)).length,
        messages_count: data.messages.filter((item) => {
          const conversation = findConversationSync(item.conversation_id);
          return conversation && String(conversation.user_id) === String(userId);
        }).length,
        projects_count: data.projects.filter((item) => String(item.user_id) === String(userId) && !Number(item.is_archived || 0)).length
      },
      projects,
      recent_conversations: recentConversations
    };
  }

  async function close() {
    persist();
  }

  return {
    initialize,
    isReady,
    getState,
    getConversationById,
    getConversationByGuestSessionId,
    getOrCreateConversation,
    saveMessage,
    listMessages,
    listRecentConversations,
    listUserConversations,
    listUserMemoryCandidates,
    findPackageById,
    findDefaultPackage,
    findPackageByKeyOrName,
    listPackages,
    createPackage,
    updatePackage,
    saveFeedback,
    saveAiTrainingExample,
    listExcellentAnswerCandidates,
    getTrainingExampleById,
    updateTrainingExampleReview,
    saveKnowledgeSource,
    saveKnowledgeChunk,
    listKnowledgeSources,
    updateKnowledgeSource,
    listKnowledgeChunks,
    recordAiQualityEvent,
    getAiIntelligenceAnalytics,
    saveToolUsage,
    recordXpLedger,
    listNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    listAdminNotifications,
    createNotification,
    updateNotification,
    grantDailyXpIfNeeded,
    claimDailyReward,
    listSubscriptions,
    assignPackageToUser,
    adjustUserXpByAdmin,
    listXpLedger,
    recordAdminLog,
    listAdminLogs,
    findUserByEmail,
    findUserById,
    createUser,
    ensureUserByEmail,
    updateUser,
    listUsers,
    createApiToken,
    findUserByTokenHash,
    touchApiToken,
    revokeApiToken,
    findProjectById,
    listProjects,
    createProject,
    updateProject,
    getGuestUsage,
    incrementGuestUsage,
    getAiUsageStats,
    getAdminStats,
    getStudentDashboard,
    close
  };
}

module.exports = {
  createFallbackDatabaseClient
};
