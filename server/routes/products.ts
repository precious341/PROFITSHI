import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';

const router = Router();

// GET all products
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const products = await db.getProducts(storeId);
    res.json({ data: products });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch products', details: err.message });
  }
});

// GET products with missing cost
router.get('/missing-cost', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const products = await db.getProducts(storeId);
    const missing = products.filter(p => p.effective_cost === null || isNaN(Number(p.effective_cost)));
    res.json({ data: missing, count: missing.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch missing cost products', details: err.message });
  }
});

// PUT /api/products/:id/cost (Update cost override)
router.put('/:id/cost', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const productId = req.params.id;
    const { overrideCost, notes, source } = req.body;

    if (overrideCost === undefined || isNaN(Number(overrideCost)) || Number(overrideCost) < 0) {
      return res.status(400).json({ error: 'Please provide a valid non-negative cost value.' });
    }

    const updated = await db.updateProductCost(
      storeId,
      productId,
      Number(overrideCost),
      source || 'merchant_manual',
      req.user?.email || 'Merchant User',
      notes
    );

    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update product cost', details: err.message });
  }
});

// GET /api/products/:id/cost-history
router.get('/:id/cost-history', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const history = await db.getCostHistory(storeId, req.params.id);
    res.json({ data: history });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load cost history', details: err.message });
  }
});

export default router;
