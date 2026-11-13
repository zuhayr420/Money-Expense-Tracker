import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, ShieldCheck, Wifi, Sparkles, Check } from 'lucide-react';
import { Card, Account } from '../../types';
import { cardsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (card: Card) => void;
  existingCard?: Card | null;
  accounts?: Account[];
}

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingCard,
  accounts = [],
}) => {
  const { user } = useAuth();

  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cardLabel, setCardLabel] = useState('Verdela Black');
  const [network, setNetwork] = useState<Card['network']>('mastercard');
  const [colorTheme, setColorTheme] = useState<Card['color_theme']>('emerald');
  const [accountId, setAccountId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingCard) {
      setCardholderName(existingCard.cardholder_name || '');
      setCardNumber(existingCard.card_number || '');
      setExpiryDate(existingCard.expiry_date || '');
      setCardLabel(existingCard.card_label || 'Verdela Black');
      setNetwork(existingCard.network || 'mastercard');
      setColorTheme(existingCard.color_theme || 'emerald');
      setAccountId(existingCard.account_id || '');
    } else {
      setCardholderName(user?.full_name || user?.username || '');
      setCardNumber('');
      setExpiryDate('');
      setCardLabel('Verdela Black');
      setNetwork('mastercard');
      setColorTheme('emerald');
      setAccountId(accounts.length > 0 ? accounts[0].id : '');
    }
    setError(null);
  }, [existingCard, isOpen, user, accounts]);

  if (!isOpen) return null;

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Format expiry date with MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiryDate(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setExpiryDate(raw);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 12) {
      setError('Please enter a valid card number (at least 12 digits)');
      return;
    }

    if (!expiryDate || expiryDate.length < 5) {
      setError('Please enter a valid expiry date in MM/YY format');
      return;
    }

    try {
      setLoading(true);
      const payload: Partial<Card> = {
        cardholder_name: cardholderName.trim() || user?.full_name || 'Cardholder',
        card_number: cleanNumber,
        expiry_date: expiryDate.trim(),
        card_label: cardLabel.trim() || 'Verdela Card',
        network,
        color_theme: colorTheme,
        account_id: accountId ? Number(accountId) : null,
      };

      let savedCard: Card;
      if (existingCard?.id) {
        savedCard = await cardsApi.update(existingCard.id, payload);
      } else {
        savedCard = await cardsApi.create(payload);
      }

      window.dispatchEvent(new CustomEvent('finance_data_updated'));
      onSuccess(savedCard);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save card details');
    } finally {
      setLoading(false);
    }
  };

  // Liquid Glass theme styling
  const getThemeClasses = (theme: Card['color_theme']) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Dialog with Liquid Glass and 120fps spring physics */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className="relative w-full max-w-xl rounded-3xl liquid-glass-panel p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#12281e]">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-xl bg-[#10b981]/20 p-2 text-[#34d399] border border-[#10b981]/30">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 id="card-modal-title" className="text-base font-extrabold text-white">
                {existingCard ? 'Edit Card Details' : 'Configure Custom Card'}
              </h2>
              <p className="text-xs text-[#5d7c6e]">
                Set your cardholder name, card number, and visual styling
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-[#5d7c6e] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Live Interactive Liquid Glass Card Preview */}
        <div className="my-5 relative">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#5d7c6e] mb-2">
            Live Liquid Glass Preview
          </span>

          {/* Ambient Liquid Glows behind the translucent glass */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-24 w-32 rounded-full bg-[#10b981]/25 blur-2xl pointer-events-none" />
          <div className="absolute top-1/3 right-1/4 h-28 w-36 rounded-full bg-[#34d399]/20 blur-2xl pointer-events-none" />

          <div
            className={`relative overflow-hidden rounded-2xl ${getThemeClasses(
              colorTheme
            )} p-5 text-white min-h-[190px] flex flex-col justify-between transition-all duration-300`}
          >
            {/* Diagonal Specular Sheen */}
            <div className="absolute inset-0 liquid-glass-sheen pointer-events-none" />

            {/* Liquid Refraction Orbs */}
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-[#10b981]/20 blur-xl pointer-events-none" />

            {/* Top Row: Chip & Label */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center space-x-3">
                <div className="h-7 w-10 rounded-md bg-gradient-to-tr from-[#d4af37] via-[#f7e7a9] to-[#c59e2b] shadow-inner border border-amber-300/40 flex items-center justify-center p-1">
                  <div className="h-full w-full border border-amber-800/30 rounded-xs flex flex-col justify-around">
                    <div className="h-[1px] bg-amber-900/30 w-full" />
                    <div className="h-[1px] bg-amber-900/30 w-full" />
                  </div>
                </div>
                <Wifi className="h-4 w-4 text-white/70 rotate-90" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-white/90">
                {cardLabel || 'Verdela'}
              </span>
            </div>

            {/* Center: Number */}
            <div className="my-3 z-10">
              <p className="font-mono text-base sm:text-lg tracking-[0.22em] text-white/95 font-semibold">
                {cardNumber || '••••  ••••  ••••  ••••'}
              </p>
            </div>

            {/* Bottom Row: Holder, Expiry, Brand Logo */}
            <div className="flex items-end justify-between z-10">
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-white/60">
                  Cardholder
                </span>
                <p className="text-xs font-bold tracking-wide uppercase text-white">
                  {cardholderName || user?.full_name || 'YOUR NAME'}
                </p>
              </div>

              <div className="text-center">
                <span className="block text-[8px] uppercase tracking-wider text-white/60">
                  Expires
                </span>
                <p className="text-xs font-mono font-bold text-white">
                  {expiryDate || 'MM/YY'}
                </p>
              </div>

              {/* Dynamic Network Logo */}
              <div className="flex items-center">
                {network === 'mastercard' && (
                  <div className="flex -space-x-2.5 items-center">
                    <div className="h-6 w-6 rounded-full bg-[#ef4444]/90 shadow-md" />
                    <div className="h-6 w-6 rounded-full bg-[#f59e0b]/90 shadow-md" />
                  </div>
                )}
                {network === 'visa' && (
                  <span className="font-black italic text-lg tracking-tighter text-white">
                    VISA
                  </span>
                )}
                {network === 'amex' && (
                  <span className="font-extrabold text-xs tracking-wider bg-blue-600 px-2 py-0.5 rounded text-white border border-blue-400">
                    AMEX
                  </span>
                )}
                {network === 'rupay' && (
                  <span className="font-bold text-xs tracking-wide bg-orange-600 px-2 py-0.5 rounded text-white border border-orange-400">
                    RuPay
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cardholder Name */}
            <div>
              <label className="block text-xs font-medium text-[#8da399] mb-1.5">
                Cardholder Name *
              </label>
              <input
                type="text"
                required
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                placeholder="e.g. Zuhayr Ahmed"
                className="w-full rounded-xl border border-[#142c20] bg-[#050e09] px-3.5 py-2.5 text-xs text-white placeholder-[#456353] focus:border-[#10b981] focus:outline-none"
              />
            </div>

            {/* Card Label / Nickname */}
            <div>
              <label className="block text-xs font-medium text-[#8da399] mb-1.5">
                Card Nickname / Title
              </label>
              <input
                type="text"
                value={cardLabel}
                onChange={(e) => setCardLabel(e.target.value)}
                placeholder="e.g. Verdela Black, Salary Card"
                className="w-full rounded-xl border border-[#142c20] bg-[#050e09] px-3.5 py-2.5 text-xs text-white placeholder-[#456353] focus:border-[#10b981] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Number */}
            <div>
              <label className="block text-xs font-medium text-[#8da399] mb-1.5">
                Card Number *
              </label>
              <input
                type="text"
                required
                maxLength={19}
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="4532 8921 7734 4821"
                className="w-full font-mono rounded-xl border border-[#142c20] bg-[#050e09] px-3.5 py-2.5 text-xs text-white placeholder-[#456353] tracking-widest focus:border-[#10b981] focus:outline-none"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-xs font-medium text-[#8da399] mb-1.5">
                Expiry Date (MM/YY) *
              </label>
              <input
                type="text"
                required
                maxLength={5}
                value={expiryDate}
                onChange={handleExpiryChange}
                placeholder="12/28"
                className="w-full font-mono rounded-xl border border-[#142c20] bg-[#050e09] px-3.5 py-2.5 text-xs text-white placeholder-[#456353] focus:border-[#10b981] focus:outline-none"
              />
            </div>
          </div>

          {/* Network & Theme Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Network */}
            <div>
              <label className="block text-xs font-medium text-[#8da399] mb-1.5">
                Payment Network
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['mastercard', 'visa', 'rupay', 'amex'] as const).map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setNetwork(net)}
                    className={`rounded-xl border py-2 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      network === net
                        ? 'border-[#10b981] bg-[#10b981]/20 text-[#34d399]'
                        : 'border-[#142c20] bg-[#050e09] text-[#5d7c6e] hover:text-white'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-xs font-medium text-[#8da399] mb-1.5">
                Card Aesthetic Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    { id: 'emerald', label: 'Emerald' },
                    { id: 'obsidian', label: 'Obsidian' },
                    { id: 'royal', label: 'Royal' },
                    { id: 'gold', label: 'Gold' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setColorTheme(t.id)}
                    className={`rounded-xl border py-2 text-[10px] font-bold transition-all cursor-pointer ${
                      colorTheme === t.id
                        ? 'border-[#10b981] bg-[#10b981]/20 text-[#34d399]'
                        : 'border-[#142c20] bg-[#050e09] text-[#5d7c6e] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Linked Account */}
          {accounts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#8da399] mb-1.5">
                Link to Account / Vault
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-[#142c20] bg-[#050e09] px-3.5 py-2.5 text-xs text-white focus:border-[#10b981] focus:outline-none"
              >
                <option value="">None (Standalone Card)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.account_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-[#12281e]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#142c20] bg-[#050e09] px-4 py-2 text-xs font-semibold text-[#8da399] hover:bg-[#0c1a13] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 rounded-xl bg-[#10b981] px-5 py-2 text-xs font-bold text-black hover:bg-[#34d399] transition-all cursor-pointer shadow-lg shadow-[#10b981]/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{existingCard ? 'Update Card' : 'Save Card Details'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
