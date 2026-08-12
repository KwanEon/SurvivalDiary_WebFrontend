import { apiRequest } from '../auth';
import type {
  BudgetResponse,
  ExpenseSummary,
  HomeSummary,
  NewsRecommendation,
} from './types';

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

export function getRecommendedNews(size = 20, signal?: AbortSignal) {
  return apiRequest<NewsRecommendation[]>(`/news/recommendations?size=${size}`, {
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
