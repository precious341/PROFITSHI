/**
 * ProfitShield - Realistic Demo Store Seed Data
 * "The Artisan Roastery Co." - High quality coffee gear & specialty beans
 */

export const DEMO_STORE = {
  id: 'store-demo-001',
  merchant_id: 'merchant-demo-001',
  shopify_domain: 'the-artisan-roastery.myshopify.com',
  shop_name: 'The Artisan Roastery Co.',
  plan: 'full',
  plan_status: 'active',
  currency: 'USD',
  is_demo: true,
  installed_at: '2026-08-15T10:00:00Z',
  last_sync_at: new Date(Date.now() - 14 * 60 * 1000).toISOString() // 14 mins ago
};

export const DEMO_SETTINGS = {
  id: 'settings-demo-001',
  store_id: 'store-demo-001',
  target_gross_margin_pct: 55.0,
  low_margin_threshold_pct: 35.0,
  high_loss_threshold_amt: 80.0,
  default_shipping_cost_est: 8.50,
  alert_email_enabled: false
};

export const DEMO_PRODUCTS = [
  {
    id: 'prod-001',
    store_id: 'store-demo-001',
    shopify_product_id: 'gid://shopify/Product/84019201',
    title: 'Precision Temperature Gooseneck Electric Kettle 1.0L',
    handle: 'precision-gooseneck-electric-kettle',
    sku: 'KTL-EL-BLK-01',
    price: 135.00,
    shopify_cost: 62.00,
    override_cost: null,
    vendor: 'BrewCraft Tech',
    product_type: 'Brewing Equipment',
    inventory_quantity: 42
  },
  {
    id: 'prod-002',
    store_id: 'store-demo-001',
    shopify_product_id: 'gid://shopify/Product/84019202',
    title: 'Ethiopian Yirgacheffe Single-Origin Whole Bean (340g)',
    handle: 'ethiopian-yirgacheffe-single-origin',
    sku: 'COF-ETH-340G',
    price: 24.00,
    shopify_cost: 8.50,
    override_cost: null,
    vendor: 'Artisan Roastery',
    product_type: 'Coffee Beans',
    inventory_quantity: 180
  },
  {
    id: 'prod-003',
    store_id: 'store-demo-001',
    shopify_product_id: 'gid://shopify/Product/84019203',
    title: 'Double-Walled Borosilicate Glass Coffee Server 600ml',
    handle: 'double-walled-glass-server',
    sku: 'SRV-GLS-600',
    price: 36.00,
    shopify_cost: 26.50, // Only 26.4% margin - Critically Low Margin!
    override_cost: null,
    vendor: 'ClearBrew Labs',
    product_type: 'Drinkware',
    inventory_quantity: 28
  },
  {
    id: 'prod-004',
    store_id: 'store-demo-001',
    shopify_product_id: 'gid://shopify/Product/84019204',
    title: 'Titanium Coated Conical Burr Hand Grinder',
    handle: 'titanium-conical-burr-hand-grinder',
    sku: 'GRN-MAN-TIT',
    price: 89.00,
    shopify_cost: null, // MISSING COST!
    override_cost: null,
    vendor: 'Millstone Goods',
    product_type: 'Grinders',
    inventory_quantity: 15
  },
  {
    id: 'prod-005',
    store_id: 'store-demo-001',
    shopify_product_id: 'gid://shopify/Product/84019205',
    title: 'Colombian Geisha Limited Reserve (250g Tin)',
    handle: 'colombian-geisha-limited-reserve',
    sku: 'COF-COL-GSH-250',
    price: 45.00,
    shopify_cost: 16.00,
    override_cost: null,
    vendor: 'Artisan Roastery',
    product_type: 'Coffee Beans',
    inventory_quantity: 65
  },
  {
    id: 'prod-006',
    store_id: 'store-demo-001',
    shopify_product_id: 'gid://shopify/Product/84019206',
    title: 'Sub-Gram Digital Espresso Precision Scale with Timer',
    handle: 'espresso-precision-scale-timer',
    sku: 'SCL-DIG-EXP',
    price: 52.00,
    shopify_cost: 38.00, // 26.9% margin - Low Margin
    override_cost: null,
    vendor: 'BrewCraft Tech',
    product_type: 'Accessories',
    inventory_quantity: 20
  },
  {
    id: 'prod-007',
    store_id: 'store-demo-001',
    shopify_product_id: 'gid://shopify/Product/84019207',
    title: 'Organic Unbleached Cone Paper Filters Size 02 (100pk)',
    handle: 'cone-paper-filters-02-100pk',
    sku: 'FLT-02-100',
    price: 9.50,
    shopify_cost: 2.10,
    override_cost: null,
    vendor: 'CleanFlow',
    product_type: 'Filters',
    inventory_quantity: 340
  },
  {
    id: 'prod-008',
    store_id: 'store-demo-001',
    shopify_product_id: 'gid://shopify/Product/84019208',
    title: 'Ceramic Dripper & Pour Over Stand Set - Matte Slate',
    handle: 'ceramic-dripper-stand-slate',
    sku: 'DRP-SET-SLT',
    price: 68.00,
    shopify_cost: null, // MISSING COST!
    override_cost: null,
    vendor: 'Artisan Clayworks',
    product_type: 'Brewing Equipment',
    inventory_quantity: 12
  }
];

