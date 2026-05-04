const crypto = require("crypto");

let pgModule = null;

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
    xp: Number(row.xp || 0),
    streak_days: Number(row.streak_days || 0),
    motivation_score: Number(row.motivation_score || 0),
    package_started_at: row.package_started_at || null,
    package_expires_at: row.package_expires_at || null,
    total_xp: Number(row.total_xp ?? row.xp ?? 0),
    plan_type: String(row.plan_type || row.package_key || row.package_name || "starter").trim() || "starter",
    last_reset: row.last_reset || row.last_active_date || null,
    last_daily_xp_claimed_date: row.last_daily_xp_claimed_date || row.last_reset || row.last_active_date || null,
    last_daily_xp_granted_at: row.last_daily_xp_granted_at || null,
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
    } else if (key === "package_started_at" || key === "package_expires_at" || key === "last_daily_xp_granted_at") {
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
    daily_xp: 0,
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
        xp INTEGER NOT NULL DEFAULT 50,
        total_xp INTEGER NOT NULL DEFAULT 50,
        streak_days INTEGER NOT NULL DEFAULT 0,
        motivation_score INTEGER NOT NULL DEFAULT 0,
        last_active_date DATE NULL,
        last_reset DATE NULL,
        last_daily_xp_claimed_date DATE NULL,
        last_daily_xp_granted_at TIMESTAMPTZ NULL,
        signup_bonus_claimed BOOLEAN NOT NULL DEFAULT TRUE,
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

    await ensureColumn("app_users", "package_id", "package_id BIGINT NULL REFERENCES app_packages(id) ON DELETE SET NULL");
    await ensureColumn("app_users", "plan_type", "plan_type VARCHAR(80) NOT NULL DEFAULT 'starter'");
    await ensureColumn("app_users", "package_started_at", "package_started_at TIMESTAMPTZ NULL");
    await ensureColumn("app_users", "package_expires_at", "package_expires_at TIMESTAMPTZ NULL");
    await ensureColumn("app_users", "total_xp", "total_xp INTEGER NOT NULL DEFAULT 50");
    await ensureColumn("app_users", "last_reset", "last_reset DATE NULL");
    await ensureColumn("app_users", "last_daily_xp_claimed_date", "last_daily_xp_claimed_date DATE NULL");
    await ensureColumn("app_users", "last_daily_xp_granted_at", "last_daily_xp_granted_at TIMESTAMPTZ NULL");
    await ensureColumn("app_users", "signup_bonus_claimed", "signup_bonus_claimed BOOLEAN NOT NULL DEFAULT TRUE");
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
      CREATE TABLE IF NOT EXISTS xp_ledger (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(40) NOT NULL,
        reason TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query("CREATE INDEX IF NOT EXISTS idx_xp_ledger_user_created ON xp_ledger (user_id, created_at DESC)");

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
    const rows = await query(
      `
        INSERT INTO feedback (user_id, message_id, rating, note)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        userId,
        payload.message_id ? Number(payload.message_id) : null,
        rating.slice(0, 20),
        String(payload.note || "").trim() || null
      ]
    );
    return rows[0] || null;
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

  async function recordXpLedger(payload = {}) {
    const userId = Number(payload.user_id || payload.userId);
    const amount = Math.round(Number(payload.amount || 0) || 0);
    const type = String(payload.type || "").trim().toLowerCase().slice(0, 40);
    if (!userId || !type || !amount) return null;
    const rows = await query(
      `
        INSERT INTO xp_ledger (user_id, amount, type, reason)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        userId,
        amount,
        type,
        String(payload.reason || "").trim() || null
      ]
    );
    return rows[0] || null;
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
      xp: Number.isFinite(Number(payload.xp)) ? Number(payload.xp) : 50,
      total_xp: Number.isFinite(Number(payload.total_xp ?? payload.xp)) ? Number(payload.total_xp ?? payload.xp) : 50,
      streak_days: Number.isFinite(Number(payload.streak_days)) ? Number(payload.streak_days) : 0,
      motivation_score: Number.isFinite(Number(payload.motivation_score)) ? Number(payload.motivation_score) : 0,
      last_active_date: payload.last_active_date || null,
      last_reset: payload.last_reset || payload.last_active_date || null,
      last_daily_xp_claimed_date: payload.last_daily_xp_claimed_date || payload.last_reset || payload.last_active_date || null,
      last_daily_xp_granted_at: payload.last_daily_xp_granted_at || null,
      signup_bonus_claimed: "signup_bonus_claimed" in payload ? normalizeBoolean(payload.signup_bonus_claimed) : true,
      achievements: JSON.stringify(normalizeAchievements(payload.achievements)),
      status: String(payload.status || "active").trim().toLowerCase() || "active",
      activity: String(payload.activity || "").trim() || null
    };

    const rows = await query(
      `
        INSERT INTO app_users (
          name, email, password_hash, role, stage, grade, subject, package_id, package_name, plan_type, package_started_at, package_expires_at,
          xp, total_xp, streak_days, motivation_score, last_active_date, last_reset, last_daily_xp_claimed_date, last_daily_xp_granted_at, signup_bonus_claimed, achievements, status, activity
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22::jsonb, $23, $24
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
        insertPayload.xp,
        insertPayload.total_xp,
        insertPayload.streak_days,
        insertPayload.motivation_score,
        insertPayload.last_active_date,
        insertPayload.last_reset,
        insertPayload.last_daily_xp_claimed_date,
        insertPayload.last_daily_xp_granted_at,
        insertPayload.signup_bonus_claimed,
        insertPayload.achievements,
        insertPayload.status,
        insertPayload.activity
      ]
    );

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
    if ("last_daily_xp_claimed_date" in nextChanges) nextChanges.last_daily_xp_claimed_date = nextChanges.last_daily_xp_claimed_date || null;
    if ("last_daily_xp_granted_at" in nextChanges) nextChanges.last_daily_xp_granted_at = nextChanges.last_daily_xp_granted_at || null;
    if ("signup_bonus_claimed" in nextChanges) nextChanges.signup_bonus_claimed = normalizeBoolean(nextChanges.signup_bonus_claimed);
    if ("xp" in nextChanges && !("total_xp" in nextChanges)) nextChanges.total_xp = nextChanges.xp;
    if ("total_xp" in nextChanges && !("xp" in nextChanges)) nextChanges.xp = nextChanges.total_xp;
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
      xp: "xp",
      total_xp: "total_xp",
      plan_type: "plan_type",
      streak_days: "streak_days",
      motivation_score: "motivation_score",
      last_active_date: "last_active_date",
      last_reset: "last_reset",
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

    const userCountsRow = userCountsRows[0] || {};
    return {
      users_count: Number(userCountsRow.users_count || 0),
      students_count: Number(userCountsRow.students_count || 0),
      admins_count: Number(userCountsRow.admins_count || 0),
      active_users_count: Number(userCountsRow.active_users_count || 0),
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
    saveToolUsage,
    recordXpLedger,
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
  createPostgresDatabaseClient
};
