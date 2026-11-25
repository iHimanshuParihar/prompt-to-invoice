import { Injectable, Logger } from '@nestjs/common';
import { DataStoreService } from '../../database/data-store';
import { CurrencyCode } from '../../database/models';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedInvoiceDraft {
  clientName: string;
  clientId?: string;
  clientEmail?: string;
  clientAddress?: string;
  profileId: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }>;
  subtotal: number;
  taxTotal: number;
  discountPercentage: number;
  discountAmount: number;
  total: number;
  notes: string;
  paymentTerms: string;
  aiPromptOrigin: string;
  confidence: number;
  aiExplanation: string;
  extractedFields: {
    clientMatched: boolean;
    detectedCurrency: CurrencyCode;
    itemsCount: number;
    detectedTax: number;
    detectedDiscount: number;
  };
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly dataStore: DataStoreService) {}

  public async parsePrompt(userId: string, prompt: string, selectedProfileId?: string): Promise<ParsedInvoiceDraft> {
    this.logger.log(`Parsing natural language prompt for user ${userId}: "${prompt}"`);

    const profiles = this.dataStore.getProfiles(userId);
    const clients = this.dataStore.getClients(userId);

    // Determine target profile
    let targetProfile = profiles.find((p) => p.id === selectedProfileId);
    if (!targetProfile) {
      targetProfile = profiles.find((p) => p.isDefault) || profiles[0];
    }
    const defaultProfileId = targetProfile ? targetProfile.id : 'default-profile';
    const profileCurrency = targetProfile ? targetProfile.currency : 'USD';
    const profileTermsDays = targetProfile ? targetProfile.defaultPaymentTermsDays : 30;

    const cleanPrompt = prompt.trim();

    // 1. Detect Currency
    let currency: CurrencyCode = profileCurrency || 'USD';
    if (/€|\beur\b|\beuros?\b/i.test(cleanPrompt)) {
      currency = 'EUR';
    } else if (/£|\bgbp\b|\bpounds?\b/i.test(cleanPrompt)) {
      currency = 'GBP';
    } else if (/\$|\busd\b|\bdollars?\b/i.test(cleanPrompt)) {
      currency = 'USD';
    } else if (/\bcad\b/i.test(cleanPrompt)) {
      currency = 'CAD';
    } else if (/\baud\b/i.test(cleanPrompt)) {
      currency = 'AUD';
    }

    // 2. Detect Client
    let matchedClient = clients.find((c) => {
      const nameMatch = c.name.toLowerCase();
      const compMatch = c.companyName.toLowerCase();
      return (
        cleanPrompt.toLowerCase().includes(compMatch) ||
        cleanPrompt.toLowerCase().includes(nameMatch)
      );
    });

    let clientName = '';
    let clientEmail = '';
    let clientAddress = '';

    if (matchedClient) {
      clientName = matchedClient.companyName;
      clientEmail = matchedClient.email;
      clientAddress = `${matchedClient.address || ''}, ${matchedClient.city || ''}, ${matchedClient.country || ''}`.replace(/^,\s*|,\s*$/g, '');
    } else {
      // Extract client using common conversational structures
      // e.g. "bill Tesla $3500", "invoice Google 5000", "for Acme Corp", "to Spotify"
      const billInvoicePattern = /(?:bill|invoice|charge)\s+([A-Z0-9][A-Za-z0-9\s&.,'-]+?)(?=\s+(?:for|at|with|\$|€|£|\d+|due|net|,|\.|\n|$))/i;
      const forClientPattern = /(?:for\s+(?:client\s+)?|to\s+(?:client\s+)?|client\s+partner\s+|client\s+)(?:is\s+)?([A-Z0-9][A-Za-z0-9\s&.,'-]+?)(?=\s+(?:at|with|due|on|for|\$|€|£|\d+|net|,|\.|\n|$))/i;

      const m1 = cleanPrompt.match(billInvoicePattern);
      const m2 = cleanPrompt.match(forClientPattern);

      if (m1 && m1[1] && !['for', 'an', 'a', 'the', 'new'].includes(m1[1].trim().toLowerCase())) {
        clientName = m1[1].trim().replace(/\s+(for|at|due|with|in)$/i, '').trim();
      } else if (m2 && m2[1]) {
        clientName = m2[1].trim().replace(/\s+(for|at|due|with|in)$/i, '').trim();
      } else {
        // Fallback: check capitalized business words
        const words = cleanPrompt.split(/\s+/);
        const candidates: string[] = [];
        for (const w of words) {
          if (
            /^[A-Z][a-zA-Z0-9]+$/.test(w) &&
            !['Invoice', 'Bill', 'Create', 'Draft', 'Generate', 'Due', 'Net', 'For', 'To', 'With', 'At', 'USD', 'EUR', 'GBP', 'VAT', 'The', 'And'].includes(w)
          ) {
            candidates.push(w);
          }
        }
        if (candidates.length > 0) {
          clientName = candidates.slice(0, 2).join(' ');
        } else {
          clientName = 'Global Enterprise Client';
        }
      }

      // Clean prefixes like "for client ", "client ", "for "
      clientName = clientName.replace(/^(for\s+(?:client\s+)?|to\s+(?:client\s+)?|client\s+)/i, '').trim();
      if (!clientName) clientName = 'Enterprise Partner Inc.';
      // Title case client name
      clientName = clientName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      clientEmail = `billing@${clientName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.com`;
      clientAddress = '100 Business Boulevard, Suite 400';
    }

    // 3. Detect Tax
    let taxRate = 0;
    const taxMatch =
      cleanPrompt.match(/(\d+(?:\.\d+)?)\s*%\s*(?:vat|tax|gst|sales tax|mwst|tva)/i) ||
      cleanPrompt.match(/(?:vat|tax|gst|sales tax|mwst|tva)\s*(?:of|at)?\s*(\d+(?:\.\d+)?)\s*%/i);
    if (taxMatch) {
      taxRate = parseFloat(taxMatch[1]);
    } else if (/\bvat\b|\bmwst\b|\btva\b/i.test(cleanPrompt)) {
      taxRate = currency === 'EUR' ? 20 : 0;
    }

    // 4. Detect Discount
    let discountPercentage = 0;
    let discountAmount = 0;
    const discountMatch = cleanPrompt.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|off)/i);
    if (discountMatch) {
      discountPercentage = parseFloat(discountMatch[1]);
    } else {
      const fixedDiscountMatch = cleanPrompt.match(/(?:discount|off)\s*(?:of)?\s*[\$€£]?\s*(\d+(?:\.\d+)?)/i);
      if (fixedDiscountMatch) {
        discountAmount = parseFloat(fixedDiscountMatch[1]);
      }
    }

    // 5. Detect Due Date / Payment Terms
    const today = new Date();
    const issueDate = today.toISOString().split('T')[0];
    let dueDays = profileTermsDays || 30;

    const termsMatch =
      cleanPrompt.match(/\bnet\s*(\d+)\b/i) ||
      cleanPrompt.match(/due\s*(?:in|within)?\s*(\d+)\s*days/i);

    if (termsMatch) {
      dueDays = parseInt(termsMatch[1], 10);
    } else if (/due\s*(?:immediately|upon receipt|on receipt)/i.test(cleanPrompt)) {
      dueDays = 0;
    } else if (/due\s*next\s*week/i.test(cleanPrompt)) {
      dueDays = 7;
    } else if (/due\s*in\s*2\s*weeks/i.test(cleanPrompt)) {
      dueDays = 14;
    } else if (/due\s*next\s*month/i.test(cleanPrompt)) {
      dueDays = 30;
    }

    const dueDateObj = new Date(today.getTime() + dueDays * 24 * 60 * 60 * 1000);
    const dueDate = dueDateObj.toISOString().split('T')[0];
    const paymentTerms = dueDays === 0 ? 'Due upon receipt' : `Net ${dueDays} days`;

    // 6. Detect Line Items
    const items: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      total: number;
    }> = [];

    // Helper to format currency symbol for descriptions
    const currSym = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

    // Pattern 1: Hourly / Units with "at" or "@" e.g.:
    // "10 hours of consulting at $120/hour"
    // "10 hrs @ 120"
    // "40h @ $100/hr"
    // "20 hours of coding at $80 per hour"
    // "5 days consulting for Linear at $1000/day"
    const hourlyRegex = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|days?|d)\s*(?:of)?\s*([^,]+?)?\s*(?:at|@)\s*[\$€£]?\s*(\d+(?:\.\d+)?)(?:\s*(?:\/|\s*per\s*)(?:hr|hour|day|d))?/gi;
    let hourlyMatch: RegExpExecArray | null;
    while ((hourlyMatch = hourlyRegex.exec(cleanPrompt)) !== null) {
      const qty = parseFloat(hourlyMatch[1]);
      const unitType = hourlyMatch[2].toLowerCase();
      let rawDesc = (hourlyMatch[3] || '').trim().replace(/\s+(for|to|with)\s+.*$/i, '').trim();
      const rate = parseFloat(hourlyMatch[4]);

      const isDays = unitType.startsWith('d');
      const unitLabel = isDays ? 'days' : 'hrs';

      let desc = rawDesc;
      if (desc.length > 0) {
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
      } else {
        desc = isDays ? 'Specialized Consulting Engagement' : 'Professional Engineering & Consulting';
      }

      const total = Math.round(qty * rate * 100) / 100;
      items.push({
        id: uuidv4(),
        description: `${desc} (${qty} ${unitLabel} @ ${currSym}${rate}/${isDays ? 'day' : 'hr'})`,
        quantity: qty,
        unitPrice: rate,
        taxRate,
        total,
      });
    }

    // Pattern 2: Unit Deliverables e.g. "3 UI design mockups at €450 each", "2 logos at $500"
    const unitRegex = /(\d+)\s+([a-zA-Z\s]{3,30}?)\s+(?:at|@)\s*[\$€£]?\s*(\d+(?:\.\d+)?)(?:\s*each|\s*per|\s*a\s*piece)?/gi;
    let unitMatch: RegExpExecArray | null;
    while ((unitMatch = unitRegex.exec(cleanPrompt)) !== null) {
      const qty = parseInt(unitMatch[1], 10);
      let desc = unitMatch[2].trim().replace(/\s+(for|to)\s+.*$/i, '').trim();
      const rate = parseFloat(unitMatch[3]);
      if (
        !/hour|hr|h|day|d/i.test(desc) &&
        !items.some((i) => i.description.toLowerCase().includes(desc.toLowerCase()))
      ) {
        desc = desc.charAt(0).toUpperCase() + desc.slice(1);
        const total = Math.round(qty * rate * 100) / 100;
        items.push({
          id: uuidv4(),
          description: desc,
          quantity: qty,
          unitPrice: rate,
          taxRate,
          total,
        });
      }
    }

    // Pattern 3: Fixed Fee / Project / Audit / Retainer e.g. "for web design $1500", "bill Tesla $3500 for security audit", "Stripe invoice 1200 eur"
    if (items.length === 0) {
      // Find primary amount in prompt
      const amountRegex = /[\$€£]\s*(\d+(?:,\d{3})*(?:\.\d+)?)|(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:usd|eur|gbp|dollars?|euros?|\$|€|£)?/gi;
      let matchedAmounts: number[] = [];
      let amMatch: RegExpExecArray | null;
      while ((amMatch = amountRegex.exec(cleanPrompt)) !== null) {
        const valStr = (amMatch[1] || amMatch[2] || '').replace(/,/g, '');
        const val = parseFloat(valStr);
        // Exclude terms numbers like net 30 or tax 20
        if (val > 0 && val !== dueDays && val !== taxRate && val !== discountPercentage) {
          matchedAmounts.push(val);
        }
      }

      // Filter plausible invoice amounts (> 10 or highest number)
      matchedAmounts = matchedAmounts.filter((a) => a >= 25 || a === Math.max(...matchedAmounts));
      const primaryAmount = matchedAmounts.length > 0 ? Math.max(...matchedAmounts) : 1500;

      // Extract service description
      let serviceDesc = 'Professional Services Deliverable';
      const forServiceMatch = cleanPrompt.match(/(?:for|regarding|service:)\s+([A-Za-z0-9\s&/-]{3,50}?)(?=\s+(?:due|net|with|at|\$|€|£|\d+|,|\.|$))/i);
      if (forServiceMatch && forServiceMatch[1]) {
        let raw = forServiceMatch[1].trim();
        if (!raw.toLowerCase().includes(clientName.toLowerCase())) {
          serviceDesc = raw.charAt(0).toUpperCase() + raw.slice(1);
        }
      } else if (/cloud|devops|kubernetes|infra/i.test(cleanPrompt)) {
        serviceDesc = 'Cloud Infrastructure & DevOps Retainer';
      } else if (/design|ui|ux|logo|branding/i.test(cleanPrompt)) {
        serviceDesc = 'Design System & UX Architecture Deliverables';
      } else if (/seo|marketing|audit/i.test(cleanPrompt)) {
        serviceDesc = 'Growth Strategy & Technical Audit';
      } else if (/retainer/i.test(cleanPrompt)) {
        serviceDesc = 'Monthly Strategic Advisory Retainer';
      }

      items.push({
        id: uuidv4(),
        description: serviceDesc,
        quantity: 1,
        unitPrice: primaryAmount,
        taxRate,
        total: primaryAmount,
      });
    }

    // 7. Calculate Totals
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
    if (discountPercentage > 0) {
      discountAmount = Math.round(((subtotal * discountPercentage) / 100) * 100) / 100;
    }
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

    // 8. Notes
    let notes = `Invoice generated from prompt: "${cleanPrompt}".`;
    if (discountPercentage > 0) {
      notes += ` Includes ${discountPercentage}% promotional discount.`;
    }
    if (taxRate > 0) {
      notes += ` Standard ${taxRate}% tax/VAT rate applied.`;
    }

    // PO number check
    const poMatch = cleanPrompt.match(/(?:po|purchase order|ref|reference)\s*(?:#|no\.?|num\.?)?\s*([A-Za-z0-9_-]+)/i);
    if (poMatch && poMatch[1]) {
      notes += ` PO Reference: ${poMatch[1]}.`;
    }

    const confidence = items.length > 0 && clientName ? 0.98 : 0.90;
    const aiExplanation = `AI extracted client "${clientName}", parsed ${items.length} line item(s), applied ${currency} currency with ${paymentTerms}. Subtotal calculated as ${currSym}${total.toFixed(2)}.`;

    return {
      clientName,
      clientId: matchedClient ? matchedClient.id : undefined,
      clientEmail,
      clientAddress,
      profileId: defaultProfileId,
      issueDate,
      dueDate,
      currency,
      items,
      subtotal,
      taxTotal,
      discountPercentage,
      discountAmount,
      total,
      notes,
      paymentTerms,
      aiPromptOrigin: cleanPrompt,
      confidence,
      aiExplanation,
      extractedFields: {
        clientMatched: !!matchedClient,
        detectedCurrency: currency,
        itemsCount: items.length,
        detectedTax: taxRate,
        detectedDiscount: discountPercentage || discountAmount,
      },
    };
  }

  public refineDraft(refinement: string, draft: ParsedInvoiceDraft): ParsedInvoiceDraft {
    const updated = { ...draft };
    this.logger.log(`Refining invoice draft with: "${refinement}"`);

    // Check discount refinement
    const discMatch = refinement.match(/(\d+(?:\.\d+)?)\s*%\s*(?:discount|off)/i);
    if (discMatch) {
      updated.discountPercentage = parseFloat(discMatch[1]);
      updated.discountAmount = Math.round(((updated.subtotal * updated.discountPercentage) / 100) * 100) / 100;
    }

    // Check currency refinement
    if (/switch\s*(?:to)?\s*eur|in\s*eur/i.test(refinement)) {
      updated.currency = 'EUR';
    } else if (/switch\s*(?:to)?\s*usd|in\s*usd/i.test(refinement)) {
      updated.currency = 'USD';
    } else if (/switch\s*(?:to)?\s*gbp|in\s*gbp/i.test(refinement)) {
      updated.currency = 'GBP';
    }

    // Check terms refinement
    const termsMatch =
      refinement.match(/\bnet\s*(\d+)\b/i) ||
      refinement.match(/due\s*(?:in)?\s*(\d+)\s*days/i);
    if (termsMatch) {
      const days = parseInt(termsMatch[1], 10);
      updated.paymentTerms = `Net ${days} days`;
      const issue = new Date(updated.issueDate);
      const newDue = new Date(issue.getTime() + days * 24 * 60 * 60 * 1000);
      updated.dueDate = newDue.toISOString().split('T')[0];
    }

    // Check tax refinement
    const taxMatch = refinement.match(/(\d+(?:\.\d+)?)\s*%\s*(?:vat|tax)/i);
    if (taxMatch) {
      const newTax = parseFloat(taxMatch[1]);
      updated.items = updated.items.map((i) => ({
        ...i,
        taxRate: newTax,
      }));
    }

    // Add item refinement e.g. "add $150 travel expense"
    const addItemMatch = refinement.match(/add\s+[\$€£]?\s*(\d+(?:\.\d+)?)\s*(?:for|of)?\s*([a-zA-Z\s]{3,40})/i);
    if (addItemMatch) {
      const price = parseFloat(addItemMatch[1]);
      const desc = addItemMatch[2].trim();
      updated.items.push({
        id: uuidv4(),
        description: desc.charAt(0).toUpperCase() + desc.slice(1),
        quantity: 1,
        unitPrice: price,
        taxRate: updated.items[0]?.taxRate || 0,
        total: price,
      });
      updated.subtotal = Math.round(updated.items.reduce((s, it) => s + it.total, 0) * 100) / 100;
    }

    // Recalculate totals
    const taxableBase = Math.max(0, updated.subtotal - (updated.discountAmount || 0));
    let taxTotal = 0;
    for (const it of updated.items) {
      if (it.taxRate > 0) {
        taxTotal += (it.total * (1 - (updated.discountPercentage || 0) / 100) * it.taxRate) / 100;
      }
    }
    updated.taxTotal = Math.round(taxTotal * 100) / 100;
    updated.total = Math.round((taxableBase + updated.taxTotal) * 100) / 100;
    const currSym = updated.currency === 'EUR' ? '€' : updated.currency === 'GBP' ? '£' : '$';
    updated.aiExplanation = `Refined with "${refinement}": updated totals to ${currSym}${updated.total.toFixed(2)}.`;

    return updated;
  }
}
