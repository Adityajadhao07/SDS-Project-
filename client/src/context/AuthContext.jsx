import { createContext, useEffect, useState } from 'react';
import { login as loginApi, register as registerApi, getCurrentUser } from '../api/auth.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'venue_booking_token';

// TODO: M6 replaces dev auth with real JWT auth
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await getCurrentUser();
          setUser(res.user || res);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (credentials) => {
    const res = await loginApi(credentials);
    const authToken = res.token;
    if (authToken) {
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
    }
    setUser(res.user);
    return res;
  };

  const register = async (userData) => {
    const res = await registerApi(userData);
    const authToken = res.token;
    if (authToken) {
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);
    }
    setUser(res.user);
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
