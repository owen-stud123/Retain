import type { AdminInsights } from '../types';
import client from './client';

export async function getAdminInsights() {
  const response = await client.get<AdminInsights>('/admin/insights');
  return response.data;
}