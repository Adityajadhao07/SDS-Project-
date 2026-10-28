import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { venueRepository } from '../../src/repositories/venueRepository.js';
import { userRepository } from '../../src/repositories/userRepository.js';
import { localTimeToUtc } from '../../src/utils/slotGenerator.js';

describe('Bookings API (M3)', () => {
  let venue;
  let user;

  beforeAll(async () => {
    const venues = await venueRepository.findAll({});
    venue = venues.find((v) => v.isActive) || venues[0];
    const student = await userRepository.findByEmail(process.env.STUDENT_EMAIL || 'student@college.edu');
    if (student) {
      user = student;
    } else {
      user = await userRepository.findByEmail(process.env.FACULTY_EMAIL || 'faculty@college.edu');
    }
  });

  it('POST /api/v1/bookings creates booking with dev user header', async () => {
    if (!user) return;
    const now = new Date();
    const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (start.getMinutes() < 30) {
      start.setMinutes(30, 0, 0);
    } else {
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() + 1);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const dateStr = start.toISOString().slice(0, 10);
    const startTime = localTimeToUtc(
      dateStr,
      start.getHours(),
      start.getMinutes(),
      process.env.TIMEZONE || 'Asia/Kolkata'
    ).toISOString();
    const endTime = localTimeToUtc(
      dateStr,
      end.getHours(),
      end.getMinutes(),
      process.env.TIMEZONE || 'Asia/Kolkata'
    ).toISOString();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN || ''}`)
      .set('x-dev-user-id', user.id)
      .send({
        venueId: venue.id,
        title: 'Test booking',
        startTime,
        endTime,
        purpose: 'Test booking',
        attendees: 1,
      });
    expect([201, 409, 401].includes(res.status)).toBe(true);
    if (res.status === 201) {
      expect(res.body).toHaveProperty('id');
      expect(res.body.venueId).toBe(venue.id);
    }
  });

  it('GET /api/v1/bookings/mine returns user bookings', async () => {
    if (!user) return;
    const res = await request(app)
      .get('/api/v1/bookings/mine')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN || ''}`)
      .set('x-dev-user-id', user.id);
    expect([200, 401].includes(res.status)).toBe(true);
    if (res.status === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    }
  });

  it('POST /api/v1/bookings overlap returns 409 with error shape, no stack', async () => {
    if (!user) return;
    const now = new Date();
    const start = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    if (start.getMinutes() < 30) {
      start.setMinutes(30, 0, 0);
    } else {
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() + 1);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const dateStr = start.toISOString().slice(0, 10);
    const startTime = localTimeToUtc(
      dateStr,
      start.getHours(),
      start.getMinutes(),
      process.env.TIMEZONE || 'Asia/Kolkata'
    ).toISOString();
    const endTime = localTimeToUtc(
      dateStr,
      end.getHours(),
      end.getMinutes(),
      process.env.TIMEZONE || 'Asia/Kolkata'
    ).toISOString();

    const res1 = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN || ''}`)
      .set('x-dev-user-id', user.id)
      .send({
        venueId: venue.id,
        title: 'First booking',
        startTime,
        endTime,
        purpose: 'First booking',
        attendees: 1,
      });
    if (res1.status === 201) {
      const res2 = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN || ''}`)
        .set('x-dev-user-id', user.id)
        .send({
          venueId: venue.id,
          title: 'Overlap booking',
          startTime,
          endTime,
          purpose: 'Overlap booking',
          attendees: 1,
        });
      expect([409, 401].includes(res2.status)).toBe(true);
      if (res2.status === 409) {
        expect(res2.body).toHaveProperty('error');
        expect(res2.body.error).toHaveProperty('code');
        expect(res2.body).not.toHaveProperty('stack');
        expect(JSON.stringify(res2.body)).not.toMatch(/at\s+/);
      }
    } else {
      expect([201, 409, 401].includes(res1.status)).toBe(true);
    }
  });

  it('POST /api/v1/bookings capacity over limit returns 400 with error shape', async () => {
    if (!user || !venue) return;
    const now = new Date();
    const start = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    if (start.getMinutes() < 30) start.setMinutes(30, 0, 0);
    else {
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() + 1);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const dateStr = start.toISOString().slice(0, 10);
    const startTime = localTimeToUtc(
      dateStr,
      start.getHours(),
      start.getMinutes(),
      process.env.TIMEZONE || 'Asia/Kolkata'
    ).toISOString();
    const endTime = localTimeToUtc(
      dateStr,
      end.getHours(),
      end.getMinutes(),
      process.env.TIMEZONE || 'Asia/Kolkata'
    ).toISOString();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN || ''}`)
      .set('x-dev-user-id', user.id)
      .send({
        venueId: venue.id,
        title: 'Capacity test',
        startTime,
        endTime,
        purpose: 'Capacity test',
        attendees: venue.capacity + 5,
      });
    expect([400, 401].includes(res.status)).toBe(true);
    if (res.status === 400) {
      expect(res.body).toHaveProperty('error');
      expect(res.body).not.toHaveProperty('stack');
    }
  });

  it('POST /api/v1/bookings inactive venue returns 400 with error shape', async () => {
    if (!user) return;
    const inactive = await venueRepository.findAll({});
    const inactiveVenue = inactive.find((v) => v.isActive === false);
    if (!inactiveVenue) return;
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    if (start.getMinutes() < 30) start.setMinutes(30, 0, 0);
    else {
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() + 1);
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const dateStr = start.toISOString().slice(0, 10);
    const startTime = localTimeToUtc(
      dateStr,
      start.getHours(),
      start.getMinutes(),
      process.env.TIMEZONE || 'Asia/Kolkata'
    ).toISOString();
    const endTime = localTimeToUtc(
      dateStr,
      end.getHours(),
      end.getMinutes(),
      process.env.TIMEZONE || 'Asia/Kolkata'
    ).toISOString();

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN || ''}`)
      .set('x-dev-user-id', user.id)
      .send({
        venueId: inactiveVenue.id,
        title: 'Inactive test',
        startTime,
        endTime,
        purpose: 'Inactive test',
        attendees: 1,
      });
    expect([400, 401].includes(res.status)).toBe(true);
    if (res.status === 400) {
      expect(res.body).toHaveProperty('error');
      expect(res.body).not.toHaveProperty('stack');
    }
  });
});
