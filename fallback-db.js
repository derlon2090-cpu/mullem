const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FALLBACK_FILE = path.join(__dirname, "runtime-fallback-db.json");

const DEFAULT_PACKAGES = [
  {
    id: 1,
    package_key: "starter",
    display_name: "المجانية",
    daily_xp: 0,
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
    display_name: "برو",
    daily_xp: 200,
    price_sar: 30,
    duration_days: 30,
    summary: "باقة شهرية خفيفة للاستخدام المنتظم.",
    benefits: ["200 XP يوميًا", "مناسبة للمذاكرة اليومية", "تجديد يومي للرصيد"],
    is_active: 1,
    is_default: 0,
    sort_order: 2
  },
  {
    id: 3,
    package_key: "pro_plus",
    display_name: "برو بلس",
    daily_xp: 500,
    price_sar: 60,
    duration_days: 30,
    summary: "باقة شهرية أوسع للاستخدام المكثف.",
    benefits: ["500 XP يوميًا", "مناسبة للمشروعات والمواد المتعددة", "تجديد يومي للرصيد"],
    is_active: 1,
    is_default: 0,
    sort_order: 3
  },
  {
    id: 4,
    package_key: "pro_max",
    display_name: "برو ماكس",
    daily_xp: 1000,
    price_sar: 100,
    duration_days: 30,
    summary: "أعلى باقة شهرية للاستخدام المكثف والدعم اليومي.",
    benefits: ["1000 XP يوميًا", "أفضل خيار للاستخدام المكثف", "مناسبة للمشروعات الكبيرة"],
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

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10);
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
      guestUsage: 1
    },
    packages: clone(DEFAULT_PACKAGES),
    users: [],
    apiTokens: [],
    projects: [],
    conversations: [],
    messages: [],
    guestUsage: []
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
    } catch (_) {
      data = createEmptyState();
      persist();
    }
  }

  function persist() {
    fs.writeFileSync(FALLBACK_FILE, toJson(data), "utf8");
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
    return listPackagesSync(true).find((item) => {
      return String(item.package_key || "").trim().toLowerCase() === normalized
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
      xp: Number(payload.xp || 0),
      streak_days: Number(payload.streak_days || 0),
      motivation_score: Number(payload.motivation_score || 0),
      last_active_date: payload.last_active_date || null,
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
    let next = {
      ...current,
      ...changes,
      updated_at: nowIso()
    };
    if ("package_id" in changes || "package_key" in changes || "package_name" in changes) {
      const pkg = changes.package_id
        ? findPackageByIdSync(changes.package_id)
        : findPackageByKeyOrNameSync(changes.package_key || changes.package_name || "");
      next = mergePackageIntoUser(next, pkg);
      if ("package_started_at" in changes) next.package_started_at = changes.package_started_at;
      if ("package_expires_at" in changes) next.package_expires_at = changes.package_expires_at;
      if ("package_name" in changes && !pkg) next.package_name = String(changes.package_name || "").trim();
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
    const conversationId = String(payload.id || payload.conversation_id || "").trim() || crypto.randomUUID();
    const requestedGuestId = String(payload.guest_session_id || "").trim();
    let existing = findConversationSync(conversationId);
    if (!existing && requestedGuestId) {
      existing = data.conversations.find((item) => String(item.guest_session_id || "") === requestedGuestId) || null;
    }
    if (existing) return enrichConversation(existing);

    const conversation = {
      id: conversationId,
      guest_session_id: requestedGuestId || null,
      user_id: payload.user_id != null ? Number(payload.user_id) : null,
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

  async function saveMessage(conversationId, role, text, source = "web") {
    const conversation = findConversationSync(conversationId);
    if (!conversation) return null;
    const message = {
      id: nextId("messages"),
      conversation_id: conversationId,
      role: String(role || "").trim(),
      text: String(text || "").trim(),
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

  async function getAdminStats() {
    return {
      total_users: data.users.length,
      total_students: data.users.filter((item) => String(item.role) === "student").length,
      total_admins: data.users.filter((item) => String(item.role) === "admin").length,
      total_projects: data.projects.length,
      total_conversations: data.conversations.length,
      total_messages: data.messages.length,
      active_packages: data.packages.filter((item) => Number(item.is_active || 0) === 1).length
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
    updatePackage,
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
    getAdminStats,
    getStudentDashboard,
    close
  };
}

module.exports = {
  createFallbackDatabaseClient
};
