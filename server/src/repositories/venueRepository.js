import { query } from '../db/pool.js';

export class VenueRepository {
  async findAll(filters = {}) {
    const conditions = [];
    const values = [];

    // Always filter by is_active unless explicitly requested
    if (filters.isActive !== undefined) {
      values.push(filters.isActive);
      conditions.push(`is_active = $${values.length}`);
    } else {
      conditions.push('is_active = TRUE');
    }

    if (filters.type) {
      values.push(filters.type.toLowerCase().trim());
      conditions.push(`LOWER(type) = $${values.length}`);
    }

    if (filters.minCapacity) {
      values.push(Number(filters.minCapacity));
      conditions.push(`capacity >= $${values.length}`);
    }

    if (filters.facility) {
      values.push(filters.facility.toLowerCase().trim());
      conditions.push(`$${values.length} = ANY(facilities)`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT id, name, capacity, type, building, facilities, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM venues
      ${whereClause}
      ORDER BY name ASC;
    `;

    const res = await query(sql, values);
    return res.rows;
  }

  async findById(id) {
    const res = await query(
      `SELECT id, name, capacity, type, building, facilities, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM venues
       WHERE id = $1;`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByName(name) {
    const res = await query(
      `SELECT id, name, capacity, type, building, facilities, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM venues
       WHERE LOWER(name) = LOWER($1);`,
      [name.trim()]
    );
    return res.rows[0] || null;
  }

  async create({ name, capacity, type, building, facilities = [], isActive = true }) {
    const res = await query(
      `INSERT INTO venues (name, capacity, type, building, facilities, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, capacity, type, building, facilities, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt";`,
      [name.trim(), capacity, type.toLowerCase().trim(), building.trim(), facilities, isActive]
    );
    return res.rows[0];
  }

  async update(id, fields = {}) {
    const setClauses = [];
    const values = [];

    if (fields.name !== undefined) {
      values.push(fields.name.trim());
      setClauses.push(`name = $${values.length}`);
    }
    if (fields.capacity !== undefined) {
      values.push(fields.capacity);
      setClauses.push(`capacity = $${values.length}`);
    }
    if (fields.type !== undefined) {
      values.push(fields.type.toLowerCase().trim());
      setClauses.push(`type = $${values.length}`);
    }
    if (fields.building !== undefined) {
      values.push(fields.building.trim());
      setClauses.push(`building = $${values.length}`);
    }
    if (fields.facilities !== undefined) {
      values.push(fields.facilities);
      setClauses.push(`facilities = $${values.length}`);
    }
    if (fields.isActive !== undefined) {
      values.push(fields.isActive);
      setClauses.push(`is_active = $${values.length}`);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    setClauses.push('updated_at = NOW()');
    values.push(id);

    const sql = `
      UPDATE venues
      SET ${setClauses.join(', ')}
      WHERE id = $${values.length}
      RETURNING id, name, capacity, type, building, facilities, is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt";
    `;

    const res = await query(sql, values);
    return res.rows[0] || null;
  }
}

export const venueRepository = new VenueRepository();
