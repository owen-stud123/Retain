import type { Budget } from '../types';
import client from './client';

export async function getBudget(month: string) {
  const response = await client.get<Budget>(`/budgets/${month}`);
  return response.data;
}

export async function updateBudget(month: string, amount: number) {
  const response = await client.put<Budget>(`/budgets/${month}`, { amount });
  return response.data;
}