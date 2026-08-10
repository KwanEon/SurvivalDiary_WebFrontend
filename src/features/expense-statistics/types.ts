export type StatisticsPeriod = 'monthly' | 'daily';

export interface ExpenseRecord {
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

export interface CategoryStatistic {
  categoryId: number;
  label: string;
  amount: number;
  ratio: number;
}

export interface PeriodComparison {
  categoryId: number;
  label: string;
  previous: number;
  current: number;
}

export interface TrendItem {
  label: string;
  amount: number;
}
