import React from 'react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { formatCurrency, formatPercent } from '../lib/formatters';
import {
  DollarSign,
  TrendingUp,
  Percent,
  AlertTriangle,
  Boxes,
  ShoppingCart,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Truck,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface DashboardPageProps {
  onInspectFinding?: (findingId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onInspectFinding }) => {
  const { dashboardData, findings, products, setCurrentView, switchShopifyMode } = useApp();

  if (!dashboardData) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading financial analytics...
      </div>
    );
  }

  const { metrics, categoryLeakBreakdown } = dashboardData;
  const openFindings = findings.filter(f => f.status === 'open');
  const topCriticalFindings = openFindings.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Health Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Executive Profit Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time margin analysis computed from synchronized product variant COGS and order line items.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('reports')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <span>Download PDF Report</span>
          </button>
          <button
            onClick={() => setCurrentView('leak-finder')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>View All Leaks ({openFindings.length})</span>
          </button>
        </div>
      </div>

      {/* Demo Store Mode Banner with clear Simulated Data label (Requirement 3 & 5) */}
      {dashboardData.activeMode === 'demo' && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-amber-200">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider text-[10px] border border-amber-500/40 flex-shrink-0">
              DEMO MODE &bull; SIMULATED SAMPLE DATA
            </span>
            <span className="text-slate-300">
              Displaying simulated sample records for <strong>"{dashboardData.store?.shop_name || 'The Artisan Roastery Co.'}"</strong>. None of this data is from a live store.
            </span>
          </div>
          <button
            onClick={() => {
              switchShopifyMode('live');
              setCurrentView('settings');
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-xs whitespace-nowrap flex items-center space-x-1"
          >
            <span>Switch to Live Store &rarr;</span>
          </button>
        </div>
      )}

      {/* Live Store Not Connected Banner */}
      {dashboardData.activeMode === 'live' && !(dashboardData.store?.is_connected || dashboardData.store?.has_token || dashboardData.store?.access_token) && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-slate-300">
            <Boxes className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Live Mode:</strong> No authenticated Shopify store connected yet. Connect your development or production store in Settings to analyze real store margins.
            </span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => setCurrentView('settings')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              Connect Shopify &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Missing Cost Alert Bar if applicable */}
      {metrics.missingCostCount > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-amber-200 text-xs">
            <HelpCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
            <div>
              <strong className="text-amber-300 font-semibold">{metrics.missingCostCount} product(s) missing cost data (COGS).</strong>
              <span className="block sm:inline sm:ml-1 text-slate-300">
                Gross profit cannot be accurately calculated without wholesale costs.
              </span>
            </div>
          </div>
          <button
            onClick={() => setCurrentView('products')}
            className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex-shrink-0 flex items-center space-x-1"
          >
            <span>Enter Missing Costs</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Net Sales"
          value={formatCurrency(metrics.netSales)}
          subtext={`Gross $${metrics.grossSales.toFixed(2)} - Discounts $${metrics.discounts.toFixed(2)}`}
          icon={DollarSign}
          tone="neutral"
        />
        <StatCard
          label="Est. Gross Profit"
          value={formatCurrency(metrics.estimatedGrossProfit)}
          subtext={`Calculated after deducting recorded COGS`}
          icon={TrendingUp}
          tone="positive"
        />
        <StatCard
          label="Est. Gross Margin"
          value={formatPercent(metrics.estimatedMarginPct)}
          subtext={`Target threshold: 55.0%`}
          icon={Percent}
          tone={metrics.estimatedMarginPct >= 50 ? 'positive' : 'warning'}
        />
        <StatCard
          label="Identified Margin Leaks"
          value={`-${formatCurrency(metrics.totalPotentialLeakImpact)}`}
          subtext={`${openFindings.length} open finding(s) detected`}
          icon={AlertTriangle}
          tone="negative"
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
        <div>
          <span className="text-slate-500 block">Orders Audited</span>
          <span className="text-sm font-bold text-white">{metrics.ordersCount} orders</span>
        </div>
        <div>
          <span className="text-slate-500 block">Products Analyzed</span>
          <span className="text-sm font-bold text-white">{metrics.productsCount} SKUs</span>
        </div>
        <div>
          <span className="text-slate-500 block">Unrecovered Freight Deficit</span>
          <span className="text-sm font-bold text-rose-400">{formatCurrency(metrics.shippingDeficit)}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Total Issued Refunds</span>
          <span className="text-sm font-bold text-slate-200">{formatCurrency(metrics.totalRefunds)}</span>
        </div>
      </div>

      {/* Chart & Category Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trends Chart (SVG) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white">Sales & Estimated Profit Trend</h3>
              <p className="text-xs text-slate-400">Recent store performance by order sequence</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>Net Sales</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Est. Gross Profit</span>
              </span>
            </div>
          </div>

          {/* SVG Trendline Chart */}
          <div className="h-56 w-full pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="#334155" strokeDasharray="3 3" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#334155" strokeDasharray="3 3" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#334155" strokeDasharray="3 3" />

              {/* Area under profit curve */}
              <polygon
                points="40,140 120,90 200,160 280,110 360,130 450,80 450,180 40,180"
                fill="url(#profitGrad)"
              />

              {/* Net Sales Line (Blue) */}
              <polyline
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                points="40,100 120,50 200,120 280,65 360,85 450,40"
              />

              {/* Profit Line (Green) */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                points="40,140 120,90 200,160 280,110 360,130 450,80"
              />

              {/* Data points */}
              {[[40, 100], [120, 50], [200, 120], [280, 65], [360, 85], [450, 40]].map(([cx, cy], i) => (
                <circle key={`sales-${i}`} cx={cx} cy={cy} r="3.5" fill="#38BDF8" />
              ))}
              {[[40, 140], [120, 90], [200, 160], [280, 110], [360, 130], [450, 80]].map(([cx, cy], i) => (
                <circle key={`profit-${i}`} cx={cx} cy={cy} r="3.5" fill="#10B981" />
              ))}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-500 pt-1 px-4 font-mono">
              <span>Order #1043</span>
              <span>Order #1044</span>
              <span>Order #1045</span>
              <span>Order #1046</span>
              <span>Order #1047</span>
              <span>Order #1048 (Latest)</span>
            </div>
          </div>
        </div>

        {/* Leak Impact Breakdown by Category */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Leak Breakdown by Category</h3>
            <p className="text-xs text-slate-400">Total estimated dollar erosion identified</p>
          </div>

          <div className="space-y-3 pt-1">
            {[
              { label: 'Low Product Margins', val: categoryLeakBreakdown.margin, icon: Percent, color: 'bg-rose-500' },
              { label: 'Discount Erosion', val: categoryLeakBreakdown.discount, icon: Sparkles, color: 'bg-amber-500' },
              { label: 'Carrier Shipping Deficit', val: categoryLeakBreakdown.shipping, icon: Truck, color: 'bg-sky-500' },
              { label: 'Unrecovered Refund Losses', val: categoryLeakBreakdown.refund, icon: RotateCcw, color: 'bg-purple-500' }
            ].map((cat, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">{cat.label}</span>
                  <span className="font-bold text-rose-400">-{formatCurrency(cat.val)}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${cat.color} h-full rounded-full`}
                    style={{
                      width: `${metrics.totalPotentialLeakImpact > 0 ? Math.min(100, Math.max(8, (cat.val / metrics.totalPotentialLeakImpact) * 100)) : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setCurrentView('leak-finder')}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700/60 transition-colors"
          >
            Open Profit Leak Finder &rarr;
          </button>
        </div>
      </div>

      {/* Top Open Findings Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white">Priority Profit Findings</h3>
            <p className="text-xs text-slate-400">High-impact issues requiring merchant attention</p>
          </div>
          <button
            onClick={() => setCurrentView('leak-finder')}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            View All ({openFindings.length})
          </button>
        </div>

        <div className="space-y-3">
          {topCriticalFindings.map((finding) => (
            <div
              key={finding.id}
              className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center space-x-2">
                  <Badge variant={finding.severity}>{finding.severity.toUpperCase()}</Badge>
                  <Badge variant="neutral">{finding.category.toUpperCase()}</Badge>
                  {finding.product_title && (
                    <span className="text-xs text-slate-400 truncate max-w-xs">{finding.product_title}</span>
                  )}
                  {finding.order_number && (
                    <span className="text-xs text-slate-400">Order #{finding.order_number}</span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-white">{finding.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-1">{finding.calculation_explanation}</p>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-4 flex-shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Est. Impact</span>
                  <span className="text-sm font-black text-rose-400">
                    {finding.estimated_financial_impact !== null
                      ? `-${formatCurrency(finding.estimated_financial_impact)}`
                      : 'Missing Cost'}
                  </span>
                </div>
                <button
                  onClick={() => onInspectFinding ? onInspectFinding(finding.id) : setCurrentView('leak-finder')}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition-colors"
                >
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
