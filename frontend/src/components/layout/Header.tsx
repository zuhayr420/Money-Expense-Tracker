import React from 'react';
import {
  Menu,
  Search,
  Bell,
  Coins,
  Download,
  Send,
} from 'lucide-react';
import { useCurrency, CurrencyCode } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenAddTransaction: () => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenAddTransaction,
  onOpenSearch,
  onOpenNotifications,
  unreadCount = 2,
}) => {
  const { user } = useAuth();
  const { currentCurrency, setCurrency } = useCurrency();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : (user?.username || 'User');

  return (
    <header className="sticky top-0 z-30 flex flex-col sm:flex-row h-auto sm:h-20 w-full justify-between items-start sm:items-center liquid-glass-header px-6 sm:px-8 py-3 sm:py-0 gap-3">
      {/* Left: Greeting & Date in Times New Roman */}
      <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-start">
        <button
          onClick={onToggleSidebar}
          className="liquid-glass-btn rounded-lg p-2 text-[#8da399] hover:text-white lg:hidden cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div>
          <span className="block text-xs font-normal text-[#8da399] tracking-normal">
            {todayFormatted}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-normal text-white">
            {getGreeting()}, {firstName}
          </h1>
        </div>
      </div>

      {/* Right: Search, Statement, Currency, Send Money */}
      <div className="flex items-center space-x-2 sm:space-x-2.5 w-full sm:w-auto justify-end flex-wrap gap-y-2">
        {/* Search Bar */}
        <button
          onClick={onOpenSearch}
          className="liquid-glass-btn flex items-center space-x-2 rounded-xl px-3.5 py-1.5 text-xs text-[#8da399] hover:text-white cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-[#34d399]" />
          <span className="hidden md:inline">Search records...</span>
          <span className="md:hidden">Search</span>
          <kbd className="hidden lg:inline text-[10px] bg-[rgba(16,185,129,0.12)] border border-[rgba(52,211,153,0.2)] px-1.5 py-0.5 rounded text-[#8da399] ml-1">⌘K</kbd>
        </button>

        {/* Currency Switcher */}
        <div className="liquid-glass-panel flex items-center space-x-1.5 rounded-xl px-2.5 py-1.5 text-xs text-[#cbd5e1]">
          <Coins className="h-3.5 w-3.5 text-[#34d399]" />
          <select
            value={currentCurrency.code}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            aria-label="Select currency"
            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="INR" className="bg-[#060c09] text-white">₹ INR</option>
            <option value="USD" className="bg-[#060c09] text-white">$ USD</option>
            <option value="EUR" className="bg-[#060c09] text-white">€ EUR</option>
            <option value="GBP" className="bg-[#060c09] text-white">£ GBP</option>
          </select>
        </div>

        {/* Statement button */}
        <button
          onClick={onOpenNotifications}
          aria-label="View statements and activity feed"
          className="liquid-glass-btn flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#cbd5e1] hover:text-white cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-[#34d399]" />
          <span className="hidden sm:inline">Statement</span>
        </button>

        {/* Notification bell */}
        <button
          onClick={onOpenNotifications}
          aria-label="View notifications"
          className="liquid-glass-btn relative rounded-xl p-2 text-[#8da399] hover:text-white cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          )}
        </button>

        {/* Verdela "Send money" Button */}
        <button
          onClick={onOpenAddTransaction}
          aria-label="Record transaction or send money"
          className="liquid-mint-cta flex items-center space-x-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-[#041009] cursor-pointer"
        >
          <Send className="h-3.5 w-3.5 -rotate-45" />
          <span>Send money</span>
        </button>
      </div>
    </header>
  );
};
