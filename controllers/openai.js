const openaiService = require('../services/openai');

/**
 * 分析图片
 */
async function analyzeImage(req, res, next) {
  try {
    const { imageUrl, prompt } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ code: 400, message: '缺少图片URL' });
    }

    const result = await openaiService.analyzeImage(imageUrl, prompt);
    res.json({ code: 200, data: result });
  } catch (error) {
    next(error);
  }
}

/**
 * 生成文本
 */
async function generateText(req, res, next) {
  try {
    const { prompt, systemPrompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ code: 400, message: '缺少提示词' });
    }

    const result = await openaiService.generateText(prompt, systemPrompt);
    res.json({ code: 200, data: { content: result } });
  } catch (error) {
    next(error);
  }
}

/**
 * 生成图片
 */
async function generateImage(req, res, next) {
  try {
    const { prompt, model, n, size, response_format, style, quality, uploadToCos } = req.body;

    if (!prompt) {
      return res.status(400).json({ code: 400, message: '缺少提示词' });
    }

    const options = { model, n, size, response_format, style, quality, uploadToCos };
    const results = await openaiService.generateImage(prompt, options);

    // 格式化返回数据
    const date = new Date().toISOString().split('T')[0];

    res.json({
      code: 200,
      data: { list: results, date }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  analyzeImage,
  generateText,
  generateImage
};
