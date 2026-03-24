/**
 * =====================================================
 * Conversation Model - 对话历史模型
 * =====================================================
 * 功能：管理用户与 AI 的多轮对话历史记录
 * 创建时间：2026-03-11
 * =====================================================
 */

const db = require('../config/db');

const Conversation = {
  /**
   * 创建对话记录
   * @param {string} session_id - 会话ID（UUID v4格式）
   * @param {string} role - 对话角色：'user' | 'assistant'
   * @param {string} content - 对话内容（用户输入或AI完整返回）
   * @param {number|null} image_id - 关联的图片ID（可选）
   * @returns {Promise<number>} 返回插入的记录ID
   */
  async create(session_id, role, content, image_id = null) {
    try {
      // 参数验证
      if (!session_id || typeof session_id !== 'string') {
        throw new Error('Invalid session_id: must be a non-empty string');
      }
      if (!['user', 'assistant'].includes(role)) {
        throw new Error('Invalid role: must be "user" or "assistant"');
      }
      if (typeof content !== 'string') {
        throw new Error('Invalid content: must be a string');
      }
      // 允许 assistant 角色使用空内容（占位符），但 user 角色必须有内容
      if (role === 'user' && !content) {
        throw new Error('Invalid content: user message must be non-empty');
      }

      const [result] = await db.query(
        'INSERT INTO conversations (session_id, role, content, image_id) VALUES (?, ?, ?, ?)',
        [session_id, role, content, image_id]
      );

      return result.insertId;
    } catch (error) {
      console.error('[Conversation.create] Error:', error.message);
      throw error;
    }
  },

  /**
   * 根据会话ID获取对话历史
   * @param {string} session_id - 会话ID
   * @param {number} limit - 最多返回的记录数（默认10条，避免超过API token限制）
   * @returns {Promise<Array>} 返回对话历史数组，按时间升序排列
   *
   * 返回格式：
   * [
   *   { id, session_id, role: 'user', content: '...', image_id, created_at },
   *   { id, session_id, role: 'assistant', content: '...', image_id, created_at },
   *   ...
   * ]
   */
  async getBySessionId(session_id, limit = 10) {
    try {
      // 参数验证
      if (!session_id || typeof session_id !== 'string') {
        throw new Error('Invalid session_id: must be a non-empty string');
      }

      const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));

      // 查询最近的 N 条记录，按时间升序排列（旧 -> 新）
      // 使用子查询先按时间降序取最近的记录，再反转顺序
      const [rows] = await db.query(
        `SELECT id, session_id, role, content, image_id, created_at
         FROM (
           SELECT id, session_id, role, content, image_id, created_at
           FROM conversations
           WHERE session_id = ?
           ORDER BY created_at DESC, id DESC
           LIMIT ?
         ) AS recent
         ORDER BY created_at ASC, id ASC`,
        [session_id, safeLimit]
      );

      return rows;
    } catch (error) {
      console.error('[Conversation.getBySessionId] Error:', error.message);
      // 降级处理：查询失败时返回空数组，不阻塞主流程
      return [];
    }
  },

  /**
   * 检查会话是否存在
   * @param {string} session_id - 会话ID
   * @returns {Promise<boolean>} 返回会话是否存在
   */
  async exists(session_id) {
    try {
      if (!session_id || typeof session_id !== 'string') {
        return false;
      }

      const [[row]] = await db.query(
        'SELECT COUNT(*) AS count FROM conversations WHERE session_id = ? LIMIT 1',
        [session_id]
      );

      return row.count > 0;
    } catch (error) {
      console.error('[Conversation.exists] Error:', error.message);
      return false;
    }
  },

  /**
   * 获取会话的消息数量
   * @param {string} session_id - 会话ID
   * @returns {Promise<number>} 返回消息数量
   */
  async countBySessionId(session_id) {
    try {
      if (!session_id || typeof session_id !== 'string') {
        return 0;
      }

      const [[row]] = await db.query(
        'SELECT COUNT(*) AS count FROM conversations WHERE session_id = ?',
        [session_id]
      );

      return row.count;
    } catch (error) {
      console.error('[Conversation.countBySessionId] Error:', error.message);
      return 0;
    }
  },

  /**
   * 更新指定会话的最后一条 assistant 消息
   * @param {string} session_id - 会话ID
   * @param {string} content - 新的内容
   * @param {number|null} image_id - 关联的图片ID（可选）
   * @returns {Promise<boolean>} 返回是否更新成功
   */
  async updateLastAssistantMessage(session_id, content, image_id = null) {
    try {
      // 参数验证
      if (!session_id || typeof session_id !== 'string') {
        throw new Error('Invalid session_id: must be a non-empty string');
      }
      if (typeof content !== 'string') {
        throw new Error('Invalid content: must be a string');
      }

      // 更新最后一条 assistant 消息
      const [result] = await db.query(
        `UPDATE conversations
         SET content = ?, image_id = ?
         WHERE session_id = ?
         AND role = 'assistant'
         ORDER BY created_at DESC, id DESC
         LIMIT 1`,
        [content, image_id, session_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('[Conversation.updateLastAssistantMessage] Error:', error.message);
      throw error;
    }
  },

  /**
   * 删除过期的对话记录（数据清理）
   * @param {number} days - 保留最近多少天的记录（默认30天）
   * @returns {Promise<number>} 返回删除的记录数
   *
   * 使用场景：
   * - 定时任务：每天凌晨执行，清理过期数据
   * - 手动清理：管理员手动触发
   */
  async deleteOldRecords(days = 30) {
    try {
      const safeDays = Math.max(1, Number(days) || 30);

      const [result] = await db.query(
        'DELETE FROM conversations WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [safeDays]
      );

      const deletedCount = result.affectedRows;
      if (deletedCount > 0) {
        console.log(`[Conversation.deleteOldRecords] Deleted ${deletedCount} records older than ${safeDays} days`);
      }

      return deletedCount;
    } catch (error) {
      console.error('[Conversation.deleteOldRecords] Error:', error.message);
      throw error;
    }
  },

  /**
   * 删除指定会话的所有记录
   * @param {string} session_id - 会话ID
   * @returns {Promise<number>} 返回删除的记录数
   */
  async deleteBySessionId(session_id) {
    try {
      if (!session_id || typeof session_id !== 'string') {
        throw new Error('Invalid session_id: must be a non-empty string');
      }

      const [result] = await db.query(
        'DELETE FROM conversations WHERE session_id = ?',
        [session_id]
      );

      return result.affectedRows;
    } catch (error) {
      console.error('[Conversation.deleteBySessionId] Error:', error.message);
      throw error;
    }
  },

  /**
   * 获取会话统计信息
   * @returns {Promise<Object>} 返回统计信息
   *
   * 返回格式：
   * {
   *   totalSessions: 100,      // 总会话数
   *   totalMessages: 500,      // 总消息数
   *   avgMessagesPerSession: 5 // 平均每个会话的消息数
   * }
   */
  async getStats() {
    try {
      const [[stats]] = await db.query(`
        SELECT
          COUNT(DISTINCT session_id) AS totalSessions,
          COUNT(*) AS totalMessages,
          ROUND(COUNT(*) / COUNT(DISTINCT session_id), 2) AS avgMessagesPerSession
        FROM conversations
      `);

      return {
        totalSessions: stats.totalSessions || 0,
        totalMessages: stats.totalMessages || 0,
        avgMessagesPerSession: stats.avgMessagesPerSession || 0,
      };
    } catch (error) {
      console.error('[Conversation.getStats] Error:', error.message);
      return {
        totalSessions: 0,
        totalMessages: 0,
        avgMessagesPerSession: 0,
      };
    }
  },
};

module.exports = Conversation;

/**
 * =====================================================
 * 性能优化说明
 * =====================================================
 * 1. 参数验证：所有方法都进行参数验证，避免无效查询
 * 2. 错误处理：查询失败时降级处理，不阻塞主流程
 * 3. 索引利用：查询使用 session_id 和 created_at 索引
 * 4. 限制查询：getBySessionId 限制最多返回100条记录
 * 5. 子查询优化：使用子查询实现"取最近N条并升序排列"
 * =====================================================
 *
 * 扩展性说明
 * =====================================================
 * 1. 可扩展用户级别的会话隔离（添加 user_id 字段）
 * 2. 可扩展会话元数据（添加 metadata JSON 字段）
 * 3. 可扩展软删除功能（添加 deleted_at 字段）
 * 4. 可扩展会话标题/描述（添加 title/description 字段）
 * =====================================================
 */
