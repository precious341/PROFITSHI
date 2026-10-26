import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Percent,
  Truck,
  RotateCcw,
  CheckCircle,
  FileText,
  AlertTriangle,
  HelpCircle,
  Shield,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Server,
  Zap
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setCurrentView } = useApp();
  const [shopDomain, setShopDomain] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: TrendingDown,
      title: 'Profit Leak Finder',
      desc: 'Pinpoints hidden margin erosion across inventory, discounts, courier deficits, and unrecovered refunds with transparent math.'
    },
    {
      icon: Percent,
      title: 'Product Margin Analysis',
      desc: 'Tracks real Cost of Goods Sold (COGS) vs retail price to prevent selling inventory below target margin thresholds.'
    },
    {
      icon: ShieldAlert,
      title: 'Discount Impact Analysis',
      desc: 'Measures promotional code margin compression and identifies orders pushed into net deficit by stacked coupons.'
    },
    {
      icon: Truck,
      title: 'Shipping Cost Deficits',
      desc: 'Compares customer shipping revenue against actual carrier fulfillment charges to identify unrecovered freight losses.'
    },
    {
      icon: RotateCcw,
      title: 'Refund & Return Analysis',
      desc: 'Audits unrecovered inventory costs and return rates across product lines without false assumptions.'
    },
    {
      icon: FileText,
      title: 'Downloadable PDF Reports',
      desc: 'Export executive-ready financial reports with complete calculation methodology for software partners and investors.'
    }
  ];

  const faqs = [
    {
      q: 'How does ProfitShield access my Shopify store data?',
      a: 'ProfitShield requests only essential read scopes (read_products, read_orders, read_inventory) via Shopify’s GraphQL Admin API. All credentials are encrypted and stored with strict multi-tenant isolation.'
    },
    {
      q: 'Does ProfitShield guarantee increased store profits?',
      a: 'No. ProfitShield provides deterministic calculations, diagnostics, and evidence-based findings based on your actual store records. We do not make false guarantees of profit increases.'
    },
    {
      q: 'What happens if product costs (COGS) are missing from Shopify?',
      a: 'ProfitShield honestly flags items with missing costs and classifies findings as incomplete data rather than inventing estimates. You can easily enter cost assumptions through the Product Cost Manager.'
    },
    {
      q: 'Are there recurring monthly subscriptions or billing fees for this app?',
      a: 'No. ProfitShield is packaged and delivered as a complete standalone software asset for a one-time purchase. As the software owner, all features—including unlimited findings, PDF exports, and deep analytics—are fully unlocked with zero recurring subscription charges.'
    },
    {
      q: 'How is merchant data protected?',
      a: 'Each store’s data is strictly partitioned. We comply with Shopify mandatory GDPR privacy webhooks (customers/data_request, customers/redact, shop/redact) and never share merchant records with third-party AI APIs.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Marketing Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">ProfitShield</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
            <button onClick={() => setCurrentView('docs')} className="hover:text-emerald-400 transition-colors">
              Documentation
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 transition-colors shadow-sm"
            >
              Explore Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Deterministic Profit Leak Protection for Shopify</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Find the Profit Leaks <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
              in Your Shopify Store.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            Understand how product costs, discounts, shipping, and refunds affect your Shopify store’s profitability. Turn raw store data into clear findings and evidence-based calculations.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10 transition-all"
            >
              <span>Explore the Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentView('settings')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center space-x-2 transition-all"
            >
              <span>Connect Your Store</span>
            </button>
          </div>

          {/* Quick Notice about Shopify Integration Status */}
          <p className="text-xs text-slate-500 pt-2">
            Real Shopify Partner credentials required for live store connection. A fully configured high-fidelity demo store is ready to explore immediately.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Calculations, Not Guesses.
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Every finding reveals the exact numbers, formulas, and evidence so you can fix margins with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-white">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How ProfitShield Works
            </h2>
            <p className="text-sm text-slate-400">
              Four structured steps from initial sync to continuous profit protection.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Connect Store', desc: 'Authorize Shopify OAuth with required product and order read scopes.' },
              { step: '02', title: 'Import Store Data', desc: 'Securely sync product variant costs, order line items, and fulfillment fees.' },
              { step: '03', title: 'Analyze Margins', desc: 'Deterministic engine audits net sales, COGS, freight costs, and refunds.' },
              { step: '04', title: 'Review & Remediate', desc: 'Review prioritized findings, adjust pricing, and track resolution audit history.' }
            ].map((st, i) => (
              <div key={i} className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="font-mono text-emerald-400 font-bold text-sm">{st.step}</span>
                <h4 className="font-bold text-sm text-white">{st.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture & Ownership Section */}
      <section id="architecture" className="py-20 border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Single-Buyer Software Asset Architecture
            </h2>
            <p className="text-sm text-slate-400">
              Complete standalone ownership with all diagnostic and analytical modules fully unlocked.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Full Feature Entitlements</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                All capabilities are 100% unlocked for your store. Zero artificial feature gates, no paywalls, and unlimited leak audits.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unlimited Profit Leak Finder audits</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Discount, Shipping & Refund deep dives</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Executive PDF Report generation</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Zero Vendor Subscriptions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Self-hosted standalone architecture that connects directly to your Shopify store via your own Shopify Partner App credentials.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>No monthly SaaS fees or developer cuts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Your own PostgreSQL or embedded DB</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Private credentials & token isolation</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Deterministic Cost-Free Math</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Built strictly with transparent, deterministic financial algorithms. Zero third-party LLM token fees or external API meters.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>$0.00 ongoing AI / token consumption</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auditable mathematical formulas</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shopify GraphQL Admin API 2024-10</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-400">Everything you need to know about calculation accuracy and data access.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left font-semibold text-xs text-white flex items-center justify-between hover:bg-slate-800/40"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">ProfitShield</span>
            <span>&bull; Shopify Profit Protection Platform</span>
          </div>

          <div className="flex items-center space-x-6 text-[11px]">
            <button onClick={() => setCurrentView('docs')} className="hover:text-slate-300">Documentation</button>
            <button onClick={() => setCurrentView('settings')} className="hover:text-slate-300">Privacy Policy</button>
            <button onClick={() => setCurrentView('settings')} className="hover:text-slate-300">Terms of Service</button>
            <button onClick={() => setCurrentView('admin')} className="hover:text-slate-300">Operator Portal</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
