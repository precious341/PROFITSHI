import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiFinding, ApiProduct, ApiOrder, ApiMarginSettings } from '../lib/api';

export type ViewType =
  | 'landing'
  | 'dashboard'
  | 'leak-finder'
  | 'products'
  | 'orders'
  | 'discounts'
  | 'shipping'
  | 'refunds'
  | 'alerts'
  | 'reports'
  | 'settings'
  | 'admin'
  | 'docs'
  | 'auth';

interface AppContextType {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  dashboardData: any;
  findings: ApiFinding[];
  products: ApiProduct[];
  orders: ApiOrder[];
  alerts: any[];
  settings: ApiMarginSettings | null;
  store: any;
  currentPlan: string;
  activeMode: 'demo' | 'live';
  shopifyStatus: any;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  user: any;
  refreshAllData: () => Promise<void>;
  updateProductCost: (id: string, overrideCost: number, notes?: string) => Promise<void>;
  updateFindingStatus: (id: string, status: 'open' | 'resolved' | 'dismissed', notes?: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  updateMarginSettings: (newSettings: ApiMarginSettings) => Promise<void>;
  switchShopifyMode: (mode: 'demo' | 'live') => Promise<void>;
  triggerSync: () => Promise<any>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [findings, setFindings] = useState<ApiFinding[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [settings, setSettings] = useState<ApiMarginSettings | null>(null);
  const [store, setStore] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('full');
  const [activeMode, setActiveMode] = useState<'demo' | 'live'>('demo');
  const [shopifyStatus, setShopifyStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>({
    email: 'demo-merchant@the-artisan-roastery.com',
    fullName: 'Artisan Store Manager',
    role: 'merchant'
  });

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryRes, findingsRes, productsRes, ordersRes, alertsRes, settingsRes, shopifyStatusRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getFindings(),
        api.getProducts(),
        api.getOrders(20),
        api.getAlerts(),
        api.getMarginSettings(),
        api.getShopifyStatus()
      ]);

      setDashboardData(summaryRes);
      setStore(summaryRes.store);
      setActiveMode(summaryRes.activeMode || 'demo');
      setCurrentPlan(summaryRes.store?.plan || 'full');
      setFindings(findingsRes.data || []);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setAlerts(alertsRes.data || []);
      setSettings(settingsRes.data || null);
      setShopifyStatus(shopifyStatusRes);
    } catch (err: any) {
      console.error('[ProfitShield AppContext] Load error:', err);
      setError(err.message || 'Failed to initialize store data.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = async () => {
    try {
      setRefreshing(true);
      const [summaryRes, findingsRes, productsRes, ordersRes, alertsRes, shopifyStatusRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getFindings(),
        api.getProducts(),
        api.getOrders(20),
        api.getAlerts(),
        api.getShopifyStatus()
      ]);

      setDashboardData(summaryRes);
      setStore(summaryRes.store);
      setActiveMode(summaryRes.activeMode || 'demo');
      setCurrentPlan(summaryRes.store?.plan || 'full');
      setFindings(findingsRes.data || []);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      setAlerts(alertsRes.data || []);
      setShopifyStatus(shopifyStatusRes);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const updateProductCost = async (id: string, overrideCost: number, notes?: string) => {
    await api.updateProductCost(id, overrideCost, notes);
    await refreshAllData();
  };

  const updateFindingStatus = async (id: string, status: 'open' | 'resolved' | 'dismissed', notes?: string) => {
    await api.updateFindingStatus(id, status, notes);
    await refreshAllData();
  };

  const dismissAlert = async (id: string) => {
    await api.dismissAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const updateMarginSettings = async (newSettings: ApiMarginSettings) => {
    const res = await api.updateMarginSettings(newSettings);
    setSettings(res.settings);
    await refreshAllData();
  };

  const switchShopifyMode = async (mode: 'demo' | 'live') => {
    await api.switchShopifyMode(mode);
    setActiveMode(mode);
    await refreshAllData();
  };

  const triggerSync = async () => {
    try {
      const res = await api.triggerSync();
      await refreshAllData();
      return res;
    } catch (err: any) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('profitshield_token');
    setCurrentView('landing');
  };

  useEffect(() => {
    loadInitialData();

    // Check if redirected from OAuth callback (?shopify_connected=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('shopify_connected') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      setCurrentView('settings');
      refreshAllData();
    }

    // Listen for postMessage from OAuth popup
    const handleAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'SHOPIFY_AUTH_SUCCESS') {
        setCurrentView('settings');
        refreshAllData();
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        dashboardData,
        findings,
        products,
        orders,
        alerts,
        settings,
        store,
        currentPlan,
        activeMode,
        shopifyStatus,
        loading,
        refreshing,
        error,
        user,
        refreshAllData,
        updateProductCost,
        updateFindingStatus,
        dismissAlert,
        updateMarginSettings,
        switchShopifyMode,
        triggerSync,
        logout
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
