/**
 * ProfitShield Frontend API Client
 */

export interface ApiFinding {
  id: string;
  store_id: string;
  finding_key: string;
  title: string;
  category: 'margin' | 'discount' | 'shipping' | 'refund' | 'missing_cost';
  severity: 'critical' | 'warning' | 'info';
  status: 'open' | 'resolved' | 'dismissed';
  product_id?: string;
  product_title?: string;
  order_id?: string;
  order_number?: string;
  estimated_financial_impact: number | null;
  calculation_explanation: string;
  evidence_json: Record<string, any>;
  recommended_action: string;
  confidence_level: 'high' | 'medium' | 'low' | 'incomplete_data';
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiProduct {
  id: string;
  store_id: string;
  shopify_product_id: string;
  title: string;
  handle: string;
  sku: string;
  price: number;
  shopify_cost: number | null;
  override_cost: number | null;
  effective_cost: number | null;
  margin_pct: number | null;
  vendor: string;
  product_type: string;
  inventory_quantity: number;
}

export interface ApiOrder {
  id: string;
  store_id: string;
  shopify_order_id: string;
  order_number: string;
  processed_at: string;
  currency: string;
  gross_sales: number;
  discounts_total: number;
  shipping_charged: number;
  shipping_expense: number;
  total_refunded: number;
  cogs_total: number;
  net_sales: number;
  estimated_gross_profit: number;
  estimated_margin_pct: number;
  items?: Array<{
    product_id: string;
    title: string;
    quantity: number;
    unit_price: number;
    unit_cost: number | null;
    is_refunded?: boolean;
    restocked?: boolean;
  }>;
}

export interface ApiMarginSettings {
  target_gross_margin_pct: number;
  low_margin_threshold_pct: number;
  high_loss_threshold_amt: number;
  default_shipping_cost_est: number;
  alert_email_enabled: boolean;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('profitshield_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Dashboard
  getDashboardSummary: () => request<any>('/api/dashboard/summary'),

  // Findings
  getFindings: (params?: { category?: string; severity?: string; status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.severity) searchParams.set('severity', params.severity);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    return request<{ data: ApiFinding[]; totalCount: number; isRestrictedByPlan: boolean; currentPlan: string }>(
      `/api/findings?${searchParams.toString()}`
    );
  },
  updateFindingStatus: (id: string, status: 'open' | 'resolved' | 'dismissed', notes?: string) =>
    request<{ success: boolean; finding: ApiFinding }>(`/api/findings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    }),

  // Products
  getProducts: () => request<{ data: ApiProduct[] }>('/api/products'),
  getMissingCostProducts: () => request<{ data: ApiProduct[]; count: number }>('/api/products/missing-cost'),
  updateProductCost: (id: string, overrideCost: number, notes?: string, source?: string) =>
    request<{ success: boolean; product: ApiProduct }>(`/api/products/${id}/cost`, {
      method: 'PUT',
      body: JSON.stringify({ overrideCost, notes, source })
    }),
  getProductCostHistory: (id: string) => request<{ data: any[] }>(`/api/products/${id}/cost-history`),

  // Orders & Deep Dives
  getOrders: (limit: number = 50) => request<{ data: ApiOrder[] }>(`/api/orders?limit=${limit}`),
  getOrder: (id: string) => request<{ data: ApiOrder }>(`/api/orders/${id}`),
  getDiscountAnalytics: () => request<any>('/api/orders/analytics/discounts'),
  getShippingAnalytics: () => request<any>('/api/orders/analytics/shipping'),
  getRefundAnalytics: () => request<any>('/api/orders/analytics/refunds'),

  // Alerts & Margin Settings
  getAlerts: () => request<{ data: any[] }>('/api/alerts'),
  dismissAlert: (id: string) => request<{ success: boolean; alert: any }>(`/api/alerts/${id}/dismiss`, { method: 'POST' }),
  getMarginSettings: () => request<{ data: ApiMarginSettings }>('/api/alerts/settings'),
  updateMarginSettings: (settings: ApiMarginSettings) =>
    request<{ success: boolean; settings: ApiMarginSettings }>('/api/alerts/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),

  // Shopify
  getShopifyStatus: () => request<any>('/api/shopify/status'),
  getShopifyConfig: () => request<{ config: any }>('/api/shopify/config'),
  saveShopifyConfig: (config: any) =>
    request<any>('/api/shopify/config', {
      method: 'POST',
      body: JSON.stringify(config)
    }),
  testShopifyConfig: (params: any) =>
    request<any>('/api/shopify/config/test', {
      method: 'POST',
      body: JSON.stringify(params)
    }),
  switchShopifyMode: (mode: 'demo' | 'live') =>
    request<any>('/api/shopify/mode', {
      method: 'POST',
      body: JSON.stringify({ mode })
    }),
  connectShopifyStore: (shopDomain?: string, redirectUri?: string) =>
    request<any>('/api/shopify/connect', {
      method: 'POST',
      body: JSON.stringify({ shopDomain, redirectUri })
    }),
  disconnectShopifyStore: () =>
    request<any>('/api/shopify/disconnect', { method: 'POST' }),
  triggerSync: () => request<any>('/api/shopify/sync', { method: 'POST' }),

  // Operator Administration
  getAdminOverview: () => request<any>('/api/admin/overview')
};
