import { Body, Controller, Get, Path, Post, Query, Request, Route, Security, Tags } from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { RECHARGE_PACKAGES } from '../constants/rechargePackages';
import PaymentOrder from '../models/paymentOrder';
import PointsLog from '../models/pointsLog';
import { createRechargeOrder, listOrderTransactions, mockPayRechargeOrder, RechargeError } from '../services/recharge';

interface CreateRechargeOrderBody {
  packageId: string;
}

@Tags('积分充值')
@Route('app')
export class RechargeController extends Controller {
  @Get('/recharge/packages')
  @Security('jwt')
  async getPackages(): Promise<any> {
    return {
      code: 200,
      message: 'ok',
      data: RECHARGE_PACKAGES,
    };
  }

  @Post('/recharge/orders')
  @Security('jwt')
  async createOrder(@Body() body: CreateRechargeOrderBody, @Request() req: ExpressRequest): Promise<any> {
    const userId = (req as any).user?.id;

    if (!body.packageId) {
      this.setStatus(400);
      return { code: 400, message: 'packageId 不能为空' };
    }

    try {
      const order = await createRechargeOrder(userId, body.packageId);
      return {
        code: 200,
        message: '创建订单成功',
        data: order,
      };
    } catch (error: any) {
      if (error instanceof RechargeError) {
        this.setStatus(error.statusCode);
        return { code: error.statusCode, message: error.message };
      }
      this.setStatus(500);
      return { code: 500, message: error?.message || '创建订单失败' };
    }
  }

  @Get('/recharge/orders')
  @Security('jwt')
  async listOrders(
    @Request() req: ExpressRequest,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const userId = (req as any).user?.id;
    const data = await PaymentOrder.listByUserId(userId, Number(page) || 1, Number(pageSize) || 10);

    return {
      code: 200,
      message: 'ok',
      data,
    };
  }

  @Get('/recharge/orders/{id}')
  @Security('jwt')
  async getOrderDetail(@Path() id: number, @Request() req: ExpressRequest): Promise<any> {
    const userId = (req as any).user?.id;
    const order = await PaymentOrder.findByIdAndUserId(id, userId);

    if (!order) {
      this.setStatus(404);
      return { code: 404, message: '订单不存在' };
    }

    return {
      code: 200,
      message: 'ok',
      data: {
        order,
        transactions: await listOrderTransactions(id),
      },
    };
  }

  @Post('/recharge/orders/{id}/mock-pay')
  @Security('jwt')
  async mockPay(@Path() id: number, @Request() req: ExpressRequest): Promise<any> {
    const userId = (req as any).user?.id;

    try {
      const result = await mockPayRechargeOrder(userId, id);
      return {
        code: 200,
        message: result.alreadyPaid ? '订单已支付' : '模拟支付成功',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof RechargeError) {
        this.setStatus(error.statusCode);
        return { code: error.statusCode, message: error.message };
      }
      this.setStatus(500);
      return { code: 500, message: error?.message || '模拟支付失败' };
    }
  }

  @Get('/points/logs')
  @Security('jwt')
  async getPointsLogs(
    @Request() req: ExpressRequest,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const userId = (req as any).user?.id;
    const data = await PointsLog.listByUserId(userId, Number(page) || 1, Number(pageSize) || 20);

    return {
      code: 200,
      message: 'ok',
      data,
    };
  }
}
