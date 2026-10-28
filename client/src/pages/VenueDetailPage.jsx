import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVenue, getVenueAvailability } from '../api/venues.js';
import CalendarView from '../components/CalendarView.jsx';
import BookingDialog from '../components/BookingDialog.jsx';
import AvailabilityGrid from '../components/AvailabilityGrid.jsx';

export default function VenueDetailPage() {
  const { id } = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('calendar');
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  // Form tab state
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    // Use local date in Asia/Kolkata approximation by toISOString slice is UTC; better use local
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [availability, setAvailability] = useState(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availError, setAvailError] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]); // array of slots in order
  const [rangeError, setRangeError] = useState('');
  const [dialogPrefill, setDialogPrefill] = useState(null);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getVenue(id);
        setVenue(data);
      } catch (err) {
        setError(err.message || 'Failed to load venue');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchVenue();
    }
  }, [id]);

  const fetchAvailability = async (date) => {
    try {
      setLoadingAvail(true);
      setAvailError('');
      setRangeError('');
      setSelectedSlots([]);
      setDialogPrefill(null);
      const data = await getVenueAvailability(id, date);
      setAvailability(data);
    } catch (err) {
      setAvailError(err.message || 'Failed to load availability');
    } finally {
      setLoadingAvail(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'form' && id && selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [activeTab, id, selectedDate]);

  const handleSlotSelect = (slot) => {
    setRangeError('');
    // Check if past
    const now = new Date();
    const start = slot.startTime ? new Date(slot.startTime) : null;
    if (start && start < now) {
      return;
    }
    if (slot.status !== 'free') {
      return;
    }

    if (selectedSlots.length === 0) {
      setSelectedSlots([slot]);
      return;
    }
    if (selectedSlots.length === 1) {
      const first = selectedSlots[0];
      // Check all slots between first and slot are free
      const slots = availability?.slots || [];
      const firstIdx = slots.findIndex((s) => s.startTime === first.startTime);
      const secondIdx = slots.findIndex((s) => s.startTime === slot.startTime);
      if (firstIdx === -1 || secondIdx === -1) {
        setSelectedSlots([slot]);
        return;
      }
      const startIdx = Math.min(firstIdx, secondIdx);
      const endIdx = Math.max(firstIdx, secondIdx);
      // Check range is contiguous in terms of slots and all free
      for (let i = startIdx; i <= endIdx; i++) {
        const s = slots[i];
        const sStart = s.startTime ? new Date(s.startTime) : null;
        if (sStart && sStart < now) {
          setRangeError('Selected range includes a booked slot');
          setSelectedSlots([]);
          return;
        }
        if (s.status !== 'free') {
          setRangeError('Selected range includes a booked slot');
          setSelectedSlots([]);
          return;
        }
      }
      // Build range
      const range = [];
      for (let i = startIdx; i <= endIdx; i++) {
        range.push(slots[i]);
      }
      setSelectedSlots(range);
      return;
    }
    // If already have range, start new selection
    setSelectedSlots([slot]);
  };

  const getDuration = () => {
    if (selectedSlots.length === 0) return '';
    const first = selectedSlots[0];
    const last = selectedSlots[selectedSlots.length - 1];
    const start = first.startTime ? new Date(first.startTime) : null;
    const end = last.endTime ? new Date(last.endTime) : null;
    if (!start || !end) return '';
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const hours = Math.floor(diffHours);
    const mins = Math.round((diffHours - hours) * 60);
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const handleContinue = () => {
    setRangeError('');
    if (selectedSlots.length === 0) return;
    const first = selectedSlots[0];
    const last = selectedSlots[selectedSlots.length - 1];
    const start = first.startTime ? new Date(first.startTime) : null;
    const end = last.endTime ? new Date(last.endTime) : null;
    if (!start || !end) return;
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 0.5 || diffHours > 4) {
      setRangeError('Booking duration must be between 30 minutes and 4 hours');
      return;
    }
    setDialogPrefill({
      venueId: venue.id,
      venueName: venue.name,
      date: selectedDate,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });
    setFormDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
            <p className="text-neutral-700">Loading venue...</p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl" role="alert">
            {error}
          </div>
        )}
        {venue && !loading && (
          <>
            <header className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">{venue.name}</h1>
              <p className="text-base sm:text-lg text-neutral-700">
                {venue.building} | Capacity: {venue.capacity} | Type: {venue.type}
              </p>
              {venue.facilities && venue.facilities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {venue.facilities.map((facility, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-neutral-100 text-neutral-700 border border-neutral-200"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              )}
            </header>

            <div className="mb-6">
              <div className="flex gap-1 bg-neutral-200 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'calendar'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setActiveTab('form')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'form'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-700 hover:text-neutral-900'
                  }`}
                >
                  Book by form
                </button>
              </div>
            </div>

            {activeTab === 'calendar' && <CalendarView venueId={venue.id} venueName={venue.name} />}

            {activeTab === 'form' && (
              <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">Book by form</h2>
                <div className="mb-4">
                  <label htmlFor="booking-date" className="block text-sm font-medium text-neutral-900 mb-1">
                    Date
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-neutral-300 rounded-lg"
                  />
                </div>

                {loadingAvail && <p className="text-neutral-700">Loading slots...</p>}
                {availError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg mb-3">
                    {availError}
                  </div>
                )}

                {availability && availability.slots && (
                  <>
                    <AvailabilityGrid slots={availability.slots} onSlotSelect={handleSlotSelect} />
                    {selectedSlots.length > 0 && (
                      <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <p className="text-sm text-neutral-900 font-medium">
                          Selected: {selectedSlots[0].startTime ? new Date(selectedSlots[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : ''} to{' '}
                          {selectedSlots[selectedSlots.length - 1].endTime ? new Date(selectedSlots[selectedSlots.length - 1].endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : ''} ({getDuration()})
                        </p>
                      </div>
                    )}
                    {rangeError && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                        {rangeError}
                      </div>
                    )}
                    {selectedSlots.length > 0 && !rangeError && (
                      <button
                        onClick={handleContinue}
                        className="mt-4 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
                      >
                        Continue
                      </button>
                    )}
                  </>
                )}

                <BookingDialog
                  isOpen={formDialogOpen}
                  onClose={() => {
                    setFormDialogOpen(false);
                    setDialogPrefill(null);
                  }}
                  venueId={dialogPrefill?.venueId || venue.id}
                  venueName={dialogPrefill?.venueName || venue.name}
                  date={dialogPrefill?.date}
                  startTime={dialogPrefill?.startTime}
                  endTime={dialogPrefill?.endTime}
                  onSuccess={() => {
                    setFormDialogOpen(false);
                    setDialogPrefill(null);
                    setSelectedSlots([]);
                    if (activeTab === 'form' && selectedDate) {
                      fetchAvailability(selectedDate);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
