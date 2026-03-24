/**
 * =====================================================
 * Image Model - 图片模型
 * =====================================================
 */

import db from '../config/db';

/** 图片记录 */
export interface ImageRecord {
  id: number;
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  prompt?: string;
  category_id?: number;
  category_name?: string;
  source_url?: string;
  upload_task_id?: string;
  upload_status?: string;
  upload_error?: string;
  uploaded_at?: string;
  created_at: string;
  updated_at?: string;
}

export const Image = {
  /**
   * 获取图片列表（支持分页和筛选）
   */
  async list({
    category_id,
    description,
    page = 1,
    pageSize = 10,
    title,
  }: {
    category_id?: number;
    description?: string;
    page?: number;
    pageSize?: number;
    title?: string;
  }) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const params: any[] = [];

    if (category_id) { conditions.push('category_id = ?'); params.push(category_id); }
    if (description) { conditions.push('description LIKE ?'); params.push(`%${description}%`); }
    if (title) { conditions.push('title LIKE ?'); params.push(`%${title}%`); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }], [rows]]: any = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM images ${whereClause}`, params),
      db.query(
        `SELECT i.id, i.url, i.thumbnail, i.title, i.description, i.prompt, i.category_id,
         c.name AS category_name,
         DATE_FORMAT(i.uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at,
         DATE_FORMAT(i.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
         FROM images i LEFT JOIN categories c ON i.category_id = c.id
         ${whereClause} ORDER BY i.uploaded_at DESC, i.id DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      ),
    ]);

    return { total, list: rows };
  },

  /**
   * 根据 ID 获取图片详情
   * @param id - 图片ID
   */
  async findById(id: number): Promise<ImageRecord | null> {
    const [rows]: any = await db.query(
      `SELECT i.id, i.url, i.thumbnail, i.title, i.description, i.prompt, i.category_id,
       c.name AS category_name, i.uploaded_at, i.created_at, i.updated_at
       FROM images i LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ? LIMIT 1`,
      [id]
    );
    return (rows as ImageRecord[])[0] || null;
  },

  /**
   * 创建图片
   */
  async create({
    url,
    description,
    prompt,
    category_id,
    title,
  }: {
    url: string;
    description?: string;
    prompt?: string;
    category_id?: number;
    title?: string;
  }): Promise<number> {
    const [result]: any = await db.query(
      'INSERT INTO images (url, description, prompt, category_id, title) VALUES (?, ?, ?, ?, ?)',
      [url, description, prompt, category_id, title]
    );
    return result.insertId;
  },

  /**
   * 创建 OpenAI 生成图记录（绑定上传任务）
   */
  async createFromOpenAITask(data: {
    url: string;
    source_url?: string;
    thumbnail?: string;
    title?: string;
    description?: string;
    prompt?: string;
    category_id?: number;
    upload_task_id?: string;
    upload_status?: string;
    upload_error?: string;
  }): Promise<number> {
    const [result]: any = await db.query(
      `INSERT INTO images (url, source_url, thumbnail, title, description, prompt, category_id,
        upload_task_id, upload_status, upload_error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.url,
        data.source_url || null,
        data.thumbnail || null,
        data.title || null,
        data.description || null,
        data.prompt || null,
        data.category_id || null,
        data.upload_task_id || null,
        data.upload_status || null,
        data.upload_error || null,
      ]
    );
    return result.insertId;
  },

  /**
   * 更新图片
   * @param id - 图片ID
   * @param data - 更新数据
   */
  async update(
    id: number,
    data: { url?: string; title?: string; description?: string; prompt?: string; category_id?: number }
  ): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.url !== undefined) { fields.push('url = ?'); params.push(data.url); }
    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.prompt !== undefined) { fields.push('prompt = ?'); params.push(data.prompt); }
    if (data.category_id !== undefined) { fields.push('category_id = ?'); params.push(data.category_id); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result]: any = await db.query(
      `UPDATE images SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  /**
   * 更新 OpenAI 上传任务状态
   */
  async updateOpenAIUpload(
    id: number,
    data: { url?: string; upload_status?: string; upload_error?: string; thumbnail?: string }
  ): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.url !== undefined) { fields.push('url = ?'); params.push(data.url); }
    if (data.upload_status !== undefined) { fields.push('upload_status = ?'); params.push(data.upload_status); }
    if (data.upload_error !== undefined) { fields.push('upload_error = ?'); params.push(data.upload_error); }
    if (data.thumbnail !== undefined) { fields.push('thumbnail = ?'); params.push(data.thumbnail); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result]: any = await db.query(
      `UPDATE images SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  /**
   * 删除图片
   * @param id - 图片ID
   */
  async delete(id: number): Promise<boolean> {
    const [result]: any = await db.query('DELETE FROM images WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * 根据分类ID获取图片数量
   * @param category_id - 分类ID
   */
  async countByCategory(category_id: number): Promise<number> {
    const [[{ count }]]: any = await db.query(
      'SELECT COUNT(*) AS count FROM images WHERE category_id = ?',
      [category_id]
    );
    return count;
  },
};

export default Image;
