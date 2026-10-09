export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  _id: string;
  name: string;
  isDefault: boolean;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other';

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  category: Category;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  user?: User;
  createdAt: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface ExpenseListResponse {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Budget {
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'within' | 'approaching' | 'over';
}

export interface DashboardData {
  month: string;
  totalSpent: number;
  budget: Budget;
  highestExpense: Expense | null;
  byCategory: Array<{ categoryId: string; name: string; total: number; count: number }>;
  recentExpenses: Expense[];
}

export interface AdminInsights {
  totalUsers: number;
  totalExpenses: number;
  totalExpenseValue: number;
  expensesThisMonth: number;
  spendingPerCategory: Array<{ categoryId: string; name: string; total: number; count: number }>;
  topCategories: Array<{ categoryId: string; name: string; total: number; count: number }>;
  bottomCategories: Array<{ categoryId: string; name: string; total: number; count: number }>;
  recentExpenses: Expense[];
  recentUsers: Array<User & { createdAt: string }>;
}

export interface ApiError {
  message: string;
}