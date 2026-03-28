import db from '../config/db';

export interface AIModelRecord {
  id: number;
  name: string;
  model_key?: string | null;
  manufacturer?: string | null;
  description?: string;
  aspect_ratio?: string | null;
  aspect_ratios: string[];
  status: number;
  consume_points: number;
  created_at: string;
  updated_at?: string;
}

function normalizeAspectRatios(value?: string | string[] | null): string[] {
  if (!value) return [];

  const rawValues = Array.isArray(value) ? value : value.split(',');
  return Array.from(new Set(rawValues.map((item) => item.trim()).filter(Boolean)));
}

function mapModelRecord(row: any): AIModelRecord {
  const aspectRatios = normalizeAspectRatios(row.aspect_ratio);

  return {
    ...row,
    aspect_ratio: row.aspect_ratio ?? null,
    aspect_ratios: aspectRatios,
  };
}

export const AIModel = {
  async list({
    name,
    manufacturer,
    status,
    page = 1,
    pageSize = 10,
  }: {
    name?: string;
    manufacturer?: string;
    status?: number;
    page?: number;
    pageSize?: number;
  }) {
    const offset = (page - 1) * pageSize;
    const conditions: string[] = [];
    const params: any[] = [];

    if (name) {
      conditions.push('name LIKE ?');
      params.push(`%${name}%`);
    }
    if (manufacturer) {
      conditions.push('manufacturer LIKE ?');
      params.push(`%${manufacturer}%`);
    }
    if (status !== undefined) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[{ total }], [rows]]: any = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM ai_models ${whereClause}`, params),
      db.query(
        `SELECT id, name, model_key, manufacturer, description, aspect_ratio, status, consume_points,
         DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
         DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
         FROM ai_models ${whereClause}
         ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, offset]
      ),
    ]);

    return { total, list: (rows as any[]).map(mapModelRecord) };
  },

  async findById(id: number): Promise<AIModelRecord | null> {
    const [rows]: any = await db.query(
      `SELECT id, name, model_key, manufacturer, description, aspect_ratio, status, consume_points, created_at, updated_at
       FROM ai_models WHERE id = ? LIMIT 1`,
      [id]
    );
    const row = (rows as any[])[0];
    return row ? mapModelRecord(row) : null;
  },

  async findByName(name: string): Promise<AIModelRecord | null> {
    const [rows]: any = await db.query(
      `SELECT id, name, model_key, manufacturer, description, aspect_ratio, status, consume_points, created_at, updated_at
       FROM ai_models WHERE name = ? LIMIT 1`,
      [name]
    );
    const row = (rows as any[])[0];
    return row ? mapModelRecord(row) : null;
  },

  async findActiveByNameOrKey(model: string): Promise<AIModelRecord | null> {
    try {
      if (!model || typeof model !== 'string') throw new Error('Invalid model');
      const [rows]: any = await db.query(
        `SELECT id, name, model_key, manufacturer, description, aspect_ratio, status, consume_points,
                DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
         FROM ai_models
         WHERE status = 1 AND (name = ? OR model_key = ?)
         ORDER BY id DESC
         LIMIT 1`,
        [model, model]
      );
      const row = (rows as any[])[0];
      return row ? mapModelRecord(row) : null;
    } catch (error: any) {
      console.error('[AIModel.findActiveByNameOrKey] Error:', error.message);
      return null;
    }
  },

  async create({
    name,
    model_key,
    manufacturer,
    description,
    aspect_ratio,
    aspect_ratios,
    status = 1,
    consume_points,
  }: {
    name: string;
    model_key?: string | null;
    manufacturer?: string | null;
    description?: string;
    aspect_ratio?: string | null;
    aspect_ratios?: string[];
    status?: number;
    consume_points: number;
  }): Promise<number> {
    const normalizedAspectRatio = normalizeAspectRatios(aspect_ratios ?? aspect_ratio).join(',') || null;

    const [result]: any = await db.query(
      'INSERT INTO ai_models (name, model_key, manufacturer, description, aspect_ratio, status, consume_points) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, model_key || null, manufacturer || null, description || null, normalizedAspectRatio, status, consume_points]
    );
    return result.insertId;
  },

  async update(
    id: number,
    data: {
      name?: string;
      model_key?: string | null;
      manufacturer?: string | null;
      description?: string | null;
      aspect_ratio?: string | null;
      aspect_ratios?: string[];
      status?: number;
      consume_points?: number;
    }
  ): Promise<boolean> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
    if (data.model_key !== undefined) { fields.push('model_key = ?'); params.push(data.model_key); }
    if (data.manufacturer !== undefined) { fields.push('manufacturer = ?'); params.push(data.manufacturer); }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description); }
    if (data.aspect_ratio !== undefined || data.aspect_ratios !== undefined) {
      fields.push('aspect_ratio = ?');
      params.push(normalizeAspectRatios(data.aspect_ratios ?? data.aspect_ratio).join(',') || null);
    }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status); }
    if (data.consume_points !== undefined) { fields.push('consume_points = ?'); params.push(data.consume_points); }

    if (fields.length === 0) return false;

    params.push(id);
    const [result]: any = await db.query(
      `UPDATE ai_models SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result]: any = await db.query('DELETE FROM ai_models WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },
};

export default AIModel;
