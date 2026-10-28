import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, _next) {
  // Handle known AppErrors
  if (err instanceof AppError) {
    const response = {
      error: {
        code: err.code,
        message: err.message,
      },
    };
    if (err.details) {
      response.error.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        details,
      },
    });
  }

  // Handle PostgreSQL exclusion constraint violations (code 23P01)
  if (err.code === '23P01') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'The requested time slot conflicts with an existing approved booking.',
      },
    });
  }

  // Handle PostgreSQL foreign key violations (code 23503)
  if (err.code === '23503') {
    return res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Referenced entity does not exist.',
      },
    });
  }

  // Handle PostgreSQL unique constraint violations (code 23505)
  if (err.code === '23505') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Resource with these unique fields already exists.',
      },
    });
  }

  // Fallback for unhandled internal errors: never send stack traces
  console.error('Unhandled server error:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}
