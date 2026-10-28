import { apiClient } from './client.js';

export async function getAdminBookings(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient.get(`/admin/bookings${query}`);
}

export async function updateAdminBooking(id, action, reason) {
  return apiClient.patch(`/admin/bookings/${id}`, { action, reason });
}

export async function createVenue(venueData) {
  return apiClient.post('/venues', venueData);
}

export async function updateVenue(id, venueData) {
  return apiClient.patch(`/venues/${id}`, venueData);
}
