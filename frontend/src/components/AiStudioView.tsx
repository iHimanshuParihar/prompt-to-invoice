'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  Building,
  Calendar,
  DollarSign,
  HelpCircle,
  Sliders,
  Mic,
  MicOff,
  Code,
  Palette,
  Briefcase,
  Layers,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';

interface AiStudioViewProps {
  initialPrompt?: string;
  profiles: any[];
  currentProfileId: string;
  onInvoiceCreated: (invoice: any) => void;
}

export default function AiStudioView({
  initialPrompt = '',
  profiles,
  currentProfileId,
  onInvoiceCreated,
}: AiStudioViewProps) {
  const defaultSample =
    '10 hours of consulting for Acme Corp at $120/hour, due in 30 days, 20% VAT in USD';
  const [promptText, setPromptText] = useState(initialPrompt || defaultSample);
  const [selectedProfileId, setSelectedProfileId] = useState(currentProfileId);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [draft, setDraft] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('engineering');
  const [isListening, setIsListening] = useState(false);

  // Auto-generate on initial load if no draft yet
  useEffect(() => {
    const text = initialPrompt || promptText;
    if (text) {
      handleGenerate(text);
    }
  }, [initialPrompt]);

  const promptCategories: Record<string, { label: string; icon: any; prompts: string[] }> = {
    engineering: {
      label: 'Software & DevOps',
      icon: Code,
      prompts: [
        '40 hours full-stack React development for Stripe at €95/hour, 20% VAT, Net 14',
        'Cloud Kubernetes architecture review for Hooli Cloud EU $3,800 USD, Net 30',
        'Mobile iOS sprint 10 for Tesla: 25 hrs @ $130/hr, PO-99214',
      ],
    },
    creative: {
      label: 'Design & Branding',
      icon: Palette,
      prompts: [
        'Design system UI kit for Linear: 3 design mockups at $600 each, 5% discount',
        'Brand identity guidelines and typography audit for Acme Corp $2,500, due in 30 days',
        'Product UX usability testing and prototyping 15 hrs @ $110/hr for Spotify',
      ],
    },
    advisory: {
      label: 'Consulting & Legal',
      icon: Briefcase,
      prompts: [
        '10 hours of strategic management consulting for Acme Corp at $150/hour, net 30',
        'Quarterly compliance review for Vanguard Media Group £3,500 GBP, 20% VAT',
        '5 days on-site enterprise workshop for BioHealth Dynamics at $1,200/day',
      ],
    },
    retainer: {
      label: 'Monthly Retainers',
      icon: Layers,
      prompts: [
        'Monthly DevOps infrastructure retainer for Hooli Cloud EU €2,800 EUR, due on 1st',
        'Growth marketing and SEO monthly retainer for Stripe $2,200 USD, net 15',
        'Design advisory quarterly retainer for Linear $4,000 with 10% annual discount',
      ],
    },
    shortcuts: {
      label: 'Quick Shortcuts',
      icon: Zap,
      prompts: [
        'invoice Google $5000',
        'bill Tesla $3500 for security audit due next week',
        'Acme Corp 20h @ $100/hr, 20% vat',
      ],
    },
  };

  const handleGenerate = async (textToUse?: string) => {
    const text = textToUse || promptText;
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const parsed = await api.parsePrompt(text, selectedProfileId);
      setDraft(parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to parse prompt with AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineText.trim() || !draft) return;

    setRefining(true);
    try {
      const updated = await api.refineDraft(refineText, draft);
      setDraft(updated);
      setRefineText('');
    } catch (err: any) {
      setError(err.message || 'Failed to refine draft.');
    } finally {
      setRefining(false);
    }
  };

  // Voice speech-to-text dictation
  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your prompt.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setPromptText(transcript);
          handleGenerate(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const handleAddItem = () => {
    if (!draft) return;
    const newItem = {
      id: Math.random().toString(),
      description: 'New Deliverable or Service',
      quantity: 1,
      unitPrice: 100,
      taxRate: 0,
      total: 100,
    };
    const updatedItems = [...draft.items, newItem];
    recalculateDraft(updatedItems, draft.discountPercentage);
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    if (!draft) return;
    const updatedItems = [...draft.items];
    updatedItems[idx] = {
      ...updatedItems[idx],
      [field]: val,
    };
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? parseFloat(val) || 0 : updatedItems[idx].quantity;
      const price = field === 'unitPrice' ? parseFloat(val) || 0 : updatedItems[idx].unitPrice;
      updatedItems[idx].total = Math.round(qty * price * 100) / 100;
    }
    recalculateDraft(updatedItems, draft.discountPercentage);
  };

  const handleRemoveItem = (idx: number) => {
    if (!draft || draft.items.length <= 1) return;
    const updatedItems = draft.items.filter((_: any, i: number) => i !== idx);
    recalculateDraft(updatedItems, draft.discountPercentage);
  };

  const recalculateDraft = (items: any[], discountPercentage: number) => {
    const subtotal = Math.round(items.reduce((s, it) => s + (it.total || 0), 0) * 100) / 100;
    const discountAmount = Math.round(((subtotal * (discountPercentage || 0)) / 100) * 100) / 100;
    const taxableBase = Math.max(0, subtotal - discountAmount);

    let taxTotal = 0;
    for (const it of items) {
      if (it.taxRate > 0) {
        const itemTax = (it.total * (1 - (discountPercentage || 0) / 100) * it.taxRate) / 100;
        taxTotal += itemTax;
      }
    }
    taxTotal = Math.round(taxTotal * 100) / 100;
    const total = Math.round((taxableBase + taxTotal) * 100) / 100;

    setDraft({
      ...draft,
      items,
      subtotal,
      discountAmount,
      discountPercentage,
      taxTotal,
      total,
    });
  };

  const handleSaveInvoice = async () => {
    if (!draft) return;
    setSaveLoading(true);
    setError(null);
    try {
      const payload = {
        profileId: draft.profileId || selectedProfileId,
        clientId: draft.clientId,
        clientName: draft.clientName,
        clientEmail: draft.clientEmail,
        clientAddress: draft.clientAddress,
        issueDate: draft.issueDate,
        dueDate: draft.dueDate,
        currency: draft.currency,
        items: draft.items.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
        })),
        discountPercentage: draft.discountPercentage,
        notes: draft.notes,
        paymentTerms: draft.paymentTerms,
        status: 'sent',
        aiPromptOrigin: promptText,
      };

      const created = await api.createInvoice(payload);
      onInvoiceCreated(created);
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice.');
    } finally {
      setSaveLoading(false);
    }
  };

  const currSymbol = draft?.currency === 'EUR' ? '€' : draft?.currency === 'GBP' ? '£' : '$';

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>PromptToInvoice Studio &bull; Smart AI Engine</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Describe your work &bull; Receive a production invoice
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supports natural shorthand like &ldquo;Acme Corp 20h @ $120/hr, 20% VAT, Net 30&rdquo; or plain conversation.
            </p>
          </div>

          {/* Profile Picker */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Issuing Entity:</span>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currency})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. 10 hours consulting for Acme Corp at $120/hour, due in 30 days, 20% VAT..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-sans leading-relaxed resize-none shadow-inner"
            />
            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              {/* Voice Dictation Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2 rounded-lg text-xs flex items-center transition ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Click to dictate via microphone'}
              >
                {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Draft Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Categorized Template Library */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2">
              {Object.entries(promptCategories).map(([key, cat]) => {
                const Icon = cat.icon;
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-prompts in selected category */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {promptCategories[activeCategory]?.prompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPromptText(p);
                    handleGenerate(p);
                  }}
                  className="bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-600 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition text-left"
                >
                  &ldquo;{p}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Structured Draft Inspector */}
      {draft && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Draft Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 text-sm">AI Invoice Draft Ready</h3>
                  <span className="text-[10px] font-bold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-full">
                    {Math.round((draft.confidence || 0.95) * 100)}% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{draft.aiExplanation}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveInvoice}
                disabled={saveLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                {saveLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Invoice...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Approve & Issue Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Client Partner
                </label>
                <input
                  type="text"
                  value={draft.clientName || ''}
                  onChange={(e) => setDraft({ ...draft, clientName: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Billing Email
                </label>
                <input
                  type="email"
                  value={draft.clientEmail || ''}
                  onChange={(e) => setDraft({ ...draft, clientEmail: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={draft.paymentTerms || ''}
                  onChange={(e) => setDraft({ ...draft, paymentTerms: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Currency & Due Date
                </label>
                <div className="flex space-x-2">
                  <select
                    value={draft.currency}
                    onChange={(e) => {
                      setDraft({ ...draft, currency: e.target.value });
                    }}
                    className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-bold text-slate-800"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="AUD">AUD ($)</option>
                  </select>
                  <input
                    type="date"
                    value={draft.dueDate || ''}
                    onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Extracted Line Items ({draft.items?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs min-w-[580px]">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 w-20 text-right">Tax %</th>
                      <th className="py-2.5 px-3 w-28 text-right">Amount</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {draft.items?.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/60">
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded p-1 font-medium text-slate-800"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-16 text-center bg-transparent border border-slate-200 rounded p-1"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end">
                            <span className="text-slate-400 mr-1">{currSymbol}</span>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                              className="w-20 text-right bg-transparent border border-slate-200 rounded p-1 font-semibold"
                            />
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxRate}
                            onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                            className="w-14 text-right bg-transparent border border-slate-200 rounded p-1"
                          />
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {currSymbol}{item.total?.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            disabled={draft.items.length <= 1}
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

            {/* Calculations & Conversational Refinement */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Iterative AI Refinement */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/80">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs mb-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  <span>Iterative AI Refinement</span>
                </div>
                <p className="text-[11px] text-blue-700 mb-3">
                  Need adjustments? Tell the AI: &ldquo;Switch currency to EUR&rdquo;, &ldquo;Add 5% discount&rdquo;, or &ldquo;Change due date to Net 15&rdquo;.
                </p>
                <form onSubmit={handleRefine} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Apply 10% loyalty discount..."
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                    className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={refining || !refineText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 transition"
                  >
                    {refining ? 'Refining...' : 'Refine'}
                  </button>
                </form>
              </div>

              {/* Totals Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{currSymbol}{draft.subtotal?.toFixed(2)}</span>
                </div>
                {draft.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount ({draft.discountPercentage}%):</span>
                    <span className="font-semibold">-{currSymbol}{draft.discountAmount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax / VAT Amount:</span>
                  <span className="font-semibold">{currSymbol}{draft.taxTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-blue-800 pt-2 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>{currSymbol}{draft.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
