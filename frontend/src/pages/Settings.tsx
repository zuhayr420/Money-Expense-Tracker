import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Coins,
  Bell,
  Lock,
  Download,
  Check,
  AlertCircle,
  Palette,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CurrencyCode, CURRENCIES } from '../context/CurrencyContext';
import { authApi } from '../services/api';

const AVATAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { currentCurrency, setCurrency } = useCurrency();

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#10b981');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.username || '');
      setEmail(user.email || '');
      setAvatarColor(user.avatar_color || '#10b981');
    }
  }, [user]);

  // Notification toggles
  const [notifyBudget, setNotifyBudget] = useState(true);
  const [notifyBills, setNotifyBills] = useState(true);
  const [notifyLargeTx, setNotifyLargeTx] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('Passwords do not match');
      return;
    }

    setProfileSaving(true);
    try {
      const updated = await authApi.updateProfile({
        full_name: fullName.trim(),
        email: email.trim(),
        avatar_color: avatarColor,
        password: newPassword ? newPassword : undefined,
      });
      updateUser(updated);
      setProfileSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile settings');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          System & Account Settings
        </h1>
        <p className="text-xs text-[#8da399]">
          Manage your personal profile, vault currency preferences, notifications, and security policies
        </p>
      </div>

      {profileSuccess && (
        <div className="flex items-center space-x-2 rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 p-4 text-xs font-semibold text-[#34d399]">
          <Check className="h-4 w-4" />
          <span>Profile configuration saved successfully!</span>
        </div>
      )}

      {profileError && (
        <div className="flex items-center space-x-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs font-semibold text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{profileError}</span>
        </div>
      )}

      {/* Section 1: User Profile & Identity */}
      <div className="liquid-glass-panel rounded-xl p-6 space-y-6">
        <div className="flex items-center space-x-3 pb-4 border-b border-[#142a1f]">
          <div className="rounded-lg bg-[#10b981]/15 p-2 text-[#34d399]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">User Profile & Identity</h3>
            <p className="text-xs text-[#5d7c6e]">Primary account holder metadata</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8da399] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8da399] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8da399] mb-1.5">
              Avatar Accent Color
            </label>
            <div className="flex items-center space-x-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setAvatarColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    avatarColor === c
                      ? 'scale-110 ring-2 ring-[#34d399] ring-offset-2 ring-offset-[#08140e]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Password update section */}
          <div className="pt-4 border-t border-[#142a1f]">
            <h4 className="text-xs font-bold text-white mb-3">Change Security Password</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1.5">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              type="submit"
              disabled={profileSaving}
              className="liquid-mint-cta rounded-xl px-4 py-2 text-xs font-bold text-[#041009] disabled:opacity-50 cursor-pointer"
            >
              {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Vault Currency Configuration */}
      <div className="liquid-glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-[#142a1f]">
          <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Default Vault Currency</h3>
            <p className="text-xs text-[#5d7c6e]">
              Platform-wide financial units and real-time conversion display
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
            const curr = CURRENCIES[code];
            const isSelected = currentCurrency.code === code;
            return (
              <button
                key={code}
                onClick={() => setCurrency(code)}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#10b981] bg-[#0a1a12] text-white shadow-xs'
                    : 'border-[#142a1f] bg-[#050e09] text-[#8da399] hover:border-[#1b3d2b]'
                }`}
              >
                <span className="text-2xl font-bold">{curr.symbol}</span>
                <p className="mt-2 text-xs font-bold text-white">{curr.code}</p>
                <p className="text-[10px] text-[#5d7c6e]">{curr.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Notification Preferences */}
      <div className="liquid-glass-panel rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-[#142a1f]">
          <div className="rounded-lg bg-purple-500/15 p-2 text-purple-400">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Notification & Alert Rules</h3>
            <p className="text-xs text-[#5d7c6e]">Configure real-time notifications for spending</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#050e09] border border-[#142a1f]">
            <div>
              <p className="text-xs font-semibold text-white">Budget Limit Warnings</p>
              <p className="text-[11px] text-[#5d7c6e]">Alert when category exceeds 80% or 100% of allocation</p>
            </div>
            <input
              type="checkbox"
              checked={notifyBudget}
              onChange={(e) => setNotifyBudget(e.target.checked)}
              className="rounded border-[#142a1f] text-[#10b981] focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#050e09] border border-[#142a1f]">
            <div>
              <p className="text-xs font-semibold text-white">Upcoming Bill Reminders</p>
              <p className="text-[11px] text-[#5d7c6e]">Notify 3 days before recurring subscription or bill is due</p>
            </div>
            <input
              type="checkbox"
              checked={notifyBills}
              onChange={(e) => setNotifyBills(e.target.checked)}
              className="rounded border-[#142a1f] text-[#10b981] focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#050e09] border border-[#142a1f]">
            <div>
              <p className="text-xs font-semibold text-white">Large Transaction Anomaly Alerts</p>
              <p className="text-[11px] text-[#5d7c6e]">Notify when any single debit exceeds ₹10,000</p>
            </div>
            <input
              type="checkbox"
              checked={notifyLargeTx}
              onChange={(e) => setNotifyLargeTx(e.target.checked)}
              className="rounded border-[#142a1f] text-[#10b981] focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#050e09] border border-[#142a1f]">
            <div>
              <p className="text-xs font-semibold text-white">Weekly Family Digest</p>
              <p className="text-[11px] text-[#5d7c6e]">Weekly summary email of portfolio change & net savings</p>
            </div>
            <input
              type="checkbox"
              checked={notifyWeekly}
              onChange={(e) => setNotifyWeekly(e.target.checked)}
              className="rounded border-[#142a1f] text-[#10b981] focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
