const crypto = require("crypto");

let pgModule = null;
const DAILY_REWARD_INTERVAL_MS = 24 * 60 * 60 * 1000;

function getPgModule() {
  if (pgModule) return pgModule;

  try {
    pgModule = require("pg");
    return pgModule;
  } catch (error) {
    const friendlyError = new Error(
      "pg dependency is not installed. Neon/PostgreSQL storage is unavailable until the package is available."
    );
    friendlyError.code = "PG_MISSING";
    friendlyError.cause = error;
    throw friendlyError;
  }
}

function normalizeEnvString(value) {
  let normalized = String(value || "").trim();
  if ((normalized.startsWith('"') && normalized.endsWith('"')) || (normalized.startsWith("'") && normalized.endsWith("'"))) {
    normalized = normalized.slice(1, -1).trim();
  }
  if (/^[A-Z0-9_]+\s*=\s*/i.test(normalized)) {
    normalized = normalized.replace(/^[A-Z0-9_]+\s*=\s*/i, "").trim();
  }
  return normalized;
}

function readEnvValue(keys, fallback = "") {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const key of list) {
    const value = normalizeEnvString(process.env[key]);
    if (value) return value;
  }
  return normalizeEnvString(fallback);
}

function normalizeConfig(rawConfig = {}) {
  const connectionString = String(
    readEnvValue([
      "DATABASE_URL",
      "POSTGRES_URL",
      "POSTGRES_PRISMA_URL",
      "POSTGRES_URL_NON_POOLING",
      "POSTGRES_URL_UNPOOLED",
      "DATABASE_URL_UNPOOLED",
      "NEON_DATABASE_URL",
      "NEON_POSTGRES_URL",
      "DATABASE_PRIVATE_URL"
    ], rawConfig.connectionString || rawConfig.connection_string || rawConfig.DATABASE_URL || "")
  ).trim();
  const host = readEnvValue(["PGHOST", "POSTGRES_HOST", "DATABASE_HOST"], rawConfig.host || rawConfig.PGHOST || "");
  const database = readEnvValue(["PGDATABASE", "POSTGRES_DATABASE", "DATABASE_NAME"], rawConfig.database || rawConfig.PGDATABASE || "");
  const user = readEnvValue(["PGUSER", "POSTGRES_USER", "DATABASE_USER"], rawConfig.user || rawConfig.username || rawConfig.PGUSER || "");
  const password = readEnvValue(["PGPASSWORD", "POSTGRES_PASSWORD", "DATABASE_PASSWORD"], rawConfig.password || rawConfig.PGPASSWORD || "");
  const port = Number(rawConfig.port || rawConfig.PGPORT || process.env.PGPORT || process.env.POSTGRES_PORT || process.env.DATABASE_PORT || 5432);
  const connectTimeout = Math.max(
    1000,
    Number(rawConfig.connectTimeout || rawConfig.DB_CONNECT_TIMEOUT_MS || process.env.DB_CONNECT_TIMEOUT_MS || 8000)
  );
  const sslMode = String(rawConfig.sslmode || rawConfig.sslMode || process.env.PGSSLMODE || "").trim().toLowerCase();
  const sslEnabled = rawConfig.ssl === true ||
    sslMode === "require" ||
    sslMode === "verify-full" ||
    /neon\.tech/i.test(connectionString) ||
    /^true$/i.test(String(process.env.DATABASE_SSL || ""));

  let parsedHost = host;
  let parsedDatabase = database;
  let parsedUser = user;
  let parsedPort = Number.isFinite(port) ? port : 5432;

  if (connectionString) {
    try {
      const url = new URL(connectionString);
      parsedHost = parsedHost || url.hostname;
      parsedDatabase = parsedDatabase || decodeURIComponent(url.pathname.replace(/^\/+/, ""));
      parsedUser = parsedUser || decodeURIComponent(url.username || "");
      parsedPort = Number(url.port || parsedPort || 5432);
    } catch (_) {
      // Keep explicit values when the connection string cannot be parsed locally.
    }
  }

  return {
    connectionString,
    host: parsedHost,
    port: parsedPort,
    database: parsedDatabase,
    user: parsedUser,
    password,
    connectTimeout,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false
  };
}

function toSqlDateTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeAchievements(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "object") return Array.isArray(value) ? value : [];

  try {
    const parsed = JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function normalizeBenefits(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (!value) return [];

  return String(value)
    .split(/\r?\n+/)
    .map((item) => item.replace(/^[\s\-*•]+/, "").trim())
    .filter(Boolean);
}

function serializeBenefits(value) {
  return normalizeBenefits(value).join("\n");
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const text = String(value || "").trim().toLowerCase();
  return text === "1" || text === "true" || text === "yes" || text === "on";
}

function getTodayDateStamp() {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
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
    user.package_display_name,
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

function normalizePackageRow(row) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id || 0),
    daily_xp: Number(row.daily_xp || 0),
    price_sar: Number(row.price_sar || 0),
    duration_days: Number(row.duration_days || 0),
    benefits: normalizeBenefits(row.benefits),
    is_active: normalizeBoolean(row.is_active),
    is_default: normalizeBoolean(row.is_default),
    sort_order: Number(row.sort_order || 0)
  };
}

function hydrateUserRow(row) {
  if (!row) return null;
  return {
    ...row,
    achievements: normalizeAchievements(row.achievements),
    package_id: row.package_id != null ? Number(row.package_id) : null,
    package_daily_xp: Number(row.package_daily_xp || 0),
    package_price_sar: Number(row.package_price_sar || 0),
    package_duration_days: Number(row.package_duration_days || 0),
    package_benefits: normalizeBenefits(row.package_benefits),
    package_is_active: normalizeBoolean(row.package_is_active),
    package_is_default: normalizeBoolean(row.package_is_default),
    package_sort_order: Number(row.package_sort_order || 0),
    package_name: String(row.package_display_name || row.package_name || "").trim(),
    balance: Number(row.balance ?? row.xp ?? 0),
    xp: Number(row.xp ?? row.balance ?? 0),
    daily_reward_amount: Number(row.daily_reward_amount || 0),
    last_daily_reward_claimed_at: row.last_daily_reward_claimed_at || null,
    streak_days: Number(row.streak_days || 0),
    motivation_score: Number(row.motivation_score || 0),
    package_started_at: row.package_started_at || null,
    package_expires_at: row.package_expires_at || null,
    total_xp: Number(row.total_xp ?? row.xp ?? 0),
    plan_type: String(row.plan_type || row.package_key || row.package_name || "starter").trim() || "starter",
    referral_code: String(row.referral_code || "").trim(),
    referred_by_user_id: row.referred_by_user_id != null ? Number(row.referred_by_user_id) : null,
    trust_score: Number(row.trust_score ?? 70),
    abuse_score: Number(row.abuse_score || 0),
    shadow_banned: normalizeBoolean(row.shadow_banned),
    last_reset: row.last_reset || row.last_active_date || null,
    last_daily_xp_claimed_date: row.last_daily_xp_claimed_date || row.last_reset || row.last_active_date || null,
    last_daily_xp_granted_at: row.last_daily_xp_granted_at || null,
    last_daily_reward_at: row.last_daily_reward_at || row.last_daily_reward_claimed_at || row.last_daily_xp_granted_at || null,
    signup_bonus_claimed: normalizeBoolean(row.signup_bonus_claimed)
  };
}

function buildAssignments(changes = {}, mappings = {}) {
  const sets = [];
  const values = [];

  for (const [key, column] of Object.entries(mappings)) {
    if (!(key in changes)) continue;
    if (key === "achievements") {
      sets.push(`${column} = $${values.length + 1}::jsonb`);
      values.push(JSON.stringify(normalizeAchievements(changes[key])));
    } else if (key === "benefits") {
      sets.push(`${column} = $${values.length + 1}`);
      values.push(serializeBenefits(changes[key]));
    } else if (key === "is_active" || key === "is_default" || key === "is_archived" || key === "signup_bonus_claimed") {
      sets.push(`${column} = $${values.length + 1}`);
      values.push(Boolean(changes[key]));
    } else if (key === "package_started_at" || key === "package_expires_at" || key === "last_daily_xp_granted_at" || key === "last_daily_reward_at" || key === "last_daily_reward_claimed_at") {
      sets.push(`${column} = $${values.length + 1}`);
      values.push(toSqlDateTime(changes[key]));
    } else {
      sets.push(`${column} = $${values.length + 1}`);
      values.push(changes[key]);
    }
  }

  return { sets, values };
}

const DEFAULT_PACKAGE_CATALOG = [
  {
    package_key: "starter",
    display_name: "المجانية",
    daily_xp: 5,
    price_sar: 0,
    duration_days: 0,
    summary: "خطة البداية للتجربة الأساسية داخل المنصة.",
    benefits: ["تجربة أولية", "الوصول الأساسي للشات", "ترقية لاحقًا عند الحاجة"],
    is_active: true,
    is_default: true,
    sort_order: 1
  },
  {
    package_key: "pro",
    display_name: "شرارة",
    daily_xp: 80,
    price_sar: 9,
    duration_days: 30,
    summary: "بداية ذكية وسعر بسيط للاستخدام اليومي الخفيف.",
    benefits: ["80 XP يوميًا", "9 ريال شهريًا", "حفظ المحادثات والمشروعات داخل الحساب"],
    is_active: true,
    is_default: false,
    sort_order: 2
  },
  {
    package_key: "pro_plus",
    display_name: "طويق",
    daily_xp: 250,
    price_sar: 29,
    duration_days: 30,
    summary: "ثبات وقوة للاستخدام المتوازن والمذاكرة اليومية.",
    benefits: ["250 XP يوميًا", "29 ريال شهريًا", "توازن أفضل بين السعر والاستخدام"],
    is_active: true,
    is_default: false,
    sort_order: 3
  },
  {
    package_key: "pro_max",
    display_name: "الرائد",
    daily_xp: 600,
    price_sar: 59,
    duration_days: 30,
    summary: "لمن يريد الوصول لكل شيء بأعلى سرعة ورصيد يومي أكبر.",
    benefits: ["600 XP يوميًا", "59 ريال شهريًا", "مناسبة للمشروعات والمواد المتعددة"],
    is_active: true,
    is_default: false,
    sort_order: 4
  }
];

