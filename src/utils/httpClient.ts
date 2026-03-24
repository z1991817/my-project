/**
 * =====================================================
 * HTTP 客户端工具
 * =====================================================
 * 配置 proxy: false，避免本地代理在 60 秒时断开请求
 * 所有第三方接口调用必须使用此客户端
 * =====================================================
 */

import axios, { AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';

const DEFAULT_TIMEOUT_MS = Number(process.env.EXTERNAL_HTTP_TIMEOUT_MS || 0);

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
});

/** 外部 HTTP 客户端（proxy: false，避免本地代理截断长耗时请求） */
export const externalHttpClient = axios.create({
  proxy: false,
  timeout: DEFAULT_TIMEOUT_MS,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  httpAgent,
  httpsAgent,
});

/**
 * 构建外部请求配置（proxy: false）
 * @param overrides - 可覆盖的配置项
 */
export function buildExternalRequestConfig(overrides: AxiosRequestConfig = {}): AxiosRequestConfig {
  return {
    proxy: false,
    timeout: DEFAULT_TIMEOUT_MS,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    httpAgent,
    httpsAgent,
    ...overrides,
  };
}
