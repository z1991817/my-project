/**
 * =====================================================
 * 日志工具类 - 将 API 调用日志写入文件
 * =====================================================
 */

import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/** 获取当前日期的日志文件路径 */
function getLogFilePath(): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return path.join(LOG_DIR, `api-${dateStr}.log`);
}

/** 写入日志内容 */
function writeLog(content: string): void {
  try {
    const logFile = getLogFilePath();
    const timestamp = new Date().toISOString();
    const logEntry = `\n${'='.repeat(80)}\n[${timestamp}]\n${content}\n${'='.repeat(80)}\n`;
    fs.appendFileSync(logFile, logEntry, 'utf8');
  } catch (error: any) {
    console.error('[Logger] 写入日志文件失败:', error.message);
  }
}

/** API 调用日志参数 */
export interface ApiCallLogOptions {
  apiName: string;
  url: string;
  requestHeaders?: any;
  requestBody?: any;
  success: boolean;
  status?: number;
  responseHeaders?: any;
  responseData?: any;
  duration: number;
  errorType?: string;
  errorMessage?: string;
}

/**
 * 记录完整的 API 调用日志（请求+响应）
 */
export function logApiCall(options: ApiCallLogOptions): void {
  const {
    apiName, url, requestHeaders, requestBody,
    success, status, responseHeaders, responseData,
    duration, errorType, errorMessage,
  } = options;

  const content = [
    `API名称: ${apiName}`,
    `状态: ${success ? '成功' : '失败'}`,
    '',
    '【请求信息】',
    `URL: ${url}`,
    `请求头: ${JSON.stringify(requestHeaders, null, 2)}`,
    `请求体: ${JSON.stringify(requestBody, null, 2)}`,
    '',
    '【响应信息】',
    `请求耗时: ${duration}ms`,
  ];

  if (success) {
    content.push(`响应状态: ${status}`);
    content.push(`响应头: ${JSON.stringify(responseHeaders, null, 2)}`);
    content.push(`响应数据: ${JSON.stringify(responseData, null, 2)}`);
  } else {
    content.push(`错误类型: ${errorType}`);
    content.push(`错误信息: ${errorMessage}`);
    if (status) {
      content.push(`响应状态: ${status}`);
      content.push(`响应头: ${JSON.stringify(responseHeaders, null, 2)}`);
      content.push(`响应数据: ${JSON.stringify(responseData, null, 2)}`);
    }
  }

  writeLog(content.join('\n'));
}
