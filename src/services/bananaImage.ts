/**
 * =====================================================
 * BananaImage Service - Banana 图片生成服务
 * =====================================================
 * 支持文生图（text-to-image）和图生图（image-to-image）
 * 通过 externalHttpClient 配置 proxy: false
 * =====================================================
 */

import { logApiCall } from '../utils/logger';
import { externalHttpClient, buildExternalRequestConfig } from '../utils/httpClient';
import { AxiosRequestConfig } from 'axios';

/** Banana API 基础地址 */
const BANANA_API_BASE_URL = 'https://makerend.com/v1beta/models';

/** 默认宽高比 */
const DEFAULT_ASPECT_RATIO = '16:9';

/** 脱敏后的 API Key（模块加载时计算一次） */
const maskedApiKey = (() => {
  const key = process.env.BANANA_API_KEY;
  if (!key || key.length < 12) return 'N/A';
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
})();

/** 长耗时请求配置 */
function buildLongRequestConfig(headers: Record<string, string> = {}): AxiosRequestConfig {
  return buildExternalRequestConfig({ headers, timeout: 0, validateStatus: () => true });
}

/** 校验公共必需参数 */
function validateCommonParams(model: string, prompt: string): void {
  if (!model) throw new Error('缺少必需参数: model');
  if (!prompt) throw new Error('缺少必需参数: prompt');
  if (!process.env.BANANA_API_KEY) throw new Error('缺少环境变量: BANANA_API_KEY');
}

/**
 * 统一调用 Banana API 并处理响应/错误
 */
async function callBananaApi(
  apiName: string,
  model: string,
  requestData: Record<string, any>,
): Promise<{ success: boolean; data: any }> {
  const url = `${BANANA_API_BASE_URL}/${model}:generateContent?key=${process.env.BANANA_API_KEY}`;
  const maskedUrl = `${BANANA_API_BASE_URL}/${model}:generateContent?key=${maskedApiKey}`;
  const requestHeaders = { 'Content-Type': 'application/json' };

  console.log(`=== [BananaImage] 开始调用 ${apiName} ===`);

  const startTime = Date.now();

  try {
    const response = await externalHttpClient.post(url, requestData, buildLongRequestConfig(requestHeaders));
    const duration = Date.now() - startTime;

    if (response.status >= 400) {
      const apiError: any = new Error(`Banana API调用失败: ${response.status}`);
      apiError.statusCode = response.status;
      apiError.responseData = response.data;
      apiError.responseHeaders = response.headers;
      apiError.apiName = apiName;
      throw apiError;
    }

    console.log(`[BananaImage] ${apiName} 成功, 耗时: ${duration}ms`);
    return { success: true, data: response.data };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error(`[BananaImage] ${apiName} 失败, 耗时: ${duration}ms, 错误: ${error.message}`);

    // 记录失败日志（图生图时省略 base64 数据）
    const logBody = requestData.contents?.[0]?.parts?.some((p: any) => p.inline_data)
      ? { ...requestData, contents: '[含base64图片数据，已省略]' }
      : requestData;

    logApiCall({
      apiName, url: maskedUrl, requestHeaders, requestBody: logBody,
      success: false,
      status: error.response?.status || error.statusCode,
      responseHeaders: error.response?.headers || error.responseHeaders,
      responseData: error.response?.data ?? error.responseData,
      duration, errorType: error.code || 'UNKNOWN', errorMessage: error.message,
    });

    if (error.response || error.statusCode) {
      const apiError: any = new Error(`Banana API调用失败: ${error.response?.status || error.statusCode}`);
      apiError.statusCode = error.response?.status || error.statusCode;
      apiError.responseData = error.response?.data ?? error.responseData;
      throw apiError;
    }
    throw error;
  }
}

/**
 * 将图片 URL 转换为 base64 编码（使用 externalHttpClient）
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await externalHttpClient.get(imageUrl, buildExternalRequestConfig({
    responseType: 'arraybuffer',
    timeout: 30000,
  }));

  const mimeType = response.headers['content-type'] || 'image/jpeg';
  const base64 = Buffer.from(response.data, 'binary').toString('base64');

  return { base64, mimeType };
}

/**
 * 调用 Banana 文生图 API
 */
export async function generateImage(options: {
  model: string;
  prompt: string;
  aspectRatio?: string;
}): Promise<{ success: boolean; data: any }> {
  const { model, prompt, aspectRatio = DEFAULT_ASPECT_RATIO } = options;
  validateCommonParams(model, prompt);

  console.log(`[BananaImage] 文生图 模型: ${model}, 尺寸: ${aspectRatio}`);

  const requestData = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio, numberOfImages: 1 },
    },
  };

  return callBananaApi('Banana文生图', model, requestData);
}

/**
 * 调用 Banana 图生图 API，支持多张参考图片
 */
export async function generateImageFromImage(options: {
  model: string;
  prompt: string;
  imageUrls: string[];
  aspectRatio?: string;
}): Promise<{ success: boolean; data: any }> {
  const { model, prompt, imageUrls, aspectRatio = DEFAULT_ASPECT_RATIO } = options;
  validateCommonParams(model, prompt);
  if (!imageUrls || imageUrls.length === 0) throw new Error('缺少必需参数: imageUrls（至少需要一张图片）');

  console.log(`[BananaImage] 图生图 模型: ${model}, 尺寸: ${aspectRatio}, 图片数量: ${imageUrls.length}`);

  // 并行下载所有图片并转为 base64
  const imageDataList = await Promise.all(imageUrls.map(url => fetchImageAsBase64(url)));

  const inlineDataParts = imageDataList.map(({ base64, mimeType }) => ({
    inline_data: { mime_type: mimeType, data: base64 },
  }));

  const requestData = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }, ...inlineDataParts],
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio, imageSize: '1K' },
    },
  };

  return callBananaApi('Banana图生图', model, requestData);
}
