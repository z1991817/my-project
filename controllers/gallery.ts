/**
 * =====================================================
 * Gallery Controller - 画廊控制器
 * =====================================================
 * 功能：查询图片生成记录，用于画廊展示
 * 创建时间：2026-03-17
 * =====================================================
 */

const ImageGenerationRecord = require('../models/imageGenerationRecord');

/**
 * 获取画廊列表
 * GET /app/gallery
 *
 * 查询参数：
 * @param {number} page - 页码（可选，默认 1）
 * @param {number} pageSize - 每页数量（可选，默认 20）
 * @param {string} generation_type - 生成类型过滤（可选，text-to-image/image-to-image）
 * @param {string} status - 状态过滤（可选，uploaded/failed/pending）
 *
 * 返回数据按创建时间倒序排列（最新的在最上方）
 */
async function getGalleryList(req, res, next) {
  try {
    const {
      page = 1,
      pageSize = 20,
      generation_type,
      status = 'uploaded', // 默认只显示上传成功的记录
    } = req.query;

    // 参数验证
    const currentPage = Math.max(1, parseInt(page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize) || 20)); // 限制最大100条
    const offset = (currentPage - 1) * limit;

    // 构建查询条件
    const conditions = [];
    const params = [];

    if (generation_type) {
      conditions.push('generation_type = ?');
      params.push(generation_type);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数
    const db = require('../config/db');
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM image_generation_records ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 查询数据列表（按创建时间倒序）
    const [records] = await db.query(
      `SELECT
        id,
        session_id,
        user_id,
        generation_type,
        prompt,
        source_image_url,
        model,
        size,
        quality,
        style,
        n,
        third_party_url,
        cos_url,
        status,
        created_at,
        updated_at
      FROM image_generation_records
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // 返回分页数据
    res.json({
      code: 200,
      message: '查询成功',
      data: {
        list: records,
        pagination: {
          page: currentPage,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[Gallery.getGalleryList] Error:', error.message);
    next(error);
  }
}

/**
 * 获取当前用户的创作列表
 * GET /app/my-creations
 *
 * 查询参数：
 * @param {number} page - 页码（可选，默认 1）
 * @param {number} pageSize - 每页数量（可选，默认 12）
 *
 * 需要认证，根据 token 中的 user_id 查询
 */
async function getMyCreations(req, res, next) {
  try {
    const { page = 1, pageSize = 12 } = req.query;
    const userId = req.user.id;

    const currentPage = Math.max(1, parseInt(page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pageSize) || 12));
    const offset = (currentPage - 1) * limit;

    const db = require('../config/db');

    // 查询总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM image_generation_records WHERE user_id = ? AND status = ?',
      [userId, 'uploaded']
    );
    const total = countResult[0].total;

    // 查询数据列表（按创建时间倒序）
    const [records] = await db.query(
      `SELECT
        id, session_id, user_id, generation_type, prompt,
        source_image_url, model, size, quality, style,
        n, third_party_url, cos_url, status, created_at, updated_at
      FROM image_generation_records
      WHERE user_id = ? AND status = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
      [userId, 'uploaded', limit, offset]
    );

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        list: records,
        pagination: {
          page: currentPage,
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('[Gallery.getMyCreations] Error:', error.message);
    next(error);
  }
}

module.exports = {
  getGalleryList,
  getMyCreations,
};
