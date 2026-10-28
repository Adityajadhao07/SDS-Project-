# Classes and Modules

## Server (server/src)

### Utils (pure, no I/O)
- utils/timeOverlap.js: rangesOverlap(startA, endA, startB, endB)
- utils/slotGenerator.js: generateSlots(date, openHour, closeHour, slotMinutes)
- utils/bookingRules.js: validateDuration(), validateAdvanceWindow(), validateCapacity()
- utils/errors.js: ValidationError, NotFoundError, ConflictError, ForbiddenError, UnauthorizedError

### Repositories (only these run SQL)
- UserRepository: create, findByEmail, findById
- VenueRepository: findAll(filters), findById, create, update
- BookingRepository: create, findOverlapping(venueId, start, end), findInRange(venueId, fromUtc, toUtc), findByUser, findByStatus, updateStatus

### Services
- AuthService: register, login, getCurrentUser
- VenueService: listVenues, getVenue, createVenue, updateVenue, getAvailability(venueId, date), getMonthSummary(venueId, year, month) returns [{date, freeSlots, totalSlots, status}]
- BookingService: createBooking, cancelBooking, approveBooking, rejectBooking

### Controllers
- AuthController, VenueController, BookingController, AdminController

### Middleware
- authenticate.js: verifies JWT, attaches user
- requireRole.js: requireRole('admin')
- validate.js: runs a Zod schema
- errorHandler.js: converts errors to the error shape

### Routes
- authRoutes.js, venueRoutes.js (includes /calendar), bookingRoutes.js, adminRoutes.js

### Database
- db/pool.js: Postgres pool from DATABASE_URL
- db/migrations/001_init.sql: btree_gist extension, users, venues, bookings tables, exclusion constraint on approved bookings, index on (venue_id, start_time)
- db/seed/seedVenues.js: reads venues.json and inserts venues
- db/seed/seedUsers.js: creates admin and sample users from env variables

### Seed mapping (venues.json to venues table)
- name -> name
- capacity -> capacity
- type, lowercased, "Classroom" -> "classroom" (add other types to the check constraint if the file has them)
- soundSystem === 1 adds "sound system" to facilities
- projector === 1 adds "projector" to facilities
- building derived from the name prefix (NC, SC), documented in README
- Seed users never come from venues.json

## Client (client/src)

### API layer
- api/client.js: fetch wrapper using VITE_API_URL, throws typed errors
- api/auth.js, api/venues.js, api/bookings.js

### Pages
- LoginPage, RegisterPage, VenueListPage, VenueDetailPage (tabs: Calendar, Book by form), MyBookingsPage, AdminBookingsPage, AdminVenuesPage

### Components
- CalendarView.jsx: FullCalendar wrapper with day and month views
- BookingDialog.jsx: confirms and submits a booking from a selected range
- SlotLegend.jsx: colour key for free, pending, approved, mine
- AvailabilityGrid.jsx: slot list for the Book by form tab
- VenueCard.jsx, Navbar.jsx, ProtectedRoute.jsx