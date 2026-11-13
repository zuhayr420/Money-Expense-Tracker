import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieIcon,
  Calendar,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts';
import { analyticsApi } from '../services/api';
import {
  AnalyticsSummary,
  CategorySpending,
  MonthlyTrend,
  DynamicInsight,
  FamilyMemberSpending,
} from '../types';
import { useCurrency } from '../context/CurrencyContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export const Insights: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [categories, setCategories] = useState<CategorySpending[]>([]);
  const [insights, setInsights] = useState<DynamicInsight[]>([]);
  const [familySpending, setFamilySpending] = useState<FamilyMemberSpending[]>([]);
  const [savingsTrend, setSavingsTrend] = useState<{ month: string; amount: number; rate: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [sum, tr, cats, ins, fam, sav] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getMonthly(6),
        analyticsApi.getCategories(),
        analyticsApi.getInsights(),
        analyticsApi.getFamilySpending(),
        analyticsApi.getSavings(6),
      ]);
      setSummary(sum || null);
      setTrends(Array.isArray(tr) ? tr : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setInsights(Array.isArray(ins) ? ins : []);
      setFamilySpending(Array.isArray(fam) ? fam : []);
      setSavingsTrend(Array.isArray(sav) ? sav : []);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const handleUpdate = () => fetchAnalytics();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, []);

  const getInsightIcon = (type: DynamicInsight['type']) => {
    switch (type) {
      case 'warning':
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-[#34d399]" />;
      default:
        return <Sparkles className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-[#10b981]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#34d399]">
              Algorithmic Analytics Engine
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
            Financial Insights & Intelligence
          </h1>
          <p className="text-xs text-[#8da399]">
            Deep-dive into income vs burn trajectory, categorical leakages, and family capital velocity
          </p>
        </div>
      </div>

      {/* Dynamic AI Financial Insights Banner Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">
          System Intelligence & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((item, index) => (
            <div
              key={index}
              className="liquid-glass-panel rounded-xl p-4.5 flex items-start space-x-3.5"
            >
              <div className="mt-0.5 rounded-lg bg-[#050e09] p-2.5 shrink-0 border border-[#142a1f]">
                {getInsightIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                <p className="mt-1 text-xs text-[#8da399] leading-relaxed">{item.message}</p>
                {item.metric && (
                  <span className="mt-2 inline-block rounded-md border border-[#142a1f] bg-[#0a1a12] px-2 py-0.5 text-[10px] font-bold text-[#34d399]">
                    {item.metric}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Row 1: Long-term Cashflow Trajectory & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Multi-Month Trend */}
        <div className="liquid-glass-panel rounded-xl p-5 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#142a1f]">
            <div>
              <h3 className="text-sm font-bold text-white">6-Month Capital Flow</h3>
              <p className="text-xs text-[#5d7c6e]">Inflow vs Outflow comparison</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                <span className="text-[#8da399]">Income</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-[#8da399]">Expenses</span>
              </div>
            </div>
          </div>

          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="incomeArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#234233" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#234233"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#050e09',
                    border: '1px solid #142a1f',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [formatAmount(Number(val)), '']}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#incomeArea)" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenseArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Highest Spending Categories */}
        <div className="liquid-glass-panel rounded-xl p-5">
          <div className="pb-4 border-b border-[#142a1f]">
            <h3 className="text-sm font-bold text-white">Highest Expense Categories</h3>
            <p className="text-xs text-[#5d7c6e]">Ranked by magnitude this month</p>
          </div>

          <div className="mt-4 space-y-3.5">
            {categories.slice(0, 6).map((cat, idx) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-[#5d7c6e]">#{idx + 1}</span>
                    <span className="font-semibold text-white">{cat.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold font-mono text-white">{formatAmount(cat.amount)}</span>
                    <span className="text-[10px] text-[#5d7c6e]">({cat.percentage}%)</span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-md bg-[#050e09] overflow-hidden border border-[#142a1f]">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Row 2: Savings Velocity & Family Spending Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Savings Growth Trend */}
        <div className="liquid-glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
            <div>
              <h3 className="text-sm font-bold text-white">Monthly Net Savings Trend</h3>
              <p className="text-xs text-[#5d7c6e]">Net surplus preserved month-over-month</p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-[#34d399] font-semibold">
              <TrendingUp className="h-4 w-4" />
              <span>Positive Growth</span>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsTrend}>
                <XAxis dataKey="month" stroke="#234233" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#234233"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#050e09',
                    border: '1px solid #142a1f',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [formatAmount(Number(val)), 'Net Savings']}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Family Member Spending Breakdown */}
        <div className="liquid-glass-panel rounded-xl p-5">
          <div className="pb-4 border-b border-[#142a1f]">
            <h3 className="text-sm font-bold text-white">Family Expenditure Distribution</h3>
            <p className="text-xs text-[#5d7c6e]">Per-member spending against assigned limits</p>
          </div>

          <div className="mt-4 space-y-4">
            {familySpending.map((mem) => {
              const isOver = mem.limit > 0 && mem.spent > mem.limit;
              return (
                <div key={mem.member_name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{mem.member_name}</span>
                      <span className="ml-2 rounded-md border border-[#142a1f] bg-[#050e09] px-1.5 py-0.5 text-[10px] text-[#8da399] capitalize">
                        {mem.role}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-white">{formatAmount(mem.spent)}</span>
                      {mem.limit > 0 && (
                        <span className="text-[10px] text-[#5d7c6e]"> / {formatAmount(mem.limit)}</span>
                      )}
                    </div>
                  </div>

                  {mem.limit > 0 && (
                    <div className="h-1.5 w-full rounded-md bg-[#050e09] overflow-hidden border border-[#142a1f]">
                      <div
                        className={`h-full rounded-sm ${
                          isOver ? 'bg-red-500' : mem.percentage >= 80 ? 'bg-amber-400' : 'bg-[#10b981]'
                        }`}
                        style={{ width: `${Math.min(mem.percentage, 100)}%` }}
                      />
                    </div>
                  )}

                  <div className="flex justify-between text-[10px] text-[#5d7c6e]">
                    <span>{mem.percentage}% of spending limit</span>
                    {isOver && <span className="text-red-400 font-semibold">Over Limit!</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
