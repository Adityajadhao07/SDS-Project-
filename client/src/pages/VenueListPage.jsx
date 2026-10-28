import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVenues } from '../api/venues.js';

const getVenueTypeBorder = (type) => {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('auditorium')) {
    return '#5E5470';
  }
  if (normalized.includes('seminar')) {
    return '#6B7A5A';
  }
  if (normalized.includes('classroom')) {
    const name = type || '';
    if (name.toUpperCase().startsWith('SC')) {
      return '#9C8A6A';
    }
    return '#5B7083';
  }
  return '#5B7083';
};

export default function VenueListPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const data = await listVenues();
        setVenues(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load venues');
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1F2933] mb-2">Venues</h1>
          <p className="text-base sm:text-lg text-neutral-700">Browse and book college venues</p>
        </header>

        {loading && (
          <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
            <p className="text-neutral-700">Loading venues...</p>
          </div>
        )}
        {error && (
          <div
            className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl"
            role="alert"
          >
            {error}
          </div>
        )}
        {!loading && !error && venues.length === 0 && (
          <div className="bg-white rounded-xl shadow-card p-6 border border-neutral-200">
            <p className="text-neutral-700">No venues found.</p>
          </div>
        )}

        {!loading && !error && venues.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {venues.map((venue) => {
              const borderColor = getVenueTypeBorder(venue.type);
              return (
                <Link
                  key={venue.id}
                  to={`/venues/${venue.id}`}
                  className="group block bg-white rounded-xl shadow-card border border-neutral-200 overflow-hidden hover:shadow-cardHover transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  style={{ borderTop: `2px solid ${borderColor}` }}
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-neutral-900 group-hover:text-primary-700 transition-colors">
                        {venue.name}
                      </h2>
                    </div>
                    <p className="text-sm text-neutral-700 mb-2">Building: {venue.building}</p>
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-800 border border-primary-200">
                        Capacity: {venue.capacity}
                      </span>
                    </div>
                    {venue.facilities && venue.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {venue.facilities.map((facility, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-neutral-100 text-neutral-700 border border-neutral-200"
                          >
                            {facility}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
