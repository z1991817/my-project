require('dotenv').config();
const { logApiCall } = require('../utils/logger');
const { externalHttpClient, buildExternalRequestConfig } = require('../utils/httpClient');

/**
 * Banana 文生图服务
 * 调用第三方 Banana API 生成图片
 */

/** 第三方 API 基础地址 */
const BANANA_API_BASE_URL = 'https://makerend.com/v1beta/models';

/**
 * 构建长耗时请求配置（图片生成场景）
 * @param {Object} headers - 自定义请求头
 * @returns {Object} 请求配置
 */
function buildLongRequestConfig(headers = {}) {
  return buildExternalRequestConfig({
    headers,
    timeout: 0, // 无超时限制，图片生成可能较久
    validateStatus: () => true, // 接受所有状态码，手动处理错误
  });
}

/**
 * 检查 HTTP 响应状态码，若为错误状态码则抛出异常
 * @param {Object} response - axios 响应对象
 * @param {number} duration - 请求耗时（毫秒）
 * @param {string} apiName - API 名称
 */
function throwIfHttpError(response, duration, apiName) {
  if (response.status < 400) {
    return;
  }

  const apiError = new Error(`Banana API调用失败: ${response.status}`);
  apiError.statusCode = response.status;
  apiError.responseData = response.data;
  apiError.responseHeaders = response.headers;
  apiError.apiName = apiName;

  throw apiError;
}

/**
 * 调用 Banana 文生图 API
 * @param {Object} options - 生成选项
 * @param {string} options.model - 模型名称（拼接到 URL 路径中）
 * @param {string} options.prompt - 图片生成提示词
 * @param {string} options.aspectRatio - 尺寸比例（如 "16:9"、"1:1"、"9:16"）
 * @returns {Promise<Object>} 返回第三方 API 响应数据
 */
async function generateImage(options = {}) {
  const { model, prompt, aspectRatio = '16:9' } = options;

  // 验证必需参数
  if (!model) {
    throw new Error('缺少必需参数: model');
  }
  if (!prompt) {
    throw new Error('缺少必需参数: prompt');
  }

  // 验证环境变量
  if (!process.env.BANANA_API_KEY) {
    throw new Error('缺少环境变量: BANANA_API_KEY');
  }

  // 构建请求 URL（API Key 通过 query 参数传递）
  const url = `${BANANA_API_BASE_URL}/${model}:generateContent?key=${process.env.BANANA_API_KEY}`;

  // 构建请求体（纯文生图，不包含 inline_data）
  const requestData = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio,
        numberOfImages: 1,
      },
    },
  };

  // 隐藏 API Key 的敏感信息（用于日志记录）
  const maskedApiKey = process.env.BANANA_API_KEY
    ? `${process.env.BANANA_API_KEY.substring(0, 8)}...${process.env.BANANA_API_KEY.substring(process.env.BANANA_API_KEY.length - 4)}`
    : 'N/A';
  const maskedUrl = `${BANANA_API_BASE_URL}/${model}:generateContent?key=${maskedApiKey}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
  };

  console.log('=== [BananaImage] 开始调用 Banana 文生图 API ===');
  console.log('[BananaImage] 请求时间:', new Date().toISOString());
  console.log('[BananaImage] 请求URL:', maskedUrl);
  console.log('[BananaImage] 模型:', model);
  console.log('[BananaImage] 尺寸比例:', aspectRatio);
  console.log('[BananaImage] 请求头:', requestHeaders);
  console.log('[BananaImage] 请求体:', JSON.stringify(requestData, null, 2));

  const startTime = Date.now();

  try {
    // 调用第三方接口（proxy: false 已通过 buildExternalRequestConfig 自动配置）
    const response = await externalHttpClient.post(
      url,
      requestData,
      buildLongRequestConfig({
        'Content-Type': 'application/json',
      })
    );

    const duration = Date.now() - startTime;
    throwIfHttpError(response, duration, 'Banana文生图 - generateContent');

    console.log('=== [BananaImage] Banana API 响应成功 ===');
    console.log('[BananaImage] 响应时间:', new Date().toISOString());
    console.log('[BananaImage] 请求耗时:', `${duration}ms`);
    console.log('[BananaImage] 响应状态:', response.status);
    console.log('[BananaImage] 响应头:', JSON.stringify(response.headers, null, 2));
    console.log('[BananaImage] 响应数据:', JSON.stringify(response.data, null, 2));

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('=== [BananaImage] Banana API 调用失败 ===');
    console.error('[BananaImage] 失败时间:', new Date().toISOString());
    console.error('[BananaImage] 请求耗时:', `${duration}ms`);
    console.error('[BananaImage] 错误类型:', error.code || 'UNKNOWN');
    console.error('[BananaImage] 错误信息:', error.message);

    // 记录到日志文件
    logApiCall({
      apiName: 'Banana文生图 - generateContent',
      url: maskedUrl,
      requestHeaders,
      requestBody: requestData,
      success: false,
      status: error.response?.status || error.statusCode,
      responseHeaders: error.response?.headers || error.responseHeaders,
      responseData: error.response?.data ?? error.responseData,
      duration,
      errorType: error.code || 'UNKNOWN',
      errorMessage: error.message,
    });

    if (error.response || error.statusCode) {
      console.error('[BananaImage] 响应状态:', error.response?.status || error.statusCode);
      console.error('[BananaImage] 响应头:', JSON.stringify(error.response?.headers || error.responseHeaders || {}, null, 2));
      console.error('[BananaImage] 响应数据:', JSON.stringify(error.response?.data ?? error.responseData ?? '', null, 2));

      // 包装错误信息
      const apiError = new Error(`Banana API调用失败: ${error.response?.status || error.statusCode}`);
      apiError.statusCode = error.response?.status || error.statusCode;
      apiError.responseData = error.response?.data ?? error.responseData;
      throw apiError;
    } else if (error.request) {
      console.error('[BananaImage] 未收到响应');
      console.error('[BananaImage] 请求配置:', JSON.stringify({
        url: maskedUrl,
        method: 'POST',
        timeout: error.config?.timeout,
      }, null, 2));
    }

    throw error;
  }
}

module.exports = {
  generateImage,
};
