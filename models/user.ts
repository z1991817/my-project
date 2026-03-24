import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../config/db';
import { User } from '../src/types';

interface UserData {
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatar?: string;
}

const UserModel = {
  async create(data: UserData): Promise<number> {
    const { username, password, email, phone, nickname, avatar } = data;
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO users (username, password, email, phone, nickname, avatar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username || null, password || null, email || null, phone || null, nickname || null, avatar || null]
    );
    return result.insertId;
  },

  async findById(id: number): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ? AND status = 1',
      [id]
    );
    return rows[0] as User || null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE username = ? AND status = 1',
      [username]
    );
    return rows[0] as User || null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ? AND status = 1',
      [email]
    );
    return rows[0] as User || null;
  },

  async update(id: number, data: Partial<UserData>): Promise<boolean> {
    const fields = Object.keys(data).filter(k => data[k as keyof UserData] !== undefined);
    const values = fields.map(k => data[k as keyof UserData]);

    if (fields.length === 0) return false;

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows > 0;
  },

  async delete(id: number): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      'UPDATE users SET status = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
};

export = UserModel;
