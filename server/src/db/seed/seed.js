import path from 'path';
import { fileURLToPath } from 'url';
import { closePool } from '../pool.js';
import { seedVenues } from './seedVenues.js';
import { seedUsers } from './seedUsers.js';

const __filename = fileURLToPath(import.meta.url);

export async function seedAll() {
  console.log('--- Starting Database Seeding ---');
  await seedVenues();
  await seedUsers();
  console.log('--- Database Seeding Completed Successfully ---');
}

// Execute directly if run via CLI
const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  seedAll()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Master seed runner failed:', err);
      await closePool();
      process.exit(1);
    });
}
