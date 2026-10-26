import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatCurrency, formatPercent, formatDate } from '../lib/formatters';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import {
  Percent,
  Truck,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

export const AnalyticsPage: React.FC<{ initialTab?: 'discounts' | 'shipping' | 'refunds' }> = ({
  initialTab = 'discounts'
}) => {
  const { setCurrentView, activeMode } = useApp();
  const [activeTab, setActiveTab] = useState<'discounts' | 'shipping' | 'refunds'>(initialTab);
  const [discountData, setDiscountData] = useState<any>(null);
  const [shippingData, setShippingData] = useState<any>(null);
  const [refundData, setRefundData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDiscountAnalytics(),
      api.getShippingAnalytics(),
      api.getRefundAnalytics()
    ])
      .then(([disc, ship, ref]) => {
        setDiscountData(disc);
        setShippingData(ship);
        setRefundData(ref);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Calculating deep dive metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Notice Banner */}
      {activeMode === 'demo' && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px] border border-amber-500/40">
              Demo Mode
            </span>
            <span>Displaying <strong>simulated sample financial metrics</strong> for "The Artisan Roastery Co."</span>
          </div>
          <button
            onClick={() => setCurrentView('settings')}
            className="hover:underline font-semibold text-amber-300"
          >
            Connect Real Store &rarr;
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Financial Deep Dives</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit secondary margin leaks from promotions, logistics deficits, and customer returns.
          </p>
        </div>

        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('discounts')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'discounts' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Discounts</span>
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'shipping' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Shipping</span>
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1.5 transition-colors ${
              activeTab === 'refunds' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refunds</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Discount Impact */}
      {activeTab === 'discounts' && discountData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total Discounted Orders"
              value={discountData.totalDiscountedOrders}
              subtext="Orders with active discount codes"
              icon={Percent}
              tone="neutral"
            />
            <StatCard
              label="Profit Margin Forgone"
              value={`-${formatCurrency(discountData.totalDiscountAmount)}`}
              subtext="Total dollar reduction from discounts"
              icon={TrendingDown}
              tone="negative"
            />
            <StatCard
              label="Avg. Discount Rate"
              value={formatPercent(discountData.avgDiscountPct)}
              subtext="Average markdown percentage"
              icon={Sparkles}
              tone="warning"
            />
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Orders Affected by Discount Erosion</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Gross Sales</th>
                    <th className="py-3 px-4">Discount Amount</th>
                    <th className="py-3 px-4">Discount Rate %</th>
                    <th className="py-3 px-4">Net Sales</th>
                    <th className="py-3 px-4">Realized Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {discountData.discountedOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-white">#{ord.order_number}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(ord.processed_at)}</td>
                      <td className="py-3 px-4">{formatCurrency(ord.gross_sales)}</td>
                      <td className="py-3 px-4 font-bold text-rose-400">-{formatCurrency(ord.discounts_total)}</td>
                      <td className="py-3 px-4 font-semibold text-amber-400">{formatPercent(ord.discount_rate_pct)}</td>
                      <td className="py-3 px-4 font-semibold text-white">{formatCurrency(ord.net_sales)}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${ord.estimated_margin_pct < 25 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {formatPercent(ord.estimated_margin_pct)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Shipping Deficit */}
      {activeTab === 'shipping' && shippingData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Shipping Charged to Customers"
              value={formatCurrency(shippingData.totalShippingCharged)}
              subtext="Total freight revenue collected"
              icon={Truck}
              tone="neutral"
            />
            <StatCard
              label="Actual Carrier Fulfillment Costs"
              value={formatCurrency(shippingData.totalShippingExpense)}
              subtext="Calculated carrier freight expenses"
              icon={TrendingDown}
              tone="warning"
            />
            <StatCard
              label="Unrecovered Shipping Deficit"
              value={`-${formatCurrency(shippingData.totalDeficitAmount)}`}
              subtext={`${shippingData.subsidizedOrdersCount} order(s) subsidized`}
              icon={AlertTriangle}
              tone="negative"
            />
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Orders with Unrecovered Freight Deficits</h3>
                <p className="text-xs text-slate-400">Orders where carrier fees exceeded customer shipping payment</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer Charged</th>
                    <th className="py-3 px-4">Actual Carrier Cost</th>
                    <th className="py-3 px-4">Merchant Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {shippingData.subsidizedOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-white">#{ord.order_number}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(ord.processed_at)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{formatCurrency(ord.shipping_charged)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{formatCurrency(ord.shipping_expense)}</td>
                      <td className="py-3 px-4 font-black text-rose-400">-{formatCurrency(ord.freight_deficit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Refund Analysis */}
      {activeTab === 'refunds' && refundData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              label="Total Issued Refunds"
              value={`-${formatCurrency(refundData.totalRefundedAmount)}`}
              subtext="Direct customer cash returns"
              icon={RotateCcw}
              tone="negative"
            />
            <StatCard
              label="Refunded Orders Count"
              value={refundData.totalRefundedOrders}
              subtext="Audited orders with return claims"
              icon={AlertTriangle}
              tone="warning"
            />
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Refunded Order Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Original Gross</th>
                    <th className="py-3 px-4">Refund Amount</th>
                    <th className="py-3 px-4">Net Realized Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {refundData.refundedOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-white">#{ord.order_number}</td>
                      <td className="py-3 px-4 text-slate-400">{formatDate(ord.processed_at)}</td>
                      <td className="py-3 px-4">{formatCurrency(ord.gross_sales)}</td>
                      <td className="py-3 px-4 font-bold text-rose-400">-{formatCurrency(ord.total_refunded)}</td>
                      <td className="py-3 px-4 font-black text-rose-400">{formatCurrency(ord.estimated_gross_profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
