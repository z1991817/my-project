require('dotenv').config();
const { logApiCall } = require('../utils/logger');
const { externalHttpClient, buildExternalRequestConfig } = require('../utils/httpClient');

const LONG_REQUEST_TIMEOUT_MS = Number(process.env.THIRD_PARTY_IMAGE_TIMEOUT_MS || process.env.EXTERNAL_HTTP_TIMEOUT_MS || 0);
const GATEWAY_TIMEOUT_THRESHOLD_MS = 55000;

function buildLongRequestConfig(headers = {}) {
  return buildExternalRequestConfig({
    headers,
    timeout: LONG_REQUEST_TIMEOUT_MS,
    validateStatus: () => true,
  });
}

function throwIfHttpError(response, duration, apiName) {
  if (response.status < 400) {
    return;
  }

  const apiError = new Error(`第三方API调用失败: ${response.status}`);
  apiError.statusCode = response.status;
  apiError.responseData = response.data;
  apiError.responseHeaders = response.headers;
  apiError.isUpstreamGatewayTimeout =
    response.status === 502 &&
    duration >= GATEWAY_TIMEOUT_THRESHOLD_MS &&
    (!response.data || response.data === '');
  apiError.apiName = apiName;

  throw apiError;
}

/**
 * 第三方图片生成服务
 * 负责调用第三方API生成图片
 */

/**
 * 调用第三方图片生成API
 * @param {Object} options - 生成选项
 * @param {string} options.prompt - 图片生成提示词
 * @param {string} options.size - 图片尺寸（如 "1024x1536"，支持：1024x1024、1024x1536、1536x1024）
 * @param {string} options.model - 模型名称（默认：gpt-image-1.5-all）
 * @param {number} options.n - 生成图片数量（默认：1）
 * @param {string} options.quality - 图片质量（默认：medium，支持：low、medium、high）
 * @param {string} options.style - 图片风格（默认：vivid，支持：vivid、natural）
 * @returns {Promise<Object>} 返回第三方API响应数据
 */
async function generateImage(options = {}) {
  const {
    prompt,
    size = '1024x1536',
    model = 'gpt-image-1.5-all',
    n = 1,
    quality = 'medium',
    style = 'vivid',
  } = options;

  // 验证必需参数
  if (!prompt) {
    throw new Error('缺少必需参数: prompt');
  }

  // 验证环境变量
  if (!process.env.CREATE_BASE_URL) {
    throw new Error('缺少环境变量: CREATE_BASE_URL');
  }
  if (!process.env.GPT_IMAGE_KEY) {
    throw new Error('缺少环境变量: GPT_IMAGE_KEY');
  }

  // 构建请求URL
  const url = `${process.env.CREATE_BASE_URL}/images/generations`;

  // 构建请求参数
  const requestData = {
    prompt,
    model,
    n,
    size,
    quality,
    style,
    response_format: 'url',
  };

  // 隐藏API Key的敏感信息
  const maskedApiKey = process.env.GPT_IMAGE_KEY
    ? `${process.env.GPT_IMAGE_KEY.substring(0, 8)}...${process.env.GPT_IMAGE_KEY.substring(process.env.GPT_IMAGE_KEY.length - 4)}`
    : 'N/A';

  const requestHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${maskedApiKey}`,
  };

  console.log('=== [ThirdPartyImage] 开始调用第三方API ===');
  console.log('[ThirdPartyImage] 请求时间:', new Date().toISOString());
  console.log('[ThirdPartyImage] 请求URL:', url);
  console.log('[ThirdPartyImage] 请求头:', requestHeaders);
  console.log('[ThirdPartyImage] 请求体:', JSON.stringify(requestData, null, 2));

  const startTime = Date.now();

  try {
    // 调用第三方接口
    const response = await externalHttpClient.post(
      url,
      requestData,
      buildLongRequestConfig({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.GPT_IMAGE_KEY}`,
      })
    );

    const duration = Date.now() - startTime;
    throwIfHttpError(response, duration, '文生图 - /images/generations');

    console.log('=== [ThirdPartyImage] 第三方API响应成功 ===');
    console.log('[ThirdPartyImage] 响应时间:', new Date().toISOString());
    console.log('[ThirdPartyImage] 请求耗时:', `${duration}ms`);
    console.log('[ThirdPartyImage] 响应状态:', response.status);
    console.log('[ThirdPartyImage] 响应头:', JSON.stringify(response.headers, null, 2));
    console.log('[ThirdPartyImage] 响应数据:', JSON.stringify(response.data, null, 2));

    // 记录到日志文件
    logApiCall({
      apiName: '文生图 - /images/generations',
      url,
      requestHeaders,
      requestBody: requestData,
      success: true,
      status: response.status,
      responseHeaders: response.headers,
      responseData: response.data,
      duration,
    });

    // 验证响应数据
    if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('第三方API返回数据格式错误');
    }

    return {
      success: true,
      data: response.data,
      images: response.data.data,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('=== [ThirdPartyImage] 第三方API调用失败 ===');
    console.error('[ThirdPartyImage] 失败时间:', new Date().toISOString());
    console.error('[ThirdPartyImage] 请求耗时:', `${duration}ms`);
    console.error('[ThirdPartyImage] 错误类型:', error.code || 'UNKNOWN');
    console.error('[ThirdPartyImage] 错误信息:', error.message);

    // 记录到日志文件
    logApiCall({
      apiName: '文生图 - /images/generations',
      url,
      requestHeaders,
      requestBody: requestData,
      success: false,
      status: error.response?.status,
      responseHeaders: error.response?.headers,
      responseData: error.response?.data,
      duration,
      errorType: error.code || 'UNKNOWN',
      errorMessage: error.message,
    });

    if (error.isUpstreamGatewayTimeout) {
      console.error('[ThirdPartyImage] 上游网关在约60秒时返回 502，当前服务未主动超时。');
    }

    if (error.response || error.statusCode) {
      console.error('[ThirdPartyImage] 响应状态:', error.response?.status || error.statusCode);
      console.error('[ThirdPartyImage] 响应头:', JSON.stringify(error.response?.headers || error.responseHeaders || {}, null, 2));
      console.error('[ThirdPartyImage] 响应数据:', JSON.stringify(error.response?.data ?? error.responseData ?? '', null, 2));

      // 包装错误信息
      const apiError = new Error(`第三方API调用失败: ${error.response?.status || error.statusCode}`);
      apiError.statusCode = error.response?.status || error.statusCode;
      apiError.responseData = error.response?.data ?? error.responseData;
      throw apiError;
    } else if (error.request) {
      console.error('[ThirdPartyImage] 未收到响应');
      console.error('[ThirdPartyImage] 请求配置:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
      }, null, 2));
    }

    throw error;
  }
}

