import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
  X,
  Sliders,
  Key,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Save,
  Activity,
  Eye,
  EyeOff,
  ShieldCheck,
  Info
} from 'lucide-react';

interface ShopifyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

const SUPPORTED_API_VERSIONS = [
  '2024-10',
  '2025-01',
  '2025-04',
  '2026-01',
  '2026-10'
];

export const ShopifyConfigModal: React.FC<ShopifyConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [shopDomain, setShopDomain] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [maskedSecret, setMaskedSecret] = useState('');
  const [hasSavedSecret, setHasSavedSecret] = useState(false);
  const [apiVersion, setApiVersion] = useState('2024-10');
  const [scopes, setScopes] = useState('read_products,read_orders,read_inventory,read_fulfillments,read_price_rules,read_discounts');

  const [showSecretField, setShowSecretField] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      setStatusMessage(null);
      setTestResult(null);
      const res = await api.getShopifyConfig();
      if (res.config) {
        setShopDomain(res.config.shopDomain || '');
        setApiKey(res.config.apiKey || '');
        setMaskedSecret(res.config.maskedApiSecret || '');
        setHasSavedSecret(Boolean(res.config.hasSecret));
        // Clean version identifier, default to 2024-10
        const ver = res.config.apiVersion || '2024-10';
        setApiVersion(ver.includes('http') ? '2024-10' : ver);
        setScopes(res.config.scopes || 'read_products,read_orders,read_inventory,read_fulfillments,read_price_rules,read_discounts');
      }
    } catch (err: any) {
      console.error('Failed to load Shopify config:', err);
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopDomain.trim()) {
      setStatusMessage({ type: 'error', text: 'Shopify Store Domain is required.' });
      return;
    }
    if (!apiKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Shopify Client ID is required.' });
      return;
    }

    try {
      setSaving(true);
      setStatusMessage(null);

      const payload: any = {
        shopDomain: shopDomain.trim(),
        apiKey: apiKey.trim(),
        apiVersion: apiVersion.trim(),
        scopes: scopes.trim()
      };

      // Only send secret if entered
      if (apiSecret.trim()) {
        payload.apiSecret = apiSecret.trim();
      }

      const res = await api.saveShopifyConfig(payload);
      setApiSecret('');
      setMaskedSecret(res.config.maskedApiSecret || '');
      setHasSavedSecret(Boolean(res.config.hasSecret));
      setStatusMessage({ type: 'success', text: 'Shopify configuration saved securely on the server.' });
      onConfigSaved();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setStatusMessage(null);
      setTestResult(null);

      const res = await api.testShopifyConfig({
        shopDomain: shopDomain.trim(),
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim() || undefined
      });

      setTestResult(res);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Shopify App Configuration</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure your official Shopify Partner credentials to enable live store connection.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Status Message Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
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
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500"
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
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
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
                  Shopify Client Secret {!hasSavedSecret && <span className="text-rose-400">*</span>}
                </label>
                {hasSavedSecret && (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Secret Saved: {maskedSecret}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showSecretField ? 'text' : 'password'}
                  placeholder={hasSavedSecret ? 'Enter new secret to update, or leave blank to keep existing' : 'e.g. shpss_xxxxxxxxxxxxxxxxxxxxxxxx'}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
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

            {/* Shopify API Version */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Shopify Admin API Version <span className="text-rose-400">*</span>
              </label>
              <select
                value={apiVersion}
                onChange={(e) => setApiVersion(e.target.value)}
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
                value={scopes}
                onChange={(e) => setScopes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Comma-separated access scopes requested during OAuth authorization.
              </p>
            </div>

            {/* Allowed Redirection URL / Callback URL */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center space-x-1.5">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Allowed Redirection (OAuth Callback) URL</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const callback = `${window.location.origin}/api/shopify/callback`;
                    navigator.clipboard.writeText(callback);
                    setStatusMessage({ type: 'info', text: 'Callback URL copied to clipboard! Paste it into Shopify Partner Dashboard -> App Setup -> Allowed redirection URL(s).' });
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-semibold border border-slate-700 transition-colors"
                >
                  Copy Callback URL
                </button>
              </div>
              <code className="block p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400 select-all break-all">
                {window.location.origin}/api/shopify/callback
              </code>
              <p className="text-[10px] text-slate-400">
                Register this exact URL in Shopify Partner Dashboard &rarr; Apps &rarr; Your App &rarr; App Setup &rarr; URLs.
              </p>
            </div>

            {/* Security Guarantee Box */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Credential Security:</strong> Client secrets are encrypted and kept exclusively in server memory and backend storage. They are never transmitted to client JavaScript, localStorage, or cookies.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving || !shopDomain.trim() || !apiKey.trim()}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Activity className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
