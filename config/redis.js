/**
 * =====================================================
 * Redis 连接配置
 * =====================================================
 * 功能：创建并导出 Redis 客户端实例
 * 用途：验证码缓存、频率限制等
 * =====================================================
 */

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
  // 重试策略：最多重试 10 次，间隔递增，避免刷屏
  retryStrategy(times) {
    if (times > 10) {
      console.error('[Redis] 重试次数超限，停止重连');
      return null; // 停止重试
    }
    return Math.min(times * 500, 5000); // 最大间隔 5 秒
  },
  maxRetriesPerRequest: 3, // 单次命令最多重试 3 次
});

redis.on('connect', () => {
  console.log('[Redis] 连接成功');
});

redis.on('error', (err) => {
  console.error('[Redis] 连接错误:', err.message);
});

module.exports = redis;
