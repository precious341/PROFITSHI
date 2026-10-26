import React, { useState } from 'react';
import { ApiFinding } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Badge } from '../common/Badge';
import {
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  HelpCircle,
  Calculator,
  Lightbulb,
  FileSearch,
  Check,
  Ban,
  RotateCcw
} from 'lucide-react';

interface FindingDetailModalProps {
  finding: ApiFinding;
  onClose: () => void;
  onUpdateStatus: (id: string, status: 'open' | 'resolved' | 'dismissed', notes?: string) => Promise<void>;
  onEditProductCost?: (productId: string) => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  onClose,
  onUpdateStatus,
  onEditProductCost
}) => {
  const [resolutionNotes, setResolutionNotes] = useState<string>(finding.resolution_notes || '');
  const [updating, setUpdating] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: 'open' | 'resolved' | 'dismissed') => {
    try {
      setUpdating(true);
      await onUpdateStatus(finding.id, newStatus, resolutionNotes);
      setActionSuccess(`Finding marked as ${newStatus.toUpperCase()}`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      alert(err.message || 'Failed to update finding status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center space-x-2">
              <Badge variant={finding.severity}>{finding.severity.toUpperCase()}</Badge>
              <Badge variant="neutral">{finding.category.replace('_', ' ').toUpperCase()}</Badge>
              <Badge variant={finding.status === 'open' ? 'warning' : 'success'}>
                {finding.status.toUpperCase()}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{finding.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Financial Impact Banner */}
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Estimated Profit Impact</span>
              <span className="text-2xl font-extrabold text-rose-400 tracking-tight">
                {finding.estimated_financial_impact !== null
                  ? `-${formatCurrency(finding.estimated_financial_impact)}`
                  : 'Undetermined (Cost Missing)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">Confidence Level</span>
              <span
                className={`text-xs font-bold uppercase ${
                  finding.confidence_level === 'high'
                    ? 'text-emerald-400'
                    : finding.confidence_level === 'incomplete_data'
                    ? 'text-amber-400'
                    : 'text-sky-400'
                }`}
              >
                {finding.confidence_level.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Quick Action for Missing Cost */}
          {finding.category === 'missing_cost' && finding.product_id && onEditProductCost && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 text-amber-300 text-xs">
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                <span>Input the wholesale product cost to eliminate this diagnostic warning.</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onEditProductCost(finding.product_id!);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs"
              >
                Enter Unit Cost
              </button>
            </div>
          )}

          {/* Transparent Calculation Explanation */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Calculation Explanation & Formula</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
              {finding.calculation_explanation}
            </div>
          </div>

          {/* Actionable Recommendation */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Recommended Remediation</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-medium leading-relaxed">
              {finding.recommended_action}
            </div>
          </div>

          {/* Facts / Evidence Used Table */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <FileSearch className="w-4 h-4 text-sky-400" />
              <span>Evidence Facts Used</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 font-mono text-[11px] text-slate-400 max-h-36 overflow-y-auto">
              <pre>{JSON.stringify(finding.evidence_json, null, 2)}</pre>
            </div>
          </div>

          {/* Resolution Controls & Notes */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Resolution Audit Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Raised price by $3.00 on Shopify; reviewed supplier quote."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-emerald-500"
            />

            {finding.resolved_at && (
              <p className="text-[11px] text-slate-400">
                Resolved by <strong>{finding.resolved_by || 'Merchant'}</strong> on {formatDate(finding.resolved_at)}
              </p>
            )}

            {actionSuccess && (
              <div className="text-xs text-emerald-400 font-semibold">{actionSuccess}</div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Detected: {formatDate(finding.created_at)}
          </span>
          <div className="flex items-center space-x-2">
            {finding.status !== 'open' ? (
              <button
                onClick={() => handleStatusChange('open')}
                disabled={updating}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 border border-slate-700 flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-open Finding</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleStatusChange('dismissed')}
                  disabled={updating}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center space-x-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Dismiss</span>
                </button>
                <button
                  onClick={() => handleStatusChange('resolved')}
                  disabled={updating}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Resolved</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
