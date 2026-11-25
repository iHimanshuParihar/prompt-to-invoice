'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Send,
  Eye,
  CheckCircle,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Globe2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardViewProps {
  metrics: any;
  invoices: any[];
  onOpenAiWithPrompt: (prompt: string) => void;
  onViewInvoice: (invoice: any) => void;
  onSendInvoice: (id: string) => void;
  onRecordPayment: (invoice: any) => void;
  currencyFilter: string;
}

export default function DashboardView({
  metrics,
  invoices,
  onOpenAiWithPrompt,
  onViewInvoice,
  onSendInvoice,
  onRecordPayment,
  currencyFilter,
}: DashboardViewProps) {
  const [quickPrompt, setQuickPrompt] = useState('');

  const summary = metrics?.summary || {
    totalBilled: 0,
    totalReceived: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    paidRate: 0,
    averageInvoiceValue: 0,
  };

  const monthlyTrend = metrics?.monthlyTrend || [];
  const statusCounts = metrics?.statusCounts || { paid: 0, sent: 0, overdue: 0, draft: 0 };
  const currencyDistribution = metrics?.currencyDistribution || [];
  const aiInsights = metrics?.aiInsights || [];

  const pieData = [
    { name: 'Paid', value: statusCounts.paid, color: '#10B981' },
    { name: 'Sent', value: statusCounts.sent, color: '#2563EB' },
    { name: 'Overdue', value: statusCounts.overdue, color: '#EF4444' },
    { name: 'Draft', value: statusCounts.draft, color: '#94A3B8' },
  ].filter((d) => d.value > 0);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onOpenAiWithPrompt(quickPrompt);
    setQuickPrompt('');
  };

  const formatCurr = (amount: number, curr = 'USD') => {
    const symbol = curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '$';
    return `${symbol}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Hero Quick AI Prompt Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/15 border border-blue-400/30">
        {/* Subtle background graphic glows */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-12 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-blue-100 text-xs font-bold uppercase tracking-wider mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Conversational Invoicing Engine</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight mb-2 leading-tight">
            Turn ordinary language into professional invoices in seconds.
          </h2>

          <p className="text-blue-100/90 text-xs sm:text-sm mb-5 leading-relaxed font-medium">
            Describe what you did in everyday words — line items, rates, taxes, currency, and payment terms are extracted instantly.
          </p>

          <form onSubmit={handleQuickSubmit} className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="e.g. 15 hours UX design for Acme Corp at $125/hr, 20% VAT in USD, Net 30..."
                value={quickPrompt}
                onChange={(e) => setQuickPrompt(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md border border-white/25 text-white placeholder-blue-200/70 text-xs sm:text-sm rounded-xl pl-4 pr-4 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="bg-white hover:bg-blue-50 text-blue-700 font-black px-6 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-black/10 active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Draft Invoice</span>
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-2 border-t border-white/15">
            <span className="text-[11px] text-blue-200 font-bold uppercase tracking-wider">Quick Suggestions:</span>
            {[
              '10 hours consulting for Acme Corp at $120/hr, due in 30 days',
              '€2,400 monthly Kubernetes retainer for Hooli Cloud EU, 20% VAT',
              '3 logo mockups at $500 each for Linear, 5% discount',
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onOpenAiWithPrompt(preset)}
                className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-3 py-1 rounded-full transition border border-white/20 truncate max-w-xs"
              >
                &ldquo;{preset.slice(0, 36)}...&rdquo;
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Billed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Billed</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ${summary.totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 mt-2">
            <ArrowUpRight className="w-4 h-4 mr-0.5" />
            <span>+18.4% billed vs last quarter</span>
          </div>
        </div>

        {/* Card 2: Cash Inflow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Paid Inflow</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ${summary.totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center text-xs text-slate-500 font-semibold mt-2">
            <span className="font-extrabold text-emerald-600 mr-1">{summary.paidRate}%</span>
            <span>collection efficiency</span>
          </div>
        </div>

        {/* Card 3: Pending / Sent */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Pending / Sent</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ${summary.totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-2">
            {statusCounts.sent} active sent invoices
          </div>
        </div>

        {/* Card 4: Overdue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Overdue</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
            ${summary.totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-500 font-bold mt-2 flex items-center">
            <ShieldAlert className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>{statusCounts.overdue} invoice needs reminder</span>
          </div>
        </div>
      </div>

      {/* Main Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">Monthly Invoicing & Cash Collections</h3>
              <p className="text-xs text-slate-500">Gross billings compared against collected customer cash</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-blue-600 mr-1.5" />
                <span>Billed</span>
              </div>
              <div className="flex items-center font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5" />
                <span>Collected</span>
              </div>
            </div>
          </div>

          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="billedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="receivedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '10px', color: '#FFF', fontSize: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                  formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="billed" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#billedGrad)" />
                <Area type="monotone" dataKey="received" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#receivedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base">Portfolio Status</h3>
            <p className="text-xs text-slate-500">Distribution of active invoices</p>
          </div>

          <div className="h-52 w-full my-auto flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '10px', color: '#FFF', fontSize: '12px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">{invoices.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Invoices</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-semibold">Paid ({statusCounts.paid})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600 font-semibold">Sent ({statusCounts.sent})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-semibold">Overdue ({statusCounts.overdue})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600 font-semibold">Draft ({statusCounts.draft})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Multi-Currency Support & AI Predictive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi-Currency Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">US & European Currencies</h3>
              <p className="text-xs text-slate-500">Cross-border billing volume</p>
            </div>
            <Globe2 className="w-4 h-4 text-blue-600" />
          </div>

          <div className="space-y-3">
            {currencyDistribution.map((c: any) => (
              <div key={c.currency} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600/10 text-blue-700 font-black text-xs flex items-center justify-center">
                      {c.symbol}
                    </span>
                    <span className="font-bold text-xs text-slate-800">{c.currency} Portfolio</span>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    {c.symbol}{c.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (c.total / (summary.totalBilled || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                  <span>{c.count} active invoices</span>
                  <span>{Math.round((c.total / (summary.totalBilled || 1)) * 100)}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Predictive Insights Cards */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-slate-900 text-base">AI Financial Visibility & Actions</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Live Insights
              </span>
            </div>

            <div className="space-y-3">
              {aiInsights.map((insight: any, i: number) => {
                const isWarning = insight.type === 'warning';
                const isGrowth = insight.type === 'growth';
                return (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border transition ${
                      isWarning
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : isGrowth
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center">
                      {isWarning && <AlertTriangle className="w-4 h-4 text-rose-600 mr-2 flex-shrink-0" />}
                      {isGrowth && <TrendingUp className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />}
                      {!isWarning && !isGrowth && <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />}
                      <span>{insight.title}</span>
                    </div>
                    <p className="text-xs opacity-90 mt-1 leading-relaxed pl-6">{insight.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base">Recent Invoices</h3>
            <p className="text-xs text-slate-500">Live invoicing activity across all registered clients</p>
          </div>
          <span className="text-xs text-blue-600 font-extrabold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {invoices.length} Total Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Issue / Due Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {invoices.slice(0, 6).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>{inv.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800">{inv.clientName}</div>
                    <div className="text-[11px] text-slate-400">{inv.clientEmail}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div>{inv.issueDate}</div>
                    <div className="text-[10px] text-slate-400">Due {inv.dueDate}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">
                    {formatCurr(inv.total, inv.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'sent'
                          ? 'bg-blue-100 text-blue-800'
                          : inv.status === 'overdue'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View & Print"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {inv.status !== 'paid' && (
                        <>
                          <button
                            onClick={() => onSendInvoice(inv.id)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="Send Email"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRecordPayment(inv)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Record Payment"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
