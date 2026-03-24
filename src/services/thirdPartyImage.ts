/**
 * =====================================================
 * ThirdPartyImage Service - 第三方图片生成服务
 * =====================================================
 * 注意：通过 buildExternalRequestConfig 配置 proxy: false
 * =====================================================
 */

import { logApiCall } from '../utils/logger';
import { externalHttpClient, buildExternalRequestConfig } from '../utils/httpClient';
import { AxiosRequestConfig } from 'axios';

const LONG_REQUEST_TIMEOUT_MS = Number(process.env.THIRD_PARTY_IMAGE_TIMEOUT_MS || process.env.EXTERNAL_HTTP_TIMEOUT_MS || 0);
const GATEWAY_TIMEOUT_THRESHOLD_MS = 55000;

function buildLongRequestConfig(headers: Record<string, string> = {}): AxiosRequestConfig {
  return buildExternalRequestConfig({ headers, timeout: LONG_REQUEST_TIMEOUT_MS, validateStatus: () => true });
}

function throwIfHttpError(response: any, duration: number, apiName: string): void {
  if (response.status < 400) return;
  const apiError: any = new Error(`第三方API调用失败: ${response.status}`);
  apiError.statusCode = response.status;
  apiError.responseData = response.data;
  apiError.responseHeaders = response.headers;
  apiError.isUpstreamGatewayTimeout = response.status === 502 && duration >= GATEWAY_TIMEOUT_THRESHOLD_MS && (!response.data || response.data === '');
  apiError.apiName = apiName;
  throw apiError;
}

/**
 * 调用第三方图片生成API（文生图）
 */
export async function generateImage(options: {
  prompt: string;
  size?: string;
  model?: string;
  n?: number;
  quality?: string;
  style?: string;
} = {} as any): Promise<{ success: boolean; data: any; images: any[] }> {
  const { prompt, size = '1024x1536', model = 'gpt-image-1.5-all', n = 1, quality = 'medium', style = 'vivid' } = options;

  if (!prompt) throw new Error('缺少必需参数: prompt');
  if (!process.env.CREATE_BASE_URL) throw new Error('缺少环境变量: CREATE_BASE_URL');
  if (!process.env.GPT_IMAGE_KEY) throw new Error('缺少环境变量: GPT_IMAGE_KEY');

  const url = `${process.env.CREATE_BASE_URL}/images/generations`;
  const requestData = { prompt, model, n, size, quality, style, response_format: 'url' };

  const maskedApiKey = process.env.GPT_IMAGE_KEY
    ? `${process.env.GPT_IMAGE_KEY.substring(0, 8)}...${process.env.GPT_IMAGE_KEY.substring(process.env.GPT_IMAGE_KEY.length - 4)}`
    : 'N/A';
  const requestHeaders = { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${maskedApiKey}` };

  console.log('=== [ThirdPartyImage] 开始调用第三方API ===');
  console.log('[ThirdPartyImage] 请求时间:', new Date().toISOString());
  console.log('[ThirdPartyImage] 请求URL:', url);
  console.log('[ThirdPartyImage] 请求体:', JSON.stringify(requestData, null, 2));

  const startTime = Date.now();

  try {
    const response = await externalHttpClient.post(url, requestData, buildLongRequestConfig({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.GPT_IMAGE_KEY}`,
    }));

    const duration = Date.now() - startTime;
    throwIfHttpError(response, duration, '文生图 - /images/generations');

    console.log('=== [ThirdPartyImage] 第三方API响应成功 ===');
    console.log('[ThirdPartyImage] 请求耗时:', `${duration}ms`);

    logApiCall({ apiName: '文生图 - /images/generations', url, requestHeaders, requestBody: requestData, success: true, status: response.status, responseHeaders: response.headers, responseData: response.data, duration });

    if (!response.data?.data || !Array.isArray(response.data.data)) throw new Error('第三方API返回数据格式错误');
    return { success: true, data: response.data, images: response.data.data };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('=== [ThirdPartyImage] 第三方API调用失败 ===');
    console.error('[ThirdPartyImage] 请求耗时:', `${duration}ms`);
    console.error('[ThirdPartyImage] 错误信息:', error.message);

    logApiCall({ apiName: '文生图 - /images/generations', url, requestHeaders, requestBody: requestData, success: false, status: error.response?.status, responseHeaders: error.response?.headers, responseData: error.response?.data, duration, errorType: error.code || 'UNKNOWN', errorMessage: error.message });

    if (error.isUpstreamGatewayTimeout) console.error('[ThirdPartyImage] 上游网关在约60秒时返回 502，当前服务未主动超时。');
    if (error.response || error.statusCode) {
      const apiError: any = new Error(`第三方API调用失败: ${error.response?.status || error.statusCode}`);
      apiError.statusCode = error.response?.status || error.statusCode;
      apiError.responseData = error.response?.data ?? error.responseData;
      throw apiError;
    }
    throw error;
  }
}

/** 从第三方API响应中提取图片URL列表 */
export function extractImageUrls(apiResponse: any): string[] {
  if (!apiResponse?.data || !Array.isArray(apiResponse.data)) return [];
  return apiResponse.data.map((item: any) => item.url).filter((url: any) => url && typeof url === 'string');
}

/**
 * 图生图 - 调用第三方 /chat/completions 接口
 */
