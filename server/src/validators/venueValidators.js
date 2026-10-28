import { z } from 'zod';

export const venueIdParamSchema = z.object({
  id: z.string().uuid('Invalid venue ID: must be a valid UUID'),
});

export const listVenuesQuerySchema = z.object({
  type: z
    .enum(['classroom', 'auditorium', 'lab', 'seminar_hall', 'conference_room'])
    .optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  facility: z.string().trim().min(1).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date query parameter must be in YYYY-MM-DD format'),
});

export const calendarQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Month query parameter must be in YYYY-MM format (e.g. 2026-10)'),
});
