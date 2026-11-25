import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataStoreService } from '../../database/data-store';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../database/models';
import { CreateInvoiceDto, RecordPaymentDto, UpdateInvoiceDto } from './dto/create-invoice.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly dataStore: DataStoreService) {}

  findAll(userId: string, filters?: { status?: string; search?: string; profileId?: string }) {
    let list = this.dataStore.getInvoices(userId);

    if (filters?.profileId) {
      list = list.filter((i) => i.profileId === filters.profileId);
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter((i) => i.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(q) ||
          i.clientName.toLowerCase().includes(q) ||
          i.clientEmail.toLowerCase().includes(q),
      );
    }

    // Sort descending by issueDate / createdAt
    return list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }

  findOne(userId: string, id: string): Invoice {
    const invoice = this.dataStore.getInvoices(userId).find((i) => i.id === id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  create(userId: string, dto: CreateInvoiceDto): Invoice {
    const sub = this.dataStore.getSubscription(userId);

    // Check subscription quota limit (from project.docx Starter tier limit = 5/mo)
    if (sub.invoicesLimit !== null && sub.invoicesUsedThisMonth >= sub.invoicesLimit) {
      throw new BadRequestException(
        `Monthly invoice quota limit reached (${sub.invoicesLimit} on ${sub.tierName} plan). Upgrade to Professional for unlimited invoices.`,
      );
    }

    // Generate Invoice Number
    const count = this.dataStore.getInvoices(userId).length + 1;
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${String(count).padStart(3, '0')}`;

    // Process items & calculations
    const items: InvoiceItem[] = dto.items.map((item) => {
      const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
      return {
        id: uuidv4(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        total: lineTotal,
      };
    });

    const subtotal = Math.round(items.reduce((acc, it) => acc + it.total, 0) * 100) / 100;
    const discountPercentage = dto.discountPercentage || 0;
    const discountAmount = Math.round(((subtotal * discountPercentage) / 100) * 100) / 100;
    const taxableBase = Math.max(0, subtotal - discountAmount);

    let taxTotal = 0;
    for (const item of items) {
      if (item.taxRate > 0) {
        const itemTax = (item.total * (1 - discountPercentage / 100) * item.taxRate) / 100;
        taxTotal += itemTax;
      }
    }
    taxTotal = Math.round(taxTotal * 100) / 100;
    const total = Math.round((taxableBase + taxTotal) * 100) / 100;

    // Check or auto-create client if needed
    let clientId = dto.clientId;
    let client = clientId ? this.dataStore.getClients(userId).find((c) => c.id === clientId) : null;
    if (!client) {
      client = this.dataStore.getClients(userId).find(
        (c) => c.companyName.toLowerCase() === dto.clientName.toLowerCase() || c.email.toLowerCase() === dto.clientEmail.toLowerCase(),
      );
      if (client) {
        clientId = client.id;
      } else {
        // Auto register client in database for this user
        const newClient = {
          id: uuidv4(),
          userId,
          name: dto.clientName,
          companyName: dto.clientName,
          email: dto.clientEmail,
          address: dto.clientAddress,
          currency: dto.currency,
          taxNumber: dto.clientTaxNumber,
          totalBilled: total,
          outstandingBalance: total,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.dataStore.getAllClientsRaw().push(newClient);
        clientId = newClient.id;
      }
    }

    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: uuidv4(),
      userId,
      invoiceNumber,
      profileId: dto.profileId,
      clientId: clientId || 'cli-generic',
      clientName: dto.clientName,
      clientEmail: dto.clientEmail,
      clientAddress: dto.clientAddress,
      clientTaxNumber: dto.clientTaxNumber,
      issueDate: dto.issueDate,
      dueDate: dto.dueDate,
      currency: dto.currency,
      items,
      subtotal,
      taxTotal,
      discountPercentage,
      discountAmount,
      total,
      amountPaid: 0,
      balanceDue: total,
      status: dto.status || 'sent',
      notes: dto.notes || 'Thank you for your business.',
      paymentTerms: dto.paymentTerms || 'Net 30 days',
      aiPromptOrigin: dto.aiPromptOrigin,
      sentAt: dto.status === 'sent' ? now : undefined,
      payments: [],
      createdAt: now,
      updatedAt: now,
    };

    this.dataStore.getAllInvoicesRaw().unshift(invoice);
    sub.invoicesUsedThisMonth += 1;

    // Log Activity
    this.dataStore.addActivity(userId, {
      type: dto.aiPromptOrigin ? 'invoice_ai_generated' : 'invoice_created',
      title: `Invoice ${invoiceNumber} Created`,
      description: `Billed ${invoice.currency} ${invoice.total.toFixed(2)} to ${invoice.clientName}`,
      metadata: { invoiceId: invoice.id, invoiceNumber },
    });

    this.dataStore.save();
    return invoice;
  }

  update(userId: string, id: string, dto: Partial<UpdateInvoiceDto>): Invoice {
    const invoice = this.findOne(userId, id);

    if (dto.items) {
      invoice.items = dto.items.map((item) => ({
        id: uuidv4(),
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        total: Math.round(item.quantity * item.unitPrice * 100) / 100,
      }));

      const subtotal = Math.round(invoice.items.reduce((acc, it) => acc + it.total, 0) * 100) / 100;
      const discountPercentage = dto.discountPercentage !== undefined ? dto.discountPercentage : invoice.discountPercentage || 0;
      const discountAmount = Math.round(((subtotal * discountPercentage) / 100) * 100) / 100;
      const taxableBase = Math.max(0, subtotal - discountAmount);

      let taxTotal = 0;
      for (const item of invoice.items) {
        if (item.taxRate > 0) {
          const itemTax = (item.total * (1 - discountPercentage / 100) * item.taxRate) / 100;
          taxTotal += itemTax;
        }
      }
      invoice.subtotal = subtotal;
      invoice.discountPercentage = discountPercentage;
      invoice.discountAmount = discountAmount;
      invoice.taxTotal = Math.round(taxTotal * 100) / 100;
      invoice.total = Math.round((taxableBase + invoice.taxTotal) * 100) / 100;
      invoice.balanceDue = Math.max(0, invoice.total - invoice.amountPaid);
    }

    if (dto.clientName) invoice.clientName = dto.clientName;
    if (dto.clientEmail) invoice.clientEmail = dto.clientEmail;
    if (dto.clientAddress !== undefined) invoice.clientAddress = dto.clientAddress;
    if (dto.clientTaxNumber !== undefined) invoice.clientTaxNumber = dto.clientTaxNumber;
    if (dto.issueDate) invoice.issueDate = dto.issueDate;
    if (dto.dueDate) invoice.dueDate = dto.dueDate;
    if (dto.currency) invoice.currency = dto.currency;
    if (dto.paymentTerms) invoice.paymentTerms = dto.paymentTerms;
    if (dto.notes !== undefined) invoice.notes = dto.notes;
    if (dto.status) invoice.status = dto.status;

    invoice.updatedAt = new Date().toISOString();
    this.dataStore.save();
    return invoice;
  }

  delete(userId: string, id: string) {
    const list = this.dataStore.getAllInvoicesRaw();
    const idx = list.findIndex((i) => i.id === id && i.userId === userId);
    if (idx === -1) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    const [deleted] = list.splice(idx, 1);
    this.dataStore.save();
    return { success: true, deletedInvoiceNumber: deleted.invoiceNumber };
  }

  send(userId: string, id: string) {
    const invoice = this.findOne(userId, id);
    invoice.status = 'sent';
    invoice.sentAt = new Date().toISOString();
    invoice.updatedAt = new Date().toISOString();

    this.dataStore.addActivity(userId, {
      type: 'invoice_sent',
      title: `Invoice ${invoice.invoiceNumber} Sent`,
      description: `Dispatched to ${invoice.clientEmail} (${invoice.clientName})`,
      metadata: { invoiceId: invoice.id },
    });

    this.dataStore.save();
    return { success: true, message: `Invoice sent to ${invoice.clientEmail}`, invoice };
  }

  recordPayment(userId: string, id: string, dto: RecordPaymentDto): Invoice {
    const invoice = this.findOne(userId, id);

    const payment = {
      id: uuidv4(),
      amount: dto.amount,
      date: dto.date,
      method: dto.method,
      note: dto.note,
    };

    invoice.payments.push(payment);
    invoice.amountPaid = Math.round((invoice.amountPaid + dto.amount) * 100) / 100;
    invoice.balanceDue = Math.max(0, Math.round((invoice.total - invoice.amountPaid) * 100) / 100);

    if (invoice.balanceDue <= 0.01) {
      invoice.status = 'paid';
      invoice.paidAt = new Date().toISOString();
    }

    invoice.updatedAt = new Date().toISOString();

    // Log Activity
    this.dataStore.addActivity(userId, {
      type: 'payment_received',
      title: `Payment Received ${invoice.currency} ${dto.amount.toFixed(2)}`,
      description: `Settled towards ${invoice.invoiceNumber} via ${dto.method.toUpperCase()}`,
      metadata: { invoiceId: invoice.id, amount: dto.amount },
    });

    this.dataStore.save();
    return invoice;
  }

  generateHtml(id: string): string {
    const invoice = this.dataStore.getAllInvoicesRaw().find((i) => i.id === id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }
    const profile =
      this.dataStore.getAllProfilesRaw().find((p) => p.id === invoice.profileId) ||
      this.dataStore.getAllProfilesRaw()[0];

    const currSymbol = invoice.currency === 'EUR' ? '€' : invoice.currency === 'GBP' ? '£' : '$';

    const itemRows = invoice.items
      .map(
        (it, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0; background-color: ${idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF'};">
        <td style="padding: 12px 14px; text-align: left; color: #1E293B; font-size: 13px; font-weight: 500;">
          ${it.description}
        </td>
        <td style="padding: 12px 14px; text-align: center; color: #475569; font-size: 13px;">${it.quantity}</td>
        <td style="padding: 12px 14px; text-align: right; color: #475569; font-size: 13px;">${currSymbol}${it.unitPrice.toFixed(2)}</td>
        <td style="padding: 12px 14px; text-align: right; color: #475569; font-size: 13px;">${it.taxRate > 0 ? `${it.taxRate}%` : '0%'}</td>
        <td style="padding: 12px 14px; text-align: right; color: #0F172A; font-weight: 700; font-size: 13px;">${currSymbol}${it.total.toFixed(2)}</td>
      </tr>
    `,
      )
      .join('');

    const statusBadgeColor =
      invoice.status === 'paid'
        ? 'background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC;'
        : invoice.status === 'sent'
        ? 'background: #DBEAFE; color: #1E40AF; border: 1px solid #93C5FD;'
        : invoice.status === 'overdue'
        ? 'background: #FEE2E2; color: #B91C1C; border: 1px solid #FCA5A5;'
        : 'background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1;';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Invoice #${invoice.invoiceNumber} - ${invoice.clientName} | PromptToInvoice</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #F1F5F9;
            color: #1E293B;
            margin: 0;
            padding: 30px 20px;
            -webkit-font-smoothing: antialiased;
          }
          .toolbar {
            max-width: 840px;
            margin: 0 auto 20px auto;
            background: #FFFFFF;
            padding: 12px 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
            display: flex;
            align-items: center;
            justify-content: space-between;
            border: 1px solid #E2E8F0;
          }
          .btn-print {
            background: #2563EB;
            color: #FFFFFF;
            border: none;
            padding: 9px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
          }
          .btn-print:hover {
            background: #1D4ED8;
          }
          .invoice-sheet {
            max-width: 840px;
            margin: 0 auto;
            background: #FFFFFF;
            border-radius: 12px;
            box-shadow: 0 4px 25px rgba(0,0,0,0.08);
            padding: 48px;
            border: 1px solid #E2E8F0;
            position: relative;
          }
          .watermark-paid {
            position: absolute;
            top: 240px;
            right: 80px;
            font-size: 64px;
            font-weight: 900;
            color: rgba(16, 185, 129, 0.12);
            text-transform: uppercase;
            transform: rotate(-18deg);
            pointer-events: none;
            letter-spacing: 4px;
            border: 6px dashed rgba(16, 185, 129, 0.18);
            padding: 8px 32px;
            border-radius: 16px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #2563EB;
            padding-bottom: 24px;
            margin-bottom: 28px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 900;
            color: #1E40AF;
            letter-spacing: -0.5px;
          }
          .brand-title span { color: #2563EB; }
          .brand-sub { font-size: 12px; color: #64748B; margin-top: 3px; font-weight: 500; }
          .invoice-heading { text-align: right; }
          .invoice-heading h1 { margin: 0; font-size: 26px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px; }
          .invoice-num { font-size: 15px; font-weight: 700; color: #2563EB; margin-top: 4px; }
          .badge-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            margin-top: 8px;
          }
          .grid-parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-bottom: 30px;
          }
          .party-card {
            background: #F8FAFC;
            padding: 16px 20px;
            border-radius: 10px;
            border: 1px solid #E2E8F0;
          }
          .party-label {
            font-size: 11px;
            font-weight: 800;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .party-name { font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 4px; }
          .party-info { font-size: 12px; color: #475569; line-height: 1.5; }
          .meta-dates {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
          table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            margin-bottom: 24px;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            overflow: hidden;
          }
          table.items-table th {
            background: #F1F5F9;
            color: #475569;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 12px 14px;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #CBD5E1;
          }
          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 32px;
          }
          .totals-box {
            width: 320px;
            background: #F8FAFC;
            padding: 18px 22px;
            border-radius: 10px;
            border: 1px solid #E2E8F0;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #475569;
            padding: 5px 0;
          }
          .total-grand {
            border-top: 2px solid #2563EB;
            padding-top: 10px;
            margin-top: 8px;
            font-size: 17px;
            font-weight: 900;
            color: #1E40AF;
          }
          .settlement-card {
            background: #F0F4FA;
            border: 1px solid #BFDBFE;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 24px;
          }
          .remittance-divider {
            border-top: 1px dashed #94A3B8;
            margin: 32px 0 20px 0;
            text-align: center;
          }
          .remittance-divider span {
            background: #FFFFFF;
            padding: 0 12px;
            font-size: 10px;
            color: #94A3B8;
            position: relative;
            top: -9px;
            font-weight: 700;
            letter-spacing: 1px;
          }
          .footer-note {
            font-size: 11px;
            color: #64748B;
            line-height: 1.6;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @media print {
            body {
              background: #FFFFFF !important;
              padding: 0 !important;
              color: #000000 !important;
            }
            .no-print {
              display: none !important;
            }
            .invoice-sheet {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              max-width: 100% !important;
            }
            .watermark-paid {
              color: rgba(16, 185, 129, 0.18) !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar no-print">
          <div style="font-size: 13px; font-weight: 700; color: #1E293B;">
            📄 Invoice #${invoice.invoiceNumber} &bull; ${invoice.clientName}
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-print" onclick="window.print()">
              🖨️ Print / Save as PDF
            </button>
            <button onclick="window.close()" style="background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">
              Close
            </button>
          </div>
        </div>

        <div class="invoice-sheet">
          ${invoice.status === 'paid' ? '<div class="watermark-paid">PAID IN FULL</div>' : ''}

          <div class="header">
            <div>
              <div class="brand-title">Prompt<span>ToInvoice</span></div>
              <div class="brand-sub">AI-Powered Invoicing Platform for Modern Business</div>
            </div>
            <div class="invoice-heading">
              <h1>INVOICE</h1>
              <div class="invoice-num">#${invoice.invoiceNumber}</div>
              <div class="badge-status" style="${statusBadgeColor}">
                ${invoice.status}
              </div>
            </div>
          </div>

          <div class="grid-parties">
            <div class="party-card">
              <div class="party-label">Billed By (Issuer)</div>
              <div class="party-name">${profile.name}</div>
              <div class="party-info">
                ${profile.address}<br>
                ${profile.city}, ${profile.country} ${profile.postalCode}<br>
                <strong>Email:</strong> ${profile.email}<br>
                ${profile.phone ? `<strong>Phone:</strong> ${profile.phone}<br>` : ''}
                ${profile.taxNumber ? `<strong>Tax/VAT ID:</strong> ${profile.taxNumber}` : ''}
              </div>
            </div>

            <div class="party-card">
              <div class="party-label">Billed To (Client Partner)</div>
              <div class="party-name">${invoice.clientName}</div>
              <div class="party-info">
                ${invoice.clientAddress || 'Corporate Headquarters'}<br>
                <strong>Email:</strong> ${invoice.clientEmail}<br>
                ${invoice.clientTaxNumber ? `<strong>Client Tax ID:</strong> ${invoice.clientTaxNumber}` : ''}
              </div>
              <div class="meta-dates">
                <div><strong>Issue Date:</strong> ${invoice.issueDate}</div>
                <div><strong>Due Date:</strong> ${invoice.dueDate}</div>
              </div>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">Item & Deliverable Description</th>
                <th style="text-align: center; width: 80px;">Qty / Units</th>
                <th style="text-align: right; width: 110px;">Unit Rate</th>
                <th style="text-align: right; width: 80px;">Tax %</th>
                <th style="text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-box">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${currSymbol}${invoice.subtotal.toFixed(2)}</span>
              </div>
              ${
                invoice.discountAmount > 0
                  ? `
              <div class="total-row" style="color: #16A34A; font-weight: 600;">
                <span>Discount (${invoice.discountPercentage}%):</span>
                <span>-${currSymbol}${invoice.discountAmount.toFixed(2)}</span>
              </div>`
                  : ''
              }
              <div class="total-row">
                <span>Tax / VAT Amount:</span>
                <span>${currSymbol}${invoice.taxTotal.toFixed(2)}</span>
              </div>
              <div class="total-row total-grand">
                <span>Total Due:</span>
                <span>${currSymbol}${invoice.total.toFixed(2)}</span>
              </div>
              ${
                invoice.amountPaid > 0
                  ? `
              <div class="total-row" style="color: #16A34A; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #CBD5E1;">
                <span>Amount Settled:</span>
                <span>${currSymbol}${invoice.amountPaid.toFixed(2)}</span>
              </div>
              <div class="total-row" style="font-weight: 800; color: #0F172A;">
                <span>Balance Remaining:</span>
                <span>${currSymbol}${invoice.balanceDue.toFixed(2)}</span>
              </div>`
                  : ''
              }
            </div>
          </div>

          <div class="settlement-card">
            <div style="font-size: 12px; font-weight: 800; color: #1E40AF; margin-bottom: 6px; text-transform: uppercase;">
              Banking & Wire Remittance Instructions
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px; color: #334155;">
              <div>
                <strong>Payment Terms:</strong> ${invoice.paymentTerms}<br>
                <strong>Currency:</strong> ${invoice.currency} (${currSymbol})<br>
                ${invoice.notes ? `<strong>Notes:</strong> ${invoice.notes}` : ''}
              </div>
              <div style="font-family: monospace; font-size: 11px; background: #FFFFFF; padding: 10px; border-radius: 6px; border: 1px solid #CBD5E1;">
                <strong>Bank:</strong> ${profile.bankDetails?.bankName || 'Silicon Valley Bank / Nordea'}<br>
                ${
                  profile.bankDetails?.iban
                    ? `<strong>IBAN:</strong> ${profile.bankDetails.iban}<br><strong>BIC/SWIFT:</strong> ${profile.bankDetails.bic}`
                    : `<strong>Routing:</strong> ${profile.bankDetails?.routingNumber || '121000358'}<br><strong>Account:</strong> ${profile.bankDetails?.accountNumber || '****9481'}`
                }
              </div>
            </div>
          </div>

          <div class="remittance-divider">
            <span>TEAR HERE OR INCLUDE IN WIRE MEMO &bull; REF #${invoice.invoiceNumber}</span>
          </div>

          <div class="footer-note">
            <div>PromptToInvoice &bull; Cloud SaaS Invoicing for US & Europe</div>
            <div>Thank you for your prompt partnership and business!</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
