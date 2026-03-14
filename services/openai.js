const OpenAI = require('openai');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { Transform } = require('stream');
const { cos } = require('../middleware/cosUpload');
const Image = require('../models/image');
const ImageGenerationRecord = require('../models/imageGenerationRecord');

const UPLOAD_LOG_FILE = path.join(process.cwd(), 'upload.log');
const DOWNLOAD_TIMEOUT_MS = Number.parseInt(process.env.OPENAI_IMAGE_DOWNLOAD_TIMEOUT_MS || '15000', 10);
const MAX_UPLOAD_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.OPENAI_COS_UPLOAD_CONCURRENCY || '2', 10)
);
const MAX_UPLOAD_RETRIES = Math.max(0, Number.parseInt(process.env.OPENAI_COS_UPLOAD_RETRIES || '2', 10));
const UPLOAD_TASK_TTL_MS = Math.max(
  60_000,
  Number.parseInt(process.env.OPENAI_UPLOAD_TASK_TTL_MS || String(24 * 60 * 60 * 1000), 10)
);
const RETRY_BASE_DELAY_MS = 5000;
const RETRY_MAX_DELAY_MS = 30000;
const THIRD_PARTY_LOG_ENABLED = !['false', '0', 'off'].includes(
  String(process.env.OPENAI_THIRD_PARTY_LOG || 'true').toLowerCase()
);
const THIRD_PARTY_LOG_MAX_LENGTH = Math.max(
  1000,
  Number.parseInt(process.env.OPENAI_THIRD_PARTY_LOG_MAX_LENGTH || '12000', 10)
);
const DEFAULT_UPLOAD_QUALITY = Math.max(
  1,
  Math.min(100, Number.parseInt(process.env.OPENAI_IMAGE_UPLOAD_QUALITY || '72', 10))
);
const THUMBNAIL_WIDTH = Math.max(1, Number.parseInt(process.env.OPENAI_THUMBNAIL_WIDTH || '268', 10));
const THUMBNAIL_HEIGHT = Math.max(1, Number.parseInt(process.env.OPENAI_THUMBNAIL_HEIGHT || '358', 10));
const THUMBNAIL_QUALITY = Math.max(
  1,
  Math.min(100, Number.parseInt(process.env.OPENAI_THUMBNAIL_QUALITY || '70', 10))
);
const DEFAULT_IMAGE_CHAT_MODEL = process.env.OPENAI_IMAGE_CHAT_MODEL || 'gpt-4o-image';
const DEFAULT_IMAGE_CHAT_GROUP = process.env.OPENAI_IMAGE_CHAT_GROUP || 'default';

const uploadTasks = new Map();
const pendingTaskIds = [];
let activeUploadCount = 0;
let cleanupTimer = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY env variable');
  }
  const config = {
    apiKey: process.env.OPENAI_API_KEY,
  };
  if (process.env.OPENAI_BASE_URL) {
    config.baseURL = process.env.OPENAI_BASE_URL;
  }
  return new OpenAI(config);
}

function buildChatCompletionsUrl() {
  const baseUrl = process.env.OPENAI_BASE_URL;
  if (!baseUrl) {
    throw new Error('Missing OPENAI_BASE_URL env variable');
  }

  const normalized = String(baseUrl).replace(/\/+$/, '');
  if (normalized.endsWith('/chat/completions')) {
    return normalized;
  }
  if (normalized.endsWith('/v1')) {
    return `${normalized}/chat/completions`;
  }
  return `${normalized}/v1/chat/completions`;
}

function ensureCleanupTimer() {
  if (cleanupTimer) {
    return;
  }

  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [taskId, task] of uploadTasks.entries()) {
      if (now - task.updatedAt > UPLOAD_TASK_TTL_MS) {
        uploadTasks.delete(taskId);
      }
    }
  }, 10 * 60 * 1000);

  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }
}

function appendUploadLog(message) {
  const line = `${new Date().toISOString()} ${message}\n`;
  fs.promises.appendFile(UPLOAD_LOG_FILE, line).catch((err) => {
    console.error('[upload-log] write failed:', err.message);
  });
}

