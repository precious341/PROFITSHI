import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import {
  isShopifyConfigured,
  runtimeShopifyConfig,
  getSafeShopifyConfig,
  updateShopifyConfig,
  testShopifyCredentials,
  buildAuthUrl,
  verifyHmac,
  exchangeCodeForAccessToken,
  executeShopifyGraphQL,
  SHOPIFY_GRAPHQL_QUERIES,
  sanitizeShopDomain,
  resolveEffectiveAppUrl
} from '../services/shopifyService';

const router = Router();

// Store temporary OAuth state nonces in memory (TTL 10 mins)
const oauthStateNonces = new Map<string, { shop: string; redirectUri?: string; createdAt: number }>();

// GET Shopify connection status
router.get('/status', async (req: AuthRequest, res: Response) => {
  try {
    const activeMode = db.getActiveMode();
    const activeStoreId = db.getActiveStoreId();
    const store = await db.getStore(activeStoreId);
    const configured = isShopifyConfigured();
    const liveToken = db.getDecryptedAccessToken(activeStoreId);
    const hasLiveToken = Boolean(store && !store.is_demo && liveToken);
    const effectiveAppUrl = resolveEffectiveAppUrl(req);
    const callbackUrl = `${effectiveAppUrl}/api/shopify/callback`;

    // Clean version string (e.g. '2024-10' - never a URL)
    let apiVersion = runtimeShopifyConfig.apiVersion || '2024-10';
    if (apiVersion.includes('http')) apiVersion = '2024-10';

    let diagnostics = '';
    if (activeMode === 'demo') {
      diagnostics = 'Demo Store Mode active. Displaying sample records for "The Artisan Roastery Co.". Switch to Live Store or configure credentials to connect a real Shopify store.';
    } else if (!configured) {
      diagnostics = 'Shopify Client ID and Client Secret are not configured. Click "Shopify Configuration" to enter your Shopify Dev Dashboard credentials.';
    } else if (!hasLiveToken) {
      diagnostics = 'Credentials configured, but no Shopify store has completed OAuth authorization yet. Click "Connect Shopify Store" to authorize.';
    } else {
      diagnostics = `Successfully authenticated with live Shopify store "${store.shop_name}" (${store.shopify_domain}) via Admin API ${apiVersion}.`;
    }

    res.json({
      configured,
      activeMode,
      connected: hasLiveToken,
      isDemo: store?.is_demo ?? (activeMode === 'demo'),
      connectedStore: store?.shopify_domain || (activeMode === 'demo' ? 'the-artisan-roastery.myshopify.com' : null),
      storeName: store?.shop_name || (activeMode === 'demo' ? 'The Artisan Roastery Co.' : 'Not Connected'),
      lastSyncAt: store?.last_sync_at,
      plan: store?.plan || 'pro',
      apiVersion,
      scopes: runtimeShopifyConfig.scopes.split(',').map(s => s.trim()),
      appUrl: effectiveAppUrl,
      callbackUrl,
      shopDomain: runtimeShopifyConfig.shopDomain || '',
      diagnostics
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve Shopify connection status', details: err.message });
  }
});

// GET Current Safe Configuration (Client ID, masked secret, version, scopes)
router.get('/config', (req: Request, res: Response) => {
  res.json({ config: getSafeShopifyConfig(req) });
});

// POST Save Server-Side Shopify Configuration
router.post('/config', (req: Request, res: Response) => {
  try {
    const { shopDomain, apiKey, apiSecret, apiVersion, scopes, appUrl } = req.body;
    const result = updateShopifyConfig({
      shopDomain,
      apiKey,
      apiSecret,
      apiVersion,
      scopes,
      appUrl
    });
    res.json({
      ...result,
      config: getSafeShopifyConfig(req)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update configuration', details: err.message });
  }
});

// POST Test Connection & Validate Credentials
router.post('/config/test', async (req: Request, res: Response) => {
  try {
    const { shopDomain, apiKey, apiSecret } = req.body;
    const decryptedToken = db.getDecryptedAccessToken('store-live-001');
    const result = await testShopifyCredentials({
      shopDomain,
      apiKey,
      apiSecret,
      accessToken: decryptedToken || undefined
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      stage: 'unexpected_error',
      message: `Connection test encountered an error: ${err.message}`
    });
  }
});

// POST Switch Mode between 'demo' and 'live'
router.post('/mode', async (req: Request, res: Response) => {
  try {
    const { mode } = req.body;
    if (mode !== 'demo' && mode !== 'live') {
      return res.status(400).json({ error: 'Invalid mode. Must be "demo" or "live".' });
    }

    db.setActiveMode(mode);
    const store = await db.getSanitizedStore(db.getActiveStoreId());

    res.json({
      success: true,
      activeMode: mode,
      store,
      message: mode === 'demo'
        ? 'Switched to Demo Store Mode (The Artisan Roastery Co.).'
        : 'Switched to Live Connected Store Mode.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle mode', details: err.message });
  }
});

// POST Initiate Shopify OAuth connection
router.post('/connect', async (req: Request, res: Response) => {
  const shopDomain = req.body.shopDomain !== undefined
    ? req.body.shopDomain.trim()
    : (runtimeShopifyConfig.shopDomain || '').trim();

  if (!shopDomain || shopDomain.length === 0) {
    return res.status(400).json({
      error: 'Shop domain is required. Please enter your Shopify store domain (e.g., your-store.myshopify.com).',
      code: 'STORE_DOMAIN_REQUIRED'
    });
  }

  if (!isShopifyConfigured()) {
    return res.status(400).json({
      error: 'Shopify Client ID and Client Secret are not configured.',
      code: 'CREDENTIALS_REQUIRED',
      message: 'Please click "Shopify Configuration" to enter your Shopify Client ID and Client Secret before initiating authorization.'
    });
  }

  const cleanShop = sanitizeShopDomain(shopDomain);
  if (!runtimeShopifyConfig.shopDomain) {
    runtimeShopifyConfig.shopDomain = cleanShop;
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const effectiveAppUrl = resolveEffectiveAppUrl(req);
  const redirectUri = req.body.redirectUri || `${effectiveAppUrl}/api/shopify/callback`;

  oauthStateNonces.set(nonce, { shop: cleanShop, redirectUri, createdAt: Date.now() });

  const authUrl = buildAuthUrl(cleanShop, nonce, redirectUri);
  res.json({
    status: 'redirect',
    authUrl,
    shop: cleanShop,
    redirectUri,
    mode: 'popup'
  });
});

// GET Official Shopify OAuth Callback (supports both /callback and /callback/)
router.get(['/callback', '/callback/'], async (req: Request, res: Response) => {
  const { code, shop, state, hmac } = req.query;

  const renderError = (title: string, message: string, codeStr = 'AUTH_ERROR') => {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopify Connection Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; padding: 40px; text-align: center; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; max-width: 500px; margin: 40px auto; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h2 { color: #f43f5e; margin: 0 0 12px; font-size: 20px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
            .btn { display: inline-block; background: #334155; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
            .btn:hover { background: #475569; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${title}</h2>
            <p>${message}</p>
            <button class="btn" onclick="window.close()">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'SHOPIFY_AUTH_ERROR', code: '${codeStr}', error: '${message.replace(/'/g, "\\'")}' }, '*');
              }
            </script>
          </div>
        </body>
      </html>
    `);
  };

  if (!code || !shop || !hmac) {
    return renderError('Missing OAuth Parameters', 'Missing required authorization parameters (code, shop, or hmac).');
  }

  const shopDomain = sanitizeShopDomain(shop as string);

  // 1. Verify HMAC
  const isValidHmac = verifyHmac(req.query, hmac as string);
  if (!isValidHmac) {
    console.warn('[Shopify OAuth] Invalid HMAC signature for shop:', shopDomain);
    return renderError(
      'Security Verification Failed',
      'The HMAC signature returned by Shopify could not be verified with your configured Client Secret. Please double-check your Shopify Client Secret in Shopify Configuration.',
      'INVALID_HMAC'
    );
  }

  // 2. Exchange authorization code for permanent offline access token
  try {
    const tokenResponse = await exchangeCodeForAccessToken(shopDomain, code as string);
    const accessToken = tokenResponse.access_token;

    // 3. Query shop details to verify connection with a real GraphQL query
    let shopName = shopDomain.replace('.myshopify.com', '');
    try {
      const shopData = await executeShopifyGraphQL<{ shop: { name: string; currencyCode: string } }>(
        shopDomain,
        accessToken,
        SHOPIFY_GRAPHQL_QUERIES.GET_SHOP_INFO
      );
      if (shopData?.shop?.name) {
        shopName = shopData.shop.name;
      }
    } catch (gErr: any) {
      console.warn('[Shopify Shop Info Query]', gErr.message);
      // If shop info query fails, the token is not valid
      throw new Error(`Shop verification query failed: ${gErr.message}`);
    }

    // 4. Save live store in DB and switch to live mode
    await db.saveLiveStore(shopDomain, shopName, accessToken, tokenResponse.scope || runtimeShopifyConfig.scopes);
    db.setActiveMode('live');

    // 5. Trigger initial background data fetch
    try {
      const [productsData, ordersData] = await Promise.all([
        executeShopifyGraphQL<{ products: { nodes: any[] } }>(
          shopDomain,
          accessToken,
          SHOPIFY_GRAPHQL_QUERIES.GET_PRODUCTS,
          { first: 50 }
        ),
        executeShopifyGraphQL<{ orders: { nodes: any[] } }>(
          shopDomain,
          accessToken,
          SHOPIFY_GRAPHQL_QUERIES.GET_ORDERS,
          { first: 50 }
        )
      ]);

      const prods = productsData?.products?.nodes || [];
      const ords = ordersData?.orders?.nodes || [];
      await db.syncRealShopifyData('store-live-001', prods, ords);
    } catch (syncErr: any) {
      console.warn('[Shopify Initial Sync Warning]', syncErr.message);
    }

    // 6. Return successful popup/redirect HTML with postMessage
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shopify Connected Successfully</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; padding: 40px; text-align: center; }
            .card { background: #1e293b; border: 1px solid #10b981; border-radius: 12px; max-width: 500px; margin: 40px auto; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .check { font-size: 40px; color: #10b981; margin-bottom: 12px; }
            h2 { color: #fff; margin: 0 0 12px; font-size: 20px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
            .btn { display: inline-block; background: #10b981; color: #022c22; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="check">&#10003;</div>
            <h2>Shopify Connected Successfully!</h2>
            <p><strong>${shopName}</strong> (${shopDomain}) is now connected via Shopify Admin API. This window will close automatically.</p>
            <button class="btn" onclick="window.close()">Return to ProfitShield</button>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'SHOPIFY_AUTH_SUCCESS',
                    shop: '${shopDomain}',
                    shopName: '${shopName.replace(/'/g, "\\'")}'
                  }, '*');
                  setTimeout(function() { window.close(); }, 1200);
                } else {
                  window.location.href = '/?shopify_connected=true&shop=${encodeURIComponent(shopDomain)}';
                }
              } catch (e) {
                console.error(e);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('[Shopify OAuth Exchange Error]', err);
    return renderError('Token Exchange & Verification Failed', err.message || 'Failed to exchange authorization code for access token.', 'EXCHANGE_FAILED');
  }
});

// POST Disconnect Live Store
router.post('/disconnect', async (req: Request, res: Response) => {
  try {
    await db.disconnectLiveStore();
    res.json({
      success: true,
      message: 'Live Shopify store disconnected. Active mode switched to Demo Store.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to disconnect store', details: err.message });
  }
});

// POST Trigger Manual Synchronization (Real Shopify Data or Demo Refresh)
router.post('/sync', async (req: AuthRequest, res: Response) => {
  try {
    const activeMode = db.getActiveMode();
    const activeStoreId = db.getActiveStoreId();
    const store = await db.getStore(activeStoreId);

    // If in Live mode: execute actual Shopify GraphQL Admin API queries
    if (activeMode === 'live') {
      const liveToken = db.getDecryptedAccessToken(activeStoreId);
      if (!store || !liveToken) {
        return res.status(400).json({
          error: 'No authenticated Shopify store connected.',
          code: 'AUTH_REQUIRED',
          message: 'Cannot synchronize: No active Shopify OAuth connection. Please configure your credentials and authorize the app first.'
        });
      }

      const shop = store.shopify_domain;
      const token = liveToken;

      // Query real products and orders via GraphQL
      const [productsData, ordersData] = await Promise.all([
        executeShopifyGraphQL<{ products: { nodes: any[] } }>(
          shop,
          token,
          SHOPIFY_GRAPHQL_QUERIES.GET_PRODUCTS,
          { first: 50 }
        ),
        executeShopifyGraphQL<{ orders: { nodes: any[] } }>(
          shop,
          token,
          SHOPIFY_GRAPHQL_QUERIES.GET_ORDERS,
          { first: 50 }
        )
      ]);

      const prods = productsData?.products?.nodes || [];
      const ords = ordersData?.orders?.nodes || [];

      const syncResult = await db.syncRealShopifyData(store.id, prods, ords);

      return res.json({
        status: 'success',
        isDemo: false,
        last_sync_at: new Date().toISOString(),
        synced: syncResult,
        message: `Successfully synchronized ${syncResult.productsCount} products, ${syncResult.ordersCount} orders, and audited fulfillment & discount records from ${shop}.`
      });
    }

    // In Demo mode: recompute findings cleanly
    const result = await db.triggerManualSync(activeStoreId);
    res.json({
      ...result,
      isDemo: true,
      message: 'Demo store records refreshed. (To sync real store data, switch to Live mode and connect your Shopify account).'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Store synchronization failed', details: err.message });
  }
});

// --- MANDATORY SHOPIFY GDPR WEBHOOKS ---
router.post('/webhooks/customers/data_request', (req: Request, res: Response) => {
  console.log('[Shopify Webhook] customers/data_request received:', req.body);
  res.status(200).json({ status: 'processed', message: 'No customer PII stored' });
});

router.post('/webhooks/customers/redact', (req: Request, res: Response) => {
  console.log('[Shopify Webhook] customers/redact received:', req.body);
  res.status(200).json({ status: 'processed' });
});

router.post('/webhooks/shop/redact', (req: Request, res: Response) => {
  console.log('[Shopify Webhook] shop/redact received for shop:', req.body?.shop_domain);
  res.status(200).json({ status: 'acknowledged' });
});

router.post('/webhooks/app/uninstalled', (req: Request, res: Response) => {
  console.log('[Shopify Webhook] app/uninstalled for shop:', req.body?.shop_domain);
  res.status(200).json({ status: 'uninstalled' });
});

export default router;
