# Shopify Partner App Configuration Guide

> Dedicated setup instructions for the software buyer to configure their own Shopify Partner App and connect their store to ProfitShield.

---

## 1. Create a Shopify Partner Account

1. Go to [partners.shopify.com](https://partners.shopify.com) and create or log into your Partner account.
2. Navigate to **Apps** &rarr; **Create App** &rarr; **Create app manually**.
3. Name your app **ProfitShield** (or your preferred store tool name).

---

## 2. Configure App Credentials & URLs

In your app dashboard under **App setup**:
1. Copy your **Client ID** and set it as `SHOPIFY_API_KEY` in your `.env` file (or enter it in the ProfitShield Settings UI).
2. Copy your **Client Secret** and set it as `SHOPIFY_API_SECRET` in your `.env` file (or enter it in the ProfitShield Settings UI).
3. Set **App URL**: `https://your-domain.com` (or your cloud hosting URL).
4. Set **Allowed redirection URL(s)**:
   ```
   https://your-domain.com/api/shopify/callback
   ```

---

## 3. Configure Required Access Scopes

ProfitShield requires strictly read scopes to calculate margins and financial analytics without modifying your catalog or orders:
- `read_products`
- `read_orders`
- `read_inventory`
- `read_fulfillments`
- `read_discounts`
- `read_price_rules`

---

## 4. Register Mandatory GDPR Webhooks

Under **App setup** &rarr; **Compliance webhooks**, configure the following endpoints:
- **Customer data request endpoint**:
  `https://your-domain.com/api/shopify/webhooks/customers/data_request`
- **Customer data erasure endpoint**:
  `https://your-domain.com/api/shopify/webhooks/customers/redact`
- **Shop data erasure endpoint**:
  `https://your-domain.com/api/shopify/webhooks/shop/redact`

---

## 5. Software Distribution & Store Installation

1. Navigate to **Distribution** &rarr; Select **Custom distribution** (if installing on your own specific stores) or **Public Distribution** (if distributing broadly).
2. ProfitShield is fully unlocked for the software buyer with all Pro/Enterprise features enabled out-of-the-box (no artificial paywalls or external recurring subscription billing required).

---

## 6. Testing with a Shopify Development Store

1. In your Partner Dashboard, click **Stores** &rarr; **Add store** &rarr; **Development store**.
2. Select "Create a store with test data".
3. In ProfitShield, enter your development store domain in **Shopify Settings** and click **Connect Shopify Store**.
4. ProfitShield will execute OAuth, exchange the permanent offline access token, verify connection via Shopify GraphQL Admin API (`GET_SHOP_INFO`), and begin synchronization!
