// Venue Booking System: web server + API.
// Run with:  npm start   (then open http://localhost:3000)

const path = require('path');
const fs = require('fs');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const session = require('express-session');
const bcrypt = require('bcryptjs');

// ---------- optional .env file (no extra package needed) ----------
// Put lines like GMAIL_USER=you@gmail.com in a file named ".env" next to this file.
try {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
} catch (err) {
  console.warn('Could not read .env:', err.message);
}

const PORT = process.env.PORT || 3000;
const OPEN_MIN = 8 * 60;   // bookings allowed from 8 am
const CLOSE_MIN = 20 * 60; // until 8 pm

// ---------- database ----------
const db = new sqlite3.Database(path.join(__dirname, 'venues.db'));
const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
});
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

// Runs one booking check+insert at a time, so two people cannot take the same slot.
let lockChain = Promise.resolve();
const withLock = (fn) => {
  const result = lockChain.then(fn);
  lockChain = result.catch(() => {});
  return result;
};

async function setupDatabase() {
  await run(`CREATE TABLE IF NOT EXISTS classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, capacity INTEGER, type TEXT,
    soundSystem INTEGER NOT NULL DEFAULT 0,
    projector INTEGER NOT NULL DEFAULT 0
  )`);
  await run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venueId INTEGER NOT NULL REFERENCES classrooms(id),
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    attendees INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  await run('CREATE INDEX IF NOT EXISTS idx_bookings_day ON bookings(venueId, date)');
  const bookingColumns = await all('PRAGMA table_info(bookings)');
  if (!bookingColumns.some((column) => column.name === 'status')) {
    await run("ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'");
  }
  if (!bookingColumns.some((column) => column.name === 'reviewedAt')) {
    await run('ALTER TABLE bookings ADD COLUMN reviewedAt TEXT');
  }
  if (!bookingColumns.some((column) => column.name === 'reviewedBy')) {
    await run('ALTER TABLE bookings ADD COLUMN reviewedBy TEXT');
  }
  await run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student','faculty','admin')),
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  const { n } = await get('SELECT COUNT(*) AS n FROM classrooms');
  if (n === 0) console.warn('The classrooms table is empty. Run:  npm run import');

  // Provision configured administrator accounts. Admin accounts cannot be
  // created through public registration. ADMIN_USERNAME remains supported.
  const adminUsernames = String(process.env.ADMIN_USERNAMES || process.env.ADMIN_USERNAME || '')
    .split(',').map((username) => username.trim()).filter(Boolean);
  if (adminUsernames.length && process.env.ADMIN_PASSWORD) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    for (const username of adminUsernames) {
      const exists = await get('SELECT id, role FROM users WHERE username = ? COLLATE NOCASE', [username]);
      if (exists) {
        if (exists.role !== 'admin') console.warn(`Configured admin username "${username}" belongs to a non-admin account. Choose an unused username.`);
        continue;
      }
      const email = adminUsernames.length === 1 && process.env.ADMIN_EMAIL
        ? process.env.ADMIN_EMAIL
        : `${username.toLowerCase()}@localhost`;
      try {
        await run('INSERT INTO users (username, email, passwordHash, role) VALUES (?,?,?,?)',
          [username, email, passwordHash, 'admin']);
        console.log(`Administrator account provisioned: ${username}`);
      } catch (err) {
        if (err.message.includes('UNIQUE constraint failed: users.email')) {
          console.warn(`Could not provision admin "${username}": generated email ${email} is already in use.`);
        } else throw err;
      }
    }
  } else {
    console.warn('No administrator configured. Set ADMIN_USERNAMES (or ADMIN_USERNAME) and ADMIN_PASSWORD to enable approval access.');
  }
}

// ---------- email (optional) ----------
// Gmail: set GMAIL_USER and GMAIL_APP_PASSWORD in .env. Without them, emails are skipped.
let mailer = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
    mailer.verify()
    .then(() => console.log('Email is ready to send.'))
    .catch((err) => console.error('Email login failed:', err.message));
}


const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const to12 = (t) => {
  const min = toMin(t); const h = Math.floor(min / 60), m = min % 60;
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h >= 12 ? 'pm' : 'am'}`;
};

async function sendBookingUpdate(b, status, note = '') {
  if (!mailer) { console.log(`[email skipped] ${b.email}: ${b.venueName} on ${b.date}`); return; }
  const approved = status === 'approved';
  try {
    await mailer.sendMail({
      from: `"Venue Booking" <${process.env.GMAIL_USER}>`,
      to: b.email,
      subject: approved ? `Booking approved: ${b.venueName} on ${b.date}` : `Booking update: ${b.venueName} on ${b.date}`,
      text:
`Hi ${b.name},

Your booking request has been ${approved ? 'approved' : status === 'rejected' ? 'declined' : 'received and is awaiting administrator approval'}.

