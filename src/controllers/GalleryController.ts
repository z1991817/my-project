/**
 * =====================================================
 * GalleryController - 画廊控制器
 * =====================================================
 * 路由前缀：/app
 * 功能：查询图片生成记录，用于画廊展示和用户创作列表
 * =====================================================
 */

import { Controller, Get, Route, Security, Request, Tags, Query } from 'tsoa';
import { Request as ExpressRequest } from 'express';
import db from '../config/db';

@Tags('画廊')
@Route('app')
export class GalleryController extends Controller {
  /**
   * 获取画廊列表（公开，按创建时间倒序）
   * GET /app/gallery
   */
  @Get('/gallery')
  async getGalleryList(
    @Query() page?: number,
    @Query() pageSize?: number,
    @Query() generation_type?: string,
    @Query() status?: string
  ): Promise<any> {
    const currentPage = Math.max(1, Number(page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const offset = (currentPage - 1) * limit;
    const statusFilter = status !== undefined ? status : 'uploaded'; // 默认只显示上传成功的

    // 构建动态 WHERE 子句
    const conditions: string[] = [];
    const params: any[] = [];

    if (generation_type) {
      conditions.push('generation_type = ?');
      params.push(generation_type);
    }

    if (statusFilter) {
      conditions.push('status = ?');
      params.push(statusFilter);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const [countResult]: any[] = await db.query(
      `SELECT COUNT(*) as total FROM image_generation_records ${whereClause}`,
      params
    );
    const total = (countResult as any[])[0].total;

    // 查询数据列表
    const [records]: any[] = await db.query(
      `SELECT
        id, session_id, user_id, generation_type, prompt,
        source_image_url, model, size, quality, style,
        n, third_party_url, cos_url, status, created_at, updated_at
      FROM image_generation_records
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      code: 200,
      message: '查询成功',
      data: {
        list: records,
        pagination: {
          page: currentPage,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * 获取当前用户的创作列表
   * GET /app/my-creations
   * 需要认证
   */
  @Get('/my-creations')
  @Security('jwt')
  async getMyCreations(
    @Request() req: ExpressRequest,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const userId = (req as any).user?.id;
    const currentPage = Math.max(1, Number(page) || 1);
    const limit = Math.min(100, Math.max(1, Number(pageSize) || 12));
    const offset = (currentPage - 1) * limit;

    // 查询总数
    const [countResult]: any[] = await db.query(
      'SELECT COUNT(*) as total FROM image_generation_records WHERE user_id = ? AND status = ?',
      [userId, 'uploaded']
    );
    const total = (countResult as any[])[0].total;

    // 查询数据列表
    const [records]: any[] = await db.query(
      `SELECT
        id, session_id, user_id, generation_type, prompt,
        source_image_url, model, size, quality, style,
        n, third_party_url, cos_url, status, created_at, updated_at
      FROM image_generation_records
      WHERE user_id = ? AND status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, 'uploaded', limit, offset]
    );

    return {
      code: 200,
      message: '查询成功',
      data: {
        list: records,
        pagination: {
          page: currentPage,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }
}
