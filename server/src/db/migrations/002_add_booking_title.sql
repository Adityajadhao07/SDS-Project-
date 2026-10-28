ALTER TABLE bookings ADD COLUMN title text NOT NULL DEFAULT 'Untitled booking';
ALTER TABLE bookings ALTER COLUMN title DROP DEFAULT;
