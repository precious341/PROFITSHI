import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  RefreshCw,
  Bell,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Store,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { formatDate } from '../../lib/formatters';

export const Header: React.FC = () => {
  const { store, alerts, refreshing, triggerSync, dismissAlert, setCurrentView, activeMode, switchShopifyMode } = useApp();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const isLive = activeMode === 'live';
  const isConnected = Boolean(store && !store.is_demo && (store.is_connected || store.has_token || store.access_token));

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      {/* Operating Mode Banner */}
      <div
        className={`px-4 py-1.5 text-xs flex items-center justify-between border-b ${
          isLive
            ? isConnected
              ? 'bg-emerald-950/70 border-emerald-500/20 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/30 text-rose-200'
            : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-amber-500/20 text-amber-200'
        }`}
      >
        <div className="flex items-center space-x-2">
          {isLive ? (
            isConnected ? (
              <>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                  Live Store Connected
                </span>
                <span>
                  Connected to <strong>{store?.shop_name}</strong> ({store?.shopify_domain}) via Shopify Admin API.
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider">
                  Live Mode: Not Connected
                </span>
                <span>
                  No Shopify store authenticated yet. Configure your credentials and authorize connection.
                </span>
              </>
            )
          ) : (
            <>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                Demo Store Active
              </span>
              <span>
                Displaying sample records for <strong>{store?.shop_name || 'The Artisan Roastery Co.'}</strong>.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {isLive ? (
            !isConnected ? (
              <button
                onClick={() => setCurrentView('settings')}
                className="hover:underline flex items-center space-x-1 text-rose-300 font-semibold"
              >
                <span>Connect Shopify Store &rarr;</span>
              </button>
            ) : (
              <button
                onClick={() => switchShopifyMode('demo')}
                className="hover:underline text-[11px] text-slate-300"
              >
                Switch to Demo Mode
              </button>
            )
          ) : (
            <button
              onClick={() => {
                switchShopifyMode('live');
                setCurrentView('settings');
              }}
              className="hover:underline flex items-center space-x-1 text-amber-300 font-medium"
            >
              <span>Switch to Live Store Mode</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main App Header */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">ProfitShield</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  FULL EDITION
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                <Store className="w-3 h-3 text-slate-500" />
                <span className="truncate max-w-[200px]">{store?.shop_name || 'The Artisan Roastery Co.'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Last Sync & Manual Sync Trigger */}
          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <span>Synced: {formatDate(store?.last_sync_at)}</span>
            <button
              onClick={() => {
                if (isLive && !isConnected) {
                  setCurrentView('settings');
                } else {
                  triggerSync().catch((e: any) => console.warn('Sync failed:', e.message));
                }
              }}
              disabled={refreshing || (isLive && !isConnected)}
              title={
                isLive
                  ? isConnected
                    ? 'Synchronize live store data via Shopify Admin API'
                    : 'Connect Shopify store in Settings to synchronize'
                  : 'Refresh demo store sample data'
              }
              className={`transition-colors p-1 ${
                isLive && !isConnected
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-300 hover:text-emerald-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

          {/* Alerts Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/70 transition-colors"
              aria-label="Margin Alerts"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {alerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Modal */}
            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-slate-200">
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-xs tracking-wider uppercase text-slate-400">
                    Active Margin Alerts ({alerts.length})
                  </span>
                  <button
                    onClick={() => {
                      setShowAlertsDropdown(false);
                      setCurrentView('alerts');
                    }}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/80">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
                      No critical margin alerts at this time.
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="p-3.5 hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-start space-x-2.5">
                          {alert.severity === 'critical' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-white leading-snug">{alert.title}</p>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alert.message}</p>
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                onClick={() => {
                                  dismissAlert(alert.id);
                                }}
                                className="text-[10px] text-slate-400 hover:text-slate-200"
                              >
                                Mark Reviewed
                              </button>
                              <button
                                onClick={() => {
                                  setShowAlertsDropdown(false);
                                  setCurrentView('leak-finder');
                                }}
                                className="text-[10px] text-emerald-400 hover:underline font-medium"
                              >
                                Inspect Leak &rarr;
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Documentation Link */}
          <button
            onClick={() => setCurrentView('docs')}
            className="hidden sm:inline-flex text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            Docs & Formulas
          </button>
        </div>
      </div>
    </header>
  );
};