function logThirdPartyPayload(label, payload) {
  if (!THIRD_PARTY_LOG_ENABLED) {
    return;
  }

  try {
    const serialized = JSON.stringify(payload);
    if (serialized.length <= THIRD_PARTY_LOG_MAX_LENGTH) {
      console.log(`[third-party] ${label}: ${serialized}`);
      return;
    }

    const truncated = serialized.slice(0, THIRD_PARTY_LOG_MAX_LENGTH);
    console.log(
      `[third-party] ${label}: ${truncated}... [truncated ${serialized.length - THIRD_PARTY_LOG_MAX_LENGTH} chars]`
    );
  } catch (error) {
    console.log(`[third-party] ${label}: [unserializable payload] ${error.message}`);
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(2)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function normalizeBase64Payload(base64Data) {
  if (!base64Data) {
    return { base64: '', mimeType: 'image/png' };
  }
  const value = String(base64Data);
  const matched = value.match(/^data:(.+?);base64,(.*)$/);
  if (!matched) {
    return { base64: value, mimeType: 'image/png' };
  }
  return { mimeType: matched[1], base64: matched[2] };
}

function normalizeUploadQuality(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.min(100, Math.round(value)));
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.min(100, parsed));
    }
  }

  return DEFAULT_UPLOAD_QUALITY;
}

async function processImageForUpload(sourceBuffer, sourceContentType, options = {}) {
  const quality = normalizeUploadQuality(options.quality);
  const compressBeforeUpload = options.compressBeforeUpload !== false;
  if (!compressBeforeUpload) {
    return {
      uploadBuffer: sourceBuffer,
      sourceBytes: sourceBuffer.length,
      uploadBytes: sourceBuffer.length,
      contentType: sourceContentType || 'image/jpeg',
      ext: getExtFromContentType(sourceContentType),
    };
  }

  const metadata = await sharp(sourceBuffer, { failOn: 'none' }).metadata();
  let pipeline = sharp(sourceBuffer, { failOn: 'none' });
  if (metadata?.hasAlpha) {
    pipeline = pipeline.flatten({ background: '#ffffff' });
  }

  const uploadBuffer = await pipeline
    .jpeg({
      quality,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:2:0',
    })
    .toBuffer();

  return {
    uploadBuffer,
    sourceBytes: sourceBuffer.length,
    uploadBytes: uploadBuffer.length,
    contentType: 'image/jpeg',
    ext: 'jpg',
  };
}

