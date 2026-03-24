/**
 * 统一 API 响应类型定义
 */

/** 通用响应格式 */
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
}

/** 分页响应格式 */
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

/** 成功响应工厂函数 */
export function successResponse<T>(data?: T, message = '操作成功'): ApiResponse<T> {
  return { success: true, code: 200, message, data };
}

/** 失败响应工厂函数 */
export function errorResponse(code: number, message: string): ApiResponse {
  return { success: false, code, message };
}
