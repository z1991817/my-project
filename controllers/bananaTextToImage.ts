const { v4: uuidv4 } = require('uuid');
const bananaImageService = require('../services/bananaImage');
const { uploadBase64ToCOS } = require('../services/openai');
const ImageGenerationRecord = require('../models/imageGenerationRecord');

/**
 * Banana 文生图控制器
 * 处理 Banana 文生图接口的请求和响应
 */

/**
 * 从 Banana API 响应中提取 base64 图片数据
 * 响应结构: candidates[0].content.parts[].inlineData.{ mimeType, data }
 * @param {Object} data - 第三方 API 响应数据
 * @returns {{ base64: string, mimeType: string } | null}
 */
function extractBase64FromResponse(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/jpeg',
      };
    }
  }
  return null;
}

/**
 * 过滤第三方响应中不需要返回给前端的字段
 * - inlineData.data: base64 图片数据，体积大不返回
 * - thoughtSignature: 内部签名字段
 * @param {Object} data - 第三方 API 响应数据
 * @returns {Object} 过滤后的响应数据
 */
function filterThirdPartyResponse(data) {
  if (!data || typeof data !== 'object') return data;

  const result = JSON.parse(JSON.stringify(data)); // 深拷贝，避免修改原对象

  const parts = result?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    result.candidates[0].content.parts = parts
      .filter((part) => !part.inlineData) // 去掉 base64 图片 part
      .map((part) => {
        const { thoughtSignature, ...rest } = part; // 去掉 thoughtSignature
        return rest;
      });
  }

  return result;
}

/**
 * 文生图 - 调用 Banana API 生成图片并上传到 COS
 * POST /app/banana-CreateImage
 * 需要认证
 *
 * @param {Object} req.body - 请求体
 * @param {string} req.body.model - 模型名称
 * @param {string} req.body.prompt - 提示词
 * @param {string} [req.body.aspectRatio="16:9"] - 尺寸比例
 */
async function generateImage(req, res, next) {
  try {
    const { model, prompt, aspectRatio } = req.body;

    // 参数校验
    if (!model) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少必需参数: model',
      });
    }
    if (!prompt) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '缺少必需参数: prompt',
      });
    }

    console.log(`[BananaTextToImage] 用户 ${req.user?.id} 请求文生图, 模型: ${model}, 尺寸: ${aspectRatio || '16:9'}`);

    // 调用 Banana 文生图服务
    const result = await bananaImageService.generateImage({
      model,
      prompt,
      aspectRatio,
    });

    // 从响应中提取 base64 图片
    const imageData = extractBase64FromResponse(result.data);
    if (!imageData) {
      console.error('[BananaTextToImage] 第三方 API 未返回图片数据');
      return res.status(500).json({
        success: false,
        code: 500,
        message: '第三方 API 未返回图片数据',
      });
    }

    console.log(`[BananaTextToImage] 提取图片成功, mimeType: ${imageData.mimeType}, 开始上传 COS...`);

    // 先写入生成记录（status: pending），获取记录 ID 用于后续更新
    let recordId = null;
    const sessionId = uuidv4();
    try {
      recordId = await ImageGenerationRecord.create({
        session_id: sessionId,
        user_id: req.user.id,
        generation_type: 'text-to-image',
        prompt,
        model,
        size: aspectRatio || '16:9',
        quality: 'medium',
        style: 'vivid',
        n: 1,
        third_party_url: null,  // 第三方返回 base64，无 URL
        cos_url: null,
        upload_task_id: null,   // 同步上传无需异步任务
        status: 'pending',
      });
      console.log(`[BananaTextToImage] 生成记录已创建, recordId: ${recordId}, sessionId: ${sessionId}`);
    } catch (dbError) {
      console.error('[BananaTextToImage] 创建生成记录失败:', dbError.message);
    }

    // 拼接 Data URI 格式，上传到 COS（含压缩和缩略图生成）
    const dataUri = `data:${imageData.mimeType};base64,${imageData.base64}`;
    const uploadResult = await uploadBase64ToCOS(dataUri);

    console.log(`[BananaTextToImage] COS 上传成功, cosUrl: ${uploadResult.cosUrl}`);

    // COS 上传成功后更新记录的 cos_url 和 status
    if (recordId) {
      try {
        await ImageGenerationRecord.updateCosUrl(recordId, uploadResult.cosUrl, 'uploaded');
        console.log(`[BananaTextToImage] 生成记录已更新, recordId: ${recordId}`);
      } catch (dbError) {
        console.error('[BananaTextToImage] 更新生成记录失败:', dbError.message);
      }
    }

    // 过滤掉不需要返回前端的字段（base64 图片、thoughtSignature）
    const filteredResponse = filterThirdPartyResponse(result.data);

    // 按 image-to-image 接口字段格式返回
    return res.status(200).json({
      success: true,
      message: '生成成功',
      timestamp: new Date().toISOString(),
      data: {
        cosUrl: uploadResult.cosUrl,
        thirdPartyResponse: filteredResponse,
      },
    });
  } catch (error) {
    console.error('[BananaTextToImage] 生成失败:', error.message);

    // 如果有第三方 API 状态码，返回对应错误信息
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.statusCode,
        message: error.message,
        data: error.responseData || null,
      });
    }

    // 其他未知错误
    return res.status(500).json({
      success: false,
      code: 500,
      message: error.message || '服务器内部错误',
    });
  }
}

module.exports = {
  generateImage,
};
