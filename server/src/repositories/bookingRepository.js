import { pool } from '../db/pool.js';

export class BookingRepository {
  async create({ venueId, userId, startTime, endTime, title, purpose, attendees, status = 'pending' }) {
    const query = `
      INSERT INTO bookings (venue_id, user_id, start_time, end_time, title, purpose, attendees, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, venue_id AS "venueId", user_id AS "userId", 
                start_time AS "startTime", end_time AS "endTime", 
                title, purpose, attendees, status, rejection_reason AS "rejectionReason",
                created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const values = [
      venueId,
      userId,
      startTime,
      endTime,
      title?.trim?.() || title,
      purpose?.trim?.() || purpose,
      attendees,
      status,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async findOverlapping(venueId, startTime, endTime) {
    const query = `
      SELECT id, venue_id AS "venueId", user_id AS "userId",
             start_time AS "startTime", end_time AS "endTime",
             status, purpose, attendees
      FROM bookings
      WHERE venue_id = $1
        AND status IN ('pending', 'approved')
        AND start_time < $3
        AND end_time > $2
      LIMIT 1
    `;
    const result = await pool.query(query, [venueId, startTime, endTime]);
    return result.rows[0] || null;
  }

  async findInRange(venueId, fromUtc, toUtc) {
    const query = `
      SELECT id, venue_id AS "venueId", user_id AS "userId",
             start_time AS "startTime", end_time AS "endTime",
             status, purpose, attendees
      FROM bookings
      WHERE venue_id = $1
        AND status IN ('pending', 'approved')
        AND start_time < $3
        AND end_time > $2
    `;
    const result = await pool.query(query, [venueId, fromUtc, toUtc]);
    return result.rows;
  }

  async findByUser(userId) {
    const query = `
      SELECT b.id, b.venue_id AS "venueId", b.user_id AS "userId",
             b.start_time AS "startTime", b.end_time AS "endTime",
             b.title, b.purpose, b.attendees, b.status, b.rejection_reason AS "rejectionReason",
             v.name AS "venueName", v.building
      FROM bookings b
      JOIN venues v ON v.id = b.venue_id
      WHERE b.user_id = $1
      ORDER BY b.start_time DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async findByStatus(status) {
    const query = `
      SELECT b.id, b.venue_id AS "venueId", b.user_id AS "userId",
             b.start_time AS "startTime", b.end_time AS "endTime",
             b.title, b.purpose, b.attendees, b.status, b.rejection_reason AS "rejectionReason",
             v.name AS "venueName", v.building,
             u.name AS "userName", u.email AS "userEmail"
      FROM bookings b
      JOIN venues v ON v.id = b.venue_id
      JOIN users u ON u.id = b.user_id
      WHERE b.status = $1
      ORDER BY b.start_time ASC
    `;
    const result = await pool.query(query, [status]);
    return result.rows;
  }

  async findById(id) {
    const query = `
      SELECT b.id, b.venue_id AS "venueId", b.user_id AS "userId",
             b.start_time AS "startTime", b.end_time AS "endTime",
             b.title, b.purpose, b.attendees, b.status, b.rejection_reason AS "rejectionReason",
             v.name AS "venueName", v.building,
             u.name AS "userName", u.email AS "userEmail", u.role AS "userRole"
      FROM bookings b
      JOIN venues v ON v.id = b.venue_id
      JOIN users u ON u.id = b.user_id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateStatus(id, status, rejectionReason = null) {
    const query = `
      UPDATE bookings
      SET status = $2, rejection_reason = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, venue_id AS "venueId", user_id AS "userId",
                start_time AS "startTime", end_time AS "endTime",
                title, purpose, attendees, status, rejection_reason AS "rejectionReason",
                updated_at AS "updatedAt"
    `;
    const result = await pool.query(query, [id, status, rejectionReason]);
    return result.rows[0] || null;
  }

  async cancel(id) {
    const query = `
      UPDATE bookings
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status IN ('pending', 'approved')
      RETURNING id, venue_id AS "venueId", user_id AS "userId",
                start_time AS "startTime", end_time AS "endTime",
                title, purpose, attendees, status, updated_at AS "updatedAt"
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }
}

export const bookingRepository = new BookingRepository();
