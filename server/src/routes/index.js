import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import venueRoutes from './venueRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';

const apiRouter = Router();

apiRouter.use(healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/venues', venueRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/admin', adminRoutes);

export default apiRouter;
