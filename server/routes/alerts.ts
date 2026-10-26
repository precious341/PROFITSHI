import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';

const router = Router();

// GET active alerts
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const alerts = await db.getAlerts(storeId);
    res.json({ data: alerts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alerts', details: err.message });
  }
});

// Dismiss alert
router.post('/:id/dismiss', async (req: AuthRequest, res: Response) => {
  try {
    const dismissed = await db.dismissAlert(req.params.id);
    res.json({ success: true, alert: dismissed });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to dismiss alert', details: err.message });
  }
});

// GET margin settings
router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const settings = await db.getSettings(storeId);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
  }
});

// PUT margin settings
router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const { target_gross_margin_pct, low_margin_threshold_pct, high_loss_threshold_amt, default_shipping_cost_est } = req.body;

    const updated = await db.updateSettings(storeId, {
      target_gross_margin_pct: Number(target_gross_margin_pct),
      low_margin_threshold_pct: Number(low_margin_threshold_pct),
      high_loss_threshold_amt: Number(high_loss_threshold_amt),
      default_shipping_cost_est: Number(default_shipping_cost_est)
    });

    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

export default router;
