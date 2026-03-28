import { Body, Controller, Post, Request, Route, Security, Tags } from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as bananaImageService from '../services/bananaImage';
import { uploadBase64ToCOS } from '../services/openai';
import ImageGenerationRecord from '../models/imageGenerationRecord';
import {
  buildPointsErrorResponse,
  confirmReservedPoints,
  releaseReservedPoints,
  reservePointsForImageGeneration,
} from '../services/points';

interface BananaGenerateImageBody {
  type?: 'text-to-image' | 'image-to-image';
  model: string;
  prompt: string;
  aspectRatio?: string;
  imageUrls?: string[];
  imageUrl?: string;
}

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

function filterThirdPartyResponse(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const result = JSON.parse(JSON.stringify(data));
  const parts = result?.candidates?.[0]?.content?.parts;

  if (Array.isArray(parts)) {
    result.candidates[0].content.parts = parts
      .filter((part: any) => !part.inlineData)
      .map(({ thoughtSignature, ...rest }: any) => rest);
  }

  return result;
}

@Tags('Banana 文生图')
@Route('app')
export class BananaTextToImageController extends Controller {
  @Post('/banana-CreateImage')
  @Security('jwt')
  async generateImage(
    @Body() body: BananaGenerateImageBody,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;
    const { type = 'text-to-image', model, prompt, aspectRatio, imageUrl, imageUrls } = body;
    let reservation: any = null;

    if (!model) {
      this.setStatus(400);
      return { success: false, code: 400, message: '缺少必需参数: model' };
    }

    if (!prompt) {
      this.setStatus(400);
      return { success: false, code: 400, message: '缺少必需参数: prompt' };
    }

    let resolvedImageUrls: string[] = [];
    if (type === 'image-to-image') {
      if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
        resolvedImageUrls = imageUrls;
      } else if (imageUrl) {
        resolvedImageUrls = [imageUrl];
      } else {
        this.setStatus(400);
        return { success: false, code: 400, message: '图生图模式缺少必需参数: imageUrls 或 imageUrl' };
      }
    }

    const sessionId = uuidv4();

    try {
      reservation = await reservePointsForImageGeneration({ userId, modelName: model, quantity: 1 });

      const result = type === 'image-to-image'
        ? await bananaImageService.generateImageFromImage({
            model,
            prompt,
            imageUrls: resolvedImageUrls,
            aspectRatio,
          })
        : await bananaImageService.generateImage({
            model,
            prompt,
            aspectRatio,
          });

      const imageData = extractBase64FromResponse(result.data);
      if (!imageData) {
        throw new Error('第三方 API 未返回图片数据');
      }

      let recordId: number | null = null;
      try {
        recordId = await ImageGenerationRecord.create({
          session_id: sessionId,
          user_id: userId,
          generation_type: type,
          prompt,
          model,
          size: aspectRatio || '16:9',
          quality: 'medium',
          style: 'vivid',
          n: 1,
          third_party_url: null,
          cos_url: null,
          upload_task_id: null,
          status: 'pending',
        });
      } catch (dbError: any) {
        console.error('[BananaTextToImage] create record failed:', dbError.message);
      }

      const dataUri = `data:${imageData.mimeType};base64,${imageData.base64}`;
      const uploadResult = await uploadBase64ToCOS(dataUri);

      if (recordId) {
        try {
          await ImageGenerationRecord.updateCosUrl(recordId, uploadResult.cosUrl, 'uploaded');
        } catch (dbError: any) {
          console.error('[BananaTextToImage] update record failed:', dbError.message);
        }
      }

      confirmReservedPoints(reservation, { recordId, sessionId, model, quantity: 1 });
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
    } catch (error) {
      await releaseReservedPoints(reservation, 'banana-generate-failed');
      const pointsError = buildPointsErrorResponse(error);
      if (pointsError) {
        this.setStatus(pointsError.statusCode);
        return pointsError.body;
      }
      this.setStatus(500);
      return { success: false, code: 500, message: error instanceof Error ? error.message : 'Banana 生图失败' };
    }
  }
}
