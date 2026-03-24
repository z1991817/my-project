/**
 * =====================================================
 * Category Model - 分类模型
 * =====================================================
 */

import db from '../config/db';

/** 分类记录 */
export interface CategoryRecord {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at?: string;
}

export const Category = {
  /**
   * 获取分类列表（支持分页和搜索）
   */
  async list({
    name,
    status,
    page = 1,
    pageSize = 10,
    sortBy = 'sort_order',
    sortOrder = 'ASC',
  }: {
    name?: string;
    status?: number | string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const params: any[] = [];

    if (name) {
      conditions.push('name LIKE ?');
      params.push(`%${name}%`);
    }
    if (status !== undefined && status !== '') {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 验证排序字段，防止 SQL 注入
    const allowedSortFields = ['id', 'name', 'sort_order', 'status', 'created_at', 'updated_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'sort_order';
    const validSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}, id DESC`;

    const [[{ total }], [rows]]: any = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM categories ${whereClause}`, params),
      db.query(
        `SELECT id, name, description, sort_order, status,
         DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
         DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
         FROM categories ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      ),
    ]);

    return { total, list: rows };
  },

  /**
   * 获取所有启用的分类（不分页，用于下拉选择）
   */
  async getAllEnabled(): Promise<CategoryRecord[]> {
    const [rows]: any = await db.query(
      'SELECT id, name FROM categories WHERE status = 1 ORDER BY sort_order ASC, id DESC'
    );
    return rows;
  },

  /**
   * 根据 ID 获取分类详情
   * @param id - 分类ID
   */
  async findById(id: number): Promise<CategoryRecord | null> {
    const [rows]: any = await db.query(
      'SELECT id, name, description, sort_order, status, created_at, updated_at FROM categories WHERE id = ? LIMIT 1',
      [id]
    );
    return (rows as CategoryRecord[])[0] || null;
  },

  /**
   * 创建分类
   */
  async create({
    name,
    description,
    sort_order = 0,
    status = 1,
  }: {
    name: string;
    description?: string;
    sort_order?: number;
    status?: number;
  }): Promise<number> {
    const [result]: any = await db.query(
      'INSERT INTO categories (name, description, sort_order, status) VALUES (?, ?, ?, ?)',
      [name, description, sort_order, status]
    );
    return result.insertId;
  },

  /**
   * 更新分类
   * @param id - 分类ID
   * @param data - 更新数据
   */
  async update(
    id: number,
    data: { name?: string; description?: string; sort_order?: number; status?: number }
  ): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); params.push(data.sort_order); }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result]: any = await db.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  /**
   * 删除分类
   * @param id - 分类ID
   */
  async delete(id: number): Promise<boolean> {
    const [result]: any = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

export default Category;
