import { Controller, Get, Path, Query, Route, Security, Tags } from 'tsoa';
import PaymentOrder from '../models/paymentOrder';
import PaymentTransaction from '../models/paymentTransaction';
import PointsLog from '../models/pointsLog';
import User from '../models/user';

@Tags('订单管理')
@Route('api/v1/admin')
@Security('adminJwt')
export class AdminOrderController extends Controller {
  @Get('/orders')
  async listOrders(
    @Query() orderNo?: string,
    @Query() status?: string,
    @Query() userId?: number,
    @Query() username?: string,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const data = await PaymentOrder.listByAdmin({
      orderNo,
      status,
      userId: userId !== undefined ? Number(userId) : undefined,
      username,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });

    return { code: 200, message: 'ok', data };
  }

  @Get('/orders/{id}')
  async orderDetail(@Path() id: number): Promise<any> {
    const order = await PaymentOrder.findDetailByIdForAdmin(id);
    if (!order) {
      this.setStatus(404);
      return { code: 404, message: '订单不存在' };
    }

    const transactions = await PaymentTransaction.listByOrderId(id);

    return {
      code: 200,
      message: 'ok',
      data: {
        order,
        transactions,
      },
    };
  }

  @Get('/customers')
  async listCustomers(
    @Query() username?: string,
    @Query() status?: number,
    @Query() page?: number,
    @Query() pageSize?: number
  ): Promise<any> {
    const data = await User.listForAdmin({
      username,
      status: status !== undefined ? Number(status) : undefined,
      page: Number(page) || 1,
      limit: Number(pageSize) || 10,
    });

    return { code: 200, message: 'ok', data };
  }

  @Get('/customers/{id}')
  async customerDetail(@Path() id: number): Promise<any> {
    const user = await User.findById(id);
    if (!user) {
      this.setStatus(404);
      return { code: 404, message: '用户不存在' };
    }

    const orders = await PaymentOrder.listByAdmin({ userId: id, page: 1, pageSize: 20 });
    const pointsLogs = await PointsLog.listByAdmin({ userId: id, page: 1, pageSize: 20 });

    const paidOrders = orders.list.filter((item: any) => item.status === 'paid');
    const totalRechargeAmount = paidOrders.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    const totalRechargePoints = paidOrders.reduce((sum: number, item: any) => sum + Number(item.points || 0), 0);

    return {
      code: 200,
      message: 'ok',
      data: {
        user,
        totalRechargeAmount,
        totalRechargePoints,
        recentOrders: orders.list,
        recentPointsLogs: pointsLogs.list,
      },
    };
  }

  @Get('/customers/{id}/points-logs')
  async customerPointsLogs(
    @Path() id: number,
    @Query() page?: number,
    @Query() pageSize?: number,
    @Query() changeType?: string
  ): Promise<any> {
    const user = await User.findById(id);
    if (!user) {
      this.setStatus(404);
      return { code: 404, message: '用户不存在' };
    }

    const data = await PointsLog.listByAdmin({
      userId: id,
      changeType,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
    });

    return { code: 200, message: 'ok', data };
  }
}
