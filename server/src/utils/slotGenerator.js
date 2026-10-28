import {
  DEFAULT_OPEN_HOUR,
  DEFAULT_CLOSE_HOUR,
  SLOT_MINUTES,
  DEFAULT_TIMEZONE,
} from '../config/constants.js';
import { ValidationError } from './errors.js';

const pad = (num) => String(num).padStart(2, '0');

/**
 * Validates a YYYY-MM-DD date string and verifies it is a valid calendar date.
 * @param {string} dateStr
 * @returns {void}
 * @throws {ValidationError}
 */
function validateDateString(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new ValidationError('Date must be in YYYY-MM-DD format');
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12) {
    throw new ValidationError(`Invalid month ${month}: must be between 1 and 12`);
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) {
    throw new ValidationError(
      `Invalid day ${day} for month ${month}: must be between 1 and ${daysInMonth}`
    );
  }
}

/**
 * Converts a specific date and local time (hours, minutes) in a given timezone to UTC.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {number} hours
 * @param {number} minutes
 * @param {string} timezone
 * @returns {Date}
 */
export function localTimeToUtc(dateStr, hours, minutes, timezone = DEFAULT_TIMEZONE) {
  // Asia/Kolkata has a constant offset of +05:30 with no DST
  if (timezone === 'Asia/Kolkata') {
    return new Date(`${dateStr}T${pad(hours)}:${pad(minutes)}:00+05:30`);
  }

  // Generic implementation for any IANA timezone
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetLocalMs = Date.UTC(year, month - 1, day, hours, minutes, 0);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const testDate = new Date(targetLocalMs);
  const parts = formatter.formatToParts(testDate);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

  const localFormattedMs = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === '24' ? 0 : map.hour),
    Number(map.minute),
    Number(map.second)
  );

  const offset = localFormattedMs - targetLocalMs;
  return new Date(targetLocalMs - offset);
}

/**
 * Generates an array of contiguous 30-minute time slots for a calendar date,
 * aligned to :00 and :30 in local college time and converted to UTC.
 *
 * @param {string} dateStr - 'YYYY-MM-DD' calendar date
 * @param {number} [openHour=DEFAULT_OPEN_HOUR] - College opening hour (08:00 default)
 * @param {number} [closeHour=DEFAULT_CLOSE_HOUR] - College closing hour (20:00 default)
 * @param {number} [slotMinutes=SLOT_MINUTES] - Duration per slot in minutes (30 default)
 * @param {string} [timezone=DEFAULT_TIMEZONE] - 'Asia/Kolkata' default
 * @returns {Array<{
 *   startTime: string,
 *   endTime: string,
 *   localStartTime: string,
 *   localEndTime: string,
 *   date: string
 * }>}
 */
export function generateSlots(
  dateStr,
  openHour = DEFAULT_OPEN_HOUR,
  closeHour = DEFAULT_CLOSE_HOUR,
  slotMinutes = SLOT_MINUTES,
  timezone = DEFAULT_TIMEZONE
) {
  validateDateString(dateStr);

  if (
    typeof openHour !== 'number' ||
    typeof closeHour !== 'number' ||
    openHour < 0 ||
    closeHour > 24 ||
    openHour >= closeHour
  ) {
    throw new ValidationError(
      `Invalid operating hours: openHour (${openHour}) must be less than closeHour (${closeHour})`
    );
  }

  if (typeof slotMinutes !== 'number' || slotMinutes <= 0 || 60 % slotMinutes !== 0) {
    throw new ValidationError(
      `Invalid slotMinutes (${slotMinutes}): must be a positive divisor of 60`
    );
  }

  const slots = [];
  const startMinuteTotal = openHour * 60;
  const endMinuteTotal = closeHour * 60;

  for (let m = startMinuteTotal; m < endMinuteTotal; m += slotMinutes) {
    const slotStartM = m;
    const slotEndM = m + slotMinutes;

    const startH = Math.floor(slotStartM / 60);
    const startMin = slotStartM % 60;
    const endH = Math.floor(slotEndM / 60);
    const endMin = slotEndM % 60;

    const localStartTime = `${pad(startH)}:${pad(startMin)}`;
    const localEndTime = `${pad(endH)}:${pad(endMin)}`;

    const startUtc = localTimeToUtc(dateStr, startH, startMin, timezone);
    const endUtc = localTimeToUtc(dateStr, endH, endMin, timezone);

    slots.push({
      startTime: startUtc.toISOString(),
      endTime: endUtc.toISOString(),
      localStartTime,
      localEndTime,
      date: dateStr,
    });
  }

  return slots;
}
