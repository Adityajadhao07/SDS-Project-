import { describe, it, expect } from 'vitest';
import { generateSlots } from '../slotGenerator.js';
import { ValidationError } from '../errors.js';

describe('slotGenerator: generateSlots', () => {
  const DATE = '2026-10-29';

  describe('Slot Count and Interval Duration', () => {
    it('generates exactly 24 slots for 08:00 to 20:00 operating hours', () => {
      const slots = generateSlots(DATE);
      expect(slots).toHaveLength(24);
    });

    it('ensures each slot has a duration of exactly 30 minutes', () => {
      const slots = generateSlots(DATE);
      for (const slot of slots) {
        const start = new Date(slot.startTime).getTime();
        const end = new Date(slot.endTime).getTime();
        expect(end - start).toBe(30 * 60 * 1000);
      }
    });

    it('ensures all slots are strictly contiguous without gaps or overlaps', () => {
      const slots = generateSlots(DATE);
      for (let i = 0; i < slots.length - 1; i++) {
        expect(slots[i].endTime).toBe(slots[i + 1].startTime);
      }
    });
  });

  describe('Timezone and UTC Alignment (Asia/Kolkata -> UTC)', () => {
    it('correctly maps first slot (08:00 IST -> 02:30 UTC)', () => {
      const slots = generateSlots(DATE);
      const firstSlot = slots[0];

      expect(firstSlot.localStartTime).toBe('08:00');
      expect(firstSlot.localEndTime).toBe('08:30');
      expect(firstSlot.startTime).toBe('2026-10-29T02:30:00.000Z');
      expect(firstSlot.endTime).toBe('2026-10-29T03:00:00.000Z');
      expect(firstSlot.date).toBe(DATE);
    });

    it('correctly maps last slot (19:30-20:00 IST -> 14:00-14:30 UTC)', () => {
      const slots = generateSlots(DATE);
      const lastSlot = slots[slots.length - 1];

      expect(lastSlot.localStartTime).toBe('19:30');
      expect(lastSlot.localEndTime).toBe('20:00');
      expect(lastSlot.startTime).toBe('2026-10-29T14:00:00.000Z');
      expect(lastSlot.endTime).toBe('2026-10-29T14:30:00.000Z');
      expect(lastSlot.date).toBe(DATE);
    });

    it('ensures all slots align to :00 and :30 in local time', () => {
      const slots = generateSlots(DATE);
      for (const slot of slots) {
        const startMin = Number(slot.localStartTime.split(':')[1]);
        const endMin = Number(slot.localEndTime.split(':')[1]);

        expect([0, 30]).toContain(startMin);
        expect([0, 30]).toContain(endMin);
      }
    });
  });

  describe('Custom Hours and Parameters', () => {
    it('supports custom openHour and closeHour (e.g. 10:00 to 14:00)', () => {
      const slots = generateSlots(DATE, 10, 14, 30);
      expect(slots).toHaveLength(8); // 4 hours * 2 slots/hr
      expect(slots[0].localStartTime).toBe('10:00');
      expect(slots[slots.length - 1].localEndTime).toBe('14:00');
    });

    it('supports 15-minute slots if configured', () => {
      const slots = generateSlots(DATE, 9, 10, 15);
      expect(slots).toHaveLength(4);
      expect(slots[0].localStartTime).toBe('09:00');
      expect(slots[0].localEndTime).toBe('09:15');
    });
  });

  describe('Validation Errors', () => {
    it('throws ValidationError for invalid date format', () => {
      expect(() => generateSlots('2026/10/29')).toThrow(ValidationError);
      expect(() => generateSlots('not-a-date')).toThrow(ValidationError);
    });

    it('throws ValidationError for non-existent calendar date', () => {
      expect(() => generateSlots('2026-02-30')).toThrow(ValidationError);
      expect(() => generateSlots('2026-13-01')).toThrow(ValidationError);
    });

    it('throws ValidationError when openHour >= closeHour', () => {
      expect(() => generateSlots(DATE, 20, 8)).toThrow(ValidationError);
      expect(() => generateSlots(DATE, 10, 10)).toThrow(ValidationError);
    });

    it('throws ValidationError for invalid slot duration', () => {
      expect(() => generateSlots(DATE, 8, 20, 0)).toThrow(ValidationError);
      expect(() => generateSlots(DATE, 8, 20, 45)).toThrow(ValidationError); // not a divisor of 60
    });
  });
});