export async function imageToImage(options: {
  prompt: string;
  size?: string;
  imageUrl: string[];
} = {} as any): Promise<{ success: boolean; data: any }> {
  const { prompt, size, imageUrl } = options;

  if (!prompt) throw new Error('缺少必需参数: prompt');
  if (!imageUrl || !Array.isArray(imageUrl) || imageUrl.length === 0) throw new Error('缺少必需参数: imageUrl');
  if (!process.env.CREATE_BASE_URL || !process.env.GPT_IMAGE_KEY) throw new Error('缺少环境变量: CREATE_BASE_URL 或 GPT_IMAGE_KEY');

  const finalPrompt = size ? `${prompt} 尺寸[${size}]` : prompt;
  const content: any[] = [{ type: 'text', text: finalPrompt }];
  imageUrl.forEach(url => content.push({ type: 'image_url', image_url: { url } }));

  const requestData = { model: 'gpt-image-1.5-all', stream: false, temperature: 0.7, top_p: 1, frequency_penalty: 0, presence_penalty: 0, messages: [{ role: 'user', content }] };
  const apiUrl = `${process.env.CREATE_BASE_URL}/chat/completions`;
  const maskedApiKey = process.env.GPT_IMAGE_KEY ? `${process.env.GPT_IMAGE_KEY.substring(0, 8)}...${process.env.GPT_IMAGE_KEY.substring(process.env.GPT_IMAGE_KEY.length - 4)}` : 'N/A';
  const requestHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${maskedApiKey}` };

  console.log('=== [ThirdPartyImage.imageToImage] 开始调用第三方API ===');
  console.log('[ThirdPartyImage.imageToImage] 图片数量:', imageUrl.length);

  const startTime = Date.now();

  try {
    const response = await externalHttpClient.post(apiUrl, requestData, buildLongRequestConfig({ 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GPT_IMAGE_KEY}` }));

    const duration = Date.now() - startTime;
    throwIfHttpError(response, duration, '图生图 - /chat/completions');

    console.log('=== [ThirdPartyImage.imageToImage] API响应成功 ===');
    console.log('[ThirdPartyImage.imageToImage] 请求耗时:', `${duration}ms`);

    logApiCall({ apiName: '图生图 - /chat/completions', url: apiUrl, requestHeaders, requestBody: requestData, success: true, status: response.status, responseHeaders: response.headers, responseData: response.data, duration });

    return { success: true, data: response.data };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('=== [ThirdPartyImage.imageToImage] API调用失败 ===');
    console.error('[ThirdPartyImage.imageToImage] 请求耗时:', `${duration}ms`);

    logApiCall({ apiName: '图生图 - /chat/completions', url: apiUrl, requestHeaders, requestBody: requestData, success: false, status: error.response?.status, responseHeaders: error.response?.headers, responseData: error.response?.data, duration, errorType: error.code || 'UNKNOWN', errorMessage: error.message });

    if (error.isUpstreamGatewayTimeout) console.error('[ThirdPartyImage.imageToImage] 上游网关在约60秒时返回 502，当前服务未主动超时。');
    if (error.response || error.statusCode) {
      const apiError: any = new Error(`第三方API调用失败: ${error.response?.status || error.statusCode}`);
      apiError.statusCode = error.response?.status || error.statusCode;
      apiError.responseData = error.response?.data ?? error.responseData;
      throw apiError;
    }
    throw error;
  }
}

/** 从图生图响应中提取图片URL */
export function extractImageUrlFromChat(apiResponse: any): string[] {
  const urls: string[] = [];
  const content = apiResponse?.choices?.[0]?.message?.content;
  if (!content) return urls;

  if (typeof content === 'string' && content.startsWith('http')) { urls.push(content); return urls; }
  if (typeof content === 'string') {
    const markdownRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(content)) !== null) urls.push(match[1]);
    if (urls.length === 0) {
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(?:png|jpg|jpeg|gif|webp)/gi;
      const matches = content.match(urlRegex);
      if (matches) urls.push(...matches);
    }
    return urls;
  }
  if (Array.isArray(content)) {
    content.forEach((item: any) => { if (item.type === 'image_url' && item.image_url?.url) urls.push(item.image_url.url); });
  }
  return urls;
}

/** 获取默认提示词 */
export function getDefaultPrompt(): string {
  return 'A masterpiece digital art illustration, highly detailed anime style. Side profile of a young girl with short bob hair, wearing detailed white sci-fi tech-wear, sitting cross-legged on an ergonomic chair in a dark server room. She is looking out of a massive floor-to-ceiling glass window. The Floor (Crucial for Depth): Highly polished, reflective black marble floor, mirroring the starry sky and city lights perfectly, creating a sense of infinite depth. Messy cables and server racks are visible in the dark room, faintly illuminated by blue screen glow. The View: Breathtaking vertical cyberpunk city. Towering skyscrapers with high-density window lights. A spectacular, crystal clear starry night sky with the Milky Way and shooting stars visible. Lighting & Texture: Cinematic lighting with volumetric bloom. Cool blue and cyan tones contrasting with sharp white starlight. Ray tracing rendering style, distinct light particles, 8k resolution, intricate details, Pixiv Hall of Fame quality, glossy texture, sharp focus. 9:16';
}
