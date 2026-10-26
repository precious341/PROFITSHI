import { describe, it, expect } from 'vitest';
import { runProfitLeakFinder } from '../server/engine/leakFinder';

describe('Profit Leak Finder Engine', () => {
  const sampleSettings = {
    targetGrossMarginPct: 55,
    lowMarginThresholdPct: 30,
    highLossThresholdAmt: 100,
    defaultShippingCostEst: 8.50
  };

  it('identifies products with missing cost as incomplete_data findings', () => {
    const products = [
      { id: 'p1', title: 'Test Grinder', price: 90, shopify_cost: null, override_cost: null }
    ];
    const findings = runProfitLeakFinder(products, [], sampleSettings);

    const missingCostFinding = findings.find(f => f.category === 'missing_cost');
    expect(missingCostFinding).toBeDefined();
    expect(missingCostFinding?.confidence_level).toBe('incomplete_data');
    expect(missingCostFinding?.estimated_financial_impact).toBeNull();
  });

  it('detects products with margins below the low margin threshold', () => {
    const products = [
      { id: 'p2', title: 'Low Margin Kettle', price: 50, shopify_cost: 40, override_cost: null, inventory_quantity: 10 }
    ];
    // price 50, cost 40 -> 20% margin, threshold is 30%
    const findings = runProfitLeakFinder(products, [], sampleSettings);

    const marginFinding = findings.find(f => f.category === 'margin');
    expect(marginFinding).toBeDefined();
    expect(marginFinding?.severity).toBe('warning');
    expect(marginFinding?.evidence_json.marginPct).toBe(20);
  });

  it('flags orders with heavy discount margin erosion', () => {
    const orders = [
      {
        id: 'ord-1',
        order_number: '1099',
        gross_sales: 100,
        discounts_total: 35, // 35% discount
        cogs_total: 50,
        shipping_charged: 10,
        shipping_expense: 10,
        total_refunded: 0
      }
    ];
    const findings = runProfitLeakFinder([], orders, sampleSettings);

    const discountFinding = findings.find(f => f.category === 'discount');
    expect(discountFinding).toBeDefined();
    expect(discountFinding?.evidence_json.discountPct).toBe(35);
  });
});