async function generateThumbnailBase64FromBuffer(imageBuffer) {
  const thumbnailBuffer = await sharp(imageBuffer, { failOn: 'none' })
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: 'cover',
      position: 'attention',
      withoutEnlargement: false,
    })
    .jpeg({ quality: THUMBNAIL_QUALITY, mozjpeg: true, progressive: true })
    .toBuffer();

  return `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
}

async function generateThumbnailFromImageUrl(imageUrl) {
  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: DOWNLOAD_TIMEOUT_MS,
  });
  const imageBuffer = Buffer.from(response.data);
  return generateThumbnailBase64FromBuffer(imageBuffer);
}

async function generateThumbnailFromBase64(base64Data) {
  const { base64 } = normalizeBase64Payload(base64Data);
  const imageBuffer = Buffer.from(base64, 'base64');
  return generateThumbnailBase64FromBuffer(imageBuffer);
}

function buildCosObjectKey(ext = 'jpg') {
  const dateFolder = new Date().toISOString().split('T')[0];
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const safeExt = String(ext || 'jpg').replace(/^\./, '').toLowerCase();
  return `temp/${dateFolder}/image-${uniqueSuffix}.${safeExt}`;
}

function getExtFromContentType(contentType = '') {
  const normalized = contentType.toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('bmp')) return 'bmp';
  if (normalized.includes('avif')) return 'avif';
  return 'jpg';
}

async function uploadBufferToCOS(imageBuffer, contentType = 'image/jpeg', ext = 'jpg') {
  const key = buildCosObjectKey(ext);

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: process.env.COS_BUCKET,
        Region: process.env.COS_REGION,
        Key: key,
        Body: imageBuffer,
        ContentType: contentType,
      },
      (err) => {
        if (err) {
          return reject(err);
        }
        const url = `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com/${key}`;
        resolve(url);
      }
    );
  });
}

async function downloadAndUploadToCOS(imageUrl, options = {}) {
  const quality = normalizeUploadQuality(options.quality);
  const compressBeforeUpload = options.compressBeforeUpload !== false;

  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: DOWNLOAD_TIMEOUT_MS,
  });

  const sourceBuffer = Buffer.from(response.data);
  const processed = await processImageForUpload(sourceBuffer, response.headers['content-type'], {
    quality,
    compressBeforeUpload,
  });
  const thumbnail = await generateThumbnailBase64FromBuffer(processed.uploadBuffer);
  const cosUrl = await uploadBufferToCOS(processed.uploadBuffer, processed.contentType, processed.ext);

  return {
    cosUrl,
    sourceBytes: processed.sourceBytes,
    uploadBytes: processed.uploadBytes,
    thumbnail,
  };
}

/**
 * 流式下载并上传到COS（Stream Pipe 方式）
 * 优势：内存占用极低，适合大文件和高并发场景
 * @param {string} imageUrl - 图片URL
 * @param {Object} options - 配置选项
 * @param {boolean} options.compressBeforeUpload - 是否压缩（默认true，保持原格式压缩）
 * @param {number} options.quality - 压缩质量（仅在压缩时生效）
 * @returns {Promise<Object>} 上传结果
 */
async function downloadAndUploadToCOSWithStream(imageUrl, options = {}) {
  const quality = normalizeUploadQuality(options.quality);
  const compressBeforeUpload = options.compressBeforeUpload !== false; // 默认开启压缩

  return new Promise(async (resolve, reject) => {
    try {
      // 1. 发起下载请求（流式）
      const response = await axios.get(imageUrl, {
        responseType: 'stream',
        timeout: DOWNLOAD_TIMEOUT_MS,
      });

      const contentType = response.headers['content-type'] || 'image/jpeg';
      const ext = getExtFromContentType(contentType);

      let uploadStream = response.data;
      let finalContentType = contentType;
      let finalExt = ext;

      // 2. 如果需要压缩，创建压缩流（根据原格式压缩）
      if (compressBeforeUpload) {
        const sharpTransform = sharp({
          failOn: 'none',
          unlimited: true,
        });

        // 确保 quality 是整数类型
        const qualityInt = Math.round(quality);

        // 根据原格式进行压缩，保持格式不变
        if (ext === 'png') {
          sharpTransform.png({ quality: qualityInt, compressionLevel: 9 });
        } else if (ext === 'webp') {
          sharpTransform.webp({ quality: qualityInt });
        } else if (ext === 'jpg' || ext === 'jpeg') {
          sharpTransform.flatten({ background: '#ffffff' }).jpeg({
            quality: qualityInt,
            mozjpeg: true,
            progressive: true,
            chromaSubsampling: '4:2:0',
          });
        } else {
          // 其他格式不压缩，保持原样
          console.log(`[stream-upload] 格式 ${ext} 不支持压缩，保持原样`);
        }

        uploadStream = response.data.pipe(sharpTransform);
      }

      // 3. 收集流数据用于生成缩略图（可选）
      const chunks = [];
      let totalBytes = 0;

      uploadStream.on('data', (chunk) => {
        chunks.push(chunk);
        totalBytes += chunk.length;
      });

      // 4. 直接流式上传到COS
      const finalKey = buildCosObjectKey(finalExt);
      cos.putObject(
        {
          Bucket: process.env.COS_BUCKET,
          Region: process.env.COS_REGION,
          Key: finalKey,
          Body: uploadStream,
          ContentType: finalContentType,
        },
        async (err) => {
          if (err) {
            return reject(err);
          }

          const cosUrl = `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com/${finalKey}`;

          // 5. 生成缩略图（从收集的数据）
          let thumbnail = null;
          try {
            if (chunks.length > 0) {
              const fullBuffer = Buffer.concat(chunks);
              thumbnail = await generateThumbnailBase64FromBuffer(fullBuffer);
            }
          } catch (thumbError) {
            console.warn('[stream-thumbnail-failed]', thumbError.message);
          }

          resolve({
            cosUrl,
            sourceBytes: null, // 流式模式无法精确统计原始大小
            uploadBytes: totalBytes,
            thumbnail,
          });
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}

async function uploadBase64ToCOS(base64Data, options = {}) {
  const quality = normalizeUploadQuality(options.quality);
  const compressBeforeUpload = options.compressBeforeUpload !== false;
  const { base64, mimeType } = normalizeBase64Payload(base64Data);
  const sourceBuffer = Buffer.from(base64, 'base64');
  const processed = await processImageForUpload(sourceBuffer, mimeType, {
    quality,
    compressBeforeUpload,
  });
  const thumbnail = await generateThumbnailBase64FromBuffer(processed.uploadBuffer);
  const cosUrl = await uploadBufferToCOS(processed.uploadBuffer, processed.contentType, processed.ext);

  return {
    cosUrl,
    sourceBytes: processed.sourceBytes,
    uploadBytes: processed.uploadBytes,
    thumbnail,
  };
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function extractImageUrlsFromText(value) {
  if (typeof value !== 'string' || !value) {
    return [];
  }

  const found = new Set();
  const markdownImagePattern = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/gi;

  let match;
  while ((match = markdownImagePattern.exec(value)) !== null) {
    const url = match[1];
    if (!isHttpUrl(url)) {
      continue;
    }

    found.add(url);
  }

  return Array.from(found);
}

async function uploadImageCandidateToCOS(candidate, options = {}, cache = new Map()) {
  const cacheKey = `${candidate.type}:${candidate.value}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const task = (async () => {
    const uploadResult =
      candidate.type === 'base64'
        ? await uploadBase64ToCOS(candidate.value, options)
        : await downloadAndUploadToCOS(candidate.value, options);

    return {
      originalUrl: candidate.type === 'url' ? candidate.value : null,
      cosUrl: uploadResult.cosUrl,
      thumbnail: uploadResult.thumbnail || null,
      sourceBytes: uploadResult.sourceBytes || null,
      uploadBytes: uploadResult.uploadBytes || null,
      type: candidate.type,
    };
  })();

  cache.set(cacheKey, task);
  return task;
}

