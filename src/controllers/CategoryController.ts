/**
 * =====================================================
 * CategoryController - 分类控制器
 * =====================================================
 * 路由前缀：/app/categories
 * 功能：分类的增删改查
 * =====================================================
 */

import { Controller, Get, Post, Put, Delete, Body, Route, Path, Tags, Query } from 'tsoa';
import Category from '../models/category';

/** 创建分类请求体 */
interface CreateCategoryBody {
  /** 分类名称 */
  name: string;
  /** 分类描述 */
  description?: string;
  /** 排序号 */
  sort_order?: number;
  /** 状态：1启用 0禁用 */
  status?: number;
}

/** 更新分类请求体 */
interface UpdateCategoryBody {
  name?: string;
  description?: string;
  sort_order?: number;
  status?: number;
}

/** 更新排序号请求体 */
interface UpdateSortOrderBody {
  sort_order: number;
}

@Tags('分类管理')
@Route('app/categories')
export class CategoryController extends Controller {
  /**
   * 获取分类列表（分页）
   * GET /app/categories
   */
  @Get('/')
  async list(
    @Query() name?: string,
    @Query() status?: number,
    @Query() page?: number,
    @Query() pageSize?: number,
    @Query() sortBy?: string,
    @Query() sortOrder?: string
  ): Promise<any> {
    const result = await Category.list({
      name,
      status: status !== undefined ? Number(status) : undefined,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
      sortBy,
      sortOrder,
    });
    return { code: 200, message: '获取成功', data: result };
  }

  /**
   * 获取所有启用分类（下拉使用）
   * GET /app/categories/enabled
   */
  @Get('/enabled')
  async getAllEnabled(): Promise<any> {
    const list = await Category.getAllEnabled();
    return { code: 200, message: '获取成功', data: list };
  }

  /**
   * 获取分类详情
   * GET /app/categories/:id
   */
  @Get('/{id}')
  async detail(@Path() id: number): Promise<any> {
    const category = await Category.findById(id);
    if (!category) {
      this.setStatus(404);
      return { code: 404, message: '分类不存在' };
    }
    return { code: 200, message: '获取成功', data: category };
  }

  /**
   * 创建分类
   * POST /app/categories
   */
  @Post('/')
  async create(@Body() body: CreateCategoryBody): Promise<any> {
    if (!body.name || body.name.trim() === '') {
      this.setStatus(400);
      return { code: 400, message: '分类名称不能为空' };
    }
    const id = await Category.create({
      name: body.name.trim(),
      description: body.description,
      sort_order: body.sort_order,
      status: body.status,
    });
    return { code: 200, message: '创建成功', data: { id } };
  }

  /**
   * 更新分类
   * PUT /app/categories/:id
   */
  @Put('/{id}')
  async update(@Path() id: number, @Body() body: UpdateCategoryBody): Promise<any> {
    const category = await Category.findById(id);
    if (!category) {
      this.setStatus(404);
      return { code: 404, message: '分类不存在' };
    }
    if (body.name !== undefined && body.name.trim() === '') {
      this.setStatus(400);
      return { code: 400, message: '分类名称不能为空' };
    }
    const success = await Category.update(id, {
      name: body.name ? body.name.trim() : undefined,
      description: body.description,
      sort_order: body.sort_order,
      status: body.status,
    });
    if (!success) {
      this.setStatus(400);
      return { code: 400, message: '更新失败' };
    }
    return { code: 200, message: '更新成功' };
  }

  /**
   * 更新分类排序号
   * PUT /app/categories/:id/sort
   */
  @Put('/{id}/sort')
  async updateSortOrder(@Path() id: number, @Body() body: UpdateSortOrderBody): Promise<any> {
    if (body.sort_order === undefined || body.sort_order === null) {
      this.setStatus(400);
      return { code: 400, message: '序号不能为空' };
    }
    const sortOrderNum = Number(body.sort_order);
    if (isNaN(sortOrderNum) || sortOrderNum < 0) {
      this.setStatus(400);
      return { code: 400, message: '序号必须是非负整数' };
    }
    const category = await Category.findById(id);
    if (!category) {
      this.setStatus(404);
      return { code: 404, message: '分类不存在' };
    }
    const success = await Category.update(id, { sort_order: sortOrderNum });
    if (!success) {
      this.setStatus(400);
      return { code: 400, message: '更新失败' };
    }
    return { code: 200, message: '更新成功' };
  }

  /**
   * 删除分类
   * DELETE /app/categories/:id
   */
  @Delete('/{id}')
  async delete(@Path() id: number): Promise<any> {
    const category = await Category.findById(id);
    if (!category) {
      this.setStatus(404);
      return { code: 404, message: '分类不存在' };
    }
    const success = await Category.delete(id);
    if (!success) {
      this.setStatus(400);
      return { code: 400, message: '删除失败' };
    }
    return { code: 200, message: '删除成功' };
  }
}
