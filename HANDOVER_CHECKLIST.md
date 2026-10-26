# ProfitShield — Buyer Handover & Transfer Checklist

This checklist confirms the technical readiness of ProfitShield for acquisition, operation, and commercial deployment by the single buyer as a complete standalone software product.

---

## Technical & Legal Transfer Verification

- [x] **Zero Personal Dependencies**: The codebase contains zero hardcoded personal developer API keys, passwords, private emails, or personal third-party cloud accounts.
- [x] **Single-Buyer Software Product**: Designed and packaged for sale as a complete software product (one-time purchase). All recurring subscription tiers, billing checkouts, and customer plan upgrade paywalls have been completely removed.
- [x] **100% Unmetered Feature Access**: All diagnostic features (unlimited leak audits, discount impact deep-dives, shipping deficit analysis, refund audits, alerts, and PDF export) are fully unlocked for the software owner.
- [x] **Clean Configuration**: All operational parameters, database URLs, and Shopify credentials are parameterized in `.env.example` and editable in the runtime settings interface.
- [x] **Deterministic Calculation Logic**: Calculations for Net Sales, COGS, Gross Margin %, Freight Deficits, and Refunds use pure TypeScript algorithms with zero external AI API costs.
- [x] **Comprehensive Automated Tests**: 36 automated unit, integration, and security tests covering all financial formulas, backend routes, and token encryption pass cleanly with `npm test`.
- [x] **Production PostgreSQL Migrations**: `migrations/001_initial_schema.sql` provides production-grade tables, foreign keys, indexes, and UUID generation.
- [x] **Zero-Config Demo Mode**: In the absence of a live database or Shopify credentials, the app runs cleanly in high-fidelity demo mode with realistic sample store records, clearly labeled as simulated data.
- [x] **Shopify App Store & Partner Compliance**: Mandatory GDPR privacy webhooks (`customers/data_request`, `customers/redact`, `shop/redact`) and `app/uninstalled` handlers are implemented.
- [x] **No Invented Financial Data**: Missing costs are honestly flagged as `incomplete_data` rather than generating false profit numbers. Real Shopify data is only synchronized after authenticated OAuth connection.
- [x] **Client-Side PDF Reporting**: Boardroom PDF report generator using `jspdf` executes with zero server rendering dependencies.
- [x] **Secure Credential Storage**: Client secret is masked and never exposed to browser bundles, frontend environment variables, or localStorage.

---

## Instructions for the Buyer

1. **Host Environment**: Deploy the app on any Node.js hosting platform (Heroku, Render, AWS ECS, Google Cloud Run, Fly.io, Railway, DigitalOcean).
2. **Database (Optional)**: Provision a PostgreSQL instance (e.g. AWS RDS, Neon, Supabase, Cloud SQL) and run:
   ```bash
   psql "$DATABASE_URL" -f migrations/001_initial_schema.sql
   ```
3. **Shopify Partners**: Create a Partner App following `SHOPIFY_SETUP.md` and populate `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` in `.env` (or via the Settings UI).
4. **Domain & SSL**: Assign your custom domain and ensure HTTPS is configured (required by Shopify OAuth).
5. **Connect & Audit**: Use the in-app "Connect Shopify Store" button to authenticate and audit your store profitability.
