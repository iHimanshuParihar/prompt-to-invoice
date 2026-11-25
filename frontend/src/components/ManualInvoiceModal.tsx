'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Send, Building } from 'lucide-react';
import { api } from '../lib/api';

interface ManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: any[];
  currentProfileId: string;
  clients: any[];
  onInvoiceCreated: (inv: any) => void;
}

export default function ManualInvoiceModal({
  isOpen,
  onClose,
  profiles,
  currentProfileId,
  clients,
  onInvoiceCreated,
}: ManualInvoiceModalProps) {
  const [profileId, setProfileId] = useState(currentProfileId);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 days');
  const [notes, setNotes] = useState('Thank you for your business!');
  const [discountPercentage, setDiscountPercentage] = useState(0);

  const [items, setItems] = useState<any[]>([
    {
      description: 'Consulting & Deliverables Sprint 1',
      quantity: 10,
      unitPrice: 120,
      taxRate: 0,
      total: 1200,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectClient = (clientId: string) => {
    const matched = clients.find((c) => c.id === clientId);
    if (matched) {
      setClientName(matched.companyName);
      setClientEmail(matched.email);
      setClientAddress(`${matched.address || ''}, ${matched.city || ''}`);
      setCurrency(matched.currency);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: '',
        quantity: 1,
        unitPrice: 100,
        taxRate: 0,
        total: 100,
      },
    ]);
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    const qty = field === 'quantity' ? parseFloat(val) || 0 : updated[idx].quantity;
    const price = field === 'unitPrice' ? parseFloat(val) || 0 : updated[idx].unitPrice;
    updated[idx].total = Math.round(qty * price * 100) / 100;
    setItems(updated);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = Math.round(items.reduce((sum, it) => sum + (it.total || 0), 0) * 100) / 100;
  const discountAmount = Math.round(((subtotal * discountPercentage) / 100) * 100) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);

  let taxTotal = 0;
  for (const it of items) {
    if (it.taxRate > 0) {
      const itemTax = (it.total * (1 - discountPercentage / 100) * it.taxRate) / 100;
      taxTotal += itemTax;
    }
  }
  taxTotal = Math.round(taxTotal * 100) / 100;
  const grandTotal = Math.round((taxableBase + taxTotal) * 100) / 100;
  const currSymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || items.length === 0) {
      setError('Please fill in required client details and at least one line item.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        profileId,
        clientName,
        clientEmail,
        clientAddress,
        issueDate,
        dueDate,
        currency,
        items: items.map((i) => ({
          description: i.description || 'Service deliverable',
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          taxRate: Number(i.taxRate) || 0,
        })),
        discountPercentage: Number(discountPercentage) || 0,
        paymentTerms,
        notes,
        status: 'sent',
      };

      const created = await api.createInvoice(payload);
      onInvoiceCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">New Invoice (Manual Form)</h3>
            <p className="text-xs text-slate-500">Create a standard custom invoice with precision</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
              {error}
            </div>
          )}

          {/* Issuer & Quick Client Select */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Issuing Business Profile</label>
              <select
                value={profileId}
                onChange={(e) => setProfileId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Select Existing Client (Optional)</label>
              <select
                onChange={(e) => handleSelectClient(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
              >
                <option value="">-- Choose registered client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Client Company / Name *</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                placeholder="e.g. Stripe Inc."
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Billing Email *</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                placeholder="billing@company.com"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e: any) => setCurrency(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          {/* Dates & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Payment Terms</label>
              <input
                type="text"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
              />
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Line Items</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-blue-600 font-bold hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left min-w-[550px]">
                <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 w-20 text-center">Qty</th>
                    <th className="py-2 px-3 w-24 text-right">Price</th>
                    <th className="py-2 px-3 w-16 text-right">Tax %</th>
                    <th className="py-2 px-3 w-24 text-right">Total</th>
                    <th className="py-2 px-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-transparent border-none p-1 font-medium"
                          placeholder="e.g. Design consulting"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-16 text-center border border-slate-200 rounded p-1"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-20 text-right border border-slate-200 rounded p-1"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={it.taxRate}
                          onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-12 text-right border border-slate-200 rounded p-1"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {currSymbol}{it.total?.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Notes / Instructions</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{currSymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Discount %:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                  className="w-16 text-right bg-white border border-slate-300 rounded px-1.5 py-0.5"
                />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax / VAT Amount:</span>
                <span className="font-semibold">{currSymbol}{taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-blue-900 pt-2 border-t border-slate-200">
                <span>Total Due:</span>
                <span>{currSymbol}{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating...' : 'Save & Issue Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
