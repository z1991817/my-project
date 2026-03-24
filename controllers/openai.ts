const openaiService = require('../services/openai');
const Image = require('../models/image');
const Conversation = require('../models/conversation');
const { randomUUID } = require('crypto');

function toBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return Boolean(value);
}

async function analyzeImage(req, res, next) {
  try {
    const { imageUrl, prompt } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ code: 400, message: 'Missing imageUrl' });
    }

    const result = await openaiService.analyzeImage(imageUrl, prompt);
    return res.json({ code: 200, data: result });
  } catch (error) {
    return next(error);
  }
}

async function generateText(req, res, next) {
  try {
    const { prompt, systemPrompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ code: 400, message: 'Missing prompt' });
    }

    const result = await openaiService.generateText(prompt, systemPrompt);
    return res.json({ code: 200, data: { content: result } });
  } catch (error) {
    return next(error);
  }
}

async function generateImage(req, res, next) {
  try {
    const {
      prompt,
      model,
      n,
      size,
      response_format,
      style,
      quality,
      uploadToCos: rawUploadToCos,
      includeBase64InResponse: rawIncludeBase64InResponse,
      includeThumbnailInResponse: rawIncludeThumbnailInResponse,
      saveToDb,
      title,
      description,
      category_id,
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ code: 400, message: 'Missing prompt' });
    }

    const shouldDeferUploadStart = req.baseUrl === '/app';
    const options = {
      model,
      n,
      size,
      response_format,
      style,
      quality,
      uploadToCos: toBoolean(rawUploadToCos, true),
      includeBase64InResponse: toBoolean(rawIncludeBase64InResponse, false),
      includeThumbnailInResponse: toBoolean(rawIncludeThumbnailInResponse, req.baseUrl === '/app'),
      startUploadImmediately: !shouldDeferUploadStart,
    };

    const results = await openaiService.generateImage(prompt, options);
    const queryPathBase = req.baseUrl === '/app' ? '/app/textToImage/tasks' : '/api/v1/openai/tasks';
    let list = results.map((item) => {
      if (!item.upload?.taskId) {
        return item;
      }

      return {
        ...item,
        thumbnail: item.thumbnail || null,
        upload: {
          ...item.upload,
          queryPath: `${queryPathBase}/${item.upload.taskId}`,
        },
      };
    });

    if (toBoolean(saveToDb, true)) {
      try {
        list = await Promise.all(
          list.map(async (item, index) => {
            const taskId = item.upload?.taskId || null;
            const sourceUrl = item.imageUrl || null;
            const initialUrl = sourceUrl || (taskId ? `openai://task/${taskId}` : `openai://generated/${Date.now()}-${index}`);
            const imageId = await Image.createFromOpenAITask({
              url: initialUrl,
              source_url: sourceUrl,
              thumbnail: item.thumbnail || null,
              title,
              description,
              prompt,
              category_id,
              upload_task_id: taskId,
              upload_status: item.upload?.status || null,
              upload_error: null,
            });

            if (taskId) {
              openaiService.bindUploadTask(taskId, imageId);
            }

            return {
              ...item,
              imageId,
            };
          })
        );
      } catch (error) {
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({
            code: 500,
            message:
              'Database schema is outdated. Please run scripts/add_openai_task_columns.sql and scripts/migrate_thumbnail_column.js.',
          });
        }
        throw error;
      }
    }

    const date = new Date().toISOString().split('T')[0];
    const payload = {
      code: 200,
      data: { list, date },
    };
    res.json(payload);

    if (shouldDeferUploadStart) {
      const taskIds = list
        .map((item) => item.upload?.taskId)
        .filter((taskId) => typeof taskId === 'string' && taskId.length > 0);

      if (taskIds.length > 0) {
        setImmediate(() => {
          try {
            openaiService.startUploadTasks(taskIds);
          } catch (startError) {
            console.error('[start-upload-tasks-failed]', startError.message);
          }
        });
      }
    }
    return;
  } catch (error) {
    return next(error);
  }
}

/**
 * 生成图片（基于 Chat Completions API）- 支持多轮对话
 * @param {Object} req.body.session_id - 会话ID（可选，不传则创建新会话）
 * @param {string} req.body.prompt - 用户输入的文本提示词
 * @param {Array} req.body.messages - 自定义消息数组（可选，优先级高于 prompt）
 * @param {string} req.body.imageUrl - 参考图片URL（可选）
 * @param {boolean} req.body.stream - 是否流式返回（默认 true）
 * @param {boolean} req.body.uploadToCos - 是否上传到COS（默认 true）
 */