Venue: ${b.venueName}
Date: ${b.date}
Time: ${to12(b.startTime)} to ${to12(b.endTime)}
People: ${b.attendees}
Purpose: ${b.purpose}
${note ? `Administrator note: ${note}\n` : ''}
To view the latest status, open "My bookings" on the website.`,
    });
  } catch (err) {
    console.error('Could not send email:', err.message);
  }
}

// ---------- app ----------
const app = express();
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-later',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // stay logged in 8 hours
}));
app.use(express.static(path.join(__dirname, 'public')));

const bad = (res, status, error) => res.status(status).json({ error });
// Guard: blocks anyone who is not logged in
const requireLogin = (req, res, next) => {
  if (!req.session.user) return bad(res, 401, 'Please log in first.');
  next();
};
const requireAdmin = (req, res, next) => {
  if (!req.session.user) return bad(res, 401, 'Please log in first.');
  if (req.session.user.role !== 'admin') return bad(res, 403, 'Administrator access is required.');
  next();
};
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// ---------- register / login ----------
app.post('/api/register', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const email = String(req.body.email || '').trim();
  const password = String(req.body.password || '');
  const role = req.body.role;

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return bad(res, 400, 'Username must be 3-20 letters, numbers or underscores.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad(res, 400, 'Enter a valid email address.');
  if (password.length < 8) return bad(res, 400, 'Password must be at least 8 characters.');

  // Only student or faculty can register here. Admin is NOT allowed.
  if (!['student', 'faculty'].includes(role)) return bad(res, 400, 'Choose student or faculty.');

  // Faculty must know one of the configured secret codes, so students cannot just pick "faculty".
  const facultyCodes = String(process.env.FACULTY_CODES || process.env.FACULTY_CODE || '')
    .split(',').map((code) => code.trim()).filter(Boolean);
  if (role === 'faculty' && !facultyCodes.includes(String(req.body.facultyCode || '').trim())) {
    return bad(res, 403, 'Wrong faculty code.');
  }

  const exists = await get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (exists) return bad(res, 409, 'That username or email is already registered.');

  const passwordHash = await bcrypt.hash(password, 10);
  await run('INSERT INTO users (username, email, passwordHash, role) VALUES (?,?,?,?)',
    [username, email, passwordHash, role]);
  res.status(201).json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const username = String((req.body && req.body.username) || '').trim();
  const password = String((req.body && req.body.password) || '');
  const user = await get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return bad(res, 401, 'Wrong username or password.');
  }
  req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
  res.json(req.session.user);
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return bad(res, 401, 'Not logged in.');
  res.json(req.session.user);
});
// All venues
app.get('/api/venues', requireLogin, async (req, res) => {
  res.json(await all('SELECT id, name, capacity, type, soundSystem, projector FROM classrooms ORDER BY id'));
});

// Bookings: ?date=YYYY-MM-DD (occupied slots) or ?email=... (the signed-in user's bookings)
app.get('/api/bookings', requireLogin, async (req, res) => {
  const { date, email } = req.query;
  if (date) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return bad(res, 400, 'Date must look like 2026-10-24.');
    return res.json(await all(
      "SELECT id, venueId, date, startTime, endTime, status FROM bookings WHERE date = ? AND status IN ('pending','approved')", [date]));
  }
  if (email) {
    return res.json(await all(
      `SELECT b.id, b.venueId, c.name AS venueName, b.date, b.startTime, b.endTime, b.purpose, b.attendees,
              b.status, b.reviewedAt, b.reviewedBy
         FROM bookings b JOIN classrooms c ON c.id = b.venueId
        WHERE lower(b.email) = lower(?)
        ORDER BY b.date, b.startTime`, [req.session.user.email]));
  }
  bad(res, 400, 'Send either ?date=YYYY-MM-DD or ?email=you@example.com.');
});

// New booking
app.post('/api/bookings', requireLogin, async (req, res) => {
  const b = req.body || {};
  const venueId = Number(b.venueId);
  const name = req.session.user.username;
  const email = req.session.user.email;
  const purpose = String(b.purpose || '').trim();
  const attendees = Number(b.attendees);
  const { date, startTime, endTime } = b;

  if (!Number.isInteger(venueId)) return bad(res, 400, 'Choose a venue.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return bad(res, 400, 'Choose a valid date.');
  if (!/^\d{2}:\d{2}$/.test(startTime || '') || !/^\d{2}:\d{2}$/.test(endTime || '')) return bad(res, 400, 'Choose a valid start and end time.');
  const s = toMin(startTime), e = toMin(endTime);
  if (e <= s) return bad(res, 400, 'The end time must be after the start time.');
  if (s < OPEN_MIN || e > CLOSE_MIN) return bad(res, 400, 'Bookings are possible between 8 am and 8 pm.');
  if (date < todayStr()) return bad(res, 400, 'That date has already passed.');
  if (date === todayStr()) {
    const now = new Date();
    if (s < now.getHours() * 60 + now.getMinutes()) return bad(res, 400, 'That start time has already passed.');
  }
  if (!name) return bad(res, 400, 'Enter your name.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad(res, 400, 'Enter a valid email address.');
  if (!purpose) return bad(res, 400, 'Say what the booking is for.');
  if (!Number.isInteger(attendees) || attendees < 1) return bad(res, 400, 'Enter how many people will attend.');

  const venue = await get('SELECT * FROM classrooms WHERE id = ?', [venueId]);
  if (!venue) return bad(res, 404, 'That venue does not exist.');
  if (attendees > venue.capacity) return bad(res, 400, `${venue.name} seats ${venue.capacity}. Reduce the number of people or choose a bigger room.`);

  // Check for a clash and insert in one go so two people cannot grab the same slot.
  const outcome = await withLock(async () => {
    const clash = await get(
      "SELECT startTime, endTime FROM bookings WHERE venueId = ? AND date = ? AND status IN ('pending','approved') AND ? < endTime AND ? > startTime",
      [venueId, date, startTime, endTime]);
    if (clash) return { clash };
    const r = await run(
      "INSERT INTO bookings (venueId, date, startTime, endTime, name, email, attendees, purpose, status) VALUES (?,?,?,?,?,?,?,?, 'pending')",
      [venueId, date, startTime, endTime, name, email, attendees, purpose]);
    return { id: r.lastID };
  });
  if (outcome.clash) {
    return bad(res, 409, `${venue.name} is already booked from ${to12(outcome.clash.startTime)} to ${to12(outcome.clash.endTime)}. Pick another time.`);
  }
  const id = outcome.id;

  const saved = { id, venueId, venueName: venue.name, date, startTime, endTime, name, email, attendees, purpose, status: 'pending' };
  sendBookingUpdate(saved, 'pending'); // runs in the background
  res.status(201).json(saved);
});

// Administrator review queue and status changes.
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  const rows = await all(
    `SELECT b.id, b.venueId, c.name AS venueName, b.date, b.startTime, b.endTime,
            b.name, b.email, b.attendees, b.purpose, b.status, b.createdAt, b.reviewedAt, b.reviewedBy
       FROM bookings b JOIN classrooms c ON c.id = b.venueId
      ORDER BY CASE b.status WHEN 'pending' THEN 0 ELSE 1 END, b.date, b.startTime`);
  res.json(rows);
});

app.patch('/api/admin/bookings/:id', requireAdmin, async (req, res) => {
  const status = req.body && req.body.status;
  const note = String((req.body && req.body.note) || '').trim().slice(0, 500);
  if (!['approved', 'rejected'].includes(status)) return bad(res, 400, 'Choose approve or decline.');
  const row = await get(
    `SELECT b.*, c.name AS venueName FROM bookings b JOIN classrooms c ON c.id = b.venueId WHERE b.id = ?`,
    [req.params.id]);
  if (!row) return bad(res, 404, 'Booking request not found.');
  if (row.status !== 'pending') return bad(res, 409, 'This request has already been reviewed.');
  if (status === 'approved') {
    const clash = await get(
      "SELECT id FROM bookings WHERE venueId = ? AND date = ? AND id <> ? AND status = 'approved' AND ? < endTime AND ? > startTime",
      [row.venueId, row.date, row.id, row.startTime, row.endTime]);
    if (clash) return bad(res, 409, 'This time now conflicts with another approved booking. Decline this request or contact the student.');
  }
  const update = await run('UPDATE bookings SET status = ?, reviewedAt = CURRENT_TIMESTAMP, reviewedBy = ? WHERE id = ? AND status = ?',
    [status, req.session.user.username, row.id, 'pending']);
  if (!update.changes) return bad(res, 409, 'This request has already been reviewed. Refresh the page.');
  sendBookingUpdate(row, status, note);
  res.json({ ok: true, id: row.id, status, reviewedAt: new Date().toISOString(), reviewedBy: req.session.user.username });
});

app.delete('/api/bookings/:id', requireLogin, async (req, res) => {
  const user = req.session.user;
  // Admin can cancel any booking. Others only their own.
  const row = user.role === 'admin'
    ? await get('SELECT id FROM bookings WHERE id = ?', [req.params.id])
    : await get('SELECT id FROM bookings WHERE id = ? AND lower(email) = lower(?)',
      [req.params.id, user.email]);
  if (!row) return bad(res, 404, 'Booking not found.');
  await run('DELETE FROM bookings WHERE id = ?', [row.id]);
  res.json({ ok: true });
});

// Anything else under /api
app.use('/api', (req, res) => bad(res, 404, 'Unknown API address.'));

// Errors: show a plain message, log the details
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  bad(res, 500, 'Something went wrong on the server. Try again.');
});

setupDatabase()
  .then(() => app.listen(PORT, () => console.log(`Website is running: http://localhost:${PORT}`)))
  .catch((err) => { console.error('Could not start:', err.message); process.exit(1); });
