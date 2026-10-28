import { apiClient } from './client.js';

export async function register(data) {
  return apiClient.post('/auth/register', data);
}

export async function login(data) {
  return apiClient.post('/auth/login', data);
}

export async function getCurrentUser() {
  return apiClient.get('/auth/me');
}
