const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/adminUser');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
  }

  try {
    const user = await AdminUser.findByUsername(username);


    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    if (user.status === 0) {
      return res.status(403).json({ code: 403, message: '账号已被禁用，请联系管理员' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    await AdminUser.updateLastLogin(user.id);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
        },
      },
    });
  } catch (err) {
    console.error('[admin/login]', err);
    return res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await AdminUser.findById(req.adminUser.id);
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    return res.json({ code: 200, message: 'ok', data: user });
  } catch (err) {
    console.error('[admin/profile]', err);
    return res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.listUsers = async (req, res) => {
  const { username = '', page = 1, pageSize = 10 } = req.query;
  try {
    const data = await AdminUser.list({ username, page: +page, pageSize: +pageSize });
    return res.json({ code: 200, message: 'ok', data });
  } catch (err) {
    console.error('[admin/listUsers]', err);
    return res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.logout = (req, res) => {
  console.log(`[admin/logout] 用户 ${req.adminUser.username} 已登出`);
  return res.json({ code: 200, message: '已退出登录' });
};
