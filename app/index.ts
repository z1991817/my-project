const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openai');
const textToImageController = require('../controllers/textToImage');
const authController = require('../controllers/authController');
const galleryController = require('../controllers/gallery');
const bananaTextToImageController = require('../controllers/bananaTextToImage');
const userAuthMiddleware = require('../middleware/userAuth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validation');
require('dotenv').config();

router.use('/categories', require('./categories'));
router.use('/images', require('./images'));

/**
 * 发送邮箱验证码
 * POST /app/send-code
 */
router.post('/send-code', authLimiter, authController.sendCode);

/**
 * 用户注册
 * POST /app/register
 */
router.post('/register', authLimiter, validate('register'), authController.register);

/**
 * 用户登录
 * POST /app/login
 */
router.post('/login', authLimiter, validate('login'), authController.login);

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

/**
 * 画廊接口 - 查询图片生成记录
 * GET /app/gallery
 * 查询参数: page, pageSize, generation_type, status
 * 返回数据按创建时间倒序排列（最新的在最上方）
 */
router.get('/gallery', galleryController.getGalleryList);

/**
 * 我的创作列表
 * GET /app/my-creations
 * 需要认证
 */
router.get('/my-creations', userAuthMiddleware, galleryController.getMyCreations);

/**
 * Banana 文生图接口
 * POST /app/banana-CreateImage
 * 需要认证
 * 入参: { model: string, prompt: string, aspectRatio: string }
 */
router.post('/banana-CreateImage', userAuthMiddleware, bananaTextToImageController.generateImage);

module.exports = router;
