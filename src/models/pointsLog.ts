import db from '../config/db';

export interface PointsLogRecord {
  id: number;
  user_id: number;
  change_type: string;
  change_amount: number;
  balance_after: number;
  order_id?: number | null;
  remark?: string | null;
  created_at: string;
}

export const PointsLog = {
  async create(data: {
    user_id: number;
    change_type: string;
    change_amount: number;
    balance_after: number;
    order_id?: number | null;
    remark?: string | null;
  }): Promise<number> {
    const [result]: any = await db.query(
      `INSERT INTO points_logs (user_id, change_type, change_amount, balance_after, order_id, remark)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.change_type,
        data.change_amount,
        data.balance_after,
        data.order_id || null,
        data.remark || null,
      ]
    );

    return result.insertId;
  },

  async listByUserId(userId: number, page = 1, pageSize = 20) {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedPageSize = Math.max(1, Math.min(100, Number(pageSize) || 20));
    const offset = (normalizedPage - 1) * normalizedPageSize;

    const [countRows]: any = await db.query('SELECT COUNT(*) AS total FROM points_logs WHERE user_id = ?', [userId]);
    const total = Number((countRows as any[])[0]?.total || 0);
    const [rows]: any = await db.query(
      `SELECT id, user_id, change_type, change_amount, balance_after, order_id, remark,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
       FROM points_logs
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [userId, normalizedPageSize, offset]
    );

    return {
      total,
      list: rows,
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalPages: Math.ceil(total / normalizedPageSize),
    };
  },

  async listByAdmin(options: {
    userId?: number;
    changeType?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const normalizedPage = Math.max(1, Number(options.page) || 1);
    const normalizedPageSize = Math.max(1, Math.min(100, Number(options.pageSize) || 20));
    const offset = (normalizedPage - 1) * normalizedPageSize;
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (options.userId !== undefined) {
      conditions.push('pl.user_id = ?');
      params.push(options.userId);
    }

    if (options.changeType) {
      conditions.push('pl.change_type = ?');
      params.push(options.changeType);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows]: any = await db.query(`SELECT COUNT(*) AS total FROM points_logs pl WHERE ${whereClause}`, params);
    const total = Number((countRows as any[])[0]?.total || 0);
    const [rows]: any = await db.query(
      `SELECT pl.id, pl.user_id, u.username, u.nickname, pl.change_type, pl.change_amount, pl.balance_after,
              pl.order_id, pl.remark, DATE_FORMAT(pl.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
       FROM points_logs pl
       LEFT JOIN users u ON u.id = pl.user_id
       WHERE ${whereClause}
       ORDER BY pl.id DESC
       LIMIT ? OFFSET ?`,
      [...params, normalizedPageSize, offset]
    );

    return {
      total,
      list: rows,
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalPages: Math.ceil(total / normalizedPageSize),
    };
  },
};

export default PointsLog;
