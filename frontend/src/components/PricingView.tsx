'use client';

import React, { useState } from 'react';
import { Check, Sparkles, Zap, Shield, Crown, Building } from 'lucide-react';
import { api } from '../lib/api';

interface PricingViewProps {
  subscription: any;
  onRefresh: () => void;
}

export default function PricingView({ subscription, onRefresh }: PricingViewProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$0',
      period: 'forever free',
      target: 'Freelancers & solo founders',
      highlight: 'Up to 5 invoices/month, 1 profile, USD/EUR',
      features: [
        'Up to 5 invoices per month',
        '1 business profile entity',
        'USD & EUR native currency support',
        'Standard PDF invoice download',
        'Basic client management',
        'Community email support',
      ],
      icon: Zap,
      accent: 'border-slate-200',
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$15',
      period: 'per month',
      popular: true,
      target: 'Growing small businesses & consultants',
      highlight: 'Unlimited invoices, AI generation, branded templates, analytics',
      features: [
        'Unlimited monthly invoices',
        'Generative AI natural language invoice creation',
        'Up to 3 distinct business profiles',
        'Multi-currency (USD, EUR, GBP, CAD, AUD)',
        'Dashboard analytics & cashflow graphs',
        'Automated VAT & sales tax calculation',
        'Client payment recording & audit trails',
      ],
      icon: Sparkles,
      accent: 'border-blue-600 ring-2 ring-blue-600/20 shadow-blue-500/10',
    },
    {
      id: 'business',
      name: 'Business',
      price: '$39',
      period: 'per month',
      target: 'Agencies & multi-client teams',
      highlight: 'Multiple business profiles, team seats, priority support',
      features: [
        'Everything in Professional',
        'Up to 10 distinct business entities & logos',
        'Team collaboration seats',
        'Advanced financial & predictive cashflow insights',
        'Priority concierge support (< 1 hr SLA)',
        'Custom invoice branding & color accents',
      ],
      icon: Crown,
      accent: 'border-slate-200',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'annual billing',
      target: 'High-volume organizations',
      highlight: 'API access, custom integrations, SLA, dedicated onboarding',
      features: [
        'Unlimited business profiles & users',
        'REST API & Webhooks access',
        'Dedicated SLA (99.9% uptime guarantee)',
        'Custom accounting & ERP data sync',
        'Dedicated account manager & onboarding',
      ],
      icon: Shield,
      accent: 'border-slate-200',
    },
  ];

  const handleSelectTier = async (tier: string) => {
    setLoadingTier(tier);
    try {
      await api.changeTier(tier);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to switch subscription tier.');
    } finally {
      setLoadingTier(null);
    }
  };

  const currentTier = subscription?.tier || 'professional';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto pt-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Predictable SaaS Pricing
        </span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-3">
          Transparent plans for modern independent businesses
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Designed from the ground up for freelancers, boutique consultancies, and agencies across the US & Europe.
        </p>
      </div>

      {/* Usage Meter Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-slate-400">Current Plan Status</div>
            <div className="text-lg font-black text-slate-900">
              {subscription?.tierName || 'Professional'} Subscription
            </div>
            <div className="text-xs text-slate-500">
              Invoices generated this billing cycle: <strong>{subscription?.invoicesUsedThisMonth || 0}</strong>
              {subscription?.invoicesLimit ? ` of ${subscription.invoicesLimit}` : ' (Unlimited)'}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            Active & Verified
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => {
          const isCurrent = currentTier === p.id;
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm transition hover:shadow-md relative ${p.accent}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">{p.name}</h3>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">{p.target}</div>

                <div className="my-5 flex items-baseline">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{p.price}</span>
                  <span className="text-xs text-slate-400 ml-1.5 font-medium">/ {p.period}</span>
                </div>

                <div className="text-xs text-blue-700 bg-blue-50/80 p-2.5 rounded-xl font-medium mb-6">
                  {p.highlight}
                </div>

                {/* Features */}
                <div className="space-y-2.5 text-xs text-slate-600">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4 border-t border-slate-100">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-500 font-bold py-2.5 rounded-xl text-xs cursor-default"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectTier(p.id)}
                    disabled={loadingTier !== null}
                    className={`w-full font-bold py-2.5 rounded-xl text-xs transition shadow-sm ${
                      p.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {loadingTier === p.id ? 'Switching...' : `Switch to ${p.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
