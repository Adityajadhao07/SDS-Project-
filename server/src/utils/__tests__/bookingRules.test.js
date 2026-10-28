import { describe, it, expect } from 'vitest';
import {
  validateDuration,
  validateAdvanceWindow,
  validateSlotAlignment,
  validateOperatingHours,
  validateCapacity,
} from '../bookingRules.js';
import { ValidationError } from '../errors.js';

describe('bookingRules Unit Tests', () => {
  describe('validateDuration', () => {
    it('allows duration at lower limit (exactly 30 minutes)', () => {
      const start = '2026-10-29T10:00:00.000Z';
      const end = '2026-10-29T10:30:00.000Z';
      expect(validateDuration(start, end)).toBe(30);
    });

    it('allows duration at upper limit (exactly 240 minutes / 4 hours)', () => {
      const start = '2026-10-29T10:00:00.000Z';
      const end = '2026-10-29T14:00:00.000Z';
      expect(validateDuration(start, end)).toBe(240);
    });

    it('allows valid intermediate durations (60, 90, 180 minutes)', () => {
      expect(validateDuration('2026-10-29T10:00:00.000Z', '2026-10-29T11:00:00.000Z')).toBe(60);
      expect(validateDuration('2026-10-29T10:00:00.000Z', '2026-10-29T11:30:00.000Z')).toBe(90);
      expect(validateDuration('2026-10-29T10:00:00.000Z', '2026-10-29T13:00:00.000Z')).toBe(180);
    });

    it('rejects duration below 30 minutes (29 minutes)', () => {
      const start = '2026-10-29T10:00:00.000Z';
      const end = '2026-10-29T10:29:00.000Z';
      expect(() => validateDuration(start, end)).toThrow(ValidationError);
      expect(() => validateDuration(start, end)).toThrow(/at least 30 minutes/i);
    });

    it('rejects duration above 4 hours (241 minutes / 4 hours 1 minute)', () => {
      const start = '2026-10-29T10:00:00.000Z';
      const end = '2026-10-29T14:01:00.000Z';
      expect(() => validateDuration(start, end)).toThrow(ValidationError);
      expect(() => validateDuration(start, end)).toThrow(/cannot exceed 240 minutes/i);
    });

    it('rejects zero or inverted duration where end <= start', () => {
      const time = '2026-10-29T10:00:00.000Z';
      expect(() => validateDuration(time, time)).toThrow(ValidationError);
      expect(() =>
        validateDuration('2026-10-29T11:00:00.000Z', '2026-10-29T10:00:00.000Z')
      ).toThrow(ValidationError);
    });
  });

  describe('validateAdvanceWindow (deterministic with injected now)', () => {
    // Fixed base time for deterministic testing
    const NOW = new Date('2026-10-29T12:00:00.000Z');

    it('allows booking at the exact lower advance limit (now + 1 hour)', () => {
      const start = new Date(NOW.getTime() + 60 * 60 * 1000); // exactly +1 hour
      expect(validateAdvanceWindow(start, NOW)).toBe(true);
    });

    it('allows bookings scheduled comfortably in advance (+2 hours, +30 days)', () => {
      const plusTwoHours = new Date(NOW.getTime() + 2 * 60 * 60 * 1000);
      const plusThirtyDays = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000);

      expect(validateAdvanceWindow(plusTwoHours, NOW)).toBe(true);
      expect(validateAdvanceWindow(plusThirtyDays, NOW)).toBe(true);
    });

    it('rejects booking starting under 1 hour from now (now + 59 minutes)', () => {
      const start = new Date(NOW.getTime() + 59 * 60 * 1000);
      expect(() => validateAdvanceWindow(start, NOW)).toThrow(ValidationError);
      expect(() => validateAdvanceWindow(start, NOW)).toThrow(/at least 1 hour/i);
    });

    it('rejects booking starting in the past', () => {
      const past = new Date(NOW.getTime() - 5 * 60 * 1000);
      expect(() => validateAdvanceWindow(past, NOW)).toThrow(ValidationError);
      expect(() => validateAdvanceWindow(past, NOW)).toThrow(/cannot be in the past/i);
    });

    it('allows booking at the exact upper advance limit (now + 60 days)', () => {
      const maxLimit = new Date(NOW.getTime() + 60 * 24 * 60 * 60 * 1000);
      expect(validateAdvanceWindow(maxLimit, NOW)).toBe(true);
    });

    it('rejects booking beyond 60 days in advance (now + 60 days + 1 minute)', () => {
      const overLimit = new Date(NOW.getTime() + 60 * 24 * 60 * 60 * 1000 + 60 * 1000);
      expect(() => validateAdvanceWindow(overLimit, NOW)).toThrow(ValidationError);
      expect(() => validateAdvanceWindow(overLimit, NOW)).toThrow(/more than 60 days/i);
    });
  });

  describe('validateSlotAlignment', () => {
    it('allows slots aligned to :00 and :30 boundaries', () => {
      expect(validateSlotAlignment('2026-10-29T10:00:00.000Z', '2026-10-29T10:30:00.000Z')).toBe(
        true
      );
      expect(validateSlotAlignment('2026-10-29T10:30:00.000Z', '2026-10-29T11:00:00.000Z')).toBe(
        true
      );
      expect(validateSlotAlignment('2026-10-29T10:30:00.000Z', '2026-10-29T12:30:00.000Z')).toBe(
        true
      );
    });

    it('rejects misaligned start times (:15, :45, :05)', () => {
      expect(() =>
        validateSlotAlignment('2026-10-29T10:15:00.000Z', '2026-10-29T11:00:00.000Z')
      ).toThrow(ValidationError);
      expect(() =>
        validateSlotAlignment('2026-10-29T10:45:00.000Z', '2026-10-29T11:30:00.000Z')
      ).toThrow(ValidationError);
      expect(() =>
        validateSlotAlignment('2026-10-29T10:05:00.000Z', '2026-10-29T11:00:00.000Z')
      ).toThrow(ValidationError);
    });

    it('rejects misaligned end times (:15, :45, :59)', () => {
      expect(() =>
        validateSlotAlignment('2026-10-29T10:00:00.000Z', '2026-10-29T10:45:00.000Z')
      ).toThrow(ValidationError);
      expect(() =>
        validateSlotAlignment('2026-10-29T10:00:00.000Z', '2026-10-29T10:59:00.000Z')
      ).toThrow(ValidationError);
    });

    it('rejects non-zero seconds or milliseconds', () => {
      expect(() =>
        validateSlotAlignment('2026-10-29T10:00:05.000Z', '2026-10-29T10:30:00.000Z')
      ).toThrow(ValidationError);
      expect(() =>
        validateSlotAlignment('2026-10-29T10:00:00.500Z', '2026-10-29T10:30:00.000Z')
      ).toThrow(ValidationError);
    });
  });

  describe('validateOperatingHours (08:00 to 20:00 Asia/Kolkata)', () => {
    // 08:00 IST = 02:30 UTC
    // 20:00 IST = 14:30 UTC

    it('allows booking strictly within operating hours (08:00 to 10:00 IST)', () => {
      const start = '2026-10-29T02:30:00.000Z'; // 08:00 IST
      const end = '2026-10-29T04:30:00.000Z'; // 10:00 IST
      expect(validateOperatingHours(start, end)).toBe(true);
    });

    it('allows booking starting exactly at opening hour (08:00 IST)', () => {
      const start = '2026-10-29T02:30:00.000Z'; // 08:00 IST
      const end = '2026-10-29T03:00:00.000Z'; // 08:30 IST
      expect(validateOperatingHours(start, end)).toBe(true);
    });

    it('allows booking ending exactly at closing hour (20:00 IST)', () => {
      const start = '2026-10-29T14:00:00.000Z'; // 19:30 IST
      const end = '2026-10-29T14:30:00.000Z'; // 20:00 IST
      expect(validateOperatingHours(start, end)).toBe(true);
    });

    it('rejects booking starting before opening hour (07:30 IST)', () => {
      const start = '2026-10-29T02:00:00.000Z'; // 07:30 IST
      const end = '2026-10-29T03:00:00.000Z'; // 08:30 IST
      expect(() => validateOperatingHours(start, end)).toThrow(ValidationError);
      expect(() => validateOperatingHours(start, end)).toThrow(
        /cannot start before operating opening hour/i
      );
    });

    it('rejects booking ending after closing hour (20:30 IST)', () => {
      const start = '2026-10-29T14:00:00.000Z'; // 19:30 IST
      const end = '2026-10-29T15:00:00.000Z'; // 20:30 IST
      expect(() => validateOperatingHours(start, end)).toThrow(ValidationError);
      expect(() => validateOperatingHours(start, end)).toThrow(
        /cannot end after operating closing hour/i
      );
    });

    it('rejects booking spanning across midnight / multiple days', () => {
      const start = '2026-10-29T14:00:00.000Z'; // 19:30 IST
      const end = '2026-10-30T03:00:00.000Z'; // next day
      expect(() => validateOperatingHours(start, end)).toThrow(ValidationError);
      expect(() => validateOperatingHours(start, end)).toThrow(/cannot span across multiple/i);
    });
  });

  describe('validateCapacity', () => {
    it('allows attendee count equal to venue capacity', () => {
      expect(validateCapacity(100, 100)).toBe(true);
    });

    it('allows attendee count less than venue capacity', () => {
      expect(validateCapacity(50, 100)).toBe(true);
      expect(validateCapacity(1, 100)).toBe(true);
    });

    it('rejects attendee count one over the limit (capacity + 1)', () => {
      expect(() => validateCapacity(101, 100)).toThrow(ValidationError);
      expect(() => validateCapacity(101, 100)).toThrow(/exceeds maximum venue capacity/i);
    });

    it('rejects attendee count of zero', () => {
      expect(() => validateCapacity(0, 100)).toThrow(ValidationError);
      expect(() => validateCapacity(0, 100)).toThrow(/positive integer greater than zero/i);
    });

    it('rejects negative attendee count', () => {
      expect(() => validateCapacity(-10, 100)).toThrow(ValidationError);
      expect(() => validateCapacity(-1, 100)).toThrow(ValidationError);
    });

    it('rejects non-integer attendee count', () => {
      expect(() => validateCapacity(10.5, 100)).toThrow(ValidationError);
      expect(() => validateCapacity('50', 100)).toThrow(ValidationError);
    });
  });
});