function createPostgresDatabaseClient(rawConfig = {}) {
  const config = normalizeConfig(rawConfig);
  let pool = null;
  const state = {
    configured: Boolean(config.connectionString || (config.host && config.database && config.user)),
    connected: false,
    driver: "postgres",
    host: config.host,
    port: config.port,
    database: config.database,
    message: "PostgreSQL is not connected yet."
  };

  async function query(sql, params = []) {
    const result = await pool.query(sql, params);
    return result.rows || [];
  }

  async function initialize() {
    if (!state.configured) {
      state.message = "PostgreSQL/Neon environment variables are incomplete.";
      return;
    }

    const { Pool } = getPgModule();
    pool = new Pool({
      connectionString: config.connectionString || undefined,
      host: config.connectionString ? undefined : config.host,
      port: config.connectionString ? undefined : config.port,
      database: config.connectionString ? undefined : config.database,
      user: config.connectionString ? undefined : config.user,
      password: config.connectionString ? undefined : config.password,
      ssl: config.ssl || undefined,
      max: 10,
      connectionTimeoutMillis: config.connectTimeout,
      idleTimeoutMillis: 30000
    });

    await pool.query("SELECT 1");
    await ensureSchema();
    state.connected = true;
    state.message = "PostgreSQL/Neon connected successfully.";
  }

  async function ensureColumn(tableName, columnName, definitionSql) {
    const rows = await query(
      `
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
          AND column_name = $2
        LIMIT 1
      `,
      [tableName, columnName]
    );
    if (!rows.length) {
      await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${definitionSql}`);
    }
  }

  async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_packages (
        id BIGSERIAL PRIMARY KEY,
        package_key VARCHAR(80) NOT NULL UNIQUE,
        display_name VARCHAR(160) NOT NULL,
        daily_xp INTEGER NOT NULL DEFAULT 0,
        price_sar NUMERIC(10,2) NOT NULL DEFAULT 0,
        duration_days INTEGER NOT NULL DEFAULT 0,
        summary TEXT NULL,
        benefits TEXT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_app_packages_key ON app_packages (package_key)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'student',
        stage VARCHAR(100) NULL,
        grade VARCHAR(100) NULL,
        subject VARCHAR(100) NULL,
        package_id BIGINT NULL REFERENCES app_packages(id) ON DELETE SET NULL,
        package_name VARCHAR(150) NOT NULL DEFAULT 'مجاني محدود',
        plan_type VARCHAR(80) NOT NULL DEFAULT 'starter',
        package_started_at TIMESTAMPTZ NULL,
        package_expires_at TIMESTAMPTZ NULL,
        balance INTEGER NOT NULL DEFAULT 0,
        xp INTEGER NOT NULL DEFAULT 0,
        total_xp INTEGER NOT NULL DEFAULT 0,
        daily_reward_amount INTEGER NOT NULL DEFAULT 0,
        streak_days INTEGER NOT NULL DEFAULT 0,
        motivation_score INTEGER NOT NULL DEFAULT 0,
        referral_code VARCHAR(32) NULL,
        referred_by_user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        trust_score INTEGER NOT NULL DEFAULT 70,
        abuse_score INTEGER NOT NULL DEFAULT 0,
        shadow_banned BOOLEAN NOT NULL DEFAULT FALSE,
        last_active_date DATE NULL,
        last_reset DATE NULL,
        last_daily_reward_claimed_at TIMESTAMPTZ NULL,
        last_daily_reward_at TIMESTAMPTZ NULL,
        last_daily_xp_claimed_date DATE NULL,
        last_daily_xp_granted_at TIMESTAMPTZ NULL,
        signup_bonus_claimed BOOLEAN NOT NULL DEFAULT FALSE,
        achievements JSONB NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        activity VARCHAR(255) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_email ON app_users (email)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_app_users_role_status ON app_users (role, status)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_app_users_package_id ON app_users (package_id)");
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_app_users_referral_code ON app_users (referral_code) WHERE referral_code IS NOT NULL");

    await ensureColumn("app_users", "package_id", "package_id BIGINT NULL REFERENCES app_packages(id) ON DELETE SET NULL");
    await ensureColumn("app_users", "plan_type", "plan_type VARCHAR(80) NOT NULL DEFAULT 'starter'");
    await ensureColumn("app_users", "package_started_at", "package_started_at TIMESTAMPTZ NULL");
    await ensureColumn("app_users", "package_expires_at", "package_expires_at TIMESTAMPTZ NULL");
    await ensureColumn("app_users", "balance", "balance INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("app_users", "total_xp", "total_xp INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("app_users", "daily_reward_amount", "daily_reward_amount INTEGER NOT NULL DEFAULT 0");
    await pool.query("ALTER TABLE app_users ALTER COLUMN xp SET DEFAULT 0");
    await pool.query("ALTER TABLE app_users ALTER COLUMN balance SET DEFAULT 0");
    await pool.query("ALTER TABLE app_users ALTER COLUMN total_xp SET DEFAULT 0");
    await pool.query("ALTER TABLE app_users ALTER COLUMN daily_reward_amount SET DEFAULT 0");
    await ensureColumn("app_users", "last_reset", "last_reset DATE NULL");
    await ensureColumn("app_users", "last_daily_reward_claimed_at", "last_daily_reward_claimed_at TIMESTAMPTZ NULL");
    await ensureColumn("app_users", "last_daily_reward_at", "last_daily_reward_at TIMESTAMPTZ NULL");
    await ensureColumn("app_users", "last_daily_xp_claimed_date", "last_daily_xp_claimed_date DATE NULL");
    await ensureColumn("app_users", "last_daily_xp_granted_at", "last_daily_xp_granted_at TIMESTAMPTZ NULL");
    await ensureColumn("app_users", "signup_bonus_claimed", "signup_bonus_claimed BOOLEAN NOT NULL DEFAULT FALSE");
    await ensureColumn("app_users", "referral_code", "referral_code VARCHAR(32) NULL");
    await ensureColumn("app_users", "referred_by_user_id", "referred_by_user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL");
    await ensureColumn("app_users", "trust_score", "trust_score INTEGER NOT NULL DEFAULT 70");
    await ensureColumn("app_users", "abuse_score", "abuse_score INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("app_users", "shadow_banned", "shadow_banned BOOLEAN NOT NULL DEFAULT FALSE");
    await pool.query("ALTER TABLE app_users ALTER COLUMN signup_bonus_claimed SET DEFAULT FALSE");
    await pool.query(`
      UPDATE app_users
      SET last_daily_xp_granted_at = last_daily_xp_claimed_date::timestamp AT TIME ZONE 'Asia/Riyadh'
      WHERE last_daily_xp_granted_at IS NULL
        AND last_daily_xp_claimed_date IS NOT NULL
    `);
    await pool.query(`
      UPDATE app_users
      SET last_daily_reward_at = last_daily_xp_granted_at
      WHERE last_daily_reward_at IS NULL
        AND last_daily_xp_granted_at IS NOT NULL
    `);
    await pool.query(`
      UPDATE app_users
      SET balance = COALESCE(xp, balance, 0)
      WHERE balance IS NULL
         OR balance <> COALESCE(xp, 0)
    `);
    await pool.query(`
      UPDATE app_users u
      SET daily_reward_amount = p.daily_xp
      FROM app_packages p
      WHERE p.id = u.package_id
        AND COALESCE(p.daily_xp, 0) > 0
        AND u.daily_reward_amount <> p.daily_xp
    `);
    await ensureColumn("app_users", "motivation_score", "motivation_score INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("app_packages", "duration_days", "duration_days INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("app_packages", "benefits", "benefits TEXT NULL");

    await ensureDefaultPackages();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_subscriptions (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        package_id BIGINT NULL REFERENCES app_packages(id) ON DELETE SET NULL,
        package_key VARCHAR(80) NOT NULL DEFAULT 'starter',
        package_name VARCHAR(160) NOT NULL,
        daily_xp INTEGER NOT NULL DEFAULT 0,
        price_sar NUMERIC(10,2) NOT NULL DEFAULT 0,
        duration_days INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        started_at TIMESTAMPTZ NULL,
        expires_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_app_subscriptions_user_status ON app_subscriptions (user_id, status)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_app_subscriptions_package ON app_subscriptions (package_id)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_projects (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        title VARCHAR(180) NOT NULL,
        subject VARCHAR(120) NULL,
        stage VARCHAR(120) NULL,
        grade VARCHAR(120) NULL,
        term VARCHAR(120) NULL,
        lesson VARCHAR(180) NULL,
        description TEXT NULL,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_app_projects_user_archived ON app_projects (user_id, is_archived)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        guest_session_id VARCHAR(255) NULL UNIQUE,
        user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        project_id BIGINT NULL REFERENCES app_projects(id) ON DELETE SET NULL,
        title VARCHAR(255) NULL,
        subject VARCHAR(255) NULL,
        stage VARCHAR(100) NULL,
        grade VARCHAR(100) NULL,
        term VARCHAR(100) NULL,
        selected_model_key VARCHAR(40) NULL,
        summary TEXT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        last_message_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await ensureColumn("conversations", "user_id", "user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL");
    await ensureColumn("conversations", "project_id", "project_id BIGINT NULL REFERENCES app_projects(id) ON DELETE SET NULL");
    await ensureColumn("conversations", "selected_model_key", "selected_model_key VARCHAR(40) NULL");
    await ensureColumn("conversations", "summary", "summary TEXT NULL");
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_guest_session ON conversations (guest_session_id)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations (project_id)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGSERIAL PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        role VARCHAR(20) NOT NULL,
        body TEXT NOT NULL,
        source VARCHAR(50) NOT NULL DEFAULT 'web',
        model_key VARCHAR(40) NULL,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        xp_cost INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at)");
    await ensureColumn("messages", "user_id", "user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL");
    await ensureColumn("messages", "model_key", "model_key VARCHAR(40) NULL");
    await ensureColumn("messages", "input_tokens", "input_tokens INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("messages", "output_tokens", "output_tokens INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("messages", "xp_cost", "xp_cost INTEGER NOT NULL DEFAULT 0");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_messages_user_created ON messages (user_id, created_at)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_memory (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        memory_type VARCHAR(40) NOT NULL DEFAULT 'fact',
        content TEXT NOT NULL,
        importance INTEGER NOT NULL DEFAULT 3,
        embedding JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_user_memory_user_importance ON user_memory (user_id, importance DESC, updated_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_embeddings (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        conversation_id VARCHAR(64) NULL REFERENCES conversations(id) ON DELETE CASCADE,
        message_id BIGINT NULL REFERENCES messages(id) ON DELETE CASCADE,
        embedding JSONB NULL,
        content_preview TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_message_embeddings_user_created ON message_embeddings (user_id, created_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        message_id BIGINT NULL REFERENCES messages(id) ON DELETE SET NULL,
        rating VARCHAR(20) NOT NULL,
        note TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_feedback_user_message ON feedback (user_id, message_id)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_feedback (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        conversation_id VARCHAR(64) NULL REFERENCES conversations(id) ON DELETE SET NULL,
        message_id BIGINT NULL REFERENCES messages(id) ON DELETE SET NULL,
        model_key VARCHAR(80) NULL,
        provider VARCHAR(40) NULL,
        rating VARCHAR(20) NOT NULL,
        reason TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_feedback_model_rating ON ai_feedback (model_key, rating, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_created ON ai_feedback (user_id, created_at DESC)");
    await ensureColumn("ai_feedback", "feedback_type", "feedback_type VARCHAR(40) NULL");
    await ensureColumn("ai_feedback", "task_type", "task_type VARCHAR(80) NULL");
    await ensureColumn("ai_feedback", "question_type", "question_type VARCHAR(80) NULL");
    await ensureColumn("ai_feedback", "prompt_key", "prompt_key VARCHAR(160) NULL");
    await ensureColumn("ai_feedback", "prompt_version", "prompt_version VARCHAR(80) NULL");
    await ensureColumn("ai_feedback", "quality_score", "quality_score INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("ai_feedback", "metadata", "metadata JSONB NULL");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_training_examples (
        id BIGSERIAL PRIMARY KEY,
        input_text TEXT NOT NULL,
        ideal_output TEXT NOT NULL,
        task_type VARCHAR(80) NULL,
        model_key VARCHAR(80) NULL,
        quality_score INTEGER NOT NULL DEFAULT 0,
        approved_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_training_examples_quality ON ai_training_examples (approved_by_admin, quality_score DESC, created_at DESC)");
    await ensureColumn("ai_training_examples", "review_status", "review_status VARCHAR(40) NOT NULL DEFAULT 'pending'");
    await ensureColumn("ai_training_examples", "admin_note", "admin_note TEXT NULL");
    await ensureColumn("ai_training_examples", "metadata", "metadata JSONB NULL");
    await ensureColumn("ai_training_examples", "updated_at", "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_training_examples_review ON ai_training_examples (review_status, quality_score DESC, created_at DESC)");

    try {
      await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
    } catch (error) {
      console.warn("pgvector extension is not available; using JSONB embeddings and keyword ranking.", error?.message || error);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_knowledge_sources (
        id BIGSERIAL PRIMARY KEY,
        source_key VARCHAR(160) NOT NULL UNIQUE,
        source_type VARCHAR(80) NOT NULL DEFAULT 'manual',
        title VARCHAR(255) NOT NULL,
        url TEXT NULL,
        quality_score INTEGER NOT NULL DEFAULT 60,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_knowledge_sources_type ON ai_knowledge_sources (source_type, is_active)");
    await ensureColumn("ai_knowledge_sources", "category", "category VARCHAR(80) NOT NULL DEFAULT 'faq'");
    await ensureColumn("ai_knowledge_sources", "status", "status VARCHAR(40) NOT NULL DEFAULT 'draft'");
    await ensureColumn("ai_knowledge_sources", "source_label", "source_label VARCHAR(255) NULL");
    await ensureColumn("ai_knowledge_sources", "tags", "tags JSONB NOT NULL DEFAULT '[]'::jsonb");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_knowledge_sources_status ON ai_knowledge_sources (status, is_active, updated_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
        id BIGSERIAL PRIMARY KEY,
        source_id BIGINT NULL REFERENCES ai_knowledge_sources(id) ON DELETE CASCADE,
        chunk_key VARCHAR(180) NULL UNIQUE,
        title VARCHAR(255) NULL,
        content TEXT NOT NULL,
        sanitized_content TEXT NULL,
        embedding JSONB NULL,
        task_type VARCHAR(80) NULL,
        quality_score INTEGER NOT NULL DEFAULT 60,
        feedback_score INTEGER NOT NULL DEFAULT 0,
        usage_count INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_knowledge_chunks_task ON ai_knowledge_chunks (task_type, quality_score DESC, updated_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_knowledge_chunks_updated ON ai_knowledge_chunks (updated_at DESC)");
    await ensureColumn("ai_knowledge_chunks", "category", "category VARCHAR(80) NOT NULL DEFAULT 'faq'");
    await ensureColumn("ai_knowledge_chunks", "status", "status VARCHAR(40) NOT NULL DEFAULT 'draft'");
    await ensureColumn("ai_knowledge_chunks", "tags", "tags JSONB NOT NULL DEFAULT '[]'::jsonb");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_knowledge_chunks_status ON ai_knowledge_chunks (status, quality_score DESC, updated_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_quality_events (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        conversation_id VARCHAR(64) NULL REFERENCES conversations(id) ON DELETE SET NULL,
        message_id BIGINT NULL REFERENCES messages(id) ON DELETE SET NULL,
        task_type VARCHAR(80) NULL,
        question_type VARCHAR(80) NULL,
        model_key VARCHAR(80) NULL,
        provider VARCHAR(40) NULL,
        prompt_key VARCHAR(160) NULL,
        prompt_version VARCHAR(80) NULL,
        quality_score INTEGER NOT NULL DEFAULT 0,
        accuracy_score INTEGER NOT NULL DEFAULT 0,
        length_score INTEGER NOT NULL DEFAULT 0,
        speed_score INTEGER NOT NULL DEFAULT 0,
        satisfaction_score INTEGER NOT NULL DEFAULT 0,
        cost_score INTEGER NOT NULL DEFAULT 0,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        token_cost INTEGER NOT NULL DEFAULT 0,
        xp_cost INTEGER NOT NULL DEFAULT 0,
        user_feedback VARCHAR(40) NULL,
        was_cached BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_quality_model_created ON ai_quality_events (model_key, provider, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_quality_task_created ON ai_quality_events (task_type, created_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_usage (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        tool_key VARCHAR(80) NOT NULL,
        task_type VARCHAR(80) NULL,
        input_text TEXT NULL,
        output_text TEXT NULL,
        xp_cost INTEGER NOT NULL DEFAULT 0,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_tool_usage_user_created ON tool_usage (user_id, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_task ON tool_usage (tool_key, task_type)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_business_events (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        event_type VARCHAR(80) NOT NULL,
        reason VARCHAR(160) NULL,
        plan VARCHAR(80) NULL,
        route VARCHAR(180) NULL,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_business_events_type_created ON app_business_events (event_type, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_business_events_user_created ON app_business_events (user_id, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_business_events_plan_created ON app_business_events (plan, created_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_abuse_events (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        ip_hash VARCHAR(80) NULL,
        action VARCHAR(80) NOT NULL DEFAULT 'observe',
        reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
        score INTEGER NOT NULL DEFAULT 0,
        route VARCHAR(180) NULL,
        prompt_hash VARCHAR(80) NULL,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_abuse_events_action_created ON app_abuse_events (action, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_abuse_events_user_created ON app_abuse_events (user_id, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_abuse_events_ip_created ON app_abuse_events (ip_hash, created_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_referrals (
        id BIGSERIAL PRIMARY KEY,
        referrer_user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        referred_user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        referral_code VARCHAR(32) NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'signup',
        reward_type VARCHAR(40) NULL,
        reward_amount INTEGER NOT NULL DEFAULT 0,
        referred_reward_amount INTEGER NOT NULL DEFAULT 0,
        converted_at TIMESTAMPTZ NULL,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (referred_user_id)
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_app_referrals_referrer_created ON app_referrals (referrer_user_id, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_app_referrals_status_created ON app_referrals (status, created_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_knowledge_suggestions (
        id BIGSERIAL PRIMARY KEY,
        question_hash VARCHAR(80) NOT NULL UNIQUE,
        sanitized_question TEXT NOT NULL,
        proposed_title VARCHAR(255) NOT NULL,
        proposed_category VARCHAR(80) NOT NULL DEFAULT 'faq',
        reason VARCHAR(160) NULL,
        occurrences INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(40) NOT NULL DEFAULT 'pending',
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_ai_kb_suggestions_status_occurrences ON ai_knowledge_suggestions (status, occurrences DESC, updated_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS xp_ledger (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(40) NOT NULL,
        reason TEXT NULL,
        admin_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await ensureColumn("xp_ledger", "admin_id", "admin_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_created ON xp_ledger (user_id, created_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(180) NOT NULL,
        body TEXT NOT NULL,
        type VARCHAR(40) NOT NULL,
        badge VARCHAR(80) NULL,
        icon VARCHAR(40) NULL,
        target_plan VARCHAR(80) NOT NULL DEFAULT 'all',
        target_user_id BIGINT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        action_url TEXT NULL,
        starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_type_title ON notifications (type, title)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_notifications_active_target ON notifications (is_active, target_plan, starts_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications (target_user_id, created_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_reads (
        id BIGSERIAL PRIMARY KEY,
        notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (notification_id, user_id)
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads (user_id, read_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON notification_reads (notification_id)");
    await ensureDefaultNotifications();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_suggestions (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(180) NOT NULL,
        normalized_title VARCHAR(180) NOT NULL,
        category VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        use_case TEXT NOT NULL,
        extra_notes TEXT NULL,
        importance INTEGER NOT NULL DEFAULT 3,
        attachment_name VARCHAR(180) NULL,
        attachment_data_url TEXT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'pending',
        votes_count INTEGER NOT NULL DEFAULT 1,
        created_by BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        approved_by BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        approved_at TIMESTAMPTZ NULL,
        implemented_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await ensureColumn("tool_suggestions", "importance", "importance INTEGER NOT NULL DEFAULT 3");
    await ensureColumn("tool_suggestions", "attachment_name", "attachment_name VARCHAR(180) NULL");
    await ensureColumn("tool_suggestions", "attachment_data_url", "attachment_data_url TEXT NULL");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_tool_suggestions_status_votes ON tool_suggestions (status, votes_count DESC, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_tool_suggestions_normalized ON tool_suggestions (normalized_title)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_suggestion_votes (
        id BIGSERIAL PRIMARY KEY,
        suggestion_id BIGINT NOT NULL REFERENCES tool_suggestions(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        vote_type VARCHAR(40) NOT NULL DEFAULT 'upvote',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (suggestion_id, user_id)
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_tool_suggestion_votes_user ON tool_suggestion_votes (user_id, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_tool_suggestion_votes_suggestion ON tool_suggestion_votes (suggestion_id)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tool_suggestion_rewards (
        id BIGSERIAL PRIMARY KEY,
        suggestion_id BIGINT NOT NULL REFERENCES tool_suggestions(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        xp_amount INTEGER NOT NULL DEFAULT 50,
        reason TEXT NULL,
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (suggestion_id, user_id)
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_tool_suggestion_rewards_user ON tool_suggestion_rewards (user_id, granted_at DESC)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id BIGSERIAL PRIMARY KEY,
        admin_id BIGINT NULL REFERENCES app_users(id) ON DELETE SET NULL,
        action VARCHAR(80) NOT NULL,
        target_type VARCHAR(80) NULL,
        target_id VARCHAR(120) NULL,
        details_json JSONB NULL,
        ip_address VARCHAR(80) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_created ON admin_logs (admin_id, created_at DESC)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs (target_type, target_id)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_api_tokens (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL DEFAULT 'mullem-web',
        token_hash CHAR(64) NOT NULL UNIQUE,
        last_used_at TIMESTAMPTZ NULL,
        expires_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_app_api_tokens_hash ON app_api_tokens (token_hash)");
    await pool.query("CREATE INDEX IF NOT EXISTS idx_app_api_tokens_user_id ON app_api_tokens (user_id)");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_guest_usage (
        guest_session_id VARCHAR(120) PRIMARY KEY,
        messages_count INTEGER NOT NULL DEFAULT 0,
        usage_date DATE NULL,
        last_message_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_app_guest_usage_session ON app_guest_usage (guest_session_id)");
    await ensureColumn("app_guest_usage", "usage_date", "usage_date DATE NULL");
  }

  async function ensureDefaultNotifications() {
    const defaults = [
      {
        title: "خصم على باقة طويق",
        body: "احصل على 30% XP إضافية عند شراء باقة طويق",
        type: "xp_discount",
        badge: "خصم 30%",
        icon: "gift",
        target_plan: "all",
        expires_at: "NOW() + INTERVAL '2 days'"
      },
      {
        title: "تحديث نظام نقاط XP",
        body: "تم تحسين أداء النظام وإضافة خيارات جديدة لإدارة النقاط",
        type: "official_update",
        badge: "تحديث",
        icon: "sparkle",
        target_plan: "all",
        expires_at: null
      },
      {
        title: "صيانة مجدولة",
        body: "ستتم صيانة الخوادم يوم الأحد من 2 ص إلى 4 ص",
        type: "official_update",
        badge: "إعلان",
        icon: "megaphone",
        target_plan: "all",
        expires_at: null
      },
      {
        title: "أداة تلخيص المحتوى",
        body: "أداة جديدة تساعدك على تلخيص أي نص بسرعة وذكاء",
        type: "feature_update",
        badge: "إضافة جديدة",
        icon: "sparkle",
        target_plan: "all",
        expires_at: null
      },
      {
        title: "تحسين واجهة المستخدم",
        body: "تم تحسين سرعة الموقع وتجربة المستخدم بشكل عام",
        type: "feature_update",
        badge: "تحسين",
        icon: "image",
        target_plan: "all",
        expires_at: null
      }
    ];

    for (const item of defaults) {
      const expiresSql = item.expires_at || "NULL";
      await pool.query(
        `
          INSERT INTO notifications (
            title, body, type, badge, icon, target_plan, starts_at, expires_at, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), ${expiresSql}, TRUE)
          ON CONFLICT (type, title) DO UPDATE SET
            body = EXCLUDED.body,
            badge = EXCLUDED.badge,
            icon = EXCLUDED.icon,
            target_plan = EXCLUDED.target_plan,
            starts_at = EXCLUDED.starts_at,
            expires_at = EXCLUDED.expires_at,
            is_active = TRUE,
            updated_at = NOW()
        `,
        [item.title, item.body, item.type, item.badge, item.icon, item.target_plan]
      );
    }
  }

  async function ensureDefaultPackages() {
    for (const pkg of DEFAULT_PACKAGE_CATALOG) {
      await pool.query(
        `
          INSERT INTO app_packages (
            package_key, display_name, daily_xp, price_sar, duration_days, summary, benefits, is_active, is_default, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (package_key) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            daily_xp = EXCLUDED.daily_xp,
            price_sar = EXCLUDED.price_sar,
            duration_days = EXCLUDED.duration_days,
            summary = EXCLUDED.summary,
            benefits = EXCLUDED.benefits,
            is_active = EXCLUDED.is_active,
            is_default = EXCLUDED.is_default,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
        `,
        [
          pkg.package_key,
          pkg.display_name,
          pkg.daily_xp,
          pkg.price_sar,
          pkg.duration_days,
          pkg.summary,
          serializeBenefits(pkg.benefits),
          pkg.is_active,
          pkg.is_default,
          pkg.sort_order
        ]
      );
    }
  }

  function getPackageSelectClause(alias = "p") {
    return `
      ${alias}.id AS package_join_id,
      ${alias}.package_key,
      ${alias}.display_name AS package_display_name,
      ${alias}.daily_xp AS package_daily_xp,
      ${alias}.price_sar AS package_price_sar,
      ${alias}.duration_days AS package_duration_days,
      ${alias}.summary AS package_summary,
      ${alias}.benefits AS package_benefits,
      ${alias}.is_active AS package_is_active,
      ${alias}.is_default AS package_is_default,
      ${alias}.sort_order AS package_sort_order
    `;
  }

  function getUserSelectClause(userAlias = "u", packageAlias = "p") {
    return `
      ${userAlias}.*,
      ${getPackageSelectClause(packageAlias)}
    `;
  }

  function isReady() {
    return Boolean(pool) && state.connected;
  }

  function getState() {
    return { ...state };
  }

  async function getConversationById(conversationId) {
    const rows = await query("SELECT * FROM conversations WHERE id = $1 LIMIT 1", [String(conversationId || "")]);
    return rows[0] || null;
  }

  async function getConversationByGuestSessionId(guestSessionId) {
    const rows = await query("SELECT * FROM conversations WHERE guest_session_id = $1 LIMIT 1", [String(guestSessionId || "")]);
    return rows[0] || null;
  }

  async function createConversation(payload = {}) {
    const conversation = {
      id: String(payload.id || payload.conversation_id || crypto.randomUUID()).trim(),
      guest_session_id: String(payload.guest_session_id || "").trim() || null,
      user_id: payload.user_id ? Number(payload.user_id) : null,
      project_id: payload.project_id ? Number(payload.project_id) : null,
      title: String(payload.title || "").trim() || null,
      subject: String(payload.subject || "").trim() || null,
      stage: String(payload.stage || "").trim() || null,
      grade: String(payload.grade || "").trim() || null,
      term: String(payload.term || "").trim() || null,
      selected_model_key: String(payload.selected_model_key || payload.selected_model || payload.selectedModel || payload.model || "").trim() || null,
      summary: String(payload.summary || "").trim() || null
    };

    await pool.query(
      `
        INSERT INTO conversations (
          id, guest_session_id, user_id, project_id, title, subject, stage, grade, term, selected_model_key, summary, status, last_message_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', NULL)
      `,
      [
        conversation.id,
        conversation.guest_session_id,
        conversation.user_id,
        conversation.project_id,
        conversation.title,
        conversation.subject,
        conversation.stage,
        conversation.grade,
        conversation.term,
        conversation.selected_model_key,
        conversation.summary
      ]
    );

    return getConversationById(conversation.id);
  }

  async function assignConversationUser(conversationId, userId) {
    if (!conversationId || !userId) return;
    await pool.query(
      "UPDATE conversations SET user_id = $1, updated_at = NOW() WHERE id = $2 AND user_id IS NULL",
      [Number(userId), String(conversationId)]
    );
  }

  async function updateConversationContext(conversationId, changes = {}) {
    const mappings = {
      user_id: "user_id",
      project_id: "project_id",
      title: "title",
      subject: "subject",
      stage: "stage",
      grade: "grade",
      term: "term",
      selected_model_key: "selected_model_key",
      summary: "summary"
    };
    const { sets, values } = buildAssignments(changes, mappings);
    if (!sets.length) return getConversationById(conversationId);

    await pool.query(
      `UPDATE conversations SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1}`,
      [...values, String(conversationId)]
    );

    return getConversationById(conversationId);
  }

  async function deleteConversation(conversationId, userId) {
    const safeConversationId = String(conversationId || "").trim();
    if (!safeConversationId || !userId) return false;

    const result = await pool.query(
      "DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id",
      [safeConversationId, Number(userId)]
    );

    return Number(result.rowCount || 0) > 0;
  }

  async function getOrCreateConversation(payload = {}) {
    const conversationId = String(payload.conversation_id || "").trim();
    const guestSessionId = String(payload.guest_session_id || "").trim();
    const userId = payload.user_id ? Number(payload.user_id) : null;
    const createFreshConversation = () => createConversation({
      ...payload,
      id: "",
      conversation_id: "",
      guest_session_id: ""
    });
    const isOwnedByAnotherUser = (conversation) =>
      Boolean(userId && conversation?.user_id && Number(conversation.user_id) !== Number(userId));

    if (conversationId) {
      const existing = await getConversationById(conversationId);
      if (existing) {
        if (isOwnedByAnotherUser(existing)) return createFreshConversation();
        const nextChanges = {};
        if (userId && !existing.user_id) nextChanges.user_id = userId;
        if (payload.project_id && String(existing.project_id || "") !== String(payload.project_id)) nextChanges.project_id = Number(payload.project_id);
        if (payload.subject && !existing.subject) nextChanges.subject = String(payload.subject).trim();
        if (payload.stage && !existing.stage) nextChanges.stage = String(payload.stage).trim();
        if (payload.grade && !existing.grade) nextChanges.grade = String(payload.grade).trim();
        if (payload.term && !existing.term) nextChanges.term = String(payload.term).trim();
        if (payload.selected_model_key || payload.selected_model || payload.selectedModel || payload.model) {
          nextChanges.selected_model_key = String(payload.selected_model_key || payload.selected_model || payload.selectedModel || payload.model).trim();
        }
        if (payload.title && !existing.title) nextChanges.title = String(payload.title).trim().slice(0, 255);
        if (Object.keys(nextChanges).length) return updateConversationContext(existing.id, nextChanges);
        if (userId) await assignConversationUser(existing.id, userId);
        return getConversationById(existing.id);
      }
    }

    if (guestSessionId) {
      const existing = await getConversationByGuestSessionId(guestSessionId);
      if (existing) {
        if (isOwnedByAnotherUser(existing)) return createFreshConversation();
        const nextChanges = {};
        if (userId && !existing.user_id) nextChanges.user_id = userId;
        if (payload.project_id && String(existing.project_id || "") !== String(payload.project_id)) nextChanges.project_id = Number(payload.project_id);
        if (payload.selected_model_key || payload.selected_model || payload.selectedModel || payload.model) {
          nextChanges.selected_model_key = String(payload.selected_model_key || payload.selected_model || payload.selectedModel || payload.model).trim();
        }
        if (Object.keys(nextChanges).length) return updateConversationContext(existing.id, nextChanges);
        if (userId) await assignConversationUser(existing.id, userId);
        return getConversationById(existing.id);
      }
    }

    return createConversation(payload);
  }

  async function saveMessage(conversationId, role, body, source = "web", metadata = {}) {
    const messageRows = await query(
      `
        INSERT INTO messages (
          conversation_id, user_id, role, body, source, model_key, input_tokens, output_tokens, xp_cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        String(conversationId),
        metadata.user_id ? Number(metadata.user_id) : null,
        String(role || ""),
        String(body || ""),
        String(source || "web"),
        String(metadata.model_key || "").trim() || null,
        Math.max(0, Math.round(Number(metadata.input_tokens || 0))),
        Math.max(0, Math.round(Number(metadata.output_tokens || 0))),
        Math.max(0, Math.round(Number(metadata.xp_cost || 0)))
      ]
    );

    await pool.query(
      "UPDATE conversations SET last_message_at = NOW(), updated_at = NOW(), selected_model_key = COALESCE($2, selected_model_key) WHERE id = $1",
      [String(conversationId), String(metadata.model_key || "").trim() || null]
    );

    return messageRows[0] || null;
  }

  async function listMessages(conversationId, limit = 10) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
    const rows = await query(
      `
        SELECT id, user_id, role, body, source, model_key, input_tokens, output_tokens, xp_cost, created_at
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT $2
      `,
      [String(conversationId), safeLimit]
    );

    return rows.reverse().map((row) => ({
      role: row.role,
      text: row.body,
      source: row.source,
      id: row.id,
      user_id: row.user_id,
      model_key: row.model_key,
      input_tokens: Number(row.input_tokens || 0),
      output_tokens: Number(row.output_tokens || 0),
      xp_cost: Number(row.xp_cost || 0),
      created_at: row.created_at
    }));
  }

  async function listRecentConversations(limit = 20) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
    return query(
      `
        SELECT id, guest_session_id, user_id, project_id, title, subject, stage, grade, term, selected_model_key, summary, status, last_message_at, created_at, updated_at
        FROM conversations
        ORDER BY COALESCE(last_message_at, created_at) DESC
        LIMIT $1
      `,
      [safeLimit]
    );
  }

  async function listUserConversations(userId, options = {}) {
    const safeLimit = Math.max(1, Math.min(Number(options.limit || 20), 100));
    const params = [Number(userId)];
    let whereClause = "WHERE user_id = $1";

    if (options.project_id) {
      params.push(Number(options.project_id));
      whereClause += ` AND project_id = $${params.length}`;
    }

    params.push(safeLimit);
    return query(
      `
        SELECT id, guest_session_id, user_id, project_id, title, subject, stage, grade, term, selected_model_key, summary, status, last_message_at, created_at, updated_at
        FROM conversations
        ${whereClause}
        ORDER BY COALESCE(last_message_at, created_at) DESC
        LIMIT $${params.length}
      `,
      params
    );
  }

  async function listUserMemoryCandidates(userId, options = {}) {
    const safeLimit = Math.max(1, Math.min(Number(options.limit || 36), 80));
    const memoryLimit = Math.min(10, safeLimit);
    const params = [Number(userId)];
    let whereClause = "WHERE c.user_id = $1";

    if (options.exclude_conversation_id) {
      params.push(String(options.exclude_conversation_id));
      whereClause += ` AND c.id <> $${params.length}`;
    }

    const memoryRows = await query(
      `
        SELECT
          memory_type,
          content,
          importance,
          updated_at,
          created_at
        FROM user_memory
        WHERE user_id = $1
        ORDER BY importance DESC, updated_at DESC, id DESC
        LIMIT $2
      `,
      [Number(userId), memoryLimit]
    );

    params.push(safeLimit);
    const rows = await query(
      `
        SELECT
          m.role,
          m.body,
          m.source,
          m.model_key,
          m.xp_cost,
          m.created_at,
          c.id AS conversation_id,
          c.title,
          c.subject,
          c.stage,
          c.grade,
          c.term,
          c.project_id
        FROM messages m
        INNER JOIN conversations c ON c.id = m.conversation_id
        ${whereClause}
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT $${params.length}
      `,
      params
    );

    const memoryItems = memoryRows.map((row) => ({
      role: "system",
      text: row.content,
      source: "memory",
      memory_type: row.memory_type,
      importance: Number(row.importance || 0),
      created_at: row.updated_at || row.created_at,
      conversation_id: null,
      title: null,
      subject: null,
      stage: null,
      grade: null,
      term: null,
      project_id: null
    }));

    const messageItems = rows.map((row) => ({
      role: row.role,
      text: row.body,
      source: row.source,
      model_key: row.model_key,
      xp_cost: Number(row.xp_cost || 0),
      created_at: row.created_at,
      conversation_id: row.conversation_id,
      title: row.title || null,
      subject: row.subject || null,
      stage: row.stage || null,
      grade: row.grade || null,
      term: row.term || null,
      project_id: row.project_id != null ? Number(row.project_id) : null
    }));

    return [...memoryItems, ...messageItems].slice(0, safeLimit);
  }

  async function countConversationMessages(conversationId) {
    const rows = await query(
      "SELECT COUNT(*)::int AS count FROM messages WHERE conversation_id = $1",
      [String(conversationId)]
    );
    return Number(rows?.[0]?.count || 0);
  }

  async function updateConversationSummary(conversationId, summary) {
    const rows = await query(
      "UPDATE conversations SET summary = $2, updated_at = NOW() WHERE id = $1 RETURNING *",
      [String(conversationId), String(summary || "").trim() || null]
    );
    return rows[0] || null;
  }

  async function saveUserMemory(payload = {}) {
    const userId = Number(payload.user_id);
    const content = String(payload.content || "").trim();
    if (!userId || !content) return null;

    const memoryType = String(payload.memory_type || "fact").trim().slice(0, 40) || "fact";
    const importance = Math.max(1, Math.min(5, Math.round(Number(payload.importance || 3))));
    const existing = await query(
      "SELECT id FROM user_memory WHERE user_id = $1 AND content = $2 LIMIT 1",
      [userId, content]
    );

    if (existing[0]?.id) {
      const rows = await query(
        "UPDATE user_memory SET memory_type = $2, importance = GREATEST(importance, $3), updated_at = NOW() WHERE id = $1 RETURNING *",
        [Number(existing[0].id), memoryType, importance]
      );
      return rows[0] || null;
    }

    const rows = await query(
      `
        INSERT INTO user_memory (user_id, memory_type, content, importance, embedding)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [userId, memoryType, content, importance, payload.embedding ? JSON.stringify(payload.embedding) : null]
    );
    return rows[0] || null;
  }

  async function saveMessageEmbedding(payload = {}) {
    const userId = Number(payload.user_id);
    if (!userId) return null;
    const rows = await query(
      `
        INSERT INTO message_embeddings (user_id, conversation_id, message_id, embedding, content_preview)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        userId,
        payload.conversation_id ? String(payload.conversation_id) : null,
        payload.message_id ? Number(payload.message_id) : null,
        payload.embedding ? JSON.stringify(payload.embedding) : null,
        String(payload.content_preview || "").trim().slice(0, 800) || null
      ]
    );
    return rows[0] || null;
  }

  async function saveFeedback(payload = {}) {
    const userId = Number(payload.user_id);
    const rating = String(payload.rating || "").trim().toLowerCase();
    if (!userId || !rating) return null;
    const rawMessageId = Number(payload.message_id);
    const messageId = Number.isFinite(rawMessageId) && rawMessageId > 0 ? rawMessageId : null;
    const rows = await query(
      `
        INSERT INTO feedback (user_id, message_id, rating, note)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        userId,
        messageId,
        rating.slice(0, 20),
        String(payload.note || "").trim() || null
      ]
    );
    try {
      await query(
        `
          INSERT INTO ai_feedback (
            user_id, conversation_id, message_id, model_key, provider, rating, reason,
            feedback_type, task_type, question_type, prompt_key, prompt_version, quality_score, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `,
        [
          userId,
          payload.conversation_id ? String(payload.conversation_id) : null,
          messageId,
          String(payload.model_key || payload.modelKey || "").trim().slice(0, 80) || null,
          String(payload.provider || "").trim().toLowerCase().slice(0, 40) || null,
          rating.slice(0, 20),
          String(payload.reason || payload.note || "").trim() || null,
          String(payload.feedback_type || payload.feedbackType || "").trim().slice(0, 40) || null,
          String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
          String(payload.question_type || payload.questionType || "").trim().slice(0, 80) || null,
          String(payload.prompt_key || payload.promptKey || "").trim().slice(0, 160) || null,
          String(payload.prompt_version || payload.promptVersion || "").trim().slice(0, 80) || null,
          Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 0)))),
          payload.metadata ? JSON.stringify(payload.metadata) : null
        ]
      );
    } catch (error) {
      console.warn("AI feedback write failed:", error?.message || error);
    }
    return rows[0] || null;
  }

  function normalizeReviewStatus(value, fallback = "pending") {
    if (!String(value || "").trim() && fallback === "") return "";
    const status = String(value || fallback || "pending").trim().toLowerCase();
    return ["pending", "approved", "rejected"].includes(status) ? status : fallback;
  }

  function normalizeKnowledgeStatus(value, fallback = "draft") {
    if (!String(value || "").trim() && fallback === "") return "";
    const status = String(value || fallback || "draft").trim().toLowerCase();
    return ["draft", "approved", "rejected"].includes(status) ? status : fallback;
  }

  function normalizeKnowledgeCategory(value) {
    const category = String(value || "faq").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 80);
    return category || "faq";
  }

  function normalizeKnowledgeTags(value) {
    const items = Array.isArray(value)
      ? value
      : String(value || "")
        .split(",")
        .map((item) => item.trim());
    return [...new Set(items.map((item) => String(item || "").trim().slice(0, 40)).filter(Boolean))].slice(0, 12);
  }

  async function saveAiTrainingExample(payload = {}) {
    const inputText = String(payload.input_text || payload.inputText || "").trim();
    const idealOutput = String(payload.ideal_output || payload.idealOutput || "").trim();
    if (!inputText || !idealOutput) return null;
    const rows = await query(
      `
        INSERT INTO ai_training_examples (
          input_text, ideal_output, task_type, model_key, quality_score, approved_by_admin,
          review_status, admin_note, metadata, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `,
      [
        inputText,
        idealOutput,
        String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
        String(payload.model_key || payload.modelKey || "").trim().slice(0, 80) || null,
        Math.max(0, Math.min(Math.round(Number(payload.quality_score || payload.qualityScore || 0)), 100)),
        normalizeBoolean(payload.approved_by_admin || payload.approvedByAdmin),
        normalizeReviewStatus(payload.review_status || payload.reviewStatus),
        String(payload.admin_note || payload.adminNote || "").trim() || null,
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    return rows[0] || null;
  }

  async function listExcellentAnswerCandidates(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 80), 250));
    const status = normalizeReviewStatus(options.status || options.review_status || options.reviewStatus, "");
    const params = [];
    const where = [];
    if (status) {
      params.push(status);
      where.push(`COALESCE(review_status, 'pending') = $${params.length}`);
    }
    if (options.task_type || options.taskType) {
      params.push(String(options.task_type || options.taskType).trim().slice(0, 80));
      where.push(`task_type = $${params.length}`);
    }
    if (options.model_key || options.modelKey) {
      params.push(String(options.model_key || options.modelKey).trim().slice(0, 80));
      where.push(`model_key = $${params.length}`);
    }
    params.push(limit);
    return query(
      `
        SELECT
          id,
          input_text,
          ideal_output,
          task_type,
          model_key,
          quality_score,
          approved_by_admin,
          COALESCE(review_status, 'pending') AS review_status,
          admin_note,
          metadata,
          created_at,
          updated_at
        FROM ai_training_examples
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY
          CASE COALESCE(review_status, 'pending') WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
          quality_score DESC,
          created_at DESC
        LIMIT $${params.length}
      `,
      params
    );
  }

  async function getTrainingExampleById(exampleId) {
    const id = Number(exampleId);
    if (!Number.isFinite(id) || id <= 0) return null;
    const rows = await query(
      `
        SELECT *
        FROM ai_training_examples
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );
    return rows[0] || null;
  }

  async function updateTrainingExampleReview(exampleId, payload = {}) {
    const id = Number(exampleId);
    if (!Number.isFinite(id) || id <= 0) return null;
    const status = normalizeReviewStatus(payload.review_status || payload.reviewStatus || payload.status);
    const inputText = String(payload.input_text || payload.inputText || "").trim();
    const idealOutput = String(payload.ideal_output || payload.idealOutput || "").trim();
    const rows = await query(
      `
        UPDATE ai_training_examples
        SET
          input_text = COALESCE(NULLIF($2, ''), input_text),
          ideal_output = COALESCE(NULLIF($3, ''), ideal_output),
          review_status = $4,
          approved_by_admin = $5,
          admin_note = NULLIF($6, ''),
          metadata = COALESCE($7::jsonb, metadata),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        inputText,
        idealOutput,
        status,
        status === "approved",
        String(payload.admin_note || payload.adminNote || "").trim(),
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    return rows[0] || null;
  }

  async function saveKnowledgeSource(payload = {}) {
    const title = String(payload.title || "").trim().slice(0, 255);
    const sourceKey = String(payload.source_key || payload.sourceKey || title || crypto.randomUUID()).trim().slice(0, 160);
    if (!title) return null;
    const tags = normalizeKnowledgeTags(payload.tags);
    const rows = await query(
      `
        INSERT INTO ai_knowledge_sources (
          source_key, source_type, title, url, quality_score, is_active, metadata,
          category, status, source_label, tags, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW())
        ON CONFLICT (source_key) DO UPDATE SET
          source_type = EXCLUDED.source_type,
          title = EXCLUDED.title,
          url = EXCLUDED.url,
          quality_score = EXCLUDED.quality_score,
          is_active = EXCLUDED.is_active,
          metadata = EXCLUDED.metadata,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          source_label = EXCLUDED.source_label,
          tags = EXCLUDED.tags,
          updated_at = NOW()
        RETURNING *
      `,
      [
        sourceKey,
        String(payload.source_type || payload.sourceType || "manual").trim().slice(0, 80),
        title,
        String(payload.url || "").trim() || null,
        Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 60)))),
        payload.is_active === undefined ? true : normalizeBoolean(payload.is_active || payload.isActive),
        payload.metadata ? JSON.stringify(payload.metadata) : null,
        normalizeKnowledgeCategory(payload.category),
        normalizeKnowledgeStatus(payload.status),
        String(payload.source || payload.source_label || payload.sourceLabel || "").trim().slice(0, 255) || null,
        JSON.stringify(tags)
      ]
    );
    return rows[0] || null;
  }

  async function saveKnowledgeChunk(payload = {}) {
    const content = String(payload.content || payload.chunk_text || payload.text || "").trim();
    if (!content) return null;
    const chunkKey = String(payload.chunk_key || payload.chunkKey || "").trim().slice(0, 180) || null;
    const tags = normalizeKnowledgeTags(payload.tags);
    const rows = await query(
      `
        INSERT INTO ai_knowledge_chunks (
          source_id, chunk_key, title, content, sanitized_content, embedding, task_type,
          quality_score, feedback_score, metadata, category, status, tags, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, NOW())
        ON CONFLICT (chunk_key) DO UPDATE SET
          source_id = EXCLUDED.source_id,
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          sanitized_content = EXCLUDED.sanitized_content,
          embedding = EXCLUDED.embedding,
          task_type = EXCLUDED.task_type,
          quality_score = EXCLUDED.quality_score,
          feedback_score = EXCLUDED.feedback_score,
          metadata = EXCLUDED.metadata,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          tags = EXCLUDED.tags,
          updated_at = NOW()
        RETURNING *
      `,
      [
        payload.source_id || payload.sourceId ? Number(payload.source_id || payload.sourceId) : null,
        chunkKey,
        String(payload.title || "").trim().slice(0, 255) || null,
        content,
        String(payload.sanitized_content || payload.sanitizedContent || content).trim() || null,
        payload.embedding ? JSON.stringify(payload.embedding) : null,
        String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
        Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 60)))),
        Math.max(-100, Math.min(100, Math.round(Number(payload.feedback_score || payload.feedbackScore || 0)))),
        payload.metadata ? JSON.stringify(payload.metadata) : null,
        normalizeKnowledgeCategory(payload.category),
        normalizeKnowledgeStatus(payload.status),
        JSON.stringify(tags)
      ]
    );
    return rows[0] || null;
  }

  async function listKnowledgeSources(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 120), 300));
    const status = normalizeKnowledgeStatus(options.status, "");
    const category = options.category ? normalizeKnowledgeCategory(options.category) : "";
    const params = [];
    const where = [];
    if (status) {
      params.push(status);
      where.push(`s.status = $${params.length}`);
    }
    if (category) {
      params.push(category);
      where.push(`s.category = $${params.length}`);
    }
    params.push(limit);
    return query(
      `
        SELECT
          s.*,
          COUNT(c.id)::int AS chunks_count,
          COALESCE(SUM(c.usage_count), 0)::bigint AS total_usage
        FROM ai_knowledge_sources s
        LEFT JOIN ai_knowledge_chunks c ON c.source_id = s.id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        GROUP BY s.id
        ORDER BY s.updated_at DESC
        LIMIT $${params.length}
      `,
      params
    );
  }

  async function updateKnowledgeSource(sourceId, payload = {}) {
    const id = Number(sourceId);
    if (!Number.isFinite(id) || id <= 0) return null;
    const tags = "tags" in payload ? normalizeKnowledgeTags(payload.tags) : null;
    const rows = await query(
      `
        UPDATE ai_knowledge_sources
        SET
          title = COALESCE(NULLIF($2, ''), title),
          source_type = COALESCE(NULLIF($3, ''), source_type),
          category = COALESCE(NULLIF($4, ''), category),
          status = COALESCE(NULLIF($5, ''), status),
          source_label = COALESCE(NULLIF($6, ''), source_label),
          url = COALESCE(NULLIF($7, ''), url),
          tags = COALESCE($8::jsonb, tags),
          is_active = COALESCE($9, is_active),
          metadata = CASE WHEN $10::jsonb IS NULL THEN metadata ELSE COALESCE(metadata, '{}'::jsonb) || $10::jsonb END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [
        id,
        String(payload.title || "").trim().slice(0, 255),
        String(payload.source_type || payload.sourceType || "").trim().slice(0, 80),
        payload.category ? normalizeKnowledgeCategory(payload.category) : "",
        payload.status ? normalizeKnowledgeStatus(payload.status) : "",
        String(payload.source || payload.source_label || payload.sourceLabel || "").trim().slice(0, 255),
        String(payload.url || "").trim(),
        tags ? JSON.stringify(tags) : null,
        "is_active" in payload || "isActive" in payload ? normalizeBoolean(payload.is_active || payload.isActive) : null,
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    const source = rows[0] || null;
    if (source && payload.status) {
      await query(
        `
          UPDATE ai_knowledge_chunks
          SET status = $2, updated_at = NOW()
          WHERE source_id = $1
        `,
        [id, normalizeKnowledgeStatus(payload.status)]
      );
    }
    return source;
  }

  function extractSearchTerms(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length >= 3)
      .slice(0, 8);
  }

  async function listKnowledgeChunks(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 8), 20));
    const terms = extractSearchTerms(options.query || options.text || "");
    const params = [];
    const where = [
      "COALESCE(s.is_active, TRUE) = TRUE",
      "COALESCE(s.status, 'draft') = 'approved'",
      "COALESCE(c.status, s.status, 'draft') = 'approved'"
    ];
    let keywordScoreSql = "0";

    if (options.task_type || options.taskType) {
      params.push(String(options.task_type || options.taskType).trim().slice(0, 80));
      where.push(`(c.task_type IS NULL OR c.task_type = $${params.length})`);
    }

    if (terms.length) {
      const scoreParts = [];
      const termClauses = [];
      for (const term of terms) {
        params.push(`%${term}%`);
        const idx = params.length;
        termClauses.push(`(
          LOWER(COALESCE(c.sanitized_content, c.content, '')) LIKE $${idx}
          OR LOWER(COALESCE(c.title, '')) LIKE $${idx}
          OR LOWER(COALESCE(c.category, '')) LIKE $${idx}
          OR LOWER(COALESCE(c.tags::text, '')) LIKE $${idx}
          OR LOWER(COALESCE(s.title, '')) LIKE $${idx}
          OR LOWER(COALESCE(s.source_key, '')) LIKE $${idx}
          OR LOWER(COALESCE(s.source_label, '')) LIKE $${idx}
          OR LOWER(COALESCE(s.category, '')) LIKE $${idx}
          OR LOWER(COALESCE(s.tags::text, '')) LIKE $${idx}
        )`);
        scoreParts.push(`CASE WHEN LOWER(COALESCE(c.sanitized_content, c.content, '')) LIKE $${idx} THEN 8 ELSE 0 END`);
        scoreParts.push(`CASE WHEN LOWER(COALESCE(c.title, '')) LIKE $${idx} THEN 5 ELSE 0 END`);
        scoreParts.push(`CASE WHEN LOWER(COALESCE(c.tags::text, '')) LIKE $${idx} THEN 3 ELSE 0 END`);
        scoreParts.push(`CASE WHEN LOWER(COALESCE(s.tags::text, '')) LIKE $${idx} THEN 3 ELSE 0 END`);
        scoreParts.push(`CASE WHEN LOWER(COALESCE(s.source_key, '')) LIKE $${idx} THEN 2 ELSE 0 END`);
      }
      where.push(`(${termClauses.join(" OR ")})`);
      keywordScoreSql = scoreParts.join(" + ");
    }

    params.push(limit);
    return query(
      `
        SELECT
          c.id,
          c.source_id,
          c.title,
          COALESCE(c.sanitized_content, c.content) AS content,
          c.task_type,
          c.category,
          c.status,
          c.tags,
          c.quality_score,
          c.feedback_score,
          c.usage_count,
          c.created_at,
          c.updated_at,
          s.title AS source_title,
          s.source_key,
          s.source_type,
          s.category AS source_category,
          s.status AS source_status,
          s.source_label,
          s.tags AS source_tags,
          s.url,
          (${keywordScoreSql}) AS keyword_score
        FROM ai_knowledge_chunks c
        LEFT JOIN ai_knowledge_sources s ON s.id = c.source_id
        WHERE ${where.join(" AND ")}
        ORDER BY (${keywordScoreSql}) DESC, c.quality_score DESC, c.feedback_score DESC, c.updated_at DESC
        LIMIT $${params.length}
      `,
      params
    );
  }

  async function recordAiQualityEvent(payload = {}) {
    const rows = await query(
      `
        INSERT INTO ai_quality_events (
          user_id, conversation_id, message_id, task_type, question_type, model_key, provider,
          prompt_key, prompt_version, quality_score, accuracy_score, length_score, speed_score,
          satisfaction_score, cost_score, latency_ms, input_tokens, output_tokens, token_cost,
          xp_cost, user_feedback, was_cached, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23
        )
        RETURNING *
      `,
      [
        payload.user_id || payload.userId ? Number(payload.user_id || payload.userId) : null,
        payload.conversation_id ? String(payload.conversation_id) : null,
        payload.message_id || payload.messageId ? Number(payload.message_id || payload.messageId) : null,
        String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
        String(payload.question_type || payload.questionType || "").trim().slice(0, 80) || null,
        String(payload.model_key || payload.modelKey || "").trim().slice(0, 80) || null,
        String(payload.provider || "").trim().slice(0, 40) || null,
        String(payload.prompt_key || payload.promptKey || "").trim().slice(0, 160) || null,
        String(payload.prompt_version || payload.promptVersion || "").trim().slice(0, 80) || null,
        Math.max(0, Math.min(100, Math.round(Number(payload.quality_score || payload.qualityScore || 0)))),
        Math.max(0, Math.min(100, Math.round(Number(payload.accuracy_score || payload.accuracyScore || 0)))),
        Math.max(0, Math.min(100, Math.round(Number(payload.length_score || payload.lengthScore || 0)))),
        Math.max(0, Math.min(100, Math.round(Number(payload.speed_score || payload.speedScore || 0)))),
        Math.max(0, Math.min(100, Math.round(Number(payload.satisfaction_score || payload.satisfactionScore || 0)))),
        Math.max(0, Math.min(100, Math.round(Number(payload.cost_score || payload.costScore || 0)))),
        Math.max(0, Math.round(Number(payload.latency_ms || payload.latencyMs || 0))),
        Math.max(0, Math.round(Number(payload.input_tokens || payload.inputTokens || 0))),
        Math.max(0, Math.round(Number(payload.output_tokens || payload.outputTokens || 0))),
        Math.max(0, Math.round(Number(payload.token_cost || payload.tokenCost || 0))),
        Math.max(0, Math.round(Number(payload.xp_cost || payload.xpCost || 0))),
        String(payload.user_feedback || payload.userFeedback || "").trim().slice(0, 40) || null,
        normalizeBoolean(payload.was_cached || payload.wasCached),
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    return rows[0] || null;
  }

  async function getAiIntelligenceAnalytics(options = {}) {
    const qualityParams = [];
    const qualityWhere = ["created_at >= NOW() - INTERVAL '30 days'"];
    if (options.model_key || options.modelKey) {
      qualityParams.push(String(options.model_key || options.modelKey).trim().slice(0, 80));
      qualityWhere.push(`model_key = $${qualityParams.length}`);
    }
    if (options.task_type || options.taskType) {
      qualityParams.push(String(options.task_type || options.taskType).trim().slice(0, 80));
      qualityWhere.push(`task_type = $${qualityParams.length}`);
    }
    if (options.from) {
      qualityParams.push(toSqlDateTime(options.from));
      qualityWhere.push(`created_at >= $${qualityParams.length}`);
    }
    if (options.to) {
      qualityParams.push(toSqlDateTime(options.to));
      qualityWhere.push(`created_at <= $${qualityParams.length}`);
    }

    const feedbackParams = [];
    const feedbackWhere = ["f.created_at >= NOW() - INTERVAL '30 days'"];
    if (options.model_key || options.modelKey) {
      feedbackParams.push(String(options.model_key || options.modelKey).trim().slice(0, 80));
      feedbackWhere.push(`f.model_key = $${feedbackParams.length}`);
    }
    if (options.task_type || options.taskType) {
      feedbackParams.push(String(options.task_type || options.taskType).trim().slice(0, 80));
      feedbackWhere.push(`f.task_type = $${feedbackParams.length}`);
    }
    if (options.question_type || options.questionType) {
      feedbackParams.push(String(options.question_type || options.questionType).trim().slice(0, 80));
      feedbackWhere.push(`f.question_type = $${feedbackParams.length}`);
    }
    if (options.plan) {
      feedbackParams.push(`%${String(options.plan).trim().toLowerCase()}%`);
      feedbackWhere.push(`LOWER(CONCAT_WS(' ', u.plan_type, u.package_name)) LIKE $${feedbackParams.length}`);
    }
    if (options.from) {
      feedbackParams.push(toSqlDateTime(options.from));
      feedbackWhere.push(`f.created_at >= $${feedbackParams.length}`);
    }
    if (options.to) {
      feedbackParams.push(toSqlDateTime(options.to));
      feedbackWhere.push(`f.created_at <= $${feedbackParams.length}`);
    }

    const overviewRows = await query(
      `
        SELECT
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::int AS messages_today,
          COALESCE(SUM(input_tokens + output_tokens) FILTER (WHERE created_at >= CURRENT_DATE), 0)::bigint AS tokens_today,
          COALESCE(SUM(token_cost) FILTER (WHERE created_at >= CURRENT_DATE), 0)::bigint AS token_cost_today,
          ROUND(COALESCE(AVG(quality_score), 0))::int AS avg_quality,
          ROUND(COALESCE(AVG(latency_ms), 0))::int AS avg_latency_ms
        FROM ai_quality_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `
    );
    const bestModelRows = await query(`
      SELECT
        COALESCE(model_key, 'unknown') AS model_key,
        COALESCE(provider, 'unknown') AS provider,
        COUNT(*)::int AS requests,
        ROUND(AVG(quality_score))::int AS avg_quality
      FROM ai_quality_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY model_key, provider
      HAVING COUNT(*) > 0
      ORDER BY AVG(quality_score) DESC NULLS LAST, COUNT(*) DESC
      LIMIT 1
    `);
    const mostUsedRows = await query(`
      SELECT
        COALESCE(model_key, 'unknown') AS model_key,
        COALESCE(provider, 'unknown') AS provider,
        COUNT(*)::int AS requests
      FROM ai_quality_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY model_key, provider
      ORDER BY COUNT(*) DESC
      LIMIT 1
    `);
    const dissatisfactionRows = await query(`
      SELECT
        COALESCE(feedback_type, rating, 'unknown') AS reason,
        COUNT(*)::int AS count
      FROM ai_feedback
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND COALESCE(feedback_type, rating, '') IN ('dislike', 'inaccurate', 'too_long', 'too_short', 'code_error', 'not_solved')
      GROUP BY reason
      ORDER BY count DESC
      LIMIT 10
    `);
    const modelRows = await query(
      `
        SELECT
          COALESCE(model_key, 'unknown') AS model_key,
          COALESCE(provider, 'unknown') AS provider,
          COUNT(*)::int AS requests,
          COUNT(*)::int AS events_count,
          ROUND(AVG(quality_score))::int AS avg_quality,
          ROUND(AVG(latency_ms))::int AS avg_speed_ms,
          ROUND(AVG(latency_ms))::int AS avg_latency_ms,
          ROUND(AVG(input_tokens + output_tokens))::int AS avg_tokens,
          ROUND(AVG(token_cost))::int AS avg_cost,
          SUM(input_tokens + output_tokens)::bigint AS total_tokens,
          SUM(token_cost)::bigint AS total_cost,
          SUM(xp_cost)::bigint AS total_xp,
          ROUND(
            100.0 * SUM(CASE WHEN satisfaction_score >= 70 OR user_feedback IN ('like', 'excellent', 'save_worthy', 'solved') THEN 1 ELSE 0 END)
            / NULLIF(COUNT(*), 0)
          )::int AS satisfaction_rate
        FROM ai_quality_events
        WHERE ${qualityWhere.join(" AND ")}
        GROUP BY model_key, provider
        ORDER BY avg_quality DESC NULLS LAST, requests DESC
        LIMIT 30
      `,
      qualityParams
    );
    const feedbackRows = await query(
      `
        SELECT
          COALESCE(f.feedback_type, f.rating, 'unknown') AS reason,
          COALESCE(f.model_key, 'unknown') AS model_key,
          COALESCE(f.provider, 'unknown') AS provider,
          COALESCE(f.task_type, 'unknown') AS task_type,
          COALESCE(f.question_type, 'unknown') AS question_type,
          COALESCE(NULLIF(u.plan_type, ''), NULLIF(u.package_name, ''), 'free') AS plan,
          COUNT(*)::int AS count,
          ROUND(AVG(f.quality_score))::int AS avg_quality
        FROM ai_feedback f
        LEFT JOIN app_users u ON u.id = f.user_id
        WHERE ${feedbackWhere.join(" AND ")}
        GROUP BY reason, model_key, provider, task_type, question_type, plan
        ORDER BY count DESC, avg_quality DESC NULLS LAST
        LIMIT 80
      `,
      feedbackParams
    );
    const taskRows = await query(
      `
        SELECT
          COALESCE(task_type, 'unknown') AS task_type,
          COUNT(*)::int AS count,
          ROUND(AVG(quality_score))::int AS avg_quality
        FROM ai_quality_events
        WHERE ${qualityWhere.join(" AND ")}
        GROUP BY task_type
        ORDER BY count DESC
        LIMIT 30
      `,
      qualityParams
    );
    const knowledgeRows = await query(`
      SELECT
        COUNT(*)::int AS chunks_count,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_chunks_count,
        ROUND(AVG(quality_score))::int AS avg_quality,
        COALESCE(SUM(usage_count), 0)::bigint AS total_usage
      FROM ai_knowledge_chunks
    `);
    const reviewRows = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE COALESCE(review_status, 'pending') = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE COALESCE(review_status, 'pending') = 'approved')::int AS approved,
        COUNT(*) FILTER (WHERE COALESCE(review_status, 'pending') = 'rejected')::int AS rejected
      FROM ai_training_examples
    `);
    const overview = overviewRows[0] || {};
    return {
      overview: {
        messages_today: Number(overview.messages_today || 0),
        tokens_today: Number(overview.tokens_today || 0),
        token_cost_today: Number(overview.token_cost_today || 0),
        best_model: bestModelRows[0] || null,
        most_used_model: mostUsedRows[0] || null,
        avg_quality: Number(overview.avg_quality || 0),
        avg_latency_ms: Number(overview.avg_latency_ms || 0),
        top_dissatisfaction_reason: dissatisfactionRows[0] || null
      },
      model_performance: modelRows,
      feedback_reasons: dissatisfactionRows.length ? dissatisfactionRows : feedbackRows.slice(0, 20),
      feedback_analytics: feedbackRows,
      task_quality: taskRows,
      knowledge_base: knowledgeRows[0] || { chunks_count: 0, approved_chunks_count: 0, avg_quality: 0, total_usage: 0 },
      excellent_answers: reviewRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 }
    };
  }

  async function getAiCostGuardrailStats(options = {}) {
    const since = options.since ? toSqlDateTime(options.since) : new Date(new Date().toISOString().slice(0, 10)).toISOString();
    const planRows = await query(
      `
        SELECT
          COALESCE(NULLIF(metadata->>'plan', ''), 'unknown') AS plan,
          COUNT(*)::int AS requests,
          COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS tokens,
          COALESCE(SUM(
            CASE
              WHEN COALESCE(metadata->>'total_cost_estimate_usd', '') ~ '^[0-9]+(\\.[0-9]+)?$'
                THEN (metadata->>'total_cost_estimate_usd')::numeric
              WHEN COALESCE(metadata->>'total_cost_estimate', '') ~ '^[0-9]+(\\.[0-9]+)?$'
                THEN (metadata->>'total_cost_estimate')::numeric
              ELSE COALESCE(token_cost, 0)::numeric / 1000000.0
            END
          ), 0)::float8 AS cost_usd
        FROM ai_quality_events
        WHERE created_at >= $1
        GROUP BY plan
        ORDER BY cost_usd DESC
      `,
      [since]
    );
    const userRows = await query(
      `
        SELECT
          COALESCE(user_id::text, 'unknown') AS user_id,
          MIN(COALESCE(NULLIF(metadata->>'plan', ''), 'unknown')) AS plan,
          COUNT(*)::int AS requests,
          COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS tokens,
          COALESCE(SUM(
            CASE
              WHEN COALESCE(metadata->>'total_cost_estimate_usd', '') ~ '^[0-9]+(\\.[0-9]+)?$'
                THEN (metadata->>'total_cost_estimate_usd')::numeric
              WHEN COALESCE(metadata->>'total_cost_estimate', '') ~ '^[0-9]+(\\.[0-9]+)?$'
                THEN (metadata->>'total_cost_estimate')::numeric
              ELSE COALESCE(token_cost, 0)::numeric / 1000000.0
            END
          ), 0)::float8 AS cost_usd
        FROM ai_quality_events
        WHERE created_at >= $1
        GROUP BY COALESCE(user_id::text, 'unknown')
        ORDER BY cost_usd DESC
        LIMIT 200
      `,
      [since]
    );
    const overviewRows = await query(
      `
        SELECT
          COUNT(*)::int AS events_today,
          COALESCE(ROUND(AVG(latency_ms)), 0)::int AS avg_latency_ms,
          COALESCE(ROUND(AVG(quality_score)), 0)::int AS avg_quality,
          COALESCE(SUM(
            CASE
              WHEN COALESCE(metadata->>'total_cost_estimate_usd', '') ~ '^[0-9]+(\\.[0-9]+)?$'
                THEN (metadata->>'total_cost_estimate_usd')::numeric
              WHEN COALESCE(metadata->>'total_cost_estimate', '') ~ '^[0-9]+(\\.[0-9]+)?$'
                THEN (metadata->>'total_cost_estimate')::numeric
              ELSE COALESCE(token_cost, 0)::numeric / 1000000.0
            END
          ), 0)::float8 AS site_daily_cost_usd
        FROM ai_quality_events
        WHERE created_at >= $1
      `,
      [since]
    );
    const overview = overviewRows[0] || {};
    return {
      site_daily_cost_usd: Number(overview.site_daily_cost_usd || 0),
      events_today: Number(overview.events_today || 0),
      avg_latency_ms: Number(overview.avg_latency_ms || 0),
      avg_quality: Number(overview.avg_quality || 0),
      by_plan: planRows.map((row) => ({ ...row, cost_usd: Number(row.cost_usd || 0) })),
      by_user: userRows.map((row) => ({ ...row, cost_usd: Number(row.cost_usd || 0) }))
    };
  }

  async function saveToolUsage(payload = {}) {
    const userId = Number(payload.user_id);
    const toolKey = String(payload.tool_key || payload.tool || "").trim().slice(0, 80);
    if (!userId || !toolKey) return null;
    const rows = await query(
      `
        INSERT INTO tool_usage (
          user_id, tool_key, task_type, input_text, output_text, xp_cost, input_tokens, output_tokens, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        userId,
        toolKey,
        String(payload.task_type || payload.taskType || "").trim().slice(0, 80) || null,
        String(payload.input_text || payload.inputText || "").trim() || null,
        String(payload.output_text || payload.outputText || "").trim() || null,
        Math.max(0, Math.round(Number(payload.xp_cost || payload.xpCost || 0) || 0)),
        Math.max(0, Math.round(Number(payload.input_tokens || payload.inputTokens || 0) || 0)),
        Math.max(0, Math.round(Number(payload.output_tokens || payload.outputTokens || 0) || 0)),
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    return rows[0] || null;
  }

  async function recordBusinessEvent(payload = {}) {
    const eventType = String(payload.event_type || payload.eventType || "").trim().slice(0, 80);
    if (!eventType) return null;
    const rows = await query(
      `
        INSERT INTO app_business_events (user_id, event_type, reason, plan, route, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        payload.user_id || payload.userId ? Number(payload.user_id || payload.userId) : null,
        eventType,
        String(payload.reason || "").trim().slice(0, 160) || null,
        String(payload.plan || "").trim().toLowerCase().slice(0, 80) || null,
        String(payload.route || "").trim().slice(0, 180) || null,
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    return rows[0] || null;
  }

  async function recordAbuseEvent(payload = {}) {
    const action = String(payload.action || "observe").trim().slice(0, 80) || "observe";
    const reasons = Array.isArray(payload.reasons)
      ? payload.reasons.map((item) => String(item || "").trim().slice(0, 80)).filter(Boolean).slice(0, 12)
      : [];
    const rows = await query(
      `
        INSERT INTO app_abuse_events (user_id, ip_hash, action, reasons, score, route, prompt_hash, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        payload.user_id || payload.userId ? Number(payload.user_id || payload.userId) : null,
        String(payload.ip_hash || payload.ipHash || "").trim().slice(0, 80) || null,
        action,
        JSON.stringify(reasons),
        Math.max(0, Math.min(100, Math.round(Number(payload.score || 0)))),
        String(payload.route || "").trim().slice(0, 180) || null,
        String(payload.prompt_hash || payload.promptHash || "").trim().slice(0, 80) || null,
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    return rows[0] || null;
  }

  function getCostEstimateSql(alias = "") {
    const prefix = alias ? `${alias}.` : "";
    return `
      CASE
        WHEN COALESCE(${prefix}metadata->>'total_cost_estimate_usd', '') ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (${prefix}metadata->>'total_cost_estimate_usd')::numeric
        WHEN COALESCE(${prefix}metadata->>'total_cost_estimate', '') ~ '^[0-9]+(\\.[0-9]+)?$'
          THEN (${prefix}metadata->>'total_cost_estimate')::numeric
        ELSE COALESCE(${prefix}token_cost, 0)::numeric / 1000000.0
      END
    `;
  }

  async function getBetaBusinessAnalytics(options = {}) {
    const days = Math.max(1, Math.min(Number(options.days || 30), 90));
    const sinceSql = `${days} days`;
    const costSql = getCostEstimateSql("q");

    const conversionRows = await query(
      `
        WITH paid_users AS (
          SELECT DISTINCT user_id
          FROM app_subscriptions
          WHERE status = 'active'
             OR COALESCE(price_sar, 0) > 0
        ),
        user_counts AS (
          SELECT
            COUNT(*) FILTER (
              WHERE id NOT IN (SELECT user_id FROM paid_users)
                AND LOWER(COALESCE(plan_type, 'starter')) IN ('starter', 'free', '')
            )::int AS free_users,
            COUNT(*) FILTER (
              WHERE id IN (SELECT user_id FROM paid_users)
                 OR LOWER(COALESCE(plan_type, '')) ~ '(spark|tuwaiq|pioneer|pro|premium)'
            )::int AS paid_users
          FROM app_users
          WHERE status <> 'banned'
        ),
        active_today AS (
          SELECT COUNT(DISTINCT user_id)::int AS active_users_today
          FROM (
            SELECT user_id FROM app_business_events WHERE created_at >= CURRENT_DATE AND user_id IS NOT NULL
            UNION ALL
            SELECT user_id FROM ai_quality_events WHERE created_at >= CURRENT_DATE AND user_id IS NOT NULL
            UNION ALL
            SELECT id AS user_id FROM app_users WHERE last_active_date = CURRENT_DATE
          ) active
        ),
        message_avg AS (
          SELECT COALESCE(ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_id), 0), 2), 0)::float8 AS avg_messages_per_user
          FROM ai_quality_events
          WHERE created_at >= NOW() - $1::interval
            AND user_id IS NOT NULL
        )
        SELECT *
        FROM user_counts, active_today, message_avg
      `,
      [sinceSql]
    );
    const mostPurchasedRows = await query(
      `
        SELECT COALESCE(package_key, package_name, 'unknown') AS plan, COUNT(*)::int AS purchases, COALESCE(SUM(price_sar), 0)::float8 AS revenue_sar
        FROM app_subscriptions
        WHERE created_at >= NOW() - $1::interval
          AND COALESCE(price_sar, 0) > 0
        GROUP BY plan
        ORDER BY purchases DESC, revenue_sar DESC
        LIMIT 1
      `,
      [sinceSql]
    );
    const stopRows = await query(
      `
        SELECT COALESCE(reason, event_type, 'unknown') AS reason, COALESCE(route, '-') AS route, COUNT(*)::int AS count
        FROM app_business_events
        WHERE created_at >= NOW() - $1::interval
          AND event_type IN ('limit_exceeded', 'upsell_shown', 'safe_mode_block', 'abuse_block', 'rate_limited', 'login_failure')
        GROUP BY reason, route
        ORDER BY count DESC
        LIMIT 5
      `,
      [sinceSql]
    );
    const conversion = conversionRows[0] || {};
    const freeUsers = Number(conversion.free_users || 0);
    const paidUsers = Number(conversion.paid_users || 0);

    const dailyByModel = await query(
      `
        SELECT
          DATE_TRUNC('day', q.created_at)::date AS day,
          COALESCE(q.model_key, 'unknown') AS model_key,
          COALESCE(q.provider, 'unknown') AS provider,
          COUNT(*)::int AS requests,
          COALESCE(SUM(q.input_tokens + q.output_tokens), 0)::bigint AS tokens,
          COALESCE(SUM(${costSql}), 0)::float8 AS cost_usd,
          COALESCE(ROUND(AVG(q.quality_score)), 0)::int AS avg_quality,
          COALESCE(ROUND(AVG(q.latency_ms)), 0)::int AS avg_latency_ms
        FROM ai_quality_events q
        WHERE q.created_at >= NOW() - $1::interval
        GROUP BY day, model_key, provider
        ORDER BY day DESC, cost_usd DESC
        LIMIT 120
      `,
      [sinceSql]
    );
    const costByPlan = await query(
      `
        SELECT
          COALESCE(NULLIF(q.metadata->>'plan', ''), LOWER(COALESCE(u.plan_type, 'unknown'))) AS plan,
          COUNT(*)::int AS requests,
          COALESCE(SUM(q.input_tokens + q.output_tokens), 0)::bigint AS tokens,
          COALESCE(SUM(${costSql}), 0)::float8 AS cost_usd
        FROM ai_quality_events q
        LEFT JOIN app_users u ON u.id = q.user_id
        WHERE q.created_at >= NOW() - $1::interval
        GROUP BY plan
        ORDER BY cost_usd DESC, requests DESC
      `,
      [sinceSql]
    );
    const topUsers = await query(
      `
        SELECT
          COALESCE(q.user_id::text, 'unknown') AS user_id,
          MIN(COALESCE(NULLIF(q.metadata->>'plan', ''), LOWER(COALESCE(u.plan_type, 'unknown')))) AS plan,
          COUNT(*)::int AS requests,
          COALESCE(SUM(q.input_tokens + q.output_tokens), 0)::bigint AS tokens,
          COALESCE(SUM(${costSql}), 0)::float8 AS cost_usd
        FROM ai_quality_events q
        LEFT JOIN app_users u ON u.id = q.user_id
        WHERE q.created_at >= NOW() - $1::interval
        GROUP BY q.user_id
        ORDER BY cost_usd DESC, tokens DESC
        LIMIT 20
      `,
      [sinceSql]
    );
    const costOverviewRows = await query(
      `
        SELECT
          COUNT(*)::int AS messages,
          COUNT(DISTINCT user_id)::int AS users,
          COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS tokens,
          COALESCE(SUM(${costSql}), 0)::float8 AS cost_usd
        FROM ai_quality_events q
        WHERE created_at >= NOW() - $1::interval
      `,
      [sinceSql]
    );
    const costOverview = costOverviewRows[0] || {};
    const imageRows = await query(
      `
        SELECT
          COALESCE(task_type, 'image') AS task_type,
          COUNT(*)::int AS requests,
          COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS tokens,
          COALESCE(SUM(xp_cost), 0)::bigint AS xp_cost
        FROM tool_usage
        WHERE created_at >= NOW() - $1::interval
          AND tool_key = 'image_system'
        GROUP BY task_type
        ORDER BY requests DESC
      `,
      [sinceSql]
    );
    const ragRows = await query(
      `
        SELECT COUNT(*)::int AS requests, COALESCE(SUM(${costSql}), 0)::float8 AS cost_usd, COALESCE(ROUND(AVG(quality_score)), 0)::int AS avg_quality
        FROM ai_quality_events q
        WHERE created_at >= NOW() - $1::interval
          AND COALESCE(q.metadata->>'rag_used', 'false') = 'true'
      `,
      [sinceSql]
    );
    const codeRows = await query(
      `
        SELECT COUNT(*)::int AS requests, COALESCE(SUM(${costSql}), 0)::float8 AS cost_usd, COALESCE(ROUND(AVG(quality_score)), 0)::int AS avg_quality
        FROM ai_quality_events q
        WHERE created_at >= NOW() - $1::interval
          AND (LOWER(COALESCE(task_type, '')) LIKE '%code%' OR LOWER(COALESCE(question_type, '')) LIKE '%code%' OR COALESCE(metadata->'request_analysis'->>'needsCoding', 'false') = 'true')
      `,
      [sinceSql]
    );

    const retentionRows = await query(
      `
        WITH events AS (
          SELECT user_id, created_at FROM app_business_events WHERE created_at >= NOW() - $1::interval AND user_id IS NOT NULL
          UNION ALL
          SELECT user_id, created_at FROM ai_quality_events WHERE created_at >= NOW() - $1::interval AND user_id IS NOT NULL
        ),
        today_users AS (
          SELECT DISTINCT user_id FROM events WHERE created_at >= CURRENT_DATE
        ),
        prior_users AS (
          SELECT DISTINCT user_id FROM events WHERE created_at < CURRENT_DATE
        ),
        session_spans AS (
          SELECT user_id, DATE_TRUNC('day', created_at) AS day, EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60.0 AS minutes
          FROM events
          GROUP BY user_id, day
          HAVING COUNT(*) >= 2
        ),
        peak AS (
          SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS count
          FROM events
          GROUP BY hour
          ORDER BY count DESC
          LIMIT 1
        ),
        safe_return AS (
          SELECT COUNT(DISTINCT later.user_id)::int AS count
          FROM app_business_events first
          JOIN events later ON later.user_id = first.user_id AND later.created_at > first.created_at
          WHERE first.event_type = 'safe_mode_block'
        ),
        limit_return AS (
          SELECT COUNT(DISTINCT later.user_id)::int AS count
          FROM app_business_events first
          JOIN events later ON later.user_id = first.user_id AND later.created_at > first.created_at
          WHERE first.event_type = 'limit_exceeded'
        )
        SELECT
          (SELECT COUNT(*) FROM today_users t INNER JOIN prior_users p USING (user_id))::int AS returning_users,
          COALESCE(ROUND(AVG(minutes), 2), 0)::float8 AS avg_session_duration_minutes,
          (SELECT row_to_json(peak) FROM peak) AS peak_activity_hour,
          (SELECT count FROM safe_return) AS returned_after_safe_mode,
          (SELECT count FROM limit_return) AS returned_after_limit_exceeded
        FROM session_spans
      `,
      [sinceSql]
    );
    const lastSeenRows = await query(
      `
        SELECT bucket, COUNT(*)::int AS users
        FROM (
          SELECT CASE
            WHEN last_active_date >= CURRENT_DATE THEN 'today'
            WHEN last_active_date >= CURRENT_DATE - INTERVAL '7 days' THEN 'last_7_days'
            WHEN last_active_date >= CURRENT_DATE - INTERVAL '30 days' THEN 'last_30_days'
            ELSE 'older'
          END AS bucket
          FROM app_users
        ) x
        GROUP BY bucket
        ORDER BY bucket
      `
    );
    const retention = retentionRows[0] || {};

    const dailyQuality = await query(
      `
        SELECT
          DATE_TRUNC('day', created_at)::date AS day,
          COUNT(*)::int AS requests,
          COALESCE(ROUND(AVG(quality_score)), 0)::int AS avg_quality,
          COALESCE(ROUND(AVG(latency_ms)), 0)::int AS avg_latency_ms
        FROM ai_quality_events
        WHERE created_at >= NOW() - $1::interval
        GROUP BY day
        ORDER BY day DESC
        LIMIT 45
      `,
      [sinceSql]
    );
    const ragVsRows = await query(
      `
        SELECT
          COALESCE(metadata->>'rag_used', 'false') AS rag_used,
          COUNT(*)::int AS requests,
          COALESCE(ROUND(AVG(quality_score)), 0)::int AS avg_quality,
          COALESCE(ROUND(AVG(latency_ms)), 0)::int AS avg_latency_ms
        FROM ai_quality_events
        WHERE created_at >= NOW() - $1::interval
        GROUP BY rag_used
        ORDER BY rag_used DESC
      `,
      [sinceSql]
    );
    const modelDissatisfaction = await query(
      `
        SELECT COALESCE(model_key, 'unknown') AS model_key, COALESCE(provider, 'unknown') AS provider, COALESCE(feedback_type, rating, 'unknown') AS reason, COUNT(*)::int AS count
        FROM ai_feedback
        WHERE created_at >= NOW() - $1::interval
          AND COALESCE(feedback_type, rating, '') IN ('dislike', 'inaccurate', 'too_long', 'too_short', 'code_error', 'not_solved')
        GROUP BY model_key, provider, reason
        ORDER BY count DESC
        LIMIT 30
      `,
      [sinceSql]
    );
    const abuseOverviewRows = await query(
      `
        SELECT COUNT(*)::int AS total_events,
          COUNT(*) FILTER (WHERE action = 'temporary_block')::int AS temporary_blocks,
          COUNT(*) FILTER (WHERE action = 'cooldown')::int AS cooldowns,
          COUNT(*) FILTER (WHERE action = 'shadow_limit')::int AS shadow_limits
        FROM app_abuse_events
        WHERE created_at >= NOW() - $1::interval
      `,
      [sinceSql]
    );
    const abuseByAction = await query(
      `
        SELECT action, COUNT(*)::int AS count, COALESCE(ROUND(AVG(score)), 0)::int AS avg_score
        FROM app_abuse_events
        WHERE created_at >= NOW() - $1::interval
        GROUP BY action
        ORDER BY count DESC
      `,
      [sinceSql]
    );
    const abuseByReason = await query(
      `
        SELECT r.reason, COUNT(*)::int AS count
        FROM app_abuse_events, jsonb_array_elements_text(reasons) AS r(reason)
        WHERE created_at >= NOW() - $1::interval
        GROUP BY r.reason
        ORDER BY count DESC
        LIMIT 20
      `,
      [sinceSql]
    );
    const abuseOverview = abuseOverviewRows[0] || {};

    return {
      window_days: days,
      conversion: {
        free_users: freeUsers,
        paid_users: paidUsers,
        conversion_rate_percent: freeUsers + paidUsers ? Number(((paidUsers * 100) / (freeUsers + paidUsers)).toFixed(2)) : 0,
        most_purchased_plan: mostPurchasedRows[0] || null,
        top_exit_reason: stopRows[0] || null,
        top_stop_point: stopRows[0] ? { route: stopRows[0].route, reason: stopRows[0].reason, count: stopRows[0].count } : null,
        active_users_today: Number(conversion.active_users_today || 0),
        avg_messages_per_user: Number(conversion.avg_messages_per_user || 0)
      },
      cost: {
        daily_by_model: dailyByModel.map((row) => ({ ...row, cost_usd: Number(row.cost_usd || 0) })),
        by_plan: costByPlan.map((row) => ({ ...row, cost_usd: Number(row.cost_usd || 0) })),
        top_users: topUsers.map((row) => ({ ...row, cost_usd: Number(row.cost_usd || 0) })),
        avg_cost_per_message_usd: Number(costOverview.messages || 0) ? Number((Number(costOverview.cost_usd || 0) / Number(costOverview.messages || 1)).toFixed(6)) : 0,
        avg_tokens_per_user: Number(costOverview.users || 0) ? Math.round(Number(costOverview.tokens || 0) / Number(costOverview.users || 1)) : 0,
        images: imageRows,
        rag: ragRows[0] || { requests: 0, cost_usd: 0, avg_quality: 0 },
        code: codeRows[0] || { requests: 0, cost_usd: 0, avg_quality: 0 }
      },
      retention: {
        returning_users: Number(retention.returning_users || 0),
        avg_session_duration_minutes: Number(retention.avg_session_duration_minutes || 0),
        peak_activity_hour: retention.peak_activity_hour || null,
        last_seen: lastSeenRows,
        returned_after_safe_mode: Number(retention.returned_after_safe_mode || 0),
        returned_after_limit_exceeded: Number(retention.returned_after_limit_exceeded || 0)
      },
      quality_trends: {
        daily: dailyQuality,
        rag_vs_non_rag: ragVsRows,
        model_dissatisfaction: modelDissatisfaction
      },
      abuse: {
        total_events: Number(abuseOverview.total_events || 0),
        by_action: abuseByAction,
        by_reason: abuseByReason,
        temporary_blocks: Number(abuseOverview.temporary_blocks || 0),
        cooldowns: Number(abuseOverview.cooldowns || 0),
        shadow_limits: Number(abuseOverview.shadow_limits || 0)
      }
    };
  }

  function buildReferralCodeSeed(userId) {
    const idPart = Math.max(0, Number(userId || 0)).toString(36).toUpperCase().padStart(4, "0");
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `ORX${idPart}${randomPart}`.slice(0, 18);
  }

  async function ensureReferralCodeForUser(userId) {
    const safeUserId = Number(userId);
    if (!safeUserId) return null;
    const existingRows = await query("SELECT referral_code FROM app_users WHERE id = $1 LIMIT 1", [safeUserId]);
    const existing = String(existingRows[0]?.referral_code || "").trim();
    if (existing) return existing;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = buildReferralCodeSeed(safeUserId);
      try {
        const rows = await query(
          "UPDATE app_users SET referral_code = $1, updated_at = NOW() WHERE id = $2 AND referral_code IS NULL RETURNING referral_code",
          [code, safeUserId]
        );
        if (rows[0]?.referral_code) return rows[0].referral_code;
      } catch (error) {
        if (String(error?.code || "") !== "23505") throw error;
      }
    }
    return null;
  }

  async function findUserByReferralCode(referralCode) {
    const code = String(referralCode || "").trim().toUpperCase();
    if (!code) return null;
    const rows = await query(
      `
        SELECT ${getUserSelectClause("u", "p")}
        FROM app_users u
        LEFT JOIN app_packages p ON p.id = u.package_id
        WHERE UPPER(u.referral_code) = $1
        LIMIT 1
      `,
      [code]
    );
    return hydrateUserRow(rows[0] || null);
  }

  async function recordReferralSignup(payload = {}) {
    const code = String(payload.referral_code || payload.referralCode || "").trim().toUpperCase();
    const referredUserId = Number(payload.referred_user_id || payload.referredUserId || payload.user_id || payload.userId);
    if (!code || !referredUserId) return null;
    const referrer = await findUserByReferralCode(code);
    if (!referrer || Number(referrer.id) === referredUserId) return null;

    await ensureReferralCodeForUser(referrer.id);
    await pool.query(
      "UPDATE app_users SET referred_by_user_id = $1, updated_at = NOW() WHERE id = $2 AND referred_by_user_id IS NULL",
      [Number(referrer.id), referredUserId]
    );
    const rows = await query(
      `
        INSERT INTO app_referrals (referrer_user_id, referred_user_id, referral_code, status, metadata)
        VALUES ($1, $2, $3, 'signup', $4)
        ON CONFLICT (referred_user_id) DO UPDATE SET
          referral_code = EXCLUDED.referral_code,
          updated_at = NOW()
        RETURNING *
      `,
      [
        Number(referrer.id),
        referredUserId,
        code,
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    return rows[0] || null;
  }

  async function markReferralConverted(payload = {}) {
    const referredUserId = Number(payload.referred_user_id || payload.referredUserId || payload.user_id || payload.userId);
    const referrerRewardXp = Math.max(0, Math.round(Number(payload.referrer_reward_xp || payload.referrerRewardXp || 120) || 0));
    const referredRewardXp = Math.max(0, Math.round(Number(payload.referred_reward_xp || payload.referredRewardXp || 0) || 0));
    if (!referredUserId || (!referrerRewardXp && !referredRewardXp)) return null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const referralRows = await client.query(
        `
          SELECT *
          FROM app_referrals
          WHERE referred_user_id = $1
            AND status <> 'converted'
          ORDER BY created_at ASC
          LIMIT 1
          FOR UPDATE
        `,
        [referredUserId]
      );
      const referral = referralRows.rows[0];
      if (!referral) {
        await client.query("ROLLBACK");
        return null;
      }

      if (referrerRewardXp > 0) {
        await client.query(
          "UPDATE app_users SET balance = COALESCE(balance, xp, 0) + $1, xp = COALESCE(balance, xp, 0) + $1, total_xp = COALESCE(total_xp, xp, 0) + $1, updated_at = NOW() WHERE id = $2",
          [referrerRewardXp, referral.referrer_user_id]
        );
        await client.query(
          "INSERT INTO xp_ledger (user_id, amount, type, reason) VALUES ($1, $2, 'referral_conversion', $3)",
          [referral.referrer_user_id, referrerRewardXp, "Referral converted to a paid subscription"]
        );
      }

      if (referredRewardXp > 0) {
        await client.query(
          "UPDATE app_users SET balance = COALESCE(balance, xp, 0) + $1, xp = COALESCE(balance, xp, 0) + $1, total_xp = COALESCE(total_xp, xp, 0) + $1, updated_at = NOW() WHERE id = $2",
          [referredRewardXp, referredUserId]
        );
        await client.query(
          "INSERT INTO xp_ledger (user_id, amount, type, reason) VALUES ($1, $2, 'referral_join_bonus', $3)",
          [referredUserId, referredRewardXp, "Referral join bonus after subscription"]
        );
      }

      const updateRows = await client.query(
        `
          UPDATE app_referrals
          SET status = 'converted',
              reward_type = 'xp',
              reward_amount = $1,
              referred_reward_amount = $2,
              converted_at = NOW(),
              metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb,
              updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `,
        [
          referrerRewardXp,
          referredRewardXp,
          JSON.stringify(payload.metadata || {}),
          referral.id
        ]
      );

      await client.query(
        `
          INSERT INTO notifications (title, body, type, badge, icon, target_plan, target_user_id, starts_at, is_active)
          VALUES ($1, $2, 'account', 'Referral', 'gift', 'all', $3, NOW(), TRUE)
          ON CONFLICT (type, title) DO UPDATE SET body = EXCLUDED.body, updated_at = NOW()
        `,
        [
          `Referral reward #${referral.referrer_user_id}-${referral.id}`,
          `Your referral converted. ${referrerRewardXp} XP was added to your balance.`,
          referral.referrer_user_id
        ]
      );

      await client.query("COMMIT");
      return updateRows.rows[0] || null;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async function getReferralStats(userId) {
    const safeUserId = Number(userId);
    if (!safeUserId) return { code: null, total_referrals: 0, conversions: 0, rewards_xp: 0, items: [] };
    const code = await ensureReferralCodeForUser(safeUserId);
    const rows = await query(
      `
        SELECT id, referral_code, status, reward_type, reward_amount, referred_reward_amount, converted_at, created_at, updated_at
        FROM app_referrals
        WHERE referrer_user_id = $1
        ORDER BY created_at DESC
        LIMIT 100
      `,
      [safeUserId]
    );
    return {
      code,
      total_referrals: rows.length,
      conversions: rows.filter((row) => row.status === "converted").length,
      rewards_xp: rows.reduce((total, row) => total + Number(row.reward_amount || 0), 0),
      items: rows
    };
  }

  async function saveKnowledgeSuggestion(payload = {}) {
    const questionHash = String(payload.question_hash || payload.questionHash || "").trim().slice(0, 80);
    const sanitizedQuestion = String(payload.sanitized_question || payload.sanitizedQuestion || "").trim();
    if (!questionHash || !sanitizedQuestion) return null;
    const rows = await query(
      `
        INSERT INTO ai_knowledge_suggestions (
          question_hash, sanitized_question, proposed_title, proposed_category, reason, occurrences, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, 1, 'pending', $6)
        ON CONFLICT (question_hash) DO UPDATE SET
          occurrences = ai_knowledge_suggestions.occurrences + 1,
          sanitized_question = EXCLUDED.sanitized_question,
          proposed_title = EXCLUDED.proposed_title,
          proposed_category = EXCLUDED.proposed_category,
          reason = EXCLUDED.reason,
          metadata = COALESCE(ai_knowledge_suggestions.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
          updated_at = NOW()
        RETURNING *
      `,
      [
        questionHash,
        sanitizedQuestion.slice(0, 4000),
        String(payload.proposed_title || payload.proposedTitle || sanitizedQuestion.slice(0, 120)).trim().slice(0, 255),
        String(payload.proposed_category || payload.proposedCategory || "faq").trim().slice(0, 80) || "faq",
        String(payload.reason || "").trim().slice(0, 160) || null,
        payload.metadata ? JSON.stringify(payload.metadata) : null
      ]
    );
    return rows[0] || null;
  }

  async function getScaleGrowthAnalytics(options = {}) {
    const days = Math.max(1, Math.min(Number(options.days || 30), 90));
    const sinceSql = `${days} days`;
    const referralOverviewRows = await query(
      `
        SELECT
          COUNT(*)::int AS total_referrals,
          COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions,
          COALESCE(SUM(reward_amount), 0)::int AS rewards_xp
        FROM app_referrals
        WHERE created_at >= NOW() - $1::interval
      `,
      [sinceSql]
    );
    const topReferrers = await query(
      `
        SELECT
          referrer_user_id::text AS user_id,
          COUNT(*)::int AS referrals,
          COUNT(*) FILTER (WHERE status = 'converted')::int AS conversions,
          COALESCE(SUM(reward_amount), 0)::int AS rewards_xp
        FROM app_referrals
        WHERE created_at >= NOW() - $1::interval
        GROUP BY referrer_user_id
        ORDER BY conversions DESC, referrals DESC
        LIMIT 20
      `,
      [sinceSql]
    );
    const notificationRows = await query(
      `
        SELECT type, COUNT(*)::int AS sent
        FROM notifications
        WHERE created_at >= NOW() - $1::interval
        GROUP BY type
        ORDER BY sent DESC
        LIMIT 20
      `,
      [sinceSql]
    );
    const knowledgeSuggestions = await query(
      `
        SELECT id, proposed_title, proposed_category, reason, occurrences, status, updated_at
        FROM ai_knowledge_suggestions
        WHERE updated_at >= NOW() - $1::interval OR status = 'pending'
        ORDER BY occurrences DESC, updated_at DESC
        LIMIT 20
      `,
      [sinceSql]
    );
    const reputationRows = await query(
      `
        SELECT
          COUNT(*) FILTER (WHERE shadow_banned = TRUE)::int AS shadow_banned_users,
          COALESCE(ROUND(AVG(trust_score)), 0)::int AS avg_trust_score,
          COALESCE(ROUND(AVG(abuse_score)), 0)::int AS avg_abuse_score,
          COUNT(*) FILTER (WHERE abuse_score >= 70)::int AS high_abuse_users
        FROM app_users
      `
    );
    return {
      window_days: days,
      referrals: {
        ...(referralOverviewRows[0] || { total_referrals: 0, conversions: 0, rewards_xp: 0 }),
        top_referrers: topReferrers
      },
      notifications: {
        by_type: notificationRows
      },
      knowledge_expansion: {
        suggestions: knowledgeSuggestions
      },
      reputation: reputationRows[0] || {
        shadow_banned_users: 0,
        avg_trust_score: 0,
        avg_abuse_score: 0,
        high_abuse_users: 0
      }
    };
  }

  async function recordXpLedger(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const amount = Math.round(Number(payload.amount || 0) || 0);
    const type = String(payload.type || "").trim().toLowerCase().slice(0, 40);
    if (!userId || !type || !amount) return null;
    const rows = await query(
      `
        INSERT INTO xp_ledger (user_id, amount, type, reason, admin_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        userId,
        amount,
        type,
        String(payload.reason || "").trim() || null,
        payload.admin_id || payload.adminId ? Number(payload.admin_id || payload.adminId) : null
      ]
    );
    return rows[0] || null;
  }

  function getNotificationTargetPlansForUser(user = {}) {
    const planValues = new Set(["all"]);
    const rawValues = [
      user.plan_type,
      user.planType,
      user.package_key,
      user.packageKey,
      user.package_name,
      user.package
    ];

    for (const value of rawValues) {
      const normalized = String(value || "").trim().toLowerCase();
      if (normalized) planValues.add(normalized);
    }

    const combined = Array.from(planValues).join(" ");
    if (/starter|free|مجاني|المجانية/.test(combined)) {
      planValues.add("starter");
      planValues.add("free");
    }
    if (/pro\b|spark|شرارة/.test(combined)) {
      planValues.add("pro");
      planValues.add("spark");
    }
    if (/pro_plus|tuwaiq|طويق/.test(combined)) {
      planValues.add("pro_plus");
      planValues.add("tuwaiq");
    }
    if (/pro_max|pioneer|رائد|الرائد/.test(combined)) {
      planValues.add("pro_max");
      planValues.add("pioneer");
    }

    return Array.from(planValues);
  }

  function serializeNotification(row = {}) {
    return {
      id: String(row.id),
      title: String(row.title || "").trim(),
      body: String(row.body || "").trim(),
      type: String(row.type || "").trim(),
      badge: String(row.badge || "").trim(),
      icon: String(row.icon || "").trim(),
      target_plan: String(row.target_plan || "all").trim(),
      target_user_id: row.target_user_id != null ? String(row.target_user_id) : null,
      action_url: String(row.action_url || "").trim() || null,
      starts_at: row.starts_at || null,
      expires_at: row.expires_at || null,
      is_active: row.is_active == null ? true : Boolean(row.is_active),
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
      isRead: Boolean(row.is_read)
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

  function normalizeArabicText(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, " ");
  }

  function suggestionSimilarity(a, b) {
    const wordsA = new Set(normalizeArabicText(a).split(" ").filter(Boolean));
    const wordsB = new Set(normalizeArabicText(b).split(" ").filter(Boolean));
    const union = new Set([...wordsA, ...wordsB]).size;
    if (!union) return 0;
    const intersection = [...wordsA].filter((word) => wordsB.has(word)).length;
    return intersection / union;
  }

  function serializeToolSuggestion(row = {}) {
    const voters = Array.isArray(row.voters)
      ? row.voters
      : (() => {
        try {
          return Array.isArray(row.voters) ? row.voters : JSON.parse(row.voters || "[]");
        } catch (_) {
          return [];
        }
      })();
    return {
      id: String(row.id || ""),
      title: String(row.title || "").trim(),
      normalized_title: String(row.normalized_title || "").trim(),
      category: String(row.category || "").trim(),
      description: String(row.description || "").trim(),
      use_case: String(row.use_case || "").trim(),
      extra_notes: String(row.extra_notes || "").trim(),
      importance: Number(row.importance || 3),
      attachment_name: String(row.attachment_name || "").trim(),
      attachment_data_url: String(row.attachment_data_url || "").trim(),
      status: String(row.status || "pending").trim(),
      votes_count: Number(row.votes_count || 0),
      created_by: row.created_by != null ? String(row.created_by) : null,
      created_by_name: String(row.created_by_name || "").trim(),
      created_by_email: String(row.created_by_email || "").trim(),
      approved_by: row.approved_by != null ? String(row.approved_by) : null,
      approved_by_name: String(row.approved_by_name || "").trim(),
      approved_at: row.approved_at || null,
      implemented_at: row.implemented_at || null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
      voters: voters.filter(Boolean)
    };
  }

  async function submitToolSuggestion(userId, input = {}) {
    const safeUserId = Number(userId);
    if (!safeUserId) throw new Error("User is required");

    const title = String(input.title || "").trim().slice(0, 180);
    const normalizedTitle = normalizeArabicText(title).slice(0, 180);
    const category = String(input.category || "").trim().slice(0, 120);
    const description = String(input.description || "").trim().slice(0, 1800);
    const useCase = String(input.use_case || input.useCase || "").trim().slice(0, 1800);
    const extraNotes = String(input.extra_notes || input.extraNotes || "").trim().slice(0, 1400);
    const importance = Math.max(1, Math.min(5, Math.round(Number(input.importance || 3) || 3)));
    const attachmentName = String(input.attachment_name || input.attachmentName || "").trim().slice(0, 180) || null;
    const attachmentDataUrl = String(input.attachment_data_url || input.attachmentDataUrl || "").trim().slice(0, 7000000) || null;

    const todayRows = await query(
      `
        SELECT COUNT(*) AS count
        FROM tool_suggestions
        WHERE created_by = $1
          AND created_at >= (NOW() AT TIME ZONE 'Asia/Riyadh')::date
      `,
      [safeUserId]
    );
    if (Number(todayRows?.[0]?.count || 0) >= 5) {
      return {
        type: "rate_limited",
        message: "وصلت للحد اليومي من الاقتراحات. حاول غدًا.",
        suggestion: null
      };
    }

    const existingRows = await query(
      `
        SELECT *
        FROM tool_suggestions
        WHERE status IN ('pending', 'reviewing', 'approved')
        ORDER BY votes_count DESC, created_at DESC
        LIMIT 300
      `
    );
    const matched = existingRows.find((suggestion) => (
      suggestionSimilarity(normalizedTitle, suggestion.normalized_title || suggestion.title) >= 0.65
    ));

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (matched) {
        const lockedRows = await client.query(
          "SELECT * FROM tool_suggestions WHERE id = $1 FOR UPDATE",
          [matched.id]
        );
        const locked = lockedRows.rows[0] || matched;
        const voteRows = await client.query(
          `
            INSERT INTO tool_suggestion_votes (suggestion_id, user_id, vote_type)
            VALUES ($1, $2, 'upvote')
            ON CONFLICT (suggestion_id, user_id) DO NOTHING
            RETURNING id
          `,
          [locked.id, safeUserId]
        );
        if (voteRows.rows.length) {
          await client.query(
            "UPDATE tool_suggestions SET votes_count = votes_count + 1, updated_at = NOW() WHERE id = $1",
            [locked.id]
          );
        }
        const finalRows = await client.query("SELECT * FROM tool_suggestions WHERE id = $1", [locked.id]);
        await client.query("COMMIT");
        return {
          type: voteRows.rows.length ? "matched" : "already_voted",
          message: voteRows.rows.length
            ? "وجدنا اقتراحًا مشابهًا، وتم احتساب صوتك عليه بدل إنشاء اقتراح مكرر."
            : "اقتراحك مشابه لاقتراح موجود، وقد تم تسجيل صوتك عليه سابقًا.",
          suggestion: serializeToolSuggestion(finalRows.rows[0] || locked)
        };
      }

      const suggestionRows = await client.query(
        `
          INSERT INTO tool_suggestions (
            title, normalized_title, category, description, use_case,
            extra_notes, importance, attachment_name, attachment_data_url,
            status, votes_count, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 1, $10)
          RETURNING *
        `,
        [
          title,
          normalizedTitle,
          category,
          description,
          useCase,
          extraNotes || null,
          importance,
          attachmentName,
          attachmentDataUrl,
          safeUserId
        ]
      );
      const suggestion = suggestionRows.rows[0];
      await client.query(
        `
          INSERT INTO tool_suggestion_votes (suggestion_id, user_id, vote_type)
          VALUES ($1, $2, 'suggest')
          ON CONFLICT (suggestion_id, user_id) DO NOTHING
        `,
        [suggestion.id, safeUserId]
      );
      await client.query("COMMIT");

      return {
        type: "created",
        message: "تم إرسال اقتراحك بنجاح، شكرًا لمساعدتنا في تطوير Orlixor.",
        suggestion: serializeToolSuggestion(suggestion)
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async function listAdminToolSuggestions(options = {}) {
    const limit = Math.max(1, Math.min(300, Math.round(Number(options.limit || 120) || 120)));
    const status = String(options.status || "").trim();
    const statusSql = status ? "WHERE s.status = $2" : "";
    const params = status ? [limit, status] : [limit];
    const rows = await query(
      `
        SELECT
          s.*,
          creator.name AS created_by_name,
          creator.email AS created_by_email,
          approver.name AS approved_by_name,
          COALESCE(
            json_agg(
              json_build_object(
                'user_id', v.user_id,
                'vote_type', v.vote_type,
                'created_at', v.created_at,
                'name', voter.name,
                'email', voter.email
              )
              ORDER BY v.created_at DESC
            ) FILTER (WHERE v.id IS NOT NULL),
            '[]'::json
          ) AS voters
        FROM tool_suggestions s
        LEFT JOIN app_users creator ON creator.id = s.created_by
        LEFT JOIN app_users approver ON approver.id = s.approved_by
        LEFT JOIN tool_suggestion_votes v ON v.suggestion_id = s.id
        LEFT JOIN app_users voter ON voter.id = v.user_id
        ${statusSql}
        GROUP BY s.id, creator.name, creator.email, approver.name
        ORDER BY
          CASE s.status
            WHEN 'pending' THEN 1
            WHEN 'reviewing' THEN 2
            WHEN 'approved' THEN 3
            WHEN 'implemented' THEN 4
            WHEN 'rejected' THEN 5
            ELSE 6
          END,
          s.votes_count DESC,
          s.created_at DESC
        LIMIT $1
      `,
      params
    );
    return rows.map(serializeToolSuggestion);
  }

  async function updateToolSuggestionStatus(payload = {}) {
    const id = Number(payload.suggestion_id || payload.suggestionId || payload.id);
    const adminId = payload.admin_id || payload.adminId ? Number(payload.admin_id || payload.adminId) : null;
    const status = String(payload.status || "").trim().toLowerCase();
    if (!id || !["pending", "reviewing", "approved", "rejected"].includes(status)) return null;

    const rows = await query(
      `
        UPDATE tool_suggestions
        SET status = $1,
            approved_by = CASE WHEN $1 = 'approved' THEN $2 ELSE approved_by END,
            approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE approved_at END,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `,
      [status, adminId, id]
    );
    return rows[0] ? serializeToolSuggestion(rows[0]) : null;
  }

  async function markToolSuggestionImplemented(payload = {}) {
    const suggestionId = Number(payload.suggestion_id || payload.suggestionId || payload.id);
    const adminId = payload.admin_id || payload.adminId ? Number(payload.admin_id || payload.adminId) : null;
    if (!suggestionId) return null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const suggestionRows = await client.query(
        `
          UPDATE tool_suggestions
          SET status = 'implemented',
              implemented_at = COALESCE(implemented_at, NOW()),
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [suggestionId]
      );
      const suggestion = suggestionRows.rows[0];
      if (!suggestion) {
        await client.query("COMMIT");
        return null;
      }

      const votesRows = await client.query(
        "SELECT user_id FROM tool_suggestion_votes WHERE suggestion_id = $1 ORDER BY created_at ASC",
        [suggestionId]
      );
      let rewardedUsers = 0;
      for (const vote of votesRows.rows) {
        const userId = Number(vote.user_id);
        if (!userId) continue;
        const rewardRows = await client.query(
          `
            INSERT INTO tool_suggestion_rewards (suggestion_id, user_id, xp_amount, reason)
            VALUES ($1, $2, 50, 'implemented_tool_suggestion')
            ON CONFLICT (suggestion_id, user_id) DO NOTHING
            RETURNING id
          `,
          [suggestionId, userId]
        );
        if (!rewardRows.rows.length) continue;
        rewardedUsers += 1;
        await client.query(
          "UPDATE app_users SET balance = COALESCE(balance, xp, 0) + 50, xp = COALESCE(balance, xp, 0) + 50, total_xp = COALESCE(balance, xp, 0) + 50, updated_at = NOW() WHERE id = $1",
          [userId]
        );
        await client.query(
          `
            INSERT INTO xp_ledger (user_id, amount, type, reason, admin_id)
            VALUES ($1, 50, 'tool_suggestion_reward', $2, $3)
          `,
          [userId, `مكافأة اقتراح أداة تم تنفيذها: ${suggestion.title}`, adminId]
        );
        await client.query(
          `
            INSERT INTO notifications (title, body, type, badge, icon, target_plan, target_user_id, starts_at, is_active)
            VALUES ($1, $2, 'account', 'مكافأة', 'gift', 'all', $3, NOW(), TRUE)
            ON CONFLICT (type, title) DO UPDATE SET
              body = EXCLUDED.body,
              target_user_id = EXCLUDED.target_user_id,
              updated_at = NOW()
          `,
          [
            `تم تنفيذ اقتراحك: ${suggestion.title} #${userId}`.slice(0, 180),
            `تم تنفيذ الأداة المقترحة "${suggestion.title}" وتمت إضافة 50 XP إلى رصيدك.`,
            userId
          ]
        );
      }
      await client.query(
        `
          INSERT INTO admin_logs (admin_id, action, target_type, target_id, details_json)
          VALUES ($1, 'IMPLEMENT_TOOL_SUGGESTION', 'tool_suggestion', $2, $3::jsonb)
        `,
        [adminId, String(suggestionId), JSON.stringify({ rewardedUsers, xpPerUser: 50 })]
      );
      await client.query("COMMIT");
      return {
        suggestion: serializeToolSuggestion(suggestion),
        rewardedUsers,
        xpPerUser: 50
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async function listNotificationsForUser(user, options = {}) {
    const userId = Number(user?.id || options.userId);
    if (!userId) {
      return {
        unreadCount: 0,
        sections: groupNotifications([]),
        items: []
      };
    }

    const targetPlans = getNotificationTargetPlansForUser(user);
    const limit = Math.max(1, Math.min(80, Math.round(Number(options.limit || 20) || 20)));
    const unreadOnly = Boolean(options.unreadOnly);
    const unreadSql = unreadOnly ? "AND r.id IS NULL" : "";

    const rows = await query(
      `
        SELECT n.*, (r.id IS NOT NULL) AS is_read
        FROM notifications n
        LEFT JOIN notification_reads r
          ON r.notification_id = n.id
         AND r.user_id = $1
        WHERE n.is_active = TRUE
          AND n.starts_at <= NOW()
          AND (n.expires_at IS NULL OR n.expires_at > NOW())
          AND (n.target_plan = ANY($2::text[]) OR n.target_user_id = $1)
          ${unreadSql}
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT $3
      `,
      [userId, targetPlans, limit]
    );

    const items = rows.map(serializeNotification);
    const unreadCount = items.filter((item) => !item.isRead).length;

    return {
      unreadCount,
      sections: groupNotifications(items),
      items
    };
  }

  async function markNotificationAsRead(userId, notificationId) {
    const safeUserId = Number(userId);
    const safeNotificationId = Number(notificationId);
    if (!safeUserId || !safeNotificationId) return null;

    const rows = await query(
      `
        INSERT INTO notification_reads (notification_id, user_id, read_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (notification_id, user_id) DO UPDATE SET
          read_at = EXCLUDED.read_at
        RETURNING *
      `,
      [safeNotificationId, safeUserId]
    );

    return rows[0] || null;
  }

  async function markAllNotificationsAsRead(user) {
    const userId = Number(user?.id);
    if (!userId) return { markedCount: 0 };

    const notifications = await listNotificationsForUser(user, { limit: 80 });
    let markedCount = 0;
    for (const notification of notifications.items) {
      if (notification.isRead) continue;
      await markNotificationAsRead(userId, notification.id);
      markedCount += 1;
    }
    return { markedCount };
  }

  async function listAdminNotifications(options = {}) {
    const limit = Math.max(1, Math.min(200, Math.round(Number(options.limit || 80) || 80)));
    const includeInactive = options.includeInactive !== false;
    const activeSql = includeInactive ? "" : "WHERE is_active = TRUE";
    const rows = await query(
      `
        SELECT *
        FROM notifications
        ${activeSql}
        ORDER BY created_at DESC, id DESC
        LIMIT $1
      `,
      [limit]
    );

    return rows.map((row) => ({
      ...serializeNotification(row),
      isRead: false
    }));
  }

  async function createNotification(payload = {}) {
    const startsAt = payload.starts_at || payload.startsAt || null;
    const expiresAt = payload.expires_at || payload.expiresAt || null;
    const rows = await query(
      `
        INSERT INTO notifications (
          title, body, type, badge, icon, target_plan, target_user_id,
          action_url, starts_at, expires_at, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, NOW()), $10::timestamptz, $11)
        ON CONFLICT (type, title) DO UPDATE SET
          body = EXCLUDED.body,
          badge = EXCLUDED.badge,
          icon = EXCLUDED.icon,
          target_plan = EXCLUDED.target_plan,
          target_user_id = EXCLUDED.target_user_id,
          action_url = EXCLUDED.action_url,
          starts_at = EXCLUDED.starts_at,
          expires_at = EXCLUDED.expires_at,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
        RETURNING *
      `,
      [
        String(payload.title || "").trim().slice(0, 180),
        String(payload.body || "").trim(),
        String(payload.type || "official_update").trim().slice(0, 40),
        String(payload.badge || "").trim().slice(0, 80) || null,
        String(payload.icon || "").trim().slice(0, 40) || null,
        String(payload.target_plan || payload.targetPlan || "all").trim().slice(0, 80) || "all",
        payload.target_user_id || payload.targetUserId ? Number(payload.target_user_id || payload.targetUserId) : null,
        String(payload.action_url || payload.actionUrl || "").trim() || null,
        startsAt,
        expiresAt || null,
        payload.is_active == null ? true : Boolean(payload.is_active)
      ]
    );

    return rows[0] ? serializeNotification(rows[0]) : null;
  }

  async function updateNotification(notificationId, changes = {}) {
    const id = Number(notificationId);
    if (!id) return null;

    const allowed = {
      title: "title",
      body: "body",
      type: "type",
      badge: "badge",
      icon: "icon",
      target_plan: "target_plan",
      target_user_id: "target_user_id",
      action_url: "action_url",
      starts_at: "starts_at",
      expires_at: "expires_at",
      is_active: "is_active"
    };
    const values = [];
    const setters = [];

    Object.entries(allowed).forEach(([key, column]) => {
      if (!(key in changes)) return;
      values.push(changes[key]);
      setters.push(`${column} = $${values.length}`);
    });

    if (!setters.length) {
      const rows = await query("SELECT * FROM notifications WHERE id = $1 LIMIT 1", [id]);
      return rows[0] ? serializeNotification(rows[0]) : null;
    }

    values.push(id);
    const rows = await query(
      `
        UPDATE notifications
        SET ${setters.join(", ")}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING *
      `,
      values
    );
    return rows[0] ? serializeNotification(rows[0]) : null;
  }

  async function recordAdminLog(payload = {}) {
    const action = String(payload.action || "").trim().slice(0, 80);
    if (!action) return null;
    const rows = await query(
      `
        INSERT INTO admin_logs (admin_id, action, target_type, target_id, details_json, ip_address)
        VALUES ($1, $2, $3, $4, $5::jsonb, $6)
        RETURNING *
      `,
      [
        payload.admin_id || payload.adminId ? Number(payload.admin_id || payload.adminId) : null,
        action,
        String(payload.target_type || payload.targetType || "").trim().slice(0, 80) || null,
        payload.target_id || payload.targetId ? String(payload.target_id || payload.targetId).slice(0, 120) : null,
        payload.details_json || payload.details || payload.detailsJson ? JSON.stringify(payload.details_json || payload.details || payload.detailsJson) : null,
        String(payload.ip_address || payload.ipAddress || "").trim().slice(0, 80) || null
      ]
    );
    return rows[0] || null;
  }

  async function grantDailyXpIfNeeded(userId, options = {}) {
    const safeUserId = Number(userId);
    if (!safeUserId) return null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `
          SELECT ${getUserSelectClause("u", "p")}
          FROM app_users u
          LEFT JOIN app_packages p ON p.id = u.package_id
          WHERE u.id = $1
          LIMIT 1
          FOR UPDATE OF u
        `,
        [safeUserId]
      );
      const user = hydrateUserRow(userResult.rows[0] || null);
      if (!user) {
        throw new Error("User not found");
      }

      const now = new Date();
      const today = getTodayDateStamp();
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

      const changes = {};
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

        Object.assign(changes, {
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
          activity: activity || `Daily XP grant: +${dailyXpAward} XP`
        });

        if (shouldGrantDaily) {
          changes.last_daily_xp_claimed_date = today;
          changes.last_daily_xp_granted_at = now.toISOString();
          changes.last_daily_reward_at = now.toISOString();
          changes.last_daily_reward_claimed_at = now.toISOString();
        } else if (rewardState.correctedLastClaimedAt) {
          changes.last_daily_xp_granted_at = rewardState.correctedLastClaimedAt;
          changes.last_daily_reward_at = rewardState.correctedLastClaimedAt;
          changes.last_daily_reward_claimed_at = rewardState.correctedLastClaimedAt;
        }
      } else if (activity) {
        changes.last_active_date = today;
        changes.activity = activity;
      }

      const mappings = {
        balance: "balance",
        xp: "xp",
        total_xp: "total_xp",
        daily_reward_amount: "daily_reward_amount",
        plan_type: "plan_type",
        streak_days: "streak_days",
        motivation_score: "motivation_score",
        last_active_date: "last_active_date",
        last_reset: "last_reset",
        last_daily_reward_claimed_at: "last_daily_reward_claimed_at",
        last_daily_reward_at: "last_daily_reward_at",
        last_daily_xp_claimed_date: "last_daily_xp_claimed_date",
        last_daily_xp_granted_at: "last_daily_xp_granted_at",
        signup_bonus_claimed: "signup_bonus_claimed",
        achievements: "achievements",
        activity: "activity"
      };
      const { sets, values } = buildAssignments(changes, mappings);
      if (sets.length) {
        await client.query(
          `UPDATE app_users SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1}`,
          [...values, safeUserId]
        );
      }

      for (const entry of ledgerEntries) {
        await client.query(
          `
            INSERT INTO xp_ledger (user_id, amount, type, reason, admin_id)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [safeUserId, entry.amount, entry.type, entry.reason, null]
        );
      }

      const finalResult = await client.query(
        `
          SELECT ${getUserSelectClause("u", "p")}
          FROM app_users u
          LEFT JOIN app_packages p ON p.id = u.package_id
          WHERE u.id = $1
          LIMIT 1
        `,
        [safeUserId]
      );
      await client.query("COMMIT");
      return hydrateUserRow(finalResult.rows[0] || null);
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {
        // Ignore rollback failures; the original error is more useful.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async function claimDailyReward(userId, options = {}) {
    const safeUserId = Number(userId);
    if (!safeUserId) return null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `
          SELECT ${getUserSelectClause("u", "p")}
          FROM app_users u
          LEFT JOIN app_packages p ON p.id = u.package_id
          WHERE u.id = $1
          LIMIT 1
          FOR UPDATE OF u
        `,
        [safeUserId]
      );
      const user = hydrateUserRow(userResult.rows[0] || null);
      if (!user) {
        await client.query("COMMIT");
        return null;
      }

      const now = options.now instanceof Date ? options.now : new Date();
      const rewardState = getDailyRewardState(
        user.last_daily_reward_claimed_at || user.lastDailyRewardClaimedAt || null,
        now,
        options.intervalMs || DAILY_REWARD_INTERVAL_MS
      );

      if (!rewardState.canClaim) {
        if (rewardState.correctedLastClaimedAt) {
          await client.query(
            `
              UPDATE app_users
              SET last_daily_reward_claimed_at = $1,
                  last_daily_reward_at = $1,
                  last_daily_xp_granted_at = $1,
                  updated_at = NOW()
              WHERE id = $2
            `,
            [rewardState.correctedLastClaimedAt, safeUserId]
          );
        }

        const finalResult = await client.query(
          `
            SELECT ${getUserSelectClause("u", "p")}
            FROM app_users u
            LEFT JOIN app_packages p ON p.id = u.package_id
            WHERE u.id = $1
            LIMIT 1
          `,
          [safeUserId]
        );
        await client.query("COMMIT");
        const finalUser = hydrateUserRow(finalResult.rows[0] || null) || user;
        return {
          user: finalUser,
          claimed: false,
          added: 0,
          balance: Math.max(0, Number(finalUser.balance ?? finalUser.xp ?? 0) || 0)
        };
      }

      const rewardAmount = Math.max(0, Math.round(Number(options.rewardAmount || 0) || 0));
      const currentBalance = Math.max(0, Number(user.balance ?? user.xp ?? 0) || 0);
      const nextBalance = currentBalance + rewardAmount;
      const nowIso = now.toISOString();

      await client.query(
        `
          UPDATE app_users
          SET balance = $1,
              xp = $1,
              total_xp = $1,
              daily_reward_amount = $2,
              last_daily_reward_claimed_at = $3,
              last_daily_reward_at = $3,
              last_daily_xp_granted_at = $3,
              last_daily_xp_claimed_date = $4,
              updated_at = NOW()
          WHERE id = $5
        `,
        [nextBalance, rewardAmount, nowIso, nowIso.slice(0, 10), safeUserId]
      );

      if (rewardAmount > 0 && options.recordLedger !== false) {
        await client.query(
          `
            INSERT INTO xp_ledger (user_id, amount, type, reason, admin_id)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [
            safeUserId,
            rewardAmount,
            "daily_grant",
            String(options.reason || "Daily reward claim").trim(),
            null
          ]
        );
      }

      const finalResult = await client.query(
        `
          SELECT ${getUserSelectClause("u", "p")}
          FROM app_users u
          LEFT JOIN app_packages p ON p.id = u.package_id
          WHERE u.id = $1
          LIMIT 1
        `,
        [safeUserId]
      );
      await client.query("COMMIT");
      const finalUser = hydrateUserRow(finalResult.rows[0] || null) || {
        ...user,
        balance: nextBalance,
        xp: nextBalance,
        total_xp: nextBalance,
        daily_reward_amount: rewardAmount,
        last_daily_reward_claimed_at: nowIso,
        last_daily_reward_at: nowIso,
        last_daily_xp_granted_at: nowIso,
        last_daily_xp_claimed_date: nowIso.slice(0, 10)
      };

      return {
        user: finalUser,
        claimed: true,
        added: rewardAmount,
        balance: nextBalance
      };
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {
        // Ignore rollback failures; the original error is more useful.
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async function findPackageById(packageId) {
    const rows = await query("SELECT * FROM app_packages WHERE id = $1 LIMIT 1", [Number(packageId)]);
    return normalizePackageRow(rows[0] || null);
  }

  async function findDefaultPackage() {
    const rows = await query(
      `
        SELECT *
        FROM app_packages
        WHERE is_default = TRUE
        ORDER BY sort_order ASC, id ASC
        LIMIT 1
      `
    );
    return normalizePackageRow(rows[0] || null);
  }

  async function findPackageByKeyOrName(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized) return null;

    const aliasMap = {
      "مجاني محدود": "starter",
      "الباقة المجانية": "starter",
      "المجانية": "starter",
      free: "starter",
      starter: "starter",
      "نانو": "pro",
      nano: "pro",
      "شرارة": "pro",
      spark: "pro",
      pro: "pro",
      "بلس": "pro_plus",
      "طويق": "pro_plus",
      tuwaiq: "pro_plus",
      plus: "pro_plus",
      "برو بلس": "pro_plus",
      "pro plus": "pro_plus",
      pro_plus: "pro_plus",
      "برو": "pro_max",
      "الرائد": "pro_max",
      pioneer: "pro_max",
      "برو ماكس": "pro_max",
      "pro max": "pro_max",
      pro_max: "pro_max"
    };

    const packageKey = aliasMap[normalized] || normalized;
    const rows = await query(
      `
        SELECT *
        FROM app_packages
        WHERE LOWER(package_key) = $1
           OR LOWER(display_name) = $2
        LIMIT 1
      `,
      [packageKey, normalized]
    );
    return normalizePackageRow(rows[0] || null);
  }

  async function resolvePackageSelection(payload = {}) {
    if (payload.package_id != null && String(payload.package_id).trim()) {
      const selectedById = await findPackageById(payload.package_id);
      if (selectedById) return selectedById;
    }

    const packageLabel = payload.package_key || payload.package_name || payload.package || "";
    if (String(packageLabel).trim()) {
      const selectedByLabel = await findPackageByKeyOrName(packageLabel);
      if (selectedByLabel) return selectedByLabel;
    }

    if (String(payload.role || "").trim().toLowerCase() === "student") {
      return findDefaultPackage();
    }

    return null;
  }

  function buildPackageAssignmentWindow(selectedPackage) {
    const durationDays = Math.max(0, Number(selectedPackage?.duration_days || 0));
    if (!durationDays) {
      return {
        package_started_at: null,
        package_expires_at: null
      };
    }

    const startDate = new Date();
    const expireDate = new Date(startDate.getTime() + (durationDays * 86400000));
    return {
      package_started_at: toSqlDateTime(startDate),
      package_expires_at: toSqlDateTime(expireDate)
    };
  }

  async function recordSubscriptionForUser(userId, selectedPackage, period = {}) {
    if (!userId || !selectedPackage) return;

    await pool.query(
      "UPDATE app_subscriptions SET status = 'replaced', updated_at = NOW() WHERE user_id = $1 AND status = 'active'",
      [Number(userId)]
    );

    await pool.query(
      `
        INSERT INTO app_subscriptions (
          user_id, package_id, package_key, package_name, daily_xp, price_sar, duration_days, status, started_at, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        Number(userId),
        selectedPackage.id || null,
        String(selectedPackage.package_key || "starter").trim() || "starter",
        String(selectedPackage.display_name || selectedPackage.package_name || "المجانية").trim(),
        Number(selectedPackage.daily_xp || 0),
        Number(selectedPackage.price_sar || 0),
        Number(selectedPackage.duration_days || 0),
        Number(selectedPackage.duration_days || 0) > 0 ? "active" : "free",
        toSqlDateTime(period.package_started_at),
        toSqlDateTime(period.package_expires_at)
      ]
    );
  }

  async function listPackages(options = {}) {
    const includeInactive = Boolean(options.include_inactive);
    const rows = await query(
      `
        SELECT *
        FROM app_packages
        ${includeInactive ? "" : "WHERE is_active = TRUE"}
        ORDER BY sort_order ASC, daily_xp ASC, id ASC
      `
    );
    return rows.map(normalizePackageRow);
  }

  async function updatePackage(packageId, changes = {}) {
    const current = await findPackageById(packageId);
    if (!current) return null;

    const mappings = {
      package_key: "package_key",
      display_name: "display_name",
      daily_xp: "daily_xp",
      price_sar: "price_sar",
      duration_days: "duration_days",
      summary: "summary",
      benefits: "benefits",
      is_active: "is_active",
      is_default: "is_default",
      sort_order: "sort_order"
    };
    const { sets, values } = buildAssignments(changes, mappings);
    if (!sets.length) return current;

    await pool.query(
      `UPDATE app_packages SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1}`,
      [...values, Number(packageId)]
    );

    if (changes.is_default) {
      await pool.query("UPDATE app_packages SET is_default = FALSE, updated_at = NOW() WHERE id <> $1", [Number(packageId)]);
      await pool.query("UPDATE app_packages SET is_default = TRUE, updated_at = NOW() WHERE id = $1", [Number(packageId)]);
    }

    return findPackageById(packageId);
  }

  async function createPackage(payload = {}) {
    const packageKey = String(payload.package_key || payload.key || "").trim().toLowerCase().replace(/\s+/g, "_");
    const displayName = String(payload.display_name || payload.name || "").trim();
    if (!packageKey || !displayName) return null;
    const rows = await query(
      `
        INSERT INTO app_packages (
          package_key, display_name, daily_xp, price_sar, duration_days, summary, benefits, is_active, is_default, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9)
        RETURNING id
      `,
      [
        packageKey,
        displayName,
        Math.max(0, Math.round(Number(payload.daily_xp || payload.dailyXp || 0) || 0)),
        Math.max(0, Number(payload.price_sar || payload.priceSar || payload.monthly_price || 0) || 0),
        Math.max(0, Math.round(Number(payload.duration_days || payload.durationDays || 30) || 30)),
        String(payload.summary || "").trim() || null,
        serializeBenefits(payload.benefits || payload.features || []),
        "is_active" in payload ? normalizeBoolean(payload.is_active) : true,
        Math.max(0, Math.round(Number(payload.sort_order || payload.sortOrder || 99) || 99))
      ]
    );
    return findPackageById(rows[0].id);
  }

  async function listSubscriptions(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 80), 250));
    const status = String(options.status || "").trim().toLowerCase();
    const params = [];
    const where = [];
    if (status) {
      params.push(status);
      where.push(`s.status = $${params.length}`);
    }
    params.push(limit);
    const rows = await query(
      `
        SELECT
          s.*,
          u.name AS user_name,
          u.email AS user_email,
          u.xp AS user_xp
        FROM app_subscriptions s
        LEFT JOIN app_users u ON u.id = s.user_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY COALESCE(s.expires_at, s.created_at) DESC, s.id DESC
        LIMIT $${params.length}
      `,
      params
    );
    return rows;
  }

  async function assignPackageToUser(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const selectedPackage = payload.package_id
      ? await findPackageById(payload.package_id)
      : await findPackageByKeyOrName(payload.package_key || payload.planKey || payload.package || "");
    if (!userId || !selectedPackage) return null;

    const startDate = new Date();
    const explicitExpiresAt = payload.expires_at || payload.expiresAt ? new Date(payload.expires_at || payload.expiresAt) : null;
    const expiresAt = explicitExpiresAt && !Number.isNaN(explicitExpiresAt.getTime())
      ? explicitExpiresAt
      : new Date(startDate.getTime() + (Math.max(1, Math.round(Number(payload.duration_days || payload.durationDays || selectedPackage.duration_days || 30) || 30)) * 86400000));
    const durationDays = Math.max(1, Math.ceil((expiresAt.getTime() - startDate.getTime()) / 86400000));

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("UPDATE app_users SET package_id = $1, package_name = $2, plan_type = $3, package_started_at = $4, package_expires_at = $5, updated_at = NOW() WHERE id = $6", [
        selectedPackage.id,
        selectedPackage.display_name,
        selectedPackage.package_key,
        toSqlDateTime(startDate),
        toSqlDateTime(expiresAt),
        userId
      ]);
      await client.query("UPDATE app_subscriptions SET status = 'replaced', updated_at = NOW() WHERE user_id = $1 AND status = 'active'", [userId]);
      await client.query(
        `
          INSERT INTO app_subscriptions (
            user_id, package_id, package_key, package_name, daily_xp, price_sar, duration_days, status, started_at, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9)
        `,
        [
          userId,
          selectedPackage.id,
          selectedPackage.package_key,
          selectedPackage.display_name,
          Number(selectedPackage.daily_xp || 0),
          Number(selectedPackage.price_sar || 0),
          durationDays,
          toSqlDateTime(startDate),
          toSqlDateTime(expiresAt)
        ]
      );
      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}
      throw error;
    } finally {
      client.release();
    }

    return findUserById(userId);
  }

  async function adjustUserXpByAdmin(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const adminId = payload.admin_id || payload.adminId ? Number(payload.admin_id || payload.adminId) : null;
    const amount = Math.round(Number(payload.amount || 0) || 0);
    const type = String(payload.type || (amount >= 0 ? "admin_add" : "admin_remove")).trim().toLowerCase();
    const reason = String(payload.reason || "").trim() || "Admin XP adjustment";
    if (!userId || !amount) return null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const userResult = await client.query("SELECT * FROM app_users WHERE id = $1 FOR UPDATE", [userId]);
      const user = userResult.rows[0] || null;
      if (!user) throw new Error("User not found");
      const nextXp = Math.max(0, Number(user.balance ?? user.xp ?? 0) + amount);
      await client.query("UPDATE app_users SET balance = $1, xp = $1, total_xp = $1, activity = $2, updated_at = NOW() WHERE id = $3", [
        nextXp,
        reason.slice(0, 255),
        userId
      ]);
      await client.query(
        "INSERT INTO xp_ledger (user_id, amount, type, reason, admin_id) VALUES ($1, $2, $3, $4, $5)",
        [userId, amount, type, reason, adminId]
      );
      await client.query(
        "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details_json, ip_address) VALUES ($1, $2, 'user', $3, $4::jsonb, $5)",
        [
          adminId,
          amount >= 0 ? "ADMIN_ADD_XP" : "ADMIN_REMOVE_XP",
          String(userId),
          JSON.stringify({ amount, reason }),
          String(payload.ip_address || payload.ipAddress || "").slice(0, 80) || null
        ]
      );
      await client.query("COMMIT");
      return findUserById(userId);
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (_) {}
      throw error;
    } finally {
      client.release();
    }
  }

  async function listXpLedger(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 100), 500));
    const userId = options.user_id || options.userId ? Number(options.user_id || options.userId) : null;
    const params = [];
    const where = [];
    if (userId) {
      params.push(userId);
      where.push(`x.user_id = $${params.length}`);
    }
    params.push(limit);
    const rows = await query(
      `
        SELECT
          x.*,
          u.name AS user_name,
          u.email AS user_email,
          a.name AS admin_name,
          a.email AS admin_email
        FROM xp_ledger x
        LEFT JOIN app_users u ON u.id = x.user_id
        LEFT JOIN app_users a ON a.id = x.admin_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY x.created_at DESC, x.id DESC
        LIMIT $${params.length}
      `,
      params
    );
    return rows;
  }

  async function listAdminLogs(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 100), 500));
    const rows = await query(
      `
        SELECT
          l.*,
          a.name AS admin_name,
          a.email AS admin_email
        FROM admin_logs l
        LEFT JOIN app_users a ON a.id = l.admin_id
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT $1
      `,
      [limit]
    );
    return rows;
  }

  async function findUserByEmail(email) {
    const rows = await query(
      `
        SELECT ${getUserSelectClause("u", "p")}
        FROM app_users u
        LEFT JOIN app_packages p ON p.id = u.package_id
        WHERE u.email = $1
        LIMIT 1
      `,
      [String(email || "").trim().toLowerCase()]
    );
    return hydrateUserRow(rows[0] || null);
  }

  async function findUserById(userId) {
    const rows = await query(
      `
        SELECT ${getUserSelectClause("u", "p")}
        FROM app_users u
        LEFT JOIN app_packages p ON p.id = u.package_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [Number(userId)]
    );
    return hydrateUserRow(rows[0] || null);
  }

  async function createUser(payload = {}) {
    const selectedPackage = await resolvePackageSelection(payload);
    const assignmentWindow = buildPackageAssignmentWindow(selectedPackage);
    const insertPayload = {
      name: String(payload.name || "").trim(),
      email: String(payload.email || "").trim().toLowerCase(),
      password_hash: String(payload.password_hash || ""),
      role: String(payload.role || "student").trim().toLowerCase() || "student",
      stage: String(payload.stage || "").trim() || null,
      grade: String(payload.grade || "").trim() || null,
      subject: String(payload.subject || "").trim() || null,
      package_id: selectedPackage?.id || null,
      package_name: String(
        selectedPackage?.display_name ||
        payload.package_name ||
        payload.package ||
        (String(payload.role || "").trim().toLowerCase() === "student" ? "المجانية" : "إدارة المنصة")
      ).trim(),
      plan_type: String(selectedPackage?.package_key || payload.plan_type || payload.package_key || "starter").trim() || "starter",
      package_started_at: assignmentWindow.package_started_at,
      package_expires_at: assignmentWindow.package_expires_at,
      balance: Number.isFinite(Number(payload.balance ?? payload.xp)) ? Number(payload.balance ?? payload.xp) : 0,
      xp: Number.isFinite(Number(payload.xp ?? payload.balance)) ? Number(payload.xp ?? payload.balance) : 0,
      total_xp: Number.isFinite(Number(payload.total_xp ?? payload.xp ?? payload.balance)) ? Number(payload.total_xp ?? payload.xp ?? payload.balance) : 0,
      daily_reward_amount: Math.max(0, Math.round(Number(payload.daily_reward_amount ?? payload.dailyRewardAmount ?? selectedPackage?.daily_xp ?? 0) || 0)),
      streak_days: Number.isFinite(Number(payload.streak_days)) ? Number(payload.streak_days) : 0,
      motivation_score: Number.isFinite(Number(payload.motivation_score)) ? Number(payload.motivation_score) : 0,
      referral_code: String(payload.own_referral_code || payload.ownReferralCode || payload.generated_referral_code || "").trim().toUpperCase() || null,
      referred_by_user_id: payload.referred_by_user_id || payload.referredByUserId ? Number(payload.referred_by_user_id || payload.referredByUserId) : null,
      trust_score: Number.isFinite(Number(payload.trust_score || payload.trustScore)) ? Number(payload.trust_score || payload.trustScore) : 70,
      abuse_score: Number.isFinite(Number(payload.abuse_score || payload.abuseScore)) ? Number(payload.abuse_score || payload.abuseScore) : 0,
      shadow_banned: "shadow_banned" in payload || "shadowBanned" in payload ? normalizeBoolean(payload.shadow_banned || payload.shadowBanned) : false,
      last_active_date: payload.last_active_date || null,
      last_reset: payload.last_reset || payload.last_active_date || null,
      last_daily_xp_claimed_date: payload.last_daily_xp_claimed_date || payload.last_reset || payload.last_active_date || null,
      last_daily_xp_granted_at: payload.last_daily_xp_granted_at || payload.lastDailyXpGrantedAt || null,
      last_daily_reward_claimed_at: payload.last_daily_reward_claimed_at || payload.lastDailyRewardClaimedAt || null,
      last_daily_reward_at: payload.last_daily_reward_at || payload.lastDailyRewardAt || payload.last_daily_xp_granted_at || null,
      signup_bonus_claimed: "signup_bonus_claimed" in payload ? normalizeBoolean(payload.signup_bonus_claimed) : false,
      achievements: JSON.stringify(normalizeAchievements(payload.achievements)),
      status: String(payload.status || "active").trim().toLowerCase() || "active",
      activity: String(payload.activity || "").trim() || null
    };

    const rows = await query(
      `
        INSERT INTO app_users (
          name, email, password_hash, role, stage, grade, subject, package_id, package_name, plan_type, package_started_at, package_expires_at,
          balance, xp, total_xp, daily_reward_amount, streak_days, motivation_score, referral_code, referred_by_user_id, trust_score, abuse_score, shadow_banned, last_active_date, last_reset, last_daily_reward_claimed_at, last_daily_reward_at, last_daily_xp_claimed_date, last_daily_xp_granted_at, signup_bonus_claimed, achievements, status, activity
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31::jsonb, $32, $33
        )
        RETURNING id
      `,
      [
        insertPayload.name,
        insertPayload.email,
        insertPayload.password_hash,
        insertPayload.role,
        insertPayload.stage,
        insertPayload.grade,
        insertPayload.subject,
        insertPayload.package_id,
        insertPayload.package_name,
        insertPayload.plan_type,
        insertPayload.package_started_at,
        insertPayload.package_expires_at,
        insertPayload.balance,
        insertPayload.xp,
        insertPayload.total_xp,
        insertPayload.daily_reward_amount,
        insertPayload.streak_days,
        insertPayload.motivation_score,
        insertPayload.referral_code,
        insertPayload.referred_by_user_id,
        insertPayload.trust_score,
        insertPayload.abuse_score,
        insertPayload.shadow_banned,
        insertPayload.last_active_date,
        insertPayload.last_reset,
        insertPayload.last_daily_reward_claimed_at,
        insertPayload.last_daily_reward_at,
        insertPayload.last_daily_xp_claimed_date,
        insertPayload.last_daily_xp_granted_at,
        insertPayload.signup_bonus_claimed,
        insertPayload.achievements,
        insertPayload.status,
        insertPayload.activity
      ]
    );

    await ensureReferralCodeForUser(rows[0].id);

    if (selectedPackage) {
      await recordSubscriptionForUser(rows[0].id, selectedPackage, assignmentWindow);
    }

    return findUserById(rows[0].id);
  }

  async function ensureUserByEmail(payload = {}) {
    const existing = await findUserByEmail(payload.email);
    if (existing) return existing;
    return createUser(payload);
  }

  async function updateUser(userId, changes = {}) {
    const current = await findUserById(userId);
    if (!current) return null;

    const nextChanges = { ...changes };
    if ("email" in nextChanges) nextChanges.email = String(nextChanges.email || "").trim().toLowerCase();
    if ("role" in nextChanges) nextChanges.role = String(nextChanges.role || "student").trim().toLowerCase() || "student";
    if ("status" in nextChanges) nextChanges.status = String(nextChanges.status || "active").trim().toLowerCase() || "active";
    if ("last_active_date" in nextChanges) nextChanges.last_active_date = nextChanges.last_active_date || null;
    if ("last_reset" in nextChanges) nextChanges.last_reset = nextChanges.last_reset || null;
    if ("lastDailyRewardClaimedAt" in nextChanges && !("last_daily_reward_claimed_at" in nextChanges)) nextChanges.last_daily_reward_claimed_at = nextChanges.lastDailyRewardClaimedAt;
    if ("lastDailyRewardAt" in nextChanges && !("last_daily_reward_at" in nextChanges)) nextChanges.last_daily_reward_at = nextChanges.lastDailyRewardAt;
    if ("dailyRewardAmount" in nextChanges && !("daily_reward_amount" in nextChanges)) nextChanges.daily_reward_amount = nextChanges.dailyRewardAmount;
    if ("balance" in nextChanges) nextChanges.balance = Math.max(0, Math.round(Number(nextChanges.balance || 0) || 0));
    if ("daily_reward_amount" in nextChanges) nextChanges.daily_reward_amount = Math.max(0, Math.round(Number(nextChanges.daily_reward_amount || 0) || 0));
    if ("referral_code" in nextChanges) nextChanges.referral_code = String(nextChanges.referral_code || "").trim().toUpperCase() || null;
    if ("referralCode" in nextChanges && !("referral_code" in nextChanges)) nextChanges.referral_code = String(nextChanges.referralCode || "").trim().toUpperCase() || null;
    if ("referredByUserId" in nextChanges && !("referred_by_user_id" in nextChanges)) nextChanges.referred_by_user_id = nextChanges.referredByUserId;
    if ("referred_by_user_id" in nextChanges) nextChanges.referred_by_user_id = nextChanges.referred_by_user_id ? Number(nextChanges.referred_by_user_id) : null;
    if ("trust_score" in nextChanges) nextChanges.trust_score = Math.max(0, Math.min(100, Math.round(Number(nextChanges.trust_score || 0) || 0)));
    if ("trustScore" in nextChanges && !("trust_score" in nextChanges)) nextChanges.trust_score = Math.max(0, Math.min(100, Math.round(Number(nextChanges.trustScore || 0) || 0)));
    if ("abuse_score" in nextChanges) nextChanges.abuse_score = Math.max(0, Math.min(100, Math.round(Number(nextChanges.abuse_score || 0) || 0)));
    if ("abuseScore" in nextChanges && !("abuse_score" in nextChanges)) nextChanges.abuse_score = Math.max(0, Math.min(100, Math.round(Number(nextChanges.abuseScore || 0) || 0)));
    if ("shadowBanned" in nextChanges && !("shadow_banned" in nextChanges)) nextChanges.shadow_banned = nextChanges.shadowBanned;
    if ("shadow_banned" in nextChanges) nextChanges.shadow_banned = normalizeBoolean(nextChanges.shadow_banned);
    if ("last_daily_reward_claimed_at" in nextChanges) nextChanges.last_daily_reward_claimed_at = nextChanges.last_daily_reward_claimed_at || null;
    if ("last_daily_reward_at" in nextChanges) nextChanges.last_daily_reward_at = nextChanges.last_daily_reward_at || null;
    if ("last_daily_xp_claimed_date" in nextChanges) nextChanges.last_daily_xp_claimed_date = nextChanges.last_daily_xp_claimed_date || null;
    if ("last_daily_xp_granted_at" in nextChanges) nextChanges.last_daily_xp_granted_at = nextChanges.last_daily_xp_granted_at || null;
    if ("signup_bonus_claimed" in nextChanges) nextChanges.signup_bonus_claimed = normalizeBoolean(nextChanges.signup_bonus_claimed);
    if ("xp" in nextChanges && !("balance" in nextChanges)) nextChanges.balance = nextChanges.xp;
    if ("balance" in nextChanges && !("xp" in nextChanges)) nextChanges.xp = nextChanges.balance;
    if ("xp" in nextChanges && !("total_xp" in nextChanges)) nextChanges.total_xp = nextChanges.xp;
    if ("total_xp" in nextChanges && !("xp" in nextChanges)) nextChanges.xp = nextChanges.total_xp;
    if ("total_xp" in nextChanges && !("balance" in nextChanges)) nextChanges.balance = nextChanges.total_xp;
    if (("package_id" in nextChanges || "package_key" in nextChanges || "package_name" in nextChanges) && !("plan_type" in nextChanges)) {
      nextChanges.plan_type = String(nextChanges.package_key || current.package_key || current.plan_type || "starter").trim() || "starter";
    }

    const mappings = {
      name: "name",
      email: "email",
      password_hash: "password_hash",
      role: "role",
      stage: "stage",
      grade: "grade",
      subject: "subject",
      package_id: "package_id",
      package_name: "package_name",
      package_started_at: "package_started_at",
      package_expires_at: "package_expires_at",
      balance: "balance",
      xp: "xp",
      total_xp: "total_xp",
      daily_reward_amount: "daily_reward_amount",
      plan_type: "plan_type",
      streak_days: "streak_days",
      motivation_score: "motivation_score",
      referral_code: "referral_code",
      referred_by_user_id: "referred_by_user_id",
      trust_score: "trust_score",
      abuse_score: "abuse_score",
      shadow_banned: "shadow_banned",
      last_active_date: "last_active_date",
      last_reset: "last_reset",
      last_daily_reward_claimed_at: "last_daily_reward_claimed_at",
      last_daily_reward_at: "last_daily_reward_at",
      last_daily_xp_claimed_date: "last_daily_xp_claimed_date",
      last_daily_xp_granted_at: "last_daily_xp_granted_at",
      signup_bonus_claimed: "signup_bonus_claimed",
      achievements: "achievements",
      status: "status",
      activity: "activity"
    };
    const { sets, values } = buildAssignments(nextChanges, mappings);
    if (!sets.length) return current;

    await pool.query(
      `UPDATE app_users SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1}`,
      [...values, Number(userId)]
    );

    if ("package_id" in nextChanges) {
      const selectedPackage = nextChanges.package_id
        ? await findPackageById(nextChanges.package_id)
        : await findPackageByKeyOrName(nextChanges.package_name || nextChanges.plan_type || "starter");
      if (selectedPackage) {
        await recordSubscriptionForUser(userId, selectedPackage, {
          package_started_at: nextChanges.package_started_at,
          package_expires_at: nextChanges.package_expires_at
        });
      }
    }

    return findUserById(userId);
  }

  async function listUsers(options = {}) {
    const limit = Math.max(1, Math.min(Number(options.limit || 20), 200));
    const offset = Math.max(0, Number(options.offset || 0));
    const search = String(options.search || "").trim().toLowerCase();
    const role = String(options.role || "").trim().toLowerCase();
    const status = String(options.status || "").trim().toLowerCase();
    const where = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`, `%${search}%`);
      where.push(`(LOWER(name) LIKE $${params.length - 1} OR LOWER(email) LIKE $${params.length})`);
    }
    if (role) {
      params.push(role);
      where.push(`role = $${params.length}`);
    }
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const countRows = await query(`SELECT COUNT(*) AS total FROM app_users ${whereClause}`, params);
    params.push(limit, offset);
    const rows = await query(
      `
        SELECT ${getUserSelectClause("u", "p")}
        FROM app_users u
        LEFT JOIN app_packages p ON p.id = u.package_id
        ${whereClause}
        ORDER BY u.created_at DESC, u.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `,
      params
    );

    return {
      items: rows.map(hydrateUserRow),
      total: Number(countRows?.[0]?.total || 0)
    };
  }

  async function createApiToken(payload = {}) {
    await pool.query(
      `
        INSERT INTO app_api_tokens (user_id, name, token_hash, last_used_at, expires_at)
        VALUES ($1, $2, $3, NOW(), $4)
      `,
      [
        Number(payload.user_id),
        String(payload.name || "mullem-web").trim() || "mullem-web",
        String(payload.token_hash || "").trim(),
        toSqlDateTime(payload.expires_at)
      ]
    );
  }

  async function findUserByTokenHash(tokenHash) {
    const rows = await query(
      `
        SELECT
          ${getUserSelectClause("u", "p")},
          t.id AS token_id,
          t.last_used_at AS token_last_used_at,
          t.expires_at AS token_expires_at
        FROM app_api_tokens t
        INNER JOIN app_users u ON u.id = t.user_id
        LEFT JOIN app_packages p ON p.id = u.package_id
        WHERE t.token_hash = $1
          AND (t.expires_at IS NULL OR t.expires_at > NOW())
        LIMIT 1
      `,
      [String(tokenHash || "").trim()]
    );

    return hydrateUserRow(rows[0] || null);
  }

  async function touchApiToken(tokenHash) {
    await pool.query("UPDATE app_api_tokens SET last_used_at = NOW() WHERE token_hash = $1", [String(tokenHash || "").trim()]);
  }

  async function revokeApiToken(tokenHash) {
    await pool.query("DELETE FROM app_api_tokens WHERE token_hash = $1", [String(tokenHash || "").trim()]);
  }

  async function findProjectById(projectId, userId = null) {
    const params = [Number(projectId)];
    let whereClause = "id = $1";
    if (userId != null) {
      params.push(Number(userId));
      whereClause += ` AND user_id = $${params.length}`;
    }

    const rows = await query(`SELECT * FROM app_projects WHERE ${whereClause} LIMIT 1`, params);
    return rows[0] || null;
  }

  async function listProjects(userId, options = {}) {
    const safeLimit = Math.max(1, Math.min(Number(options.limit || 50), 200));
    const includeArchived = Boolean(options.include_archived);
    const params = [Number(userId)];
    let whereClause = "WHERE p.user_id = $1";

    if (!includeArchived) whereClause += " AND p.is_archived = FALSE";
    params.push(safeLimit);

    const rows = await query(
      `
        SELECT
          p.*,
          COUNT(c.id) AS conversations_count,
          MAX(COALESCE(c.last_message_at, c.updated_at, c.created_at)) AS last_activity_at
        FROM app_projects p
        LEFT JOIN conversations c ON c.project_id = p.id
        ${whereClause}
        GROUP BY p.id
        ORDER BY COALESCE(MAX(COALESCE(c.last_message_at, c.updated_at, c.created_at)), p.updated_at, p.created_at) DESC
        LIMIT $${params.length}
      `,
      params
    );

    return rows.map((row) => ({
      ...row,
      conversations_count: Number(row.conversations_count || 0),
      is_archived: normalizeBoolean(row.is_archived)
    }));
  }

  async function createProject(payload = {}) {
    const rows = await query(
      `
        INSERT INTO app_projects (
          user_id, title, subject, stage, grade, term, lesson, description, is_archived
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      [
        Number(payload.user_id),
        String(payload.title || "").trim(),
        String(payload.subject || "").trim() || null,
        String(payload.stage || "").trim() || null,
        String(payload.grade || "").trim() || null,
        String(payload.term || "").trim() || null,
        String(payload.lesson || "").trim() || null,
        String(payload.description || "").trim() || null,
        Boolean(payload.is_archived)
      ]
    );
    return findProjectById(rows[0].id, payload.user_id);
  }

  async function updateProject(projectId, userId, changes = {}) {
    const current = await findProjectById(projectId, userId);
    if (!current) return null;

    const mappings = {
      title: "title",
      subject: "subject",
      stage: "stage",
      grade: "grade",
      term: "term",
      lesson: "lesson",
      description: "description",
      is_archived: "is_archived"
    };
    const { sets, values } = buildAssignments(changes, mappings);
    if (!sets.length) return current;

    await pool.query(
      `UPDATE app_projects SET ${sets.join(", ")}, updated_at = NOW() WHERE id = $${values.length + 1} AND user_id = $${values.length + 2}`,
      [...values, Number(projectId), Number(userId)]
    );
    return findProjectById(projectId, userId);
  }

  async function getGuestUsage(guestSessionId) {
    const rows = await query(
      "SELECT * FROM app_guest_usage WHERE guest_session_id = $1 LIMIT 1",
      [String(guestSessionId || "").trim()]
    );
    const row = rows[0] || null;
    if (!row) return null;

    const today = getTodayDateStamp();
    const usageDate = row.usage_date ? String(row.usage_date).slice(0, 10) : "";
    if (usageDate && usageDate === today) return row;

    return {
      ...row,
      usage_date: today,
      messages_count: 0
    };
  }

  async function incrementGuestUsage(guestSessionId, amount = 1) {
    const safeGuestSessionId = String(guestSessionId || "").trim();
    const safeAmount = Math.max(1, Number(amount) || 1);
    const today = getTodayDateStamp();
    await pool.query(
      `
        INSERT INTO app_guest_usage (guest_session_id, messages_count, usage_date, last_message_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (guest_session_id) DO UPDATE SET
          messages_count = CASE
            WHEN app_guest_usage.usage_date = EXCLUDED.usage_date
              THEN app_guest_usage.messages_count + EXCLUDED.messages_count
            ELSE EXCLUDED.messages_count
          END,
          usage_date = EXCLUDED.usage_date,
          last_message_at = NOW(),
          updated_at = NOW()
      `,
      [safeGuestSessionId, safeAmount, today]
    );
    return getGuestUsage(safeGuestSessionId);
  }

  async function getAiUsageStats(userId) {
    const safeUserId = Number(userId);
    if (!safeUserId) {
      return { dailyTokens: 0, monthlyTokens: 0, dailyImages: 0 };
    }

    const rows = await query(
      `
        WITH message_usage AS (
          SELECT
            created_at,
            COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0) AS tokens,
            0 AS images
          FROM messages
          WHERE user_id = $1
        ),
        tool_usage_rows AS (
          SELECT
            created_at,
            COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0) AS tokens,
            CASE WHEN tool_key = 'image_system' THEN 1 ELSE 0 END AS images
          FROM tool_usage
          WHERE user_id = $1
        ),
        all_usage AS (
          SELECT * FROM message_usage
          UNION ALL
          SELECT * FROM tool_usage_rows
        )
        SELECT
          COALESCE(SUM(tokens) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS daily_tokens,
          COALESCE(SUM(tokens) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())), 0) AS monthly_tokens,
          COALESCE(SUM(images) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS daily_images
        FROM all_usage
      `,
      [safeUserId]
    );
    const row = rows[0] || {};
    return {
      dailyTokens: Number(row.daily_tokens || 0),
      monthlyTokens: Number(row.monthly_tokens || 0),
      dailyImages: Number(row.daily_images || 0)
    };
  }

  async function getAdminStats() {
    const userCountsRows = await query(`
      SELECT
        COUNT(*) AS users_count,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) AS students_count,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_users_count
      FROM app_users
    `);
    const conversationRows = await query("SELECT COUNT(*) AS conversations_count FROM conversations");
    const messageRows = await query("SELECT COUNT(*) AS messages_count FROM messages");
    const projectRows = await query("SELECT COUNT(*) AS projects_count FROM app_projects WHERE is_archived = FALSE");
    const packageRows = await query("SELECT COUNT(*) AS packages_count FROM app_packages WHERE is_active = TRUE");
    const subscriptionRows = await query("SELECT COUNT(*) AS active_subscriptions_count, COALESCE(SUM(price_sar), 0) AS revenue_total FROM app_subscriptions WHERE status = 'active'");
    const xpRows = await query("SELECT COALESCE(SUM(ABS(amount)), 0) AS xp_used_total FROM xp_ledger WHERE amount < 0");
    const todayRows = await query("SELECT COUNT(*) AS today_requests_count FROM messages WHERE created_at >= CURRENT_DATE");
    const aiUsageRows = await query(`
      WITH message_usage AS (
        SELECT
          created_at,
          COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0) AS tokens,
          COALESCE(xp_cost, 0) AS xp_cost,
          COALESCE(model_key, 'chat') AS model_key,
          0 AS images
        FROM messages
      ),
      tool_usage_rows AS (
        SELECT
          created_at,
          COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0) AS tokens,
          COALESCE(xp_cost, 0) AS xp_cost,
          COALESCE(metadata->>'model_key', tool_key, 'tool') AS model_key,
          CASE WHEN tool_key = 'image_system' THEN 1 ELSE 0 END AS images
        FROM tool_usage
      ),
      all_usage AS (
        SELECT * FROM message_usage
        UNION ALL
        SELECT * FROM tool_usage_rows
      )
      SELECT
        COALESCE(SUM(tokens) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS ai_daily_tokens,
        COALESCE(SUM(tokens) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())), 0) AS ai_monthly_tokens,
        COALESCE(SUM(tokens), 0) AS ai_total_tokens,
        COALESCE(SUM(xp_cost), 0) AS ai_xp_spent_total,
        COALESCE(SUM(images) FILTER (WHERE created_at >= CURRENT_DATE), 0) AS ai_daily_images,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS ai_daily_requests
      FROM all_usage
    `);

    const userCountsRow = userCountsRows[0] || {};
    const subscriptionRow = subscriptionRows[0] || {};
    const aiUsageRow = aiUsageRows[0] || {};
    return {
      users_count: Number(userCountsRow.users_count || 0),
      students_count: Number(userCountsRow.students_count || 0),
      admins_count: Number(userCountsRow.admins_count || 0),
      active_users_count: Number(userCountsRow.active_users_count || 0),
      active_subscriptions_count: Number(subscriptionRow.active_subscriptions_count || 0),
      revenue_total: Number(subscriptionRow.revenue_total || 0),
      xp_used_total: Number(xpRows?.[0]?.xp_used_total || 0),
      today_requests_count: Number(todayRows?.[0]?.today_requests_count || 0),
      ai_daily_tokens: Number(aiUsageRow.ai_daily_tokens || 0),
      ai_monthly_tokens: Number(aiUsageRow.ai_monthly_tokens || 0),
      ai_total_tokens: Number(aiUsageRow.ai_total_tokens || 0),
      ai_xp_spent_total: Number(aiUsageRow.ai_xp_spent_total || 0),
      ai_daily_images: Number(aiUsageRow.ai_daily_images || 0),
      ai_daily_requests: Number(aiUsageRow.ai_daily_requests || 0),
      conversations_count: Number(conversationRows?.[0]?.conversations_count || 0),
      messages_count: Number(messageRows?.[0]?.messages_count || 0),
      projects_count: Number(projectRows?.[0]?.projects_count || 0),
      packages_count: Number(packageRows?.[0]?.packages_count || 0)
    };
  }

  async function getStudentDashboard(userId) {
    const user = await findUserById(userId);
    if (!user) return null;

    const conversationRows = await query("SELECT COUNT(*) AS conversations_count FROM conversations WHERE user_id = $1", [Number(userId)]);
    const messageRows = await query(
      `
        SELECT COUNT(*) AS messages_count
        FROM messages m
        INNER JOIN conversations c ON c.id = m.conversation_id
        WHERE c.user_id = $1
      `,
      [Number(userId)]
    );
    const projectRows = await query(
      "SELECT COUNT(*) AS projects_count FROM app_projects WHERE user_id = $1 AND is_archived = FALSE",
      [Number(userId)]
    );
    const projects = await listProjects(userId, { limit: 8 });
    const recentConversations = await listUserConversations(userId, { limit: 8 });

    return {
      user,
      stats: {
        conversations_count: Number(conversationRows?.[0]?.conversations_count || 0),
        messages_count: Number(messageRows?.[0]?.messages_count || 0),
        projects_count: Number(projectRows?.[0]?.projects_count || 0)
      },
      projects,
      recent_conversations: recentConversations
    };
  }

  async function close() {
    if (pool) {
      await pool.end();
      pool = null;
    }
    state.connected = false;
    state.message = "PostgreSQL/Neon connection closed.";
  }

  return {
    initialize,
    isReady,
    getState,
    getConversationById,
    getConversationByGuestSessionId,
    getOrCreateConversation,
    deleteConversation,
    saveMessage,
    listMessages,
    listRecentConversations,
    listUserConversations,
    listUserMemoryCandidates,
    countConversationMessages,
    updateConversationSummary,
    saveUserMemory,
    saveMessageEmbedding,
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
    getAiCostGuardrailStats,
    saveToolUsage,
    recordBusinessEvent,
    recordAbuseEvent,
    getBetaBusinessAnalytics,
    ensureReferralCodeForUser,
    findUserByReferralCode,
    recordReferralSignup,
    markReferralConverted,
    getReferralStats,
    saveKnowledgeSuggestion,
    getScaleGrowthAnalytics,
    recordXpLedger,
    listNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    listAdminNotifications,
    createNotification,
    updateNotification,
    submitToolSuggestion,
    listAdminToolSuggestions,
    updateToolSuggestionStatus,
    markToolSuggestionImplemented,
    grantDailyXpIfNeeded,
    claimDailyReward,
    findPackageById,
    findDefaultPackage,
    findPackageByKeyOrName,
    listPackages,
    createPackage,
    updatePackage,
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
  createPostgresDatabaseClient
};
