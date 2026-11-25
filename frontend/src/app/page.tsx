'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import DashboardView from '../components/DashboardView';
import AiStudioView from '../components/AiStudioView';
import InvoicesView from '../components/InvoicesView';
import ClientsView from '../components/ClientsView';
import ProfilesView from '../components/ProfilesView';
import PricingView from '../components/PricingView';
import ManualInvoiceModal from '../components/ManualInvoiceModal';
import LoginPage from '../components/LoginPage';
import { api } from '../lib/api';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [metrics, setMetrics] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [currentProfileId, setCurrentProfileId] = useState<string>('');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals & State transfers
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [aiStudioInitialPrompt, setAiStudioInitialPrompt] = useState('');
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<any | null>(null);

  // Check authenticated session on mount via HTTP-only cookie
  useEffect(() => {
    let isMounted = true;
    async function verifyAuth() {
      try {
        const res = await api.getMe();
        if (isMounted && res.user) {
          setCurrentUser(res.user);
        }
      } catch (err) {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    }
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load all initial data for the authenticated user
  const loadAllData = useCallback(async () => {
    if (!currentUser) return;
    try {
      // 1. Health check
      try {
        const h = await api.checkHealth();
        setBackendHealthy(h.status === 'ok');
      } catch {
        setBackendHealthy(false);
      }

      // 2. Load Profiles
      const profs = await api.getProfiles();
      setProfiles(profs);
      const defaultProf = profs.find((p: any) => p.isDefault) || profs[0];
      if (defaultProf && !currentProfileId) {
        setCurrentProfileId(defaultProf.id);
      }

      // 3. Load Subscription
      const sub = await api.getSubscription();
      setSubscription(sub);

      // 4. Load Clients
      const clis = await api.getClients();
      setClients(clis);

      // 5. Load Invoices
      const invs = await api.getInvoices({
        status: 'all',
        search: searchQuery,
      });
      setInvoices(invs);

      // 6. Load Dashboard Metrics
      const m = await api.getDashboard(currencyFilter);
      setMetrics(m);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      if (err.status === 401) {
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, currencyFilter, searchQuery, currentProfileId]);

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, loadAllData]);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setCurrentProfileId('');
    setLoading(true);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setCurrentUser(null);
    setInvoices([]);
    setClients([]);
    setProfiles([]);
    setMetrics(null);
    setSubscription(null);
    setCurrentProfileId('');
  };

  // Handlers
  const handleOpenAiWithPrompt = (prompt: string) => {
    setAiStudioInitialPrompt(prompt);
    setCurrentTab('ai-studio');
    setIsMobileMenuOpen(false);
  };

  const handleInvoiceCreated = (invoice: any) => {
    loadAllData();
    setSelectedInvoiceForModal(invoice);
    setCurrentTab('invoices');
    setIsMobileMenuOpen(false);
  };

  const handleSendInvoice = async (id: string) => {
    try {
      await api.sendInvoice(id);
      loadAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to send invoice');
    }
  };

  const handleRecordPayment = (inv: any) => {
    setSelectedInvoiceForModal(inv);
    setCurrentTab('invoices');
  };

  const handleTabSelect = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileMenuOpen(false);
  };

  // 1. Initial Auth Verification Screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-400 animate-pulse" />
          </div>
        </div>
        <div className="text-white text-base font-extrabold tracking-tight">PromptToInvoice</div>
        <div className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
          Verifying encrypted HTTP-Only session...
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Login Page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Authenticated: Render Main Workspace
  return (
    <div className="flex min-h-screen bg-slate-900/5 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation (Responsive Drawer) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleTabSelect}
        profiles={profiles}
        currentProfileId={currentProfileId}
        setCurrentProfileId={setCurrentProfileId}
        subscription={subscription}
        backendHealthy={backendHealthy}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full">
        <Navbar
          onOpenAiStudio={() => {
            setAiStudioInitialPrompt('');
            setCurrentTab('ai-studio');
          }}
          onOpenManualCreate={() => setIsManualModalOpen(true)}
          currencyFilter={currencyFilter}
          setCurrencyFilter={setCurrencyFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          {loading && !metrics ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-600 rounded-full" />
                </div>
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                Syncing with PromptToInvoice Engine...
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  metrics={metrics}
                  invoices={invoices}
                  onOpenAiWithPrompt={handleOpenAiWithPrompt}
                  onViewInvoice={(inv) => {
                    setSelectedInvoiceForModal(inv);
                    setCurrentTab('invoices');
                  }}
                  onSendInvoice={handleSendInvoice}
                  onRecordPayment={handleRecordPayment}
                  currencyFilter={currencyFilter}
                />
              )}

              {currentTab === 'ai-studio' && (
                <AiStudioView
                  initialPrompt={aiStudioInitialPrompt}
                  profiles={profiles}
                  currentProfileId={currentProfileId}
                  onInvoiceCreated={handleInvoiceCreated}
                />
              )}

              {currentTab === 'invoices' && (
                <InvoicesView
                  invoices={invoices}
                  profiles={profiles}
                  onRefresh={loadAllData}
                  onOpenManualCreate={() => setIsManualModalOpen(true)}
                  onOpenAiStudio={() => {
                    setAiStudioInitialPrompt('');
                    setCurrentTab('ai-studio');
                  }}
                  selectedInvoice={selectedInvoiceForModal}
                  setSelectedInvoice={setSelectedInvoiceForModal}
                />
              )}

              {currentTab === 'clients' && (
                <ClientsView
                  clients={clients}
                  onRefresh={loadAllData}
                  onFilterClientInvoices={(clientName) => {
                    setSearchQuery(clientName);
                    setCurrentTab('invoices');
                  }}
                />
              )}

              {currentTab === 'profiles' && (
                <ProfilesView
                  profiles={profiles}
                  currentProfileId={currentProfileId}
                  onRefresh={loadAllData}
                  subscription={subscription}
                />
              )}

              {currentTab === 'pricing' && (
                <PricingView
                  subscription={subscription}
                  onRefresh={loadAllData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Manual Invoice Creation Modal */}
      <ManualInvoiceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        profiles={profiles}
        currentProfileId={currentProfileId}
        clients={clients}
        onInvoiceCreated={handleInvoiceCreated}
      />
    </div>
  );
}
