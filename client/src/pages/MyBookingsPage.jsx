import { useEffect, useState } from 'react';
import { getMyBookings, cancelBooking } from '../api/bookings.js';
import { useAuth } from '../context/useAuth.js';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyBookings();
      setBookings(data || []);
    } catch (err) {
      setError(err?.errorBody?.error?.message || err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const canCancel = (booking) => {
    if (booking.status !== 'pending' && booking.status !== 'approved') return false;
    const startTime = new Date(booking.startTime);
    const now = new Date();
    const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (user?.role === 'admin') return true;
    return hoursUntilStart > 2;
  };

  const handleCancel = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(bookingId);
      fetchBookings();
    } catch (err) {
      alert(err?.errorBody?.error?.message || err.message || 'Failed to cancel');
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary mb-2">My Bookings</h1>
          <p className="text-base sm:text-lg text-text-secondary">View and manage your bookings</p>
        </header>

        {loading && (
          <div className="bg-surface-card rounded-lg shadow-card p-6 border border-surface-border">
            <p className="text-text-secondary">Loading bookings...</p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && bookings.length === 0 && (
          <div className="bg-surface-card rounded-lg shadow-card p-6 border border-surface-border">
            <p className="text-text-secondary">No bookings found.</p>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-surface-card rounded-lg shadow-card p-6 border border-surface-border"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {booking.venueName || booking.venueId}
                  </h2>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      booking.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : booking.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : booking.status === 'cancelled'
                            ? 'bg-neutral-100 text-text-secondary border border-surface-border'
                            : 'bg-neutral-100 text-text-secondary border border-surface-border'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-1">
                  Start: {booking.startTime ? new Date(booking.startTime).toLocaleString() : ''}
                </p>
                <p className="text-sm text-text-secondary mb-1">
                  End: {booking.endTime ? new Date(booking.endTime).toLocaleString() : ''}
                </p>
                {booking.title && <p className="text-sm text-text-secondary">Title: {booking.title}</p>}
                {booking.purpose && <p className="text-sm text-text-secondary">Purpose: {booking.purpose}</p>}
                {booking.attendees && <p className="text-sm text-text-secondary">Attendees: {booking.attendees}</p>}
                {canCancel(booking) && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="mt-3 px-3 py-1 bg-brand-primary text-white rounded-lg hover:bg-gray-900 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
