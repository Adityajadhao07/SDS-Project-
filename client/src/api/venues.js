import { apiClient } from './client.js';

export async function listVenues(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.minCapacity !== undefined && filters.minCapacity !== null) {
    params.append('minCapacity', String(filters.minCapacity));
  }
  if (filters.facility) params.append('facility', filters.facility);
  if (filters.date) params.append('date', filters.date);
  const query = params.toString();
  const path = query ? `/venues?${query}` : '/venues';
  return apiClient.get(path);
}

export async function getVenue(id) {
  return apiClient.get(`/venues/${id}`);
}

export async function getVenueAvailability(id, date) {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  const query = params.toString();
  const path = query ? `/venues/${id}/availability?${query}` : `/venues/${id}/availability`;
  return apiClient.get(path);
}

export async function getVenueCalendar(id, month) {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  const query = params.toString();
  const path = query ? `/venues/${id}/calendar?${query}` : `/venues/${id}/calendar`;
  return apiClient.get(path);
}