/**
 * 从第三方API响应中提取图片URL列表
 * @param {Object} apiResponse - 第三方API响应数据
 * @returns {Array<string>} 图片URL数组
 */
function extractImageUrls(apiResponse) {
  if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
    return [];
  }

  return apiResponse.data
    .map((item) => item.url)
    .filter((url) => url && typeof url === 'string');
}

/**
 * 图生图 - 调用第三方 /chat/completions 接口
 * @param {Object} options - 生成选项
 * @param {string} options.prompt - 图片生成提示词
 * @param {string} options.size - 图片尺寸（如 "4:3"）
 * @param {Array<string>} options.imageUrl - 图片URL数组
 * @returns {Promise<Object>} 返回第三方API响应数据
 */
async function imageToImage(options = {}) {
  const { prompt, size, imageUrl } = options;

  if (!prompt) throw new Error('缺少必需参数: prompt');
  if (!imageUrl || !Array.isArray(imageUrl) || imageUrl.length === 0) {
    throw new Error('缺少必需参数: imageUrl');
  }
  if (!process.env.CREATE_BASE_URL || !process.env.GPT_IMAGE_KEY) {
    throw new Error('缺少环境变量: CREATE_BASE_URL 或 GPT_IMAGE_KEY');
  }

  // 拼接尺寸到prompt
  const finalPrompt = size ? `${prompt} 尺寸[${size}]` : prompt;

  // 构建content数组
  const content = [{ type: 'text', text: finalPrompt }];
  imageUrl.forEach(url => {
    content.push({ type: 'image_url', image_url: { url } });
  });

  const requestData = {
    model: 'gpt-image-1.5-all',
    stream: false, // 不使用流式响应
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    messages: [{ role: 'user', content }]
  };

  // 隐藏API Key的敏感信息
  const maskedApiKey = process.env.GPT_IMAGE_KEY
    ? `${process.env.GPT_IMAGE_KEY.substring(0, 8)}...${process.env.GPT_IMAGE_KEY.substring(process.env.GPT_IMAGE_KEY.length - 4)}`
    : 'N/A';

  const apiUrl = `${process.env.CREATE_BASE_URL}/chat/completions`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${maskedApiKey}`
  };

  console.log('=== [ThirdPartyImage.imageToImage] 开始调用第三方API ===');
  console.log('[ThirdPartyImage.imageToImage] 请求时间:', new Date().toISOString());
  console.log('[ThirdPartyImage.imageToImage] 请求URL:', apiUrl);
  console.log('[ThirdPartyImage.imageToImage] 图片数量:', imageUrl.length);
  console.log('[ThirdPartyImage.imageToImage] 请求头:', requestHeaders);
  console.log('[ThirdPartyImage.imageToImage] 请求体:', JSON.stringify(requestData, null, 2));

  const startTime = Date.now();

  try {
    const response = await externalHttpClient.post(
      apiUrl,
      requestData,
      buildLongRequestConfig({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GPT_IMAGE_KEY}`
      })
    );

    const duration = Date.now() - startTime;
    throwIfHttpError(response, duration, '图生图 - /chat/completions');

    console.log('=== [ThirdPartyImage.imageToImage] API响应成功 ===');
    console.log('[ThirdPartyImage.imageToImage] 响应时间:', new Date().toISOString());
    console.log('[ThirdPartyImage.imageToImage] 请求耗时:', `${duration}ms`);
    console.log('[ThirdPartyImage.imageToImage] 响应状态:', response.status);
    console.log('[ThirdPartyImage.imageToImage] 响应头:', JSON.stringify(response.headers, null, 2));
    console.log('[ThirdPartyImage.imageToImage] 响应数据:', JSON.stringify(response.data, null, 2));

    // 记录到日志文件
    logApiCall({
      apiName: '图生图 - /chat/completions',
      url: apiUrl,
      requestHeaders,
      requestBody: requestData,
      success: true,
      status: response.status,
      responseHeaders: response.headers,
      responseData: response.data,
      duration,
    });

    return { success: true, data: response.data };
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('=== [ThirdPartyImage.imageToImage] API调用失败 ===');
    console.error('[ThirdPartyImage.imageToImage] 失败时间:', new Date().toISOString());
    console.error('[ThirdPartyImage.imageToImage] 请求耗时:', `${duration}ms`);
    console.error('[ThirdPartyImage.imageToImage] 错误类型:', error.code || 'UNKNOWN');
    console.error('[ThirdPartyImage.imageToImage] 错误信息:', error.message);

    // 记录到日志文件
    logApiCall({
      apiName: '图生图 - /chat/completions',
      url: apiUrl,
      requestHeaders,
      requestBody: requestData,
      success: false,
      status: error.response?.status,
      responseHeaders: error.response?.headers,
      responseData: error.response?.data,
      duration,
      errorType: error.code || 'UNKNOWN',
      errorMessage: error.message,
    });

    if (error.isUpstreamGatewayTimeout) {
      console.error('[ThirdPartyImage.imageToImage] 上游网关在约60秒时返回 502，当前服务未主动超时。');
    }

    if (error.response || error.statusCode) {
      console.error('[ThirdPartyImage.imageToImage] 响应状态:', error.response?.status || error.statusCode);
      console.error('[ThirdPartyImage.imageToImage] 响应头:', JSON.stringify(error.response?.headers || error.responseHeaders || {}, null, 2));
      console.error('[ThirdPartyImage.imageToImage] 响应数据:', JSON.stringify(error.response?.data ?? error.responseData ?? '', null, 2));

      const apiError = new Error(`第三方API调用失败: ${error.response?.status || error.statusCode}`);
      apiError.statusCode = error.response?.status || error.statusCode;
      apiError.responseData = error.response?.data ?? error.responseData;
      throw apiError;
    } else if (error.request) {
      console.error('[ThirdPartyImage.imageToImage] 未收到响应');
      console.error('[ThirdPartyImage.imageToImage] 请求配置:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout,
      }, null, 2));
    }

    throw error;
  }
}

