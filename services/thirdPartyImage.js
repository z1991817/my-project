const axios = require('axios');
require('dotenv').config();

/**
 * 第三方图片生成服务
 * 负责调用第三方API生成图片
 */

/**
 * 调用第三方图片生成API
 * @param {Object} options - 生成选项
 * @param {string} options.prompt - 图片生成提示词
 * @param {string} options.size - 图片尺寸（如 "1024x1536"，支持：1024x1024、1024x1536、1536x1024）
 * @param {string} options.model - 模型名称（默认：gpt-image-1.5-all）
 * @param {number} options.n - 生成图片数量（默认：1）
 * @param {string} options.quality - 图片质量（默认：medium，支持：low、medium、high）
 * @param {string} options.style - 图片风格（默认：vivid，支持：vivid、natural）
 * @returns {Promise<Object>} 返回第三方API响应数据
 */
async function generateImage(options = {}) {
  const {
    prompt,
    size = '1024x1536',
    model = 'gpt-image-1.5-all',
    n = 1,
    quality = 'medium',
    style = 'vivid',
  } = options;

  // 验证必需参数
  if (!prompt) {
    throw new Error('缺少必需参数: prompt');
  }

  // 验证环境变量
  if (!process.env.TEST_BASE_URL) {
    throw new Error('缺少环境变量: TEST_BASE_URL');
  }
  if (!process.env.TEST_API_KEY) {
    throw new Error('缺少环境变量: TEST_API_KEY');
  }

  // 构建请求URL
  const url = `${process.env.TEST_BASE_URL}/images/generations`;

  // 构建请求参数
  const requestData = {
    prompt,
    model,
    n,
    size,
    quality,
    style,
    response_format: 'url',
  };

  console.log('[ThirdPartyImage] 开始调用第三方API');
  console.log('[ThirdPartyImage] 请求URL:', url);
  console.log('[ThirdPartyImage] 请求参数:', {
    model,
    n,
    size,
    quality,
    style,
    promptLength: prompt.length,
  });

  try {
    // 调用第三方接口
    const response = await axios.post(url, requestData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env.TEST_API_KEY}`,
      },
      timeout: 0,
    });

    console.log('[ThirdPartyImage] 第三方API响应成功');
    console.log('[ThirdPartyImage] 响应状态:', response.status);

    // 验证响应数据
    if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('第三方API返回数据格式错误');
    }

    return {
      success: true,
      data: response.data,
      images: response.data.data,
    };
  } catch (error) {
    console.error('[ThirdPartyImage] 第三方API调用失败');
    console.error('[ThirdPartyImage] 错误信息:', error.message);

    if (error.response) {
      console.error('[ThirdPartyImage] 响应状态:', error.response.status);
      console.error('[ThirdPartyImage] 响应数据:', JSON.stringify(error.response.data, null, 2));

      // 包装错误信息
      const apiError = new Error(`第三方API调用失败: ${error.response.status}`);
      apiError.statusCode = error.response.status;
      apiError.responseData = error.response.data;
      throw apiError;
    }

    throw error;
  }
}

/**
 * 从第三方API响应中提取图片URL列表
 * @param {Object} apiResponse - 第三方API响应数据
 * @returns {Array<string>} 图片URL数组
 */
function extractImageUrls(apiResponse) {
  if (!apiResponse || !apiResponse.data || !Array.isArray(apiResponse.data)) {
    return [];
  }

  return apiResponse.data
    .map((item) => item.url)
    .filter((url) => url && typeof url === 'string');
}

/**
 * 图生图 - 调用第三方 /chat/completions 接口
 * @param {Object} options - 生成选项
 * @param {string} options.prompt - 图片生成提示词
 * @param {string} options.size - 图片尺寸（如 "4:3"）
 * @param {Array<string>} options.imageUrl - 图片URL数组
 * @returns {Promise<Object>} 返回第三方API响应数据
 */
async function imageToImage(options = {}) {
  const { prompt, size, imageUrl } = options;

  if (!prompt) throw new Error('缺少必需参数: prompt');
  if (!imageUrl || !Array.isArray(imageUrl) || imageUrl.length === 0) {
    throw new Error('缺少必需参数: imageUrl');
  }
  if (!process.env.TEST_BASE_URL || !process.env.TEST_API_KEY) {
    throw new Error('缺少环境变量: TEST_BASE_URL 或 TEST_API_KEY');
  }

  // 拼接尺寸到prompt
  const finalPrompt = size ? `${prompt} 尺寸[${size}]` : prompt;

  // 构建content数组
  const content = [{ type: 'text', text: finalPrompt }];
  imageUrl.forEach(url => {
    content.push({ type: 'image_url', image_url: { url } });
  });

  const requestData = {
    model: 'gpt-image-1.5-all',
    stream: false,
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    messages: [{ role: 'user', content }]
  };

  console.log('[ThirdPartyImage.imageToImage] 调用第三方API');
  console.log('[ThirdPartyImage.imageToImage] 图片数量:', imageUrl.length);
  console.log('[ThirdPartyImage.imageToImage] 第三方API入参:', JSON.stringify(requestData, null, 2));

  try {
    const response = await axios.post(
      `${process.env.TEST_BASE_URL}/chat/completions`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_API_KEY}`
        },
        timeout: 0
      }
    );

    console.log('[ThirdPartyImage.imageToImage] API响应成功');
    console.log('[ThirdPartyImage.imageToImage] 响应数据:', JSON.stringify(response.data, null, 2));
    return { success: true, data: response.data };
  } catch (error) {
    console.error('[ThirdPartyImage.imageToImage] API调用失败:', error.message);
    if (error.response) {
      const apiError = new Error(`第三方API调用失败: ${error.response.status}`);
      apiError.statusCode = error.response.status;
      apiError.responseData = error.response.data;
      throw apiError;
    }
    throw error;
  }
}

