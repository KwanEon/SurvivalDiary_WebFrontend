import { apiRequest } from '../auth';

export interface CreateManualExpenseInput {
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  spentAt: string;
  memo: string | null;
}

export function createManualExpense(input: CreateManualExpenseInput) {
  return apiRequest<unknown>('/expenses', {
    method: 'POST',
    body: JSON.stringify({ ...input, entryType: 'MANUAL' }),
  });
}
