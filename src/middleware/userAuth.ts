/**
 * =====================================================
 * 用户 JWT 鉴权中间件
 * =====================================================
 * 从 Authorization: Bearer <token> 头中解析并验证 token
 * 将用户信息挂载到 req.user
 * =====================================================
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

/**
 * 用户 JWT 鉴权中间件
 */
function userAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, code: 401, message: '未登录，请先登录' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // 将用户信息挂载到 req.user
    (req as any).user = {
      id: decoded.id,
      username: decoded.username,
      nickname: decoded.nickname,
      email: decoded.email,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, code: 401, message: 'Token 已过期，请重新登录' });
      return;
    }
    res.status(401).json({ success: false, code: 401, message: 'Token 无效' });
  }
}

export default userAuthMiddleware;
