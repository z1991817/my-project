import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
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

export const externalHttpClient: AxiosInstance = axios.create({
  proxy: false,
  timeout: DEFAULT_TIMEOUT_MS,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
  httpAgent,
  httpsAgent,
});

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
