const db = require('../config/db');

const AdminUser = {
  /**
   * 根据用户名查找用户
   */
  async findByUsername(username) {
    const [rows] = await db.query(
      'SELECT id, username, password, nickname, role, status FROM admin_users WHERE username = ? LIMIT 1',
      [username]
    );
    return rows[0] || null;
  },

  /**
   * 根据 id 查找用户（不返回密码）
   */
  async findById(id) {
    const [rows] = await db.query(
      'SELECT id, username, nickname, role, status, last_login, created_at FROM admin_users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 更新最后登录时间
   */
  async list({ username, page, pageSize }) {
    const offset = (page - 1) * pageSize;
    const like = `%${username || ''}%`;
    const [[{ total }], rows] = await Promise.all([
      db.query('SELECT COUNT(*) AS total FROM admin_users WHERE username LIKE ?', [like]),
      db.query(
        'SELECT id, username, nickname, role, status, DATE_FORMAT(created_at, \'%Y-%m-%d %H:%i:%s\') AS created_at FROM admin_users WHERE username LIKE ? LIMIT ? OFFSET ?',
        [like, pageSize, offset]
      ),
    ]);
    return { total, list: rows[0] };
  },

  async updateLastLogin(id) {
    await db.query(
      'UPDATE admin_users SET last_login = NOW() WHERE id = ?',
      [id]
    );
  },
};

module.exports = AdminUser;
