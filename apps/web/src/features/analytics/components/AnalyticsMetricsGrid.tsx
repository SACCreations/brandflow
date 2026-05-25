import { Eye, TrendingUp, MousePointerClick, Zap, ArrowUpRight } from 'lucide-react';
import { formatCompactNumber, formatCurrency } from './types';
import type { AnalyticsSummary } from './types';

interface AnalyticsMetricsGridProps {
  summary?: AnalyticsSummary['summary'];
  windowDays: string;
}

export function AnalyticsMetricsGrid({ summary, windowDays }: AnalyticsMetricsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Reach"
        value={formatCompactNumber(summary?.totalReach ?? 0)}
        helper={`${windowDays} day window`}
        icon={<Eye className="h-5 w-5 text-brand-600" />}
      />
      <MetricCard
        title="Engagement"
        value={formatCompactNumber(summary?.totalEngagement ?? 0)}
        helper={`${((summary?.engagementRate ?? 0) * 100).toFixed(1)}% rate`}
        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
      />
      <MetricCard
        title="Clicks"
        value={formatCompactNumber(summary?.totalClicks ?? 0)}
        helper={`${((summary?.averageCtr ?? 0) * 100).toFixed(1)}% CTR`}
        icon={<MousePointerClick className="h-5 w-5 text-blue-500" />}
      />
      <MetricCard
        title="AI Cost"
        value={formatCurrency(summary?.generationCostCents ?? 0)}
        helper={`${formatCompactNumber((summary?.inputTokens ?? 0) + (summary?.outputTokens ?? 0))} tokens`}
        icon={<Zap className="h-5 w-5 text-amber-500" />}
      />
    </div>
  );
}

function MetricCard({ title, value, helper, icon }: { title: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="glass-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-gray-50/50 dark:bg-gray-900/50 p-2.5 border border-gray-100 dark:border-gray-800">
          {icon}
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-xs text-gray-400">{helper}</div>
    </div>
  );
}
