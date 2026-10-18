import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { isAxiosError } from 'axios';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/common/AuthCard';
import { useAuth } from '../context/AuthContext';

function getLoginErrorMessage(requestError: unknown) {
  if (isAxiosError(requestError) && requestError.response) {
    const { status, data } = requestError.response;
    if (status === 401) return 'Invalid email or password.';
    if (status >= 500) return 'Something went wrong on the server. Please try again.';
    return data?.message || 'Unable to sign in.';
  }
  // The API client throws a plain error when no response arrives (network failure or timeout).
  return 'We could not reach the server. It may be waking up, so wait a moment and try again.';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate((location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(getLoginErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Sign in">
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign in'}</Button>
        <Typography variant="body2">Need an account? <Link to="/signup">Create one</Link></Typography>
      </Stack>
    </AuthCard>
  );
}