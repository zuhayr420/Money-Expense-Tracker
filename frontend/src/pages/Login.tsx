import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(username.trim(), password);
      } else {
        if (!email.trim()) {
          setError('Email is required');
          setLoading(false);
          return;
        }
        await register(username.trim(), email.trim(), password, fullName.trim() || undefined);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background:
          'radial-gradient(ellipse at 25% 20%, rgba(16,185,129,0.09) 0%, transparent 55%), radial-gradient(ellipse at 78% 80%, rgba(16,185,129,0.05) 0%, transparent 50%), #060c09',
      }}
    >
      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10b981]"
            style={{
              boxShadow: '0 0 40px rgba(16,185,129,0.35), inset 0 1px 2px rgba(255,255,255,0.4)',
            }}
          >
            <span className="text-3xl font-black text-[#041009]">V</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Verdela</h1>
          <p className="text-xs text-[#8da399]">
            Premium Family Finance &amp; Budget Governance Platform
          </p>
        </div>

        {/* Login Card — Liquid Glass */}
        <div className="liquid-glass-panel rounded-2xl p-8">
          {/* Tab Selector */}
          <div
            className="grid grid-cols-2 gap-1 rounded-xl p-1 mb-6"
            style={{
              background: 'rgba(5,14,10,0.65)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(52,211,153,0.14)',
            }}
          >
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`rounded-lg py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? 'bg-[#10b981] text-[#041009] font-bold'
                  : 'text-[#8da399] hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`rounded-lg py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isLogin
                  ? 'bg-[#10b981] text-[#041009] font-bold'
                  : 'text-[#8da399] hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>

          {error && (
            <div
              className="mb-4 flex items-center space-x-2 rounded-xl p-3 text-xs text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)' }}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1.5">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5d7c6e] z-10 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Zuhayr"
                    className="liquid-glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-[#5d7c6e]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#8da399] mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5d7c6e] z-10 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. zuhayr"
                  className="liquid-glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-[#5d7c6e]"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-[#8da399] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5d7c6e] z-10 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="zuhayr@example.com"
                    className="liquid-glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-[#5d7c6e]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#8da399] mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-[#5d7c6e] z-10 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="liquid-glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-xs placeholder-[#5d7c6e]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="liquid-mint-cta w-full mt-2 flex items-center justify-center space-x-2 rounded-xl py-3 text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Processing...' : isLogin ? 'Sign In to Vault' : 'Create My Family Vault'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div
            className="mt-6 pt-4 text-center"
            style={{ borderTop: '1px solid rgba(52,211,153,0.13)' }}
          >
            <p className="text-xs text-[#5d7c6e]">
              {isLogin
                ? "Don't have an account yet? Click 'Create Account' above."
                : 'Already registered? Click "Sign In" above to access your vault.'}
            </p>
          </div>
        </div>

        {/* Footer tagline */}
        <p className="text-center text-[10px] text-[#4a6459]">
          Secured with AES-256 encryption · Family-grade privacy
        </p>
      </div>
    </div>
  );
};
