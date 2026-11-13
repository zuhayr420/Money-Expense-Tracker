import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  CreditCard,
  Building2,
  Briefcase,
  Users,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { accountsApi } from '../services/api';
import { Account } from '../types';
import { useCurrency } from '../context/CurrencyContext';

const ACCOUNT_ICONS: Record<string, any> = {
  savings: Building2,
  current: Briefcase,
  cash: Wallet,
  credit_card: CreditCard,
  joint: Users,
};

const ACCOUNT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f97316', // orange
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export const Accounts: React.FC = () => {
  const { formatAmount } = useCurrency();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<Account['account_type']>('savings');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#10b981');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsApi.getAll();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const handleUpdate = () => fetchAccounts();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, []);

  const openCreateModal = () => {
    setEditingAccount(null);
    setName('');
    setAccountType('savings');
    setBalance('');
    setColor('#10b981');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setAccountType(acc.account_type);
    setBalance(acc.balance.toString());
    setColor(acc.color || '#10b981');
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an account name');
      return;
    }

    const numBalance = parseFloat(balance) || 0;
    setSaving(true);
    setError(null);

    try {
      if (editingAccount) {
        await accountsApi.update(editingAccount.id, {
          name: name.trim(),
          account_type: accountType,
          balance: numBalance,
          color,
        });
      } else {
        await accountsApi.create({
          name: name.trim(),
          account_type: accountType,
          balance: numBalance,
          color,
          icon: accountType,
        });
      }
      setModalOpen(false);
      fetchAccounts();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await accountsApi.delete(id);
      fetchAccounts();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err) {
      console.error('Failed to delete account:', err);
    }
  };

  // Financial aggregates
  const totalAssets = accounts
    .filter((a) => a.account_type !== 'credit_card' && a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.account_type === 'credit_card' || a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netLiquidity = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Accounts & Vaults
          </h1>
          <p className="text-xs text-[#8da399]">
            Manage liquid bank accounts, cash reserves, credit lines, and joint family funds
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Aggregate Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Net Liquid Worth</span>
          <h2 className="mt-2 text-2xl font-bold text-[#34d399]">{formatAmount(netLiquidity)}</h2>
          <span className="text-xs text-[#8da399]">Across all active accounts</span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Total Liquid Assets</span>
          <h2 className="mt-2 text-2xl font-bold text-white">{formatAmount(totalAssets)}</h2>
          <span className="text-xs text-[#10b981]">Savings, Current & Cash</span>
        </div>

        <div className="liquid-glass-panel rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e]">Credit Liabilities</span>
          <h2 className="mt-2 text-2xl font-bold text-red-400">{formatAmount(totalLiabilities)}</h2>
          <span className="text-xs text-[#8da399]">Credit cards & outstanding overdrafts</span>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-[#142a1f] bg-[#08140e]/60 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#10b981]/15 text-[#34d399] mb-4">
              <Wallet className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Financial Accounts Yet</h3>
            <p className="text-xs text-[#8da399] max-w-sm mx-auto mt-1 mb-6">
              Add your savings, current accounts, cash reserves, or credit cards to start tracking your family assets.
            </p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center space-x-2 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Your First Account</span>
            </button>
          </div>
        ) : (
          accounts.map((acc) => {
          const IconComponent = ACCOUNT_ICONS[acc.account_type] || Wallet;
          const isCredit = acc.account_type === 'credit_card';

          return (
            <div
              key={acc.id}
              className="group relative liquid-glass-panel rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="rounded-lg p-2.5 text-white shadow-xs"
                      style={{ backgroundColor: acc.color || '#10b981' }}
                    >
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{acc.name}</h3>
                      <span className="inline-block rounded-md border border-[#142a1f] bg-[#050e09] px-2 py-0.5 text-[10px] font-bold text-[#8da399] uppercase tracking-wider">
                        {acc.account_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <span className="text-xs text-[#5d7c6e]">Available Balance</span>
                  <div className="flex items-baseline space-x-2">
                    <span
                      className={`text-2xl font-bold font-mono ${
                        isCredit && acc.balance < 0 ? 'text-red-400' : 'text-white'
                      }`}
                    >
                      {formatAmount(acc.balance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-[#142a1f] flex items-center justify-between text-xs text-[#5d7c6e]">
                <span className="flex items-center text-[#10b981]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] mr-1.5" />
                  Real-time sync
                </span>
                <span>ID: #{acc.id}</span>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Account Modal (Create / Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <h3 className="text-base font-bold text-white">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
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
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HDFC Salary, Emergency Cash"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                >
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                  <option value="cash">Cash Wallet</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="joint">Joint Family Account</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Initial / Current Balance
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Theme Accent Color
                </label>
                <div className="flex items-center space-x-2 pt-1">
                  {ACCOUNT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-[#34d399] ring-offset-2 ring-offset-[#08140e]' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                  <span>{saving ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
