/**
 * =====================================================
 * TextToImageController - 文生图/图生图控制器
 * =====================================================
 * 路由前缀：/app/text-to-image
 * 功能：文本生成图片、图生图、查询上传任务状态、查询历史记录
 * =====================================================
 */

import { Controller, Post, Get, Body, Route, Security, Request, Tags, Path, Query } from 'tsoa';
import { Request as ExpressRequest } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as thirdPartyImageService from '../services/thirdPartyImage';
import * as openaiService from '../services/openai';
import ImageGenerationRecord from '../models/imageGenerationRecord';

/** 文生图请求体 */
interface TextToImageGenerateBody {
  /** 图片生成提示词（可选，不传则使用默认提示词） */
  prompt?: string;
  /** 图片尺寸（可选，默认 1024x1536） */
  size?: string;
  /** 模型名称（可选，默认 gpt-image-1.5-all） */
  model?: string;
  /** 生成图片数量（可选，默认 1） */
  n?: number;
  /** 图片质量（可选，默认 medium，支持：low、medium、high） */
  quality?: string;
  /** 图片风格（可选，默认 vivid，支持：vivid、natural） */
  style?: string;
  /** 是否上传到COS（可选，默认 true） */
  uploadToCos?: boolean;
  /** 是否使用流式上传（可选，默认 true） */
  useStream?: boolean;
}

/** 图生图请求体 */
interface ImageToImageBody {
  /** 提示词 */
  prompt: string;
  /** 尺寸比例（如 "4:3"） */
  size?: string;
  /** 图片URL数组 */
  imageUrl: string[];
  /** 是否上传到COS（可选，默认 true） */
  uploadToCos?: boolean;
  /** 是否使用流式上传（可选，默认 true） */
  useStream?: boolean;
}

@Tags('文生图')
@Route('app/text-to-image')
export class TextToImageController extends Controller {
  /**
   * 文本生成图片并上传到COS
   * POST /app/text-to-image
   *
   * 工作流程：
   * 1. 调用第三方API生成图片
   * 2. 立即返回第三方URL + taskId
   * 3. 后台异步上传到COS
   * 4. 前端可通过 taskId 查询上传状态
   */
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

    // 使用默认提示词（如果未提供）
    const finalPrompt = body.prompt || thirdPartyImageService.getDefaultPrompt();
    const sessionId = uuidv4();

    console.log('=== [TextToImage] 开始处理请求 ===');
    console.log('[TextToImage] 用户ID: %d, Session ID: %s', userId, sessionId);
    console.log('[TextToImage] 图片生成参数: model=%s, n=%d, size=%s, quality=%s, style=%s', model, n, size, quality, style);
    console.log('[TextToImage] 上传配置: uploadToCos=%s, useStream=%s', uploadToCos, useStream);

    // 1. 调用第三方API生成图片
    const apiResult = await thirdPartyImageService.generateImage({ prompt: finalPrompt, size, model, n, quality, style });

    // 2. 提取图片URL
    const imageUrls = thirdPartyImageService.extractImageUrls(apiResult.data);
    if (imageUrls.length === 0) {
      this.setStatus(500);
      return { success: false, code: 500, message: '第三方API未返回图片URL' };
    }

    const imageUrl = imageUrls[0];
    console.log('[TextToImage] 图片URL:', imageUrl);

    // 3. 创建上传任务（如果需要）
    let uploadTask: any = null;
    if (uploadToCos) {
      uploadTask = openaiService.createUploadTask(
        { sourceType: 'url', originalUrl: imageUrl, imageUrl },
        { useStream: Boolean(useStream), startUploadImmediately: true }
      );
      console.log('[TextToImage] 创建上传任务: taskId=%s', uploadTask.taskId);
    }

    // 4. 创建生成记录
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

    console.log('[TextToImage] 创建生成记录: recordId=%d', recordId);

    // 5. 构建响应数据
    const responseData: any = {
      success: true,
      message: '成功',
      timestamp: new Date().toISOString(),
      data: { recordId, sessionId, thirdPartyUrl: imageUrl, thirdPartyResponse: apiResult.data },
    };

    if (uploadTask) {
      responseData.data.upload = {
        taskId: uploadTask.taskId,
        status: uploadTask.status,
        queryPath: `/app/text-to-image/tasks/${uploadTask.taskId}`,
      };
    }

    return responseData;
  }

  /**
   * 查询上传任务状态
   * GET /app/text-to-image/tasks/:taskId
   */
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

  /**
   * 查询当前用户的生成历史记录
   * GET /app/text-to-image/records
   */
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

  /**
   * 根据 session_id 查询单条记录
   * GET /app/text-to-image/records/:sessionId
   */
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

  /**
   * 图生图接口
   * POST /app/text-to-image/image-to-image
   */
  @Post('/image-to-image')
  @Security('jwt')
  async imageToImage(
    @Body() body: ImageToImageBody,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;

    if (!body.prompt || !body.imageUrl || !Array.isArray(body.imageUrl) || body.imageUrl.length === 0) {
      this.setStatus(400);
      return { success: false, code: 400, message: '缺少必需参数: prompt 或 imageUrl' };
    }

    const { size, uploadToCos = true, useStream = true } = body;
    const sessionId = uuidv4();

    console.log('[ImageToImage] 用户ID: %d, Session ID: %s', userId, sessionId);
    console.log('[ImageToImage] 上传配置: uploadToCos=%s, useStream=%s', uploadToCos, useStream);

    // 调用第三方API
    const apiResult = await thirdPartyImageService.imageToImage({
      prompt: body.prompt,
      size,
      imageUrl: body.imageUrl,
    });

    // 提取图片URL
    const generatedUrls = thirdPartyImageService.extractImageUrlFromChat(apiResult.data);
    if (generatedUrls.length === 0) {
      this.setStatus(500);
      return { success: false, code: 500, message: '第三方API未返回图片URL' };
    }

    const generatedUrl = generatedUrls[0];
    console.log('[ImageToImage] 生成图片URL:', generatedUrl);

    // 创建上传任务（如果需要）
    let uploadTask: any = null;
    if (uploadToCos) {
      uploadTask = openaiService.createUploadTask(
        { sourceType: 'url', originalUrl: generatedUrl, imageUrl: generatedUrl },
        { useStream: Boolean(useStream), startUploadImmediately: true }
      );
      console.log('[ImageToImage] 创建上传任务: taskId=%s', uploadTask.taskId);
    }

    // 创建记录
    const recordId = await ImageGenerationRecord.create({
      session_id: sessionId,
      user_id: userId,
      generation_type: 'image-to-image',
      prompt: `${body.prompt} 尺寸[${size || ''}]`,
      model: 'gpt-image-1.5-all',
      size: size || '',
      quality: 'medium',
      style: 'vivid',
      n: 1,
      third_party_url: generatedUrl,
      upload_task_id: uploadTask?.taskId,
      status: 'pending',
    });

    console.log('[ImageToImage] 创建生成记录: recordId=%d', recordId);

    const responseData: any = {
      success: true,
      message: '成功',
      timestamp: new Date().toISOString(),
      data: { recordId, sessionId, thirdPartyUrl: generatedUrl, thirdPartyResponse: apiResult.data },
    };

    if (uploadTask) {
      responseData.data.upload = {
        taskId: uploadTask.taskId,
        status: uploadTask.status,
        queryPath: `/app/text-to-image/tasks/${uploadTask.taskId}`,
      };
    }

    return responseData;
  }
}
