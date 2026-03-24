const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 获取分类列表
router.get('/', categoryController.list);

module.exports = router;
