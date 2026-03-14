const { v4: uuidv4 } = require('uuid');
const thirdPartyImageService = require('../services/thirdPartyImage');
const openaiService = require('../services/openai');
const ImageGenerationRecord = require('../models/imageGenerationRecord');

/**
 * 文生图接口控制器
 * 负责处理文本生成图片的业务逻辑
 */

/**
 * 文本生成图片并上传到COS
 * POST /app/text-to-image
 *
 * 工作流程：
 * 1. 调用第三方图片生成接口
 * 2. 立即返回第三方URL + taskId
 * 3. 后台使用流式管道异步上传到COS
 * 4. 前端可通过 taskId 查询上传状态
 *
 * @param {Object} req - Express请求对象
 * @param {Object} req.body.prompt - 图片生成提示词（可选）
 * @param {string} req.body.size - 图片尺寸（可选，默认 1024x1536，支持：1024x1024、1024x1536、1536x1024）
 * @param {string} req.body.model - 模型名称（可选，默认 gpt-image-1.5-all）
 * @param {number} req.body.n - 生成图片数量（可选，默认 1）
 * @param {string} req.body.quality - 图片质量（可选，默认 medium，支持：low、medium、high）
 * @param {string} req.body.style - 图片风格（可选，默认 vivid，支持：vivid、natural）
 * @param {boolean} req.body.uploadToCos - 是否上传到COS（可选，默认 true）
 * @param {boolean} req.body.useStream - 是否使用流式上传（可选，默认 true）
 * @param {boolean} req.body.compressBeforeUpload - 是否压缩图片（可选，默认 true，保持原格式压缩）
 * @param {number} req.body.compressQuality - 压缩质量（可选，默认 72，仅在压缩时生效）
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
async function generateImageAndUpload(req, res, next) {
  try {
    // 从认证中间件获取用户ID
    const userId = req.user.id;

    const {
      prompt,
      size = '1024x1536',
      model = 'gpt-image-1.5-all',
      n = 1,
      quality = 'medium',
      style = 'vivid',
      uploadToCos = true,
      useStream = true,
      compressBeforeUpload = true, // 默认开启压缩
      compressQuality = 72, // 压缩质量参数
    } = req.body;

    // 使用默认提示词（如果未提供）
    const finalPrompt = prompt || thirdPartyImageService.getDefaultPrompt();

    // 生成 session_id
    const sessionId = uuidv4();

    console.log('=== [TextToImage] 开始处理请求 ===');
    console.log('[TextToImage] 用户ID: %d, Session ID: %s', userId, sessionId);
    console.log('[TextToImage] 图片生成参数: model=%s, n=%d, size=%s, quality=%s, style=%s',
      model, n, size, quality, style);
    console.log('[TextToImage] 上传配置: uploadToCos=%s, useStream=%s, compressBeforeUpload=%s, compressQuality=%d',
      uploadToCos, useStream, compressBeforeUpload, compressQuality);

    // 1. 调用第三方API生成图片
    const apiResult = await thirdPartyImageService.generateImage({
      prompt: finalPrompt,
      size,
      model,
      n,
      quality,
      style,
    });

    // 2. 提取图片URL
    const imageUrls = thirdPartyImageService.extractImageUrls(apiResult.data);
    if (imageUrls.length === 0) {
      return res.status(500).json({
        success: false,
        message: '第三方API未返回图片URL',
        code: 500,
      });
    }

    const imageUrl = imageUrls[0];
    console.log('[TextToImage] 图片URL:', imageUrl);

    // 3. 创建上传任务（如果需要）
    let uploadTask = null;
    if (uploadToCos) {
      uploadTask = openaiService.createUploadTask(
        {
          sourceType: 'url',
          originalUrl: imageUrl,
          imageUrl: imageUrl,
        },
        {
          quality: Number(compressQuality) || 72,
          compressBeforeUpload: Boolean(compressBeforeUpload),
          useStream: Boolean(useStream),
          startUploadImmediately: true,
        }
      );

      console.log('[TextToImage] 创建上传任务: taskId=%s', uploadTask.taskId);
    }

    // 4. 创建生成记录
    const recordId = await ImageGenerationRecord.create({
      session_id: sessionId,
      user_id: userId,
      generation_type: 'text-to-image',
      prompt: finalPrompt,
      model,
      size,
      quality,
      style,
      n,
      third_party_url: imageUrl,
      upload_task_id: uploadTask?.taskId,
      status: 'pending',
    });

    console.log('[TextToImage] 创建生成记录: recordId=%d', recordId);

    // 5. 构建响应数据
    const responseData = {
      success: true,
      message: '成功',
      timestamp: new Date().toISOString(),
      data: {
        recordId,
        sessionId,
        thirdPartyUrl: imageUrl,
        thirdPartyResponse: apiResult.data,
      },
    };

    if (uploadTask) {
      responseData.data.upload = {
        taskId: uploadTask.taskId,
        status: uploadTask.status,
        queryPath: `/app/text-to-image/tasks/${uploadTask.taskId}`,
      };
    }

    // 6. 立即返回响应（不等待上传完成）
    return res.json(responseData);
  } catch (error) {
    console.error('=== [TextToImage] 处理失败 ===');
    console.error('[TextToImage] 错误信息:', error.message);

    // 处理第三方API错误
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: '第三方接口调用失败',
        error: error.message,
        errorDetails: error.responseData || null,
        code: error.statusCode,
      });
    }

    // 其他错误
    return next(error);
  }
}

/**
 * 查询上传任务状态
 * GET /app/text-to-image/tasks/:taskId
 *
 * @param {Object} req - Express请求对象
 * @param {string} req.params.taskId - 任务ID
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
async function getUploadTaskStatus(req, res, next) {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({
        code: 400,
        message: '缺少参数: taskId',
      });
    }

    // 查询任务状态
    const task = openaiService.getUploadTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({
        code: 404,
        message: '任务不存在或已过期',
      });
    }

    return res.json({
      code: 200,
      data: task,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * 查询用户的生成历史记录
 * GET /app/text-to-image/records
 * 需要认证
 *
 * @param {Object} req - Express请求对象
 * @param {string} req.query.generation_type - 生成类型筛选（可选）
 * @param {number} req.query.page - 页码（可选，默认1）
 * @param {number} req.query.limit - 每页数量（可选，默认10）
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
async function getRecordsByUser(req, res, next) {
  try {
    const userId = req.user.id;
    const { generation_type, page, limit } = req.query;

    const result = await ImageGenerationRecord.listByUserId(userId, {
      generation_type,
      page,
      limit,
    });

    return res.json({
      success: true,
      code: 200,
      data: result,
    });
  } catch (error) {
    console.error('[TextToImage.getRecordsByUser] Error:', error.message);
    return next(error);
  }
}

/**
 * 根据 session_id 查询单条记录
 * GET /app/text-to-image/records/:sessionId
 * 需要认证
 *
 * @param {Object} req - Express请求对象
 * @param {string} req.params.sessionId - 会话ID
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express next函数
 */
