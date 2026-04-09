let mysqlModule = null;

function getMysqlModule() {
  if (mysqlModule) {
    return mysqlModule;
  }

  try {
    mysqlModule = require("mysql2/promise");
    return mysqlModule;
  } catch (error) {
    const friendlyError = new Error(
      "mysql2 dependency is not installed. Backend will continue in memory-only mode until the package is available."
    );
    friendlyError.code = "MYSQL2_MISSING";
    friendlyError.cause = error;
    throw friendlyError;
  }
}

function normalizeConfig(rawConfig = {}) {
  const host = String(rawConfig.host || rawConfig.DB_HOST || "127.0.0.1").trim();
  const port = Number(rawConfig.port || rawConfig.DB_PORT || 3306);
  const database = String(rawConfig.database || rawConfig.DB_DATABASE || "mullem").trim();
  const user = String(
    rawConfig.user ||
    rawConfig.username ||
    rawConfig.DB_USER ||
    rawConfig.DB_USERNAME ||
    "root"
  ).trim();
  const password = String(rawConfig.password || rawConfig.DB_PASSWORD || "").trim();
  const connectTimeout = Math.max(
    1000,
    Number(rawConfig.connectTimeout || rawConfig.DB_CONNECT_TIMEOUT_MS || 8000)
  );

  return {
    host,
    port,
    database,
    user,
    password,
    connectTimeout
  };
}

function toSqlDateTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function normalizeAchievements(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  return [];
}

function normalizeBenefits(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return String(value)
    .split(/\r?\n+/)
    .map((item) => item.replace(/^[\s\-•]+/, "").trim())
    .filter(Boolean);
}

function serializeBenefits(value) {
  return normalizeBenefits(value).join("\n");
}

function getTodayDateStamp() {
  return new Date().toISOString().slice(0, 10);
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
    is_active: Number(row.is_active || 0) === 1,
    is_default: Number(row.is_default || 0) === 1,
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
    package_is_active: Number(row.package_is_active || 0) === 1,
    package_is_default: Number(row.package_is_default || 0) === 1,
    package_sort_order: Number(row.package_sort_order || 0),
    package_name: String(row.package_display_name || row.package_name || "").trim(),
    xp: Number(row.xp || 0),
    streak_days: Number(row.streak_days || 0),
    motivation_score: Number(row.motivation_score || 0),
    package_started_at: row.package_started_at || null,
    package_expires_at: row.package_expires_at || null
  };
}

function buildUserUpdateStatement(changes = {}) {
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
    streak_days: "streak_days",
    motivation_score: "motivation_score",
    last_active_date: "last_active_date",
    achievements: "achievements",
    status: "status",
    activity: "activity"
  };

  const sets = [];
  const values = [];

  for (const [key, column] of Object.entries(mappings)) {
    if (!(key in changes)) continue;
    sets.push(`${column} = ?`);
    if (key === "achievements") {
      values.push(JSON.stringify(normalizeAchievements(changes[key])));
      continue;
    }
    values.push(changes[key]);
  }

  return { sets, values };
}

const DEFAULT_PACKAGE_CATALOG = [
  {
    package_key: "starter",
    display_name: "التمهيدية",
    daily_xp: 0,
    price_sar: 0,
    duration_days: 0,
    summary: "انطلاقة مجانية لتجربة المنصة وبناء سجل التعلم.",
    benefits: [
      "100 XP بداية للحساب",
      "حماس يومي +5 XP",
      "حفظ المشاريع والدردشات بعد التسجيل"
    ],
    is_active: 1,
    is_default: 1,
    sort_order: 1
  },
  {
    package_key: "pro",
    display_name: "برو",
    daily_xp: 200,
    price_sar: 30,
    duration_days: 30,
    summary: "باقة شهرية خفيفة للمذاكرة اليومية المنتظمة.",
    benefits: [
      "200 XP يتجدد يوميًا",
      "مناسبة للمراجعة اليومية",
      "تدعم الدروس والمشاريع الأساسية"
    ],
    is_active: 1,
    is_default: 0,
    sort_order: 2
  },
  {
    package_key: "pro_plus",
    display_name: "برو بلس",
    daily_xp: 500,
    price_sar: 60,
    duration_days: 30,
    summary: "باقة شهرية أوسع للاستخدام المكثف والصور والمشاريع.",
    benefits: [
      "500 XP يتجدد يوميًا",
      "أنسب للأسئلة الكثيرة والصور",
      "مرونة أكبر مع المشاريع الدراسية"
    ],
    is_active: 1,
    is_default: 0,
    sort_order: 3
  },
  {
    package_key: "pro_max",
    display_name: "برو ماكس",
    daily_xp: 1000,
    price_sar: 100,
    duration_days: 30,
    summary: "أعلى باقة شهرية للاستخدام الثقيل والدعم اليومي المكثف.",
    benefits: [
      "1000 XP يتجدد يوميًا",
      "أفضل خيار للاستخدام المكثف",
      "مثالية للمشاريع والمواد المتعددة"
    ],
    is_active: 1,
    is_default: 0,
    sort_order: 4
  }
];

