# ProfitShield — Buyer Transfer & Setup Guide

> **Product**: ProfitShield — Standalone Shopify Profit & Margin Protection Platform  
> **Licensing / Ownership**: Single-Buyer Full Software Product Purchase (One-Time Payment, 100% Source Code Ownership)  
> **Architecture**: Node.js / Express backend with React 19 / TypeScript frontend, deterministic profit leak engine, and Shopify GraphQL Admin API 2024-10 integration.

---

## 1. Executive Summary & Architecture Overview

ProfitShield is sold as a complete, self-hosted software product. It does **not** rely on recurring developer SaaS subscriptions, third-party AI token fees, or external black-box calculation APIs.

- **Zero Vendor Lock-In**: You own the entire application codebase and can host it on your own cloud infrastructure (Render, Railway, Fly.io, Google Cloud Run, AWS ECS, Heroku, or any Linux VPS).
- **Security & Privacy**: All Shopify OAuth exchanges, API keys, client secrets, and access tokens are managed exclusively on the backend. No secrets or tokens are ever exposed to the client browser or frontend bundles.
- **Dual Storage Engine**: Operates with an in-memory/embedded store for zero-config evaluation and immediate local startup, and connects seamlessly to any PostgreSQL database (AWS RDS, Neon, Supabase, Cloud SQL) for persistent multi-store production deployments.
- **Shopify 2024-10 Ready**: Native Shopify GraphQL Admin API queries for variant inventory, cost-of-goods-sold (COGS), order line items, discounts, freight, and fulfillment statuses.

---

## 2. External Dependencies Audit

Before deploying your software into production, verify the following external accounts and services:

