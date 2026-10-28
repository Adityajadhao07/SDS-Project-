import { useEffect, useState } from 'react';
import { listVenues } from '../api/venues.js';
import { createVenue, updateVenue } from '../api/admin.js';

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    type: '',
    capacity: '',
    facilities: '',
    isActive: true,
  });

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listVenues();
      setVenues(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity),
        facilities: formData.facilities
          ? formData.facilities.split(',').map((f) => f.trim()).filter(Boolean)
          : [],
      };
      if (editingId) {
        await updateVenue(editingId, payload);
      } else {
        await createVenue(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', building: '', type: '', capacity: '', facilities: '', isActive: true });
      fetchVenues();
    } catch (err) {
      alert(err?.errorBody?.error?.message || err.message || 'Failed to save venue');
    }
  };

  const handleEdit = (venue) => {
    setEditingId(venue.id);
    setFormData({
      name: venue.name || '',
      building: venue.building || '',
      type: venue.type || '',
      capacity: venue.capacity || '',
      facilities: Array.isArray(venue.facilities) ? venue.facilities.join(', ') : '',
      isActive: venue.isActive !== false,
    });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-surface-bg w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-text-primary mb-2">
              Admin - Venues
            </h1>
            <p className="text-base sm:text-lg text-text-secondary">Create and edit venues</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ name: '', building: '', type: '', capacity: '', facilities: '', isActive: true });
            }}
            className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-gray-900"
          >
            Add Venue
          </button>
        </header>

        {showForm && (
          <div className="mb-6 bg-surface-card rounded-lg shadow-card p-6 border border-surface-border">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {editingId ? 'Edit Venue' : 'Add Venue'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-3 py-2 border border-surface-border rounded-lg bg-surface-card text-text-primary"
                required
              />
              <input
                type="text"
                placeholder="Building"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="px-3 py-2 border border-surface-border rounded-lg bg-surface-card text-text-primary"
                required
              />
              <input
                type="text"
                placeholder="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="px-3 py-2 border border-surface-border rounded-lg bg-surface-card text-text-primary"
                required
              />
              <input
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="px-3 py-2 border border-surface-border rounded-lg bg-surface-card text-text-primary"
                required
              />
              <input
                type="text"
                placeholder="Facilities (comma separated)"
                value={formData.facilities}
                onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                className="md:col-span-2 px-3 py-2 border border-surface-border rounded-lg bg-surface-card text-text-primary"
              />
              <label className="flex items-center gap-2 text-text-primary">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active
              </label>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-gray-900">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-surface-border text-text-primary rounded-lg hover:bg-surface-bg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && (
          <div className="bg-surface-card rounded-lg shadow-card p-6 border border-surface-border">
            <p className="text-text-secondary">Loading venues...</p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && venues.length === 0 && (
          <div className="bg-surface-card rounded-lg shadow-card p-6 border border-surface-border">
            <p className="text-text-secondary">No venues found.</p>
          </div>
        )}

        {!loading && !error && venues.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="bg-surface-card rounded-lg shadow-card p-4 border border-surface-border"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-1">{venue.name}</h3>
                <p className="text-sm text-text-secondary mb-1">{venue.building}</p>
                <p className="text-sm text-text-secondary mb-1">
                  {venue.type} | Capacity: {venue.capacity}
                </p>
                <p className="text-xs text-text-secondary mb-2">
                  {venue.isActive ? 'Active' : 'Inactive'}
                </p>
                <button
                  onClick={() => handleEdit(venue)}
                  className="px-3 py-1 bg-brand-primary text-white rounded-lg hover:bg-gray-900 text-sm"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
