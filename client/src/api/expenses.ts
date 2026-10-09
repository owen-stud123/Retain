import type { Expense, ExpenseInput, ExpenseListResponse } from '../types';
import client from './client';

export type ExpenseQuery = Record<string, string | number | undefined>;

export async function getExpenses(params?: ExpenseQuery) {
  const response = await client.get<ExpenseListResponse>('/expenses', { params });
  return response.data;
}

export async function getExpense(id: string) {
  const response = await client.get<Expense>(`/expenses/${id}`);
  return response.data;
}

export async function createExpense(data: ExpenseInput) {
  const response = await client.post<Expense>('/expenses', data);
  return response.data;
}

export async function updateExpense(id: string, data: Partial<ExpenseInput>) {
  const response = await client.put<Expense>(`/expenses/${id}`, data);
  return response.data;
}

export async function deleteExpense(id: string) {
  const response = await client.delete<{ message: string }>(`/expenses/${id}`);
  return response.data;
}