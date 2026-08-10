export interface HomeSummary {
  userName: string;
  dailyLimit: number;
  remainingToday: number;
  spentToday: number;
  savedToday: number;
  weeklyBudget: number;
  weeklySpent: number;
  topCategoryId: number | null;
}

export interface BudgetResponse {
  budgetDate: string;
  amount: number;
  saved: boolean;
}

export interface ExpenseSummary {
  expenseId: number;
  categoryId: number;
  title: string;
  amount: number;
  spentAt: string;
}

export type DashboardLoadState = 'loading' | 'ready' | 'error';
