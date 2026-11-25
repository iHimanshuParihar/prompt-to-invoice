'use client';

import React from 'react';
import { Search, Sparkles, Bell, Plus, ShieldCheck, Menu, X, DollarSign, LogOut } from 'lucide-react';

interface NavbarProps {
  onOpenAiStudio: () => void;
  onOpenManualCreate: () => void;
  currencyFilter: string;
  setCurrencyFilter: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  currentUser?: any;
  onLogout?: () => void;
}

export default function Navbar({
  onOpenAiStudio,
  onOpenManualCreate,
  currencyFilter,
  setCurrencyFilter,
  searchQuery,
  setSearchQuery,
  onToggleMobileMenu,
  isMobileMenuOpen,
  currentUser,
  onLogout,
}: NavbarProps) {
  const currencies = [
    { id: 'all', label: 'All' },
    { id: 'USD', label: 'USD ($)' },
    { id: 'EUR', label: 'EUR (€)' },
    { id: 'GBP', label: 'GBP (£)' },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'JD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition">
      {/* Left: Mobile Toggle & Search */}
      <div className="flex items-center space-x-3 flex-1 max-w-md">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Global Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search invoices, clients, amounts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100/80 hover:bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right: Currency Filter & Primary Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3 ml-2 sm:ml-4">
        {/* Currency Switcher (Hidden on xs, visible sm+) */}
        <div className="hidden sm:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs">
          {currencies.map((c) => (
            <button
              key={c.id}
              onClick={() => setCurrencyFilter(c.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition duration-150 ${
                currencyFilter === c.id
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Currency Dropdown for Mobile (xs only) */}
        <div className="sm:hidden">
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">All</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Manual Invoice Create (Desktop only) */}
        <button
          onClick={onOpenManualCreate}
          className="hidden md:flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition border border-slate-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Manual</span>
        </button>

        {/* AI Prompt Invoice CTA */}
        <button
          onClick={onOpenAiStudio}
          className="flex items-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black px-3 sm:px-4 py-2 rounded-xl text-xs shadow-md shadow-blue-500/25 transition transform active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-200 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="hidden xs:inline">New AI Invoice</span>
          <span className="xs:hidden">New AI</span>
        </button>

        {/* User Avatar & Logout */}
        <div className="flex items-center space-x-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-sm ring-2 ring-blue-500/20">
            {getInitials(currentUser?.name)}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-black text-slate-800 leading-tight">
              {currentUser?.name || 'Workspace Owner'}
            </div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center">
              <ShieldCheck className="w-3 h-3 mr-0.5" />
              Secure Cookie Session
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out (destroys cookie session)"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
