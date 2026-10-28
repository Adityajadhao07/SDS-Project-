import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { venueIdParamSchema } from '../validators/venueValidators.js';
import { z } from 'zod';

const router = Router();

const updateBookingSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

const createVenueSchema = z.object({
  name: z.string().min(1),
  building: z.string().min(1),
  capacity: z.number().int().positive(),
  type: z.enum(['classroom', 'auditorium', 'lab', 'seminar_hall', 'conference_room']),
  facilities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateVenueSchema = createVenueSchema.partial();

router.use(authenticate, requireRole('admin'));

router.get('/bookings', (req, res, next) => adminController.getBookings(req, res, next));
router.patch(
  '/bookings/:id',
  validate({ body: updateBookingSchema }),
  (req, res, next) => adminController.updateBooking(req, res, next)
);
router.post('/venues', validate({ body: createVenueSchema }), (req, res, next) =>
  adminController.createVenue(req, res, next)
);
router.patch(
  '/venues/:id',
  validate({ params: venueIdParamSchema, body: updateVenueSchema }),
  (req, res, next) => adminController.updateVenue(req, res, next)
);

export default router;
