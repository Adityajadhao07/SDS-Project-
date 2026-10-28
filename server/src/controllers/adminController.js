import { bookingRepository } from '../repositories/bookingRepository.js';
import { venueRepository } from '../repositories/venueRepository.js';
import { pool } from '../db/pool.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors.js';
import { BOOKING_STATUS } from '../config/constants.js';

export class AdminController {
  async getBookings(req, res, next) {
    try {
      const status = req.query.status;
      let bookings;
      if (status) {
        bookings = await bookingRepository.findByStatus(status);
      } else {
        // Get all bookings - use findByStatus for each or create new method
        const pending = await bookingRepository.findByStatus('pending');
        const approved = await bookingRepository.findByStatus('approved');
        const rejected = await bookingRepository.findByStatus('rejected');
        const cancelled = await bookingRepository.findByStatus('cancelled');
        bookings = [...pending, ...approved, ...rejected, ...cancelled];
      }
      res.json(bookings);
    } catch (err) {
      next(err);
    }
  }

  async updateBooking(req, res, next) {
    const client = await pool.connect();
    try {
      const { action, reason } = req.body;
      const bookingId = req.params.id;

      await client.query('BEGIN');

      const booking = await bookingRepository.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      if (booking.status !== BOOKING_STATUS.PENDING) {
        throw new ValidationError('Only pending bookings can be approved or rejected');
      }

      if (action === 'approve') {
        const result = await client.query(
          `UPDATE bookings SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending' RETURNING *`,
          [bookingId]
        );
        if (result.rows.length === 0) {
          throw new ConflictError('Booking no longer pending or was modified');
        }
        await client.query('COMMIT');
        res.json({ ...booking, status: 'approved' });
      } else if (action === 'reject') {
        const result = await client.query(
          `UPDATE bookings SET status = 'rejected', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending' RETURNING *`,
          [bookingId, reason || null]
        );
        if (result.rows.length === 0) {
          throw new ConflictError('Booking no longer pending or was modified');
        }
        await client.query('COMMIT');
        res.json({ ...booking, status: 'rejected', rejectionReason: reason || null });
      } else {
        throw new ValidationError('Invalid action');
      }
    } catch (err) {
      await client.query('ROLLBACK');
      // Check for exclusion constraint violation
      if (err.code === '23P01') {
        return next(new ConflictError('The requested time slot conflicts with an existing approved booking.'));
      }
      next(err);
    } finally {
      client.release();
    }
  }

  async createVenue(req, res, next) {
    try {
      const venue = await venueRepository.create(req.body);
      res.status(201).json(venue);
    } catch (err) {
      next(err);
    }
  }

  async updateVenue(req, res, next) {
    try {
      const venue = await venueRepository.update(req.params.id, req.body);
      res.json(venue);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
