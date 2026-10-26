/**
 * ProfitShield Database Layer
 * Dual PostgreSQL Engine & In-Memory / Embedded Storage Fallback
 * Multi-tenant isolation for Demo Store and Live Connected Shopify Stores
 */

import pg from 'pg';
import {
  DEMO_STORE,
  DEMO_SETTINGS,
  DEMO_PRODUCTS,
  DEMO_ORDERS,
  DEMO_AUDIT_LOGS
} from './seedData';
import { runProfitLeakFinder, LeakFinding } from '../engine/leakFinder';
import { roundCurrency, calculateNetSales, calculateEstimatedGrossProfit, calculateEstimatedGrossMargin } from '../engine/calculations';
import { encryptSecret, decryptSecret, sanitizeStoreForClient } from '../services/encryptionService';

const { Pool } = pg;

export interface DBProduct {
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

export interface DBCostHistoryItem {
  id: string;
  product_id: string;
  previous_cost: number | null;
  new_cost: number;
  source: string;
  updated_by: string;
  change_reason?: string;
  created_at: string;
}

class DatabaseManager {
  private pool: pg.Pool | null = null;
  private isPostgresActive: boolean = false;

  // Active operating mode: 'demo' or 'live'
  private activeMode: 'demo' | 'live' = 'demo';

  // In-memory data structures
  private stores: Map<string, any> = new Map();
  private settings: Map<string, any> = new Map();
  private products: Map<string, DBProduct> = new Map();
  private orders: Map<string, any> = new Map();
  private findings: Map<string, LeakFinding> = new Map();
  private costHistory: DBCostHistoryItem[] = [];
  private alerts: any[] = [];
  private auditLogs: any[] = [];

  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes('placeholder')) {
      try {
        this.pool = new Pool({
          connectionString: dbUrl,
          connectionTimeoutMillis: 3000
        });
        await this.pool.query('SELECT 1');
        this.isPostgresActive = true;
        console.log('[ProfitShield DB] Connected to PostgreSQL instance via DATABASE_URL');
      } catch (err: any) {
        console.warn(`[ProfitShield DB] PostgreSQL connection skipped (${err.message}). Using memory storage.`);
        this.isPostgresActive = false;
      }
    }

