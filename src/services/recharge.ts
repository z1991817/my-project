import db from '../config/db';
import redis from '../config/redis';
import PaymentOrder from '../models/paymentOrder';
import PaymentTransaction from '../models/paymentTransaction';
import PointsLog from '../models/pointsLog';
import User from '../models/user';
import { getRechargePackageById } from '../constants/rechargePackages';

export class RechargeError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'RechargeError';
    this.statusCode = statusCode;
  }
}

function generateOrderNo(): string {
  const now = new Date();
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  const timestamp = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
    pad(now.getMilliseconds(), 3),
  ].join('');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RC${timestamp}${random}`;
}

async function acquireRedisLock(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const result = await redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  } catch (error: any) {
    console.warn(`[Recharge] Redis lock failed: ${key}`, error?.message || error);
    return true;
  }
}

async function releaseRedisLock(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error: any) {
    console.warn(`[Recharge] Redis unlock failed: ${key}`, error?.message || error);
  }
}

export async function createRechargeOrder(userId: number, packageId: string) {
  const rechargePackage = getRechargePackageById(packageId);
  if (!rechargePackage) {
    throw new RechargeError('充值套餐不存在', 404);
  }

  const lockKey = `pay:create:lock:${userId}:${packageId}`;
  const locked = await acquireRedisLock(lockKey, 10);
  if (!locked) {
    throw new RechargeError('创建订单过于频繁，请稍后再试', 429);
  }

  try {
    const orderId = await PaymentOrder.create({
      order_no: generateOrderNo(),
      user_id: userId,
      order_type: 'recharge',
      package_id: rechargePackage.id,
      package_name: rechargePackage.name,
      amount: rechargePackage.amount,
      points: rechargePackage.points,
      status: 'pending',
      payment_channel: 'mock',
    });

    const order = await PaymentOrder.findById(orderId);
    if (!order) {
      throw new RechargeError('创建订单失败', 500);
    }

    return order;
  } finally {
    await releaseRedisLock(lockKey);
  }
}

export async function markRechargeOrderPaidById(userId: number, orderId: number, tradeNo?: string | null) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orderRows]: any = await connection.query(
      `SELECT id, order_no, user_id, order_type, package_id, package_name, amount, points, status,
              payment_channel, third_party_order_no, paid_at, created_at, updated_at
       FROM payment_orders
       WHERE id = ? AND user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [orderId, userId]
    );

    const order = (orderRows as any[])[0];
    if (!order) {
      throw new RechargeError('订单不存在', 404);
    }

    const lockKey = `pay:callback:lock:${order.order_no}`;
    const locked = await acquireRedisLock(lockKey, 60);
    if (!locked) {
      throw new RechargeError('订单正在处理中，请稍后重试', 409);
    }

    try {
      if (order.status === 'paid') {
        await connection.commit();
        const currentPoints = await User.getPointsById(userId);
        return {
          order: await PaymentOrder.findById(orderId),
          currentPoints: currentPoints ?? 0,
          alreadyPaid: true,
        };
      }

      if (order.status !== 'pending') {
        throw new RechargeError(`当前订单状态不支持支付: ${order.status}`, 409);
      }

      const finalTradeNo = tradeNo || `mock_${order.order_no}`;

      const [updateOrderResult]: any = await connection.query(
        `UPDATE payment_orders
         SET status = 'paid', payment_channel = 'mock', third_party_order_no = ?, paid_at = NOW()
         WHERE id = ? AND status = 'pending'`,
        [finalTradeNo, orderId]
      );

      if (!updateOrderResult.affectedRows) {
        throw new RechargeError('订单支付状态更新失败', 409);
      }

      const [updateUserResult]: any = await connection.query(
        'UPDATE users SET points = points + ? WHERE id = ? AND status = 1',
        [Number(order.points) || 0, userId]
      );

      if (!updateUserResult.affectedRows) {
        throw new RechargeError('用户不存在或已禁用', 404);
      }

      const [[userRow]]: any = await connection.query(
        'SELECT points FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      const balanceAfter = Number(userRow?.points) || 0;

      await connection.query(
        `INSERT INTO points_logs (user_id, change_type, change_amount, balance_after, order_id, remark)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, 'recharge', Number(order.points) || 0, balanceAfter, orderId, `模拟支付成功：${order.package_name}`]
      );

      await connection.query(
        `INSERT INTO payment_transactions
          (order_id, user_id, channel, transaction_type, trade_no, status, request_data, response_data, callback_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          userId,
          'mock',
          'callback',
          finalTradeNo,
          'success',
          JSON.stringify({ orderId, orderNo: order.order_no }),
          JSON.stringify({ success: true }),
          JSON.stringify({ tradeNo: finalTradeNo, paid: true }),
        ]
      );

      await connection.commit();

      return {
        order: await PaymentOrder.findById(orderId),
        currentPoints: balanceAfter,
        alreadyPaid: false,
      };
    } finally {
      await releaseRedisLock(lockKey);
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function mockPayRechargeOrder(userId: number, orderId: number) {
  return markRechargeOrderPaidById(userId, orderId);
}

export async function mockCallbackPayByOrderNo(orderNo: string, tradeNo?: string | null) {
  const order = await PaymentOrder.findByOrderNo(orderNo);
  if (!order) {
    throw new RechargeError('订单不存在', 404);
  }

  return markRechargeOrderPaidById(order.user_id, order.id, tradeNo);
}

export async function listOrderTransactions(orderId: number) {
  return PaymentTransaction.listByOrderId(orderId);
}

export async function appendRegisterBonusLog(userId: number, points: number) {
  const currentPoints = await User.getPointsById(userId);
  if (currentPoints === null) return null;

  return PointsLog.create({
    user_id: userId,
    change_type: 'register_bonus',
    change_amount: points,
    balance_after: currentPoints,
    remark: '注册赠送积分',
  });
}
