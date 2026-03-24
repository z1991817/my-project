/**
 * =====================================================
 * OpenaiController - OpenAI 接口控制器
 * =====================================================
 * 路由前缀：/app
 * 功能：图片分析、文本生成、DALL-E 图片生成、Chat Completions 图片生成
 * 注意：generateImageByChatCompletions 含 SSE 流式响应，直接操作 Express res
 * =====================================================
 */

import { Controller, Post, Get, Body, Route, Security, Request, Tags, Path } from 'tsoa';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { randomUUID } from 'crypto';
import * as openaiService from '../services/openai';
import Image from '../models/image';
import Conversation from '../models/conversation';

/** 图片分析请求体 */
interface AnalyzeImageBody {
  /** 图片URL */
  imageUrl: string;
  /** 分析提示词（可选） */
  prompt?: string;
}

/** 文本生成请求体 */
interface GenerateTextBody {
  /** 提示词 */
  prompt: string;
  /** 系统提示词（可选） */
  systemPrompt?: string;
}

/** DALL-E 图片生成请求体 */
interface OpenaiGenerateImageBody {
  /** 提示词 */
  prompt: string;
  /** 模型（可选） */
  model?: string;
  /** 生成数量（可选） */
  n?: number;
  /** 尺寸（可选） */
  size?: string;
  /** 响应格式（可选） */
  response_format?: string;
  /** 风格（可选） */
  style?: string;
  /** 质量（可选） */
  quality?: string;
  /** 是否上传到COS（可选，默认 true） */
  uploadToCos?: boolean;
  /** 是否在响应中包含 Base64（可选，默认 false） */
  includeBase64InResponse?: boolean;
  /** 是否在响应中包含缩略图（可选） */
  includeThumbnailInResponse?: boolean;
  /** 是否保存到数据库（可选，默认 true） */
  saveToDb?: boolean;
  /** 标题（可选） */
  title?: string;
  /** 描述（可选） */
  description?: string;
  /** 分类ID（可选） */
  category_id?: number;
}

/** Chat Completions 图片生成请求体 */
interface GenerateImageByChatBody {
  /** 会话ID（可选，不传则创建新会话） */
  session_id?: string;
  /** 提示词 */
  prompt?: string;
  /** 参考图片URL（可选） */
  imageUrl?: string;
  /** 自定义消息数组（可选，优先级高于 prompt） */
  messages?: Array<{ role: string; content: any }>;
  /** 模型（可选，默认 gpt-4o-image） */
  model?: string;
  /** 分组（可选） */
  group?: string;
  /** 是否流式返回（可选，默认 false） */
  stream?: boolean;
  /** 是否上传到COS（可选，默认 true） */
  uploadToCos?: boolean;
  /** 温度参数（可选） */
  temperature?: number;
  /** top_p 参数（可选） */
  top_p?: number;
  /** frequency_penalty 参数（可选） */
  frequency_penalty?: number;
  /** presence_penalty 参数（可选） */
  presence_penalty?: number;
}

/**
 * 将任意值转换为 boolean
 */
function toBoolean(value: any, defaultValue = false): boolean {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return Boolean(value);
}

/**
 * 验证并规范化 session_id（仅接受 UUID v4 格式）
 */
function validateAndNormalizeSessionId(sessionId: any): string | null {
  if (!sessionId || typeof sessionId !== 'string') return null;
  const trimmed = sessionId.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) return null;
  return trimmed;
}

/**
 * 创建流式内容收集器，流结束后将 AI 回复保存到数据库
 */
function createStreamContentCollector(sessionId: string, shouldSave: boolean) {
  let fullContent = '';
  let imageId: number | null = null;

  return {
    /** 收集流数据块 */
    collect(chunk: Buffer) {
      if (!shouldSave) return;
      try {
        const text = chunk.toString('utf8');
        const lines = text.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              fullContent += parsed.choices[0].delta.content;
            }
            if (parsed.image_id) {
              imageId = Number(parsed.image_id);
            }
          } catch (_) {
            // 忽略 JSON 解析错误
          }
        }
      } catch (_) {
        // 收集失败不阻塞流
      }
    },

    /** 将完整内容保存到数据库 */
    async save() {
      if (!shouldSave || !fullContent) return;
      try {
        await Conversation.updateLastAssistantMessage(sessionId, fullContent, imageId);
      } catch (_) {
        // 保存失败不阻塞主流程
      }
    },
  };
}

