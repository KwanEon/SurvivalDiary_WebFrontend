import { apiRequest } from '../auth';
import type { BudgetResponse, ExpenseSummary, HomeSummary } from './types';

export function getHomeSummary(signal?: AbortSignal) {
  return apiRequest<HomeSummary>('/home/summary', {
    headers: { 'Cache-Control': 'no-cache' },
    signal,
  });
}

export function getExpenses(signal?: AbortSignal) {
  return apiRequest<ExpenseSummary[]>('/expenses', {
    headers: { 'Cache-Control': 'no-cache' },
    signal,
  });
}

export function saveTodayBudget(amount: number) {
  return apiRequest<BudgetResponse>('/budgets/today', {
    method: 'PUT',
    body: JSON.stringify({ amount }),
  });
}
