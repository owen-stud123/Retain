import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullPageSpinner from '../components/common/FullPageSpinner';

export function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireAdmin() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}