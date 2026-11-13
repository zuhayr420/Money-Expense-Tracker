import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  Download,
  Calendar,
  X,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { transactionsApi, accountsApi, familyApi } from '../services/api';
import { Transaction, Account } from '../types';
import { useCurrency } from '../context/CurrencyContext';

const CATEGORIES = [
  'All Categories',
  'Food',
  'Shopping',
  'Transportation',
  'Healthcare',
  'Education',
  'Entertainment',
  'Housing',
  'Utilities',
  'Salary',
  'Investments',
  'Other',
];

export const Transactions: React.FC = () => {
  const { formatAmount, currentCurrency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [familyMembersList, setFamilyMembersList] = useState<string[]>(['All Members']);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedAccount, setSelectedAccount] = useState('All Accounts');
  const [selectedMember, setSelectedMember] = useState('All Members');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Food');
  const [editAccountId, setEditAccountId] = useState<number | ''>('');
  const [editFamilyMember, setEditFamilyMember] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('UPI');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState<'completed' | 'pending'>('completed');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txs, accs] = await Promise.all([
        transactionsApi.getAll({
          search: search.trim() || undefined,
          category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
          account_id: selectedAccount !== 'All Accounts' ? Number(selectedAccount) : undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
          family_member_name: selectedMember !== 'All Members' ? selectedMember : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        accountsApi.getAll(),
      ]);
      setTransactions(Array.isArray(txs) ? txs : []);
      setAccounts(Array.isArray(accs) ? accs : []);

      // Extract unique family members from transactions
      const names = new Set<string>();
      if (Array.isArray(txs)) {
        txs.forEach((t) => {
          if (t.family_member_name) names.add(t.family_member_name);
        });
      }
      setFamilyMembersList(['All Members', ...Array.from(names)]);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, selectedAccount, selectedMember, selectedType, startDate, endDate]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this transaction? Financial balances will be adjusted.')) {
      return;
    }
    try {
      await transactionsApi.delete(id);
      fetchData();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditDescription(tx.description);
    setEditCategory(tx.category);
    setEditAccountId(tx.account_id);
    setEditFamilyMember(tx.family_member_name);
    setEditPaymentMethod(tx.payment_method);
    setEditDate(tx.date);
    setEditStatus(tx.status as any);
    setEditType(tx.type);
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      setEditError('Enter a valid amount');
      return;
    }

    setSavingEdit(true);
    setEditError(null);
    try {
      await transactionsApi.update(editingTx.id, {
        amount: num,
        description: editDescription.trim(),
        category: editCategory,
        account_id: Number(editAccountId),
        family_member_name: editFamilyMember,
        payment_method: editPaymentMethod,
        date: editDate,
        status: editStatus,
        type: editType,
      });
      setEditModalOpen(false);
      fetchData();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update transaction');
    } finally {
      setSavingEdit(false);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['ID', 'Type', 'Description', 'Category', 'Amount', 'Date', 'Account', 'Member', 'Method', 'Status'];
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.amount,
      t.date,
      t.account_name || t.account_id,
      t.family_member_name,
      t.payment_method,
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Family_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All Categories');
    setSelectedAccount('All Accounts');
    setSelectedMember('All Members');
    setSelectedType('all');
    setStartDate('');
    setEndDate('');
  };

  // Aggregates for current filtered view
  const totalInflow = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflow = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow = totalInflow - totalOutflow;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Transactions Ledger
          </h1>
          <p className="text-xs text-[#8da399]">
            Comprehensive family financial history, categorical filtering, and ledger management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 rounded-lg border border-[#142a1f] bg-[#0a1711] px-3.5 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filtered Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-panel rounded-xl p-4.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Filtered Inflow</span>
          <h2 className="mt-1 text-xl font-bold text-[#34d399]">{formatAmount(totalInflow)}</h2>
          <span className="text-xs text-[#8da399]">
            {transactions.filter((t) => t.type === 'income').length} credits
          </span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-4.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Filtered Outflow</span>
          <h2 className="mt-1 text-xl font-bold text-red-400">{formatAmount(totalOutflow)}</h2>
          <span className="text-xs text-[#8da399]">
            {transactions.filter((t) => t.type === 'expense').length} debits
          </span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-4.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Net Filtered Cashflow</span>
          <h2 className={`mt-1 text-xl font-bold ${netFlow >= 0 ? 'text-[#34d399]' : 'text-red-400'}`}>
            {formatAmount(netFlow)}
          </h2>
          <span className="text-xs text-[#8da399]">
            {transactions.length} total entries shown
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="liquid-glass-panel rounded-xl p-4.5 space-y-4">
        {/* Top search & type row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#5d7c6e]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description, merchant, or notes..."
              className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] pl-10 pr-4 py-2 text-xs text-white placeholder-[#5d7c6e] focus:border-[#10b981] focus:outline-hidden"
            />
          </div>

          <div className="sm:col-span-6 flex items-center space-x-2">
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#050e09] p-1 border border-[#142a1f] w-full">
              <button
                onClick={() => setSelectedType('all')}
                className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  selectedType === 'all' ? 'bg-[#10b981] text-[#041009] font-bold' : 'text-[#8da399] hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('income')}
                className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  selectedType === 'income' ? 'bg-[#10b981] text-[#041009] font-bold' : 'text-[#8da399] hover:text-white'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setSelectedType('expense')}
                className={`rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  selectedType === 'expense' ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/40' : 'text-[#8da399] hover:text-white'
                }`}
              >
                Expense
              </button>
            </div>

            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="rounded-lg border border-[#142a1f] bg-[#0a1711] p-2 text-[#8da399] hover:bg-[#0f231a] hover:text-white cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#142a1f]">
          <div>
            <label className="block text-[10px] font-semibold text-[#5d7c6e] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-1.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#5d7c6e] uppercase tracking-wider mb-1">
              Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-1.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
            >
              <option value="All Accounts">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#5d7c6e] uppercase tracking-wider mb-1">
              Family Member
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-1.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
            >
              {familyMembersList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#5d7c6e] uppercase tracking-wider mb-1">
              Date Filter
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-1.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="liquid-glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#142a1f] bg-[#050e09] text-[#5d7c6e]">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Description</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Account</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px]">Family Member</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Amount</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-center">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#142a1f]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#8da399]">
                    Loading transactions ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#8da399]">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#0c1f15] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`rounded-md p-1.5 ${
                            tx.type === 'income'
                              ? 'bg-[#10b981]/15 text-[#34d399]'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{tx.description}</p>
                          <p className="text-[10px] text-[#5d7c6e]">{tx.payment_method}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded-md border border-[#142a1f] bg-[#050e09] px-2 py-0.5 text-[11px] text-[#8da399]">
                        {tx.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#8da399]">
                      {tx.account_name || `Account #${tx.account_id}`}
                    </td>

                    <td className="py-3 px-4 text-[#5d7c6e]">{tx.date}</td>

                    <td className="py-3 px-4 text-[#8da399]">{tx.family_member_name}</td>

                    <td
                      className={`py-3 px-4 text-right font-bold font-mono ${
                        tx.type === 'income' ? 'text-[#34d399]' : 'text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatAmount(tx.amount)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                          tx.status === 'completed'
                            ? 'border-[#142a1f] bg-[#0a1a12] text-[#34d399]'
                            : 'border-amber-500/40 bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEdit(tx)}
                          className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-red-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditModalOpen(false)} />
          <div className="relative w-full max-w-lg liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <h3 className="text-base font-bold text-white">Edit Transaction #{editingTx?.id}</h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 flex items-center space-x-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as any)}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">
                    Amount ({currentCurrency.symbol})
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">Account</label>
                  <select
                    value={editAccountId}
                    onChange={(e) => setEditAccountId(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">Family Member</label>
                  <input
                    type="text"
                    value={editFamilyMember}
                    onChange={(e) => setEditFamilyMember(e.target.value)}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8da399] mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#142a1f]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg border border-[#142a1f] bg-[#0a1711] px-4 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center space-x-1.5 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{savingEdit ? 'Saving...' : 'Update Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
