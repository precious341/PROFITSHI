import React from 'react';
import { useApp, ViewType } from '../../context/AppContext';
import {
  LayoutDashboard,
  SearchCheck,
  Boxes,
  ShoppingCart,
  Percent,
  Truck,
  RotateCcw,
  BellRing,
  FileText,
  Settings,
  ShieldCheck,
  BookOpen,
  Globe
} from 'lucide-react';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
  section?: string;
}

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, findings, alerts } = useApp();

  const openFindingsCount = findings.filter(f => f.status === 'open').length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    {
      id: 'leak-finder',
      label: 'Profit Leak Finder',
      icon: SearchCheck,
      badge: openFindingsCount > 0 ? openFindingsCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
    },
    { id: 'products', label: 'Products & Costs', icon: Boxes },
    { id: 'orders', label: 'Order Profitability', icon: ShoppingCart },

    // Financial Deep Dives
    { id: 'discounts', label: 'Discount Impact', icon: Percent, section: 'Deep Dives' },
    { id: 'shipping', label: 'Shipping Deficits', icon: Truck },
    { id: 'refunds', label: 'Refund & Returns', icon: RotateCcw },

    // Management & Export
    {
      id: 'alerts',
      label: 'Margin Alerts',
      icon: BellRing,
      badge: alerts.length > 0 ? alerts.length : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      section: 'Operations'
    },
    { id: 'reports', label: 'Executive Reports', icon: FileText },
    { id: 'settings', label: 'Shopify Settings', icon: Settings },

    // Software Sale & Operator
    { id: 'admin', label: 'Operator Admin', icon: ShieldCheck, section: 'Operator & Docs' },
    { id: 'docs', label: 'Technical Docs', icon: BookOpen },
    { id: 'landing', label: 'Public Marketing Page', icon: Globe }
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between select-none">
      <div className="py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;

            return (
              <React.Fragment key={item.id}>
                {item.section && (
                  <div className="pt-4 pb-1.5 px-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      {item.section}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Sale Readiness Indicator Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Transfer-Ready Architecture</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Shopify API 2024-10 &bull; PostgreSQL &bull; Fully Documented Engine
          </p>
        </div>
      </div>
    </aside>
  );
};
