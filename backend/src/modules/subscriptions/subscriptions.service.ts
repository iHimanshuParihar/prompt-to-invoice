import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store';
import { SubscriptionInfo, SubscriptionTier } from '../../database/models';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly dataStore: DataStoreService) {}

  getSubscription(userId: string): SubscriptionInfo {
    return this.dataStore.getSubscription(userId);
  }

  getAvailableTiers() {
    return [
      {
        tier: 'starter',
        name: 'Starter',
        priceMonthly: 0,
        description: 'For freelancers & solo founders starting out',
        invoicesLimit: 5,
        profilesLimit: 1,
        features: [
          'Up to 5 invoices per month',
          '1 business profile',
          'USD & EUR native currency support',
          'Standard PDF export',
          'Email support',
        ],
        badge: 'Free Tier',
      },
      {
        tier: 'professional',
        name: 'Professional',
        priceMonthly: 15,
        description: 'For growing independent consultants & small businesses',
        invoicesLimit: null,
        profilesLimit: 3,
        features: [
          'Unlimited invoices & clients',
          'Conversational AI Invoice Generation',
          'Multiple business profiles (up to 3)',
          'Multi-currency (USD, EUR, GBP, CAD, AUD)',
          'Interactive Revenue Graphs & Dashboard',
          'Automated VAT & Sales Tax calculations',
        ],
        badge: 'Most Popular',
      },
      {
        tier: 'business',
        name: 'Business',
        priceMonthly: 39,
        description: 'For agencies, boutique consultancies & multi-client teams',
        invoicesLimit: null,
        profilesLimit: 10,
        features: [
          'Everything in Professional',
          'Up to 10 distinct business profiles & brands',
          'Team member collaboration seats',
          'Advanced financial & cashflow reports',
          'Priority VIP concierge support',
          'Custom invoice template themes',
        ],
        badge: 'Agencies',
      },
      {
        tier: 'enterprise',
        name: 'Enterprise',
        priceMonthly: 99,
        description: 'For high-volume organizations requiring deep integration',
        invoicesLimit: null,
        profilesLimit: 50,
        features: [
          'Custom REST API access & webhooks',
          'Custom accounting software sync',
          'Dedicated SLA (99.9% uptime guarantee)',
          'Dedicated customer success manager',
          'Custom contracts & PO invoicing',
        ],
        badge: 'Scale',
      },
    ];
  }

  changeTier(userId: string, tier: SubscriptionTier): SubscriptionInfo {
    return this.dataStore.updateSubscription(userId, tier);
  }
}
