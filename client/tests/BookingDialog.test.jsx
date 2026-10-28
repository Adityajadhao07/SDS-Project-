import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookingDialog from '../src/components/BookingDialog.jsx';
import * as bookingsApi from '../src/api/bookings.js';

vi.mock('../src/api/bookings.js', () => ({
  createBooking: vi.fn(),
}));

describe('BookingDialog', () => {
  it('has Submit button labelled Book, Title required, shows 409, success closes dialog', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const error = new Error('Conflict');
    error.errorBody = { error: { code: 'CONFLICT', message: 'The requested time slot conflicts with an existing booking' } };
    bookingsApi.createBooking.mockRejectedValueOnce(error);

    render(
      <BookingDialog
        isOpen={true}
        onClose={onClose}
        venueId="123e4567-e89b-12d3-a456-426614174000"
        venueName="Test Venue"
        date="2026-12-01"
        startTime="2026-12-01T08:00:00.000Z"
        endTime="2026-12-01T09:00:00.000Z"
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByRole('button', { name: /book/i })).toBeInTheDocument();
    const titleInput = screen.getByLabelText(/title/i);
    expect(titleInput).toBeRequired();

    // Try to submit without title - should show error
    fireEvent.click(screen.getByRole('button', { name: /book/i }));
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    expect(bookingsApi.createBooking).not.toHaveBeenCalled();

    fireEvent.change(titleInput, { target: { value: 'Meeting' } });
    fireEvent.change(screen.getByLabelText(/purpose/i), { target: { value: 'Meeting' } });
    fireEvent.change(screen.getByLabelText(/attendees/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /book/i }));

    await waitFor(() => {
      expect(screen.getByText(/conflicts with an existing booking/i)).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();

    bookingsApi.createBooking.mockResolvedValueOnce({ id: '1' });
    fireEvent.click(screen.getByRole('button', { name: /book/i }));
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
