/**
 * =====================================================
 * Verification Code Service - 验证码服务
 * =====================================================
 * 功能：验证码的生成、存储、校验和频率限制
 * 依赖：ioredis（通过 config/redis.js）
 * =====================================================
 */

const redis = require('../config/redis');

/** 验证码有效期（秒） */
const CODE_TTL = 7200; // 2 小时

/** 发送频率限制（秒） */
const RATE_LIMIT_TTL = 60; // 60 秒

/**
 * 生成 6 位数字验证码
 * @returns {string} 6位数字字符串
 */
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * 保存验证码到 Redis
 * @param {string} email - 邮箱地址
 * @param {string} code - 验证码
 * @returns {Promise<void>}
 */
async function saveCode(email, code) {
  const key = `verify:${email}`;
  await redis.set(key, code, 'EX', CODE_TTL);
}

/**
 * 校验验证码
 * @param {string} email - 邮箱地址
 * @param {string} code - 用户输入的验证码
 * @returns {Promise<boolean>} 是否验证通过
 */
async function verifyCode(email, code) {
  const key = `verify:${email}`;
  const storedCode = await redis.get(key);

  if (!storedCode || storedCode !== code) {
    return false;
  }

  // 验证成功后删除验证码，防止重复使用
  await redis.del(key);
  return true;
}

/**
 * 检查发送频率限制（原子操作）
 * @param {string} email - 邮箱地址
 * @returns {Promise<boolean>} true=允许发送, false=频率超限
 */
async function checkRateLimit(email) {
  const key = `verify_limit:${email}`;
  // SET NX EX 保证原子性，避免竞态条件
  const result = await redis.set(key, '1', 'EX', RATE_LIMIT_TTL, 'NX');
  return result === 'OK';
}

module.exports = {
  generateCode,
  saveCode,
  verifyCode,
  checkRateLimit,
};
