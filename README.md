# Venue Booking System

A production-grade venue booking platform for a college. Users browse venues, see availability on a calendar, and book slots. Admins approve or reject requests. Two approved bookings for the same venue must never overlap.

## Features
- Browse venues with filters
- Calendar view with day/month views
- Book slots (30 min - 4 hours)
- Admin approval workflow
- Role-based access control
- Cancellation with time rules

## Stack
- Frontend: React (Vite), Tailwind CSS, React Router, FullCalendar
- Backend: Node.js 20+, Express
- Database: PostgreSQL, accessed with `pg` driver
- Validation: Zod
- Auth: JWT (HS256), bcrypt
- Tests: Vitest, Supertest, React Testing Library

## Setup from a fresh clone

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation
```bash
npm install
```

### Environment Variables

#### Server (`server/.env`)
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/venue_booking
JWT_SECRET=your-secret-key-min-16-chars
JWT_EXPIRES_IN=7d
TIMEZONE=Asia/Kolkata
FACULTY_AUTO_APPROVE=false
ADMIN_EMAIL=admin@college.edu
ADMIN_PASSWORD=change-me-to-a-strong-password
```

#### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:4000/api/v1
```

### Database Setup
```bash
cd server
npm run db:migrate
npm run db:seed
```

### Create Admin Account
Run the seed script which creates admin from env variables, or use the registration API.

### Running Tests
```bash
npm test
```

### Running Development Servers
```bash
npm run dev
```

## Deployment

### Server (Render)
See `server/render.yaml` for configuration. Set environment variables in Render dashboard.

### Client (Vercel)
See `client/vercel.json` for configuration. Set `VITE_API_URL` in Vercel environment variables.

### Supabase Setup
1. Create a PostgreSQL database on Supabase
2. Set `DATABASE_URL` in server environment variables
3. Run migrations: `npm run db:migrate`
4. Run seed: `npm run db:seed`
