import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, closePool } from '../pool.js';
import { mapVenueRecord } from './venueMapper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VENUES_JSON_PATH = path.resolve(__dirname, '../../../../venues.json');

export async function seedVenues() {
  console.log(`Reading venues seed data from ${VENUES_JSON_PATH}...`);
  const rawData = await fs.readFile(VENUES_JSON_PATH, 'utf-8');
  const rawVenues = JSON.parse(rawData);

  if (!Array.isArray(rawVenues)) {
    throw new Error('venues.json must contain an array of venue objects');
  }

  const venues = rawVenues.map(mapVenueRecord);
  console.log(`Transformed ${venues.length} venues. Seeding database...`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertSql = `
      INSERT INTO venues (name, capacity, type, building, facilities, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (name) DO UPDATE SET
        capacity = EXCLUDED.capacity,
        type = EXCLUDED.type,
        building = EXCLUDED.building,
        facilities = EXCLUDED.facilities,
        is_active = EXCLUDED.is_active,
        updated_at = NOW();
    `;

    for (const venue of venues) {
      await client.query(insertSql, [
        venue.name,
        venue.capacity,
        venue.type,
        venue.building,
        venue.facilities,
        venue.isActive,
      ]);
    }

    await client.query('COMMIT');
    console.log(`✓ Successfully seeded ${venues.length} venues into the database.`);
    return venues.length;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding venues:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Execute directly if run via CLI
const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  seedVenues()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Venue seed script failed:', err);
      await closePool();
      process.exit(1);
    });
}
