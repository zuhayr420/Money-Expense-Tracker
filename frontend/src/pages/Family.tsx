import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  TrendingDown,
  Award,
  Lock,
} from 'lucide-react';
import { familyApi } from '../services/api';
import { Family, FamilyMember, FamilyMemberSpending } from '../types';
import { useCurrency } from '../context/CurrencyContext';

export const FamilyPage: React.FC = () => {
  const { formatAmount, currentCurrency } = useCurrency();
  const [families, setFamilies] = useState<Family[]>([]);
  const [spending, setSpending] = useState<FamilyMemberSpending[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Member Modal
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [spendingLimit, setSpendingLimit] = useState('');
  const [savingMember, setSavingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Edit Limit / Role Modal
  const [editMemberOpen, setEditMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [editRole, setEditRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [editLimit, setEditLimit] = useState('');

  const fetchFamily = async () => {
    try {
      setLoading(true);
      const fams = await familyApi.getAll();
      const safeFams = Array.isArray(fams) ? fams : [];
      setFamilies(safeFams);
      if (safeFams.length > 0) {
        const sp = await familyApi.getSpending(safeFams[0].id);
        setSpending(Array.isArray(sp) ? sp : []);
      }
    } catch (err) {
      console.error('Failed to load family data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamily();
    const handleUpdate = () => fetchFamily();
    window.addEventListener('finance_data_updated', handleUpdate);
    return () => window.removeEventListener('finance_data_updated', handleUpdate);
  }, []);

  const activeFamily = families[0];

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !usernameOrEmail.trim()) {
      setMemberError('Please enter a username or email');
      return;
    }

    setSavingMember(true);
    setMemberError(null);
    try {
      await familyApi.addMember(activeFamily.id, {
        username_or_email: usernameOrEmail.trim(),
        role: memberRole,
        spending_limit: parseFloat(spendingLimit) || 0,
      });
      setAddMemberOpen(false);
      setUsernameOrEmail('');
      setSpendingLimit('');
      fetchFamily();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err: any) {
      setMemberError(err.response?.data?.error || 'Failed to add family member');
    } finally {
      setSavingMember(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFamily || !selectedMember) return;

    setSavingMember(true);
    try {
      await familyApi.updateMember(activeFamily.id, selectedMember.id, {
        role: editRole,
        spending_limit: parseFloat(editLimit) || 0,
      });
      setEditMemberOpen(false);
      fetchFamily();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err: any) {
      console.error('Failed to update member:', err);
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!activeFamily || !window.confirm('Remove this member from the family group?')) return;
    try {
      await familyApi.removeMember(activeFamily.id, memberId);
      fetchFamily();
      window.dispatchEvent(new CustomEvent('finance_data_updated'));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const openEdit = (member: FamilyMember) => {
    setSelectedMember(member);
    setEditRole(member.role);
    setEditLimit(member.spending_limit ? member.spending_limit.toString() : '');
    setEditMemberOpen(true);
  };

  const totalFamilySpent = spending.reduce((sum, m) => sum + m.spent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Family Management & Permissions
          </h1>
          <p className="text-xs text-[#8da399]">
            Oversee collaborative family access, spending caps, and multi-user transparency
          </p>
        </div>
        <button
          onClick={() => {
            setMemberError(null);
            setAddMemberOpen(true);
          }}
          className="flex items-center space-x-2 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] transition-colors cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Family Vault Summary Banner */}
      <div className="liquid-glass-panel rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#34d399]">
              Family Group
            </span>
            <h2 className="text-2xl font-bold text-white">
              {activeFamily?.name || 'My Family Vault'}
            </h2>
            <p className="text-xs text-[#8da399]">
              Shared pool allowance:{' '}
              <span className="font-semibold text-white">
                {activeFamily?.monthly_budget ? formatAmount(activeFamily.monthly_budget) : 'Not configured'}
              </span>{' '}
              / month
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="rounded-lg border border-[#142a1f] bg-[#050e09] p-3 text-right">
              <span className="block text-[10px] text-[#5d7c6e] uppercase tracking-wider">
                Total Family Outflow
              </span>
              <span className="text-lg font-bold font-mono text-white">{formatAmount(totalFamilySpent)}</span>
            </div>
            <div className="rounded-lg border border-[#142a1f] bg-[#050e09] p-3 text-right">
              <span className="block text-[10px] text-[#5d7c6e] uppercase tracking-wider">
                Active Vault Members
              </span>
              <span className="text-lg font-bold text-[#34d399]">
                {activeFamily?.members?.length || 1} Member{activeFamily?.members?.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Spending Cards Grid */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5d7c6e] mb-3">
          Member Spending Limits & Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeFamily?.members?.map((member) => {
            const memberSpendData = spending.find(
              (s) => s.member_name === (member.user?.full_name || member.user?.username)
            );
            const spent = memberSpendData?.spent || 0;
            const limit = member.spending_limit || 0;
            const isOver = limit > 0 && spent > limit;
            const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;

            return (
              <div
                key={member.id}
                className="liquid-glass-panel rounded-xl p-4.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white text-xs shadow-xs"
                        style={{ backgroundColor: member.user?.avatar_color || '#10b981' }}
                      >
                        {member.user?.full_name?.slice(0, 2).toUpperCase() || 'FM'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white truncate max-w-[110px]">
                          {member.user?.full_name || member.user?.username}
                        </h4>
                        <span className="inline-block rounded-md border border-[#142a1f] bg-[#050e09] px-1.5 py-0.5 text-[9px] font-bold text-[#34d399] uppercase tracking-wider">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEdit(member)}
                        className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white cursor-pointer"
                        title="Edit Limit / Role"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      {member.role !== 'admin' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="rounded-md p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-red-400 cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="text-[11px] text-[#5d7c6e]">Spent</span>
                      <span className="font-bold font-mono text-white">{formatAmount(spent)}</span>
                    </div>

                    {limit > 0 ? (
                      <>
                        <div className="h-1.5 w-full rounded-md bg-[#050e09] overflow-hidden border border-[#142a1f]">
                          <div
                            className={`h-full rounded-sm ${
                              isOver ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-[#10b981]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-[#5d7c6e]">
                          <span>{pct}% of {formatAmount(limit)} cap</span>
                          {isOver && <span className="text-red-400 font-bold">Over Limit</span>}
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-[#5d7c6e] pt-1">No individual ceiling assigned</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#142a1f] text-[10px] text-[#5d7c6e]">
                  Joined {member.joined_at?.split('T')[0] || '2026-09-01'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <div className="liquid-glass-panel rounded-xl p-5">
        <h3 className="text-sm font-bold text-white mb-1">Family Access Roles & Privileges</h3>
        <p className="text-xs text-[#5d7c6e] mb-4">
          Hierarchical privilege matrix for multi-user family governance
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-[#142a1f] bg-[#050e09] p-4 space-y-2">
            <div className="flex items-center space-x-2 text-[#34d399]">
              <Shield className="h-4 w-4" />
              <h4 className="text-xs font-bold text-white">Administrator</h4>
            </div>
            <p className="text-[11px] text-[#8da399] leading-relaxed">
              Full control over all accounts, bank connections, budget caps, savings targets, and family member invitations.
            </p>
          </div>

          <div className="rounded-lg border border-[#142a1f] bg-[#050e09] p-4 space-y-2">
            <div className="flex items-center space-x-2 text-[#34d399]">
              <Users className="h-4 w-4" />
              <h4 className="text-xs font-bold text-white">Member</h4>
            </div>
            <p className="text-[11px] text-[#8da399] leading-relaxed">
              Can record individual income and expenses, view shared budgets, and contribute to common family goals up to their assigned limit.
            </p>
          </div>

          <div className="rounded-lg border border-[#142a1f] bg-[#050e09] p-4 space-y-2">
            <div className="flex items-center space-x-2 text-[#5d7c6e]">
              <Lock className="h-4 w-4" />
              <h4 className="text-xs font-bold text-white">Viewer</h4>
            </div>
            <p className="text-[11px] text-[#8da399] leading-relaxed">
              Read-only transparency for children or dependents. Can inspect portfolio performance without permission to modify ledger entries.
            </p>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {addMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setAddMemberOpen(false)} />
          <div className="relative w-full max-w-md liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <h3 className="text-base font-bold text-white">Add Family Member</h3>
              <button
                onClick={() => setAddMemberOpen(false)}
                className="rounded-lg p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {memberError && (
              <div className="mt-4 flex items-center space-x-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{memberError}</span>
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. anjali or anjali.sharma@email.com"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">Role</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value as any)}
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                >
                  <option value="member">Member (Can record transactions)</option>
                  <option value="admin">Administrator (Full controls)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Monthly Spending Cap ({currentCurrency.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                  placeholder="e.g. 15000 (0 for no limit)"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#142a1f]">
                <button
                  type="button"
                  onClick={() => setAddMemberOpen(false)}
                  className="rounded-lg border border-[#142a1f] bg-[#0a1711] px-4 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="flex items-center space-x-1.5 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{savingMember ? 'Saving...' : 'Add Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editMemberOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditMemberOpen(false)} />
          <div className="relative w-full max-w-md liquid-glass-panel rounded-2xl p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between pb-4 border-b border-[#142a1f]">
              <h3 className="text-base font-bold text-white">
                Edit Member: {selectedMember.user?.full_name}
              </h3>
              <button
                onClick={() => setEditMemberOpen(false)}
                className="rounded-lg p-1.5 text-[#8da399] hover:bg-[#0f231a] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                >
                  <option value="member">Member</option>
                  <option value="admin">Administrator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1">
                  Monthly Spending Cap ({currentCurrency.symbol})
                </label>
                <input
                  type="number"
                  step="any"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  placeholder="0 for no limit"
                  className="w-full rounded-lg border border-[#142a1f] bg-[#050e09] px-3.5 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#142a1f]">
                <button
                  type="button"
                  onClick={() => setEditMemberOpen(false)}
                  className="rounded-lg border border-[#142a1f] bg-[#0a1711] px-4 py-2 text-xs font-semibold text-[#cbd5e1] hover:bg-[#0f231a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="flex items-center space-x-1.5 rounded-lg bg-[#10b981] hover:bg-[#34d399] px-4 py-2 text-xs font-bold text-[#041009] disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{savingMember ? 'Saving...' : 'Update Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
