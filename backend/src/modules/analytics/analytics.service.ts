import { Injectable } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store';

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataStore: DataStoreService) {}

  getDashboardMetrics(userId: string, currencyFilter?: string) {
    let invoices = this.dataStore.getInvoices(userId);
    if (currencyFilter && currencyFilter !== 'all') {
      invoices = invoices.filter((i) => i.currency === currencyFilter);
    }

    const totalBilled = Math.round(invoices.reduce((sum, i) => sum + i.total, 0) * 100) / 100;
    const totalReceived = Math.round(invoices.reduce((sum, i) => sum + i.amountPaid, 0) * 100) / 100;
    const totalOutstanding = Math.round(
      invoices.filter((i) => i.status === 'sent' || i.status === 'draft').reduce((sum, i) => sum + i.balanceDue, 0) * 100,
    ) / 100;
    const totalOverdue = Math.round(
      invoices.filter((i) => i.status === 'overdue').reduce((sum, i) => sum + i.balanceDue, 0) * 100,
    ) / 100;

    const paidRate = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0;
    const averageInvoiceValue = invoices.length > 0 ? Math.round((totalBilled / invoices.length) * 100) / 100 : 0;

    // Monthly Trend Aggregation based on user invoices
    const now = new Date();
    const monthsMap: { [key: string]: { month: string; billed: number; received: number; count: number } } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      monthsMap[key] = { month: label, billed: 0, received: 0, count: 0 };
    }

    invoices.forEach((inv) => {
      const key = (inv.issueDate || '').substring(0, 7);
      if (monthsMap[key]) {
        monthsMap[key].billed += inv.total;
        monthsMap[key].received += inv.amountPaid;
        monthsMap[key].count += 1;
      }
    });

    const monthlyTrend = Object.values(monthsMap).map((m) => ({
      ...m,
      billed: Math.round(m.billed * 100) / 100,
      received: Math.round(m.received * 100) / 100,
    }));

    // Status Breakdown
    const statusCounts = {
      paid: invoices.filter((i) => i.status === 'paid').length,
      sent: invoices.filter((i) => i.status === 'sent').length,
      overdue: invoices.filter((i) => i.status === 'overdue').length,
      draft: invoices.filter((i) => i.status === 'draft').length,
    };

    const statusTotals = {
      paid: Math.round(invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0) * 100) / 100,
      sent: Math.round(invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total, 0) * 100) / 100,
      overdue: Math.round(invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total, 0) * 100) / 100,
      draft: Math.round(invoices.filter((i) => i.status === 'draft').reduce((s, i) => s + i.total, 0) * 100) / 100,
    };

    // Currency Distribution
    const currencyDistribution = [
      {
        currency: 'USD',
        symbol: '$',
        total: Math.round(invoices.filter((i) => i.currency === 'USD').reduce((s, i) => s + i.total, 0) * 100) / 100,
        count: invoices.filter((i) => i.currency === 'USD').length,
      },
      {
        currency: 'EUR',
        symbol: '€',
        total: Math.round(invoices.filter((i) => i.currency === 'EUR').reduce((s, i) => s + i.total, 0) * 100) / 100,
        count: invoices.filter((i) => i.currency === 'EUR').length,
      },
      {
        currency: 'GBP',
        symbol: '£',
        total: Math.round(invoices.filter((i) => i.currency === 'GBP').reduce((s, i) => s + i.total, 0) * 100) / 100,
        count: invoices.filter((i) => i.currency === 'GBP').length,
      },
    ];

    // Top Clients
    const clients = this.dataStore.getClients(userId);
    const topClients = clients
      .map((c) => {
        const clientInvoices = invoices.filter((i) => i.clientId === c.id || i.clientEmail.toLowerCase() === c.email.toLowerCase());
        const totalBilled = Math.round(clientInvoices.reduce((acc, i) => acc + i.total, 0) * 100) / 100;
        const outstanding = Math.round(
          clientInvoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled').reduce((acc, i) => acc + i.balanceDue, 0) * 100,
        ) / 100;
        return {
          id: c.id,
          name: c.companyName,
          email: c.email,
          totalBilled,
          outstanding,
          currency: c.currency,
        };
      })
      .sort((a, b) => b.totalBilled - a.totalBilled)
      .slice(0, 5);

    // AI Predictive Insights customized to user's numbers
    const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
    const aiInsights = [
      {
        type: 'healthy',
        title: 'Strong Collection Momentum',
        description: `Collection rate is at ${paidRate}%. Cross-border transactions are settling on schedule with zero disputes.`,
      },
      {
        type: overdueInvoices.length > 0 ? 'warning' : 'healthy',
        title: overdueInvoices.length > 0 ? 'Action Recommended: Overdue Invoice' : 'Zero Overdue Receivables',
        description: overdueInvoices.length > 0
          ? `Invoice ${overdueInvoices[0].invoiceNumber} (${overdueInvoices[0].currency} ${overdueInvoices[0].balanceDue.toFixed(2)}) is overdue. 1-click AI payment reminder is ready to send.`
          : 'All outstanding receivables are well within net payment terms. Excellent cashflow velocity!',
      },
      {
        type: 'growth',
        title: 'Revenue Diversification Analysis',
        description: `Active invoices are distributed across ${new Set(invoices.map((i) => i.currency)).size || 1} currency market(s). Multi-currency automated VAT calculation is active.`,
      },
    ];

    return {
      summary: {
        totalBilled,
        totalReceived,
        totalOutstanding,
        totalOverdue,
        paidRate,
        averageInvoiceValue,
        invoicesCount: invoices.length,
      },
      monthlyTrend,
      statusCounts,
      statusTotals,
      currencyDistribution,
      topClients,
      aiInsights,
      activities: this.dataStore.getActivities(userId).slice(0, 8),
    };
  }
}
