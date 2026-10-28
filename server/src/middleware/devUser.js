import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { userRepository } from '../repositories/userRepository.js';

/**
 * Temporary auth stand-in for development and testing.
 * TODO: Milestone 6 replaces this stand-in with JWT authenticate middleware.
 * Do NOT use in production.
 */
export async function devUser(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return next(new ForbiddenError('Dev authentication is forbidden in production environment'));
  }

  const devUserId = req.headers['x-dev-user-id'] || req.query.devUserId;

  if (devUserId) {
    try {
      const user = await userRepository.findById(devUserId);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      return next(err);
    }
  }

  next();
}

/**
 * Guard that enforces authentication via devUser for protected endpoints in development.
 * TODO: Milestone 6 replaces this stand-in with JWT authenticate middleware.
 */
export async function requireDevUser(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return next(new ForbiddenError('Dev authentication is forbidden in production environment'));
  }

  const devUserId = req.headers['x-dev-user-id'] || req.query.devUserId;

  if (!devUserId) {
    return next(new UnauthorizedError('Authentication required. Missing X-Dev-User-Id header'));
  }

  try {
    const user = await userRepository.findById(devUserId);
    if (!user) {
      return next(new UnauthorizedError(`Dev user with ID ${devUserId} not found`));
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
