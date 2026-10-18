import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const client = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('retain_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
  const isTransientFailure = !error.response || error.response.status >= 500;
  // Only reads are retried. Retrying a write could save or delete the same record twice.
  const isSafeToRetry = config?.method?.toLowerCase() === 'get';

  if (config && isSafeToRetry && isTransientFailure && !config._retry) {
    config._retry = true;
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    return client(config);
  }

  if (!error.response) {
    throw new Error('The API server is unavailable. Confirm the backend is running on port 5000 and try again.');
  }

  throw error;
});

export default client;
