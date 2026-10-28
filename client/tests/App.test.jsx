import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import Navbar from '../src/components/Navbar.jsx';

vi.mock('../src/api/venues.js', () => ({
  listVenues: vi.fn().mockResolvedValue([]),
  getVenue: vi.fn(),
  getVenueAvailability: vi.fn(),
  getVenueCalendar: vi.fn(),
}));

vi.mock('../src/api/bookings.js', () => ({
  getMyBookings: vi.fn().mockResolvedValue([]),
  createBooking: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders app with navbar', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText('Venue Booking')).toBeInTheDocument();
  });
});

describe('Navbar', () => {
  it('renders without crashing when used inside AuthProvider', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Venue Booking')).toBeInTheDocument();
  });
});
