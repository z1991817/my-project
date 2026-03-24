/**
 * =====================================================
 * tsoa 统一认证模块
 * =====================================================
 * tsoa 要求的 expressAuthentication 函数
 * 支持：jwt（普通用户）、adminJwt（管理员）
 * =====================================================
 */

import { Request } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

/**
 * tsoa 认证入口函数
 * @param request - Express 请求对象
 * @param securityName - 安全策略名称（jwt 或 adminJwt）
 * @param _scopes - 权限作用域（暂不使用）
 */
export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[]
): Promise<any> {
  const authHeader = request.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: '未登录，请先登录' };
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (securityName === 'jwt') {
      // 普通用户认证：挂载到 req.user
      (request as any).user = {
        id: decoded.id,
        username: decoded.username,
        nickname: decoded.nickname,
        email: decoded.email,
      };
      return decoded;
    }

    if (securityName === 'adminJwt') {
      // 管理员认证：挂载到 req.adminUser
      (request as any).adminUser = decoded;
      return decoded;
    }

    throw { status: 401, message: '未知的认证类型' };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw { status: 401, message: 'Token 已过期，请重新登录' };
    }
    if (err.status) {
      throw err;
    }
    throw { status: 401, message: 'Token 无效' };
  }
}
