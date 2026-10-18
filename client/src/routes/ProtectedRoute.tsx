import { Alert, Button, Stack, Typography } from '@mui/material';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullPageSpinner from '../components/common/FullPageSpinner';

// Shown when the saved session could not be confirmed because the server did not respond.
function UnverifiedSession() {
  const { checkSession, logout } = useAuth();
  return (
    <Stack sx={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center', p: 2 }} spacing={2}>
      <Alert severity="warning" sx={{ maxWidth: 480 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>We could not confirm your session.</Typography>
        <Typography variant="body2">The server did not respond. Your sign-in has been kept, so you can try again.</Typography>
      </Alert>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={() => void checkSession()}>Retry</Button>
        <Button variant="outlined" onClick={() => logout()}>Sign out</Button>
      </Stack>
    </Stack>
  );
}

export function RequireAuth() {
  const { user, status } = useAuth();
  if (status === 'checking') return <FullPageSpinner />;
  if (status === 'unverified') return <UnverifiedSession />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireAdmin() {
  const { user, status } = useAuth();
  if (status === 'checking') return <FullPageSpinner />;
  if (status === 'unverified') return <UnverifiedSession />;
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
