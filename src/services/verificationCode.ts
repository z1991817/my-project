/**
 * =====================================================
 * Verification Code Service - 验证码服务
 * =====================================================
 * 功能：验证码的生成、存储、校验和频率限制
 * =====================================================
 */

import redis from '../config/redis';

/** 验证码有效期（秒） */
const CODE_TTL = 7200;

/** 发送频率限制（秒） */
const RATE_LIMIT_TTL = 60;

/**
 * 生成 6 位数字验证码
 */
export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 保存验证码到 Redis
 * @param email - 邮箱地址
 * @param code - 验证码
 */
export async function saveCode(email: string, code: string): Promise<void> {
  const key = `verify:${email}`;
  await redis.set(key, code, 'EX', CODE_TTL);
}

/**
 * 校验验证码（验证成功后删除，防止重复使用）
 * @param email - 邮箱地址
 * @param code - 用户输入的验证码
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  const key = `verify:${email}`;
  const storedCode = await redis.get(key);

  if (!storedCode || storedCode !== code) {
    return false;
  }

  await redis.del(key);
  return true;
}

/**
 * 检查发送频率限制（原子操作，SET NX EX）
 * @param email - 邮箱地址
 * @returns true=允许发送, false=频率超限
 */
export async function checkRateLimit(email: string): Promise<boolean> {
  const key = `verify_limit:${email}`;
  const result = await redis.set(key, '1', 'EX', RATE_LIMIT_TTL, 'NX');
  return result === 'OK';
}
