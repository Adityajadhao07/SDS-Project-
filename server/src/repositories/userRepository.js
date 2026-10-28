import { query } from '../db/pool.js';

export class UserRepository {
  async findById(id) {
    const res = await query(
      `SELECT id, email, name, role, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByEmail(email) {
    const res = await query(
      `SELECT id, email, password_hash, name, role, created_at, updated_at
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return res.rows[0] || null;
  }

  async create({ email, passwordHash, name, role = 'student' }) {
    const res = await query(
      `INSERT INTO users (email, password_hash, name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, name, role, created_at, updated_at`,
      [email.toLowerCase().trim(), passwordHash, name.trim(), role]
    );
    return res.rows[0];
  }
}

export const userRepository = new UserRepository();
