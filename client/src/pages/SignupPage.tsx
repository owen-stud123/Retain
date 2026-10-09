import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/common/AuthCard';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSubmitting(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Create account">
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
        <Button type="submit" variant="contained" disabled={submitting}>{submitting ? 'Creating...' : 'Create account'}</Button>
        <Typography variant="body2">Already registered? <Link to="/login">Sign in</Link></Typography>
      </Stack>
    </AuthCard>
  );
}