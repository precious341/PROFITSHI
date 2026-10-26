import { describe, it, expect } from 'vitest';
import {
  calculateNetSales,
  calculateEstimatedGrossProfit,
  calculateEstimatedGrossMargin,
  calculateDiscountImpact,
  calculateShippingImpact,
  calculateRefundImpact,
  roundCurrency
} from '../server/engine/calculations';

describe('ProfitShield Calculation Engine', () => {
  describe('calculateNetSales', () => {
    it('accurately calculates net sales after discounts', () => {
      const net = calculateNetSales(100, 20, 0);
      expect(net).toBe(80);
    });

    it('avoids negative net sales when discounts exceed gross', () => {
      const net = calculateNetSales(50, 60, 0);
      expect(net).toBe(0);
    });

    it('handles zero gross sales', () => {
      const net = calculateNetSales(0, 0, 0);
      expect(net).toBe(0);
    });

    it('handles adjustments and returns properly without double discounting', () => {
      const net = calculateNetSales(150.50, 25.25, 10.00);
      expect(net).toBe(115.25);
    });
  });

  describe('calculateEstimatedGrossProfit', () => {
    it('calculates gross profit correctly when COGS is available', () => {
      const res = calculateEstimatedGrossProfit(100, 45);
      expect(res.value).toBe(55);
      expect(res.isEstimated).toBe(true);
      expect(res.missingFields).toBeUndefined();
    });

    it('honestly reports missing COGS when cost is null or undefined', () => {
      const res = calculateEstimatedGrossProfit(100, null);
      expect(res.value).toBe(0);
      expect(res.missingFields).toContain('cogs');
      expect(res.notes?.[0]).toContain('Cost of goods sold (COGS) is missing');
    });

    it('handles zero cost gracefully', () => {
      const res = calculateEstimatedGrossProfit(50, 0);
      expect(res.value).toBe(50);
    });

    it('correctly reports negative profit if cost exceeds net sales', () => {
      const res = calculateEstimatedGrossProfit(40, 60);
      expect(res.value).toBe(-20);
    });
  });

  describe('calculateEstimatedGrossMargin', () => {
    it('calculates gross margin percentage correctly', () => {
      const res = calculateEstimatedGrossMargin(40, 100);
      expect(res.value).toBe(40);
    });

    it('safely handles zero net sales without divide-by-zero crashes', () => {
      const res = calculateEstimatedGrossMargin(0, 0);
      expect(res.value).toBe(0);
      expect(res.notes?.[0]).toContain('Net sales is zero');
    });

    it('calculates negative margins correctly when loss-making', () => {
      const res = calculateEstimatedGrossMargin(-20, 80);
      expect(res.value).toBe(-25);
    });
  });

  describe('calculateDiscountImpact', () => {
    it('compares margin before and after discount', () => {
      const impact = calculateDiscountImpact(100, 20, 50);
      expect(impact.originalProfit).toBe(50);
      expect(impact.discountedProfit).toBe(30);
      expect(impact.profitForgone).toBe(20);
      expect(impact.originalMarginPct).toBe(50);
      expect(impact.discountedMarginPct).toBe(37.5);
      expect(impact.marginDropPct).toBe(12.5);
      expect(impact.isLossMaking).toBe(false);
      expect(impact.missingCost).toBe(false);
    });

    it('flags loss-making discount where price falls below unit cost', () => {
      const impact = calculateDiscountImpact(50, 25, 30);
      expect(impact.discountedProfit).toBe(-5);
      expect(impact.isLossMaking).toBe(true);
    });

    it('flags missing cost when unit cost is unavailable', () => {
      const impact = calculateDiscountImpact(100, 20, null);
      expect(impact.missingCost).toBe(true);
      expect(impact.profitForgone).toBe(20);
      expect(impact.discountedProfit).toBeNull();
    });
  });

  describe('calculateShippingImpact', () => {
    it('detects shipping cost deficits when carrier expense exceeds customer charge', () => {
      const impact = calculateShippingImpact(5.00, 12.50);
      expect(impact.isShippingLoss).toBe(true);
      expect(impact.shippingLossAmount).toBe(7.50);
      expect(impact.netShippingMargin).toBe(-7.50);
    });

    it('handles profitable shipping accurately', () => {
      const impact = calculateShippingImpact(15.00, 10.00);
      expect(impact.isShippingLoss).toBe(false);
      expect(impact.shippingLossAmount).toBe(0);
      expect(impact.netShippingMargin).toBe(5.00);
    });
  });

  describe('calculateRefundImpact', () => {
    it('accounts for restocked inventory vs unrecovered damaged inventory', () => {
      // Unrecovered inventory: merchant loses cash refund + cost of item
      const unrecovered = calculateRefundImpact(100, 40, false);
      expect(unrecovered.directCashLoss).toBe(100);
      expect(unrecovered.unrecoveredCost).toBe(40);
      expect(unrecovered.totalEstimatedLoss).toBe(140);

      // Restocked inventory: item returned to shelf, lost only the cash refund
      const restocked = calculateRefundImpact(100, 40, true);
      expect(restocked.directCashLoss).toBe(100);
      expect(restocked.unrecoveredCost).toBe(0);
      expect(restocked.totalEstimatedLoss).toBe(100);
    });
  });

  describe('roundCurrency precision', () => {
    it('prevents IEEE 754 floating point drift', () => {
      const floatSum = 0.1 + 0.2; // 0.30000000000000004
      expect(roundCurrency(floatSum)).toBe(0.3);
    });
  });
});