export const DEMO_ORDERS = [
  {
    id: 'ord-1048',
    store_id: 'store-demo-001',
    shopify_order_id: 'gid://shopify/Order/91028301',
    order_number: '1048',
    processed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago
    currency: 'USD',
    gross_sales: 159.00,
    discounts_total: 45.00, // 28.3% discount leak!
    shipping_charged: 0.00, // Free shipping given
    shipping_expense: 14.50, // Heavy shipping eaten!
    total_refunded: 0.00,
    cogs_total: 70.50,
    net_sales: 114.00,
    estimated_gross_profit: 43.50,
    estimated_margin_pct: 38.16,
    items: [
      { product_id: 'prod-001', title: 'Precision Gooseneck Electric Kettle', quantity: 1, unit_price: 135.00, unit_cost: 62.00 },
      { product_id: 'prod-002', title: 'Ethiopian Yirgacheffe (340g)', quantity: 1, unit_price: 24.00, unit_cost: 8.50 }
    ]
  },
  {
    id: 'ord-1047',
    store_id: 'store-demo-001',
    shopify_order_id: 'gid://shopify/Order/91028302',
    order_number: '1047',
    processed_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    currency: 'USD',
    gross_sales: 90.00,
    discounts_total: 0.00,
    shipping_charged: 6.99,
    shipping_expense: 7.20,
    total_refunded: 0.00,
    cogs_total: 32.00,
    net_sales: 90.00,
    estimated_gross_profit: 58.00,
    estimated_margin_pct: 64.44,
    items: [
      { product_id: 'prod-005', title: 'Colombian Geisha Limited Reserve', quantity: 2, unit_price: 45.00, unit_cost: 16.00 }
    ]
  },
  {
    id: 'ord-1046',
    store_id: 'store-demo-001',
    shopify_order_id: 'gid://shopify/Order/91028303',
    order_number: '1046',
    processed_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    currency: 'USD',
    gross_sales: 135.00,
    discounts_total: 0.00,
    shipping_charged: 0.00,
    shipping_expense: 12.00,
    total_refunded: 135.00, // Fully refunded!
    cogs_total: 62.00,
    net_sales: 0.00,
    estimated_gross_profit: -74.00, // Deficit!
    estimated_margin_pct: 0.00,
    items: [
      { product_id: 'prod-001', title: 'Precision Gooseneck Electric Kettle', quantity: 1, unit_price: 135.00, unit_cost: 62.00, is_refunded: true, restocked: false }
    ]
  },
  {
    id: 'ord-1045',
    store_id: 'store-demo-001',
    shopify_order_id: 'gid://shopify/Order/91028304',
    order_number: '1045',
    processed_at: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    currency: 'USD',
    gross_sales: 72.00,
    discounts_total: 15.00,
    shipping_charged: 5.00,
    shipping_expense: 11.80, // Shipping leak: charged $5, carrier cost $11.80
    total_refunded: 0.00,
    cogs_total: 53.00,
    net_sales: 57.00,
    estimated_gross_profit: 4.00, // Only $4 profit on $72 order
    estimated_margin_pct: 7.02,
    items: [
      { product_id: 'prod-003', title: 'Double-Walled Glass Server', quantity: 2, unit_price: 36.00, unit_cost: 26.50 }
    ]
  },
  {
    id: 'ord-1044',
    store_id: 'store-demo-001',
    shopify_order_id: 'gid://shopify/Order/91028305',
    order_number: '1044',
    processed_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    currency: 'USD',
    gross_sales: 89.00,
    discounts_total: 0.00,
    shipping_charged: 8.50,
    shipping_expense: 8.50,
    total_refunded: 0.00,
    cogs_total: 0.00, // Missing COGS on hand grinder
    net_sales: 89.00,
    estimated_gross_profit: 89.00,
    estimated_margin_pct: 100.00, // Artificial because cost is missing!
    items: [
      { product_id: 'prod-004', title: 'Titanium Hand Grinder', quantity: 1, unit_price: 89.00, unit_cost: null }
    ]
  },
  {
    id: 'ord-1043',
    store_id: 'store-demo-001',
    shopify_order_id: 'gid://shopify/Order/91028306',
    order_number: '1043',
    processed_at: new Date(Date.now() - 65 * 3600 * 1000).toISOString(),
    currency: 'USD',
    gross_sales: 57.50,
    discounts_total: 5.00,
    shipping_charged: 7.50,
    shipping_expense: 6.80,
    total_refunded: 0.00,
    cogs_total: 19.10,
    net_sales: 52.50,
    estimated_gross_profit: 33.40,
    estimated_margin_pct: 63.62,
    items: [
      { product_id: 'prod-002', title: 'Ethiopian Yirgacheffe (340g)', quantity: 2, unit_price: 24.00, unit_cost: 8.50 },
      { product_id: 'prod-007', title: 'Cone Paper Filters 02', quantity: 1, unit_price: 9.50, unit_cost: 2.10 }
    ]
  }
];

export const DEMO_AUDIT_LOGS = [
  {
    id: 'audit-001',
    store_id: 'store-demo-001',
    user_id: 'merchant-demo-001',
    action: 'STORE_SYNC_COMPLETED',
    resource_type: 'shopify_sync',
    resource_id: 'sync-run-842',
    details_json: { products: 8, orders: 6, durationMs: 1420 },
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString()
  },
  {
    id: 'audit-002',
    store_id: 'store-demo-001',
    user_id: 'merchant-demo-001',
    action: 'MARGIN_TARGET_UPDATED',
    resource_type: 'margin_settings',
    resource_id: 'settings-demo-001',
    details_json: { targetMargin: 55.0, lowMarginThreshold: 35.0 },
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  }
];
