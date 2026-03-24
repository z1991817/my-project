/**
 * =====================================================
 * Conversation Model - 对话历史模型
 * =====================================================
 * 功能：管理用户与 AI 的多轮对话历史记录
 * =====================================================
 */

import db from '../config/db';

/** 对话记录 */
export interface ConversationRecord {
  id: number;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  image_id?: number | null;
  created_at: string;
}

export const Conversation = {
  /**
   * 创建对话记录
   * @param session_id - 会话ID（UUID v4格式）
   * @param role - 角色：user | assistant
   * @param content - 对话内容
   * @param image_id - 关联图片ID（可选）
   */
  async create(
    session_id: string,
    role: 'user' | 'assistant',
    content: string,
    image_id: number | null = null
  ): Promise<number> {
    try {
      if (!session_id || typeof session_id !== 'string') throw new Error('Invalid session_id');
      if (!['user', 'assistant'].includes(role)) throw new Error('Invalid role');
      if (typeof content !== 'string') throw new Error('Invalid content');
      if (role === 'user' && !content) throw new Error('User message must be non-empty');

      const [result]: any = await db.query(
        'INSERT INTO conversations (session_id, role, content, image_id) VALUES (?, ?, ?, ?)',
        [session_id, role, content, image_id]
      );
      return result.insertId;
    } catch (error: any) {
      console.error('[Conversation.create] Error:', error.message);
      throw error;
    }
  },

  /**
   * 根据会话ID获取对话历史（升序）
   * @param session_id - 会话ID
   * @param limit - 最多返回记录数（默认10）
   */
  async getBySessionId(session_id: string, limit = 10): Promise<ConversationRecord[]> {
    try {
      if (!session_id || typeof session_id !== 'string') throw new Error('Invalid session_id');
      const safeLimit = Math.max(1, Math.min(100, Number(limit) || 10));
      const [rows]: any = await db.query(
        `SELECT id, session_id, role, content, image_id, created_at
         FROM (
           SELECT id, session_id, role, content, image_id, created_at
           FROM conversations WHERE session_id = ?
           ORDER BY created_at DESC, id DESC LIMIT ?
         ) AS recent ORDER BY created_at ASC, id ASC`,
        [session_id, safeLimit]
      );
      return rows;
    } catch (error: any) {
      console.error('[Conversation.getBySessionId] Error:', error.message);
      return [];
    }
  },

  /**
   * 检查会话是否存在
   * @param session_id - 会话ID
   */
  async exists(session_id: string): Promise<boolean> {
    try {
      if (!session_id || typeof session_id !== 'string') return false;
      const [[row]]: any = await db.query(
        'SELECT COUNT(*) AS count FROM conversations WHERE session_id = ? LIMIT 1',
        [session_id]
      );
      return row.count > 0;
    } catch (error: any) {
      console.error('[Conversation.exists] Error:', error.message);
      return false;
    }
  },

  /**
   * 获取会话消息数量
   * @param session_id - 会话ID
   */
  async countBySessionId(session_id: string): Promise<number> {
    try {
      if (!session_id || typeof session_id !== 'string') return 0;
      const [[row]]: any = await db.query(
        'SELECT COUNT(*) AS count FROM conversations WHERE session_id = ?',
        [session_id]
      );
      return row.count;
    } catch (error: any) {
      console.error('[Conversation.countBySessionId] Error:', error.message);
      return 0;
    }
  },

  /**
   * 更新指定会话最后一条 assistant 消息
   * @param session_id - 会话ID
   * @param content - 新内容
   * @param image_id - 关联图片ID（可选）
   */
  async updateLastAssistantMessage(
    session_id: string,
    content: string,
    image_id: number | null = null
  ): Promise<boolean> {
    try {
      if (!session_id || typeof session_id !== 'string') throw new Error('Invalid session_id');
      if (typeof content !== 'string') throw new Error('Invalid content');

      const [result]: any = await db.query(
        `UPDATE conversations SET content = ?, image_id = ?
         WHERE session_id = ? AND role = 'assistant'
         ORDER BY created_at DESC, id DESC LIMIT 1`,
        [content, image_id, session_id]
      );
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error('[Conversation.updateLastAssistantMessage] Error:', error.message);
      throw error;
    }
  },

  /**
   * 删除过期对话记录
   * @param days - 保留最近多少天（默认30）
   */
  async deleteOldRecords(days = 30): Promise<number> {
    try {
      const safeDays = Math.max(1, Number(days) || 30);
      const [result]: any = await db.query(
        'DELETE FROM conversations WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [safeDays]
      );
      const deletedCount = result.affectedRows;
      if (deletedCount > 0) {
        console.log(`[Conversation.deleteOldRecords] Deleted ${deletedCount} records older than ${safeDays} days`);
      }
      return deletedCount;
    } catch (error: any) {
      console.error('[Conversation.deleteOldRecords] Error:', error.message);
      throw error;
    }
  },

  /**
   * 删除指定会话的所有记录
   * @param session_id - 会话ID
   */
  async deleteBySessionId(session_id: string): Promise<number> {
    try {
      if (!session_id || typeof session_id !== 'string') throw new Error('Invalid session_id');
      const [result]: any = await db.query(
        'DELETE FROM conversations WHERE session_id = ?',
        [session_id]
      );
      return result.affectedRows;
    } catch (error: any) {
      console.error('[Conversation.deleteBySessionId] Error:', error.message);
      throw error;
    }
  },

  /** 获取会话统计信息 */
  async getStats(): Promise<{ totalSessions: number; totalMessages: number; avgMessagesPerSession: number }> {
    try {
      const [[stats]]: any = await db.query(`
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
    } catch (error: any) {
      console.error('[Conversation.getStats] Error:', error.message);
      return { totalSessions: 0, totalMessages: 0, avgMessagesPerSession: 0 };
    }
  },
};

export default Conversation;
