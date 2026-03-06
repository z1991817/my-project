const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openai');

// 分类管理
router.use('/categories', require('./categories'));

// 图片管理
router.use('/images', require('./images'));

// 文生图
router.post('/textToImage', openaiController.generateImage);

module.exports = router;
