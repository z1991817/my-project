import db from '../config/db';

export interface PaymentTransactionRecord {
  id: number;
  order_id: number;
  user_id: number;
  channel: string;
  transaction_type: string;
  trade_no?: string | null;
  status: string;
  request_data?: any;
  response_data?: any;
  callback_data?: any;
  created_at: string;
  updated_at?: string;
}

function safeParseJson(value: any) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function mapTransactionRecord(row: any): PaymentTransactionRecord {
  return {
    ...row,
    request_data: safeParseJson(row.request_data),
    response_data: safeParseJson(row.response_data),
    callback_data: safeParseJson(row.callback_data),
  };
}

export const PaymentTransaction = {
  async create(data: {
    order_id: number;
    user_id: number;
    channel: string;
    transaction_type: string;
    trade_no?: string | null;
    status: string;
    request_data?: any;
    response_data?: any;
    callback_data?: any;
  }): Promise<number> {
    const [result]: any = await db.query(
      `INSERT INTO payment_transactions
        (order_id, user_id, channel, transaction_type, trade_no, status, request_data, response_data, callback_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.order_id,
        data.user_id,
        data.channel,
        data.transaction_type,
        data.trade_no || null,
        data.status,
        data.request_data !== undefined ? JSON.stringify(data.request_data) : null,
        data.response_data !== undefined ? JSON.stringify(data.response_data) : null,
        data.callback_data !== undefined ? JSON.stringify(data.callback_data) : null,
      ]
    );

    return result.insertId;
  },

  async listByOrderId(orderId: number): Promise<PaymentTransactionRecord[]> {
    const [rows]: any = await db.query(
      `SELECT id, order_id, user_id, channel, transaction_type, trade_no, status,
              request_data, response_data, callback_data,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
              DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
       FROM payment_transactions
       WHERE order_id = ?
       ORDER BY id DESC`,
      [orderId]
    );

    return (rows as any[]).map(mapTransactionRecord);
  },
};

export default PaymentTransaction;