    // Initialize stores
    this.seedDemoData();
    this.seedLiveStorePlaceholder();
  }

  private seedDemoData() {
    this.stores.set(DEMO_STORE.id, { ...DEMO_STORE });
    this.settings.set(DEMO_STORE.id, { ...DEMO_SETTINGS });

    DEMO_PRODUCTS.forEach(p => {
      const effective = p.override_cost !== null && p.override_cost !== undefined ? p.override_cost : p.shopify_cost;
      const margin = effective !== null && p.price > 0 ? roundCurrency(((p.price - effective) / p.price) * 100) : null;
      this.products.set(p.id, {
        ...p,
        effective_cost: effective,
        margin_pct: margin
      });
    });

    DEMO_ORDERS.forEach(o => {
      this.orders.set(o.id, { ...o });
    });

    this.auditLogs = [...DEMO_AUDIT_LOGS];

    // Recompute findings using deterministic leak engine
    this.recomputeFindings(DEMO_STORE.id);
  }

  private seedLiveStorePlaceholder() {
    const liveStore = {
      id: 'store-live-001',
      merchant_id: 'merchant-demo-001',
      shopify_domain: '',
      shop_name: 'Not Connected',
      plan: 'full',
      plan_status: 'active',
      currency: 'USD',
      is_demo: false,
      installed_at: null,
      last_sync_at: null,
      access_token_encrypted: null,
      scopes: ''
    };
    this.stores.set(liveStore.id, liveStore);
    this.settings.set(liveStore.id, { ...DEMO_SETTINGS, store_id: liveStore.id });
  }

  // --- MODE & ACTIVE STORE MANAGEMENT ---
  public getActiveMode(): 'demo' | 'live' {
    return this.activeMode;
  }

  public setActiveMode(mode: 'demo' | 'live') {
    this.activeMode = mode;
  }

  public getActiveStoreId(): string {
    return this.activeMode === 'demo' ? DEMO_STORE.id : 'store-live-001';
  }

  public async saveLiveStore(domain: string, shopName: string, accessToken: string, scopes: string = '') {
    // Encrypt token before persisting; raw token is never kept in plain text
    const encryptedToken = encryptSecret(accessToken);
    const liveStore = {
      id: 'store-live-001',
      merchant_id: 'merchant-demo-001',
      shopify_domain: domain,
      shop_name: shopName,
      plan: 'full',
      plan_status: 'active',
      currency: 'USD',
      is_demo: false,
      installed_at: new Date().toISOString(),
      last_sync_at: null,
      access_token_encrypted: encryptedToken,
      scopes
    };
    this.stores.set(liveStore.id, liveStore);
    this.activeMode = 'live';
    this.createAuditLog(liveStore.id, 'SHOPIFY_STORE_CONNECTED', 'oauth', liveStore.id, {
      domain,
      shopName
    });
    return sanitizeStoreForClient(liveStore);
  }

  /**
   * Internal-only: Decrypt access token for server-side Shopify GraphQL API calls
   */
  public getDecryptedAccessToken(storeId?: string): string | null {
    const id = storeId || this.getActiveStoreId();
    const store = this.stores.get(id);
    if (!store || store.is_demo) return null;
    if (store.access_token_encrypted) {
      return decryptSecret(store.access_token_encrypted);
    }
    if (store.access_token) {
      return store.access_token;
    }
    return null;
  }

  /**
   * Safe for client/API responses: Sanitizes store by stripping all token strings
   */
  public async getSanitizedStore(storeId?: string) {
    const rawStore = await this.getStore(storeId);
    return sanitizeStoreForClient(rawStore);
  }

  public async disconnectLiveStore() {
    this.seedLiveStorePlaceholder();
    // Clear products and orders for live store
    Array.from(this.products.values())
      .filter(p => p.store_id === 'store-live-001')
      .forEach(p => this.products.delete(p.id));
    Array.from(this.orders.values())
      .filter(o => o.store_id === 'store-live-001')
      .forEach(o => this.orders.delete(o.id));
    Array.from(this.findings.values())
      .filter(f => f.store_id === 'store-live-001')
      .forEach(f => this.findings.delete(f.id));

    this.activeMode = 'demo';
    return { success: true };
  }

  public recomputeFindings(storeId: string) {
    const storeSettings = this.settings.get(storeId) || DEMO_SETTINGS;
    const storeProducts = Array.from(this.products.values()).filter(p => p.store_id === storeId);
    const storeOrders = Array.from(this.orders.values()).filter(o => o.store_id === storeId);

    const generated = runProfitLeakFinder(storeProducts, storeOrders, storeSettings, storeId);

    // Merge keeping existing user status/notes if already present
    generated.forEach(f => {
      const existing = this.findings.get(f.id);
      if (existing && existing.status !== 'open') {
        this.findings.set(f.id, {
          ...f,
          status: existing.status,
          resolution_notes: existing.resolution_notes,
          resolved_at: existing.resolved_at,
          resolved_by: existing.resolved_by
        });
      } else {
        this.findings.set(f.id, f);
      }
    });

    // Generate alerts for critical / warning findings
    this.alerts = generated
      .filter(f => f.severity === 'critical' || f.category === 'missing_cost')
      .map(f => ({
        id: `alert-${f.id}`,
        store_id: storeId,
        finding_id: f.id,
        title: f.title,
        message: f.calculation_explanation,
        severity: f.severity,
        status: 'active',
        created_at: f.created_at
      }));
  }

  // --- STORES & SETTINGS ---
  public async getStore(storeId?: string) {
    const id = storeId || this.getActiveStoreId();
    return this.stores.get(id) || this.stores.get(DEMO_STORE.id);
  }

  public async getSettings(storeId?: string) {
    const id = storeId || this.getActiveStoreId();
    return this.settings.get(id) || this.settings.get(DEMO_STORE.id);
  }

  public async updateSettings(storeId: string, newSettings: Partial<typeof DEMO_SETTINGS>) {
    const current = await this.getSettings(storeId);
    const updated = {
      ...current,
      ...newSettings,
      updated_at: new Date().toISOString()
    };
    this.settings.set(storeId, updated);
    this.recomputeFindings(storeId);
    return updated;
  }

  // --- PRODUCTS ---
  public async getProducts(storeId?: string): Promise<DBProduct[]> {
    const id = storeId || this.getActiveStoreId();
    return Array.from(this.products.values()).filter(p => p.store_id === id);
  }

  public async getProduct(storeId: string, productId: string): Promise<DBProduct | undefined> {
    const p = this.products.get(productId);
    if (p && p.store_id === storeId) return p;
    return undefined;
  }

  public async updateProductCost(
    storeId: string,
    productId: string,
    overrideCost: number,
    source: string = 'merchant_manual',
    updatedBy: string = 'Merchant User',
    notes?: string
  ): Promise<DBProduct> {
    const product = await this.getProduct(storeId, productId);
    if (!product) throw new Error('Product not found');

    const previousCost = product.effective_cost;
    const cleanCost = Math.max(0, roundCurrency(Number(overrideCost)));
    
    product.override_cost = cleanCost;
    product.effective_cost = cleanCost;
    product.margin_pct = product.price > 0 ? roundCurrency(((product.price - cleanCost) / product.price) * 100) : 0;
    this.products.set(productId, product);

    // Save history
    this.costHistory.unshift({
      id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      product_id: productId,
      previous_cost: previousCost,
      new_cost: cleanCost,
      source,
      updated_by: updatedBy,
      change_reason: notes || 'Cost assumption adjusted manually',
      created_at: new Date().toISOString()
    });

    this.recomputeFindings(storeId);
    return product;
  }

  public async getCostHistory(storeId: string, productId?: string): Promise<DBCostHistoryItem[]> {
    if (productId) {
      return this.costHistory.filter(c => c.product_id === productId);
    }
    return this.costHistory;
  }

  // --- ORDERS ---
  public async getOrders(storeId?: string, limit: number = 50) {
    const id = storeId || this.getActiveStoreId();
    return Array.from(this.orders.values())
      .filter(o => o.store_id === id)
      .slice(0, limit);
  }

  public async getOrder(storeId: string, orderId: string) {
    const o = this.orders.get(orderId);
    if (o && o.store_id === storeId) return o;
    return undefined;
  }

  // --- PROFIT FINDINGS ---
  public async getFindings(
    storeId?: string,
    filters?: {
      category?: string;
      severity?: string;
      status?: string;
      search?: string;
    }
  ): Promise<LeakFinding[]> {
    const id = storeId || this.getActiveStoreId();
    let list = Array.from(this.findings.values()).filter(f => f.store_id === id);

    if (filters?.category && filters.category !== 'all') {
      list = list.filter(f => f.category === filters.category);
    }
    if (filters?.severity && filters.severity !== 'all') {
      list = list.filter(f => f.severity === filters.severity);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(f => f.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(f => f.title.toLowerCase().includes(q) || f.product_title?.toLowerCase().includes(q) || f.order_number?.includes(q));
    }

    return list;
  }

  public async updateFindingStatus(
    storeId: string,
    findingId: string,
    status: 'open' | 'resolved' | 'dismissed',
    notes?: string,
    resolvedBy: string = 'Merchant User'
  ): Promise<LeakFinding> {
    const finding = this.findings.get(findingId);
    if (!finding || finding.store_id !== storeId) {
      throw new Error('Finding not found');
    }

    finding.status = status;
    finding.resolution_notes = notes || finding.resolution_notes;
    finding.resolved_by = resolvedBy;
    finding.resolved_at = status !== 'open' ? new Date().toISOString() : undefined;
    finding.updated_at = new Date().toISOString();

    this.findings.set(findingId, finding);

    this.createAuditLog(
      storeId,
      `FINDING_${status.toUpperCase()}`,
      'profit_finding',
      findingId,
      { title: finding.title, category: finding.category, notes }
    );

    return finding;
  }

  // --- DASHBOARD SUMMARY ---
  public async getDashboardSummary(storeId?: string) {
    const id = storeId || this.getActiveStoreId();
    const currentStore = this.stores.get(id);
    const orders = Array.from(this.orders.values()).filter(o => o.store_id === id);
    const products = Array.from(this.products.values()).filter(p => p.store_id === id);
    const findings = Array.from(this.findings.values()).filter(f => f.store_id === id);

    let totalGrossSales = 0;
    let totalDiscounts = 0;
    let totalShippingCharged = 0;
    let totalShippingExpense = 0;
    let totalRefunds = 0;
    let totalCogs = 0;

    orders.forEach(o => {
      totalGrossSales += Number(o.gross_sales) || 0;
      totalDiscounts += Number(o.discounts_total) || 0;
      totalShippingCharged += Number(o.shipping_charged) || 0;
      totalShippingExpense += Number(o.shipping_expense) || 0;
      totalRefunds += Number(o.total_refunded) || 0;
      totalCogs += Number(o.cogs_total) || 0;
    });

    const netSales = Math.max(0, totalGrossSales - totalDiscounts);
    const estimatedGrossProfit = roundCurrency(netSales - totalCogs);
    const estimatedMarginPct = netSales > 0 ? roundCurrency((estimatedGrossProfit / netSales) * 100) : 0;

    const openFindings = findings.filter(f => f.status === 'open');
    const totalPotentialLeakImpact = openFindings.reduce((acc, f) => acc + (f.estimated_financial_impact || 0), 0);
    const missingCostCount = products.filter(p => p.effective_cost === null).length;

    return {
      store: sanitizeStoreForClient(currentStore),
      activeMode: this.activeMode,
      metrics: {
        grossSales: roundCurrency(totalGrossSales),
        discounts: roundCurrency(totalDiscounts),
        netSales: roundCurrency(netSales),
        estimatedGrossProfit,
        estimatedMarginPct,
        ordersCount: orders.length,
        productsCount: products.length,
        openFindingsCount: openFindings.length,
        criticalFindingsCount: openFindings.filter(f => f.severity === 'critical').length,
        totalPotentialLeakImpact: roundCurrency(totalPotentialLeakImpact),
        missingCostCount,
        shippingDeficit: roundCurrency(Math.max(0, totalShippingExpense - totalShippingCharged)),
        totalRefunds: roundCurrency(totalRefunds)
      },
      categoryLeakBreakdown: {
        margin: roundCurrency(openFindings.filter(f => f.category === 'margin').reduce((acc, f) => acc + (f.estimated_financial_impact || 0), 0)),
        discount: roundCurrency(openFindings.filter(f => f.category === 'discount').reduce((acc, f) => acc + (f.estimated_financial_impact || 0), 0)),
        shipping: roundCurrency(openFindings.filter(f => f.category === 'shipping').reduce((acc, f) => acc + (f.estimated_financial_impact || 0), 0)),
        refund: roundCurrency(openFindings.filter(f => f.category === 'refund').reduce((acc, f) => acc + (f.estimated_financial_impact || 0), 0)),
        missing_cost: missingCostCount
      }
    };
  }

  // --- ALERTS ---
  public async getAlerts(storeId?: string) {
    const id = storeId || this.getActiveStoreId();
    return this.alerts.filter(a => a.store_id === id && a.status === 'active');
  }

  public async dismissAlert(alertId: string) {
    const a = this.alerts.find(item => item.id === alertId);
    if (a) a.status = 'reviewed';
    return a;
  }

  // --- AUDIT LOGS ---
  public async createAuditLog(
    storeId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: any
  ) {
    const log = {
      id: `audit-${Date.now()}`,
      store_id: storeId,
      user_id: 'merchant-demo-001',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details_json: details,
      created_at: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    return log;
  }

  public async getAuditLogs(storeId?: string, limit: number = 30) {
    const id = storeId || this.getActiveStoreId();
    return this.auditLogs.filter(l => l.store_id === id).slice(0, limit);
  }

  // --- ADMIN OPERATOR ---
  public async getAllStoresAdmin() {
    return Array.from(this.stores.values()).map(s => {
      const sanitized = sanitizeStoreForClient(s) || s;
      const pCount = Array.from(this.products.values()).filter(p => p.store_id === s.id).length;
      const oCount = Array.from(this.orders.values()).filter(o => o.store_id === s.id).length;
      const fCount = Array.from(this.findings.values()).filter(f => f.store_id === s.id && f.status === 'open').length;
      return {
        ...sanitized,
        productsCount: pCount,
        ordersCount: oCount,
        openFindingsCount: fCount
      };
    });
  }

  /**
   * Sync Real Shopify GraphQL Admin API data into DB
   */
  public async syncRealShopifyData(storeId: string, rawProducts: any[], rawOrders: any[]) {
    const store = this.stores.get(storeId);
    if (!store) throw new Error('Store not found');

    let discountsCount = 0;
    let fulfillmentsCount = 0;

    // 1. Process and save real products
    rawProducts.forEach(node => {
      const firstVariant = node.variants?.nodes?.[0];
      const shopifyCost = firstVariant?.inventoryItem?.unitCost?.amount
        ? Number(firstVariant.inventoryItem.unitCost.amount)
        : null;
      const price = Number(firstVariant?.price || 0);

      // Check for existing manual cost override
      const existingProduct = this.products.get(node.id);
      const overrideCost = existingProduct?.override_cost ?? null;
      const effectiveCost = overrideCost !== null ? overrideCost : shopifyCost;
      const marginPct = effectiveCost !== null && price > 0
        ? roundCurrency(((price - effectiveCost) / price) * 100)
        : null;

      this.products.set(node.id, {
        id: node.id,
        store_id: storeId,
        shopify_product_id: node.id,
        title: node.title,
        handle: node.handle || '',
        sku: firstVariant?.sku || '',
        price,
        shopify_cost: shopifyCost,
        override_cost: overrideCost,
        effective_cost: effectiveCost,
        margin_pct: marginPct,
        vendor: node.vendor || '',
        product_type: node.productType || '',
        inventory_quantity: node.totalInventory || 0
      });
    });

    // 2. Process and save real orders
    rawOrders.forEach(node => {
      const grossSales = Number(node.totalPriceSet?.shopMoney?.amount || 0);
      const discountsTotal = Number(node.totalDiscountsSet?.shopMoney?.amount || 0);
      const shippingCharged = Number(node.totalShippingPriceSet?.shopMoney?.amount || 0);
      const totalRefunded = Number(node.totalRefundedSet?.shopMoney?.amount || 0);

      if (discountsTotal > 0) discountsCount++;
      if (shippingCharged > 0) fulfillmentsCount++;

      // Compute COGS for line items
      let cogsTotal = 0;
      const lineItems = (node.lineItems?.nodes || []).map((item: any) => {
        const itemUnitCost = item.variant?.inventoryItem?.unitCost?.amount
          ? Number(item.variant.inventoryItem.unitCost.amount)
          : null;
        const itemQty = Number(item.quantity || 1);
        const itemPrice = Number(item.originalUnitPriceSet?.shopMoney?.amount || 0);

        if (itemUnitCost !== null) {
          cogsTotal += itemUnitCost * itemQty;
        }

        return {
          product_id: item.variant?.id,
          title: item.title,
          quantity: itemQty,
          unit_price: itemPrice,
          unit_cost: itemUnitCost
        };
      });

      const netSales = Math.max(0, grossSales - discountsTotal);
      const estimatedGrossProfit = roundCurrency(netSales - cogsTotal);
      const estimatedMarginPct = netSales > 0 ? roundCurrency((estimatedGrossProfit / netSales) * 100) : 0;

      this.orders.set(node.id, {
        id: node.id,
        store_id: storeId,
        shopify_order_id: node.id,
        order_number: node.name ? node.name.replace('#', '') : node.id.slice(-6),
        processed_at: node.processedAt || new Date().toISOString(),
        currency: node.totalPriceSet?.shopMoney?.currencyCode || 'USD',
        gross_sales: grossSales,
        discounts_total: discountsTotal,
        shipping_charged: shippingCharged,
        shipping_expense: 8.50, // Standard baseline assumption if carrier quote is external
        total_refunded: totalRefunded,
        cogs_total: roundCurrency(cogsTotal),
        net_sales: netSales,
        estimated_gross_profit: estimatedGrossProfit,
        estimated_margin_pct: estimatedMarginPct,
        items: lineItems
      });
    });

    store.last_sync_at = new Date().toISOString();
    this.stores.set(storeId, store);
    this.recomputeFindings(storeId);

    const counts = {
      productsCount: rawProducts.length,
      ordersCount: rawOrders.length,
      discountsCount,
      fulfillmentRecordsCount: fulfillmentsCount
    };

    this.createAuditLog(storeId, 'REAL_SHOPIFY_SYNC_COMPLETED', 'shopify_graphql', storeId, {
      ...counts,
      syncedAt: store.last_sync_at
    });

    return counts;
  }

  public async triggerManualSync(storeId: string) {
    const store = this.stores.get(storeId);
    if (!store) throw new Error('Store not found');

    const token = this.getDecryptedAccessToken(storeId);
    if (!store.is_demo && !token) {
      throw new Error(`Cannot synchronize: No active Shopify OAuth connection for store "${store.shop_name}". Please connect your store first.`);
    }

    store.last_sync_at = new Date().toISOString();
    this.stores.set(storeId, store);
    this.recomputeFindings(storeId);
    this.createAuditLog(storeId, 'MANUAL_SYNC_EXECUTED', 'sync', storeId, {
      status: 'success',
      isDemo: store.is_demo,
      timestamp: store.last_sync_at
    });

    return {
      status: store.is_demo ? 'demo_refresh' : 'success',
      isDemo: store.is_demo,
      last_sync_at: store.last_sync_at,
      message: store.is_demo
        ? 'Demo store data refreshed. (To sync real store data, connect your Shopify store).'
        : 'Store data synchronized successfully from Shopify.'
    };
  }

  public async updateStorePlan(storeId: string, plan: 'free' | 'pro' | 'business') {
    const store = this.stores.get(storeId);
    if (!store) throw new Error('Store not found');
    store.plan = plan;
    this.stores.set(storeId, store);
    this.createAuditLog(storeId, 'PLAN_UPDATED', 'subscription', storeId, { newPlan: plan });
    return store;
  }
}

export const db = new DatabaseManager();
