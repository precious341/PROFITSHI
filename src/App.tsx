import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeakFinderPage } from './pages/LeakFinderPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { Menu, X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentView, setCurrentView } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (currentView === 'landing') {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Application Header */}
      <Header />

      {/* Mobile Menu Toggle Bar */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300 capitalize">{currentView.replace('-', ' ')}</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Mobile Slide-out Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-xs flex">
            <div className="w-64 bg-slate-900 h-full overflow-y-auto">
              <div className="p-3 border-b border-slate-800 flex justify-end">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar />
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && <DashboardPage onInspectFinding={() => setCurrentView('leak-finder')} />}
            {currentView === 'leak-finder' && <LeakFinderPage />}
            {currentView === 'products' && <ProductsPage />}
            {currentView === 'orders' && <OrdersPage />}
            {currentView === 'discounts' && <AnalyticsPage initialTab="discounts" />}
            {currentView === 'shipping' && <AnalyticsPage initialTab="shipping" />}
            {currentView === 'refunds' && <AnalyticsPage initialTab="refunds" />}
            {currentView === 'alerts' && <AlertsPage />}
            {currentView === 'reports' && <ReportsPage />}
            {currentView === 'settings' && <SettingsPage />}
            {currentView === 'admin' && <AdminPage />}
            {currentView === 'docs' && <DocumentationPage />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
