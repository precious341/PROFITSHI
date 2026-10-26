import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ApiProduct } from '../lib/api';
import { formatCurrency, formatPercent } from '../lib/formatters';
import { EditCostModal } from '../components/products/EditCostModal';
import { Badge } from '../components/common/Badge';
import {
  Boxes,
  Edit3,
  Search,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowUpDown,
  Filter
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { products, updateProductCost, settings, activeMode, store, setCurrentView } = useApp();
  const [filterMode, setFilterMode] = useState<'all' | 'missing' | 'low_margin'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);

  const targetMargin = settings?.target_gross_margin_pct ?? 55;
  const lowMarginThreshold = settings?.low_margin_threshold_pct ?? 35;

  const filtered = products.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      if (!matchTitle && !matchSku) return false;
    }

    if (filterMode === 'missing') {
      return p.effective_cost === null || isNaN(Number(p.effective_cost));
    }
    if (filterMode === 'low_margin') {
      return p.margin_pct !== null && p.margin_pct < targetMargin;
    }
    return true;
  });

  const missingCount = products.filter(p => p.effective_cost === null).length;
  const lowMarginCount = products.filter(p => p.margin_pct !== null && p.margin_pct < targetMargin).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Product Profitability & Cost Manager</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain accurate Cost of Goods Sold (COGS). Merchant cost overrides are preserved permanently.
          </p>
        </div>
      </div>

      {/* Demo / Live Status Banner */}
      {activeMode === 'demo' && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px] border border-amber-500/40">
              Demo Mode
            </span>
            <span>Displaying <strong>{products.length} simulated sample products</strong> for "The Artisan Roastery Co."</span>
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
            <Boxes className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Live Mode:</strong> No authenticated Shopify store connected yet. Connect your store in Settings to synchronize your real product catalog.
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

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilterMode('missing')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              filterMode === 'missing'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Missing Costs</span>
            {missingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {missingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterMode('low_margin')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center space-x-1.5 ${
              filterMode === 'low_margin'
                ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Below Target ({targetMargin}%)</span>
            {lowMarginCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                {lowMarginCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Product & SKU</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Cost (COGS)</th>
                <th className="py-3 px-4">Est. Gross Margin</th>
                <th className="py-3 px-4">Inventory</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No products matched your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const hasMissingCost = product.effective_cost === null || isNaN(Number(product.effective_cost));
                  const margin = product.margin_pct;
                  const isCriticallyLow = margin !== null && margin < lowMarginThreshold;
                  const isBelowTarget = margin !== null && margin < targetMargin;

                  return (
                    <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white max-w-sm leading-snug">{product.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {product.sku || 'No SKU configured'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {product.product_type || 'General'}
                      </td>

                      <td className="py-3 px-4 font-bold text-white">
                        {formatCurrency(product.price)}
                      </td>

                      <td className="py-3 px-4">
                        {hasMissingCost ? (
                          <span className="inline-flex items-center space-x-1 text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                            <HelpCircle className="w-3 h-3" />
                            <span>Missing Cost</span>
                          </span>
                        ) : (
                          <div>
                            <span className="font-bold text-emerald-400">
                              {formatCurrency(product.effective_cost)}
                            </span>
                            {product.override_cost !== null && (
                              <span className="text-[10px] text-slate-500 block">Manual Override</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {hasMissingCost ? (
                          <span className="text-slate-500 italic">Undetermined</span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-black ${
                                isCriticallyLow
                                  ? 'text-rose-400'
                                  : isBelowTarget
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {formatPercent(margin)}
                            </span>
                            {isCriticallyLow && (
                              <Badge variant="critical">Critical</Badge>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {product.inventory_quantity} in stock
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold inline-flex items-center space-x-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3 text-slate-400" />
                          <span>{hasMissingCost ? 'Set Cost' : 'Edit Cost'}</span>
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

      {/* Edit Cost Modal */}
      {selectedProduct && (
        <EditCostModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSave={async (newCost, notes) => {
            await updateProductCost(selectedProduct.id, newCost, notes);
          }}
        />
      )}
    </div>
  );
};
