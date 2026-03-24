/**
 * =====================================================
 * ImageController - 图片控制器
 * =====================================================
 * 路由前缀：/app/images
 * 功能：图片列表、详情、上传、创建、更新、删除
 * 注意：文件上传通过 Express 原生中间件处理，不走 tsoa
 * =====================================================
 */

import { Controller, Get, Post, Put, Delete, Body, Route, Path, Tags, Query } from 'tsoa';
import Image from '../models/image';
import { uploadToCOS } from '../middleware/cosUpload';

/** 创建图片请求体 */
interface CreateImageBody {
  /** 图片URL */
  url: string;
  /** 图片描述 */
  description?: string;
  /** 提示词 */
  prompt?: string;
  /** 分类ID */
  category_id?: number;
  /** 标题 */
  title?: string;
}

/** 更新图片请求体 */
interface UpdateImageBody {
  url?: string;
  description?: string;
  prompt?: string;
  category_id?: number;
  title?: string;
}

@Tags('图片管理')
@Route('app/images')
export class ImageController extends Controller {
  /**
   * 获取图片列表（分页）
   * GET /app/images
   */
  @Get('/')
  async list(
    @Query() category_id?: number,
    @Query() description?: string,
    @Query() title?: string,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const result = await Image.list({
      category_id: category_id ? Number(category_id) : undefined,
      description,
      title,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
    return { code: 200, message: '获取成功', data: result };
  }

  /**
   * 获取图片详情
   * GET /app/images/:id
   */
  @Get('/{id}')
  async detail(@Path() id: number): Promise<any> {
    const image = await Image.findById(id);
    if (!image) {
      this.setStatus(404);
      return { code: 404, message: '图片不存在' };
    }
    return { code: 200, message: '获取成功', data: image };
  }

  /**
   * 创建图片（通过URL）
   * POST /app/images
   */
  @Post('/')
  async create(@Body() body: CreateImageBody): Promise<any> {
    if (!body.url || body.url.trim() === '') {
      this.setStatus(400);
      return { code: 400, message: '图片URL不能为空' };
    }
    const id = await Image.create({
      url: body.url.trim(),
      description: body.description,
      prompt: body.prompt,
      category_id: body.category_id,
      title: body.title,
    });
    return { code: 200, message: '上传成功', data: { id } };
  }

  /**
   * 更新图片
   * PUT /app/images/:id
   */
  @Put('/{id}')
  async update(@Path() id: number, @Body() body: UpdateImageBody): Promise<any> {
    const image = await Image.findById(id);
    if (!image) {
      this.setStatus(404);
      return { code: 404, message: '图片不存在' };
    }
    if (body.url !== undefined && body.url.trim() === '') {
      this.setStatus(400);
      return { code: 400, message: '图片URL不能为空' };
    }
    const success = await Image.update(id, {
      url: body.url ? body.url.trim() : undefined,
      description: body.description,
      prompt: body.prompt,
      category_id: body.category_id,
      title: body.title,
    });
    if (!success) {
      this.setStatus(400);
      return { code: 400, message: '更新失败' };
    }
    return { code: 200, message: '更新成功' };
  }

  /**
   * 删除图片
   * DELETE /app/images/:id
   */
  @Delete('/{id}')
  async delete(@Path() id: number): Promise<any> {
    const image = await Image.findById(id);
    if (!image) {
      this.setStatus(404);
      return { code: 404, message: '图片不存在' };
    }
    const success = await Image.delete(id);
    if (!success) {
      this.setStatus(400);
      return { code: 400, message: '删除失败' };
    }
    return { code: 200, message: '删除成功' };
  }
}
