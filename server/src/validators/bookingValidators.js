import { z } from 'zod';

export const createBookingBodySchema = z.object({
  venueId: z.string().uuid('Invalid venue ID: must be a valid UUID'),
  title: z.string().trim().min(1, 'Title is required').max(255, 'Title cannot exceed 255 characters'),
  startTime: z.string().min(1, 'startTime is required'),
  endTime: z.string().min(1, 'endTime is required'),
  purpose: z
    .string()
    .trim()
    .min(3, 'Purpose must be at least 3 characters long')
    .max(255, 'Purpose cannot exceed 255 characters'),
  attendees: z.number().int().positive('Attendees must be a positive integer greater than zero'),
});

export const bookingIdParamSchema = z.object({
  id: z.string().uuid('Invalid booking ID: must be a valid UUID'),
});
