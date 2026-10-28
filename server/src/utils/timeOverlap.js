import { ValidationError } from './errors.js';

/**
 * Normalizes a date input (Date instance, ISO string, or timestamp number)
 * into a valid millisecond epoch timestamp.
 *
 * @param {Date | string | number} value
 * @param {string} paramName
 * @returns {number}
 * @throws {ValidationError}
 */
function toTimestamp(value, paramName) {
  if (value === null || value === undefined) {
    throw new ValidationError(`Invalid timestamp: ${paramName} is required`);
  }

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  if (Number.isNaN(time)) {
    throw new ValidationError(`Invalid timestamp format for ${paramName}`);
  }

  return time;
}

/**
 * Determines whether two half-open time intervals [startA, endA) and [startB, endB) overlap.
 *
 * Boundary rules:
 * - Back-to-back ranges do not overlap: endA === startB or endB === startA => false.
 * - Any overlap strictly greater than zero milliseconds => true.
 *
 * @param {Date | string | number} startA
 * @param {Date | string | number} endA
 * @param {Date | string | number} startB
 * @param {Date | string | number} endB
 * @returns {boolean} true if intervals overlap, false otherwise
 * @throws {ValidationError} if any date is invalid or if end <= start for either interval
 */
export function rangesOverlap(startA, endA, startB, endB) {
  const sA = toTimestamp(startA, 'startA');
  const eA = toTimestamp(endA, 'endA');
  const sB = toTimestamp(startB, 'startB');
  const eB = toTimestamp(endB, 'endB');

  if (eA <= sA) {
    throw new ValidationError('Interval A end time must be strictly after start time');
  }

  if (eB <= sB) {
    throw new ValidationError('Interval B end time must be strictly after start time');
  }

  // Half-open interval overlap condition: [sA, eA) overlaps with [sB, eB)
  return sA < eB && eA > sB;
}
