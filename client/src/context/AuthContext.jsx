import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminLogin as apiAdminLogin, getAuthProfile } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'skynet_admin_token';
const USER_KEY = 'skynet_admin_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAdmin, setIsAdmin] = useState(Boolean(user?.role === 'admin' || user?.role === 'super_admin'));
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  const verifySession = useCallback(async () => {
    const existingToken = localStorage.getItem(STORAGE_KEY);
    if (!existingToken) {
      setToken(null);
      setUser(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const res = await getAuthProfile(existingToken);
      if (res.success && res.data.isAdmin) {
        setToken(existingToken);
        setUser(res.data);
        setIsAdmin(true);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      } else {
        // Not an authorized admin
        throw new Error('Unauthorized');
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
      setToken(null);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email, password) => {
    const res = await apiAdminLogin(email, password);
    if (res.success && res.data.session?.access_token) {
      const accessToken = res.data.session.access_token;
      const userData = res.data.user;

      localStorage.setItem(STORAGE_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));

      setToken(accessToken);
      setUser(userData);
      setIsAdmin(true);
      return { success: true };
    }
    throw new Error(res.error || 'Authentication failed');
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAdmin,
        loading,
        login,
        logout,
        verifySession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
