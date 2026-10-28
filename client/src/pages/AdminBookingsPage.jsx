import { useEffect, useState } from 'react';
import { getAdminBookings as listAllBookings, updateAdminBooking as updateBookingStatus } from '../api/admin.js';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listAllBookings(filter || undefined);
      setBookings(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const handleAction = async (bookingId, action) => {
    try {
      await updateBookingStatus(bookingId, action);
      fetchBookings();
    } catch (err) {
      alert(err?.errorBody?.error?.message || err.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface-bg w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary mb-2">
            Admin - All Bookings
          </h1>
          <p className="text-base sm:text-lg text-text-secondary">Manage booking requests</p>
        </header>

        <div className="mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-surface-border rounded-lg bg-surface-card text-text-primary"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

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
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {booking.venueName || booking.venueId}
                    </h2>
                    <p class className="text-sm text-text-secondary">User: {booking.userId}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      booking.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : booking.status === 'pending'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : booking.status === 'rejected'
                            ? 'bg-red-50 text-red-800 border border-red-200'
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
                {booking.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAction(booking.id, 'approve')}
                      className="px-3 py-1 bg-brand-primary text-white rounded-lg hover:bg-gray-900 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, 'reject')}
                      className="px-3 py-1 bg-surface-card text-text-primary border border-surface-border rounded-lg hover:bg-surface-bg text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
