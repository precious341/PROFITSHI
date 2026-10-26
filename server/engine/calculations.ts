/**
 * ProfitShield Profit Calculation Engine
 * 
 * Strict deterministic financial logic:
 * - Avoids double subtracting discounts
 * - Zero denominator protection
 * - Two-decimal monetary rounding to prevent floating point drift
 * - Honest distinction between Gross Profit and Contribution
 * - Explains missing data rather than hallucinating numbers
 */

export interface CalculationResult {
  value: number;
  isEstimated: boolean;
  notes?: string[];
  missingFields?: string[];
}

/**
 * Rounds monetary amounts to 2 decimal places cleanly
 */
export function roundCurrency(amount: number): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Net Sales: Gross product sales after applicable discounts and returns/adjustments.
 * Formula: Gross Sales - Applicable Line-Item Discounts - Order Discounts
 */
export function calculateNetSales(
  grossSales: number,
  discounts: number = 0,
  adjustments: number = 0
): number {
  const safeGross = Math.max(0, Number(grossSales) || 0);
  const safeDiscounts = Math.max(0, Number(discounts) || 0);
  const safeAdjustments = Number(adjustments) || 0;
  
  const net = safeGross - safeDiscounts - safeAdjustments;
  return roundCurrency(Math.max(0, net));
}

/**
 * Estimated Gross Profit:
 * Formula: Net Sales - Cost of Goods Sold (COGS)
 */
export function calculateEstimatedGrossProfit(
  netSales: number,
  cogs: number | null | undefined
): CalculationResult {
  if (cogs === null || cogs === undefined || isNaN(Number(cogs))) {
    return {
      value: 0,
      isEstimated: true,
      missingFields: ['cogs'],
      notes: ['Cost of goods sold (COGS) is missing. Profit cannot be accurately determined.']
    };
  }

  const safeNet = Number(netSales) || 0;
  const safeCogs = Number(cogs) || 0;
  const profit = safeNet - safeCogs;

  return {
    value: roundCurrency(profit),
    isEstimated: true, // Labeled estimated as overhead/taxes/merchant expenses are external
    notes: ['Calculated as Net Sales minus recorded Unit Cost.']
  };
}

/**
 * Estimated Gross Margin Percentage:
 * Formula: (Estimated Gross Profit / Net Sales) * 100
 */
export function calculateEstimatedGrossMargin(
  grossProfit: number,
  netSales: number
): CalculationResult {
  const safeProfit = Number(grossProfit) || 0;
  const safeNet = Number(netSales) || 0;

  if (safeNet <= 0) {
    return {
      value: 0,
      isEstimated: true,
      notes: ['Net sales is zero; gross margin is undefined / 0.00%']
    };
  }

  const marginPct = (safeProfit / safeNet) * 100;
  return {
    value: Math.round((marginPct + Number.EPSILON) * 100) / 100,
    isEstimated: true
  };
}

/**
 * Discount Impact Analysis:
 * Compares margin and profit before discount vs after discount.
 */
export function calculateDiscountImpact(
  regularPrice: number,
  discountAmount: number,
  unitCost: number | null | undefined
): {
  originalProfit: number | null;
  discountedProfit: number | null;
  profitForgone: number;
  originalMarginPct: number | null;
  discountedMarginPct: number | null;
  marginDropPct: number | null;
  isLossMaking: boolean;
  missingCost: boolean;
} {
  const price = Math.max(0, Number(regularPrice) || 0);
  const discount = Math.max(0, Number(discountAmount) || 0);
  const finalPrice = Math.max(0, price - discount);

  if (unitCost === null || unitCost === undefined || isNaN(Number(unitCost))) {
    return {
      originalProfit: null,
      discountedProfit: null,
      profitForgone: roundCurrency(discount),
      originalMarginPct: null,
      discountedMarginPct: null,
      marginDropPct: null,
      isLossMaking: false,
      missingCost: true
    };
  }

  const cost = Number(unitCost);
  const origProfit = roundCurrency(price - cost);
  const discProfit = roundCurrency(finalPrice - cost);
  const origMargin = price > 0 ? roundCurrency(((price - cost) / price) * 100) : 0;
  const discMargin = finalPrice > 0 ? roundCurrency(((finalPrice - cost) / finalPrice) * 100) : 0;

  return {
    originalProfit: origProfit,
    discountedProfit: discProfit,
    profitForgone: roundCurrency(discount),
    originalMarginPct: origMargin,
    discountedMarginPct: discMargin,
    marginDropPct: roundCurrency(origMargin - discMargin),
    isLossMaking: discProfit < 0,
    missingCost: false
  };
}

/**
 * Shipping Cost Impact:
 * Formula: Shipping Revenue Charged - Shipping Expense
 */
export function calculateShippingImpact(
  shippingCharged: number,
  shippingExpense: number
): {
  netShippingMargin: number;
  isShippingLoss: boolean;
  shippingLossAmount: number;
  shippingToOrderRatio: number;
} {
  const charged = Math.max(0, Number(shippingCharged) || 0);
  const expense = Math.max(0, Number(shippingExpense) || 0);
  const netShipping = roundCurrency(charged - expense);

  return {
    netShippingMargin: netShipping,
    isShippingLoss: netShipping < 0,
    shippingLossAmount: netShipping < 0 ? Math.abs(netShipping) : 0,
    shippingToOrderRatio: 0
  };
}

/**
 * Refund Impact:
 * Calculates financial loss resulting from refund, considering whether inventory was returned/restocked.
 */
export function calculateRefundImpact(
  refundAmount: number,
  itemUnitCost: number | null | undefined,
  restocked: boolean
): {
  directCashLoss: number;
  unrecoveredCost: number;
  totalEstimatedLoss: number;
  inventoryRestocked: boolean;
  missingCost: boolean;
} {
  const refund = Math.max(0, Number(refundAmount) || 0);
  
  if (itemUnitCost === null || itemUnitCost === undefined || isNaN(Number(itemUnitCost))) {
    return {
      directCashLoss: roundCurrency(refund),
      unrecoveredCost: 0,
      totalEstimatedLoss: roundCurrency(refund),
      inventoryRestocked: restocked,
      missingCost: true
    };
  }

  const cost = Number(itemUnitCost);
  // If not restocked (damaged/lost), merchant loses the COGS of that inventory permanently
  const unrecovered = restocked ? 0 : roundCurrency(cost);
  const totalLoss = roundCurrency(refund + unrecovered);

  return {
    directCashLoss: roundCurrency(refund),
    unrecoveredCost: unrecovered,
    totalEstimatedLoss: totalLoss,
    inventoryRestocked: restocked,
    missingCost: false
  };
}
