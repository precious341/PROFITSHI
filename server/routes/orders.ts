import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../db';
import { roundCurrency } from '../engine/calculations';

const router = Router();

// GET all orders
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const limit = Number(req.query.limit) || 50;
    const orders = await db.getOrders(storeId, limit);
    res.json({ data: orders });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
});

// GET single order
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const order = await db.getOrder(storeId, req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ data: order });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch order', details: err.message });
  }
});

// GET discount analysis metrics
router.get('/analytics/discounts', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const orders = await db.getOrders(storeId);
    
    const discountedOrders = orders.filter(o => Number(o.discounts_total) > 0);
    const totalDiscountAmount = roundCurrency(discountedOrders.reduce((sum, o) => sum + Number(o.discounts_total), 0));
    const avgDiscountPct = discountedOrders.length > 0
      ? roundCurrency((totalDiscountAmount / discountedOrders.reduce((sum, o) => sum + Number(o.gross_sales), 0)) * 100)
      : 0;

    res.json({
      totalDiscountedOrders: discountedOrders.length,
      totalDiscountAmount,
      avgDiscountPct,
      discountedOrders: discountedOrders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        processed_at: o.processed_at,
        gross_sales: o.gross_sales,
        discounts_total: o.discounts_total,
        net_sales: o.net_sales,
        estimated_margin_pct: o.estimated_margin_pct,
        discount_rate_pct: roundCurrency((Number(o.discounts_total) / Number(o.gross_sales)) * 100)
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate discount metrics', details: err.message });
  }
});

// GET shipping analysis metrics
router.get('/analytics/shipping', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const orders = await db.getOrders(storeId);
    
    let totalCharged = 0;
    let totalExpense = 0;
    const subsidizedOrders: any[] = [];

    orders.forEach(o => {
      const charged = Number(o.shipping_charged) || 0;
      const expense = Number(o.shipping_expense) || 0;
      totalCharged += charged;
      totalExpense += expense;

      if (expense > charged) {
        subsidizedOrders.push({
          id: o.id,
          order_number: o.order_number,
          processed_at: o.processed_at,
          shipping_charged: charged,
          shipping_expense: expense,
          freight_deficit: roundCurrency(expense - charged),
          deficit_ratio_pct: charged > 0 ? roundCurrency(((expense - charged) / charged) * 100) : 100
        });
      }
    });

    const netShippingResult = roundCurrency(totalCharged - totalExpense);

    res.json({
      totalShippingCharged: roundCurrency(totalCharged),
      totalShippingExpense: roundCurrency(totalExpense),
      netShippingResult,
      isFreightDeficit: netShippingResult < 0,
      totalDeficitAmount: netShippingResult < 0 ? Math.abs(netShippingResult) : 0,
      subsidizedOrdersCount: subsidizedOrders.length,
      subsidizedOrders
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate shipping metrics', details: err.message });
  }
});

// GET refund analysis metrics
router.get('/analytics/refunds', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user?.storeId || 'store-demo-001';
    const orders = await db.getOrders(storeId);
    
    const refundedOrders = orders.filter(o => Number(o.total_refunded) > 0);
    const totalRefundedAmount = roundCurrency(refundedOrders.reduce((sum, o) => sum + Number(o.total_refunded), 0));

    res.json({
      totalRefundedOrders: refundedOrders.length,
      totalRefundedAmount,
      refundedOrders: refundedOrders.map(o => ({
        id: o.id,
        order_number: o.order_number,
        processed_at: o.processed_at,
        gross_sales: o.gross_sales,
        total_refunded: o.total_refunded,
        net_sales: o.net_sales,
        estimated_gross_profit: o.estimated_gross_profit,
        items: o.items
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate refund metrics', details: err.message });
  }
});

export default router;
