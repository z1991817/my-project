const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.post('/login', adminController.login);
router.get('/profile', authMiddleware, adminController.profile);
router.post('/logout', authMiddleware, adminController.logout);
router.get('/users', authMiddleware, adminController.listUsers);

// 分类管理
router.use('/categories', authMiddleware, require('./categories'));

// 图片管理
router.use('/images', authMiddleware, require('./images'));

module.exports = router;
