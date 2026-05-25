'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  RefreshCw,
  DollarSign,
  BrainCircuit,
  BarChart3,
  Activity,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Eye,
  MousePointerClick,
  Zap,
} from 'lucide-react';
import { CostAnalysisDashboard } from '@/components/analytics/cost-dashboard';
import { apiClient } from '@/lib/api-client';

const PLATFORM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface AnalyticsSummary {
  range: { from: string; to: string };
  summary: {
    totalReach: number;
    totalImpressions: number;
    totalEngagement: number;
    totalClicks: number;
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

export default function AnalyticsDashboard() {
  const [windowDays, setWindowDays] = useState<'7' | '30'>('7');

  const from = new Date();
  from.setDate(from.getDate() - Number(windowDays));

  const {
    data: analytics,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AnalyticsSummary>({
    queryKey: ['analytics', 'summary', windowDays],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/summary', {
        params: { from: from.toISOString(), to: new Date().toISOString() },
      });
      return res.data;
    },
  });

  const { data: impactData, isLoading: isImpactLoading } = useQuery({
    queryKey: ['analytics', 'impact'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/analytics/intelligence-impact');
      return res.data;
    },
  });

  const { data: recommendations, isLoading: isRecLoading } = useQuery({
    queryKey: ['analytics', 'recommendations'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/analytics/recommendations');
      return res.data;
    },
  });

  const chartData = analytics?.trend ?? [
    { label: 'Mon', engagement: 0, reach: 0 },
    { label: 'Tue', engagement: 0, reach: 0 },
    { label: 'Wed', engagement: 0, reach: 0 },
    { label: 'Thu', engagement: 0, reach: 0 },
    { label: 'Fri', engagement: 0, reach: 0 },
    { label: 'Sat', engagement: 0, reach: 0 },
    { label: 'Sun', engagement: 0, reach: 0 },
  ];

  const impactSummary = impactData?.slice(0, 4).map((item: any, i: number) => ({
    name: item.name,
    engagement: Math.round(item.engagement),
    color: PLATFORM_COLORS[i % PLATFORM_COLORS.length],
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            <div className="h-4 w-72 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">ROI & Intelligence</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Live attribution across performance, AI cost, and your knowledge-powered content loop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value as '7' | '30')}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <button
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Reach"
          value={formatCompactNumber(analytics?.summary.totalReach ?? 0)}
          helper={`${windowDays} day window`}
          icon={<Eye className="h-5 w-5 text-brand-600" />}
        />
        <MetricCard
          title="Engagement"
          value={formatCompactNumber(analytics?.summary.totalEngagement ?? 0)}
          helper={`${((analytics?.summary.engagementRate ?? 0) * 100).toFixed(1)}% rate`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        />
        <MetricCard
          title="Clicks"
          value={formatCompactNumber(analytics?.summary.totalClicks ?? 0)}
          helper={`${((analytics?.summary.averageCtr ?? 0) * 100).toFixed(1)}% CTR`}
          icon={<MousePointerClick className="h-5 w-5 text-blue-500" />}
        />
        <MetricCard
          title="AI Cost"
          value={formatCurrency(analytics?.summary.generationCostCents ?? 0)}
          helper={`${formatCompactNumber((analytics?.summary.inputTokens ?? 0) + (analytics?.summary.outputTokens ?? 0))} tokens`}
          icon={<Zap className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* AI Spend Section */}
      <div className="rounded-3xl bg-brand-50/30 p-8 dark:bg-brand-500/5">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
          <DollarSign className="h-6 w-6 text-emerald-500" />
          AI Spend & Compute Efficiency
        </h2>
        <CostAnalysisDashboard />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Performance Trend */}
        <div className="lg:col-span-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Performance Trend</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reach and engagement over the past {windowDays} days.
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-950 px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {analytics?.range?.to
                ? formatDistanceToNow(new Date(analytics.range.to), { addSuffix: true })
                : 'Current'}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCompactNumber(value), name === 'engagement' ? 'Engagement' : 'Reach']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px rgba(15, 23, 42, 0.08)' }}
                />
                <Area type="monotone" dataKey="reach" stroke="#10b981" fill="url(#reachGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="engagement" stroke="#6366f1" fill="url(#engagementGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Attribution */}
        <div className="lg:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <BrainCircuit className="h-5 w-5 text-brand-600" />
            Impact Attribution
          </h2>
          <div className="flex-1 space-y-6">
            {isImpactLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              ))
            ) : impactSummary.length > 0 ? (
              impactSummary.map((item: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="text-gray-400">{item.engagement} pts</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (item.engagement / 500) * 100)}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No impact data attributed yet.</p>
            )}
          </div>

          <div className="mt-8 rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Top source ROI contribution
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {analytics?.topSources?.[0] ? (
                <>
                  <span className="font-bold text-brand-600">{analytics.topSources[0].name}</span> currently drives
                  the strongest engagement signal in your content mix.
                </>
              ) : (
                'Add performance data and source attribution to surface your strongest knowledge drivers.'
              )}
            </p>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <BarChart3 className="h-5 w-5 text-brand-600" />
              Platform Breakdown
            </h2>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Reach by platform</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.platformBreakdown ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="platform" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip formatter={(value: number) => [formatCompactNumber(value), 'Reach']} />
                <Bar dataKey="reach" radius={[8, 8, 0, 0]}>
                  {(analytics?.platformBreakdown ?? []).map((_entry: any, index: number) => (
                    <Cell key={index} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Event Mix */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Activity className="h-5 w-5 text-brand-600" />
              Event Mix
            </h2>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tracked events</span>
          </div>
          <div className="space-y-4">
            {(analytics?.eventMix ?? []).length ? (
              analytics!.eventMix.map((item, index) => {
                const maxCount = analytics!.eventMix[0]?.count ?? 1;
                const width = maxCount > 0 ? Math.max(10, Math.round((item.count / maxCount) * 100)) : 0;
                return (
                  <div key={item.eventType} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-700 dark:text-gray-300">{formatLabel(item.eventType)}</span>
                      <span className="text-gray-400">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${width}%`, backgroundColor: PLATFORM_COLORS[index % PLATFORM_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No analytics events recorded for this period yet.</p>
            )}
          </div>
        </div>

        {/* Knowledge Impact Matrix */}
        <div className="lg:col-span-12 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-white">
              <BrainCircuit className="h-4 w-4 text-brand-600" />
              Knowledge Impact Matrix
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Attributed engagement</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Knowledge Source</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Usage Count</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Engagement Impact</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">ROI Attribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {(analytics?.topSources ?? []).length ? (
                  analytics!.topSources.map((source, index) => {
                    const maxEngagement = analytics!.topSources[0]?.engagement ?? 1;
                    const percent = maxEngagement > 0 ? Math.round((source.engagement / maxEngagement) * 100) : 0;
                    return (
                      <tr key={source.sourceId} className="hover:bg-gray-50 dark:bg-gray-950 dark:hover:bg-gray-800/40">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{source.name}</td>
                        <td className="px-6 py-4 text-xs uppercase text-gray-500">{formatLabel(source.type)}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{source.usageCount} posts</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${percent}%`, backgroundColor: PLATFORM_COLORS[index % PLATFORM_COLORS.length] }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-gray-400">{percent}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900 dark:text-white">{formatCurrency(source.roiCents)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No attributed source impact available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-12">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/20 p-8 dark:border-brand-500/20 dark:bg-brand-500/5">
            <h3 className="text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-brand-600" />
              Strategic Learning Loop
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              {isRecLoading ? (
                [1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white dark:bg-gray-800" />)
              ) : recommendations?.length ? (
                recommendations.map((rec: any, i: number) => (
                  <RecommendationCard
                    key={i}
                    topic={rec.topic}
                    recommendation={rec.recommendation}
                    confidence={Math.round(rec.confidence * 100)}
                    impact={rec.impact}
                  />
                ))
              ) : (
                <p className="text-sm text-gray-500">No strategic recommendations available yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, helper, icon }: { title: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-2.5 dark:bg-gray-800">{icon}</div>
        <ArrowUpRight className="h-4 w-4 text-gray-300" />
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-xs text-gray-400">{helper}</div>
    </div>
  );
}

function RecommendationCard({
  topic,
  recommendation,
  confidence,
  impact,
}: {
  topic: string;
  recommendation: string;
  confidence: number;
  impact: string;
}) {
  return (
    <div className="group rounded-2xl border border-brand-100 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-700 dark:bg-brand-500/10">
          Recommendation
        </span>
        <span
          className={`rounded-md px-2 py-1 text-[10px] font-bold ${
            impact === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {impact} Impact
        </span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{topic}</h3>
      <p className="mb-6 text-sm italic leading-relaxed text-gray-600 dark:text-gray-400">&ldquo;{recommendation}&rdquo;</p>
      <div className="flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-brand-500" style={{ width: `${confidence}%` }} />
          </div>
          <span className="text-[10px] font-bold text-gray-400">{confidence}% Confidence</span>
        </div>
      </div>
    </div>
  );
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valueInCents / 100);
}

function formatLabel(value: string) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}
