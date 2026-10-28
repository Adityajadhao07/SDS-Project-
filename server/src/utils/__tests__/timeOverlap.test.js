import { describe, it, expect } from 'vitest';
import { rangesOverlap } from '../timeOverlap.js';
import { ValidationError } from '../errors.js';

describe('timeOverlap: rangesOverlap', () => {
  const t = (iso) => new Date(iso);

  describe('Disjoint and Non-Overlapping Intervals', () => {
    it('allows back-to-back intervals where A ends exactly when B starts', () => {
      const startA = t('2026-10-29T10:00:00.000Z');
      const endA = t('2026-10-29T11:00:00.000Z');
      const startB = t('2026-10-29T11:00:00.000Z');
      const endB = t('2026-10-29T12:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(false);
    });

    it('allows back-to-back intervals in reverse order (B ends when A starts)', () => {
      const startA = t('2026-10-29T11:00:00.000Z');
      const endA = t('2026-10-29T12:00:00.000Z');
      const startB = t('2026-10-29T10:00:00.000Z');
      const endB = t('2026-10-29T11:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(false);
    });

    it('returns false for disjoint intervals separated by a time gap', () => {
      const startA = t('2026-10-29T09:00:00.000Z');
      const endA = t('2026-10-29T10:00:00.000Z');
      const startB = t('2026-10-29T12:00:00.000Z');
      const endB = t('2026-10-29T13:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(false);
    });
  });

  describe('Overlapping Intervals', () => {
    it('detects a one-minute overlap at the trailing boundary', () => {
      const startA = t('2026-10-29T10:00:00.000Z');
      const endA = t('2026-10-29T11:01:00.000Z'); // 1 minute past B start
      const startB = t('2026-10-29T11:00:00.000Z');
      const endB = t('2026-10-29T12:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it('detects a one-minute overlap at the leading boundary', () => {
      const startA = t('2026-10-29T10:00:00.000Z');
      const endA = t('2026-10-29T11:00:00.000Z');
      const startB = t('2026-10-29T10:59:00.000Z'); // 1 minute before A end
      const endB = t('2026-10-29T12:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it('detects identical overlapping intervals', () => {
      const startA = t('2026-10-29T10:00:00.000Z');
      const endA = t('2026-10-29T11:00:00.000Z');
      const startB = t('2026-10-29T10:00:00.000Z');
      const endB = t('2026-10-29T11:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it('detects fully contained interval when A contains B', () => {
      const startA = t('2026-10-29T10:00:00.000Z');
      const endA = t('2026-10-29T13:00:00.000Z');
      const startB = t('2026-10-29T11:00:00.000Z');
      const endB = t('2026-10-29T12:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it('detects fully contained interval when B contains A', () => {
      const startA = t('2026-10-29T11:00:00.000Z');
      const endA = t('2026-10-29T12:00:00.000Z');
      const startB = t('2026-10-29T10:00:00.000Z');
      const endB = t('2026-10-29T13:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
    });

    it('detects 1 millisecond minimal overlap', () => {
      const startA = t('2026-10-29T10:00:00.000Z');
      const endA = new Date(t('2026-10-29T11:00:00.000Z').getTime() + 1);
      const startB = t('2026-10-29T11:00:00.000Z');
      const endB = t('2026-10-29T12:00:00.000Z');

      expect(rangesOverlap(startA, endA, startB, endB)).toBe(true);
    });
  });

  describe('Input Types and Polymorphism', () => {
    it('accepts ISO date strings', () => {
      expect(
        rangesOverlap(
          '2026-10-29T10:00:00.000Z',
          '2026-10-29T11:00:00.000Z',
          '2026-10-29T10:30:00.000Z',
          '2026-10-29T11:30:00.000Z'
        )
      ).toBe(true);
    });

    it('accepts numeric timestamps', () => {
      const base = Date.now();
      expect(rangesOverlap(base, base + 3600000, base + 1800000, base + 5400000)).toBe(true);
      expect(rangesOverlap(base, base + 3600000, base + 3600000, base + 7200000)).toBe(false);
    });
  });

  describe('Validation Errors', () => {
    it('throws ValidationError when interval A end <= start', () => {
      const startA = t('2026-10-29T11:00:00.000Z');
      const endA = t('2026-10-29T10:00:00.000Z');
      const startB = t('2026-10-29T12:00:00.000Z');
      const endB = t('2026-10-29T13:00:00.000Z');

      expect(() => rangesOverlap(startA, endA, startB, endB)).toThrow(ValidationError);
    });

    it('throws ValidationError when interval B end <= start', () => {
      const startA = t('2026-10-29T10:00:00.000Z');
      const endA = t('2026-10-29T11:00:00.000Z');
      const startB = t('2026-10-29T13:00:00.000Z');
      const endB = t('2026-10-29T13:00:00.000Z'); // zero duration

      expect(() => rangesOverlap(startA, endA, startB, endB)).toThrow(ValidationError);
    });

    it('throws ValidationError on invalid date string', () => {
      expect(() =>
        rangesOverlap(
          'invalid-date',
          '2026-10-29T11:00:00.000Z',
          '2026-10-29T11:00:00.000Z',
          '2026-10-29T12:00:00.000Z'
        )
      ).toThrow(ValidationError);
    });

    it('throws ValidationError on null or undefined', () => {
      expect(() =>
        rangesOverlap(
          null,
          '2026-10-29T11:00:00.000Z',
          '2026-10-29T11:00:00.000Z',
          '2026-10-29T12:00:00.000Z'
        )
      ).toThrow(ValidationError);
    });
  });
});
