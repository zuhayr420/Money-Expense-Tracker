import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  PieChart,
  Target,
  CalendarCheck2,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { familyApi } from '../../services/api';
import { Family } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/transactions', label: 'Payments', icon: ArrowLeftRight },
  { path: '/accounts', label: 'Wallets', icon: Wallet },
  { path: '/budgets', label: 'Budgets', icon: PieChart },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/bills', label: 'Bills & Subscriptions', icon: CalendarCheck2 },
  { path: '/insights', label: 'Analytics', icon: TrendingUp },
  { path: '/family', label: 'Family Vault', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { formatAmount } = useCurrency();
  const [family, setFamily] = useState<Family | null>(null);

  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const fams = await familyApi.getAll();
        if (Array.isArray(fams) && fams.length > 0) {
          setFamily(fams[0]);
        }
      } catch (e) {
        // Silently ignore if not logged in
      }
    };
    fetchFamily();
    const handleUpdate = () => fetchFamily();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#112419] bg-[#05100a] transition-transform duration-200 ease-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Verdela Brand header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-[#112419]">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#10b981] shadow-xs">
              <span className="text-base font-bold text-[#041009]">V</span>
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-normal">Verdela</span>
              <span className="block text-[10px] font-semibold text-[#8da399] tracking-wider uppercase">
                Family Wealth
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold tracking-wider text-[#5d7c6e] uppercase">
            Platform Navigation
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center justify-between rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors duration-150 ${
                      isActive
                        ? 'bg-[#10b981] text-[#041009] font-bold'
                        : 'text-[#8da399] hover:bg-[#09170f] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            isActive ? 'text-[#041009]' : 'text-[#5d7c6e] group-hover:text-[#34d399]'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <div className="h-1.5 w-1.5 rounded-full bg-[#041009]" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Family group status box */}
          <div className="liquid-glass-panel mt-6 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                {family?.name || 'Family Vault'}
              </span>
              <span className="rounded-md bg-[#10b981]/15 border border-[#10b981]/30 px-2 py-0.5 text-[10px] font-bold text-[#34d399]">
                {family?.members?.length || 1} Active
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#8da399]">
              Budget: {family?.monthly_budget ? formatAmount(family.monthly_budget) : 'Unrestricted'}
            </p>
            <NavLink
              to="/family"
              className="mt-2.5 flex items-center text-xs font-bold text-[#34d399] hover:underline"
            >
              Vault Settings
              <ChevronRight className="ml-1 h-3 w-3" />
            </NavLink>
          </div>
        </div>

        {/* User profile footer */}
        <div className="border-t border-[#112419] bg-[rgba(4,13,8,0.7)] backdrop-blur-md p-3.5">
          <div className="liquid-glass-panel flex items-center justify-between rounded-xl p-2.5">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: user?.avatar_color || '#10b981' }}
              >
                {user?.full_name?.slice(0, 2).toUpperCase() || user?.username?.slice(0, 2).toUpperCase() || 'ME'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">
                  {user?.full_name || user?.username || 'Account Holder'}
                </p>
                <p className="truncate text-[10px] text-[#8da399]">
                  {user?.email || 'admin@verdela.local'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="rounded-lg p-1.5 text-[#8da399] hover:bg-[#12281e] hover:text-red-400 cursor-pointer transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
