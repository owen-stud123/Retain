import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, getUserFromStorage, login as loginRequest, signup as signupRequest } from '../api/auth';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveSession(token: string, user: User) {
  localStorage.setItem('retain_token', token);
  localStorage.setItem('retain_user', JSON.stringify(user));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getUserFromStorage);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('retain_token')));

  useEffect(() => {
    if (!localStorage.getItem('retain_token')) return;
    getMe()
      .then((session) => {
        saveSession(session.token, session.user);
        setUser(session.user);
      })
      .catch(() => {
        localStorage.removeItem('retain_token');
        localStorage.removeItem('retain_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      const session = await loginRequest({ email, password });
      saveSession(session.token, session.user);
      setUser(session.user);
    },
    async signup(name, email, password) {
      const session = await signupRequest({ name, email, password });
      saveSession(session.token, session.user);
      setUser(session.user);
    },
    logout() {
      localStorage.removeItem('retain_token');
      localStorage.removeItem('retain_user');
      setUser(null);
    }
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}