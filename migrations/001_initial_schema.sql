-- ==============================================================================
-- ProfitShield - Migration 001: Initial PostgreSQL Schema
-- Production-ready schema with multi-tenant store isolation, indices, & audit logs
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Merchants & Application Accounts
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'merchant' CHECK (role IN ('merchant', 'admin', 'operator')),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Connected Shopify Stores
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
    shopify_domain VARCHAR(255) UNIQUE NOT NULL,
    shop_name VARCHAR(255) NOT NULL,
    access_token_encrypted TEXT,
    scopes VARCHAR(500),
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
    plan_status VARCHAR(50) DEFAULT 'active' CHECK (plan_status IN ('active', 'cancelled', 'frozen', 'trialing')),
    currency VARCHAR(10) DEFAULT 'USD',
    is_demo BOOLEAN DEFAULT FALSE,
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Merchant Margin Settings & Loss Thresholds
CREATE TABLE IF NOT EXISTS margin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    target_gross_margin_pct NUMERIC(5, 2) DEFAULT 55.00,
    low_margin_threshold_pct NUMERIC(5, 2) DEFAULT 30.00,
    high_loss_threshold_amt NUMERIC(10, 2) DEFAULT 100.00,
    default_shipping_cost_est NUMERIC(10, 2) DEFAULT 8.50,
    alert_email_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_store_margin_settings UNIQUE(store_id)
);

-- 4. Synced Store Products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shopify_product_id VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    handle VARCHAR(255),
    sku VARCHAR(100),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shopify_cost NUMERIC(10, 2), -- Cost of goods from Shopify inventory item
    vendor VARCHAR(255),
    product_type VARCHAR(255),
    inventory_quantity INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_store_shopify_product UNIQUE(store_id, shopify_product_id)
);

-- 5. Merchant Cost Overrides & Audit Trail
CREATE TABLE IF NOT EXISTS cost_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    override_cost NUMERIC(10, 2) NOT NULL,
    source VARCHAR(50) DEFAULT 'merchant_manual' CHECK (source IN ('shopify_sync', 'merchant_manual', 'csv_import')),
    updated_by VARCHAR(255),
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_store_product_override UNIQUE(store_id, product_id)
);

CREATE TABLE IF NOT EXISTS cost_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    previous_cost NUMERIC(10, 2),
    new_cost NUMERIC(10, 2) NOT NULL,
    source VARCHAR(50) NOT NULL,
    updated_by VARCHAR(255),
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Store Orders & Line Items
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shopify_order_id VARCHAR(100),
    order_number VARCHAR(100) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    gross_sales NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discounts_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shipping_charged NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shipping_expense NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_refunded NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cogs_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_sales NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estimated_gross_profit NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estimated_margin_pct NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_store_shopify_order UNIQUE(store_id, shopify_order_id)
);

CREATE TABLE IF NOT EXISTS order_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    shopify_line_item_id VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(10, 2),
    discount_allocated NUMERIC(10, 2) DEFAULT 0.00,
    is_refunded BOOLEAN DEFAULT FALSE,
    restocked BOOLEAN DEFAULT FALSE
);

-- 7. Refunds
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    shopify_refund_id VARCHAR(100),
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    restocked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Profit Leak Finder Findings
CREATE TABLE IF NOT EXISTS profit_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    finding_key VARCHAR(100) NOT NULL,
    title VARCHAR(300) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('margin', 'discount', 'shipping', 'refund', 'missing_cost')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    estimated_financial_impact NUMERIC(10, 2),
    calculation_explanation TEXT NOT NULL,
    evidence_json JSONB,
    recommended_action TEXT NOT NULL,
    confidence_level VARCHAR(20) DEFAULT 'high' CHECK (confidence_level IN ('high', 'medium', 'low', 'incomplete_data')),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Margin Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES profit_findings(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Sync Logs & Audit Records
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    items_synced INT DEFAULT 0,
    error_message TEXT,
    duration_ms INT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    details_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid query response and multi-tenant performance
CREATE INDEX IF NOT EXISTS idx_stores_merchant_id ON stores(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_processed_at ON orders(processed_at);
CREATE INDEX IF NOT EXISTS idx_profit_findings_store_status ON profit_findings(store_id, status);
CREATE INDEX IF NOT EXISTS idx_profit_findings_category ON profit_findings(category);
CREATE INDEX IF NOT EXISTS idx_profit_findings_severity ON profit_findings(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_store_status ON alerts(store_id, status);
