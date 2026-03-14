/**
 * =====================================================
 * ImageGenerationRecord Model - 图片生成记录模型
 * =====================================================
 * 功能：管理图片生成记录（文生图、图生图等）
 * 创建时间：2026-03-13
 * =====================================================
 */

const db = require('../config/db');

const ImageGenerationRecord = {
  /**
   * 创建生成记录
   * @param {Object} data - 记录数据
   * @param {string} data.session_id - 会话ID（UUID v4）
   * @param {number} data.user_id - 用户ID
   * @param {string} data.generation_type - 生成类型（text-to-image/image-to-image）
   * @param {string} data.prompt - 提示词（可选）
   * @param {string} data.source_image_url - 源图片URL（可选）
   * @param {string} data.model - 模型名称
   * @param {string} data.size - 图片尺寸
   * @param {string} data.quality - 图片质量
   * @param {string} data.style - 图片风格
   * @param {number} data.n - 生成数量
   * @param {string} data.third_party_url - 第三方URL（可选）
   * @param {string} data.upload_task_id - 上传任务ID（可选）
   * @param {string} data.status - 状态
   * @returns {Promise<number>} 返回插入的记录ID
   */
  async create(data) {
    try {
      const {
        session_id,
        user_id,
        generation_type = 'text-to-image',
        prompt,
        source_image_url,
        model,
        size,
        quality,
        style,
        n,
        third_party_url,
        upload_task_id,
        status = 'pending',
      } = data;

      // 参数验证
      if (!session_id || !user_id) {
        throw new Error('session_id and user_id are required');
      }

      const [result] = await db.query(
        `INSERT INTO image_generation_records
         (session_id, user_id, generation_type, prompt, source_image_url, model, size, quality, style, n, third_party_url, upload_task_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session_id,
          user_id,
          generation_type,
          prompt || null,
          source_image_url || null,
          model,
          size,
          quality,
          style,
          n,
          third_party_url || null,
          upload_task_id || null,
          status,
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('[ImageGenerationRecord.create] Error:', error.message);
      throw error;
    }
  },

  /**
   * 更新 COS URL 和状态
   * @param {number} id - 记录ID
   * @param {string} cosUrl - COS URL
   * @param {string} status - 状态
   * @returns {Promise<boolean>} 返回是否更新成功
   */
  async updateCosUrl(id, cosUrl, status = 'uploaded') {
    try {
      const [result] = await db.query(
        'UPDATE image_generation_records SET cos_url = ?, status = ? WHERE id = ?',
        [cosUrl, status, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('[ImageGenerationRecord.updateCosUrl] Error:', error.message);
      throw error;
    }
  },

  /**
   * 更新状态
   * @param {number} id - 记录ID
   * @param {string} status - 状态
   * @param {string} errorMessage - 错误信息（可选）
   * @returns {Promise<boolean>} 返回是否更新成功
   */
  async updateStatus(id, status, errorMessage = null) {
    try {
      const [result] = await db.query(
        'UPDATE image_generation_records SET status = ?, error_message = ? WHERE id = ?',
        [status, errorMessage, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('[ImageGenerationRecord.updateStatus] Error:', error.message);
      throw error;
    }
  },

  /**
   * 根据 session_id 查询记录
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object|null>} 返回记录信息
   */
  async findBySessionId(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('Invalid sessionId');
      }

      const [[record]] = await db.query(
        'SELECT * FROM image_generation_records WHERE session_id = ?',
        [sessionId]
      );

      return record || null;
    } catch (error) {
      console.error('[ImageGenerationRecord.findBySessionId] Error:', error.message);
      return null;
    }
  },

  /**
   * 根据 upload_task_id 查询记录
   * @param {string} taskId - 上传任务ID
   * @returns {Promise<Object|null>} 返回记录信息
   */
  async findByUploadTaskId(taskId) {
    try {
      if (!taskId) {
        throw new Error('Invalid taskId');
      }

      const [[record]] = await db.query(
        'SELECT * FROM image_generation_records WHERE upload_task_id = ?',
        [taskId]
      );

      return record || null;
    } catch (error) {
      console.error('[ImageGenerationRecord.findByUploadTaskId] Error:', error.message);
      return null;
    }
  },

  /**
   * 查询用户的生成历史
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @param {string} options.generation_type - 生成类型筛选（可选）
   * @param {number} options.page - 页码（默认1）
   * @param {number} options.limit - 每页数量（默认10）
   * @returns {Promise<Object>} 返回记录列表和总数
   */
  async listByUserId(userId, options = {}) {
    try {
      if (!userId) {
        throw new Error('Invalid userId');
      }

      const page = Math.max(1, Number(options.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
      const offset = (page - 1) * limit;

      let whereClause = 'user_id = ?';
      const params = [userId];

      if (options.generation_type) {
        whereClause += ' AND generation_type = ?';
        params.push(options.generation_type);
      }

      // 查询总数
      const [[{ total }]] = await db.query(
        `SELECT COUNT(*) as total FROM image_generation_records WHERE ${whereClause}`,
        params
      );

      // 查询列表
      const [records] = await db.query(
        `SELECT * FROM image_generation_records
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return {
        total,
        page,
        limit,
        data: records,
      };
    } catch (error) {
      console.error('[ImageGenerationRecord.listByUserId] Error:', error.message);
      return {
        total: 0,
        page: 1,
        limit: 10,
        data: [],
      };
    }
  },

  /**
   * 删除过期记录
   * @param {number} days - 保留最近多少天的记录（默认30天）
   * @returns {Promise<number>} 返回删除的记录数
   */
  async deleteOldRecords(days = 30) {
    try {
      const safeDays = Math.max(1, Number(days) || 30);

      const [result] = await db.query(
        'DELETE FROM image_generation_records WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [safeDays]
      );

      const deletedCount = result.affectedRows;
      if (deletedCount > 0) {
        console.log(`[ImageGenerationRecord.deleteOldRecords] Deleted ${deletedCount} records older than ${safeDays} days`);
      }

      return deletedCount;
    } catch (error) {
      console.error('[ImageGenerationRecord.deleteOldRecords] Error:', error.message);
      throw error;
    }
  },
};

module.exports = ImageGenerationRecord;

/**
 * =====================================================
 * 使用说明
 * =====================================================
 * 1. 创建记录时，session_id 和 user_id 必填
 * 2. generation_type 默认为 'text-to-image'
 * 3. 文生图时 prompt 必填，图生图时 source_image_url 必填
 * 4. 状态流转：pending → uploaded/failed
 * =====================================================
 */
