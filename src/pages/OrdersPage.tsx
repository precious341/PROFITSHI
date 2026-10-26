import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ApiOrder } from '../lib/api';
import { formatCurrency, formatPercent, formatDate } from '../lib/formatters';
import { Badge } from '../components/common/Badge';
import {
  ShoppingCart,
  Search,
  ChevronRight,
  X,
  Truck,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const { orders, activeMode, store, setCurrentView } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    return o.order_number.includes(searchQuery.trim());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Order Profitability Analysis</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit realized gross profit per customer transaction after applying line-item discounts, freight, and refunds.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Demo / Live Status Banner */}
      {activeMode === 'demo' && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px] border border-amber-500/40">
              Demo Mode
            </span>
            <span>Displaying <strong>{orders.length} simulated sample customer orders</strong> for "The Artisan Roastery Co."</span>
          </div>
          <button
            onClick={() => setCurrentView('settings')}
            className="hover:underline font-semibold text-amber-300"
          >
            Connect Real Store &rarr;
          </button>
        </div>
      )}

      {activeMode === 'live' && !(store?.is_connected || store?.has_token || store?.access_token) && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-slate-300">
            <ShoppingCart className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Live Mode:</strong> No authenticated Shopify store connected yet. Connect your store in Settings to synchronize your live orders.
            </span>
          </div>
          <button
            onClick={() => setCurrentView('settings')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            Connect Shopify &rarr;
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Gross Sales</th>
                <th className="py-3 px-4">Discounts</th>
                <th className="py-3 px-4">Shipping (Rev / Cost)</th>
                <th className="py-3 px-4">Refunds</th>
                <th className="py-3 px-4">Est. Gross Profit</th>
                <th className="py-3 px-4">Margin %</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No orders found matching search.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isDiscounted = Number(order.discounts_total) > 0;
                  const isShippingDeficit = Number(order.shipping_expense) > Number(order.shipping_charged);
                  const isRefunded = Number(order.total_refunded) > 0;
                  const isLoss = Number(order.estimated_gross_profit) < 0;

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        #{order.order_number}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {formatDate(order.processed_at)}
                      </td>

                      <td className="py-3 px-4 font-semibold text-white">
                        {formatCurrency(order.gross_sales)}
                      </td>

                      <td className="py-3 px-4">
                        {isDiscounted ? (
                          <span className="font-semibold text-rose-400">
                            -{formatCurrency(order.discounts_total)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-300">{formatCurrency(order.shipping_charged)}</span>
                          <span className="text-slate-500">/</span>
                          <span className={isShippingDeficit ? 'text-rose-400 font-semibold' : 'text-slate-400'}>
                            {formatCurrency(order.shipping_expense)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isRefunded ? (
                          <span className="font-bold text-rose-400">
                            -{formatCurrency(order.total_refunded)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-black ${
                            isLoss ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatCurrency(order.estimated_gross_profit)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-bold ${
                              order.estimated_margin_pct < 25 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {formatPercent(order.estimated_margin_pct)}
                          </span>
                          {isLoss && <Badge variant="critical">Deficit</Badge>}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          aria-label={`View details for Order #${order.order_number}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">Order #{selectedOrder.order_number}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(selectedOrder.processed_at)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Order Financial Breakdown */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block">Gross Sales</span>
                  <span className="font-bold text-white text-sm">{formatCurrency(selectedOrder.gross_sales)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Discounts Applied</span>
                  <span className="font-bold text-rose-400 text-sm">-{formatCurrency(selectedOrder.discounts_total)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Shipping Charged / Expense</span>
                  <span className="font-bold text-slate-300 text-sm">
                    {formatCurrency(selectedOrder.shipping_charged)} / {formatCurrency(selectedOrder.shipping_expense)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Net Realized Profit</span>
                  <span
                    className={`font-black text-sm ${
                      Number(selectedOrder.estimated_gross_profit) < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(selectedOrder.estimated_gross_profit)} ({formatPercent(selectedOrder.estimated_margin_pct)})
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Purchased Line Items
                </span>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-white">{item.title}</div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Qty: {item.quantity} &bull; Retail: {formatCurrency(item.unit_price)}
                            {item.unit_cost !== null && ` &bull; Cost: ${formatCurrency(item.unit_cost)}`}
                          </div>
                        </div>
                        {item.is_refunded && (
                          <Badge variant="critical">Refunded</Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic">No line items recorded.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-right">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
