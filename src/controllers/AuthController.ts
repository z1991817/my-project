/**
 * =====================================================
 * AuthController - 用户认证控制器
 * =====================================================
 * 路由前缀：/app
 * 功能：注册、登录、获取用户信息、发送验证码
 * =====================================================
 */

import { Controller, Post, Get, Body, Route, Security, Request, Tags } from 'tsoa';
import { Request as ExpressRequest } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/user';
import * as emailService from '../services/email';
import * as verificationCodeService from '../services/verificationCode';
import redis from '../config/redis';
import { appendRegisterBonusLog } from '../services/recharge';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGISTER_BONUS_POINTS = 1000;

/** 登录请求体 */
interface LoginBody {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/** 注册请求体 */
interface RegisterBody {
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 密码（至少6位） */
  password: string;
  /** 邮箱验证码 */
  code: string;
}

/** 发送验证码请求体 */
interface SendCodeBody {
  /** 邮箱地址 */
  email: string;
}

@Tags('用户认证')
@Route('app')
export class AuthController extends Controller {
  /**
   * 用户登录
   * POST /app/login
   */
  @Post('/login')
  async login(@Body() body: LoginBody, @Request() req: ExpressRequest): Promise<any> {
    const { username, password } = body;

    if (!username || !password) {
      this.setStatus(400);
      return { success: false, code: 400, message: '用户名和密码不能为空' };
    }

    const user = await User.findByUsername(username);
    if (!user) {
      this.setStatus(401);
      return { success: false, code: 401, message: '用户名或密码错误' };
    }

    if (!user.password) {
      this.setStatus(401);
      return { success: false, code: 401, message: '该用户未设置密码，无法登录' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.setStatus(401);
      return { success: false, code: 401, message: '用户名或密码错误' };
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
      success: true,
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: { id: user.id, username: user.username, nickname: user.nickname, email: user.email, avatar: user.avatar, points: user.points },
      },
    };
  }

  /**
   * 获取当前用户信息
   * GET /app/me
   */
  @Get('/me')
  @Security('jwt')
  async getCurrentUser(@Request() req: ExpressRequest): Promise<any> {
    const userId = (req as any).user?.id;
    const user = await User.findById(userId);

    if (!user) {
      this.setStatus(404);
      return { success: false, code: 404, message: '用户不存在' };
    }

    return {
      success: true,
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        points: user.points,
        status: user.status,
        created_at: user.created_at,
      },
    };
  }

  /**
   * 发送邮箱验证码
   * POST /app/send-code
   */
  @Post('/send-code')
  async sendCode(@Body() body: SendCodeBody): Promise<any> {
    const { email } = body;

    if (!email || !EMAIL_REGEX.test(email)) {
      this.setStatus(400);
      return { success: false, code: 400, message: '邮箱格式不正确' };
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      this.setStatus(409);
      return { success: false, code: 409, message: '该邮箱已被注册' };
    }

    const rateLimitKey = `verify_limit:${email}`;
    const isLimited = await redis.exists(rateLimitKey);
    if (isLimited) {
      this.setStatus(429);
      return { success: false, code: 429, message: '发送太频繁，请 60 秒后再试' };
    }

    const code = verificationCodeService.generateCode();
    await verificationCodeService.saveCode(email, code);
    await emailService.sendVerificationCode(email, code);
    await verificationCodeService.checkRateLimit(email);

    return { success: true, code: 200, message: '验证码已发送至邮箱' };
  }

  /**
   * 用户注册
   * POST /app/register
   */
  @Post('/register')
  async register(@Body() body: RegisterBody): Promise<any> {
    const { username, email, password, code } = body;

    if (!username || !email || !password || !code) {
      this.setStatus(400);
      return { success: false, code: 400, message: '用户名、邮箱、密码和验证码不能为空' };
    }
    if (!EMAIL_REGEX.test(email)) {
      this.setStatus(400);
      return { success: false, code: 400, message: '邮箱格式不正确' };
    }
    if (password.length < 6) {
      this.setStatus(400);
      return { success: false, code: 400, message: '密码长度不能少于 6 位' };
    }
    if (username.length < 2 || username.length > 50) {
      this.setStatus(400);
      return { success: false, code: 400, message: '用户名长度应为 2-50 个字符' };
    }

    const isCodeValid = await verificationCodeService.verifyCode(email, code);
    if (!isCodeValid) {
      this.setStatus(400);
      return { success: false, code: 400, message: '验证码错误或已过期' };
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      this.setStatus(409);
      return { success: false, code: 409, message: '该用户名已被使用' };
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      this.setStatus(409);
      return { success: false, code: 409, message: '该邮箱已被注册' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({ username, email, password: hashedPassword, nickname: username, points: REGISTER_BONUS_POINTS });
    await appendRegisterBonusLog(userId, REGISTER_BONUS_POINTS);

    const token = jwt.sign(
      { id: userId, username, nickname: username, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

    return {
      success: true,
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: { id: userId, username, nickname: username, email, avatar: null, points: REGISTER_BONUS_POINTS },
      },
    };
  }
}
