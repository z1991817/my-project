const fs = require('fs');
const path = require('path');

/**
 * 日志工具类
 * 负责将日志写入文件，方便排查问题
 */

// 日志目录
const LOG_DIR = path.join(__dirname, '../logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 获取当前日期的日志文件路径
 * @returns {string} 日志文件路径
 */
function getLogFilePath() {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(LOG_DIR, `api-${dateStr}.log`);
}

/**
 * 写入日志到文件
 * @param {string} content - 日志内容
 */
function writeLog(content) {
  try {
    const logFile = getLogFilePath();
    const timestamp = new Date().toISOString();
    const logEntry = `\n${'='.repeat(80)}\n[${timestamp}]\n${content}\n${'='.repeat(80)}\n`;

    fs.appendFileSync(logFile, logEntry, 'utf8');
  } catch (error) {
    console.error('[Logger] 写入日志文件失败:', error.message);
  }
}

/**
 * 记录API请求日志
 * @param {Object} options - 日志选项
 * @param {string} options.apiName - API名称
 * @param {string} options.url - 请求URL
 * @param {Object} options.headers - 请求头
 * @param {Object} options.body - 请求体
 */
function logRequest(options) {
  const { apiName, url, headers, body } = options;

  const content = [
    `API名称: ${apiName}`,
    `请求URL: ${url}`,
    `请求头: ${JSON.stringify(headers, null, 2)}`,
    `请求体: ${JSON.stringify(body, null, 2)}`,
  ].join('\n');

  writeLog(content);
}

/**
 * 记录API响应日志（成功）
 * @param {Object} options - 日志选项
 * @param {string} options.apiName - API名称
 * @param {number} options.status - 响应状态码
 * @param {Object} options.headers - 响应头
 * @param {Object} options.data - 响应数据
 * @param {number} options.duration - 请求耗时（毫秒）
 */
function logResponse(options) {
  const { apiName, status, headers, data, duration } = options;

  const content = [
    `API名称: ${apiName}`,
    `响应状态: ${status}`,
    `请求耗时: ${duration}ms`,
    `响应头: ${JSON.stringify(headers, null, 2)}`,
    `响应数据: ${JSON.stringify(data, null, 2)}`,
  ].join('\n');

  writeLog(content);
}

/**
 * 记录API错误日志
 * @param {Object} options - 日志选项
 * @param {string} options.apiName - API名称
 * @param {string} options.errorType - 错误类型
 * @param {string} options.errorMessage - 错误信息
 * @param {number} options.status - 响应状态码（如果有）
 * @param {Object} options.headers - 响应头（如果有）
 * @param {Object} options.data - 响应数据（如果有）
 * @param {number} options.duration - 请求耗时（毫秒）
 * @param {Object} options.requestConfig - 请求配置（如果未收到响应）
 */
function logError(options) {
  const { apiName, errorType, errorMessage, status, headers, data, duration, requestConfig } = options;

  const content = [
    `API名称: ${apiName}`,
    `错误类型: ${errorType}`,
    `错误信息: ${errorMessage}`,
    `请求耗时: ${duration}ms`,
  ];

  if (status) {
    content.push(`响应状态: ${status}`);
    content.push(`响应头: ${JSON.stringify(headers, null, 2)}`);
    content.push(`响应数据: ${JSON.stringify(data, null, 2)}`);
  } else if (requestConfig) {
    content.push('未收到响应');
    content.push(`请求配置: ${JSON.stringify(requestConfig, null, 2)}`);
  }

  writeLog(content.join('\n'));
}

/**
 * 记录完整的API调用日志（请求+响应）
 * @param {Object} options - 日志选项
 * @param {string} options.apiName - API名称
 * @param {string} options.url - 请求URL
 * @param {Object} options.requestHeaders - 请求头
 * @param {Object} options.requestBody - 请求体
 * @param {boolean} options.success - 是否成功
 * @param {number} options.status - 响应状态码
 * @param {Object} options.responseHeaders - 响应头
 * @param {Object} options.responseData - 响应数据
 * @param {number} options.duration - 请求耗时（毫秒）
 * @param {string} options.errorType - 错误类型（如果失败）
 * @param {string} options.errorMessage - 错误信息（如果失败）
 */
function logApiCall(options) {
  const {
    apiName,
    url,
    requestHeaders,
    requestBody,
    success,
    status,
    responseHeaders,
    responseData,
    duration,
    errorType,
    errorMessage,
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

module.exports = {
  logRequest,
  logResponse,
  logError,
  logApiCall,
};
