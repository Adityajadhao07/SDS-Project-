import dotenv from 'dotenv';
import { z } from 'zod';
import { DEFAULT_TIMEZONE } from './constants.js';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  TIMEZONE: z.string().default(DEFAULT_TIMEZONE),
  FACULTY_AUTO_APPROVE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  ADMIN_EMAIL: z.string().email().default('admin@college.edu'),
  ADMIN_PASSWORD: z.string().min(8),
  FACULTY_EMAIL: z.string().email().default('faculty@college.edu'),
  FACULTY_PASSWORD: z.string().default('FacultyPassword123!'),
  STUDENT_EMAIL: z.string().email().default('student@college.edu'),
  STUDENT_PASSWORD: z.string().default('StudentPassword123!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
  throw new Error(`Environment validation failed: ${issues}`);
}

export const env = parsed.data;
