const openaiService = require('../services/openai');
const Image = require('../models/image');

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
      compressBeforeUpload: rawCompressBeforeUpload,
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
      compressBeforeUpload: toBoolean(rawCompressBeforeUpload, true),
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

async function generateImageByChatCompletions(req, res, next) {
  try {
    const {
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

    const stream = toBoolean(rawStream, true);
    const hasMessages = Array.isArray(rawMessages) && rawMessages.length > 0;

    if (!hasMessages && !prompt) {
      return res.status(400).json({ code: 400, message: 'Missing prompt or messages' });
    }

    const options = {
      model,
      group,
      stream,
      uploadToCos: toBoolean(rawUploadToCos, true),
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
      messages: hasMessages
        ? rawMessages
        : [
            {
              role: 'user',
              content: imageUrl
                ? [
                    { type: 'text', text: prompt },
                    { type: 'image_url', image_url: { url: imageUrl } },
                  ]
                : prompt,
            },
          ],
    };

    console.log(
      '[textToimageNew.request]',
      JSON.stringify({
        model: options.model || null,
        group: options.group || null,
        stream: options.stream,
        uploadToCos: options.uploadToCos,
        temperature: options.temperature,
        top_p: options.top_p,
        frequency_penalty: options.frequency_penalty,
        presence_penalty: options.presence_penalty,
        imageUrl: imageUrl || null,
        messages: options.messages,
      })
    );

    const result = await openaiService.generateImageByChatCompletions(options);

    if (result.stream) {
      res.status(result.status);
      Object.entries(result.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });
      result.stream.on('error', next);
      result.stream.pipe(res);
      return;
    }

    return res.status(result.status).json({ code: 200, data: result.data });
  } catch (error) {
    return next(error);
  }
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
