import { Body, Controller, Get, Path, Post, Query, Request, Route, Security, Tags } from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as thirdPartyImageService from '../services/thirdPartyImage';
import * as openaiService from '../services/openai';
import ImageGenerationRecord from '../models/imageGenerationRecord';
import {
  buildPointsErrorResponse,
  confirmReservedPoints,
  releaseReservedPoints,
  reservePointsForImageGeneration,
} from '../services/points';

interface TextToImageGenerateBody {
  prompt?: string;
  size?: string;
  model?: string;
  n?: number;
  quality?: string;
  style?: string;
  uploadToCos?: boolean;
  useStream?: boolean;
}

interface ImageToImageBody {
  prompt: string;
  size?: string;
  imageUrl: string[];
  uploadToCos?: boolean;
  useStream?: boolean;
}

@Tags('文生图')
@Route('app/text-to-image')
export class TextToImageController extends Controller {
  @Post('/')
  @Security('jwt')
  async generateImageAndUpload(
    @Body() body: TextToImageGenerateBody,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;
    const {
      size = '1024x1536',
      model = 'gpt-image-1.5-all',
      n = 1,
      quality = 'medium',
      style = 'vivid',
      uploadToCos = true,
      useStream = true,
    } = body;
    const finalPrompt = body.prompt || thirdPartyImageService.getDefaultPrompt();
    const sessionId = uuidv4();
    let reservation: any = null;

    try {
      reservation = await reservePointsForImageGeneration({ userId, modelName: model, quantity: n });

      const apiResult = await thirdPartyImageService.generateImage({ prompt: finalPrompt, size, model, n, quality, style });
      const imageUrls = thirdPartyImageService.extractImageUrls(apiResult.data);

      if (imageUrls.length === 0) {
        throw new Error('第三方 API 未返回图片 URL');
      }

      const imageUrl = imageUrls[0];
      let uploadTask: any = null;
      if (uploadToCos) {
        uploadTask = openaiService.createUploadTask(
          { sourceType: 'url', originalUrl: imageUrl, imageUrl },
          { useStream: Boolean(useStream), startUploadImmediately: true }
        );
      }

      const recordId = await ImageGenerationRecord.create({
        session_id: sessionId,
        user_id: userId,
        generation_type: 'text-to-image',
        prompt: finalPrompt,
        model,
        size,
        quality,
        style,
        n,
        third_party_url: imageUrl,
        upload_task_id: uploadTask?.taskId,
        status: 'pending',
      });

      confirmReservedPoints(reservation, { recordId, sessionId, model, quantity: n });

      const responseData: any = {
        success: true,
        message: '成功',
        timestamp: new Date().toISOString(),
        data: {
          recordId,
          sessionId,
          thirdPartyUrl: imageUrl,
          thirdPartyResponse: apiResult.data,
        },
      };

      if (uploadTask) {
        responseData.data.upload = {
          taskId: uploadTask.taskId,
          status: uploadTask.status,
          queryPath: `/app/text-to-image/tasks/${uploadTask.taskId}`,
        };
      }

      return responseData;
    } catch (error) {
      await releaseReservedPoints(reservation, 'text-to-image-failed');
      const pointsError = buildPointsErrorResponse(error);
      if (pointsError) {
        this.setStatus(pointsError.statusCode);
        return pointsError.body;
      }
      this.setStatus(500);
      return { success: false, code: 500, message: error instanceof Error ? error.message : '生图失败' };
    }
  }

  @Get('/tasks/{taskId}')
  async getUploadTaskStatus(@Path() taskId: string): Promise<any> {
    if (!taskId) {
      this.setStatus(400);
      return { code: 400, message: '缺少参数: taskId' };
    }

    const task = openaiService.getUploadTaskStatus(taskId);
    if (!task) {
      this.setStatus(404);
      return { code: 404, message: '任务不存在或已过期' };
    }

    return { code: 200, data: task };
  }

