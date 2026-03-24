/**
 * =====================================================
 * BananaTextToImageController - Banana 文生图控制器
 * =====================================================
 * 路由前缀：/app
 * 功能：调用 Banana API 生成图片并同步上传到 COS
 * =====================================================
 */

import { Controller, Post, Body, Route, Security, Request, Tags } from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as bananaImageService from '../services/bananaImage';
import { uploadBase64ToCOS } from '../services/openai';
import ImageGenerationRecord from '../models/imageGenerationRecord';

/** Banana 文生图请求体 */
interface BananaGenerateImageBody {
  /** 模型名称 */
  model: string;
  /** 提示词 */
  prompt: string;
  /** 尺寸比例（可选，默认 "16:9"） */
  aspectRatio?: string;
}

/**
 * 从 Banana API 响应中提取 base64 图片数据
 * 响应结构: candidates[0].content.parts[].inlineData.{ mimeType, data }
 */
function extractBase64FromResponse(data: any): { base64: string; mimeType: string } | null {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/jpeg',
      };
    }
  }
  return null;
}

/**
 * 过滤第三方响应中不需要返回给前端的字段
 * - inlineData.data: base64 图片数据，体积大不返回
 * - thoughtSignature: 内部签名字段
 */
function filterThirdPartyResponse(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const result = JSON.parse(JSON.stringify(data)); // 深拷贝，避免修改原对象
  const parts = result?.candidates?.[0]?.content?.parts;

  if (Array.isArray(parts)) {
    result.candidates[0].content.parts = parts
      .filter((part: any) => !part.inlineData) // 去掉 base64 图片 part
      .map(({ thoughtSignature, ...rest }: any) => rest); // 去掉 thoughtSignature
  }

  return result;
}

@Tags('Banana 文生图')
@Route('app')
export class BananaTextToImageController extends Controller {
  /**
   * Banana 文生图 - 生成图片并上传到 COS
   * POST /app/banana-CreateImage
   * 需要认证
   */
  @Post('/banana-CreateImage')
  @Security('jwt')
  async generateImage(
    @Body() body: BananaGenerateImageBody,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;

    if (!body.model) {
      this.setStatus(400);
      return { success: false, code: 400, message: '缺少必需参数: model' };
    }
    if (!body.prompt) {
      this.setStatus(400);
      return { success: false, code: 400, message: '缺少必需参数: prompt' };
    }

    console.log(`[BananaTextToImage] 用户 ${userId} 请求文生图, 模型: ${body.model}, 尺寸: ${body.aspectRatio || '16:9'}`);

    // 调用 Banana 文生图服务
    const result = await bananaImageService.generateImage({
      model: body.model,
      prompt: body.prompt,
      aspectRatio: body.aspectRatio,
    });

    // 从响应中提取 base64 图片
    const imageData = extractBase64FromResponse(result.data);
    if (!imageData) {
      console.error('[BananaTextToImage] 第三方 API 未返回图片数据');
      this.setStatus(500);
      return { success: false, code: 500, message: '第三方 API 未返回图片数据' };
    }

    console.log(`[BananaTextToImage] 提取图片成功, mimeType: ${imageData.mimeType}, 开始上传 COS...`);

    // 先写入生成记录（status: pending），获取 ID 用于后续更新
    let recordId: number | null = null;
    const sessionId = uuidv4();
    try {
      recordId = await ImageGenerationRecord.create({
        session_id: sessionId,
        user_id: userId,
        generation_type: 'text-to-image',
        prompt: body.prompt,
        model: body.model,
        size: body.aspectRatio || '16:9',
        quality: 'medium',
        style: 'vivid',
        n: 1,
        third_party_url: null,   // 第三方返回 base64，无 URL
        cos_url: null,
        upload_task_id: null,    // 同步上传无需异步任务
        status: 'pending',
      });
      console.log(`[BananaTextToImage] 生成记录已创建, recordId: ${recordId}, sessionId: ${sessionId}`);
    } catch (dbError: any) {
      console.error('[BananaTextToImage] 创建生成记录失败:', dbError.message);
    }

    // 拼接 Data URI，上传到 COS（含压缩和缩略图生成）
    const dataUri = `data:${imageData.mimeType};base64,${imageData.base64}`;
    const uploadResult = await uploadBase64ToCOS(dataUri);

    console.log(`[BananaTextToImage] COS 上传成功, cosUrl: ${uploadResult.cosUrl}`);

    // COS 上传成功后更新记录的 cos_url 和 status
    if (recordId) {
      try {
        await ImageGenerationRecord.updateCosUrl(recordId, uploadResult.cosUrl, 'uploaded');
        console.log(`[BananaTextToImage] 生成记录已更新, recordId: ${recordId}`);
      } catch (dbError: any) {
        console.error('[BananaTextToImage] 更新生成记录失败:', dbError.message);
      }
    }

    // 过滤掉不需要返回前端的字段（base64 图片、thoughtSignature）
    const filteredResponse = filterThirdPartyResponse(result.data);

    return {
      success: true,
      message: '生成成功',
      timestamp: new Date().toISOString(),
      data: {
        cosUrl: uploadResult.cosUrl,
        thirdPartyResponse: filteredResponse,
      },
    };
  }
}
