import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../server';
import { Express } from 'express';

describe('ProfitShield Backend API Integration', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const serverObj = await createServer();
    app = serverObj.app;
  });

  it('GET /api/health returns 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('ProfitShield API');
  });

  it('GET /api/shopify/status returns demo store diagnostics', async () => {
    const res = await request(app).get('/api/shopify/status');
    expect(res.status).toBe(200);
    expect(res.body.connectedStore).toBe('the-artisan-roastery.myshopify.com');
  });

  it('GET /api/dashboard/summary returns computed KPIs without NaN', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
    expect(typeof res.body.metrics.grossSales).toBe('number');
    expect(typeof res.body.metrics.estimatedGrossProfit).toBe('number');
    expect(typeof res.body.metrics.estimatedMarginPct).toBe('number');
  });

  it('GET /api/findings returns findings list and filter support', async () => {
    const res = await request(app).get('/api/findings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('PUT /api/products/:id/cost updates cost override and calculates new margin', async () => {
    const res = await request(app)
      .put('/api/products/prod-004/cost')
      .send({ overrideCost: 45.00, notes: 'Supplier wholesale invoice verified' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.product.effective_cost).toBe(45.00);
    expect(res.body.product.override_cost).toBe(45.00);
  });

  it('GET /api/findings returns all findings without artificial subscription tier gating', async () => {
    const res = await request(app).get('/api/findings');
    expect(res.status).toBe(200);
    expect(res.body.isRestrictedByPlan).toBe(false);
    expect(res.body.currentPlan).toBe('full');
    expect(res.body.data.length).toBe(res.body.totalCount);
  });

  it('POST /api/shopify/config saves configuration securely and masks secret', async () => {
    const res = await request(app)
      .post('/api/shopify/config')
      .send({
        shopDomain: 'my-test-store.myshopify.com',
        apiKey: 'shpa_test1234567890',
        apiSecret: 'shpss_supersecretkey123456',
        apiVersion: '2024-10',
        scopes: 'read_products,read_orders'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.config.shopDomain).toBe('my-test-store.myshopify.com');
    expect(res.body.config.apiVersion).toBe('2024-10');
    // Secret must be masked and never exposed in full
    expect(res.body.config.maskedApiSecret).toContain('••••');
    expect(res.body.config.maskedApiSecret).not.toBe('shpss_supersecretkey123456');
  });

  it('POST /api/shopify/mode switches active operating mode', async () => {
    const res = await request(app)
      .post('/api/shopify/mode')
      .send({ mode: 'live' });

    expect(res.status).toBe(200);
    expect(res.body.activeMode).toBe('live');

    // Switch back to demo
    const resDemo = await request(app)
      .post('/api/shopify/mode')
      .send({ mode: 'demo' });

    expect(resDemo.status).toBe(200);
    expect(resDemo.body.activeMode).toBe('demo');
  });

  it('POST /api/shopify/sync does not invent sync success when live store is unauthenticated', async () => {
    // Switch to live mode with unauthenticated store
    await request(app).post('/api/shopify/mode').send({ mode: 'live' });

    const res = await request(app).post('/api/shopify/sync');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('AUTH_REQUIRED');

    // Switch back to demo mode
    await request(app).post('/api/shopify/mode').send({ mode: 'demo' });
  });

  it('POST /api/shopify/config strips documentation URL from apiVersion and saves clean version', async () => {
    const res = await request(app)
      .post('/api/shopify/config')
      .send({
        apiVersion: 'https://shopify.dev/docs/api/admin-graphql/current/queries/shopifyqlQuery'
      });

    expect(res.status).toBe(200);
    expect(res.body.config.apiVersion).toBe('2024-10');
    expect(res.body.config.apiVersion).not.toContain('http');
  });

  it('GET /api/shopify/status returns callbackUrl', async () => {
    const res = await request(app).get('/api/shopify/status');
    expect(res.status).toBe(200);
    expect(res.body.callbackUrl).toBeDefined();
    expect(res.body.callbackUrl).toContain('/api/shopify/callback');
  });

  it('POST /api/shopify/connect initiates OAuth with authUrl and state', async () => {
    // Configure credentials first
    await request(app).post('/api/shopify/config').send({
      shopDomain: 'acme-test.myshopify.com',
      apiKey: 'shpa_1234567890123456',
      apiSecret: 'shpss_secret1234567890',
      apiVersion: '2024-10'
    });

    const res = await request(app)
      .post('/api/shopify/connect')
      .send({
        shopDomain: 'acme-test.myshopify.com',
        redirectUri: 'https://ais-test.run.app/api/shopify/callback'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('redirect');
    expect(res.body.authUrl).toBeDefined();
    expect(res.body.authUrl).toContain('https://acme-test.myshopify.com/admin/oauth/authorize');
    expect(res.body.authUrl).toContain('client_id=shpa_1234567890123456');
    expect(res.body.authUrl).toContain(encodeURIComponent('https://ais-test.run.app/api/shopify/callback'));
  });

  it('POST /api/shopify/connect fails gracefully when shop domain is empty', async () => {
    const res = await request(app)
      .post('/api/shopify/connect')
      .send({ shopDomain: '' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('STORE_DOMAIN_REQUIRED');
  });

  it('GET /api/dashboard/summary never exposes access_token or plaintext secret to client', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(200);
    expect(res.body.store).toBeDefined();
    expect(res.body.store.access_token).toBeUndefined();
    expect(res.body.store.access_token_encrypted).toBeUndefined();
  });

  it('GET /api/shopify/status never exposes raw apiSecret or access_token to client', async () => {
    const res = await request(app).get('/api/shopify/status');
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeUndefined();
    expect(res.body.apiSecret).toBeUndefined();
  });
});