/**
 * 从图生图响应中提取图片URL
 * @param {Object} apiResponse - API响应数据
 * @returns {Array<string>} 图片URL数组
 */
function extractImageUrlFromChat(apiResponse) {
  const urls = [];
  const content = apiResponse?.choices?.[0]?.message?.content;

  if (!content) return urls;

  // 格式1: content是字符串URL
  if (typeof content === 'string' && content.startsWith('http')) {
    urls.push(content);
    return urls;
  }

  // 格式2: content是Markdown格式，包含图片链接
  if (typeof content === 'string') {
    // 匹配 ![xxx](url) 格式
    const markdownRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }

    // 如果没找到Markdown格式，尝试直接匹配URL
    if (urls.length === 0) {
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(?:png|jpg|jpeg|gif|webp)/gi;
      const matches = content.match(urlRegex);
      if (matches) {
        urls.push(...matches);
      }
    }
    return urls;
  }

  // 格式3: content是数组
  if (Array.isArray(content)) {
    content.forEach(item => {
      if (item.type === 'image_url' && item.image_url?.url) {
        urls.push(item.image_url.url);
      }
    });
  }

  return urls;
}

/**
 * 获取默认提示词
 * @returns {string} 默认提示词
 */
function getDefaultPrompt() {
  return 'A masterpiece digital art illustration, highly detailed anime style. Side profile of a young girl with short bob hair, wearing detailed white sci-fi tech-wear, sitting cross-legged on an ergonomic chair in a dark server room. She is looking out of a massive floor-to-ceiling glass window. The Floor (Crucial for Depth): Highly polished, reflective black marble floor, mirroring the starry sky and city lights perfectly, creating a sense of infinite depth. Messy cables and server racks are visible in the dark room, faintly illuminated by blue screen glow. The View: Breathtaking vertical cyberpunk city. Towering skyscrapers with high-density window lights. A spectacular, crystal clear starry night sky with the Milky Way and shooting stars visible. Lighting & Texture: Cinematic lighting with volumetric bloom. Cool blue and cyan tones contrasting with sharp white starlight. Ray tracing rendering style, distinct light particles, 8k resolution, intricate details, Pixiv Hall of Fame quality, glossy texture, sharp focus. 9:16';
}

module.exports = {
  generateImage,
  extractImageUrls,
  imageToImage,
  extractImageUrlFromChat,
  getDefaultPrompt,
};
