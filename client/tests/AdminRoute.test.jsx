import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../src/components/ProtectedRoute.jsx';
import { AuthProvider } from '../src/context/AuthContext.jsx';
import * as authApi from '../src/api/auth.js';

vi.mock('../src/api/auth.js', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

describe('Admin route protection', () => {
  it('admin page is hidden from students', async () => {
    authApi.getCurrentUser.mockResolvedValue({ user: { id: '1', role: 'student', name: 'Test' } });
    localStorage.setItem('venue_booking_token', 'test-token');

    render(
      <MemoryRouter initialEntries={['/admin/bookings']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute requireAdmin />}>
              <Route path="/admin/bookings" element={<div>Admin Bookings</div>} />
            </Route>
            <Route path="/venues" element={<div>Venues</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Venues')).toBeInTheDocument();
    });
    expect(screen.queryByText('Admin Bookings')).not.toBeInTheDocument();
  });
});
