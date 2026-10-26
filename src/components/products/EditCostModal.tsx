import React, { useState, useEffect } from 'react';
import { ApiProduct, api } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { X, DollarSign, History, AlertCircle, Check } from 'lucide-react';

interface EditCostModalProps {
  product: ApiProduct;
  onClose: () => void;
  onSave: (newCost: number, notes?: string) => Promise<void>;
}

export const EditCostModal: React.FC<EditCostModalProps> = ({ product, onClose, onSave }) => {
  const [costInput, setCostInput] = useState<string>(
    product.effective_cost !== null && product.effective_cost !== undefined ? String(product.effective_cost) : ''
  );
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getProductCostHistory(product.id)
      .then(res => setHistory(res.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [product.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(costInput);
    if (isNaN(num) || num < 0) {
      setError('Please provide a valid non-negative cost value.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(num, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update cost');
    } finally {
      setSaving(false);
    }
  };

  const currentPrice = Number(product.price);
  const enteredNum = parseFloat(costInput);
  const projectedMargin = !isNaN(enteredNum) && currentPrice > 0
    ? (((currentPrice - enteredNum) / currentPrice) * 100).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Product Cost Override</h3>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm">{product.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Price & Current Cost Overview */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block">Retail Price</span>
              <span className="text-sm font-bold text-white">{formatCurrency(product.price)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Shopify Synced Cost</span>
              <span className="text-sm font-semibold text-slate-300">
                {product.shopify_cost !== null ? formatCurrency(product.shopify_cost) : 'Missing in Shopify'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Active Cost (COGS)</span>
              <span className="text-sm font-bold text-emerald-400">
                {product.effective_cost !== null ? formatCurrency(product.effective_cost) : 'None'}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Unit Cost ($ USD) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  placeholder="e.g. 18.50"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              {projectedMargin !== null && (
                <div className="mt-2 text-xs flex items-center space-x-2">
                  <span className="text-slate-400">Projected Gross Margin:</span>
                  <span
                    className={`font-bold ${
                      Number(projectedMargin) < 30 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {projectedMargin}%
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Adjustment Reason or Source
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Supplier Q4 price update, includes packaging"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Merchant-entered cost overrides are permanently protected and will not be overwritten by routine Shopify syncs.
              </p>
            </div>

            {/* Audit History */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 mb-2">
                <History className="w-3.5 h-3.5" />
                <span>Cost Change Audit History</span>
              </div>
              {loadingHistory ? (
                <div className="text-xs text-slate-500 italic">Loading history...</div>
              ) : history.length === 0 ? (
                <div className="text-xs text-slate-500 italic">No manual overrides recorded yet.</div>
              ) : (
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="text-[11px] p-2 rounded-md bg-slate-800/40 border border-slate-700/40 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white">{formatCurrency(h.new_cost)}</span>
                        <span className="text-slate-400 ml-1.5">({h.source})</span>
                        {h.change_reason && <p className="text-slate-400 text-[10px]">{h.change_reason}</p>}
                      </div>
                      <span className="text-[10px] text-slate-500">{formatDate(h.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Apply Cost Override'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
