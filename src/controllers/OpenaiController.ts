import { Body, Controller, Get, Path, Post, Request, Route, Security, Tags } from 'tsoa';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { randomUUID } from 'crypto';
import * as openaiService from '../services/openai';
import Image from '../models/image';
import Conversation from '../models/conversation';
import {
  buildPointsErrorResponse,
  confirmReservedPoints,
  releaseReservedPoints,
  reservePointsForImageGeneration,
} from '../services/points';

interface AnalyzeImageBody {
  imageUrl: string;
  prompt?: string;
}

interface GenerateTextBody {
  prompt: string;
  systemPrompt?: string;
}

interface OpenaiGenerateImageBody {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  response_format?: string;
  style?: string;
  quality?: string;
  uploadToCos?: boolean;
  includeBase64InResponse?: boolean;
  includeThumbnailInResponse?: boolean;
  saveToDb?: boolean;
  title?: string;
  description?: string;
  category_id?: number;
}

interface GenerateImageByChatBody {
  session_id?: string;
  prompt?: string;
  imageUrl?: string;
  messages?: Array<{ role: string; content: any }>;
  model?: string;
  group?: string;
  stream?: boolean;
  uploadToCos?: boolean;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

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

function validateAndNormalizeSessionId(sessionId: any): string | null {
  if (!sessionId || typeof sessionId !== 'string') return null;
  const trimmed = sessionId.trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) return null;
  return trimmed;
}

function extractImageUrlsFromText(value: any): string[] {
  if (typeof value !== 'string' || !value) return [];
  const markdownMatches = value.match(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi) || [];
  const markdownUrls = markdownMatches
    .map((item) => item.match(/\((https?:\/\/[^)\s]+)\)/i)?.[1] || '')
    .filter(Boolean);
  const directUrls = value.match(/https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(?:png|jpg|jpeg|gif|webp)/gi) || [];
  return Array.from(new Set([...markdownUrls, ...directUrls]));
}

function containsImageOutput(payload: any): boolean {
  if (!payload) return false;
  if (typeof payload === 'string') return extractImageUrlsFromText(payload).length > 0;
  if (Array.isArray(payload)) return payload.some((item) => containsImageOutput(item));
  if (typeof payload !== 'object') return false;

  if (typeof payload.url === 'string' && payload.url.trim()) return true;
  if (typeof payload.b64_json === 'string' && payload.b64_json.trim()) return true;
  if (typeof payload.cos_url === 'string' && payload.cos_url.trim()) return true;
  if (typeof payload.imageBase64 === 'string' && payload.imageBase64.trim()) return true;
  if (typeof payload.image_id === 'number') return true;

  return Object.values(payload).some((value) => containsImageOutput(value));
}

function createStreamContentCollector(sessionId: string, shouldSave: boolean) {
  let fullContent = '';
  let imageId: number | null = null;

  return {
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
            // ignore chunk parse errors
          }
        }
      } catch (_) {
        // ignore stream collector errors
      }
    },

    async save() {
      if (!shouldSave || !fullContent) return;
      try {
        await Conversation.updateLastAssistantMessage(sessionId, fullContent, imageId);
      } catch (_) {
        // ignore persistence errors
      }
    },
  };
}

function createStreamBillingTracker(reservation: any, meta: Record<string, any>) {
  let confirmed = false;

  return {
    collect(chunk: Buffer) {
      if (confirmed) return;
      const text = chunk.toString('utf8');
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (containsImageOutput(parsed)) {
            confirmReservedPoints(reservation, meta);
            confirmed = true;
            break;
          }
        } catch (_) {
          // ignore chunk parse errors
        }
      }
    },

    async handleEnd() {
      if (confirmed) return;
      await releaseReservedPoints(reservation, 'textToimageNew-stream-no-image');
    },

    async handleError() {
      if (confirmed) return;
      await releaseReservedPoints(reservation, 'textToimageNew-stream-error');
    },
  };
}

@Tags('OpenAI')
@Route('app')
export class OpenaiController extends Controller {
  @Post('/analyzeImage')
  async analyzeImage(@Body() body: AnalyzeImageBody): Promise<any> {
    if (!body.imageUrl) {
      this.setStatus(400);
      return { code: 400, message: 'Missing imageUrl' };
    }
    const result = await (openaiService as any).analyzeImage(body.imageUrl, body.prompt);
    return { code: 200, data: result };
  }

  @Post('/generateText')
  async generateText(@Body() body: GenerateTextBody): Promise<any> {
    if (!body.prompt) {
      this.setStatus(400);
      return { code: 400, message: 'Missing prompt' };
    }
    const result = await (openaiService as any).generateText(body.prompt, body.systemPrompt);
    return { code: 200, data: { content: result } };
  }