async function replaceImagesWithCosUrls(payload, options = {}, cache = new Map(), collector = []) {
  if (Array.isArray(payload)) {
    await Promise.all(payload.map((item) => replaceImagesWithCosUrls(item, options, cache, collector)));
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (typeof payload.b64_json === 'string' && payload.b64_json.trim()) {
    const uploaded = await uploadImageCandidateToCOS(
      { type: 'base64', value: payload.b64_json },
      options,
      cache
    );
    payload.url = uploaded.cosUrl;
    payload.cos_url = uploaded.cosUrl;
    payload.thumbnail = payload.thumbnail || uploaded.thumbnail;
    collector.push(uploaded);
  }

  if (isHttpUrl(payload.url)) {
    const uploaded = await uploadImageCandidateToCOS({ type: 'url', value: payload.url }, options, cache);
    payload.original_url = payload.original_url || payload.url;
    payload.url = uploaded.cosUrl;
    payload.cos_url = uploaded.cosUrl;
    payload.thumbnail = payload.thumbnail || uploaded.thumbnail;
    collector.push(uploaded);
  }

  const contentImageUrls = extractImageUrlsFromText(payload.content);
  if (contentImageUrls.length > 0) {
    const finalImageUrl = contentImageUrls[0];
    const uploadedImages = [
      await uploadImageCandidateToCOS({ type: 'url', value: finalImageUrl }, options, cache),
    ];

    let rewrittenContent = payload.content;
    for (const uploaded of uploadedImages) {
      if (uploaded.originalUrl) {
        rewrittenContent = rewrittenContent.split(uploaded.originalUrl).join(uploaded.cosUrl);
      }
      collector.push(uploaded);
    }
    payload.content = rewrittenContent;
  }

  const entries = Object.entries(payload);
  await Promise.all(
    entries.map(async ([key, value]) => {
      if (
        key === 'b64_json' ||
        key === 'url' ||
        key === 'cos_url' ||
        key === 'thumbnail' ||
        key === 'original_url' ||
        key === 'content'
      ) {
        return;
      }

      if (Array.isArray(value) || (value && typeof value === 'object')) {
        await replaceImagesWithCosUrls(value, options, cache, collector);
      }
    })
  );

  return payload;
}

function createCosUploadSSETransform(options = {}) {
  const quality = normalizeUploadQuality(options.quality);
  const compressBeforeUpload = options.compressBeforeUpload !== false;
  const cache = new Map();
  const emitted = new Set();
  const pendingUploads = new Set();
  let buffer = '';
  let streamClosed = false;

  function emitAsyncEvent(stream, eventName, payload) {
    if (streamClosed || stream.destroyed) {
      return;
    }

    stream.push(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
  }

  function scheduleUploadsFromPayload(stream, payload) {
    const uploads = [];
    const task = replaceImagesWithCosUrls(payload, { quality, compressBeforeUpload }, cache, uploads)
      .then(() => {
        for (const uploaded of uploads) {
          const dedupeKey = uploaded.cosUrl || `${uploaded.type}:${uploaded.originalUrl || ''}`;
          if (emitted.has(dedupeKey)) {
            continue;
          }
          emitted.add(dedupeKey);
          emitAsyncEvent(stream, 'cos_upload', { image: uploaded });
        }
      })
      .catch((error) => {
        emitAsyncEvent(stream, 'cos_upload_error', { message: error.message });
      })
      .finally(() => {
        pendingUploads.delete(task);
      });

    pendingUploads.add(task);
  }

  function handleEventBlock(stream, block) {
    const normalizedBlock = block.replace(/\r\n/g, '\n');
    const lines = normalizedBlock.split('\n');
    const dataLines = lines.filter((line) => line.startsWith('data:'));
    if (dataLines.length === 0) {
      return `${block}\n\n`;
    }

    const data = dataLines.map((line) => line.slice(5).trimStart()).join('\n');
    if (data === '[DONE]') {
      return `${block}\n\n`;
    }

    let payload;
    try {
      payload = JSON.parse(data);
    } catch (error) {
      return `${block}\n\n`;
    }

    scheduleUploadsFromPayload(stream, payload);
    return `${block}\n\n`;
  }

  const transform = new Transform({
    transform(chunk, encoding, callback) {
      buffer += chunk.toString('utf8');
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() || '';

      let output = '';
      for (const block of blocks) {
        if (!block) {
          output += '\n';
          continue;
        }
        output += handleEventBlock(this, block);
      }
      callback(null, output);
    },
    flush(callback) {
      (async () => {
        let output = '';
        if (buffer) {
          output = handleEventBlock(this, buffer);
        }

        if (output) {
          this.push(output);
        }

        await Promise.allSettled(Array.from(pendingUploads));
        streamClosed = true;
        callback();
      })().catch(callback);
    },
  });

  return transform;
}

function toPublicTask(task) {
  return {
    taskId: task.taskId,
    imageId: task.imageId || null,
    sourceType: task.sourceType,
    status: task.status,
    originalUrl: task.originalUrl,
    cosUrl: task.cosUrl,
    sourceBytes: task.sourceBytes || null,
    uploadBytes: task.uploadBytes || null,
    thumbnail: task.thumbnail || null,
    error: task.error,
    attempts: task.attempts,
    maxAttempts: task.maxAttempts,
    createdAt: new Date(task.createdAt).toISOString(),
    updatedAt: new Date(task.updatedAt).toISOString(),
  };
}

function releaseTaskPayload(task) {
  if (task.sourceType === 'base64') {
    task.base64Data = null;
  }
}

function createUploadTask(payload, options = {}) {
  ensureCleanupTimer();

  const taskId = randomUUID();
  const now = Date.now();
  const task = {
    taskId,
    imageId: payload.imageId || null,
    sourceType: payload.sourceType,
    originalUrl: payload.originalUrl || null,
    imageUrl: payload.imageUrl || null,
    base64Data: payload.base64Data || null,
    status: 'pending',
    cosUrl: null,
    sourceBytes: null,
    uploadBytes: null,
    thumbnail: null,
    error: null,
    attempts: 0,
    maxAttempts: MAX_UPLOAD_RETRIES + 1,
    createdAt: now,
    updatedAt: now,
    uploadOptions: {
      quality: options.quality,
      compressBeforeUpload: Boolean(options.compressBeforeUpload),
      useStream: Boolean(options.useStream), // 是否使用流式上传
    },
    enqueued: false,
  };

  uploadTasks.set(taskId, task);
  if (options.startUploadImmediately !== false) {
    task.enqueued = true;
    pendingTaskIds.push(taskId);
    processUploadQueue();
  }
  return toPublicTask(task);
}

async function persistTaskStateToImage(task) {
  if (!task.imageId) {
    return;
  }

  const payload = {
    upload_status: task.status,
    upload_error: task.error || null,
  };
  if (task.status === 'success' && task.cosUrl) {
    payload.url = task.cosUrl;
    payload.thumbnail = task.thumbnail || null;
  }

  try {
    await Image.updateOpenAIUpload(task.imageId, payload);
  } catch (error) {
    appendUploadLog(`[db-update-failed] task=${task.taskId} imageId=${task.imageId} error=${error.message}`);
  }
}

function scheduleRetry(task) {
  const retryDelayMs = Math.min(
    RETRY_BASE_DELAY_MS * 2 ** Math.max(0, task.attempts - 1),
    RETRY_MAX_DELAY_MS
  );

  const timer = setTimeout(() => {
    task.status = 'pending';
    task.updatedAt = Date.now();
    if (!task.enqueued) {
      task.enqueued = true;
      pendingTaskIds.push(task.taskId);
    }
    processUploadQueue();
  }, retryDelayMs);

  if (typeof timer.unref === 'function') {
    timer.unref();
  }
}

async function runUploadTask(task) {
  task.attempts += 1;
  task.status = 'uploading';
  task.updatedAt = Date.now();
  const startMsg = `[upload-start] task=${task.taskId} sourceType=${task.sourceType} useStream=${task.uploadOptions.useStream} attempt=${task.attempts}/${task.maxAttempts}`;
  console.log(startMsg);
  appendUploadLog(startMsg);
  await persistTaskStateToImage(task);

  const startTime = Date.now();
  try {
    let uploadResult;

    // 根据配置选择上传方式
    if (task.sourceType === 'base64') {
      // base64 只能用传统方式
      uploadResult = await uploadBase64ToCOS(task.base64Data, task.uploadOptions);
    } else {
      // URL 可以选择流式或传统方式
      if (task.uploadOptions.useStream) {
        uploadResult = await downloadAndUploadToCOSWithStream(task.imageUrl, task.uploadOptions);
      } else {
        uploadResult = await downloadAndUploadToCOS(task.imageUrl, task.uploadOptions);
      }
    }

    task.status = 'success';
    task.cosUrl = uploadResult.cosUrl;
    task.sourceBytes = uploadResult.sourceBytes;
    task.uploadBytes = uploadResult.uploadBytes;
    task.thumbnail = uploadResult.thumbnail;
    task.error = null;
    task.updatedAt = Date.now();
    releaseTaskPayload(task);
    await persistTaskStateToImage(task);

    // 更新图片生成记录（如果存在）
    try {
      const record = await ImageGenerationRecord.findByUploadTaskId(task.taskId);
      if (record) {
        await ImageGenerationRecord.updateCosUrl(record.id, uploadResult.cosUrl, 'uploaded');
        console.log(`[upload-success] 已更新生成记录: recordId=${record.id}`);
      }
    } catch (error) {
      console.error(`[upload-success] 更新生成记录失败: ${error.message}`);
    }

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    const successMsg = `[upload-success] task=${task.taskId} duration=${durationSec}s source=${formatBytes(task.sourceBytes)} compressed=${formatBytes(task.uploadBytes)} url=${task.cosUrl}`;
    console.log(successMsg);
    appendUploadLog(successMsg);
    return;
  } catch (error) {
    task.error = error.message;
    task.updatedAt = Date.now();
    const hasRetry = task.attempts < task.maxAttempts;

    if (hasRetry) {
      task.status = 'retrying';
      await persistTaskStateToImage(task);
      const retryMsg = `[upload-retry] task=${task.taskId} attempts=${task.attempts}/${task.maxAttempts} error=${error.message}`;
      console.warn(retryMsg);
      appendUploadLog(retryMsg);
      scheduleRetry(task);
      return;
    }

    task.status = 'failed';
    releaseTaskPayload(task);
    await persistTaskStateToImage(task);
    const failedMsg = `[upload-failed] task=${task.taskId} attempts=${task.attempts}/${task.maxAttempts} error=${error.message}`;
    console.error(failedMsg);
    appendUploadLog(failedMsg);
  }
}

function processUploadQueue() {
  while (activeUploadCount < MAX_UPLOAD_CONCURRENCY && pendingTaskIds.length > 0) {
    const taskId = pendingTaskIds.shift();
    const task = uploadTasks.get(taskId);

    if (!task || task.status !== 'pending') {
      continue;
    }
    task.enqueued = false;

    activeUploadCount += 1;
    runUploadTask(task).finally(() => {
      activeUploadCount -= 1;
      processUploadQueue();
    });
  }
}

function getUploadTaskStatus(taskId) {
  const task = uploadTasks.get(taskId);
  if (!task) {
    return null;
  }
  return toPublicTask(task);
}

function bindUploadTask(taskId, imageId) {
  const task = uploadTasks.get(taskId);
  if (!task) {
    return null;
  }

  task.imageId = imageId;
  task.updatedAt = Date.now();
  persistTaskStateToImage(task);
  return toPublicTask(task);
}

function startUploadTasks(taskIds = []) {
  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return;
  }

  for (const taskId of taskIds) {
    const task = uploadTasks.get(taskId);
    if (!task) {
      continue;
    }
    if (task.status !== 'pending') {
      continue;
    }
    if (task.enqueued) {
      continue;
    }
    task.enqueued = true;
    task.updatedAt = Date.now();
    pendingTaskIds.push(taskId);
  }
  processUploadQueue();
}

async function analyzeImage(imageUrl, prompt = 'Describe this image.') {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-image',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
}

async function editImage(image, mask, prompt) {
  const openai = getOpenAIClient();
  const response = await openai.images.edit({
    image,
    mask,
    prompt,
    n: 1,
    size: '1024x1024',
  });

  return response.data[0].url;
}

async function generateText(prompt, systemPrompt = 'You are a helpful assistant.') {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-image',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    console.error('OpenAI API details:', error.response?.data || error);
    throw error;
  }
}

