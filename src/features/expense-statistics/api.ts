import { apiRequest } from '../auth';
import type { ExpenseRecord } from './types';

export function getExpenses(signal?: AbortSignal) {
  return apiRequest<ExpenseRecord[]>('/expenses', {
    headers: { 'Cache-Control': 'no-cache' },
    signal,
  });
}

export function deleteExpense(expenseId: number) {
  return apiRequest<null>(`/expenses/${expenseId}`, { method: 'DELETE' });
}
