import type { AuthResponse, User } from '../types';
import client from './client';

export async function signup(data: { name: string; email: string; password: string }) {
  const response = await client.post<AuthResponse>('/auth/signup', data);
  return response.data;
}

export async function login(data: { email: string; password: string }) {
  const response = await client.post<AuthResponse>('/auth/login', data);
  return response.data;
}

export async function getMe() {
  const response = await client.get<AuthResponse>('/auth/me');
  return response.data;
}

export function getUserFromStorage(): User | null {
  const storedUser = localStorage.getItem('retain_user');
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem('retain_user');
    return null;
  }
}