async function getRecordBySession(req, res, next) {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少参数: sessionId',
      });
    }

    const record = await ImageGenerationRecord.findBySessionId(sessionId);

    if (!record) {
      return res.status(404).json({
        success: false,
        code: 404,
        message: '记录不存在',
      });
    }

    // 验证记录是否属于当前用户
    if (record.user_id !== userId) {
      return res.status(403).json({
        success: false,
        code: 403,
        message: '无权访问此记录',
      });
    }

    return res.json({
      success: true,
      code: 200,
      data: record,
    });
  } catch (error) {
    console.error('[TextToImage.getRecordBySession] Error:', error.message);
    return next(error);
  }
}

/**
 * 图生图接口
 * POST /app/image-to-image
 *
 * @param {Object} req.body.prompt - 提示词
 * @param {string} req.body.size - 尺寸（如 "4:3"）
 * @param {Array<string>} req.body.imageUrl - 图片URL数组
 * @param {boolean} req.body.uploadToCos - 是否上传到COS（可选，默认 true）
 * @param {boolean} req.body.useStream - 是否使用流式上传（可选，默认 true）
 * @param {boolean} req.body.compressBeforeUpload - 是否压缩图片（可选，默认 true）
 * @param {number} req.body.compressQuality - 压缩质量（可选，默认 72）
 */
