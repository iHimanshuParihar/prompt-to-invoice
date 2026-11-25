'use client';

import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Users,
  Building2,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  Globe2,
  X,
  Zap,
  LogOut,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  profiles: any[];
  currentProfileId: string;
  setCurrentProfileId: (id: string) => void;
  subscription: any;
  backendHealthy: boolean;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onLogout?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  profiles,
  currentProfileId,
  setCurrentProfileId,
  subscription,
  backendHealthy,
  isOpen,
  onClose,
  currentUser,
  onLogout,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'ai-studio', label: 'AI Prompt Studio', icon: Sparkles, badge: 'AI' },
    { id: 'invoices', label: 'Invoices & Payments', icon: FileText },
    { id: 'clients', label: 'Clients Directory', icon: Users },
    { id: 'profiles', label: 'Business Profiles', icon: Building2 },
    { id: 'pricing', label: 'Plans & Upgrades', icon: CreditCard },
  ];

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || profiles[0];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 lg:w-64 bg-[#0B1120] text-slate-300 flex flex-col border-r border-slate-800/80 z-50 select-none shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-black text-white text-base tracking-tight flex items-center space-x-1">
                <span>Prompt</span>
                <span className="text-blue-400">ToInvoice</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Next-Gen Billing SaaS
              </div>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white lg:hidden rounded-lg hover:bg-slate-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Business Profile Entity Switcher */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              Active Entity
            </span>
            <span className="text-blue-400 font-bold flex items-center text-[10px] bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
              <Globe2 className="w-3 h-3 mr-1" />
              {currentProfile?.currency || 'USD'}
            </span>
          </div>
          <div className="relative">
            <select
              value={currentProfileId}
              onChange={(e) => setCurrentProfileId(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 text-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer pr-8 text-ellipsis overflow-hidden shadow-inner"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currency})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 px-3 py-1.5">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850 hover:bg-slate-800/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r-full shadow-sm" />
                )}
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-500/30 text-blue-200 border border-blue-400/40 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Subscription Tier Card */}
        <div className="p-3.5 m-3 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/90 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-white capitalize flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-sm shadow-emerald-400/50" />
              {subscription?.tierName || 'Professional'}
            </span>
            <span className="text-[10px] font-extrabold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/60">
              {subscription?.invoicesLimit ? `${subscription.invoicesLimit}/mo` : 'Unlimited'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mb-3 leading-snug">
            {subscription?.tier === 'starter'
              ? `${subscription?.invoicesUsedThisMonth || 0}/5 invoices used this month.`
              : 'Unlimited AI parsing & multi-currency billing active.'}
          </div>
          <button
            onClick={() => setCurrentTab('pricing')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold py-2 rounded-xl transition shadow-md shadow-blue-500/20 text-center flex items-center justify-center space-x-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-blue-200" />
            <span>Manage Plan</span>
          </button>
        </div>

        {/* Signed In User Card & Logout */}
        {currentUser && (
          <div className="mx-3 mb-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign out of current account"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Backend Status Footer */}
        <div className="p-3 border-t border-slate-800/60 px-4 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/40">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${backendHealthy ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-amber-500'}`}
            />
            <span className="text-slate-400 text-[10px] font-medium">
              {backendHealthy ? 'NestJS API Connected' : 'Reconnecting...'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v1.1</span>
        </div>
      </aside>
    </>
  );
}
