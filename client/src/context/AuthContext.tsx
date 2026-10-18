import { isAxiosError } from 'axios';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getMe, getUserFromStorage, login as loginRequest, signup as signupRequest } from '../api/auth';
import type { User } from '../types';

// 'checking'   - a saved token exists and the server has not confirmed it yet
// 'verified'   - the server confirmed the session, or login/signup just succeeded
// 'unverified' - the server could not be reached; the saved token is kept but not trusted yet
// 'anonymous'  - there is no session
export type SessionStatus = 'checking' | 'verified' | 'unverified' | 'anonymous';

interface AuthContextValue {
  user: User | null;
  status: SessionStatus;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveSession(token: string, user: User) {
  localStorage.setItem('retain_token', token);
  localStorage.setItem('retain_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('retain_token');
  localStorage.removeItem('retain_user');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasToken = Boolean(localStorage.getItem('retain_token'));
  const [user, setUser] = useState<User | null>(() => (hasToken ? getUserFromStorage() : null));
  const [status, setStatus] = useState<SessionStatus>(hasToken ? 'checking' : 'anonymous');
  // Increases on every session change (check, login, signup, logout). A response from an older
  // version is ignored, so a slow check can't restore a signed-out session or overwrite a newer one.
  const sessionVersion = useRef(0);

  const checkSession = useCallback(async () => {
    const version = ++sessionVersion.current;
    setStatus('checking');
    try {
      const session = await getMe();
      if (version !== sessionVersion.current) return;
      saveSession(session.token, session.user);
      setUser(session.user);
      setStatus('verified');
    } catch (error) {
      if (version !== sessionVersion.current) return;
      if (isAxiosError(error) && error.response?.status === 401) {
        // The server rejected the token, so the session is no longer valid.
        clearSession();
        setUser(null);
        setStatus('anonymous');
        return;
      }
      // Timeout, network failure, or server error: keep the saved token, but don't trust it yet.
      setStatus('unverified');
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem('retain_token')) void checkSession();
  }, [checkSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    loading: status === 'checking',
    async login(email, password) {
      const session = await loginRequest({ email, password });
      sessionVersion.current += 1; // cancels any session check still in flight
      saveSession(session.token, session.user);
      setUser(session.user);
      setStatus('verified');
    },
    async signup(name, email, password) {
      const session = await signupRequest({ name, email, password });
      sessionVersion.current += 1; // cancels any session check still in flight
      saveSession(session.token, session.user);
      setUser(session.user);
      setStatus('verified');
    },
    logout() {
      sessionVersion.current += 1; // cancels any session check still in flight
      clearSession();
      setUser(null);
      setStatus('anonymous');
    },
    checkSession
  }), [status, user, checkSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
