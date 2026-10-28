# API Documentation

Base URL: `/api/v1`

## Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login
- GET `/auth/me` - Get current user (requires auth)

## Venues
- GET `/venues` - List venues (filters: type, minCapacity, facility, date)
- GET `/venues/:id` - Get venue details
- GET `/venues/:id/availability?date=YYYY-MM-DD` - Get availability
- GET `/venues/:id/calendar?month=YYYY-MM` - Get month summary
- POST `/venues` - Create venue (admin only)
- PATCH `/venues/:id` - Update venue (admin only)

## Bookings
- POST `/bookings` - Create booking (requires auth)
- GET `/bookings/mine` - Get user's bookings (requires auth)
- PATCH `/bookings/:id/cancel` - Cancel booking (owner or admin)

## Admin
- GET `/admin/bookings?status=` - List all bookings (admin only)
- PATCH `/admin/bookings/:id` - Approve or reject booking (admin only). Body: `{ action: "approve" | "reject", reason? }`
- POST `/venues` - Create venue (admin only)
- PATCH `/venues/:id` - Update venue (admin only)

## Errors
All errors follow: `{ "error": { "code", "message", "details?" } }`
Status codes: 400, 401, 403, 404, 409, 500
