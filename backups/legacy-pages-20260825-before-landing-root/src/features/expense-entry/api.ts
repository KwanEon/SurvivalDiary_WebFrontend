import { apiRequest } from '../auth';

export interface CreateManualExpenseInput {
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  spentAt: string;
  memo: string | null;
}

export interface ExpenseEntryRecord {
  expenseId: number;
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  spentAt: string;
  memo: string | null;
  entryType: 'MANUAL' | 'AUTO';
  notificationSource: string | null;
  createdAt: string;
}

export function createManualExpense(input: CreateManualExpenseInput) {
  return apiRequest<unknown>('/expenses', {
    method: 'POST',
    body: JSON.stringify({ ...input, entryType: 'MANUAL' }),
  });
}

export function getExpenses(signal?: AbortSignal) {
  return apiRequest<ExpenseEntryRecord[]>('/expenses', {
    headers: { 'Cache-Control': 'no-cache' },
    signal,
  });
}
