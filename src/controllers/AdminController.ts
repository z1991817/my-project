/**
 * =====================================================
 * AdminController - 管理员控制器
 * =====================================================
 * 路由前缀：/api/v1/admin
 * 功能：管理员登录、查询资料、登出、用户列表
 * =====================================================
 */

import { Controller, Post, Get, Body, Route, Security, Request, Tags, Query } from 'tsoa';
import { Request as ExpressRequest } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AdminUser from '../models/adminUser';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/** 管理员登录请求体 */
interface AdminLoginBody {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

@Tags('管理员')
@Route('api/v1/admin')
export class AdminController extends Controller {
  /**
   * 管理员登录
   * POST /api/v1/admin/login
   */
  @Post('/login')
  async login(@Body() body: AdminLoginBody): Promise<any> {
    const { username, password } = body;

    if (!username || !password) {
      this.setStatus(400);
      return { code: 400, message: '用户名和密码不能为空' };
    }

    const user = await AdminUser.findByUsername(username);
    if (!user) {
      this.setStatus(401);
      return { code: 401, message: '用户名或密码错误' };
    }

    if (user.status === 0) {
      this.setStatus(403);
      return { code: 403, message: '账号已被禁用，请联系管理员' };
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      this.setStatus(401);
      return { code: 401, message: '用户名或密码错误' };
    }

    await AdminUser.updateLastLogin(user.id);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: { id: user.id, username: user.username, nickname: user.nickname, role: user.role },
      },
    };
  }

  /**
   * 获取管理员资料
   * GET /api/v1/admin/profile
   */
  @Get('/profile')
  @Security('adminJwt')
  async profile(@Request() req: ExpressRequest): Promise<any> {
    const user = await AdminUser.findById((req as any).adminUser?.id);
    if (!user) {
      this.setStatus(404);
      return { code: 404, message: '用户不存在' };
    }
    return { code: 200, message: 'ok', data: user };
  }

  /**
   * 管理员登出
   * POST /api/v1/admin/logout
   */
  @Post('/logout')
  @Security('adminJwt')
  async logout(@Request() req: ExpressRequest): Promise<any> {
    console.log(`[admin/logout] 用户 ${(req as any).adminUser?.username} 已登出`);
    return { code: 200, message: '已退出登录' };
  }

  /**
   * 查询管理员用户列表
   * GET /api/v1/admin/users
   */
  @Get('/users')
  @Security('adminJwt')
  async listUsers(
    @Query() username?: string,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const data = await AdminUser.list({
      username: username || '',
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
    return { code: 200, message: 'ok', data };
  }
}
