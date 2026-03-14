/**
 * =====================================================
 * User Model - 用户模型
 * =====================================================
 * 功能：管理普通用户（区别于 admin_users）
 * 创建时间：2026-03-13
 * =====================================================
 */

const db = require('../config/db');

const User = {
  /**
   * 创建用户
   * @param {Object} data - 用户数据
   * @param {string} data.username - 用户名（可选）
   * @param {string} data.password - 密码（可选，bcrypt 加密）
   * @param {string} data.email - 邮箱（可选）
   * @param {string} data.phone - 手机号（可选）
   * @param {string} data.nickname - 昵称（可选）
   * @param {string} data.avatar - 头像URL（可选）
   * @returns {Promise<number>} 返回插入的用户ID
   */
  async create(data) {
    try {
      const { username, password, email, phone, nickname, avatar } = data;

      const [result] = await db.query(
        `INSERT INTO users (username, password, email, phone, nickname, avatar)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username || null, password || null, email || null, phone || null, nickname || null, avatar || null]
      );

      return result.insertId;
    } catch (error) {
      console.error('[User.create] Error:', error.message);
      throw error;
    }
  },

  /**
   * 根据ID查询用户
   * @param {number} id - 用户ID
   * @returns {Promise<Object|null>} 返回用户信息
   */
  async findById(id) {
    try {
      if (!id || typeof id !== 'number') {
        throw new Error('Invalid id: must be a number');
      }

      const [[user]] = await db.query(
        'SELECT * FROM users WHERE id = ? AND status = 1',
        [id]
      );

      return user || null;
    } catch (error) {
      console.error('[User.findById] Error:', error.message);
      return null;
    }
  },

  /**
   * 根据用户名查询用户
   * @param {string} username - 用户名
   * @returns {Promise<Object|null>} 返回用户信息
   */
  async findByUsername(username) {
    try {
      if (!username || typeof username !== 'string') {
        throw new Error('Invalid username: must be a non-empty string');
      }

      const [[user]] = await db.query(
        'SELECT * FROM users WHERE username = ? AND status = 1',
        [username]
      );

      return user || null;
    } catch (error) {
      console.error('[User.findByUsername] Error:', error.message);
      return null;
    }
  },

  /**
   * 根据邮箱查询用户
   * @param {string} email - 邮箱
   * @returns {Promise<Object|null>} 返回用户信息
   */
  async findByEmail(email) {
    try {
      if (!email || typeof email !== 'string') {
        throw new Error('Invalid email: must be a non-empty string');
      }

      const [[user]] = await db.query(
        'SELECT * FROM users WHERE email = ? AND status = 1',
        [email]
      );

      return user || null;
    } catch (error) {
      console.error('[User.findByEmail] Error:', error.message);
      return null;
    }
  },

  /**
   * 根据手机号查询用户
   * @param {string} phone - 手机号
   * @returns {Promise<Object|null>} 返回用户信息
   */
  async findByPhone(phone) {
    try {
      if (!phone || typeof phone !== 'string') {
        throw new Error('Invalid phone: must be a non-empty string');
      }

      const [[user]] = await db.query(
        'SELECT * FROM users WHERE phone = ? AND status = 1',
        [phone]
      );

      return user || null;
    } catch (error) {
      console.error('[User.findByPhone] Error:', error.message);
      return null;
    }
  },

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} data - 更新的数据
   * @returns {Promise<boolean>} 返回是否更新成功
   */
  async update(id, data) {
    try {
      if (!id || typeof id !== 'number') {
        throw new Error('Invalid id: must be a number');
      }

      const allowedFields = ['username', 'password', 'email', 'phone', 'nickname', 'avatar', 'status'];
      const updates = [];
      const values = [];

      for (const [key, value] of Object.entries(data)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        return false;
      }

      values.push(id);

      const [result] = await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('[User.update] Error:', error.message);
      throw error;
    }
  },

  /**
   * 分页查询用户列表
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码（默认1）
   * @param {number} options.limit - 每页数量（默认10）
   * @param {number} options.status - 状态筛选（可选）
   * @returns {Promise<Object>} 返回用户列表和总数
   */
  async list(options = {}) {
    try {
      const page = Math.max(1, Number(options.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
      const offset = (page - 1) * limit;

      let whereClause = '1=1';
      const params = [];

      if (options.status !== undefined) {
        whereClause += ' AND status = ?';
        params.push(options.status);
      }

      // 查询总数
      const [[{ total }]] = await db.query(
        `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
        params
      );

      // 查询列表
      const [users] = await db.query(
        `SELECT id, username, email, phone, nickname, avatar, status, created_at, updated_at
         FROM users
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return {
        total,
        page,
        limit,
        data: users,
      };
    } catch (error) {
      console.error('[User.list] Error:', error.message);
      return {
        total: 0,
        page: 1,
        limit: 10,
        data: [],
      };
    }
  },
};

module.exports = User;

/**
 * =====================================================
 * 使用说明
 * =====================================================
 * 1. 创建用户时，username/email/phone 至少提供一个
 * 2. password 字段应使用 bcrypt 加密后存储
 * 3. 查询时自动过滤 status=0 的禁用用户
 * 4. 更新时只允许更新指定的字段
 * =====================================================
 */
