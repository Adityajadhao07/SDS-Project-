import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, closePool } from '../pool.js';
import { env } from '../../config/env.js';
import { BCRYPT_SALT_ROUNDS, ROLES } from '../../config/constants.js';

const __filename = fileURLToPath(import.meta.url);

export async function seedUsers() {
  console.log('Seeding initial users (admin and samples)...');

  const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);
  const facultyPasswordHash = await bcrypt.hash(env.FACULTY_PASSWORD, BCRYPT_SALT_ROUNDS);
  const studentPasswordHash = await bcrypt.hash(env.STUDENT_PASSWORD, BCRYPT_SALT_ROUNDS);

  const initialUsers = [
    {
      email: env.ADMIN_EMAIL,
      name: 'Campus Administrator',
      passwordHash: adminPasswordHash,
      role: ROLES.ADMIN,
    },
    {
      email: env.FACULTY_EMAIL,
      name: 'Prof. Alan Turing',
      passwordHash: facultyPasswordHash,
      role: ROLES.FACULTY,
    },
    {
      email: env.STUDENT_EMAIL,
      name: 'Ada Lovelace',
      passwordHash: studentPasswordHash,
      role: ROLES.STUDENT,
    },
  ];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const insertSql = `
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW();
    `;

    for (const u of initialUsers) {
      await client.query(insertSql, [u.email, u.passwordHash, u.name, u.role]);
      console.log(`✓ Seeded user: ${u.email} (${u.role})`);
    }

    await client.query('COMMIT');
    console.log(`✓ Successfully seeded ${initialUsers.length} users.`);
    return initialUsers.length;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding users:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Execute directly if run via CLI
const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
  seedUsers()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('User seed script failed:', err);
      await closePool();
      process.exit(1);
    });
}
