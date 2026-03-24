const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userAuthMiddleware = require('../middleware/userAuth');

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', authController.login);

/**
 * 获取当前用户信息
 * GET /api/auth/me
 * 需要认证
 */
router.get('/me', userAuthMiddleware, authController.getCurrentUser);

module.exports = router;
