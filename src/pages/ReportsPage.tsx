import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateProfitShieldReport } from '../lib/pdfGenerator';
import { formatCurrency, formatPercent } from '../lib/formatters';
import {
  FileText,
  Download,
  CheckCircle,
  Calendar,
  AlertTriangle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { dashboardData, findings, products, store, setCurrentView } = useApp();
  const [reportPeriod, setReportPeriod] = useState<string>('last_30_days');
  const [generating, setGenerating] = useState<boolean>(false);
  const [downloadCount, setDownloadCount] = useState<number>(0);

  const handleGeneratePDF = () => {
    if (!dashboardData) return;
    setGenerating(true);

    try {
      const lowMarginProducts = products
        .filter((p) => p.margin_pct !== null && p.margin_pct < 45)
        .slice(0, 5)
        .map((p) => ({
          title: p.title,
          sku: p.sku || 'N/A',
          price: p.price,
          effective_cost: p.effective_cost,
          margin_pct: p.margin_pct
        }));

      const topFindings = findings.slice(0, 5).map((f) => ({
        title: f.title,
        category: f.category,
        severity: f.severity,
        estimated_financial_impact: f.estimated_financial_impact,
        calculation_explanation: f.calculation_explanation,
        recommended_action: f.recommended_action
      }));

      generateProfitShieldReport({
        storeName: store?.shop_name || 'The Artisan Roastery Co.',
        storeDomain: store?.shopify_domain || 'the-artisan-roastery.myshopify.com',
        currency: store?.currency || 'USD',
        generatedAt: new Date().toISOString(),
        periodLabel: reportPeriod === 'last_30_days' ? 'Last 30 Days' : 'Quarter to Date',
        metrics: {
          grossSales: dashboardData.metrics.grossSales,
          discounts: dashboardData.metrics.discounts,
          netSales: dashboardData.metrics.netSales,
          estimatedGrossProfit: dashboardData.metrics.estimatedGrossProfit,
          estimatedMarginPct: dashboardData.metrics.estimatedMarginPct,
          totalPotentialLeakImpact: dashboardData.metrics.totalPotentialLeakImpact,
          missingCostCount: dashboardData.metrics.missingCostCount
        },
        topFindings,
        lowMarginProducts
      });

      setDownloadCount((prev) => prev + 1);
    } catch (err: any) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Executive Report Generator</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate professional, exportable PDF reports containing comprehensive margin audit results and calculation methodology.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Report Parameters</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Audit Period
              </label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-emerald-500"
              >
                <option value="last_30_days">Last 30 Days (Standard Audit)</option>
                <option value="quarter_to_date">Quarter to Date</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Included Report Modules
              </label>
              <div className="space-y-2 text-slate-300">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly className="accent-emerald-500 rounded" />
                  <span>Executive KPI Summary (Net Sales, COGS, Gross Margin)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly className="accent-emerald-500 rounded" />
                  <span>Profit Leak Finder Priority Findings</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly className="accent-emerald-500 rounded" />
                  <span>Critically Low Margin Products Table</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked readOnly className="accent-emerald-500 rounded" />
                  <span>Missing Cost (COGS) Warnings & Methodology</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleGeneratePDF}
              disabled={generating}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{generating ? 'Compiling PDF...' : 'Download Executive PDF Report'}</span>
            </button>

            {downloadCount > 0 && (
              <p className="text-center text-[11px] text-emerald-400 font-medium">
                Report generated & downloaded ({downloadCount})
              </p>
            )}
          </div>
        </div>

        {/* Live Document Preview Mockup */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider">Document Preview</span>
            <span>A4 Portrait &bull; Vector Typography</span>
          </div>

          <div className="p-6 rounded-xl bg-white text-slate-900 shadow-xl space-y-4 select-none">
            <div className="border-b border-slate-200 pb-3 flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-base tracking-tight text-slate-900">PROFITSHIELD</h3>
                <p className="text-[10px] text-slate-500">Shopify Financial Protection & Margin Analytics Executive Report</p>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                <p>Store: {store?.shop_name || 'The Artisan Roastery Co.'}</p>
                <p>Period: {reportPeriod === 'last_30_days' ? 'Last 30 Days' : 'QTD'}</p>
              </div>
            </div>

            {/* Mock KPIs */}
            <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Net Sales</span>
                <span className="font-bold text-xs text-slate-900">
                  {formatCurrency(dashboardData?.metrics.netSales)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Est. Gross Profit</span>
                <span className="font-bold text-xs text-emerald-600">
                  {formatCurrency(dashboardData?.metrics.estimatedGrossProfit)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Est. Margin</span>
                <span className="font-bold text-xs text-slate-900">
                  {formatPercent(dashboardData?.metrics.estimatedMarginPct)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase block">Potential Leaks</span>
                <span className="font-bold text-xs text-rose-600">
                  -{formatCurrency(dashboardData?.metrics.totalPotentialLeakImpact)}
                </span>
              </div>
            </div>

            {/* Mock Preview Content */}
            <div className="space-y-1 text-[10px] text-slate-600">
              <p className="font-bold text-slate-900 text-xs">Priority Findings Included:</p>
              {findings.slice(0, 3).map((f, i) => (
                <div key={i} className="p-2 rounded bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span>{f.title}</span>
                  <span className="font-bold text-rose-600">
                    {f.estimated_financial_impact ? `-${formatCurrency(f.estimated_financial_impact)}` : 'Missing Cost'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[9px] text-slate-400 italic border-t border-slate-100">
              Generated securely with deterministic Shopify Admin API 2024-10 integration.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
