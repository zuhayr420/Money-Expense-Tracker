import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Calendar, Bell, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { billsApi, budgetsApi } from '../../services/api';
import { useCurrency } from '../../context/CurrencyContext';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  title: string;
  message: string;
  time: string;
  link: string;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadAlerts = async () => {
      const items: NotificationItem[] = [];
      try {
        const [bills, budgets] = await Promise.all([
          billsApi.getAll(),
          budgetsApi.getAll(),
        ]);

        // Check pending bills
        bills
          .filter((b) => b.status === 'pending')
          .slice(0, 3)
          .forEach((b) => {
            items.push({
              id: `bill-${b.id}`,
              type: 'alert',
              title: `Bill Due: ${b.name}`,
              message: `${formatAmount(b.amount)} due on ${b.due_date}.`,
              time: 'Action required',
              link: '/bills',
            });
          });

        // Check budget thresholds
        budgets.forEach((b) => {
          const spent = b.spent || 0;
          if (b.allocated > 0) {
            const pct = Math.round((spent / b.allocated) * 100);
            if (pct >= 100) {
              items.push({
                id: `budget-${b.id}`,
                type: 'warning',
                title: `${b.category} Budget Exceeded!`,
                message: `Spent ${formatAmount(spent)} of ${formatAmount(b.allocated)} ceiling (${pct}%).`,
                time: 'Attention',
                link: '/budgets',
              });
            } else if (pct >= 80) {
              items.push({
                id: `budget-${b.id}`,
                type: 'warning',
                title: `${b.category} Budget Alert`,
                message: `Reached ${pct}% utilization (${formatAmount(spent)} of ${formatAmount(b.allocated)}).`,
                time: 'Approaching limit',
                link: '/budgets',
              });
            }
          }
        });

        setNotifications(items);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    loadAlerts();
  }, [isOpen, formatAmount]);

  if (!isOpen) return null;

  const handleAction = (link: string) => {
    navigate(link);
    onClose();
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'alert':
        return <Calendar className="h-4 w-4 text-red-400" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-[#34d399]" />;
      default:
        return <Bell className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 z-10">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Notifications panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className="w-screen max-w-sm liquid-glass-sidebar shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex h-18 items-center justify-between border-b border-[#12281e] px-5">
            <div className="flex items-center space-x-2.5">
              <div className="rounded-xl bg-[#10b981]/15 p-2 text-[#34d399]">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Notifications</h3>
                <p className="text-[11px] text-[#64748b]">
                  {notifications.length} active updates
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[11px] font-medium text-[#64748b] hover:text-[#94a3b8] cursor-pointer"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close notifications panel"
                className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#151c27] hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="h-[calc(100vh-4.5rem)] overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-[#34d399]/40 mb-2" />
                <p className="text-xs font-semibold text-[#94a3b8]">All caught up!</p>
                <p className="text-[11px] text-[#475569] mt-1">No pending bill alerts or budget warnings.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAction(item.link)}
                  className="group relative rounded-xl border border-[#1e293b] bg-[#121721] p-3.5 transition-all hover:border-[#334155] hover:bg-[#161e2b] cursor-pointer"
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 rounded-lg bg-[#0b0f15] p-2 shrink-0 border border-[#1e293b]">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                        <span className="text-[10px] text-[#64748b] shrink-0 ml-2">{item.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#94a3b8] leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
