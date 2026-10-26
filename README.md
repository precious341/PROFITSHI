# ProfitShield — Shopify Profit Protection & Margin Analytics

> Complete, production-ready Shopify application engineered to uncover margin erosion, discount leakage, courier freight deficits, and unrecovered refund losses with deterministic mathematics.

---

## 1. Product Overview

ProfitShield helps Shopify e-commerce merchants protect profitability across catalog inventory and incoming orders. Its differentiator is the **Profit Leak Finder**, an automated rule engine that identifies potential margin hazards, transparently displays the underlying math and evidence facts, and suggests specific corrective actions.

### Core Capabilities
- **Profit Leak Finder**: Identifies margin degradation, coupon leakage, subsidized shipping, and unrecovered returns.
- **Product Cost (COGS) Manager**: Allows merchants to enter and maintain unit cost assumptions. Merchant overrides are protected from being overwritten by routine syncs.
- **Order Profitability Auditing**: Computes realized gross profit per order after subtracting allocated discounts, freight fees, and returns.
- **Financial Deep Dives**: Dedicated analysis for Discount Impact, Carrier Shipping Deficits, and Refund Losses.
- **Threshold Alerts**: Configurable margin benchmarks with in-app notifications.
- **Executive PDF Reporting**: Boardroom-ready PDF reports with methodology summaries for business partners and buyers.
- **Multi-Tenant Architecture**: Complete tenant isolation, PostgreSQL schema migrations, and role-based access checks.
- **Shopify API 2024-10 Ready**: GraphQL Admin API client, App Bridge session validation, and mandatory GDPR webhooks.

---

## 2. Technology Stack

- **Frontend**: React 19, JavaScript/TypeScript, Vite, Tailwind CSS v4, Lucide React icons.
- **Backend**: Node.js, Express, ES Modules.
- **Database**: PostgreSQL (standard connection via `DATABASE_URL`) with an automatic dual-engine in-memory fallback for local preview and instant testing.
- **Shopify Framework**: Shopify GraphQL Admin API 2024-10, Shopify OAuth, App Bridge session tokens, and Shopify App Billing API (`appSubscriptionCreate`).
- **Testing**: Vitest for deterministic calculation unit tests; Supertest for Express backend integration tests.

---

## 3. Quick Start & Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn
- Optional: Local PostgreSQL instance (or use the built-in dual-engine in-memory fallback)

### Installation
```bash
# Clone repository and enter directory
cd profitshield

# Install all dependencies
npm install

# Copy environment variables template
cp .env.example .env
```

### Running the Application
```bash
# Start full-stack development server (Express + Vite on port 3000)
npm run dev

# Run automated test suites (27+ tests covering all formulas & endpoints)
npm test

# Build production bundle
npm run build

# Start production server
npm run start
```

Open `http://localhost:3000` in your browser. The application will start in **Demo Store Mode** pre-loaded with realistic e-commerce data for "The Artisan Roastery Co."

---

## 4. Environment Variables Reference

See `.env.example` for the complete documented list:

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Web server listening port | `3000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/profitshield_db` |
| `JWT_SECRET` | Secret key for session tokens | `32+ character random string` |
| `SHOPIFY_API_KEY` | Shopify Partner App Client ID | Obtained from Shopify Partner Dashboard |
| `SHOPIFY_API_SECRET` | Shopify Partner App Secret | Obtained from Shopify Partner Dashboard |
| `SHOPIFY_APP_URL` | Production public URL (HTTPS) | `https://your-domain.com` |
| `SHOPIFY_API_VERSION`| Shopify Admin API version | `2024-10` |

---

## 5. Mathematical Calculation Engine

ProfitShield calculates financial figures deterministically without paid AI dependencies:

1. **Net Sales**:
   $$\text{Net Sales} = \text{Gross Sales} - \text{Line Item Discounts} - \text{Order Adjustments}$$
2. **Estimated Gross Profit**:
   $$\text{Gross Profit} = \text{Net Sales} - \text{COGS}$$
3. **Estimated Gross Margin Percentage**:
   $$\text{Margin \%} = \left(\frac{\text{Gross Profit}}{\text{Net Sales}}\right) \times 100$$
4. **Shipping Cost Deficit**:
   $$\text{Freight Deficit} = \max(0, \text{Carrier Expense} - \text{Customer Shipping Charged})$$
5. **Refund Loss**:
   $$\text{Total Loss} = \text{Cash Refund} + (\text{IsRestocked} ? 0 : \text{Unit COGS})$$

---

## 6. Software Sale & Handover

This codebase is clean, parameterized, and fully transferable as a standalone software product. For buyer setup instructions and Partner Dashboard configuration, consult:
- `BUYER_SETUP_GUIDE.md` — Complete buyer transfer, external services audit, and deployment guide.
- `ARCHITECTURE.md` — Detailed system and database schema design.
- `SHOPIFY_SETUP.md` — Step-by-step Shopify Partner App configuration.
- `HANDOVER_CHECKLIST.md` — Verification checklist for acquiring software owners.
