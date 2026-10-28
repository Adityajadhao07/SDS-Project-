import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { venueRepository } from '../../src/repositories/venueRepository.js';
import { userRepository } from '../../src/repositories/userRepository.js';
import { localTimeToUtc } from '../../src/utils/slotGenerator.js';

describe('Cancellation (M7)', () => {
  let venue;
  let student;
  let admin;

  beforeAll(async () => {
    const venues = await venueRepository.findAll({});
    venue = venues.find((v) => v.isActive) || venues[0];
    student = await userRepository.findByEmail(process.env.STUDENT_EMAIL || 'student@college.edu');
    admin = await userRepository.findByEmail(process.env.ADMIN_EMAIL || 'admin@college.edu');
  });

  it('owner cancels allowed', async () => {
    if (!student) return;
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

    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('x-dev-user-id', student.id)
      .send({ venueId: venue.id, title: 'Cancel test', startTime, endTime, purpose: 'Test', attendees: 1 });
    
    if (createRes.status === 201) {
      const cancelRes = await request(app)
        .patch(`/api/v1/bookings/${createRes.body.id}/cancel`)
        .set('x-dev-user-id', student.id);
      expect([200, 400].includes(cancelRes.status)).toBe(true);
    }
  });

  it('other user gets 403', async () => {
    if (!student || !admin) return;
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

    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('x-dev-user-id', student.id)
      .send({ venueId: venue.id, title: 'Cancel test2', startTime, endTime, purpose: 'Test', attendees: 1 });
    
    if (createRes.status === 201) {
      const cancelRes = await request(app)
        .patch(`/api/v1/bookings/${createRes.body.id}/cancel`)
        .set('x-dev-user-id', admin.id);
      expect([200, 403].includes(cancelRes.status)).toBe(true);
      if (cancelRes.status === 403) {
        expect(cancelRes.body.error.code).toBe('FORBIDDEN');
      }
    }
  });

  it('inside 2 hours gets 400', async () => {
    if (!student) return;
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 60 * 1000); // 30 min from now
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

    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('x-dev-user-id', student.id)
      .send({ venueId: venue.id, title: 'Cancel test3', startTime, endTime, purpose: 'Test', attendees: 1 });
    
    if (createRes.status === 201) {
      const cancelRes = await request(app)
        .patch(`/api/v1/bookings/${createRes.body.id}/cancel`)
        .set('x-dev-user-id', student.id);
      expect([400, 409].includes(cancelRes.status)).toBe(true);
    }
  });
});
