const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, code: 429, message: '请求过于频繁' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, code: 429, message: '登录尝试过多，请15分钟后再试' },
  skipSuccessfulRequests: true
});

const imageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, code: 429, message: '图片生成次数已达上限' }
});

module.exports = { globalLimiter, authLimiter, imageLimiter };
