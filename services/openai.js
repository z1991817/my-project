const OpenAI = require('openai');
const axios = require('axios');
const sharp = require('sharp');
const { cos } = require('../middleware/cosUpload');

// 获取 OpenAI 客户端实例（延迟初始化）
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('缺少 OPENAI_API_KEY 环境变量');
  }
  const config = {
    apiKey: process.env.OPENAI_API_KEY
  };
  if (process.env.OPENAI_BASE_URL) {
    config.baseURL = process.env.OPENAI_BASE_URL;
  }
  return new OpenAI(config);
}

/**
 * 生成缩略图 base64
 * @param {string} imageUrl - 图片URL
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @returns {Promise<string>} - 返回 base64 字符串
 */
async function generateThumbnail(imageUrl, width = 269, height = 358) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    const thumbnail = await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    return `data:image/jpeg;base64,${thumbnail.toString('base64')}`;
  } catch (error) {
    console.error('生成缩略图失败:', error.message);
    return null;
  }
}

/**
 * 下载图片并上传到COS
 * @param {string} imageUrl - 图片URL
 * @param {number} quality - 压缩质量 (1-100)，默认85
 * @returns {Promise<string>} - 返回COS中的图片URL
 */
async function downloadAndUploadToCOS(imageUrl, quality = 90) {
  try {
    // 下载图片
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    let imageBuffer = Buffer.from(response.data);

    // 使用 sharp 压缩图片
    imageBuffer = await sharp(imageBuffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    // 获取当前日期 YYYY-MM-DD
    const today = new Date();
    const dateFolder = today.toISOString().split('T')[0];

    // 生成文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const key = `temp/${dateFolder}/image-${uniqueSuffix}.jpg`;

    // 上传到COS
    return new Promise((resolve, reject) => {
      cos.putObject({
        Bucket: process.env.COS_BUCKET,
        Region: process.env.COS_REGION,
        Key: key,
        Body: imageBuffer,
      }, (err) => {
        if (err) {
          return reject(err);
        }
        const url = `https://${process.env.COS_BUCKET}.cos.${process.env.COS_REGION}.myqcloud.com/${key}`;
        resolve(url);
      });
    });
  } catch (error) {
    console.error('下载或上传图片失败:', error.message);
    throw error;
  }
}

/**
 * 图片分析
 * @param {string} imageUrl - 图片URL
 * @param {string} prompt - 提示词
 */
async function analyzeImage(imageUrl, prompt = '请描述这张图片') {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-image',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ],
    max_tokens: 1000
  });

  return response.choices[0].message.content;
}

/**
 * 图片编辑
 * @param {Buffer} image - 图片Buffer
 * @param {Buffer} mask - 遮罩Buffer
 * @param {string} prompt - 编辑提示词
 */
async function editImage(image, mask, prompt) {
  const openai = getOpenAIClient();
  const response = await openai.images.edit({
    image,
    mask,
    prompt,
    n: 1,
    size: '1024x1024'
  });

  return response.data[0].url;
}

/**
 * 文本生成（使用聊天接口）
 * @param {string} prompt - 生成提示词
 * @param {string} systemPrompt - 系统提示词
 */
async function generateText(prompt, systemPrompt = 'You are a helpful assistant.') {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-image',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API 错误:', error.message);
    console.error('错误详情:', error.response?.data || error);
    throw error;
  }
}

/**
 * 图片生成（文生图）并上传到COS
 * @param {string} prompt - 图片描述
 * @param {Object} options - 生成选项
 */
async function generateImage(prompt, options = {}) {
  try {
    const openai = getOpenAIClient();
    const {
      model = 'dall-e-3',
      n = 1,
      size = '1024x1024',
      style,
      quality = 85,
      uploadToCos = true
    } = options;

    const params = {
      model,
      prompt,
      n,
      size
    };

    if (style) {
      params.style = style;
    }

    const response = await openai.images.generate(params);

    // 检查响应数据
    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('OpenAI API 返回数据格式错误');
    }

    // 提取原始 URL
    const originalUrls = response.data.map(item => item.url);

    // 立即返回原图 URL（不等待缩略图和上传）
    const results = originalUrls.map(url => ({ imageUrl: url }));

    // 后台异步生成缩略图和上传到 COS（不阻塞响应）
    if (uploadToCos) {
      console.log(`[上传任务] 开始异步上传 ${originalUrls.length} 张图片到 COS`);
      originalUrls.forEach((url, index) => {
        const startTime = Date.now();
        console.log(`[上传任务] 图片 ${index + 1} 开始下载: ${url}`);

        downloadAndUploadToCOS(url, quality)
          .then(cosUrl => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            const logMsg = `[上传成功] 图片 ${index + 1} 已上传到 COS (耗时 ${duration}s): ${cosUrl}`;
            console.log(logMsg);
            // 写入日志文件
            require('fs').appendFileSync('upload.log', `${new Date().toISOString()} ${logMsg}\n`);
          })
          .catch(err => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            const logMsg = `[上传失败] 图片 ${index + 1} 上传失败 (耗时 ${duration}s): ${err.message}\n堆栈: ${err.stack}`;
            console.error(logMsg);
            // 写入日志文件
            require('fs').appendFileSync('upload.log', `${new Date().toISOString()} ${logMsg}\n`);
          });
      });
    }

    // 立即返回结果
    return results;
  } catch (error) {
    console.error('图片生成错误:', error.message);
    console.error('错误详情:', error.response?.data || error);
    throw error;
  }
}

module.exports = {
  analyzeImage,
  editImage,
  generateText,
  generateImage
};
