const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

/**
 * 用户 JWT 鉴权中间件
 * 从 Authorization: Bearer <token> 头中解析并验证 token
 * 将用户信息挂载到 req.user
 */
function userAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 401,
      message: '未登录，请先登录'
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // 将用户信息挂载到 req.user
    req.user = {
      id: decoded.id,
      username: decoded.username,
      nickname: decoded.nickname,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 401,
        message: 'Token 已过期，请重新登录'
      });
    }

    return res.status(401).json({
      success: false,
      code: 401,
      message: 'Token 无效'
    });
  }
}

module.exports = userAuthMiddleware;
