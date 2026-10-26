import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ApiFinding } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/formatters';
import { Badge } from '../components/common/Badge';
import { FindingDetailModal } from '../components/findings/FindingDetailModal';
import { EditCostModal } from '../components/products/EditCostModal';
import {
  Search,
  Filter,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  DollarSign,
  ArrowUpDown,
  Sparkles,
  Info
} from 'lucide-react';

export const LeakFinderPage: React.FC = () => {
  const { findings, products, updateFindingStatus, updateProductCost, setCurrentView, activeMode, store } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFinding, setActiveFinding] = useState<ApiFinding | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Filter findings
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
      if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
      if (selectedStatus !== 'all' && f.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = f.title.toLowerCase().includes(q);
        const matchesProduct = f.product_title?.toLowerCase().includes(q);
        const matchesOrder = f.order_number?.includes(q);
        if (!matchesTitle && !matchesProduct && !matchesOrder) return false;
      }
      return true;
    });
  }, [findings, selectedCategory, selectedSeverity, selectedStatus, searchQuery]);

  const totalFilteredImpact = filteredFindings.reduce(
    (acc, f) => acc + (f.estimated_financial_impact || 0),
    0
  );

  const productBeingEdited = editingProductId
    ? products.find((p) => p.id === editingProductId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Profit Leak Finder</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic diagnostic engine exposing margin erosion across products, discounts, shipping, and refunds.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Total Filtered Exposure:</span>
          <span className="font-extrabold text-rose-400 text-sm">
            -{formatCurrency(totalFilteredImpact)}
          </span>
        </div>
      </div>

      {/* Demo / Live Status Banner */}
      {activeMode === 'demo' && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center space-x-2">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px] border border-amber-500/40">
              Demo Mode
            </span>
            <span>Displaying <strong>{findings.length} simulated sample profit leak audits</strong> for "The Artisan Roastery Co."</span>
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
            <AlertTriangle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Live Mode:</strong> No authenticated Shopify store connected yet. Connect your store in Settings to run real margin audits.
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, SKU, or order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Category"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="margin">Low Margin</option>
              <option value="discount">Discount Leaks</option>
              <option value="shipping">Shipping Deficits</option>
              <option value="refund">Refund Erosion</option>
              <option value="missing_cost">Missing Cost (COGS)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              aria-label="Filter by Severity"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="warning">Warnings</option>
              <option value="info">Informational</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open Findings</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>Showing {filteredFindings.length} of {findings.length} findings</span>
          {(selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSeverity('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-emerald-400 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-bold text-sm text-white">No Matching Profit Leaks Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No store issues matched your selected filters. Try broadening your criteria.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className={`p-5 rounded-2xl border transition-all ${
                finding.status === 'open'
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-900/60 border-slate-800/60 opacity-75'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={finding.severity}>{finding.severity.toUpperCase()}</Badge>
                    <Badge variant="neutral">{finding.category.replace('_', ' ').toUpperCase()}</Badge>
                    <Badge variant={finding.status === 'open' ? 'warning' : 'success'}>
                      {finding.status.toUpperCase()}
                    </Badge>
                    {finding.confidence_level && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        [{finding.confidence_level.replace('_', ' ')}]
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white">{finding.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {finding.calculation_explanation}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-emerald-300 font-medium">
                    <strong className="text-slate-400 font-semibold mr-1">Recommended Action:</strong>
                    {finding.recommended_action}
                  </div>
                </div>

                {/* Right Impact Box & Inspect CTA */}
                <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center space-y-3 flex-shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Est. Financial Loss</span>
                    <span className="text-xl font-extrabold text-rose-400">
                      {finding.estimated_financial_impact !== null
                        ? `-${formatCurrency(finding.estimated_financial_impact)}`
                        : 'Missing Cost'}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveFinding(finding)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors shadow-xs"
                  >
                    Inspect Finding
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspect Modal */}
      {activeFinding && (
        <FindingDetailModal
          finding={activeFinding}
          onClose={() => setActiveFinding(null)}
          onUpdateStatus={updateFindingStatus}
          onEditProductCost={(prodId) => setEditingProductId(prodId)}
        />
      )}

      {/* Edit Cost Modal */}
      {productBeingEdited && (
        <EditCostModal
          product={productBeingEdited}
          onClose={() => setEditingProductId(null)}
          onSave={async (cost, notes) => {
            await updateProductCost(productBeingEdited.id, cost, notes);
          }}
        />
      )}
    </div>
  );
};
