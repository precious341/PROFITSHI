import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatDate } from '../lib/formatters';
import { ShopifyConfigModal } from '../components/shopify/ShopifyConfigModal';
import {
  Store,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  Sliders,
  Settings,
  HelpCircle,
  Link as LinkIcon,
  Unlink,
  Check,
  Copy,
  Key,
  Save,
  Activity,
  Eye,
  EyeOff,
  BookOpen,
  ArrowRight
} from 'lucide-react';

const SUPPORTED_API_VERSIONS = [
  '2024-10',
  '2025-01',
  '2025-04',
  '2026-01',
  '2026-10'
];

export const SettingsPage: React.FC = () => {
  const { store, triggerSync, refreshing, activeMode, switchShopifyMode, refreshAllData } = useApp();
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'guide' | 'handover'>('status');
  const [shopifyStatus, setShopifyStatus] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string; counts?: any } | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [popupBlockedUrl, setPopupBlockedUrl] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState(false);

  // In-page Configuration Form State
  const [cfgDomain, setCfgDomain] = useState('');
  const [cfgApiKey, setCfgApiKey] = useState('');
  const [cfgApiSecret, setCfgApiSecret] = useState('');
  const [cfgMaskedSecret, setCfgMaskedSecret] = useState('');
  const [cfgHasSavedSecret, setCfgHasSavedSecret] = useState(false);
  const [cfgApiVersion, setCfgApiVersion] = useState('2024-10');
  const [cfgScopes, setCfgScopes] = useState('read_products,read_orders,read_inventory,read_fulfillments,read_price_rules,read_discounts');
  const [showSecretField, setShowSecretField] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConfig, setTestingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Quick connect store domain input in connection card
  const [connectDomainInput, setConnectDomainInput] = useState('');

  useEffect(() => {
    loadShopifyStatus();
    loadConfigurationData();

    // Listen for OAuth completion from popup window
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'SHOPIFY_AUTH_SUCCESS') {
        setConnecting(false);
        setPopupBlockedUrl(null);
        setSyncFeedback({
          type: 'success',
          text: `Shopify store "${event.data.shopName || event.data.shop}" successfully connected and verified via Shopify Admin API!`
        });
        loadShopifyStatus();
        refreshAllData();
      } else if (event.data?.type === 'SHOPIFY_AUTH_ERROR') {
        setConnecting(false);
        setSyncFeedback({
          type: 'error',
          text: `Shopify OAuth failed: ${event.data.error || 'Authorization rejected by store owner.'}`
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadShopifyStatus = async () => {
    try {
      const data = await api.getShopifyStatus();
      setShopifyStatus(data);
      if (data.connectedStore && !connectDomainInput) {
        setConnectDomainInput(data.connectedStore);
      }
    } catch (err) {
      console.error('Failed to load shopify status:', err);
    }
  };

  const loadConfigurationData = async () => {
    try {
      const res = await api.getShopifyConfig();
      if (res.config) {
        setCfgDomain(res.config.shopDomain || '');
        if (!connectDomainInput && res.config.shopDomain) {
          setConnectDomainInput(res.config.shopDomain);
        }
        setCfgApiKey(res.config.apiKey || '');
        setCfgMaskedSecret(res.config.maskedApiSecret || '');
        setCfgHasSavedSecret(Boolean(res.config.hasSecret));
        const ver = res.config.apiVersion || '2024-10';
        setCfgApiVersion(ver.includes('http') ? '2024-10' : ver);
        setCfgScopes(res.config.scopes || 'read_products,read_orders,read_inventory,read_fulfillments,read_price_rules,read_discounts');
      }
    } catch (err) {
      console.error('Failed to load shopify config:', err);
    }
  };

  const callbackUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/shopify/callback`
    : '/api/shopify/callback';
  const appOrigin = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ais-dev-utpk6or4475l6lazdxh5ef-564166153569.europe-west3.run.app';

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2500);
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(appOrigin);
    setCopiedAppUrl(true);
    setTimeout(() => setCopiedAppUrl(false), 2500);
  };

  const handleConnectShopify = async (targetDomain?: string) => {
    const domain = (targetDomain || connectDomainInput || cfgDomain).trim();
    if (!domain) {
      setSyncFeedback({
        type: 'error',
        text: 'Please enter your Shopify store domain (e.g., your-store.myshopify.com) before connecting.'
      });
      return;
    }

    if (!shopifyStatus?.configured && !cfgApiKey) {
      setActiveTab('config');
      setSyncFeedback({
        type: 'error',
        text: 'Shopify Client ID and Client Secret must be configured before connecting. Please enter your credentials below.'
      });
      return;
    }

    try {
      setConnecting(true);
      setSyncFeedback(null);
      setPopupBlockedUrl(null);

      const res = await api.connectShopifyStore(domain, callbackUrl);
      if (res.status === 'redirect' && res.authUrl) {
        // Open OAuth Provider authorization URL directly in popup as required by OAuth skill
        const popup = window.open(
          res.authUrl,
          'shopify_oauth_popup',
          'width=700,height=800,menubar=no,status=no,toolbar=no,location=yes'
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          // Popup was blocked by browser
          setPopupBlockedUrl(res.authUrl);
          setSyncFeedback({
            type: 'info',
            text: 'Popup was blocked by your browser. Please click the button below to complete authorization.'
          });
        } else {
          setSyncFeedback({
            type: 'info',
            text: `Shopify authorization window opened for "${res.shop}". Complete the prompt in the popup window.`
          });
        }
      }
    } catch (err: any) {
      setConnecting(false);
      if (err.message && (err.message.includes('not configured') || err.message.includes('CREDENTIALS_REQUIRED'))) {
        setActiveTab('config');
        setSyncFeedback({
          type: 'error',
          text: 'Shopify Client ID and Client Secret must be saved first. Enter your Shopify Partner Dashboard credentials below.'
        });
      } else {
        setSyncFeedback({
          type: 'error',
          text: err.message || 'Failed to initiate Shopify connection.'
        });
      }
    }
  };

  const handleSaveConfiguration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cfgDomain.trim()) {
      setConfigMessage({ type: 'error', text: 'Shopify Store Domain is required.' });
      return;
    }
    if (!cfgApiKey.trim()) {
      setConfigMessage({ type: 'error', text: 'Shopify Client ID is required.' });
      return;
    }

    try {
      setSavingConfig(true);
      setConfigMessage(null);

      const payload: any = {
        shopDomain: cfgDomain.trim(),
        apiKey: cfgApiKey.trim(),
        apiVersion: cfgApiVersion.trim(),
        scopes: cfgScopes.trim(),
        appUrl: appOrigin
      };

      if (cfgApiSecret.trim()) {
        payload.apiSecret = cfgApiSecret.trim();
      }

      const res = await api.saveShopifyConfig(payload);
      setCfgApiSecret('');
      setCfgMaskedSecret(res.config.maskedApiSecret || '');
      setCfgHasSavedSecret(Boolean(res.config.hasSecret));
      setConfigMessage({ type: 'success', text: 'Shopify settings saved securely on the server.' });
      setConnectDomainInput(cfgDomain.trim());
      await loadShopifyStatus();
      await refreshAllData();
    } catch (err: any) {
      setConfigMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConfiguration = async () => {
    try {
      setTestingConfig(true);
      setConfigMessage(null);

      const res = await api.testShopifyConfig({
        shopDomain: cfgDomain.trim() || connectDomainInput.trim(),
        apiKey: cfgApiKey.trim(),
        apiSecret: cfgApiSecret.trim() || undefined
      });

      if (res.success) {
        setConfigMessage({ type: 'success', text: res.message });
      } else {
        setConfigMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setConfigMessage({ type: 'error', text: err.message || 'Connection test failed.' });
    } finally {
      setTestingConfig(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect this Shopify store? Operating mode will switch to Demo Store.')) {
      return;
    }
    try {
      setDisconnecting(true);
      await api.disconnectShopifyStore();
      await refreshAllData();
      await loadShopifyStatus();
      setSyncFeedback({
        type: 'info',
        text: 'Live Shopify store disconnected. Switched to Demo Store Mode.'
      });
    } catch (err: any) {
      setSyncFeedback({ type: 'error', text: err.message || 'Failed to disconnect store.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSyncData = async () => {
    try {
      setSyncFeedback(null);
      const res = await triggerSync();
      if (res.status === 'success' && res.synced) {
        setSyncFeedback({
          type: 'success',
          text: res.message || 'Synchronization complete!',
          counts: res.synced
        });
      } else {
        setSyncFeedback({
          type: 'info',
          text: res.message || 'Store records refreshed.'
        });
      }
      await loadShopifyStatus();
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        text: err.message || 'Synchronization failed. Ensure store is connected.'
      });
    }
  };

  const isLiveMode = activeMode === 'live';
  const isConnected = Boolean(shopifyStatus?.connected);
  const isConfigured = Boolean(shopifyStatus?.configured);

  return (
    <div className="space-y-6">
      {/* Top Header & Prominent Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Shopify Store Connection & Compliance</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Connect your live Shopify store via official OAuth, synchronize catalog & orders, and manage compliance.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2.5">
          {/* Visible "Connect Shopify Store" Button */}
          {(!isConnected || !isLiveMode) && (
            <button
              onClick={() => handleConnectShopify()}
              disabled={connecting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <LinkIcon className={`w-4 h-4 ${connecting ? 'animate-spin' : ''}`} />
              <span>{connecting ? 'Connecting...' : 'Connect Shopify Store'}</span>
            </button>
          )}

          {/* Visible "Shopify Configuration" Button */}
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl font-semibold text-xs border flex items-center space-x-2 transition-all shadow-sm ${
              activeTab === 'config'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Shopify Configuration</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeTab === 'status'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Connection & Status</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeTab === 'config'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Shopify Configuration Page</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeTab === 'guide'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Shopify Partner Setup & URLs</span>
        </button>

        <button
          onClick={() => setActiveTab('handover')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
            activeTab === 'handover'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Buyer Transfer & Setup Guide</span>
        </button>
      </div>

      {/* Global Sync Feedback Banner */}
      {syncFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : syncFeedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : syncFeedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-sky-400 flex-shrink-0" />
            )}
            <span className="font-medium">{syncFeedback.text}</span>
          </div>

          {syncFeedback.counts && (
            <div className="flex items-center space-x-3 text-[11px] text-emerald-400 font-mono">
              <span>{syncFeedback.counts.productsCount} Products</span>
              <span>&bull;</span>
              <span>{syncFeedback.counts.ordersCount} Orders</span>
            </div>
          )}
        </div>
      )}

      {/* Popup Blocked Fallback Action Banner */}
      {popupBlockedUrl && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Browser popup blocked. Click to open the official Shopify authorization window directly:</span>
          </div>
          <a
            href={popupBlockedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <span>Open Shopify Authorization</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Mode Switcher Banner (Requirement 5) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Operating Store Mode
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Switch between testing with realistic sample store data and authenticating your live Shopify store.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => switchShopifyMode('demo')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              !isLiveMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Demo Store Mode
          </button>
          <button
            onClick={() => switchShopifyMode('live')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              isLiveMode
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Shopify Store
          </button>
        </div>
      </div>

      {/* TAB 1: CONNECTION & STATUS */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Shopify Connection State Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span>Shopify Connection State</span>
                </div>

                {isLiveMode ? (
                  isConnected ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Connected (OAuth Live)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      Live Mode: Not Connected
                    </span>
                  )
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Demo Store Active
                  </span>
                )}
              </div>

              {/* Live Mode: Not Connected Notice & Connect Shopify Store Form */}
              {isLiveMode && !isConnected && (
                <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-sm text-white">No Shopify store authenticated yet</h3>
                      <p className="text-xs text-rose-200/80 mt-1 leading-relaxed">
                        Enter your Shopify store domain below and click <strong>Connect Shopify Store</strong> to initiate official OAuth authorization.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="your-store.myshopify.com"
                        value={connectDomainInput}
                        onChange={(e) => setConnectDomainInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    {/* Visible "Connect Shopify Store" Button */}
                    <button
                      onClick={() => handleConnectShopify(connectDomainInput)}
                      disabled={connecting}
                      className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>{connecting ? 'Initiating Authorization...' : 'Connect Shopify Store'}</span>
                    </button>
                  </div>

                  {!isConfigured && (
                    <div className="text-[11px] text-amber-300 flex items-center space-x-1.5 pt-1">
                      <span>Tip: Shopify Client ID & Secret are required.</span>
                      <button
                        onClick={() => setActiveTab('config')}
                        className="underline font-semibold hover:text-white"
                      >
                        Click here to configure credentials &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Connection Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block">Store Name</span>
                  <span className="text-sm font-bold text-white">
                    {isLiveMode
                      ? isConnected
                        ? store?.shop_name
                        : 'No Store Connected'
                      : 'The Artisan Roastery Co.'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Shopify Domain</span>
                  <span className="text-sm font-mono text-slate-300">
                    {isLiveMode
                      ? isConnected
                        ? store?.shopify_domain
                        : 'None (.myshopify.com)'
                      : 'the-artisan-roastery.myshopify.com'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Admin API Version</span>
                  <span className="text-sm font-mono text-emerald-400 font-bold">
                    {shopifyStatus?.apiVersion || '2024-10'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Last Data Synchronization</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {formatDate(store?.last_sync_at)}
                  </span>
                </div>
              </div>

              {/* Action Bar for Connect / Disconnect / Sync */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
                <div className="text-xs text-slate-400 max-w-sm">
                  {isLiveMode ? (
                    isConnected ? (
                      'Official Shopify GraphQL Admin API integration is active.'
                    ) : (
                      'Authorize ProfitShield with your Shopify store via official OAuth.'
                    )
                  ) : (
                    'Demo mode active. Sample records are being used for analysis.'
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {isLiveMode && !isConnected && (
                    <button
                      onClick={() => handleConnectShopify()}
                      disabled={connecting}
                      className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-sm disabled:opacity-50"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>{connecting ? 'Connecting...' : 'Connect Shopify Store'}</span>
                    </button>
                  )}

                  {isLiveMode && isConnected && (
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>Disconnect Store</span>
                    </button>
                  )}

                  {/* Sync Action */}
                  <button
                    onClick={handleSyncData}
                    disabled={refreshing || (isLiveMode && !isConnected)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center space-x-1.5 transition-colors disabled:opacity-40"
                    title={isLiveMode && !isConnected ? 'Connect store via OAuth to synchronize' : 'Sync store data'}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>{refreshing ? 'Syncing...' : 'Sync Store Data'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Setup Instructions */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
              <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-slate-400">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Shopify App Integration Steps</span>
              </div>

              <ol className="list-decimal list-inside space-y-2.5 text-slate-300 leading-relaxed">
                <li>
                  Go to <strong>Shopify Configuration Page</strong> tab or click "Shopify Configuration" above.
                </li>
                <li>
                  Enter your <strong>Shopify Store Domain</strong>, <strong>Client ID</strong>, and <strong>Client Secret</strong> from your Shopify Partner Dashboard.
                </li>
                <li>
                  Ensure your Shopify Partner App has the following <strong>Allowed redirection URL</strong>:
                  <div className="mt-1 flex items-center space-x-2">
                    <code className="flex-1 p-2 rounded bg-slate-950 text-emerald-400 font-mono text-[11px] select-all truncate border border-slate-800">
                      {callbackUrl}
                    </code>
                    <button
                      onClick={handleCopyCallback}
                      className="px-2.5 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </li>
                <li>
                  Click <strong>Connect Shopify Store</strong> to complete the official OAuth handshake and synchronize catalog and orders.
                </li>
              </ol>
            </div>
          </div>

          {/* Right Column: Scopes & Webhooks */}
          <div className="space-y-6">
            {/* Configured Scopes */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
              <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Configured Access Scopes</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Minimal read permissions requested for profitability audit:
              </p>
              <div className="space-y-1.5 font-mono text-[11px]">
                {(shopifyStatus?.scopes || [
                  'read_products',
                  'read_orders',
                  'read_inventory',
                  'read_fulfillments',
                  'read_price_rules',
                  'read_discounts'
                ]).map((scope: string, idx: number) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <span className="text-emerald-400 font-bold block">{scope}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mandatory GDPR Webhooks */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
              <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-slate-400">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Mandatory Privacy Webhooks</span>
              </div>
              <p className="text-slate-400">Endpoints ready for Partner Dashboard registration:</p>
              <div className="space-y-2">
                {[
                  { name: 'customers/data_request', path: '/api/shopify/webhooks/customers/data_request', status: 'Active (No PII stored)' },
                  { name: 'customers/redact', path: '/api/shopify/webhooks/customers/redact', status: 'Active' },
                  { name: 'shop/redact', path: '/api/shopify/webhooks/shop/redact', status: 'Active' },
                  { name: 'app/uninstalled', path: '/api/shopify/webhooks/app/uninstalled', status: 'Active' }
                ].map((wh, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/40">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-white font-bold">{wh.name}</span>
                      <span className="text-emerald-400 text-[10px] font-semibold">{wh.status}</span>
                    </div>
                    <span className="text-slate-500 text-[10px] block mt-0.5 truncate">{wh.path}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHOPIFY CONFIGURATION PAGE (Requirement 1 & 3) */}
      {activeTab === 'config' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Sliders className="w-4 h-4" />
                <span>Shopify App Settings & Credentials</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Configure Official Shopify Partner Credentials</h2>
              <p className="text-xs text-slate-400 mt-1">
                Store your credentials securely on the server. Credentials are never exposed in browser code or localStorage.
              </p>
            </div>

            {configMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                  configMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {configMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                )}
                <span className="leading-relaxed">{configMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfiguration} className="space-y-4 text-xs">
              {/* Shopify Store Domain */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Shopify Store Domain (.myshopify.com) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. your-store-name.myshopify.com"
                    value={cfgDomain}
                    onChange={(e) => setCfgDomain(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter your development or production store domain from your Shopify Admin.
                </p>
              </div>

              {/* Shopify Client ID */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Shopify Client ID (API Key) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. shpa_xxxxxxxxxxxxxxxxxxxxxxxx"
                    value={cfgApiKey}
                    onChange={(e) => setCfgApiKey(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Found in your Shopify Partner Dashboard &rarr; Apps &rarr; Your App &rarr; App Setup &rarr; Client ID.
                </p>
              </div>

              {/* Shopify Client Secret */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">
                    Shopify Client Secret {!cfgHasSavedSecret && <span className="text-rose-400">*</span>}
                  </label>
                  {cfgHasSavedSecret && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Secret Saved: {cfgMaskedSecret}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showSecretField ? 'text' : 'password'}
                    placeholder={cfgHasSavedSecret ? 'Enter new secret to update, or leave blank to keep existing' : 'e.g. shpss_xxxxxxxxxxxxxxxxxxxxxxxx'}
                    value={cfgApiSecret}
                    onChange={(e) => setCfgApiSecret(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretField(!showSecretField)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    title={showSecretField ? 'Hide secret' : 'Show secret'}
                  >
                    {showSecretField ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Never shared with the browser. Stored securely on the server for OAuth token exchange.
                </p>
              </div>

              {/* Shopify Admin API Version (Requirement 3) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Shopify Admin API Version <span className="text-rose-400">*</span>
                </label>
                <select
                  value={cfgApiVersion}
                  onChange={(e) => setCfgApiVersion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                >
                  {SUPPORTED_API_VERSIONS.map((ver) => (
                    <option key={ver} value={ver}>
                      {ver} {ver === '2024-10' ? '(Recommended Stable)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Valid Shopify Admin GraphQL API version identifier.
                </p>
              </div>

              {/* Required Scopes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Required Access Scopes
                </label>
                <input
                  type="text"
                  value={cfgScopes}
                  onChange={(e) => setCfgScopes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Comma-separated access scopes requested during OAuth authorization.
                </p>
              </div>

              {/* Allowed Redirection URL / Callback URL Display */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>Allowed Redirection (OAuth Callback) URL</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCallback}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCallback ? 'Copied' : 'Copy Callback URL'}</span>
                  </button>
                </div>
                <code className="block p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 select-all break-all">
                  {callbackUrl}
                </code>
                <p className="text-[10px] text-slate-400">
                  Register this exact URL in Shopify Partner Dashboard &rarr; Apps &rarr; Your App &rarr; App Setup &rarr; URLs.
                </p>
              </div>

              {/* Security Guarantee Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Server-Side Security:</strong> Client secret is encrypted and stored exclusively in server memory. It is never exposed in browser code, frontend environment variables, or localStorage.
                </span>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestConfiguration}
                  disabled={testingConfig || savingConfig || !cfgDomain.trim() || !cfgApiKey.trim()}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 ${testingConfig ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{testingConfig ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingConfig ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: SHOPIFY PARTNER SETUP & URLS GUIDE */}
      {activeTab === 'guide' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                <BookOpen className="w-4 h-4" />
                <span>Shopify Dev Dashboard Integration Walkthrough</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Shopify Partner App Configuration Guide</h2>
              <p className="text-xs text-slate-400 mt-1">
                Copy and paste these exact URLs into your Shopify Partner Dashboard to complete OAuth setup. No terminal or command line required.
              </p>
            </div>

            {/* URL Copy Cards */}
            <div className="space-y-4 text-xs">
              {/* Allowed Redirection URL Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
                    <span>Allowed Redirection (OAuth Callback) URL</span>
                  </span>
                  <button
                    onClick={handleCopyCallback}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedCallback ? 'Copied!' : 'Copy Callback URL'}</span>
                  </button>
                </div>
                <code className="block p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-xs select-all break-all">
                  {callbackUrl}
                </code>
                <p className="text-slate-400 text-[11px]">
                  <strong>Where to register:</strong> Shopify Partner Dashboard &rarr; Apps &rarr; [Your App] &rarr; <strong>App Setup</strong> &rarr; <strong>URLs</strong> &rarr; <strong>Allowed redirection URL(s)</strong>.
                </p>
              </div>

              {/* App URL Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">2</span>
                    <span>App URL</span>
                  </span>
                  <button
                    onClick={handleCopyAppUrl}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedAppUrl ? 'Copied!' : 'Copy App URL'}</span>
                  </button>
                </div>
                <code className="block p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-sky-300 text-xs select-all break-all">
                  {appOrigin}
                </code>
                <p className="text-slate-400 text-[11px]">
                  <strong>Where to register:</strong> Shopify Partner Dashboard &rarr; Apps &rarr; [Your App] &rarr; <strong>App Setup</strong> &rarr; <strong>URLs</strong> &rarr; <strong>App URL</strong>.
                </p>
              </div>

              {/* Webhooks Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-white flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">3</span>
                  <span>Mandatory Privacy Webhook Endpoints</span>
                </span>
                <p className="text-slate-400 text-[11px]">
                  Register these in <strong>App Setup &rarr; Compliance webhooks</strong>:
                </p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {[
                    { topic: 'Customer data request', url: `${appOrigin}/api/shopify/webhooks/customers/data_request` },
                    { topic: 'Customer data erasure', url: `${appOrigin}/api/shopify/webhooks/customers/redact` },
                    { topic: 'Shop data erasure', url: `${appOrigin}/api/shopify/webhooks/shop/redact` },
                  ].map((wh, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-slate-400 font-sans">{wh.topic}:</span>
                      <span className="text-emerald-400 select-all">{wh.url}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ready to Connect CTA */}
              <div className="pt-4 flex items-center justify-between">
                <span className="text-slate-400 text-xs">
                  Once registered in Shopify Partners, you can connect your store directly.
                </span>
                <button
                  onClick={() => handleConnectShopify()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Connect Shopify Store</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BUYER TRANSFER & SETUP GUIDE */}
      {activeTab === 'handover' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Single-Buyer Software Handover Documentation</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">Complete Buyer Setup & Deployment Guide</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                ProfitShield is transferred to you as a complete, standalone software product with 100% source code ownership. You are not operating a subscription service or paying developer fees. Follow the steps below to configure your own Shopify Partner App and deploy to your preferred hosting platform.
              </p>
            </div>

            {/* Software Ownership Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Vendor Lock-In & Full Autonomy</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Pricing Model</span>
                  <span className="font-bold text-white mt-0.5 block">One-Time Software Sale</span>
                  <p className="text-[10px] text-slate-500 mt-1">No monthly developer cuts or SaaS fees.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Feature Entitlements</span>
                  <span className="font-bold text-emerald-400 mt-0.5 block">All Pro Features Unlocked</span>
                  <p className="text-[10px] text-slate-500 mt-1">Unlimited findings, PDF export, custom margins.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Third-Party AI Costs</span>
                  <span className="font-bold text-white mt-0.5 block">$0.00 / Zero Cost</span>
                  <p className="text-[10px] text-slate-500 mt-1">Deterministic pure math engine; no LLM tokens.</p>
                </div>
              </div>
            </div>

            {/* External Dependencies Audit */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>External Dependencies & Services Audit</span>
              </span>
              <p className="text-xs text-slate-400">
                To run the software independently under your own ownership, you will need:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Service</th>
                      <th className="py-2 px-3">Purpose</th>
                      <th className="py-2 px-3">Where to Configure</th>
                      <th className="py-2 px-3">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-bold text-white">Shopify Partner Account</td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">Creates your Client ID & Secret for OAuth</td>
                      <td className="py-2.5 px-3 text-emerald-400">partners.shopify.com</td>
                      <td className="py-2.5 px-3 font-sans text-amber-400">Required for Live Store</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-bold text-white">Node.js Hosting Platform</td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">Runs full-stack Express + React server</td>
                      <td className="py-2.5 px-3 text-emerald-400">Render, Railway, Fly.io, Cloud Run, VPS</td>
                      <td className="py-2.5 px-3 font-sans text-emerald-400">Required</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-bold text-white">PostgreSQL Database</td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">Persistent storage for products, orders, & costs</td>
                      <td className="py-2.5 px-3 text-emerald-400">DATABASE_URL environment variable</td>
                      <td className="py-2.5 px-3 font-sans text-sky-400">Optional (in-memory fallback included)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Environment Variables Reference */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Environment Variables Configuration (.env)</span>
              </span>
              <p className="text-xs text-slate-400">
                All credentials and operational toggles are cleanly configured via environment variables. Sensitive secrets are never exposed to browser bundles.
              </p>
              <pre className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto select-all">
{`# Server & Environment
PORT=3000
NODE_ENV=production
APP_URL=https://your-profitshield-domain.com

# PostgreSQL Connection (Optional: uses in-memory store if unset)
DATABASE_URL=postgresql://user:password@host:5432/profitshield_db

# Security & Session Secrets (Replace with random strings)
SESSION_SECRET=super_secret_profitshield_session_key_at_least_32_chars
JWT_SECRET=super_secret_jwt_profitshield_token_key_change_in_prod

# Shopify Partner App Credentials (From partners.shopify.com)
SHOPIFY_API_KEY=your_client_id_from_partner_dashboard
SHOPIFY_API_SECRET=your_client_secret_from_partner_dashboard
SHOPIFY_API_VERSION=2024-10
SHOPIFY_SCOPES=read_products,read_orders,read_inventory,read_fulfillments,read_price_rules,read_discounts`}
              </pre>
            </div>

            {/* Quick Copy Registration URLs */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>URLs to Register in Your Shopify Partner Dashboard</span>
              </span>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 text-[11px] block">App URL (App Setup &rarr; URLs):</span>
                    <code className="text-sky-300 font-mono select-all text-xs">{appOrigin}</code>
                  </div>
                  <button
                    onClick={handleCopyAppUrl}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedAppUrl ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Allowed Redirection URL (OAuth Callback):</span>
                    <code className="text-emerald-400 font-mono select-all text-xs">{callbackUrl}</code>
                  </div>
                  <button
                    onClick={handleCopyCallback}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCallback ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ready to Configure CTA */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                You can configure credentials directly on the configuration page without modifying code.
              </span>
              <button
                onClick={() => setActiveTab('config')}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-500/20"
              >
                <Sliders className="w-4 h-4" />
                <span>Open Shopify Configuration Page</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Modal if opened from header */}
      <ShopifyConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigSaved={() => {
          loadShopifyStatus();
          loadConfigurationData();
          refreshAllData();
        }}
      />
    </div>
  );
};
