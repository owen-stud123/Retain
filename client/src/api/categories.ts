import type { Category } from '../types';
import client from './client';

export async function getCategories() {
  const response = await client.get<Category[]>('/categories');
  return response.data;
}

export async function createCategory(name: string) {
  const response = await client.post<Category>('/categories', { name });
  return response.data;
}

export async function updateCategory(id: string, name: string) {
  const response = await client.put<Category>(`/categories/${id}`, { name });
  return response.data;
}

export async function deleteCategory(id: string) {
  const response = await client.delete<{ message: string; reassignedExpenses: number }>(`/categories/${id}`);
  return response.data;
}