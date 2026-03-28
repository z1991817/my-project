/**
 * =====================================================
 * User Model - 用户模型
 * =====================================================
 * 功能：管理普通用户（区别于 admin_users）
 * =====================================================
 */

import db from '../config/db';

/** 用户记录 */
export interface UserRecord {
  id: number;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  points: number;
  status: number;
  created_at: string;
  updated_at?: string;
}

/** 用户创建参数 */
export interface CreateUserData {
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
  points?: number;
}

export const User = {
  /**
   * 创建用户
   * @param data - 用户数据
   * @returns 插入的用户ID
   */
  async create(data: CreateUserData): Promise<number> {
    try {
      const { username, password, email, phone, nickname, avatar, points = 1000 } = data;
      const [result]: any = await db.query(
        'INSERT INTO users (username, password, email, phone, nickname, avatar, points) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [username || null, password || null, email || null, phone || null, nickname || null, avatar || null, points]
      );
      return result.insertId;
    } catch (error: any) {
      console.error('[User.create] Error:', error.message);
      throw error;
    }
  },

  /**
   * 根据ID查询用户
   * @param id - 用户ID
   */
  async findById(id: number): Promise<UserRecord | null> {
    try {
      if (!id || typeof id !== 'number') throw new Error('Invalid id: must be a number');
      const [[user]]: any = await db.query(
        'SELECT * FROM users WHERE id = ? AND status = 1',
        [id]
      );
      return user || null;
    } catch (error: any) {
      console.error('[User.findById] Error:', error.message);
      return null;
    }
  },

  /**
   * 查询用户当前积分
   * @param id - 用户ID
   */
  async getPointsById(id: number): Promise<number | null> {
    try {
      if (!id || typeof id !== 'number') throw new Error('Invalid id: must be a number');
      const [[user]]: any = await db.query(
        'SELECT points FROM users WHERE id = ? AND status = 1 LIMIT 1',
        [id]
      );
      return user ? Number(user.points) || 0 : null;
    } catch (error: any) {
      console.error('[User.getPointsById] Error:', error.message);
      return null;
    }
  },

  /**
   * 原子预占积分
   * @param id - 用户ID
   * @param points - 积分
   */
  async reservePointsIfEnough(id: number, points: number): Promise<boolean> {
    try {
      if (!id || typeof id !== 'number') throw new Error('Invalid id');
      const normalizedPoints = Number(points);
      if (!Number.isInteger(normalizedPoints) || normalizedPoints <= 0) throw new Error('Invalid points');

      const [result]: any = await db.query(
        'UPDATE users SET points = points - ? WHERE id = ? AND status = 1 AND points >= ?',
        [normalizedPoints, id, normalizedPoints]
      );
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error('[User.reservePointsIfEnough] Error:', error.message);
      throw error;
    }
  },

  /**
   * 增加积分
   * @param id - 用户ID
   * @param points - 积分
   */
  async addPoints(id: number, points: number): Promise<boolean> {
    try {
      if (!id || typeof id !== 'number') throw new Error('Invalid id');
      const normalizedPoints = Number(points);
      if (!Number.isInteger(normalizedPoints) || normalizedPoints <= 0) throw new Error('Invalid points');

      const [result]: any = await db.query(
        'UPDATE users SET points = points + ? WHERE id = ? AND status = 1',
        [normalizedPoints, id]
      );
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error('[User.addPoints] Error:', error.message);
      throw error;
    }
  },

  /**
   * 根据用户名查询用户
   * @param username - 用户名
   */
  async findByUsername(username: string): Promise<UserRecord | null> {
    try {
      if (!username || typeof username !== 'string') throw new Error('Invalid username');
      const [[user]]: any = await db.query(
        'SELECT * FROM users WHERE username = ? AND status = 1',
        [username]
      );
      return user || null;
    } catch (error: any) {
      console.error('[User.findByUsername] Error:', error.message);
      return null;
    }
  },

  /**
   * 根据邮箱查询用户
   * @param email - 邮箱
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    try {
      if (!email || typeof email !== 'string') throw new Error('Invalid email');
      const [[user]]: any = await db.query(
        'SELECT * FROM users WHERE email = ? AND status = 1',
        [email]
      );
      return user || null;
    } catch (error: any) {
      console.error('[User.findByEmail] Error:', error.message);
      return null;
    }
  },

  /**
   * 根据手机号查询用户
   * @param phone - 手机号
   */
  async findByPhone(phone: string): Promise<UserRecord | null> {
    try {
      if (!phone || typeof phone !== 'string') throw new Error('Invalid phone');
      const [[user]]: any = await db.query(
        'SELECT * FROM users WHERE phone = ? AND status = 1',
        [phone]
      );
      return user || null;
    } catch (error: any) {
      console.error('[User.findByPhone] Error:', error.message);
      return null;
    }
  },

  /**
   * 更新用户信息
   * @param id - 用户ID
   * @param data - 更新数据
   */
  async update(id: number, data: Partial<UserRecord>): Promise<boolean> {
    try {
      if (!id || typeof id !== 'number') throw new Error('Invalid id');
      const allowedFields = ['username', 'password', 'email', 'phone', 'nickname', 'avatar', 'points', 'status'];
      const updates: string[] = [];
      const values: any[] = [];

      for (const [key, value] of Object.entries(data)) {
        if (allowedFields.includes(key) && value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (updates.length === 0) return false;
      values.push(id);

      const [result]: any = await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error: any) {
      console.error('[User.update] Error:', error.message);
      throw error;
    }
  },

  /**
   * 分页查询用户列表
   * @param options - 查询选项
   */
  async list(options: { page?: number; limit?: number; status?: number } = {}) {
    try {
      const page = Math.max(1, Number(options.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
      const offset = (page - 1) * limit;

      let whereClause = '1=1';
      const params: any[] = [];

      if (options.status !== undefined) {
        whereClause += ' AND status = ?';
        params.push(options.status);
      }

      const [[{ total }]]: any = await db.query(
        `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
        params
      );

      const [users]: any = await db.query(
        `SELECT id, username, email, phone, nickname, avatar, points, status, created_at, updated_at
         FROM users WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return { total, page, limit, data: users };
    } catch (error: any) {
      console.error('[User.list] Error:', error.message);
      return { total: 0, page: 1, limit: 10, data: [] };
    }
  },

  async listForAdmin(options: {
    page?: number;
    limit?: number;
    status?: number;
    username?: string;
  } = {}) {
    try {
      const page = Math.max(1, Number(options.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(options.limit) || 10));
      const offset = (page - 1) * limit;
      const conditions: string[] = ['1=1'];
      const params: any[] = [];

      if (options.status !== undefined) {
        conditions.push('u.status = ?');
        params.push(options.status);
      }

      if (options.username) {
        conditions.push('(u.username LIKE ? OR u.nickname LIKE ? OR u.email LIKE ?)');
        params.push(`%${options.username}%`, `%${options.username}%`, `%${options.username}%`);
      }

      const whereClause = conditions.join(' AND ');

      const [countRows]: any = await db.query(`SELECT COUNT(*) AS total FROM users u WHERE ${whereClause}`, params);
      const total = Number((countRows as any[])[0]?.total || 0);
      const [rows]: any = await db.query(
        `SELECT u.id, u.username, u.email, u.phone, u.nickname, u.avatar, u.points, u.status,
                DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                DATE_FORMAT(u.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
                COALESCE(stats.total_recharge_amount, 0) AS total_recharge_amount,
                COALESCE(stats.total_recharge_points, 0) AS total_recharge_points,
                DATE_FORMAT(stats.last_paid_at, '%Y-%m-%d %H:%i:%s') AS last_paid_at
         FROM users u
         LEFT JOIN (
           SELECT user_id,
                  SUM(amount) AS total_recharge_amount,
                  SUM(points) AS total_recharge_points,
                  MAX(paid_at) AS last_paid_at
           FROM payment_orders
           WHERE status = 'paid'
           GROUP BY user_id
         ) stats ON stats.user_id = u.id
         WHERE ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      return { total, page, limit, data: rows };
    } catch (error: any) {
      console.error('[User.listForAdmin] Error:', error.message);
      return { total: 0, page: 1, limit: 10, data: [] };
    }
  },
};

export default User;
