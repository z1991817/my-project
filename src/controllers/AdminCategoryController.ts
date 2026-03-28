/**
 * =====================================================
 * AdminCategoryController - 管理端分类控制器
 * =====================================================
 * 路由前缀：/api/v1/admin/categories
 * 功能：分类的增删改查
 * =====================================================
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Route,
  Security,
  Tags,
} from 'tsoa';
import Category from '../models/category';

interface AdminCreateCategoryBody {
  name: string;
  description?: string;
  sort_order?: number;
  status?: number;
}

interface AdminUpdateCategoryBody {
  name?: string;
  description?: string;
  sort_order?: number;
  status?: number;
}

interface AdminUpdateSortOrderBody {
  sort_order: number;
}

@Tags('管理端分类')
@Route('api/v1/admin/categories')
export class AdminCategoryController extends Controller {
  /**
   * 获取分类列表（分页）
   * GET /api/v1/admin/categories
   */
  @Get('/')
  @Security('adminJwt')
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
   * 获取所有启用分类
   * GET /api/v1/admin/categories/enabled
   */
  @Get('/enabled')
  @Security('adminJwt')
  async getAllEnabled(): Promise<any> {
    const list = await Category.getAllEnabled();
    return { code: 200, message: '获取成功', data: list };
  }

  /**
   * 获取分类详情
   * GET /api/v1/admin/categories/:id
   */
  @Get('/{id}')
  @Security('adminJwt')
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
   * POST /api/v1/admin/categories
   */
  @Post('/')
  @Security('adminJwt')
  async create(@Body() body: AdminCreateCategoryBody): Promise<any> {
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
   * PUT /api/v1/admin/categories/:id
   */
  @Put('/{id}')
  @Security('adminJwt')
  async update(@Path() id: number, @Body() body: AdminUpdateCategoryBody): Promise<any> {
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
   * PUT /api/v1/admin/categories/:id/sort
   */
  @Put('/{id}/sort')
  @Security('adminJwt')
  async updateSortOrder(@Path() id: number, @Body() body: AdminUpdateSortOrderBody): Promise<any> {
    if (body.sort_order === undefined || body.sort_order === null) {
      this.setStatus(400);
      return { code: 400, message: '排序号不能为空' };
    }

    const sortOrderNum = Number(body.sort_order);
    if (isNaN(sortOrderNum) || sortOrderNum < 0) {
      this.setStatus(400);
      return { code: 400, message: '排序号必须是非负整数' };
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
   * DELETE /api/v1/admin/categories/:id
   */
  @Delete('/{id}')
  @Security('adminJwt')
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
