import { Controller, Get, Query, Route, Tags } from 'tsoa';
import AIModel from '../models/aiModel';

@Tags('模型')
@Route('app/models')
export class AppModelController extends Controller {
  /**
   * 获取模型列表
   * GET /app/models
   */
  @Get('/')
  async list(
    @Query() name?: string,
    @Query() manufacturer?: string,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const data = await AIModel.list({
      name,
      manufacturer,
      status: 1,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
    });

    return { code: 200, message: 'ok', data };
  }
}
