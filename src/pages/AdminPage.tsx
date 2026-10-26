import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatDate } from '../lib/formatters';
import { Badge } from '../components/common/Badge';
import {
  ShieldCheck,
  Server,
  Database,
  Users,
  Store,
  Activity,
  History,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getAdminOverview()
      .then((res) => setAdminData(res))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading operator administration panel...
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        Unable to load operator data.
      </div>
    );
  }

  const { system, metrics, stores, auditLogs } = adminData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Software Operator Administration</h1>
            <Badge variant="success">ROLE: OPERATOR</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal operations dashboard for monitoring tenant instances, migrations, and audit trails.
          </p>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Database Engine</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-white leading-tight">{system.databaseStatus}</p>
          <span className="text-[10px] text-slate-500 block">PostgreSQL standard adapter</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Shopify Integration</span>
            <Store className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-sm font-bold text-white leading-tight">{system.shopifyApiStatus}</p>
          <span className="text-[10px] text-slate-500 block">API Version {system.apiVersion}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Stores</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{metrics.totalStoresCount}</p>
          <span className="text-[10px] text-slate-500 block">
            {metrics.tierBreakdown.pro} Pro &bull; {metrics.tierBreakdown.business} Business
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Node Environment</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-white">{system.nodeVersion} ({system.environment})</p>
          <span className="text-[10px] text-slate-500 block">Port 3000 &bull; Express + Vite</span>
        </div>
      </div>

      {/* Connected Stores Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Registered Tenant Stores</h3>
          <span className="text-xs text-slate-500">Multi-tenant isolation verified</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Store Name</th>
                <th className="py-3 px-4">Shopify Domain</th>
                <th className="py-3 px-4">Active Plan</th>
                <th className="py-3 px-4">Products</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Open Leaks</th>
                <th className="py-3 px-4">Last Synced</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {stores.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">{s.shop_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">{s.shopify_domain}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                      {s.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{s.productsCount}</td>
                  <td className="py-3 px-4 text-slate-300">{s.ordersCount}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-rose-400">{s.openFindingsCount}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{formatDate(s.last_sync_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operator Audit Trail */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <History className="w-4 h-4 text-emerald-400" />
          <span>System Audit Log Trail</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {auditLogs.map((log: any) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-emerald-400 text-[11px]">{log.action}</span>
                  <span className="text-slate-500 font-mono text-[10px]">[{log.resource_type}]</span>
                </div>
                {log.details_json && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    {JSON.stringify(log.details_json)}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">
                {formatDate(log.created_at)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
