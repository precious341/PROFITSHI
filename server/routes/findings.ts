import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';

const router = Router();

// GET all findings with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const store = await db.getStore(storeId);
    const { category, severity, status, search } = req.query as Record<string, string>;

    let findings = await db.getFindings(storeId, { category, severity, status, search });

    // All findings are fully unlocked for the software owner (no artificial tier restrictions)
    const totalAvailable = findings.length;

    res.json({
      data: findings,
      totalCount: totalAvailable,
      isRestrictedByPlan: false,
      currentPlan: 'full'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch findings', details: err.message });
  }
});

// PATCH /api/findings/:id/status
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const findingId = req.params.id;
    const { status, notes } = req.body;

    if (!['open', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be open, resolved, or dismissed.' });
    }

    const updated = await db.updateFindingStatus(
      storeId,
      findingId,
      status,
      notes,
      req.user?.email || 'Merchant User'
    );

    res.json({ success: true, finding: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update finding status', details: err.message });
  }
});

export default router;
