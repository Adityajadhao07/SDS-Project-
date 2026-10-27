# API contract the frontend expects

Frontend files live in `public/`. Serve them from your Express app:

```js
app.use(express.json());
app.use(express.static('public'));   // before or after your /api routes
```

`server.js` in this folder already implements these endpoints.

```sql
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venueId INTEGER NOT NULL REFERENCES classrooms(id),
  date TEXT NOT NULL,          -- YYYY-MM-DD
  startTime TEXT NOT NULL,     -- HH:MM (24h)
  endTime TEXT NOT NULL,       -- HH:MM
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  attendees INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'approved', -- pending | approved | rejected
  reviewedAt TEXT,
  reviewedBy TEXT
);
```

## Endpoints

| Method | Path | Returns |
|---|---|---|
| GET | `/api/venues` | `[{ id, name, capacity, type, soundSystem, projector }]` (rows of `classrooms`) |
| GET | `/api/bookings?date=YYYY-MM-DD` | `[{ id, venueId, date, startTime, endTime, status }]` for occupied slots (pending and approved) |
| GET | `/api/bookings?email=a@b.com` | Signed-in user's bookings, including `status`, `reviewedAt`, and `reviewedBy`; the session determines whose bookings are returned |
| POST | `/api/bookings` | body `{ venueId, date, startTime, endTime, name, email, attendees, purpose }` -> created booking with `status: "pending"`; pending slots are held |
| GET | `/api/admin/bookings` | Administrator only; full review queue and decision history |
| PATCH | `/api/admin/bookings/:id` | Administrator only; body `{ status: "approved" | "rejected", note?: "..." }` |
| DELETE | `/api/bookings/:id?email=a@b.com` | `{ ok: true }` (only if the email matches the booking) |

## Errors

Return JSON `{ "error": "message the user can read" }` with a status code.
Use **409** for a time clash or an already-reviewed request, 400 for bad input, 404 if not found, and 403 when the signed-in user lacks the administrator role.
Re-check overlap on the server: `startTime < existing.endTime AND endTime > existing.startTime`.

## Notes

- `soundSystem` / `projector` can be 0/1 or true/false.
- If `/api/venues` fails, the frontend runs in **demo mode** (reads `public/data/venues.json`, stores bookings in localStorage). To point at another host, set `window.VBS_API_BASE = 'https://host/api'` before `js/api.js`.
- Booking hours are 8 am to 8 pm in 30 minute steps. Change `START`/`END` in `js/common.js` to adjust.
