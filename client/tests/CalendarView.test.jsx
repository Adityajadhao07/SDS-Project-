import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarView from '../src/components/CalendarView.jsx';
import * as venuesApi from '../src/api/venues.js';
import { AuthProvider } from '../src/context/AuthContext.jsx';

vi.mock('../src/api/venues.js', () => ({
  getVenueCalendar: vi.fn(),
  getVenueAvailability: vi.fn(),
}));

describe('CalendarView', () => {
  it('renders availability data', async () => {
    venuesApi.getVenueCalendar.mockResolvedValue({
      venueId: '123',
      month: '2026-12',
      days: [{ date: '2026-12-01', freeSlots: 10, totalSlots: 20, status: 'partial' }],
    });
    venuesApi.getVenueAvailability.mockResolvedValue({
      venueId: '123',
      date: '2026-12-01',
      slots: [
        { startTime: '2026-12-01T08:00:00.000Z', endTime: '2026-12-01T08:30:00.000Z', status: 'free' },
        { startTime: '2026-12-01T08:30:00.000Z', endTime: '2026-12-01T09:00:00.000Z', status: 'pending' },
        { startTime: '2026-12-01T09:00:00.000Z', endTime: '2026-12-01T09:30:00.000Z', status: 'approved' },
        { startTime: '2026-12-01T09:30:00.000Z', endTime: '2026-12-01T10:00:00.000Z', status: 'approved', isMine: true },
      ],
    });

    render(
      <AuthProvider>
        <CalendarView venueId="123" venueName="Test Venue" />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Legend:')).toBeInTheDocument();
    });
  });
});
