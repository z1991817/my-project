/**
 * =====================================================
 * BananaImage Service - Banana 文生图服务
 * =====================================================
 * 注意：通过 buildExternalRequestConfig 配置 proxy: false
 * =====================================================
 */

import { logApiCall } from '../utils/logger';
import { externalHttpClient, buildExternalRequestConfig } from '../utils/httpClient';
import { AxiosRequestConfig } from 'axios';

/** Banana API 基础地址 */
const BANANA_API_BASE_URL = 'https://makerend.com/v1beta/models';

function buildLongRequestConfig(headers: Record<string, string> = {}): AxiosRequestConfig {
  return buildExternalRequestConfig({ headers, timeout: 0, validateStatus: () => true });
}

function throwIfHttpError(response: any, duration: number, apiName: string): void {
  if (response.status < 400) return;
  const apiError: any = new Error(`Banana API调用失败: ${response.status}`);
  apiError.statusCode = response.status;
  apiError.responseData = response.data;
  apiError.responseHeaders = response.headers;
  apiError.apiName = apiName;
  throw apiError;
}

/**
 * 调用 Banana 文生图 API
 * @param options - 生成选项
 */
export async function generateImage(options: {
  model: string;
  prompt: string;
  aspectRatio?: string;
} = {} as any): Promise<{ success: boolean; data: any }> {
  const { model, prompt, aspectRatio = '16:9' } = options;

  if (!model) throw new Error('缺少必需参数: model');
  if (!prompt) throw new Error('缺少必需参数: prompt');
  if (!process.env.BANANA_API_KEY) throw new Error('缺少环境变量: BANANA_API_KEY');

  const url = `${BANANA_API_BASE_URL}/${model}:generateContent?key=${process.env.BANANA_API_KEY}`;
  const requestData = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio, numberOfImages: 1 } },
  };

  const maskedApiKey = process.env.BANANA_API_KEY ? `${process.env.BANANA_API_KEY.substring(0, 8)}...${process.env.BANANA_API_KEY.substring(process.env.BANANA_API_KEY.length - 4)}` : 'N/A';
  const maskedUrl = `${BANANA_API_BASE_URL}/${model}:generateContent?key=${maskedApiKey}`;
  const requestHeaders = { 'Content-Type': 'application/json' };

  console.log('=== [BananaImage] 开始调用 Banana 文生图 API ===');
  console.log('[BananaImage] 模型:', model, '| 尺寸比例:', aspectRatio);

  const startTime = Date.now();

  try {
    const response = await externalHttpClient.post(url, requestData, buildLongRequestConfig({ 'Content-Type': 'application/json' }));

    const duration = Date.now() - startTime;
    throwIfHttpError(response, duration, 'Banana文生图 - generateContent');

    console.log('=== [BananaImage] Banana API 响应成功 ===');
    console.log('[BananaImage] 请求耗时:', `${duration}ms`);

    return { success: true, data: response.data };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    console.error('=== [BananaImage] Banana API 调用失败 ===');
    console.error('[BananaImage] 请求耗时:', `${duration}ms`);
    console.error('[BananaImage] 错误信息:', error.message);

    logApiCall({ apiName: 'Banana文生图 - generateContent', url: maskedUrl, requestHeaders, requestBody: requestData, success: false, status: error.response?.status || error.statusCode, responseHeaders: error.response?.headers || error.responseHeaders, responseData: error.response?.data ?? error.responseData, duration, errorType: error.code || 'UNKNOWN', errorMessage: error.message });

    if (error.response || error.statusCode) {
      const apiError: any = new Error(`Banana API调用失败: ${error.response?.status || error.statusCode}`);
      apiError.statusCode = error.response?.status || error.statusCode;
      apiError.responseData = error.response?.data ?? error.responseData;
      throw apiError;
    }
    throw error;
  }
}
