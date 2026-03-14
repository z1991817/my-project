const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 用户登录
 * POST /api/auth/login
 *
 * @param {Object} req.body.username - 用户名
 * @param {Object} req.body.password - 密码
 */
async function login(req, res, next) {
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
async function getCurrentUser(req, res, next) {
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

module.exports = {
  login,
  getCurrentUser,
};
