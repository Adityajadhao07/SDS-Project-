import {
  MIN_BOOKING_MINUTES,
  MAX_BOOKING_MINUTES,
  MIN_ADVANCE_HOURS,
  MAX_ADVANCE_DAYS,
  DEFAULT_OPEN_HOUR,
  DEFAULT_CLOSE_HOUR,
  DEFAULT_TIMEZONE,
  SLOT_MINUTES,
} from '../config/constants.js';
import { ValidationError } from './errors.js';

/**
 * Parses and returns a valid Date instance.
 * @param {Date | string | number} value
 * @param {string} fieldName
 * @returns {Date}
 * @throws {ValidationError}
 */
function toDate(value, fieldName) {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Invalid date format for ${fieldName}`);
  }
  return date;
}

/**
 * Extracts local date and time components for a given Date and timezone.
 * @param {Date} date
 * @param {string} timezone
 * @returns {{ dateStr: string, hour: number, minute: number, second: number }}
 */
function getLocalTimeComponents(date, timezone = DEFAULT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);

  return {
    dateStr: `${parts.year}-${parts.month}-${parts.day}`,
    hour,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/**
 * Validates that the booking duration is between 30 minutes and 4 hours.
 *
 * @param {Date | string | number} startTime
 * @param {Date | string | number} endTime
 * @returns {number} duration in minutes
 * @throws {ValidationError}
 */
export function validateDuration(startTime, endTime) {
  const start = toDate(startTime, 'startTime');
  const end = toDate(endTime, 'endTime');

  const diffMs = end.getTime() - start.getTime();

  if (diffMs <= 0) {
    throw new ValidationError('Booking end time must be strictly after start time');
  }

  const durationMinutes = diffMs / (1000 * 60);

  if (durationMinutes < MIN_BOOKING_MINUTES) {
    throw new ValidationError(
      `Booking duration (${durationMinutes} min) must be at least ${MIN_BOOKING_MINUTES} minutes`
    );
  }

  if (durationMinutes > MAX_BOOKING_MINUTES) {
    throw new ValidationError(
      `Booking duration (${durationMinutes} min) cannot exceed ${MAX_BOOKING_MINUTES} minutes (4 hours)`
    );
  }

  return durationMinutes;
}

/**
 * Validates that the booking starts at least 1 hour from now and no more than 60 days ahead.
 * Accepts an injected "now" parameter for deterministic testing.
 *
 * @param {Date | string | number} startTime
 * @param {Date | string | number} [now=new Date()]
 * @returns {true}
 * @throws {ValidationError}
 */
export function validateAdvanceWindow(startTime, now = new Date()) {
  const start = toDate(startTime, 'startTime');
  const nowDate = toDate(now, 'now');

  const startMs = start.getTime();
  const nowMs = nowDate.getTime();

  if (startMs < nowMs) {
    throw new ValidationError('Booking start time cannot be in the past');
  }

  const minAdvanceMs = MIN_ADVANCE_HOURS * 60 * 60 * 1000;
  if (startMs < nowMs + minAdvanceMs) {
    throw new ValidationError(
      `Bookings must start at least ${MIN_ADVANCE_HOURS} hour(s) in advance`
    );
  }

  const maxAdvanceMs = MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000;
  if (startMs > nowMs + maxAdvanceMs) {
    throw new ValidationError(
      `Bookings cannot be scheduled more than ${MAX_ADVANCE_DAYS} days in advance`
    );
  }

  return true;
}

/**
 * Validates that start and end times are aligned to slot boundaries (:00 or :30)
 * with zero seconds and milliseconds.
 *
 * @param {Date | string | number} startTime
 * @param {Date | string | number} endTime
 * @returns {true}
 * @throws {ValidationError}
 */
export function validateSlotAlignment(startTime, endTime) {
  const start = toDate(startTime, 'startTime');
  const end = toDate(endTime, 'endTime');

  const isAligned = (date) => {
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    const millis = date.getUTCMilliseconds();

    return minutes % SLOT_MINUTES === 0 && seconds === 0 && millis === 0;
  };

  if (!isAligned(start)) {
    throw new ValidationError(
      `Booking start time must be aligned to a ${SLOT_MINUTES}-minute slot boundary (:00 or :30)`
    );
  }

  if (!isAligned(end)) {
    throw new ValidationError(
      `Booking end time must be aligned to a ${SLOT_MINUTES}-minute slot boundary (:00 or :30)`
    );
  }

  return true;
}

/**
 * Validates that the booking falls entirely within college operating hours
 * (08:00 to 20:00 Asia/Kolkata) on a single calendar day.
 *
 * @param {Date | string | number} startTime
 * @param {Date | string | number} endTime
 * @param {string} [timezone=DEFAULT_TIMEZONE]
 * @param {number} [openHour=DEFAULT_OPEN_HOUR]
 * @param {number} [closeHour=DEFAULT_CLOSE_HOUR]
 * @returns {true}
 * @throws {ValidationError}
 */
export function validateOperatingHours(
  startTime,
  endTime,
  timezone = DEFAULT_TIMEZONE,
  openHour = DEFAULT_OPEN_HOUR,
  closeHour = DEFAULT_CLOSE_HOUR
) {
  const start = toDate(startTime, 'startTime');
  const end = toDate(endTime, 'endTime');

  const startLocal = getLocalTimeComponents(start, timezone);
  const endLocal = getLocalTimeComponents(end, timezone);

  // Must not span multiple calendar days
  if (startLocal.dateStr !== endLocal.dateStr) {
    throw new ValidationError('Bookings cannot span across multiple calendar days');
  }

  // Check start time against opening hour
  const startTotalMinutes = startLocal.hour * 60 + startLocal.minute;
  const openTotalMinutes = openHour * 60;

  if (startTotalMinutes < openTotalMinutes) {
    throw new ValidationError(
      `Booking cannot start before operating opening hour (${String(openHour).padStart(2, '0')}:00 ${timezone})`
    );
  }

  // Check end time against closing hour
  const endTotalMinutes = endLocal.hour * 60 + endLocal.minute;
  const closeTotalMinutes = closeHour * 60;

  if (endTotalMinutes > closeTotalMinutes) {
    throw new ValidationError(
      `Booking cannot end after operating closing hour (${String(closeHour).padStart(2, '0')}:00 ${timezone})`
    );
  }

  return true;
}

/**
 * Validates that attendees is a positive integer and does not exceed venue capacity.
 *
 * @param {number} attendees
 * @param {number} venueCapacity
 * @returns {true}
 * @throws {ValidationError}
 */
export function validateCapacity(attendees, venueCapacity) {
  if (typeof attendees !== 'number' || !Number.isInteger(attendees) || attendees <= 0) {
    throw new ValidationError('Attendee count must be a positive integer greater than zero');
  }

  if (typeof venueCapacity !== 'number' || venueCapacity <= 0) {
    throw new ValidationError('Invalid venue capacity');
  }

  if (attendees > venueCapacity) {
    throw new ValidationError(
      `Attendee count (${attendees}) exceeds maximum venue capacity (${venueCapacity})`
    );
  }

  return true;
}
