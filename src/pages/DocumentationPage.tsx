import React from 'react';
import {
  BookOpen,
  Calculator,
  Terminal,
  Database,
  Shield,
  ExternalLink,
  Code2,
  CheckCircle2
} from 'lucide-react';

export const DocumentationPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Technical Documentation & Sale Handover</h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete engineering reference, deterministic mathematical formulas, Shopify setup guide, and owner transfer checklist.
        </p>
      </div>

      {/* 1. Mathematical Formulas Reference */}
      <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-emerald-400">
          <Calculator className="w-5 h-5" />
          <h2>Profit Calculation Engine: Mathematical Formulas</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          ProfitShield enforces deterministic, verified financial algorithms without relying on unverified estimates.
        </p>

        <div className="space-y-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
            <span className="text-emerald-400 font-bold block">// 1. Net Sales</span>
            <p className="text-white">NetSales = GrossProductSales - ApplicableDiscounts - Adjustments</p>
            <p className="text-slate-500 text-[11px] font-sans">
              Rule: Discounts are applied once at line item level to avoid double-counting.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
            <span className="text-emerald-400 font-bold block">// 2. Estimated Gross Profit</span>
            <p className="text-white">EstimatedGrossProfit = NetSales - CostOfGoodsSold (COGS)</p>
            <p className="text-slate-500 text-[11px] font-sans">
              Rule: When COGS is null, Profit is marked Undetermined and flagged in the Missing Cost audit.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
            <span className="text-emerald-400 font-bold block">// 3. Estimated Gross Margin Percentage</span>
            <p className="text-white">GrossMarginPct = (EstimatedGrossProfit / NetSales) * 100</p>
            <p className="text-slate-500 text-[11px] font-sans">
              Rule: Safe division guard prevents zero denominator errors when NetSales is $0.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
            <span className="text-emerald-400 font-bold block">// 4. Carrier Shipping Cost Deficit</span>
            <p className="text-white">ShippingLoss = Max(0, ActualCarrierExpense - ShippingChargedToCustomer)</p>
            <p className="text-slate-500 text-[11px] font-sans">
              Rule: Shipping charged and shipping expense are strictly distinguished.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 space-y-1">
            <span className="text-emerald-400 font-bold block">// 5. Refund Impact & Inventory Loss</span>
            <p className="text-white">TotalRefundLoss = DirectCashRefund + (IsRestocked ? 0 : UnitCOGS)</p>
            <p className="text-slate-500 text-[11px] font-sans">
              Rule: If returned item cannot be resold, the merchant permanently loses the inventory unit cost.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Setup & Installation Commands */}
      <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-sky-400">
          <Terminal className="w-5 h-5" />
          <h2>Installation & Verification Commands</h2>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold mb-1">Install dependencies:</span>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono">npm install</pre>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-1">Run automated unit and backend integration tests:</span>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono">npm test</pre>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-1">Start full-stack application server (Express + Vite on port 3000):</span>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono">npm run dev</pre>
          </div>

          <div>
            <span className="text-slate-400 block font-semibold mb-1">Compile production bundle:</span>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 font-mono">npm run build</pre>
          </div>
        </div>
      </section>

      {/* 3. Database Schema & Migration */}
      <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-amber-400">
          <Database className="w-5 h-5" />
          <h2>PostgreSQL Database Migrations</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          ProfitShield includes full SQL migrations under <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">migrations/001_initial_schema.sql</code>. It includes multi-tenant indexing, UUID primary keys, and foreign-key referential integrity across merchants, stores, products, orders, findings, and audit logs.
        </p>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
          <span className="font-bold text-white block">To apply migrations to your production PostgreSQL database:</span>
          <pre className="text-emerald-400 font-mono p-2 rounded bg-slate-900">psql "$DATABASE_URL" -f migrations/001_initial_schema.sql</pre>
        </div>
      </section>

      {/* 4. Sale Handover Checklist */}
      <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-sm font-bold text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <h2>Software Sale & Transfer Checklist</h2>
        </div>
        <div className="space-y-2 text-xs text-slate-300">
          {[
            'No personal developer accounts or private hardcoded API keys are embedded.',
            'Environment variables are cleanly parameterized in .env.example.',
            'Deterministic Profit Leak Finder engine operates independently of third-party AI APIs.',
            'Shopify App Bridge and OAuth authentication adheres to official 2024-10 Admin API standards.',
            'PostgreSQL database migration file migrations/001_initial_schema.sql is tested and idempotent.',
            'Executive PDF reporting with jsPDF runs completely client-side without external dependencies.',
            'Complete automated Vitest test suite covers all financial formulas and Express routes.'
          ].map((item, idx) => (
            <div key={idx} className="flex items-start space-x-2.5 p-2 rounded-lg bg-slate-800/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
