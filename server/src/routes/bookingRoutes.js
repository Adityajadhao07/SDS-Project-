import { Router } from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { validate } from '../middleware/validate.js';
import { createBookingBodySchema } from '../validators/bookingValidators.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate({ body: createBookingBodySchema }),
  (req, res, next) => bookingController.createBooking(req, res, next)
);

router.get(
  '/mine',
  (req, res, next) => bookingController.getMyBookings(req, res, next)
);

router.patch(
  '/:id/cancel',
  (req, res, next) => bookingController.cancelBooking(req, res, next)
);

export default router;
