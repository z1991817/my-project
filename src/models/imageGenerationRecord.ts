/**
 * =====================================================
 * ImageGenerationRecord Model - 图片生成记录模型
 * =====================================================
 * 功能：管理图片生成记录（文生图、图生图等）
 * =====================================================
 */

import db from '../config/db';

/** 图片生成记录 */
export interface ImageGenerationRecordData {
  id?: number;
  session_id: string;
  user_id: number;
  generation_type?: 'text-to-image' | 'image-to-image';
  prompt?: string;
  source_image_url?: string;
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
  third_party_url?: string;
  cos_url?: string;
  upload_task_id?: string;
  status?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export const ImageGenerationRecord = {
  /**
   * 创建生成记录
   * @param data - 记录数据
   */
  async create(data: ImageGenerationRecordData): Promise<number> {
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

      if (!session_id || !user_id) throw new Error('session_id and user_id are required');

      const [result]: any = await db.query(
        `INSERT INTO image_generation_records
         (session_id, user_id, generation_type, prompt, source_image_url, model, size, quality, style, n, third_party_url, upload_task_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session_id, user_id, generation_type,
          prompt || null, source_image_url || null,
          model, size, quality, style, n,
          third_party_url || null, upload_task_id || null, status,
        ]
      );
      return result.insertId;
    } catch (error: any) {
      console.error('[ImageGenerationRecord.create] Error:', error.message);
      throw error;
    }
  },

  /**
   * 更新 COS URL 和状态
   * @param id - 记录ID
   * @param cosUrl - COS URL
   * @param status - 状态
   */
  async updateCosUrl(id: number, cosUrl: string, status = 'uploaded'): Promise<boolean> {
    try {
      const [result]: any = await db.query(
        'UPDATE image_generation_records SET cos_url = ?, status = ? WHERE id = ?',
        [cosUrl, status, id]
      );
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error('[ImageGenerationRecord.updateCosUrl] Error:', error.message);
      throw error;
    }
  },

  /**
   * 更新状态
   * @param id - 记录ID
   * @param status - 状态
   * @param errorMessage - 错误信息（可选）
   */
  async updateStatus(id: number, status: string, errorMessage: string | null = null): Promise<boolean> {
    try {
      const [result]: any = await db.query(
        'UPDATE image_generation_records SET status = ?, error_message = ? WHERE id = ?',
        [status, errorMessage, id]
      );
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error('[ImageGenerationRecord.updateStatus] Error:', error.message);
      throw error;
    }
  },

  /**
   * 根据 session_id 查询记录
   * @param sessionId - 会话ID
   */
  async findBySessionId(sessionId: string): Promise<ImageGenerationRecordData | null> {
    try {
      if (!sessionId) throw new Error('Invalid sessionId');
      const [[record]]: any = await db.query(
        'SELECT * FROM image_generation_records WHERE session_id = ?',
        [sessionId]
      );
      return record || null;
    } catch (error: any) {
      console.error('[ImageGenerationRecord.findBySessionId] Error:', error.message);
      return null;
    }
  },

  /**
   * 根据 upload_task_id 查询记录
   * @param taskId - 上传任务ID
   */
  async findByUploadTaskId(taskId: string): Promise<ImageGenerationRecordData | null> {
    try {
      if (!taskId) throw new Error('Invalid taskId');
      const [[record]]: any = await db.query(
        'SELECT * FROM image_generation_records WHERE upload_task_id = ?',
        [taskId]
      );
      return record || null;
    } catch (error: any) {
      console.error('[ImageGenerationRecord.findByUploadTaskId] Error:', error.message);
      return null;
    }
  },

  /**
   * 查询用户的生成历史
   * @param userId - 用户ID
   * @param options - 查询选项
   */
  async listByUserId(
    userId: number,
    options: { generation_type?: string; page?: number; limit?: number } = {}
  ) {
    try {
      if (!userId) throw new Error('Invalid userId');

      const page = Math.max(1, Number(options.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
      const offset = (page - 1) * limit;

      let whereClause = 'user_id = ?';
      const params: any[] = [userId];

      if (options.generation_type) {
        whereClause += ' AND generation_type = ?';
        params.push(options.generation_type);
      }

      const [[{ total }]]: any = await db.query(
        `SELECT COUNT(*) as total FROM image_generation_records WHERE ${whereClause}`,
        params
      );

      const [records]: any = await db.query(
        `SELECT * FROM image_generation_records WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return { total, page, limit, data: records };
    } catch (error: any) {
      console.error('[ImageGenerationRecord.listByUserId] Error:', error.message);
      return { total: 0, page: 1, limit: 10, data: [] };
    }
  },

  /**
   * 删除过期记录
   * @param days - 保留最近多少天（默认30）
   */
  async deleteOldRecords(days = 30): Promise<number> {
    try {
      const safeDays = Math.max(1, Number(days) || 30);
      const [result]: any = await db.query(
        'DELETE FROM image_generation_records WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [safeDays]
      );
      const deletedCount = result.affectedRows;
      if (deletedCount > 0) {
        console.log(`[ImageGenerationRecord.deleteOldRecords] Deleted ${deletedCount} records older than ${safeDays} days`);
      }
      return deletedCount;
    } catch (error: any) {
      console.error('[ImageGenerationRecord.deleteOldRecords] Error:', error.message);
      throw error;
    }
  },
};

export default ImageGenerationRecord;
