import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Lock,
  Unlock,
  Eye,
  Plus,
  ChevronRight,
  Wifi,
  Sparkles,
  BarChart2,
  Calendar,
  Edit3,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  analyticsApi,
  transactionsApi,
  budgetsApi,
  goalsApi,
  billsApi,
  accountsApi,
  cardsApi,
} from '../services/api';
import {
  AnalyticsSummary,
  Transaction,
  Budget,
  Goal,
  Bill,
  Account,
  MonthlyTrend,
  DailyTrend,
  Card,
} from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { CardModal } from '../components/modals/CardModal';

export const Overview: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [dailyTrends, setDailyTrends] = useState<DailyTrend[]>([]);
  const [timeFilter, setTimeFilter] = useState<'1D' | '1W' | '1M' | '1Y' | 'ALL'>('1M');
  const [cashflowPeriod, setCashflowPeriod] = useState<'Weekly' | 'Monthly' | 'Year'>('Monthly');
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        sumData,
        txData,
        accData,
        cardData,
        budData,
        goalData,
        billData,
        monthData,
        dailyData,
      ] = await Promise.all([
        analyticsApi.getSummary(),
        transactionsApi.getAll(),
        accountsApi.getAll(),
        cardsApi.getAll(),
        budgetsApi.getAll(),
        goalsApi.getAll(),
        billsApi.getAll(),
        analyticsApi.getMonthly(6),
        analyticsApi.getDaily(),
      ]);

      setSummary(sumData || null);
      setRecentTransactions(Array.isArray(txData) ? txData.slice(0, 5) : []);
      setAccounts(Array.isArray(accData) ? accData : []);
      setCards(Array.isArray(cardData) ? cardData : []);
      setBudgets(Array.isArray(budData) ? budData : []);
      setGoals(Array.isArray(goalData) ? goalData : []);
      setBills(Array.isArray(billData) ? billData : []);
      setMonthlyTrends(Array.isArray(monthData) ? monthData : []);
      setDailyTrends(Array.isArray(dailyData) ? dailyData : []);
    } catch (err) {
      console.error('Failed to load Verdela overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, []);

  const activeCard: Card | null = cards.length > 0 ? cards[0] : null;
  const primaryAccount = accounts.length > 0 ? accounts[0] : null;
  const balanceDisplay = summary?.total_balance ?? 0;
  const monthlyIn = summary?.monthly_income ?? 0;
  const monthlyOut = summary?.monthly_expenses ?? 0;
  const netCashflow = monthlyIn - monthlyOut;

  // Toggle card lock state
  const handleToggleCardLock = async () => {
    if (!activeCard) {
      setCardModalOpen(true);
      return;
    }
    try {
      const res = await cardsApi.toggleLock(activeCard.id);
      setCards((prev) =>
        prev.map((c) => (c.id === activeCard.id ? { ...c, is_locked: res.is_locked } : c))
      );
    } catch (e) {
      console.error('Failed to toggle lock:', e);
    }
  };

  // Liquid Glass theme styling for physical card
  const getCardThemeClasses = (theme?: Card['color_theme']) => {
    switch (theme) {
      case 'obsidian':
        return 'liquid-glass-obsidian';
      case 'royal':
        return 'liquid-glass-royal';
      case 'gold':
        return 'liquid-glass-gold';
      case 'emerald':
      default:
        return 'liquid-glass-emerald';
    }
  };

  // Real Dynamic Wave Chart Data
  const hasDailyData = dailyTrends && dailyTrends.some((d) => d.amount > 0);
  const chartData = hasDailyData
    ? dailyTrends
    : balanceDisplay > 0
    ? [
        { date: '1 Nov', amount: balanceDisplay },
        { date: '8 Nov', amount: balanceDisplay },
        { date: '15 Nov', amount: balanceDisplay },
        { date: '22 Nov', amount: balanceDisplay },
        { date: 'Today', amount: balanceDisplay },
      ]
    : [
        { date: '1 Nov', amount: 0 },
        { date: '8 Nov', amount: 0 },
        { date: '15 Nov', amount: 0 },
        { date: '22 Nov', amount: 0 },
        { date: 'Today', amount: 0 },
      ];

  // Real Dynamic Cashflow Comparison Bars Data
  const hasMonthlyData = monthlyTrends && monthlyTrends.some((m) => m.income > 0 || m.expenses > 0);
  const cashflowData = hasMonthlyData
    ? monthlyTrends.slice(-5)
    : monthlyTrends && monthlyTrends.length > 0
    ? monthlyTrends.slice(-5)
    : [
        { month: 'Jul', income: 0, expenses: 0 },
        { month: 'Aug', income: 0, expenses: 0 },
        { month: 'Sep', income: 0, expenses: 0 },
        { month: 'Oct', income: 0, expenses: 0 },
        { month: 'Nov', income: monthlyIn, expenses: monthlyOut },
      ];

  return (
    <div className="space-y-6">
      {/* 2-Column Exact Verdela Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: 3D Frosted Emerald Card & Recent Activity */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-6">
          {/* CARDS Container */}
          <div className="liquid-glass-panel rounded-xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#142a1f]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d7c6e]">
                  CARDS
                </span>
                <p className="text-xs text-[#8da399]">
                  {activeCard
                    ? `${activeCard.card_label} • ${activeCard.network.toUpperCase()}`
                    : primaryAccount
                    ? `${primaryAccount.name} • ${primaryAccount.account_type}`
                    : 'Personal Card Vault'}
                </p>
              </div>
              <button
                onClick={() => setCardModalOpen(true)}
                className="flex items-center text-xs font-semibold text-[#34d399] hover:underline cursor-pointer"
              >
                <span>{activeCard ? 'Edit card' : '+ Add card'}</span>
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </button>
            </div>

            {/* The Signature Card */}
            <div className="mt-4 relative group cursor-pointer" onClick={() => setCardModalOpen(true)}>
              {/* Subtle Card slot/pocket backdrop effect */}
              <div className="absolute -top-1.5 inset-x-3 h-3 bg-[#050e09] rounded-t-lg border-t border-x border-[#142a1f] opacity-70" />

              {/* The Physical Card with 120fps spring physics */}
              <motion.div
                whileHover={{ scale: 1.015, y: -2 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className={`relative overflow-hidden rounded-xl border border-[#1b3d2b] ${getCardThemeClasses(
                  activeCard?.color_theme
                )} p-6 text-white min-h-[200px] flex flex-col justify-between shadow-md`}
              >
                {/* Diagonal Specular Sheen */}
                <div className="absolute inset-0 liquid-glass-sheen pointer-events-none opacity-40" />

                {/* Card Top: Chip & Contactless */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center space-x-3">
                    {/* Metallic EMV Chip graphic */}
                    <div className="h-7 w-10 rounded-sm bg-gradient-to-tr from-[#d4af37] via-[#f7e7a9] to-[#c59e2b] shadow-inner border border-amber-300/40 flex items-center justify-center p-0.5">
                      <div className="h-full w-full border border-amber-800/30 rounded-xs flex flex-col justify-around">
                        <div className="h-[1px] bg-amber-900/30 w-full" />
                        <div className="h-[1px] bg-amber-900/30 w-full" />
                      </div>
                    </div>
                    <Wifi className="h-4 w-4 text-[#34d399] rotate-90" />
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeCard?.is_locked && (
                      <span className="flex items-center space-x-1 rounded-sm bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/40">
                        <Lock className="h-2.5 w-2.5" />
                        <span>LOCKED</span>
                      </span>
                    )}
                    <span className="text-xs font-bold tracking-wider text-[#34d399] uppercase">
                      {activeCard?.card_label || 'Verdela Card'}
                    </span>
                  </div>
                </div>

                {/* Card Center: Masked or Full Number */}
                <div className="my-4 z-10">
                  <p className="font-mono text-base sm:text-lg tracking-[0.22em] text-white/95 font-semibold">
                    {activeCard
                      ? showCardNumber
                        ? activeCard.card_number_formatted
                        : activeCard.card_number_masked
                      : '••••  ••••  ••••  ••••'}
                  </p>
                  {!activeCard && (
                    <span className="text-[10px] text-[#34d399] flex items-center space-x-1 mt-1">
                      <Edit3 className="h-3 w-3" />
                      <span>Tap to set your card name and number</span>
                    </span>
                  )}
                </div>

                {/* Card Bottom: Holder Name, Expiry & Network Logo */}
                <div className="flex items-end justify-between z-10">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-[#8da399]">
                      Cardholder
                    </span>
                    <p className="text-xs font-bold tracking-wide uppercase text-white">
                      {activeCard?.cardholder_name ||
                        user?.full_name?.toUpperCase() ||
                        user?.username?.toUpperCase() ||
                        'YOUR NAME'}
                    </p>
                  </div>

                  <div className="text-center">
                    <span className="block text-[9px] uppercase tracking-wider text-[#8da399]">
                      Expires
                    </span>
                    <p className="text-xs font-mono font-bold text-white">
                      {activeCard?.expiry_date || '--/--'}
                    </p>
                  </div>

                  {/* Dynamic Network Logo */}
                  <div className="flex items-center">
                    {(!activeCard || activeCard.network === 'mastercard') && (
                      <div className="flex -space-x-2.5 items-center">
                        <div className="h-7 w-7 rounded-full bg-[#ef4444]/90 shadow-md" />
                        <div className="h-7 w-7 rounded-full bg-[#f59e0b]/90 shadow-md" />
                      </div>
                    )}
                    {activeCard?.network === 'visa' && (
                      <span className="font-black italic text-xl tracking-tighter text-white">
                        VISA
                      </span>
                    )}
                    {activeCard?.network === 'amex' && (
                      <span className="font-extrabold text-xs tracking-wider bg-blue-600 px-2 py-0.5 rounded text-white border border-blue-400">
                        AMEX
                      </span>
                    )}
                    {activeCard?.network === 'rupay' && (
                      <span className="font-bold text-xs tracking-wide bg-orange-600 px-2 py-0.5 rounded text-white border border-orange-400">
                        RuPay
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Card Action Buttons */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={handleToggleCardLock}
                className={`flex items-center justify-center space-x-1.5 rounded-lg border py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  activeCard?.is_locked
                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                    : 'border-[#142a1f] bg-[#0a1711] text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white'
                }`}
              >
                {activeCard?.is_locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                <span>{activeCard?.is_locked ? 'Locked' : 'Lock'}</span>
              </button>

              <button
                onClick={() => {
                  if (!activeCard) {
                    setCardModalOpen(true);
                  } else {
                    setShowCardNumber(!showCardNumber);
                  }
                }}
                className="flex items-center justify-center space-x-1.5 rounded-lg border border-[#142a1f] bg-[#0a1711] py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>{showCardNumber ? 'Hide' : 'Details'}</span>
              </button>

              <button
                onClick={() => setCardModalOpen(true)}
                className="flex items-center justify-center space-x-1.5 rounded-lg border border-[#142a1f] bg-[#0a1711] py-2 text-xs font-semibold text-[#34d399] hover:bg-[#0f231a] hover:text-white transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{activeCard ? 'Edit' : 'Add card'}</span>
              </button>
            </div>
          </div>

          {/* Recent Activity / Mini Ledger */}
          <div className="liquid-glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#142a1f]">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Activity</h3>
                <p className="text-[11px] text-[#5d7c6e]">Real-time ledger updates</p>
              </div>
              <NavLink
                to="/transactions"
                className="text-xs font-semibold text-[#34d399] hover:underline"
              >
                View all
              </NavLink>
            </div>

            <div className="mt-3 space-y-2">
              {recentTransactions.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-[#8da399]">No transactions recorded yet.</p>
                  <NavLink
                    to="/transactions"
                    className="inline-block text-xs font-bold text-[#34d399] hover:underline"
                  >
                    + Record first transaction
                  </NavLink>
                </div>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#0c1e15] transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`rounded-md p-1.5 ${
                          tx.type === 'income'
                            ? 'bg-[#10b981]/15 text-[#34d399]'
                            : 'bg-[#ef4444]/15 text-red-400'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {tx.description}
                        </p>
                        <p className="text-[10px] text-[#5d7c6e]">
                          {tx.category} • {tx.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-xs font-mono font-bold ${
                          tx.type === 'income' ? 'text-[#34d399]' : 'text-white'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatAmount(tx.amount)}
                      </p>
                      <span className="text-[9px] text-[#5d7c6e] capitalize">
                        {tx.payment_method || 'UPI'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: Total Balance, Wave Chart & Cashflow Bars  */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Performance & Balance Container */}
          <div className="liquid-glass-panel rounded-xl p-6">
            {/* Header: Title, Balance & Time Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d7c6e]">
                  PERFORMANCE
                </span>
                <p className="text-xs text-[#8da399] mb-1">
                  Available balance across all vaults
                </p>
                <div className="flex items-baseline space-x-3">
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {formatAmount(balanceDisplay)}
                  </h2>
                  <span className="inline-flex items-center rounded-md border border-[#142a1f] bg-[#0a1a12] px-2 py-0.5 text-xs font-bold text-[#34d399]">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                    +{summary?.comparison?.income_change_pct ?? 0}%
                  </span>
                </div>
                <span className="text-[11px] text-[#5d7c6e]">
                  Growth trajectory vs previous 30 days
                </span>
              </div>

              {/* Time Filter Tabs */}
              <div className="flex items-center space-x-1 rounded-lg border border-[#142a1f] bg-[#050e09] p-0.5 self-start">
                {(['1D', '1W', '1M', '1Y', 'ALL'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      timeFilter === filter
                        ? 'bg-[#10b981] text-[#041009] font-bold'
                        : 'text-[#8da399] hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Luminous Mint Green Wave Chart with Node Points */}
            <div className="mt-6 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="verdelaGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#234233"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide={true} domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(5,14,10,0.92)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(52,211,153,0.22)',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}
                    formatter={(val: any) => [formatAmount(Number(val)), 'Balance']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#verdelaGlow)"
                    dot={{ fill: '#34d399', stroke: '#060c09', strokeWidth: 1.5, r: 3.5 }}
                    activeDot={{ fill: '#34d399', stroke: '#ffffff', strokeWidth: 2, r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 pt-3 border-t border-[#142a1f] flex items-center justify-between text-xs text-[#5d7c6e]">
              <span>Velocity: Active</span>
              <span>High: {formatAmount(Math.max(...chartData.map((d) => d.amount), balanceDisplay))}</span>
            </div>
          </div>

          {/* Bottom "Money In & Out" Cashflow Velocity Card */}
          <div className="liquid-glass-panel rounded-xl p-6">
            {/* Header: Title, Net Cashflow, Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#142a1f]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5d7c6e]">
                  CASHFLOW VELOCITY
                </span>
                <h3 className="text-base font-bold text-white">Money In & Out</h3>
                <p className="text-xs text-[#8da399]">
                  Net flow:{' '}
                  <span
                    className={`font-mono font-bold ${
                      netCashflow >= 0 ? 'text-[#34d399]' : 'text-red-400'
                    }`}
                  >
                    {netCashflow >= 0 ? '+' : ''}
                    {formatAmount(netCashflow)}
                  </span>
                </p>
              </div>

              {/* Time Toggle Tabs: Weekly, Monthly, Year */}
              <div className="flex items-center space-x-1 rounded-lg border border-[#142a1f] bg-[#050e09] p-0.5">
                {(['Weekly', 'Monthly', 'Year'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setCashflowPeriod(period)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      cashflowPeriod === period
                        ? 'bg-[#10b981] text-[#041009] font-bold'
                        : 'text-[#8da399] hover:text-white'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Cashflow Dual Bars Chart */}
            <div className="mt-4 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashflowData} barGap={6} barSize={14}>
                  <XAxis
                    dataKey="month"
                    stroke="#234233"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide={true} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#050e09',
                      border: '1px solid #142a1f',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                    formatter={(val: any, name: any) => [
                      formatAmount(Number(val)),
                      name === 'income' ? 'Money In' : 'Money Out',
                    ]}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="income" />
                  <Bar dataKey="expenses" fill="#1b4332" radius={[4, 4, 0, 0]} name="expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom Legend */}
            <div className="mt-3 pt-3 border-t border-[#142a1f] flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-[#8da399] text-xs">Money in ({formatAmount(monthlyIn)})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#1b4332]" />
                  <span className="text-[#8da399] text-xs">Money out ({formatAmount(monthlyOut)})</span>
                </div>
              </div>
              <NavLink
                to="/transactions"
                className="text-xs font-bold text-[#34d399] hover:underline"
              >
                Detailed audit →
              </NavLink>
            </div>
          </div>
        </div>
      </div>

      {/* Card Configuration / Edit Modal */}
      <CardModal
        isOpen={cardModalOpen}
        onClose={() => setCardModalOpen(false)}
        onSuccess={(saved) => {
          setCards([saved]);
        }}
        existingCard={activeCard}
        accounts={accounts}
      />
    </div>
  );
};