@Tags('OpenAI')
@Route('app')
export class OpenaiController extends Controller {
  /**
   * 图片分析
   * POST /app/analyzeImage
   */
  @Post('/analyzeImage')
  async analyzeImage(@Body() body: AnalyzeImageBody): Promise<any> {
    if (!body.imageUrl) {
      this.setStatus(400);
      return { code: 400, message: 'Missing imageUrl' };
    }
    const result = await (openaiService as any).analyzeImage(body.imageUrl, body.prompt);
    return { code: 200, data: result };
  }

  /**
   * 文本生成
   * POST /app/generateText
   */
  @Post('/generateText')
  async generateText(@Body() body: GenerateTextBody): Promise<any> {
    if (!body.prompt) {
      this.setStatus(400);
      return { code: 400, message: 'Missing prompt' };
    }
    const result = await (openaiService as any).generateText(body.prompt, body.systemPrompt);
    return { code: 200, data: { content: result } };
  }

  /**
   * DALL-E 图片生成
   * POST /app/generateImage
   */
  @Post('/generateImage')
  @Security('jwt')
  async generateImage(@Body() body: OpenaiGenerateImageBody, @Request() req: ExpressRequest): Promise<any> {
    if (!body.prompt) {
      this.setStatus(400);
      return { code: 400, message: 'Missing prompt' };
    }

    const options = {
      model: body.model,
      n: body.n,
      size: body.size,
      response_format: body.response_format,
      style: body.style,
      quality: body.quality,
      uploadToCos: toBoolean(body.uploadToCos, true),
      includeBase64InResponse: toBoolean(body.includeBase64InResponse, false),
      includeThumbnailInResponse: toBoolean(body.includeThumbnailInResponse, true),
      startUploadImmediately: false, // app 路由延迟启动上传
    };

    let results = await openaiService.generateImage(body.prompt, options);

    // 追加 queryPath
    results = results.map((item: any) => {
      if (!item.upload?.taskId) return item;
      return {
        ...item,
        thumbnail: item.thumbnail || null,
        upload: {
          ...item.upload,
          queryPath: `/app/textToImage/tasks/${item.upload.taskId}`,
        },
      };
    });

    // 保存到数据库
    if (toBoolean(body.saveToDb, true)) {
      try {
        results = await Promise.all(
          results.map(async (item: any, index: number) => {
            const taskId = item.upload?.taskId || null;
            const sourceUrl = item.imageUrl || null;
            const initialUrl = sourceUrl || (taskId ? `openai://task/${taskId}` : `openai://generated/${Date.now()}-${index}`);
            const imageId = await Image.createFromOpenAITask({
              url: initialUrl,
              source_url: sourceUrl,
              thumbnail: item.thumbnail || null,
              title: body.title,
              description: body.description,
              prompt: body.prompt,
              category_id: body.category_id,
              upload_task_id: taskId,
              upload_status: item.upload?.status || null,
              upload_error: null,
            });
            if (taskId) {
              openaiService.bindUploadTask(taskId, imageId);
            }
            return { ...item, imageId };
          })
        );
      } catch (error: any) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
          this.setStatus(500);
          return {
            code: 500,
            message: 'Database schema is outdated. Please run scripts/add_openai_task_columns.sql.',
          };
        }
        throw error;
      }
    }

    const date = new Date().toISOString().split('T')[0];
    const payload = { code: 200, data: { list: results, date } };

    // 延迟启动上传任务（在响应发送后触发）
    const taskIds = results
      .map((item: any) => item.upload?.taskId)
      .filter((id: any) => typeof id === 'string' && id.length > 0);

    if (taskIds.length > 0) {
      setImmediate(() => {
        try {
          openaiService.startUploadTasks(taskIds);
        } catch (startError: any) {
          console.error('[start-upload-tasks-failed]', startError.message);
        }
      });
    }

    return payload;
  }

  /**
   * Chat Completions 图片生成（支持多轮对话 + SSE 流式）
   * POST /app/textToimageNew
   * 注意：SSE 流式响应时直接操作 Express res，绕过 tsoa 响应序列化
   */
  @Post('/textToimageNew')
  @Security('jwt')
  async generateImageByChatCompletions(
    @Body() body: GenerateImageByChatBody,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const res = (req as any).res as ExpressResponse;
    const hasMessages = Array.isArray(body.messages) && body.messages.length > 0;

    if (!hasMessages && !body.prompt) {
      this.setStatus(400);
      return { code: 400, message: 'Missing prompt or messages' };
    }

    const sessionId = validateAndNormalizeSessionId(body.session_id);

    // 加载对话历史
    let messages: Array<{ role: string; content: any }> = [];
    if (sessionId) {
      try {
        const history = await Conversation.getBySessionId(sessionId, 10);
        if (history.length > 0) {
          messages = history
            .filter((r: any) => r.content && r.content.trim().length > 0)
            .map((r: any) => ({ role: r.role, content: r.content }));
        }
      } catch (_) {
        // 降级：加载历史失败不阻塞
      }
    }

    if (hasMessages) {
      messages = body.messages!;
    } else {
      const userMessage: any = {
        role: 'user',
        content: body.imageUrl
          ? [
              { type: 'text', text: body.prompt },
              { type: 'image_url', image_url: { url: body.imageUrl } },
            ]
          : body.prompt,
      };
      messages.push(userMessage);
    }

    const finalSessionId = sessionId || randomUUID();

    // 保存用户消息和空占位符
    if (!hasMessages) {
      try {
        await Conversation.create(finalSessionId, 'user', body.prompt!, null);
        await Conversation.create(finalSessionId, 'assistant', '', null);
      } catch (_) {
        // 保存失败不阻塞
      }
    }

    const options: any = {
      model: body.model || 'gpt-4o-image',
      group: body.group || 'default',
      stream: toBoolean(body.stream, false),
      uploadToCos: toBoolean(body.uploadToCos, true),
      temperature: body.temperature !== undefined ? body.temperature : 0.7,
      top_p: body.top_p !== undefined ? body.top_p : 1,
      frequency_penalty: body.frequency_penalty !== undefined ? body.frequency_penalty : 0,
      presence_penalty: body.presence_penalty !== undefined ? body.presence_penalty : 0,
      messages,
      n: 2,
    };

    console.log('[textToimageNew] 传给第三方API的参数:', JSON.stringify(options, null, 2));

    const result = await openaiService.generateImageByChatCompletions(options);

    // ========== 流式响应 ==========
    if (result.stream) {
      const streamCollector = createStreamContentCollector(finalSessionId, !hasMessages);

      res.status(result.status);
      Object.entries(result.headers as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined) res.setHeader(key, value as string);
      });
      res.setHeader('X-Session-Id', finalSessionId);

      result.stream.on('data', (chunk: Buffer) => streamCollector.collect(chunk));
      result.stream.on('end', () => streamCollector.save());
      result.stream.on('error', (err: Error) => {
        console.error('[textToimageNew] stream error:', err.message);
      });
      result.stream.pipe(res);
      return;
    }

    // ========== 非流式响应 ==========
    if (!hasMessages) {
      try {
        const aiContent = result.data?.choices?.[0]?.message?.content || '';
        if (aiContent) {
          await Conversation.updateLastAssistantMessage(finalSessionId, aiContent);
        }
      } catch (_) {
        // 保存失败不阻塞
      }
    }

    return res.status(result.status).json({
      code: 200,
      data: { session_id: finalSessionId, ...result.data },
    });
  }

  /**
   * 查询上传任务状态
   * GET /app/textToImage/tasks/:taskId
   */
  @Get('/textToImage/tasks/{taskId}')
  async getUploadTaskStatus(@Path() taskId: string): Promise<any> {
    if (!taskId) {
      this.setStatus(400);
      return { code: 400, message: 'Missing taskId' };
    }

    const task = openaiService.getUploadTaskStatus(taskId);
    if (!task) {
      this.setStatus(404);
      return { code: 404, message: 'Task not found' };
    }

    return { code: 200, data: task };
  }
}