async function imageToImage(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      prompt,
      size,
      imageUrl,
      uploadToCos = true,
      useStream = true,
      compressBeforeUpload = true,
      compressQuality = 72
    } = req.body;

    if (!prompt || !imageUrl || !Array.isArray(imageUrl) || imageUrl.length === 0) {
      return res.status(400).json({
        success: false,
        message: '缺少必需参数: prompt 或 imageUrl',
        code: 400
      });
    }

    const sessionId = uuidv4();
    console.log('[ImageToImage] 用户ID: %d, Session ID: %s', userId, sessionId);
    console.log('[ImageToImage] 上传配置: uploadToCos=%s, useStream=%s, compressBeforeUpload=%s, compressQuality=%d',
      uploadToCos, useStream, compressBeforeUpload, compressQuality);

    // 调用第三方API
    const apiResult = await thirdPartyImageService.imageToImage({
      prompt,
      size,
      imageUrl
    });

    // 提取图片URL
    const generatedUrls = thirdPartyImageService.extractImageUrlFromChat(apiResult.data);
    if (generatedUrls.length === 0) {
      return res.status(500).json({
        success: false,
        message: '第三方API未返回图片URL',
        code: 500
      });
    }

    const generatedUrl = generatedUrls[0];
    console.log('[ImageToImage] 生成图片URL:', generatedUrl);

    // 创建上传任务（如果需要）
    let uploadTask = null;
    if (uploadToCos) {
      uploadTask = openaiService.createUploadTask(
        {
          sourceType: 'url',
          originalUrl: generatedUrl,
          imageUrl: generatedUrl,
        },
        {
          quality: Number(compressQuality) || 72,
          compressBeforeUpload: Boolean(compressBeforeUpload),
          useStream: Boolean(useStream),
          startUploadImmediately: true,
        }
      );
      console.log('[ImageToImage] 创建上传任务: taskId=%s', uploadTask.taskId);
    }

    // 创建记录
    const recordId = await ImageGenerationRecord.create({
      session_id: sessionId,
      user_id: userId,
      generation_type: 'image-to-image',
      prompt: `${prompt} 尺寸[${size || ''}]`,
      model: 'gpt-image-1.5-all',
      size: size || '',
      quality: 'medium',
      style: 'vivid',
      n: 1,
      third_party_url: generatedUrl,
      upload_task_id: uploadTask?.taskId,
      status: 'pending'
    });

    console.log('[ImageToImage] 创建生成记录: recordId=%d', recordId);

    // 构建响应数据
    const responseData = {
      success: true,
      message: '成功',
      timestamp: new Date().toISOString(),
      data: {
        recordId,
        sessionId,
        thirdPartyUrl: generatedUrl,
        thirdPartyResponse: apiResult.data,
      }
    };

    if (uploadTask) {
      responseData.data.upload = {
        taskId: uploadTask.taskId,
        status: uploadTask.status,
        queryPath: `/app/text-to-image/tasks/${uploadTask.taskId}`,
      };
    }

    return res.json(responseData);
  } catch (error) {
    console.error('[ImageToImage] 处理失败:', error.message);
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: '第三方接口调用失败',
        error: error.message,
        code: error.statusCode
      });
    }
    return next(error);
  }
}

module.exports = {
  generateImageAndUpload,
  getUploadTaskStatus,
  getRecordsByUser,
  getRecordBySession,
  imageToImage,
};