| Dependency | Purpose | Cost / Tier | Required For |
|---|---|---|---|
| **Node.js (v18+ or v20+)** | Server and build runtime | Free / Open Source | Local dev & production hosting |
| **Shopify Partner Account** | Creating and managing your Shopify App credentials | Free at [partners.shopify.com](https://partners.shopify.com) | Live Shopify OAuth & Admin API access |
| **PostgreSQL 14+** (Optional) | Persistent relational database storage | Free tier available (Neon, Supabase, Render Postgres) | Production persistence (memory fallback included) |
| **HTTPS Domain / Reverse Proxy** | SSL endpoint required by Shopify App security standards | Free (Render, Railway, Cloud Run provide automatic HTTPS) | Shopify OAuth redirection |

---

## 3. Environment Variables Specification

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

### Complete Variable Reference

| Variable Name | Description | Default / Example Value | Mandatory? |
|---|---|---|---|
| `PORT` | Listening port for Express web server | `3000` | No (defaults to 3000) |
| `NODE_ENV` | Runtime environment mode | `production` (or `development`) | No |
| `APP_URL` | Public HTTPS domain where ProfitShield is hosted | `https://your-profitshield-domain.com` | **Yes for Live OAuth** |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/profitshield_db` | Optional (uses memory store if omitted) |
| `SESSION_SECRET` | Secret key used for session encryption | 32+ character random hexadecimal string | Yes |
| `JWT_SECRET` | Secret key used for JWT authentication tokens | 32+ character random hexadecimal string | Yes |
| `SHOPIFY_API_KEY` | Shopify Partner App Client ID | Obtained from Shopify Partner Dashboard | **Yes for Live OAuth** |
| `SHOPIFY_API_SECRET`| Shopify Partner App Client Secret | Obtained from Shopify Partner Dashboard | **Yes for Live OAuth** |
| `SHOPIFY_API_VERSION`| Valid Shopify Admin API version | `2024-10` (or `2025-01`, `2026-10`) | No (defaults to 2024-10) |
| `SHOPIFY_SCOPES` | Permissions requested during OAuth install | `read_products,read_orders,read_inventory,read_fulfillments,read_price_rules,read_discounts` | No (defaults to read scopes) |
| `DEMO_MODE_ENABLED` | Toggles whether Demo Store mode is accessible | `true` | No |

---

## 4. Step-by-Step Shopify Partner App Configuration

Follow these steps in your Shopify Partner Dashboard to link your app:

### Step 1: Create the App
1. Log in to [Shopify Partner Dashboard](https://partners.shopify.com).
2. Go to **Apps** &rarr; **Create App** &rarr; **Create app manually**.
3. Set the App Name to **ProfitShield** (or your own custom brand name).

### Step 2: Configure App URLs
In your App Dashboard, navigate to **App Setup** &rarr; **URLs**:
1. **App URL**:
   ```
   https://your-profitshield-domain.com
   ```
2. **Allowed redirection URL(s)** (OAuth Callback):
   ```
   https://your-profitshield-domain.com/api/shopify/callback
   ```
   *(Note: In Google AI Studio preview, copy the exact dynamic URL shown on the in-app Shopify Settings page).*

### Step 3: Register Mandatory GDPR Webhooks
Shopify requires compliance endpoints for privacy review. Enter these under **App Setup** &rarr; **Compliance webhooks**:
- **Customer data request endpoint**:
  `https://your-profitshield-domain.com/api/shopify/webhooks/customers/data_request`
- **Customer data erasure endpoint**:
  `https://your-profitshield-domain.com/api/shopify/webhooks/customers/redact`
- **Shop data erasure endpoint**:
  `https://your-profitshield-domain.com/api/shopify/webhooks/shop/redact`

### Step 4: Retrieve Credentials
1. Under **App Setup** &rarr; **Client credentials**, copy:
   - **Client ID** &rarr; Set as `SHOPIFY_API_KEY`
   - **Client Secret** &rarr; Set as `SHOPIFY_API_SECRET`
2. You can also enter these directly in the running ProfitShield UI under **Shopify Settings &rarr; Shopify Configuration Page** and click **Save Settings**.

---

## 5. Connecting Your Store (Development or Production)

### Connecting via the In-App Interface
1. Launch ProfitShield and open **Shopify Settings** from the sidebar.
2. In the **Shopify Configuration Page** tab:
   - Enter your store domain (e.g., `my-store.myshopify.com`).
   - Enter your Client ID and Client Secret.
   - Click **Test Connection** to confirm connectivity.
   - Click **Save Settings**.
3. In the **Connection & Status** tab:
   - Ensure the Operating Store Mode is set to **Live Shopify Store**.
   - Click **Connect Shopify Store**.
4. The official Shopify authorization window will open. Click **Install app** / **Authorize**.
5. Once approved, the window automatically exchanges the token and verifies the store name and currency with a live Admin GraphQL query.
6. The status changes to **CONNECTED (OAuth Live)** and product/order records begin synchronization.

---

## 6. Database Deployment & Migrations (PostgreSQL)

If using PostgreSQL for production multi-tenant persistence:

1. Provision a database instance on your cloud provider of choice (e.g. AWS RDS, Neon, Supabase, Railway).
2. Run the provided idempotent SQL migration file:
   ```bash
   psql "$DATABASE_URL" -f migrations/001_initial_schema.sql
   ```
3. Set `DATABASE_URL` in your `.env` or cloud container environment variables.
4. Restart the server. ProfitShield will automatically log:
   ```
   [ProfitShield DB] Connected to PostgreSQL instance via DATABASE_URL
   ```

---

## 7. Recommended Production Hosting Platforms

You can deploy ProfitShield as a single full-stack container or Node.js service:

### Option A: Render / Railway / Fly.io (Easiest)
1. Push repository to private GitHub repo.
2. Connect to Render as a **Web Service** (Environment: `Node`).
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. Configure environment variables in dashboard (`APP_URL`, `DATABASE_URL`, `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`).

### Option B: Docker / Cloud Run / AWS ECS
Build a Docker image with Node.js 20 Alpine:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 8. Verification & Testing Checklist for the Buyer

Before presenting or operating the platform, execute these verification commands:

```bash
# 1. Run all unit and integration tests (36 automated tests)
npm test

# 2. Check TypeScript types and compilation
npm run lint

# 3. Test production bundle build
npm run build
```

Expected output: All 36 tests pass with zero errors.

---

## 9. Seller Preparation & Package Handover Checklist

For the seller packaging this software for one-time sale to the buyer:

1. **Verify No Personal Credentials**:
   - Confirm `.env` does not contain personal Shopify Client IDs, Client Secrets, or production passwords. (The repository includes only `.env.example` with standard parameter placeholders).
   - The app starts in **Demo Mode** by default with sample mock data (`the-artisan-roastery.myshopify.com`). You do **not** need to connect your personal Shopify store before selling.
2. **Bundle the Source Code**:
   - Clean the repository:
     ```bash
     # Remove build artifacts and dependencies before zipping
     rm -rf node_modules dist
     ```
   - Archive the project files:
     ```bash
     zip -r profitshield-software-package.zip . -x "*.git*" "*node_modules*" "*.env" "*dist*"
     ```
3. **Delivery to Buyer**:
   - Deliver `profitshield-software-package.zip` (or grant private git repository access).
   - Point the buyer to `BUYER_SETUP_GUIDE.md` and `HANDOVER_CHECKLIST.md`.
4. **Buyer First Run Experience**:
   - The buyer unpacks the files, runs `npm install`, and starts the server with `npm run dev`.
   - The app boots immediately into **Demo Mode** showing simulated store metrics and profit leak audits.
   - When ready to connect their store, the buyer navigates to **Settings &rarr; Shopify Configuration** and enters their own credentials from [partners.shopify.com](https://partners.shopify.com).

