import type { DashboardData } from '../types';
import client from './client';

export async function getDashboard(month: string) {
  const response = await client.get<DashboardData>('/dashboard', { params: { month } });
  return response.data;
}