import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapVenueRecord, deriveBuilding, deriveFacilities } from '../../src/db/seed/venueMapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VENUES_JSON_PATH = path.resolve(__dirname, '../../../venues.json');

describe('Seed Mapping Unit Tests (Pure Functions)', () => {
  describe('deriveBuilding', () => {
    it('maps NC prefix to North Complex', () => {
      expect(deriveBuilding('NC01')).toBe('North Complex');
      expect(deriveBuilding('NC30')).toBe('North Complex');
    });

    it('maps SC prefix to South Complex', () => {
      expect(deriveBuilding('SC01')).toBe('South Complex');
      expect(deriveBuilding('SC19')).toBe('South Complex');
    });

    it('maps auditorium names to Auditorium Complex', () => {
      expect(deriveBuilding('Main Auditorium')).toBe('Auditorium Complex');
      expect(deriveBuilding('Mini Auditorium')).toBe('Auditorium Complex');
    });

    it('falls back to General Campus for unclassified venues', () => {
      expect(deriveBuilding('Seminar Room 1')).toBe('General Campus');
    });

    it('throws error on non-string input', () => {
      expect(() => deriveBuilding(null)).toThrow();
      expect(() => deriveBuilding(123)).toThrow();
    });
  });

  describe('deriveFacilities', () => {
    it('returns empty array when neither facility is present', () => {
      expect(deriveFacilities({ soundSystem: 0, projector: 0 })).toEqual([]);
    });

    it('includes sound system when soundSystem is 1', () => {
      expect(deriveFacilities({ soundSystem: 1, projector: 0 })).toEqual(['sound system']);
    });

    it('includes projector when projector is 1', () => {
      expect(deriveFacilities({ soundSystem: 0, projector: 1 })).toEqual(['projector']);
    });

    it('includes both when both flags are 1', () => {
      expect(deriveFacilities({ soundSystem: 1, projector: 1 })).toEqual([
        'sound system',
        'projector',
      ]);
    });
  });

  describe('mapVenueRecord', () => {
    it('transforms NC classroom correctly', () => {
      const raw = {
        name: 'NC01',
        capacity: 100,
        type: 'Classroom',
        soundSystem: 0,
        projector: 1,
      };
      const result = mapVenueRecord(raw);

      expect(result).toEqual({
        name: 'NC01',
        capacity: 100,
        type: 'classroom',
        building: 'North Complex',
        facilities: ['projector'],
        isActive: true,
      });
    });

    it('transforms SC classroom with no equipment correctly', () => {
      const raw = {
        name: 'SC01',
        capacity: 50,
        type: 'Classroom',
        soundSystem: 0,
        projector: 0,
      };
      const result = mapVenueRecord(raw);

      expect(result).toEqual({
        name: 'SC01',
        capacity: 50,
        type: 'classroom',
        building: 'South Complex',
        facilities: [],
        isActive: true,
      });
    });

    it('transforms Auditorium with both facilities correctly', () => {
      const raw = {
        name: 'Main Auditorium',
        capacity: 500,
        type: 'Auditorium',
        soundSystem: 1,
        projector: 1,
      };
      const result = mapVenueRecord(raw);

      expect(result).toEqual({
        name: 'Main Auditorium',
        capacity: 500,
        type: 'auditorium',
        building: 'Auditorium Complex',
        facilities: ['sound system', 'projector'],
        isActive: true,
      });
    });

    it('validates required fields and rejects invalid records', () => {
      expect(() => mapVenueRecord(null)).toThrow('Invalid venue record');
      expect(() => mapVenueRecord({ capacity: 100, type: 'Classroom' })).toThrow(
        'name is required'
      );
      expect(() => mapVenueRecord({ name: 'V1', capacity: 0, type: 'Classroom' })).toThrow(
        'positive number'
      );
      expect(() => mapVenueRecord({ name: 'V1', capacity: -5, type: 'Classroom' })).toThrow(
        'positive number'
      );
      expect(() => mapVenueRecord({ name: 'V1', capacity: 50 })).toThrow('Invalid type');
    });
  });

  describe('Full venues.json Seed Source Validation', () => {
    it('parses and maps all 51 venues from venues.json cleanly without errors', async () => {
      const data = await fs.readFile(VENUES_JSON_PATH, 'utf-8');
      const rawVenues = JSON.parse(data);

      expect(Array.isArray(rawVenues)).toBe(true);
      expect(rawVenues.length).toBe(51);

      const mapped = rawVenues.map(mapVenueRecord);
      expect(mapped.length).toBe(51);

      const names = new Set();
      for (const venue of mapped) {
        expect(names.has(venue.name)).toBe(false);
        names.add(venue.name);

        expect(typeof venue.name).toBe('string');
        expect(venue.capacity).toBeGreaterThan(0);
        expect(['classroom', 'auditorium']).toContain(venue.type);
        expect(['North Complex', 'South Complex', 'Auditorium Complex']).toContain(venue.building);
        expect(Array.isArray(venue.facilities)).toBe(true);
        expect(venue.isActive).toBe(true);
      }

      // Check specific venue expectations
      const mainAud = mapped.find((v) => v.name === 'Main Auditorium');
      expect(mainAud).toBeDefined();
      expect(mainAud.capacity).toBe(500);
      expect(mainAud.building).toBe('Auditorium Complex');
      expect(mainAud.facilities).toContain('sound system');
      expect(mainAud.facilities).toContain('projector');

      const nc14 = mapped.find((v) => v.name === 'NC14');
      expect(nc14).toBeDefined();
      expect(nc14.capacity).toBe(150);
      expect(nc14.building).toBe('North Complex');
    });
  });
});
