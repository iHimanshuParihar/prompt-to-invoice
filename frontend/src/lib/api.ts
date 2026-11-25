const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`;
  try {
    const res = await fetch(fullUrl, {
      ...options,
      credentials: 'include', // Send & receive HTTP-only session cookies
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `API request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || errorMsg;
      } catch {}
      const error: any = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    return await res.json();
  } catch (err: any) {
    console.error(`Fetch error for ${fullUrl}:`, err);
    throw err;
  }
}

export const api = {
  // Auth & Session
  login: (dto: { email: string; password: string }) =>
    fetchJson<{ user: any; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  register: (dto: { name: string; email: string; password: string; currency?: string }) =>
    fetchJson<{ user: any; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  logout: () =>
    fetchJson<{ success: boolean; message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  getMe: () => fetchJson<{ user: any }>('/api/auth/me'),

  getDemoAccounts: () =>
    fetchJson<{ accounts: Array<{ name: string; email: string; role: string; currency: string; sampleData: string }> }>('/api/auth/demo-accounts'),

  // Health
  checkHealth: () => fetchJson<{ status: string }>('/api/health'),

  // Analytics
  getDashboard: (currency = 'all') =>
    fetchJson<any>(`/api/analytics/dashboard?currency=${currency}`),

  // Invoices
  getInvoices: (params?: { status?: string; search?: string; profileId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.profileId) searchParams.set('profileId', params.profileId);
    const qs = searchParams.toString();
    return fetchJson<any[]>(`/api/invoices${qs ? `?${qs}` : ''}`);
  },

  getInvoice: (id: string) => fetchJson<any>(`/api/invoices/${id}`),

  createInvoice: (dto: any) =>
    fetchJson<any>('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  updateInvoice: (id: string, dto: any) =>
    fetchJson<any>(`/api/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    }),

  deleteInvoice: (id: string) =>
    fetchJson<{ success: boolean; deletedInvoiceNumber?: string }>(`/api/invoices/${id}`, {
      method: 'DELETE',
    }),

  sendInvoice: (id: string) =>
    fetchJson<{ success: boolean; message: string; invoice: any }>(`/api/invoices/${id}/send`, {
      method: 'POST',
    }),

  recordPayment: (id: string, dto: { amount: number; date: string; method: string; note?: string }) =>
    fetchJson<any>(`/api/invoices/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  getInvoiceHtmlUrl: (id: string) => `${API_BASE_URL}/api/invoices/${id}/html`,

  // AI Assistant
  parsePrompt: (prompt: string, profileId?: string) =>
    fetchJson<any>('/api/ai/parse-prompt', {
      method: 'POST',
      body: JSON.stringify({ prompt, profileId }),
    }),

  refineDraft: (refinement: string, currentDraft: any) =>
    fetchJson<any>('/api/ai/refine-draft', {
      method: 'POST',
      body: JSON.stringify({ refinement, currentDraft }),
    }),

  // Clients
  getClients: () => fetchJson<any[]>('/api/clients'),
  getClient: (id: string) => fetchJson<any>(`/api/clients/${id}`),
  createClient: (dto: any) =>
    fetchJson<any>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  deleteClient: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/clients/${id}`, {
      method: 'DELETE',
    }),

  // Profiles
  getProfiles: () => fetchJson<any[]>('/api/profiles'),
  createProfile: (dto: any) =>
    fetchJson<any>('/api/profiles', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  setDefaultProfile: (id: string) =>
    fetchJson<any>(`/api/profiles/${id}/set-default`, {
      method: 'POST',
    }),

  // Subscriptions
  getSubscription: () => fetchJson<any>('/api/subscriptions/current'),
  getTiers: () => fetchJson<any[]>('/api/subscriptions/tiers'),
  changeTier: (tier: string) =>
    fetchJson<any>('/api/subscriptions/change-tier', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    }),
};