async function generateImage(prompt, options = {}) {
  try {
    const openai = getOpenAIClient();
    const {
      model = 'gpt-4o-image',
      n = 1,
      size = '1024x1024',
      style,
      response_format,
      quality = DEFAULT_UPLOAD_QUALITY,
      uploadToCos = true,
      compressBeforeUpload = true,
      includeBase64InResponse = false,
      includeThumbnailInResponse = false,
      startUploadImmediately = true,
    } = options;

    const params = {
      model,
      prompt,
      n,
      size,
    };
    if (style) {
      params.style = style;
    }
    if (response_format) {
      params.response_format = response_format;
    }

    logThirdPartyPayload('images.generate.request', {
      baseURL: process.env.OPENAI_BASE_URL || null,
      model,
      params,
    });
    const response = await openai.images.generate(params);
    logThirdPartyPayload('images.generate.response', response);

    if (!response || !Array.isArray(response.data)) {
      throw new Error('OpenAI API returned invalid image payload');
    }

    return Promise.all(
      response.data.map(async (item) => {
        const imageUrl = item.url || null;
        const b64Json = item.b64_json || null;
        const result = {
          imageUrl,
          thumbnail: null,
        };

        const shouldIncludeBase64 = Boolean(b64Json) && (!imageUrl || includeBase64InResponse);
        if (shouldIncludeBase64) {
          result.imageBase64 = `data:image/png;base64,${b64Json}`;
        }

        if (includeThumbnailInResponse) {
          try {
            if (b64Json) {
              result.thumbnail = await generateThumbnailFromBase64(b64Json);
            } else if (imageUrl) {
              result.thumbnail = await generateThumbnailFromImageUrl(imageUrl);
            }
          } catch (error) {
            const logMsg = `[thumbnail-generate-failed] url=${imageUrl || 'base64'} error=${error.message}`;
            console.warn(logMsg);
            appendUploadLog(logMsg);
          }
        }

        if (uploadToCos) {
          const canUpload = Boolean(imageUrl || b64Json);
          if (canUpload) {
            const task = createUploadTask(
              imageUrl
                ? { sourceType: 'url', originalUrl: imageUrl, imageUrl }
                : { sourceType: 'base64', base64Data: b64Json },
              { quality: normalizeUploadQuality(quality), compressBeforeUpload, startUploadImmediately }
            );

            result.upload = {
              taskId: task.taskId,
              status: task.status,
            };
          }
        }

        if (item.revised_prompt) {
          result.revisedPrompt = item.revised_prompt;
        }

        return result;
      })
    );
  } catch (error) {
    console.error('Image generation error:', error.message);
    console.error('Image generation details:', error.response?.data || error);
    throw error;
  }
}

