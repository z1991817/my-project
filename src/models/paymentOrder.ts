import db from '../config/db';

export interface PaymentOrderRecord {
  id: number;
  order_no: string;
  user_id: number;
  order_type: string;
  package_id: string;
  package_name: string;
  amount: number;
  points: number;
  status: string;
  payment_channel?: string | null;
  third_party_order_no?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export const PaymentOrder = {
  async create(data: {
    order_no: string;
    user_id: number;
    order_type: string;
    package_id: string;
    package_name: string;
    amount: number;
    points: number;
    status?: string;
    payment_channel?: string | null;
  }): Promise<number> {
    const [result]: any = await db.query(
      `INSERT INTO payment_orders
        (order_no, user_id, order_type, package_id, package_name, amount, points, status, payment_channel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.order_no,
        data.user_id,
        data.order_type,
        data.package_id,
        data.package_name,
        data.amount,
        data.points,
        data.status || 'pending',
        data.payment_channel || 'mock',
      ]
    );
    return result.insertId;
  },

  async findById(id: number): Promise<PaymentOrderRecord | null> {
    const [rows]: any = await db.query(
      `SELECT id, order_no, user_id, order_type, package_id, package_name, amount, points, status,
              payment_channel, third_party_order_no,
              DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
       FROM payment_orders
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return (rows as any[])[0] || null;
  },

  async findByOrderNo(orderNo: string): Promise<PaymentOrderRecord | null> {
    const [rows]: any = await db.query(
      `SELECT id, order_no, user_id, order_type, package_id, package_name, amount, points, status,
              payment_channel, third_party_order_no,
              DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
       FROM payment_orders
       WHERE order_no = ?
       LIMIT 1`,
      [orderNo]
    );
    return (rows as any[])[0] || null;
  },

  async findByIdAndUserId(id: number, userId: number): Promise<PaymentOrderRecord | null> {
    const [rows]: any = await db.query(
      `SELECT id, order_no, user_id, order_type, package_id, package_name, amount, points, status,
              payment_channel, third_party_order_no,
              DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
       FROM payment_orders
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId]
    );
    return (rows as any[])[0] || null;
  },

  async listByUserId(userId: number, page = 1, pageSize = 10) {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedPageSize = Math.max(1, Math.min(100, Number(pageSize) || 10));
    const offset = (normalizedPage - 1) * normalizedPageSize;

    const [countRows]: any = await db.query('SELECT COUNT(*) AS total FROM payment_orders WHERE user_id = ?', [userId]);
    const total = Number((countRows as any[])[0]?.total || 0);
    const [rows]: any = await db.query(
      `SELECT id, order_no, user_id, order_type, package_id, package_name, amount, points, status,
              payment_channel, third_party_order_no,
              DATE_FORMAT(paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
       FROM payment_orders
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
    orderNo?: string;
    status?: string;
    userId?: number;
    username?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const normalizedPage = Math.max(1, Number(options.page) || 1);
    const normalizedPageSize = Math.max(1, Math.min(100, Number(options.pageSize) || 10));
    const offset = (normalizedPage - 1) * normalizedPageSize;
    const conditions: string[] = ['1=1'];
    const params: any[] = [];

    if (options.orderNo) {
      conditions.push('po.order_no LIKE ?');
      params.push(`%${options.orderNo}%`);
    }
    if (options.status) {
      conditions.push('po.status = ?');
      params.push(options.status);
    }
    if (options.userId !== undefined) {
      conditions.push('po.user_id = ?');
      params.push(options.userId);
    }
    if (options.username) {
      conditions.push('(u.username LIKE ? OR u.nickname LIKE ?)');
      params.push(`%${options.username}%`, `%${options.username}%`);
    }

    const whereClause = conditions.join(' AND ');

    const [countRows]: any = await db.query(
      `SELECT COUNT(*) AS total
       FROM payment_orders po
       LEFT JOIN users u ON u.id = po.user_id
       WHERE ${whereClause}`,
      params
    );
    const total = Number((countRows as any[])[0]?.total || 0);
    const [rows]: any = await db.query(
      `SELECT po.id, po.order_no, po.user_id, u.username, u.nickname, u.email, po.order_type, po.package_id,
              po.package_name, po.amount, po.points, po.status, po.payment_channel, po.third_party_order_no,
              DATE_FORMAT(po.paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
              DATE_FORMAT(po.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              DATE_FORMAT(po.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
       FROM payment_orders po
       LEFT JOIN users u ON u.id = po.user_id
       WHERE ${whereClause}
       ORDER BY po.id DESC
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

  async findDetailByIdForAdmin(id: number) {
    const [rows]: any = await db.query(
      `SELECT po.id, po.order_no, po.user_id, u.username, u.nickname, u.email, u.phone, u.points AS current_points,
              po.order_type, po.package_id, po.package_name, po.amount, po.points, po.status, po.payment_channel,
              po.third_party_order_no, DATE_FORMAT(po.paid_at, '%Y-%m-%d %H:%i:%s') AS paid_at,
              DATE_FORMAT(po.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              DATE_FORMAT(po.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
       FROM payment_orders po
       LEFT JOIN users u ON u.id = po.user_id
       WHERE po.id = ?
       LIMIT 1`,
      [id]
    );

    return (rows as any[])[0] || null;
  },
};

export default PaymentOrder;
