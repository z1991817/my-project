import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '未登录，请先登录' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.adminUser = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ code: 401, message: 'Token 已过期，请重新登录' });
      return;
    }
    res.status(401).json({ code: 401, message: 'Token 无效' });
  }
}

export = authMiddleware;
