# Venue Booking System

Book classrooms and auditoriums. Express + SQLite + Nodemailer backend, plain HTML/CSS/JS frontend in `public/`.

## Run it
1. Install Node.js 22 (LTS) from https://nodejs.org
2. Open a terminal in this folder and run `npm install`
3. Run `npm start`
4. Open http://localhost:3000

## Booking approvals and administrator access
Student and faculty bookings are submitted as **Pending** and hold their selected room and time while they are reviewed. An administrator can approve or decline each request from `admin.html`; students can follow the decision from **My bookings**. When Gmail is configured, the requester is emailed when the request is submitted and when its status changes.

Admin accounts cannot be created from the registration page. Configure administrator usernames and their shared password in the server environment before starting the app:

```text
ADMIN_USERNAMES=Aditya_Jadhao,Raunak_Aggrawal,Tanmay_Bihani,Nihal
ADMIN_PASSWORD=use-a-long-unique-password
```

On startup, the server creates each account whose username is not already in the database. Admins get unique local placeholder emails because the app requires unique account emails; they sign in by username. The password is stored as a bcrypt hash. Set these values in your shell or local `.env` file. The older `ADMIN_USERNAME` setting remains supported for a single account. After setup, sign in through `login.html`; administrators are sent to the approval dashboard. Keep `.env` private.

Faculty registration accepts any code in the comma-separated `FACULTY_CODES` setting in `.env`, for example `FACULTY_CODES=code-one,code-two`. The older `FACULTY_CODE` setting is still accepted when `FACULTY_CODES` is not set.

## Reload the room list
`npm run import` replaces the rooms with the contents of `venues.json`. It also deletes nothing else, but bookings point at room ids, so run it before people start booking.

## Confirmation emails (optional)
Add `GMAIL_USER` and `GMAIL_APP_PASSWORD` to the same local `.env` file (Google Account > Security > 2-Step Verification > App passwords). Without these values, email is skipped; students can always see status on **My bookings**.

See `API.md` for the endpoints.
