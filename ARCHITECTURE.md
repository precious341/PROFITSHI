# ProfitShield — Architecture & System Design Documentation

## 1. Architectural Philosophy

ProfitShield is architected for:
1. **High Code Maintainability & Modularity**: Separation of database queries, deterministic calculation engines, Express routes, and React presentation components.
2. **Deterministic Financial Math**: Zero reliance on non-deterministic AI completions for numerical computations. Every dollar figure has a traceable calculation formula.
3. **Multi-Tenant Store Isolation**: Every database table includes a `store_id` foreign key. Cross-store data leakage is prevented at both the database and routing middleware levels.
4. **Dual Database Engine Strategy**: PostgreSQL client (`pg`) connects automatically when `DATABASE_URL` is set; seamlessly falls back to an embedded in-memory store in local dev/demo preview.
5. **Transfer-Ready Independence**: Zero hardcoded personal keys, accounts, or proprietary vendor locks.

---

## 2. Directory Layout

```
profitshield/
├── migrations/
│   └── 001_initial_schema.sql     # PostgreSQL migration script with indexes & foreign keys
├── server/
│   ├── db/
│   │   ├── index.ts               # Dual-engine database abstraction
│   │   └── seedData.ts            # Realistic demo store seed dataset
│   ├── engine/
│   │   ├── calculations.ts        # Pure, tested financial calculations
│   │   └── leakFinder.ts          # Profit Leak Finder rule engine
│   ├── middleware/
│   │   ├── auth.ts                # JWT authentication & session token validation
│   │   └── entitlements.ts        # Server-side plan gating (Free, Pro, Business)
│   ├── routes/
│   │   ├── admin.ts               # Operator admin area & tenant registry
│   │   ├── alerts.ts              # Margin threshold rules & alert feed
│   │   ├── auth.ts                # User registration & login
│   │   ├── billing.ts             # Shopify App Pricing & demo tier switcher
│   │   ├── dashboard.ts           # Executive summary KPI aggregation
│   │   ├── findings.ts            # Profit Leak Finder query & status updates
│   │   ├── orders.ts              # Order profitability & deep dive analytics
│   │   ├── products.ts            # Product margin auditing & cost override CRUD
│   │   └── shopify.ts             # OAuth, GraphQL Admin API & GDPR webhooks
│   └── services/
│       └── shopifyService.ts      # GraphQL queries, HMAC verification, OAuth URLs
├── src/
│   ├── components/                # Modular UI components (StatCards, Badges, Modals)
│   ├── context/
│   │   └── AppContext.tsx         # Central application state & API hooks
│   ├── lib/
│   │   ├── api.ts                 # Typed frontend fetch client
│   │   ├── formatters.ts          # Currency, percentage & date formatting
│   │   └── pdfGenerator.ts        # Client-side executive PDF report compiler
│   ├── pages/                     # Complete application pages & marketing view
│   ├── App.tsx                    # Main layout with responsive sidebar
│   ├── index.css                  # Tailwind CSS styling
│   └── main.tsx                   # Client bootstrap entry point
├── test/
│   ├── calculations.test.ts       # Vitest calculation unit tests
│   ├── leakFinder.test.ts         # Diagnostic rule engine tests
│   └── api.test.ts                # Supertest Express endpoint integration tests
├── .env.example                   # Parameterized environment configuration
├── package.json                   # Dependencies and npm scripts
└── server.ts                      # Full-stack Express + Vite server entry point
```

---

## 3. Database Schema Entity Relationships

- **merchants**: Application operators & merchant user accounts.
- **stores**: Shopify domain, encrypted access token, installed plan tier, last sync time.
- **products**: Synced Shopify items, price, SKU, vendor, Shopify inventory cost.
- **cost_overrides**: Merchant-entered COGS assumptions with timestamp and updated-by audit.
- **cost_history**: Immutable change log of cost modifications.
- **orders**: Transaction gross sales, discounts, freight, refunds, net profit, margin %.
- **order_line_items**: Individual item quantities, unit prices, unit costs, return flags.
- **profit_findings**: Diagnostic issues with category, severity, formula explanation, evidence JSON, and resolution notes.
- **margin_settings**: Tenant-level target margin, low margin alert threshold, and default shipping cost assumptions.
- **audit_logs**: Immutable trail of user and synchronization events.
