const db = require('../config/db');

const Category = {
  /**
   * 获取分类列表（支持分页和搜索）
   */
  async list({ name, status, page = 1, pageSize = 10, sortBy = 'sort_order', sortOrder = 'ASC' }) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    // 构建查询条件
    if (name) {
      conditions.push('name LIKE ?');
      params.push(`%${name}%`);
    }
    if (status !== undefined && status !== '') {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 验证排序字段，防止SQL注入
    const allowedSortFields = ['id', 'name', 'sort_order', 'status', 'created_at', 'updated_at'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'sort_order';
    const validSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // 构建排序子句
    const orderClause = `ORDER BY ${validSortBy} ${validSortOrder}, id DESC`;

    // 查询总数和列表
    const [[{ total }], [rows]] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM categories ${whereClause}`, params),
      db.query(
        `SELECT id, name, description, sort_order, status,
         DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
         DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
         FROM categories ${whereClause}
         ${orderClause}
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      ),
    ]);

    return { total, list: rows };
  },

  /**
   * 获取所有启用的分类（不分页，用于下拉选择）
   */
  async getAllEnabled() {
    const [rows] = await db.query(
      'SELECT id, name FROM categories WHERE status = 1 ORDER BY sort_order ASC, id DESC'
    );
    return rows;
  },

  /**
   * 根据 ID 获取分类详情
   */
  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, name, description, sort_order, status, created_at, updated_at FROM categories WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 创建分类
   */
  async create({ name, description, sort_order = 0, status = 1 }) {
    const [result] = await db.query(
      'INSERT INTO categories (name, description, sort_order, status) VALUES (?, ?, ?, ?)',
      [name, description, sort_order, status]
    );
    return result.insertId;
  },

  /**
   * 更新分类
   */
  async update(id, { name, description, sort_order, status }) {
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    if (sort_order !== undefined) {
      fields.push('sort_order = ?');
      params.push(sort_order);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await db.query(
      `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  /**
   * 删除分类
   */
  async delete(id) {
    const [result] = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

module.exports = Category;
