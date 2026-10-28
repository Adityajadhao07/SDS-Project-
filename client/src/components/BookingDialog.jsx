import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createBooking } from '../api/bookings.js';

export default function BookingDialog({
  isOpen,
  onClose,
  venueId,
  venueName,
  date,
  startTime,
  endTime,
  onSuccess,
}) {
  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setPurpose('');
      setAttendees(1);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const bookingData = {
        venueId,
        title: title.trim(),
        purpose: purpose.trim(),
        attendees: Number(attendees),
        startTime,
        endTime,
      };
      await createBooking(bookingData);
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err?.errorBody?.error?.message || err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    } catch {
      return timeStr;
    }
  };

  const dialogContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(31, 41, 51, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        opacity: 1,
        visibility: 'visible',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          opacity: 1,
          visibility: 'visible',
          border: '1px solid #E4E2DC',
          borderRadius: '8px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '1.5rem', opacity: 1, visibility: 'visible', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', opacity: 1, visibility: 'visible' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1F2933', opacity: 1, visibility: 'visible' }}>Book Venue</h2>
            <button
              onClick={onClose}
              style={{ color: '#5B6470', fontSize: '1.5rem', lineHeight: 1, opacity: 1, visibility: 'visible', background: 'transparent', border: 'none' }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#F4F3EF', borderRadius: '8px', opacity: 1, visibility: 'visible' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1F2933', opacity: 1, visibility: 'visible' }}>{venueName}</p>
            {date && <p style={{ fontSize: '0.875rem', color: '#5B6470', opacity: 1, visibility: 'visible' }}>Date: {date}</p>}
            {startTime && <p style={{ fontSize: '0.875rem', color: '#5B6470', opacity: 1, visibility: 'visible' }}>Start: {formatTime(startTime)}</p>}
            {endTime && <p style={{ fontSize: '0.875rem', color: '#5B6470', opacity: 1, visibility: 'visible' }}>End: {formatTime(endTime)}</p>}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 1, visibility: 'visible' }} noValidate>
            <div style={{ opacity: 1, visibility: 'visible' }}>
              <label htmlFor="title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#1F2933', marginBottom: '0.25rem', opacity: 1, visibility: 'visible' }}>
                Title <span style={{ color: '#DC2626', opacity: 1, visibility: 'visible' }}>*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E4E2DC', borderRadius: '8px', opacity: 1, visibility: 'visible', backgroundColor: '#FFFFFF' }}
                required
              />
            </div>

            <div style={{ opacity: 1, visibility: 'visible' }}>
              <label htmlFor="purpose" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#1F2933', marginBottom: '0.25rem', opacity: 1, visibility: 'visible' }}>
                Purpose
              </label>
              <textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E4E2DC', borderRadius: '8px', opacity: 1, visibility: 'visible', backgroundColor: '#FFFFFF' }}
                rows="3"
              />
            </div>

            <div style={{ opacity: 1, visibility: 'visible' }}>
              <label htmlFor="attendees" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#1F2933', marginBottom: '0.25rem', opacity: 1, visibility: 'visible' }}>
                Attendees
              </label>
              <input
                id="attendees"
                type="number"
                min="1"
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #E4E2DC', borderRadius: '8px', opacity: 1, visibility: 'visible', backgroundColor: '#FFFFFF' }}
              />
            </div>

            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '8px', fontSize: '0.875rem', opacity: 1, visibility: 'visible' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', opacity: 1, visibility: 'visible' }}>
              <button
                type="button"
                onClick={onClose}
                style={{ flex: 1, padding: '0.5rem 1rem', backgroundColor: '#FFFFFF', color: '#1F2933', border: '1px solid #1F2933', borderRadius: '8px', opacity: 1, visibility: 'visible' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{ flex: 1, padding: '0.5rem 1rem', backgroundColor: '#1F2933', color: '#FFFFFF', opacity: 1, visibility: 'visible', borderRadius: '8px', border: 'none' }}
              >
                {loading ? 'Booking...' : 'Book'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
