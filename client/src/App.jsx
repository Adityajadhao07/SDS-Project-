import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import VenueListPage from './pages/VenueListPage.jsx';
import VenueDetailPage from './pages/VenueDetailPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import AdminBookingsPage from './pages/AdminBookingsPage.jsx';
import AdminVenuesPage from './pages/AdminVenuesPage.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-50 w-full">
      <Navbar />
      <main className="w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/venues" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/venues" element={<VenueListPage />} />
          <Route path="/venues/:id" element={<VenueDetailPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/my-bookings" element={<MyBookingsPage />} />
          </Route>
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/venues" element={<AdminVenuesPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/venues" replace />} />
        </Routes>
      </main>
    </div>
  );
}
