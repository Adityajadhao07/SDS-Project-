/**
 * Pure mapping functions for transforming venues.json raw records into
 * the database schema format. No database or network I/O.
 */

/**
 * Derives the building name based on venue name convention.
 * @param {string} name - e.g. "NC01", "SC12", "Main Auditorium"
 * @returns {string} - "North Complex", "South Complex", or "Auditorium Complex"
 */
export function deriveBuilding(name) {
  if (typeof name !== 'string') {
    throw new Error('Venue name must be a string');
  }

  const trimmed = name.trim();

  if (trimmed.startsWith('NC')) {
    return 'North Complex';
  }

  if (trimmed.startsWith('SC')) {
    return 'South Complex';
  }

  if (trimmed.toLowerCase().includes('auditorium')) {
    return 'Auditorium Complex';
  }

  return 'General Campus';
}

/**
 * Derives facilities array from raw boolean/integer flags.
 * @param {Object} rawVenue
 * @param {number} [rawVenue.soundSystem]
 * @param {number} [rawVenue.projector]
 * @returns {string[]}
 */
export function deriveFacilities(rawVenue) {
  const facilities = [];

  if (rawVenue.soundSystem === 1) {
    facilities.push('sound system');
  }

  if (rawVenue.projector === 1) {
    facilities.push('projector');
  }

  return facilities;
}

/**
 * Maps a single raw record from venues.json to the database schema shape.
 * @param {Object} rawVenue
 * @returns {Object} { name, capacity, type, building, facilities, isActive }
 */
export function mapVenueRecord(rawVenue) {
  if (!rawVenue || typeof rawVenue !== 'object') {
    throw new Error('Invalid venue record: record must be an object');
  }

  if (!rawVenue.name || typeof rawVenue.name !== 'string') {
    throw new Error('Invalid venue record: name is required');
  }

  if (typeof rawVenue.capacity !== 'number' || rawVenue.capacity <= 0) {
    throw new Error(`Invalid capacity for venue ${rawVenue.name}: must be a positive number`);
  }

  if (!rawVenue.type || typeof rawVenue.type !== 'string') {
    throw new Error(`Invalid type for venue ${rawVenue.name}`);
  }

  return {
    name: rawVenue.name.trim(),
    capacity: rawVenue.capacity,
    type: rawVenue.type.trim().toLowerCase(),
    building: deriveBuilding(rawVenue.name),
    facilities: deriveFacilities(rawVenue),
    isActive: true,
  };
}