/**
 * 从图生图响应中提取图片URL
 * @param {Object} apiResponse - API响应数据
 * @returns {Array<string>} 图片URL数组
 */
function extractImageUrlFromChat(apiResponse) {
  const urls = [];
  const content = apiResponse?.choices?.[0]?.message?.content;

  if (!content) return urls;

  // 格式1: content是字符串URL
  if (typeof content === 'string' && content.startsWith('http')) {
    urls.push(content);
    return urls;
  }

  // 格式2: content是Markdown格式，包含图片链接
  if (typeof content === 'string') {
    // 匹配 ![xxx](url) 格式
    const markdownRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = markdownRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }

    // 如果没找到Markdown格式，尝试直接匹配URL
    if (urls.length === 0) {
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+\.(?:png|jpg|jpeg|gif|webp)/gi;
      const matches = content.match(urlRegex);
      if (matches) {
        urls.push(...matches);
      }
    }
    return urls;
  }

  // 格式3: content是数组
  if (Array.isArray(content)) {
    content.forEach(item => {
      if (item.type === 'image_url' && item.image_url?.url) {
        urls.push(item.image_url.url);
      }
    });
  }

  return urls;
}

/**
 * 获取默认提示词
 * @returns {string} 默认提示词
 */
function getDefaultPrompt() {
  return 'A masterpiece digital art illustration, highly detailed anime style. Side profile of a young girl with short bob hair, wearing detailed white sci-fi tech-wear, sitting cross-legged on an ergonomic chair in a dark server room. She is looking out of a massive floor-to-ceiling glass window. The Floor (Crucial for Depth): Highly polished, reflective black marble floor, mirroring the starry sky and city lights perfectly, creating a sense of infinite depth. Messy cables and server racks are visible in the dark room, faintly illuminated by blue screen glow. The View: Breathtaking vertical cyberpunk city. Towering skyscrapers with high-density window lights. A spectacular, crystal clear starry night sky with the Milky Way and shooting stars visible. Lighting & Texture: Cinematic lighting with volumetric bloom. Cool blue and cyan tones contrasting with sharp white starlight. Ray tracing rendering style, distinct light particles, 8k resolution, intricate details, Pixiv Hall of Fame quality, glossy texture, sharp focus. 9:16';
}

module.exports = {
  generateImage,
  extractImageUrls,
  imageToImage,
  extractImageUrlFromChat,
  getDefaultPrompt,
};
