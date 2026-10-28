import { apiClient } from './client.js';

export async function createBooking(bookingData, options = {}) {
  return apiClient.post('/bookings', bookingData, options);
}

export async function getMyBookings(options = {}) {
  return apiClient.get('/bookings/mine', options);
}

export async function cancelBooking(bookingId, options = {}) {
  return apiClient.patch(`/bookings/${bookingId}/cancel`, undefined, options);
}
