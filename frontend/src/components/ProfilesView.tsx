'use client';

import React, { useState } from 'react';
import { Building2, Plus, Check, Globe, MapPin, Mail, Phone, CreditCard, X } from 'lucide-react';
import { api } from '../lib/api';

interface ProfilesViewProps {
  profiles: any[];
  currentProfileId: string;
  onRefresh: () => void;
  subscription: any;
}

export default function ProfilesView({
  profiles,
  currentProfileId,
  onRefresh,
  subscription,
}: ProfilesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState(30);
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [bic, setBic] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetDefault = async (id: string) => {
    try {
      await api.setDefaultProfile(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to set default profile.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.createProfile({
        name,
        legalName: legalName || name,
        email,
        phone,
        address,
        city,
        country,
        postalCode,
        taxNumber,
        currency,
        defaultPaymentTermsDays: Number(defaultPaymentTermsDays),
        bankDetails: {
          bankName: bankName || 'Standard Business Bank',
          iban,
          bic,
          routingNumber,
          accountNumber,
        },
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create business profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Business Profiles & Entities</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage legal branding, tax identification, and payment details for US and European entities.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-sm transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Business Profile</span>
        </button>
      </div>

      {/* Profiles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {profiles.map((prof) => (
          <div
            key={prof.id}
            className={`bg-white rounded-2xl border p-6 shadow-sm transition flex flex-col justify-between ${
              prof.isDefault ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-md shadow-blue-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{prof.name}</h3>
                    <div className="text-[11px] text-slate-400 font-medium">{prof.legalName || prof.name}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
                    {prof.currency} Currency
                  </span>
                  {prof.isDefault && (
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full flex items-center">
                      <Check className="w-3 h-3 mr-0.5" /> Default
                    </span>
                  )}
                </div>
              </div>

              {/* Details List */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{prof.address}, {prof.city}, {prof.country} ({prof.postalCode})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{prof.email}</span>
                </div>
                {prof.taxNumber && (
                  <div className="flex items-center space-x-2 font-mono text-[11px]">
                    <strong className="text-slate-700">Tax/VAT:</strong>
                    <span>{prof.taxNumber}</span>
                  </div>
                )}
                {prof.bankDetails && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                    <div className="font-bold text-slate-700 mb-1 flex items-center">
                      <CreditCard className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      <span>{prof.bankDetails.bankName}</span>
                    </div>
                    {prof.bankDetails.iban ? (
                      <div className="font-mono text-[10px] text-slate-500">
                        IBAN: {prof.bankDetails.iban} <br />
                        BIC: {prof.bankDetails.bic}
                      </div>
                    ) : (
                      <div className="font-mono text-[10px] text-slate-500">
                        Routing: {prof.bankDetails.routingNumber} | Acct: {prof.bankDetails.accountNumber}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-400">
                Default Net Terms: <strong>{prof.defaultPaymentTermsDays} days</strong>
              </span>

              {!prof.isDefault && (
                <button
                  onClick={() => handleSetDefault(prof.id)}
                  className="text-blue-600 font-bold hover:text-blue-800 text-xs"
                >
                  Set as Default Entity
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Add New Business Entity</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {error && <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg">{error}</div>}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand / Display Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    placeholder="e.g. Aura Design Studio"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Legal Registered Name</label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    placeholder="e.g. Aura Design Studio LLC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Billing Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    placeholder="billing@company.com"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Currency</label>
                  <select
                    value={currency}
                    onChange={(e: any) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  placeholder="100 Innovation Way, Suite 400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax ID / VAT Number</label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    placeholder="EIN or VAT identifier"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Default Terms (Days)</label>
                  <input
                    type="number"
                    value={defaultPaymentTermsDays}
                    onChange={(e) => setDefaultPaymentTermsDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800">Bank / Settlement Details</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg p-2"
                  />
                  {currency === 'EUR' ? (
                    <input
                      type="text"
                      placeholder="IBAN"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="Routing / Sort Code"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg"
                >
                  {loading ? 'Creating...' : 'Create Business Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
