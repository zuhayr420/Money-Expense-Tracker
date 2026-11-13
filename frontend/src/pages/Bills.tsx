import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  Zap,
  Repeat,
  AlertCircle,
} from 'lucide-react';
import { billsApi } from '../services/api';
import { Bill } from '../types';
import { useCurrency } from '../context/CurrencyContext';

const BILL_CATEGORIES = [
  'Housing',
  'Utilities',
  'Entertainment',
  'Insurance',
  'Fitness',
  'Subscription',
  'Loan EMI',
  'Other',
];

export const Bills: React.FC = () => {
  const { formatAmount, currentCurrency } = useCurrency();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [recurrence, setRecurrence] = useState<Bill['recurrence']>('monthly');
  const [autoPay, setAutoPay] = useState(false);
  const [status, setStatus] = useState<'pending' | 'paid' | 'overdue'>('pending');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await billsApi.getAll();
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bills:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
    const handleUpdate = () => fetchBills();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, []);

  const openCreateModal = () => {
    setEditingBill(null);
    setName('');
    setAmount('');
    setCategory('Utilities');
    setDueDate(new Date().toISOString().split('T')[0]);
    setIsRecurring(true);
    setRecurrence('monthly');
    setAutoPay(false);
    setStatus('pending');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: Bill) => {
    setEditingBill(b);
    setName(b.name);
    setAmount(b.amount.toString());
    setCategory(b.category);
    setDueDate(b.due_date);
    setIsRecurring(b.is_recurring);
    setRecurrence(b.recurrence);
    setAutoPay(b.auto_pay);
    setStatus(b.status);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!name.trim() || isNaN(num) || num <= 0 || !dueDate) {
      setError('Please provide a valid bill name, amount, and due date');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editingBill) {
        await billsApi.update(editingBill.id, {
          name: name.trim(),
          amount: num,
          category,
          due_date: dueDate,
          is_recurring: isRecurring,
          recurrence,
          auto_pay: autoPay,
          status,
        });
      } else {
        await billsApi.create({
          name: name.trim(),
          amount: num,
          category,
          due_date: dueDate,
          is_recurring: isRecurring,
          recurrence,
          auto_pay: autoPay,
          status,
        });
      }
      setModalOpen(false);
      fetchBills();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const togglePayStatus = async (bill: Bill) => {
    try {
      if (bill.status === 'paid') {
        await billsApi.markAsUnpaid(bill.id);
      } else {
        await billsApi.markAsPaid(bill.id);
      }
      fetchBills();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err) {
      console.error('Failed to toggle pay status:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this bill commitment?')) return;
    try {
      await billsApi.delete(id);
      fetchBills();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err) {
      console.error('Failed to delete bill:', err);
    }
  };

  // Calculations
  const totalMonthlyCommitment = bills.reduce((sum, b) => sum + b.amount, 0);
  const paidAmount = bills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
  const pendingAmount = bills.filter((b) => b.status !== 'paid').reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Bills & Subscriptions
          </h1>
          <p className="text-xs text-[#8da399]">
            Track automated debits, utility dues, insurance policies, and recurring family subscriptions
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Recurring Bill</span>
        </button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Monthly Fixed Outflow</span>
          <h2 className="mt-2 text-2xl font-bold text-white">{formatAmount(totalMonthlyCommitment)}</h2>
          <span className="text-xs text-[#8da399]">{bills.length} active recurring commitments</span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Cleared / Paid This Month</span>
          <h2 className="mt-2 text-2xl font-bold text-[#34d399]">{formatAmount(paidAmount)}</h2>
          <span className="text-xs text-[#10b981]">
            {bills.filter((b) => b.status === 'paid').length} bills settled
          </span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Upcoming Pending Dues</span>
          <h2 className="mt-2 text-2xl font-bold text-amber-400">{formatAmount(pendingAmount)}</h2>
          <span className="text-xs text-[#8da399]">
            {bills.filter((b) => b.status !== 'paid').length} payments awaiting clearance
          </span>
        </div>
      </div>

      {/* Bills Ledger Table */}
      <div className="liquid-glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#142a1f] bg-[#050e09] text-[#5d7c6e]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Bill Name</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Cadence</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Due Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Auto-Pay</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Amount</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142a1f]">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 mb-3">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-white">No Bills or Subscriptions Tracked</p>
                    <p className="text-xs text-[#8da399] mt-1 max-w-sm mx-auto mb-4">
                      Add recurring utility bills, internet subscriptions, rent, insurance, or streaming platforms.
                    </p>
                    <button
                      onClick={openCreateModal}
                      className="inline-flex items-center space-x-1.5 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Add Recurring Bill</span>
                    </button>
                  </td>
                </tr>
              ) : (
                bills.map((bill) => {
                const isPaid = bill.status === 'paid';
                return (
                  <tr key={bill.id} className="hover:bg-[#0c1f15] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`rounded-md p-1.5 ${
                            isPaid
                              ? 'bg-[#10b981]/15 text-[#34d399]'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{bill.name}</p>
                          <p className="text-[10px] text-[#5d7c6e]">ID #{bill.id}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded-md border border-[#142a1f] bg-[#050e09] px-2 py-0.5 text-[11px] text-[#8da399]">
                        {bill.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#8da399] capitalize">
                      <span className="inline-flex items-center space-x-1">
                        <Repeat className="h-3 w-3 text-[#5d7c6e]" />
                        <span>{bill.recurrence}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#5d7c6e]">{bill.due_date}</td>

                    <td className="py-3 px-4">
                      {bill.auto_pay ? (
                        <span className="inline-flex items-center space-x-1 text-[#34d399] font-semibold text-xs">
                          <Zap className="h-3 w-3 fill-current" />
                          <span>Enabled</span>
                        </span>
                      ) : (
                        <span className="text-[#5d7c6e] text-xs">Manual</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-bold font-mono text-white">
                      {formatAmount(bill.amount)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => togglePayStatus(bill)}
                        className={`inline-flex items-center space-x-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition-colors cursor-pointer ${
                          isPaid
                            ? 'border-[#142a1f] bg-[#0a1a12] text-[#34d399] hover:bg-[#102d1f]'
                            : 'border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                        }`}
                      >
                        {isPaid ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        <span className="capitalize">{bill.status}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(bill)}
                          className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(bill.id)}
                          className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-red-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <h3 className="text-base font-bold text-white">
                {editingBill ? 'Edit Recurring Bill' : 'Add Bill / Subscription'}
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
                  Bill or Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Netflix Premium, Electricity BESCOM"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">
                    Amount ({currentCurrency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  >
                    {BILL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">Recurrence</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="autopay"
                  checked={autoPay}
                  onChange={(e) => setAutoPay(e.target.checked)}
                  className="rounded border-[#142a1f] text-[#10b981] focus:ring-0"
                />
                <label htmlFor="autopay" className="text-xs text-[#cbd5e1] cursor-pointer">
                  Auto-pay enabled with connected bank account
                </label>
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
                  <span>{saving ? 'Saving...' : editingBill ? 'Update Bill' : 'Save Bill'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