async function generateImageByChatCompletions(options = {}) {
  const {
    model = DEFAULT_IMAGE_CHAT_MODEL,
    group = DEFAULT_IMAGE_CHAT_GROUP,
    messages,
    stream = true,
    uploadToCos = true,
    quality = DEFAULT_UPLOAD_QUALITY,
    compressBeforeUpload = true,
    temperature = 0.7,
    top_p = 1,
    frequency_penalty = 0,
    presence_penalty = 0,
  } = options;

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages is required');
  }

  const url = buildChatCompletionsUrl();
  const payload = {
    model,
    group,
    messages,
    stream,
    temperature,
    top_p,
    frequency_penalty,
    presence_penalty,
  };

  logThirdPartyPayload('chat.completions.request', { url, payload });

  const response = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    responseType: stream ? 'stream' : 'json',
    timeout: 0,
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    if (stream && response.data) {
      let errorBody = '';
      await new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          errorBody += chunk.toString();
        });
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
      throw new Error(`Chat completions API error (${response.status}): ${errorBody}`);
    }

    throw new Error(
      `Chat completions API error (${response.status}): ${JSON.stringify(response.data || {})}`
    );
  }

  if (stream) {
    return {
      status: response.status,
      headers: {
        'Content-Type': response.headers['content-type'] || 'text/event-stream; charset=utf-8',
        'Cache-Control': response.headers['cache-control'] || 'no-cache, no-transform',
        Connection: response.headers.connection || 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
      stream: uploadToCos
        ? response.data.pipe(
            createCosUploadSSETransform({
              quality,
              compressBeforeUpload,
            })
          )
        : response.data,
    };
  }

  if (uploadToCos) {
    await replaceImagesWithCosUrls(response.data, {
      quality: normalizeUploadQuality(quality),
      compressBeforeUpload,
    });
  }

  logThirdPartyPayload('chat.completions.response', response.data);
  return {
    status: response.status,
    data: response.data,
  };
}

module.exports = {
  analyzeImage,
  editImage,
  generateText,
  generateImage,
  generateImageByChatCompletions,
  getUploadTaskStatus,
  bindUploadTask,
  startUploadTasks,
  createUploadTask, // 导出创建上传任务函数
};
