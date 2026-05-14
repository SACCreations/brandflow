'use client';

import { useMemo, useState } from 'react';
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
  Users,
  Target,
  DollarSign,
  Zap,
  BrainCircuit,
  Sparkles,
  ArrowUpRight,
  Activity,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface AnalyticsSummaryResponse {
  range: {
    from: string;
    to: string;
  };
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
  trend: Array<{
    label: string;
    reach: number;
    engagement: number;
    clicks: number;
    roiCents: number;
  }>;
  platformBreakdown: Array<{
    platform: string;
    reach: number;
    engagement: number;
    clicks: number;
    roiCents: number;
  }>;
  topSources: Array<{
    sourceId: string;
    name: string;
    type: string;
    reach: number;
    engagement: number;
    roiCents: number;
    usageCount: number;
  }>;
  eventMix: Array<{
    eventType: string;
    count: number;
  }>;
}

interface Recommendation {
  topic: string;
  recommendation: string;
  confidence: number;
  impact: 'High' | 'Medium' | 'Low';
}

const PLATFORM_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AnalyticsDashboard() {
  const [windowDays, setWindowDays] = useState<'7' | '30'>('7');

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - (Number(windowDays) - 1));
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [windowDays]);

  const { data: analytics, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['analytics-summary', windowDays],
    queryFn: async () => {
      const res = await apiClient.get<{ data: AnalyticsSummaryResponse }>('/analytics/summary', {
        params: range,
      });
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['analytics-recommendations'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Recommendation[] }>('/analytics/recommendations');
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });

  const stats = analytics?.summary;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
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
            onChange={(event) => setWindowDays(event.target.value as '7' | '30')}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <button
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
          Analytics are temporarily unavailable. Please refresh in a moment.
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard
          title="Total Reach"
          value={isLoading ? '—' : formatCompactNumber(stats?.totalReach ?? 0)}
          helper={`${windowDays}-day audience reach`}
          icon={<Users className="h-5 w-5 text-blue-500" />}
        />
        <MetricCard
          title="Engagement Rate"
          value={isLoading ? '—' : `${stats?.engagementRate ?? 0}%`}
          helper={`${formatCompactNumber(stats?.totalEngagement ?? 0)} total engagements`}
          icon={<Target className="h-5 w-5 text-emerald-500" />}
        />
        <MetricCard
          title="Generation Cost"
          value={isLoading ? '—' : formatCurrency(stats?.generationCostCents ?? 0)}
          helper={`${formatCompactNumber((stats?.inputTokens ?? 0) + (stats?.outputTokens ?? 0))} tokens used`}
          icon={<DollarSign className="h-5 w-5 text-amber-500" />}
        />
        <MetricCard
          title="Attributed ROI"
          value={isLoading ? '—' : formatCurrency(stats?.attributedRoiCents ?? 0)}
          helper={`${formatCompactNumber(stats?.totalEvents ?? 0)} analytics events tracked`}
          icon={<Zap className="h-5 w-5 text-brand-500" />}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Performance Trend</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reach and engagement over the past {windowDays} days.
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              {analytics ? `${formatDistanceToNow(new Date(analytics.range.to), { addSuffix: true })}` : 'Loading'}
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.trend ?? []}>
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

        <div className="lg:col-span-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <BrainCircuit className="h-5 w-5 text-brand-600" />
            Intelligence Impact
          </h2>
          <div className="space-y-5">
            {(analytics?.topSources ?? []).slice(0, 4).map((source) => {
              const maxEngagement = analytics?.topSources[0]?.engagement ?? 1;
              const width = maxEngagement > 0 ? Math.max(8, Math.round((source.engagement / maxEngagement) * 100)) : 0;

              return (
                <div key={source.sourceId} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="truncate text-gray-700 dark:text-gray-300">{source.name}</span>
                    <span className="whitespace-nowrap text-gray-400">{formatCompactNumber(source.engagement)} pts</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Top source ROI contribution
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {analytics?.topSources[0]
                ? <>
                    <span className="font-bold text-brand-600">{analytics.topSources[0].name}</span> currently drives the strongest engagement signal in your content mix.
                  </>
                : 'Add performance data and source attribution to surface your strongest knowledge drivers.'}
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
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
                  {(analytics?.platformBreakdown ?? []).map((entry, index) => (
                    <Cell key={entry.platform} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <Activity className="h-5 w-5 text-brand-600" />
              Event Mix
            </h2>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tracked events</span>
          </div>
          <div className="space-y-4">
            {(analytics?.eventMix ?? []).length ? (
              analytics?.eventMix.map((item, index) => {
                const maxCount = analytics.eventMix[0]?.count ?? 1;
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

        <div className="lg:col-span-12 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50">
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
                  analytics?.topSources.map((source, index) => {
                    const maxEngagement = analytics.topSources[0]?.engagement ?? 1;
                    const percent = maxEngagement > 0 ? Math.round((source.engagement / maxEngagement) * 100) : 0;
                    return (
                      <tr key={source.sourceId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{source.name}</td>
                        <td className="px-6 py-4 text-xs text-gray-500 uppercase">{formatLabel(source.type)}</td>
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

        <div className="lg:col-span-12 rounded-2xl border border-brand-100 bg-brand-50/20 p-8 dark:border-brand-500/20 dark:bg-brand-500/5">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-brand-900 dark:text-white">
            <Sparkles className="h-6 w-6 text-brand-600" />
            Strategic Learning Loop
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {recommendations.length ? (
              recommendations.map((item) => (
                <RecommendationCard
                  key={item.topic}
                  topic={item.topic}
                  recommendation={item.recommendation}
                  confidence={Math.round(item.confidence * 100)}
                  impact={item.impact}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-brand-200 bg-white/80 p-6 text-sm text-gray-500 dark:border-brand-500/20 dark:bg-gray-900/70 dark:text-gray-400">
                Recommendations will appear here as more performance data accumulates.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, helper, icon }: { title: string; value: string; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800">{icon}</div>
        <ArrowUpRight className="h-4 w-4 text-gray-300" />
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-xs text-gray-400">{helper}</div>
    </div>
  );
}

function RecommendationCard({ topic, recommendation, confidence, impact }: { topic: string; recommendation: string; confidence: number; impact: string }) {
  return (
    <div className="group rounded-2xl border border-brand-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-700 dark:bg-brand-500/10">
          Recommendation
        </span>
        <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${impact === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
          {impact} Impact
        </span>
      </div>
      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{topic}</h3>
      <p className="mb-6 text-sm italic leading-relaxed text-gray-600 dark:text-gray-400">“{recommendation}”</p>
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
