# Project: Venue Booking System

## Goal
A production-grade venue booking platform for a college. Users browse venues, see availability on a calendar, and book slots. Admins approve or reject requests. Two approved bookings for the same venue must never overlap.

## Stack
- Frontend: React (Vite), Tailwind CSS, React Router, FullCalendar
- Backend: Node.js 20+, Express
- Database: PostgreSQL (Supabase), accessed with the `pg` driver and parameterized queries only
- Validation: Zod
- Auth: JWT (HS256) and bcrypt (cost 12)
- Tests: Vitest, Supertest, React Testing Library
- Lint and format: ESLint and Prettier in both apps

## Repo structure
- client/ is the React app
- server/ is the Express API
- docs/ holds CLASSES.md and the design docs
- venues.json at the repo root is the seed source for venues. Never invent venues.

## Architecture rules
- Server layers: routes -> controllers -> services -> repositories
- Routes map URLs and attach middleware only
- Controllers parse and validate input, call services, and shape responses. No business logic.
- Services hold all business rules
- Repositories are the only code that runs SQL
- Pure logic (overlap, slot generation, rule checks) lives in server/src/utils/ with no I/O
- Business rules live in the backend, never only in the frontend

## Time rules
- Store all times as timestamptz in UTC
- Operating hours: 08:00 to 20:00 Asia/Kolkata (from env)
- Slots are 30 minutes, aligned to :00 and :30
- Booking duration: 30 minutes to 4 hours
- Booking must start at least 1 hour from now and no more than 60 days ahead
- Frontend converts to Asia/Kolkata only for display

## Booking rules
- A booking is pending or approved and blocks its slots
- Overlap check: new.start < existing.end AND new.end > existing.start, for the same venue, against pending and approved bookings
- Back-to-back bookings are allowed
- Faculty bookings are auto-approved only when FACULTY_AUTO_APPROVE=true
- Only pending bookings can be approved or rejected
- Approval runs in a transaction. The database exclusion constraint is the final guard, and a violation returns 409.
- Users cancel their own pending or approved bookings more than 2 hours before start. Admins can cancel any booking.
- Attendees must not exceed venue capacity. Inactive venues cannot be booked.

## Roles
- student: browse, book, view and cancel own bookings
- faculty: same as student, with optional auto-approve
- admin: all of the above, plus approve, reject, create and edit venues, view all bookings

## API (prefix /api/v1)
- POST /auth/register, POST /auth/login, GET /auth/me
- GET /venues (filters: type, minCapacity, facility, date)
- GET /venues/:id
- GET /venues/:id/availability?date=YYYY-MM-DD
- GET /venues/:id/calendar?month=YYYY-MM
- POST /venues, PATCH /venues/:id (admin)
- POST /bookings, GET /bookings/mine, PATCH /bookings/:id/cancel
- GET /admin/bookings?status=, PATCH /admin/bookings/:id (admin)
- GET /health

Errors use the shape { "error": { "code", "message", "details?" } } with 400, 401, 403, 404, 409, or 500. Never send stack traces.

## Calendar (required feature)
- Venue detail page has two tabs: "Calendar" and "Book by form"
- Day view: 30-minute time grid showing each slot as free, pending, approved, or mine
- Month view: per day, the number of free slots and whether the day is full
- Click or drag across free slots to select a range, which opens the booking dialog prefilled with venue, date, start, and end
- Clicking a day in the month view opens that day in the day view
- The frontend never decides availability. It renders what the API returns.
- Use FullCalendar (@fullcalendar/react, timegrid, daygrid, interaction)

## Frontend rules
- Routes: public (login, register), protected (venues, my bookings), admin (admin bookings, admin venues)
- Auth state in a React context. Token in localStorage only for the auth token.
- One API client module in client/src/api/ wraps fetch and reads VITE_API_URL
- Every data view has loading, empty, and error states
- Semantic HTML, labels on inputs, keyboard navigation, visible focus, responsive layout

## Code quality
- Meaningful names. Small functions. No duplicated logic (DRY). Shared helpers in utils/.
- Named constants instead of magic numbers (for example SLOT_MINUTES = 30)
- No emojis in code, comments, or commit messages
- Comments explain why, not what
- All config through environment variables. No hardcoded URLs, secrets, or credentials.
- Provide .env.example in both client/ and server/. Never commit real .env files.

## Testing (written with the code)
- Unit tests: overlap detection, slot generation, duration and advance rules. Include boundary cases: back-to-back allowed, one-minute overlap rejected.
- API tests: auth, venue listing, booking success, overlap 409, capacity 400, approval flow, student gets 403 on admin routes
- Concurrency test: two simultaneous approvals of overlapping bookings, only one succeeds
- Frontend tests: availability grid and booking dialog
- npm test runs everything

## Git rules
- Never commit to main. Work on feat/, fix/, chore/, test/, or docs/ branches.
- Commit format: <type>: <present-tense description>. Types: feat, fix, chore, test, docs, refactor.
- Small commits, one logical change each.
- Never commit secrets.
- Keep README and docs updated in the same commit as the code they describe.

## Documentation
- README.md: overview, features, stack with reasons, setup, env variables, tests, seeding, deployment
- docs/HLD.md, docs/LLD.md, docs/API.md, docs/DATABASE.md, docs/DECISIONS.md

## Milestones (build in order, each working and tested before the next)
- M0: Scaffolds, lint, env, database connection
- M1: Schema with exclusion constraint, seed from venues.json
- M2: Overlap, slot, and booking rules with unit tests
- M3: Venue and booking APIs with API tests
- M4: Frontend login, venue list, venue detail with Book by form
- M5: Calendar tab, range selection, booking dialog
- M6: JWT roles, admin approvals, admin venues, concurrency test
- M7: Cancellation, polish, rate limiting, CI with GitHub Actions, deployment, docs

## Before saying a task is done
- Lint and tests pass
- No secrets in the repo, .env.example complete
- README and docs match the code
- App runs from a fresh clone by following only the README