'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Zap,
  Globe2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('jane@aurastudio.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await api.login({ email, password });
        onLoginSuccess(res.user);
      } else {
        if (!name.trim()) {
          setError('Please enter your full name or company name');
          setLoading(false);
          return;
        }
        const res = await api.register({ name, email, password, currency });
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoCurrency: 'USD' | 'EUR') => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email: demoEmail, password: 'password123' });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-slate-950">
      {/* Background dynamic ambient glow orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #60A5FA 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Brand header with animated glow */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-900/60 to-blue-900/60 border border-blue-500/30 backdrop-blur-md shadow-lg shadow-blue-900/30 mb-3 animate-fade-in">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/40">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              Prompt<span className="text-blue-400">ToInvoice</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 tracking-wider uppercase">
              v2.0
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {tab === 'login' ? 'Welcome back' : 'Create your workspace'}
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            {tab === 'login'
              ? 'Sign in to access your business profiles, AI invoicing & revenue analytics'
              : 'Join high-growth consultants and agencies automating cross-border invoicing'}
          </p>
        </div>

        {/* 1-Click Quick Demo Accounts Bar */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-900/70 border border-blue-500/20 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>1-Click Quick Demo Switcher</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Isolated Data</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('jane@aurastudio.com', 'USD')}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-800/90 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-500/50 text-left transition-all duration-200 group"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-300 group-hover:scale-105 transition-transform">
                🇺🇸
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-200 truncate group-hover:text-blue-300">Jane Doe</div>
                <div className="text-[10px] text-slate-400 truncate">US Studio • USD ($)</div>
              </div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('marcus@nordicdigital.io', 'EUR')}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-slate-800/90 hover:bg-indigo-900/40 border border-slate-700 hover:border-indigo-500/50 text-left transition-all duration-200 group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-300 group-hover:scale-105 transition-transform">
                🇪🇺
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-200 truncate group-hover:text-indigo-300">Marcus L.</div>
                <div className="text-[10px] text-slate-400 truncate">EU Agency • EUR (€)</div>
              </div>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="relative rounded-3xl bg-slate-900/80 border border-slate-700/60 backdrop-blur-2xl shadow-2xl p-6 sm:p-8">
          {/* Tab selector */}
          <div className="flex rounded-xl bg-slate-950/60 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                tab === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                tab === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name / Company
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan Studio"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Password</label>
                {tab === 'login' && (
                  <span className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Default Billing Currency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['USD', 'EUR', 'GBP'] as const).map((curr) => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        currency === curr
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm'
                          : 'bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span>{curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£'}</span>
                      <span>{curr}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 flex items-start gap-2.5 text-[11px] text-blue-300/90">
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-200">HTTP-Only Cookie Session:</strong> Tokens are never stored in browser localStorage, shielding your financial data from cross-site scripting (XSS).
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating session...</span>
                </>
              ) : (
                <>
                  <span>{tab === 'login' ? 'Sign In to Workspace' : 'Create Free Workspace'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              {tab === 'login' ? "Don't have an account yet?" : 'Already have an existing workspace?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setTab(tab === 'login' ? 'register' : 'login');
                  setError(null);
                }}
                className="text-blue-400 hover:text-blue-300 font-bold underline cursor-pointer"
              >
                {tab === 'login' ? 'Sign up for free' : 'Sign in here'}
              </button>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bank-Grade 256-Bit TLS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Multi-Tenant Scoped Data</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>SOC2 Type II Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
