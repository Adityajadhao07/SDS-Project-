import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

export default function Navbar() {
  const { isAuthenticated, logout, user, isAdmin } = useAuth();

  return (
    <nav className="bg-white border-b border-neutral-200 shadow-card" style={{ opacity: 1, visibility: 'visible' }}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ opacity: 1, visibility: 'visible' }}>
        <Link
          to="/venues"
          className="text-xl sm:text-2xl font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6F6B] focus-visible:ring-offset-2 rounded"
          style={{ color: '#1F2933', opacity: 1, visibility: 'visible' }}
        >
          Venue Booking
        </Link>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6" style={{ opacity: 1, visibility: 'visible' }}>
          <Link
            to="/venues"
            className="font-medium rounded px-1 py-0.5"
            style={{ color: '#1F2933', opacity: 1, visibility: 'visible', fontWeight: 500, textDecoration: 'none' }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
            onFocus={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onBlur={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Venues
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-bookings"
              className="font-medium rounded px-1 py-0.5"
              style={{ color: '#1F2933', opacity: 1, visibility: 'visible', fontWeight: 500, textDecoration: 'none' }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
              onFocus={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onBlur={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              My Bookings
            </Link>
          )}
          {isAdmin && (
            <>
              <Link
                to="/admin/bookings"
                className="font-medium rounded px-1 py-0.5"
                style={{ color: '#1F2933', opacity: 1, visibility: 'visible', fontWeight: 500, textDecoration: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onFocus={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onBlur={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Admin Bookings
              </Link>
              <Link
                to="/admin/venues"
                className="font-medium rounded px-1 py-0.5"
                style={{ color: '#1F2933', opacity: 1, visibility: 'visible', fontWeight: 500, textDecoration: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onFocus={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onBlur={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Admin Venues
              </Link>
            </>
          )}
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="font-medium rounded px-1 py-0.5"
                style={{ color: '#1F2933', opacity: 1, visibility: 'visible', fontWeight: 500, textDecoration: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onFocus={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onBlur={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="font-medium rounded px-1 py-0.5"
                style={{ color: '#1F2933', opacity: 1, visibility: 'visible', fontWeight: 500, textDecoration: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onFocus={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onBlur={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3" style={{ opacity: 1, visibility: 'visible' }}>
              <span className="text-neutral-700 text-sm" style={{ opacity: 1, visibility: 'visible' }}>{user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="font-medium rounded px-1 py-0.5"
                style={{ color: '#1F2933', opacity: 1, visibility: 'visible', fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'none' }}
                onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onFocus={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onBlur={(e) => (e.currentTarget.style.textDecoration = 'none')}
                type="button"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
