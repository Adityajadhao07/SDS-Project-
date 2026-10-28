import { venueRepository } from '../repositories/venueRepository.js';
import { bookingRepository } from '../repositories/bookingRepository.js';
import { generateSlots, localTimeToUtc } from '../utils/slotGenerator.js';
import { rangesOverlap } from '../utils/timeOverlap.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { DEFAULT_OPEN_HOUR, DEFAULT_CLOSE_HOUR, DEFAULT_TIMEZONE } from '../config/constants.js';

const pad = (n) => String(n).padStart(2, '0');

export class VenueService {
  async listVenues(filters = {}) {
    return venueRepository.findAll(filters);
  }

  async getVenue(id) {
    const venue = await venueRepository.findById(id);
    if (!venue) {
      throw new NotFoundError(`Venue with ID ${id} not found`);
    }
    return venue;
  }

  async createVenue(data) {
    const existing = await venueRepository.findByName(data.name);
    if (existing) {
      throw new ValidationError(`Venue with name "${data.name}" already exists`);
    }
    return venueRepository.create(data);
  }

  async updateVenue(id, data) {
    await this.getVenue(id); // Ensure exists
    return venueRepository.update(id, data);
  }

  async getAvailability(venueId, dateStr, currentUserId = null) {
    const venue = await this.getVenue(venueId);

    // Generate the 24 standard slots for this date (aligned to :00 and :30)
    const baseSlots = generateSlots(dateStr);
    const dayStartUtc = baseSlots[0].startTime;
    const dayEndUtc = baseSlots[baseSlots.length - 1].endTime;

    // Fetch all pending or approved bookings for this venue on this day
    const activeBookings = await bookingRepository.findInRange(venue.id, dayStartUtc, dayEndUtc);

    const slots = baseSlots.map((slot) => {
      // Find any overlapping active booking
      const conflictingBooking = activeBookings.find((b) =>
        rangesOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime)
      );

      if (!conflictingBooking) {
        return {
          ...slot,
          status: 'free',
          isMine: false,
        };
      }

      const isMine = Boolean(currentUserId && conflictingBooking.userId === currentUserId);

      return {
        ...slot,
        status: isMine ? 'mine' : conflictingBooking.status,
        isMine,
        bookingId: conflictingBooking.id,
        bookingStatus: conflictingBooking.status,
      };
    });

    return {
      venueId: venue.id,
      venueName: venue.name,
      date: dateStr,
      slots,
    };
  }

  async getMonthSummary(venueId, year, month) {
    const venue = await this.getVenue(venueId);

    const numYear = Number(year);
    const numMonth = Number(month);

    if (numMonth < 1 || numMonth > 12) {
      throw new ValidationError(`Invalid month ${month}: must be between 1 and 12`);
    }

    const daysInMonth = new Date(Date.UTC(numYear, numMonth, 0)).getUTCDate();
    const firstDayStr = `${numYear}-${pad(numMonth)}-01`;
    const lastDayStr = `${numYear}-${pad(numMonth)}-${pad(daysInMonth)}`;

    const monthStartUtc = localTimeToUtc(firstDayStr, DEFAULT_OPEN_HOUR, 0, DEFAULT_TIMEZONE);
    const monthEndUtc = localTimeToUtc(lastDayStr, DEFAULT_CLOSE_HOUR, 0, DEFAULT_TIMEZONE);

    // Single query for all active bookings in the entire month
    const monthBookings = await bookingRepository.findInRange(
      venue.id,
      monthStartUtc.toISOString(),
      monthEndUtc.toISOString()
    );

    const daysSummary = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${numYear}-${pad(numMonth)}-${pad(day)}`;
      const daySlots = generateSlots(dateStr);
      const totalSlots = daySlots.length;

      let freeSlots = 0;

      for (const slot of daySlots) {
        const hasOverlap = monthBookings.some((b) =>
          rangesOverlap(slot.startTime, slot.endTime, b.startTime, b.endTime)
        );
        if (!hasOverlap) {
          freeSlots++;
        }
      }

      let status = 'available';
      if (freeSlots === 0) {
        status = 'full';
      } else if (freeSlots < totalSlots) {
        status = 'partial';
      }

      daysSummary.push({
        date: dateStr,
        freeSlots,
        totalSlots,
        status,
      });
    }

    return {
      venueId: venue.id,
      venueName: venue.name,
      month: `${numYear}-${pad(numMonth)}`,
      days: daysSummary,
    };
  }
}

export const venueService = new VenueService();
