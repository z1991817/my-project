const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openai');
const textToImageController = require('../controllers/textToImage');
const authController = require('../controllers/authController');
const userAuthMiddleware = require('../middleware/userAuth');
require('dotenv').config();

router.use('/categories', require('./categories'));
router.use('/images', require('./images'));

/**
 * 用户登录
 * POST /app/login
 */
router.post('/login', authController.login);

/**
 * 获取当前用户信息
 * GET /app/me
 * 需要认证
 */
router.get('/me', userAuthMiddleware, authController.getCurrentUser);

router.post('/textToImage', openaiController.generateImage);
router.post('/textToimageNew', openaiController.generateImageByChatCompletions);
router.get('/textToImage/tasks/:taskId', openaiController.getUploadTaskStatus);

/**
 * 文生图接口 - 文本生成图片并上传到COS
 * POST /app/text-to-image
 * 需要认证
 * 详细说明见 controllers/textToImage.js
 */
router.post('/text-to-image', userAuthMiddleware, textToImageController.generateImageAndUpload);

/**
 * 查询文生图上传任务状态
 * GET /app/text-to-image/tasks/:taskId
 * 详细说明见 controllers/textToImage.js
 */
router.get('/text-to-image/tasks/:taskId', textToImageController.getUploadTaskStatus);

/**
 * 查询用户的生成历史记录
 * GET /app/text-to-image/records
 * 需要认证
 */
router.get('/text-to-image/records', userAuthMiddleware, textToImageController.getRecordsByUser);

/**
 * 根据 session_id 查询单条记录
 * GET /app/text-to-image/records/:sessionId
 * 需要认证
 */
router.get('/text-to-image/records/:sessionId', userAuthMiddleware, textToImageController.getRecordBySession);

/**
 * 图生图接口
 * POST /app/image-to-image
 * 需要认证
 * 前端入参: { prompt: string, size: string, imageUrl: string[] }
 */
router.post('/image-to-image', userAuthMiddleware, textToImageController.imageToImage);

module.exports = router;
