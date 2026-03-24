import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User = require('../models/user');
import emailService = require('../services/email');
import verificationCodeService = require('../services/verificationCode');
import { ApiResponse, JWTPayload } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '用户名和密码不能为空'
      });
    }

    // 查询用户
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    if (!user.password) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '该用户未设置密码，无法登录'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        code: 401,
        message: '用户名或密码错误'
      });
    }

    // 生成 Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 返回用户信息和 Token
    return res.json({
      success: true,
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          email: user.email,
          avatar: user.avatar,
        }
      }
    });
  } catch (error) {
    console.error('[Auth.login] Error:', error.message);
    return next(error);
  }
}

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * 需要认证
 */
async function getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.user 由认证中间件注入
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '用户不存在'
      });
    }

    return res.json({
      success: true,
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        created_at: user.created_at,
      }
    });
  } catch (error) {
    console.error('[Auth.getCurrentUser] Error:', error.message);
    return next(error);
  }
}

/**
 * 发送邮箱验证码
 * POST /api/auth/send-code
 *
 * @param {Object} req.body.email - 邮箱地址
 */
async function sendCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;

    // 参数验证
    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '邮箱格式不正确'
      });
    }

    // 检查邮箱是否已注册
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: 409,
        message: '该邮箱已被注册'
      });
    }

    // 检查发送频率限制（60秒内不可重复发送，仅检查不设置）
    const rateLimitKey = `verify_limit:${email}`;
    const redis = require('../config/redis');
    const isLimited = await redis.exists(rateLimitKey);
    if (isLimited) {
      return res.status(429).json({
        success: false,
        code: 429,
        message: '发送太频繁，请 60 秒后再试'
      });
    }

    // 生成验证码并存入 Redis
    const code = verificationCodeService.generateCode();
    await verificationCodeService.saveCode(email, code);

    // 发送邮件
    await emailService.sendVerificationCode(email, code);

    // 邮件发送成功后才设置频率限制
    await verificationCodeService.checkRateLimit(email);

    return res.json({
      success: true,
      code: 200,
      message: '验证码已发送至邮箱'
    });
  } catch (error) {
    console.error('[Auth.sendCode] Error:', error.message);
    return next(error);
  }
}

/**
 * 用户注册
 * POST /api/auth/register
 *
 * @param {Object} req.body.username - 用户名
 * @param {Object} req.body.email - 邮箱地址
 * @param {Object} req.body.password - 密码（至少6位）
 * @param {Object} req.body.code - 邮箱验证码
 */
async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password, code } = req.body;

    // 参数验证
    if (!username || !email || !password || !code) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '用户名、邮箱、密码和验证码不能为空'
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '邮箱格式不正确'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '密码长度不能少于 6 位'
      });
    }

    if (username.length < 2 || username.length > 50) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '用户名长度应为 2-50 个字符'
      });
    }

    // 校验邮箱验证码
    const isCodeValid = await verificationCodeService.verifyCode(email, code);
    if (!isCodeValid) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '验证码错误或已过期'
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        code: 409,
        message: '该用户名已被使用'
      });
    }

    // 检查邮箱是否已注册
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        code: 409,
        message: '该邮箱已被注册'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const userId = await User.create({
      username,
      email,
      password: hashedPassword,
      nickname: username, // 默认昵称与用户名一致
    });

    // 签发 JWT Token
    const token = jwt.sign(
      {
        id: userId,
        username,
        nickname: username,
        email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: {
          id: userId,
          username,
          nickname: username,
          email,
          avatar: null,
        }
      }
    });
  } catch (error) {
    console.error('[Auth.register] Error:', error.message);
    return next(error);
  }
}

export = {
  login,
  getCurrentUser,
  sendCode,
  register,
};
