/**
 * ProfitShield - Profit Leak Finder Rule Engine
 * 
 * Deterministic analysis across products, orders, discounts, shipping, and refunds.
 * Generates actionable findings with clear formulas, evidence, and confidence indicators.
 */

import {
  calculateEstimatedGrossProfit,
  calculateEstimatedGrossMargin,
  calculateDiscountImpact,
  calculateShippingImpact,
  roundCurrency
} from './calculations';

export interface StoreMarginSettings {
  targetGrossMarginPct: number; // e.g. 55%
  lowMarginThresholdPct: number; // e.g. 30%
  highLossThresholdAmt: number; // e.g. $100
  defaultShippingCostEst: number; // e.g. $8.50
}

export interface LeakFinding {
  id: string;
  store_id: string;
  finding_key: string;
  title: string;
  category: 'margin' | 'discount' | 'shipping' | 'refund' | 'missing_cost';
  severity: 'critical' | 'warning' | 'info';
  status: 'open' | 'resolved' | 'dismissed';
  product_id?: string;
  product_title?: string;
  order_id?: string;
  order_number?: string;
  estimated_financial_impact: number | null;
  calculation_explanation: string;
  evidence_json: Record<string, any>;
  recommended_action: string;
  confidence_level: 'high' | 'medium' | 'low' | 'incomplete_data';
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export function runProfitLeakFinder(
  products: any[],
  orders: any[],
  settings: StoreMarginSettings,
  storeId: string = 'demo-store-01'
): LeakFinding[] {
  const findings: LeakFinding[] = [];
  const now = new Date().toISOString();

  // 1. Audit Products for Missing Cost (COGS)
  for (const product of products) {
    const effectiveCost = product.override_cost !== undefined && product.override_cost !== null
      ? Number(product.override_cost)
      : (product.shopify_cost !== undefined && product.shopify_cost !== null ? Number(product.shopify_cost) : null);

    if (effectiveCost === null || isNaN(effectiveCost)) {
      findings.push({
        id: `finding-cost-${product.id}`,
        store_id: storeId,
        finding_key: `missing_cost_${product.id}`,
        title: `Missing Unit Cost: "${product.title}"`,
        category: 'missing_cost',
        severity: 'warning',
        status: 'open',
        product_id: product.id,
        product_title: product.title,
        estimated_financial_impact: null,
        calculation_explanation: `The product sells for $${Number(product.price).toFixed(2)}, but no Cost of Goods Sold (COGS) is configured in Shopify or ProfitShield. Without cost data, profit cannot be calculated.`,
        evidence_json: {
          productId: product.id,
          sku: product.sku || 'N/A',
          price: Number(product.price),
          shopifyCost: null,
          merchantOverride: null
        },
        recommended_action: `Input your supplier or manufacturing cost in the Product Cost Manager to unlock margin protection for this item.`,
        confidence_level: 'incomplete_data',
        created_at: now,
        updated_at: now
      });
    } else {
      // 2. Product Margin below Low Threshold or Target
      const price = Number(product.price);
      if (price > 0) {
        const profit = price - effectiveCost;
        const marginPct = (profit / price) * 100;

        if (marginPct < settings.lowMarginThresholdPct) {
          const targetProfit = price * (settings.targetGrossMarginPct / 100);
          const shortfallPerUnit = roundCurrency(targetProfit - profit);
          const estimatedMonthlyVolume = Math.max(1, product.inventory_quantity > 0 ? Math.min(25, product.inventory_quantity) : 10);
          const totalEstimatedImpact = roundCurrency(shortfallPerUnit * estimatedMonthlyVolume);

          findings.push({
            id: `finding-margin-low-${product.id}`,
            store_id: storeId,
            finding_key: `critically_low_margin_${product.id}`,
            title: `Critically Low Margin (${marginPct.toFixed(1)}%) on "${product.title}"`,
            category: 'margin',
            severity: marginPct < 15 ? 'critical' : 'warning',
            status: 'open',
            product_id: product.id,
            product_title: product.title,
            estimated_financial_impact: totalEstimatedImpact,
            calculation_explanation: `Current price is $${price.toFixed(2)} with unit cost $${effectiveCost.toFixed(2)}, yielding $${profit.toFixed(2)} (${marginPct.toFixed(1)}% margin). Target margin is ${settings.targetGrossMarginPct}%, creating a $${shortfallPerUnit.toFixed(2)} shortfall per unit.`,
            evidence_json: {
              price,
              cost: effectiveCost,
              marginPct: roundCurrency(marginPct),
              targetMarginPct: settings.targetGrossMarginPct,
              shortfallPerUnit,
              estimatedVolume: estimatedMonthlyVolume
            },
            recommended_action: `Consider raising the retail price to $${roundCurrency(effectiveCost / (1 - (settings.targetGrossMarginPct / 100))).toFixed(2)} or renegotiating supplier costs to reach your target margin.`,
            confidence_level: 'high',
            created_at: now,
            updated_at: now
          });
        }
      }
    }
  }

  // 3. Audit Orders for Discount Leaks, Shipping Deficits & Refund Losses
  for (const order of orders) {
    const grossSales = Number(order.gross_sales) || 0;
    const discounts = Number(order.discounts_total) || 0;
    const shippingCharged = Number(order.shipping_charged) || 0;
    const shippingExpense = Number(order.shipping_expense) || (settings.defaultShippingCostEst);
    const refunded = Number(order.total_refunded) || 0;
    const cogs = Number(order.cogs_total) || 0;

    // A. Discount Leak: If discount > 25% of gross or pushes order margin below 20%
    if (discounts > 0 && grossSales > 0) {
      const discountPct = (discounts / grossSales) * 100;
      const netSales = grossSales - discounts;
      const profitAfterDiscount = netSales - cogs;
      const marginAfterDiscount = netSales > 0 ? (profitAfterDiscount / netSales) * 100 : 0;

      if (discountPct >= 20 || marginAfterDiscount < 25) {
        findings.push({
          id: `finding-disc-${order.id}`,
          store_id: storeId,
          finding_key: `discount_margin_drain_${order.id}`,
          title: `Heavy Discount (${discountPct.toFixed(0)}%) on Order #${order.order_number}`,
          category: 'discount',
          severity: marginAfterDiscount < 15 ? 'critical' : 'warning',
          status: 'open',
          order_id: order.id,
          order_number: order.order_number,
          estimated_financial_impact: roundCurrency(discounts),
          calculation_explanation: `A discount of $${discounts.toFixed(2)} reduced gross sales from $${grossSales.toFixed(2)} to $${netSales.toFixed(2)}. This compressed the realized gross margin to ${marginAfterDiscount.toFixed(1)}%.`,
          evidence_json: {
            orderNumber: order.order_number,
            grossSales,
            discounts,
            discountPct: roundCurrency(discountPct),
            marginAfterDiscount: roundCurrency(marginAfterDiscount),
            cogs
          },
          recommended_action: `Review promotional coupon rules. Implement a minimum order subtotal requirement or cap discount percentages on low-margin SKUs.`,
          confidence_level: 'high',
          created_at: now,
          updated_at: now
        });
      }
    }

    // B. Shipping Cost Deficit
    const shippingImpact = calculateShippingImpact(shippingCharged, shippingExpense);
    if (shippingImpact.isShippingLoss && shippingImpact.shippingLossAmount >= 3.00) {
      const orderNet = (grossSales - discounts);
      const shippingExpenseRatio = orderNet > 0 ? (shippingExpense / orderNet) * 100 : 0;

      if (shippingExpenseRatio > 20 || shippingImpact.shippingLossAmount > 8.00) {
        findings.push({
          id: `finding-ship-${order.id}`,
          store_id: storeId,
          finding_key: `shipping_loss_${order.id}`,
          title: `Shipping Expense Subsidized on Order #${order.order_number}`,
          category: 'shipping',
          severity: shippingImpact.shippingLossAmount >= 12.00 ? 'critical' : 'warning',
          status: 'open',
          order_id: order.id,
          order_number: order.order_number,
          estimated_financial_impact: shippingImpact.shippingLossAmount,
          calculation_explanation: `Customer was charged $${shippingCharged.toFixed(2)} for shipping, while carrier expense was $${shippingExpense.toFixed(2)}, producing an unrecovered freight loss of $${shippingImpact.shippingLossAmount.toFixed(2)} (${shippingExpenseRatio.toFixed(1)}% of order net value).`,
          evidence_json: {
            orderNumber: order.order_number,
            shippingCharged,
            shippingExpense,
            shippingLossAmount: shippingImpact.shippingLossAmount,
            shippingExpenseRatio: roundCurrency(shippingExpenseRatio)
          },
          recommended_action: `Audit flat-rate shipping tier rules or adjust free-shipping thresholds to ensure freight costs are covered.`,
          confidence_level: 'medium',
          created_at: now,
          updated_at: now
        });
      }
    }

    // C. Refund Loss on High Value Orders
    if (refunded > 0) {
      const refundRatio = grossSales > 0 ? (refunded / grossSales) * 100 : 0;
      if (refunded >= 35.00 || refundRatio > 50) {
        findings.push({
          id: `finding-ref-${order.id}`,
          store_id: storeId,
          finding_key: `refund_profit_erosion_${order.id}`,
          title: `Unrecovered Refund of $${refunded.toFixed(2)} on Order #${order.order_number}`,
          category: 'refund',
          severity: refunded > 75.00 ? 'critical' : 'warning',
          status: 'open',
          order_id: order.id,
          order_number: order.order_number,
          estimated_financial_impact: roundCurrency(refunded),
          calculation_explanation: `A refund of $${refunded.toFixed(2)} was issued for Order #${order.order_number}. When non-refundable merchant fulfillment and payment processing fees are accounted for, this order operated at a deficit.`,
          evidence_json: {
            orderNumber: order.order_number,
            refundAmount: refunded,
            orderDate: order.processed_at
          },
          recommended_action: `Check return reason (defective, sizing, or buyer remorse) to avoid repetitive return claims on these SKUs.`,
          confidence_level: 'high',
          created_at: now,
          updated_at: now
        });
      }
    }
  }

  return findings;
}
