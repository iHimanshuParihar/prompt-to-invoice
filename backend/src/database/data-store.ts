import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Session,
  BusinessProfile,
  Client,
  Invoice,
  SubscriptionInfo,
  ActivityItem,
  CurrencyCode,
} from './models';

interface DatabaseSchema {
  users: User[];
  sessions: Session[];
  profiles: BusinessProfile[];
  clients: Client[];
  invoices: Invoice[];
  subscriptions: SubscriptionInfo[];
  activities: ActivityItem[];
}

@Injectable()
export class DataStoreService implements OnModuleInit {
  private readonly logger = new Logger(DataStoreService.name);
  private readonly dataDir = path.resolve(__dirname, '../../data');
  private readonly filePath = path.resolve(this.dataDir, 'db.json');

  private data: DatabaseSchema = {
    users: [],
    sessions: [],
    profiles: [],
    clients: [],
    invoices: [],
    subscriptions: [],
    activities: [],
  };

  onModuleInit() {
    this.ensureDirectory();
    this.loadOrCreateDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  private loadOrCreateDatabase() {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure new schema structure exists
        if (parsed.users && parsed.users.length > 0) {
          this.data = parsed;
          this.logger.log(`Loaded existing multi-tenant database with ${this.data.users.length} users and ${this.data.invoices.length} invoices.`);
          return;
        }
      } catch (err) {
        this.logger.error('Failed to parse existing db.json, generating multi-tenant seed', err);
      }
    }
    this.seedInitialData();
    this.save();
    this.logger.log('Multi-tenant seed data created successfully.');
  }

  public save() {
    try {
      this.ensureDirectory();
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to write db.json', err);
    }
  }

  private seedInitialData() {
    // 1. Pre-seeded Users
    const user1: User = {
      id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@aurastudio.com',
      passwordHash: 'password123', // Demo password
      avatarUrl: '',
      role: 'owner',
      defaultCurrency: 'USD',
      createdAt: '2026-08-01T08:00:00Z',
      updatedAt: '2026-08-01T08:00:00Z',
    };

    const user2: User = {
      id: 'user-2',
      name: 'Marcus Lindberg',
      email: 'marcus@nordicdigital.io',
      passwordHash: 'password123',
      avatarUrl: '',
      role: 'owner',
      defaultCurrency: 'EUR',
      createdAt: '2026-08-10T09:00:00Z',
      updatedAt: '2026-08-10T09:00:00Z',
    };

    // 2. Jane's Business Profile (US LLC)
    const profileUS: BusinessProfile = {
      id: 'prof-us-1',
      userId: user1.id,
      name: 'Aura Studio & Advisory LLC',
      legalName: 'Aura Studio & Advisory LLC',
      email: 'billing@aurastudio.com',
      phone: '+1 (415) 890-3321',
      website: 'https://aurastudio.com',
      address: '742 Evergreen Terrace, Suite 300',
      city: 'San Francisco, CA',
      country: 'United States',
      postalCode: '94107',
      taxNumber: 'EIN: 84-2918274',
      bankDetails: {
        bankName: 'Silicon Valley Bank (First Citizens)',
        accountNumber: '****9481',
        routingNumber: '121000358',
      },
      currency: 'USD',
      defaultPaymentTermsDays: 30,
      isDefault: true,
      createdAt: '2026-08-01T09:00:00Z',
      updatedAt: '2026-08-01T09:00:00Z',
    };

    // 3. Marcus's Business Profile (EU Oy)
    const profileEU: BusinessProfile = {
      id: 'prof-eu-2',
      userId: user2.id,
      name: 'Nordic Digital Solutions Oy',
      legalName: 'Nordic Digital Solutions Oy',
      email: 'invoicing@nordicdigital.io',
      phone: '+358 9 2314 5500',
      website: 'https://nordicdigital.io',
      address: 'Mannerheimintie 14 B, 4th Floor',
      city: 'Helsinki',
      country: 'Finland',
      postalCode: '00100',
      taxNumber: 'VAT ID: FI29381726',
      bankDetails: {
        bankName: 'Nordea Bank Abp',
        iban: 'FI49 1234 5678 9012 34',
        bic: 'NDEAFIS2',
      },
      currency: 'EUR',
      defaultPaymentTermsDays: 14,
      isDefault: true,
      createdAt: '2026-08-15T11:00:00Z',
      updatedAt: '2026-08-15T11:00:00Z',
    };

    // 4. Jane's Clients
    const clientJane1: Client = {
      id: 'cli-1',
      userId: user1.id,
      name: 'Sarah Jenkins',
      companyName: 'Acme Corporation',
      email: 's.jenkins@acmecorp.com',
      phone: '+1 (212) 555-0199',
      address: '100 Broadway, 18th Floor',
      city: 'New York, NY',
      country: 'United States',
      taxNumber: 'US-9382103',
      currency: 'USD',
      notes: 'Key partner for product design & brand identity sprints.',
      totalBilled: 11200,
      outstandingBalance: 3600,
      createdAt: '2026-08-05T10:00:00Z',
      updatedAt: '2026-10-10T14:30:00Z',
    };

    const clientJane2: Client = {
      id: 'cli-4',
      userId: user1.id,
      name: 'Dr. Arthur Pendelton',
      companyName: 'BioHealth Dynamics',
      email: 'arthur.p@biohealthdyn.com',
      phone: '+1 (617) 555-8392',
      address: '400 Technology Square',
      city: 'Cambridge, MA',
      country: 'United States',
      currency: 'USD',
      notes: 'Healthtech UX research and HIPAA compliance review.',
      totalBilled: 7500,
      outstandingBalance: 7500,
      createdAt: '2026-09-20T10:00:00Z',
      updatedAt: '2026-10-20T11:00:00Z',
    };

    // 5. Marcus's Clients
    const clientMarcus1: Client = {
      id: 'cli-2',
      userId: user2.id,
      name: 'Marcus Lindberg',
      companyName: 'Hooli Cloud EU',
      email: 'm.lindberg@hoolicloud.eu',
      phone: '+49 30 8392 110',
      address: 'Friedrichstraße 68',
      city: 'Berlin',
      country: 'Germany',
      taxNumber: 'DE389102931',
      currency: 'EUR',
      notes: 'Enterprise cloud migration and architecture consulting.',
      totalBilled: 21965,
      outstandingBalance: 0,
      createdAt: '2026-08-12T12:00:00Z',
      updatedAt: '2026-10-15T09:00:00Z',
    };

    const clientMarcus2: Client = {
      id: 'cli-3',
      userId: user2.id,
      name: 'Elena Rostova',
      companyName: 'Vanguard Media Group',
      email: 'e.rostova@vanguardmedia.co.uk',
      phone: '+44 20 7946 0912',
      address: '25 Cannon Street',
      city: 'London',
      country: 'United Kingdom',
      taxNumber: 'GB98234120',
      currency: 'GBP',
      notes: 'Quarterly digital marketing strategy & creative direction.',
      totalBilled: 4200,
      outstandingBalance: 4200,
      createdAt: '2026-09-01T15:00:00Z',
      updatedAt: '2026-10-18T16:00:00Z',
    };

    // 6. Jane's Invoices (USD)
    const invoicesJane: Invoice[] = [
      {
        id: 'inv-101',
        userId: user1.id,
        invoiceNumber: 'INV-2026-001',
        profileId: profileUS.id,
        clientId: clientJane1.id,
        clientName: clientJane1.companyName,
        clientEmail: clientJane1.email,
        clientAddress: `${clientJane1.address}, ${clientJane1.city}, ${clientJane1.country}`,
        clientTaxNumber: clientJane1.taxNumber,
        issueDate: '2026-09-01',
        dueDate: '2026-09-30',
        currency: 'USD',
        items: [
          {
            id: 'item-1',
            description: 'Design System & UI Kit Component Architecture (40 hrs)',
            quantity: 40,
            unitPrice: 140,
            taxRate: 0,
            total: 5600,
          },
          {
            id: 'item-2',
            description: 'Brand Guidelines & Typography Specification',
            quantity: 1,
            unitPrice: 2000,
            taxRate: 0,
            total: 2000,
          },
        ],
        subtotal: 7600,
        taxTotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        total: 7600,
        amountPaid: 7600,
        balanceDue: 0,
        status: 'paid',
        notes: 'Thank you for your business. Payment received with thanks.',
        paymentTerms: 'Net 30. Wire transfer or ACH.',
        paidAt: '2026-09-25T14:20:00Z',
        sentAt: '2026-09-01T10:00:00Z',
        payments: [
          {
            id: 'pay-1',
            amount: 7600,
            date: '2026-09-25',
            method: 'wire',
            note: 'Full wire settlement ref #SVB-9921',
          },
        ],
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-25T14:20:00Z',
      },
      {
        id: 'inv-103',
        userId: user1.id,
        invoiceNumber: 'INV-2026-003',
        profileId: profileUS.id,
        clientId: clientJane1.id,
        clientName: clientJane1.companyName,
        clientEmail: clientJane1.email,
        clientAddress: `${clientJane1.address}, ${clientJane1.city}, ${clientJane1.country}`,
        clientTaxNumber: clientJane1.taxNumber,
        issueDate: '2026-10-01',
        dueDate: '2026-10-31',
        currency: 'USD',
        items: [
          {
            id: 'item-5',
            description: 'Sprint 14 React Web App Frontend Implementation (25 hrs @ $120)',
            quantity: 25,
            unitPrice: 120,
            taxRate: 0,
            total: 3000,
          },
          {
            id: 'item-6',
            description: 'Performance Optimization & Lighthouse Audit',
            quantity: 1,
            unitPrice: 600,
            taxRate: 0,
            total: 600,
          },
        ],
        subtotal: 3600,
        taxTotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        total: 3600,
        amountPaid: 0,
        balanceDue: 3600,
        status: 'sent',
        notes: 'AI prompt generated: "25 hours frontend implementation for Acme Corp at $120/hr plus $600 audit".',
        paymentTerms: 'Due in 30 days. Remit to Silicon Valley Bank.',
        aiPromptOrigin: '25 hours frontend implementation for Acme Corp at $120/hr plus $600 audit',
        sentAt: '2026-10-01T15:00:00Z',
        payments: [],
        createdAt: '2026-10-01T14:45:00Z',
        updatedAt: '2026-10-01T15:00:00Z',
      },
      {
        id: 'inv-106',
        userId: user1.id,
        invoiceNumber: 'INV-2026-006',
        profileId: profileUS.id,
        clientId: clientJane2.id,
        clientName: clientJane2.companyName,
        clientEmail: clientJane2.email,
        clientAddress: `${clientJane2.address}, ${clientJane2.city}, ${clientJane2.country}`,
        issueDate: '2026-10-18',
        dueDate: '2026-11-17',
        currency: 'USD',
        items: [
          {
            id: 'item-10',
            description: 'Healthcare Provider Portal UX Redesign (50 hrs @ $150)',
            quantity: 50,
            unitPrice: 150,
            taxRate: 0,
            total: 7500,
          },
        ],
        subtotal: 7500,
        taxTotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        total: 7500,
        amountPaid: 0,
        balanceDue: 7500,
        status: 'sent',
        notes: 'First milestone of Q4 master services agreement.',
        paymentTerms: 'Net 30 days.',
        aiPromptOrigin: '50 hours UX redesign for BioHealth Dynamics at $150/hr, net 30',
        sentAt: '2026-10-18T16:00:00Z',
        payments: [],
        createdAt: '2026-10-18T15:30:00Z',
        updatedAt: '2026-10-18T16:00:00Z',
      },
    ];

    // 7. Marcus's Invoices (EUR & GBP)
    const invoicesMarcus: Invoice[] = [
      {
        id: 'inv-102',
        userId: user2.id,
        invoiceNumber: 'INV-2026-002',
        profileId: profileEU.id,
        clientId: clientMarcus1.id,
        clientName: clientMarcus1.companyName,
        clientEmail: clientMarcus1.email,
        clientAddress: `${clientMarcus1.address}, ${clientMarcus1.city}, ${clientMarcus1.country}`,
        clientTaxNumber: clientMarcus1.taxNumber,
        issueDate: '2026-09-15',
        dueDate: '2026-09-29',
        currency: 'EUR',
        items: [
          {
            id: 'item-3',
            description: 'Cloud Infrastructure Kubernetes Architecture & Security Hardening',
            quantity: 60,
            unitPrice: 150,
            taxRate: 20,
            total: 9000,
          },
          {
            id: 'item-4',
            description: 'Site Reliability Engineering Retainer - September',
            quantity: 1,
            unitPrice: 2500,
            taxRate: 20,
            total: 2500,
          },
        ],
        subtotal: 11500,
        taxTotal: 2300,
        discountPercentage: 0,
        discountAmount: 0,
        total: 13800,
        amountPaid: 13800,
        balanceDue: 0,
        status: 'paid',
        notes: 'Reverse charge applicable for cross-border EU B2B services.',
        paymentTerms: 'Net 14 days to Nordea IBAN.',
        paidAt: '2026-09-28T10:15:00Z',
        sentAt: '2026-09-15T11:00:00Z',
        payments: [
          {
            id: 'pay-2',
            amount: 13800,
            date: '2026-09-28',
            method: 'wire',
            note: 'SEPA B2B transfer ref DE-98210',
          },
        ],
        createdAt: '2026-09-15T11:00:00Z',
        updatedAt: '2026-09-28T10:15:00Z',
      },
      {
        id: 'inv-104',
        userId: user2.id,
        invoiceNumber: 'INV-2026-004',
        profileId: profileEU.id,
        clientId: clientMarcus1.id,
        clientName: clientMarcus1.companyName,
        clientEmail: clientMarcus1.email,
        clientAddress: `${clientMarcus1.address}, ${clientMarcus1.city}, ${clientMarcus1.country}`,
        clientTaxNumber: clientMarcus1.taxNumber,
        issueDate: '2026-10-10',
        dueDate: '2026-10-24',
        currency: 'EUR',
        items: [
          {
            id: 'item-7',
            description: 'Microservices Observability & Datadog Dashboard Configuration',
            quantity: 35,
            unitPrice: 160,
            taxRate: 20,
            total: 5600,
          },
          {
            id: 'item-8',
            description: 'On-call Incident Response Support Training',
            quantity: 1,
            unitPrice: 1500,
            taxRate: 20,
            total: 1500,
          },
        ],
        subtotal: 7100,
        taxTotal: 1420,
        discountPercentage: 5,
        discountAmount: 355,
        total: 8165,
        amountPaid: 8165,
        balanceDue: 0,
        status: 'paid',
        notes: 'Early payment 5% partner discount included.',
        paymentTerms: 'Net 14 days.',
        paidAt: '2026-10-18T11:30:00Z',
        sentAt: '2026-10-10T09:30:00Z',
        payments: [
          {
            id: 'pay-3',
            amount: 8165,
            date: '2026-10-18',
            method: 'stripe',
            note: 'Stripe Instant Bank Transfer',
          },
        ],
        createdAt: '2026-10-10T09:30:00Z',
        updatedAt: '2026-10-18T11:30:00Z',
      },
      {
        id: 'inv-105',
        userId: user2.id,
        invoiceNumber: 'INV-2026-005',
        profileId: profileEU.id,
        clientId: clientMarcus2.id,
        clientName: clientMarcus2.companyName,
        clientEmail: clientMarcus2.email,
        clientAddress: `${clientMarcus2.address}, ${clientMarcus2.city}, ${clientMarcus2.country}`,
        clientTaxNumber: clientMarcus2.taxNumber,
        issueDate: '2026-09-10',
        dueDate: '2026-10-10',
        currency: 'GBP',
        items: [
          {
            id: 'item-9',
            description: 'Brand Repositioning & Market Research Study (London Q3)',
            quantity: 1,
            unitPrice: 4200,
            taxRate: 0,
            total: 4200,
          },
        ],
        subtotal: 4200,
        taxTotal: 0,
        discountPercentage: 0,
        discountAmount: 0,
        total: 4200,
        amountPaid: 0,
        balanceDue: 4200,
        status: 'overdue',
        notes: 'Payment reminder dispatched.',
        paymentTerms: 'Net 30.',
        sentAt: '2026-09-10T12:00:00Z',
        payments: [],
        createdAt: '2026-09-10T11:45:00Z',
        updatedAt: '2026-10-15T08:00:00Z',
      },
    ];

    // 8. User Subscriptions
    const subJane: SubscriptionInfo = {
      userId: user1.id,
      tier: 'professional',
      tierName: 'Professional',
      priceMonthly: 15,
      billingInterval: 'monthly',
      invoicesLimit: null,
      profilesLimit: 3,
      features: [
        'Unlimited Invoices',
        'Generative AI Invoice Parsing',
        'Branded Multi-Currency Invoices (USD/EUR)',
        'Dashboard Analytics & Revenue Graphs',
      ],
      invoicesUsedThisMonth: 3,
      activeProfilesCount: 1,
      renewalDate: '2026-12-01',
    };

    const subMarcus: SubscriptionInfo = {
      userId: user2.id,
      tier: 'business',
      tierName: 'Business',
      priceMonthly: 39,
      billingInterval: 'monthly',
      invoicesLimit: null,
      profilesLimit: 10,
      features: [
        'Multiple Business Profiles & Brands',
        'Unlimited Invoices & AI Parsing',
        'Team Member Seats',
        'Advanced European VAT & Multi-Currency Reports',
      ],
      invoicesUsedThisMonth: 3,
      activeProfilesCount: 1,
      renewalDate: '2026-12-01',
    };

    this.data = {
      users: [user1, user2],
      sessions: [],
      profiles: [profileUS, profileEU],
      clients: [clientJane1, clientJane2, clientMarcus1, clientMarcus2],
      invoices: [...invoicesJane, ...invoicesMarcus],
      subscriptions: [subJane, subMarcus],
      activities: [
        {
          id: 'act-1',
          userId: user1.id,
          type: 'invoice_ai_generated',
          title: 'AI Drafted Invoice INV-2026-006',
          description: 'Generated 50 hrs UX redesign for BioHealth Dynamics from natural prompt.',
          timestamp: '2026-10-18T15:30:00Z',
        },
        {
          id: 'act-2',
          userId: user2.id,
          type: 'payment_received',
          title: 'Payment Received €8,165.00',
          description: 'Hooli Cloud EU settled invoice INV-2026-004 via Stripe.',
          timestamp: '2026-10-18T11:30:00Z',
        },
      ],
    };
  }

  // --- User & Session Operations ---
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(name: string, email: string, passwordHash: string, currency: CurrencyCode = 'USD'): User {
    const now = new Date().toISOString();
    const newUser: User = {
      id: uuidv4(),
      name,
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'owner',
      defaultCurrency: currency,
      createdAt: now,
      updatedAt: now,
    };

    this.data.users.push(newUser);

    // Provision starter profile
    const defaultProfile: BusinessProfile = {
      id: uuidv4(),
      userId: newUser.id,
      name: `${name}'s Consulting`,
      email: newUser.email,
      address: '100 Innovation Way',
      city: currency === 'EUR' ? 'Berlin' : 'San Francisco, CA',
      country: currency === 'EUR' ? 'Germany' : 'United States',
      postalCode: currency === 'EUR' ? '10115' : '94105',
      currency,
      defaultPaymentTermsDays: 30,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    };
    this.data.profiles.push(defaultProfile);

    // Provision starter subscription (Free Starter Plan)
    const starterSub: SubscriptionInfo = {
      userId: newUser.id,
      tier: 'starter',
      tierName: 'Starter',
      priceMonthly: 0,
      billingInterval: 'monthly',
      invoicesLimit: 5,
      profilesLimit: 1,
      features: ['Up to 5 invoices/month', '1 business profile', 'USD & EUR support'],
      invoicesUsedThisMonth: 0,
      activeProfilesCount: 1,
      renewalDate: '2026-12-01',
    };
    this.data.subscriptions.push(starterSub);

    this.save();
    return newUser;
  }

  createSession(userId: string, userAgent?: string): Session {
    const sessionId = uuidv4();
    const now = new Date();
    // 7 days expiration
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const session: Session = {
      id: sessionId,
      userId,
      expiresAt,
      createdAt: now.toISOString(),
      userAgent,
    };

    // Clean expired sessions
    this.data.sessions = this.data.sessions.filter(
      (s) => new Date(s.expiresAt).getTime() > Date.now(),
    );

    this.data.sessions.push(session);
    this.save();
    return session;
  }

  findSession(sessionId: string): Session | undefined {
    const s = this.data.sessions.find((sess) => sess.id === sessionId);
    if (!s) return undefined;
    if (new Date(s.expiresAt).getTime() <= Date.now()) {
      this.deleteSession(sessionId);
      return undefined;
    }
    return s;
  }

  deleteSession(sessionId: string) {
    this.data.sessions = this.data.sessions.filter((s) => s.id !== sessionId);
    this.save();
  }

  // --- Multi-Tenant User-Specific Entity Getters ---
  getProfiles(userId: string): BusinessProfile[] {
    return this.data.profiles.filter((p) => p.userId === userId);
  }

  getClients(userId: string): Client[] {
    return this.data.clients.filter((c) => c.userId === userId);
  }

  getInvoices(userId: string): Invoice[] {
    return this.data.invoices.filter((i) => i.userId === userId);
  }

  getAllInvoicesRaw(): Invoice[] {
    return this.data.invoices;
  }

  getAllClientsRaw(): Client[] {
    return this.data.clients;
  }

  getAllProfilesRaw(): BusinessProfile[] {
    return this.data.profiles;
  }

  getSubscription(userId: string): SubscriptionInfo {
    let sub = this.data.subscriptions.find((s) => s.userId === userId);
    if (!sub) {
      sub = {
        userId,
        tier: 'professional',
        tierName: 'Professional',
        priceMonthly: 15,
        billingInterval: 'monthly',
        invoicesLimit: null,
        profilesLimit: 3,
        features: ['Unlimited Invoices', 'AI Invoicing'],
        invoicesUsedThisMonth: 0,
        activeProfilesCount: 1,
        renewalDate: '2026-12-01',
      };
      this.data.subscriptions.push(sub);
      this.save();
    }
    return sub;
  }

  getActivities(userId: string): ActivityItem[] {
    return this.data.activities.filter((a) => a.userId === userId);
  }

  addActivity(userId: string, activity: Omit<ActivityItem, 'id' | 'timestamp' | 'userId'>) {
    const item: ActivityItem = {
      id: uuidv4(),
      userId,
      timestamp: new Date().toISOString(),
      ...activity,
    };
    this.data.activities.unshift(item);
    if (this.data.activities.length > 100) {
      this.data.activities = this.data.activities.slice(0, 100);
    }
    this.save();
    return item;
  }

  updateSubscription(userId: string, tier: 'starter' | 'professional' | 'business' | 'enterprise') {
    const plans: Record<string, Partial<SubscriptionInfo>> = {
      starter: {
        tier: 'starter',
        tierName: 'Starter',
        priceMonthly: 0,
        invoicesLimit: 5,
        profilesLimit: 1,
        features: ['Up to 5 invoices/month', '1 business profile', 'USD & EUR support'],
      },
      professional: {
        tier: 'professional',
        tierName: 'Professional',
        priceMonthly: 15,
        invoicesLimit: null,
        profilesLimit: 3,
        features: [
          'Unlimited Invoices',
          'Generative AI Invoice Parsing',
          'Branded Multi-Currency Invoices',
          'Dashboard Analytics & Graphs',
        ],
      },
      business: {
        tier: 'business',
        tierName: 'Business',
        priceMonthly: 39,
        invoicesLimit: null,
        profilesLimit: 10,
        features: [
          'Multiple Business Profiles',
          'Team Seats',
          'Priority Support',
          'Advanced Financial Reporting',
          'Unlimited Invoices & AI',
        ],
      },
      enterprise: {
        tier: 'enterprise',
        tierName: 'Enterprise',
        priceMonthly: 99,
        invoicesLimit: null,
        profilesLimit: 50,
        features: [
          'Custom Integrations & API Access',
          'Dedicated SLA',
          'Custom Invoice Templates',
        ],
      },
    };

    const selected = plans[tier] || plans.professional;
    const sub = this.getSubscription(userId);
    Object.assign(sub, selected);
    this.save();
    return sub;
  }
}
