const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openai');

// 分析图片
router.post('/analyze', openaiController.analyzeImage);

// 生成文本（聊天）
router.post('/chat', openaiController.generateText);

// 生成图片（文生图）
router.post('/generate', openaiController.generateImage);

module.exports = router;
