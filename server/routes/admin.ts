import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { isShopifyConfigured, shopifyConfig } from '../services/shopifyService';

const router = Router();

// GET operator administrative overview
router.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const stores = await db.getAllStoresAdmin();
    const storeId = req.user?.storeId || 'store-demo-001';
    const auditLogs = await db.getAuditLogs(storeId, 50);

    const isPostgresSet = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('placeholder'));

    res.json({
      system: {
        serverTime: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        databaseStatus: isPostgresSet ? 'PostgreSQL (DATABASE_URL connected)' : 'Embedded Memory Engine (Ready for PostgreSQL URL)',
        shopifyApiStatus: isShopifyConfigured() ? 'Configured (Live Partner App)' : 'Demo Mode (Awaiting Partner API Credentials)',
        apiVersion: shopifyConfig.apiVersion,
        scopes: shopifyConfig.scopes
      },
      metrics: {
        totalStoresCount: stores.length,
        activeSubscriptions: stores.filter(s => s.plan_status === 'active').length,
        tierBreakdown: {
          free: stores.filter(s => s.plan === 'free').length,
          pro: stores.filter(s => s.plan === 'pro').length,
          business: stores.filter(s => s.plan === 'business').length
        }
      },
      stores,
      auditLogs
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin overview', details: err.message });
  }
});

export default router;
