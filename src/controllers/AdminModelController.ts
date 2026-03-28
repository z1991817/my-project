import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import AIModel from '../models/aiModel';

interface CreateModelBody {
  name: string;
  model_key?: string;
  manufacturer?: string;
  description?: string;
  aspect_ratio?: string;
  aspect_ratios?: string[];
  status?: number;
  consume_points: number;
}

interface UpdateModelBody {
  name?: string;
  model_key?: string;
  manufacturer?: string;
  description?: string;
  aspect_ratio?: string;
  aspect_ratios?: string[];
  status?: number;
  consume_points?: number;
}

function normalizeAspectRatios(aspectRatios?: string[], aspectRatio?: string): string[] {
  if (Array.isArray(aspectRatios)) {
    return Array.from(new Set(aspectRatios.map((item) => String(item).trim()).filter(Boolean)));
  }

  if (typeof aspectRatio === 'string' && aspectRatio.trim() !== '') {
    return Array.from(new Set(aspectRatio.split(',').map((item) => item.trim()).filter(Boolean)));
  }

  return [];
}

function normalizeStatus(status?: number): number | undefined {
  if (status === undefined || status === null) return undefined;
  return Number(status);
}

@Tags('模型管理')
@Route('api/v1/admin/models')
@Security('adminJwt')
export class AdminModelController extends Controller {
  @Get('/')
  async list(
    @Query() name?: string,
    @Query() status?: number,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const data = await AIModel.list({
      name,
      status: status !== undefined ? Number(status) : undefined,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });

    return { code: 200, message: 'ok', data };
  }

  @Get('/{id}')
  async detail(@Path() id: number): Promise<any> {
    const model = await AIModel.findById(id);
    if (!model) {
      this.setStatus(404);
      return { code: 404, message: '模型不存在' };
    }

    return { code: 200, message: 'ok', data: model };
  }

  @Post('/')
  async create(@Body() body: CreateModelBody): Promise<any> {
    if (!body.name || body.name.trim() === '') {
      this.setStatus(400);
      return { code: 400, message: '模型名称不能为空' };
    }

    const consumePoints = Number(body.consume_points);
    if (!Number.isInteger(consumePoints) || consumePoints < 0) {
      this.setStatus(400);
      return { code: 400, message: '消耗积分必须是大于等于 0 的整数' };
    }

    const status = normalizeStatus(body.status);
    if (status !== undefined && status !== 0 && status !== 1) {
      this.setStatus(400);
      return { code: 400, message: 'status only supports 0 or 1' };
    }

    const existing = await AIModel.findByName(body.name.trim());
    if (existing) {
      this.setStatus(409);
      return { code: 409, message: '模型名称已存在' };
    }

    const id = await AIModel.create({
      name: body.name.trim(),
      model_key: body.model_key !== undefined ? body.model_key.trim() || null : undefined,
      manufacturer: body.manufacturer !== undefined ? body.manufacturer.trim() || null : undefined,
      description: body.description,
      aspect_ratios: normalizeAspectRatios(body.aspect_ratios, body.aspect_ratio),
      status: status ?? 1,
      consume_points: consumePoints,
    });

    return { code: 200, message: '创建成功', data: { id } };
  }

  @Put('/{id}')
  async update(@Path() id: number, @Body() body: UpdateModelBody): Promise<any> {
    const model = await AIModel.findById(id);
    if (!model) {
      this.setStatus(404);
      return { code: 404, message: '模型不存在' };
    }

    if (body.name !== undefined && body.name.trim() === '') {
      this.setStatus(400);
      return { code: 400, message: '模型名称不能为空' };
    }

    if (body.consume_points !== undefined) {
      const consumePoints = Number(body.consume_points);
      if (!Number.isInteger(consumePoints) || consumePoints < 0) {
        this.setStatus(400);
        return { code: 400, message: '消耗积分必须是大于等于 0 的整数' };
      }
    }

    const status = normalizeStatus(body.status);
    if (status !== undefined && status !== 0 && status !== 1) {
      this.setStatus(400);
      return { code: 400, message: 'status only supports 0 or 1' };
    }

    if (body.name !== undefined && body.name.trim() !== model.name) {
      const existing = await AIModel.findByName(body.name.trim());
      if (existing && existing.id !== id) {
        this.setStatus(409);
        return { code: 409, message: '模型名称已存在' };
      }
    }

    const success = await AIModel.update(id, {
      name: body.name !== undefined ? body.name.trim() : undefined,
      model_key: body.model_key !== undefined ? body.model_key.trim() || null : undefined,
      manufacturer: body.manufacturer !== undefined ? body.manufacturer.trim() || null : undefined,
      description: body.description !== undefined ? body.description : undefined,
      aspect_ratios: body.aspect_ratios !== undefined || body.aspect_ratio !== undefined
        ? normalizeAspectRatios(body.aspect_ratios, body.aspect_ratio)
        : undefined,
      status,
      consume_points: body.consume_points !== undefined ? Number(body.consume_points) : undefined,
    });

    if (!success) {
      this.setStatus(400);
      return { code: 400, message: '更新失败' };
    }

    return { code: 200, message: '更新成功' };
  }

  @Delete('/{id}')
  async delete(@Path() id: number): Promise<any> {
    const model = await AIModel.findById(id);
    if (!model) {
      this.setStatus(404);
      return { code: 404, message: '模型不存在' };
    }

    const success = await AIModel.delete(id);
    if (!success) {
      this.setStatus(400);
      return { code: 400, message: '删除失败' };
    }

    return { code: 200, message: '删除成功' };
  }
}
