import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { venueRepository } from '../../src/repositories/venueRepository.js';

describe('Venues API (M3)', () => {
  it('GET /api/v1/venues returns list', async () => {
    const res = await request(app).get('/api/v1/venues');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/venues with filters works (type/classroom, minCapacity)', async () => {
    const res = await request(app).get('/api/v1/venues').query({ type: 'classroom', minCapacity: 10 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // all returned should satisfy filters if present
    for (const v of res.body) {
      if (v.type) expect(v.type).toBe('classroom');
      if (typeof v.capacity === 'number') expect(v.capacity).toBeGreaterThanOrEqual(10);
    }
  });

  it('GET /api/v1/venues/:id returns venue', async () => {
    const venues = await venueRepository.findAll({});
    const venue = venues[0];
    const res = await request(app).get(`/api/v1/venues/${venue.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(venue.id);
  });

  it('GET /api/v1/venues/:id/availability returns slots with date', async () => {
    const venues = await venueRepository.findAll({});
    const venue = venues[0];
    const date = '2026-12-01';
    const res = await request(app).get(`/api/v1/venues/${venue.id}/availability`).query({ date });
    expect(res.status).toBe(200);
    expect(res.body.venueId).toBe(venue.id);
    expect(res.body.date).toBe(date);
    expect(Array.isArray(res.body.slots)).toBe(true);
    expect(res.body.slots.length).toBeGreaterThan(0);
    // each slot has required fields
    for (const s of res.body.slots) {
      expect(s).toHaveProperty('startTime');
      expect(s).toHaveProperty('endTime');
      expect(s).toHaveProperty('status');
    }
  });

  it('GET /api/v1/venues/:id/calendar returns month summary', async () => {
    const venues = await venueRepository.findAll({});
    const venue = venues[0];
    const res = await request(app).get(`/api/v1/venues/${venue.id}/calendar`).query({ month: '2026-12' });
    expect(res.status).toBe(200);
    expect(res.body.venueId).toBe(venue.id);
    expect(res.body.month).toBe('2026-12');
    expect(Array.isArray(res.body.days)).toBe(true);
    expect(res.body.days.length).toBe(31);
    for (const d of res.body.days) {
      expect(d).toHaveProperty('date');
      expect(d).toHaveProperty('freeSlots');
      expect(d).toHaveProperty('totalSlots');
      expect(d).toHaveProperty('status');
    }
  });

  it('GET /api/v1/venues/:id/availability with invalid date returns 400 with error shape, no stack', async () => {
    const venues = await venueRepository.findAll({});
    const venue = venues[0];
    const res = await request(app).get(`/api/v1/venues/${venue.id}/availability`).query({ date: 'bad-date' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body).not.toHaveProperty('stack');
    expect(JSON.stringify(res.body)).not.toMatch(/at\s+/);
  });
});
