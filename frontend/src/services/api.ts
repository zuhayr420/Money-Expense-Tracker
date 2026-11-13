import axios from 'axios';
import {
  Account,
  Card,
  AnalyticsSummary,
  Bill,
  Budget,
  CategorySpending,
  DailyTrend,
  DynamicInsight,
  Family,
  FamilyMember,
  FamilyMemberSpending,
  Goal,
  GoalContribution,
  MonthlyTrend,
  Transaction,
  User,
} from '../types';

// Production-ready environment-driven API base URL
const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const API_BASE_URL = envBase
  ? `${envBase.replace(/\/$/, '')}${envBase.endsWith('/api') ? '' : '/api'}`
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15-second timeout for resilient network handling
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', credentials);
    return res.data;
  },
  register: async (userData: { username: string; email: string; password: string; full_name?: string }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', userData);
    return res.data;
  },
  getProfile: async () => {
    const res = await api.get<{ user: User }>('/auth/profile');
    return res.data.user;
  },
  updateProfile: async (userData: Partial<User> & { password?: string }) => {
    const res = await api.post<{ user: User }>('/auth/profile', userData);
    return res.data.user;
  },
};

export const accountsApi = {
  getAll: async () => {
    const res = await api.get<{ accounts: Account[] }>('/accounts');
    return res.data.accounts;
  },
  getById: async (id: number) => {
    const res = await api.get<{ account: Account }>(`/accounts/${id}`);
    return res.data.account;
  },
  create: async (account: Partial<Account>) => {
    const res = await api.post<{ account: Account }>('/accounts', account);
    return res.data.account;
  },
  update: async (id: number, account: Partial<Account>) => {
    const res = await api.put<{ account: Account }>(`/accounts/${id}`, account);
    return res.data.account;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/accounts/${id}`);
    return res.data;
  },
};

export const cardsApi = {
  getAll: async () => {
    const res = await api.get<{ cards: Card[] }>('/cards');
    return res.data.cards || [];
  },
  getById: async (id: number) => {
    const res = await api.get<{ card: Card }>(`/cards/${id}`);
    return res.data.card;
  },
  create: async (data: Partial<Card>) => {
    const res = await api.post<{ card: Card }>('/cards', data);
    return res.data.card;
  },
  update: async (id: number, data: Partial<Card>) => {
    const res = await api.put<{ card: Card }>(`/cards/${id}`, data);
    return res.data.card;
  },
  toggleLock: async (id: number) => {
    const res = await api.post<{ card: Card; is_locked: boolean }>(`/cards/${id}/toggle-lock`);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/cards/${id}`);
    return res.data;
  },
};

export const transactionsApi = {
  getAll: async (params?: {
    search?: string;
    category?: string;
    account_id?: number | string;
    type?: string;
    month?: number;
    year?: number;
    family_member_name?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const res = await api.get<{ transactions: Transaction[]; total_count?: number }>('/transactions', { params });
    return res.data.transactions;
  },
  getById: async (id: number) => {
    const res = await api.get<{ transaction: Transaction }>(`/transactions/${id}`);
    return res.data.transaction;
  },
  create: async (data: Partial<Transaction>) => {
    const res = await api.post<{ transaction: Transaction }>('/transactions', data);
    return res.data.transaction;
  },
  update: async (id: number, data: Partial<Transaction>) => {
    const res = await api.put<{ transaction: Transaction }>(`/transactions/${id}`, data);
    return res.data.transaction;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get<{ categories: string[] }>('/transactions/categories');
    return res.data.categories;
  },
  exportCsv: async () => {
    const res = await api.get('/transactions/export', { responseType: 'blob' });
    return res.data;
  },
};

export const budgetsApi = {
  getAll: async (params?: { month?: number; year?: number }) => {
    const res = await api.get<{ budgets: Budget[] }>('/budgets', { params });
    return res.data.budgets;
  },
  create: async (data: Partial<Budget>) => {
    const res = await api.post<{ budget: Budget }>('/budgets', data);
    return res.data.budget;
  },
  update: async (id: number, data: Partial<Budget>) => {
    const res = await api.put<{ budget: Budget }>(`/budgets/${id}`, data);
    return res.data.budget;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/budgets/${id}`);
    return res.data;
  },
};

export const goalsApi = {
  getAll: async () => {
    const res = await api.get<{ goals: Goal[] }>('/goals');
    return res.data.goals;
  },
  getById: async (id: number) => {
    const res = await api.get<{ goal: Goal }>(`/goals/${id}`);
    return res.data.goal;
  },
  create: async (data: Partial<Goal>) => {
    const res = await api.post<{ goal: Goal }>('/goals', data);
    return res.data.goal;
  },
  update: async (id: number, data: Partial<Goal>) => {
    const res = await api.put<{ goal: Goal }>(`/goals/${id}`, data);
    return res.data.goal;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/goals/${id}`);
    return res.data;
  },
  addContribution: async (goalId: number, data: { amount: number; note?: string; date?: string }) => {
    const res = await api.post<{ contribution: GoalContribution; goal: Goal }>(`/goals/${goalId}/contributions`, data);
    return res.data;
  },
  getContributions: async (goalId: number) => {
    const res = await api.get<{ contributions: GoalContribution[] }>(`/goals/${goalId}/contributions`);
    return res.data.contributions;
  },
  deleteContribution: async (goalId: number, contributionId: number) => {
    const res = await api.delete(`/goals/${goalId}/contributions/${contributionId}`);
    return res.data;
  },
};

