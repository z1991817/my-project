const Category = require('../models/category');

const categoryController = {
  /**
   * 获取分类列表
   * GET /api/v1/categories
   * 查询参数: name, status, page, pageSize, sortBy, sortOrder
   */
  async list(req, res, next) {
    try {
      const { name, status, page = 1, pageSize = 10, sortBy, sortOrder } = req.query;
      const result = await Category.list({
        name,
        status: status !== undefined ? parseInt(status) : undefined,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        sortBy,
        sortOrder,
      });

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
   * 获取所有启用的分类（用于下拉选择）
   * GET /api/v1/categories/enabled
   */
  async getAllEnabled(req, res, next) {
    try {
      const list = await Category.getAllEnabled();
      res.json({
        code: 200,
        message: '获取成功',
        data: list,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 获取分类详情
   * GET /api/v1/categories/:id
   */
  async detail(req, res, next) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '分类不存在',
        });
      }

      res.json({
        code: 200,
        message: '获取成功',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 创建分类
   * POST /api/v1/categories
   * 请求体: { name, description, sort_order, status }
   */
  async create(req, res, next) {
    try {
      const { name, description, sort_order, status } = req.body;

      // 验证必填字段
      if (!name || name.trim() === '') {
        return res.status(400).json({
          code: 400,
          message: '分类名称不能为空',
        });
      }

      const id = await Category.create({
        name: name.trim(),
        description,
        sort_order,
        status,
      });

      res.json({
        code: 200,
        message: '创建成功',
        data: { id },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * 更新分类
   * PUT /api/v1/categories/:id
   * 请求体: { name, description, sort_order, status }
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, sort_order, status } = req.body;

      // 检查分类是否存在
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '分类不存在',
        });
      }

      // 验证名称
      if (name !== undefined && name.trim() === '') {
        return res.status(400).json({
          code: 400,
          message: '分类名称不能为空',
        });
      }

      const success = await Category.update(id, {
        name: name ? name.trim() : undefined,
        description,
        sort_order,
        status,
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
   * 删除分类
   * DELETE /api/v1/categories/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // 检查分类是否存在
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '分类不存在',
        });
      }

      const success = await Category.delete(id);

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

  /**
   * 更新分类序号
   * PUT /api/v1/categories/:id/sort
   * 请求体: { sort_order }
   */
  async updateSortOrder(req, res, next) {
    try {
      const { id } = req.params;
      const { sort_order } = req.body;

      // 验证参数
      if (sort_order === undefined || sort_order === null) {
        return res.status(400).json({
          code: 400,
          message: '序号不能为空',
        });
      }

      const sortOrderNum = parseInt(sort_order);
      if (isNaN(sortOrderNum) || sortOrderNum < 0) {
        return res.status(400).json({
          code: 400,
          message: '序号必须是非负整数',
        });
      }

      // 检查分类是否存在
      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          code: 404,
          message: '分类不存在',
        });
      }

      const success = await Category.update(id, { sort_order: sortOrderNum });

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
};

module.exports = categoryController;
