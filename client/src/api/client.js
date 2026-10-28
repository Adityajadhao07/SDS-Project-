/**
 * API client wrapper for Venue Booking System
 * Reads base URL from VITE_API_URL. All requests go through this client.
 * Errors are thrown as typed errors matching server shape: { error: { code, message, details? } }
 * TODO: M6 replaces dev header with real login/JWT auth
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'venue_booking_token';

if (!API_BASE_URL) {
  console.warn('VITE_API_URL is not set. API calls may fail.');
}

class ApiError extends Error {
  constructor(errorBody, status) {
    super(errorBody?.error?.message || errorBody?.message || 'API request failed');
    this.name = 'ApiError';
    this.code = errorBody?.error?.code || 'UNKNOWN_ERROR';
    this.details = errorBody?.error?.details;
    this.status = status;
    this.errorBody = errorBody;
  }
}

function buildHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (import.meta.env.VITE_DEV_MODE === 'true') {
    const devUserId = import.meta.env.VITE_DEV_USER_ID;
    if (devUserId && !headers['X-Dev-User-Id']) {
      headers['X-Dev-User-Id'] = devUserId;
    }
  }

  return headers;
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = buildHeaders(options.headers || {});

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // On 401, clear token and could redirect - but let caller handle
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new ApiError(data, res.status);
  }

  return data;
}

export const apiClient = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: (path, body, options = {}) =>
    request(path, {
      ...options,
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};

export { ApiError };
