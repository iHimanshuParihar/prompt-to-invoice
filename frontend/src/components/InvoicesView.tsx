'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Send,
  DollarSign,
  Trash2,
  Printer,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Mail,
  Calendar,
  Sparkles,
  Download,
  Copy,
  ExternalLink,
  MessageSquare,
  Repeat,
} from 'lucide-react';
import { api } from '../lib/api';

interface InvoicesViewProps {
  invoices: any[];
  profiles: any[];
  onRefresh: () => void;
  onOpenManualCreate: () => void;
  onOpenAiStudio: () => void;
  selectedInvoice: any | null;
  setSelectedInvoice: (inv: any | null) => void;
}

export default function InvoicesView({
  invoices,
  profiles,
  onRefresh,
  onOpenManualCreate,
  onOpenAiStudio,
  selectedInvoice,
  setSelectedInvoice,
}: InvoicesViewProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'wire' | 'cash' | 'credit_card'>('stripe');
  const [paymentNote, setPaymentNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // AI Reminder Modal
  const [reminderInvoice, setReminderInvoice] = useState<any | null>(null);
  const [reminderTone, setReminderTone] = useState<'friendly' | 'standard' | 'firm'>('standard');
  const [copiedReminder, setCopiedReminder] = useState(false);

  const tabs = [
    { id: 'all', label: 'All Invoices' },
    { id: 'sent', label: 'Sent / Pending' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'draft', label: 'Drafts' },
  ];

  const filteredInvoices = invoices.filter((inv) => {
    if (activeTab !== 'all' && inv.status !== activeTab) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.clientEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSendInvoice = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await api.sendInvoice(id);
      showToast(res.message || 'Invoice dispatched successfully via simulated email.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    setActionLoading(true);
    try {
      await api.deleteInvoice(id);
      showToast('Invoice deleted successfully.');
      if (selectedInvoice?.id === id) setSelectedInvoice(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateInvoice = async (inv: any) => {
    setActionLoading(true);
    try {
      const newInv = await api.createInvoice({
        profileId: inv.profileId,
        clientId: inv.clientId,
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
        clientAddress: inv.clientAddress,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: inv.currency,
        items: inv.items.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
        })),
        discountPercentage: inv.discountPercentage,
        notes: `Cloned from ${inv.invoiceNumber}. ${inv.notes || ''}`,
        paymentTerms: inv.paymentTerms,
        status: 'draft',
      });
      showToast(`Invoice duplicated as ${newInv.invoiceNumber}!`);
      onRefresh();
      setSelectedInvoice(newInv);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPayment = (inv: any) => {
    setPaymentModalInvoice(inv);
    setPaymentAmount(inv.balanceDue || inv.total);
    setPaymentNote(`Settlement for ${inv.invoiceNumber}`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    setActionLoading(true);
    try {
      await api.recordPayment(paymentModalInvoice.id, {
        amount: Number(paymentAmount),
        date: new Date().toISOString().split('T')[0],
        method: paymentMethod,
        note: paymentNote,
      });
      showToast(`Payment of ${paymentModalInvoice.currency} ${Number(paymentAmount).toFixed(2)} recorded!`);
      setPaymentModalInvoice(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPdfWindow = (invoiceId: string) => {
    const url = api.getInvoiceHtmlUrl(invoiceId);
    window.open(url, '_blank', 'width=900,height=950,scrollbars=yes,resizable=yes');
  };

  const handleExportCsv = () => {
    if (invoices.length === 0) return;
    const headers = [
      'Invoice Number',
      'Client Name',
      'Client Email',
      'Issue Date',
      'Due Date',
      'Currency',
      'Subtotal',
      'Tax Amount',
      'Discount Amount',
      'Total Amount',
      'Amount Paid',
      'Balance Due',
      'Status',
    ];
    const rows = invoices.map((i) => [
      i.invoiceNumber,
      `"${i.clientName.replace(/"/g, '""')}"`,
      i.clientEmail,
      i.issueDate,
      i.dueDate,
      i.currency,
      i.subtotal,
      i.taxTotal,
      i.discountAmount || 0,
      i.total,
      i.amountPaid || 0,
      i.balanceDue || 0,
      i.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PromptToInvoice-Report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Invoices exported to CSV successfully!');
  };

  const formatCurr = (amount: number, curr = 'USD') => {
    const symbol = curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '$';
    return `${symbol}${(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const activeIssuerProfile = selectedInvoice
    ? profiles.find((p) => p.id === selectedInvoice.profileId) || profiles[0]
    : profiles[0];

  // AI Reminder Template Generator
  const getReminderTemplate = () => {
    if (!reminderInvoice) return '';
    const name = reminderInvoice.clientName;
    const invNum = reminderInvoice.invoiceNumber;
    const amt = formatCurr(reminderInvoice.balanceDue || reminderInvoice.total, reminderInvoice.currency);
    const due = reminderInvoice.dueDate;

    if (reminderTone === 'friendly') {
      return `Hi ${name} Team,\n\nHope you're having a productive week! Just a friendly check-in regarding Invoice #${invNum} for ${amt}, which was due on ${due}.\n\nPlease let us know if you need another copy of the invoice or banking details. Thank you!\n\nBest regards,\n${activeIssuerProfile.name}`;
    } else if (reminderTone === 'firm') {
      return `URGENT: Outstanding Balance Notice\n\nDear Accounts Payable at ${name},\n\nOur records indicate that Invoice #${invNum} for ${amt} is now overdue (due date: ${due}).\n\nPlease confirm remittance of the outstanding balance via wire or Stripe transfer today to avoid late fees. Banking details are listed on the invoice statement.\n\nSincerely,\nFinance Department\n${activeIssuerProfile.name}`;
    }
    return `Dear ${name},\n\nThis is a standard payment reminder that Invoice #${invNum} in the amount of ${amt} reached its due date on ${due}.\n\nIf payment is already underway, please disregard this note. Otherwise, kindly remit payment at your earliest convenience.\n\nThank you,\n${activeIssuerProfile.name}`;
  };

  const handleCopyReminder = () => {
    navigator.clipboard.writeText(getReminderTemplate());
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 3000);
    showToast('Reminder copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{notification}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Invoices & Lifecycle Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Full-lifecycle billing, high-resolution PDF export, automated calculations, and multi-currency tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition border border-slate-200"
            title="Download CSV for accounting"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenManualCreate}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Form</span>
          </button>
          <button
            onClick={onOpenAiStudio}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm shadow-blue-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate with AI</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by client or invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No invoices match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>{inv.invoiceNumber}</span>
                      </div>
                      {inv.aiPromptOrigin && (
                        <span className="text-[9px] text-blue-500 font-medium flex items-center mt-0.5">
                          <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI Generated
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{inv.clientName}</div>
                      <div className="text-[11px] text-slate-400">{inv.clientEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.issueDate}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className={inv.status === 'overdue' ? 'text-rose-600 font-bold' : ''}>
                        {inv.dueDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurr(inv.total, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold">
                      {inv.balanceDue > 0 ? (
                        <span className="text-amber-600">{formatCurr(inv.balanceDue, inv.currency)}</span>
                      ) : (
                        <span className="text-emerald-600">Settled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
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
                      <div className="flex items-center justify-end space-x-1">
                        {/* Open Dedicated PDF / Print View */}
                        <button
                          onClick={() => handleOpenPdfWindow(inv.id)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          title="Open Standalone PDF / Print Sheet"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Quick Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {inv.status !== 'paid' && (
                          <>
                            <button
                              onClick={() => setReminderInvoice(inv)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Draft AI Payment Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSendInvoice(inv.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Send Simulated Email"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Record Client Payment"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDuplicateInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                          title="Duplicate Invoice"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal with Direct PDF Open */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Controls Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10 no-print">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-sm">
                  Invoice {selectedInvoice.invoiceNumber}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedInvoice.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {/* Standalone PDF Window trigger */}
                <button
                  onClick={() => handleOpenPdfWindow(selectedInvoice.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF / Print Sheet</span>
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Preview Body */}
            <div className="p-8 sm:p-12 invoice-card text-slate-800">
              <div className="flex justify-between items-start border-b-2 border-blue-600 pb-6 mb-6">
                <div>
                  <div className="text-2xl font-black text-blue-900 tracking-tight">
                    Prompt<span className="text-blue-600">ToInvoice</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">AI-Powered Invoicing Platform for Modern Business</div>
                </div>
                <div className="text-right">
                  <h1 className="text-2xl font-black text-slate-900">INVOICE</h1>
                  <div className="text-blue-600 font-bold text-sm mt-0.5">
                    #{selectedInvoice.invoiceNumber}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Billed By (Issuer)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{activeIssuerProfile.name}</div>
                  <div className="text-slate-600">{activeIssuerProfile.address}</div>
                  <div className="text-slate-600">
                    {activeIssuerProfile.city}, {activeIssuerProfile.country}
                  </div>
                  <div className="text-slate-600">{activeIssuerProfile.email}</div>
                  {activeIssuerProfile.taxNumber && (
                    <div className="text-slate-500 mt-1">{activeIssuerProfile.taxNumber}</div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Billed To (Client)
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{selectedInvoice.clientName}</div>
                  <div className="text-slate-600">{selectedInvoice.clientAddress || 'Corporate Headquarters'}</div>
                  <div className="text-slate-600">{selectedInvoice.clientEmail}</div>
                  {selectedInvoice.clientTaxNumber && (
                    <div className="text-slate-500 mt-1">VAT/Tax ID: {selectedInvoice.clientTaxNumber}</div>
                  )}
                  <div className="mt-3 text-slate-700">
                    <div><strong>Issue Date:</strong> {selectedInvoice.issueDate}</div>
                    <div><strong>Due Date:</strong> {selectedInvoice.dueDate}</div>
                  </div>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse mb-6">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
                    <th className="py-2.5 px-3 text-right w-16">Tax %</th>
                    <th className="py-2.5 px-3 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 px-3 font-medium text-slate-800">{it.description}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{it.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatCurr(it.unitPrice, selectedInvoice.currency)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">{it.taxRate}%</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurr(it.total, selectedInvoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="w-64 ml-auto space-y-1.5 text-xs text-slate-600 mb-8">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurr(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({selectedInvoice.discountPercentage}%):</span>
                    <span className="font-semibold">-{formatCurr(selectedInvoice.discountAmount, selectedInvoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax / VAT Total:</span>
                  <span className="font-semibold">{formatCurr(selectedInvoice.taxTotal, selectedInvoice.currency)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-blue-900 pt-2 border-t-2 border-slate-200">
                  <span>Total Due:</span>
                  <span>{formatCurr(selectedInvoice.total, selectedInvoice.currency)}</span>
                </div>
                {selectedInvoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-emerald-600 pt-1">
                      <span>Amount Paid:</span>
                      <span className="font-semibold">{formatCurr(selectedInvoice.amountPaid, selectedInvoice.currency)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Balance Remaining:</span>
                      <span>{formatCurr(selectedInvoice.balanceDue, selectedInvoice.currency)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-6 text-[11px] text-slate-500">
                <div>
                  <strong className="text-slate-700 block mb-1">Payment Instructions:</strong>
                  <div>{selectedInvoice.paymentTerms}</div>
                  {activeIssuerProfile.bankDetails && (
                    <div className="mt-1 text-slate-600 font-mono text-[10px]">
                      Bank: {activeIssuerProfile.bankDetails.bankName}<br />
                      {activeIssuerProfile.bankDetails.iban
                        ? `IBAN: ${activeIssuerProfile.bankDetails.iban} | BIC: ${activeIssuerProfile.bankDetails.bic}`
                        : `Routing: ${activeIssuerProfile.bankDetails.routingNumber} | Acct: ${activeIssuerProfile.bankDetails.accountNumber}`}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <strong className="text-slate-700 block mb-1">Notes & Remarks:</strong>
                  <div>{selectedInvoice.notes || 'Thank you for your business!'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-900 text-base">Record Payment</h3>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Recording settlement for <strong>{paymentModalInvoice.invoiceNumber}</strong> ({paymentModalInvoice.clientName}). Total outstanding: {formatCurr(paymentModalInvoice.balanceDue, paymentModalInvoice.currency)}.
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Amount ({paymentModalInvoice.currency})</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max={paymentModalInvoice.balanceDue || paymentModalInvoice.total}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
                >
                  <option value="stripe">Stripe Instant Transfer</option>
                  <option value="wire">Wire Transfer / SEPA</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Direct Deposit / Cash</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Transaction Note / Reference</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  placeholder="e.g. Wire confirmation #99281"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Overdue Payment Reminder Modal */}
      {reminderInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>AI Payment Reminder Drafter</span>
              </div>
              <button onClick={() => setReminderInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              AI-generated personalized reminder for <strong>{reminderInvoice.clientName}</strong> (#{reminderInvoice.invoiceNumber}).
            </p>

            {/* Tone Selector */}
            <div className="flex items-center space-x-2 mb-3 text-xs">
              <span className="font-bold text-slate-600">Tone:</span>
              <button
                type="button"
                onClick={() => setReminderTone('friendly')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  reminderTone === 'friendly' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Gentle Check-in
              </button>
              <button
                type="button"
                onClick={() => setReminderTone('standard')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  reminderTone === 'standard' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Standard Professional
              </button>
              <button
                type="button"
                onClick={() => setReminderTone('firm')}
                className={`px-3 py-1 rounded-lg font-semibold transition ${
                  reminderTone === 'firm' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Firm / Urgent
              </button>
            </div>

            {/* Message Preview */}
            <textarea
              rows={8}
              readOnly
              value={getReminderTemplate()}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 leading-relaxed outline-none"
            />

            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={handleCopyReminder}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedReminder ? 'Copied!' : 'Copy Email'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSendInvoice(reminderInvoice.id);
                  setReminderInvoice(null);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Simulated Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