  @Get('/records')
  @Security('jwt')
  async getRecordsByUser(
    @Request() req: ExpressRequest,
    @Query() generation_type?: string,
    @Query() page?: number,
    @Query() limit?: number
  ): Promise<any> {
    const userId = (req as any).user?.id;
    const result = await ImageGenerationRecord.listByUserId(userId, { generation_type, page, limit });
    return { success: true, code: 200, data: result };
  }

  @Get('/records/{sessionId}')
  @Security('jwt')
  async getRecordBySession(
    @Path() sessionId: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    if (!sessionId) {
      this.setStatus(400);
      return { success: false, code: 400, message: '缺少参数: sessionId' };
    }

    const userId = (req as any).user?.id;
    const record = await ImageGenerationRecord.findBySessionId(sessionId);

    if (!record) {
      this.setStatus(404);
      return { success: false, code: 404, message: '记录不存在' };
    }

    if (record.user_id !== userId) {
      this.setStatus(403);
      return { success: false, code: 403, message: '无权访问此记录' };
    }

    return { success: true, code: 200, data: record };
  }

  @Post('/image-to-image')
  @Security('jwt')
  async imageToImage(
    @Body() body: ImageToImageBody,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;
    let reservation: any = null;

    if (!body.prompt || !body.imageUrl || !Array.isArray(body.imageUrl) || body.imageUrl.length === 0) {
      this.setStatus(400);
      return { success: false, code: 400, message: '缺少必需参数: prompt 或 imageUrl' };
    }

    const { size, uploadToCos = true, useStream = true } = body;
    const sessionId = uuidv4();
    const model = 'gpt-image-1.5-all';

    try {
      reservation = await reservePointsForImageGeneration({ userId, modelName: model, quantity: 1 });

      const apiResult = await thirdPartyImageService.imageToImage({
        prompt: body.prompt,
        size,
        imageUrl: body.imageUrl,
      });

      const generatedUrls = thirdPartyImageService.extractImageUrlFromChat(apiResult.data);
      if (generatedUrls.length === 0) {
        throw new Error('第三方 API 未返回图片 URL');
      }

      const generatedUrl = generatedUrls[0];
      let uploadTask: any = null;
      if (uploadToCos) {
        uploadTask = openaiService.createUploadTask(
          { sourceType: 'url', originalUrl: generatedUrl, imageUrl: generatedUrl },
          { useStream: Boolean(useStream), startUploadImmediately: true }
        );
      }

      const recordId = await ImageGenerationRecord.create({
        session_id: sessionId,
        user_id: userId,
        generation_type: 'image-to-image',
        prompt: `${body.prompt} 尺寸[${size || ''}]`,
        model,
        size: size || '',
        quality: 'medium',
        style: 'vivid',
        n: 1,
        third_party_url: generatedUrl,
        upload_task_id: uploadTask?.taskId,
        status: 'pending',
      });

      confirmReservedPoints(reservation, { recordId, sessionId, model, quantity: 1 });

      const responseData: any = {
        success: true,
        message: '成功',
        timestamp: new Date().toISOString(),
        data: {
          recordId,
          sessionId,
          thirdPartyUrl: generatedUrl,
          thirdPartyResponse: apiResult.data,
        },
      };

      if (uploadTask) {
        responseData.data.upload = {
          taskId: uploadTask.taskId,
          status: uploadTask.status,
          queryPath: `/app/text-to-image/tasks/${uploadTask.taskId}`,
        };
      }

      return responseData;
    } catch (error) {
      await releaseReservedPoints(reservation, 'image-to-image-failed');
      const pointsError = buildPointsErrorResponse(error);
      if (pointsError) {
        this.setStatus(pointsError.statusCode);
        return pointsError.body;
      }
      this.setStatus(500);
      return { success: false, code: 500, message: error instanceof Error ? error.message : '图生图失败' };
    }
  }
}
