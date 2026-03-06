const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// 获取图片列表
router.get('/', imageController.list);

module.exports = router;
