import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownRight, ArrowUpRight, Check, AlertCircle, PlusCircle } from 'lucide-react';
import { transactionsApi, accountsApi, familyApi } from '../../services/api';
import { Account } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = {
  expense: [
    'Food',
    'Shopping',
    'Transportation',
    'Healthcare',
    'Education',
    'Entertainment',
    'Housing',
    'Utilities',
    'Other',
  ],
  income: [
    'Salary',
    'Investments',
    'Freelance',
    'Rental Income',
    'Dividends',
    'Bonus',
    'Other',
  ],
};

const PAYMENT_METHODS = ['UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Cash'];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentCurrency } = useCurrency();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [familyMembersList, setFamilyMembersList] = useState<string[]>([]);
  const [familyMember, setFamilyMember] = useState('');
  const [customMember, setCustomMember] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'completed' | 'pending'>('completed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      accountsApi.getAll().then((accs) => {
        setAccounts(accs);
        if (accs.length > 0 && !accountId) {
          setAccountId(accs[0].id);
        }
      });

      familyApi.getAll().then((fams) => {
        const members: string[] = [];
        if (user?.full_name) members.push(user.full_name);
        if (fams.length > 0 && fams[0].members) {
          fams[0].members.forEach((m) => {
            const name = m.user?.full_name || m.user?.username;
            if (name && !members.includes(name)) {
              members.push(name);
            }
          });
        }
        if (members.length === 0) members.push(user?.username || 'Myself');
        setFamilyMembersList(members);
        setFamilyMember(members[0]);
      });

      setCategory(type === 'expense' ? 'Food' : 'Salary');
    }
  }, [isOpen, type, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!accountId) {
      setError('Please select an account');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setLoading(true);
    try {
      await transactionsApi.create({
        type,
        amount: parsedAmount,
        description: description.trim(),
        category,
        account_id: Number(accountId),
        family_member_name: familyMember,
        payment_method: paymentMethod,
        date,
        status,
      });
      // Reset form
      setAmount('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Heavy Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Dialog in Liquid Glass with 120fps physics */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-transaction-title"
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="relative w-full max-w-lg rounded-3xl liquid-glass-panel p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#12281e]">
          <div>
            <h3 id="add-transaction-title" className="text-lg font-extrabold text-white">Record Transaction</h3>
            <p className="text-xs text-[#5d7c6e]">Post real-time ledger entry to vault</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-1.5 text-[#5d7c6e] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {error && (
          <div className="mt-4 flex items-center space-x-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#0b0f15] p-1 border border-[#1b232e]">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Food');
              }}
              className={`flex items-center justify-center space-x-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-[#ef4444]/20 text-[#f87171] border border-red-500/30 shadow-xs'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              <ArrowDownRight className="h-4 w-4" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              className={`flex items-center justify-center space-x-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30 shadow-xs'
                  : 'text-[#64748b] hover:text-white'
              }`}
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Income</span>
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-1">
              Amount ({currentCurrency.symbol})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-[#64748b]">
                {currentCurrency.symbol}
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] pl-9 pr-4 py-2.5 text-base font-semibold text-white placeholder-[#334155] focus:border-[#10b981] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-1">
              Description / Payee
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Reliance Fresh Groceries, Monthly Salary"
              className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] px-3.5 py-2.5 text-xs text-white placeholder-[#334155] focus:border-[#10b981] focus:outline-hidden"
            />
          </div>

          {/* Account & Category row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#94a3b8]">
                  Account
                </label>
                {accounts.length === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/accounts');
                    }}
                    className="text-[10px] text-[#34d399] hover:underline"
                  >
                    + Create Account
                  </button>
                )}
              </div>
              {accounts.length > 0 ? (
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] px-3 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.account_type})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-300">
                  No accounts created yet. Please create an account in Accounts first!
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] px-3 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
              >
                {CATEGORIES[type].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Family Member & Payment Method row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#94a3b8]">
                  Family Member
                </label>
                <button
                  type="button"
                  onClick={() => setCustomMember(!customMember)}
                  className="text-[10px] text-[#34d399] hover:underline"
                >
                  {customMember ? 'Select Existing' : '+ Type Name'}
                </button>
              </div>
              {customMember ? (
                <input
                  type="text"
                  required
                  value={familyMember}
                  onChange={(e) => setFamilyMember(e.target.value)}
                  placeholder="Enter member name"
                  className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              ) : (
                <select
                  value={familyMember}
                  onChange={(e) => setFamilyMember(e.target.value)}
                  className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] px-3 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                >
                  {familyMembersList.map((mem) => (
                    <option key={mem} value={mem}>
                      {mem}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] px-3 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-[#1e293b] bg-[#0b0f15] px-3 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#1b232e]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#1e293b] px-4 py-2 text-xs font-semibold text-[#94a3b8] hover:bg-[#1a2230] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-[#10b981]/20 hover:from-[#34d399] hover:to-[#10b981] disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Confirm Transaction'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
