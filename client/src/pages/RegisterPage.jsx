import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await register({ name, email, password, role });
      navigate('/venues');
    } catch (err) {
      setError(err?.errorBody?.error?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-card p-8 border border-neutral-200">
        <h1 className="text-2xl font-semibold text-[#1F2933] mb-6 text-center">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#1F2933] mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F6F6B]"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1F2933] mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F6F6B]"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1F2933] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F6F6B]"
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-[#1F2933] mb-1">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F6F6B]"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: loading ? '#5B6470' : '#1F2933',
              color: '#FFFFFF',
              border: 'none',
              opacity: 1,
              borderRadius: '6px',
              fontWeight: 600,
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm" style={{ color: '#1F2933' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1F2933', textDecoration: 'none' }} onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')} onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')} onFocus={(e) => (e.currentTarget.style.textDecoration = 'underline')} onBlur={(e) => (e.currentTarget.style.textDecoration = 'none')}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