function createDatabaseClient(rawConfig = {}) {
  const config = normalizeConfig(rawConfig);
  let pool = null;
  const state = {
    configured: Boolean(config.host && config.database && config.user),
    connected: false,
    host: config.host,
    port: config.port,
    database: config.database,
    message: "MySQL is not connected yet."
  };

  async function initialize() {
    if (!state.configured) {
      state.message = "MySQL environment variables are incomplete.";
      return;
    }

    const mysql = getMysqlModule();

    const adminConnection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      connectTimeout: config.connectTimeout,
      multipleStatements: true
    });

    try {
      await adminConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } finally {
      await adminConnection.end();
    }

    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectTimeout: config.connectTimeout,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4"
    });

    await ensureSchema();
    state.connected = true;
    state.message = "MySQL connected successfully.";
  }

  async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_packages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        package_key VARCHAR(80) NOT NULL,
        display_name VARCHAR(160) NOT NULL,
        daily_xp INT UNSIGNED NOT NULL DEFAULT 0,
        price_sar DECIMAL(10,2) NOT NULL DEFAULT 0,
        duration_days INT UNSIGNED NOT NULL DEFAULT 0,
        summary TEXT NULL,
        benefits TEXT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        is_default TINYINT(1) NOT NULL DEFAULT 0,
        sort_order INT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_app_packages_key (package_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        email VARCHAR(190) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'student',
        stage VARCHAR(100) NULL,
        grade VARCHAR(100) NULL,
        subject VARCHAR(100) NULL,
        package_id BIGINT UNSIGNED NULL,
        package_name VARCHAR(150) NOT NULL DEFAULT 'مجاني محدود',
        package_started_at DATETIME NULL,
        package_expires_at DATETIME NULL,
        xp INT UNSIGNED NOT NULL DEFAULT 100,
        streak_days INT UNSIGNED NOT NULL DEFAULT 0,
        motivation_score INT UNSIGNED NOT NULL DEFAULT 0,
        last_active_date DATE NULL,
        achievements JSON NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        activity VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_app_users_email (email),
        INDEX idx_app_users_role_status (role, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await ensureUserPackageColumn();
    await ensureUserMotivationColumn();
    await ensurePackageCatalogColumns();
    await ensureUserPackageWindowColumns();
    await ensureDefaultPackages();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_api_tokens (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        name VARCHAR(120) NOT NULL DEFAULT 'mullem-web',
        token_hash CHAR(64) NOT NULL,
        last_used_at DATETIME NULL,
        expires_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_app_api_tokens_hash (token_hash),
        INDEX idx_app_api_tokens_user_id (user_id),
        CONSTRAINT fk_app_api_tokens_user
          FOREIGN KEY (user_id) REFERENCES app_users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        guest_session_id VARCHAR(255) NULL,
        title VARCHAR(255) NULL,
        subject VARCHAR(255) NULL,
        stage VARCHAR(100) NULL,
        grade VARCHAR(100) NULL,
        term VARCHAR(100) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        last_message_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_conversations_guest_session (guest_session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await ensureConversationUserColumn();
    await ensureConversationProjectColumn();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL,
        role VARCHAR(20) NOT NULL,
        body LONGTEXT NOT NULL,
        source VARCHAR(50) NOT NULL DEFAULT 'web',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_messages_conversation_created (conversation_id, created_at),
        CONSTRAINT fk_messages_conversation
          FOREIGN KEY (conversation_id) REFERENCES conversations(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_guest_usage (
        guest_session_id VARCHAR(120) NOT NULL PRIMARY KEY,
        messages_count INT UNSIGNED NOT NULL DEFAULT 0,
        usage_date DATE NULL,
        last_message_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await ensureGuestUsageDateColumn();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_projects (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(180) NOT NULL,
        subject VARCHAR(120) NULL,
        stage VARCHAR(120) NULL,
        grade VARCHAR(120) NULL,
        term VARCHAR(120) NULL,
        lesson VARCHAR(180) NULL,
        description TEXT NULL,
        is_archived TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_app_projects_user_archived (user_id, is_archived),
        CONSTRAINT fk_app_projects_user
          FOREIGN KEY (user_id) REFERENCES app_users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async function ensureUserMotivationColumn() {
    const [columnRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users' AND COLUMN_NAME = 'motivation_score'
      `,
      [config.database]
    );

    if (!Number(columnRows?.[0]?.total || 0)) {
      await pool.query(`
        ALTER TABLE app_users
        ADD COLUMN motivation_score INT UNSIGNED NOT NULL DEFAULT 0 AFTER streak_days
      `);
    }
  }

  async function ensurePackageCatalogColumns() {
    const packageColumns = [
      {
        name: "duration_days",
        sql: `
          ALTER TABLE app_packages
          ADD COLUMN duration_days INT UNSIGNED NOT NULL DEFAULT 0 AFTER price_sar
        `
      },
      {
        name: "benefits",
        sql: `
          ALTER TABLE app_packages
          ADD COLUMN benefits TEXT NULL AFTER summary
        `
      }
    ];

    for (const column of packageColumns) {
      const [rows] = await pool.execute(
        `
          SELECT COUNT(*) AS total
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_packages' AND COLUMN_NAME = ?
        `,
        [config.database, column.name]
      );

      if (!Number(rows?.[0]?.total || 0)) {
        await pool.query(column.sql);
      }
    }
  }

  async function ensureGuestUsageDateColumn() {
    const [rows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_guest_usage' AND COLUMN_NAME = 'usage_date'
      `,
      [config.database]
    );

    if (!Number(rows?.[0]?.total || 0)) {
      await pool.query(`
        ALTER TABLE app_guest_usage
        ADD COLUMN usage_date DATE NULL AFTER messages_count
      `);
    }
  }

  async function ensureUserPackageColumn() {
    const [columnRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users' AND COLUMN_NAME = 'package_id'
      `,
      [config.database]
    );

    if (!Number(columnRows?.[0]?.total || 0)) {
      await pool.query(`
        ALTER TABLE app_users
        ADD COLUMN package_id BIGINT UNSIGNED NULL AFTER subject
      `);
    }

    const [indexRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users' AND INDEX_NAME = 'idx_app_users_package_id'
      `,
      [config.database]
    );

    if (!Number(indexRows?.[0]?.total || 0)) {
      await pool.query(`
        CREATE INDEX idx_app_users_package_id
        ON app_users (package_id)
      `);
    }
  }

  async function ensureUserPackageWindowColumns() {
    const packageColumns = [
      {
        name: "package_started_at",
        sql: `
          ALTER TABLE app_users
          ADD COLUMN package_started_at DATETIME NULL AFTER package_name
        `
      },
      {
        name: "package_expires_at",
        sql: `
          ALTER TABLE app_users
          ADD COLUMN package_expires_at DATETIME NULL AFTER package_started_at
        `
      }
    ];

    for (const column of packageColumns) {
      const [rows] = await pool.execute(
        `
          SELECT COUNT(*) AS total
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users' AND COLUMN_NAME = ?
        `,
        [config.database, column.name]
      );

      if (!Number(rows?.[0]?.total || 0)) {
        await pool.query(column.sql);
      }
    }
  }

  async function ensureConversationUserColumn() {
    const [columnRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversations' AND COLUMN_NAME = 'user_id'
      `,
      [config.database]
    );

    if (!Number(columnRows?.[0]?.total || 0)) {
      await pool.query(`
        ALTER TABLE conversations
        ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER guest_session_id
      `);
    }

    const [indexRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversations' AND INDEX_NAME = 'idx_conversations_user_id'
      `,
      [config.database]
    );

    if (!Number(indexRows?.[0]?.total || 0)) {
      await pool.query(`
        CREATE INDEX idx_conversations_user_id
        ON conversations (user_id)
      `);
    }
  }

  async function ensureConversationProjectColumn() {
    const [columnRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversations' AND COLUMN_NAME = 'project_id'
      `,
      [config.database]
    );

    if (!Number(columnRows?.[0]?.total || 0)) {
      await pool.query(`
        ALTER TABLE conversations
        ADD COLUMN project_id BIGINT UNSIGNED NULL AFTER user_id
      `);
    }

    const [indexRows] = await pool.execute(
      `
        SELECT COUNT(*) AS total
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'conversations' AND INDEX_NAME = 'idx_conversations_project_id'
      `,
      [config.database]
    );

    if (!Number(indexRows?.[0]?.total || 0)) {
      await pool.query(`
        CREATE INDEX idx_conversations_project_id
        ON conversations (project_id)
      `);
    }
  }

  async function ensureDefaultPackages() {
    for (const pkg of DEFAULT_PACKAGE_CATALOG) {
      await pool.execute(
        `
          INSERT INTO app_packages (
            package_key, display_name, daily_xp, price_sar, duration_days, summary, benefits, is_active, is_default, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            display_name = VALUES(display_name),
            daily_xp = VALUES(daily_xp),
            price_sar = VALUES(price_sar),
            duration_days = VALUES(duration_days),
            summary = VALUES(summary),
            benefits = VALUES(benefits),
            is_active = VALUES(is_active),
            is_default = VALUES(is_default),
            sort_order = VALUES(sort_order)
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
    const [rows] = await pool.execute(
      "SELECT * FROM conversations WHERE id = ? LIMIT 1",
      [conversationId]
    );
    return rows[0] || null;
  }

  async function getConversationByGuestSessionId(guestSessionId) {
    const [rows] = await pool.execute(
      "SELECT * FROM conversations WHERE guest_session_id = ? LIMIT 1",
      [guestSessionId]
    );
    return rows[0] || null;
  }

  async function createConversation(payload = {}) {
    const conversation = {
      id: String(payload.id || "").trim(),
      guest_session_id: String(payload.guest_session_id || "").trim() || null,
      user_id: payload.user_id ? Number(payload.user_id) : null,
      project_id: payload.project_id ? Number(payload.project_id) : null,
      title: String(payload.title || "").trim() || null,
      subject: String(payload.subject || "").trim() || null,
      stage: String(payload.stage || "").trim() || null,
      grade: String(payload.grade || "").trim() || null,
      term: String(payload.term || "").trim() || null
    };

    await pool.execute(
      `
        INSERT INTO conversations (
          id, guest_session_id, user_id, project_id, title, subject, stage, grade, term, status, last_message_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL)
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
        conversation.term
      ]
    );

    return getConversationById(conversation.id);
  }

  async function assignConversationUser(conversationId, userId) {
    if (!conversationId || !userId) return;
    await pool.execute(
      "UPDATE conversations SET user_id = ? WHERE id = ? AND (user_id IS NULL OR user_id = 0)",
      [Number(userId), conversationId]
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
      term: "term"
    };
    const sets = [];
    const values = [];

    for (const [key, column] of Object.entries(mappings)) {
      if (!(key in changes)) continue;
      sets.push(`${column} = ?`);
      values.push(changes[key]);
    }

    if (!sets.length) {
      return getConversationById(conversationId);
    }

    await pool.execute(
      `UPDATE conversations SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, String(conversationId)]
    );

    return getConversationById(conversationId);
  }

  async function getOrCreateConversation(payload = {}) {
    const conversationId = String(payload.conversation_id || "").trim();
    const guestSessionId = String(payload.guest_session_id || "").trim();
    const userId = payload.user_id ? Number(payload.user_id) : null;

    if (conversationId) {
      const existing = await getConversationById(conversationId);
      if (existing) {
        const nextChanges = {};
        if (userId && !existing.user_id) nextChanges.user_id = userId;
        if (payload.project_id && String(existing.project_id || "") !== String(payload.project_id)) {
          nextChanges.project_id = Number(payload.project_id);
        }
        if (payload.subject && !existing.subject) nextChanges.subject = String(payload.subject).trim();
        if (payload.stage && !existing.stage) nextChanges.stage = String(payload.stage).trim();
        if (payload.grade && !existing.grade) nextChanges.grade = String(payload.grade).trim();
        if (payload.term && !existing.term) nextChanges.term = String(payload.term).trim();
        if (payload.title && !existing.title) nextChanges.title = String(payload.title).trim().slice(0, 255);
        if (Object.keys(nextChanges).length) {
          return updateConversationContext(existing.id, nextChanges);
        }
        if (userId) await assignConversationUser(existing.id, userId);
        return getConversationById(existing.id);
      }
    }

    if (guestSessionId) {
      const existing = await getConversationByGuestSessionId(guestSessionId);
      if (existing) {
        const nextChanges = {};
        if (userId && !existing.user_id) nextChanges.user_id = userId;
        if (payload.project_id && String(existing.project_id || "") !== String(payload.project_id)) {
          nextChanges.project_id = Number(payload.project_id);
        }
        if (Object.keys(nextChanges).length) {
          return updateConversationContext(existing.id, nextChanges);
        }
        if (userId) await assignConversationUser(existing.id, userId);
        return getConversationById(existing.id);
      }
    }

    return createConversation(payload);
  }

  async function saveMessage(conversationId, role, body, source = "web") {
    await pool.execute(
      "INSERT INTO messages (conversation_id, role, body, source) VALUES (?, ?, ?, ?)",
      [conversationId, role, body, source]
    );

    await pool.execute(
      "UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?",
      [conversationId]
    );
  }

  async function listMessages(conversationId, limit = 10) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
    const [rows] = await pool.execute(
      `
        SELECT role, body, source, created_at
        FROM messages
        WHERE conversation_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ${safeLimit}
      `,
      [conversationId]
    );

    return rows.reverse().map((row) => ({
      role: row.role,
      text: row.body,
      source: row.source,
      created_at: row.created_at
    }));
  }

  async function listRecentConversations(limit = 20) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
    const [rows] = await pool.execute(
      `
        SELECT id, guest_session_id, user_id, project_id, title, subject, stage, grade, term, status, last_message_at, created_at, updated_at
        FROM conversations
        ORDER BY COALESCE(last_message_at, created_at) DESC
        LIMIT ${safeLimit}
      `
    );
    return rows;
  }

  async function listUserConversations(userId, options = {}) {
    const safeLimit = Math.max(1, Math.min(Number(options.limit || 20), 100));
    const params = [Number(userId)];
    let whereClause = "WHERE user_id = ?";

    if (options.project_id) {
      whereClause += " AND project_id = ?";
      params.push(Number(options.project_id));
    }

    const [rows] = await pool.execute(
      `
        SELECT id, guest_session_id, user_id, project_id, title, subject, stage, grade, term, status, last_message_at, created_at, updated_at
        FROM conversations
        ${whereClause}
        ORDER BY COALESCE(last_message_at, created_at) DESC
        LIMIT ${safeLimit}
      `,
      params
    );
    return rows;
  }

  async function findPackageById(packageId) {
    const [rows] = await pool.execute(
      "SELECT * FROM app_packages WHERE id = ? LIMIT 1",
      [Number(packageId)]
    );
    return normalizePackageRow(rows[0] || null);
  }

  async function findDefaultPackage() {
    const [rows] = await pool.execute(
      `
        SELECT *
        FROM app_packages
        WHERE is_default = 1
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
      "التمهيدية": "starter",
      free: "starter",
      starter: "starter",
      "برو": "pro",
      pro: "pro",
      "برو بلس": "pro_plus",
      "pro plus": "pro_plus",
      pro_plus: "pro_plus",
      "برو ماكس": "pro_max",
      "pro max": "pro_max",
      pro_max: "pro_max"
    };

    const packageKey = aliasMap[normalized] || normalized;
    const [rows] = await pool.execute(
      `
        SELECT *
        FROM app_packages
        WHERE LOWER(package_key) = ?
           OR LOWER(display_name) = ?
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

  async function listPackages(options = {}) {
    const includeInactive = Boolean(options.include_inactive);
    const whereClause = includeInactive ? "" : "WHERE is_active = 1";
    const [rows] = await pool.execute(
      `
        SELECT *
        FROM app_packages
        ${whereClause}
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
    const sets = [];
    const values = [];

    for (const [key, column] of Object.entries(mappings)) {
      if (!(key in changes)) continue;
      sets.push(`${column} = ?`);
      if (key === "is_active" || key === "is_default") {
        values.push(changes[key] ? 1 : 0);
      } else if (key === "benefits") {
        values.push(serializeBenefits(changes[key]));
      } else {
        values.push(changes[key]);
      }
    }

    if (!sets.length) return current;

    await pool.execute(
      `UPDATE app_packages SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, Number(packageId)]
    );

    if (changes.is_default) {
      await pool.execute("UPDATE app_packages SET is_default = 0 WHERE id <> ?", [Number(packageId)]);
      await pool.execute("UPDATE app_packages SET is_default = 1 WHERE id = ?", [Number(packageId)]);
    }

    return findPackageById(packageId);
  }

  async function findUserByEmail(email) {
    const [rows] = await pool.execute(
      `
        SELECT ${getUserSelectClause("u", "p")}
        FROM app_users u
        LEFT JOIN app_packages p ON p.id = u.package_id
        WHERE u.email = ? LIMIT 1
      `,
      [String(email || "").trim().toLowerCase()]
    );
    return hydrateUserRow(rows[0] || null);
  }

  async function findUserById(userId) {
    const [rows] = await pool.execute(
      `
        SELECT ${getUserSelectClause("u", "p")}
        FROM app_users u
        LEFT JOIN app_packages p ON p.id = u.package_id
        WHERE u.id = ? LIMIT 1
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
        (String(payload.role || "").trim().toLowerCase() === "student" ? "التمهيدية" : "إدارة المنصة")
      ).trim(),
      package_started_at: assignmentWindow.package_started_at,
      package_expires_at: assignmentWindow.package_expires_at,
      xp: Number.isFinite(Number(payload.xp)) ? Number(payload.xp) : 100,
      streak_days: Number.isFinite(Number(payload.streak_days)) ? Number(payload.streak_days) : 0,
      motivation_score: Number.isFinite(Number(payload.motivation_score)) ? Number(payload.motivation_score) : 0,
      last_active_date: payload.last_active_date || null,
      achievements: JSON.stringify(normalizeAchievements(payload.achievements)),
      status: String(payload.status || "active").trim().toLowerCase() || "active",
      activity: String(payload.activity || "").trim() || null
    };

    const [result] = await pool.execute(
      `
        INSERT INTO app_users (
          name, email, password_hash, role, stage, grade, subject, package_id, package_name, package_started_at, package_expires_at,
          xp, streak_days, motivation_score, last_active_date, achievements, status, activity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        insertPayload.package_started_at,
        insertPayload.package_expires_at,
        insertPayload.xp,
        insertPayload.streak_days,
        insertPayload.motivation_score,
        insertPayload.last_active_date,
        insertPayload.achievements,
        insertPayload.status,
        insertPayload.activity
      ]
    );

    return findUserById(result.insertId);
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
    if ("email" in nextChanges) {
      nextChanges.email = String(nextChanges.email || "").trim().toLowerCase();
    }
    if ("role" in nextChanges) {
      nextChanges.role = String(nextChanges.role || "student").trim().toLowerCase() || "student";
    }
    if ("status" in nextChanges) {
      nextChanges.status = String(nextChanges.status || "active").trim().toLowerCase() || "active";
    }
    if ("last_active_date" in nextChanges) {
      nextChanges.last_active_date = nextChanges.last_active_date || null;
    }
    if ("package_started_at" in nextChanges) {
      nextChanges.package_started_at = toSqlDateTime(nextChanges.package_started_at);
    }
    if ("package_expires_at" in nextChanges) {
      nextChanges.package_expires_at = toSqlDateTime(nextChanges.package_expires_at);
    }

    const { sets, values } = buildUserUpdateStatement(nextChanges);
    if (!sets.length) {
      return current;
    }

    await pool.execute(
      `UPDATE app_users SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, Number(userId)]
    );

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
      where.push("(LOWER(name) LIKE ? OR LOWER(email) LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      where.push("role = ?");
      params.push(role);
    }

    if (status) {
      where.push("status = ?");
      params.push(status);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM app_users ${whereClause}`,
      params
    );
    const total = Number(countRows?.[0]?.total || 0);

    const [rows] = await pool.execute(
      `
        SELECT ${getUserSelectClause("u", "p")}
        FROM app_users u
        LEFT JOIN app_packages p ON p.id = u.package_id
        ${whereClause}
        ORDER BY u.created_at DESC, u.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
      params
    );

    return {
      items: rows.map(hydrateUserRow),
      total
    };
  }

  async function createApiToken(payload = {}) {
    await pool.execute(
      `
        INSERT INTO app_api_tokens (user_id, name, token_hash, last_used_at, expires_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
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
    const [rows] = await pool.execute(
      `
        SELECT
          ${getUserSelectClause("u", "p")},
          t.id AS token_id,
          t.last_used_at AS token_last_used_at,
          t.expires_at AS token_expires_at
        FROM app_api_tokens t
        INNER JOIN app_users u ON u.id = t.user_id
        LEFT JOIN app_packages p ON p.id = u.package_id
        WHERE t.token_hash = ?
          AND (t.expires_at IS NULL OR t.expires_at > CURRENT_TIMESTAMP)
        LIMIT 1
      `,
      [String(tokenHash || "").trim()]
    );

    return hydrateUserRow(rows[0] || null);
  }

  async function touchApiToken(tokenHash) {
    await pool.execute(
      "UPDATE app_api_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?",
      [String(tokenHash || "").trim()]
    );
  }

  async function revokeApiToken(tokenHash) {
    await pool.execute(
      "DELETE FROM app_api_tokens WHERE token_hash = ?",
      [String(tokenHash || "").trim()]
    );
  }

  async function findProjectById(projectId, userId = null) {
    const params = [Number(projectId)];
    let whereClause = "id = ?";
    if (userId != null) {
      whereClause += " AND user_id = ?";
      params.push(Number(userId));
    }

    const [rows] = await pool.execute(
      `SELECT * FROM app_projects WHERE ${whereClause} LIMIT 1`,
      params
    );
    return rows[0] || null;
  }

  async function listProjects(userId, options = {}) {
    const safeLimit = Math.max(1, Math.min(Number(options.limit || 50), 200));
    const includeArchived = Boolean(options.include_archived);
    const params = [Number(userId)];
    let whereClause = "WHERE p.user_id = ?";

    if (!includeArchived) {
      whereClause += " AND p.is_archived = 0";
    }

    const [rows] = await pool.execute(
      `
        SELECT
          p.*,
          COUNT(c.id) AS conversations_count,
          MAX(COALESCE(c.last_message_at, c.updated_at, c.created_at)) AS last_activity_at
        FROM app_projects p
        LEFT JOIN conversations c ON c.project_id = p.id
        ${whereClause}
        GROUP BY p.id
        ORDER BY COALESCE(last_activity_at, p.updated_at, p.created_at) DESC
        LIMIT ${safeLimit}
      `,
      params
    );

    return rows.map((row) => ({
      ...row,
      conversations_count: Number(row.conversations_count || 0),
      is_archived: Boolean(row.is_archived)
    }));
  }

  async function createProject(payload = {}) {
    const [result] = await pool.execute(
      `
        INSERT INTO app_projects (
          user_id, title, subject, stage, grade, term, lesson, description, is_archived
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        payload.is_archived ? 1 : 0
      ]
    );
    return findProjectById(result.insertId, payload.user_id);
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
    const sets = [];
    const values = [];

    for (const [key, column] of Object.entries(mappings)) {
      if (!(key in changes)) continue;
      sets.push(`${column} = ?`);
      values.push(key === "is_archived" ? (changes[key] ? 1 : 0) : changes[key]);
    }

    if (!sets.length) return current;

    await pool.execute(
      `UPDATE app_projects SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [...values, Number(projectId), Number(userId)]
    );
    return findProjectById(projectId, userId);
  }

  async function getGuestUsage(guestSessionId) {
    const [rows] = await pool.execute(
      "SELECT * FROM app_guest_usage WHERE guest_session_id = ? LIMIT 1",
      [String(guestSessionId || "").trim()]
    );
    const row = rows[0] || null;
    if (!row) return null;

    const today = getTodayDateStamp();
    const usageDate = row.usage_date ? String(row.usage_date).slice(0, 10) : "";
    if (usageDate && usageDate === today) {
      return row;
    }

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
    await pool.execute(
      `
        INSERT INTO app_guest_usage (guest_session_id, messages_count, usage_date, last_message_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          messages_count = IF(
            usage_date = VALUES(usage_date),
            messages_count + VALUES(messages_count),
            VALUES(messages_count)
          ),
          usage_date = VALUES(usage_date),
          last_message_at = CURRENT_TIMESTAMP
      `,
      [safeGuestSessionId, safeAmount, today]
    );
    return getGuestUsage(safeGuestSessionId);
  }

  async function getAdminStats() {
    const [[userCountsRow]] = await pool.query(`
      SELECT
        COUNT(*) AS users_count,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) AS students_count,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admins_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_users_count
      FROM app_users
    `);

    const [[conversationRow]] = await pool.query(`
      SELECT COUNT(*) AS conversations_count
      FROM conversations
    `);

    const [[messageRow]] = await pool.query(`
      SELECT COUNT(*) AS messages_count
      FROM messages
    `);

    const [[projectRow]] = await pool.query(`
      SELECT COUNT(*) AS projects_count
      FROM app_projects
      WHERE is_archived = 0
    `);

    const [[packageRow]] = await pool.query(`
      SELECT COUNT(*) AS packages_count
      FROM app_packages
      WHERE is_active = 1
    `);

    return {
      users_count: Number(userCountsRow?.users_count || 0),
      students_count: Number(userCountsRow?.students_count || 0),
      admins_count: Number(userCountsRow?.admins_count || 0),
      active_users_count: Number(userCountsRow?.active_users_count || 0),
      conversations_count: Number(conversationRow?.conversations_count || 0),
      messages_count: Number(messageRow?.messages_count || 0),
      projects_count: Number(projectRow?.projects_count || 0),
      packages_count: Number(packageRow?.packages_count || 0)
    };
  }

  async function getStudentDashboard(userId) {
    const user = await findUserById(userId);
    if (!user) return null;

    const [[conversationRow]] = await pool.execute(
      `
        SELECT COUNT(*) AS conversations_count
        FROM conversations
        WHERE user_id = ?
      `,
      [Number(userId)]
    );

    const [[messageRow]] = await pool.execute(
      `
        SELECT COUNT(*) AS messages_count
        FROM messages m
        INNER JOIN conversations c ON c.id = m.conversation_id
        WHERE c.user_id = ?
      `,
      [Number(userId)]
    );

    const [[projectRow]] = await pool.execute(
      `
        SELECT COUNT(*) AS projects_count
        FROM app_projects
        WHERE user_id = ? AND is_archived = 0
      `,
      [Number(userId)]
    );

    const projects = await listProjects(userId, { limit: 8 });
    const recentConversations = await listUserConversations(userId, { limit: 8 });

    return {
      user,
      stats: {
        conversations_count: Number(conversationRow?.conversations_count || 0),
        messages_count: Number(messageRow?.messages_count || 0),
        projects_count: Number(projectRow?.projects_count || 0)
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
    state.message = "MySQL connection closed.";
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
  createDatabaseClient
};
