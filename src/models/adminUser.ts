/**
 * =====================================================
 * AdminUser Model - 管理员用户模型
 * =====================================================
 */

import db from '../config/db';

/** 管理员用户记录 */
export interface AdminUserRecord {
  id: number;
  username: string;
  password?: string;
  nickname: string;
  role: string;
  status: number;
  last_login?: string;
  created_at: string;
}

export const AdminUser = {
  /**
   * 根据用户名查找管理员
   * @param username - 用户名
   */
  async findByUsername(username: string): Promise<AdminUserRecord | null> {
    const [rows]: any = await db.query(
      'SELECT id, username, password, nickname, role, status FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );
    return (rows as AdminUserRecord[])[0] || null;
  },

  /**
   * 根据 ID 查找管理员（不返回密码）
   * @param id - 管理员ID
   */
  async findById(id: number): Promise<AdminUserRecord | null> {
    const [rows]: any = await db.query(
      'SELECT id, username, nickname, role, status, last_login, created_at FROM admin_users WHERE id = ? LIMIT 1',
      [id]
    );
    return (rows as AdminUserRecord[])[0] || null;
  },

  /**
   * 分页查询管理员列表
   * @param params - 查询参数
   */
  async list({ username, page, pageSize }: { username?: string; page: number; pageSize: number }) {
    const offset = (page - 1) * pageSize;
    const like = `%${username || ''}%`;
    const [[{ total }], rows]: any = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM admin_users WHERE username LIKE ?', [like]),
      db.query(
        "SELECT id, username, nickname, role, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at FROM admin_users WHERE username LIKE ? LIMIT ? OFFSET ?",
        [like, pageSize, offset]
      ),
    ]);
    return { total, list: rows[0] };
  },

  /**
   * 更新最后登录时间
   * @param id - 管理员ID
   */
  async updateLastLogin(id: number): Promise<void> {
    await db.query('UPDATE admin_users SET last_login = NOW() WHERE id = ?', [id]);
  },
};

export default AdminUser;
