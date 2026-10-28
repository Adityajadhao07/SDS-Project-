export const SLOT_MINUTES = 30;
export const DEFAULT_OPEN_HOUR = 8; // 08:00
export const DEFAULT_CLOSE_HOUR = 20; // 20:00
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export const MIN_BOOKING_MINUTES = 30;
export const MAX_BOOKING_MINUTES = 240; // 4 hours

export const MIN_ADVANCE_HOURS = 1; // at least 1 hour in advance
export const MAX_ADVANCE_DAYS = 60; // no more than 60 days ahead

export const CANCEL_LEAD_HOURS = 2; // user can cancel > 2 hours before start

export const BCRYPT_SALT_ROUNDS = 12;

export const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const SLOT_STATUS = {
  FREE: 'free',
  PENDING: 'pending',
  APPROVED: 'approved',
  MINE: 'mine',
};