export const billsApi = {
  getAll: async (params?: { status?: string; recurring?: boolean }) => {
    const res = await api.get<{ bills: Bill[] }>('/bills', { params });
    return res.data.bills;
  },
  create: async (data: Partial<Bill>) => {
    const res = await api.post<{ bill: Bill }>('/bills', data);
    return res.data.bill;
  },
  update: async (id: number, data: Partial<Bill>) => {
    const res = await api.put<{ bill: Bill }>(`/bills/${id}`, data);
    return res.data.bill;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/bills/${id}`);
    return res.data;
  },
  markAsPaid: async (id: number) => {
    const res = await api.post<{ bill: Bill }>(`/bills/${id}/pay`);
    return res.data.bill;
  },
  markAsUnpaid: async (id: number) => {
    const res = await api.post<{ bill: Bill }>(`/bills/${id}/unpay`);
    return res.data.bill;
  },
};

export const familyApi = {
  getAll: async () => {
    const res = await api.get<{ families: Family[] }>('/family');
    return res.data.families;
  },
  getById: async (id: number) => {
    const res = await api.get<{ family: Family }>(`/family/${id}`);
    return res.data.family;
  },
  create: async (data: { name: string; monthly_budget?: number }) => {
    const res = await api.post<{ family: Family }>('/family', data);
    return res.data.family;
  },
  update: async (id: number, data: Partial<Family>) => {
    const res = await api.put<{ family: Family }>(`/family/${id}`, data);
    return res.data.family;
  },
  addMember: async (familyId: number, data: { username_or_email?: string; role?: string; spending_limit?: number }) => {
    const res = await api.post<{ member: FamilyMember }>(`/family/${familyId}/members`, data);
    return res.data.member;
  },
  updateMember: async (familyId: number, memberId: number, data: { role?: string; spending_limit?: number }) => {
    const res = await api.put<{ member: FamilyMember }>(`/family/${familyId}/members/${memberId}`, data);
    return res.data.member;
  },
  removeMember: async (familyId: number, memberId: number) => {
    const res = await api.delete(`/family/${familyId}/members/${memberId}`);
    return res.data;
  },
  getSpending: async (familyId: number) => {
    const res = await api.get<{ spending: FamilyMemberSpending[] }>(`/family/${familyId}/spending`);
    return res.data.spending;
  },
};

export const analyticsApi = {
  getSummary: async () => {
    const res = await api.get<AnalyticsSummary>('/analytics/summary');
    return res.data;
  },
  getMonthly: async (months: number = 6) => {
    const res = await api.get<{ monthly_data?: MonthlyTrend[]; trends?: MonthlyTrend[] }>('/analytics/monthly', { params: { months } });
    return res.data.trends || res.data.monthly_data || [];
  },
  getCategories: async (params?: { month?: number; year?: number }) => {
    const res = await api.get<{ categories: CategorySpending[] }>('/analytics/categories', { params });
    return res.data.categories || [];
  },
  getDaily: async (params?: { month?: number; year?: number }) => {
    const res = await api.get<{ daily_spending?: DailyTrend[]; daily?: DailyTrend[] }>('/analytics/daily', { params });
    return res.data.daily || res.data.daily_spending || [];
  },
  getSavings: async (months: number = 6) => {
    const res = await api.get<{ savings_data?: { month: string; amount: number; rate: number }[]; savings?: { month: string; amount: number; rate: number }[] }>('/analytics/savings', { params: { months } });
    return res.data.savings || res.data.savings_data || [];
  },
  getInsights: async () => {
    const res = await api.get<{ insights: DynamicInsight[] }>('/analytics/insights');
    return res.data.insights || [];
  },
  getFamilySpending: async () => {
    const res = await api.get<{ family_spending: FamilyMemberSpending[] }>('/analytics/family-spending');
    return res.data.family_spending || [];
  },
};

export default api;
