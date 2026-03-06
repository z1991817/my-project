const Image = require('../models/image');

const imageController = {
  /**
   * 获取图片列表
   * GET /api/v1/images
   * 查询参数: category_id, description, page, pageSize
   */
  async list(req, res, next) {
    try {
      const { category_id, description, page = 1, pageSize = 10 } = req.query;
      const result = await Image.list({
        category_id: category_id ? parseInt(category_id) : undefined,
        description,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        title: req.query.title
      });
      console.log(result,'result');
      res.json({
        code: 200,
        message: '获取成功',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取图片详情
   * GET /api/v1/images/:id
   */
  async detail(req, res, next) {
    try {
      const { id } = req.params;
      const image = await Image.findById(id);

      if (!image) {
        return res.status(404).json({
          code: 404,
          message: '图片不存在',
        });
      }

      res.json({
        code: 200,
        message: '获取成功',
        data: image,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 上传图片文件
   * POST /api/v1/images/upload
   * 需要登录认证
   * 表单字段: file (文件)
   */
  async upload(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: '请选择要上传的图片文件',
        });
      }

      // 上传到腾讯云 COS
      const { uploadToCOS } = require('../middleware/cosUpload');
      const url = await uploadToCOS(req.file.buffer, req.file.originalname);

      res.json({
        code: 200,
        message: '上传成功',
        data: {
          url,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 上传图片（通过URL）
   * POST /api/v1/images
   * 请求体: { url, description, prompt, category_id }
   */
  async create(req, res, next) {
    try {
      const { url, description, prompt, category_id, title } = req.body;

      // 验证必填字段
      if (!url || url.trim() === '') {
        return res.status(400).json({
          code: 400,
          message: '图片URL不能为空',
        });
      }

      const id = await Image.create({
        url: url.trim(),
        description,
        prompt,
        category_id,
        title
      });

      res.json({
        code: 200,
        message: '上传成功',
        data: { id },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新图片
   * PUT /api/v1/images/:id
   * 请求体: { url, description, prompt, category_id }
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { url, description, prompt, category_id,title } = req.body;

      // 检查图片是否存在
      const image = await Image.findById(id);
      if (!image) {
        return res.status(404).json({
          code: 404,
          message: '图片不存在',
        });
      }

      // 验证URL
      if (url !== undefined && url.trim() === '') {
        return res.status(400).json({
          code: 400,
          message: '图片URL不能为空',
        });
      }

      const success = await Image.update(id, {
        url: url ? url.trim() : undefined,
        description,
        prompt,
        category_id,
        title
      });

      if (!success) {
        return res.status(400).json({
          code: 400,
          message: '更新失败',
        });
      }

      res.json({
        code: 200,
        message: '更新成功',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 删除图片
   * DELETE /api/v1/images/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // 检查图片是否存在
      const image = await Image.findById(id);
      if (!image) {
        return res.status(404).json({
          code: 404,
          message: '图片不存在',
        });
      }

      const success = await Image.delete(id);

      if (!success) {
        return res.status(400).json({
          code: 400,
          message: '删除失败',
        });
      }

      res.json({
        code: 200,
        message: '删除成功',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = imageController;
