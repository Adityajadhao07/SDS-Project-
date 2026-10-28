import { bookingRepository } from '../repositories/bookingRepository.js';
import { venueRepository } from '../repositories/venueRepository.js';
import {
  validateDuration,
  validateAdvanceWindow,
  validateSlotAlignment,
  validateOperatingHours,
  validateCapacity,
} from '../utils/bookingRules.js';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
} from '../utils/errors.js';
import { env } from '../config/env.js';
import { BOOKING_STATUS, ROLES, CANCEL_LEAD_HOURS } from '../config/constants.js';

export class BookingService {
  async createBooking(user, input) {
    if (!user || !user.id) {
      throw new UnauthorizedError('User authentication required to create a booking');
    }

    const venue = await venueRepository.findById(input.venueId);
    if (!venue) {
      throw new NotFoundError(`Venue with ID ${input.venueId} not found`);
    }

    if (!venue.isActive) {
      throw new ValidationError('Cannot book an inactive venue');
    }

    validateSlotAlignment(input.startTime, input.endTime);
    validateDuration(input.startTime, input.endTime);
    validateAdvanceWindow(input.startTime);
    validateOperatingHours(input.startTime, input.endTime);
    validateCapacity(input.attendees, venue.capacity);

    const overlapping = await bookingRepository.findOverlapping(
      venue.id,
      input.startTime,
      input.endTime
    );

    if (overlapping) {
      throw new ConflictError(
        'The requested time slot conflicts with an existing booking',
        {
          conflictingBookingId: overlapping.id,
          conflictingStatus: overlapping.status,
        }
      );
    }

    let initialStatus = BOOKING_STATUS.PENDING;
    if (user.role === ROLES.FACULTY && env.FACULTY_AUTO_APPROVE === true) {
      initialStatus = BOOKING_STATUS.APPROVED;
    }

    const booking = await bookingRepository.create({
      venueId: venue.id,
      userId: user.id,
      startTime: input.startTime,
      endTime: input.endTime,
      title: input.title,
      purpose: input.purpose,
      attendees: input.attendees,
      status: initialStatus,
    });

    return {
      ...booking,
      venueName: venue.name,
      building: venue.building,
    };
  }

  async getBooking(id) {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async getUserBookings(userId) {
    if (!userId) {
      throw new UnauthorizedError('User ID required');
    }
    return bookingRepository.findByUser(userId);
  }

  async cancelBooking(bookingId, user) {
    if (!user || !user.id) {
      throw new UnauthorizedError('User authentication required');
    }

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const isOwner = booking.userId === user.id;
    const isAdmin = user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('You can only cancel your own bookings');
    }

    if (booking.status !== BOOKING_STATUS.PENDING && booking.status !== BOOKING_STATUS.APPROVED) {
      throw new ValidationError('Only pending or approved bookings can be cancelled');
    }

    // Check time window
    const startTime = new Date(booking.startTime);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (!isAdmin && hoursUntilStart <= CANCEL_LEAD_HOURS) {
      throw new ValidationError(`Bookings can only be cancelled more than ${CANCEL_LEAD_HOURS} hours before start time`);
    }

    const cancelled = await bookingRepository.cancel(bookingId);
    if (!cancelled) {
      throw new ValidationError('Booking could not be cancelled');
    }

    return cancelled;
  }
}

export const bookingService = new BookingService();