  @Post('/generateImage')
  @Security('jwt')
  async generateImage(@Body() body: OpenaiGenerateImageBody, @Request() req: ExpressRequest): Promise<any> {
    if (!body.prompt) {
      this.setStatus(400);
      return { code: 400, message: 'Missing prompt' };
    }

    const userId = (req as any).user?.id;
    const modelName = body.model || 'gpt-4o-image';
    const quantity = Math.max(1, Number(body.n) || 1);
    let reservation: any = null;

    try {
      reservation = await reservePointsForImageGeneration({ userId, modelName, quantity });

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
        startUploadImmediately: false,
      };

      let results = await openaiService.generateImage(body.prompt, options);
      if (!Array.isArray(results) || !results.some((item: any) => containsImageOutput(item))) {
        throw new Error('OpenAI 未返回图片结果');
      }

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
            throw new Error('Database schema is outdated. Please run scripts/add_openai_task_columns.sql.');
          }
          throw error;
        }
      }

      confirmReservedPoints(reservation, { model: modelName, quantity });

      const date = new Date().toISOString().split('T')[0];
      const payload = { code: 200, data: { list: results, date } };

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
    } catch (error) {
      await releaseReservedPoints(reservation, 'generateImage-failed');
      const pointsError = buildPointsErrorResponse(error);
      if (pointsError) {
        this.setStatus(pointsError.statusCode);
        return pointsError.body;
      }
      this.setStatus(500);
      return { code: 500, message: error instanceof Error ? error.message : 'generateImage failed' };
    }
  }

  @Post('/textToimageNew')
  @Security('jwt')
  async generateImageByChatCompletions(
    @Body() body: GenerateImageByChatBody,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const res = (req as any).res as ExpressResponse;
    const userId = (req as any).user?.id;
    const hasMessages = Array.isArray(body.messages) && body.messages.length > 0;

    if (!hasMessages && !body.prompt) {
      this.setStatus(400);
      return { code: 400, message: 'Missing prompt or messages' };
    }

    const modelName = body.model || 'gpt-4o-image';
    const quantity = 2;
    const sessionId = validateAndNormalizeSessionId(body.session_id);
    let reservation: any = null;

    try {
      reservation = await reservePointsForImageGeneration({ userId, modelName, quantity });

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
          // degrade when history load fails
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

      if (!hasMessages) {
        try {
          await Conversation.create(finalSessionId, 'user', body.prompt!, null);
          await Conversation.create(finalSessionId, 'assistant', '', null);
        } catch (_) {
          // ignore persistence failures here
        }
      }

      const options: any = {
        model: modelName,
        group: body.group || 'default',
        stream: toBoolean(body.stream, false),
        uploadToCos: toBoolean(body.uploadToCos, true),
        temperature: body.temperature !== undefined ? body.temperature : 0.7,
        top_p: body.top_p !== undefined ? body.top_p : 1,
        frequency_penalty: body.frequency_penalty !== undefined ? body.frequency_penalty : 0,
        presence_penalty: body.presence_penalty !== undefined ? body.presence_penalty : 0,
        messages,
        n: quantity,
      };

      const result = await openaiService.generateImageByChatCompletions(options);

      if (result.stream) {
        const streamCollector = createStreamContentCollector(finalSessionId, !hasMessages);
        const billingTracker = createStreamBillingTracker(reservation, { sessionId: finalSessionId, model: modelName, quantity });

        res.status(result.status);
        Object.entries(result.headers as Record<string, any>).forEach(([key, value]) => {
          if (value !== undefined) res.setHeader(key, value as string);
        });
        res.setHeader('X-Session-Id', finalSessionId);

        result.stream.on('data', (chunk: Buffer) => {
          streamCollector.collect(chunk);
          billingTracker.collect(chunk);
        });
        result.stream.on('end', async () => {
          await streamCollector.save();
          await billingTracker.handleEnd();
        });
        result.stream.on('error', async (err: Error) => {
          console.error('[textToimageNew] stream error:', err.message);
          await billingTracker.handleError();
        });
        result.stream.pipe(res);
        return;
      }

      if (!containsImageOutput(result.data)) {
        throw new Error('OpenAI 未返回图片结果');
      }

      if (!hasMessages) {
        try {
          const aiContent = result.data?.choices?.[0]?.message?.content || '';
          if (aiContent) {
            await Conversation.updateLastAssistantMessage(finalSessionId, aiContent);
          }
        } catch (_) {
          // ignore persistence failures
        }
      }

      confirmReservedPoints(reservation, { sessionId: finalSessionId, model: modelName, quantity });

      return res.status(result.status).json({
        code: 200,
        data: { session_id: finalSessionId, ...result.data },
      });
    } catch (error) {
      await releaseReservedPoints(reservation, 'textToimageNew-failed');
      const pointsError = buildPointsErrorResponse(error);
      if (pointsError) {
        return res.status(pointsError.statusCode).json(pointsError.body);
      }
      return res.status(500).json({ code: 500, message: error instanceof Error ? error.message : 'textToimageNew failed' });
    }
  }

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
