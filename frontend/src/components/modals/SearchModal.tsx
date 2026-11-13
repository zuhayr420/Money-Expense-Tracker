import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, X, ArrowRight, ArrowDownRight, ArrowUpRight, Wallet, Calendar, Target } from 'lucide-react';
import { transactionsApi, accountsApi, billsApi, goalsApi } from '../../services/api';
import { Transaction, Account, Bill, Goal } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [query, setQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle if needed
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setTransactions([]);
      setAccounts([]);
      setBills([]);
      setGoals([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [txRes, accRes, billRes, goalRes] = await Promise.all([
          transactionsApi.getAll({ search: query }),
          accountsApi.getAll(),
          billsApi.getAll(),
          goalsApi.getAll(),
        ]);

        const q = query.toLowerCase();
        setTransactions(txRes.slice(0, 5));
        setAccounts(accRes.filter((a) => a.name.toLowerCase().includes(q) || a.account_type.toLowerCase().includes(q)));
        setBills(billRes.filter((b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)));
        setGoals(goalRes.filter((g) => g.name.toLowerCase().includes(q)));
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, query]);

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Liquid Glass Search Palette with 120fps physics */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Global search palette"
        initial={{ opacity: 0, scale: 0.95, y: -15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="relative w-full max-w-2xl rounded-3xl liquid-glass-panel shadow-2xl overflow-hidden z-10"
      >
        {/* Input Bar */}
        <div className="flex items-center px-5 py-4 border-b border-[#12281e]">
          <Search className="h-5 w-5 text-[#34d399] mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions, accounts, bills, goals..."
            aria-label="Search transactions, accounts, bills, and goals"
            className="w-full bg-transparent text-sm text-white placeholder-[#5d7c6e] focus:outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            aria-label="Close search"
            className="rounded-xl p-1 text-[#5d7c6e] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-xs text-[#64748b]">Searching platform records...</div>
          )}

          {!loading && !query && (
            <div className="py-8 text-center">
              <p className="text-xs text-[#64748b]">Type to search transactions, accounts, goals, or recurring bills</p>
              <div className="mt-3 flex justify-center gap-2 text-[11px] text-[#475569]">
                <span className="rounded bg-[#121721] px-2 py-1 border border-[#1e293b]">Grocery</span>
                <span className="rounded bg-[#121721] px-2 py-1 border border-[#1e293b]">Salary</span>
                <span className="rounded bg-[#121721] px-2 py-1 border border-[#1e293b]">Electricity</span>
                <span className="rounded bg-[#121721] px-2 py-1 border border-[#1e293b]">HDFC</span>
              </div>
            </div>
          )}

          {!loading && query && transactions.length === 0 && accounts.length === 0 && bills.length === 0 && goals.length === 0 && (
            <div className="py-8 text-center text-xs text-[#64748b]">No matching records found for "{query}"</div>
          )}

          {/* Transactions list */}
          {transactions.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Transactions</p>
              <div className="space-y-1.5">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => handleSelect('/transactions')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#151c27] cursor-pointer transition-colors border border-transparent hover:border-[#1e293b]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-lg ${tx.type === 'income' ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-red-500/20 text-red-400'}`}>
                        {tx.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{tx.description}</p>
                        <p className="text-[10px] text-[#64748b]">{tx.category} • {tx.date} • {tx.family_member_name}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${tx.type === 'income' ? 'text-[#34d399]' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accounts list */}
          {accounts.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Accounts</p>
              <div className="space-y-1.5">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => handleSelect('/accounts')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#151c27] cursor-pointer transition-colors border border-transparent hover:border-[#1e293b]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-[#10b981]/15 text-[#34d399]">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{acc.name}</p>
                        <p className="text-[10px] text-[#64748b] capitalize">{acc.account_type}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#34d399]">{formatAmount(acc.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bills list */}
          {bills.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Bills & Subscriptions</p>
              <div className="space-y-1.5">
                {bills.map((bill) => (
                  <div
                    key={bill.id}
                    onClick={() => handleSelect('/bills')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#151c27] cursor-pointer transition-colors border border-transparent hover:border-[#1e293b]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{bill.name}</p>
                        <p className="text-[10px] text-[#64748b]">Due {bill.due_date} • {bill.status}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white">{formatAmount(bill.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals list */}
          {goals.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">Savings Goals</p>
              <div className="space-y-1.5">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleSelect('/goals')}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#151c27] cursor-pointer transition-colors border border-transparent hover:border-[#1e293b]"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400">
                        <Target className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{g.name}</p>
                        <p className="text-[10px] text-[#64748b]">{g.progress}% achieved</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#34d399]">{formatAmount(g.current_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between bg-black/40 px-5 py-3 border-t border-[#12281e] text-[11px] text-[#5d7c6e]">
          <span>Navigate with mouse or keyboard</span>
          <div className="flex items-center space-x-2">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">Esc</kbd>
            <span>to close</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
