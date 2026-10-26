import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';

const router = Router();

router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const summary = await db.getDashboardSummary(storeId);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load dashboard summary', details: err.message });
  }
});

export default router;
