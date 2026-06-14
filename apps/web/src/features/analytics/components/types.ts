export interface AnalyticsSummary {
  range: { from: string; to: string };
  summary: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    totalClicks: number;
    totalConversions: number;
    totalSpendCents: number;
    totalRevenueCents: number;
    averageCtr: number;
    engagementRate: number;
    attributedRoiCents: number;
    generationCostCents: number;
    inputTokens: number;
    outputTokens: number;
    totalEvents: number;
  };
  trend: Array<{ label: string; reach: number; engagement: number; clicks: number; roiCents: number }>;
  platformBreakdown: Array<{ platform: string; reach: number; engagement: number; clicks: number; roiCents: number }>;
  topSources: Array<{ sourceId: string; name: string; type: string; reach: number; engagement: number; roiCents: number; usageCount: number }>;
  eventMix: Array<{ eventType: string; count: number }>;
}

export const PLATFORM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valueInCents / 100);
}

export function formatLabel(value: string) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}
