import { Body, Controller, Post, Route, Tags } from 'tsoa';
import { mockCallbackPayByOrderNo, RechargeError } from '../services/recharge';

interface MockCallbackBody {
  orderNo: string;
  tradeNo?: string;
  status?: string;
}

@Tags('支付回调')
@Route('api/payment')
export class PaymentController extends Controller {
  @Post('/callback/mock')
  async mockCallback(@Body() body: MockCallbackBody): Promise<any> {
    if (!body.orderNo) {
      this.setStatus(400);
      return { code: 400, message: 'orderNo 不能为空' };
    }

    if (body.status !== undefined && body.status !== 'success') {
      this.setStatus(400);
      return { code: 400, message: 'mock 回调当前只支持 success' };
    }

    try {
      const result = await mockCallbackPayByOrderNo(body.orderNo, body.tradeNo);
      return {
        code: 200,
        message: result.alreadyPaid ? '订单已支付' : 'mock 回调处理成功',
        data: result,
      };
    } catch (error: any) {
      if (error instanceof RechargeError) {
        this.setStatus(error.statusCode);
        return { code: error.statusCode, message: error.message };
      }
      this.setStatus(500);
      return { code: 500, message: error?.message || 'mock 回调处理失败' };
    }
  }
}
