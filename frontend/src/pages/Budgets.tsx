import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Check,
  Calendar,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { budgetsApi } from '../services/api';
import { Budget } from '../types';
import { useCurrency } from '../context/CurrencyContext';

const DEFAULT_CATEGORIES = [
  'Food',
  'Shopping',
  'Transportation',
  'Healthcare',
  'Education',
  'Entertainment',
  'Housing',
  'Utilities',
  'Personal Care',
  'Other',
];

export const Budgets: React.FC = () => {
  const { formatAmount, currentCurrency } = useCurrency();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(11); // November
  const [selectedYear, setSelectedYear] = useState(2026);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState('Food');
  const [allocated, setAllocated] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetsApi.getAll({ month: selectedMonth, year: selectedYear });
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
    const handleUpdate = () => fetchBudgets();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, [selectedMonth, selectedYear]);

  const openCreateModal = () => {
    setEditingBudget(null);
    setCategory('Food');
    setAllocated('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategory(b.category);
    setAllocated(b.allocated.toString());
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(allocated);
    if (isNaN(num) || num <= 0) {
      setError('Please provide a valid allocation amount');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingBudget) {
        await budgetsApi.update(editingBudget.id, {
          category,
          allocated: num,
        });
      } else {
        await budgetsApi.create({
          category,
          allocated: num,
          month: selectedMonth,
          year: selectedYear,
        });
      }
      setModalOpen(false);
      fetchBudgets();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this budget category?')) return;
    try {
      await budgetsApi.delete(id);
      fetchBudgets();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err) {
      console.error('Failed to delete budget:', err);
    }
  };

  // Aggregates
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalRemaining = Math.max(totalAllocated - totalSpent, 0);
  const overallUtilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const overBudgetCategories = budgets.filter((b) => (b.spent || 0) > b.allocated);
  const nearLimitCategories = budgets.filter((b) => {
    const pct = b.allocated > 0 ? ((b.spent || 0) / b.allocated) * 100 : 0;
    return pct >= 80 && pct <= 100;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Budget Management & Spending Limits
          </h1>
          <p className="text-xs text-[#64748b]">
            Enforce family discipline with categorical ceilings and active threshold warnings
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Month / Year selector */}
          <div className="flex items-center space-x-2 rounded-lg border border-[#142a1f] bg-[#050e09] p-1.5">
            <Calendar className="h-4 w-4 text-[#5d7c6e] ml-1.5" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-white focus:outline-hidden"
            >
              <option value={9} className="bg-[#050e09]">September 2026</option>
              <option value={10} className="bg-[#050e09]">October 2026</option>
              <option value={11} className="bg-[#050e09]">November 2026</option>
              <option value={12} className="bg-[#050e09]">December 2026</option>
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* Warning Banners if any exceeded */}
      {overBudgetCategories.length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-400">Budget Limit Exceeded</h4>
              <p className="text-xs text-[#cbd5e1] mt-0.5">
                The following categories have surpassed their monthly spending caps:{' '}
                <span className="font-semibold text-white">
                  {overBudgetCategories.map((b) => `${b.category} (${formatAmount((b.spent || 0) - b.allocated)} over)`).join(', ')}
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Total Budget Cap</span>
          <h2 className="mt-2 text-2xl font-bold text-white">{formatAmount(totalAllocated)}</h2>
          <span className="text-xs text-[#8da399]">{budgets.length} assigned categories</span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Total Spent So Far</span>
          <h2 className="mt-2 text-2xl font-bold text-white">{formatAmount(totalSpent)}</h2>
          <span className="text-xs text-[#8da399]">Computed from actual ledger</span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Remaining Cushion</span>
          <h2 className="mt-2 text-2xl font-bold text-[#34d399]">{formatAmount(totalRemaining)}</h2>
          <span className="text-xs text-[#8da399]">Available before month-end</span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Overall Utilization</span>
          <h2 className="mt-2 text-2xl font-bold text-white">{overallUtilization}%</h2>
          <div className="mt-2 h-1.5 w-full rounded-md bg-[#050e09] overflow-hidden border border-[#142a1f]">
            <div
              className={`h-full rounded-sm ${
                overallUtilization > 100
                  ? 'bg-red-500'
                  : overallUtilization >= 80
                  ? 'bg-amber-400'
                  : 'bg-[#10b981]'
              }`}
              style={{ width: `${Math.min(overallUtilization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Budgets List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-[#142a1f] bg-[#08140e]/60 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#10b981]/15 text-[#34d399] mb-4">
              <PieIcon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Monthly Budgets Configured</h3>
            <p className="text-xs text-[#8da399] max-w-sm mx-auto mt-1 mb-6">
              Establish monthly spending limits on Food, Shopping, Transport, and Utilities to prevent overspending.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create First Budget Cap</span>
            </button>
          </div>
        ) : (
          budgets.map((b) => {
          const spent = b.spent || 0;
          const isOver = spent > b.allocated;
          const pct = b.allocated > 0 ? Math.round((spent / b.allocated) * 100) : 0;
          const isWarning = pct >= 80 && !isOver;

          return (
            <div
              key={b.id}
              className={`liquid-glass-panel rounded-xl p-5 flex flex-col justify-between ${
                isOver
                  ? '!border-red-500/40 !bg-[rgba(25,10,14,0.7)]'
                  : isWarning
                  ? '!border-amber-500/40 !bg-[rgba(25,20,10,0.7)]'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`rounded-lg p-2 ${
                        isOver
                          ? 'bg-red-500/20 text-red-400'
                          : isWarning
                          ? 'bg-amber-400/20 text-amber-400'
                          : 'bg-[#10b981]/15 text-[#34d399]'
                      }`}
                    >
                      <PieIcon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{b.category}</h3>
                      <p className="text-[10px] text-[#5d7c6e]">Monthly target ceiling</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-red-400 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-[#5d7c6e]">Spent</span>
                      <p className="text-lg font-bold font-mono text-white">{formatAmount(spent)}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#5d7c6e]">Budget</span>
                      <p className="text-sm font-semibold font-mono text-[#8da399]">{formatAmount(b.allocated)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-md bg-[#050e09] overflow-hidden border border-[#142a1f]">
                    <div
                      className={`h-full rounded-sm transition-all duration-500 ${
                        isOver
                          ? 'bg-red-500'
                          : isWarning
                          ? 'bg-amber-400'
                          : 'bg-[#10b981]'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span
                      className={`font-semibold ${
                        isOver ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-[#34d399]'
                      }`}
                    >
                      {pct}% utilized
                    </span>
                    <span className="text-[#8da399]">
                      {isOver
                        ? `${formatAmount(spent - b.allocated)} over`
                        : `${formatAmount(b.allocated - spent)} remaining`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-[#142a1f] flex items-center justify-between text-xs">
                <span className="text-[#5d7c6e]">Status</span>
                <span
                  className={`font-semibold ${
                    isOver
                      ? 'text-red-400'
                      : isWarning
                      ? 'text-amber-400'
                      : 'text-[#34d399]'
                  }`}
                >
                  {isOver ? 'Exceeded Budget' : isWarning ? 'Approaching Limit' : 'Within Budget'}
                </span>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Modal for creating / editing budget */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <h3 className="text-base font-bold text-white">
                {editingBudget ? 'Update Budget Allocation' : 'Set Monthly Budget'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center space-x-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Budget Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Monthly Allocation ({currentCurrency.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={allocated}
                  onChange={(e) => setAllocated(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#142a1f]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-[#142a1f] bg-[#0a1711] px-4 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-1.5 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : editingBudget ? 'Update Budget' : 'Set Budget'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
