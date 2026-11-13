import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  PiggyBank,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Coins,
  History,
  TrendingUp,
} from 'lucide-react';
import { goalsApi } from '../services/api';
import { Goal, GoalContribution } from '../types';
import { useCurrency } from '../context/CurrencyContext';

const GOAL_ICONS = ['target', 'car', 'home', 'plane', 'graduation-cap', 'shield', 'heart', 'gem'];
const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const Goals: React.FC = () => {
  const { formatAmount, currentCurrency } = useCurrency();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Goal Modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goalColor, setGoalColor] = useState('#10b981');
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  // Contribute Modal
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [contribDate, setContribDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [savingContrib, setSavingContrib] = useState(false);
  const [contribError, setContribError] = useState<string | null>(null);

  // Contribution History Drawer/Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [contributionsList, setContributionsList] = useState<GoalContribution[]>([]);
  const [historyGoalName, setHistoryGoalName] = useState('');

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await goalsApi.getAll();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
    const handleUpdate = () => fetchGoals();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, []);

  const openCreateGoal = () => {
    setEditingGoal(null);
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setTargetDate('');
    setGoalColor('#10b981');
    setGoalError(null);
    setGoalModalOpen(true);
  };

  const openEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setGoalName(g.name);
    setTargetAmount(g.target_amount.toString());
    setCurrentAmount(g.current_amount.toString());
    setTargetDate(g.target_date || '');
    setGoalColor(g.color || '#10b981');
    setGoalError(null);
    setGoalModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(targetAmount);
    const currentNum = parseFloat(currentAmount) || 0;

    if (!goalName.trim() || isNaN(targetNum) || targetNum <= 0) {
      setGoalError('Please enter a valid goal name and target amount');
      return;
    }

    setSavingGoal(true);
    setGoalError(null);
    try {
      if (editingGoal) {
        await goalsApi.update(editingGoal.id, {
          name: goalName.trim(),
          target_amount: targetNum,
          current_amount: currentNum,
          target_date: targetDate || undefined,
          color: goalColor,
        });
      } else {
        await goalsApi.create({
          name: goalName.trim(),
          target_amount: targetNum,
          current_amount: currentNum,
          target_date: targetDate || undefined,
          color: goalColor,
        });
      }
      setGoalModalOpen(false);
      fetchGoals();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err: any) {
      setGoalError(err.response?.data?.error || 'Failed to save goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    if (!window.confirm('Delete this goal and all associated contributions?')) return;
    try {
      await goalsApi.delete(id);
      fetchGoals();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const openContribute = (g: Goal) => {
    setSelectedGoal(g);
    setContribAmount('');
    setContribNote('');
    setContribDate(new Date().toISOString().split('T')[0]);
    setContribError(null);
    setContributeModalOpen(true);
  };

  const handleSaveContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const num = parseFloat(contribAmount);
    if (isNaN(num) || num <= 0) {
      setContribError('Enter a valid contribution amount');
      return;
    }

    setSavingContrib(true);
    setContribError(null);
    try {
      await goalsApi.addContribution(selectedGoal.id, {
        amount: num,
        note: contribNote.trim(),
        date: contribDate,
      });
      setContributeModalOpen(false);
      fetchGoals();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err: any) {
      setContribError(err.response?.data?.error || 'Failed to deposit contribution');
    } finally {
      setSavingContrib(false);
    }
  };

  const openHistory = async (g: Goal) => {
    try {
      const data = await goalsApi.getContributions(g.id);
      setContributionsList(data);
      setHistoryGoalName(g.name);
      setHistoryModalOpen(true);
    } catch (err) {
      console.error('Failed to load contributions history:', err);
    }
  };

  // Aggregates
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Savings Goals & Future Assets
          </h1>
          <p className="text-xs text-[#8da399]">
            Track multi-year milestones, emergency cushions, and automated capital deposits
          </p>
        </div>
        <button
          onClick={openCreateGoal}
          className="flex items-center space-x-2 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Aggregate Progress Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Cumulative Target</span>
          <h2 className="mt-2 text-2xl font-bold text-white">{formatAmount(totalTarget)}</h2>
          <span className="text-xs text-[#8da399]">{goals.length} target milestones</span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Total Saved To Date</span>
          <h2 className="mt-2 text-2xl font-bold text-[#34d399]">{formatAmount(totalSaved)}</h2>
          <span className="text-xs text-[#10b981]">Allocated in dedicated funds</span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Overall Fulfillment</span>
          <h2 className="mt-2 text-2xl font-bold text-white">{overallProgress}%</h2>
          <div className="mt-2 h-1.5 w-full rounded-md bg-[#050e09] overflow-hidden border border-[#142a1f]">
            <div
              className="h-full rounded-sm bg-[#10b981]"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-[#142a1f] bg-[#08140e]/60 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#10b981]/15 text-[#34d399] mb-4">
              <PiggyBank className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Savings Goals Set</h3>
            <p className="text-xs text-[#8da399] max-w-sm mx-auto mt-1 mb-6">
              Create dedicated target funds for Emergency Cushion, Vacation, Home Purchase, or Education.
            </p>
            <button
              onClick={openCreateGoal}
              className="inline-flex items-center space-x-2 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create First Savings Goal</span>
            </button>
          </div>
        ) : (
          goals.map((g) => {
          const isCompleted = g.current_amount >= g.target_amount;
          const remaining = Math.max(g.target_amount - g.current_amount, 0);

          return (
            <div
              key={g.id}
              className="liquid-glass-panel rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="rounded-lg p-2.5 text-white shadow-xs"
                      style={{ backgroundColor: g.color || '#10b981' }}
                    >
                      <PiggyBank className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{g.name}</h3>
                      <p className="text-[10px] text-[#5d7c6e]">
                        {g.target_date ? `Target: ${g.target_date}` : 'Ongoing Savings'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openHistory(g)}
                      className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-[#34d399] cursor-pointer"
                      title="Contribution History"
                    >
                      <History className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openEditGoal(g)}
                      className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white cursor-pointer"
                      title="Edit Goal"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-red-400 cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-[#5d7c6e]">Saved</span>
                      <p className="text-lg font-bold font-mono text-[#34d399]">
                        {formatAmount(g.current_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#5d7c6e]">Target</span>
                      <p className="text-sm font-semibold font-mono text-[#cbd5e1]">
                        {formatAmount(g.target_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-md bg-[#050e09] overflow-hidden border border-[#142a1f]">
                    <div
                      className="h-full rounded-sm bg-[#10b981] transition-all duration-500"
                      style={{ width: `${Math.min(g.progress, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-semibold text-white">{g.progress}% achieved</span>
                    <span className="text-[#8da399]">{formatAmount(remaining)} left</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#142a1f] flex items-center justify-between">
                <span
                  className={`inline-flex items-center text-xs font-semibold ${
                    isCompleted ? 'text-[#34d399]' : 'text-[#8da399]'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Target Achieved!
                    </>
                  ) : (
                    'In Progress'
                  )}
                </span>

                <button
                  onClick={() => openContribute(g)}
                  className="flex items-center space-x-1.5 rounded-lg border border-[#142a1f] bg-[#0a1711] px-3 py-1.5 text-xs font-semibold text-[#34d399] hover:bg-[#0f231a] transition-colors cursor-pointer"
                >
                  <Coins className="h-3.5 w-3.5" />
                  <span>+ Add Funds</span>
                </button>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Create / Edit Goal Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setGoalModalOpen(false)} />
          <div className="relative w-full max-w-md liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <h3 className="text-base font-bold text-white">
                {editingGoal ? 'Edit Savings Goal' : 'Create New Goal'}
              </h3>
              <button
                onClick={() => setGoalModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {goalError && (
              <div className="mt-4 flex items-center space-x-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{goalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. New Luxury Car, Maldives Family Trip"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">
                    Target ({currentCurrency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">
                    Current Deposit ({currentCurrency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">Color Accent</label>
                <div className="flex items-center space-x-2 pt-1">
                  {GOAL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGoalColor(c)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        goalColor === c
                          ? 'scale-110 ring-2 ring-[#34d399] ring-offset-2 ring-offset-[#08140e]'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#142a1f]">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="rounded-lg border border-[#142a1f] bg-[#0a1711] px-4 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGoal}
                  className="flex items-center space-x-1.5 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{savingGoal ? 'Saving...' : editingGoal ? 'Update Goal' : 'Save Goal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contribution Modal */}
      {contributeModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setContributeModalOpen(false)} />
          <div className="relative w-full max-w-md liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <div>
                <h3 className="text-base font-bold text-white">Deposit to {selectedGoal.name}</h3>
                <p className="text-xs text-[#8da399]">Add contribution to savings balance</p>
              </div>
              <button
                onClick={() => setContributeModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {contribError && (
              <div className="mt-4 flex items-center space-x-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{contribError}</span>
              </div>
            )}

            <form onSubmit={handleSaveContribution} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Deposit Amount ({currentCurrency.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">Deposit Date</label>
                <input
                  type="date"
                  value={contribDate}
                  onChange={(e) => setContribDate(e.target.value)}
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">Note / Source</label>
                <input
                  type="text"
                  value={contribNote}
                  onChange={(e) => setContribNote(e.target.value)}
                  placeholder="e.g. Monthly SIP, Diwali Bonus Allocation"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#142a1f]">
                <button
                  type="button"
                  onClick={() => setContributeModalOpen(false)}
                  className="rounded-lg border border-[#142a1f] bg-[#0a1711] px-4 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingContrib}
                  className="flex items-center space-x-1.5 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{savingContrib ? 'Processing...' : 'Deposit Funds'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contributions History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setHistoryModalOpen(false)} />
          <div className="relative w-full max-w-lg liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <div>
                <h3 className="text-base font-bold text-white">{historyGoalName} Contributions</h3>
                <p className="text-xs text-[#8da399]">Historical deposits record</p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
              {contributionsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8da399]">
                  No contributions deposited yet.
                </div>
              ) : (
                contributionsList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#050e09] border border-[#142a1f]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{item.note || 'Direct deposit'}</p>
                      <p className="text-[10px] text-[#5d7c6e]">{item.date}</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-[#34d399]">
                      +{formatAmount(item.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#142a1f] text-right">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-lg border border-[#142a1f] bg-[#0a1711] px-4 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
