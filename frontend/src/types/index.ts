export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  avatar_color: string;
  currency: string;
  currency_symbol: string;
  created_at: string;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  account_type: 'savings' | 'current' | 'cash' | 'credit_card' | 'joint';
  balance: number;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  recent_transactions?: Transaction[];
}

export interface Transaction {
  id: number;
  user_id: number;
  account_id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
  status: 'completed' | 'pending' | 'failed';
  family_member_name: string;
  created_at: string;
  account_name?: string;
}

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  allocated: number;
  spent?: number;
  remaining?: number;
  percentage?: number;
  month: number;
  year: number;
  created_at: string;
}

export interface GoalContribution {
  id: number;
  goal_id: number;
  amount: number;
  date: string;
  note: string;
}

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  icon: string;
  color: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  created_at: string;
  contributions?: GoalContribution[];
}

export interface Bill {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  category: string;
  due_date: string;
  is_recurring: boolean;
  recurrence: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  status: 'paid' | 'pending' | 'overdue';
  auto_pay: boolean;
  created_at: string;
}

export interface FamilyMember {
  id: number;
  family_id: number;
  user_id: number;
  role: 'admin' | 'member' | 'viewer';
  spending_limit: number;
  joined_at: string;
  user?: User;
}

export interface Family {
  id: number;
  name: string;
  created_by: number;
  monthly_budget: number;
  created_at: string;
  members: FamilyMember[];
}

export interface AnalyticsSummary {
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
  net_savings: number;
  savings_rate: number;
  total_budget: number;
  available_budget: number;
  comparison: {
    income_change_pct: number;
    expense_change_pct: number;
    savings_change_pct: number;
  };
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface DailyTrend {
  date: string;
  amount: number;
}

export interface DynamicInsight {
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  metric?: string;
}

export interface FamilyMemberSpending {
  member_name: string;
  role: string;
  spent: number;
  limit: number;
  percentage: number;
}

export interface Card {
  id: number;
  user_id: number;
  account_id?: number | null;
  cardholder_name: string;
  card_number: string;
  card_number_masked: string;
  card_number_formatted: string;
  last4: string;
  expiry_date: string;
  card_label: string;
  network: 'mastercard' | 'visa' | 'amex' | 'rupay';
  color_theme: 'emerald' | 'obsidian' | 'royal' | 'gold';
  is_locked: boolean;
  created_at: string;
}

