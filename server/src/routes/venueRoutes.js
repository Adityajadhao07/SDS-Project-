import { Router } from 'express';
import { venueController } from '../controllers/venueController.js';
import { validate } from '../middleware/validate.js';
import {
  availabilityQuerySchema,
  calendarQuerySchema,
  listVenuesQuerySchema,
  venueIdParamSchema,
} from '../validators/venueValidators.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { z } from 'zod';

const router = Router();

const createVenueSchema = z.object({
  name: z.string().min(1),
  building: z.string().min(1),
  capacity: z.number().int().positive(),
  type: z.enum(['classroom', 'auditorium', 'lab', 'seminar_hall', 'conference_room']),
  facilities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updateVenueSchema = createVenueSchema.partial();

router.get('/', validate({ query: listVenuesQuerySchema }), (req, res, next) =>
  venueController.listVenues(req, res, next)
);

router.get(
  '/:id',
  validate({ params: venueIdParamSchema }),
  (req, res, next) => venueController.getVenue(req, res, next)
);

router.get(
  '/:id/availability',
  validate({ params: venueIdParamSchema, query: availabilityQuerySchema }),
  (req, res, next) => venueController.getAvailability(req, res, next)
);

router.get(
  '/:id/calendar',
  validate({ params: venueIdParamSchema, query: calendarQuerySchema }),
  (req, res, next) => venueController.getCalendar(req, res, next)
);

router.post('/', authenticate, requireRole('admin'), validate({ body: createVenueSchema }), (req, res, next) =>
  venueController.createVenue ? venueController.createVenue(req, res, next) : next()
);
router.patch(
  '/:id',
  authenticate,
  requireRole('admin'),
  validate({ params: venueIdParamSchema, body: updateVenueSchema }),
  (req, res, next) => (venueController.updateVenue ? venueController.updateVenue(req, res, next) : next())
);

export default router;
