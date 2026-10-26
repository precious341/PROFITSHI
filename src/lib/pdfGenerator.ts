import { jsPDF } from 'jspdf';
import { formatCurrency, formatPercent, formatShortDate } from './formatters';

export interface ReportData {
  storeName: string;
  storeDomain: string;
  currency: string;
  generatedAt: string;
  periodLabel: string;
  metrics: {
    grossSales: number;
    discounts: number;
    netSales: number;
    estimatedGrossProfit: number;
    estimatedMarginPct: number;
    totalPotentialLeakImpact: number;
    missingCostCount: number;
  };
  topFindings: Array<{
    title: string;
    category: string;
    severity: string;
    estimated_financial_impact: number | null;
    calculation_explanation: string;
    recommended_action: string;
  }>;
  lowMarginProducts: Array<{
    title: string;
    sku: string;
    price: number;
    effective_cost: number | null;
    margin_pct: number | null;
  }>;
}

export function generateProfitShieldReport(data: ReportData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const accentNavy = [30, 41, 59]; // Slate 800
  const emeraldColor = [16, 185, 129];
  const roseColor = [244, 63, 94];

  let y = 18;

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFITSHIELD', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Shopify Financial Protection & Margin Analytics Executive Report', 14, 21);

  doc.setFontSize(8);
  doc.text(`Generated: ${formatShortDate(data.generatedAt)}`, 150, 13);
  doc.text(`Period: ${data.periodLabel}`, 150, 21);

  y = 38;

  // Store Meta Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.storeName, 14, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Domain: ${data.storeDomain} | Currency: ${data.currency}`, 14, y + 5);

  y += 14;

  // KPI Summary Cards
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 32, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 32, 2, 2, 'S');

  // Col 1: Net Sales
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NET SALES', 20, y + 10);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(data.metrics.netSales, data.currency), 20, y + 20);

  // Col 2: Gross Profit
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EST. GROSS PROFIT', 68, y + 10);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(formatCurrency(data.metrics.estimatedGrossProfit, data.currency), 68, y + 20);

  // Col 3: Gross Margin %
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('EST. GROSS MARGIN', 118, y + 10);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatPercent(data.metrics.estimatedMarginPct), 118, y + 20);

  // Col 4: Identified Leaks
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('POTENTIAL LEAKS', 158, y + 10);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(244, 63, 94);
  doc.text(formatCurrency(data.metrics.totalPotentialLeakImpact, data.currency), 158, y + 20);

  y += 42;

  // Missing Data Warning if applicable
  if (data.metrics.missingCostCount > 0) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(14, y, 182, 12, 1, 1, 'FD');
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Notice: ${data.metrics.missingCostCount} product(s) have missing cost data (COGS). Financial margins for those SKUs cannot be guaranteed.`, 18, y + 7.5);
    y += 18;
  }

  // Section 1: Top Profit Leaks Identified
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('PROFIT LEAK FINDER - TOP IDENTIFIED FINDINGS', 14, y);
  y += 6;

  data.topFindings.slice(0, 4).forEach((finding, idx) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, 182, 22, 1, 1, 'S');

    // Title & Severity
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${finding.title}`, 18, y + 6);

    if (finding.estimated_financial_impact) {
      doc.setTextColor(225, 29, 72);
      doc.text(`-${formatCurrency(finding.estimated_financial_impact, data.currency)}`, 165, y + 6);
    }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const splitExplanation = doc.splitTextToSize(`Impact: ${finding.calculation_explanation}`, 170);
    doc.text(splitExplanation[0] || '', 18, y + 11);

    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text(`Recommended Action: ${finding.recommended_action}`, 18, y + 17);

    y += 26;
  });

  y += 4;

  // Section 2: Low-Margin Products Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CRITICALLY LOW-MARGIN PRODUCTS', 14, y);
  y += 6;

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Product Title', 18, y + 5);
  doc.text('SKU', 100, y + 5);
  doc.text('Price', 135, y + 5);
  doc.text('Unit Cost', 155, y + 5);
  doc.text('Margin %', 178, y + 5);
  y += 8;

  data.lowMarginProducts.slice(0, 5).forEach((item) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    const titleTruncated = item.title.length > 45 ? item.title.substring(0, 42) + '...' : item.title;
    doc.text(titleTruncated, 18, y + 4);
    doc.setTextColor(100, 116, 139);
    doc.text(item.sku || 'N/A', 100, y + 4);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(item.price, data.currency), 135, y + 4);
    doc.text(formatCurrency(item.effective_cost, data.currency), 155, y + 4);

    const marginColor = (item.margin_pct ?? 0) < 30 ? [225, 29, 72] : [16, 185, 129];
    doc.setTextColor(marginColor[0], marginColor[1], marginColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(formatPercent(item.margin_pct), 178, y + 4);

    y += 7;
  });

  // Footer Disclaimer & Methodology
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Methodology: Profit calculations reflect available Shopify order line items and recorded Cost of Goods Sold (COGS). Unrecorded overheads, marketing fees, and tax variances are external. Generated by ProfitShield.',
    14,
    285
  );

  doc.save(`ProfitShield_Report_${data.storeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
