import { bookingService } from '../services/bookingService.js';

export class BookingController {
  async createBooking(req, res, next) {
    try {
      const booking = await bookingService.createBooking(req.user, req.body);
      res.status(201).json(booking);
    } catch (err) {
      next(err);
    }
  }

  async getMyBookings(req, res, next) {
    try {
      const bookings = await bookingService.getUserBookings(req.user.id);
      res.json(bookings);
    } catch (err) {
      next(err);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user);
      res.json(booking);
    } catch (err) {
      next(err);
    }
  }
}

export const bookingController = new BookingController();
