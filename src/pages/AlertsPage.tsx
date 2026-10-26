import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ApiMarginSettings } from '../lib/api';
import { Badge } from '../components/common/Badge';
import { formatDate } from '../lib/formatters';
import {
  BellRing,
  Sliders,
  Check,
  AlertTriangle,
  Info,
  Save,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { alerts, settings, updateMarginSettings, dismissAlert, setCurrentView, activeMode } = useApp();

  const [targetMargin, setTargetMargin] = useState<string>(
    settings ? String(settings.target_gross_margin_pct) : '55.0'
  );
  const [lowMarginThreshold, setLowMarginThreshold] = useState<string>(
    settings ? String(settings.low_margin_threshold_pct) : '35.0'
  );
  const [highLossThreshold, setHighLossThreshold] = useState<string>(
    settings ? String(settings.high_loss_threshold_amt) : '80.0'
  );
  const [defaultShippingCost, setDefaultShippingCost] = useState<string>(
    settings ? String(settings.default_shipping_cost_est) : '8.50'
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateMarginSettings({
        target_gross_margin_pct: parseFloat(targetMargin),
        low_margin_threshold_pct: parseFloat(lowMarginThreshold),
        high_loss_threshold_amt: parseFloat(highLossThreshold),
        default_shipping_cost_est: parseFloat(defaultShippingCost),
        alert_email_enabled: false
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice Banner */}
      {activeMode === 'demo' && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px] border border-amber-500/40">
              Demo Mode
            </span>
            <span>Displaying <strong>simulated alerts and threshold rules</strong> for "The Artisan Roastery Co."</span>
          </div>
          <button
            onClick={() => setCurrentView('settings')}
            className="hover:underline font-semibold text-amber-300"
          >
            Connect Real Store &rarr;
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Margin Alerts & Threshold Rules</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure gross margin targets and sensitivity rules for real-time loss diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Store Threshold Settings</span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Target Gross Margin (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="99"
                value={targetMargin}
                onChange={(e) => setTargetMargin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Default baseline benchmark for catalog profitability.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Critical Low-Margin Alert (%)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="90"
                value={lowMarginThreshold}
                onChange={(e) => setLowMarginThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Triggers critical severity warnings on products and orders.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                High-Value Loss Alert ($ USD)
              </label>
              <input
                type="number"
                step="5"
                min="10"
                value={highLossThreshold}
                onChange={(e) => setHighLossThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Flags orders experiencing large individual dollar losses.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Default Carrier Freight Benchmark ($)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={defaultShippingCost}
                onChange={(e) => setDefaultShippingCost(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used when carrier rate is unavailable from Shopify fulfillment.</p>
            </div>

            {saveSuccess && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Threshold settings saved successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Rules & Recompute'}</span>
            </button>
          </form>
        </div>

        {/* Active Alerts Feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <BellRing className="w-4 h-4 text-rose-400" />
              <span>Active Notifications ({alerts.length})</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-75" />
                <p className="text-xs">No active alerts triggered under current thresholds.</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3">
                    {alert.severity === 'critical' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={alert.severity}>{alert.severity.toUpperCase()}</Badge>
                        <span className="text-[11px] text-slate-500">{formatDate(alert.created_at)}</span>
                      </div>
                      <h4 className="font-bold text-white leading-snug">{alert.title}</h4>
                      <p className="text-slate-400 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0 sm:self-center">
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => setCurrentView('leak-finder')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