async function generateImageByChatCompletions(req, res, next) {
  try {
    const {
      session_id: rawSessionId,
      prompt,
      imageUrl,
      messages: rawMessages,
      model,
      group,
      stream: rawStream,
      uploadToCos: rawUploadToCos,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
    } = req.body;

    const stream = toBoolean(rawStream, false);
    const hasMessages = Array.isArray(rawMessages) && rawMessages.length > 0;

    // ========================================
    // 1. 参数验证
    // ========================================
    if (!hasMessages && !prompt) {
      return res.status(400).json({ code: 400, message: 'Missing prompt or messages' });
    }

    // 验证 session_id 格式（如果提供）
    const sessionId = validateAndNormalizeSessionId(rawSessionId);

    // ========================================
    // 2. 加载对话历史（如果有 session_id）
    // ========================================
    let messages = [];

    if (sessionId) {
      try {
        // 从数据库加载历史对话（最近10条）
        const history = await Conversation.getBySessionId(sessionId, 10);

        if (history.length > 0) {
          // 将历史记录转换为 messages 格式，过滤掉空内容的占位符
          messages = history
            .filter((record) => record.content && record.content.trim().length > 0)
            .map((record) => ({
              role: record.role,
              content: record.content, // 保持原始内容，不做任何处理
            }));
        }
      } catch (error) {
        // 降级处理：加载历史失败不阻塞主流程
      }
    }

    // ========================================
    // 3. 构建当前请求的 messages
    // ========================================
    // 如果用户直接传了 messages，使用用户的 messages（覆盖历史）
    if (hasMessages) {
      messages = rawMessages;
    } else {
      // 否则，追加当前用户输入到历史记录
      const userMessage = {
        role: 'user',
        content: imageUrl
          ? [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ]
          : prompt,
      };
      messages.push(userMessage);
    }

    // ========================================
    // 4. 生成或使用现有 session_id
    // ========================================
    const finalSessionId = sessionId || randomUUID();

    // ========================================
    // 5. 保存用户输入到数据库
    // ========================================
    if (!hasMessages) {
      // 只有在使用 prompt 模式时才保存用户输入
      // 如果用户直接传 messages，说明是自定义场景，不保存
      try {
        await Conversation.create(finalSessionId, 'user', prompt, null);
        // 立即保存一个空的 assistant 消息作为占位符，确保消息序列完整
        await Conversation.create(finalSessionId, 'assistant', '', null);
      } catch (error) {
        // 保存失败不阻塞主流程
      }
    }

    // ========================================
    // 6. 调用第三方 API
    // ========================================
    const options = {
      model: model || 'gpt-4o-image',
      group: group || 'default',
      stream,
      uploadToCos: toBoolean(rawUploadToCos, true),
      temperature: temperature !== undefined ? temperature : 0.7,
      top_p: top_p !== undefined ? top_p : 1,
      frequency_penalty: frequency_penalty !== undefined ? frequency_penalty : 0,
      presence_penalty: presence_penalty !== undefined ? presence_penalty : 0,
      messages,
      n:2
    };

    // 打印传给第三方 API 的参数
    console.log('[textToimageNew] 传给第三方API的参数:', JSON.stringify(options, null, 2));

    const result = await openaiService.generateImageByChatCompletions(options);

    // ========================================
    // 7. 处理响应
    // ========================================
    if (result.stream) {
      // 流式响应：需要收集完整的 AI 返回内容后更新占位符
      const streamCollector = createStreamContentCollector(finalSessionId, !hasMessages);

      // 设置响应头
      res.status(result.status);
      Object.entries(result.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });

      // 在响应头中返回 session_id（方便客户端获取）
      res.setHeader('X-Session-Id', finalSessionId);

      // 监听流数据，收集内容
      result.stream.on('data', (chunk) => {
        streamCollector.collect(chunk);
      });

      // 流结束时更新占位符内容
      result.stream.on('end', () => {
        streamCollector.save();
      });

      result.stream.on('error', next);
      result.stream.pipe(res);
      return;
    }

    // ========================================
    // 8. 非流式响应：直接更新占位符内容
    // ========================================
    if (!hasMessages) {
      try {
        const aiContent = result.data?.choices?.[0]?.message?.content || '';
        if (aiContent) {
          // 更新最后一条空的 assistant 消息
          await Conversation.updateLastAssistantMessage(finalSessionId, aiContent);
        }
      } catch (error) {
        // 保存失败不阻塞主流程
      }
    }

    return res.status(result.status).json({
      code: 200,
      data: {
        session_id: finalSessionId,
        ...result.data,
      },
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * 验证并规范化 session_id
 * @param {string} sessionId - 原始 session_id
 * @returns {string|null} 返回有效的 session_id 或 null
 */
function validateAndNormalizeSessionId(sessionId) {
  if (!sessionId || typeof sessionId !== 'string') {
    return null;
  }

  const trimmed = sessionId.trim();

  // 验证 UUID v4 格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * 创建流式内容收集器
 * @param {string} sessionId - 会话ID
 * @param {boolean} shouldSave - 是否保存到数据库
 * @returns {Object} 返回收集器对象
 */
function createStreamContentCollector(sessionId, shouldSave = true) {
  let fullContent = '';
  let imageId = null;

  return {
    /**
     * 收集流数据
     * @param {Buffer} chunk - 数据块
     */
    collect(chunk) {
      if (!shouldSave) return;

      try {
        const text = chunk.toString('utf8');

        // 解析 SSE 格式，提取 content
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            // 跳过 [DONE] 标记
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              // 提取 delta content（流式响应的增量内容）
              if (parsed.choices?.[0]?.delta?.content) {
                fullContent += parsed.choices[0].delta.content;
              }

              // 提取图片ID（如果有）
              if (parsed.image_id) {
                imageId = parsed.image_id;
              }
            } catch (e) {
              // 忽略 JSON 解析错误
            }
          }
        }
      } catch (error) {
        // 收集失败不阻塞流式响应
      }
    },

    /**
     * 更新占位符内容到数据库
     */
    async save() {
      if (!shouldSave || !fullContent) return;

      try {
        await Conversation.updateLastAssistantMessage(sessionId, fullContent, imageId);
      } catch (error) {
        // 保存失败不阻塞主流程
      }
    },
  };
}

async function getUploadTaskStatus(req, res, next) {
  try {
    const { taskId } = req.params;
    if (!taskId) {
      return res.status(400).json({ code: 400, message: 'Missing taskId' });
    }

    const task = openaiService.getUploadTaskStatus(taskId);
    if (!task) {
      return res.status(404).json({ code: 404, message: 'Task not found' });
    }

    return res.json({ code: 200, data: task });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  analyzeImage,
  generateText,
  generateImage,
  generateImageByChatCompletions,
  getUploadTaskStatus,
};
