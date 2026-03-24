const db = require('../config/db');

const Image = {
  /**
   * 获取图片列表（支持分页和筛选）
   */
  async list({ category_id, description, page = 1, pageSize = 10, title }) {
    const offset = (page - 1) * pageSize;
    const conditions = [];
    const params = [];

    // 构建查询条件
    if (category_id) {
      conditions.push('category_id = ?');
      params.push(category_id);
    }
    if (description) {
      conditions.push('description LIKE ?');
      params.push(`%${description}%`);
    }
    if (title) {
      conditions.push('title LIKE ?');
      params.push(`%${title}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 查询总数和列表
    const [[{ total }], [rows]] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM images ${whereClause}`, params),
      db.query(
        `SELECT i.id, i.url, i.thumbnail, i.title, i.description, i.prompt, i.category_id,
         c.name AS category_name,
         DATE_FORMAT(i.uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at,
         DATE_FORMAT(i.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
         FROM images i
         LEFT JOIN categories c ON i.category_id = c.id
         ${whereClause}
         ORDER BY i.uploaded_at DESC, i.id DESC
         LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      ),
    ]);

    return { total, list: rows };
  },

  /**
   * 根据 ID 获取图片详情
   */
  async findById(id) {
    const [rows] = await db.query(
      `SELECT i.id, i.url, i.thumbnail, i.title, i.description, i.prompt, i.category_id,
       c.name AS category_name,
       i.uploaded_at, i.created_at, i.updated_at
       FROM images i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * 创建图片
   */
  async create({ url, description, prompt, category_id,title }) {
    const [result] = await db.query(
      'INSERT INTO images (url, description, prompt, category_id,title) VALUES (?, ?, ?, ?, ?)',
      [url, description, prompt, category_id,title]
    );
    return result.insertId;
  },

  /**
   * 创建 OpenAI 生成图记录（绑定上传任务）
   */
  async createFromOpenAITask({
    url,
    source_url,
    thumbnail,
    title,
    description,
    prompt,
    category_id,
    upload_task_id,
    upload_status,
    upload_error,
  }) {
    const [result] = await db.query(
      `INSERT INTO images (
        url, source_url, thumbnail, title, description, prompt, category_id,
        upload_task_id, upload_status, upload_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        url,
        source_url || null,
        thumbnail || null,
        title || null,
        description || null,
        prompt || null,
        category_id || null,
        upload_task_id || null,
        upload_status || null,
        upload_error || null,
      ]
    );
    return result.insertId;
  },

  /**
   * 更新图片
   */
  async update(id, { url, title,description, prompt, category_id }) {
    const fields = [];
    const params = [];

    if (url !== undefined) {
      fields.push('url = ?');
      params.push(url);
    }
    if (title !== undefined) {
      fields.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      params.push(description);
    }
    if (prompt !== undefined) {
      fields.push('prompt = ?');
      params.push(prompt);
    }
    if (category_id !== undefined) {
      fields.push('category_id = ?');
      params.push(category_id);
    }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await db.query(
      `UPDATE images SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  /**
   * 更新 OpenAI 上传任务状态
   */
  async updateOpenAIUpload(id, { url, upload_status, upload_error, thumbnail }) {
    const fields = [];
    const params = [];

    if (url !== undefined) {
      fields.push('url = ?');
      params.push(url);
    }
    if (upload_status !== undefined) {
      fields.push('upload_status = ?');
      params.push(upload_status);
    }
    if (upload_error !== undefined) {
      fields.push('upload_error = ?');
      params.push(upload_error);
    }
    if (thumbnail !== undefined) {
      fields.push('thumbnail = ?');
      params.push(thumbnail);
    }

    if (fields.length === 0) {
      return false;
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE images SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  /**
   * 删除图片
   */
  async delete(id) {
    const [result] = await db.query('DELETE FROM images WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * 根据分类ID获取图片数量
   */
  async countByCategory(category_id) {
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM images WHERE category_id = ?',
      [category_id]
    );
    return count;
  },
};

module.exports = Image;
