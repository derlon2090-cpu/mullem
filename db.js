const mysql = require("mysql2/promise");

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

  return {
    host,
    port,
    database,
    user,
    password
  };
}

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

    const adminConnection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
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
      title: String(payload.title || "").trim() || null,
      subject: String(payload.subject || "").trim() || null,
      stage: String(payload.stage || "").trim() || null,
      grade: String(payload.grade || "").trim() || null,
      term: String(payload.term || "").trim() || null
    };

    await pool.execute(
      `
        INSERT INTO conversations (
          id, guest_session_id, title, subject, stage, grade, term, status, last_message_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NULL)
      `,
      [
        conversation.id,
        conversation.guest_session_id,
        conversation.title,
        conversation.subject,
        conversation.stage,
        conversation.grade,
        conversation.term
      ]
    );

    return getConversationById(conversation.id);
  }

  async function getOrCreateConversation(payload = {}) {
    const conversationId = String(payload.conversation_id || "").trim();
    const guestSessionId = String(payload.guest_session_id || "").trim();

    if (conversationId) {
      const existing = await getConversationById(conversationId);
      if (existing) return existing;
    }

    if (guestSessionId) {
      const existing = await getConversationByGuestSessionId(guestSessionId);
      if (existing) return existing;
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
        SELECT id, guest_session_id, title, subject, stage, grade, term, status, last_message_at, created_at, updated_at
        FROM conversations
        ORDER BY COALESCE(last_message_at, created_at) DESC
        LIMIT ${safeLimit}
      `
    );
    return rows;
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
    getOrCreateConversation,
    saveMessage,
    listMessages,
    listRecentConversations,
    close
  };
}

module.exports = {
  createDatabaseClient
};
